#!/usr/bin/env python3
"""Welcome page acceptance run: opens once at installation, reopens from the info button without
duplicating itself, and loads nothing from the network.

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

def pages(ff):
    """Number of open tabs showing the welcome page, and the one that is selected."""
    return ff.chrome_script("""
        const done = arguments[arguments.length - 1];
        const w = Services.wm.getMostRecentWindow("navigator:browser");
        const tabs = w.gBrowser.tabs.filter((t) => t.linkedBrowser.currentURI.spec.includes("welcome") || t.linkedBrowser.currentURI.spec.endsWith("/page/index.html"));
        done({ count: tabs.length, selected: w.gBrowser.selectedTab === tabs[0], total: w.gBrowser.tabs.length });""")

with Firefox(sys.argv[1]) as ff:
    before = ff.handles()
    addon = ff.install_addon(ROOT / "extensions/welcome")
    time.sleep(3)
    state = pages(ff)
    check("installing opens the presentation page, once", state["count"] == 1, state)
    check("it is the tab in front", state["selected"], state)

    ff.cmd("WebDriver:SwitchToWindow", {"handle": [h for h in ff.handles() if h not in before][0]})
    title = ff.script("return document.title")
    text = ff.script("return document.body.innerText")
    check("the page is Klin's welcome page", title == "Welcome to Klin" and "What Klin does not do" in text, title)
    check("it says what Klin does not do", "does not make you anonymous" in text)
    check("it tells how to read it again", "info" in text and "toolbar" in text)
    external = ff.script("return [...document.querySelectorAll('[src],[href]')].map(e => e.src || e.href).filter(u => /^https?:/.test(u))")
    check("it loads nothing from the internet", external == [], external)

    # the info button brings the open page to the front instead of opening a copy
    new = ff.chrome_script("const done = arguments[arguments.length - 1]; const w = Services.wm.getMostRecentWindow('navigator:browser'); w.gBrowser.selectedTab = w.gBrowser.addTab('about:blank', { triggeringPrincipal: Services.scriptSecurityManager.getSystemPrincipal() }); done(true);")
    time.sleep(1)
    check("(setup) another tab is now in front", not pages(ff)["selected"])
    ff.click_action(addon); time.sleep(2)
    state = pages(ff)
    check("the info button shows the open page without opening a second one", state["count"] == 1 and state["selected"], state)

    # closed: the info button opens it again
    ff.chrome_script("const done = arguments[arguments.length - 1]; const w = Services.wm.getMostRecentWindow('navigator:browser'); const t = w.gBrowser.tabs.find((t) => t.linkedBrowser.currentURI.spec.endsWith('/page/index.html')); w.gBrowser.removeTab(t); done(true);")
    time.sleep(1)
    check("(setup) the page was closed", pages(ff)["count"] == 0)
    ff.click_action(addon); time.sleep(2)
    check("the info button opens it again", pages(ff)["count"] == 1, pages(ff))

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
