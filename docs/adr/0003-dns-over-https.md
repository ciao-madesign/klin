# ADR 0003 – DNS over HTTPS: user choice, optional default

Status: accepted

## Context
Without DoH, DNS lookups travel in clear text: the internet provider or the Wi-Fi operator sees every site name. With DoH they are encrypted, but the chosen resolver sees them instead. Encrypted Client Hello also depends on DoH.

## Decision
- Klin does not silently pick a resolver. At first start the user chooses: a resolver from a short reviewed list, a custom one, or the system DNS.
- The build can define a **default resolver**, preselected on that screen and applied if the user skips it, so a simple setup stays possible. It is empty for now.
- Until the first-start screen exists (Phase 1), DoH stays off (`DNSOverHTTPS.Enabled: false`, unlocked) and can be enabled by hand in the settings.

## Why
Choosing a resolver moves trust to a third party; that is the user's decision. A preselected default keeps the simple path for users who do not want to decide.

## Consequences
- The reviewed list needs criteria (no logging, jurisdiction, independent audit, oblivious DoH support) and its own entry in `extensions/connections/data/connections.json`.
- The default resolver is one value in `config/policies/policies.json` (`DNSOverHTTPS.ProviderURL`).
