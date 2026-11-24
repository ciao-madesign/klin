// Klin Independent Services: the pure logic. No network, no storage, no DOM: easy to test (tests/acceptance/independent-services/unit.js).
"use strict";

const KlinServices = (() => {
  const CATEGORIES = ["email", "chat", "social", "blog", "hosting", "lists", "video", "storage", "files", "docs", "media", "search", "community", "other"];
  const MODELS = ["community", "association", "personal", "commercial", "other"];
  const COSTS = ["free", "donation", "subscription", "other"];
  const REGISTRATIONS = ["open", "invite", "closed", "unspecified"];
  const FIELDS = ["name", "url", "description", "category", "software", "protocol", "operator", "country", "model", "costs", "registration", "checked", "source"];
  const LIMITS = { name: 120, url: 2048, description: 600, software: 80, protocol: 80, operator: 120, country: 60, source: 300 };

  class ServiceError extends Error { constructor(code) { super(code); this.code = code; } }

  // Only http and https, no user name or password in the address, no empty host. Returns the address as a URL object.
  function parseUrl(text) {
    let u;
    try { u = new URL(String(text || "").trim()); } catch (e) { throw new ServiceError("url"); }
    if ((u.protocol !== "http:" && u.protocol !== "https:") || !u.hostname || u.username || u.password) throw new ServiceError("url");
    return u;
  }

  // Two entries are the same service when host and path are the same (scheme, "www." start, trailing slash and fragment do not count).
  function key(urlText) {
    const u = parseUrl(urlText);
    return u.hostname.replace(/^www\./, "").toLowerCase() + (u.port ? ":" + u.port : "") + (u.pathname.replace(/\/+$/, "")) + u.search;
  }

  const clean = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max || 200);

  // Builds a stored service from form or catalogue fields, or throws ServiceError("name" | "url" | "category" | "date").
  function make(input) {
    const name = clean(input.name, LIMITS.name);
    if (!name) throw new ServiceError("name");
    const url = parseUrl(input.url).href;
    const category = CATEGORIES.includes(input.category) ? input.category : "other";
    const pick = (value, list, fallback) => (list.includes(value) ? value : fallback);
    let checked = clean(input.checked, 10);
    if (checked && (!/^\d{4}-\d{2}-\d{2}$/.test(checked) || Number.isNaN(Date.parse(checked)))) throw new ServiceError("date");
    return {
      id: key(url), name, url, category,
      description: clean(input.description, LIMITS.description),
      software: clean(input.software, LIMITS.software), protocol: clean(input.protocol, LIMITS.protocol),
      operator: clean(input.operator, LIMITS.operator), country: clean(input.country, LIMITS.country),
      model: pick(input.model, MODELS, "other"), costs: pick(input.costs, COSTS, "other"),
      registration: pick(input.registration, REGISTRATIONS, "unspecified"),
      checked, source: clean(input.source, LIMITS.source),
    };
  }

  // Adds a service; throws ServiceError("duplicate") if the same address is already there.
  function add(list, input) {
    const s = make(input);
    if (list.some((x) => x.id === s.id)) throw new ServiceError("duplicate");
    return [...list, s];
  }

  const fold = (t) => String(t || "").normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase();

  // Search by name, description, software, protocol, operator and country; filters by category and management model.
  function filter(list, opts = {}, favourites = []) {
    const words = fold(opts.text).split(/\s+/).filter(Boolean);
    return list.filter((s) => {
      if (opts.category && s.category !== opts.category) return false;
      if (opts.model && s.model !== opts.model) return false;
      if (opts.favouritesOnly && !favourites.includes(s.id)) return false;
      const hay = fold([s.name, s.description, s.software, s.protocol, s.operator, s.country, hostOf(s.url)].join(" "));
      return words.every((w) => hay.includes(w));
    });
  }

  // The only order: alphabetical by name, the user's favourites first. No scores, no popularity.
  function order(list, favourites = []) {
    return [...list].sort((a, b) => {
      const fa = favourites.includes(a.id) ? 0 : 1, fb = favourites.includes(b.id) ? 0 : 1;
      return fa - fb || a.name.localeCompare(b.name, undefined, { sensitivity: "base" }) || a.id.localeCompare(b.id);
    });
  }

  function hostOf(url) { try { return new URL(url).hostname; } catch (e) { return ""; } }

  // "old data": no date, or the check is older than `months`.
  function age(service, months = 12, now = new Date()) {
    if (!service.checked) return "unchecked";
    const then = new Date(service.checked + "T00:00:00Z");
    const limit = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - months, now.getUTCDate()));
    return then < limit ? "old" : "recent";
  }

  return { CATEGORIES, MODELS, COSTS, REGISTRATIONS, FIELDS, LIMITS, ServiceError, parseUrl, key, make, add, filter, order, hostOf, age };
})();
if (typeof module !== "undefined") module.exports = KlinServices;
