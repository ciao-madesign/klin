# Klin style and tone

Decided with the project owner on 13 Nov 2026. This is the single reference for the voice, wording and look of every Klin screen. Mock-ups of each decision are in `docs/style/`. The list of changes to apply to existing screens is in `STYLE-CHANGES.md`.

Status: **decided and applied** to the existing screens on 13 Nov 2026 (see `STYLE-CHANGES.md` for what was done and what remains), except the items in section 9 (open).

## 1. Voice
Direct, raw, a little punk, a little militant. Objective truth, said plainly, "like compressed air". No false or soothing phrases, no padding, no cheerfulness for its own sake.

Guardrails (they come from the project rules and keep the voice honest):
- Raw means **facts, short, concrete**. Never drama, never insults, never fear. No exclamation marks used as an alarm.
- Klin never claims more than it does. "Klin does not make you anonymous" is exactly the kind of blunt truth this voice is for.
- Klin states, the user decides. No lectures, no guilt.
- Every feature says what it does not do, in the same plain tone.
- Write short sentences. One idea each. Say who sees what.

## 2. Vocabulary
Plain and direct, **closer to the technical terms** than to everyday paraphrase. No slang, no invented nicknames.
- Use the real terms: tracker, fingerprinting, cookie, IP address, DNS. Explain each in one short sentence the first time, and keep the explanation one click away afterwards.
- Name what happens, not a metaphor.
- **Avoid:** slang; jokes at the user's expense; marketing words ("smart", "magic", "supercharged", "total protection", "100% safe"); soft words that hide a fact ("might", "possibly" when we know); the word "anonymous" in any promise; war or crime imagery.

Proposed terms (defaults chosen by the guide; the owner can change them). The English term is the source of truth for code; Italian is written, not translated word by word.

| English | Italian | Note |
|---|---|---|
| tracker | tracker | explain once: "script che ti segue da un sito all'altro" |
| fingerprinting | fingerprinting | explain once: "riconoscerti dalle caratteristiche del tuo dispositivo" |
| collection attempt | tentativo di raccolta | the log is the "registro dei tentativi" |
| private window | finestra privata | always followed by what it does not hide |
| connection (the browser makes) | connessione | |
| What can this site see? | Cosa vede questo sito? | name of the self-test |
| protection levels | livelli Standard, Avanzato, Massimo | decided 13 Nov 2026. Not "Anonymous": Klin never promises anonymity. Under the level name, always say what it hides and what it does not ("Livello Massimo. Non ti rende anonimo: i siti vedono ancora il tuo indirizzo.") |
| lookalike site | sito che imita | |
| IP address | indirizzo IP | |
| strip / clean (a photo) | ripulire | "Ripulisci e continua" |
| blocked | bloccato | |
| exposed / visible / protected | esposto / visibile / protetto | self-test legend |

Feature names stay in English as product names ("Klin Self-test") and get a plain Italian label in the interface.

## 3. How values are stated
- **Where:** only on the welcome page and in the charter. Everyday messages talk about functions, not ideals. No slogans in normal screens.
- **Exact wording, nothing added:** "Freedom, independence, equality, brotherhood and ecology." Italian: "Libertà, indipendenza, uguaglianza, fratellanza ed ecologia." (Ecology was added by the owner on 13 Nov 2026; the owner closed the list there.) The current welcome paragraph "What we stand for" is cut down to this line plus one sentence about function (see `STYLE-CHANGES.md`). **Decided 13 Nov 2026:** the welcome page and everyday screens state only these five values. The **charter** (P36) is the one public place for the fuller list (including antifascism, freedom of expression and rejection of regimes) and for the published criteria behind source markers: what is flagged, on what documented facts, who reviews, how to challenge. It is a separate document, read only by whoever looks for it, and is linked from the welcome page in one line. Who reviews entries and how appeals work is a governance decision, still open.
- **Source flags (P34, P35):** no real labels. A small **marker** next to a result or source, collapsed by default and **expandable** on click. Expanded, it shows: what the flag is, the published criterion, the source of the fact, and how to challenge or switch it off. Never hides or blocks a source; the user can turn markers off. Markers are discreet: not banners, not red alarms.

