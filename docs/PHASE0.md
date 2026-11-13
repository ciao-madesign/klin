# Phase 0 – Study and validation

Goal: prototype and final decision on the technical base.

## Status
| Task | Status | Notes |
|---|---|---|
| Base config: policies and prefs | Verified on Firefox 160.0 (Linux) | Prefs load and take effect; policies load (uBlock install attempted). Details below |
| Obtain upstream Firefox | Done | Firefox 160.0 tarball downloaded and SHA-512 verified; hosts now allowed in the environment |
| uBlock Origin test | Done | v1.76.0 works; see `tests/acceptance/ubo` and findings below |
| WebExtensions test (storage, content scripts, network stats) | Started | Test tooling in place (`tests/tools/marionette.py`); page-context script injection verified by the self-test. Storage and network stats still to do |
| Traffic/CPU/RAM/energy baseline | To do | Method below |
| Ollama integration check | To do | Local HTTP API only; verify CORS/native messaging path from an extension |
| Mozilla connections audit | Done (idle) | See `CONNECTIONS.md`: 11 destinations down to 6 |
| Decide privileged-code needs | To do | Per-site CPU/RAM, SQLite, workspaces UI |

## Findings (Firefox 160.0, release 2026-11-10; ESR is 153.7)
- **Prefs location matters.** `klin.js` must be installed in `browser/defaults/preferences/`. In `defaults/pref/` the browser's own defaults override it (telemetry studies, tab unloading and speculative connect stayed at upstream values). Verified: all 13 sampled prefs take the Klin value from the right folder.
- **Policies** in `distribution/policies.json` are loaded; the uBlock Origin install was attempted. It failed only because the test run could not reach AMO through the sandbox proxy, so the install itself is still untested.
- **Firefox still talks to Mozilla** even with telemetry off. The audit in `CONNECTIONS.md` cut 11 idle destinations to 6 with prefs and one policy; what remains is security-related (updates, Remote Settings, Safe Browsing, add-on updates).
- Marionette could not run scripts in headless mode at first; prefs were checked with a temporary autoconfig file instead (test-only, not part of Klin). Later solved: `tests/tools/marionette.py` drives headless Firefox 160.0, including temporary installs of unsigned extensions (chrome-context scripts need `MOZ_REMOTE_ALLOW_SYSTEM_ACCESS=1`).

- **uBlock Origin 1.76.0** (Mozilla-signed, GPL-3.0, MV2, bundled filter lists): installs from a local `.xpi` through the policy (`install_url` as `file://`). On a mock page with 8 third-party ad/tracker requests, Firefox without uBlock loaded all 8, with uBlock 0; first-party content loaded. A first-party `/ads/banner.js` was not blocked (generic filters are conservative).
- Test caveat: hosts on Firefox's HSTS preload list (e.g. google-analytics.com) are upgraded to https and cannot be tested with the plain-http mock; real-site tests need HTTPS and a different harness.
- uBlock adds connections to filter-list hosts (see `CONNECTIONS.md`). Decision: keep updates enabled.
- Manifest V2: uBlock Origin stays on MV2 in Firefox, which Mozilla still supports; this is a long-term risk to track.
- **Canvas fingerprinting: upstream default is not enough; fixed by one pref.** `privacy.fingerprintingProtection=true` left canvas pixel read-out exact, because the default `EfficientCanvasRandomization` target overrides real noise. Klin now sets `privacy.fingerprintingProtection.overrides="-EfficientCanvasRandomization"`; verified with `tests/acceptance/self-test`. Details in `PROPOSALS.md` (P7 finding and fix). Test pages must be opened under a real-looking host name, not 127.0.0.1.
- **Firefox's own advertising and AI features** (sponsored tiles, trending searches, recommendations, VPN promo, `browser.ml.*`) were still on with Klin's earlier prefs; switched off (P21), values verified, wire behaviour to be confirmed in a browsing-time audit.
- **Cookie-notice lists** are not bundled with uBlock Origin (remote only, off by default) and are meant to be used together: "EasyList – Cookie Notices" (`fanboy-cookiemonster`) plus the uBlock complement (`ublock-cookies-easylist`). The `3rdparty` policy (`toOverwrite.filterLists`) switches them on, but it replaces the whole list selection, so Klin's policy repeats uBlock Origin 1.76.0's defaults: re-check on each uBlock Origin update. uBlock Origin does not apply cosmetic filters to bare IP addresses (test sites need a host name).

## Next
WebExtensions tests, the audit during real browsing, the baseline measurements, the Ollama check.

## Baseline method (tests/baseline)
Same device, same network, stock Firefox release. Fixed scenarios: (1) 10 reference sites, cold cache; (2) same, warm cache; (3) 30 min idle with 10 tabs open; (4) video page.
Record per scenario: bytes in/out, request count, CPU time, RSS memory, and wall-power if a meter is available.
Repeat 5 times, report median and spread. Klin is compared against this baseline only; no absolute targets before it exists.

## Questions to answer
1. Can all non-UI modules be WebExtensions? (expected: yes, except per-site CPU/RAM)
2. What is the smallest patch set for workspaces and the sidebar UI?
3. Policies/prefs vs patch for each privacy feature.
4. Which Firefox release channel to track (release, ESR) and the patch-rebase cost.
