#!/usr/bin/env python3
"""Search engine choice: opens once at first install, lists the engines in the owner's order with Ecosia
preselected, remembers a choice, and the start page then searches with it.

    run.py FIREFOX_DIR     (a copy of Firefox with Klin's prefs and policies, see docs/STATUS.md section 8)
Limit tested here: the choice is used by Klin's start page. The address bar follows the browser's own default (not changed).
"""
import pathlib, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

def tabs(ff):
    ff.cmd("Marionette:SetContext", {"value": "chrome"})
    try:
        return ff.script("const w = Services.wm.getMostRecentWindow('navigator:browser'); return w.gBrowser.tabs.map((t) => t.linkedBrowser.currentURI.spec);")
    finally:
        ff.cmd("Marionette:SetContext", {"value": "content"})

with Firefox(sys.argv[1]) as ff:
    ext = ff.install_addon(ROOT / "extensions/newtab")
    time.sleep(4)
    first = tabs(ff)
    check("at first install the choice page opens, once", sum(u.endswith("/page/choose.html") for u in first) == 1, first)
    ff.navigate(ff.addon_url(ext, "page/choose.html?lang=en")); time.sleep(1.5)
    names = ff.script("return [...document.querySelectorAll('.engine h2')].map((h) => h.textContent)")
    check("it lists the engines in the owner's order", names == ["Ecosia", "Mojeek", "DuckDuckGo", "Qwant", "Google", "Brave Search"], names)
    check("Ecosia is preselected and labelled", ff.script("return document.querySelector('input:checked').value") == "Ecosia" and "Klin receives nothing" in ff.script("return document.querySelector('.tag').textContent"))
    check("it shows the facts (operator, results, financing, statement, account)", ff.script("return document.querySelectorAll('.engine')[1].querySelectorAll('dt').length") == 5)
    check("it says what the choice does and does not change", "address bar" in ff.script("return document.getElementById('scope').textContent"))
    check("it loads nothing from the internet", ff.script("return [...document.querySelectorAll('[src],[href]')].map(e => e.src || e.href).filter(u => /^https?:/.test(u))") == [])
    ff.script("document.querySelector('input[value=\"Mojeek\"]').click(); document.getElementById('form').requestSubmit();"); time.sleep(1)
    saved = ff.async_script("const done = arguments[arguments.length - 1]; browser.storage.local.get('engine').then((v) => done(v.engine));")
    check("the choice is remembered", saved == "Mojeek", saved)
    check("it confirms it", "Mojeek" in ff.script("return document.getElementById('saved').textContent"))
    ff.navigate(ff.addon_url(ext, "page/index.html")); time.sleep(1)
    ff.script("document.getElementById('q').value = 'klin test'; document.getElementById('f').requestSubmit();"); time.sleep(3)
    urls = tabs(ff)
    check("the start page then searches with the chosen engine", any("mojeek.com" in u for u in urls), urls)

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
