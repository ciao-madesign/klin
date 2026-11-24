// Klin Independent Services: reading a catalogue file. Pure logic: no network, no storage, no DOM (tested by tests/acceptance/independent-services/unit.js).
// A catalogue is untrusted until this has checked it. One bad entry and the whole file is refused: nothing is saved halfway.
"use strict";

const KlinCatalogue = (() => {
  const S = typeof KlinServices !== "undefined" ? KlinServices : require("./services.js");
  const D = typeof findLookalike === "function" ? { findLookalike, siteOf, punycodeToUnicode } : require("./detect.js");

  const MAX_BYTES = 1048576;       // 1 MB, the same limit as for third-party lists
  const MAX_SERVICES = 2000;
  const KNOWN = ["klinCatalogue", "kind", "id", "name", "description", "maintainer", "version", "published", "license", "source", "services"];

  class CatalogueError extends Error { constructor(code, detail) { super(code); this.code = code; this.detail = detail; } }

  const text = (v, max) => String(v == null ? "" : v).replace(/[\u0000-\u001f\u007f]/g, " ").trim().slice(0, max);

  // Only an https address may be downloaded: the catalogue itself could be changed on the way over plain http.
  function downloadUrl(address) {
    let u;
    try { u = new URL(String(address || "").trim()); } catch (e) { throw new CatalogueError("https"); }
    if (u.protocol !== "https:" || !u.hostname || u.username || u.password) throw new CatalogueError("https");
    return u;
  }

  // Reads the file text. Returns { meta, services, ignored } or throws CatalogueError with a code:
  // size | json | format | field (detail: name) | many | empty | service (detail: { index, problem })
  function parse(source) {
    if (typeof source !== "string") throw new CatalogueError("json");
    if (new TextEncoder().encode(source).length > MAX_BYTES) throw new CatalogueError("size");
    let data;
    try { data = JSON.parse(source); } catch (e) { throw new CatalogueError("json"); }
    if (!data || typeof data !== "object" || Array.isArray(data) || data.klinCatalogue !== 1) throw new CatalogueError("format");

    const meta = {
      kind: data.kind === "profile" ? "profile" : "catalogue",
      id: text(data.id, 64), name: text(data.name, 120), description: text(data.description, 600),
      maintainer: text(data.maintainer, 120), version: text(data.version, 40), published: text(data.published, 10),
      license: text(data.license, 80), source: "",
    };
    if (!/^[a-z0-9][a-z0-9._-]{0,63}$/.test(meta.id)) throw new CatalogueError("field", "id");
    for (const f of ["name", "maintainer", "version", "license"]) if (!meta[f]) throw new CatalogueError("field", f);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(meta.published) || Number.isNaN(Date.parse(meta.published))) throw new CatalogueError("field", "published");
    if (data.source != null && data.source !== "") { try { meta.source = S.parseUrl(data.source).href; } catch (e) { throw new CatalogueError("field", "source"); } }
    if (!Array.isArray(data.services)) throw new CatalogueError("field", "services");
    if (data.services.length === 0) throw new CatalogueError("empty");
    if (data.services.length > MAX_SERVICES) throw new CatalogueError("many", MAX_SERVICES);

    const services = [];
    const seen = new Set();
    const ignored = new Set(Object.keys(data).filter((k) => !KNOWN.includes(k)));
    data.services.forEach((raw, index) => {
      if (!raw || typeof raw !== "object" || Array.isArray(raw)) throw new CatalogueError("service", { index: index + 1, problem: "name" });
      for (const k of Object.keys(raw)) if (!S.FIELDS.includes(k)) ignored.add(k);
      let s;
      try { s = S.make(raw); } catch (e) { throw new CatalogueError("service", { index: index + 1, problem: e.code || "name" }); }
      if (seen.has(s.id)) return;                        // the same address twice in one file: kept once
      seen.add(s.id);
      services.push({ ...s, catalogue: meta.id });
    });
    return { meta, services, ignored: [...ignored].sort() };
  }

  // What importing would do, given what is already in the list: new, changed and removed (same catalogue, updated),
  // and skipped (the address is already there from another source: the existing card stays).
  function plan(existing, parsed) {
    const mine = new Map(existing.filter((s) => s.catalogue === parsed.meta.id).map((s) => [s.id, s]));
    const others = new Set(existing.filter((s) => s.catalogue !== parsed.meta.id).map((s) => s.id));
    const added = [], changed = [], same = [], skipped = [];
    for (const s of parsed.services) {
      if (others.has(s.id)) { skipped.push(s); continue; }
      const old = mine.get(s.id);
      if (!old) added.push(s);
      else if (JSON.stringify(old) !== JSON.stringify(s)) changed.push(s);
      else same.push(s);
    }
    const keep = new Set(parsed.services.map((s) => s.id));
    const removed = [...mine.values()].filter((s) => !keep.has(s.id));
    return { added, changed, same, skipped, removed };
  }

  // The list after the import. The catalogue's own earlier entries are replaced; everything else is untouched.
  function apply(existing, parsed) {
    const p = plan(existing, parsed);
    const skip = new Set(p.skipped.map((s) => s.id));
    return [...existing.filter((s) => s.catalogue !== parsed.meta.id), ...parsed.services.filter((s) => !skip.has(s.id))];
  }

  // Every domain of the file, as the preview shows it: the real host, how it looks when decoded, and whether it imitates
  // another one in the file or already in the list (the same check as the lookalike warning).
  function domains(existing, parsed) {
    const known = new Set([...existing.filter((s) => s.catalogue !== parsed.meta.id), ...parsed.services].map((s) => { try { return D.siteOf(new URL(s.url).hostname); } catch (e) { return null; } }).filter(Boolean).map((x) => x.site));
    const rows = new Map();
    for (const s of parsed.services) {
      const host = new URL(s.url).hostname;
      const row = rows.get(host) || { host, shown: host.split(".").map(D.punycodeToUnicode).join("."), encoded: /(^|\.)xn--/.test(host), count: 0, lookalike: null };
      row.count++;
      const c = D.siteOf(host);
      if (c && !row.lookalike) { const others = [...known].filter((k) => k !== c.site); row.lookalike = D.findLookalike(host, others); }
      rows.set(host, row);
    }
    return [...rows.values()].sort((a, b) => a.host.localeCompare(b.host));
  }

  // The record kept about an imported catalogue (provenance).
  const record = (parsed, source, now = new Date()) => ({ ...parsed.meta, source: source || parsed.meta.source, importedAt: now.toISOString().slice(0, 10), active: true, count: parsed.services.length });

  // Downloads a catalogue: https only, no cookies, no referrer, at most MAX_BYTES, at most 15 seconds.
  async function download(fetchFn, address, timeoutMs = 15000) {
    const url = downloadUrl(address);
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetchFn(url.href, { credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store", redirect: "follow", signal: controller.signal });
      if (!response.ok) throw new CatalogueError("net", "HTTP " + response.status);
      if (response.url && !response.url.startsWith("https://")) throw new CatalogueError("https");
      const length = Number(response.headers.get("content-length"));
      if (length > MAX_BYTES) throw new CatalogueError("size");
      const reader = response.body.getReader();
      const chunks = []; let total = 0;
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        total += value.length;
        if (total > MAX_BYTES) { controller.abort(); throw new CatalogueError("size"); }
        chunks.push(value);
      }
      const all = new Uint8Array(total); let at = 0;
      for (const c of chunks) { all.set(c, at); at += c.length; }
      return new TextDecoder("utf-8").decode(all);
    } catch (e) {
      if (e instanceof CatalogueError) throw e;
      throw new CatalogueError("net", e && e.name === "AbortError" ? "timeout" : String(e && e.message || e));
    } finally { clearTimeout(timer); }
  }

  return { MAX_BYTES, MAX_SERVICES, CatalogueError, downloadUrl, parse, plan, apply, domains, record, download };
})();
if (typeof module !== "undefined") module.exports = KlinCatalogue;
