const $ = (id) => document.getElementById(id);
const S = KlinServices;
let services = [];
let favourites = [];
let months = 12;

const save = () => browser.storage.local.set({ services, favourites, months });
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
  const shown = S.order(S.filter(services, { text: $("q").value, category: $("cat").value, model: $("mod").value, favouritesOnly: $("favonly").checked }, favourites), favourites);
  $("cards").replaceChildren(...shown.map(card));
  $("count").textContent = t("kis_count", "{1} of {2} services", shown.length, services.length);
  $("empty").classList.toggle("hidden", services.length > 0);
  if (services.length > 0 && shown.length === 0) { $("cards").replaceChildren(Object.assign(document.createElement("li"), { textContent: t("kis_nomatch", "No service matches.") })); }
}

async function start() {
  await klin.ready;
  const stored = await browser.storage.local.get(["services", "favourites", "months"]);
  services = stored.services || []; favourites = stored.favourites || []; months = stored.months || 12;
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
  render();
}
start();
