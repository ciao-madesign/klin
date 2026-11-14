# Tests

- `acceptance/`: criteria T01–T15 (V1) and Search Intelligence criteria A.10.
- `baseline/`: reproducible traffic/CPU/RAM/energy comparison against stock Firefox on the same device.
- `tools/marionette.py`: minimal client to drive Firefox in tests (temporary install of unsigned extensions, toolbar button, scripts in pages). Works headless on Firefox 160.0.
- Each acceptance folder has a `run.py FIREFOX_DIR` that drives a real Firefox, and where the logic is separable a `unit.js` (`node`).

## What is here
| Folder | What it checks | Run |
|---|---|---|
| `tools/marionette.py` | shared client that drives Firefox | used by the `run.py` files |
| `baseline/` | traffic, CPU and RAM against stock Firefox (tools ready, measurement pending) | see its README |
| `acceptance/ubo` | uBlock Origin blocks ads and trackers on a mock page | `run.sh` |
| `acceptance/webext`, `acceptance/storage-bench` | WebExtensions capability probe (MV2/MV3) and storage benchmark (from another session) | see their READMEs |
| `acceptance/connections`, `self-test`, `lookalike`, `photo-privacy`, `private-window`, `attempts-log`, `welcome`, `username-check` | one per Klin extension | `python3 tests/acceptance/<name>/run.py FIREFOX_DIR` (also `unit.js` with node where present) |
| `acceptance/cookie-banners` | the cookie-notice lists hide banners, with the real policy | `run.py FIREFOX_DIR` (needs network; modifies `FIREFOX_DIR`, use a copy) |

Test environment: a Firefox 160.0 directory with Klin's config applied (`config/prefs/klin.js` in `browser/defaults/preferences/`, `config/policies/policies.json` in `distribution/`). See `docs/STATUS.md`, section "Set up a test Firefox".
