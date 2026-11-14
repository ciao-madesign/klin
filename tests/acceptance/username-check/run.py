#!/usr/bin/env python3
"""Username check acceptance run in a real Firefox: stand-in sites on 127.0.0.1 answer in the ways real
sites do (status code, message in the page, redirect away, POST probe, rate limit, slow), and the run
checks what the extension finds, what it sends and what it leaves out.

    run.py FIREFOX_DIR
"""
import http.server, json, pathlib, shutil, sys, tempfile, threading, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

PORT = 8887
BASE = "http://127.0.0.1:%d" % PORT
requests = []   # what the stand-in sites received

class Site(http.server.BaseHTTPRequestHandler):
    def _answer(self):
        body = b""
        n = int(self.headers.get("Content-Length") or 0)
        if n: body = self.rfile.read(n)
        requests.append({"method": self.command, "path": self.path, "cookie": self.headers.get("Cookie"),
                         "referer": self.headers.get("Referer"), "body": body.decode() if body else None})
        p = self.path
        if p == "/setcookie":
            self.send_response(200); self.send_header("Set-Cookie", "session=secret; Path=/"); self.end_headers(); return
        user = p.rsplit("/", 1)[-1]
        mine = user == "blue"
        if p.startswith("/status/"):
            self.send_response(200 if mine else 404); self.end_headers()
        elif p.startswith("/code/"):       # this site answers 204 for names that do not exist
            self.send_response(200 if mine else 204); self.end_headers()
        elif p.startswith("/message/"):
            self.send_response(200); self.send_header("Content-Type", "text/html"); self.end_headers()
            self.wfile.write(b"<h1>profile</h1>" if mine else b"<p>Sorry, nobody goes by that name.</p>")
        elif p.startswith("/redirect/"):
            if mine: self.send_response(200); self.end_headers()
            else: self.send_response(302); self.send_header("Location", "/home"); self.end_headers()
        elif p == "/probe":                # POST probe: answers {"taken":true} when the name is blue
            self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers()
            self.wfile.write(b'{"taken":true}' if body and json.loads(body).get("name") == "blue" else b'{"taken":false}')
        elif p.startswith("/limited/"):
            self.send_response(429); self.end_headers()
        elif p.startswith("/slow/"):
            time.sleep(3); self.send_response(200); self.end_headers()
        else:
            self.send_response(404); self.end_headers()
    do_GET = do_HEAD = do_POST = _answer
    def log_message(self, *args): pass

SITES = [
    {"name": "StatusSite", "type": "status_code", "url": BASE + "/status/{}", "main": BASE},
    {"name": "CodeSite", "type": "status_code", "url": BASE + "/code/{}", "main": BASE, "code": 204},
    {"name": "MessageSite", "type": "message", "url": BASE + "/message/{}", "main": BASE, "msg": "nobody goes by that name"},
    {"name": "RedirectSite", "type": "response_url", "url": BASE + "/redirect/{}", "main": BASE},
    {"name": "ProbeSite", "type": "message", "url": BASE + "/profile/{}", "probe": BASE + "/probe", "main": BASE,
     "method": "POST", "payload": {"name": "{}"}, "msg": '{"taken":false}'},
    {"name": "LimitedSite", "type": "status_code", "url": BASE + "/limited/{}", "main": BASE},
    {"name": "SlowSite", "type": "status_code", "url": BASE + "/slow/{}", "main": BASE},
    {"name": "StrictSite", "type": "status_code", "url": BASE + "/strict/{}", "main": BASE, "regex": "^[a-z]{20}$"},
]

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

threading.Thread(target=http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Site).serve_forever, daemon=True).start()

# Marionette scripts run in a sandbox with the extension's rights, next to the page. The page's own
# variables are not visible there, so the script loads check.js itself and runs it from the sandbox.
CHECK_JS = (ROOT / "extensions/username-check/check.js").read_text()
RUN = "const [sites, name, done] = arguments;\n" + CHECK_JS + """
KlinCheck.run(sites, name, { timeout: 1500 }).then((r) => done(r.map((x) => [x.site.name, x.state])));"""

# The page flow is tested with a copy of the extension whose site list is the stand-in sites.
COPY = pathlib.Path(tempfile.mkdtemp(prefix="klin-username-check-")) / "ext"
shutil.copytree(ROOT / "extensions/username-check", COPY)
(COPY / "data/sites.json").write_text(json.dumps({"source": "test", "commit": "0" * 40, "licence": "MIT", "sites": SITES}))

