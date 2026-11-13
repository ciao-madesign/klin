#!/usr/bin/env python3
"""Collection-log acceptance run: a mock site with a tracker pixel, a beacon, a third-party cookie,
a fingerprinting script and an innocent CDN script, opened with extensions/attempts-log and a
stand-in content blocker. Checks what the log says.

    run.py FIREFOX_DIR
"""
import http.server, json, pathlib, sys, threading, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

PORT = 8884
SITE = "http://site.example.org/"

FP_JS = b"""
const c = document.createElement("canvas"); c.width = 200; c.height = 40;
const x = c.getContext("2d"); x.font = "16px serif"; x.fillText("fingerprint me", 5, 25);
const url = c.toDataURL(); const data = x.getImageData(0, 0, 200, 40);
new OfflineAudioContext(1, 4410, 44100).startRendering().catch(() => {});
window.__fp = { urlStart: url.slice(0, 22), width: data.width, length: data.data.length };
"""
PAGE = b"""<!doctype html><title>mock site</title><h1>mock</h1>
<script src="http://fp.example.com/fp.js"></script>
<script src="http://cdn.example.net/lib.js"></script>
<script src="/app.js"></script>
<img src="http://tracker.example.net/pixel.gif" width=1 height=1>
<img src="http://cookies.example.net/p.gif" width=1 height=1>
<script>
  navigator.sendBeacon("http://ads.example.net/collect", "x");
  { const own = document.createElement("canvas"); own.getContext("2d").fillRect(0, 0, 5, 5); own.toDataURL(); }   // the site itself
  window.__inline = true;
</script>"""
PAGE_SLOW = b"""<!doctype html><title>slow</title><img src="http://slow.example.net/slow.gif" width=1 height=1>"""


class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        host = (self.headers.get("Host") or "").split(":")[0]
        path = self.path.split("://", 1)[-1].split("/", 1)[-1] if "://" in self.path else self.path.lstrip("/")
        path = "/" + path.split("?")[0]
        headers, body, kind = {}, b"", "text/plain"
        if host == "site.example.org" and path == "/": body, kind = PAGE, "text/html"
        elif host == "slow.example.org" and path == "/": body, kind = PAGE_SLOW, "text/html"
        elif host == "other.example.org": body, kind = b"<!doctype html><title>other</title><p>other</p>", "text/html"
        elif host == "fp.example.com": body, kind = FP_JS, "text/javascript"
        elif host == "cdn.example.net": body, kind = b"window.__lib = 1;", "text/javascript"
        elif path == "/app.js": body, kind = b"window.__app = 1;", "text/javascript"
        elif host == "cookies.example.net": body, kind, headers = b"GIF89a", "image/gif", {"Set-Cookie": "id=abc; Path=/"}
        elif host == "slow.example.net": time.sleep(6); body, kind = b"GIF89a", "image/gif"
        else: body, kind = b"GIF89a", "image/gif"
        self.send_response(200); self.send_header("Content-Type", kind)
        for k, v in headers.items(): self.send_header(k, v)
        self.end_headers(); self.wfile.write(body)
    do_POST = do_GET
    def log_message(self, *args): pass


failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)


threading.Thread(target=http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Site).serve_forever, daemon=True).start()
prefs = {"dom.security.https_only_mode": False, "dom.security.https_first": False, "network.proxy.type": 1,
         "network.proxy.http": "127.0.0.1", "network.proxy.http_port": PORT, "network.proxy.no_proxies_on": "",
         "network.cookie.cookieBehavior": 5}

