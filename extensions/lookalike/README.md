# lookalike

Lookalike-domain warning (proposal P14): before a page loads, Klin compares the site name with the sites you already know and stops it if the name imitates one of them.

Status: **working as an installed extension.**

- "Known" sites: every bookmark, plus history sites visited at least 3 times. Rebuilt every 6 hours and when a bookmark is added.
- Reported: names that look the same at a glance (`rn` for `m`, `0` for `o`, `1` for `l`, `vv` for `w`, letters from other alphabets, including punycode names), and names one letter away from a known name of 6+ letters under the same suffix.
- Not reported: subdomains of a known site, the same name under another suffix (example.com / example.it), sites you chose to continue to.
- The warning offers: go to the known site, go back, continue (remembered).
- Fully local. Bookmarks and history are read in memory; only the list of accepted sites is stored (extension storage).
- Permissions: `bookmarks`, `history`, `storage`, `webRequest`, `webRequestBlocking`, all sites. Broad, which is why this must ship as a built-in, reviewed component.

Tests: `node tests/acceptance/lookalike/unit.js` (detection rules) and `tests/acceptance/lookalike/run.py FIREFOX_DIR` (in the browser, with fake sites).

Limits:
- No access to the browser's public suffix list: the site name is the last two labels, three for common country patterns (co.uk, com.br). Unusual suffixes can be split wrongly.
- Only top-level navigations; links inside frames are not checked.
- Not a replacement for Safe Browsing: it knows nothing about phishing sites that do not imitate a name you know.
- In Firefox, "all sites" access of a Manifest V3 extension can be revoked by the user; the build must grant it.
- English only.
