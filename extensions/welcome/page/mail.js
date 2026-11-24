// The button asks the alias registry to open its guide. If that extension is not there, a line says so. Nothing else happens.
document.getElementById("mailGuide").addEventListener("click", async () => {
  try {
    const answer = await browser.runtime.sendMessage("alias-registry@klin", { type: "open-guide" });
    if (!answer || !answer.opened) throw new Error("no answer");
  } catch (e) {
    document.getElementById("mailMissing").classList.remove("hidden");
  }
});
