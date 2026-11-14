const $ = (id) => document.getElementById(id);

const render = (state) => {
  $("status").textContent = KlinLevels.levels[state.level].line;
  $("levels").replaceChildren($("levels").firstChild, ...Object.entries(KlinLevels.levels).map(([id, lv]) => {
    const box = document.createElement("div");
    box.className = "level" + (id === state.level ? " current" : "");
    if (!lv.available) box.setAttribute("aria-disabled", "true");
    const radio = Object.assign(document.createElement("input"), { type: "radio", name: "level", id: "lv-" + id, value: id, checked: id === state.level, disabled: !lv.available });
    radio.addEventListener("change", async () => render(await browser.runtime.sendMessage({ type: "set", level: id })));
    const head = document.createElement("h3");
    const label = Object.assign(document.createElement("label"), { htmlFor: "lv-" + id, textContent: lv.name + (id === state.level ? " (current)" : "") + (lv.available ? "" : " (not available yet)") });
    head.append(label);
    const para = (cls, title, text) => { const p = document.createElement("p"); p.className = cls; const b = document.createElement("b"); b.textContent = title + " "; p.append(b, text); return p; };
    box.append(radio, head, para("does", "What it does.", lv.does), para("hides", "What it does not hide.", lv.hides), para("cost", "What it costs.", lv.cost));
    return box;
  }));
};

browser.runtime.sendMessage({ type: "get" }).then(render);