## 4. Languages and translation
- **Now:** Italian and English. The Italian was written by the guide session from the owner's decisions and still needs the owner's read-through. Neither is a machine translation of the other: each is written in the voice above.
- **Later (phase 2):** more languages by machine translation, **approved by human translators** before shipping. No language ships unreviewed.
- **Technical approach:** strings move out of HTML and JavaScript into one strings file per extension and language (WebExtensions `_locales/<lang>/messages.json`). Translators get this guide, the vocabulary table and a do-not-translate list (Klin, Firefox, technical terms as decided in section 2).
- The language follows the browser's language. A switch inside Klin will come with a settings page (extensions cannot share a setting today); until then `?lang=it` or `?lang=en` on a Klin page forces a language, for previews and tests.

## 5. Visual identity

### 5.1 Direction
**"Manifesto"**: strong contrast, one acid accent colour, sharp shapes, short heavy titles. **Dark mode is the default**; light mode follows the same tokens; "follow the system" is an option. Mock-up: `docs/style/direzioni.html` (option A, with its original red-orange accent replaced, see 5.3).

### 5.2 Logo
History: a torn square, a K, an open globe, a dissolving globe, a circle with a bar and a mask were compared (`docs/style/logo.html` to `logo5.html`). Chosen: **a disc with an eye slit**, a stylised ninja mask: the idea of "not traceable".
- **Shape:** a solid disc with a V-shaped slit cut out (transparent, so the background shows through). In a 100 x 100 box: circle centre (50,50), radius 45; slit polygon `14,38 50,52 86,38 86,56 50,68 14,56`. Master drawing: `docs/style/logo5.html`, variant B.
- **Colour:** acid lime `#d4ff2a` on dark; solid black `#0e0e10` on light (olive `#4a6600` allowed). One colour, no gradient, no outline, no effects.
- **Use:** browser icon, tab icon, favicon, avatar, stickers. Legible at 16 px. Clear space: a quarter of its width. No separate wordmark: the name stays in running text.
- **Honesty:** the mask says "hard to trace", not "anonymous". Texts next to it never claim anonymity.
- **Future, not V1:** the slit may animate and become the right-hand part of the "k" in "klin". For now the slit stays made of two straight diagonals so it can morph into the arms of a k. Any animation respects "reduce motion" and never runs in the background.
- Not derived from any Firefox mark or colour (repository rule).

### 5.3 Colour
The first accent (red-orange) was dropped: too close to Claude's identity. Chosen: **acid lime** (`docs/style/colori.html`, option B).

| Token | Dark (default) | Light |
|---|---|---|
| Background | `#0a0a0a` | `#f1f1ec` |
| Surface (cards) | `#141414` | `#ffffff` |
| Hairline (between rows) | `#222222` | `#dcdcd4` |
| Card border | `#3a3a3a` | `#bdbdb4` |
| Text | `#f1f1ec` | `#0e0e10` |
| Muted text | `#a8a8a2` | `#55554f` |
| Accent | `#d4ff2a` | `#4a6600` (olive: for text, lines, markers) |
| Text on accent fill | `#0e0e10` | `#ffffff` on olive; `#0e0e10` on lime |
| Error / danger | `#ff5a6a` | `#c8102e` |
| Warning | `#ffb020` | `#8a5a00` |

Rules: **red is for real errors and dangers only**, never decoration. No orange or terracotta anywhere except the warning amber, which is used only for warnings. Colour never carries meaning alone: every state also has a word or an icon.

### 5.4 Tagline
**"Free. Independent. Yours."** Italian: **"Libero. Indipendente. Tuo."** The old line "Privacy first. Low impact. Local intelligence." stays only as a small technical description where Klin must be explained.

