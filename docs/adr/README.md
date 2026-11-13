# Architecture decision records

| # | Title | Status | Where |
|---|---|---|---|
| 0001 | No full fork of Firefox | accepted | default branch |
| 0002 | Licensing | accepted | default branch |
| 0003 | Local data storage: IndexedDB first | accepted | default branch |
| 0004 | greenweb as a pre-installed extension | accepted | this branch |
| 0005 | DNS over HTTPS: user choice, optional default | accepted | this branch |

Rule: the next number is the highest one on the default branch plus one. Before taking a number, look at the other open branches (`git ls-tree origin/<branch> docs/adr/`), so two sessions do not use the same one.

To write (decided or proposed, needs an ADR before work starts): privacy levels (P29), routing and exclusion rules, reconciling the Geographic Traffic Controller with P32, extension signing and distribution, Klin's languages.
