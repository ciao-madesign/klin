# Proposal – Search engine chosen at first start (also the home page)

Status: **candidates for the owner to prune** (owner, 14 Nov 2026: "ask the user at first start, then keep the choice; explain each option; at least 3 aligned with Klin's values and 2 classic ones; propose more than 4").

## What is decided
- At the first start the user picks a search engine from a short list. Nothing is preselected and Klin has no default (same rule as the DNS screen, ADR 0005).
- The choice becomes the **home page** and the **address-bar search engine**; it is kept until the user changes it (settings). It is stored on the device only.
- Klin takes **no money** from any engine: no partner or affiliate deal, no referral code in the address. (Firefox itself earns money from its default search deal; Klin does not.)
- Every option on the screen says who runs it, where, where its results come from, how it earns money, what it knows about you, and one honest drawback. Klin does not rank them and does not call any of them "private": it reports what each states, with a link to its own policy.
- A search engine always learns what you search and your address (IP). Klin cannot change that; it can only choose which company learns it.

## Candidates (the facts below are from general knowledge and the operators' own descriptions; **to check against each operator's own policy and terms before the screen ships**, as for the DNS resolvers)

### Aligned with Klin's values (privacy first, independence, low impact). Startpage removed by the owner, 14 Nov 2026. **DuckDuckGo is first in the list and the owner's choice as the preselected one** (an "optional preselected default", as ADR 0005 allows for DNS; the screen shows it already selected, labelled, and changeable with one click) — to confirm
| Engine | Who and where | Results come from | How it earns | What it says about your data | Honest drawback |
|---|---|---|---|---|---|
| **DuckDuckGo** | Private company, USA | Mostly Bing plus its own crawler and other sources | Ads (served through Microsoft's ad network, with its own privacy rules) | No account; says it does not keep searches linked to a person | US company; relies on Microsoft for much of its results and ads; some optional AI features |
| **Brave Search** | Brave Software, USA | Its own independent index | Ads and an optional paid plan | No account needed; says it does not track searches | US company; own index is smaller than Google's, some results feel thinner; tied to the Brave brand |
| **Mojeek** | Small independent company, UK | Its own crawler only, no one else's results | Ads, without tracking | Says it stores no personal data and no search history | Smallest index: fewer results, weaker on recent news and other languages |
| **Ecosia** | Social business, Germany | Bing and Google, plus some of its own | Ads; says it uses most of its profit to plant trees | No account; collects some data to run the service, says it is not sold | Mostly other people's results and ads; the tree-planting claim is the company's own; fits Greenweb's concern for the environment |
| **Qwant** | Qwant, France (EU) | Bing plus a growing share of its own index | Ads | Says it does not track or profile | Mostly Microsoft's results so far; smaller user base |
| **SearXNG instance** (advanced) | Open-source software run by volunteers; many public instances | Mixes many engines at once | Donations, usually no ads | Depends entirely on whoever runs the instance you pick | You must choose and trust an instance; instances come and go; slower; not offered by default |

### Classic (Bing and Yahoo removed by the owner, 14 Nov 2026)
| Engine | Who and where | Results come from | How it earns | What it says about your data | Honest drawback |
|---|---|---|---|---|---|
| **Google** | Google, USA | Its own index, the largest | Ads, built on knowing a lot about users | Stores searches, tied to a Google account if you are signed in; has controls to limit or delete | Most data collected of all; the results are very good, which is why people use it |

## Home page (decided, owner, 14 Nov 2026)
Klin's own start page, separate from the welcome page (`extensions/newtab`; the welcome page `extensions/welcome` only opens at the first start and from the info button): the logo, the name and one wide search bar, like a search engine's home page, and nothing else. It makes **no connection until the user searches**, and the search goes to the engine chosen at the first start. The engine's own page is not the home page, so no company learns that the browser was opened.

## To do
1. The owner prunes the list further (Bing and Yahoo are already out).
2. Check every sentence above against each operator's own policy and terms.
3. Build the screen with the style session (it owns screens and wording; it also owns the DNS first-start screen, which should be one flow with this one).
4. Technical: set the chosen engine as default through the search API of the extension that shows the screen, and the home page through the same choice; test that the choice survives a restart and a change in settings.
