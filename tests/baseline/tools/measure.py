#!/usr/bin/env python3
"""Klin baseline tool: measures Firefox (stock) and Firefox + Klin settings on real sites.

  python3 measure.py run --variant stock --label my-laptop
  python3 measure.py run --variant klin  --label my-laptop
  python3 measure.py compare result-stock.json result-klin.json

What it measures, per site and per scenario (cold cache, warm cache, idle tabs):
  data received/sent (counted by a local pass-through proxy; HTTPS stays encrypted),
  number of requests, which hosts were contacted, CPU time, memory, and energy when the
  machine exposes it (Linux RAPL). Nothing is sent anywhere: results are written to a local file.
"""
import argparse, asyncio, glob, hashlib, json, os, platform, re, shutil, socket, statistics, subprocess, sys
import tempfile, threading, time, urllib.request
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
MOZILLA_SUFFIXES = ("mozilla.org", "mozilla.com", "mozilla.net", "firefox.com", "mozaws.net", "mozgcp.net", "mozilla-backup.org",
                    "googleapis.com", "firefox-portal-detection.com", "ciscobinary.openh264.org")

# ---------------------------------------------------------------- counting proxy
class Proxy:
    """Pass-through proxy. Counts bytes per host. Does not decrypt anything."""
    def __init__(self, overrides=None):
        self.stats, self.overrides = {}, overrides or {}
        self.loop = asyncio.new_event_loop(); self.port = None
        ready = threading.Event()
        threading.Thread(target=self._run, args=(ready,), daemon=True).start(); ready.wait()
    def _run(self, ready):
        asyncio.set_event_loop(self.loop)
        srv = self.loop.run_until_complete(asyncio.start_server(self._handle, "127.0.0.1", 0))
        self.port = srv.sockets[0].getsockname()[1]; ready.set(); self.loop.run_forever()
    def snapshot(self): return {h: list(v) for h, v in self.stats.items()}
    def _add(self, host, i, n): self.stats.setdefault(host, [0, 0, 0])[i] += n   # [received, sent, connections]
    async def _pipe(self, r, w, host, idx):
        try:
            while (d := await r.read(65536)):
                self._add(host, idx, len(d)); w.write(d); await w.drain()
        except Exception: pass
        finally:
            try: w.close()
            except Exception: pass
    async def _handle(self, cr, cw):
        try:
            head = await asyncio.wait_for(cr.readuntil(b"\r\n\r\n"), 30)
            first = head.split(b"\r\n", 1)[0].decode("latin1").split()
            method, target = first[0], first[1]
            if method == "CONNECT": host, port = target.rsplit(":", 1); port = int(port)
            else:
                m = re.match(r"http://([^/:]+)(?::(\d+))?(/.*)?$", target); host, port = m.group(1), int(m.group(2) or 80)
            ip, p = self.overrides.get(host, (host, port))
            sr, sw = await asyncio.open_connection(ip, p)
            self._add(host, 2, 1); self._add(host, 1, len(head))
            if method == "CONNECT": cw.write(b"HTTP/1.1 200 Connection established\r\n\r\n"); await cw.drain()
            else:
                path = m.group(3) or "/"
                rest = head.split(b"\r\n", 1)[1]
                sw.write(f"{method} {path} HTTP/1.1\r\n".encode() + re.sub(rb"(?i)proxy-connection:[^\r]*\r\n", b"", rest)); await sw.drain()
            await asyncio.gather(self._pipe(cr, sw, host, 1), self._pipe(sr, cw, host, 0))
        except Exception:
            try: cw.close()
            except Exception: pass

# ---------------------------------------------------------------- Marionette
class Marionette:
    def __init__(self, port=2828, wait=60):
        end = time.time() + wait
        while True:
            try: self.s = socket.create_connection(("127.0.0.1", port), timeout=120); break
            except OSError:
                if time.time() > end: raise RuntimeError("Firefox did not start (Marionette not reachable)")
                time.sleep(0.5)
        self.f, self.i = self.s.makefile("rwb"), 0
        self._read()
        self.cmd("WebDriver:NewSession", {"capabilities": {}})
    def _read(self):
        n = b""
        while (c := self.f.read(1)) != b":":
            if not c: raise RuntimeError("Marionette connection closed")
            n += c
        return json.loads(self.f.read(int(n)))
    def cmd(self, name, params=None):
        self.i += 1; m = json.dumps([0, self.i, name, params or {}]).encode()
        self.f.write(str(len(m)).encode() + b":" + m); self.f.flush()
        r = self._read()
        if r[2]: raise RuntimeError(f"{name}: {r[2].get('message', r[2])}")
        return r[3]
    def close(self):
        try: self.cmd("Marionette:Quit")
        except Exception: pass

