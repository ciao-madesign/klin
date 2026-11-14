# Project status and handoff

Read this first, in any new session. It is the single place that says where the project stands, who did what and what is open. Keep it current: update it in the same commit as the work it describes. Last update: 13 Nov 2026.

## 1. Sessions and branches
| Branch | What it holds | State |
|---|---|---|
| `claude/inspiring-mccarthy-prcv1e` | **Default branch.** Phase 0 base plus the merged work of `amazing-ritchie`: storage benchmark and ADR 0003 (IndexedDB for V1), Ollama check, WebExtensions probe, baseline tools (`tests/baseline/tools`), the Geographic Traffic Controller proposal | reference line |
| `claude/amazing-ritchie-9835ab` | Source of the above | merged (PR 1) |
| `claude/zealous-maxwell-vxmbwg` | greenweb as the pre-installed Energy & Carbon Monitor (an ADR numbered 0003, to renumber to 0004), `extensions/carbon-monitor`, a second copy of the WebExtensions probe (`tests/acceptance/webext`) | **not merged**; its ADR number clashes, its `webext` files differ slightly from the default branch's |
| `claude/pensive-archimedes-ahv43z` | Principles and audit, proposals P0–P37, config changes, ten extensions with tests (below), decisions of the owner. **Merged the default branch on 13 Nov** so it contains everything above except `zealous-maxwell` | current work, pushed |

Open reconciliations: (1) merge `zealous-maxwell` and renumber its ADR; (2) decide with the owner which `webext` probe to keep; (3) merge or rebase this branch into the default branch (pull request, only when the owner asks).

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
| Presentation page, first start and info button | `extensions/welcome` | P37 | `acceptance/welcome` |
| Alias registry (which alias went to which site, who leaked it) | `extensions/alias-registry` | P26 | `acceptance/alias-registry` (+ `unit.js`) |
| Username check: where a username exists (Sherlock site list, pinned) | `extensions/username-check` | P38 | `acceptance/username-check` (+ `unit.js`) |

Not built yet: workspaces/tabs UI, dashboard, Traffic Engine and monitors, Automation, AI, Search Intelligence, Data Footprint, Tor, mobile. Not shippable yet: see section 6.

## 4. Decisions taken (owner, 13 Nov 2026; full text in `PRINCIPLES.md`)
Standard is the default level; privacy comes first, then low impact, then security; ethics and source lists start from existing public lists, adapted, labelled and never hidden; decoy traffic is opt-in and off by default; Safe Browsing stays on, explained and switchable; Firefox's own AI stays off; the honest private window is an extension (no patch). Earlier: OCSP off, DoH chosen by the user at first start with an optional preselected default (ADR 0005), a Mozilla-signed pre-installed extension model (ADR 0004 on the other branch).

## 5. Open questions
- **Style and tone of Klin** (voice, language, visual identity, name and tagline, logo): not defined. Being worked in a separate session: see `docs/handoff/STYLE-SESSION.md`. Until then all wording is a plain English draft and the look is provisional.
- Governance of the ethics and source lists (who reviews, how entries are challenged): the charter (P36).
- Geographic Traffic Controller (system level) versus P32 (browser level): one ADR.
- Privacy levels (P29): the Advanced level must be tried on real sites.
- The resolver list for DoH.
- Which languages Klin ships in (all text is English today).

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
1. Style and tone session (separate), then apply it to the pages and write `docs/STYLE.md`.
2. Privacy levels (P29): try Advanced on real sites, write the ADR.
3. Signing and distribution of the extensions (ADR), test `onInstalled` and the private-window grant in the signed build.
4. Connections page step 3 (live state and switches; needs privileged code, ADR).
5. Dashboard and workspaces (Phase 1), then Phase 2 monitors.
