# Principles and audit

Klin is the browser for people who want to be free and independent, with clear ethical values. These are the founding principles as stated by the project owner (13 Nov 2026), with an honest audit of where the project stands. Status: **Met** · **Partial** · **Gap** (nothing yet) · each with the proposal that closes it (see `PROPOSALS.md`).

Rule that applies to all of them: every feature states what it does not do. Klin never promises anonymity it cannot deliver.

## 1. Privacy first, anonymity by default where possible — **Partial**
Done and verified on Firefox 160.0: telemetry off, Global Privacy Control, reduced referrer, tracking parameters stripped, partitioned cookies, HTTPS-only, uBlock Origin, real canvas noise, WebRTC address protection, no OCSP lookups, no Firefox advertising.
Measured gaps (self-test, stock vs Klin): the audio fingerprint is identical to stock; time zone, screen size, processor count and system details are real; only 5 of 31 test fonts are hidden. The strong fingerprint protection (`resistFingerprinting`) is off by default. The IP address is visible to every site: DNS is in clear text (DoH off), and Tor is an optional extra (Phase 4). Safe Browsing and update checks contact Google and Mozilla.
Verdict: "tracking made harder", not yet "anonymous by default". → P29 (default level), P4 (DoH), Phase 4 (Tor).

## 2. Freedom from the algorithm — **Partial**
Blocking and partitioning make profiling harder. Missing: a visible record of every collection attempt ("always flag them") and any way to confuse profilers. → P30 (attempt log), P31 (identity rotation; decoys only as an opt-in).

## 3. Freedom of choice: route traffic, exclude countries, services and companies — **Gap**
The specification excludes VPN from V1 and puts Tor in Phase 4; there are no per-entity or per-country rules. → P32 (routing and exclusion rules), P33 (entity data).

## 4. Find your own fingerprints and erase them — **Partial (specified, not built)**
Appendix B (registry, requests under GDPR art. 15/17/21, monitoring) and the "clear data at end of browsing" automation cover it on paper. → P25, P27, Phase 3.

## 5. Aliases between digital world and identity — **Gap**
→ P26 (alias registry), P1 (containers), P24 (new identity).

## 6. Immunity from influence — **Partial**
Search Intelligence (Appendix A) specifies sponsored-result filtering, objective ranking and source diversification; Klin's own suggestions and sponsored content are now off (P21). Nothing of Search Intelligence is built. Open: who decides what counts as honest and independent. → P34 (source-quality data, open criteria).

## 7. Penalise sources tied to unacceptable spheres (e.g. neo-fascist organisations) — **Gap**
→ P35. Design constraints, to keep this consistent with free expression: labelled and down-ranked, never silently hidden or blocked; every entry has a published criterion, sources and an appeal path; lists are public, versioned and user-editable; entries are limited to documented, verifiable facts (a wrong label is a defamation risk).

## 8. Ethical approach, low ecological impact — **Partial**
Speculative traffic, autoplay and Firefox's own promotion are off. The traffic/energy monitor and the baseline against stock Firefox are not done (Phase 0 "to do", Phase 2). → P9–P13.

## 9. Promote freedom, fraternity, independence, equality, rejection of regimes, antifascism, freedom of expression — **Gap**
The specification lists technical priorities, not values. → P36 (charter and governance).

## Tensions to resolve
- **Anonymity by default vs compatibility and energy.** Strong fingerprint protection breaks some sites; Tor is slow. Proposal: an "Anonymous" level one click away, and an explicit decision on the default level.
- **Confusing profilers vs energy saving.** Fake traffic costs energy and bandwidth. Prefer rotation and separation (P31, P24, P1, P26). Decoys only as an opt-in with the energy cost shown. Ad-click automation is excluded: it harms third parties and is not ethical.
- **Values-based ranking vs freedom of expression.** Resolved by labelling and down-ranking with full transparency, never censorship.
- **Routing freedom vs "no Klin infrastructure" (specification 8).** Klin routes through relays and proxies the user chooses; it does not run any.
- **Country exclusion has technical limits.** A site's hosting country is known only from its IP address, i.e. after the connection; rules by domain and company are reliable, by country are approximate. To be stated in the feature.

## Decisions (13 Nov 2026, project owner)
1. **Default level: Standard.** Advanced (`resistFingerprinting`) and Maximum (formerly called Anonymous, renamed 13 Nov 2026: Klin never promises anonymity) stay one click away. Consequence to state openly: Klin is not anonymous by default, it makes tracking harder; the dashboard must show the current level and what it does not hide (P29).
2. **Priority order: privacy first, then low impact, then security.** When they conflict privacy wins, and the cost (energy, speed) is declared. Specification section 1 updated.
3. **Ethics and source-quality lists start from existing public third-party lists, adapted.** Every entry records where it came from, the published criterion and its source; licences are checked before use; entries are labelled and down-ranked, never hidden. The charter (P36) still has to define who reviews changes and how entries are challenged. **Governance (13 Nov 2026): now, no review body of its own: the lists are existing public ones, adapted; later, open review: anyone proposes, a group approves, every entry public with criterion, source and a way to contest it.**
4. **Decoy traffic: opt-in only, off by default**, with its energy cost shown. Rotation and separation come first (P31). No ad-click automation.
5. **Safe Browsing: kept on, explained and switchable.** The connections page says what Google can see; a real switch comes with its step 3.
6. **Firefox's own AI features stay off.** Klin's AI is opt-in and uses local Ollama.
7. **Honest private window: no Firefox patch.** An extension carries the message (P22). Keeps the number of patches at zero for now (ADR 0001).
