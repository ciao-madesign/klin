// Opens the self-test page. No permissions, no network access.
browser.action.onClicked.addListener(() => {
  browser.tabs.create({ url: browser.runtime.getURL("page/index.html") });
});
