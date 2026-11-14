// Shows the engines, remembers the choice (on this device only) and tells what it does and does not change.
"use strict";
(async () => {
  await window.klin.ready;
  const t = (k, ...a) => window.klin.t(k, ...a);
  const lang = window.klin.lang === "it" ? "it" : "en";
  const { engine } = await browser.storage.local.get("engine");
  const current = (await browser.search.get()).find((e) => e.isDefault);
  const list = document.getElementById("list");
  const shown = window.KLIN_ENGINES;
  const chosen = engine || (shown.find((e) => e.preselected) || shown[0]).name;
  for (const e of shown) {
    const f = e[lang];
    const label = document.createElement("label");
    label.className = "card engine";
    const radio = document.createElement("input");
    Object.assign(radio, { type: "radio", name: "engine", value: e.name, checked: e.name === chosen });
    const body = document.createElement("div");
    const title = document.createElement("h2"); title.textContent = e.name;
    body.append(title);
    if (e.preselected) { const s = document.createElement("p"); s.className = "tag"; s.textContent = t("c_suggested"); body.append(s); }
    const dl = document.createElement("dl");
    for (const [key, k] of [["who", "c_who"], ["results", "c_results"], ["money", "c_money"], ["says", "c_says"], ["account", "c_account"]]) {
      const dt = document.createElement("dt"); dt.textContent = t(k);
      const dd = document.createElement("dd"); dd.textContent = f[key];
      dl.append(dt, dd);
    }
    body.append(dl);
    label.append(radio, body);
    list.append(label);
  }
  document.getElementById("scope").textContent = t("c_scope", undefined, current ? current.name : "?");
  document.getElementById("form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const value = new FormData(ev.target).get("engine");
    await browser.storage.local.set({ engine: value });
    document.getElementById("saved").textContent = t("c_saved", undefined, value);
  });
})();
