# Proposals and feature tracker

Internal list of what Klin plans to build and what has only been proposed.
The specification (`SPECIFICATION.md`) and the roadmap (`ROADMAP.md`) stay the source of truth: a proposal changes nothing until it is accepted and moved there.

## How to use this file
- **Planned features** come from the specification. Update the status when work starts or ends.
- **Proposals** are ideas under evaluation. Each one gets a row here and, if it is large, its own file in `docs/proposals/`.
- A proposal is accepted only with an ADR in `docs/adr/`. Then it is added to the specification and the roadmap, and its row moves to "Planned features".
- Rejected proposals stay listed, with the reason.

Status values: `not started` · `in progress` · `done` · `proposed` · `accepted` · `rejected`.

## Planned features (from the specification)
| Feature | Spec | Phase | Where | Status |
|---|---|---|---|---|
| Base configuration (prefs, policies) | 4.2, 4.3 | 0–1 | `config/` | in progress (verified in Phase 0) |
| Privacy Engine | 4.2 | 1 | `config/` + bundled uBlock Origin | in progress (uBlock tested; fingerprint, cookie-banner and advertising settings verified; collection log P30 built) |
| UI: tabs, workspaces, sidebar, dashboard | 4.1, 6 | 1 | `patches/` | not started |
| Security Manager | 4.5 | 1 | upstream + `config/policies` | in progress (lookalike warning P14, honest private window P22; both extensions) |
| Extension Manager | 4.6 | 1 | native WebExtensions | not started |
| Data Manager (local storage, export) | 4.9 | 1 | extensions, IndexedDB (ADR 0003) | not started |
| Search Intelligence V1 | App. A | 1–2 | `extensions/search-intelligence` | not started |
| Traffic Engine | 4.3 | 2 | `config/` + extension | not started |
| Traffic / CPU / RAM monitor | 4.3 | 2 | `extensions/traffic-monitor` (+ patch for CPU/RAM) | not started |
| Energy & Carbon Monitor | 4.4 | 2 | extension | not started |
| Automation Engine | 4.7 | 3 | `extensions/automation` | not started |
| AI Engine (local, Ollama) | 4.8 | 3 | `extensions/ai-local` | not started (Ollama verified in Phase 0) |
| Search Intelligence V2 | App. A | 3 | `extensions/search-intelligence` | not started |
| Data Footprint & Removal Manager | App. B | 3 | `extensions/data-footprint` | not started |
| Tor mode | 5 | 4 | separate module | not started |
| Android | 2 | 5 | GeckoView | not started |

Status values: `not started` · `in progress` · `done` · `proposed` · `accepted` · `rejected`.
The numbered list further down (P0–P37) uses richer values: **Done** (in the repo and verified) · **Next** · **Decided** · **Accepted** (valid, not scheduled) · **Blocked** · **Rejected**.
Owner decisions of 13 Nov 2026 are recorded in `PRINCIPLES.md` and count as acceptance; those that change the architecture (P29 levels, P32 routing) still need an ADR.

## Proposals under evaluation (one file each)
| Proposal | Received | Summary | Details | Status |
|---|---|---|---|---|
| Geographic Traffic Controller | 2026-11-12 | System-level filter for destinations in user-excluded countries: redirect to a verified alternative when one exists, otherwise block and ask the user. Minimal local log. | [`proposals/geographic-traffic-controller.md`](proposals/geographic-traffic-controller.md) | proposed, **deferred**: browser-level P32 comes first (ADR 0006, accepted) |
| Third-party lists: catalogue and import (P33, P34, P35) | 2026-11-13 | How the user gets third-party public lists (catalogue, address, file, shared set) and which candidates to offer first, with licences as found. Klin does not curate them. | [`proposals/third-party-lists.md`](proposals/third-party-lists.md) | proposed, licences to verify |

The Geographic Traffic Controller is the system-level answer to P32 below (routing and exclusion rules); P32 is the browser-level one (per-request proxy, domain and company rules). Reconciled in [ADR 0006](adr/0006-routing-and-country-rules.md) (accepted): P32 first, the system level stays a proposal.

