// Alias registry logic: plain functions (no browser APIs) so it can be tested in Node.
// An entry: { id, kind: "email" | "username", value, site, note, created }
const KlinRegistry = (() => {
  const KINDS = ["email", "username"];
  const PROVIDERS = ["mail.tm"];
  const clean = (s) => String(s == null ? "" : s).trim();

  // Plain "plus" address: base me@example.org + site "shop.example" -> me+shop.example@example.org.
  // Works only with providers that support it, and anyone can strip the tag: a real alias from a service is better.
  const plusAddress = (base, site) => {
    const m = /^([^@\s+]+)(?:\+[^@\s]*)?@([^@\s]+\.[^@\s]+)$/.exec(clean(base));
    const tag = clean(site).toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0].replace(/[^a-z0-9.-]/g, "");
    return m && tag ? m[1] + "+" + tag + "@" + m[2] : null;
  };

  const make = (fields, now = Date.now()) => {
    const e = { kind: clean(fields.kind), value: clean(fields.value), site: clean(fields.site), note: clean(fields.note) };
    if (!KINDS.includes(e.kind)) return { error: "Choose email or username." };
    if (!e.value) return { error: "Write the alias." };
    if (e.kind === "email" && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e.value)) return { error: "That does not look like an email address." };
    if (!e.site) return { error: "Write the site it was given to." };
    if (PROVIDERS.includes(fields.provider)) e.provider = fields.provider;   // a disposable address made through that service
    return { entry: Object.assign(e, { id: fields.id || now.toString(36) + Math.random().toString(36).slice(2, 7), created: fields.created || now }) };
  };

  // Which sites received this alias? Used when spam arrives on an address: whoever got it leaked or sold it.
  const whoGot = (entries, value) => {
    const v = clean(value).toLowerCase();
    return v ? entries.filter((e) => e.value.toLowerCase() === v) : [];
  };

  const filter = (entries, text) => {
    const t = clean(text).toLowerCase();
    return t ? entries.filter((e) => [e.value, e.site, e.note].some((x) => x.toLowerCase().includes(t))) : entries;
  };

  const usernames = (entries) => [...new Set(entries.filter((e) => e.kind === "username").map((e) => e.value))].sort();

  const exportText = (entries) => JSON.stringify({ klinAliasRegistry: 1, entries }, null, 2);

  // Reads a backup; keeps only well-formed entries and never duplicates one already present.
  const importText = (text, existing) => {
    let data;
    try { data = JSON.parse(text); } catch (e) { return { error: "That file is not a Klin alias backup." }; }
    if (!data || data.klinAliasRegistry !== 1 || !Array.isArray(data.entries)) return { error: "That file is not a Klin alias backup." };
    const have = new Set(existing.map((e) => e.kind + "|" + e.value.toLowerCase() + "|" + e.site.toLowerCase()));
    const added = [];
    for (const raw of data.entries) {
      const r = make(raw || {});
      if (!r.entry) continue;
      const key = r.entry.kind + "|" + r.entry.value.toLowerCase() + "|" + r.entry.site.toLowerCase();
      if (have.has(key)) continue;
      have.add(key); added.push(r.entry);
    }
    return { added, skipped: data.entries.length - added.length };
  };

  return { make, plusAddress, whoGot, filter, usernames, exportText, importText };
})();

if (typeof module !== "undefined") module.exports = KlinRegistry;
else globalThis.KlinRegistry = KlinRegistry;
