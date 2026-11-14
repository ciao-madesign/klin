#!/usr/bin/env python3
"""Identity acceptance run: Klin's start page and theme, and no "Welcome to Firefox" screen.

    run.py FIREFOX_DIR     (a copy of Firefox with Klin's prefs and policies, see docs/STATUS.md section 8)
"""
import pathlib, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

with Firefox(sys.argv[1]) as ff:
    ff.install_addon(ROOT / "extensions/newtab")
    ff.install_addon(ROOT / "extensions/theme")
    time.sleep(3)
    ff.cmd("Marionette:SetContext", {"value": "chrome"})
    info = ff.async_script("""const done = arguments[arguments.length - 1];
        const w = Services.wm.getMostRecentWindow("navigator:browser");
        w.BrowserCommands.openTab ? w.BrowserCommands.openTab() : w.BrowserOpenTab();
        setTimeout(() => {
          const t = w.gBrowser.selectedTab;
          const tabs = w.gBrowser.tabs.map((x) => x.linkedBrowser.currentURI.spec);
          const bg = getComputedStyle(w.document.getElementById("nav-bar")).backgroundColor;
          done({ url: t.linkedBrowser.currentURI.spec, tabs, toolbar: bg });
        }, 2500);""")
    print("     ", info)
    check("a new tab opens Klin's start page", "/page/index.html" in info["url"] and info["url"].startswith("moz-extension://"), info["url"])
    check("no 'Welcome to Firefox' tab at start", not any("welcome" in u and "aboutwelcome" in u for u in info["tabs"]), info["tabs"])
    check("the theme paints the toolbar (#141414)", info["toolbar"] == "rgb(20, 20, 20)", info["toolbar"])
    ff.cmd("Marionette:SetContext", {"value": "content"})
    handle = ff.handles()[-1]
    ff.cmd("WebDriver:SwitchToWindow", {"handle": handle})
    text = ff.script("return document.body.innerText")
    check("the page says Klin and shows a search box", "Klin" in text and bool(ff.script("return document.getElementById('q')")), text[:80])
    external = ff.script("return [...document.querySelectorAll('[src],[href]')].map(e => e.src || e.href).filter(u => /^https?:/.test(u))")
    check("it loads nothing from the internet", external == [], external)

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
