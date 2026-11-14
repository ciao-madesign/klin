// Shows Klin's presentation page: once, when the browser is installed and first started,
// and again whenever the info button is clicked. Opens no other page and makes no connection.
"use strict";

const PAGE = browser.runtime.getURL("page/index.html");

async function show() {
  const [open] = await browser.tabs.query({ url: PAGE });       // already open: go to it instead of opening a second copy
  if (open) {
    await browser.tabs.update(open.id, { active: true });
    await browser.windows.update(open.windowId, { focused: true });
  } else {
    await browser.tabs.create({ url: PAGE });
  }
}

browser.runtime.onInstalled.addListener(async ({ reason }) => {
  if (reason !== "install") return;                              // not on updates
  const { shown } = await browser.storage.local.get("shown");
  if (shown) return;                                             // never twice for the same installation
  await browser.storage.local.set({ shown: true });
  await show();
});

browser.action.onClicked.addListener(show);

// Klin's start page (newtab@klin) links here: an extension page cannot open another extension's page itself.
browser.runtime.onMessageExternal.addListener((message, sender) => {
  if (sender.id === "newtab@klin" && message && message.type === "show") return show();
});
