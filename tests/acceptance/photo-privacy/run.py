#!/usr/bin/env python3
"""Photo privacy acceptance run: installs extensions/photo-privacy, attaches photos to a real
<input type=file> and checks what the page receives.

    run.py FIREFOX_DIR

Needs node and Pillow (an independent decoder, to check that cleaned photos are still valid).
"""
import base64, http.server, io, pathlib, subprocess, sys, tempfile, threading, time

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

PORT = 8893
PAGE = b"""<!doctype html><title>upload</title><input type=file id=f multiple>
<script>
window.__log = [];
for (const type of ["input", "change"]) f.addEventListener(type, async () => {
  const out = [];
  for (const file of f.files) {
    const buf = new Uint8Array(await file.arrayBuffer()); let bin = "";
    for (const b of buf) bin += String.fromCharCode(b);
    out.push({ name: file.name, type: file.type, b64: btoa(bin) });
  }
  window.__log.push({ type, files: out });
});
</script>"""


class Site(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200); self.send_header("Content-Type", "text/html"); self.end_headers(); self.wfile.write(PAGE)
    def log_message(self, *args): pass


failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " — " + str(detail)))
    if not ok: failures.append(label)


def received(ff):
    return ff.script("return window.__log")


def reset(ff):
    ff.script("window.__log = []; document.getElementById('f').value = '';")


def exif_of(data):
    image = Image.open(io.BytesIO(data)); image.load()
    exif = image.getexif()
    return image.size, exif.get(0x0112), bool(exif.get_ifd(0x8825)), exif.get(0x010F)


tmp = pathlib.Path(tempfile.mkdtemp())
subprocess.run(["node", str(pathlib.Path(__file__).with_name("make-fixtures.js")), str(tmp)], check=True)
original = {n: (tmp / n).read_bytes() for n in ("gps.jpg", "clean.jpg", "text.png", "note.txt")}

server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Site)
threading.Thread(target=server.serve_forever, daemon=True).start()

with Firefox(sys.argv[1], prefs={"dom.security.https_only_mode": False}) as ff:
    ff.install_addon(ROOT / "extensions/photo-privacy")
    ff.navigate("http://127.0.0.1:%d/" % PORT)
    field = ff.find("#f")
    check("source photo really has a location and a model (independent decoder)", exif_of(original["gps.jpg"]) == ((8, 8), 6, True, "AcmeCam"), exif_of(original["gps.jpg"]))

    # A. photo with location: held back until the user answers; "Remove" is the default answer
    ff.send_keys(field, str(tmp / "gps.jpg")); time.sleep(1.5)
    check("A: the site hears nothing while the question is open", received(ff) == [], received(ff))
    ff.press(ff.ENTER); time.sleep(1.5)
    log = received(ff)
    check("A: then it gets one 'input' and one 'change'", [e["type"] for e in log] == ["input", "change"], [e["type"] for e in log])
    if log:
        data = base64.b64decode(log[0]["files"][0]["b64"])
        size, orientation, gps, make = exif_of(data)
        check("A: still a valid picture of the same size", size == (8, 8), size)
        check("A: location and model are gone", not gps and make is None and b"AcmeCam" not in data, (gps, make))
        check("A: rotation is kept", orientation == 6, orientation)
        check("A: file name and type are kept", log[0]["files"][0]["name"] == "gps.jpg" and log[0]["files"][0]["type"] == "image/jpeg")

    # B. "Keep as is"
    reset(ff); ff.send_keys(field, str(tmp / "gps.jpg")); time.sleep(1.5)
    ff.press(ff.TAB, ff.ENTER); time.sleep(1.5)
    log = received(ff)
    check("B: keeping gives the site the original file, byte for byte", bool(log) and base64.b64decode(log[0]["files"][0]["b64"]) == original["gps.jpg"])

    # C. Escape cancels the upload
    reset(ff); ff.send_keys(field, str(tmp / "gps.jpg")); time.sleep(1.5)
    ff.press(ff.ESCAPE); time.sleep(1.5)
    check("C: cancel: the site hears nothing and the selection is empty", received(ff) == [] and ff.script("return document.getElementById('f').files.length") == 0)

    # D. photo without hidden data: passes through unchanged, no question
    reset(ff); ff.send_keys(field, str(tmp / "clean.jpg")); time.sleep(2)
    log = received(ff)
    check("D: clean photo arrives unchanged", bool(log) and base64.b64decode(log[0]["files"][0]["b64"]) == original["clean.jpg"])

    # E. hidden data but no location: removed without asking, with a notice
    reset(ff); ff.send_keys(field, str(tmp / "text.png")); time.sleep(2)
    log = received(ff)
    if log:
        data = base64.b64decode(log[0]["files"][0]["b64"])
        check("E: PNG text removed without a question", b"Jane Doe" not in data and Image.open(io.BytesIO(data)).size == (8, 8))
    else:
        check("E: PNG arrived", False)

    # F. not an image: untouched
    reset(ff); ff.send_keys(field, str(tmp / "note.txt")); time.sleep(1)
    log = received(ff)
    check("F: text file untouched", bool(log) and base64.b64decode(log[0]["files"][0]["b64"]) == original["note.txt"])

    # G. the page cannot answer for the user
    reset(ff); ff.send_keys(field, str(tmp / "gps.jpg")); time.sleep(1.5)
    ff.script("""document.dispatchEvent(new KeyboardEvent('keydown', {key: 'Enter', bubbles: true}));
                 for (const el of document.querySelectorAll('*')) { if (el.shadowRoot) el.shadowRoot.querySelector('button').click(); }""")
    time.sleep(1)
    check("G: scripts in the page cannot reach or click the question", received(ff) == [], received(ff))

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