# ---------------------------------------------------------------- system measurements
try: import psutil
except ImportError: psutil = None

def procs(root):
    try: return [root] + root.children(recursive=True)
    except Exception: return []
def cpu_seconds(root):
    t = 0.0
    for p in procs(root):
        try: c = p.cpu_times(); t += c.user + c.system
        except Exception: pass
    return t
def mem_mb(root):
    t = 0
    for p in procs(root):
        try:
            try: t += p.memory_full_info().uss          # unique memory (no double counting) when allowed
            except Exception: t += p.memory_info().rss
        except Exception: pass
    return round(t / 1e6)
RAPL = "/sys/class/powercap/intel-rapl:0/energy_uj"
def energy_j():
    try: return int(open(RAPL).read()) / 1e6
    except Exception: return None

# ---------------------------------------------------------------- helpers
def find_firefox(arg):
    if arg: return arg
    for c in ["C:/Program Files/Mozilla Firefox/firefox.exe", "C:/Program Files (x86)/Mozilla Firefox/firefox.exe",
              "/Applications/Firefox.app/Contents/MacOS/firefox", "/usr/lib/firefox/firefox", "/usr/lib64/firefox/firefox", "/opt/firefox/firefox"]:
        if os.path.exists(c): return c
    w = shutil.which("firefox")
    if w: return w
    sys.exit("Firefox not found. Pass its path with --firefox PATH.")

def klin_prefs():
    out = []
    for line in open(REPO / "config/prefs/klin.js"):
        m = re.match(r'\s*pref\((".*?"),\s*(.*)\);', line)
        if m: out.append(f"user_pref({m.group(1)}, {m.group(2).split('//')[0].strip()});")
    return out

def get_ubo(workdir):
    meta = json.load(open(REPO / "build/third-party.json"))["ublock-origin"]
    xpi = workdir / "ubo.xpi"
    if not xpi.exists(): urllib.request.urlretrieve(meta["source"], xpi)
    digest = hashlib.sha256(xpi.read_bytes()).hexdigest()
    return xpi, digest == meta["sha256"], digest

def is_mozilla(host): return host.endswith(MOZILLA_SUFFIXES)
def med(v): v = [x for x in v if x is not None]; return round(statistics.median(v), 2) if v else None

