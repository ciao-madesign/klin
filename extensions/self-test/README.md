# self-test

"What a site can see" page (proposal P7): runs the checks a tracking script would run and shows the result as Protected / Exposed / Visible.

Status: **first version.** 17 checks: privacy signal, WebRTC address, device details, language and time zone, canvas, audio and font fingerprints.

- Fully local: no network requests (the WebRTC check uses no server), no storage, no permissions.
- Test: `tests/acceptance/self-test/run.sh FIREFOX_DIR` runs the page as ordinary web content and prints one line per check. Compare stock Firefox with a Klin-configured one.

Limits:
- It shows what is readable, not how rare the combination is (that needs data about other users, which Klin does not collect).
- **Open: where the page must run.** Firefox may exempt extension pages from fingerprinting protection, which would make the page report "Exposed" for things real sites cannot read. Verified so far only as web content. If extension pages are exempt, ship the page as local web content instead of a `moz-extension://` page.
- Cookie partitioning, referrer trimming and tracker blocking need a second site to be tested and are not covered.
- English only.
