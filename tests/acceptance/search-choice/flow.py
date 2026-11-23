#!/usr/bin/env python3
"""First-start flow: with the DNS step switched on (a temporary copy of the extension with KLIN_DNS_READY = true),
the choice page has two steps: search engine, then DNS service; Back works; Done shows a summary and keeps both choices.
With the real extension (DNS not ready) there is one step and no step counter.

    flow.py FIREFOX_DIR [screenshot-dir]
"""
import base64, pathlib, shutil, sys, tempfile, time

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)))
    if not ok: failures.append(label)

shots = pathlib.Path(sys.argv[2]) if len(sys.argv) > 2 else None
def shot(ff, name):
    if not shots: return
    data = ff.cmd("WebDriver:TakeScreenshot", {"full": True})
    value = data.get("value") if isinstance(data, dict) else data
    (shots / name).write_bytes(base64.b64decode(value))

work = pathlib.Path(tempfile.mkdtemp()) / "newtab"
shutil.copytree(ROOT / "extensions/newtab", work)
dns = work / "page/dns.js"
dns.write_text(dns.read_text().replace("KLIN_DNS_READY = false", "KLIN_DNS_READY = true"))

with Firefox(sys.argv[1]) as ff:
    ext = ff.install_addon(work)
    time.sleep(3)
    ff.navigate(ff.addon_url(ext, "page/choose.html?lang=en")); time.sleep(1.5)
    check("step 1 of 2 is the search engine", "Step 1 of 2" in ff.script("return document.getElementById('step').textContent"))
    check("the button says Next", ff.script("return document.getElementById('go').textContent") == "Next")
    shot(ff, "step1.png")
    ff.script("document.getElementById('form').requestSubmit();"); time.sleep(1)
    check("step 2 of 2 is the DNS service", "Step 2 of 2" in ff.script("return document.getElementById('step').textContent"))
    names = ff.script("return [...document.querySelectorAll('#dns h2')].map((h) => h.textContent)")
    check("three DNS options, 'keep your current one' last", names == ["Quad9", "Cloudflare 1.1.1.1", "Keep your current one"], names)
    check("nothing is imposed: no service is preselected except 'current'", ff.script("return document.querySelector('#dns input:checked').value") == "current")
    check("the button says Done", ff.script("return document.getElementById('go').textContent") == "Done")
    shot(ff, "step2.png")
    ff.script("document.getElementById('back').click();"); time.sleep(.5)
    check("Back returns to step 1", "Step 1 of 2" in ff.script("return document.getElementById('step').textContent"))
    ff.script("document.getElementById('form').requestSubmit();"); time.sleep(.8)
    ff.script("document.querySelector('#dns input[value=\"quad9\"]').click(); document.getElementById('form').requestSubmit();"); time.sleep(1)
    summary = ff.script("return document.getElementById('saved').textContent")
    check("Done shows a summary of both choices", "Ecosia" in summary and "Quad9" in summary, summary)
    saved = ff.async_script("const done = arguments[arguments.length - 1]; browser.storage.local.get(['engine','dns']).then(done);")
    check("both choices are kept", saved.get("dns") == "quad9" and saved.get("engine"), saved)
    ff.navigate(ff.addon_url(ext, "page/choose.html?lang=it")); time.sleep(1.5)
    check("Italian: the step counter and the button are translated", "Passo 1 di 2" in ff.script("return document.getElementById('step').textContent") and ff.script("return document.getElementById('go').textContent") == "Avanti")

# the real extension: one step, no counter
with Firefox(sys.argv[1]) as ff:
    ext = ff.install_addon(ROOT / "extensions/newtab")
    time.sleep(3)
    ff.navigate(ff.addon_url(ext, "page/choose.html?lang=en")); time.sleep(1.5)
    check("DNS not ready: one step, no counter, the button says Continue", ff.script("return document.getElementById('step').hidden") and ff.script("return document.getElementById('go').textContent") == "Continue")

print("%d check(s) failed" % len(failures) if failures else "all checks passed")
sys.exit(1 if failures else 0)
