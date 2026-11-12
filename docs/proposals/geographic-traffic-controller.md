# Proposal – Geographic Traffic Controller (V1 technical specification)

Status: **proposed, not scheduled.** Received 2026-11-12. Not part of the specification or the roadmap. Needs an ADR before any work starts (see "Open points for Klin").

Module name: `Klin Geographic Traffic Controller` (also "Geographic IP Filter").

The feature does not simply block connections to excluded countries. It first tries to route traffic to an alternative destination, when a technically valid one exists. If it cannot, it asks the user whether to authorise that specific connection, with a non-intrusive notice.

Knowing an alternative IP does not mean a connection can be moved to it. The alternative must be compatible with the domain, the TLS certificate, the requested service and the server configuration. Redirection must be verified, never simulated.

## 1. Goal and principles
The feature must:
1. Identify destination IPs associated with excluded countries.
2. Search automatically for a compatible alternative destination.
3. Redirect traffic when a verifiable alternative exists.
4. Notify the user when redirection is not possible.
5. Let the user authorise the connection as an exception.
6. Record every interruption, redirection and authorisation.
7. Keep all data local, with manual export.

Non-negotiable principles:
- Filtering at operating-system level.
- No inspection of the content of communications.
- No collection of full URLs, credentials or content.
- No connection data sent to external servers.
- No redirection to unverified infrastructure.
- No connection to an excluded country without explicit user authorisation.
- No promise of absolute geographic protection with VPNs, proxies or unidentifiable destinations.

## 2. Architecture
```
Klin UI (configuration · notices · log · export)
        │
Geographic Traffic Controller (coordinates network decisions)
        │
 ┌──────────────┬──────────────────────┬────────────────┬──────────────┐
 GeoIP Engine    Alternative Resolver   System Filter    Event Logger
 (IP → country)  (alternative           (block and       (minimal local
                  destinations)          redirect)        log)
        │
Network traffic of the whole device (all applications and services the filter supports)
```

### Alternative Resolver
The component that makes this more than a geographic firewall. It must:
- search for other IPs associated with the same domain;
- check the geolocation of the alternative IPs and exclude those in blocked countries;
- verify that the connection keeps the original domain and the correct TLS identity;
- return an alternative only when all checks pass;
- otherwise hand over to the user-authorisation flow.

It must not invent alternative IPs, change the domain arbitrarily or use unknown proxy servers.

## 3. Automatic redirection strategy
Three levels, in priority order.

**Level A – DNS alternative for the same domain (first choice).** When a domain returns several IPs, select those in non-blocked countries and keep the original domain for TLS.
Requirements: do not change the requested domain, alter the certificate, disable certificate verification or change the request content; verify that the alternative server answers correctly.
Limit: works only if the service really offers a compatible alternative endpoint. Not every domain has interchangeable IPs.

**Level B – Routing through an alternative proxy (optional).** If there is no direct alternative IP, use a proxy explicitly configured and authorised by the user.
Conditions: proxy not in an excluded country; encrypted connection; certificate of the final service verified; no TLS inspection; no unknown public proxies; no automatic use of free proxies found online.
The proxy changes the network path, not necessarily the location of the final server.

**Level C – No alternative (authorisation required).** The connection is interrupted and a notice is shown. The user may authorise that single connection or keep it blocked. The connection must stay blocked while waiting for the answer.

## 4. Traffic interception and domain resolution
Two complementary mechanisms.

### 4.1 DNS Controller
- Receives the system's DNS requests.
- Keeps a temporary domain/IP mapping.
- Queries the GeoIP Engine.
- Removes IPs in blocked countries from answers when usable alternatives exist, and returns the allowed ones.
- Reports domains with no alternative to the Controller.

The domain/IP mapping lives only as long as needed to handle the connection and is never used to build a browsing history.

### 4.2 System Filter
Controls the actual connections, whatever DNS is used.

Windows: Windows Filtering Platform; outgoing IPv4 and IPv6; classification of destination IPs; blocking; redirection to the local proxy when needed.
WFP connection redirection needs an ALE callout driver and a proxy service. It is not a firewall rule that a user-mode service can set. The project therefore separates:
- the policy and GeoIP engine (user mode);
- the WFP component for filtering and redirection;
- the local proxy service.

