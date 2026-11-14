# Build

Planned: scripts to fetch the latest upstream Firefox release, apply config, branding and patches, and package.

## Available now
- `bundle-third-party.py FIREFOX_DIR [--cache DIR]` puts the pinned third-party extensions that have `"bundle": true` in `third-party.json` (today: Greenweb) into a Firefox directory. It downloads the signed `.xpi` (build time only, never at run time), stops with an error if its sha256 differs from the pin, copies it unchanged to `distribution/extensions/`, and writes `distribution/policies.json` = `config/policies/policies.json` + an `ExtensionSettings` entry (`normal_installed`: present by default, the user can remove it). Test: `tests/acceptance/bundle`.
- `sync-shared.py`, `gen-connections-doc.py`: see their headers.

Not covered: uBlock Origin is still installed by the policy from addons.mozilla.org ("latest"), not bundled; the Klin extensions themselves are not signed yet.
