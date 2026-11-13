# ADR 0003 – Local data storage: IndexedDB first, SQLite later if needed

Status: accepted for V1 (changes the "SQLite" entries of the specification, section 4.9)

## Context
The spec lists SQLite for workspaces, tab groups, automations and statistics. Extensions cannot use SQLite natively; it would have to be shipped as WebAssembly (sql.js 1.16.0, MIT) or provided by privileged browser code. IndexedDB is built into Firefox.

## Test (Firefox 160.0, 4-core CPU, `tests/acceptance/storage-bench`)
100,000 "history-like" rows, same data and same queries.

| Operation | IndexedDB | SQLite (WASM) |
|---|---|---|
| Insert 100k rows | 9.1 s | 0.5 s |
| 100 lookups by site | 23 ms | 2 ms |
| Latest 50 entries | 1 ms | under 1 ms |
| Text search over all titles | 1.2 s | 16 ms |
| Export everything (about 15 MB) | 0.9 s | 0.02 s |
| Encrypt the export (AES-GCM) | 78 ms | 71 ms |
| Saved to disk | each change is saved by itself | whole file (15 MB) rewritten in about 0.1 s; must be rewritten to persist |

## Decision
- V1 uses **IndexedDB**, behind a small storage interface of our own, so the engine can change without touching the modules.
- Reason: SQLite is faster at bulk work, but the WASM version keeps the whole database in memory and saves it as one file. A crash between saves loses data, and rewriting a large file on every change costs energy and disk, against the project goals. IndexedDB saves each change safely and needs no extra component.
- The volumes Klin really stores are small: workspaces, rules, daily statistics per site. Firefox already keeps the browsing history and bookmarks; Klin reads them through the browser API. At this size the speed difference does not matter.
- The encrypted export archive is simple with either engine (about 75 ms for 15 MB).

## When to revisit
If a feature needs heavy bulk data or fast text search, for example the semantic search index for AI, switch that part to SQLite with disk-backed storage (OPFS) or privileged code. The interface above makes this a local change.
