# Feature proposals

Additions to the specification, evaluated against the founding values: privacy, untraceability, energy saving, security, ethics, customisation.
Order of work: simplest first (config → extension → patch). Nothing here changes the V1 scope until it is moved into `SPECIFICATION.md`.

Status: **Done** (in the repo and verified) · **Next** · **Accepted** (valid, not scheduled) · **Blocked** · **Rejected**.

## Batch 1 – config only

| # | Proposal | Status | Notes |
|---|---|---|---|
| P2 | Global Privacy Control, reduced cross-site referrer | **Done** | `privacy.globalprivacycontrol.enabled`, `network.http.referer.XOriginTrimmingPolicy=2`. `Sec-GPC: 1` observed on the wire |
| P5 | No OCSP lookups; rely on CRLite | **Done** | `security.OCSP.enabled=0`. CRLite is enforced by default in 160.0 (`security.pki.crlite_mode=2`). Trade-off below |
| P16a | No JavaScript inside PDFs | **Done** | `pdfjs.enableScripting=false` |
| P0 | WebRTC address-leak protection | **Done** | `media.peerconnection.ice.default_address_only`, `…proxy_only_if_behind_proxy`. Browser-side answer to the "variable MAC" idea |
| P3 | Cookie banners | **Done, in a weaker form** | Firefox's own banner rejection no longer exists in 160.0, so Klin switches on uBlock Origin's cookie-notice lists (`3rdparty` policy in `config/policies/policies.json`). They **hide** banners; they do not click "Reject". A site then sees no choice made, which for GDPR-compliant sites means no optional cookies, but it is not guaranteed. Klin's tracker blocking and cookie partitioning apply regardless. Tested with the real lists on a mock page (`tests/acceptance/cookie-banners`); real sites not tested, so breakage (e.g. pages whose scrolling is locked by a banner) is unknown |
| P4 | DoH with provider choice, oblivious variant, ECH | **Decided** | ADR 0003: user chooses at first start; the build may set a preselected default. Needs the first-start screen (Phase 1) and a reviewed resolver list |

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
| P22 | Honest private window: say plainly what it does not hide (provider, visited site, account logins), with a link to the self-test | **Next, as an extension** | Decided 13 Nov: no Firefox patch. An extension shows the message when a private window opens |
| P6+ | Warn before upload when a photo contains GPS location, and offer to remove it | **Done (v0.1)** | Same extension: question with "Remove and continue" as default, keep, or cancel. Verified in Firefox with a real file input (`tests/acceptance/photo-privacy`) |
| P23 | Permissions that expire: location, camera, microphone and notifications "this time only" by default; automatic revoke for sites not visited in months; one page listing who can do what | Accepted | Mostly prefs/policies plus a small extension. Article, ingredient 3. Question for the user: "Allow" button wording ("Why should this site know where you are?") |
| P24 | "New identity" in one click: clears site data and regenerates per-session values (canvas key, containers), so the advertising profile starts over | Accepted | Needs P1 (containers). Article, ingredient 1 |
| P25 | Dormant-account finder: sites with a saved login not used for over a year, with deletion steps and a ready GDPR art. 17 request | Accepted | Part of the Data Footprint Manager (Appendix B). Local only, nothing shared. Article, ingredient 5 |
| P26 | Email-alias registry: which address was given to which site; aliases generated by a service the user chooses (never imposed); spam on one alias identifies who leaked it | Accepted | Local registry in the Data Footprint Manager. No Klin-run service (specification 8). Article, ingredient 2 |
| P27 | "Find me": guided search of one's own name, started by hand only, with de-indexing forms and tracking of requests | Accepted | Part of the Data Footprint Manager (GDPR art. 17 and 21; search-engine removal forms). Article, ingredient 7 |
| P28 | Seven-step privacy check-up on the dashboard: some steps Klin does, others guide what lies outside the browser (phone settings, social networks) | Accepted | Ties the scattered features together. Wording follows the rule below |

**Project rule from the article: every feature states what it does not do.** "Do not expect anonymity" and "not magic wands" are the honest framing. The pages built so far already follow it (limits listed in each README and on the self-test page); new features must too. Acceptance criterion for every user-facing page: a visible "what this does not protect you from" line.

## Batch 5 – from the principles audit (`PRINCIPLES.md`)

| # | Proposal | Status | Notes |
|---|---|---|---|
| P29 | Privacy levels: Standard, Advanced (`resistFingerprinting`, generic screen/time zone), Anonymous (Advanced + Tor + no persistent data) | **Decided: Standard is the default** | Advanced and Anonymous one click away; the dashboard shows the current level and what it does not hide. Advanced still to be tested on real sites for breakage |
| P30 | Collection-attempt log: per site, who tried to collect what (trackers, fingerprint reads, cookies, referrers), always visible | Accepted | Reuses the uBlock Origin and Traffic monitor data; local only. Self-test already shows what is readable |
| P31 | Identity rotation to defeat profiling (fresh containers, canvas key, fingerprint values per site/session); decoy traffic as an opt-in | **Decided: rotation first; decoys opt-in, off by default** | Decoys show their energy cost. No ad-click automation. Related: P1, P24 |
| P32 | Routing and exclusion rules: per domain, company or country, send traffic through a chosen proxy/relay/Tor, or refuse it | Accepted | WebExtension `proxy` API can route per request. Klin runs no relay. Country rules are approximate (see `PRINCIPLES.md`) |
| P33 | Entity data: domain → owning company, local and public | Accepted | Dataset licences to verify (some well-known ones are non-commercial) |
| P34 | Source-quality data for Search Intelligence: independence, ownership transparency, editorial standards, with published criteria and reasons shown per result | **Decided: start from existing public lists, adapted** | Record origin, criterion and source per entry; check licences first. Never silent (specification A). Governance in P36 |
| P35 | Ethics list: label and down-rank sources tied to unacceptable spheres (e.g. neo-fascist organisations) | **Decided: start from existing public lists, adapted** | Constraints in `PRINCIPLES.md` §7: published criteria and sources, appeal path, user-editable, never hidden or blocked. Candidate sources to be surveyed (legal bans, media-ownership and independence observatories) |
| P36 | Charter: Klin's values and governance (who maintains lists, how entries are challenged), plus branding that makes them recognisable | Accepted | Seed: `PRINCIPLES.md`. Needs the owner's approval before it goes into the specification |

## Evaluated and reshaped

| Idea | Outcome |
|---|---|
| Integrated Pi-hole | **Rejected as an embedded resolver**: uBlock Origin already blocks inside the browser with more information (full URL), and a resolver would be an extra process. **Accepted as interoperability**: import Pi-hole/hosts lists (uBlock Origin reads them), export Klin lists and rules in Pi-hole format for the other devices on the network |
| Variable MAC address | **Out of scope for a browser**: the MAC never leaves the local network, sites cannot see it, and changing it needs OS privileges. Covered by P0, P1 and a help page on enabling MAC randomisation in each OS |

## Open decisions
- ~~Safe Browsing~~ decided 13 Nov: kept on, explained and switchable (see `PRINCIPLES.md`).
- **Customisation vs anti-fingerprinting:** themes, fonts and extensions make a browser more recognisable. The Advanced level should restrict some customisation and say so.
