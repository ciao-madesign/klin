# Klin start page

The home page and the new tab: Klin's logo and a search box that uses the browser's own default search engine (`search` permission). Shows nothing from the internet, stores nothing, no recommendations, no shortcuts.
**Limits:** no shortcuts or bookmarks on the page; the search box only searches; first plain version, the owner's style session restyles it.
Test: `tests/acceptance/newtab`. The home page is set to `about:newtab` by `config/policies/policies.json`; the "Welcome to Firefox" screen is switched off in `config/prefs/klin.js` (checked only that no such tab appears in headless Firefox; the real screen is not tested here).
