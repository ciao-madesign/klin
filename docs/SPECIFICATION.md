# Klin – Specification (v1.0, condensed)

Free, open-source, local-first browser. Priority: privacy, low impact, security. Tor is an optional extra.

## 1. Principles (in priority order)
Maximum privacy · minimal environmental footprint · maximum security · minimal ads · minimal tracking · free · customisable · automation · local AI · extensions · Tor mode (additional).
Tor must never hurt performance, simplicity or compatibility of the standard browser.
When principles conflict, privacy wins and the cost (energy, speed, compatibility) is declared to the user. The founding principles and their audit are in `PRINCIPLES.md`.

## 2. Platforms
Windows 10/11, Linux, macOS (Gecko, V1) · Android (GeckoView, V1.5) · iOS (WebKit, V2).
No mandatory account, proprietary cloud service or subscription.

## 3. Components
Gecko, Firefox base, GeckoView, HTML/CSS/JS UI, Rust/Mozilla native pieces, SQLite, uBlock Origin, Ollama (open-weight models), WebExtensions, GitHub. Final choices depend on the Gecko version used.

## 4. Functional specification

### 4.1 UI and navigation
Unified address/search bar; vertical and horizontal tabs; named, coloured tab groups; independent workspaces (tabs, groups, contextual bookmarks, navigation rules, settings); bookmarks with nested folders; customisable dashboard; configurable shortcuts and context menus; light/dark/custom themes; configurable side panel; session restore; import/export of bookmarks, settings, workspaces.
Workspaces do not need separate security profiles (native Gecko profiles handle that).

### 4.2 Privacy Engine (on by default)
Ad, tracker and social-tracking blocking; third-party cookies blocked or partitioned; advanced fingerprinting protection; tracking-URL parameter stripping; configurable DoH; HTTPS-only; no telemetry or data collection.
Implementation: uBlock Origin, native Gecko protection, updatable filter lists, per-site cookie/storage control.
Levels: Standard (compatible) · Advanced (aggressive) · Custom. Exceptions are temporary or permanent, always visible and revocable.

### 4.3 Traffic Engine (top priority, main differentiator)
Prefetch off; preconnect limited; ads/trackers blocked; lazy-loaded images; autoplay and background video blocked; reducible animations; optimised cache reuse; automatic suspension of inactive tabs; limited background activity; centralised downloads.
Do not blindly disable JavaScript, images or requests. Provide a configurable saving mode that does not break pages.
Monitoring (local only), per session and per site: bytes in/out, requests, blocked requests, cache hits, estimated savings, CPU, memory. Estimated savings are kept distinct from measured bytes; a blocked request is not automatically saved traffic.

### 4.4 Energy & Carbon Monitor
Estimated energy, traffic, CO₂, session comparison, daily/monthly trends, standard vs saving mode. Small toolbar indicator, expandable. No external connections.

### 4.5 Security Manager
Native sandbox, site isolation, TLS verification, HTTPS-only, download protection, site and extension permission control, automatic security updates, local data protection, blocking of unauthorised extension connections.
Update cycle close to Firefox. An obsolete Gecko kept for custom changes is not acceptable.

### 4.6 Extension Manager
Firefox Add-ons first; a path for compatible Chrome extensions. Install, remove, update, enable/disable, permissions (also per domain), manual install, incompatibility checks. Native WebExtensions only; no proprietary plugin system.

### 4.7 Automation Engine
Visual rule builder for non-programmers (e.g. browser start → open workspace; domain → assign group / apply privacy rules; tab inactive → suspend; workspace close → save session; end of browsing → clear selected data; page open → reader mode; download → organise).
Rules: toggleable, editable, exportable, local, limited to explicitly granted permissions. No hidden automation that purchases, sends information or performs sensitive actions without confirmation.

### 4.8 AI Engine (optional, local)
Ollama, user-selected model. V1: page summary, translation, information extraction, multi-tab analysis, semantic search in bookmarks and history, automatic tab organisation, assisted automation creation.
No commercial API, no automatic sending of pages, manual activation, fully disableable, no startup dependency, never running continuously in the background.

### 4.9 Data Manager
All data local: bookmarks/history (Firefox, read through the browser API), workspaces/groups/automations (IndexedDB for V1, see ADR 0003; the original spec said SQLite), settings (file), cache (Gecko), extensions (profile), AI (local models), statistics (local DB).
No sync in V1. Encrypted archive export/import. No central account.

## 5. Tor mode (additional, Phase 4)
Integrated client (Tor or Arti), started and managed automatically, manual activation only, isolated profile, DNS through Tor, blocking accidental direct connections, no persistent history, session wiped on close, IP/DNS leak protection, no arbitrary extensions, dedicated anti-fingerprinting.
Must not be presented as equivalent to Tor Browser until protections are implemented and verified. Own test cycle; not required for V1.

