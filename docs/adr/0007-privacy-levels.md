# ADR 0007 – Privacy levels: how Standard, Advanced and Maximum are applied

Status: accepted (levels decided by the owner on 13–14 Nov 2026; mechanism chosen 14 Nov 2026)

## Context
The owner decided (see P29 in `PROPOSALS.md`): **Standard** is the default; **Advanced** is Standard plus a fixed time zone and nothing else (screen size, touch and the rest stay real); **Maximum** is the full fingerprint protection plus Tor and nothing kept on disk (named "Maximum", never "Anonymous"). Firefox's own way to fix the time zone is the preference `privacy.fingerprintingProtection.overrides` with `+JSDateTimeUTC`.

Problem found while building: **an extension cannot write that preference.** The WebExtensions `privacy` API only exposes `resistFingerprinting` (the full package), which the owner does not want for Advanced (measured below). Writing the preference needs privileged code, a Firefox patch (ADR 0001: none for now) or a helper outside the browser.

## Decision
- **Mechanism for now: an extension, `extensions/privacy-level`.** Advanced registers a small script that runs in every page and frame before the page's own scripts and makes the time zone UTC (dates, `Intl`, text forms of dates, dates written without a zone). Standard registers nothing. Removing the extension removes the level (tested). No patch.
- **This is an approximation and says so** on the level's own page: a page that looks hard can notice the replaced functions, and background workers are not covered. `Temporal` is covered only for the zone name.
- **Maximum** is shown and disabled until Tor is integrated (Phase 4); it will use Firefox's full protection plus Tor and needs its own ADR then.
- **When a privileged helper exists** (see the helper decisions listed in `adr/README.md`), Advanced switches to Firefox's own `+JSDateTimeUTC` override and the in-page script is deleted.

## Why not the full protection for Advanced
Measured with the self-test, Firefox 160.0 on Linux (headless), Klin configuration, Standard vs `privacy.resistFingerprinting`:

| Detail | Standard | Full protection |
|---|---|---|
| Screen and window | real (1366×768) | generic (rejected by the owner for Advanced) |
| Time zone | real | generic |
| Canvas read-out | altered | random on every read |
| Touch screen | no | reports 5 touch points |
| Audio fingerprint, processor count, installed fonts | visible | **still visible** |

So the full package changes more than the owner wants and still leaves the audio, processor and font gaps of the audit (`PRINCIPLES.md`, principle 1) open. Those need other measures.

## Verified
`tests/acceptance/privacy-level/run.py`, in a Firefox whose system time zone is America/New_York: Standard shows the real zone; Advanced shows UTC for dates built from parts, from text with and without a zone, `Intl`, local-time formatting, text forms, and inside frames, while the real screen size and languages stay; `Date` still behaves like `Date` (instance checks, native-looking functions); Standard restores the real zone; Maximum cannot be chosen; removing the extension leaves nothing behind.

## Not verified
- **Real sites.** No access from the build environment, and the owner decided (14 Nov 2026) that no site test is needed before release: the page states the cost (booking and calendar sites can show times shifted by one or two hours) and offers one click back to Standard. A page that parses dates in unusual ways may still see local time.
- That the choice survives a browser restart (the script registration is persistent and `onStartup` re-applies it; only install, switching and removal were run).
- Detection resistance against a page written to find the replaced functions: not attempted.

## Consequences
- The dashboard (Phase 1) shows the current level and the line under its name, from `levels.js`.
- The strings are English only for now; they follow the style guide (`STYLE.md`) and still need `_locales` messages and the Italian text.
