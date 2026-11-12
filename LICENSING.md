# Licensing

Goal: be as permissive as possible while respecting the licenses of the projects Klin builds on.

| Part | License | Reason |
|---|---|---|
| Patches to Firefox, files derived from Firefox | MPL-2.0 (`LICENSE`) | Required by Firefox's license |
| Original code (`extensions/`, `build/`, `tests/`, tooling) | MIT | Most permissive option compatible with everything below |
| Documentation | CC BY 4.0 | Free reuse with attribution |
| greenweb / Digital Footprint Counter (bundled, unmodified, Mozilla-signed, pinned in `build/third-party.json`) | MIT | Own project, kept in a separate repository (ADR 0003) |
| uBlock Origin 1.76.0 (bundled, unmodified, pinned in `build/third-party.json`) | GPL-3.0 | Distributed alongside, not merged into other code |
| Ollama, AI models | Not distributed | Installed by the user; model licenses vary |

Rules:
- Every third-party component is listed here, with version and license, before it is bundled.
- Modifying uBlock Origin or copying its code into Klin would make that code GPL-3.0; avoid it.
- Firefox trademarks and logos must not be used (see `branding/`).
- This table is a working decision, to be verified before the first release.
