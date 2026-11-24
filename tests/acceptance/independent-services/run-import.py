#!/usr/bin/env python3
"""KIS catalogue import in a real Firefox: from a file and from an https address (stand-in server with a test certificate);
the preview, the refusals, profiles, update, going back, switching off, removing, Italian.

    run-import.py FIREFOX_DIR
"""
import http.server, json, pathlib, ssl, subprocess, sys, tempfile, threading, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)
def click(ff, css): ff.cmd("WebDriver:ElementClick", {"id": next(iter(ff.find(css).values()))})
def type_into(ff, css, text): ff.send_keys(ff.find(css), text)
names = lambda ff: ff.script("return [...document.querySelectorAll('#cards .card h3')].map(e => e.textContent)")
text_of = lambda ff, css: ff.script("return document.querySelector(arguments[0]).textContent", [css])
shown = lambda ff, css: ff.script("return !document.querySelector(arguments[0]).classList.contains('hidden')", [css])

tmp = pathlib.Path(tempfile.mkdtemp())
def catalogue(fname="main", **over):
    d = {"klinCatalogue": 1, "id": "test-list", "name": "Test list", "maintainer": "Some Association", "version": "1.0", "published": "2026-10-01", "license": "CC0-1.0",
         "services": [{"name": "Chat One", "url": "https://chat.example.net", "category": "chat", "software": "Matrix", "model": "association", "checked": "2026-10-01"},
                      {"name": "Mail Two", "url": "https://mail.example.org", "category": "email", "model": "community"},
                      {"name": "Real", "url": "https://exampleservice.org"}, {"name": "Fake", "url": "https://examp1eservice.org"}]}
    d.update(over)
    path = tmp / (fname + ".json"); path.write_text(json.dumps(d)); return path

# an https stand-in with a throw-away certificate
subprocess.run(["openssl", "req", "-x509", "-newkey", "rsa:2048", "-nodes", "-keyout", str(tmp / "k.pem"), "-out", str(tmp / "c.pem"), "-days", "2", "-subj", "/CN=127.0.0.1",
                "-addext", "subjectAltName=IP:127.0.0.1"], check=True, capture_output=True)
served = {"body": json.dumps({"klinCatalogue": 1, "id": "web-list", "name": "Web list", "maintainer": "Web Folks", "version": "2.0", "published": "2026-11-01", "license": "CC-BY-4.0",
                              "services": [{"name": "Web Service", "url": "https://web.example.org"}]}).encode(), "hits": []}
class H(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        served["hits"].append({"path": self.path, "cookie": self.headers.get("Cookie"), "referer": self.headers.get("Referer")})
        self.send_response(200); self.send_header("Content-Type", "application/json"); self.end_headers(); self.wfile.write(served["body"])
    def log_message(self, *a): pass
server = http.server.HTTPServer(("127.0.0.1", 0), H)
ctx = ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER); ctx.load_cert_chain(str(tmp / "c.pem"), str(tmp / "k.pem"))
server.socket = ctx.wrap_socket(server.socket, server_side=True)
threading.Thread(target=server.serve_forever, daemon=True).start()
PORT = server.server_address[1]

