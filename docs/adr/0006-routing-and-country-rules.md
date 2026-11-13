# ADR 0006 – Routing and exclusion rules: browser level first, system level stays a proposal

Status: **accepted** (owner, 13 Nov 2026)

## Context
Two answers exist to the same need: "let me exclude companies, countries and sources, and route my traffic as I choose" (`PRINCIPLES.md` point 3).

- **P32, browser level (accepted, Phase 3).** Rules per domain, company or country; send a request through a proxy, relay or Tor that the user chooses, or refuse it. Runs as a WebExtension (`proxy` API). Covers the traffic of the browser only.
- **Geographic Traffic Controller, system level (proposal of 2026-11-12, not scheduled).** Blocks or redirects connections of the whole device by country, with a DNS controller, a local proxy and, on Windows, a WFP kernel driver. See `docs/proposals/geographic-traffic-controller.md`.

Both decide by destination country, both would show a notice with "allow once" and both keep a small local log. They must not be built twice.

## What the two have in common, and where they differ
| | P32 (browser) | Geographic Traffic Controller (system) |
|---|---|---|
| Covers | Browser traffic | All applications the filter can see |
| Built as | WebExtension, no patch | Driver, service, local DNS proxy, local proxy |
| Fits "config, extension, patch" (ADR 0001) | Yes | No: a separate component outside the browser |
| Platforms | Same as Klin (Windows, Linux, macOS, later Android) | Windows first; Linux and macOS need different code |
| Maintenance and risk | Moves with Firefox releases | Kernel driver: signing, independent security review, crash and compatibility risk on every Windows release |
| New outside connection | Only if a country database is downloaded | Same, plus the filter runs with high privileges |
| Redirect to another server of the same site | Not shown to be possible with extension APIs | Possible in principle, only for standard TCP cases, not guaranteed |

## Limits that apply to both
- The country of a destination is known only from its IP address. Greenweb's Destination Control already records this as at best "probable", because cloud and CDN addresses are shared by many services. Rules by domain and by company are reliable; rules by country are approximate and must be labelled so.
- A VPN, a proxy or encrypted DNS used by an application can hide the real destination. Klin must say when protection is partial.
- Redirection to an "alternative" server is only safe if it is verified to be the same site (same name, same certificate). It cannot be promised in general.

## Decision
1. **Build P32 first, in the browser.** Rules by domain and company (reliable) and by country (approximate, labelled). Actions: allow, route through the user's own proxy, or block and ask.
2. **Adopt from the system proposal** the parts that do not need a driver: the order "look for a verified alternative, otherwise block and ask"; "allow once" with a short expiry and no permanent exception; non-intrusive grouped notices; the minimal local log (time, domain, country, action, count; no IP address, no full address) with export and manual deletion.
3. **Keep the Geographic Traffic Controller as a proposal, not scheduled.** It is reconsidered only if all of these hold after P32 exists: users need coverage of other applications; a prototype shows the driver can be maintained and independently reviewed; the country database licence allows it; Linux and macOS have a plan.
4. **Design the shared parts once:** one rule format (domain, company or country, with action), one country database with its licence recorded, one log format, one wording for the notices. If the system proposal is ever built, it reuses them.
5. **Say what it does not do.** The feature states that it covers the browser only, that country rules are approximate, and that Klin runs no relay (see `PRINCIPLES.md`, "Routing freedom vs no Klin infrastructure").

## To check in the P32 prototype
- Whether the country can be checked **before** the request leaves the browser (looking the name up first and cancelling the request), and how often that lookup differs from the one the browser makes afterwards. The alternative, reading the address from the answer, only knows the country after the connection was made.
- Whether the extension APIs allow choosing another address of the same site at all. Until shown, no redirection to an alternative server is promised at browser level.
- Where the country data comes from, its licence, and whether it can ship inside the build, so that no new connection at run time is needed (anything that talks to the network needs its own ADR).
- Interaction with Tor mode (Phase 4) and with the "Maximum" level (P29, formerly "Anonymous").

## Consequences
- The open question "Geographic Traffic Controller versus P32" in `STATUS.md` is answered.
- P32 stays in Phase 3 of the roadmap; this ADR adds no work to Phases 1 and 2.
- `proposals/geographic-traffic-controller.md` stays as it is, marked deferred.
- Reopening the system-level module needs a new ADR that meets the conditions of point 3.