## Numbered proposals (from the owner's ideas, the principles audit and the article)

Additions to the specification, evaluated against the founding values (`PRINCIPLES.md`). Order of work: simplest first (config → extension → patch). Nothing here changes the V1 scope until it is moved into `SPECIFICATION.md`.

Status: **Done** (in the repo and verified) · **Next** · **Accepted** (valid, not scheduled) · **Blocked** · **Rejected**.

## Batch 1 – config only

| # | Proposal | Status | Notes |
|---|---|---|---|
| P2 | Global Privacy Control, reduced cross-site referrer | **Done** | `privacy.globalprivacycontrol.enabled`, `network.http.referer.XOriginTrimmingPolicy=2`. `Sec-GPC: 1` observed on the wire |
| P5 | No OCSP lookups; rely on CRLite | **Done** | `security.OCSP.enabled=0`. CRLite is enforced by default in 160.0 (`security.pki.crlite_mode=2`). Trade-off below |
| P16a | No JavaScript inside PDFs | **Done** | `pdfjs.enableScripting=false` |
| P0 | WebRTC address-leak protection | **Done** | `media.peerconnection.ice.default_address_only`, `…proxy_only_if_behind_proxy`. Browser-side answer to the "variable MAC" idea |
| P3 | Cookie banners | **Done, in a weaker form** | Firefox's own banner rejection no longer exists in 160.0, so Klin switches on uBlock Origin's cookie-notice lists (`3rdparty` policy in `config/policies/policies.json`). They **hide** banners; they do not click "Reject". A site then sees no choice made, which for GDPR-compliant sites means no optional cookies, but it is not guaranteed. Klin's tracker blocking and cookie partitioning apply regardless. Tested with the real lists on a mock page (`tests/acceptance/cookie-banners`); real sites not tested, so breakage (e.g. pages whose scrolling is locked by a banner) is unknown |
| P4 | DoH with provider choice, oblivious variant, ECH | **Decided** | ADR 0005: user chooses at first start; the build may set a preselected default. Needs the first-start screen (Phase 1) and a reviewed resolver list |

Prefs were verified as in `PHASE0.md`: values read back from Firefox 160.0 with `klin.js` installed. Only GPC was also checked by behaviour; the others by value.

**P5 trade-off.** OCSP tells the certificate authority (in clear HTTP) which site is being visited. CRLite checks revocation locally from data already downloaded through Remote Settings. Cost: a certificate that CRLite does not cover gets no revocation check. Confirmed by the project owner. To revisit if upstream changes CRLite coverage.

## Batch 2 – small extensions (favourites first)

| # | Proposal | Status | Notes |
|---|---|---|---|
| P8 | "Klin connections" page: every connection the browser itself makes, why, and a switch | **Step 1–2 done** | Favourite. `extensions/connections`: read-only page fed by `data/connections.json`, which also generates the table in `CONNECTIONS.md`. Verified as an installed extension (`tests/acceptance/connections`). Step 3 (live state and switches) needs privileged code and an ADR: a WebExtension cannot read or change arbitrary prefs |
| P7 | Self-test: what the site you are viewing can see (fingerprint surface, address leaks, privacy signal) | **Done (v0.2)** | Favourite. `extensions/self-test`: toolbar button runs 17 checks inside the current site. Verified as an installed extension on stock vs Klin (`tests/acceptance/self-test`). Redesigned after finding that extension pages, `file://` and 127.0.0.1 are exempt from the protections being tested |
| P6 | Strip metadata (EXIF, GPS) from files before upload | **Done (v0.2)** | `extensions/photo-privacy`: JPEG and PNG, lossless, rotation kept; upload button and drag-and-drop. Pasted photos not covered: platform limit (see its README) |
| P14 | Lookalike-domain warning, compared locally with bookmarks and history | **Done (v0.1)** | `extensions/lookalike`: stops the page before it loads and shows both names with the difference highlighted. Verified in the browser with fake sites (`tests/acceptance/lookalike`). Complements Safe Browsing, does not replace it (see open decisions) |
| P15 | Extension audit: warn when an update changes permissions | **Mostly covered upstream** | Firefox already holds back an extension update that needs new permissions until the user approves it. What is left is a plain-language overview of what each extension can access; low priority, fits the Extension Manager (spec 4.6) |
| P16b | Downloads: quarantine and visible hash | Accepted | |
| P19 | "Site card": one panel with every per-domain setting | Accepted | |
| P20 | Shareable presets as local files, no marketplace | Accepted | |

