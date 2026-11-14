# Architecture decision records

| # | Title | Status | Where |
|---|---|---|---|
| 0001 | No full fork of Firefox | accepted | default branch |
| 0002 | Licensing | accepted | default branch |
| 0003 | Local data storage: IndexedDB first | accepted | default branch |
| 0004 | greenweb as a pre-installed extension | accepted | this branch |
| 0005 | DNS over HTTPS: user choice, optional default | accepted | this branch |
| 0006 | Routing and exclusion rules: browser level first | accepted | this branch |
| 0007 | Support program for the VPN command (level 2) and the download scan | proposed | this branch |

Rule: the next number is the highest one on the default branch plus one. Before taking a number, look at the other open branches (`git ls-tree origin/<branch> docs/adr/`), so two sessions do not use the same one.

To write (decided or proposed, needs an ADR before work starts): privacy levels (P29), extension signing and distribution, Klin's languages.
