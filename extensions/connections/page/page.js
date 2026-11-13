// Renders data/connections.json. Read-only: no browser APIs, no network.
"use strict";

const CONTROL_LABEL = {
  pref: "Preference in about:config",
  policy: "Enterprise policy",
  ublock: "uBlock Origin setting",
  none: "No switch",
};
const WHEN_LABEL = { idle: "In the background", browsing: "While browsing" };

function el(tag, props = {}, children = []) {
  const node = document.createElement(tag);
  Object.assign(node, props);
  for (const child of [].concat(children)) node.append(child);
  return node;
}

function row(dl, label, content) {
  dl.append(el("dt", { textContent: label }), el("dd", {}, content));
}

function card(c) {
  const isOn = c.klin === "on";
  const summary = el("summary", {}, [
    el("span", { className: "title" }, [
      el("strong", { textContent: c.name }),
      el("small", { textContent: c.hosts.join(", ") }),
    ]),
    el("span", { className: "tag", textContent: WHEN_LABEL[c.when] }),
    el("span", { className: "badge " + c.klin, textContent: isOn ? "Active" : "Off" }),
  ]);

  const dl = el("dl");
  row(dl, "Who receives it", c.operator);
  row(dl, "Purpose", c.purpose);
  row(dl, "What it can see", c.sees);
  row(dl, "Klin's choice", c.decision);
  row(dl, isOn ? "If you turn it off" : "What you lose", c.ifOff);
  const control = [el("div", { textContent: CONTROL_LABEL[c.control.type] })];
  if (c.control.items.length) {
    control.push(el("div", {}, c.control.items.map((i) => el("code", { textContent: i }))));
  }
  if (c.control.note) control.push(el("div", { textContent: c.control.note }));
  row(dl, "How to change it", control);
  row(dl, "In stock Firefox", c.stock ? "Active" : "Not present");
  row(dl, "Checked by", c.evidence === "audit"
    ? "Connection audit: seen (or confirmed absent) on the wire"
    : "Setting value only, not yet observed on the wire");

  const details = el("details", { className: "card" }, [summary, dl]);
  details.dataset.state = c.klin;
  return details;
}

function stat(number, label) {
  return el("div", { className: "stat" }, [el("b", { textContent: number }), el("span", { textContent: label })]);
}

async function main() {
  const list = document.getElementById("list");
  let data;
  try {
    data = await (await fetch("../data/connections.json")).json();
  } catch (e) {
    list.append(el("p", { textContent: "The connection list could not be loaded." }));
    return;
  }
  const all = data.connections;
  const on = all.filter((c) => c.klin === "on");
  const off = all.filter((c) => c.klin === "off");
  const stockOn = all.filter((c) => c.stock);

  document.getElementById("summary").append(
    stat(on.length, "active in Klin"),
    stat(off.length, "turned off by Klin"),
    stat(stockOn.length, "active in stock Firefox"),
  );
  // Active first: these are the ones that actually leave the machine.
  for (const c of [...on, ...off]) list.append(card(c));

  document.getElementById("audit").textContent =
    `Checked on Firefox ${data.audit.firefox} (${data.audit.platform}). ${data.audit.method} ${data.audit.limits}`;

  const buttons = document.querySelectorAll(".filters button");
  for (const button of buttons) {
    button.addEventListener("click", () => {
      const filter = button.dataset.filter;
      for (const b of buttons) b.setAttribute("aria-pressed", String(b === button));
      for (const d of list.children) d.hidden = filter !== "all" && d.dataset.state !== filter;
    });
  }
}

main();