## 6. Interface
Left sidebar (workspaces, bookmarks, groups) · central area (tabs and pages) · top bar (address, search, privacy controls) · optional side panel (AI, automation, stats).
Dashboard: search engine, bookmarks, workspaces, recent tabs/searches, privacy status, traffic stats, AI access, shortcuts. No ads, sponsored content or commercial suggestions.

## 7. Non-functional requirements
Performance not noticeably below equivalent Firefox · no unnecessary extra processes · reduced background CPU · no unnecessary proprietary connections · local data by default · timely security updates · keyboard navigation and screen reader support · modular, documented changes · open standards · offline access to local data.
Efficiency targets come after a baseline measured against stock Firefox on the same device.

## 8. Licensing and cost
Public source; no own ads, subscription, mandatory account, mandatory server, paid AI API or cloud. Verify licences of every shipped component (Firefox, uBlock Origin, AI models, libraries). Free must not compromise security updates. See LICENSING.md.

## 9. Roadmap
See ROADMAP.md.

## 10. V1 acceptance criteria
| ID | Test | Expected |
|---|---|---|
| T01 | Modern sites | Work correctly |
| T02 | Ads | Blocked |
| T03 | Trackers | Blocked |
| T04 | Proprietary telemetry | Absent |
| T05 | Workspaces | Persist correctly |
| T06 | Bookmarks | Import/export works |
| T07 | Firefox extensions | Work |
| T08 | Chrome extensions | Compatibility documented |
| T09 | Automations | Rules run |
| T10 | Ollama | Local AI works |
| T11 | Traffic | Verifiable measurement |
| T12 | Consumption | Repeatable comparison with Firefox |
| T13 | Updates | Timely security patches |
| T14 | Offline | Local data accessible |
| T15 | Costs | No mandatory paid service |

## 11. Excluded from V1
Own rendering engine, VPN, sync server, user accounts, password manager, antivirus, cloud AI, ad system, universal Chrome Web Store compatibility, full iOS version.

## 12. Risks
Hard-to-maintain Firefox changes → minimise fork · security updates → continuous upstream alignment · incompatible extensions → test and document · optimisations breaking sites → configurable profiles · AI load → optional · fingerprinting → native protections and tests · Tor insufficiently safe → separate module, independent review · maintenance cost → no proprietary infrastructure.

---

# Appendix A – Search Intelligence Engine
Controls, filters, reorders and annotates results from external search engines (Google, Bing, DuckDuckGo, Brave, Startpage…). No own search engine.

**Flow:** user searches → engine returns results → adapter recognises the engine and parses results → rules applied → modified results shown, originals still reachable.
**Implementation (desktop):** WebExtension + content scripts, one adapter per engine.

**Filtering:** hide sponsored results; exclude domains/sites/categories; reduce duplicates; filter by language and date; down-rank SEO spam.
**Reordering:** favour authoritative/primary sources, independent sites, recent content; diversify domains; down-rank mostly commercial pages; distinguish editorial, commercial, sponsored.
**Transparency:** highlight trackers on result sites; flag sponsored/affiliate content when recognisable; show position changes and reasons; restore original ranking.

**Modes:** Original · Custom (user rules) · Smart (local Ollama semantic classification, optional).
**Customisation:** create/edit rules, priorities, allow/block lists, per-engine or global, temporary disable, import/export. All local.
**Transparency rules:** never alter results silently; per modified result show original position, new position, reason, rule applied; AI classifications are labelled as estimates.
**Privacy/performance:** local processing, searches never sent to external services, AI on request only, no background analysis, lightweight.
**Compatibility:** progressive engine support; graceful degradation (unrecognised or changed page → original results, no errors); periodic compatibility checks; no interference with the engine or its protections.
**Roadmap:** V1 engine recognition, domain and sponsored filtering, dedup, custom rules, original/modified view · V2 advanced classification, source diversification, semantic filters, Ollama, quality analysis · V3 contextual rules, search profiles, smart suggestions.
**Acceptance:** works with module off; originals accessible; changes reversible and transparent; rules work offline; no cloud AI; engines stay compatible; low resource use.

---

# Appendix B – Personal Data Footprint & Removal Manager
1. **Detection:** record domains that request, receive or collect user data while browsing.
2. **Classification:** cookies, trackers, third-party requests, advertising identifiers, form data, other detectable collection.
3. **Personal registry:** searchable list of sites/services that may hold user data.
4. **Detail:** per domain, what data appears collected, when, and with what level of certainty.
5. **Removal:** start access, erasure or objection requests via specialised services or directly to data controllers.
6. **Monitoring:** log requests sent, responses and refusals.

Caveats:
- The browser sees communications, not what a site actually stores.
- Distinguish visited site, third-party service and data controller (when identifiable).
- Erasure cannot be guaranteed: it depends on controller identification, identity verification and legal grounds to retain data.
- EU reference: GDPR art. 15, 17, 21.

**Fundamental requirement:** the registry stays local and private. No service receives the visited-sites list automatically; sharing with a removal service happens only with explicit user consent.
