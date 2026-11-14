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

// disposable addresses (mail.tm provider) with a fake service
const P = require("../../../extensions/alias-registry/providers.js");
(async () => {
  const calls = [];
  const fake = async (url, init) => {
    calls.push({ url, init });
    const path = url.replace("https://api.mail.tm", "");
    const json = (obj, status = 200) => ({ ok: status < 300, status, json: async () => obj });
    if (path === "/domains") return json({ "hydra:member": [{ domain: "off.example", isActive: false }, { domain: "mail.example", isActive: true }] });
    if (path === "/accounts" && init.method === "POST") return json({ id: "acc1" }, 201);
    if (path === "/token") return json({ token: "tok" });
    if (path === "/messages") return init.headers.Authorization === "Bearer tok" ? json({ "hydra:member": [{ id: "m1", from: { address: "a@b.org" }, subject: "Hello", intro: "hi" }] }) : json({}, 401);
    if (path === "/messages/m1") return json({ subject: "Hello", text: "Body text", html: ["<img src=x>"] });
    if (path === "/accounts/acc1" && init.method === "DELETE") return { ok: true, status: 204, json: async () => null };
    return json({}, 404);
  };
  const cred = await P.create(fake);
  ok("makes an address on an active domain with a random name", /^[a-z0-9]{12}@mail\.example$/.test(cred.address) && cred.accountId === "acc1");
  ok("password is long and random", cred.password.length === 20 && cred.password !== (await P.create(fake)).password);
  ok("account request carries the address and password", JSON.parse(calls.find((c) => c.url.endsWith("/accounts")).init.body).address === cred.address);
  ok("no cookies, no referrer, no cache on any request", calls.every((c) => c.init.credentials === "omit" && c.init.referrerPolicy === "no-referrer" && c.init.cache === "no-store"));
  const box = await P.inbox(fake, cred);
  ok("inbox lists messages", box.length === 1 && box[0].subject === "Hello" && box[0].from === "a@b.org");
  const msg = await P.read(fake, cred, "m1");
  ok("a message is read as plain text only (HTML dropped)", msg.text === "Body text" && !JSON.stringify(msg).includes("<img"));
  await P.remove(fake, cred);
  ok("the address can be deleted on the service", calls.some((c) => c.init.method === "DELETE"));
  let err = null; try { await P.create(async () => ({ ok: false, status: 503 })); } catch (e) { err = e.message; }
  ok("a service failure gives a readable message", /503/.test(err));
  ok("entry keeps the provider only if known, and never a password", (() => { const e = R.make({ kind: "email", value: "a@b.org", site: "s", provider: "mail.tm", password: "secret" }).entry; return e.provider === "mail.tm" && !JSON.stringify(R.exportText([e])).includes("secret") && !R.make({ kind: "email", value: "a@b.org", site: "s", provider: "evil" }).entry.provider; })());
  console.log(n + " checks");
})();
