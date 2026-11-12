# self-test

"What can this site see?" (proposal P7): click the toolbar button on any site and Klin runs, inside that site, the checks a tracking script would run. Results are shown as Protected / Exposed / Visible.

Status: **working as an installed extension.** 17 checks: privacy signal, WebRTC address, device details, language and time zone, canvas, audio and font fingerprints.

- The checks run in the page's own context (`scripting.executeScript`, world `MAIN`). This is required: Firefox exempts extension pages from fingerprinting protection, and gives no canvas noise on `file://` or 127.0.0.1, so a test run anywhere else reports things real sites cannot read (verified on 160.0).
- Permissions: `activeTab` (the one tab you clicked on, only after the click) and `scripting`. No network requests (the WebRTC check uses no server), no storage.
- `page/checks.js` is the injected function and must stay self-contained.
- Test: `tests/acceptance/self-test/run.py FIREFOX_DIR` installs the extension, opens a test site, clicks the button and prints one line per check. Compare stock Firefox with a Klin-configured one.

Limits:
- It shows what is readable, not how rare the combination is (that needs data about other users, which Klin does not collect).
- Browser pages and a few protected sites (e.g. addons.mozilla.org) cannot be tested; the page says so.
- The tested page could tamper with the checks, since they run in its context. This only affects what is displayed.
- Cookie partitioning, referrer trimming and tracker blocking need a second site and are not covered.
- English only.