with Firefox(sys.argv[1]) as ff:
    ff.chrome_script("""const [done] = arguments; Cc["@mozilla.org/security/certoverride;1"].getService(Ci.nsICertOverrideService).setDisableAllSecurityChecksAndLetAttackersInterceptMyData(true); done(true);""")
    kis = ff.install_addon(ROOT / "extensions/independent-services")
    page = ff.addon_url(kis, "page/index.html")
    ff.navigate(page); time.sleep(1)
    check("no public catalogue is offered yet, and it says so", shown(ff, "#publicNone") and "licence is checked" in text_of(ff, "#publicNone"))
    ff.script("document.getElementById('catFile').classList.remove('hidden'); return true")

    def load_file(path):
        type_into(ff, "#catFile", str(path)); time.sleep(0.8)

    # refusals: nothing is imported, a reason is given
    bad = tmp / "bad.json"; bad.write_text("nonsense"); load_file(bad)
    check("a file that is not JSON is refused", "not a JSON file" in text_of(ff, "#catError") and not shown(ff, "#preview") and names(ff) == [])
    load_file(catalogue("evil", services=[{"name": "Fine", "url": "https://ok.example.org"}, {"name": "Bad", "url": "javascript:alert(1)"}]))
    check("one bad link refuses the whole file, and names the service", "Service number 2" in text_of(ff, "#catError") and "address not allowed" in text_of(ff, "#catError") and names(ff) == [])
    big = tmp / "big.json"; big.write_text(json.dumps({"klinCatalogue": 1, "pad": "x" * 1100000})); load_file(big)
    check("a file over 1 MB is refused", "1 MB" in text_of(ff, "#catError") and names(ff) == [])
    load_file(catalogue("nover", klinCatalogue=2))
    check("a file of another format is refused", "not a Klin catalogue" in text_of(ff, "#catError"))

    # a good one: preview first, nothing saved
    load_file(catalogue("good", homepage="https://evil.example", searchEngine="evil"))
    check("a good file shows a preview and has saved nothing yet", shown(ff, "#preview") and names(ff) == [] and "Test list, by Some Association" in text_of(ff, "#pvName"))
    check("the preview shows version, date, licence and the counts", "Version 1.0" in text_of(ff, "#pvMeta") and "CC0-1.0" in text_of(ff, "#pvMeta") and "4 new" in text_of(ff, "#pvSum"), text_of(ff, "#pvSum"))
    check("fields that are not services are listed as ignored, never applied", "homepage" in text_of(ff, "#pvIgnored") and "searchEngine" in text_of(ff, "#pvIgnored"))
    dom = ff.script("return [...document.querySelectorAll('#pvDomains tr')].map(r => [...r.children].map(c => c.textContent).join(' | '))")
    check("every domain is listed", len(dom) == 4 and any(d.startswith("chat.example.net") for d in dom), dom)
    check("a lookalike domain is flagged in the preview", any(d.startswith("examp1eservice.org") and "looks like" in d for d in dom), dom)
    click(ff, "#catCancel")
    check("cancel saves nothing", not shown(ff, "#preview") and names(ff) == [])

    load_file(catalogue("good2")); click(ff, "#catImport"); time.sleep(0.6)
    check("import saves the services, in alphabetical order", names(ff) == ["Chat One", "Fake", "Mail Two", "Real"], names(ff))
    check("it says what was imported", "Imported 4 services from Test list" in text_of(ff, "#catDone"))
    cards = ff.script("return [...document.querySelectorAll('#cards .card')].map(c => c.textContent)")
    check("each card shows which catalogue it came from", all("From catalogue: Test list" in c for c in cards))
    inst = text_of(ff, "#installed")
    check("the catalogue is listed with its provenance", "Test list, by Some Association" in inst and "Version 1.0" in inst and "4 services" in inst, inst)

    # update: one changed, one removed, one new; the previous version is kept
    load_file(catalogue("v2", version="1.1", services=[{"name": "Chat One", "url": "https://chat.example.net", "description": "now with text"}, {"name": "Mail Two", "url": "https://mail.example.org"}, {"name": "New One", "url": "https://new.example.org"}]))
    check("an update says what changes", "1 new, 2 changed, 2 removed, 0 unchanged" in text_of(ff, "#pvSum"), text_of(ff, "#pvSum"))
    click(ff, "#catImport"); time.sleep(0.6)
    check("the update replaces that catalogue's services only", names(ff) == ["Chat One", "Mail Two", "New One"], names(ff))
    check("the version is updated", "Version 1.1" in text_of(ff, "#installed"))
    click(ff, "#installed .card button:nth-of-type(1)"); time.sleep(0.6)
    check("going back restores the previous version", names(ff) == ["Chat One", "Fake", "Mail Two", "Real"] and "Version 1.0" in text_of(ff, "#installed"), names(ff))

    # by hand and favourite survive; switching off hides, switching on shows
    ff.script("const set = (id, v) => { const e = document.getElementById(id); e.value = v; }; set('f_name', 'By hand'); set('f_url', 'https://hand.example.org'); return true")
    click(ff, "#form button[type=submit]"); time.sleep(0.4)
    ff.script("document.querySelector('#installed input[type=checkbox]').click(); return true"); time.sleep(0.4)
    check("switching a catalogue off hides its services, not yours", names(ff) == ["By hand"], names(ff))
    ff.navigate(page); time.sleep(1)
    check("it stays off after reopening", names(ff) == ["By hand"], names(ff))
    ff.script("document.querySelector('#installed input[type=checkbox]').click(); return true"); time.sleep(0.4)
    check("switching on shows them again", len(names(ff)) == 5)

    # a profile: services only, nothing else
    prof = catalogue("profile", id="community-x", name="Community X", kind="profile", proxy="evil:1", dns="evil", defaultSearch="evil",
                     services=[{"name": "Community Mail", "url": "https://mail.community.example"}])
    load_file(prof)
    check("a profile says it cannot change the browser, and lists what it ignored", shown(ff, "#pvProfile") and all(k in text_of(ff, "#pvIgnored") for k in ("proxy", "dns", "defaultSearch")))
    click(ff, "#catImport"); time.sleep(0.5)
    perms = ff.chrome_script("const [id, done] = arguments; const p = WebExtensionPolicy.getByID(id); done(JSON.stringify(p.permissions))", [kis])
    check("importing a profile adds only a card: the extension has no permission to change settings", "Community Mail" in names(ff) and perms == '["storage"]', perms)

    # from an https address
    check("a non-https address is refused before any request", (lambda: (ff.script("document.getElementById('catAddr').value = 'http://127.0.0.1:%d/c.json'; return true" % PORT), click(ff, "#catGo"), time.sleep(0.4), "https://" in text_of(ff, "#catError"))[-1])())
    ff.chrome_script("""const [id, done] = arguments; const policy = WebExtensionPolicy.getByID(id);
        const { ExtensionPermissions } = ChromeUtils.importESModule("resource://gre/modules/ExtensionPermissions.sys.mjs");
        ExtensionPermissions.add(id, { permissions: [], origins: ["https://127.0.0.1/*"] }, policy.extension).then(() => done(true));""", [kis])
    ff.script("document.getElementById('catAddr').value = 'https://127.0.0.1:%d/c.json'; return true" % PORT)
    click(ff, "#catGo"); ff.wait_for("document.getElementById('preview') && !document.getElementById('preview').classList.contains('hidden')", 20)
    check("an https catalogue is downloaded and previewed", "Web list, by Web Folks" in text_of(ff, "#pvName") and "https://127.0.0.1:%d/c.json" % PORT in text_of(ff, "#pvSrc"), text_of(ff, "#pvName"))
    hit = served["hits"][0] if served["hits"] else {}
    check("the request carried no cookie and no referrer", hit.get("cookie") is None and hit.get("referer") is None, hit)
    after = ff.chrome_script("const [id, done] = arguments; done(JSON.stringify(WebExtensionPolicy.getByID(id).allowedOrigins.patterns.map((m) => m.pattern).filter((m) => !m.startsWith('moz-extension'))))", [kis])
    check("the permission for that server was given back", "127.0.0.1" not in after, after)
    click(ff, "#catImport"); time.sleep(0.5)
    check("it was imported with its address kept for updates", "Web Service" in names(ff) and "https://127.0.0.1:%d/c.json" % PORT in text_of(ff, "#installed"))

    # remove
    ff.script("[...document.querySelectorAll('#installed .card')].find((c) => c.textContent.includes('Test list')).querySelector('button:last-of-type').click(); return true"); time.sleep(0.5)
    check("removing a catalogue removes its services and nothing else", names(ff) == ["By hand", "Community Mail", "Web Service"], names(ff))

    ff.navigate(page + "?lang=it"); time.sleep(1.2)
    it = ff.script("return document.body.textContent")
    check("the catalogue part speaks Italian when asked", "Cataloghi" in it and "I tuoi cataloghi" in it and "Dal catalogo: Web list" in it and "Scarica e mostra l'anteprima" in it)

server.shutdown()
if failures:
    print("\n%d FAILED" % len(failures)); sys.exit(1)
print("\nall passed")
