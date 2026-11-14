# ADR 0004 – greenweb as a pre-installed extension

Status: accepted

## Decision
greenweb (Digital Footprint Counter) is the Energy & Carbon Monitor module of Klin. It stays in its own repository and is pre-installed in Klin as a **Mozilla-signed, unmodified `.xpi`**, in the same way as uBlock Origin.

## Why
- Firefox release rejects unsigned permanent add-ons. Verified on Firefox 160.0: copying the `.xpi` into `distribution/extensions`, `browser/features` or `browser/extensions` does not load it.
- Signing keeps Klin on stock Firefox release: no patch, no disabled signature check (see ADR 0001, "config first, then extension, then patch").
- Keeping greenweb in its own repository keeps it usable in other browsers.

## How
1. greenweb is signed on addons.mozilla.org as **unlisted** ("On your own"), free of charge. Each version needs a new signature.
2. The signed `.xpi` is published as an asset of a GitHub release of the greenweb repository.
3. `build/third-party.json` pins version, URL and sha256; the build verifies the hash and fails on mismatch.
4. `config/policies/policies.json` installs it with `ExtensionSettings` and `"installation_mode": "normal_installed"`: present by default, the user can remove it.

## Consequences
- Updating greenweb in Klin = sign, release, update the pin. No change to greenweb's code for Klin.
- greenweb is MIT; listed in LICENSING.md.
- No new network connection at runtime: the extension has none (enforced by its CSP). The `.xpi` is fetched at build time only.
