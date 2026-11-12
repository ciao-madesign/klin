# Architecture

Klin = stock Firefox (latest release channel) + `config/` + `branding/` + `patches/` + `extensions/`.

## Modules and how they are implemented

| Module | Implementation |
|---|---|
| Privacy Engine | Firefox prefs/policies + bundled uBlock Origin |
| Traffic Engine | Prefs (prefetch, autoplay, tab unloading) + extension for lazy loading and limits |
| Traffic / CPU / RAM monitor | Extension for network stats; privileged code (patch) for per-site CPU/RAM |
| Energy & Carbon Monitor | Extension; values are model-based **estimates**, never measurements |
| Security Manager | Upstream Gecko sandbox, TLS, auto-update; policies for permissions |
| Extension Manager | Native WebExtensions; Chrome compatibility documented, not promised |
| Automation Engine | Extension with visual rule editor; sensitive actions require confirmation |
| AI Engine | Extension talking to local Ollama only; opt-in, never required at startup |
| Search Intelligence | Extension: content scripts + one adapter per search engine; falls back to original results |
| Data Footprint & Removal | Extension; local registry; GDPR art. 15/17/21 request generator; no automatic sharing |
| Workspaces, vertical tabs, sidebar | Patch to browser UI (privileged) |
| Tor mode (Phase 4) | Separate module, isolated profile, own test cycle |

## Verified in Phase 0 (Firefox 160.0)
All modules except per-site CPU/RAM can be WebExtensions (MV3). Workspaces can use containers for isolation. See PHASE0.md.

## Open points (to decide in Phase 0)
- Storage: decided, IndexedDB for V1 (ADR 0003).
- Per-site CPU/RAM: which privileged API to use.
- Tor client: C tor vs Arti.
- Distinguishing visited site, third-party service and data controller in the Footprint registry.

## Principle
Config first, then extension, then patch. Every patch needs an ADR and must be rebased on each upstream release.
