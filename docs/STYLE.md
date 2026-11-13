# Klin style and tone (work in progress)

Decisions are recorded here as the owner takes them. Status: **draft, session in progress**.

## 1. Voice (decided 13 Nov 2026)
Direct, raw, a little punk, a little militant. Objective truth, said plainly, "like compressed air". No false or soothing phrases, no padding, no cheerfulness for its own sake.

Guardrails (from the project rules, they keep the voice honest):
- Raw means **facts, short, concrete**. Never drama, never insults, never fear. No exclamation marks used as alarm.
- Klin never claims more than it does: "Klin does not make you anonymous" is exactly the kind of blunt truth this voice is for.
- The user is not lectured. Klin states, the user decides.

Example (photo with location):
- Before: "This photo shares where it was taken."
- After (Italian): "Questa foto dice dove l'hai scattata. Chiunque la riceva lo legge. La ripulisco?"

## 2. Vocabulary (decided 13 Nov 2026)
Plain and direct, **closer to the technical terms** than to everyday paraphrase. No slang, no invented nicknames ("cringe" is out).
- Use the real terms: tracker, fingerprinting, cookie, IP address, DNS. Explain each in one short sentence the first time it appears, and keep explanations one click away after that.
- Name what happens, not a metaphor: "3 tracker bloccati. Il sito ha provato a riconoscerti dalle caratteristiche del tuo dispositivo (fingerprinting)."
- Avoid: slang, jokes at the user's expense, marketing words ("smart", "magic", "supercharged"), soft words that hide the fact ("potrebbe", "forse" when we know).
- Terms list (Italian/English equivalents) to be completed in the final version.

## 3. How values are stated (decided 13 Nov 2026)
- **Where:** only on the welcome page and in the charter (option A). Everyday messages talk about functions, not ideals. No slogans in normal screens.
- **Exact wording of the values, nothing added:** "Freedom, independence, equality and brotherhood." (No extra clauses such as antifascism, free expression or rejection of regimes in the stated line. The current welcome-page paragraph "What we stand for" must be cut down to this line. `PRINCIPLES.md` item 9 and the charter, P36, still hold the owner's fuller list as working principles; the owner decides separately whether they appear anywhere in public text.)
- **Source flags (P34/P35):** no real labels. Instead a small **marker** next to a result or source, collapsed by default and **expandable** on click. Expanded it shows: what the flag is, the published criterion, the source of the fact, and how to challenge or switch it off. Never hides or blocks a source; the user can turn markers off. Markers are discreet, not banners, not red alarms.

## 4. Languages and translation (decided 13 Nov 2026)
- **Now:** Italian and English, both written and checked by the owner. Neither is a translation of the other by machine: each is written in the voice above.
- **Later (phase 2):** more languages, produced by machine translation and **approved by human translators** before shipping. No language ships unreviewed.
- **Technical approach:** strings move out of HTML/JavaScript into one strings file per extension and per language (WebExtensions `_locales` with `messages.json` fits). Translators get this guide, the vocabulary list and a "do not translate" list (Klin, Firefox, technical terms kept as decided in section 2).
- Language follows the browser's language; the user can switch it.

## 5. Visual identity (in progress)
### 5.1 Direction (decided 13 Nov 2026)
- **Direction A, "Manifesto":** ink-and-paper contrast, one hot accent colour (red-orange), sharp corners, heavy short headings. Mock-up: `docs/style/direzioni.html`.
- **Dark mode is the default.** Light mode exists and follows the same tokens; the user can switch, and "follow the system" is an option.
- **Reference taste from the owner:** the site thedarksalad.it (not yet analysed: unreachable from the session; to be described by the owner or allowed in the network settings).
- **Font (provisional, to revisit later):** the owner liked the look of the "Klin and Greenweb" artifact: **Bricolage Grotesque** for headings, **Inter** for body text, **JetBrains Mono** for small labels. All three are open fonts (SIL OFL). They must be **bundled in the browser**, never loaded from Google Fonts (rule: no external requests).
- Long texts stay in a plain, readable face (Inter); the heavy display face is only for titles and the wordmark.

### 5.2 Logo (decided 13 Nov 2026)
- **The logo is the symbol only: the "torn square"** (a solid accent-colour square cut by a diagonal gap: the censorship bar, broken). Mock-up: `docs/style/logo.html`, option 2.
- Used as browser icon, tab icon, stickers, favicon, social avatar. Accent red-orange on dark; the same shape in solid black or white where one colour is required.
- There is **no separate wordmark logo.** The name is written "Klin" in running text, or "klin" in lowercase in the display face where a title needs it. The symbol and the name are not locked together.
- Must stay legible at 16 px. Clear space around it: at least a quarter of its width. Never rotated, outlined, recoloured out of palette, or given effects.
- Not derived from any Firefox mark or colour (repository rule).

### 5.3 Tagline (decided 13 Nov 2026)
- **"Free. Independent. Yours."** / Italian: **"Libero. Indipendente. Tuo."**
- The old line "Privacy first. Low impact. Local intelligence." stays only as a small technical description where Klin must be explained.

### 5.4 Colour (decided 13 Nov 2026; replaces the red-orange of 5.1)
The owner found red-orange too close to Claude's identity. Chosen accent: **acid lime**. Mock-up: `docs/style/colori.html`, option B.

| Token | Dark (default) | Light |
|---|---|---|
| Background | `#0e0e10` | `#f1f1ec` |
| Surface (cards) | `#18181b` | `#ffffff` |
| Text | `#f1f1ec` | `#0e0e10` |
| Accent | `#d4ff2a` | `#4a6600` (olive, for text, lines, markers) |
| Text on accent fill | `#0e0e10` | `#ffffff` on olive fill; `#0e0e10` on lime fill |

Contrast measured: accent on background 16.7:1 (dark), 5.8:1 (light); all pass WCAG AA (4.5:1). Rule: **red is reserved for real errors and dangers**, never decoration. Avoid orange and terracotta anywhere (identity clash).

### 5.2 Logo (decided 13 Nov 2026; replaces three earlier attempts)
History: the torn square (withdrawn: its accent was too close to Claude's identity), then the K, the open globe, the dissolving globe, the circle-and-bar and the mask variants were compared (`docs/style/logo2.html` to `logo5.html`). Chosen: **the disc with an eye slit**, a stylised ninja mask: idea of "not traceable".
- **Shape:** a solid disc with a V-shaped slit cut out (transparent, so the background shows through). Geometry in a 100 x 100 box: circle centre (50,50), radius 45; slit polygon `14,38 50,52 86,38 86,56 50,68 14,56`. Master file to be drawn from `docs/style/logo5.html`, variant B.
- **Colour:** acid lime `#d4ff2a` on dark. On light backgrounds: solid black `#0e0e10` (or olive `#4a6600`). One colour only, no gradients, no outline, no effects.
- **Use:** browser icon, tab icon, favicon, avatar, stickers. Legible at 16 px. Clear space: at least a quarter of its width. No separate wordmark; the name stays in running text.
- **Honesty:** the mask says "hard to trace", not "anonymous". The texts next to it must never claim anonymity (rule: Klin does not make you anonymous, it makes you harder to follow).
- **Future, not for V1:** the slit may animate and become the right-hand part of the "k" in "klin" (a loading or welcome animation). Constraint for now: keep the slit made of two straight diagonals, so it can morph into the arms of a k. Any animation must respect "reduce motion" and never run in the background.
- Not derived from any Firefox mark or colour (repository rule).
