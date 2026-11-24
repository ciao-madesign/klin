# Klin catalogue format, version 1

A catalogue (or a community profile) is one JSON file. Anyone can publish one. Klin treats it as untrusted until it has been read and checked, and **one invalid entry refuses the whole file**: nothing is saved halfway.

```json
{
  "klinCatalogue": 1,
  "kind": "catalogue",
  "id": "my-association-services",
  "name": "My association's services",
  "description": "What this list is.",
  "maintainer": "Who keeps it",
  "version": "1.0",
  "published": "2026-10-01",
  "license": "CC0-1.0",
  "source": "https://example.org/catalogue.json",
  "services": [
    {
      "name": "Chat",
      "url": "https://chat.example.org",
      "category": "chat",
      "description": "Matrix server of the association.",
      "software": "Synapse", "protocol": "Matrix", "operator": "My association", "country": "Italy",
      "model": "association", "costs": "donation", "registration": "invite",
      "checked": "2026-09-15", "source": "Their about page"
    }
  ]
}
```

## Required
`klinCatalogue` (must be `1`), `id` (lower case letters, digits, `.`, `_`, `-`, up to 64), `name`, `maintainer`, `version`, `published` (`YYYY-MM-DD`), `license`, `services` (a non-empty list). Each service needs `name` and `url`.

## Optional
`kind` (`"catalogue"`, or `"profile"` for a community profile: a set of services for one community), `description`, `source` (the address of the catalogue itself, used for manual updates). Per service: every other field above.

Values: `category` is one of `email chat social blog hosting lists video storage files docs media search community other`; `model` one of `community association personal commercial other`; `costs` one of `free donation subscription other`; `registration` one of `open invite closed unspecified`. An unknown value becomes `other` (or `unspecified`).

## Limits and rules
- At most **1 MB** and **2000 services**.
- Addresses: `http` or `https` only, no user name or password. Never `javascript:`, `data:`, `file:`, `about:`.
- Text only. No HTML or Markdown is interpreted, and **no image or icon is ever loaded** from a catalogue.
- Any field Klin does not know is **ignored and never applied**, and the preview lists it. A profile therefore cannot change the search engine, home page, proxy, DNS, protocol handlers, permissions or extensions: the importer has no code, and the extension has no permission, to do it.
- The same address twice in one file is kept once. An address already in your list from another source is skipped; the card you have stays.
- Downloads: `https` only, no cookies, no referrer, 15 seconds, 1 MB; Klin asks permission for that one server and gives it back afterwards.
- No signatures yet. Signed catalogues need a trust rule (keys chosen by the user, no central authority), to be written as an ADR before they are offered.
