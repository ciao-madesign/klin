# Proposal – Search engine chosen at first start (also used by the home page)

Status: **order decided by the owner, 14 Nov 2026.** The screen is not built yet.

## What is decided
- At the first start the user picks a search engine from a short list. **Ecosia is preselected** (the owner's choice), labelled "suggested by Klin, not paid by Ecosia", and can be changed with one click. This is an "optional preselected default", as ADR 0005 allows for DNS.
- Order on the screen: **Ecosia, Mojeek, DuckDuckGo, Qwant, SearXNG (advanced), Google, Brave Search.**
- The choice is the engine of the address bar and of the search bar of Klin's start page (`extensions/newtab`, a page of Klin's own that opens without any connection until the user searches). It is kept until the user changes it, and stored on the device only.
- Klin takes **no money** from any engine: no partner or affiliate deal, no referral code in the address.
- The screen states facts only: who runs it, where, where its results come from, how it is financed, what the operator itself states about data, whether an account is needed. No ranking, no opinion. Each entry links to the operator's own policy.
- Any search engine receives what you search and your network address (IP). Klin cannot change that; it lets you choose which operator receives it.

## Facts per engine
Written from general knowledge and the operators' own descriptions; **to check against each operator's policy and terms before the screen ships** (the same rule as for the DNS resolvers). "States" means: according to the operator.

| Engine | Operator and country | Results come from | Financing | Operator states about your data | Account |
|---|---|---|---|---|---|
| **Ecosia** | Ecosia GmbH, Germany; a company owned through a trust structure (steward ownership) | Bing and Google, plus results of its own | Advertising; states that it uses most of its profits to fund tree planting | Collects some data to run the service; states it does not sell it | Not needed |
| **Mojeek** | Mojeek Ltd, United Kingdom | Its own crawler and index only | Advertising without tracking, and paid access to its data | States it stores no personal data and no search history | Not needed |
| **DuckDuckGo** | Duck Duck Go, Inc., United States | Bing, its own crawler and other sources | Advertising (served through Microsoft's advertising network) | States it does not store searches linked to a person | Not needed |
| **Qwant** | Qwant, France | Bing and, in growing part, its own index | Advertising | States it does not track or profile users | Not needed |
| **SearXNG** (a public instance, advanced) | Open-source software; each instance is run by a different volunteer or organisation | Many engines combined | Usually donations, usually no advertising | Depends on the operator of the chosen instance | Not needed |
| **Google** | Google LLC, United States | Its own index | Advertising | Stores searches; links them to a Google account when signed in; offers settings to limit or delete them | Optional |
| **Brave Search** | Brave Software, Inc., United States | Its own index, with some partner data | Advertising and an optional paid plan | States it does not track searches | Not needed |

## Home page (decided, owner, 14 Nov 2026)
Klin's own start page, separate from the welcome page (`extensions/newtab`; `extensions/welcome` only opens at the first start and from the info button): the logo, the name, one wide search bar, and at the bottom a short text about Klin with a link to the welcome page. It makes no connection until the user searches; the search goes to the chosen engine.

## To do
1. Check every cell above against the operator's own policy and terms; record the date.
2. ~~Build the screen~~ **Built** (14 Nov 2026, `extensions/newtab/page/choose.html`, made here from `klin.css` because the style session is stopped; to be one flow with the DNS screen later). Limit: it changes the start page's search bar, not the address bar (see `extensions/newtab/README.md`).
3. Technical: set the chosen engine as the default through the search API of the extension that shows the screen; test that the choice survives a restart and a change in settings.
