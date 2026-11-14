# Project status and handoff

Read this first, in any new session. It is the single place that says where the project stands, who did what and what is open. Keep it current: update it in the same commit as the work it describes. Last update: 13 Nov 2026 (style decisions).

## 1. Sessions and branches
State on 13 Nov 2026. **Everything from every branch is now merged in `claude/brave-ride-g0o4ze`** (the style session's branch). The other branches were not touched.
| Branch | What it holds | State |
|---|---|---|
| `claude/inspiring-mccarthy-prcv1e` | Default branch (Phase 0 base + `amazing-ritchie`, PR 1) | contained in this branch |
| `claude/amazing-ritchie-9835ab` | Storage benchmark, Ollama check, probe, baseline tools, GTC proposal | merged (PR 1) |
| `claude/pensive-archimedes-ahv43z` | Principles, proposals P0-P37, config, ten extensions with tests | contained in this branch |
| `claude/zealous-maxwell-vxmbwg` | greenweb ADR (renumbered 0004), `extensions/carbon-monitor` | merged here; ADR renumbered |
| `claude/brave-ride-g0o4ze` | Union of all the above, style session | **most complete line** |

Choices made while merging: the `webext` probe of the default branch was kept (it supports a real Ollama through `REAL_OLLAMA`; the other copy only differs in the mock model name). Python cache files were removed from git and ignored.

Open reconciliation: bring this branch into the default branch (pull request, only when the owner asks).

## 2. Where things live
`docs/` specification, architecture, roadmap, principles and audit (`PRINCIPLES.md`), proposals (`PROPOSALS.md`), connections audit (`CONNECTIONS.md`, generated), Phase 0 findings (`PHASE0.md`), decisions (`adr/`), this file. `config/` prefs and policies. `extensions/` one folder per module, each with a README that lists its **limits**. `tests/` acceptance tests and the shared Firefox driver. `build/` pinned third-party components, doc generator. `branding/` empty.

## 3. What is built (all verified in Firefox 160.0, Linux, headless)
| Module | Folder | Proposal | Test |
|---|---|---|---|
| Base config: telemetry, speculation, privacy, fingerprint, advertising and AI off, cookie-notice lists | `config/` | P0, P2, P3, P5, P16a, P21 | `tests/acceptance/self-test`, `cookie-banners` |
| Connections page (what the browser contacts by itself) | `extensions/connections` | P8 | `acceptance/connections` |
| Self-test: what the current site can read | `extensions/self-test` | P7 | `acceptance/self-test` |
| Lookalike-domain warning | `extensions/lookalike` | P14 | `acceptance/lookalike` (+ `unit.js`) |
| Photo privacy (upload and drop; not paste) | `extensions/photo-privacy` | P6, P6+ | `acceptance/photo-privacy` (+ `unit.js`) |
| Honest private window | `extensions/private-window` | P22 | `acceptance/private-window` |
| Collection log (badge and popup, memory only) | `extensions/attempts-log` | P30 | `acceptance/attempts-log` (+ `run-ubo.py`) |
| Presentation page, first start and info button, with the linked Klin and Greenweb page | `extensions/welcome` | P37 | `acceptance/welcome` |

Not built yet: workspaces/tabs UI, dashboard, Traffic Engine and monitors, Automation, AI, Search Intelligence, Data Footprint, Tor, mobile. Not shippable yet: see section 6.

## 4. Decisions taken (owner, 13 Nov 2026; full text in `PRINCIPLES.md`)
Standard is the default level; privacy comes first, then low impact, then security; ethics and source lists are third-party public lists used as published, chosen by the user, labelled and never hidden (Klin does not curate them); decoy traffic is opt-in and off by default; Safe Browsing stays on, explained and switchable; Firefox's own AI stays off; the honest private window is an extension (no patch). Earlier: OCSP off, DoH chosen by the user at first start with an optional preselected default (ADR 0005), a Mozilla-signed pre-installed extension model (ADR 0004).

## 5. Open questions
- **Style and tone of Klin: decided and applied on 13 Nov 2026**, see `docs/STYLE.md` and `docs/STYLE-CHANGES.md` (what was done, what remains). Existing screens use the shared style (`extensions/_shared`, copied by `build/sync-shared.py`) and have Italian and English strings. Still open: the owner's read-through of the Italian and the logo PNG exports. Decided in the style session: level names (Standard, Avanzato, Massimo), a light/dark switch and a language switch are not built yet (dark and the browser's language for now), technical readouts are translated.
- Charter (P36): **draft written** in `docs/CHARTER.md`, with the rule for the ethics and source lists: third-party lists, Klin does not curate. The owner approves it and decides the points marked "to confirm". Lists: confirmed again by the owner on 13 Nov 2026 (style session): third-party public lists as published, Klin does not curate or adapt them; any idea of an open review by Klin is only a proposal, not a commitment.
- Geographic Traffic Controller (system level) versus P32 (browser level): answered by ADR 0006 (**accepted**, owner, 13 Nov 2026): P32 first, the system level stays a proposal.
- Privacy levels (P29): measured on Firefox 160.0 (Linux, headless, `tests/acceptance/self-test`, 14 Nov 2026): `privacy.resistFingerprinting=true` changes four rows against Klin Standard: screen and window size (generic 1200x600, pixel ratio 2), touch (declares 5 points), time zone (fixed UTC) and canvas (random on every read); processor cores, languages, fonts, audio and system name did not change in this test. The granular route (`privacy.fingerprintingProtection.overrides`) can switch targets on and off one by one: screen size and touch can be left real; `+JSDateTimeUTC` fixes the time zone; `+CanvasRandomization` alone gave no difference from Standard (Standard already alters the canvas read-out). The owner said screen size need not be hidden and a fixed time zone is acceptable, and then chose "hide only the canvas drawing", which in practice makes Advanced almost the same as Standard. To settle (decision 13 of the style session). Then try the result on real sites and write the ADR.
- The resolver list for DoH: no default and nothing preselected (decided 13 Nov 2026, ADR 0005). Decided 14 Nov 2026: four options (Quad9, Mullvad DNS, Cloudflare 1.1.1.1, keep the current one), each with an explanation of what it implies; draft in `docs/proposals/dns-resolvers.md`. Still to do before the screen ships: check every sentence about a service against its primary documents (so far only secondary pages and the operators' own blogs were read).
- Languages: Italian and English now, in `_locales` of each extension; more later with human-reviewed machine translation.

## 6. Pitfalls found (read before changing things)
- **Unsigned extensions cannot be installed permanently in Firefox release.** Every Klin extension must be signed (unlisted, free) or the build must use another route; see ADR 0004. Until then they only run as temporary installs in tests. Consequences not yet tested: whether `runtime.onInstalled` fires at the first start for built-in extensions (the presentation page depends on it); the `private_browsing` policy grant (the honest private window depends on it).
- Prefs go in `browser/defaults/preferences/`, not `defaults/pref/`.
- Extension pages, `file://` and bare IP addresses are exempt from fingerprinting protection and from uBlock Origin's cosmetic filters: test under a real-looking host name (the tests use a local server as proxy).
- Content scripts: a view over a page's buffer cannot be sliced; arrays made in the extension cannot be passed to a page's function; DataTransfer data set by the extension is unreadable by the page (build the event in `world: "MAIN"`); a script cannot build a paste event with files; a tab's badge is cleared on page commit; record a request synchronously, before its answer can arrive.
- Headless Firefox cannot hold files on the clipboard or take an external drag, and has no WebGL.
- Settings that replace a whole list (uBlock Origin `toOverwrite.filterLists`) must repeat the defaults; re-check on each uBlock Origin update.

## 7. Working rules
English for code and documentation. Config first, then extension, then patch (ADR 0001). No telemetry, no external requests, no accounts; anything that talks to the network needs an ADR. Every user-facing feature states what it does not do. Report what was and was not tested; do not claim more. Commits end with the attribution lines of the session; no pull request unless the owner asks. The owner prefers short, non-technical answers in Italian.

## 8. Set up a test Firefox
```bash
curl -O https://archive.mozilla.org/pub/firefox/releases/160.0/linux-x86_64/en-US/firefox-160.0.tar.xz   # check its SHA-512 against .../releases/160.0/SHA512SUMS
tar xf firefox-160.0.tar.xz && mv firefox klin-ff
mkdir -p klin-ff/browser/defaults/preferences klin-ff/distribution
cp config/prefs/klin.js klin-ff/browser/defaults/preferences/ && cp config/policies/policies.json klin-ff/distribution/
python3 tests/acceptance/self-test/run.py klin-ff        # example
```
Some tests rewrite `distribution/policies.json`: use a copy. Network in the cloud environment: `raw.githubusercontent.com` and `addons.mozilla.org` are reachable, `ublockorigin.github.io` is not.

## 9. Next steps (suggested order)
1. Finish the style follow-ups listed in `docs/STYLE-CHANGES.md` (Italian read-through, technical readouts, language switch, logo PNGs).
2. Privacy levels (P29): try Advanced on real sites, write the ADR.
3. Signing and distribution of the extensions (ADR), test `onInstalled` and the private-window grant in the signed build.
4. Connections page step 3 (live state and switches; needs privileged code, ADR).
5. Dashboard and workspaces (Phase 1), then Phase 2 monitors.
