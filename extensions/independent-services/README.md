# independent-services

Klin Independent Services (KIS, P42), **step 1: the hub.** A directory on your own device of services you can choose from (email, chat, hosting and more). A directory, not a network: no Klin server, no account, no telemetry, nothing connects by itself. Opens from its toolbar button, present from the first start.

Status: **v0.1, working and verified in Firefox 160.0.** Step 2 (importing catalogues) is next; it makes the first release.

- **Cards:** name, host, what it does, category, who runs it, software, protocol, country, cost, sign-up, date of the last check, where you learned it.
- **Add by hand** (the list starts empty: Klin ships no services and preselects none). Only `http` and `https` addresses; no user name or password in the address; the same address twice is refused.
- **Find:** search (name, description, software, protocol, who runs it, country, host; accents and case ignored), category, "run by" (community, association, one person, company), favourites only.
- **Order:** alphabetical, your favourites first. No scores, no ranking, no "independent" label: you decide with the filters.
- **Old data:** a card says "checked more than 12 months ago" (the number is yours to change) or "never checked".
- **Open** is a plain link in a new tab (`noopener`, no referrer). No Klin proxy.
- Two fixed lines are always on screen: being in the list is not an approval; KIS does not certify, guarantee or host anything, and every link takes you to a third party who sees your IP address.

## What it does not do
- It does not rate anyone and does not verify the services: dates and details are what you wrote.
- It is stored on this device only, in your Klin profile, not encrypted.
- Permissions: `storage` only. No host permission.

## Languages
English and Italian (`_locales`); `?lang=it` forces one. The Italian still needs the owner's read-through.

## Not done yet
- Catalogue import (address, file, list of addresses), preview of domains, profiles (step 2).
- Backup file, marks from third-party lists, infrastructure cards, transparency checks, local assistant (later phases of the specification).

## Tests
`node tests/acceptance/independent-services/unit.js` (25 checks) and `python3 tests/acceptance/independent-services/run.py FIREFOX_DIR` (23 checks, real Firefox).