The driver is developed only after a technical prototype validates the approach.

Linux: nftables. macOS: Network Extension.

### 4.3 Encrypted DNS and connections without a known domain
Applications may use DNS-over-HTTPS, DNS-over-TLS or stored IPs. The domain may then be unknown: the IP can still be classified and blocked, but a DNS alternative cannot always be found.
- Domain known → try redirection.
- Domain unknown → block and show a notice marked "domain not available".
- Never infer the domain from TLS content. Never intercept or decrypt HTTPS.
- Respect the user's DNS settings and report modes that cannot be controlled.

The system must not claim that every connection was identified by domain.

## 5. Notices
Non-intrusive: no modal windows that keep interrupting work.

**Case A – redirected automatically.** Brief notice, no action required, can be opened for details, not repeated for every packet or request of the same event.

**Case B – cannot be redirected.** Notice "Connection interrupted", with *Allow once* and *Keep blocked*.
- Default is to keep blocked.
- Authorisation is valid for the current attempt only, with a short expiry.
- No permanent whitelist is created.
- No answer → stays blocked.
- The choice is logged.

The notice shows: domain (if known), country of the IP, why no alternative was found, whether a configured proxy is available, the action requested.

**Case C – repeated notices.** Group repeated events of the same domain and update the counter. Never suppress the authorisation request for a new connection. Let the user open the full log.

## 6. Local event log
Deliberately minimal. It must not become a browsing-surveillance tool.

| Field | Type | Example | Notes |
|---|---|---|---|
| `timestamp` | Integer | `1794472920` | Date and time of the event |
| `domain` | Text | `example.com` | Domain only, no path. `unknown` if not known, never reconstructed |
| `country_code` | Integer | `156` | ISO 3166-1 numeric (156 = China, 643 = Russia) |
| `action` | Integer | `1` | 0 = blocked, 1 = redirected, 2 = allowed once by the user |
| `count` | Integer | `3` | Attempts aggregated in the event |

Never stored: source or destination IPs, full URLs, paths and parameters, request content, cookies or credentials, file names, TLS content, full browsing history, personal data of the application that opened the connection.

```sql
CREATE TABLE geographic_events (
    id INTEGER PRIMARY KEY,
    timestamp INTEGER NOT NULL,
    domain TEXT NOT NULL,
    country_code INTEGER NOT NULL,
    action INTEGER NOT NULL,
    count INTEGER NOT NULL DEFAULT 1
);
```

Repeated records may be aggregated by domain, country, action and time window. The UI translates codes into readable text; exports keep the codes or add a legend.

Retention and export:
- Local storage only, no cloud sync, no automatic export.
- CSV and JSON export, also of the aggregated log; filters by period, domain, country and action.
- Manual full deletion; configurable retention.
- Database encryption may come later; the file must not be readable by other system accounts.

## 7. GeoIP database updates
First choice: MaxMind GeoLite2 Country, queried locally, updated over HTTPS.
- Download separate from monitored traffic.
- Integrity check; atomic install of the new version; last valid version kept temporarily.
- Update date shown; warning when the database is too old.
- No classification presented as certain when data is insufficient.

Before bundling GeoLite2 in an installer or shipping it with Klin, check its licence and redistribution terms.

## 8. Exceptions
| Situation | Behaviour |
|---|---|
| Blocked IP, valid alternative | Redirect automatically |
| Blocked IP, no valid alternative | Block and ask |
| Unclassified IP | Apply the policy for unknown IPs |
| VPN/proxy that cannot be controlled | Report partial geographic protection (never a false "redirected") |

Also: no automatic change to the router's DNS or to VPN settings; no bypass of the system firewall; no permanent rule created from a one-off authorisation.