**P7 finding and fix (Firefox 160.0, Linux, headless).**
- With `privacy.fingerprintingProtection=true` alone, the self-test differed from stock in two rows only: Global Privacy Control sent, fewer fonts detectable (5 instead of 9 of 31). The canvas read back exactly, with the same identifier across sessions and the same as stock.
- Cause (read in the Firefox source, `dom/canvas/CanvasUtils.cpp`): two canvas targets are on by default, `CanvasRandomization` (noise in the pixels) and `EfficientCanvasRandomization`. The efficient one is checked first and wins. It does not touch pixels: it only writes the per-site session key into exported image files (a 16-byte `deBG` PNG chunk), so a hash of `toDataURL()` changes per session but `getImageData()`, or decoding the exported file, returns the exact image. Stock Firefox behaves the same through its baseline protection.
- Fix, applied: `privacy.fingerprintingProtection.overrides = "-EfficientCanvasRandomization"`. Measured: 150–250 of 13,200 pixels changed by at most 2 levels out of 255 (not visible); the identifier differs in every session and is stable within one, so pages keep working; no other self-test row changes. Cost: reading a 1920×1080 canvas went from about 8 ms to about 11 ms.
- Not covered: WebGL canvases (not available in the headless test), real sites, other platforms. A site that legitimately reads canvas pixels (image editors) gets the same tiny noise; Firefox's per-site canvas permission removes it.
- `privacy.resistFingerprinting=true` goes further (canvas random on every read; generic screen size, time zone, touch and devices) and is the candidate for the Advanced level, at a known compatibility cost.

## Batch 3 – larger

| # | Proposal | Status | Notes |
|---|---|---|---|
| P1 | Automatic per-site containers; disposable workspaces wiped on close | Accepted | Depends on the workspaces patch |
| P9 | Adaptive eco-mode (on battery, on metered network) | Accepted | Privileged code |
| P10 | Video quality cap; avoid codecs without hardware decoding | Accepted | |
| P11 | Heavy media and remote fonts click-to-load in saving mode | Accepted | uBlock Origin per-site switches |
| P12 | Offline page archive | Accepted | |
| P13 | Green-hosting indicator from a bundled dataset | Accepted | Dataset licence to verify |
| P17 | Reproducible builds, signed updates, public component list | Accepted | Build phase |
| P18 | Dark-pattern detector | Accepted | Rules first, local AI optional |

## Batch 4 – from "Breviario di diserzione digitale" (article, 29 Oct 2026)

Inspiration for Klin's foundations. Most of its advice is about phones (advertising ID, app permissions), so on desktop it applies in part and weighs more for the Android version. Order inside the batch: simplest first.

