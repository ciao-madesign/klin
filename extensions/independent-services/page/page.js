const $ = (id) => document.getElementById(id);
const S = KlinServices;
let services = [];
let favourites = [];
let months = 12;
let catalogues = [];     // what was imported: name, maintainer, version, date, licence, address, on/off
let previous = {};       // catalogue id -> the version before the last update (one step back)
let pending = null;      // a catalogue that was read and is waiting for the user's "Import"
const C = KlinCatalogue;

const save = () => browser.storage.local.set({ services, favourites, months, catalogues, previous });
const activeIds = () => new Set(catalogues.filter((c) => c.active).map((c) => c.id));
const visible = () => { const on = activeIds(); return services.filter((s) => !s.catalogue || on.has(s.catalogue)); };
const t = (key, text, ...args) => klin.t(key, text, ...args);

function card(s) {
  const li = document.createElement("li");
  li.className = "card" + (favourites.includes(s.id) ? " fav" : "");
  const h = document.createElement("h3"); h.textContent = s.name;
  const host = document.createElement("div"); host.className = "host"; host.textContent = S.hostOf(s.url);
  li.append(h, host);
  if (s.description) { const p = document.createElement("p"); p.textContent = s.description; li.append(p); }
  const meta = document.createElement("div"); meta.className = "meta";
  const bits = [t("cat_" + s.category, s.category), t("model_" + s.model, s.model), s.software, s.protocol, s.operator, s.country,
    t("costs_" + s.costs, s.costs), t("reg_" + s.registration, s.registration)].filter(Boolean);
  for (const b of bits) { const span = document.createElement("span"); span.textContent = b; meta.append(span); }
  const age = S.age(s, months);
  const when = document.createElement("span");
  if (age === "unchecked") { when.textContent = t("kis_unchecked", "never checked"); when.className = "old"; }
  else if (age === "old") { when.textContent = t("kis_old", "checked more than {1} months ago", months) + " (" + s.checked + ")"; when.className = "old"; }
  else when.textContent = t("kis_checked", "checked {1}", s.checked);
  meta.append(when);
  if (s.source) { const span = document.createElement("span"); span.textContent = t("kis_source", "Source: {1}", s.source); meta.append(span); }
  const cat = s.catalogue && catalogues.find((c) => c.id === s.catalogue);
  if (cat) { const span = document.createElement("span"); span.textContent = t("kis_c_from", "From catalogue: {1}", cat.name); meta.append(span); }
  li.append(meta);

  const actions = document.createElement("div"); actions.className = "actions";
  // A plain link: a new tab, no Klin proxy, no referrer.
  const open = document.createElement("a");
  open.className = "open"; open.href = s.url; open.target = "_blank"; open.rel = "noopener noreferrer";
  open.textContent = t("kis_open", "Open in a new tab"); open.setAttribute("aria-label", t("kis_open_aria", "Open {1} in a new tab", s.name));
  const isFav = favourites.includes(s.id);
  const fav = document.createElement("button"); fav.type = "button";
  fav.textContent = isFav ? t("kis_unfav", "Remove favourite") : t("kis_fav", "Favourite");
  fav.setAttribute("aria-label", isFav ? t("kis_unfav_aria", "Remove {1} from favourites", s.name) : t("kis_fav_aria", "Add {1} to favourites", s.name));
  fav.setAttribute("aria-pressed", String(isFav));
  fav.addEventListener("click", async () => { favourites = isFav ? favourites.filter((x) => x !== s.id) : [...favourites, s.id]; await save(); render(); });
  const del = document.createElement("button"); del.type = "button";
  del.textContent = t("kis_delete", "Delete"); del.setAttribute("aria-label", t("kis_delete_aria", "Delete {1} from your list", s.name));
  del.addEventListener("click", async () => { services = services.filter((x) => x.id !== s.id); favourites = favourites.filter((x) => x !== s.id); await save(); render(); });
  actions.append(open, fav, del);
  li.append(actions);
  return li;
}

function render() {
  const all = visible();
  const shown = S.order(S.filter(all, { text: $("q").value, category: $("cat").value, model: $("mod").value, favouritesOnly: $("favonly").checked }, favourites), favourites);
  $("cards").replaceChildren(...shown.map(card));
  $("count").textContent = t("kis_count", "{1} of {2} services", shown.length, all.length);
  $("empty").classList.toggle("hidden", all.length > 0);
  if (all.length > 0 && shown.length === 0) { $("cards").replaceChildren(Object.assign(document.createElement("li"), { textContent: t("kis_nomatch", "No service matches.") })); }
}


// ---- catalogues -----------------------------------------------------------------------------------------------

const say = (id, text) => { const el = $(id); el.textContent = text || ""; el.classList.toggle("hidden", !text); };

