// Toolbar button: test the tab the user is looking at and show the result next to it.
// "activeTab" gives access to that one tab, only after the click.
browser.action.onClicked.addListener((tab) => {
  browser.tabs.create({ url: browser.runtime.getURL("page/index.html") + "?tab=" + tab.id, index: tab.index + 1 });
});
