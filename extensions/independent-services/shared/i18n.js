// Klin strings for extension pages. Source of truth: extensions/_shared/i18n.js (copied into each extension by build/sync-shared.py).
//
// The HTML keeps its English text, so a page still reads correctly if nothing loads. This script then replaces every
// [data-i18n] element with the message of the same name from _locales/<lang>/messages.json, in the browser's language
// (Italian or English). ?lang=it or ?lang=en forces a language (previews and tests). ?theme=light|system|dark forces a theme.
//
// Messages may contain a little markup, turned into DOM nodes (never innerHTML):
//   **bold**   ==highlighter (one phrase per screen)==   `code`
// {1} {2} ... are replaced by the extra arguments of t().
"use strict";

(() => {
  const SUPPORTED = ["en", "it"];
  const params = new URLSearchParams(location.search);
  let messages = {}, fallback = {};
  const api = (typeof browser !== "undefined" && browser.i18n) ? browser : null;

  function pickLanguage() {
    const asked = params.get("lang");
    if (SUPPORTED.includes(asked)) return asked;
    const ui = ((api && api.i18n.getUILanguage()) || navigator.language || "en").slice(0, 2).toLowerCase();
    return SUPPORTED.includes(ui) ? ui : "en";
  }

  async function load(lang) {
    try {
      const response = await fetch(new URL("../_locales/" + lang + "/messages.json", document.baseURI));
      const raw = await response.json();
      return Object.fromEntries(Object.entries(raw).map(([key, value]) => [key, value.message]));
    } catch (e) { return {}; }
  }

  // t("key", "English fallback", arg1, arg2): the message, or the fallback if it is missing.
  function t(key, fallbackText, ...args) {
    let text = messages[key] ?? fallback[key] ?? fallbackText ?? key;
    args.forEach((a, i) => { text = text.split("{" + (i + 1) + "}").join(String(a)); });
    return text;
  }

  function nodes(text) {
    const out = [];
    const pattern = /\*\*(.+?)\*\*|==(.+?)==|`(.+?)`/g;
    let last = 0, m;
    while ((m = pattern.exec(text))) {
      if (m.index > last) out.push(text.slice(last, m.index));
      const tag = m[1] !== undefined ? "b" : m[2] !== undefined ? "mark" : "code";
      const node = document.createElement(tag);
      node.textContent = m[1] ?? m[2] ?? m[3];
      out.push(node);
      last = pattern.lastIndex;
    }
    if (last < text.length) out.push(text.slice(last));
    return out;
  }

  function apply(root = document) {
    for (const element of root.querySelectorAll("[data-i18n]")) {
      const key = element.dataset.i18n;
      if (messages[key] === undefined && fallback[key] === undefined) continue;
      element.replaceChildren(...nodes(t(key)));
    }
    for (const element of root.querySelectorAll("[data-i18n-attr]")) {     // data-i18n-attr="placeholder:key;aria-label:key2"
      for (const pair of element.dataset.i18nAttr.split(";")) {
        const [attr, key] = pair.split(":");
        if (messages[key] !== undefined || fallback[key] !== undefined) element.setAttribute(attr, t(key));
      }
    }
    const title = document.querySelector("title[data-i18n]");
    if (title) document.title = title.textContent;
  }

  const lang = pickLanguage();
  document.documentElement.lang = lang;
  const theme = params.get("theme");
  if (["light", "system", "dark"].includes(theme)) document.documentElement.dataset.theme = theme;

  window.klin = window.klin || {};
  window.klin.t = t;
  window.klin.nodes = nodes;
  window.klin.lang = lang;
  window.klin.ready = (async () => {
    if (document.readyState === "loading") await new Promise((r) => document.addEventListener("DOMContentLoaded", r, { once: true }));
    fallback = await load("en");
    messages = lang === "en" ? fallback : await load(lang);
    apply();
    document.documentElement.dataset.i18n = "ready";
  })();
})();
