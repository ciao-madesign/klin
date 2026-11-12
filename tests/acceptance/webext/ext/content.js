const api = typeof browser !== "undefined" ? browser : chrome;
(async () => {
  const hidden = [...document.querySelectorAll(".sponsored")];
  hidden.forEach((e) => (e.style.display = "none"));
  let pageFetch;
  try { await fetch("http://127.0.0.1:11434/api/tags"); pageFetch = "allowed"; } catch (e) { pageFetch = "blocked (" + e.name + ")"; }
  api.runtime.sendMessage({ type: "content", sponsoredHidden: hidden.length, contentScriptFetchToOllama: pageFetch,
    sponsoredNowVisible: hidden.filter((e) => e.offsetParent !== null).length });
})();
