# Build

Planned: scripts to fetch the latest upstream Firefox release, apply config, branding and patches, and package.

## Available now
- `bundle-third-party.py FIREFOX_DIR [--cache DIR]` puts the pinned third-party extensions that have `"bundle": true` in `third-party.json` (Greenweb and Klin's own ten extensions) into a Firefox directory. It downloads the signed `.xpi` (build time only, never at run time), stops with an error if its sha256 differs from the pin, copies it unchanged to `distribution/extensions/` and copies `config/policies/policies.json` to `distribution/policies.json` without a Greenweb entry (a policy entry would reinstall it at every start, so the user could not remove it; tested on Firefox 160.0). Test: `tests/acceptance/bundle`.
- `sync-shared.py`, `gen-connections-doc.py`: see their headers.

Not covered: uBlock Origin is still installed by the policy from addons.mozilla.org ("latest"), not bundled; Klin's own extensions are bundled from the signed `extensions-0.1` release (ADR 0010).
