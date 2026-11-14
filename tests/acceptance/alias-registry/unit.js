// Unit test of the alias registry logic. Run: node tests/acceptance/alias-registry/unit.js
const assert = require("assert");
const R = require("../../../extensions/alias-registry/registry.js");
let n = 0;
const ok = (label, cond) => { n++; try { assert(cond); console.log("ok   " + label); } catch (e) { console.log("FAIL " + label); process.exitCode = 1; } };

ok("plus address from a site name", R.plusAddress("me@example.org", "https://www.Shop.example/cart?x=1") === "me+shop.example@example.org");
ok("an existing tag is replaced, not stacked", R.plusAddress("me+old@example.org", "shop.example") === "me+shop.example@example.org");
ok("no plus address without a valid base or site", R.plusAddress("nonsense", "shop.example") === null && R.plusAddress("me@example.org", "") === null);

ok("valid email entry", !!R.make({ kind: "email", value: "a+b@x.org", site: "shop.example" }).entry);
ok("valid username entry gets an id and a date", (() => { const e = R.make({ kind: "username", value: "blue", site: "forum.example" }, 1000).entry; return e.id && e.created === 1000; })());
ok("bad email refused", !!R.make({ kind: "email", value: "not-an-email", site: "s" }).error);
ok("missing site, alias or type refused", !!R.make({ kind: "email", value: "a@b.org", site: "" }).error && !!R.make({ kind: "username", value: "", site: "s" }).error && !!R.make({ kind: "other", value: "x", site: "s" }).error);

const list = [
  R.make({ kind: "email", value: "me+shop@x.org", site: "shop.example", note: "invoice" }).entry,
  R.make({ kind: "email", value: "me+news@x.org", site: "news.example" }).entry,
  R.make({ kind: "username", value: "blue", site: "forum.example" }).entry,
  R.make({ kind: "username", value: "blue", site: "chat.example" }).entry,
];
ok("who got this address (case does not matter)", R.whoGot(list, " ME+SHOP@x.org ").map((e) => e.site).join() === "shop.example");
ok("unknown address: nobody", R.whoGot(list, "x@y.org").length === 0 && R.whoGot(list, "").length === 0);
ok("search looks at alias, site and note", R.filter(list, "invoice").length === 1 && R.filter(list, "example").length === 4 && R.filter(list, "").length === 4);
ok("usernames offered once each", R.usernames(list).join() === "blue");

const text = R.exportText(list);
ok("backup round trip adds nothing twice", (() => { const r = R.importText(text, list); return r.added.length === 0 && r.skipped === 4; })());
ok("backup into an empty list restores all", R.importText(text, []).added.length === 4);
ok("not a backup: refused", !!R.importText("{}", []).error && !!R.importText("garbage", []).error);
ok("bad entries in a backup are dropped", (() => { const r = R.importText(JSON.stringify({ klinAliasRegistry: 1, entries: [{ kind: "email", value: "bad", site: "s" }, null, { kind: "username", value: "ok", site: "s" }] }), []); return r.added.length === 1 && r.skipped === 2; })());
console.log(n + " checks");
