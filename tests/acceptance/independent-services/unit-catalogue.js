// Unit test of the KIS catalogue reader. Run: node tests/acceptance/independent-services/unit-catalogue.js
const assert = require("assert");
const C = require("../../../extensions/independent-services/catalogue.js");
const S = require("../../../extensions/independent-services/services.js");
let n = 0;
const ok = (label, cond) => { n++; try { assert(cond); console.log("ok   " + label); } catch (e) { console.log("FAIL " + label); process.exitCode = 1; } };
const code = (fn) => { try { fn(); return null; } catch (e) { return e.code + (e.detail && typeof e.detail === "string" ? ":" + e.detail : ""); } };

const file = (over = {}, services) => JSON.stringify({ klinCatalogue: 1, id: "test-list", name: "Test list", maintainer: "Someone", version: "1.0", published: "2026-10-01", license: "CC0-1.0",
  services: services || [{ name: "Chat One", url: "https://chat.example.net", category: "chat" }, { name: "Mail Two", url: "https://mail.example.org", category: "email", checked: "2026-09-01" }], ...over });

const good = C.parse(file());
ok("a valid file is read", good.meta.id === "test-list" && good.services.length === 2 && good.services.every((s) => s.catalogue === "test-list"));
ok("only known fields are kept, others are listed as ignored", (() => { const p = C.parse(file({ homepage: "https://evil.example", searchEngine: "x" }, [{ name: "A", url: "https://a.example.org", proxy: "x" }])); return p.ignored.join() === "homepage,proxy,searchEngine" && !("proxy" in p.services[0]) && !("homepage" in p.meta); })());
ok("a profile is read as a profile, anything else as a catalogue", C.parse(file({ kind: "profile" })).meta.kind === "profile" && good.meta.kind === "catalogue");

ok("not JSON is refused", code(() => C.parse("not json")) === "json" && code(() => C.parse(null)) === "json");
ok("JSON that is not a catalogue is refused", code(() => C.parse("[]")) === "format" && code(() => C.parse('{"klinCatalogue":2}')) === "format" && code(() => C.parse("{}")) === "format");
ok("more than 1 MB is refused", code(() => C.parse(file({ description: "x".repeat(10) }, [{ name: "A", url: "https://a.example.org", description: "x" }]) + " ".repeat(C.MAX_BYTES))) === "size");
ok("a missing or bad field is refused and named", ["id", "name", "maintainer", "version", "license", "published"].every((f) => code(() => C.parse(file({ [f]: f === "published" ? "soon" : "" }))) === "field:" + f));
ok("a bad id is refused", code(() => C.parse(file({ id: "Bad Id!" }))) === "field:id");
ok("a bad source address is refused", code(() => C.parse(file({ source: "javascript:alert(1)" }))) === "field:source");
ok("no services, or services that are not a list, are refused", code(() => C.parse(file({}, []))) === "empty" && code(() => C.parse(file({ services: "x" }))) === "field:services");
ok("too many services are refused", code(() => C.parse(file({}, Array.from({ length: C.MAX_SERVICES + 1 }, (_, i) => ({ name: "n" + i, url: "https://s" + i + ".example.org" }))))) === "many:" + C.MAX_SERVICES || code(() => C.parse(file({}, Array.from({ length: C.MAX_SERVICES + 1 }, (_, i) => ({ name: "n" + i, url: "https://s" + i + ".example.org" }))))) === "many");

const bad = (url) => code(() => C.parse(file({}, [{ name: "Fine", url: "https://ok.example.org" }, { name: "Bad", url }])));
ok("one bad link refuses the whole file, and says which service", ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "about:config", "https://u:p@x.example.org", "ftp://x.example.org", ""].every((u) => bad(u) === "service"));
ok("the service number and the problem are reported", (() => { try { C.parse(file({}, [{ name: "Fine", url: "https://ok.example.org" }, { name: "Bad", url: "javascript:x" }])); } catch (e) { return e.detail.index === 2 && e.detail.problem === "url"; } })());
ok("a service without a name or with a bad date refuses the file", code(() => C.parse(file({}, [{ url: "https://a.example.org" }]))) === "service" && code(() => C.parse(file({}, [{ name: "A", url: "https://a.example.org", checked: "later" }]))) === "service");
ok("the same address twice in a file is kept once", C.parse(file({}, [{ name: "A", url: "https://a.example.org" }, { name: "A again", url: "http://www.a.example.org/" }])).services.length === 1);
ok("HTML in text stays text (never interpreted: the page sets textContent)", C.parse(file({}, [{ name: "<img src=x onerror=1>", url: "https://a.example.org" }])).services[0].name === "<img src=x onerror=1>");

ok("only https addresses can be downloaded", ["http://x.example.org/c.json", "ftp://x.example.org", "file:///x", "javascript:1", "", "x", "https://u:p@x.example.org/c.json"].every((a) => code(() => C.downloadUrl(a)) === "https") && C.downloadUrl("https://x.example.org/c.json").hostname === "x.example.org");

