#!/usr/bin/env python3
"""The "Protect your email" guide, in a real Firefox: both ways (service, own domain), the address maker, saving into the list,
the link from the list page, the button on the welcome page, Italian, and that nothing is loaded from the internet.

    run-guide.py FIREFOX_DIR
"""
import pathlib, sys, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)
def click(ff, css): ff.cmd("WebDriver:ElementClick", {"id": next(iter(ff.find(css).values()))})
def type_into(ff, css, text): ff.send_keys(ff.find(css), text)
visible = lambda ff: ff.script("return [...document.querySelectorAll('.step:not(.hidden)')].map(s => s.querySelector('h2').textContent)")
progress = lambda ff: ff.script("return document.getElementById('progress').textContent")

with Firefox(sys.argv[1]) as ff:
    reg = ff.install_addon(ROOT / "extensions/alias-registry")
    wel = ff.install_addon(ROOT / "extensions/welcome")
    ff.navigate(ff.addon_url(reg, "page/index.html")); time.sleep(1)
    check("the list page links to the guide", ff.script("return document.querySelector('a.guide').getAttribute('href')") == "guide.html")

    ff.navigate(ff.addon_url(reg, "page/guide.html")); time.sleep(1)
    check("it opens on step 1, one step at a time", visible(ff) == ["What this is"] and progress(ff) == "Step 1 of 5", [visible(ff), progress(ff)])
    check("no step is reachable by going back from the first", ff.script("return document.getElementById('back').classList.contains('hidden')"))
    external = ff.script("return [...document.querySelectorAll('[src],link[href]')].map(e => e.src || e.href).filter(u => /^https?:/.test(u))")
    check("the guide loads nothing from the internet", external == [], external)
    text = ff.script("return document.body.textContent")
    check("it says Klin runs no gateway and that it does not make you anonymous", "Klin does not run a gateway" in text and "does not make you anonymous" in text and "can read the mail that passes" in text)

    # way 1: a service
    click(ff, "#next"); check("step 2 asks about a domain", visible(ff) == ["Which way?"] and ff.script("return document.querySelector('input[name=path]:checked').value") == "service")
    click(ff, "#next"); check("service way, step 3: two services, as plain links in a new tab",
        visible(ff) == ["Pick a service"] and ff.script("return [...document.querySelectorAll('.links a')].map(a => [a.target, a.rel].join())") == ["_blank,noopener noreferrer"] * 2 and "not an approval" in ff.script("return document.body.textContent"))
    click(ff, "#next"); check("step 4: make the first alias", visible(ff) == ["Make your first alias"] and progress(ff) == "Step 4 of 5")
    click(ff, "#next"); check("last step: write it in the list, no Next button", visible(ff) == ["Write it in your list"] and ff.script("return document.getElementById('next').classList.contains('hidden')"))
    type_into(ff, "#galias", "shop123@alias.example"); type_into(ff, "#gsite2", "shop.example"); click(ff, "#save button")
    time.sleep(0.6)
    check("saving puts it in the list", "Saved" in ff.script("return document.getElementById('savedNote').textContent") and not ff.script("return document.getElementById('savedNote').classList.contains('hidden')"))
    type_into(ff, "#galias", "not-an-address"); type_into(ff, "#gsite2", "x.example"); click(ff, "#save button")
    check("a bad address is refused with a message", "email address" in ff.script("return document.getElementById('saveError').textContent"))
    click(ff, "#back"); click(ff, "#back"); click(ff, "#back"); click(ff, "#back")
    check("Back goes all the way to step 1", visible(ff) == ["What this is"])

    # way 2: own domain
    click(ff, "#next"); ff.script("document.querySelector('input[name=path][value=domain]').click(); return true"); time.sleep(0.2)
    check("choosing a domain makes it 6 steps", progress(ff) == "Step 2 of 6", progress(ff))
    click(ff, "#next"); check("domain way, step 3: what you need", visible(ff) == ["What you need"] and "catch-all" in ff.script("return document.body.textContent"))
    click(ff, "#next"); check("step 4: switch it on, with the honest note", visible(ff) == ["Switch it on"] and "provider can see your mail" in ff.script("return document.body.textContent"))
    click(ff, "#next"); check("step 5: make an address", visible(ff) == ["Make an address for a site"])
    type_into(ff, "#domain", "nonsense"); type_into(ff, "#gsite", "https://www.Bank.example/login"); click(ff, "#make button")
    check("a bad domain gets a message and no address", not ff.script("return document.getElementById('makeError').classList.contains('hidden')") and ff.script("return document.getElementById('made').classList.contains('hidden')"))
    ff.script("document.getElementById('domain').value = ''; return true"); type_into(ff, "#domain", "@MyName.org"); click(ff, "#make button")
    check("the address for the site is made from the domain", ff.script("return document.getElementById('madeAddress').textContent") == "bank.example@myname.org", ff.script("return document.getElementById('madeAddress').textContent"))
    click(ff, "#next")
    check("the last step is already filled in", ff.script("return [document.getElementById('galias').value, document.getElementById('gsite2').value]") == ["bank.example@myname.org", "bank.example"])
    click(ff, "#save button"); time.sleep(0.6)
    ff.navigate(ff.addon_url(reg, "page/index.html")); time.sleep(1)
    rows = ff.script("return [...document.querySelectorAll('#rows tr')].map(r => [...r.children].slice(0, 2).map(c => c.textContent).join(' | '))")
    check("both addresses are in the list", sorted(rows) == ["bank.example@myname.org | bank.example", "shop123@alias.example | shop.example"], rows)

    # from the welcome page
    ff.navigate(ff.addon_url(wel, "page/index.html")); time.sleep(1)
    check("the welcome page has the card", "Protect your email" in ff.script("return document.body.textContent") and ff.script("return document.getElementById('mailMissing').classList.contains('hidden')"))
    before = ff.handles()
    click(ff, "#mailGuide")
    ff.switch_to_new_tab(before)
    time.sleep(1)
    check("the button opens the guide of the alias registry", ff.script("return location.href").endswith("page/guide.html"), ff.script("return location.href"))

    ff.navigate(ff.addon_url(reg, "page/guide.html") + "?lang=it"); time.sleep(1.2)
    it = ff.script("return document.body.textContent")
    check("the guide speaks Italian when asked", ff.script("return document.querySelector('h1').textContent") == "Proteggi la tua email" and "Passo 1 di 5" in it and "Klin non gestisce un gateway" in it)

if failures:
    print("\n%d FAILED" % len(failures)); sys.exit(1)
print("\nall passed")
