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
| P8 | "Klin connections" page: every connection the browser itself makes, why, and a switch | **Step 1–2 done** | Favourite. `extensions/connections`: read-only page fed by `data/connections.json`, which also generates the table in `CONNECTIONS.md`. Verified as an installed extension (`tests/acceptance/connections`). Step 3 (live state and switches) needs privileged code and an ADR: a WebExtension cannot read or change arbitrary prefs |
| P7 | Self-test: what the site you are viewing can see (fingerprint surface, address leaks, privacy signal) | **Done (v0.2)** | Favourite. `extensions/self-test`: toolbar button runs 17 checks inside the current site. Verified as an installed extension on stock vs Klin (`tests/acceptance/self-test`). Redesigned after finding that extension pages, `file://` and 127.0.0.1 are exempt from the protections being tested |
| P6 | Strip metadata (EXIF, GPS) from files before upload | Accepted | |
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

## Evaluated and reshaped

| Idea | Outcome |
|---|---|
| Integrated Pi-hole | **Rejected as an embedded resolver**: uBlock Origin already blocks inside the browser with more information (full URL), and a resolver would be an extra process. **Accepted as interoperability**: import Pi-hole/hosts lists (uBlock Origin reads them), export Klin lists and rules in Pi-hole format for the other devices on the network |
| Variable MAC address | **Out of scope for a browser**: the MAC never leaves the local network, sites cannot see it, and changing it needs OS privileges. Covered by P0, P1 and a help page on enabling MAC randomisation in each OS |

## Open decisions
- **Safe Browsing:** protects against phishing but contacts Google for list updates. Keep, make optional, or replace with P14. Needs an ADR.
- **Customisation vs anti-fingerprinting:** themes, fonts and extensions make a browser more recognisable. The Advanced level should restrict some customisation and say so.
