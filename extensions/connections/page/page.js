// Renders data/connections.json. Read-only: no browser APIs, no network.
"use strict";

const t = (key, fallback, ...args) => klin.t(key, fallback, ...args);
const CONTROL_LABEL = {
  pref: ["c_ctl_pref", "Preference in about:config"],
  policy: ["c_ctl_policy", "Enterprise policy"],
  ublock: ["c_ctl_ublock", "uBlock Origin setting"],
  none: ["c_ctl_none", "No switch"],
};
const WHEN_LABEL = { idle: ["c_when_idle", "In the background"], browsing: ["c_when_browsing", "While browsing"] };
// Entry texts live in data/connections.json (English). A translation, if present, is looked up as c_<id>_<field>.
const entry = (c, field, fallback) => t("e_" + c.id.replace(/-/g, "_") + "_" + field, fallback);

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
      el("strong", { textContent: entry(c, "name", c.name) }),
      el("small", { textContent: c.hosts.join(", ") }),
    ]),
    el("span", { className: "tag", textContent: t(...WHEN_LABEL[c.when]) }),
    el("span", { className: "badge " + c.klin, textContent: isOn ? t("c_active", "Active") : t("c_offlabel", "Off") }),
  ]);

  const dl = el("dl");
  row(dl, t("c_r_who", "Who receives it"), entry(c, "operator", c.operator));
  row(dl, t("c_r_purpose", "Purpose"), entry(c, "purpose", c.purpose));
  row(dl, t("c_r_sees", "What it can see"), entry(c, "sees", c.sees));
  row(dl, t("c_r_decision", "Klin's choice"), entry(c, "decision", c.decision));
  row(dl, isOn ? t("c_r_ifoff", "If you turn it off") : t("c_r_lose", "What you lose"), entry(c, "ifOff", c.ifOff));
  const control = [el("div", { textContent: t(...CONTROL_LABEL[c.control.type]) })];
  if (c.control.items.length) {
    control.push(el("div", {}, c.control.items.map((i) => el("code", { textContent: i }))));
  }
  if (c.control.note) control.push(el("div", { textContent: entry(c, "note", c.control.note) }));
  row(dl, t("c_r_change", "How to change it"), control);
  row(dl, t("c_r_stock", "In stock Firefox"), c.stock ? t("c_active", "Active") : t("c_absent", "Not present"));
  row(dl, t("c_r_checked", "Checked by"), c.evidence === "audit"
    ? t("c_ev_audit", "Connection audit: seen (or confirmed absent) on the wire")
    : t("c_ev_setting", "Setting value only, not yet observed on the wire"));

  const details = el("details", { className: "card" }, [summary, dl]);
  details.dataset.state = c.klin;
  return details;
}

function stat(number, label) {
  return el("div", { className: "stat" }, [el("b", { textContent: number }), el("span", { textContent: label })]);
}

async function main() {
  await klin.ready;
  const list = document.getElementById("list");
  let data;
  try {
    data = await (await fetch("../data/connections.json")).json();
  } catch (e) {
    list.append(el("p", { textContent: t("c_loaderr", "The connection list could not be loaded.") }));
    return;
  }
  const all = data.connections;
  const on = all.filter((c) => c.klin === "on");
  const off = all.filter((c) => c.klin === "off");
  const stockOn = all.filter((c) => c.stock);

  document.getElementById("summary").append(
    stat(on.length, t("c_n_on", "active in Klin")),
    stat(off.length, t("c_n_off", "turned off by Klin")),
    stat(stockOn.length, t("c_n_stock", "active in stock Firefox")),
  );
  // Active first: these are the ones that actually leave the machine.
  for (const c of [...on, ...off]) list.append(card(c));

  document.getElementById("audit").textContent =
    t("c_audit", "Checked on Firefox {1} ({2}). {3} {4}", data.audit.firefox, data.audit.platform, t("c_audit_method", data.audit.method), t("c_audit_limits", data.audit.limits));

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