| # | Proposal | Status | Notes |
|---|---|---|---|
| P21 | Switch off Firefox's own advertising, promotion and built-in AI | **Done** | Sponsored tiles, trending searches, recommended articles, VPN promo, add-on recommendations, SERP classification, `browser.ml.*`, smart tab groups. Values verified on 160.0; behaviour on the wire not yet observed (listed as such in the connections page). Decision to confirm: `browser.ml.*` is Firefox's local AI; Klin's own AI stays opt-in via Ollama |
| P22 | Honest private window: say plainly what it does not hide (provider, visited site, account logins), with a pointer to the self-test | **Done (v0.1), as an extension** | `extensions/private-window`. Verified in Firefox 160.0 with a real private window. Needs the `private_browsing` policy grant in the shipped build (key exists in 160, grant itself untested) |
| P6+ | Warn before upload when a photo contains GPS location, and offer to remove it | **Done (v0.1)** | Same extension: question with "Remove and continue" as default, keep, or cancel. Verified in Firefox with a real file input (`tests/acceptance/photo-privacy`) |
| P23 | Permissions that expire: location, camera, microphone and notifications "this time only" by default; automatic revoke for sites not visited in months; one page listing who can do what | Accepted | Mostly prefs/policies plus a small extension. Article, ingredient 3. Question for the user: "Allow" button wording ("Why should this site know where you are?") |
| P24 | "New identity" in one click: clears site data and regenerates per-session values (canvas key, containers), so the advertising profile starts over | Accepted | Needs P1 (containers). Article, ingredient 1 |
| P25 | Dormant-account finder: sites with a saved login not used for over a year, with deletion steps and a ready GDPR art. 17 request | Accepted | Part of the Data Footprint Manager (Appendix B). Local only, nothing shared. Article, ingredient 5 |
| P26 | Email-alias registry: which address was given to which site; aliases generated by a service the user chooses (never imposed); spam on one alias identifies who leaked it | Accepted | Local registry in the Data Footprint Manager. No Klin-run service (specification 8). Article, ingredient 2 |
| P27 | "Find me": guided search of one's own name, started by hand only, with de-indexing forms and tracking of requests | Accepted | Part of the Data Footprint Manager (GDPR art. 17 and 21; search-engine removal forms). Article, ingredient 7 |
| P38 | "Where am I registered?": check by hand where the user's own usernames (from the alias registry P26) exist, reusing the public site list of Sherlock (MIT licence), run as an extension in the browser, no Python | Accepted | Finds only; erasing uses per-site deletion pages (public lists such as JustDeleteMe, licence to check) and GDPR requests (P25, P27). Conditions: started by hand only; only names the user registers as their own; each check sends a request to the site, so the cost and exposure are stated and the route is the user's (Tor/proxy, P32); false positives are possible; nothing found for email, phone or data brokers. Needs the Sherlock list's licence and format verified before use |
| P28 | Seven-step privacy check-up on the dashboard: some steps Klin does, others guide what lies outside the browser (phone settings, social networks) | Accepted | Ties the scattered features together. Wording follows the rule below |
| P37 | Presentation page: opens once at first start, reachable again from an info button, part of the browser build | **Mechanism done; look and wording are a draft** | `extensions/welcome`. Style and tone of Klin still to be defined (decision pending) |

**Project rule from the article: every feature states what it does not do.** "Do not expect anonymity" and "not magic wands" are the honest framing. The pages built so far already follow it (limits listed in each README and on the self-test page); new features must too. Acceptance criterion for every user-facing page: a visible "what this does not protect you from" line.

## Batch 5 – from the principles audit (`PRINCIPLES.md`)

| # | Proposal | Status | Notes |
|---|---|---|---|
| P29 | Privacy levels: Standard, Advanced (`resistFingerprinting`, generic screen/time zone), Anonymous (Advanced + Tor + no persistent data) | **Decided: Standard is the default** | Advanced and Anonymous one click away; the dashboard shows the current level and what it does not hide. Advanced still to be tested on real sites for breakage |
| P30 | Collection-attempt log: per page, who tried to collect what (blocked requests, trackers, third-party cookies, beacons, three fingerprint reads), always visible | **Done (v0.1)** | `extensions/attempts-log`: badge plus popup, memory only, local. Verified with a stand-in blocker and with the real uBlock Origin 1.76.0. Only three fingerprint reads watched so far; see its README for what is not shown |
| P31 | Identity rotation to defeat profiling (fresh containers, canvas key, fingerprint values per site/session); decoy traffic as an opt-in | **Decided: rotation first; decoys opt-in, off by default** | Decoys show their energy cost. No ad-click automation. Related: P1, P24 |
| P32 | Routing and exclusion rules: per domain, company or country, send traffic through a chosen proxy/relay/Tor, or refuse it | Accepted | WebExtension `proxy` API can route per request. Klin runs no relay. Country rules are approximate (see `PRINCIPLES.md`). ADR 0006 (accepted): browser level first |
| P33 | Entity data: domain → owning company, local and public | Accepted | Dataset licences to verify (some well-known ones are non-commercial) |
| P34 | Source-quality data for Search Intelligence: independence, ownership transparency, editorial standards, with published criteria and reasons shown per result | **Decided: third-party public lists, used as published; Klin does not curate** | The flag names the list and its criterion; the user chooses the lists. Check licences first. Never silent (specification A). See `CHARTER.md` section 4 |
| P35 | Ethics list: label and down-rank sources tied to unacceptable spheres (e.g. neo-fascist organisations) | **Decided: third-party public lists, used as published; Klin does not curate** | Constraints in `PRINCIPLES.md` §7: the flag names the list and its criterion, the user chooses which lists are on, never hidden or blocked. Candidate lists to be surveyed (legal bans, media-ownership and independence observatories) |
| P36 | Charter: Klin's values and governance (who maintains lists, how entries are challenged), plus branding that makes them recognisable | **Draft written** | `CHARTER.md` is a draft built from `PRINCIPLES.md` and `STYLE.md`. The owner approves it, and decides the points marked "to confirm", before it goes into the specification |

