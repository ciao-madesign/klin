# Phase 0 – Study and validation

Goal: prototype and final decision on the technical base.

## Status
| Task | Status | Notes |
|---|---|---|
| Base config: policies and prefs | Verified on Firefox 160.0 (Linux) | Prefs load and take effect; policies load (uBlock install attempted). Details below |
| Obtain upstream Firefox | Done | Firefox 160.0 tarball downloaded and SHA-512 verified; hosts now allowed in the environment |
| uBlock Origin test | Done | v1.76.0 works; see `tests/acceptance/ubo` and findings below |
| WebExtensions test (storage, content scripts, network stats) | Done | MV2 and MV3 probe on Firefox 160.0, see findings and `tests/acceptance/webext`. Browser-driving tooling for tests: `tests/tools/marionette.py` |
| Traffic/CPU/RAM/energy baseline | Tools ready, measurement pending | `tests/baseline/tools/measure.py`; to be run on a real computer with internet (see `tests/baseline/README.md`) |
| Ollama integration check | Done | Real Ollama 0.40.16 + qwen2.5:0.5b (CPU only); see findings |
| Mozilla connections audit | Done (idle) | See `CONNECTIONS.md`: 11 destinations down to 6 |
| Storage decision (SQLite vs IndexedDB) | Done | IndexedDB for V1, see ADR 0003 and benchmark |
| Decide privileged-code needs | Partly | Per-site CPU/RAM confirmed to need a patch; workspaces UI still open |

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

- **WebExtensions probe (MV2 and MV3, Firefox 160.0).** Working: content scripts modifying pages (Search Intelligence); `webRequest` with blocking, request count and `Content-Length` per request (traffic monitor, Automation rules); `filterResponseData` present for exact byte counts; `storage.local` and IndexedDB persisting across restarts; `tabs.discard` (tab suspension); `contextualIdentities` + `cookies` with a separate cookie store per container (workspace isolation); `bookmarks`, `history`, `search`, `sidebarAction`, `tabGroups`, `tabs.group`, `declarativeNetRequest`, `scripting`, `dns`, `privacy`, `downloads`, `alarms`, `sessions`; fetch from the background page to a local Ollama-style server.
- **Missing: `browser.processes`.** Extensions cannot read per-site CPU/RAM. Confirmed: this needs privileged code (a patch) or the feature is dropped/approximated.
- **Ollama must be called from the background page**, not from content scripts: the content-script fetch was blocked by CORS in MV3 (allowed in MV2). Real Ollama also restricts allowed origins (`OLLAMA_ORIGINS`); to verify in the Ollama check.
- **MV3 caveat:** the default extension CSP includes `upload-insecure-requests`, which upgrades http to https. Not an issue for https sites; to re-check for `http://127.0.0.1` (Ollama) with the default CSP.
- **Packaging:** temporary add-ons work on the release build; permanent unsigned add-ons do not (release ignores `xpinstall.signatures.required`). Klin's own extensions will need either Mozilla signing, or installation as built-in/system extensions inside our build.
- Decision: write Klin extensions as **MV3** (event-page background); uBlock Origin remains MV2. Workspaces map to containers for cookie/storage isolation, with UI from a patch or sidebar.

- **Ollama and extensions (read from Ollama's source + simulation).** By default Ollama refuses requests that carry a browser-extension origin (`moz-extension://`): the default allowed list is only localhost/127.0.0.1/0.0.0.0 plus a few app schemes; extensions must be added with `OLLAMA_ORIGINS`. In the simulation Firefox sends no Origin on a simple GET (listing models worked) but sends `moz-extension://...` on POST, so the real calls (`/api/generate`, `/api/chat`) get HTTP 403. **Fix verified in the simulation:** the extension rewrites the Origin header of its own requests to `http://127.0.0.1` with a blocking `webRequest.onBeforeSendHeaders` listener (MV2 and MV3); after that generate returns normally. No setting on the user's side. Caveats: restrict the listener to requests made by the extension itself (the test also caught page requests); the match pattern must not contain the port (`http://127.0.0.1/*`); confirm with real Ollama; if Ollama later validates differently, fall back to documenting `OLLAMA_ORIGINS`.

- **Ollama verified for real (0.40.16, qwen2.5:0.5b, 4-core CPU, no GPU).** Confirmed on the real server: a request with an extension origin gets HTTP 403, one with origin `http://127.0.0.1` passes. The probe extension (MV3) listed models, got 403 on generate, then after rewriting its Origin header got a normal answer from the model. So the "no setting needed" workaround works with the real Ollama. The model answered a one-line summary in about 0.5 s; with `keep_alive: 0` the model is unloaded right after each answer (nothing stays in memory, server idle at about 42 MB), matching the "AI not always active" requirement. Ollama's server made no external connections during the test other than the one-time model download from `registry.ollama.ai`.
- Not yet checked: larger models and real page-summary quality/latency, Windows and macOS behaviour, what Klin does when Ollama is not installed (should show a clear "not found" message, never block startup).

- **Storage benchmark (100k rows):** SQLite in WebAssembly is faster in bulk (0.5 s vs 9 s to insert; 16 ms vs 1.2 s for text search) but lives fully in memory and saves as one big file. IndexedDB saves every change safely. Decision in ADR 0003: IndexedDB for V1 behind a storage interface, SQLite later only where needed.
- Test note: the Klin default HTTPS-only mode blocked the plain-http test server, which confirms that the setting is active; tests set an exception.

- **Baseline tool built and self-tested** (Firefox 160.0, fake local sites): it launches Firefox with a fresh profile, counts data per site through a pass-through proxy, and records requests, hosts contacted, CPU time and memory for cold cache, warm cache and idle tabs; the `klin` variant adds the Klin preferences and uBlock Origin. In the self-test the ad host was loaded in stock Firefox and blocked in the Klin variant. Early signs to verify on real sites: first page after installing uBlock used much more CPU (filter compile), and memory was higher with uBlock (about +300 MB in a headless test with 2 tabs) - this needs the real measurement before drawing conclusions.
- The same tool covers the "audit during real browsing": it records every host contacted per site, separating Mozilla's own background hosts.

## Next
the audit during real browsing, the baseline measurements, 

## Baseline method (tests/baseline)
Same device, same network, stock Firefox release. Fixed scenarios: (1) 10 reference sites, cold cache; (2) same, warm cache; (3) 30 min idle with 10 tabs open; (4) video page.
Record per scenario: bytes in/out, request count, CPU time, RSS memory, and wall-power if a meter is available.
Repeat 5 times, report median and spread. Klin is compared against this baseline only; no absolute targets before it exists.

## Questions to answer
1. Can all non-UI modules be WebExtensions? (expected: yes, except per-site CPU/RAM)
2. What is the smallest patch set for workspaces and the sidebar UI?
3. Policies/prefs vs patch for each privacy feature.
4. Which Firefox release channel to track (release, ESR) and the patch-rebase cost.
