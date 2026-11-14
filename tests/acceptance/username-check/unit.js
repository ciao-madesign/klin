// Unit test of the username check logic. Run: node tests/acceptance/username-check/unit.js
const assert = require("assert");
const K = require("../../../extensions/username-check/check.js");
const data = require("../../../extensions/username-check/data/sites.json");
let n = 0;
const ok = (label, cond) => { n++; try { assert(cond); console.log("ok   " + label); } catch (e) { console.log("FAIL " + label); process.exitCode = 1; } };

// request building
const gh = data.sites.find((s) => s.name === "GitHub");
let r = K.requestFor(gh, "mario rossi");
ok("status-code site: HEAD, name URL-encoded", r.init.method === "HEAD" && r.url === "https://www.github.com/mario%20rossi");
ok("no cookies, no referrer, no cache", r.init.credentials === "omit" && r.init.referrerPolicy === "no-referrer" && r.init.cache === "no-store");
const anilist = data.sites.find((s) => s.name === "Anilist");
r = K.requestFor(anilist, "blue");
ok("probe URL and JSON payload with the name filled in", r.url.startsWith("https://graphql") && JSON.parse(r.init.body).variables.name === "blue" && r.init.headers["content-type"] === "application/json");
ok("message site: GET", K.requestFor({ type: "message", url: "https://x/{}", msg: "no" }, "a").init.method === "GET");
ok("response_url site: redirects not followed", K.requestFor({ type: "response_url", url: "https://x/{}" }, "a").init.redirect === "manual");
ok("a name is only filled where {} stands", K.fill({ a: ["x{}", 1], b: { c: "{}{}" } }, "u", false).b.c === "uu");

// name rules
ok("name that breaks the site's rule is skipped", !K.nameFits(gh, "no_underscore_here!") && K.nameFits(gh, "blue"));
ok("a broken rule never blocks the check", K.nameFits({ regex: "(" }, "x"));

// classification
const sc = { type: "status_code" };
ok("status_code: 200 found", K.classify(sc, { status: 200 }) === "found");
ok("status_code: 404 not found", K.classify(sc, { status: 404 }) === "notfound");
ok("status_code: 403 is unclear, not 'not found'", K.classify(sc, { status: 403 }) === "unknown");
ok("status_code: rate limited / server error unclear", K.classify(sc, { status: 429 }) === "unknown" && K.classify(sc, { status: 503 }) === "unknown");
ok("status_code with errorCode: that code means not found", K.classify({ type: "status_code", code: 204 }, { status: 204 }) === "notfound" && K.classify({ type: "status_code", code: 204 }, { status: 200 }) === "found");
ok("status_code with several codes", K.classify({ type: "status_code", code: [404, 410] }, { status: 410 }) === "notfound");
const msg = { type: "message", msg: ["nobody here", "{\"taken\":false}"] };
ok("message: error text present = not found", K.classify(msg, { status: 200, text: "<p>nobody here</p>" }) === "notfound" && K.classify(msg, { status: 200, text: "{\"taken\":false}" }) === "notfound");
ok("message: error text absent = found", K.classify(msg, { status: 200, text: "<h1>profile</h1>" }) === "found");
ok("message: 404 without the text is unclear", K.classify(msg, { status: 404, text: "" }) === "unknown");
ok("response_url: 200 found, redirect away = not found", K.classify({ type: "response_url" }, { status: 200 }) === "found" && K.classify({ type: "response_url" }, { redirectedAway: true, status: 0 }) === "notfound");
ok("a redirect on other sites is unclear", K.classify(sc, { redirectedAway: true, status: 0 }) === "unknown");

// the list itself
ok("list has hundreds of sites, none adult", data.sites.length > 300 && !JSON.stringify(data).includes("isNSFW"));
ok("every site has a usable pattern and type", data.sites.every((s) => (s.url.includes("{}") || s.probe) && ["status_code", "message", "response_url"].includes(s.type)));
ok("source and licence recorded", /sherlock/.test(data.source) && /MIT/.test(data.licence) && /^[0-9a-f]{40}$/.test(data.commit));

// runner
(async () => {
  const sites = Array.from({ length: 20 }, (_, i) => ({ name: "s" + i, type: "status_code", url: "https://s" + i + "/{}", ...(i === 3 ? { regex: "^z+$" } : {}) }));
  let active = 0, peak = 0;
  const fake = async (url) => {
    active++; peak = Math.max(peak, active);
    await new Promise((res) => setTimeout(res, 5));
    active--;
    if (url.startsWith("https://s7/")) throw new Error("network down");
    return { status: url.startsWith("https://s0/") ? 200 : 404, type: "basic" };
  };
  const seen = [];
  const res = await K.run(sites, "blue", { fetch: fake, concurrency: 4, onResult: (x, d) => seen.push(d) });
  const by = (st) => res.filter((x) => x.state === st).length;
  ok("every site answered once", res.length === 20 && seen.length === 20 && seen[19] === 20);
  ok("at most the chosen number of requests at a time", peak <= 4 && peak > 1);
  ok("found / not found / unclear / skipped counted", by("found") === 1 && by("notfound") === 17 && by("unknown") === 1 && by("skipped") === 1);
  const ctl = new AbortController();
  let calls = 0;
  await K.run(sites, "blue", { fetch: async () => { calls++; if (calls === 3) ctl.abort(); return { status: 404, type: "basic" }; }, concurrency: 1, signal: ctl.signal });
  ok("stopping ends the run early", calls < 20);
  const slow = await K.checkOne({ type: "status_code", url: "https://slow/{}" }, "a", (u, i) => new Promise((_, rej) => i.signal.addEventListener("abort", () => rej(Object.assign(new Error("x"), { name: "AbortError" })))), 20);
  ok("a slow site times out as unclear", slow.state === "unknown" && slow.error === "AbortError");
  console.log(n + " checks");
})();
