#!/usr/bin/env python3
"""Privacy level acceptance run in a real Firefox: Standard leaves Firefox alone, Advanced turns on the strong
fingerprint protection (screen and time zone become generic), Standard turns it off again, Anonymous cannot be
chosen, and removing the extension hands the setting back.

    run.py FIREFOX_DIR
"""
import pathlib, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

RFP = "return Services.prefs.getBoolPref('privacy.resistFingerprinting')"
def rfp(ff):
    return ff.chrome_script("const done = arguments[arguments.length - 1]; " + RFP.replace("return ", "done(") + ");")
def click(ff, css):
    ff.cmd("WebDriver:ElementClick", {"id": next(iter(ff.find(css).values()))})

with Firefox(sys.argv[1]) as ff:
    addon = ff.install_addon(ROOT / "extensions/privacy-level")
    time.sleep(1.5)
    ff.navigate(ff.addon_url(addon, "page/index.html"))
    time.sleep(1)
    check("page opens", ff.script("return document.title") == "Privacy level")
    text = ff.script("return document.body.textContent")
    check("every level says what it does not hide and what it costs", text.count("What it does not hide.") == 3 and text.count("What it costs.") == 3)
    check("it says no level makes you anonymous", "None of them makes you anonymous" in text)
    check("Standard is the current level at first", ff.script("return document.getElementById('lv-standard').checked") is True)
    check("Anonymous cannot be chosen (Tor is not built)", ff.script("return document.getElementById('lv-anonymous').disabled") is True and "not available yet" in text)
    check("Standard leaves the Firefox setting off", rfp(ff) is False)

    # what a site sees at each level (a plain page; the self-test run compares the full list)
    SCREEN = "return [screen.width, screen.height].join('x')"
    ff.navigate("data:text/html,<body>x</body>")
    real = ff.script(SCREEN)
    ff.navigate(ff.addon_url(addon, "page/index.html")); time.sleep(0.5)
    click(ff, "#lv-advanced"); time.sleep(1)
    check("choosing Advanced turns the strong fingerprint protection on", rfp(ff) is True)
    check("the page shows Advanced as current", ff.script("return document.querySelector('.level.current h3').textContent").startswith("Advanced"))
    ff.navigate("data:text/html,<body>x</body>")
    spoofed = ff.script(SCREEN)
    check("a site no longer sees the real screen size", spoofed != real, (real, spoofed))

    ff.navigate(ff.addon_url(addon, "page/index.html")); time.sleep(1)
    check("the choice is remembered when the page is opened again", ff.script("return document.getElementById('lv-advanced').checked") is True)
    click(ff, "#lv-standard"); time.sleep(1)
    check("choosing Standard turns it off again", rfp(ff) is False)
    ff.navigate("data:text/html,<body>x</body>")
    check("and the real screen size is back", ff.script(SCREEN) == real)

    # a level that is not available is refused even if asked for directly
    ff.navigate(ff.addon_url(addon, "page/index.html")); time.sleep(0.5)
    reply = ff.async_script("const done = arguments[arguments.length - 1]; browser.runtime.sendMessage({type: 'set', level: 'anonymous'}).then(done);")
    check("asking for Anonymous directly is refused", reply.get("error") and rfp(ff) is False, reply)

    # removing the extension while Advanced is on hands the setting back
    click(ff, "#lv-advanced"); time.sleep(1)
    check("(setup) Advanced is on", rfp(ff) is True)
    ff.navigate("data:text/html,<body>x</body>")   # leave the extension's page: it closes with the extension
    ff.chrome_script("const [id, done] = arguments; AddonManager.getAddonByID(id).then((a) => { a.uninstall(); done(true); });", [addon])
    time.sleep(1.5)
    check("removing the extension turns it off: nothing is left behind", rfp(ff) is False)

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
