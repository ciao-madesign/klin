# privacy-level

Chooses how strongly Klin hides what sites use to recognise your device (P29, ADR 0006). Opens from its toolbar button.

Status: **v0.1, working and verified in Firefox 160.0.**

- **Standard** (default): touches nothing; Klin's configuration applies.
- **Advanced**: turns on Firefox's strong fingerprint protection (`privacy.resistFingerprinting`) through the `privacy` API. Measured effect: generic screen size, generic time zone, random canvas read-out. Not covered: audio fingerprint, processor count, installed fonts.
- **Anonymous**: shown but disabled ("not available yet"): it needs Tor, which Klin does not have.
- Each level shows what it does, what it does **not** hide, and what it costs.
- The setting belongs to this extension while installed; removing the extension hands it back (tested).

## What it does not do
- No level makes you anonymous: sites see your internet address, your provider sees which sites you visit. Said on the page.
- It does not close the audio, processor and font gaps (see ADR 0006).
- It does not undo what a site already learned.

## Not verified
- **Breakage on real sites** (no network access to them from the build environment); the cost text comes from how the protection is documented.
- That the level survives a browser restart (it is re-applied at start-up, but only the install and removal paths were run).
- Behaviour on a real display (touch points, pixel ratio were seen in headless Firefox).

## Test
`python3 tests/acceptance/privacy-level/run.py FIREFOX_DIR`: 16 checks (page, default level, Advanced on and off, what a site sees, remembered choice, Anonymous refused, removal hands the setting back).
