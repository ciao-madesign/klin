const PAGE = browser.runtime.getURL("page/index.html");

// The button is there from the first start. Nothing connects to anything: the page opens, that is all.
browser.action.onClicked.addListener(async () => {
  const [open] = await browser.tabs.query({ url: PAGE });
  if (open) {
    await browser.tabs.update(open.id, { active: true });
    await browser.windows.update(open.windowId, { focused: true });
  } else {
    await browser.tabs.create({ url: PAGE });
  }
});
