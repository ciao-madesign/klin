# Klin

**Privacy first. Low impact. Local intelligence.**

Klin is a free, open-source, local-first desktop browser built on Firefox (Gecko).
It minimises network traffic, energy use and tracking, with no accounts, no cloud and no telemetry.

> Status: **Phase 0 – study and validation.** Nothing is usable yet.

## Approach
Klin is **not** a fork of the Firefox source tree. This repository only contains what customises Firefox:

| Layer | Folder | Purpose |
|---|---|---|
| Configuration | `config/` | Preferences, enterprise policies, privacy levels |
| Branding | `branding/` | Name, icons, themes |
| Patches | `patches/` | Minimal patches to Firefox, kept as few as possible |
| Built-in extensions | `extensions/` | One WebExtension per module |
| Build | `build/` | Scripts that fetch upstream Firefox and apply the above |
| Tests | `tests/` | Acceptance criteria (T01–T15) and baseline vs. stock Firefox |

This keeps Klin aligned with upstream security releases, which is a hard requirement.

## Documentation
See [`docs/`](docs/): [specification](docs/SPECIFICATION.md), [principles and audit](docs/PRINCIPLES.md), [proposals](docs/PROPOSALS.md), [architecture](docs/ARCHITECTURE.md), [roadmap](docs/ROADMAP.md), [decisions](docs/adr/).

## License
See [LICENSING.md](LICENSING.md).
