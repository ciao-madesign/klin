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
  // Steps: the search engine, then (once its sentences are checked: KLIN_DNS_READY) the DNS service.
  const steps = window.KLIN_DNS_READY ? ["engine", "dns"] : ["engine"];
  const $ = (id) => document.getElementById(id);
  let at = 0, pickedEngine = chosen, pickedDns = null;
  const { dns } = await browser.storage.local.get("dns");

  function renderDns() {
    const box = $("dns");
    if (box.childElementCount) return;
    const first = dns || "current";
    for (const d of window.KLIN_DNS) {
      const label = document.createElement("label");
      label.className = "card engine";
      const radio = document.createElement("input");
      Object.assign(radio, { type: "radio", name: "dns", value: d.id, checked: d.id === first });
      const body = document.createElement("div");
      const title = document.createElement("h2"); title.textContent = lang === "it" && d.nameIt ? d.nameIt : d.name;
      const p = document.createElement("p"); p.append(...window.klin.nodes(d[lang]));
      body.append(title, p);
      label.append(radio, body);
      box.append(label);
    }
  }

  function show() {
    const multi = steps.length > 1;
    const now = steps[at];
    $("step").hidden = !multi;
    if (multi) $("step").textContent = t("c_step", undefined, at + 1, steps.length) + " · " + t(now === "engine" ? "c_engine_step" : "d_step");
    $("list").hidden = now !== "engine";
    $("scope").hidden = now !== "engine";
    $("check").hidden = now !== "engine";
    $("dns").hidden = now !== "dns";
    $("back").hidden = at === 0;
    $("go").textContent = t(at === steps.length - 1 ? (multi ? "c_done" : "c_continue") : "c_next");
    $("saved").textContent = "";
    if (now === "dns") { renderDns(); $("h1").textContent = t("d_title"); $("lead").textContent = t("d_lead"); }
    else { $("h1").textContent = t("c_title"); $("lead").textContent = t("c_lead"); }
    $("h1").focus && $("h1").setAttribute("tabindex", "-1");
    $("h1").focus();
  }

  $("scope").textContent = t("c_scope", undefined, current ? current.name : "?");
  $("back").addEventListener("click", () => { at = Math.max(0, at - 1); show(); });
  $("form").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    if (steps[at] === "engine") {
      pickedEngine = new FormData(ev.target).get("engine");
      await browser.storage.local.set({ engine: pickedEngine });
      if (steps.length === 1) { $("saved").textContent = t("c_saved", undefined, pickedEngine); return; }
      at++; show(); return;
    }
    pickedDns = new FormData(ev.target).get("dns");
    await browser.storage.local.set({ dns: pickedDns });   // stored only; applying it is separate work (ADR 0005)
    const d = window.KLIN_DNS.find((x) => x.id === pickedDns);
    $("saved").textContent = t("c_summary", undefined, pickedEngine, lang === "it" && d.nameIt ? d.nameIt : d.name);
  });
  show();
})();
