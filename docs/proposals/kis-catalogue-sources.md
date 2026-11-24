# KIS – licence check of candidate catalogues (24 Nov 2026)

Rule (owner decision 17 Nov 2026, `klin-independent-services.md`): an address goes in Klin's short list of public catalogues only after its **licence is checked**. Nothing is offered until then. The list in the build (`extensions/independent-services/data/catalogues.json`) stays **empty**.

## What was checked, and how
Only web searches, from the build environment, whose network is mostly closed: the candidates' own sites and repositories could **not be opened**, so no licence text was read at the source. What a search result says is not a licence check. Result for all four: **not confirmed**.

| Candidate | What was found | Licence of the list data | Decision |
|---|---|---|---|
| CHATONS (collective directory, Framasoft's collective) | The collective's materials are credited as CC BY-SA (illustrations, logo) in secondary sources. The list is at chatons.org; the collective's documents are in its repository on Framagit | **Not found** for the list itself | Not offered. To check: footer of chatons.org and the Framagit repository |
| XMPP Providers (providers.xmpp.net, project `xsf/xmpp-providers-website`) | A curated list of public XMPP providers, filtered lists come from a KDE repository, updated about hourly | **Not found** (the only CC0 mention is a different list) | Not offered. To check: the site's footer and the repository's licence file |
| Matrix servers (servers.joinmatrix.org, `servers.json`) | The page says the software is open source and the list is provided "as is" | **Not found** | Not offered. To check: the site's footer and its repository |
| Fediverse lists (joinmastodon.org server directory; instances.social `list.json`) | The Mastodon directory lists only Mastodon servers. No terms for the data found | **Not found** | Not offered. To check: each site's terms |

## Two things that also hold, whatever the licences turn out to be
1. **None of these lists is in Klin's catalogue format** (`extensions/independent-services/CATALOGUE-FORMAT.md`). Offering one would need a converter that someone writes and maintains, or the maintainers publishing in the Klin format. Klin does not run a service that converts, and does not copy data to a server of its own: so either the maintainers (or a third party) publish a Klin-format file, or the user converts it with a tool they choose.
2. **Listing an address is a recommendation of a sort.** The short list therefore carries, for each entry: who maintains it, its licence, and the link, and the line "being listed is not an approval". Entries are chosen by a written rule, not by taste (to be written before the first entry is added: public maintainers, licence allowing reuse, stable address, format).

## Next step
Someone with open internet access (the owner, or a session with access) reads, for each candidate, the licence at the source, and writes the result in the table above (licence name, link, date read). An entry is then added to `data/catalogues.json` only if the licence allows it **and** a Klin-format file exists at a stable https address.
