#!/usr/bin/env python3 -I
"""Static checks for the Klin style (docs/STYLE.md). No browser needed.

    run.py

Checks: shared files are in sync; English and Italian messages have the same keys, placeholders and markup;
every manifest message exists; the English text in each page equals its English message; no outside requests;
no leftover colours from the old drafts; contrast of the colour tokens.
"""
import html, json, pathlib, re, subprocess, sys

ROOT = pathlib.Path(__file__).resolve().parents[3]
EXT = ROOT / "extensions"
failures = []
def check(label, ok, detail=""):
    print(("ok   " if ok else "FAIL ") + label + ("" if ok or not detail else " - " + str(detail)[:300]))
    if not ok: failures.append(label)

# 1. shared copies
r = subprocess.run([sys.executable, "-I", str(ROOT / "build/sync-shared.py"), "--check"], capture_output=True, text=True)
check("shared style and fonts are in sync in every extension", r.returncode == 0, r.stdout)

# 2. locales
def plain(text): return re.sub(r"\*\*(.+?)\*\*|==(.+?)==|`(.+?)`", lambda m: m.group(1) or m.group(2) or m.group(3), text)
def holes(text): return sorted(re.findall(r"\{\d\}", text))
def marks(text): return (text.count("**"), text.count("=="), text.count("`"))
for ext in sorted(p.parent.parent.parent.name for p in EXT.glob("*/_locales/en/messages.json")):
    en = json.loads((EXT / ext / "_locales/en/messages.json").read_text())
    it = json.loads((EXT / ext / "_locales/it/messages.json").read_text())
    check("%s: English and Italian have the same messages" % ext, en.keys() == it.keys(), set(en) ^ set(it))
    check("%s: no empty message" % ext, all(v["message"].strip() for v in list(en.values()) + list(it.values())))
    bad = [k for k in en if k in it and (holes(en[k]["message"]) != holes(it[k]["message"]) or marks(en[k]["message"]) != marks(it[k]["message"]))]
    check("%s: placeholders and markup match in both languages" % ext, not bad, bad)
    manifest = json.loads((EXT / ext / "manifest.json").read_text())
    used = set(re.findall(r"__MSG_(\w+)__", json.dumps(manifest)))
    check("%s: manifest messages exist and default locale is English" % ext, used <= en.keys() and manifest.get("default_locale") == "en", used - en.keys())
    # page text equals the English message
    mismatches = []
    for f in list((EXT / ext).glob("page/*.html")) + list((EXT / ext).glob("popup/*.html")):
        text = f.read_text()
        for tag, attrs, key, inner in re.findall(r'<(\w+)([^>]*data-i18n="([a-z0-9_]+)"[^>]*)>(.*?)</\1>', text, re.S):
            flat = html.unescape(re.sub(r"<[^>]+>", "", inner))
            if key not in en: mismatches.append((f.name, key, "missing")); continue
            if flat != plain(en[key]["message"]): mismatches.append((f.name, key))
    check("%s: the English text in the pages equals the English messages" % ext, not mismatches, mismatches)

# 3. no outside requests; no old colours
refs = []
old = []
for f in EXT.rglob("*"):
    if not f.is_file() or f.suffix not in (".html", ".css", ".js", ".svg") or "_shared" in f.parts and False: continue
    t = f.read_text(errors="ignore")
    for m in re.findall(r'(?:src|href)="(https?://[^"]+)"|url\((https?://[^)]+)\)|@import\s+["\'](https?://[^"\']+)', t):
        u = [x for x in m if x][0]
        if u != "https://github.com/ciao-madesign/greenweb" and "w3.org" not in u: refs.append((f.name, u))
    for c in ("#2f7d5b", "#6fc29a", "#f6f7f4", "#a35f00", "#1c211e"):
        if c in t.lower(): old.append((str(f.relative_to(ROOT)), c))
check("no page loads anything from the internet", not refs, refs)
check("no colour left over from the engineering drafts", not old, old)
check("the fonts and their licences are bundled", all((EXT / "_shared/fonts" / n).exists() for n in (
    "chakra-petch-700.woff2", "inter.woff2", "jetbrains-mono-500.woff2", "source-serif-4.woff2",
    "OFL-chakrapetch.txt", "OFL-inter.txt", "OFL-jetbrainsmono.txt", "OFL-sourceserif4.txt")))

# 4. contrast of the tokens (WCAG)
def lum(h):
    h = h.lstrip("#"); c = [int(h[i:i+2], 16) / 255 for i in (0, 2, 4)]
    c = [x / 12.92 if x <= 0.03928 else ((x + 0.055) / 1.055) ** 2.4 for x in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def ratio(a, b):
    x, y = sorted([lum(a), lum(b)], reverse=True); return (x + 0.05) / (y + 0.05)
css = (EXT / "_shared/klin.css").read_text()
def tokens(block):
    return dict(re.findall(r"--([\w-]+):\s*(#[0-9a-fA-F]{6})", block))
dark = tokens(re.search(r":root \{(.*?)\}", css, re.S).group(1))
light = {**dark, **tokens(re.search(r':root\[data-theme="light"\] \{(.*?)\}', css, re.S).group(1))}
for name, t in (("dark", dark), ("light", light)):
    pairs = [("text", "bg"), ("text", "surface"), ("muted", "bg"), ("muted", "surface"), ("accent-text", "bg"), ("accent-text", "surface"),
             ("error", "bg"), ("error", "surface"), ("warning", "bg"), ("warning", "surface"), ("on-accent", "accent")]
    low = [(a, b, round(ratio(t[a], t[b]), 1)) for a, b in pairs if ratio(t[a], t[b]) < 4.5]
    check("%s theme: every text colour pair reaches 4.5:1" % name, not low, low)
sys.exit("%d check(s) failed" % len(failures) if failures else 0)
