// Collection log: who tried to collect information about you on the page in each tab, and what happened.
// Kept in memory only (storage.session is cleared when the browser closes); never written to disk, never sent.
"use strict";

const BLOCKED_ERRORS = {
  NS_ERROR_ABORT: "content blocker",
  NS_ERROR_BLOCKED_BY_POLICY: "content blocker",
  NS_ERROR_TRACKING_URI: "tracker",
  NS_ERROR_SOCIALTRACKING_URI: "social tracker",
  NS_ERROR_EMAILTRACKING_URI: "email tracker",
  NS_ERROR_FINGERPRINTING_URI: "fingerprinting",
  NS_ERROR_CRYPTOMINING_URI: "cryptominer",
};
const CLASSES = {                      // Firefox's own classification of a request, when it has one
  fingerprinting: "fingerprinting", fingerprinting_content: "fingerprinting", cryptomining: "cryptominer",
  tracking_ad: "advertising tracker", tracking_analytics: "analytics tracker", tracking_social: "social tracker",
  tracking_content: "tracking content", any_basic_tracking: "tracker", any_strict_tracking: "tracker", any_social_tracking: "social tracker",
};
const BEACONS = new Set(["beacon", "ping", "csp_report"]);

let pages = {};                        // tabId -> { top, epoch, entries: { key: entry } }
const requests = new Map();            // requestId -> { tabId, epoch, host, type }

// After the background page is woken up again, restore what was kept. Listeners never wait for this:
// a request must be recorded the moment it starts, before its answer can arrive.
const ready = browser.storage.session.get("pages").then((s) => {
  for (const [id, stored] of Object.entries(s.pages || {})) if (!pages[id]) pages[id] = stored;
});
let saveTimer = null;
const save = () => { clearTimeout(saveTimer); saveTimer = setTimeout(() => browser.storage.session.set({ pages }), 300); };

function page(tabId) {
  return pages[tabId] || (pages[tabId] = { top: null, epoch: 0, entries: {} });
}

// kind: blocked | sent | limited | tracker | fingerprint.  who: host name.  what: short description.
function note(tabId, kind, who, what, label) {
  const p = page(tabId), key = [kind, who, what].join("|");
  const entry = p.entries[key] || (p.entries[key] = { kind, who, what, label: label || "", count: 0, own: !isThirdParty(who, p.top) });
  entry.count++;
  badge(tabId);
  save();
}

function badge(tabId) {
  const list = Object.values(page(tabId).entries);
  const total = list.reduce((n, e) => n + e.count, 0);
  const worry = list.some((e) => e.kind !== "blocked");
  browser.action.setBadgeText({ tabId, text: total ? (total > 99 ? "99+" : String(total)) : "" }).catch(() => {});
  browser.action.setBadgeBackgroundColor({ tabId, color: worry ? "#a35f00" : "#2f7d5b" }).catch(() => {});
  browser.action.setBadgeTextColor && browser.action.setBadgeTextColor({ tabId, color: "#ffffff" }).catch(() => {});
}

function classOf(details) {
  const c = details.urlClassification;
  if (!c) return null;
  for (const flag of [...(c.thirdParty || []), ...(c.firstParty || [])]) if (CLASSES[flag]) return CLASSES[flag];
  return null;
}

browser.webRequest.onBeforeRequest.addListener((details) => {
  if (details.tabId < 0) return;
  const p = page(details.tabId);
  if (details.type === "main_frame") {            // a new page: start a new log
    p.epoch++; p.entries = {}; p.top = hostOf(details.url);
    badge(details.tabId); save();
    return;
  }
  const host = hostOf(details.url);
  if (!host || !p.top) return;
  requests.set(details.requestId, { tabId: details.tabId, epoch: p.epoch, host, type: details.type });
  if (BEACONS.has(details.type) && isThirdParty(host, p.top)) note(details.tabId, "sent", host, "sent data in the background (" + details.type + ")");
}, { urls: ["<all_urls>"] });

browser.webRequest.onHeadersReceived.addListener((details) => {
  const known = requests.get(details.requestId);
  if (!known) return;
  const p = page(known.tabId);
  if (known.epoch !== p.epoch) return;
  const third = isThirdParty(known.host, p.top);
  const cls = classOf(details);
  if (cls) note(known.tabId, "tracker", known.host, cls + ", not blocked", cls);
  if (third && (details.responseHeaders || []).some((h) => h.name.toLowerCase() === "set-cookie")) {
    note(known.tabId, "limited", known.host, "tried to set a cookie (kept apart for this site only)");
  }
}, { urls: ["<all_urls>"] }, ["responseHeaders"]);

browser.webRequest.onErrorOccurred.addListener((details) => {
  const known = requests.get(details.requestId);
  requests.delete(details.requestId);
  if (!known || !BLOCKED_ERRORS[details.error]) return;
  const p = page(known.tabId);
  if (known.epoch !== p.epoch) return;            // cancelled because the user left the page, not blocked
  const label = classOf(details) || BLOCKED_ERRORS[details.error];
  note(known.tabId, "blocked", known.host, "blocked " + known.type + " (" + label + ")", label);
}, { urls: ["<all_urls>"] });

browser.webRequest.onCompleted.addListener((details) => { requests.delete(details.requestId); }, { urls: ["<all_urls>"] });

const API_TEXT = {
  "canvas-read": "read pixels from a hidden drawing (canvas fingerprint)",
  "graphics-card": "asked which graphics card you have",
  "audio-probe": "ran an audio test that identifies the device",
};

browser.runtime.onMessage.addListener(async (message, sender) => {
  await ready;
  if (message.type === "fingerprint" && sender.tab && API_TEXT[message.api]) {
    if (!page(sender.tab.id).top) page(sender.tab.id).top = hostOf(sender.tab.url);
    note(sender.tab.id, "fingerprint", message.script, API_TEXT[message.api]);
  } else if (message.type === "get") {
    const p = page(message.tabId);
    return { top: p.top, entries: Object.values(p.entries) };
  } else if (message.type === "clear") {
    page(message.tabId).entries = {}; badge(message.tabId); save();
  }
});

// Firefox clears a tab's badge when its page is committed, which happens after the first requests:
// draw it again whenever the tab changes state.
browser.tabs.onUpdated.addListener((tabId) => { if (pages[tabId]) badge(tabId); });

browser.tabs.onRemoved.addListener((tabId) => { delete pages[tabId]; save(); });
