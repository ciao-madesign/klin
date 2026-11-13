#!/usr/bin/env python3
"""Cookie-banner acceptance run: installs uBlock Origin with Klin's managed settings and checks which
banners are hidden. Three runs on one copy of Firefox:
  1. Klin's real policy: the cookie-notice lists are switched on in uBlock Origin (read from its dashboard).
  2. Same lists, but served from a local server, so the filters themselves can be tested on a mock page.
  3. Control: no cookie lists; the banners must be visible.

    run.py FIREFOX_DIR

FIREFOX_DIR is modified (distribution/policies.json): use a copy. Needs `curl` and network access to
addons.mozilla.org and raw.githubusercontent.com (uBlock Origin 1.76.0, pinned by sha256, and the sources
of the two cookie-notice lists, which are not bundled with uBlock Origin).
"""
import hashlib, http.server, json, pathlib, subprocess, sys, tempfile, threading, time, zipfile

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

PORT = 8888
SITE = "http://news.example.org/"   # a real-looking host name, reached through the local server used as proxy:
                                     # uBlock Origin does not apply cosmetic filters to bare IP addresses
UBO_ID = "uBlock0@raymondhill.net"
PIN = json.loads((ROOT / "build/third-party.json").read_text())["ublock-origin"]
LISTS = {  # file served locally -> where the real content comes from
    "easylist-cookies.txt": "https://raw.githubusercontent.com/easylist/easylist/master/easylist_cookie/easylist_cookie_general_hide.txt",
    "ublock-cookies.txt": "https://raw.githubusercontent.com/uBlockOrigin/uAssets/master/filters/annoyances-cookies.txt",
}
PAGE = b"""<!doctype html><title>mock news site</title><body style="font:16px sans-serif">
<h1 id=content>Article</h1><p>Some text.</p>
<div id=cookie-banner style="padding:20px;background:#ddd">We use cookies <button>Accept</button></div>
<div id=AcceptCookieContainer style="padding:20px;background:#ddd">Cookies <button>OK</button></div>
<div id=fine style="padding:20px">Ordinary content that must stay.</div>"""
WATCHED = ["cookie-banner", "AcceptCookieContainer", "content", "fine"]

work = pathlib.Path(tempfile.mkdtemp())
failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " — " + str(detail)))
    if not ok: failures.append(label)

def fetch(url, dest):
    subprocess.run(["curl", "-sS", "-f", "-L", "-m", "120", "-o", str(dest), url], check=True)

# --- ingredients
xpi = work / "ubo.xpi"
fetch(PIN["source"], xpi)
digest = hashlib.sha256(xpi.read_bytes()).hexdigest()
check("uBlock Origin download matches the pinned sha256 (%s)" % PIN["version"], digest == PIN["sha256"], digest)
for name, url in LISTS.items():
    fetch(url, work / name)

class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        path = self.path.split("://", 1)[-1].split("/", 1)[-1] if "://" in self.path else self.path.lstrip("/")
        name = path.split("?")[0]
        if name in LISTS:
            body, kind = (work / name).read_bytes(), "text/plain"
        else:
            body, kind = PAGE, "text/html"
        self.send_response(200); self.send_header("Content-Type", kind); self.end_headers(); self.wfile.write(body)
    def log_message(self, *args): pass
threading.Thread(target=http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Site).serve_forever, daemon=True).start()

firefox_dir = pathlib.Path(sys.argv[1])
policy_file = firefox_dir / "distribution/policies.json"
shipped = json.loads((ROOT / "config/policies/policies.json").read_text())

def write_policy(managed):
    policy = json.loads(json.dumps(shipped))
    policy["policies"]["HttpsOnlyMode"] = "disallowed"               # the mock site is plain http
    policy["policies"]["ExtensionSettings"][UBO_ID]["install_url"] = "file://" + str(xpi)
    policy["policies"].pop("3rdparty", None)
    if managed is not None:
        policy["policies"]["3rdparty"] = {"Extensions": {UBO_ID: managed}}
    policy_file.write_text(json.dumps(policy))

def visible(ff):
    return ff.script("""const out = {};
        for (const id of arguments[0]) { const e = document.getElementById(id); out[id] = !!e && getComputedStyle(e).display !== "none" && e.offsetHeight > 0; }
        return out;""", [WATCHED])

def session(managed, label, body):
    write_policy(managed)
    prefs = {"dom.security.https_only_mode": False, "dom.security.https_first": False, "network.proxy.type": 1,
             "network.proxy.http": "127.0.0.1", "network.proxy.http_port": PORT, "network.proxy.no_proxies_on": ""}
    with Firefox(str(firefox_dir), prefs=prefs) as ff:
        deadline = time.time() + 90
        while time.time() < deadline:                                  # wait for uBlock Origin to be installed
            try:
                url = ff.addon_url(UBO_ID, "3p-filters.html"); break
            except RuntimeError:
                time.sleep(1)
        else:
            check(label + ": uBlock Origin installed", False); return
        body(ff, url)

# --- run 1: Klin's real policy
shipped_managed = shipped["policies"].get("3rdparty", {}).get("Extensions", {}).get(UBO_ID)
check("Klin's policy carries managed settings for uBlock Origin", shipped_managed is not None)
def run1(ff, url):
    ff.navigate(url); time.sleep(8)
    state = ff.script("""const out = {};
        for (const li of document.querySelectorAll("[data-key]")) { const box = li.querySelector("input[type=checkbox]"); if (box) out[li.dataset.key] = box.checked; }
        return out;""")
    wanted = [k for k in (shipped_managed or {}).get("toOverwrite", {}).get("filterLists", []) if k != "user-filters"]
    off = [k for k in wanted if not state.get(k)]
    check("run 1: every list in Klin's policy is switched on in uBlock Origin's dashboard", bool(wanted) and not off, "off or missing: %s" % off)
    check("run 1: the cookie-notice lists are among them", {"fanboy-cookiemonster", "ublock-cookies-easylist"} <= set(wanted), wanted)
    with zipfile.ZipFile(xpi) as z:
        assets = set(json.loads(z.read("assets/assets.json")))
    extra = [k for k, v in state.items() if v and k in assets and k not in wanted]
    check("run 1: nothing else is on", not extra, extra)
session(shipped_managed, "run 1", run1)

# --- run 2 and 3: the filters themselves
defaults = [k for k in (shipped_managed or {}).get("toOverwrite", {}).get("filterLists", []) if "cookie" not in k]
def banners(expect_hidden):
    def body(ff, url):
        ff.navigate(SITE)
        result, deadline = {}, time.time() + (120 if expect_hidden else 25)
        while time.time() < deadline:
            result = visible(ff)
            if expect_hidden and not result["cookie-banner"] and not result["AcceptCookieContainer"]: break
            time.sleep(3); ff.navigate(SITE)
        name = "with the cookie lists" if expect_hidden else "control, no cookie lists"
        if expect_hidden:
            check("run 2 (%s): both banners are hidden" % name, not result["cookie-banner"] and not result["AcceptCookieContainer"], result)
        else:
            check("run 3 (%s): both banners are visible" % name, result["cookie-banner"] and result["AcceptCookieContainer"], result)
        check("%s: the page content stays visible" % name, result["content"] and result["fine"], result)
    return body
local_lists = ["http://127.0.0.1:%d/%s" % (PORT, n) for n in LISTS]
session({"toOverwrite": {"filterLists": defaults + local_lists}}, "run 2", banners(True))
session({"toOverwrite": {"filterLists": defaults}}, "run 3", banners(False))

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
