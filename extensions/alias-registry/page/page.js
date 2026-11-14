const $ = (id) => document.getElementById(id);
let entries = [];

const save = () => browser.storage.local.set({ entries });
const fill = () => {
  const rows = $("rows");
  const shown = KlinRegistry.filter(entries, $("search").value);
  rows.replaceChildren(...shown.map((e) => {
    const tr = document.createElement("tr");
    for (const text of [e.value, e.site, e.note]) { const td = document.createElement("td"); td.textContent = text; tr.append(td); }
    const td = document.createElement("td");
    const del = document.createElement("button");
    del.textContent = "Delete"; del.type = "button"; del.setAttribute("aria-label", "Delete " + e.value + " for " + e.site);
    del.addEventListener("click", async () => { entries = entries.filter((x) => x.id !== e.id); await save(); fill(); });
    td.append(del); tr.append(td);
    return tr;
  }));
  $("empty").classList.toggle("hidden", entries.length > 0);
  $("count").textContent = entries.length ? "(" + entries.length + ")" : "";
};

$("form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const r = KlinRegistry.make({ kind: $("kind").value, value: $("value").value, site: $("site").value, note: $("note").value });
  $("error").textContent = r.error || ""; $("error").classList.toggle("hidden", !r.error);
  if (r.error) return;
  entries.push(r.entry); await save();
  for (const id of ["value", "site", "note"]) $(id).value = "";
  fill();
});

$("plus").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const a = KlinRegistry.plusAddress($("base").value, $("site").value);
  if (!a) { $("error").textContent = "Write your address above, and the site in the form."; $("error").classList.remove("hidden"); return; }
  $("error").classList.add("hidden"); $("kind").value = "email"; $("value").value = a;
});

$("who").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const hits = KlinRegistry.whoGot(entries, $("leak").value);
  $("leakResult").textContent = !$("leak").value.trim() ? "" : hits.length
    ? "You gave this address to: " + hits.map((e) => e.site).join(", ") + "."
    : "That address is not in your list.";
});

$("search").addEventListener("input", fill);

$("export").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([KlinRegistry.exportText(entries)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "klin-aliases.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("backupNote").textContent = "Backup saved as klin-aliases.json. It is a plain file.";
});
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", async () => {
  const file = $("importFile").files[0]; if (!file) return;
  const r = KlinRegistry.importText(await file.text(), entries);
  if (r.error) { $("backupNote").textContent = r.error; return; }
  entries.push(...r.added); await save(); fill();
  $("backupNote").textContent = "Added " + r.added.length + ", skipped " + r.skipped + " (already there or not valid).";
  $("importFile").value = "";
});

browser.storage.local.get("entries").then((d) => { entries = d.entries || []; fill(); });
