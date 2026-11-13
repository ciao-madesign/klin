# private-window

Honest private window (proposal P22): the start page of a private window is replaced by a page that says what a private window does and, above all, what it does not hide.

Status: **working as an installed extension (v0.1).** Decided 13 Nov 2026: an extension, not a Firefox patch (ADR 0001).

- Replaces only `about:privatebrowsing`, and only in private windows. A private window opened with an address, a page you navigate to, and normal windows are left alone.
- The page: what it does (forgets history, cookies, form entries, cache; keeps private and normal windows apart; Klin's protections stay on) and what it does not hide (your internet provider and the Wi-Fi owner, the sites you visit, your accounts once logged in, downloads and bookmarks). It also keeps the one useful thing of the page it replaces, a search box (default search engine; an address typed there is opened as an address).
- Fully local, no network access of its own. Permissions: `tabs` (to recognise the start page) and `search`.

Test: `tests/acceptance/private-window/run.py FIREFOX_DIR` (7 checks, including: without permission for private windows nothing changes).

Limits:
- **Needs permission to run in private windows.** Firefox does not give it by default. Klin's build must grant it with the enterprise policy `ExtensionSettings` → `private_browsing: true` (the key exists in Firefox 160's policy schema). That grant is **not tested yet**: an unsigned extension cannot be installed through policy on release Firefox, so it needs the signed or built-in build.
- The page points to "What can this site see?", which is the toolbar button of the self-test extension: both must ship together.
- The search box was not tested against a live search engine (offline test).
- Replaces what Firefox shows, so Back from the first page goes to the original start page. Not tested.
- English only.
