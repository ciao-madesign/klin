# alias-registry

"My aliases" (P26): your own list of which email address or username you gave to which website. If spam arrives on one address, you know who passed it on. Opens from its toolbar button.

Status: **v0.1, working and verified in Firefox 160.0.**

- Entries: type (email or username), the alias, the site it was given to, an optional note.
- **Who got it?** Type the address that received spam; the page names the site(s) you gave it to.
- Search, delete, and a **backup file** (plain JSON) you can save and load again; loading adds only new valid entries and never duplicates.
- **Plus-address helper:** `me@example.org` + `shop.example` gives `me+shop.example@example.org`. It says plainly that this works only with some providers and that anyone can strip the tag.
- **Disposable addresses, free and without sign-up (via mail.tm):** one button asks the service for a new random address and saves it in the list for the site you name. You read what arrives inside the page, as plain text only (HTML is never loaded, so no tracking images). Deleting the entry deletes the address on the service. Klin asks permission to contact the service first, and sends no cookies or referrer. The inbox password stays in this browser only and is not in backups.
- **Link with the username check (P38):** the username check can ask this extension for the usernames in the list (only usernames; only that extension is answered), so you pick a name instead of typing it.

## What it does not do
- It does not create permanent aliases or mailboxes. Klin runs no alias service. The disposable address comes from mail.tm, a third party: **mail.tm can read every message sent to it and may delete the address at any time**, so it is only for sign-ups and things you can afford to lose, never for banks, main accounts or password recovery. A permanent forwarding alias (SimpleLogin, addy.io and similar) needs an account with them; you can make one there and record it here by hand.
- It is stored on this device only, in your Klin profile, **not encrypted**; anyone who can open the profile can read it. No sync, nothing sent anywhere.
- It cannot prove who leaked an address: it tells you who you gave it to, and a site can also be breached.
- A backup is a plain file; keep it where you keep private files.

## Languages
English and Italian (`_locales`), in the browser's language; `?lang=it` or `?lang=en` forces one. The Italian still needs the owner's read-through. Errors from the mail.tm service stay in English.

## Not done yet
- Optional encryption with a passphrase.
- **The mail.tm code is written from its published API and has not been tried against the real service** (not reachable from the build environment). It is tested against a stand-in that follows the same API. Before relying on it, run it once against the real service; if the service changed or limits automated use, the page shows the error. More providers can be added in `providers.js`.
- Other providers, and permanent alias services through their own API keys.
- Import from password managers; suggesting an entry when you sign up on a site.
- Part of the larger Data Footprint Manager (Appendix B); it will feed the dormant-account finder (P25) and "Find me" (P27).
- Permanent install needs the extension signed.

## Tests
- `node tests/acceptance/alias-registry/unit.js`: 24 checks (15 on the list, 9 on the disposable provider with a fake service).
- `python3 tests/acceptance/alias-registry/run.py FIREFOX_DIR`: 17 checks in a real Firefox (add, refuse a bad address, who got it, plus helper, search, persistence across reload, the username check being offered only usernames, delete, loading a backup, refusing a bad file).
- `python3 tests/acceptance/alias-registry/run-disposable.py FIREFOX_DIR`: 14 checks in a real Firefox against a stand-in service: asks for the site first, permission, address created and saved, no cookie or referrer, password kept apart and not in the entry, inbox and message shown as plain text with no remote image, delete removes the address on the service and the password locally.
