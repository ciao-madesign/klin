// The toolbar button opens the check page, or brings it to the front if it is already open.
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
