// Sends the typed text to the engine the user chose at the first start (kept on this device), or to the browser's default. No history.
document.getElementById("f").addEventListener("submit", async (e) => {
  e.preventDefault();
  const query = document.getElementById("q").value.trim();
  if (!query) return;
  const { engine } = await browser.storage.local.get("engine");     // the user's choice (choose.html); none: the browser's default
  const known = engine && (await browser.search.get()).some((e) => e.name === engine);
  browser.search.search(known ? { query, engine, disposition: "CURRENT_TAB" } : { query, disposition: "CURRENT_TAB" });
});

// The link opens Klin's presentation page, which belongs to another extension (welcome@klin): ask it to show the page.
document.getElementById("more").addEventListener("click", (e) => {
  e.preventDefault();
  browser.runtime.sendMessage("welcome@klin", { type: "show" }).catch(() => {});
});