## 9. Proposed layout
```
geographic-filter/
├── core/          geoip-engine, policy-manager, traffic-controller, alternative-resolver
├── dns/           local-dns-proxy, domain-ip-cache, dns-policy
├── redirect/      local-proxy, endpoint-validator, redirect-manager
├── system/        windows-wfp, windows-service, linux-nftables, macos-network-extension
├── logging/       event-store, aggregation, export
├── notifications/ redirect-notification, blocked-notification, authorization-request
├── ui/            country-selector, policy-settings, event-dashboard, event-export
└── tests/
```
The module is independent from the rest of the browser, so it can be updated without touching the browsing engine.

## 10. Main screen
Status (active, system-level protection) · excluded countries with "add" · counters for redirections, interruptions and authorisations · latest events (domain, date, country, action) · local log status with CSV/JSON export and manual deletion. Blocked and redirected connections must be clearly distinguished.

## 11. Implementation roadmap
| Step | Work | Result |
|---|---|---|
| 0 | Study of WFP, DNS and GeoIP | Validated architecture |
| 1 | GeoIP Engine and Policy Manager | IP classification |
| 2 | DNS Controller | Domain/IP identification |
| 3 | Windows System Filter | System-level blocking |
| 4 | Alternative Resolver | Selection of alternative endpoints |
| 5 | Local proxy and redirect | Compatible redirection |
| 6 | Notices and authorisations | User interaction |
| 7 | Log and export | Local tracking |
| 8 | Security and reliability tests | Distributable MVP |

### Acceptance criteria
1. Block a direct connection to an IP classified in an excluded country.
2. Recognise a domain with several IPs and choose an allowed alternative endpoint.
3. Verify that the alternative connection keeps TLS correct.
4. Do not redirect to incompatible endpoints.
5. Interrupt a connection when no alternative exists.
6. Show the authorisation request without letting traffic through while waiting.
7. Allow once and log the choice.
8. Handle repeated requests without excessive notices.
9. Log every event with the allowed fields only.
10. Export and delete the log.
11. Verify behaviour with encrypted DNS, VPN, proxy and IPv6.
12. Do not break local connections or normal system operation.

## 12. Fundamental requirement: redirection before blocking
Always keep this order: identification → search for an alternative → automatic redirection if verified → interruption and authorisation request → user decision (allow once or keep blocked), logged.

Automatic redirection cannot be guaranteed for every application or protocol. The first implementation must prove feasibility with standard DNS and compatible TCP connections. Support for proxies, UDP, QUIC, encrypted DNS and special protocols is declared separately, without pretending the filter handles them all the same way.

## Open points for Klin (to settle in an ADR before acceptance)
- **Outside the current architecture rule.** Klin is "config, then extension, then patch" on top of Firefox (ADR 0001). This is a system-level component with a Windows kernel driver, a system service and a local proxy, acting on all applications. It needs its own ADR, release process, driver signing and an independent security review.
- **New network connection.** The GeoIP update is an external request: it must be added to `CONNECTIONS.md` and be user-switchable ("anything that talks to the network needs an ADR").
- **Licensing.** GeoLite2 redistribution terms must be checked and recorded in `LICENSING.md` before bundling.
- **Storage.** The proposal uses SQLite; Klin V1 uses IndexedDB (ADR 0003). A system service cannot use the browser's IndexedDB, so a separate store is likely needed.
- **Platforms.** The proposal starts with Windows; Klin V1 targets Windows, Linux and macOS.
- **Tor mode.** Interaction with Tor mode (Phase 4) is undefined.
- **Roadmap impact.** Must not delay the desktop V1 or the Traffic Engine, which is the top priority.

## Technical references
- Microsoft – WFP bind or connect redirection: https://learn.microsoft.com/en-us/windows-hardware/drivers/network/using-bind-or-connect-redirection
- Microsoft – Proxied connections tracking: https://learn.microsoft.com/en-us/windows-hardware/drivers/network/using-proxied-connections-tracking
- Microsoft – Application Layer Enforcement (ALE): https://learn.microsoft.com/en-us/windows/win32/fwp/application-layer-enforcement--ale-
- MaxMind – GeoIP country database: https://dev.maxmind.com/geoip/docs/databases/city-and-country/
- MaxMind – Database updates: https://support.maxmind.com/knowledge-base/articles/download-and-update-maxmind-databases