// planning an import
const existing = [
  { ...S.make({ name: "By hand", url: "https://mine.example.org" }) },
  { ...S.make({ name: "Chat One", url: "https://chat.example.net", description: "old text" }), catalogue: "test-list" },
  { ...S.make({ name: "Gone", url: "https://gone.example.org" }), catalogue: "test-list" },
  { ...S.make({ name: "Other list", url: "https://mail.example.org" }), catalogue: "another" },
];
const p = C.plan(existing, good);
ok("plan: changed, skipped (already there from elsewhere), removed", p.changed.length === 1 && p.skipped.length === 1 && p.removed.map((s) => s.name).join() === "Gone" && p.added.length === 0 && p.same.length === 0);
const after = C.apply(existing, good);
ok("apply: this catalogue is replaced, the rest is untouched", after.length === 3 && after.some((s) => s.name === "By hand") && after.find((s) => s.id === "mail.example.org").name === "Other list" && !after.some((s) => s.name === "Gone") && after.find((s) => s.id === "chat.example.net").description === "");
ok("apply on an empty list adds everything", C.apply([], good).length === 2 && C.plan([], good).added.length === 2);
ok("applying the same file twice changes nothing", (() => { const a = C.apply([], good); const b = C.apply(a, good); return JSON.stringify(a) === JSON.stringify(b) && C.plan(a, good).same.length === 2; })());

// domains and lookalikes
const look = C.parse(file({}, [{ name: "Real", url: "https://exampleservice.org" }, { name: "Fake", url: "https://examp1eservice.org" }, { name: "Punycode", url: "https://xn--80ak6aa92e.example.org" }]));
const rows = C.domains([], look);
ok("every domain is listed, sorted, with its count", rows.length === 3 && rows.map((r) => r.host).join() === [...rows.map((r) => r.host)].sort().join());
ok("a domain that imitates another in the file is flagged", rows.find((r) => r.host === "examp1eservice.org").lookalike !== null);
ok("an encoded (xn--) domain is shown decoded and marked", (() => { const r = rows.find((x) => x.host.startsWith("xn--")); return r.encoded && r.shown !== r.host; })());
ok("a domain that imitates one already in the list is flagged", C.domains([{ ...S.make({ name: "X", url: "https://exampleservice.org" }) }], C.parse(file({}, [{ name: "F", url: "https://examp1eservice.org" }]))).some((r) => r.lookalike));
ok("plain different domains are not flagged", C.domains([], good).every((r) => r.lookalike === null));
ok("the kept record says where it came from and when", (() => { const r = C.record(good, "https://x.example.org/c.json", new Date("2026-11-20T10:00:00Z")); return r.id === "test-list" && r.source === "https://x.example.org/c.json" && r.importedAt === "2026-11-20" && r.active === true && r.count === 2; })());

// downloading, against a fake fetch
const stream = (chunks) => ({ getReader: () => { let i = 0; return { read: async () => i < chunks.length ? { done: false, value: chunks[i++] } : { done: true } }; } });
const fake = (over) => async () => ({ ok: true, url: "https://x.example.org/c.json", headers: { get: () => null }, body: stream([new TextEncoder().encode("hello")]), ...over });
(async () => {
  const seen = {};
  ok("download returns the text", await C.download(async (u, o) => { Object.assign(seen, o, { u }); return fake()(); }, "https://x.example.org/c.json") === "hello");
  ok("download sends no cookies and no referrer", seen.credentials === "omit" && seen.referrerPolicy === "no-referrer" && seen.cache === "no-store");
  const fails = async (f, a) => { try { await C.download(f, a || "https://x.example.org/c.json"); return null; } catch (e) { return e.code; } };
  ok("download refuses http without asking the network", (await fails(async () => { throw new Error("called"); }, "http://x.example.org/c.json")) === "https");
  ok("a redirect to http is refused", (await fails(fake({ url: "http://x.example.org/c.json" }))) === "https");
  ok("an error status is reported", (await fails(fake({ ok: false, status: 404 }))) === "net");
  ok("a declared size over 1 MB is refused before reading", (await fails(fake({ headers: { get: () => String(C.MAX_BYTES + 1) } }))) === "size");
  ok("a body over 1 MB is cut off while reading", (await fails(fake({ body: stream([new Uint8Array(C.MAX_BYTES), new Uint8Array(10)]) }))) === "size");
  ok("a network failure is reported", (await fails(async () => { throw new TypeError("offline"); })) === "net");
  ok("a request that never answers times out", await (async () => { try { await C.download((u, o) => new Promise((_, rej) => o.signal.addEventListener("abort", () => rej(Object.assign(new Error("a"), { name: "AbortError" })))), "https://x.example.org/c.json", 50); } catch (e) { return e.code === "net" && e.detail === "timeout"; } })());
  console.log("\n" + n + " checks");
})();
