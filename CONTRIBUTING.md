# Contributing

- Language: English for code, comments, issues and documentation.
- Keep changes to Firefox minimal. Prefer config, then an extension, then a patch (see ADR 0001).
- One module per folder under `extensions/`, with its own README.
- No telemetry, no external requests, no accounts. Anything that talks to the network needs an ADR.
- Original code is MIT; patches to Firefox are MPL-2.0 (see LICENSING.md).
