// Sends the typed text to the user's default search engine (the browser's own search setting). Nothing is stored.
document.getElementById("f").addEventListener("submit", (e) => {
  e.preventDefault();
  const query = document.getElementById("q").value.trim();
  if (query) browser.search.search({ query, disposition: "CURRENT_TAB" });
});
