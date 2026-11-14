// Sends the typed text to the user's default search engine (the browser's own search setting). Nothing is stored.
document.getElementById("f").addEventListener("submit", (e) => {
  e.preventDefault();
  const query = document.getElementById("q").value.trim();
  if (query) browser.search.search({ query, disposition: "CURRENT_TAB" });
});

// The link opens Klin's presentation page, which belongs to another extension (welcome@klin): ask it to show the page.
document.getElementById("more").addEventListener("click", (e) => {
  e.preventDefault();
  browser.runtime.sendMessage("welcome@klin", { type: "show" }).catch(() => {});
});
