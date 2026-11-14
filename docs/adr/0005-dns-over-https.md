# ADR 0005 – DNS over HTTPS: user choice, optional default

Status: accepted

## Context
Without DoH, DNS lookups travel in clear text: the internet provider or the Wi-Fi operator sees every site name. With DoH they are encrypted, but the chosen resolver sees them instead. Encrypted Client Hello also depends on DoH.

## Decision
- Klin does not silently pick a resolver. At first start the user chooses: a resolver from a short reviewed list, a custom one, or the system DNS.
- **Nothing is preselected** (owner, 13 Nov 2026, revises the earlier idea of a build default). The screen shows **four options** (owner, 14 Nov 2026): Quad9, Mullvad DNS, Cloudflare 1.1.1.1, and "keep your current one" (the system DNS, as now). Each carries a short plain explanation of **what it implies**, drafted in `proposals/dns-resolvers.md`. A small link lets the user type in another service. The user must pick one; no option is applied silently. Whoever does not want to think about it can pick "keep your current one" with no harm.
- **The screen says what changes and what does not.** With encrypted lookups the provider no longer reads the site names; the chosen service does. Trust moves, it does not disappear.
- **A proxy or VPN comes first.** When the user turns on their own proxy or VPN (P40), DNS requests must go through it. The DoH setting must never bypass it.
- Until the first-start screen exists (Phase 1), DoH stays off (`DNSOverHTTPS.Enabled: false`, unlocked) and can be enabled by hand in the settings.

## Why
Choosing a resolver moves trust to a third party; that is the user's decision, and a preselected default would make it for almost everyone, because almost nobody changes a default. One short screen keeps the choice visible without making it hard.

## Consequences
- The list needs criteria, and each service's line must state them truthfully. **Decided 14 Nov 2026 (replaces the strict gate of 13 Nov):** the three services are offered even though not all meet every criterion (Cloudflare keeps sampled logs). The criteria stop being a gate and become **the facts shown for each service** (logging, operator and country, independent examination, sale of data). Nothing may be shown as fact before it is checked against the service's own primary documents. Candidates and what is still to verify: `proposals/dns-resolvers.md`. The criteria (no logging, jurisdiction, independent audit, oblivious DoH support) and its own entry in `extensions/connections/data/connections.json`.
- There is no default resolver in the build. The chosen one is stored as the user's setting (`DNSOverHTTPS.ProviderURL` once the user picks a service).