with Firefox(sys.argv[1], prefs={"dom.security.https_only_mode": False}) as ff:
    addon = ff.install_addon(COPY)
    ff.navigate(BASE + "/setcookie")   # the browser now holds a cookie for the stand-in sites
    ff.navigate(ff.addon_url(addon, "page/index.html"))
    check("page opens", ff.script("return document.title") == "Where am I registered?")
    text = ff.script("return document.body.innerText")
    check("it says what it does not do", "does not delete accounts" in text and "can be wrong" in text and "sees the request" in text)
    external = ff.script("return [...document.querySelectorAll('[src],[href]')].map(e => e.src || e.href).filter(u => /^https?:/.test(u))")
    check("the page itself loads nothing from the internet", external == [], external)
    check("check button is off until the name is typed and 'my own' is ticked",
          ff.script("return document.getElementById('start').disabled") is True)

    # without permission to contact websites no answer can be read
    before = len(requests)
    res = dict(ff.async_script(RUN, [SITES[:1], "blue"]))
    check("without permission nothing can be read", res == {"StatusSite": "unknown"}, res)

    # grant the permission the page would ask for when Check is pressed
    ff.chrome_script("""
        const [id, done] = arguments;
        const { ExtensionPermissions } = ChromeUtils.importESModule("resource://gre/modules/ExtensionPermissions.sys.mjs");
        const policy = WebExtensionPolicy.getByID(id);
        ExtensionPermissions.add(id, { permissions: [], origins: ["<all_urls>"] }, policy.extension).then(() => done(true));""", [addon])
    requests.clear()
    res = dict(ff.async_script(RUN, [SITES, "blue"], timeout_ms=60000))
    check("status-code site: found", res["StatusSite"] == "found", res)
    check("site with its own 'not found' code: found when the code differs", res["CodeSite"] == "found", res)
    check("message site: found", res["MessageSite"] == "found", res)
    check("redirect site: found", res["RedirectSite"] == "found", res)
    check("POST probe site: found", res["ProbeSite"] == "found", res)
    check("rate-limited site: unclear", res["LimitedSite"] == "unknown", res)
    check("slow site: unclear after the time limit", res["SlowSite"] == "unknown", res)
    check("site that cannot hold this name: skipped, no request sent",
          res["StrictSite"] == "skipped" and not any(r["path"].startswith("/strict") for r in requests), res)

    requests.clear()
    res = dict(ff.async_script(RUN, [SITES, "nobody"], timeout_ms=60000))
    check("an unused name: not found on every site that answers",
          all(res[n] == "notfound" for n in ("StatusSite", "CodeSite", "MessageSite", "RedirectSite", "ProbeSite")), res)

    check("status-code sites are asked with HEAD (no page downloaded)",
          any(r["method"] == "HEAD" and r["path"] == "/status/nobody" for r in requests))
    check("the POST probe carried the name as JSON",
          any(r["method"] == "POST" and r["body"] == '{"name":"nobody"}' for r in requests), [r for r in requests if r["method"] == "POST"])
    check("no cookie was sent to any site", all(not r["cookie"] for r in requests), [r["cookie"] for r in requests if r["cookie"]])
    check("no referrer was sent to any site", all(not r["referer"] for r in requests))

    # the page itself, end to end: type a name, tick the box, press Check
    ff.navigate(ff.addon_url(addon, "page/index.html"))
    ff.send_keys(ff.find("#username"), "blue")
    ff.script("document.getElementById('own').click(); return true")
    check("check button is on after typing and ticking", ff.script("return document.getElementById('start').disabled") is False)
    ff.cmd("WebDriver:ElementClick", {"id": next(iter(ff.find("#start").values()))})
    ff.wait_for("document.getElementById('count').textContent.startsWith('Done')", timeout=30)
    found = ff.script("return [...document.querySelectorAll('#found a')].map(a => a.textContent + ' ' + a.getAttribute('href')).sort()")
    check("the page lists the accounts found, with links", len(found) == 6 and found[0].startswith("CodeSite " + BASE + "/code/blue"), found)
    summary = ff.script("return document.getElementById('count').textContent")
    check("the page shows the totals", "6 found, 0 not found, 1 unclear, 1 skipped" in summary, summary)
    check("the name is not stored anywhere",
          ff.script("return JSON.stringify([localStorage.length, sessionStorage.length])") == "[0,0]")

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
