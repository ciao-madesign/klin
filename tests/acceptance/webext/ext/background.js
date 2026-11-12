// Klin WebExtensions capability probe (test only). Runs once the content script reports in.
const api = typeof browser !== "undefined" ? browser : chrome;
const R = { manifest: api.runtime.getManifest().manifest_version, apis: {}, tests: {} };
const reqs = [];

for (const n of ["webRequest", "declarativeNetRequest", "storage", "tabs", "bookmarks", "history", "contextualIdentities",
  "cookies", "sidebarAction", "menus", "alarms", "downloads", "sessions", "processes", "dns", "privacy", "management",
  "tabGroups", "proxy", "idle", "commands", "search", "scripting", "permissions", "runtime"])
  R.apis[n] = typeof api[n] !== "undefined";
R.apis["tabs.discard"] = typeof api.tabs?.discard === "function";
R.apis["webRequest.filterResponseData"] = typeof api.webRequest?.filterResponseData === "function";
R.apis["tabs.group"] = typeof api.tabs?.group === "function";

try {
  api.webRequest.onBeforeRequest.addListener(
    (d) => (new URL(d.url).hostname === "ad.test" ? { cancel: true } : {}),
    { urls: ["<all_urls>"] }, ["blocking"]);
  api.webRequest.onCompleted.addListener((d) => {
    const cl = (d.responseHeaders || []).find((h) => h.name.toLowerCase() === "content-length");
    reqs.push({ url: d.url, bytes: cl ? +cl.value : null, cache: !!d.fromCache });
  }, { urls: ["<all_urls>"] }, ["responseHeaders"]);
  api.webRequest.onErrorOccurred.addListener((d) => reqs.push({ url: d.url, error: d.error }), { urls: ["<all_urls>"] });
  R.tests.webRequestListeners = "registered";
} catch (e) { R.tests.webRequestListeners = "ERROR " + e; }

async function test(name, fn) { try { R.tests[name] = await fn(); } catch (e) { R.tests[name] = "ERROR " + e; } }
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const idb = (fn) => new Promise((res, rej) => {
  const o = indexedDB.open("klin", 1);
  o.onupgradeneeded = () => o.result.createObjectStore("k");
  o.onerror = () => rej(o.error);
  o.onsuccess = () => fn(o.result.transaction("k", "readwrite").objectStore("k"), res, rej);
});

let started = false;
async function run(msg) {
  if (started) return;
  started = true;
  R.tests.contentScript = msg || "NO MESSAGE from content script (fallback timer)";
  await sleep(1500);

  await test("permissions", async () => (await api.permissions.getAll()));
  await test("storage.local", async () => {
    const { runs = 0 } = await api.storage.local.get("runs");
    await api.storage.local.set({ runs: runs + 1 });
    return { previousRuns: runs };
  });
  await test("indexedDB", () => idb((s, res) => { const g = s.get("x"); g.onsuccess = () => { s.put(Date.now(), "x"); res({ previous: g.result ?? null }); }; }));
  await test("ollama.tags", async () => (await (await fetch("http://127.0.0.1:11434/api/tags")).json()));
  await test("ollama.generate", async () => (await (await fetch("http://127.0.0.1:11434/api/generate", { method: "POST", body: JSON.stringify({ model: "mock:1b", prompt: "hi", stream: false }) })).json()));
  await test("tabs.discard", async () => {
    const t = await api.tabs.create({ url: "http://news.test/?second", active: false });
    await sleep(3000);
    await api.tabs.discard(t.id);
    await sleep(500);
    const after = await api.tabs.get(t.id);
    return { discarded: after.discarded };
  });
  await test("containers (workspace isolation)", async () => {
    const ci = await api.contextualIdentities.create({ name: "ws1", color: "blue", icon: "fingerprint" });
    await api.cookies.set({ url: "http://news.test/", name: "c", value: "1", storeId: ci.cookieStoreId });
    const inDefault = await api.cookies.get({ url: "http://news.test/", name: "c" });
    const inWs = await api.cookies.get({ url: "http://news.test/", name: "c", storeId: ci.cookieStoreId });
    return { cookieVisibleInDefault: !!inDefault, cookieVisibleInContainer: !!inWs };
  });
  await test("bookmarks", async () => {
    await api.bookmarks.create({ title: "Klin test", url: "http://news.test/" });
    return { found: (await api.bookmarks.search({ query: "Klin test" })).length };
  });
  await test("history", async () => ({ found: (await api.history.search({ text: "news.test", maxResults: 5 })).length }));
  await test("sidebarAction", async () => ({ isOpen: await api.sidebarAction.isOpen({}) }));
  await test("search.get", async () => (await api.search.get()).length + " engines");
  await test("runtime.getBrowserInfo", async () => (await api.runtime.getBrowserInfo()).version);
  await sleep(1000);
  R.requests = reqs.filter((r) => !/report\.test|127\.0\.0\.1/.test(r.url));
  R.totalBytes = R.requests.reduce((a, r) => a + (r.bytes || 0), 0);
  await fetch("http://report.test/report", { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(R) });
}
api.runtime.onMessage.addListener((msg) => { if (msg.type === "content") run(msg); });
setTimeout(() => run(null), 30000);