### 5.5 Typography
- **Titles and the name "Klin": Chakra Petch**, bold (700). Cut corners that echo the logo's slit.
- **Interface and short text: Inter**, 400 and 600.
- **Long reading: Source Serif 4** (400/600): the welcome pages, the explanations at the bottom of a page, and later the charter. Never in buttons, labels or dialogs.
- **Small labels and technical values: JetBrains Mono**, 500, uppercase and letter-spaced, sparingly.
- All four are free under the SIL Open Font License and **bundled inside the browser**: no Google Fonts, no outside request. Ship the licence texts with the fonts. Check Italian accents render in all three.
- Fallback: `system-ui, sans-serif`; `ui-monospace, monospace` for labels.
- Mock-up: `docs/style/caratteri.html`.

### 5.6 Shapes and icons
Style "sharp with room to breathe" (`docs/style/forme.html`, option B): corner radius about 3 px; 2 px borders on buttons and on the focus ring; titles in normal case, bold (no all-caps titles); icons with a 2 px stroke on a 24 px grid, square caps and sharp joints. The soft 12 px style of the engineering drafts is dropped.

### 5.7 Signature detail
Two things together (`docs/style/firma.html`):
- **The cut:** one corner (top right) of every card, button and dialog is cut at 45 degrees, with the angle of the logo's slit. About 14 px on cards, 7 px on buttons. Inputs and small chips keep the plain 3 px corner. Never cut a box so that text near the corner is clipped. While an element has keyboard focus the cut is removed and a plain 2 px accent rectangle is drawn, so the ring is never clipped.
- **The highlighter:** at most **one** phrase per screen is highlighted (lime background, black text). It is for the plain truth the user must not miss, such as "Klin non ti rende anonimo." Never decoration, never in warnings, never more than one per screen.

## 6. Before and after (taken from the existing screens)

| Screen | Before (draft) | After |
|---|---|---|
| Photo dialog title | "This photo shares where it was taken" | EN "This photo says where it was taken." IT "Questa foto dice dove l'hai scattata." |
| Photo dialog body | "contains hidden data the site can read:" | EN "It carries hidden data. Whoever receives it can read it:" IT "Contiene dati nascosti. Chi la riceve li legge:" |
| Photo buttons | "Remove and continue" / "Keep as is" / "Cancel upload" | EN "Clean and continue" / "Keep it" / "Cancel". IT "Ripulisci e continua" / "Lascia com'è" / "Annulla" |
| Photo note | "Removing does not change the picture itself. Klin checks photos chosen with the upload button or dropped into the page, not pasted ones, and cannot tell what a site does with a photo you keep." | EN "Cleaning does not change the picture. Klin checks photos you pick or drop on the page. Not pasted ones. It cannot know what a site does with a photo you keep." |
| Lookalike title | "Check this address" | EN "This address imitates a site you know." IT "Questo indirizzo imita un sito che conosci." |
| Lookalike body | "The site you are opening has a name very close to one you already know. Imitating a familiar name is a common way to steal passwords." | EN "The name is almost the same as one you know. It is a common trick to steal passwords." IT "Il nome è quasi uguale a uno che conosci. È un trucco comune per rubare password." |
| Lookalike buttons | "Go to {known}" / "Continue to {site}" | IT "Vai a {known}" / "Continua su {site}" |
| Private window | "It keeps this computer from remembering what you do here. It does not make you invisible." | EN unchanged in substance, with **"It does not make you invisible."** as the one highlighted phrase. IT "Questo computer non ricorda cosa fai qui. Non ti rende invisibile." |
| Welcome tagline | "A browser that works for you, not for advertisers." | EN "Free. Independent. Yours." as the tagline; the old line moves to the first paragraph. IT "Libero. Indipendente. Tuo." |
| Welcome values | "Freedom, independence, equality and brotherhood. Freedom of expression for everyone, and no room for regimes or for fascism. ... Draft wording. It will be replaced by Klin's charter." | EN "Freedom, independence, equality, brotherhood and ecology." then "Klin lets you leave out the companies, countries and sources you do not want. It never decides for you in secret." |
| Welcome limits | "Klin does not make you anonymous. It makes you harder to follow." | Same words, **highlighted**: the one highlighted phrase of the page. |
| Self-test heading | "What a site can see" | IT "Cosa vede un sito" |
| Self-test status | "Running the checks…" | IT "Controllo in corso…" |
| Self-test legend | "Protected / Exposed / Visible" | IT "Protetto / Esposto / Visibile" |
| Connections intro | "Every connection the browser makes on its own, without you opening a site: who receives it, why, and how to turn it off." | IT "Ogni connessione che il browser fa da solo, senza che tu apra un sito: chi la riceve, perché, come spegnerla." |
| Collection log | "Collection attempts" / "Clear this page" | IT "Tentativi di raccolta" / "Cancella per questa pagina" |
| Badge colours | green `#2f7d5b` (calm), amber `#a35f00` (worry) | lime `#d4ff2a` with black text (calm), amber `#ffb020` with black text (worry) |