function errorText(e) {
  if (!(e instanceof C.CatalogueError)) return t("kis_ce_net", "It could not be downloaded: {1}. Nothing was imported.", String(e && e.message || e));
  const d = e.detail;
  switch (e.code) {
    case "size": return t("kis_ce_size", "The file is bigger than 1 MB. Nothing was imported.");
    case "json": return t("kis_ce_json", "This is not a JSON file. Nothing was imported.");
    case "format": return t("kis_ce_format", "This is not a Klin catalogue (format 1). Nothing was imported.");
    case "field": return t("kis_ce_field", "The field “{1}” is missing or not valid. Nothing was imported.", d);
    case "many": return t("kis_ce_many", "There are more than {1} services. Nothing was imported.", C.MAX_SERVICES);
    case "empty": return t("kis_ce_empty", "The catalogue has no services. Nothing was imported.");
    case "service": return t("kis_ce_service", "Service number {1} is not valid ({2}). Nothing was imported.", d.index, t("kis_cp_" + (["name", "url", "date"].includes(d.problem) ? d.problem : "name"), d.problem));
    case "https": return t("kis_ce_https", "Only https:// addresses can be downloaded.");
    case "net": return t("kis_ce_net", "It could not be downloaded: {1}. Nothing was imported.", d);
    default: return t("kis_ce_json", "This is not a JSON file. Nothing was imported.");
  }
}

function showPreview(text, source) {
  say("catError", ""); say("catDone", "");
  let parsed;
  try { parsed = C.parse(text); } catch (e) { pending = null; $("preview").classList.add("hidden"); say("catError", errorText(e)); return; }
  const plan = C.plan(services, parsed);
  pending = { parsed, source: source || parsed.meta.source };
  $("pvName").textContent = t("kis_c_prev_from", "{1}, by {2}", parsed.meta.name, parsed.meta.maintainer);
  $("pvMeta").textContent = t("kis_c_prev_meta", "Version {1}, published {2}, licence {3}", parsed.meta.version, parsed.meta.published, parsed.meta.license);
  say("pvSrc", pending.source ? t("kis_c_prev_src", "Address: {1}", pending.source) : "");
  $("pvProfile").classList.toggle("hidden", parsed.meta.kind !== "profile");
  $("pvSum").textContent = t("kis_c_prev_sum", "{1} new, {2} changed, {3} removed, {4} unchanged, {5} skipped because the address is already in your list from somewhere else.", plan.added.length, plan.changed.length, plan.removed.length, plan.same.length, plan.skipped.length);
  say("pvIgnored", parsed.ignored.length ? t("kis_c_prev_ignored", "Ignored, never applied: {1}", parsed.ignored.join(", ")) : "");
  $("pvDomains").replaceChildren(...C.domains(services, parsed).map((d) => {
    const tr = document.createElement("tr");
    const notes = [];
    if (d.lookalike) notes.push(t("kis_c_look", "looks like {1}", d.lookalike.known));
    if (d.encoded) notes.push(t("kis_c_enc", "written in other alphabets: {1}", d.shown));
    const cells = [d.host, String(d.count), notes.join("; ")];
    cells.forEach((c, i) => { const td = document.createElement("td"); td.textContent = c; if (i === 2 && c) td.className = "flag"; tr.append(td); });
    return tr;
  }));
  $("preview").classList.remove("hidden");
  $("preview").scrollIntoView({ block: "nearest" });
}

// "Download and preview": the permission is asked for this one server, straight from the click, and given back afterwards.
async function go() {
  say("catError", ""); say("catDone", "");
  let url;
  try { url = C.downloadUrl($("catAddr").value); } catch (e) { say("catError", errorText(e)); return; }
  const origins = ["https://" + url.hostname + "/*"];   // match patterns have no port
  let granted = false;
  try { granted = await browser.permissions.request({ origins }); } catch (e) { granted = false; }
  if (!granted) { say("catError", t("kis_ce_perm", "Permission to contact that server was not given. Nothing was downloaded.")); return; }
  try {
    const text = await C.download(fetch, url.href);
    showPreview(text, url.href);
  } catch (e) { pending = null; $("preview").classList.add("hidden"); say("catError", errorText(e)); }
  finally { try { await browser.permissions.remove({ origins }); } catch (e) { /* nothing to give back */ } }
}

async function openFile(file) {
  say("catError", ""); say("catDone", "");
  if (!file) return;
  if (file.size > C.MAX_BYTES) { pending = null; $("preview").classList.add("hidden"); say("catError", errorText(new C.CatalogueError("size"))); return; }
  showPreview(await file.text(), "");
}

async function doImport() {
  if (!pending) return;
  const { parsed, source } = pending;
  const id = parsed.meta.id;
  const old = catalogues.find((c) => c.id === id);
  if (old) previous[id] = { record: old, services: services.filter((s) => s.catalogue === id) };
  const next = C.apply(services, parsed);
  const record = C.record(parsed, source);
  if (old) record.active = old.active;
  catalogues = [...catalogues.filter((c) => c.id !== id), record];
  const kept = new Set(next.map((s) => s.id));
  services = next; favourites = favourites.filter((f) => kept.has(f));
  await save();
  pending = null; $("preview").classList.add("hidden");
  say("catDone", t("kis_c_done", "Imported {1} services from {2}.", parsed.services.length, parsed.meta.name));
  renderCatalogues(); render();
}

