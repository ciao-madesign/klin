# Storage benchmark

IndexedDB vs SQLite (sql.js, WebAssembly) on 100,000 history-like rows, inside a Firefox extension. Needs Node/npm (fetches sql.js, MIT).

```bash
tests/acceptance/storage-bench/run.sh /path/to/firefox
```
Results and decision: `docs/adr/0003-local-storage.md`.
