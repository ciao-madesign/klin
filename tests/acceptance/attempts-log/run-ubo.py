#!/usr/bin/env python3
"""Same mock site as run.py, but with the real uBlock Origin (1.76.0, pinned) as the blocker, to check that
requests it blocks are recognised. FIREFOX_DIR is modified (distribution/policies.json): use a copy.
Needs `curl` and network access to addons.mozilla.org.

    run-ubo.py FIREFOX_DIR
"""
import hashlib, http.server, json, pathlib, subprocess, sys, tempfile, threading, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
sys.argv, firefox_dir = ["run.py", sys.argv[1]], pathlib.Path(sys.argv[1])
source = (pathlib.Path(__file__).with_name("run.py")).read_text().split("failures = []")[0]
ns = {"__file__": str(pathlib.Path(__file__).with_name("run.py")), "__name__": "mock"}
exec(source, ns)
Site, PORT, Firefox = ns["Site"], ns["PORT"], ns["Firefox"]

UBO_ID = "uBlock0@raymondhill.net"
pin = json.loads((ROOT / "build/third-party.json").read_text())["ublock-origin"]
xpi = pathlib.Path(tempfile.mkdtemp()) / "ubo.xpi"
subprocess.run(["curl", "-sS", "-f", "-L", "-m", "120", "-o", str(xpi), pin["source"]], check=True)
assert hashlib.sha256(xpi.read_bytes()).hexdigest() == pin["sha256"], "uBlock Origin download differs from the pinned file"

policy = json.loads((ROOT / "config/policies/policies.json").read_text())
policy["policies"]["HttpsOnlyMode"] = "disallowed"
policy["policies"]["ExtensionSettings"][UBO_ID]["install_url"] = "file://" + str(xpi)
policy["policies"]["3rdparty"] = {"Extensions": {UBO_ID: {"toOverwrite": {"filterLists": ["user-filters"], "filters": ["||tracker.example.net^"]}}}}
(firefox_dir / "distribution/policies.json").write_text(json.dumps(policy))

threading.Thread(target=http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Site).serve_forever, daemon=True).start()
prefs = {"dom.security.https_only_mode": False, "dom.security.https_first": False, "network.proxy.type": 1, "network.proxy.http": "127.0.0.1",
         "network.proxy.http_port": PORT, "network.proxy.no_proxies_on": "", "network.cookie.cookieBehavior": 5}
with Firefox(str(firefox_dir), prefs=prefs) as ff:
    deadline = time.time() + 90
    while time.time() < deadline:
        try: ff.addon_url(UBO_ID, "dashboard.html"); break
        except RuntimeError: time.sleep(1)
    else: sys.exit("FAIL uBlock Origin did not start")
    time.sleep(10)                                          # let it compile its filters
    addon = ff.install_addon(ROOT / "extensions/attempts-log")
    popup = ff.addon_url(addon, "popup/popup.html")
    ff.navigate("http://site.example.org/"); time.sleep(5)
    ff.cmd("WebDriver:NewWindow", {"type": "tab", "focus": True}); time.sleep(1); ff.navigate(popup)
    logs = ff.async_script("""const done = arguments[arguments.length - 1];
        (async () => { const out = {}; for (const t of await browser.tabs.query({})) out[t.id] = await browser.runtime.sendMessage({ type: "get", tabId: t.id }); done(out); })();""")
    mine = [d for d in logs.values() if d["top"] == "site.example.org"]
    blocked = [e for d in mine for e in d["entries"] if e["kind"] == "blocked"]
    print("entries:", [(e["kind"], e["who"], e["what"]) for d in mine for e in d["entries"]])
    ok = any(e["who"] == "tracker.example.net" for e in blocked)
    print(("ok   " if ok else "FAIL ") + "a request blocked by the real uBlock Origin is listed as blocked")
    sys.exit(0 if ok else 1)
