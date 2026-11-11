# Phase 0 – Study and validation

Goal: prototype and final decision on the technical base.

## Status
| Task | Status | Notes |
|---|---|---|
| Base config: policies and prefs | Draft done | `config/policies/policies.json`, `config/prefs/klin.js`; **not yet tested** on a real Firefox build |
| Obtain upstream Firefox | Blocked | Mozilla hosts are not reachable from the current cloud environment (see below) |
| uBlock Origin test | To do | Needs Firefox; policy installs it from AMO for now, bundling to be decided |
| WebExtensions test (storage, content scripts, network stats) | To do | One minimal test extension per capability |
| Traffic/CPU/RAM/energy baseline | To do | Method below |
| Ollama integration check | To do | Local HTTP API only; verify CORS/native messaging path from an extension |
| Decide privileged-code needs | To do | Per-site CPU/RAM, SQLite, workspaces UI |

## Blocker
`archive.mozilla.org` and `product-details.mozilla.org` are refused by the session proxy. To continue, either allow those hosts in the cloud environment (plus `download.mozilla.org` and `addons.mozilla.org`) or run the Phase 0 tests on a local machine.

## Baseline method (tests/baseline)
Same device, same network, stock Firefox release. Fixed scenarios: (1) 10 reference sites, cold cache; (2) same, warm cache; (3) 30 min idle with 10 tabs open; (4) video page.
Record per scenario: bytes in/out, request count, CPU time, RSS memory, and wall-power if a meter is available.
Repeat 5 times, report median and spread. Klin is compared against this baseline only; no absolute targets before it exists.

## Questions to answer
1. Can all non-UI modules be WebExtensions? (expected: yes, except per-site CPU/RAM)
2. What is the smallest patch set for workspaces and the sidebar UI?
3. Policies/prefs vs patch for each privacy feature.
4. Which Firefox release channel to track (release, ESR) and the patch-rebase cost.
