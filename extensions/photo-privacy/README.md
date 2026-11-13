# photo-privacy

Photo privacy (proposals P6 and P6+): when you choose a photo with a site's upload button, or drop one into the page, Klin checks it before the site sees it. If it carries your location or other hidden data, you decide: remove it, keep it, or cancel the upload.

Status: **working as an installed extension (v0.2): upload button and drag-and-drop.**

- Looks for: GPS location, camera/phone model, date and time, author or owner name, device serial numbers, editing software, comments, XMP/IPTC data, data appended after the picture.
- **Location found** → a question, with "Clean and continue" as the default answer. **Other hidden data only** → removed, with a short notice. **Nothing found** → the file passes through byte for byte.
- Removal never re-encodes the picture: image data is copied unchanged, so there is no quality loss. The rotation is kept, so photos do not turn sideways.
- The site hears about the selection only after the decision. The question lives in a closed shadow root and answers only to real user input, so scripts in the page cannot read or answer it.
- Fully local: files are read in memory; nothing is sent or stored. No permissions other than running in pages.

Tests: `node tests/acceptance/photo-privacy/unit.js` (35 checks on the metadata logic) and `tests/acceptance/photo-privacy/run.py FIREFOX_DIR` (real file input in Firefox; cleaned photos are decoded with an independent library to confirm they are still valid and carry no location). **Drops are tested with synthetic events** (a headless Firefox cannot take a real drag from outside): a temporary copy of the extension treats them as real, the shipped build is checked to ignore them. A real drag with a mouse has not been tested.

What this does not do (the same text is shown to the user):
- **Pasted photos are not covered, and cannot be with the tools Firefox gives extensions:** a script can build a paste event only without files, so a pasted photo, once held back, could not be handed to the site again. Photos copied from inside a browser are re-encoded without metadata anyway; photos copied from a file manager keep it. A "stop and explain" behaviour is possible but untestable in a headless browser, so it is not shipped.
- A drop onto a page that does not handle it: if the photo has hidden data and you answer, the browser's own action (opening the file) no longer happens.
- Only JPEG and PNG. Not WebP, HEIC, TIFF, RAW or video.
- Files over 40 MB are passed through unchecked. Damaged files are left as they are.
- It cannot tell what a site does with a photo you keep, and cannot hide what the picture itself shows.
- PNG rotation data is removed with the rest (rarely used).
- If the check itself fails, the user is told and the original selection goes through, so an error never blocks an upload. This path is not covered by the automated test.
- No settings yet ("always remove", per-site rules): to come with the site card (P19).
- English only.

How a drop is handled: the event is held back, then `main.js` (which runs in the page's own context, `world: MAIN`) builds a new drop event with the final files. This split is needed because data put into a `DataTransfer` by the extension's isolated script belongs to another principal, and the site would see no files and no text.

Firefox details worth remembering: a view over a buffer returned by the page's `File.arrayBuffer()` cannot be sliced from a content script ("Permission denied to access property constructor"), so the bytes are copied into a buffer owned by the extension first.