## 7. Do and don't

| Do | Don't |
|---|---|
| "3 tracker bloccati." | "Ti abbiamo salvato da 3 spie!" |
| "Klin non ti rende anonimo. Ti rende più difficile da seguire." | "Navighi in totale anonimato." |
| "Questa foto dice dove l'hai scattata. La ripulisco?" | "Attenzione! La tua posizione è a rischio!" |
| State the cost: "Livello Avanzato: alcuni siti possono non funzionare." | Hide the cost, or make the user find it. |
| Say who sees what: "Il tuo provider vede quali siti contatti." | "Potrebbe esserci qualche rischio." |
| Explain a term once, in one sentence. | Fill the screen with jargon, or with metaphors. |
| One highlighted phrase per screen. | Highlight everything, or highlight a warning. |
| Mark a source with a small expandable marker. | Put a red banner or hide a source. |

## 8. Accessibility
- **Contrast** (WCAG 2.1 AA needs 4.5:1 for text, 3:1 for large text and interface parts). Checked automatically for every token pair by `tests/acceptance/style/run.py`; all pairs pass. Re-run it when a colour changes.
- **Keyboard:** everything reachable and usable by keyboard, logical order, visible focus ring (2 px accent, follows the cut corner), no keyboard trap. Esc closes dialogs; the dialog traps focus while open and returns it on close.
- **Screen readers:** headings in order, real buttons and links (never clickable divs), labels on icon-only buttons, status messages in `role="status"`, dialogs with `role="dialog"` and a label. The expandable source marker is a button with `aria-expanded`.
- **Not by colour alone:** every state (protected, exposed, warning, error) has a word or an icon as well as a colour.
- **Size:** body text at least 16 px; respect the browser's zoom and text-size setting; layout works at 200 percent zoom without sideways scrolling.
- **Motion:** respect "reduce motion"; no autoplay; no animation in the background; no flashing.
- **Language:** each page declares its language (`lang`); Italian and English strings are separate files (section 4).
- **Touch and pointer:** targets at least 32 px (44 px when mobile arrives).
- **Highlighter and cut corner:** the highlighter is lime with black text (contrast 16.7); the cut corner never reduces the clickable area below the target size.
- No fonts, images or scripts from the internet in any page: everything is bundled.

## 9. Still open
- **Reference site** (`thedarksalad.it`, analysed 13 Nov 2026): its three useful ideas were accepted by the owner and are applied: a deeper black (`#0a0a0a`) with `#222` hairlines between rows, a serif for long reading, and keeping our lime accent instead of its blue. Nothing else is taken from it.
- **Level names:** decided (Standard, Avanzato, Massimo; English: Standard, Advanced, Maximum). The code and docs that still say "Anonymous" (`PRINCIPLES.md`, `PROPOSALS.md` P29, `ROADMAP.md`) are renamed when P29 is built.
- **Italian terms** in section 2 are guide defaults awaiting the owner's confirmation.
- **Charter** (P36): decided where it goes (public, separate document, full list of values and the criteria of source markers; see section 3). Still to do: write it, and decide who reviews entries and how to contest them.
- **Master artwork:** clean SVG masters are in `branding/` (lime, black, white, lime on dark). Still to do: PNG exports and a real check of the 16 px and 32 px renderings in the toolbar.