# ---------------------------------------------------------------- one full run
def one_run(a, sites, run_no, workdir, log):
    ff = find_firefox(a.firefox)
    prof = Path(tempfile.mkdtemp(prefix="profile-", dir=workdir))
    proxy = Proxy({k: (v.split(":")[0], int(v.split(":")[1])) for k, v in (x.split("=") for x in a.map)})
    prefs = [f'user_pref("network.proxy.type", 1);', 'user_pref("network.proxy.http", "127.0.0.1");', f'user_pref("network.proxy.http_port", {proxy.port});',
             'user_pref("network.proxy.ssl", "127.0.0.1");', f'user_pref("network.proxy.ssl_port", {proxy.port});',
             'user_pref("network.proxy.no_proxies_on", "");', 'user_pref("network.proxy.allow_hijacking_localhost", true);',
             'user_pref("browser.shell.checkDefaultBrowser", false);', 'user_pref("browser.startup.page", 0);',
             'user_pref("datareporting.policy.firstRunURL", "");', 'user_pref("browser.aboutwelcome.enabled", false);']
    if a.variant == "klin":
        prefs += klin_prefs()
        if a.allow_http: prefs.append('user_pref("dom.security.https_only_mode", false);')
    (prof / "user.js").write_text("\n".join(prefs) + "\n")
    cmd = [ff, "--marionette", "--no-remote", "--profile", str(prof), "about:blank"] + (["--headless"] if a.headless else [])
    env = {k: v for k, v in os.environ.items() if "proxy" not in k.lower()}
    fx = subprocess.Popen(cmd, env=env, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    res = {"run": run_no, "cold": {}, "warm": {}, "idle": {}}
    try:
        mn = Marionette(); root = psutil.Process(fx.pid)
        if a.variant == "klin":
            xpi, ok, digest = get_ubo(workdir); mn.cmd("Addon:Install", {"path": str(xpi), "temporary": False})
            res["ublock"] = {"sha256": digest, "matches_pinned_version": ok}
        mn.cmd("WebDriver:SetTimeouts", {"pageLoad": 60000, "script": 30000})
        log(f"  warm-up {a.warmup}s (browser start-up traffic is not counted)"); time.sleep(a.warmup)

        def window(fn):
            s0, c0, e0, t0 = proxy.snapshot(), cpu_seconds(root), energy_j(), time.time()
            extra = fn()
            time.sleep(a.settle)
            s1, c1, e1, t1 = proxy.snapshot(), cpu_seconds(root), energy_j(), time.time()
            hosts, rx, tx = {}, 0, 0
            for h, v in s1.items():
                d = [v[i] - s0.get(h, [0, 0, 0])[i] for i in range(3)]
                if any(d): hosts[h] = d; rx += d[0]; tx += d[1]
            moz = sum(v[0] + v[1] for h, v in hosts.items() if is_mozilla(h))
            return {"seconds": round(t1 - t0, 1), "bytes_received": rx, "bytes_sent": tx, "bytes_mozilla_background": moz,
                    "hosts": len(hosts), "hosts_non_mozilla": sum(1 for h in hosts if not is_mozilla(h)),
                    "host_list": {h: {"received": v[0], "sent": v[1], "connections": v[2]} for h, v in sorted(hosts.items(), key=lambda x: -x[1][0])},
                    "cpu_seconds": round(c1 - c0, 2), "memory_mb": mem_mb(root),
                    "energy_joules_whole_cpu": None if e0 is None or e1 is None else round(e1 - e0, 1), **(extra or {})}

        def visit(url):
            def go():
                try:
                    mn.cmd("WebDriver:Navigate", {"url": url})
                    n = mn.cmd("WebDriver:ExecuteScript", {"script": "return performance.getEntriesByType('resource').length+1", "args": []})
                    return {"requests": n["value"] if isinstance(n, dict) else n}
                except Exception as e: return {"error": str(e)[:120]}
            return go
        for scen in ("cold", "warm"):
            for u in sites:
                log(f"  {scen}: {u}"); res[scen][u] = window(visit(u))
        def idle():
            for u in sites[:10]:
                try:
                    mn.cmd("WebDriver:NewWindow", {"type": "tab", "focus": True}); mn.cmd("WebDriver:Navigate", {"url": u})
                except Exception: pass
        log(f"  idle: {min(10, len(sites))} tabs open, waiting {a.idle}s")
        idle_settle, a.settle = a.settle, a.idle
        res["idle"] = window(idle); a.settle = idle_settle
        mn.close()
    finally:
        try: fx.wait(timeout=15)
        except Exception: fx.kill()
        shutil.rmtree(prof, ignore_errors=True)
    return res

def summarize(runs):
    out = {}
    for scen in ("cold", "warm"):
        urls = runs[0][scen].keys(); out[scen] = {}
        for u in urls:
            rs = [r[scen][u] for r in runs if u in r[scen]]
            out[scen][u] = {k: med([x.get(k) for x in rs]) for k in ("bytes_received", "bytes_sent", "requests", "hosts_non_mozilla", "cpu_seconds", "memory_mb", "energy_joules_whole_cpu")}
            errs = [x["error"] for x in rs if "error" in x]
            if errs: out[scen][u]["errors"] = f"{len(errs)}/{len(rs)} runs failed: {errs[0]}"
    out["idle"] = {k: med([r["idle"].get(k) for r in runs]) for k in ("seconds", "bytes_received", "bytes_sent", "bytes_mozilla_background", "hosts", "cpu_seconds", "memory_mb", "energy_joules_whole_cpu")}
    return out

def cmd_run(a):
    if psutil is None: sys.exit("Missing helper. Run once:  python3 -m pip install psutil")
    sites = [l.strip() for l in open(a.sites) if l.strip() and not l.startswith("#")]
    workdir = Path.home() / ".klin-baseline"; workdir.mkdir(exist_ok=True)
    log = lambda s: print(s, flush=True)
    log(f"Variant: {a.variant}   sites: {len(sites)}   runs: {a.runs}   (keep the computer idle and plugged in while this runs)")
    runs = []
    for i in range(1, a.runs + 1):
        log(f"Run {i}/{a.runs}"); runs.append(one_run(a, sites, i, workdir, log))
    result = {"label": a.label, "variant": a.variant, "date": time.strftime("%Y-%m-%d %H:%M"), "machine": {"os": platform.platform(), "cpu_cores": os.cpu_count(),
              "ram_gb": round(psutil.virtual_memory().total / 1e9, 1), "python": platform.python_version(), "headless": a.headless,
              "energy_counter": energy_j() is not None}, "settings": {"settle_s": a.settle, "idle_s": a.idle, "runs": a.runs},
              "summary": summarize(runs), "runs": runs}
    out = Path(a.out or f"result-{a.variant}.json"); out.write_text(json.dumps(result, indent=1))
    log(f"\nDone. Result saved in: {out.resolve()}")

def cmd_compare(a):
    A, B = (json.load(open(p)) for p in (a.a, a.b))
    mb = lambda x: "-" if x is None else f"{x/1e6:.2f}"
    print(f"# Baseline comparison\n\n{A['variant']} ({A['date']}) vs {B['variant']} ({B['date']}), machine: {A['machine']['os']}, {A['machine']['cpu_cores']} cores\n")
    for scen in ("cold", "warm"):
        print(f"## {scen} cache (median of runs)\n\n| Site | MB {A['variant']} | MB {B['variant']} | requests {A['variant']} | requests {B['variant']} | other hosts {A['variant']} | other hosts {B['variant']} | CPU s {A['variant']} | CPU s {B['variant']} |\n|---|---|---|---|---|---|---|---|---|")
        ta = tb = 0
        for u, x in A["summary"][scen].items():
            y = B["summary"][scen].get(u, {})
            ta += x["bytes_received"] or 0; tb += y.get("bytes_received") or 0
            if x.get("errors") or y.get("errors"): print(f"| {u} | ERROR: {x.get('errors') or ''} {y.get('errors') or ''} |||||||| ")
            else: print(f"| {u} | {mb(x['bytes_received'])} | {mb(y.get('bytes_received'))} | {x['requests']} | {y.get('requests')} | {x['hosts_non_mozilla']} | {y.get('hosts_non_mozilla')} | {x['cpu_seconds']} | {y.get('cpu_seconds')} |")
        print(f"| **Total** | **{mb(ta)}** | **{mb(tb)}** | | | | | | |\n")
    ia, ib = A["summary"]["idle"], B["summary"]["idle"]
    print("## Idle (10 tabs open)\n\n| | " + A["variant"] + " | " + B["variant"] + " |\n|---|---|---|")
    for k, l in (("bytes_received", "bytes received"), ("bytes_mozilla_background", "of which Mozilla background"), ("hosts", "hosts contacted"), ("cpu_seconds", "CPU seconds"), ("memory_mb", "memory MB"), ("energy_joules_whole_cpu", "energy J (whole CPU)")):
        print(f"| {l} | {ia.get(k)} | {ib.get(k)} |")

if __name__ == "__main__":
    p = argparse.ArgumentParser(); sp = p.add_subparsers(dest="c", required=True)
    r = sp.add_parser("run"); r.add_argument("--variant", choices=["stock", "klin"], required=True); r.add_argument("--label", default="")
    r.add_argument("--firefox"); r.add_argument("--sites", default=str(HERE / "sites.txt")); r.add_argument("--runs", type=int, default=3)
    r.add_argument("--warmup", type=int, default=20); r.add_argument("--settle", type=int, default=10); r.add_argument("--idle", type=int, default=300)
    r.add_argument("--headless", action="store_true"); r.add_argument("--out"); r.add_argument("--allow-http", action="store_true")
    r.add_argument("--map", action="append", default=[], help="test only: host=ip:port")
    c = sp.add_parser("compare"); c.add_argument("a"); c.add_argument("b")
    a = p.parse_args(); cmd_run(a) if a.c == "run" else cmd_compare(a)
