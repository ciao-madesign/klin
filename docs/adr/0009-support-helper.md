# ADR 0009 – A small support program for the VPN command (level 2) and the download scan

Status: **accepted** (owner, 14 Nov 2026)

## Context
Two decided features cannot be done by a WebExtension alone (`PROPOSALS.md`, P40 and P41):
- **P40 level 2:** start and stop a VPN the user already set up in the operating system (WireGuard, OpenVPN, system VPN). A browser cannot run a tunnel. Level 1 (the user pastes a proxy address) needs no helper and is not covered here.
- **P41:** hand a downloaded file to ClamAV, if the user installed it, and show the answer. A browser cannot run another program.

The owner decided: no VPN of Klin and no default provider; ClamAV optional and off by default. Both features share one small program, so there is one decision and one thing to audit.

## Decision
1. **One helper, optional, not installed by default.** It is a separate open-source program (MIT, like Klin), installed only when the user turns on one of the two features and agrees. Without it, Klin works the same and says which features need it.
2. **Native messaging.** The extension talks to the helper through Firefox's native messaging (standard, no patch, ADR 0001). The helper's manifest names the one Klin extension ID allowed to call it. Nothing else can start it from the browser.
3. **A fixed list of commands, no shell.** The helper only knows: VPN on, VPN off, VPN status (for a connection the user named once), scan one file, report ClamAV status. Arguments are checked against the user's saved choices (the connection name, the downloads folder). It never runs text it receives as a command line and never uses a shell.
4. **No secrets, no network, no logs of what you browse.** It stores no passwords or keys (the VPN keeps its own in the operating system). It makes no network connection. It keeps no history: it answers and forgets. The ClamAV signature update stays ClamAV's own (`freshclam`, started by the user or the system); Klin does not fetch signatures (that would need its own ADR).
5. **Least privilege.** It runs as the user. If a VPN needs administrator rights, the operating system asks the user, as it does for the VPN program itself. The helper does not ask for or keep administrator rights.
6. **Say what it does not do.** The VPN command moves trust from the connection provider to the VPN operator and does not make the user anonymous. The scan is not an antivirus: it checks downloaded files only, a clean answer is not a guarantee, and it uses memory and time.

## To check in a prototype (not verified yet)
- Where each operating system expects the native messaging manifest, and whether Klin's installer can place it without administrator rights.
- That the extension ID check really stops other extensions and web pages from calling the helper.
- Whether a stopped or crashed VPN is noticed in time for the browser to cut traffic (P40 level 1 already does this for a proxy).
- Scanning large files: time limit, what the user sees while it runs, what happens when ClamAV is missing or its signatures are old.
- Signing of the helper on Windows and macOS (the same open question as for Klin itself).

## Consequences
- One more component to build, sign and update, kept small on purpose; its code is small enough to read in one sitting.
- It adds no outside connection of its own. If one is ever needed, it needs its own ADR.
- The helper is part of the connections audit (`docs/CONNECTIONS.md`) as "none", and of the licence list (`LICENSING.md`).
