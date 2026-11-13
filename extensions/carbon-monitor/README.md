# carbon-monitor (Energy & Carbon Monitor)

Status: external module, pre-installed. Not developed in this repository.

Implemented by **greenweb** (Digital Footprint Counter, MIT), kept in its own repository and bundled in Klin as a Mozilla-signed, unmodified `.xpi`. Version, URL and sha256 are pinned in `build/third-party.json`; installed through `config/policies/policies.json` (`normal_installed`, so the user can remove it). See `docs/adr/0004-greenweb-preinstalled.md`.

Changes to the module belong in the greenweb repository, not here.
