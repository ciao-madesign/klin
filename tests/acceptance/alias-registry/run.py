#!/usr/bin/env python3
"""Alias registry acceptance run in a real Firefox: add, find, search, delete, keep across a reload,
back up, and offer usernames to the username check (and only to it).

    run.py FIREFOX_DIR
"""
import json, os, pathlib, sys, tempfile, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

def type_into(ff, css, text):
    ff.send_keys(ff.find(css), text)
def click(ff, css):
    ff.cmd("WebDriver:ElementClick", {"id": next(iter(ff.find(css).values()))})
def add(ff, kind, value, site, note=""):
    ff.script("document.getElementById('kind').value = arguments[0]; return true", [kind])
    type_into(ff, "#value", value); type_into(ff, "#site", site)
    if note: type_into(ff, "#note", note)
    click(ff, "#form button[type=submit]"); time.sleep(0.5)
rows = lambda ff: ff.script("return [...document.querySelectorAll('#rows tr')].map(r => [...r.children].slice(0, 3).map(c => c.textContent).join(' | '))")

with Firefox(sys.argv[1]) as ff:
    reg = ff.install_addon(ROOT / "extensions/alias-registry")
    uc = ff.install_addon(ROOT / "extensions/username-check")
    ff.navigate(ff.addon_url(reg, "page/index.html"))
    check("page opens, empty list", ff.script("return document.title") == "My aliases" and rows(ff) == [])
    ff.navigate(ff.addon_url(reg, "page/index.html") + "?lang=it"); time.sleep(1)
    it = ff.script("return document.body.textContent")
    check("the page speaks Italian when asked", ff.script("return document.querySelector('h1').textContent") == "I miei alias" and "Cosa non fa" in it and "non cifrato" in it)
    ff.navigate(ff.addon_url(reg, "page/index.html")); time.sleep(1)
    text = ff.script("return document.body.innerText")
    check("it says what it does not do", "does not create permanent aliases" in text and "not encrypted" in text and "cannot prove" in text)
    external = ff.script("return [...document.querySelectorAll('[src],[href]')].map(e => e.src || e.href).filter(u => /^https?:/.test(u))")
    check("the page loads nothing from the internet", external == [], external)

    add(ff, "email", "me+shop@example.org", "shop.example", "invoices")
    add(ff, "email", "me+news@example.org", "news.example")
    add(ff, "username", "blue", "forum.example")
    check("three entries saved and shown", len(rows(ff)) == 3 and "me+shop@example.org | shop.example | invoices" in rows(ff), rows(ff))

    add(ff, "email", "not-an-email", "x.example")
    check("a bad address is refused with a message", len(rows(ff)) == 3 and "email address" in ff.script("return document.getElementById('error').textContent"))

    type_into(ff, "#leak", "ME+SHOP@example.org"); click(ff, "#who button")
    check("spam on an address: shows who got it", "shop.example" in ff.script("return document.getElementById('leakResult').textContent"))
    ff.script("document.getElementById('leak').value = ''; return true"); type_into(ff, "#leak", "nobody@example.org"); click(ff, "#who button")
    check("unknown address says so", "not in your list" in ff.script("return document.getElementById('leakResult').textContent"))

    ff.script("document.getElementById('plus').closest('details').open = true; document.getElementById('site').value = 'https://www.Bank.example/login'; return true")
    type_into(ff, "#base", "me@example.org"); click(ff, "#plus button")
    check("plus address helper fills the form", ff.script("return document.getElementById('value').value") == "me+bank.example@example.org")
    ff.script("for (const id of ['value','site','base']) document.getElementById(id).value = ''; return true")

    type_into(ff, "#search", "news")
    check("search narrows the list", len(rows(ff)) == 1 and "news.example" in rows(ff)[0], rows(ff))
    ff.script("const s = document.getElementById('search'); s.value = ''; s.dispatchEvent(new Event('input')); return true")

    ff.navigate(ff.addon_url(reg, "page/index.html"))
    check("the list is still there after reloading the page", len(rows(ff)) == 3, rows(ff))

    # the username check is offered the usernames, and only those
    ff.navigate(ff.addon_url(uc, "page/index.html")); time.sleep(1.5)
    opts = ff.script("return [...document.querySelectorAll('#aliasPick option')].map(o => o.value)")
    check("username check offers the registry's usernames, not emails", opts == ["", "blue"], opts)
    ff.script("const s = document.getElementById('aliasPick'); s.value = 'blue'; s.dispatchEvent(new Event('change')); return true")
    check("choosing one fills the name and ticks 'my own'", ff.script("return [document.getElementById('username').value, document.getElementById('own').checked, document.getElementById('start').disabled]") == ["blue", True, False])
    # another extension asking gets nothing: the registry answers only the username check
    leaked = ff.async_script("const done = arguments[arguments.length - 1]; browser.runtime.sendMessage('alias-registry@klin', {type: 'usernames'}).then((r) => done(JSON.stringify(r))).catch(() => done('refused'));")
    check("the answer holds only usernames", leaked == '{"usernames":["blue"]}', leaked)

    # delete, and a backup file
    ff.navigate(ff.addon_url(reg, "page/index.html"))
    ff.cmd("WebDriver:ElementClick", {"id": next(iter(ff.find("#rows tr:nth-child(2) button").values()))}); time.sleep(0.5)
    check("delete removes one entry", len(rows(ff)) == 2 and not any("news.example" in r for r in rows(ff)), rows(ff))

    # loading a backup: keeps what is there, adds only new valid entries
    backup = pathlib.Path(tempfile.mkdtemp()) / "backup.json"
    backup.write_text(json.dumps({"klinAliasRegistry": 1, "entries": [
        {"kind": "email", "value": "me+shop@example.org", "site": "shop.example"},      # already there
        {"kind": "username", "value": "green", "site": "chat.example"},                 # new
        {"kind": "email", "value": "broken", "site": "x.example"}]}))                   # not valid
    ff.script("document.getElementById('importFile').classList.remove('hidden'); return true")
    type_into(ff, "#importFile", str(backup)); time.sleep(1)
    note = ff.script("return document.getElementById('backupNote').textContent")
    check("loading a backup adds only new valid entries", len(rows(ff)) == 3 and "Added 1, skipped 2" in note, [rows(ff), note])
    bad = pathlib.Path(tempfile.mkdtemp()) / "bad.json"; bad.write_text("nonsense")
    type_into(ff, "#importFile", str(bad)); time.sleep(1)
    check("a file that is not a backup is refused", "not a Klin alias backup" in ff.script("return document.getElementById('backupNote').textContent") and len(rows(ff)) == 3)

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
