# privacy-level

Chooses the privacy level (P29, ADR 0007). Opens from its toolbar button.

Status: **v0.1, working and verified in Firefox 160.0** (system time zone New York).

- **Standard** (default): changes nothing; Klin's configuration applies.
- **Advanced**: hides your time zone. Pages see UTC. It does **not** hide screen size, touch, languages, processor count, fonts or the audio fingerprint (the owner's definition: time zone only).
- **Maximum**: shown, disabled ("not available yet"): full protection plus Tor, and Tor is not part of Klin yet. Never called "anonymous".
- Each level says what it does, what it does not hide and what it costs. The line under the level name is on the page.
- Advanced works by registering a script that runs in every page and frame before the page's scripts (`timezone.js`). Removing the extension removes it.

## What it does not do
- No level makes you anonymous: sites see your IP address; your provider sees which sites you visit.
- **Advanced is an approximation done inside the page**, because an extension cannot set Firefox's own fixed-time-zone protection (ADR 0007). A page that looks hard can notice it; background workers are not covered; `Temporal` only returns the zone name.
- It does not undo what a site already learned, and it applies to pages loaded after the change.
- Needs access to all sites (to run the script in them). It reads nothing and sends nothing.

## Not verified
- Behaviour on real sites (no access from the build environment; the owner decided no site test is needed before release; the cost is stated on the page).
- That the level survives a browser restart (registration is persistent and re-applied at start-up; only install, switch and removal were run).
- Strings are English only, no `_locales` yet.

## Test
`python3 tests/acceptance/privacy-level/run.py FIREFOX_DIR`: 21 checks. It starts Firefox with the system time zone America/New_York and checks, in the page's own context and in a frame, what a page sees at each level.
