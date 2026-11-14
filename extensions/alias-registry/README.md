# alias-registry

"My aliases" (P26): your own list of which email address or username you gave to which website. If spam arrives on one address, you know who passed it on. Opens from its toolbar button.

Status: **v0.1, working and verified in Firefox 160.0.**

- Entries: type (email or username), the alias, the site it was given to, an optional note.
- **Who got it?** Type the address that received spam; the page names the site(s) you gave it to.
- Search, delete, and a **backup file** (plain JSON) you can save and load again; loading adds only new valid entries and never duplicates.
- **Plus-address helper:** `me@example.org` + `shop.example` gives `me+shop.example@example.org`. It says plainly that this works only with some providers and that anyone can strip the tag.
- **Link with the username check (P38):** the username check can ask this extension for the usernames in the list (only usernames; only that extension is answered), so you pick a name instead of typing it.

## What it does not do
- It does not create aliases or mailboxes. Klin runs no alias service; you use one you choose and record the result here. (Generating through a chosen service is not built.)
- It is stored on this device only, in your Klin profile, **not encrypted**; anyone who can open the profile can read it. No sync, nothing sent anywhere.
- It cannot prove who leaked an address: it tells you who you gave it to, and a site can also be breached.
- A backup is a plain file; keep it where you keep private files.

## Not done yet
- Optional encryption with a passphrase.
- Generating aliases through a service of the user's choice.
- Import from password managers; suggesting an entry when you sign up on a site.
- Part of the larger Data Footprint Manager (Appendix B); it will feed the dormant-account finder (P25) and "Find me" (P27).
- Permanent install needs the extension signed.

## Tests
- `node tests/acceptance/alias-registry/unit.js`: 15 checks.
- `python3 tests/acceptance/alias-registry/run.py FIREFOX_DIR`: 16 checks in a real Firefox (add, refuse a bad address, who got it, plus helper, search, persistence across reload, the username check being offered only usernames, delete, loading a backup, refusing a bad file).
