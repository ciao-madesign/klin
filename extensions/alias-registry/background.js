const PAGE = browser.runtime.getURL("page/index.html");

browser.action.onClicked.addListener(async () => {
  const [open] = await browser.tabs.query({ url: PAGE });
  if (open) {
    await browser.tabs.update(open.id, { active: true });
    await browser.windows.update(open.windowId, { focused: true });
  } else {
    await browser.tabs.create({ url: PAGE });
  }
});

// Only one other Klin extension may ask: the username check, which offers the user's own usernames from here.
// It receives usernames only (no sites, no emails), and only when the user opens the list there.
browser.runtime.onMessageExternal.addListener(async (message, sender) => {
  if (sender.id !== "username-check@klin" || !message || message.type !== "usernames") return undefined;
  const { entries = [] } = await browser.storage.local.get("entries");
  return { usernames: KlinRegistry.usernames(entries) };
});
