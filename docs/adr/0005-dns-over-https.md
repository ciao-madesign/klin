# ADR 0005 – DNS over HTTPS: user choice, optional default

Status: accepted

## Context
Without DoH, DNS lookups travel in clear text: the internet provider or the Wi-Fi operator sees every site name. With DoH they are encrypted, but the chosen resolver sees them instead. Encrypted Client Hello also depends on DoH.

## Decision
- Klin does not silently pick a resolver. At first start the user chooses: a resolver from a short reviewed list, a custom one, or the system DNS.
- **Nothing is preselected** (owner, 13 Nov 2026, revises the earlier idea of a build default). The screen shows two or three options, each explained in one line: "your provider, as now" (the system DNS), a service from the short reviewed list, or one the user types in. The user must pick one; no option is applied silently. Whoever does not want to think about it can pick "as now" with no harm.
- **The screen says what changes and what does not.** With encrypted lookups the provider no longer reads the site names; the chosen service does. Trust moves, it does not disappear.
- **A proxy or VPN comes first.** When the user turns on their own proxy or VPN (P40), DNS requests must go through it. The DoH setting must never bypass it.
- Until the first-start screen exists (Phase 1), DoH stays off (`DNSOverHTTPS.Enabled: false`, unlocked) and can be enabled by hand in the settings.

## Why
Choosing a resolver moves trust to a third party; that is the user's decision, and a preselected default would make it for almost everyone, because almost nobody changes a default. One short screen keeps the choice visible without making it hard.

## Consequences
- The reviewed list needs criteria (no logging, jurisdiction, independent audit, oblivious DoH support) and its own entry in `extensions/connections/data/connections.json`.
- There is no default resolver in the build. The chosen one is stored as the user's setting (`DNSOverHTTPS.ProviderURL` once the user picks a service).
