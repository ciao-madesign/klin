#!/usr/bin/env python3
"""Self-test acceptance run: installs extensions/self-test, opens a test site, clicks the
toolbar button and prints one line per check: STATUS <tab> NAME <tab> VALUE.

    run.py FIREFOX_DIR [--pref NAME=VALUE ...]

Compare a stock Firefox with one that has config/prefs/klin.js installed.
The test site is http://selftest.example.org, answered by a local server used as proxy:
Firefox keys canvas noise on the site, and gives none on 127.0.0.1, file:// or extension pages.
HTTPS-only is switched off for the run because the test site is plain http, so checks that
need a secure context (cameras and microphones) report "not available".
"""
import http.server, json, pathlib, sys, threading

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

PORT, SITE = 8897, "http://selftest.example.org/"


class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.send_header("Content-Type", "text/html"); self.end_headers()
        self.wfile.write(b"<!doctype html><title>Test site</title><p>Test site</p>")
    def log_message(self, *args): pass


def main():
    firefox_dir, prefs = sys.argv[1], {
        "network.proxy.type": 1, "network.proxy.http": "127.0.0.1", "network.proxy.http_port": PORT,
        "network.proxy.ssl": "127.0.0.1", "network.proxy.ssl_port": PORT, "network.proxy.no_proxies_on": "",
        "dom.security.https_only_mode": False, "dom.security.https_first": False,
    }
    args = sys.argv[2:]
    while args:
        if args.pop(0) != "--pref": sys.exit(__doc__)
        name, _, value = args.pop(0).partition("=")
        try: prefs[name] = json.loads(value)
        except ValueError: prefs[name] = value
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Site)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    with Firefox(firefox_dir, prefs=prefs) as ff:
        addon = ff.install_addon(ROOT / "extensions/self-test")
        ff.navigate(SITE)
        before = ff.handles()
        clicked = ff.click_action(addon)
        if clicked is not True: sys.exit("toolbar button could not be triggered: %s" % clicked)
        ff.switch_to_new_tab(before)
        if not ff.wait_for("document.documentElement.dataset.done"): sys.exit("the result page did not finish")
        if ff.script("return document.documentElement.dataset.done") != "1":
            sys.exit("the page reported: " + ff.script("return document.getElementById('results').textContent"))
        print("# " + ff.script("return document.getElementById('where').textContent"))
        for row in ff.script("return [...document.querySelectorAll('.item')].map(r => [r.dataset.status, r.dataset.name, r.dataset.value].join('\\t'))"):
            print(row)


main()
