#!/usr/bin/env python3
"""Private-window acceptance run: checks that the start page of a private window is replaced by Klin's
honest page, and that nothing else is touched.

    run.py FIREFOX_DIR
"""
import http.server, pathlib, sys, threading, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

PORT = 8885
EXTENSION = str(ROOT / "extensions/private-window")


class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.send_header("Content-Type", "text/html"); self.end_headers()
        self.wfile.write(b"<!doctype html><title>plain site</title><p>plain site</p>")
    def log_message(self, *args): pass

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

threading.Thread(target=http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Site).serve_forever, daemon=True).start()
PREFS = {"dom.security.https_only_mode": False}


def open_private(ff, url=None):
    before = ff.handles()
    ff.chrome_script("""
        const [url, done] = arguments;
        const w = Services.wm.getMostRecentWindow("navigator:browser");
        if (url) w.openTrustedLinkIn(url, "window", { private: true }); else w.OpenBrowserWindow({ private: true });
        done(true);""", [url])
    deadline = time.time() + 15
    while time.time() < deadline:
        new = [h for h in ff.handles() if h not in before]
        if new:
            ff.cmd("WebDriver:SwitchToWindow", {"handle": new[0]})
            time.sleep(3)
            return new[0]
        time.sleep(0.3)
    raise RuntimeError("no private window opened")


current = lambda ff: ff.cmd("WebDriver:GetCurrentURL")

# 1. with permission to run in private windows
with Firefox(sys.argv[1], prefs=PREFS) as ff:
    ff.cmd("Addon:Install", {"path": EXTENSION, "temporary": True, "allowPrivateBrowsing": True})
    original = ff.cmd("WebDriver:GetWindowHandle")

    open_private(ff)
    url = current(ff)
    check("a new private window shows Klin's page instead of Firefox's", url.startswith("moz-extension://") and url.endswith("/page/index.html"), url)
    text = ff.script("return document.body.innerText")
    check("the page says what a private window does not hide", all(s in text for s in ("internet provider", "The sites you visit", "Your accounts")) and "does not make you invisible" in text)
    check("the page says what it does do", "Forgets history" in text)

    ff.script("document.getElementById('query').value = 'example.org'; document.getElementById('search').requestSubmit();")
    time.sleep(3)
    check("an address typed in the search box is opened", "example.org" in current(ff), current(ff))

    open_private(ff, "http://127.0.0.1:%d/" % PORT)
    check("a private window opened with an address is left alone", current(ff) == "http://127.0.0.1:%d/" % PORT, current(ff))

    ff.cmd("WebDriver:SwitchToWindow", {"handle": original})
    ff.cmd("WebDriver:NewWindow", {"type": "tab"}); time.sleep(2)
    ff.navigate("about:newtab"); time.sleep(2)
    check("a new tab in a normal window is left alone", not current(ff).startswith("moz-extension://"), current(ff))

# 2. without that permission the extension cannot act in private windows
with Firefox(sys.argv[1], prefs=PREFS) as ff:
    ff.cmd("Addon:Install", {"path": EXTENSION, "temporary": True, "allowPrivateBrowsing": False})
    open_private(ff)
    check("without permission for private windows nothing changes (Klin's policy must grant it)", current(ff) == "about:privatebrowsing", current(ff))

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
