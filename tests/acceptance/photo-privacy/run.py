#!/usr/bin/env python3
"""Photo privacy acceptance run: installs extensions/photo-privacy, attaches photos to a real
<input type=file> and checks what the page receives. Photos dropped into the page are tested in a second
session, with synthetic events, because a headless Firefox cannot take a drag from outside. For that session only, a temporary copy of the extension treats synthetic events
as real ones (the single changed condition is `event.isTrusted`); the shipped build is separately
checked to ignore them.

    run.py FIREFOX_DIR

Needs node and Pillow (an independent decoder, to check that cleaned photos are still valid).
"""
import base64, http.server, io, pathlib, shutil, subprocess, sys, tempfile, threading, time

from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parents[3]
sys.path.insert(0, str(ROOT / "tests/tools"))
from marionette import Firefox

PORT = 8893
PAGE = b"""<!doctype html><title>upload</title><input type=file id=f multiple><div id=zone style="height:60px;border:1px dashed">drop here</div>
<script>
window.__log = []; window.__zone = [];
async function describe(files) {
  const out = [];
  for (const file of files) {
    const buf = new Uint8Array(await file.arrayBuffer()); let bin = "";
    for (const b of buf) bin += String.fromCharCode(b);
    out.push({ name: file.name, type: file.type, b64: btoa(bin) });
  }
  return out;
}
const zone = document.getElementById("zone");
zone.addEventListener("dragover", (e) => e.preventDefault());
zone.addEventListener("drop", async (e) => {
  const source = e.dataTransfer, text = source.getData("text/plain"), prevented = e.defaultPrevented;
  window.__zone.push({ type: "drop", files: await describe(source.files), text, prevented });
});
// Sends a synthetic drop carrying one file (and some text) to the zone.
window.__send = (kind, b64, name, mime) => {
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  const transfer = new DataTransfer();
  transfer.setData("text/plain", "caption");
  transfer.items.add(new File([bytes], name, { type: mime }));
  zone.dispatchEvent(new DragEvent("drop", { bubbles: true, cancelable: true, dataTransfer: transfer }));
};
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


# ---- photos dropped into the page (second session) ---------------------------------------------------
b64 = {n: base64.b64encode(original[n]).decode() for n in ("gps.jpg", "clean.jpg")}
zone_log = lambda ff: ff.script("return window.__zone")
overlay = lambda ff: ff.script("return document.documentElement.children.length")


def run_session(extension_dir, label, checks):
    with Firefox(sys.argv[1], prefs={"dom.security.https_only_mode": False}) as ff:
        ff.install_addon(extension_dir)
        ff.navigate("http://127.0.0.1:%d/" % PORT)
        checks(ff)


def untrusted_events_ignored(ff):
    ff.script("window.__send('drop', arguments[0], 'gps.jpg', 'image/jpeg')", [b64["gps.jpg"]]); time.sleep(1)
    log = zone_log(ff)
    check("shipped build: a script-made drop is not intercepted", len(log) == 1 and base64.b64decode(log[0]["files"][0]["b64"]) == original["gps.jpg"] and overlay(ff) == 2, (len(log), overlay(ff)))


def transfers(ff):
    for kind in ("drop",):
        ff.script("window.__zone = []")
        ff.script("window.__send(arguments[0], arguments[1], 'gps.jpg', 'image/jpeg')", [kind, b64["gps.jpg"]]); time.sleep(1.5)
        check("%s of a photo with location: the site hears nothing while the question is open" % kind, zone_log(ff) == [] and overlay(ff) == 3, (zone_log(ff), overlay(ff)))
        ff.press(ff.ENTER); time.sleep(2)
        log = zone_log(ff)
        check("%s, Remove: the site gets one %s event" % (kind, kind), len(log) == 1 and log[0]["type"] == kind, log and [e["type"] for e in log])
        if log:
            data = base64.b64decode(log[0]["files"][0]["b64"])
            size, orientation, gps, make = exif_of(data)
            check("%s, Remove: valid picture, no location or model, rotation kept" % kind, size == (8, 8) and not gps and make is None and orientation == 6, (size, gps, make, orientation))
            check("%s, Remove: the text that came with it is kept" % kind, log[0]["text"] == "caption", log[0]["text"])

        ff.script("window.__zone = []")
        ff.script("window.__send(arguments[0], arguments[1], 'gps.jpg', 'image/jpeg')", [kind, b64["gps.jpg"]]); time.sleep(1.5)
        ff.press(ff.TAB, ff.ENTER); time.sleep(2)
        log = zone_log(ff)
        check("%s, Keep: the site gets the original file" % kind, len(log) == 1 and base64.b64decode(log[0]["files"][0]["b64"]) == original["gps.jpg"])

        ff.script("window.__zone = []")
        ff.script("window.__send(arguments[0], arguments[1], 'gps.jpg', 'image/jpeg')", [kind, b64["gps.jpg"]]); time.sleep(1.5)
        ff.press(ff.ESCAPE); time.sleep(1.5)
        check("%s, Cancel: the site hears nothing" % kind, zone_log(ff) == [])

        ff.script("window.__zone = []")
        ff.script("window.__send(arguments[0], arguments[1], 'clean.jpg', 'image/jpeg')", [kind, b64["clean.jpg"]]); time.sleep(0.5)
        log = zone_log(ff)
        check("%s of a clean photo: delivered at once, no question" % kind, len(log) == 1 and base64.b64decode(log[0]["files"][0]["b64"]) == original["clean.jpg"] and overlay(ff) == 2, (len(log), overlay(ff)))


run_session(ROOT / "extensions/photo-privacy", "shipped", untrusted_events_ignored)
variant = pathlib.Path(tempfile.mkdtemp()) / "photo-privacy"
shutil.copytree(ROOT / "extensions/photo-privacy", variant)
source = (variant / "content.js").read_text()
assert source.count("event.isTrusted") == 2, "the test variant expects exactly two `event.isTrusted` checks"
(variant / "content.js").write_text(source.replace("event.isTrusted", "true"))
run_session(variant, "variant", transfers)

sys.exit("%d check(s) failed" % len(failures) if failures else 0)