## Batch 6 – free and open-source tools the specification first excluded (owner, 13 Nov 2026)

| # | Proposal | Status | Notes |
|---|---|---|---|
| P39 | Password manager: use **Firefox's built-in one**, configured by Klin. No new manager is written or bundled. Klin asks the user to set a primary password, switches off every feature that contacts Mozilla (breach alerts, sync), warns before a plain-text export, and offers the encrypted Klin archive (spec 4.9) to move data between devices | Accepted (Phase 1, configuration only) | Chosen as the simplest and most independent: no install, no account, local. Limit to state: **without a primary password, saved passwords can be read by anyone who can open the profile folder.** No sync across devices (Klin has no accounts). A user who already runs KeePassXC can use its add-on; Klin does not bundle it |
| P40 | **Your own VPN, in one command.** A "VPN" command (toolbar button, shortcut, command palette) that turns the user's own VPN or proxy on and off. Klin offers no VPN of its own and no default provider | Accepted (with P32, Phase 3; needs an ADR for level 2) | Level 1, no install: the user pastes a proxy address (SOCKS5 or HTTPS) once; one switch turns it on and off for the whole browser, DNS included, and traffic stops if the proxy fails. Level 2, optional: a small open-source helper starts and stops a VPN the user already set up in the operating system (WireGuard, OpenVPN, system VPN), with a fixed list of commands and no stored passwords. The browser cannot run a tunnel by itself, so level 2 needs the helper. Must say: a VPN moves trust from the provider of the connection to the VPN operator. To test: that traffic really stops when the proxy fails, and that DNS goes through it |
| P41 | Optional **scan of downloads** with ClamAV (free, open source), only if the user has it installed. Off by default, started by hand or per download | Accepted (optional, Phase 3; needs the same helper as P40 level 2) | Not an antivirus: it checks files the browser downloads, nothing else. Uses memory and needs signature updates (a download from the ClamAV project: its own ADR). Firefox already asks the operating system's antivirus about downloads on Windows and uses Safe Browsing; Klin keeps both. One shared helper, one ADR |

## Evaluated and reshaped

| Idea | Outcome |
|---|---|
| Integrated Pi-hole | **Rejected as an embedded resolver**: uBlock Origin already blocks inside the browser with more information (full URL), and a resolver would be an extra process. **Accepted as interoperability**: import Pi-hole/hosts lists (uBlock Origin reads them), export Klin lists and rules in Pi-hole format for the other devices on the network |
| Variable MAC address | **Out of scope for a browser**: the MAC never leaves the local network, sites cannot see it, and changing it needs OS privileges. Covered by P0, P1 and a help page on enabling MAC randomisation in each OS |

## Open decisions
- ~~Safe Browsing~~ decided 13 Nov: kept on, explained and switchable (see `PRINCIPLES.md`).
- **Customisation vs anti-fingerprinting:** themes, fonts and extensions make a browser more recognisable. The Advanced level should restrict some customisation and say so.
