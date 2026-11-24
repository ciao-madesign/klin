// Unit test of the KIS logic. Run: node tests/acceptance/independent-services/unit.js
const assert = require("assert");
const S = require("../../../extensions/independent-services/services.js");
let n = 0;
const ok = (label, cond) => { n++; try { assert(cond); console.log("ok   " + label); } catch (e) { console.log("FAIL " + label); process.exitCode = 1; } };
const code = (fn) => { try { fn(); return null; } catch (e) { return e.code; } };

ok("a plain https address is accepted", S.parseUrl("https://example.org/path").hostname === "example.org");
ok("http is accepted", S.parseUrl("http://example.org").protocol === "http:");
ok("javascript:, data:, file:, ftp: are refused", ["javascript:alert(1)", "data:text/html,x", "file:///etc/passwd", "ftp://example.org", "about:config", "moz-extension://x/y"].every((u) => code(() => S.parseUrl(u)) === "url"));
ok("an address with user name or password is refused", code(() => S.parseUrl("https://user:pw@example.org")) === "url" && code(() => S.parseUrl("https://user@example.org")) === "url");
ok("empty and garbage addresses are refused", code(() => S.parseUrl("")) === "url" && code(() => S.parseUrl("not a url")) === "url" && code(() => S.parseUrl(null)) === "url");

ok("the same service in different spellings has one key", new Set(["https://www.Example.org/", "http://example.org", "https://example.org/#top"].map(S.key)).size === 1);
ok("different paths are different services", S.key("https://example.org/a") !== S.key("https://example.org/b"));

const base = { name: "Example Mail", url: "https://mail.example.org", category: "email" };
ok("a service needs a name", code(() => S.make({ ...base, name: "  " })) === "name");
ok("an unknown category becomes 'other', unknown model/costs/registration get safe defaults", (() => { const s = S.make({ ...base, category: "zzz", model: "x", costs: "x", registration: "x" }); return s.category === "other" && s.model === "other" && s.costs === "other" && s.registration === "unspecified"; })());
ok("control characters are removed and long text is cut", (() => { const s = S.make({ ...base, name: "a\u0000b\nc", description: "x".repeat(5000) }); return s.name === "a b c" && s.description.length === 600; })());
ok("a date must look like YYYY-MM-DD, or be empty", code(() => S.make({ ...base, checked: "yesterday" })) === "date" && code(() => S.make({ ...base, checked: "2026-13-45" })) === "date" && S.make({ ...base, checked: "" }).checked === "" && S.make({ ...base, checked: "2026-05-01" }).checked === "2026-05-01");
ok("only known fields are kept", !("evil" in S.make({ ...base, evil: "<script>" })));

let list = S.add([], base);
ok("a service is added", list.length === 1 && list[0].id === "mail.example.org");
ok("the same address twice is refused", code(() => S.add(list, { ...base, name: "Other", url: "http://www.mail.example.org/" })) === "duplicate");

list = S.add(list, { name: "zeta chat", url: "https://chat.example.net", category: "chat", software: "Matrix", country: "Italia", model: "association" });
list = S.add(list, { name: "Alpha Hosting", url: "https://alpha.example.com", category: "hosting", model: "commercial", description: "Sites and e-mail" });
list = S.add(list, { name: "Écrit", url: "https://ecrit.example.fr", category: "blog", country: "France" });
ok("order is alphabetical, accents and case ignored", S.order(list).map((s) => s.name).join() === "Alpha Hosting,Écrit,Example Mail,zeta chat");
ok("favourites come first, then alphabetical", S.order(list, ["chat.example.net", "ecrit.example.fr"]).map((s) => s.name).join() === "Écrit,zeta chat,Alpha Hosting,Example Mail");
ok("the order does not depend on the input order", S.order([...list].reverse()).map((s) => s.name).join() === S.order(list).map((s) => s.name).join());
ok("search looks at name, description, software, country and host", S.filter(list, { text: "matrix" }).length === 1 && S.filter(list, { text: "e-mail" }).length === 1 && S.filter(list, { text: "italia" }).length === 1 && S.filter(list, { text: "ecrit.example.fr" }).length === 1);
ok("search ignores accents and case, all words must match", S.filter(list, { text: "ECRIT" }).length === 1 && S.filter(list, { text: "france ecrit" }).length === 1 && S.filter(list, { text: "france matrix" }).length === 0);
ok("filters by category and by who runs it", S.filter(list, { category: "chat" }).length === 1 && S.filter(list, { model: "commercial" })[0].name === "Alpha Hosting");
ok("favourites only", S.filter(list, { favouritesOnly: true }, ["chat.example.net"]).length === 1 && S.filter(list, { favouritesOnly: true }, []).length === 0);
ok("an empty search shows everything", S.filter(list, {}).length === 4);

const now = new Date("2026-11-17T12:00:00Z");
ok("a service with no date is 'unchecked'", S.age({ checked: "" }, 12, now) === "unchecked");
ok("a service checked 11 months ago is recent, 13 months ago is old", S.age({ checked: "2025-12-17" }, 12, now) === "recent" && S.age({ checked: "2025-10-01" }, 12, now) === "old");
ok("the limit can be changed", S.age({ checked: "2026-05-01" }, 12, now) === "recent" && S.age({ checked: "2026-05-01" }, 3, now) === "old");

console.log("\n" + n + " checks");
