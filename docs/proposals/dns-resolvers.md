# Proposal – the short list of DNS services (DoH) for the first-start screen

Status: **list decided by the owner on 14 Nov 2026:** Quad9, Mullvad DNS, Cloudflare 1.1.1.1 and "keep your current one", each with an explanation of what it implies. The wording below is a draft; **no sentence goes to the screen before it is checked against the primary documents named at the end.** Written by the style session for ADR 0005.

## Criteria (13 Nov 2026), now used as facts to show, not as a gate (14 Nov 2026)
The owner chose to offer Quad9, Mullvad and Cloudflare although not all pass every point (Cloudflare keeps sampled logs). Each line on the screen must therefore say plainly which of these hold for that service:
1. It states in writing that it does not keep a log of the sites you look up.
2. Its operator, legal form and country are known.
3. An independent party has examined the no-log claim (not only the operator's own word).
4. It does not sell data and shows no advertising.
5. It supports the more private forms of DoH where they exist.
Nothing is preselected (ADR 0005).

## What the search found
Findings come from secondary pages and the operators' own blog posts. **None was checked against the primary documents yet.**

| Service | Operator | What was found | Meets the criteria? |
|---|---|---|---|
| Quad9 | Quad9 Foundation, non-profit, Switzerland | Describes itself as a Swiss non-profit; says it does no logging; supports DoH, DoT and DNSCrypt. No independent audit of the no-log claim found. | Probably 1, 2, 4, 5. **Criterion 3 not shown.** |
| Mullvad DNS | Mullvad (VPN company, Sweden) | Public DoH and DoT, no account; servers run in memory. Its own 2021 post says the DNS service was audited by Assured; a 2023 test of two memory-only servers found no logging of user activity. Dates and scope differ between sources. | Probably 1, 2, 3, 4, 5, **if the audits are confirmed for the public resolver.** It is run by a commercial VPN company. |
| Cloudflare 1.1.1.1 | Cloudflare, US company | Examined by KPMG on its privacy commitments (2020 and later). Keeps sampled network logs: reported as deleted within 60 days and addresses anonymised within about 25 hours. | **Fails 1**: it does keep (sampled) logs. Large US company. |
| DNS0.eu | French non-profit | Reported as **shut down** for lack of funds (two news pages); its own site still shows it. | Do not list until its status is confirmed. |
| DNS4EU | EU-funded public service | Keeps limited logs for security, with anonymised addresses. | **Fails 1.** |

## The four options and what each implies (draft screen text)
Title: **Who do you want to see the sites you look up?** / **Chi vuoi che veda i siti che cerchi?**
Intro: *Every time you open a site, your computer asks a service where it is. That service knows which sites you look up. You choose who. No choice makes you anonymous: you move the trust, you do not remove it.* / *Ogni volta che apri un sito, il tuo computer chiede a un servizio dove si trova. Quel servizio sa quali siti cerchi. Scegli tu chi. Nessuna scelta ti rende anonimo: sposti la fiducia, non la elimini.*

| Option | What it implies (EN) | Cosa implica (IT) |
|---|---|---|
| **Quad9** | Swiss non-profit foundation. It says it does not log the sites you look up. No independent examination of that claim was found. | Fondazione svizzera senza scopo di lucro. Dichiara di non registrare i siti che cerchi. Non è stato trovato un controllo indipendente su questa promessa. |
| **Mullvad DNS** | Run by a Swedish VPN company. It says it keeps no log; its servers run in memory; an outside firm examined the service, according to Mullvad. | Gestito da un'azienda svedese di VPN. Dichiara di non tenere registri; i server lavorano in memoria; secondo Mullvad, una ditta esterna ha controllato il servizio. |
| **Cloudflare 1.1.1.1** | Large US company. An accounting firm examines its privacy promises every year, but it **does keep sampled logs** for some weeks and anonymises addresses after about a day. Fast and widely used; it also concentrates a great deal of traffic in one company. | Grande azienda statunitense. Una società di revisione controlla ogni anno le sue promesse sulla privacy, ma **tiene registri a campione** per alcune settimane e rende anonimi gli indirizzi dopo circa un giorno. Veloce e molto usata; concentra molto traffico in una sola azienda. |
| **Keep your current one** | As now: your internet provider or the Wi-Fi network sees which sites you look up, usually in clear text, and often keeps a record. Nothing changes and no new service is involved. | Come adesso: il tuo provider internet o la rete Wi-Fi vede quali siti cerchi, di solito in chiaro, e spesso li registra. Non cambia nulla e non entra nessun nuovo servizio. |

A small link under the options lets the user type in another service. Every sentence about a service is to be checked before release (see below).

## Before anything is shown
- Read the primary documents: Quad9's privacy policy and any audit; Mullvad's DNS audit reports and its logging statement; the current status of DNS0.eu.
- Record the date of each check. Re-check every year, or sooner if the operator changes hands.
- Add each listed service to `extensions/connections/data/connections.json` (it is a connection Klin may make).

## Sources
- Quad9: <https://quad9.net/privacy/policy>, <https://docs.quad9.net/>
- Mullvad: <https://mullvad.net/en/blog/mullvad-doh-and-dot-beta-release>, <https://mullvad.net/en/blog/authoritative-dns-server-audit-completed-by-assured-ab>
- Cloudflare: <https://developers.cloudflare.com/1.1.1.1/privacy/index.md>, <https://blog.cloudflare.com/announcing-the-results-of-the-1-1-1-1-public-dns-resolver-privacy-examination>
- DNS0.eu: <https://www.techzine.eu/news/privacy-compliance/135590/dns0-eu-shuts-down-due-to-lack-of-funds>, <https://www.dns0.eu/privacy>
- DNS4EU: <https://joindns4.eu/for-public>
