# independent-services

Klin Independent Services (KIS, P42), **steps 1 and 2: the hub and catalogue import (the first release).** A directory on your own device of services you can choose from (email, chat, hosting and more). A directory, not a network: no Klin server, no account, no telemetry, nothing connects by itself. Opens from its toolbar button, present from the first start.

Status: **v0.2, working and verified in Firefox 160.0.**

- **Cards:** name, host, what it does, category, who runs it, software, protocol, country, cost, sign-up, date of the last check, where you learned it.
- **Add by hand** (the list starts empty: Klin ships no services and preselects none). Only `http` and `https` addresses; no user name or password in the address; the same address twice is refused.
- **Find:** search (name, description, software, protocol, who runs it, country, host; accents and case ignored), category, "run by" (community, association, one person, company), favourites only.
- **Order:** alphabetical, your favourites first. No scores, no ranking, no "independent" label: you decide with the filters.
- **Old data:** a card says "checked more than 12 months ago" (the number is yours to change) or "never checked".
- **Open** is a plain link in a new tab (`noopener`, no referrer). No Klin proxy.
- Two fixed lines are always on screen: being in the list is not an approval; KIS does not certify, guarantee or host anything, and every link takes you to a third party who sees your IP address.

## Catalogues (step 2)
- **Three ways in:** paste an `https` address, open a file from the device, or pick from Klin's short list of public catalogues (**empty for now: a catalogue is offered only after its licence is checked**; any catalogue can still be added by address).
- **Nothing starts by itself.** A download happens only when you press the button. Klin asks permission for that one server, sends no cookies or referrer, waits at most 15 seconds, takes at most 1 MB, and gives the permission back afterwards.
- **Preview before saving:** who made it, version, date, licence, address, what would be new, changed, removed or skipped, every domain in the file, a warning on domains that imitate another one in the file or in your list (the same check as the lookalike warning) and on domains written in other alphabets, and the fields that are ignored.
- **One bad entry refuses the whole file** (bad link, no name, bad date, over 1 MB, more than 2000 services, wrong format). The reason is shown and nothing is saved.
- **Provenance:** each card says which catalogue it came from. Catalogues can be switched off (their cards hide), updated by hand from their address (the previous version is kept, one step back), or removed with their cards. Your own cards are never touched.
- **Community profiles** are the same file with `"kind": "profile"`: services only. Unknown fields (like a search engine or proxy) are ignored and listed; the extension has no permission to change browser settings anyway.
- The format is documented in `CATALOGUE-FORMAT.md`.

## What it does not do
- It does not rate anyone and does not verify the services: dates and details are what you wrote.
- It does not check the catalogues: a catalogue can be wrong, out of date or made by someone with bad intentions. The preview shows what is in it; whether to trust it is up to you.
- It is stored on this device only, in your Klin profile, not encrypted.
- Permissions: `storage`. The permission to contact a catalogue's server is asked for each time and given back; nothing is held.

## Languages
English and Italian (`_locales`); `?lang=it` forces one. The Italian still needs the owner's read-through.

## Not done yet
- The list of public catalogue addresses (licences to check first). Receiving a shared set.
- Signed catalogues (needs the trust-rule ADR first), backup file, marks from third-party lists, infrastructure cards, transparency checks, local assistant (later phases of the specification).
- Not tried against real catalogues: only against files and an https stand-in made for the tests.

## Tests
`node tests/acceptance/independent-services/unit.js` (25) and `unit-catalogue.js` (36); `python3 tests/acceptance/independent-services/run.py FIREFOX_DIR` (23, real Firefox) and `run-import.py` (32, real Firefox, https stand-in).
