const $ = (id) => document.getElementById(id);
const t = (key, ...a) => klin.t(key, key, ...a);

const render = (state) => {
  $("status").textContent = t("pl_" + state.level + "_line");
  $("levels").replaceChildren($("levels").firstChild, ...Object.entries(KlinLevels.levels).map(([id, lv]) => {
    const box = document.createElement("div");
    box.className = "level" + (id === state.level ? " current" : "");
    if (!lv.available) box.setAttribute("aria-disabled", "true");
    const radio = Object.assign(document.createElement("input"), { type: "radio", name: "level", id: "lv-" + id, value: id, checked: id === state.level, disabled: !lv.available });
    radio.addEventListener("change", async () => render(await browser.runtime.sendMessage({ type: "set", level: id })));
    const head = document.createElement("h3");
    const label = Object.assign(document.createElement("label"), {
      htmlFor: "lv-" + id,
      textContent: t("pl_" + id + "_name") + (id === state.level ? " " + t("pl_current") : "") + (lv.available ? "" : " " + t("pl_unavailable")),
    });
    head.append(label);
    const para = (cls, labelKey, textKey) => { const p = document.createElement("p"); p.className = cls; const b = document.createElement("b"); b.textContent = t(labelKey) + " "; p.append(b, t(textKey)); return p; };
    box.append(radio, head,
      para("does", "pl_does_l", "pl_" + id + "_does"),
      para("hides", "pl_hides_l", "pl_" + id + "_hides"),
      para("cost", "pl_cost_l", "pl_" + id + "_cost"));
    return box;
  }));
};

klin.ready.then(() => browser.runtime.sendMessage({ type: "get" })).then(render);
