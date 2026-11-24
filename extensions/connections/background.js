// Opens the connections page. No permissions, no network access.
browser.action.onClicked.addListener(() => {
  browser.tabs.create({ url: browser.runtime.getURL("page/index.html") });
});

// The Klin start page (newtab@klin) offers a shortcut here: an extension page cannot open another extension's page itself.
browser.runtime.onMessageExternal.addListener((message, sender) => {
  if (sender.id === "newtab@klin" && message && message.type === "show") browser.tabs.create({ url: browser.runtime.getURL("page/index.html") });
});
