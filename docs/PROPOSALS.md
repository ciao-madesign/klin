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
| P3 | Automatic cookie-banner rejection | **Blocked** | The `cookiebanners.*` prefs no longer exist in Firefox 160.0. Alternative: enable uBlock Origin's cookie-notice lists through its managed-storage policy; needs its own test (site breakage, extra list hosts) |
| P4 | DoH with provider choice, oblivious variant, ECH | **Decided** | ADR 0003: user chooses at first start; the build may set a preselected default. Needs the first-start screen (Phase 1) and a reviewed resolver list |

Prefs were verified as in `PHASE0.md`: values read back from Firefox 160.0 with `klin.js` installed. Only GPC was also checked by behaviour; the others by value.

**P5 trade-off.** OCSP tells the certificate authority (in clear HTTP) which site is being visited. CRLite checks revocation locally from data already downloaded through Remote Settings. Cost: a certificate that CRLite does not cover gets no revocation check. Confirmed by the project owner. To revisit if upstream changes CRLite coverage.

## Batch 2 – small extensions (favourites first)

| # | Proposal | Status | Notes |
|---|---|---|---|
| P8 | "Klin connections" page: every connection the browser itself makes, why, and a switch | **Step 1–2 done** | Favourite. `extensions/connections`: read-only page fed by `data/connections.json`, which also generates the table in `CONNECTIONS.md`. Page rendered and checked in Firefox 160.0 as a web page; not yet loaded as an installed extension. Step 3 (live state and switches) needs privileged code and an ADR: a WebExtension cannot read or change arbitrary prefs |
| P7 | Local self-test: what a site can see (fingerprint surface, address leaks, privacy signal) | **First version done** | Favourite. `extensions/self-test`, 17 checks, tested on stock vs Klin vs `resistFingerprinting` with `tests/acceptance/self-test`. Open: extension pages may be exempt from fingerprinting protection (see its README). Finding below |
| P6 | Strip metadata (EXIF, GPS) from files before upload | Accepted | |
| P14 | Lookalike-domain warning, compared locally with bookmarks and history | Accepted | Candidate replacement or complement for Safe Browsing (see open decisions) |
| P15 | Extension audit: warn when an update changes permissions | Accepted | |
| P16b | Downloads: quarantine and visible hash | Accepted | |
| P19 | "Site card": one panel with every per-domain setting | Accepted | |
| P20 | Shareable presets as local files, no marketplace | Accepted | |

**P7 finding (Firefox 160.0, Linux, headless).** With Klin's current prefs the self-test differs from stock in two rows only: Global Privacy Control is sent, and fewer installed fonts are detectable (5 instead of 9 of 31 tested). The canvas drawing still reads back exactly and gives the same identifier across sessions: `privacy.fingerprintingProtection=true` did not add canvas noise in this test. With `privacy.resistFingerprinting=true` the canvas is random on every read and screen size, time zone, touch and media devices are replaced by generic values. Consequence: the spec item "advanced fingerprinting protection" is not met by the Standard level as configured; to investigate (which protections `fingerprintingProtection` enables in 160.0, and what the Advanced level should switch on).

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

## Evaluated and reshaped

| Idea | Outcome |
|---|---|
| Integrated Pi-hole | **Rejected as an embedded resolver**: uBlock Origin already blocks inside the browser with more information (full URL), and a resolver would be an extra process. **Accepted as interoperability**: import Pi-hole/hosts lists (uBlock Origin reads them), export Klin lists and rules in Pi-hole format for the other devices on the network |
| Variable MAC address | **Out of scope for a browser**: the MAC never leaves the local network, sites cannot see it, and changing it needs OS privileges. Covered by P0, P1 and a help page on enabling MAC randomisation in each OS |

## Open decisions
- **Safe Browsing:** protects against phishing but contacts Google for list updates. Keep, make optional, or replace with P14. Needs an ADR.
- **Customisation vs anti-fingerprinting:** themes, fonts and extensions make a browser more recognisable. The Advanced level should restrict some customisation and say so.
