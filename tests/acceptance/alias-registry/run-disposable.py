#!/usr/bin/env python3
"""Disposable address acceptance run in a real Firefox, against a STAND-IN for mail.tm on 127.0.0.1 that
follows the service's published API. The real service is not contacted: this proves the extension's
behaviour (permission, what is sent, what is kept), not that mail.tm still answers this way.

    run-disposable.py FIREFOX_DIR
"""
import http.server, json, pathlib, shutil, sys, tempfile, threading, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

PORT = 8888
BASE = "http://127.0.0.1:%d" % PORT
accounts, log = {}, []

class Service(http.server.BaseHTTPRequestHandler):
    def _go(self):
        n = int(self.headers.get("Content-Length") or 0)
        body = json.loads(self.rfile.read(n)) if n else {}
        log.append({"m": self.command, "p": self.path, "auth": self.headers.get("Authorization"), "cookie": self.headers.get("Cookie"), "referer": self.headers.get("Referer")})
        def out(obj, code=200):
            self.send_response(code); self.send_header("Content-Type", "application/json"); self.send_header("Access-Control-Allow-Origin", "*") if False else None
            self.end_headers(); self.wfile.write(json.dumps(obj).encode() if obj is not None else b"")
        auth = self.headers.get("Authorization", "")
        if self.path == "/domains": return out({"hydra:member": [{"domain": "mail.test", "isActive": True}]})
        if self.path == "/accounts" and self.command == "POST":
            accounts[body["address"]] = {"password": body["password"], "id": "acc-" + body["address"][:4]}
            return out({"id": accounts[body["address"]]["id"], "address": body["address"]}, 201)
        if self.path == "/token":
            a = accounts.get(body.get("address"))
            return out({"token": "T:" + body["address"]}) if a and a["password"] == body.get("password") else out({}, 401)
        who = auth.replace("Bearer T:", "")
        if who not in accounts: return out({}, 401)
        if self.path == "/messages":
            return out({"hydra:member": [{"id": "m1", "from": {"address": "shop@news.example"}, "subject": "Welcome", "intro": "Hello"}]})
        if self.path == "/messages/m1":
            return out({"subject": "Welcome", "text": "Thanks for signing up.", "html": ["<img src='http://tracker.example/p.gif'>"]})
        if self.path.startswith("/accounts/") and self.command == "DELETE":
            accounts.pop(who); return out(None, 204)
        out({}, 404)
    do_GET = do_POST = do_DELETE = _go
    def log_message(self, *a): pass

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

threading.Thread(target=http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Service).serve_forever, daemon=True).start()

# a copy of the extension that talks to the stand-in instead of api.mail.tm
COPY = pathlib.Path(tempfile.mkdtemp(prefix="klin-alias-")) / "ext"
shutil.copytree(ROOT / "extensions/alias-registry", COPY)
for f, old, new in (("providers.js", 'const base = "https://api.mail.tm";', 'const base = "%s";' % BASE),
                    ("manifest.json", "https://api.mail.tm/*", "http://127.0.0.1/*")):  # match patterns carry no port
    t = (COPY / f).read_text(); assert old in t; (COPY / f).write_text(t.replace(old, new))

type_into = lambda ff, css, text: ff.send_keys(ff.find(css), text)
click = lambda ff, css: ff.cmd("WebDriver:ElementClick", {"id": next(iter(ff.find(css).values()))})
rows = lambda ff: ff.script("return [...document.querySelectorAll('#rows tr')].map(r => [...r.children].slice(0, 3).map(c => c.textContent).join(' | '))")
text_of = lambda ff, css: ff.script("return document.querySelector(arguments[0]).textContent", [css])

with Firefox(sys.argv[1], prefs={"dom.security.https_only_mode": False}) as ff:
    reg = ff.install_addon(COPY)
    ff.navigate(ff.addon_url(reg, "page/index.html"))
    text = ff.script("return document.body.textContent")
    check("the page warns that the service can read the messages", "can read every message" in text and "Never use it for your bank" in text)
    ff.script("document.getElementById('disposable').open = true; return true")

    click(ff, "#makeDisposable")
    check("without a site name it asks for one and sends nothing", "site" in text_of(ff, "#disposableNote") and not log)

    # permission to contact the service is the one the page asks for on the button; grant it from the browser's own code
    ff.chrome_script("""
        const [id, origin, done] = arguments;
        const { ExtensionPermissions } = ChromeUtils.importESModule("resource://gre/modules/ExtensionPermissions.sys.mjs");
        ExtensionPermissions.add(id, { permissions: [], origins: [origin] }, WebExtensionPolicy.getByID(id).extension).then(() => done(true));""", [reg, "http://127.0.0.1/*"])

    type_into(ff, "#site", "shop.example")
    click(ff, "#makeDisposable"); time.sleep(2)
    r = rows(ff)
    check("an address is created and saved in the list for that site", len(r) == 1 and r[0].endswith("@mail.test | shop.example | disposable, mail.tm"), r)
    check("the service made the account with the saved address", len(accounts) == 1 and r[0].split(" | ")[0] in accounts, list(accounts))
    check("nothing was sent with cookies or a referrer", all(not l["cookie"] and not l["referer"] for l in log), log)

    stored = ff.async_script("const done = arguments[arguments.length - 1]; browser.storage.local.get().then((d) => done(JSON.stringify(d)));")
    stored = json.loads(stored)
    entry = stored["entries"][0]
    check("the entry names its provider but holds no password", entry.get("provider") == "mail.tm" and "password" not in json.dumps(entry), entry)
    check("the password is kept apart, for this browser only", list(stored["secrets"].values())[0]["password"] == list(accounts.values())[0]["password"])

    click(ff, "#rows button[aria-label^='Open the inbox']"); time.sleep(1.5)
    msgs = ff.script("return [...document.querySelectorAll('#messages li')].map(l => l.textContent)")
    check("the inbox shows the message", msgs == ["ReadWelcome — shop@news.example"], msgs)
    click(ff, "#messages button"); time.sleep(1)
    shown = text_of(ff, "#messageText")
    check("the message is shown as plain text", "Thanks for signing up." in shown)
    check("its HTML was not loaded (no image, no request to the tracker)", ff.script("return document.querySelectorAll('#messageText img, #inboxBox img').length") == 0 and not any("tracker" in l["p"] for l in log))
    check("inbox requests carried the token", any(l["auth"] and l["p"] == "/messages" for l in log))

    click(ff, "#rows button[aria-label^='Delete']"); time.sleep(1.5)
    check("deleting removes the address from the list", rows(ff) == [])
    check("and deletes it on the service", accounts == {} and any(l["m"] == "DELETE" for l in log), log[-3:])
    after = json.loads(ff.async_script("const done = arguments[arguments.length - 1]; browser.storage.local.get().then((d) => done(JSON.stringify(d)));"))
    check("and the password is gone from the browser", after["secrets"] == {} and after["entries"] == [], after)

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
