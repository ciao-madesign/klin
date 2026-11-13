# Style changes to apply to existing screens

For an engineering session. Source of truth: `STYLE.md`. Nothing here has been applied. Ordered by visibility (what a person sees first comes first). English is the source language of each string; the Italian text is in `STYLE.md` section 6 and goes in `_locales/it`.

## 0. Shared foundation (do this first)
- Create one shared stylesheet with the tokens of `STYLE.md` 5.3 (dark default, light through `prefers-color-scheme` and a user switch), the 3 px radius, the 45-degree cut corner, the highlighter, the 2 px accent focus ring. Today the colours are repeated in each `style.css` (`#f6f7f4`, `#2f7d5b`, `#1c211e`, system font, 10 to 12 px radius).
- Bundle the three fonts (Chakra Petch 700, Inter 400/600, JetBrains Mono 500) with their licence texts. No outside request.
- Move all strings to `_locales/en` and `_locales/it` (`messages.json`) per extension.
- Tests that check wording and must change with the strings: `tests/acceptance/welcome/run.py` ("Welcome to Klin", "does not make you"), `private-window/run.py` ("does not make you"), `photo-privacy/run.py` ("Keep as is"), `attempts-log/run.py` ("Clear this page"). Update them in the same commit as the text.

## 1. Welcome page: the first thing every user sees
`extensions/welcome/page/index.html`, `style.css`
- Add the logo (disc with slit) and the tagline "Free. Independent. Yours." under the name.
- Replace the line "A browser that works for you, not for advertisers." by the tagline; move that sentence into the first paragraph.
- "What we stand for": cut to "Freedom, independence, equality, brotherhood and ecology." plus "Klin lets you leave out the companies, countries and sources you do not want. It never decides for you in secret." Remove "Draft wording. It will be replaced by Klin's charter."
- "Klin does not make you anonymous. It makes you harder to follow." becomes the one highlighted phrase of the page.
- Apply the new palette, fonts, cut corners. Section titles in normal case, bold, in the title face.
- New since the style session: `extensions/welcome/page/greenweb.html` (linked Klin and Greenweb page, with its test in `tests/acceptance/welcome/run.py`). Restyle it with the same tokens and move its strings to `_locales`; it only links out to the Greenweb repository, no outside requests are made by the page.
- Keep: "What Klin does not do" section and the "loads nothing from the internet" note.

## 2. Browser and toolbar icons
`branding/` (empty today), `extensions/welcome/icon.svg`, `extensions/connections/icon.svg`, `extensions/attempts-log/icon.svg`
- Draw the master logo (STYLE.md 5.2) and the 16/32/48/128 px versions; monochrome version.
- Toolbar icons: 2 px stroke, square caps, sharp joints; replace `#2f7d5b`.
- `extensions/attempts-log/background.js` lines 50-51: badge colours `#2f7d5b` / `#a35f00` become lime `#d4ff2a` (calm) and amber `#ffb020` (worry), with black badge text.

## 3. Photo privacy dialog
`extensions/photo-privacy/content.js` (CSS inside `style.textContent`, strings at lines 71-82)
- Title "This photo shares where it was taken" becomes "This photo says where it was taken."
- Body "contains hidden data the site can read:" becomes "It carries hidden data. Whoever receives it can read it:"
- Buttons: "Remove and continue" to "Clean and continue", "Keep as is" to "Keep it", "Cancel upload" to "Cancel".
- Note: shorten as in STYLE.md section 6. Highlight "It cannot know what a site does with a photo you keep." only if no other highlight is on the dialog.
- Colours `#2f7d5b`, rounded corners: new tokens, cut corner on the dialog and the buttons. Update `README.md` ("Remove and continue").

## 4. Lookalike-domain warning
`extensions/lookalike/page/warning.html`, `warning.js` (lines 25-26), `warning.css`
- Title and body as in STYLE.md section 6. Buttons "Go to {known}" / "Continue to {site}" keep the pattern, new styling.
- Use the warning colour for the page accent; the highlighter is not used here (it is a warning).

## 5. Honest private window
`extensions/private-window/page/index.html`, `style.css`
- Keep the structure ("What it does not hide" list). Highlight "It does not make you invisible." as the one highlighted phrase. New tokens and fonts.

## 6. Collection log popup
`extensions/attempts-log/popup/popup.html`, `popup.css`, `popup.js`; `manifest.json` name and description
- "Collection attempts" and "Clear this page" move to strings files; new tokens; count shown in the mono face.
- Keep the "Not shown:" paragraph. Do not highlight anything here.

## 7. Self-test page
`extensions/self-test/page/index.html`, `page.js` (labels and the `GROUPS` explanations), `style.css`
- Heading and legend as in STYLE.md section 6. Each result row carries a word and an icon as well as a colour (protected, exposed, visible).
- First use of each term (tracker, fingerprinting) explained in one sentence, further explanation one click away.

## 8. Connections page
`extensions/connections/page/index.html`, `page.js`, `style.css`; `extensions/connections/data/connections.json` (379 lines: copy of every entry)
- New intro sentence, tokens, fonts. Entries stay as data; their wording is rewritten in the same voice (short, who receives it, why, how to turn it off).
- `docs/CONNECTIONS.md` is generated by `build/gen-connections-doc.py` from this data: regenerate it after the text changes.

## 9. Manifests: names and descriptions
Each `extensions/*/manifest.json`: keep the English product names ("Klin Self-test", "Klin Photo Privacy" ...), move name and description to `_locales`, rewrite descriptions in the new voice (short, with what it does not do).

## 10. Documentation to align
- `README.md`: tagline.
- `branding/README.md`: link to `docs/STYLE.md` and the logo files.
- `docs/STATUS.md`: open questions (done in the style session).