function renderCatalogues() {
  $("instNone").classList.toggle("hidden", catalogues.length > 0);
  $("installed").replaceChildren(...catalogues.map((c) => {
    const li = document.createElement("li"); li.className = "card";
    const h = document.createElement("h3"); h.textContent = c.name;
    const meta = document.createElement("div"); meta.className = "meta";
    for (const text of [t("kis_c_prev_from", "{1}, by {2}", c.name, c.maintainer), t("kis_c_prev_meta", "Version {1}, published {2}, licence {3}", c.version, c.published, c.license), t("kis_c_inst_line", "{1} services, imported {2}", c.count, c.importedAt), c.source ? t("kis_c_prev_src", "Address: {1}", c.source) : ""].filter(Boolean)) {
      const span = document.createElement("span"); span.textContent = text; meta.append(span);
    }
    const actions = document.createElement("div"); actions.className = "actions";
    const label = document.createElement("label"); label.className = "own";
    const box = document.createElement("input"); box.type = "checkbox"; box.checked = c.active;
    box.addEventListener("change", async () => { c.active = box.checked; await save(); render(); });
    label.append(box, document.createTextNode(" " + t("kis_c_on", "Show its services")));
    actions.append(label);
    const button = (key, text, fn) => { const b = document.createElement("button"); b.type = "button"; b.textContent = t(key, text); b.addEventListener("click", fn); actions.append(b); };
    if (c.source) button("kis_c_update", "Update from its address", () => { $("catAddr").value = c.source; go(); });
    if (previous[c.id]) button("kis_c_restore", "Go back to the previous version", async () => {
      const back = previous[c.id];
      previous[c.id] = { record: c, services: services.filter((s) => s.catalogue === c.id) };
      services = [...services.filter((s) => s.catalogue !== c.id), ...back.services];
      catalogues = catalogues.map((x) => (x.id === c.id ? { ...back.record, active: c.active } : x));
      await save(); renderCatalogues(); render();
    });
    button("kis_c_remove", "Remove with its services", async () => {
      services = services.filter((s) => s.catalogue !== c.id); catalogues = catalogues.filter((x) => x.id !== c.id); delete previous[c.id];
      const kept = new Set(services.map((s) => s.id)); favourites = favourites.filter((f) => kept.has(f));
      await save(); renderCatalogues(); render();
    });
    li.append(h, meta, actions);
    return li;
  }));
}

async function renderPublic() {
  let list = [];
  try { list = (await (await fetch(browser.runtime.getURL("data/catalogues.json"))).json()).catalogues || []; } catch (e) { list = []; }
  $("publicNone").classList.toggle("hidden", list.length > 0);
  $("publicList").replaceChildren(...list.map((c) => {
    const li = document.createElement("li"); li.className = "card";
    const h = document.createElement("h3"); h.textContent = c.name;
    const meta = document.createElement("div"); meta.className = "meta"; meta.textContent = t("kis_c_pub_by", "by {1}, licence {2}", c.maintainer, c.license) + " · " + c.address;
    const b = document.createElement("button"); b.type = "button"; b.textContent = t("kis_c_pub_use", "Use this address");
    b.addEventListener("click", () => { $("catAddr").value = c.address; });
    li.append(h, meta, b);
    return li;
  }));
}

async function start() {
  await klin.ready;
  const stored = await browser.storage.local.get(["services", "favourites", "months", "catalogues", "previous"]);
  services = stored.services || []; favourites = stored.favourites || []; months = stored.months || 12;
  catalogues = stored.catalogues || []; previous = stored.previous || {};
  $("months").value = months;
  for (const id of ["q", "cat", "mod", "favonly"]) $(id).addEventListener("input", render);
  $("months").addEventListener("change", async () => { const n = Math.round(Number($("months").value)); months = n >= 1 && n <= 120 ? n : 12; $("months").value = months; await save(); render(); });
  $("form").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("error").classList.add("hidden"); $("saved").classList.add("hidden");
    const input = {};
    for (const f of S.FIELDS) { const el = $("f_" + f); if (el) input[f] = el.value; }
    try { services = S.add(services, input); }
    catch (e) {
      const messages = { name: ["kis_err_name", "Write a name."], url: ["kis_err_url", "The address must start with http:// or https:// and have no user name or password."], date: ["kis_err_date", "Write the date as YYYY-MM-DD, or leave it empty."], duplicate: ["kis_err_dup", "This address is already in your list."] };
      const [key, text] = messages[e.code] || ["kis_err_url", ""];
      $("error").textContent = t(key, text); $("error").classList.remove("hidden"); return;
    }
    await save(); $("form").reset(); $("saved").classList.remove("hidden"); render();
  });
  $("catGo").addEventListener("click", go);
  $("catFile").addEventListener("change", (e) => openFile(e.target.files[0]));
  $("catImport").addEventListener("click", doImport);
  $("catCancel").addEventListener("click", () => { pending = null; $("preview").classList.add("hidden"); });
  renderPublic(); renderCatalogues(); render();
}
start();
