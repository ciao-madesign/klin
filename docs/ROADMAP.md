# Roadmap

Durations are not guaranteed. Mobile and Tor must never delay the desktop V1.

- **Phase 0 – Study and validation (2–4 weeks):** Firefox customisation study, uBlock Origin and WebExtensions tests, traffic/energy baseline, Ollama check. Output: prototype and final base decision.
- **Phase 1 – Standard browser:** UI, tabs/workspaces, bookmarks, dashboard, Privacy Engine, Extension Manager, Security Manager, local data. Also, from `PROPOSALS.md`: connections page (P8, step 3 switches), self-test (P7), lookalike warning (P14), honest private window (P22), photo-metadata warning and removal (P6, P6+), expiring permissions (P23), DoH choice at first start (P4), privacy levels (P29), collection-attempt log (P30), charter (P36).
- **Phase 2 – Low impact:** Traffic Engine, tab suspension, traffic monitor, carbon monitor, saving mode.
- **Phase 3 – Automation and AI:** Automation Engine, Ollama assistant, semantic search, Search Intelligence V2, Data Footprint Manager, including dormant accounts (P25), alias registry (P26), "Find me" (P27); "New identity" (P24, after containers P1); privacy check-up (P28); routing and exclusion rules (P32, P33); source quality and ethics lists (P34, P35, with Search Intelligence V2); identity rotation (P31).
- **Phase 4 – Tor mode.** It is the base of the "Anonymous" level (P29) and of routing rules (P32).
- **Phase 5 – Mobile:** Android (GeckoView), local sync, iOS evaluation.

Search Intelligence V1 (domain filtering, sponsored results, duplicates, rules, original/modified view) ships with Phase 1–2.
Note: AI is "Core" in the spec but scheduled in Phase 3; the roadmap wins.

The full list of proposals, their status and the reasons behind each decision is in `PROPOSALS.md`. Already done in Phase 0 because they are configuration only: P0, P2, P5, P16a, P21 (see `config/prefs/klin.js`), plus working first versions of P7, P8 and P14.
