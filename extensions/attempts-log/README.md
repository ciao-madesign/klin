# attempts-log

Collection log (proposal P30, principle "always flag attempts to collect information"): for the page you are on, who tried to collect information about you, and what happened to each attempt. A toolbar badge shows the total; the popup shows the detail.

Status: **working as an installed extension (v0.1).**

What is listed, per page:
- **Blocked**: requests stopped by a content blocker (uBlock Origin) or by Firefox's tracking protection, with the kind of resource (image, script, beacon...).
- **Not blocked, limited or only observed**: third-party cookies (kept apart for this site only by cookie partitioning), data sent in the background to a third party (beacons), requests Firefox itself classes as trackers, and scripts that read the browser in ways used for fingerprinting: pixels of a hidden canvas drawing, the graphics card model, an audio test. Each says which script (host name) did it, and marks the site's own scripts "this site".

Design points:
- **Kept in memory only** (`storage.session`): it disappears when Klin closes, is never written to disk and never sent. A record of the sites you visited would itself be sensitive.
- The page-side observers run in the extension's own context and wrap the page's functions (`exportFunction`): reports go straight to the extension and cannot be forged by the page, and each function still does exactly what it did. Nothing is blocked or changed by this extension.
- No third-party data and no network access of its own.

Tests: `node tests/acceptance/attempts-log/unit.js` (site-name rules), `tests/acceptance/attempts-log/run.py FIREFOX_DIR` (mock site with a tracker pixel, a beacon, a third-party cookie, a fingerprinting script and an innocent CDN script, using a stand-in blocker) and `run-ubo.py` (same site with the real uBlock Origin; needs network).

What this does not show (the popup says so too):
- What the site records on its own servers, and anything that happened before the page loaded.
- Things not observed yet: fonts, screen size, time zone, hardware details, WebRTC, battery. Only three fingerprinting reads are watched.
- A script that reads a canvas is not necessarily fingerprinting: image editors and QR generators do it too. The log reports the fact, not the intent, including for the site's own scripts.
- Categories ("advertising tracker"...) only appear when Firefox has classified the request, which needs its tracking lists; otherwise a blocked request is just "content blocker". Not tested with those lists (the test environment has no access).
- "Blocked" is deduced from the request's error code. Aborts because you left the page are ignored; an abort for another reason would be misreported. Checked with the stand-in blocker and uBlock Origin 1.76.0.
- Not tested: the graphics-card read (headless Firefox has no WebGL), restoring the log after the background page is unloaded, private windows (the extension does not run there unless allowed, so nothing is logged).
- Site names use an approximation of the public suffix rules (last two labels, three for co.uk-style names).
- English only.

Firefox details worth remembering:
- Handing an array made in the extension to a page's own function fails ("Permission denied to access property length"): arguments are passed one by one.
- Listeners must record a request synchronously: waiting before recording it let the response arrive first and the cookie entry got lost.
- A tab's badge is cleared when its page is committed, after the first requests: it is drawn again on every tab update.
- The popup's "current tab" cannot be asked from the test harness, so the popup accepts `?tab=ID`.
