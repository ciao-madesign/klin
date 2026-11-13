# Proposal – the short list of DNS services (DoH) for the first-start screen

Status: **candidates only, not approved.** Written 13 Nov 2026 by the style session for ADR 0005. Nothing here goes into the product until the owner approves the list and someone has read the primary documents named below.

## Criteria (decided by the owner, 13 Nov 2026: strict)
A service is on the list only if all of these hold:
1. It states in writing that it does not keep a log of the sites you look up.
2. Its operator, legal form and country are known.
3. An independent party has examined the no-log claim (not only the operator's own word).
4. It does not sell data and shows no advertising.
5. It supports the more private forms of DoH where they exist.
Nothing is preselected (ADR 0005). Every entry on the screen shows these facts in one line.

## What the search found
Findings come from secondary pages and the operators' own blog posts. **None was checked against the primary documents yet.**

| Service | Operator | What was found | Meets the criteria? |
|---|---|---|---|
| Quad9 | Quad9 Foundation, non-profit, Switzerland | Describes itself as a Swiss non-profit; says it does no logging; supports DoH, DoT and DNSCrypt. No independent audit of the no-log claim found. | Probably 1, 2, 4, 5. **Criterion 3 not shown.** |
| Mullvad DNS | Mullvad (VPN company, Sweden) | Public DoH and DoT, no account; servers run in memory. Its own 2021 post says the DNS service was audited by Assured; a 2023 test of two memory-only servers found no logging of user activity. Dates and scope differ between sources. | Probably 1, 2, 3, 4, 5, **if the audits are confirmed for the public resolver.** It is run by a commercial VPN company. |
| Cloudflare 1.1.1.1 | Cloudflare, US company | Examined by KPMG on its privacy commitments (2020 and later). Keeps sampled network logs: reported as deleted within 60 days and addresses anonymised within about 25 hours. | **Fails 1**: it does keep (sampled) logs. Large US company. |
| DNS0.eu | French non-profit | Reported as **shut down** for lack of funds (two news pages); its own site still shows it. | Do not list until its status is confirmed. |
| DNS4EU | EU-funded public service | Keeps limited logs for security, with anonymised addresses. | **Fails 1.** |

## Result
Under the strict criteria, **no candidate fully passes today.** The two worth checking first are Quad9 (needs evidence for criterion 3) and Mullvad DNS (needs the audits confirmed for the public resolver). If neither passes, the screen offers only "your provider, as now" and "one you type in", which is honest and works.

## Before anything is listed
- Read the primary documents: Quad9's privacy policy and any audit; Mullvad's DNS audit reports and its logging statement; the current status of DNS0.eu.
- Record the date of each check. Re-check every year, or sooner if the operator changes hands.
- Add each listed service to `extensions/connections/data/connections.json` (it is a connection Klin may make).

## Sources
- Quad9: <https://quad9.net/privacy/policy>, <https://docs.quad9.net/>
- Mullvad: <https://mullvad.net/en/blog/mullvad-doh-and-dot-beta-release>, <https://mullvad.net/en/blog/authoritative-dns-server-audit-completed-by-assured-ab>
- Cloudflare: <https://developers.cloudflare.com/1.1.1.1/privacy/index.md>, <https://blog.cloudflare.com/announcing-the-results-of-the-1-1-1-1-public-dns-resolver-privacy-examination>
- DNS0.eu: <https://www.techzine.eu/news/privacy-compliance/135590/dns0-eu-shuts-down-due-to-lack-of-funds>, <https://www.dns0.eu/privacy>
- DNS4EU: <https://joindns4.eu/for-public>