with Firefox(sys.argv[1], prefs=prefs) as ff:
    ff.install_addon(ROOT / "tests/acceptance/attempts-log/blocker")
    addon = ff.install_addon(ROOT / "extensions/attempts-log")
    popup = ff.addon_url(addon, "popup/popup.html")
    site_tab = ff.cmd("WebDriver:GetWindowHandle")
    ff.navigate(SITE); time.sleep(4)
    check("the page still works with the observers in place", ff.script("return [window.__inline, window.__lib, window.__app, !!window.__fp]") == [True, 1, 1, True])
    check("canvas reading still returns the real picture", ff.script("return window.__fp") == {"urlStart": "data:image/png;base64,", "width": 200, "length": 32000})

    def open_popup(extra=""):
        ff.cmd("WebDriver:NewWindow", {"type": "tab", "focus": True}); time.sleep(1)
        ff.navigate(popup + extra)

    def all_logs():
        """The log of every tab, asked from an extension page."""
        return ff.async_script("""const done = arguments[arguments.length - 1];
            (async () => { const out = {}; for (const t of await browser.tabs.query({}))
                out[t.id] = await browser.runtime.sendMessage({ type: "get", tabId: t.id }); done(out); })();""")

    open_popup()
    logs = all_logs()
    mine = [int(i) for i, d in logs.items() if d["top"] == "site.example.org"]
    check("exactly one tab has the mock site's log", len(mine) == 1, {i: d["top"] for i, d in logs.items()})
    tab_id = mine[0]
    ff.navigate(popup + "?tab=%d" % tab_id); ff.wait_for("document.documentElement.dataset.ready")
    entries = logs[str(tab_id)]
    text = ff.script("return document.body.innerText")
    badge = ff.async_script("const done = arguments[arguments.length - 1]; browser.action.getBadgeText({tabId: arguments[0]}).then(done);", [tab_id])

    rows = {(e["kind"], e["who"], e["what"].split(" (")[0]): e for e in entries["entries"]}
    kinds = lambda who: sorted(e["kind"] for e in entries["entries"] if e["who"] == who)
    check("the page is recorded as the site", entries["top"] == "site.example.org", entries["top"])
    check("blocked tracker pixel is listed as blocked", ("blocked", "tracker.example.net", "blocked image") in rows, list(rows))
    check("beacon to a third party is listed as sent", any(k[0] == "sent" and k[1] == "ads.example.net" for k in rows), list(rows))
    check("third-party cookie is listed as limited", ("limited", "cookies.example.net") in {(k[0], k[1]) for k in rows}, list(rows))
    check("canvas fingerprint is attributed to the third-party script", ("fingerprint", "fp.example.com") in {(k[0], k[1]) for k in rows}, list(rows))
    check("audio probe is attributed to the third-party script", any(k[1] == "fp.example.com" and "audio" in k[2] for k in rows), list(rows))
    own = [e for e in entries["entries"] if e["kind"] == "fingerprint" and e["who"] == "site.example.org"]
    check("a canvas read by the site itself is labelled as the site's own", len(own) == 1 and own[0]["own"], own)
    check("an innocent third-party script (CDN) is not listed", kinds("cdn.example.net") == [], kinds("cdn.example.net"))
    check("the site's own script is not listed", kinds("site.example.org") == ["fingerprint"], kinds("site.example.org"))
    check("popup text shows both groups and the trackers", all(s in text.lower() for s in ("blocked", "not blocked", "tracker.example.net", "fp.example.com", "this site")), text[:300])
    check("popup says what it does not show", "Not shown:" in text and "memory only" in text)
    total = sum(e["count"] for e in entries["entries"])
    check("the badge shows the total", badge == str(total), (badge, total))

    # a new page starts a new log, and a request cancelled by leaving the page is not 'blocked'
    ff.cmd("WebDriver:SwitchToWindow", {"handle": site_tab})
    ff.navigate("http://slow.example.org/"); time.sleep(1)
    ff.navigate("http://other.example.org/"); time.sleep(8)
    open_popup()
    entries = all_logs()[str(tab_id)]
    check("the log starts again on a new page", entries["top"] == "other.example.org" and entries["entries"] == [], entries)

    # clear button
    ff.cmd("WebDriver:SwitchToWindow", {"handle": site_tab}); ff.navigate(SITE); time.sleep(4)
    open_popup("?tab=%d" % tab_id); ff.wait_for("document.documentElement.dataset.ready")
    ff.script("document.getElementById('clear').click()"); time.sleep(1)
    check("'Clear this page' empties the list", "Nothing detected" in ff.script("return document.body.innerText"))

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
