# WebExtensions capability probe

Test-only extension that exercises the APIs Klin modules need, on Firefox 160.0, as Manifest V2 and V3.

```bash
tests/acceptance/webext/run.sh /path/to/firefox 2   # or 3
```
It runs two sessions on the same profile (to check persistence) against a local mock web and a mock Ollama (`server.py`). The extension is loaded as a temporary add-on through Marionette. Output: JSON report per run. Findings are in `docs/PHASE0.md`.
