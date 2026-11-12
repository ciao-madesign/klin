# connections

"Klin connections" page (proposal P8): every connection the browser itself makes, who receives it, why, and how to turn it off.

Status: **read-only first version.** Shows Klin's defaults, not the live state of the browser.

- `data/connections.json` is the single source for this page and for the table in `docs/CONNECTIONS.md`. After editing it, run `python3 build/gen-connections-doc.py`.
- No permissions, no network requests, no storage.
- Test: `tests/acceptance/connections/run.py FIREFOX_DIR` installs the extension, clicks the toolbar button and checks the page against the data file.
- Try it: `about:debugging` → This Firefox → Load Temporary Add-on → `manifest.json`, then click the toolbar button.

Not done yet:
- Live state and switches. A WebExtension cannot read or change arbitrary preferences; this needs privileged code and an ADR.
- Unsigned extensions cannot be installed permanently in release Firefox: the build has to ship it as a built-in add-on or get it signed.
- English only.
