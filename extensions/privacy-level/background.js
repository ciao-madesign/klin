// Applies the chosen level through the browser's privacy settings, which belong to this extension while it is
// installed: removing it hands them back. Standard means "touch nothing": Klin's own preferences apply.
const setting = browser.privacy.websites.resistFingerprinting;

async function apply(level) {
  if (level === "advanced") await setting.set({ value: true });
  else await setting.clear({});
}

async function current() {
  const { level = KlinLevels.default } = await browser.storage.local.get("level");
  return KlinLevels.levels[level] && KlinLevels.levels[level].available ? level : KlinLevels.default;
}

browser.runtime.onStartup.addListener(async () => apply(await current()));
browser.runtime.onInstalled.addListener(async () => apply(await current()));

// The page asks for a change here so that storing the choice and applying it cannot get out of step.
browser.runtime.onMessage.addListener(async (message, sender) => {
  if (sender.id !== browser.runtime.id) return undefined;
  if (message.type === "set") {
    const level = KlinLevels.levels[message.level] && KlinLevels.levels[message.level].available ? message.level : null;
    if (!level) return { error: "That level is not available." };
    await browser.storage.local.set({ level });
    await apply(level);
  }
  const state = await setting.get({});
  return { level: await current(), control: state.levelOfControl, active: state.value };
});

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
