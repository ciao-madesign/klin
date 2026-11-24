// Lookalike detection: pure functions, no browser APIs (also loaded by the unit test).
"use strict";

// Second-level labels that act as a public suffix under two-letter country domains (co.uk, com.br…).
// An approximation: extensions have no access to the browser's public suffix list.
const SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "ac", "edu", "or", "ne", "go"]);

// Letters of other alphabets that look like Latin ones (the common whole-script spoofs).
const CONFUSABLE = {
  "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j", "ѕ": "s", "һ": "h",
  "ԁ": "d", "ɡ": "g", "ո": "n", "ս": "u", "ӏ": "l", "к": "k", "м": "m", "т": "t", "в": "b", "н": "h",
  "α": "a", "ο": "o", "ρ": "p", "ν": "v", "τ": "t", "ι": "i", "κ": "k", "ε": "e", "υ": "u",
  "ı": "i", "ł": "l", "ø": "o", "đ": "d",
};

// Decodes one punycode label ("xn--…") to Unicode; returns the input if it is not valid punycode.
function punycodeToUnicode(label) {
  if (!label.startsWith("xn--")) return label;
  const input = label.slice(4);
  const out = [];
  const split = input.lastIndexOf("-");
  for (let i = 0; i < split; i++) out.push(input.charCodeAt(i));
  let n = 128, bias = 72, i = 0;
  for (let pos = split < 0 ? 0 : split + 1; pos < input.length;) {
    const oldi = i;
    for (let w = 1, k = 36; ; k += 36) {
      if (pos >= input.length) return label;
      const c = input.charCodeAt(pos++);
      const digit = c >= 48 && c <= 57 ? c - 22 : c >= 97 && c <= 122 ? c - 97 : -1;
      if (digit < 0) return label;
      i += digit * w;
      const t = k <= bias ? 1 : k >= bias + 26 ? 26 : k - bias;
      if (digit < t) break;
      w *= 36 - t;
    }
    const len = out.length + 1;
    let delta = oldi === 0 ? Math.floor((i - oldi) / 700) : (i - oldi) >> 1;
    delta += Math.floor(delta / len);
    let k = 0;
    for (; delta > 455; k += 36) delta = Math.floor(delta / 35);
    bias = k + Math.floor((36 * delta) / (delta + 38));
    n += Math.floor(i / len);
    i %= len;
    out.splice(i++, 0, n);
  }
  return String.fromCodePoint(...out);
}

// "www.Shop.Example.co.uk" -> { site: "example.co.uk", name: "example", suffix: "co.uk" }; null if not a normal site name.
function siteOf(hostname) {
  const host = String(hostname).toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":")) return null;
  const labels = host.split(".");
  const tld = labels[labels.length - 1];
  const take = labels.length >= 3 && tld.length === 2 && SECOND_LEVEL.has(labels[labels.length - 2]) ? 3 : 2;
  const kept = labels.slice(-take);
  return { site: kept.join("."), name: kept[0], suffix: kept.slice(1).join(".") };
}

// What the name looks like at a glance: other alphabets and digit/letter tricks folded to plain Latin.
function skeleton(name) {
  let s = "";
  for (const ch of punycodeToUnicode(name).normalize("NFKD")) {
    if (/[̀-ͯ]/.test(ch)) continue;            // accents
    s += CONFUSABLE[ch] || ch;
  }
  return s.replace(/0/g, "o").replace(/[1|]/g, "l").replace(/rn/g, "m").replace(/vv/g, "w");
}

// True if a and b differ by exactly one edit: one letter changed, added, removed, or two neighbours swapped.
function oneEditApart(a, b) {
  if (a === b || Math.abs(a.length - b.length) > 1) return false;
  let i = 0;
  while (i < a.length && i < b.length && a[i] === b[i]) i++;
  const rest = (x, y) => a.slice(x) === b.slice(y);
  if (a.length === b.length) return rest(i + 1, i + 1) || (a[i] === b[i + 1] && a[i + 1] === b[i] && rest(i + 2, i + 2));
  return a.length > b.length ? rest(i + 1, i) : rest(i, i + 1);
}

// Why `candidate` imitates `known` (both from siteOf), or null. Same name under another suffix
// (example.com / example.it) is normal and not reported.
function lookalikeReason(candidate, known) {
  if (candidate.site === known.site || candidate.name === known.name) return null;
  const a = skeleton(candidate.name), b = skeleton(known.name);
  if (a === b) return "same-look";                         // identical at a glance
  if (candidate.suffix === known.suffix && b.length >= 6 && oneEditApart(a, b)) return "one-letter";
  return null;
}

// First known site that `hostname` imitates: { known, reason } or null.
function findLookalike(hostname, knownSites) {
  const candidate = siteOf(hostname);
  if (!candidate || knownSites.includes(candidate.site)) return null;
  for (const site of knownSites) {
    const known = siteOf(site);
    const reason = known && lookalikeReason(candidate, known);
    if (reason) return { known: site, reason };
  }
  return null;
}

if (typeof module !== "undefined") module.exports = { punycodeToUnicode, siteOf, skeleton, oneEditApart, lookalikeReason, findLookalike };
