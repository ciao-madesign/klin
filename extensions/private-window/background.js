// In a private window, Firefox's start page (about:privatebrowsing) is swapped for Klin's honest page.
// Only that exact start page is replaced: a private window opened with an address, or any page you
// navigate to, is left alone. Needs permission to run in private windows (granted by Klin's policy).
"use strict";

const START = "about:privatebrowsing";
const PAGE = browser.runtime.getURL("page/index.html");
const swapped = new Set();                       // tab ids already handled, so going Back is never trapped

function swap(tab) {
  if (!tab || !tab.incognito || swapped.has(tab.id)) return;
  if (tab.url !== START && tab.pendingUrl !== START) return;
  swapped.add(tab.id);
  browser.tabs.update(tab.id, { url: PAGE }).catch(() => swapped.delete(tab.id));
}

browser.tabs.onCreated.addListener(swap);
browser.tabs.onUpdated.addListener((id, change, tab) => { if (change.url) swap(tab); });
browser.tabs.onRemoved.addListener((id) => swapped.delete(id));
