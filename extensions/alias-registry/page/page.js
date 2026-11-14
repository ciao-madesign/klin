const $ = (id) => document.getElementById(id);
let entries = [];
let secrets = {};   // entry id -> { address, password, accountId } for disposable addresses; never exported
const ROOT = KlinMailTm.base;

const save = () => browser.storage.local.set({ entries, secrets });
const fill = () => {
  const rows = $("rows");
  const shown = KlinRegistry.filter(entries, $("search").value);
  rows.replaceChildren(...shown.map((e) => {
    const tr = document.createElement("tr");
    for (const text of [e.value, e.site, e.note]) { const td = document.createElement("td"); td.textContent = text; tr.append(td); }
    const td = document.createElement("td");
    const del = document.createElement("button");
    del.textContent = klin.t("ar_delete", "Delete"); del.type = "button"; del.setAttribute("aria-label", klin.t("ar_delete_aria", "Delete {1} for {2}", e.value, e.site));
    del.addEventListener("click", async () => {
      if (secrets[e.id]) { try { await KlinMailTm.remove(fetch, secrets[e.id], ROOT); } catch (err) { /* service unreachable: the local entry still goes */ } delete secrets[e.id]; }
      entries = entries.filter((x) => x.id !== e.id); await save(); fill();
    });
    td.append(del);
    if (e.provider && secrets[e.id]) {
      const open = document.createElement("button");
      open.textContent = klin.t("ar_inbox", "Inbox"); open.type = "button"; open.setAttribute("aria-label", klin.t("ar_inbox_aria", "Open the inbox of {1}", e.value));
      open.addEventListener("click", () => showInbox(e));
      td.prepend(open);
    }
    tr.append(td);
    return tr;
  }));
  $("empty").classList.toggle("hidden", entries.length > 0);
  $("count").textContent = entries.length ? "(" + entries.length + ")" : "";
};

$("form").addEventListener("submit", async (ev) => {
  ev.preventDefault();
  const r = KlinRegistry.make({ kind: $("kind").value, value: $("value").value, site: $("site").value, note: $("note").value });
  $("error").textContent = r.error ? klin.t("ar_err_" + r.code, r.error) : ""; $("error").classList.toggle("hidden", !r.error);
  if (r.error) return;
  entries.push(r.entry); await save();
  for (const id of ["value", "site", "note"]) $(id).value = "";
  fill();
});

$("plus").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const a = KlinRegistry.plusAddress($("base").value, $("site").value);
  if (!a) { $("error").textContent = klin.t("ar_plus_err", "Write your address above, and the site in the form."); $("error").classList.remove("hidden"); return; }
  $("error").classList.add("hidden"); $("kind").value = "email"; $("value").value = a;
});

$("who").addEventListener("submit", (ev) => {
  ev.preventDefault();
  const hits = KlinRegistry.whoGot(entries, $("leak").value);
  $("leakResult").textContent = !$("leak").value.trim() ? "" : hits.length
    ? klin.t("ar_who_hit", "You gave this address to: {1}.", hits.map((e) => e.site).join(", "))
    : klin.t("ar_who_none", "That address is not in your list.");
});

$("search").addEventListener("input", fill);

$("export").addEventListener("click", () => {
  const url = URL.createObjectURL(new Blob([KlinRegistry.exportText(entries)], { type: "application/json" }));
  const a = document.createElement("a"); a.href = url; a.download = "klin-aliases.json"; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  $("backupNote").textContent = klin.t("ar_backup_saved", "Backup saved as klin-aliases.json. It is a plain file.");
});
$("importBtn").addEventListener("click", () => $("importFile").click());
$("importFile").addEventListener("change", async () => {
  const file = $("importFile").files[0]; if (!file) return;
  const r = KlinRegistry.importText(await file.text(), entries);
  if (r.error) { $("backupNote").textContent = klin.t("ar_err_" + r.code, r.error); return; }
  entries.push(...r.added); await save(); fill();
  $("backupNote").textContent = klin.t("ar_backup_loaded", "Added {1}, skipped {2} (already there or not valid).", r.added.length, r.skipped);
  $("importFile").value = "";
});

const askService = async () => {
  let granted = false;
  try { granted = await browser.permissions.request({ origins: [new URL(ROOT).protocol + "//" + new URL(ROOT).hostname + "/*"] }); } catch (e) { granted = false; }
  return granted;
};

$("makeDisposable").addEventListener("click", async () => {
  const note = (t) => { $("disposableNote").textContent = t; };
  const site = $("site").value.trim();
  if (!site) { note(klin.t("ar_d_needsite", "Write the site this address is for, in the form above, first.")); return; }
  if (!(await askService())) { note(klin.t("ar_d_noperm", "Without your permission to contact the service nothing was sent.")); return; }
  note(klin.t("ar_d_asking", "Asking the service…"));
  try {
    const made = await KlinMailTm.create(fetch, ROOT);
    const r = KlinRegistry.make({ kind: "email", value: made.address, site, note: $("note").value || "disposable, mail.tm", provider: "mail.tm" });
    entries.push(r.entry); secrets[r.entry.id] = made; await save();
    for (const id of ["value", "site", "note"]) $(id).value = "";
    fill(); note(klin.t("ar_d_created", "Created {1} and saved it in your list.", made.address));
  } catch (e) { note(klin.t("ar_d_fail", "Could not create an address: {1}", e.message)); }
});

const showInbox = async (entry) => {
  $("inboxBox").classList.remove("hidden"); $("inboxOf").textContent = entry.value;
  $("messageText").classList.add("hidden"); $("messages").replaceChildren();
  $("inboxNote").textContent = klin.t("ar_d_asking", "Asking the service…");
  if (!(await askService())) { $("inboxNote").textContent = klin.t("ar_d_noperm", "Without your permission to contact the service nothing was sent."); return; }
  try {
    const list = await KlinMailTm.inbox(fetch, secrets[entry.id], ROOT);
    $("inboxNote").textContent = list.length ? "" : klin.t("ar_d_empty", "Nothing has arrived yet.");
    $("messages").replaceChildren(...list.map((m) => {
      const li = document.createElement("li");
      const b = document.createElement("button"); b.type = "button"; b.textContent = klin.t("ar_read", "Read");
      b.addEventListener("click", async () => {
        try { const full = await KlinMailTm.read(fetch, secrets[entry.id], m.id, ROOT); $("messageText").textContent = full.subject + "\n\n" + full.text; $("messageText").classList.remove("hidden"); }
        catch (e) { $("inboxNote").textContent = klin.t("ar_d_msg_fail", "Could not open the message: {1}", e.message); }
      });
      li.append(b, document.createTextNode(m.subject + " — " + m.from));
      return li;
    }));
  } catch (e) { $("inboxNote").textContent = klin.t("ar_d_inbox_fail", "Could not open the inbox: {1}", e.message); }
};

browser.storage.local.get(["entries", "secrets"]).then((d) => { entries = d.entries || []; secrets = d.secrets || {}; fill(); });
