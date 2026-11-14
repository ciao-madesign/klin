# Proposal – Third-party lists: how the user imports them, and which to offer first

Status: **proposed** (13 Nov 2026); the owner has approved the EU list of suspended media for the catalogue (see 2 and 4). Follows the owner's decision that the ethics and source-quality lists are third-party public lists used as published, and that Klin does not curate them (`CHARTER.md` section 4, `PRINCIPLES.md` decision 3). Covers P33 (entity data), P34 (source quality) and P35 (ethics list).

## 1. How the user gets a list
Six ways, from the simplest. Klin ships no list inside the browser; it only knows where lists are.

| # | Method | What happens |
|---|---|---|
| F | **Write or paste your own** | The simplest way to make a personal list. See "Your own list, in three steps" below. |
| A | **Catalogue, one click** | Klin shows a short catalogue: name, who maintains it, its own criterion, its licence, a link. One click subscribes. Nothing is on by default (to confirm). The catalogue is a small file in the build, so showing it makes no connection. |
| B | **Paste an address** | The user pastes the web address (HTTPS only) of any public list. Klin shows name, maintainer, size and a sample of entries, and downloads only after the user confirms. |
| C | **Open a file** | Drag a list file into Klin, or pick it. Works offline. |
| D | **Share a set** | Export or import a small "list set" file with the names and addresses of the chosen lists and which are on, never the contents. A group or a friend gets the same choice (reuses P20, shareable presets). |
| E | **From the ad blocker** | Lists that block or hide (ads, trackers, hosts files, Pi-hole lists) are imported through uBlock Origin, which already does it. Klin does not duplicate that. |

### Your own list, in three steps
For someone who has no list and just wants to flag a few sites, with no file and nothing to install.
1. **Open Lists, press "New list".** Klin opens a box with one example line and a short explanation. Give the list a name, for example "My sites".
2. **Type or paste domains, one per line**, optionally followed by a reason after a space or a comma. Lines that start with `#` are notes and are ignored.
   ```
   # sites I want flagged
   example-news.com
   another-site.org   copies other people's articles
   ```
3. **Press "Save and turn on".** From then on, those sites carry the flag, with your name for the list as its origin ("My sites, made by you").

From the same screen the user can:
- **Export** the list as a file (to keep, or to give to a friend), and **import** one the same way: drag the file onto Klin, or press "Open file".
- **Import a list someone else published:** paste its web address, press "Add".
- **Turn it off or delete it** at any time. A personal list never leaves the device and is never uploaded.

Klin does not check what the user writes. The flag says it is the user's own list.

### Accepted formats
One domain per line; hosts file; CSV or JSON with the columns `domain`, `flag`, `reason`, `url` (the last three optional); ad-blocker rules, reading only the domain part. Anything else is refused with a plain message. No scripts, no executable content.

### Rules for every list
- **Per list:** on or off, remove, view its entries and its origin. Updates are manual by default; weekly is an option the user turns on.
- **On update:** Klin shows what changed (entries added and removed) and keeps the previous version, so the user can go back.
- **Safe reading:** HTTPS only; a size limit (**to confirm**); parsed inside Klin's own page, never inside a web page; the hash of what was downloaded is shown.
- **Connections:** a download is a visible connection to the maintainer's server, listed on the connections page (P8). It carries no identifier and no cookie. No Klin server sits in between, because Klin runs none.
- **Every flag says:** the list, who maintains it, its criterion, the date, and where to object. It is a label, never a block.

## 2. Candidates for the first catalogue
Found by a web search on 13 Nov 2026. **None is checked against its own download address and licence file yet**: that check comes before any list enters the catalogue (section 3). Status column: what the search showed.

