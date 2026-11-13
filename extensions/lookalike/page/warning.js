"use strict";

const params = new URLSearchParams(location.search);
const target = params.get("url"), site = params.get("site"), known = params.get("known");
const REASON = {
  "same-look": ["l_reason_same_look", "The two names look the same at a glance, but use different characters (for example “rn” for “m”, “0” for “o”, or letters from another alphabet)."],
  "one-letter": ["l_reason_one_letter", "The two names differ by a single letter."],
};

// Shows a name with the characters that differ from the other name highlighted.
function showName(id, name, other) {
  const node = document.getElementById(id);
  let start = 0, end = 0;
  while (start < name.length && name[start] === other[start]) start++;
  while (end < name.length - start && end < other.length - start && name[name.length - 1 - end] === other[other.length - 1 - end]) end++;
  const middle = name.slice(start, name.length - end);
  node.append(name.slice(0, start));
  if (middle) node.append(Object.assign(document.createElement("mark"), { textContent: middle }));
  node.append(name.slice(name.length - end));
}

showName("site", site, known);
showName("known", known, site);
klin.ready.then(() => {                      // wording comes from _locales; the names above do not depend on it
  const reason = REASON[params.get("reason")];
  document.getElementById("reason").textContent = reason ? klin.t(reason[0], reason[1]) : "";
  document.getElementById("go-known").textContent = klin.t("l_go", "Go to {1}", known);
  document.getElementById("continue").textContent = klin.t("l_continue", "Continue to {1}", site);
});

document.getElementById("go-known").addEventListener("click", () => { location.href = "https://" + known + "/"; });
document.getElementById("back").addEventListener("click", () => { if (history.length > 1) history.back(); else window.close(); });
document.getElementById("continue").addEventListener("click", async () => {
  const { allowed = [] } = await browser.storage.local.get("allowed");
  if (!allowed.includes(site)) await browser.storage.local.set({ allowed: [...allowed, site] });
  if (/^https?:\/\//i.test(target)) location.href = target;
});
