#!/usr/bin/env python3
"""Lookalike warning acceptance run. Bookmarks a "known" site, installs extensions/lookalike
and checks which navigations are stopped by the warning page.

    run.py FIREFOX_DIR

Sites are fake names answered by a local server used as proxy; nothing leaves the machine.
"""
import http.server, pathlib, sys, threading, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

PORT = 8894
KNOWN, FAKE, OTHER = "mybank-example.org", "rnybank-example.org", "unrelated-site.net"


class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.send_header("Content-Type", "text/html"); self.end_headers()
        self.wfile.write(b"<!doctype html><title>site</title><p>site</p>")
    def log_message(self, *args): pass


def go(ff, url):
    try:
        ff.navigate(url)
    except RuntimeError:
        pass                      # a stopped navigation is reported as an error
    time.sleep(1.5)
    return ff.cmd("WebDriver:GetCurrentURL")


failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + (" — " + detail if detail and not ok else ""))
    if not ok: failures.append(label)


server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Site)
threading.Thread(target=server.serve_forever, daemon=True).start()
prefs = {"network.proxy.type": 1, "network.proxy.http": "127.0.0.1", "network.proxy.http_port": PORT,
         "network.proxy.ssl": "127.0.0.1", "network.proxy.ssl_port": PORT, "network.proxy.no_proxies_on": "",
         "dom.security.https_only_mode": False, "dom.security.https_first": False}
with Firefox(sys.argv[1], prefs=prefs) as ff:
    ff.chrome_script("""
        const [url, done] = arguments;
        const { PlacesUtils } = ChromeUtils.importESModule("resource://gre/modules/PlacesUtils.sys.mjs");
        PlacesUtils.bookmarks.insert({ parentGuid: PlacesUtils.bookmarks.unfiledGuid, url, title: "My bank" }).then(() => done(true), (e) => done(String(e)));
    """, ["http://%s/" % KNOWN])
    ff.install_addon(ROOT / "extensions/lookalike")
    time.sleep(1)

    url = go(ff, "http://%s/login" % FAKE)
    check("lookalike site is stopped by the warning", url.startswith("moz-extension://") and "warning.html" in url, url)
    if "warning.html" in url:
        shown = ff.script("return [document.getElementById('site').textContent, document.getElementById('known').textContent, document.querySelector('#site mark')?.textContent]")
        check("warning names both sites and highlights the difference", shown == [FAKE, KNOWN, "rn"], str(shown))
    url = go(ff, "http://%s/" % KNOWN)
    check("known site opens normally", url == "http://%s/" % KNOWN, url)
    url = go(ff, "http://www.%s/account" % KNOWN)
    check("subdomain of the known site opens normally", url == "http://www.%s/account" % KNOWN, url)
    url = go(ff, "http://%s/" % OTHER)
    check("unrelated site opens normally", url == "http://%s/" % OTHER, url)

    url = go(ff, "http://%s/login" % FAKE)
    if "warning.html" in url:
        ff.script("document.getElementById('continue').click()")
        time.sleep(2)
        url = ff.cmd("WebDriver:GetCurrentURL")
        check("'Continue' opens the site", url == "http://%s/login" % FAKE, url)
        url = go(ff, "http://%s/other" % FAKE)
        check("no second warning for a site the user accepted", url == "http://%s/other" % FAKE, url)
    else:
        check("lookalike site is stopped a second time", False, url)

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
