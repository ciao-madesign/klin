# Handoff: defining Klin's style and tone

For the session that will guide the owner through defining Klin's identity. Written 13 Nov 2026 by the engineering session. Read `docs/STATUS.md` and `docs/PRINCIPLES.md` first.

## Goal
Klin must be recognised as **the browser for people who want to be free and independent, with clear ethical values.** Nothing about its voice, wording or look has been studied yet. The goal of this session is to define it with the owner and write it down in `docs/STYLE.md`, so every later screen follows one identity.

## What the owner has said (their words, condensed)
- Klin is for people who want to be free and independent, with clear ethical values.
- Values to promote: freedom, brotherhood, independence, equality, rejection of regimes, antifascism, freedom of expression.
- Principles: privacy first, freedom from the algorithm, freedom of choice (exclude countries, services, companies), finding and erasing one's own traces, aliases, immunity from influence, penalising sources tied to unacceptable spheres, ecological and ethical use of the web. Full text and audit: `docs/PRINCIPLES.md`.
- Working preferences: short answers, not technical unless asked, in Italian. One decision at a time, explained very simply, with pros and cons. They want a recommendation, not a menu.
- One question was asked and **not answered**: the voice. Options offered: calm and direct (recommended) · militant · warm and friendly · calm in daily use but firm on values (welcome page and charter only).

## What already exists (all provisional, written by engineers)
Every user-facing surface, with where its text lives. All English, plain, draft.
| Surface | File with the text |
|---|---|
| Presentation page (first start, info button) | `extensions/welcome/page/index.html` |
| Connections page | `extensions/connections/data/connections.json` (copy of every entry), `page/page.js`, `page/index.html` |
| Self-test "What can this site see?" | `extensions/self-test/page/page.js` (labels), `page/index.html`; the explanations are in the `GROUPS` table |
| Lookalike-domain warning | `extensions/lookalike/page/warning.js`, `warning.html` |
| Photo privacy dialog and notices | `extensions/photo-privacy/content.js` |
| Honest private window | `extensions/private-window/page/index.html` |
| Collection log (popup) | `extensions/attempts-log/popup/*`, texts in `background.js` |
| Extension names and descriptions | each `manifest.json` ("Klin Self-test", ...) |
**Visual tokens**, repeated in each page's CSS and chosen by engineers, not designed: light/dark following the system, background `#f6f7f4`, cards white, text `#1c211e`, accent green `#2f7d5b`, warning amber, system font, rounded corners of 10–12 px. `branding/` is empty; no logo, no illustration, no font choice. Rule from the repo: do not use Firefox logos or trademarks.

## Constraints the style must respect
1. **Honesty rule:** every feature states what it does not do. Klin never promises anonymity it cannot deliver (the default level is Standard; it makes tracking harder, it does not make the user anonymous). The voice must make this easy to say, not awkward.
2. **No alarmism, no preaching** in everyday messages; people should be able to read them calmly.
3. **Values are stated, not imposed:** Klin never decides for the user in secret; ranking and labels are always visible and changeable.
4. Plain words: the owner wants explanations a non-technical person can follow.
5. Accessibility: contrast, keyboard use, screen readers (specification section 7).
6. Languages: all text is English today. Decide which languages Klin ships in, and keep strings easy to translate (today they are inside HTML and JavaScript; a strings file per extension would be needed).
7. No tracking or external requests in any page, including fonts and images: everything is bundled (the project forbids connections that are not documented).
8. Name: "Klin" is given. Tagline today (README): "Privacy first. Low impact. Local intelligence."; the priority order was changed on 13 Nov to privacy first, then low impact, then security.

## Topics to cover, in this order
1. **Voice and tone:** the open question above. Use real examples from the table (e.g. the photo dialog, the private-window page, the welcome page) in each candidate voice and let the owner react.
2. **Vocabulary:** words Klin uses and avoids (e.g. "tracker", "fingerprint", "collection attempt", "private window"); how it names its features; Italian and English equivalents if both are shipped.
3. **How values are stated:** how much of the ideals (freedom, antifascism, ...) appears where. Suggested split to test with the owner: everyday messages sober, welcome page and charter explicit.
4. **Languages and translation approach.**
5. **Visual identity:** mood, colours (dark and light), type, shapes, tone of icons; logo direction (name only? symbol?); tagline. Offer 2–3 concrete directions the owner can compare, with small mock-ups (HTML pages or images), not abstract descriptions.
6. **Do / don't list** with before and after examples taken from the existing screens.

## Method
- One question at a time, in simple Italian, with a concrete example, pros and cons, and a recommendation. Wait for the answer before the next one.
- Show, don't describe: render each option on a real screen of Klin.
- Record each decision as it is made.

## Deliverables
1. `docs/STYLE.md`: voice and tone, vocabulary, how values are stated, languages, visual identity (palette with light and dark values, type, shapes, icon style, logo direction), do/don't examples, accessibility notes.
2. A short list of what must change in the existing screens (file and string), ordered by visibility, so an engineering session can apply it. Do not edit the extensions in this session unless the owner asks; each has tests that check some wording.
3. Update `docs/STATUS.md` (section 5, open questions) and, if the ethical statements change, `docs/PRINCIPLES.md` (the charter, P36, is related but is a separate task about governance).

## Repository rules
Branch for this session: the one the session is given. Commit and push there; no pull request unless asked. Commit messages end with the session's attribution lines. Documentation in English; talk to the owner in Italian.
