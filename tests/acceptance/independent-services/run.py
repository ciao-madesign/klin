#!/usr/bin/env python3
"""Klin Independent Services (hub) acceptance run in a real Firefox: the button opens the page; add, find, favourite,
order, open in a new tab, delete; the fixed lines; old data; nothing starts by itself; Italian.

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

def type_into(ff, css, text): ff.send_keys(ff.find(css), text)
def click(ff, css): ff.cmd("WebDriver:ElementClick", {"id": next(iter(ff.find(css).values()))})
def setv(ff, css, value): ff.script("const e = document.querySelector(arguments[0]); e.value = arguments[1]; e.dispatchEvent(new Event('input', {bubbles: true})); return true", [css, value])
names = lambda ff: ff.script("return [...document.querySelectorAll('#cards .card h3')].map(e => e.textContent)")
def add(ff, name, url, **more):
    setv(ff, "#f_name", name); setv(ff, "#f_url", url)
    for k, v in more.items(): setv(ff, "#f_" + k, v)
    click(ff, "#form button[type=submit]"); time.sleep(0.4)
err = lambda ff: ff.script("const e = document.getElementById('error'); return e.classList.contains('hidden') ? '' : e.textContent")

with Firefox(sys.argv[1]) as ff:
    kis = ff.install_addon(ROOT / "extensions/independent-services")
    manifest = ff.chrome_script("const [id, done] = arguments; const p = WebExtensionPolicy.getByID(id); done(JSON.stringify({perms: p.permissions, hosts: p.allowedOrigins.patterns.map((m) => m.pattern).filter((m) => !m.startsWith('moz-extension'))}))", [kis])
    check("it asks for no host permission and only for storage", '"hosts":[]' in manifest.replace(" ", "") and "storage" in manifest, manifest)

    before = ff.handles()
    ff.click_action(kis)
    tab = ff.switch_to_new_tab(before)
    try: ff.wait_for("location.href.includes('page/index.html')", 15); opened = True
    except Exception: opened = False
    check("the toolbar button opens the page", tab is not None and opened)
    ff.navigate(ff.addon_url(kis, "page/index.html")); time.sleep(1)
    check("title and empty state", ff.script("return document.title") == "Independent services" and "Nothing here yet" in ff.script("return document.getElementById('empty').textContent") and names(ff) == [])
    text = ff.script("return document.body.innerText")
    check("the two fixed lines are on screen", "Being in the list is not an approval" in text and "does not certify, guarantee or host anything" in text and "sees your IP address" in text)
    check("the page loads nothing from the internet", ff.script("return [...document.querySelectorAll('[src],[href]')].map(e => e.src || e.href).filter(u => /^https?:/.test(u))") == [])

    add(ff, "Zeta Chat", "https://chat.example.net", category="chat", software="Matrix", country="Italia", model="association", costs="donation", registration="open", checked="2026-11-01", source="my friend")
    add(ff, "Alpha Hosting", "https://alpha.example.com/", category="hosting", model="commercial", description="Sites and e-mail", checked="2024-01-15")
    add(ff, "Beta Notes", "http://beta.example.org")
    check("three services shown in alphabetical order", names(ff) == ["Alpha Hosting", "Beta Notes", "Zeta Chat"], names(ff))
    check("the count is shown", "3 of 3" in ff.script("return document.getElementById('count').textContent"))

    add(ff, "Bad", "javascript:alert(1)")
    check("a javascript: address is refused with a message", len(names(ff)) == 3 and "http://" in err(ff), err(ff))
    add(ff, "Bad2", "https://user:pw@evil.example")
    check("an address with a password is refused", len(names(ff)) == 3 and err(ff) != "")
    add(ff, "Again", "https://www.alpha.example.com")
    check("the same address twice is refused", len(names(ff)) == 3 and "already in your list" in err(ff), err(ff))
    add(ff, "NoDate", "https://nodate.example.org", checked="yesterday")
    check("a bad date is refused", len(names(ff)) == 3 and "YYYY-MM-DD" in err(ff), err(ff))
    setv(ff, "#f_name", ""); setv(ff, "#f_url", "")

    cards = ff.script("return [...document.querySelectorAll('#cards .card')].map(c => c.textContent)")
    check("each card shows the host, who runs it and the dates", "chat.example.net" in cards[2] and "Matrix" in cards[2] and "checked 2026-11-01" in cards[2] and "Source: my friend" in cards[2], cards[2])
    check("a card checked long ago says so, a card with no date says so", "more than 12 months ago" in cards[0] and "never checked" in cards[1], [cards[0], cards[1]])

    link = ff.script("const a = document.querySelector('#cards .card a.open'); return [a.href, a.target, a.rel]")
    check("Open is a plain link in a new tab with no opener and no referrer", link == ["https://alpha.example.com/", "_blank", "noopener noreferrer"], link)

    setv(ff, "#months", "36"); ff.script("document.getElementById('months').dispatchEvent(new Event('change')); return true"); time.sleep(0.3)
    cards = ff.script("return [...document.querySelectorAll('#cards .card')].map(c => c.textContent)")
    check("the 'old' limit can be changed", "more than" not in cards[0] and "never checked" in cards[1], cards[0])
    setv(ff, "#months", "12"); ff.script("document.getElementById('months').dispatchEvent(new Event('change')); return true"); time.sleep(0.5)

    click(ff, "#cards .card:nth-child(3) button[aria-pressed]"); time.sleep(0.3)
    check("a favourite goes first", names(ff) == ["Zeta Chat", "Alpha Hosting", "Beta Notes"], names(ff))
    setv(ff, "#q", "matrix")
    check("search by software", names(ff) == ["Zeta Chat"])
    setv(ff, "#q", "nothing-like-this")
    check("no match says so", "No service matches" in ff.script("return document.getElementById('cards').textContent"))
    setv(ff, "#q", "")
    setv(ff, "#cat", "hosting")
    check("filter by category", names(ff) == ["Alpha Hosting"])
    setv(ff, "#cat", ""); setv(ff, "#mod", "association")
    check("filter by who runs it", names(ff) == ["Zeta Chat"])
    setv(ff, "#mod", ""); ff.script("const c = document.getElementById('favonly'); c.checked = true; c.dispatchEvent(new Event('input')); return true")
    check("favourites only", names(ff) == ["Zeta Chat"])
    ff.script("const c = document.getElementById('favonly'); c.checked = false; c.dispatchEvent(new Event('input')); return true")

    ff.navigate(ff.addon_url(kis, "page/index.html")); time.sleep(1)
    check("everything is still there after reopening, favourite included", names(ff) == ["Zeta Chat", "Alpha Hosting", "Beta Notes"], names(ff))

    click(ff, "#cards .card:nth-child(2) button:last-child"); time.sleep(0.3)
    check("delete removes one service", names(ff) == ["Zeta Chat", "Beta Notes"], names(ff))

    ff.navigate(ff.addon_url(kis, "page/index.html") + "?lang=it"); time.sleep(1.2)
    it = ff.script("return document.body.textContent")
    check("the page speaks Italian when asked", ff.script("return document.querySelector('h1').textContent") == "Servizi indipendenti" and "Essere nell'elenco non è un'approvazione" in it and "Cosa non fa" in it and ("mai controllato" in it or "controllato il" in it))

if failures:
    print("\n%d FAILED" % len(failures)); sys.exit(1)
print("\nall passed")
