# Klin start page

The home page and the new tab: Klin's logo and a search box that uses the browser's own default search engine (`search` permission). Shows nothing from the internet, stores nothing, no recommendations, no shortcuts.
**Limits:** no shortcuts or bookmarks on the page; the search box only searches; first plain version, the owner's style session restyles it.
Test: `tests/acceptance/newtab`. The home page is set to `about:newtab` by `config/policies/policies.json`; the "Welcome to Firefox" screen is switched off in `config/prefs/klin.js` (checked only that no such tab appears in headless Firefox; the real screen is not tested here).

## Search engine choice (first start)
`page/choose.html` opens once when Klin is first installed (and from the toolbar button): the engines of `page/engines.js` in the owner's order, Ecosia preselected, facts only (`docs/proposals/search-engines.md`). The choice is kept in this extension's storage; the start page's search bar uses it.
**Limits:** Firefox gives an extension no way to change the **address bar's** search engine, so the choice does **not** change it: that stays the engine of `config/policies/policies.json` (`SearchEngines.Default`, Ecosia) unless the user changes it in the browser's settings; the screen says so. A full effect needs privileged code (the rebranded build, stage 2) or a per-engine provider extension (tried: a temporary provider did not change the default; not tried signed). SearXNG is not offered yet (it needs the user to pick an instance). Policy: `SearchEngines` removes Bing, Perplexity, Wikipedia, Amazon, eBay and adds Ecosia, Mojeek, Qwant, Brave Search (Google and DuckDuckGo are built in). The engines' facts are to be checked against each operator's policy.
Test: `tests/acceptance/search-choice`.
