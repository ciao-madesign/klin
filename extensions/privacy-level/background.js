// Applies the chosen level. Standard changes nothing. Advanced registers a small script that runs in every page
// before the page's own scripts and makes the time zone UTC. The registration is the level: removing the
// extension removes it.
const SCRIPT_ID = "klin-timezone";

async function apply(level) {
  const registered = (await browser.scripting.getRegisteredContentScripts({ ids: [SCRIPT_ID] })).length > 0;
  if (level === "advanced" && !registered) {
    await browser.scripting.registerContentScripts([{
      id: SCRIPT_ID, js: ["timezone.js"], matches: ["<all_urls>"], allFrames: true, matchOriginAsFallback: true,
      runAt: "document_start", world: "MAIN", persistAcrossSessions: true,
    }]);
  } else if (level !== "advanced" && registered) {
    await browser.scripting.unregisterContentScripts({ ids: [SCRIPT_ID] });
  }
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
  return { level: await current() };
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