### Reliability of sources (P34)
| List | What it is | Licence, as found | Note |
|---|---|---|---|
| [Iffy.news index](https://iffy.news/index/) | Domains with a low or very low factual-reporting rating | MIT, as reported by secondary pages; verify on the site | Built on the ratings of one rater, Media Bias/Fact Check. The judgement is theirs and the flag must say so |
| [Wikipedia, Perennial sources](https://en.wikipedia.org/wiki/Wikipedia:Reliable_sources/Perennial_sources) | Community list of sources rated reliable, marginal, unreliable or deprecated | Not confirmed. Wikipedia text is generally CC BY-SA; verify | No official machine-readable export found (a community script converts it to JSON). Needs a converter |
| [EUvsDisinfo database](https://euvsdisinfo.eu/) | Documented cases of pro-Kremlin disinformation, updated weekly | No reuse terms found; no bulk download found | A research dataset copy exists on Zenodo and Mendeley. Verify before use |

### Legal bans (a legal list, not an editorial one). **Approved by the owner for the catalogue**
| List | What it is | Licence, as found | Note |
|---|---|---|---|
| [EU Council Regulation 2022/350](https://eur-lex.europa.eu/eli/reg/2022/350/oj/eng) and its later amendments | Russian media outlets whose broadcasting is suspended in the EU, including online | Official EU legal text; reuse terms to verify | Later additions (June 2022, May 2024) were not verified; the consolidated annex on EUR-Lex is the source. It lists outlets, not domains: a converter and a statement of which sites belong to each outlet are needed |

### Hate and extremism (P35)
| List | What it is | Licence, as found | Note |
|---|---|---|---|
| [IPFire DBL, "Violence"](https://www.ipfire.org/dbl/lists/violence) | Domains with violent or extremist content | CC BY-SA 4.0, as listed | The only one with a licence shown in the search |
| [rimu/no-qanon](https://github.com/rimu/no-qanon) | Blocklist of QAnon, conspiracy, far-right and discriminatory sites | Not shown | Small project; check upkeep and how entries are chosen |
| [chigh/hategroup-dnsbl](https://github.com/chigh/hategroup-dnsbl) | Hate-group domains taken from the SPLC Hate Map | Not shown | The classification is the SPLC's, a US advocacy organisation |

No single, well-known open list of neo-fascist sites with a clear licence was found. Lists on this topic are small and uneven, which is a reason to let the user add their own (methods B, C and D).

### Who owns what (P33)
| List | What it is | Licence, as found | Note |
|---|---|---|---|
| [Disconnect, entities and services](https://github.com/disconnectme/disconnect-tracking-protection) | Domain to owning company, and tracker categories | CC BY-NC-SA 4.0 | Non-commercial. A conversion project reports many false positives |
| [DuckDuckGo Tracker Radar](https://github.com/duckduckgo/tracker-radar) | Domain to owning entity, with tracker data | Reported as CC BY-NC-SA 4.0; one source says NC-ND. Verify in the repository's LICENSE | Non-commercial in both readings |
| [RSF Media Ownership Monitor](https://www.mom-rsf.org/) and [EUI Media Pluralism Monitor](https://cmpf.eui.eu/media-pluralism-monitor-2023/) | Who owns the main media, by country; pluralism indicators | Not stated in the results | Reports and country datasets, not domain lists. Need a converter and a licence check |

### Why the non-commercial licences do not block this
Klin does not ship these lists. The user downloads them from the maintainer, so the licence is between the maintainer and the user, and Klin's own licences (MIT and MPL-2.0) are not touched. What stays out of scope: putting such a list inside the Klin build, even preselected.

## 3. Before a list enters the catalogue (technical checks only)
1. A public address that works, over HTTPS.
2. The licence file read and recorded (name, version, link). A licence that forbids use as a downloaded subscription is refused.
3. A format Klin can read, or a converter written and tested.
4. A named maintainer and a place to send objections.
5. Date of the last update and how often it changes.

Klin does not judge what the list says (`CHARTER.md` 4.3).

## 4. Decisions for the owner
1. ~~Which candidates go into the first catalogue~~ **Decided** (owner, 14 Nov 2026): the EU suspended-media list, Iffy.news and IPFire DBL "Violence". Still to do before each enters: verify its licence on the maintainer's site (Iffy.news: MIT as reported by secondary pages; IPFire: CC BY-SA 4.0 as listed) and its format.
2. ~~Whether any list is on by default~~ **Decided** (owner, 14 Nov 2026): only the EU list is on by default; the others are off. It is a label, never a block.
3. ~~Whether the legal-ban list (EU) is offered~~ **Decided: yes** (owner, 13 Nov 2026). **Converter written 14 Nov 2026** (`build/gen-eu-suspended-media.py`): reads Annex XV of the consolidated Regulation 833/2014 from the Publications Office's official service (EUR-Lex itself refuses scripts), version 02014R0833-20260724, 32 outlets, and writes `data/lists/eu-suspended-media.json`. Klin adds or removes no outlet. **Still to do: the outlet-to-domain table (`build/data/eu-suspended-media-domains.json`) is from general knowledge and UNVERIFIED**; each domain must be checked against the outlet's own site before the list is offered; the regulation lists outlets, not web addresses, and the page that shows the label must say so.
4. ~~The size limit and updates~~ **Decided** (owner, 14 Nov 2026): at most 1 MB per list (a larger list is refused; very large lists stay with uBlock Origin); updates are manual, weekly only if the user turns it on.
