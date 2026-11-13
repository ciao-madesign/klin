"use strict";

const GROUPS = [
  { kinds: ["blocked"], title: "Blocked" },
  { kinds: ["limited", "tracker", "sent", "fingerprint"], title: "Not blocked: limited or only observed" },
];
const el = (tag, props = {}, kids = []) => { const n = Object.assign(document.createElement(tag), props); n.append(...[].concat(kids)); return n; };
let tabId = null;

function render(data) {
  document.getElementById("where").textContent = data.top ? "On " + data.top : "No page yet";
  const list = document.getElementById("list");
  const blocked = data.entries.filter((e) => e.kind === "blocked").reduce((n, e) => n + e.count, 0);
  const other = data.entries.filter((e) => e.kind !== "blocked").reduce((n, e) => n + e.count, 0);
  const stat = (n, label) => el("div", { className: "stat" }, [el("b", { textContent: n }), el("span", { textContent: label })]);
  document.getElementById("summary").replaceChildren(stat(blocked, "blocked"), stat(other, "not blocked"));
  if (!data.entries.length) {
    list.replaceChildren(el("p", { className: "empty", textContent: "Nothing detected on this page. That does not prove nothing was collected: see what is not shown below." }));
    return;
  }
  const sections = [];
  for (const group of GROUPS) {
    const rows = data.entries.filter((e) => group.kinds.includes(e.kind)).sort((a, b) => b.count - a.count);
    if (!rows.length) continue;
    sections.push(el("h2", { textContent: group.title }), el("div", { className: "group" }, rows.map((e) =>
      el("div", { className: "row" }, [
        el("span", { className: "who" }, [e.who, ...(e.own ? [el("span", { className: "tag own", textContent: "this site" })] : [])]),
        el("span", { className: "count", textContent: "×" + e.count }),
        el("span", { className: "what", textContent: e.what }),
      ]))));
  }
  list.replaceChildren(...sections);
}

async function refresh() {
  render(await browser.runtime.sendMessage({ type: "get", tabId }));
}

(async () => {
  // ?tab=ID shows another tab's log (used by the tests); normally it is the tab you are looking at.
  const requested = Number(new URLSearchParams(location.search).get("tab"));
  const [tab] = requested ? [{ id: requested }] : await browser.tabs.query({ active: true, currentWindow: true });
  tabId = tab && tab.id;
  if (tabId == null) return;
  await refresh();
  document.documentElement.dataset.ready = "1";
  document.getElementById("clear").addEventListener("click", async () => { await browser.runtime.sendMessage({ type: "clear", tabId }); refresh(); });
})();
