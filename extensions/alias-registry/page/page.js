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
    del.textContent = "Delete"; del.type = "button"; del.setAttribute("aria-label", "Delete " + e.value + " for " + e.site);
    del.addEventListener("click", async () => {
      if (secrets[e.id]) { try { await KlinMailTm.remove(fetch, secrets[e.id], ROOT); } catch (err) { /* service unreachable: the local entry still goes */ } delete secrets[e.id]; }
      entries = entries.filter((x) => x.id !== e.id); await save(); fill();
    });
    td.append(del);
    if (e.provider && secrets[e.id]) {
      const open = document.createElement("button");
      open.textContent = "Inbox"; open.type = "button"; open.setAttribute("aria-label", "Open the inbox of " + e.value);
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

const askService = async () => {
  let granted = false;
  try { granted = await browser.permissions.request({ origins: [new URL(ROOT).protocol + "//" + new URL(ROOT).hostname + "/*"] }); } catch (e) { granted = false; }
  return granted;
};

$("makeDisposable").addEventListener("click", async () => {
  const note = (t) => { $("disposableNote").textContent = t; };
  const site = $("site").value.trim();
  if (!site) { note("Write the site this address is for, in the form above, first."); return; }
  if (!(await askService())) { note("Without your permission to contact the service nothing was sent."); return; }
  note("Asking the service…");
  try {
    const made = await KlinMailTm.create(fetch, ROOT);
    const r = KlinRegistry.make({ kind: "email", value: made.address, site, note: $("note").value || "disposable, mail.tm", provider: "mail.tm" });
    entries.push(r.entry); secrets[r.entry.id] = made; await save();
    for (const id of ["value", "site", "note"]) $(id).value = "";
    fill(); note("Created " + made.address + " and saved it in your list.");
  } catch (e) { note("Could not create an address: " + e.message); }
});

const showInbox = async (entry) => {
  $("inboxBox").classList.remove("hidden"); $("inboxOf").textContent = entry.value;
  $("messageText").classList.add("hidden"); $("messages").replaceChildren();
  $("inboxNote").textContent = "Asking the service…";
  if (!(await askService())) { $("inboxNote").textContent = "Without your permission to contact the service nothing was sent."; return; }
  try {
    const list = await KlinMailTm.inbox(fetch, secrets[entry.id], ROOT);
    $("inboxNote").textContent = list.length ? "" : "Nothing has arrived yet.";
    $("messages").replaceChildren(...list.map((m) => {
      const li = document.createElement("li");
      const b = document.createElement("button"); b.type = "button"; b.textContent = "Read";
      b.addEventListener("click", async () => {
        try { const full = await KlinMailTm.read(fetch, secrets[entry.id], m.id, ROOT); $("messageText").textContent = full.subject + "\n\n" + full.text; $("messageText").classList.remove("hidden"); }
        catch (e) { $("inboxNote").textContent = "Could not open the message: " + e.message; }
      });
      li.append(b, document.createTextNode(m.subject + " — " + m.from));
      return li;
    }));
  } catch (e) { $("inboxNote").textContent = "Could not open the inbox: " + e.message; }
};

browser.storage.local.get(["entries", "secrets"]).then((d) => { entries = d.entries || []; secrets = d.secrets || {}; fill(); });
