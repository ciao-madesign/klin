# photo-privacy

Photo privacy (proposals P6 and P6+): when you choose a photo with a site's upload button, Klin checks it before the site sees it. If it carries your location or other hidden data, you decide: remove it, keep it, or cancel the upload.

Status: **working as an installed extension (v0.1).**

- Looks for: GPS location, camera/phone model, date and time, author or owner name, device serial numbers, editing software, comments, XMP/IPTC data, data appended after the picture.
- **Location found** → a question, with "Remove and continue" as the default answer. **Other hidden data only** → removed, with a short notice. **Nothing found** → the file passes through byte for byte.
- Removal never re-encodes the picture: image data is copied unchanged, so there is no quality loss. The rotation is kept, so photos do not turn sideways.
- The site hears about the selection only after the decision. The question lives in a closed shadow root and answers only to real user input, so scripts in the page cannot read or answer it.
- Fully local: files are read in memory; nothing is sent or stored. No permissions other than running in pages.

Tests: `node tests/acceptance/photo-privacy/unit.js` (35 checks on the metadata logic) and `tests/acceptance/photo-privacy/run.py FIREFOX_DIR` (real file input in Firefox; cleaned photos are decoded with an independent library to confirm they are still valid and carry no location).

What this does not do (the same text is shown to the user):
- Only files chosen with the upload button. **Not covered yet: photos dragged into the page or pasted** (many sites use these).
- Only JPEG and PNG. Not WebP, HEIC, TIFF, RAW or video.
- Files over 40 MB are passed through unchecked. Damaged files are left as they are.
- It cannot tell what a site does with a photo you keep, and cannot hide what the picture itself shows.
- PNG rotation data is removed with the rest (rarely used).
- If the check itself fails, the user is told and the original selection goes through, so an error never blocks an upload. This path is not covered by the automated test.
- No settings yet ("always remove", per-site rules): to come with the site card (P19).
- English only.

Firefox detail worth remembering: a view over a buffer returned by the page's `File.arrayBuffer()` cannot be sliced from a content script ("Permission denied to access property constructor"), so the bytes are copied into a buffer owned by the extension first.
