// Opens the search engine choice once, when Klin is first installed, and again from the toolbar button.
// Opens no other page and makes no connection.
"use strict";

const PAGE = browser.runtime.getURL("page/choose.html");

async function show() {
  const [open] = await browser.tabs.query({ url: PAGE });
  if (open) {
    await browser.tabs.update(open.id, { active: true });
    await browser.windows.update(open.windowId, { focused: true });
  } else {
    await browser.tabs.create({ url: PAGE });
  }
}

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== "install") return;
  const { engine, offered } = await browser.storage.local.get(["engine", "offered"]);
  if (engine || offered) return;
  await browser.storage.local.set({ offered: true });
  await show();
});

browser.action.onClicked.addListener(show);
