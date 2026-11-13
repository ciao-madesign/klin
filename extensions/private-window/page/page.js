"use strict";

// Searches with the default search engine, like the page it replaces. An address typed here is opened as an address.
document.getElementById("search").addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = document.getElementById("query").value.trim();
  if (!text) return;
  const looksLikeAddress = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) || (/^[^\s/]+\.[a-z]{2,}(\/\S*)?$/i.test(text));
  if (looksLikeAddress) {
    const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(text) ? text : "https://" + text;
    if (/^https?:\/\//i.test(url)) { location.href = url; return; }
  }
  const tab = await browser.tabs.getCurrent();
  browser.search.search({ query: text, tabId: tab.id });
});
