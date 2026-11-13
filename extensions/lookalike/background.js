// Stops a page before it loads when its site name imitates a site the user already knows,
// and shows a warning with the choice to go back, go to the known site, or continue.
// Everything is local: bookmarks and history are read, never sent or copied elsewhere.
"use strict";

const MIN_VISITS = 3;                 // history: a site counts as "known" from this many visits
const REFRESH_MS = 6 * 60 * 60 * 1000;
let known = null, builtAt = 0, allowed = null;

function addSite(set, url) {
  try {
    const u = new URL(url);
    if (u.protocol !== "http:" && u.protocol !== "https:") return null;
    const s = siteOf(u.hostname);
    if (s && set) set.add(s.site);
    return s ? s.site : null;
  } catch (e) { return null; }
}

async function buildKnown() {
  const sites = new Set();
  const walk = (nodes) => { for (const n of nodes) { if (n.url) addSite(sites, n.url); if (n.children) walk(n.children); } };
  walk(await browser.bookmarks.getTree());
  const visits = new Map();
  for (const item of await browser.history.search({ text: "", startTime: 0, maxResults: 5000 })) {
    const site = addSite(null, item.url);
    if (site) visits.set(site, (visits.get(site) || 0) + (item.visitCount || 1));
  }
  for (const [site, count] of visits) if (count >= MIN_VISITS) sites.add(site);
  known = [...sites]; builtAt = Date.now();
  await browser.storage.session.set({ known, builtAt });
}

async function getKnown() {
  if (!known) ({ known = null, builtAt = 0 } = await browser.storage.session.get(["known", "builtAt"]));
  if (!known || Date.now() - builtAt > REFRESH_MS) await buildKnown();
  return known;
}

async function getAllowed() {
  if (!allowed) allowed = new Set((await browser.storage.local.get("allowed")).allowed || []);
  return allowed;
}

browser.bookmarks.onCreated.addListener(() => { known = null; builtAt = 0; browser.storage.session.remove(["known", "builtAt"]); });
browser.storage.onChanged.addListener((changes, area) => { if (area === "local" && changes.allowed) allowed = null; });

browser.webRequest.onBeforeRequest.addListener(async (details) => {
  if (details.tabId < 0) return {};
  try {
    const host = new URL(details.url).hostname;
    const candidate = siteOf(host);
    if (!candidate || (await getAllowed()).has(candidate.site)) return {};
    const match = findLookalike(host, await getKnown());
    if (!match) return {};
    const page = browser.runtime.getURL("page/warning.html") +
      `?url=${encodeURIComponent(details.url)}&site=${encodeURIComponent(candidate.site)}&known=${encodeURIComponent(match.known)}&reason=${match.reason}`;
    browser.tabs.update(details.tabId, { url: page });
    return { cancel: true };
  } catch (e) {
    return {};                        // never block browsing because of an error here
  }
}, { urls: ["http://*/*", "https://*/*"], types: ["main_frame"] }, ["blocking"]);
