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
| Privacy Engine | 4.2 | 1 | `config/` + bundled uBlock Origin | in progress (uBlock tested in Phase 0) |
| UI: tabs, workspaces, sidebar, dashboard | 4.1, 6 | 1 | `patches/` | not started |
| Security Manager | 4.5 | 1 | upstream + `config/policies` | not started |
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

## Proposals
| Proposal | Received | Summary | Details | Status |
|---|---|---|---|---|
| Geographic Traffic Controller | 2026-11-12 | System-level filter for destinations in user-excluded countries: redirect to a verified alternative when one exists, otherwise block and ask the user. Minimal local log. | [`proposals/geographic-traffic-controller.md`](proposals/geographic-traffic-controller.md) | proposed, not scheduled |
