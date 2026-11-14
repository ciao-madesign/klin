#!/usr/bin/env python3
"""Privacy level acceptance run in a real Firefox whose system time zone is America/New_York: Standard leaves
the real time zone, Advanced makes pages see UTC (and nothing else changes: the screen stays real), Standard
restores it, Maximum cannot be chosen, and removing the extension leaves nothing behind.

    run.py FIREFOX_DIR
"""
import http.server, os, pathlib, sys, threading, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

PORT = 8890
SITE = "http://127.0.0.1:%d/" % PORT
os.environ["TZ"] = "America/New_York"   # inherited by the Firefox the test starts

class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.send_header("Content-Type", "text/html"); self.end_headers()
        if self.path == "/frame": self.wfile.write(b"<!doctype html><title>frame</title><p>frame</p>")
        else: self.wfile.write(b"<!doctype html><title>site</title><p>site</p><iframe id=f src=/frame></iframe>")
    def log_message(self, *a): pass
threading.Thread(target=http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Site).serve_forever, daemon=True).start()

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

def click(ff, css):
    ff.cmd("WebDriver:ElementClick", {"id": next(iter(ff.find(css).values()))})

# what a page can read about time (a January date: New York is UTC-5, no daylight saving)
READ = """
// Marionette scripts have their own Date and Intl; read everything through the page's own (window.Date ...).
const w = window;
const d = new w.Date(2026, 0, 15, 12, 0, 0);
const f = w.document.getElementById('f').contentWindow;
return {
  offset: d.getTimezoneOffset(), iso: d.toISOString(), hours: d.getHours(),
  fromText: new w.Date('2026-01-15T12:00').toISOString(), fromLooseText: new w.Date('Jan 15 2026 12:00').toISOString(),
  parsed: new w.Date(w.Date.parse('Jan 15 2026 12:00')).toISOString(), epoch: new w.Date(0).toString(),
  zone: new w.Intl.DateTimeFormat().resolvedOptions().timeZone,
  clock: new w.Date(w.Date.UTC(2026, 0, 15, 12)).toLocaleTimeString('en-GB'),
  fmt: new w.Intl.DateTimeFormat('en-GB', { timeStyle: 'short' }).format(new w.Date(w.Date.UTC(2026, 0, 15, 12))),
  frameOffset: new f.Date(2026, 0, 15, 12).getTimezoneOffset(), frameZone: new f.Intl.DateTimeFormat().resolvedOptions().timeZone,
  sane: [new w.Date() instanceof w.Date, w.Date.prototype.constructor === w.Date, typeof w.Date() === 'string', w.Date.now() > 1.7e12, new w.Date('nonsense').toString() === 'Invalid Date'],
  nativeText: w.Function.prototype.toString.call(w.Date.prototype.getHours).includes('[native code]'),
  screen: screen.width + 'x' + screen.height, languages: navigator.languages.join(),
};"""

with Firefox(sys.argv[1], prefs={"dom.security.https_only_mode": False}) as ff:
    addon = ff.install_addon(ROOT / "extensions/privacy-level")
    time.sleep(1.5)
    ff.navigate(ff.addon_url(addon, "page/index.html")); time.sleep(1)
    check("page opens", ff.script("return document.title") == "Privacy level")
    text = ff.script("return document.body.textContent")
    check("every level says what it does not hide and what it costs", text.count("What it does not hide.") == 3 and text.count("What it costs.") == 3)
    check("it says no level makes you anonymous", "None of them makes you anonymous" in text)
    check("levels are Standard, Advanced, Maximum (never 'Anonymous' as a level)", all(n in text for n in ("Standard", "Advanced", "Maximum")) and "Anonymous (" not in text)
    check("Standard is the current level at first", ff.script("return document.getElementById('lv-standard').checked") is True)
    check("Maximum cannot be chosen (Tor is not built)", ff.script("return document.getElementById('lv-maximum').disabled") is True and "not available yet" in text)
    check("the page states the owner's line for the current level", ff.script("return document.getElementById('status').textContent").startswith("Standard:"))

    ff.navigate(SITE); time.sleep(0.5)
    std = ff.script(READ)
    check("Standard: pages see the real time zone (New York, UTC-5)", std["offset"] == 300 and std["zone"] == "America/New_York" and std["hours"] == 12 and std["iso"] == "2026-01-15T17:00:00.000Z", std)

    ff.navigate(ff.addon_url(addon, "page/index.html")); time.sleep(0.5)
    click(ff, "#lv-advanced"); time.sleep(1.5)
    check("the page shows Advanced and the owner's line", ff.script("return document.getElementById('status').textContent") == "Advanced: hides your time zone. Does not hide your screen size.")
    ff.navigate(SITE); time.sleep(0.8)
    adv = ff.script(READ)
    check("Advanced: offset 0 and UTC zone", adv["offset"] == 0 and adv["zone"] == "UTC", adv)
    check("dates built from parts are read as UTC", adv["iso"] == "2026-01-15T12:00:00.000Z" and adv["hours"] == 12, adv)
    check("dates written without a zone are read as UTC", adv["fromText"] == adv["fromLooseText"] == adv["parsed"] == "2026-01-15T12:00:00.000Z", adv)
    check("date text says GMT+0000", adv["epoch"] == "Thu Jan 01 1970 00:00:00 GMT+0000 (Coordinated Universal Time)", adv["epoch"])
    check("formatted times are UTC", adv["clock"] == "12:00:00" and adv["fmt"] == "12:00", adv)
    check("pages inside frames see UTC too", adv["frameOffset"] == 0 and adv["frameZone"] == "UTC", adv)
    check("Date still behaves like Date", all(adv["sane"]) and adv["nativeText"], adv["sane"])
    check("nothing else changed: real screen size and languages stay", adv["screen"] == std["screen"] and adv["languages"] == std["languages"], (std["screen"], adv["screen"]))

    ff.navigate(ff.addon_url(addon, "page/index.html")); time.sleep(0.8)
    check("the choice is remembered when the page is opened again", ff.script("return document.getElementById('lv-advanced').checked") is True)
    click(ff, "#lv-standard"); time.sleep(1.5)
    ff.navigate(SITE); time.sleep(0.8)
    back = ff.script(READ)
    check("Standard again: the real time zone is back", back["offset"] == 300 and back["zone"] == "America/New_York", back)

    ff.navigate(ff.addon_url(addon, "page/index.html")); time.sleep(0.5)
    reply = ff.async_script("const done = arguments[arguments.length - 1]; browser.runtime.sendMessage({type: 'set', level: 'maximum'}).then(done);")
    ff.navigate(SITE); time.sleep(0.5)
    check("asking for Maximum directly is refused and nothing changes", bool(reply.get("error")) and ff.script(READ)["offset"] == 300, reply)

    ff.navigate(ff.addon_url(addon, "page/index.html")); time.sleep(0.5)
    click(ff, "#lv-advanced"); time.sleep(1.5)
    ff.navigate("data:text/html,<body>x</body>")   # leave the extension's page: it closes with the extension
    ff.chrome_script("const [id, done] = arguments; AddonManager.getAddonByID(id).then((a) => { a.uninstall(); done(true); });", [addon])
    time.sleep(1.5)
    ff.navigate(SITE); time.sleep(0.8)
    check("removing the extension leaves nothing behind (real time zone again)", ff.script(READ)["offset"] == 300)

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
