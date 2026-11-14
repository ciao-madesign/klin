# ADR 0010 – Signing Klin's own extensions

Status: **accepted** (owner, 14 Nov 2026)

## Context
Firefox release refuses extensions that Mozilla has not signed (ADR 0004; checked on Firefox 160.0). Klin has ten extensions (`extensions/*`). Until they are signed they only run as temporary installs in tests.

## Decision
1. **Sign each extension with Mozilla as "unlisted"** (free, on addons.mozilla.org), one signature per version, as done for Greenweb. No patch and no disabled signature check (ADR 0001).
2. **The owner signs, with the owner's own account.** The API keys stay on the owner's computer, in the environment (`AMO_JWT_ISSUER`, `AMO_JWT_SECRET`); they are never written in the repository, in chat or in a cloud session. `build/sign-extensions.py` runs Mozilla's `web-ext sign` for every extension whose version has no signed file yet.
3. **Signed files are release assets, pinned like Greenweb.** The `.xpi` files are published as assets of a GitHub release of klin; `build/third-party.json` pins version, address and sha256 of each; the build checks the hash and copies them unchanged into `distribution/extensions/` (`build/bundle-third-party.py`).
4. **A new version means a new signature.** Changing any file of an extension means a new version number and a new signature; the script refuses to reuse a version.

## Consequences
- Contacts addons.mozilla.org at signing time only; the browser makes no connection for it.
- Ten extensions mean ten signatures per release; the script does them in one run.
- Done 14 Nov 2026: the owner signed all ten (version 0.1.0; self-test 0.2.0) and published them as the `extensions-0.1` pre-release; they are pinned in `build/third-party.json` and `bundle-third-party.py` installs them with Greenweb. Checked on Firefox 160.0 (`tests/acceptance/bundle`): all eleven are installed, active and signed at the first start, the welcome page opens (`runtime.onInstalled` fires for them), and `private-window@klin` is allowed in private windows through the policy (`ExtensionSettings`, `private_browsing`, no `installation_mode`, so nothing is reinstalled).
- The API keys appeared in chat twice during signing and were revoked; they never entered the repository. Next time keys go only in the owner's terminal.
- A new version of any extension means a new signature and a new release (the script skips versions already signed).
