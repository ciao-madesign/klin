# Architecture decision records

| # | Title | Status | Where |
|---|---|---|---|
| 0001 | No full fork of Firefox | accepted | default branch |
| 0002 | Licensing | accepted | default branch |
| 0003 | Local data storage: IndexedDB first | accepted | default branch |
| 0004 | greenweb as a pre-installed extension | accepted | this branch |
| 0005 | DNS over HTTPS: user choice, optional default | accepted | this branch |
| 0006 | Routing and exclusion rules: browser level first | accepted | default branch |
| 0007 | Privacy levels: how Standard, Advanced and Maximum are applied (time zone approximated inside the page) | accepted; real-site breakage not verified | this branch |
| 0009 | Support program for the VPN command (level 2) and the download scan | proposed | this branch |

Rule: the next number is the highest one on the default branch plus one. Before taking a number, look at the other open branches (`git ls-tree origin/<branch> docs/adr/`), so two sessions do not use the same one.

To write (decided or proposed, needs an ADR before work starts): a privileged helper to apply Firefox's own fixed-time-zone protection (replaces the in-page approximation of ADR 0007), P41: native messaging, installation, permissions), extension signing and distribution, Klin's languages.
