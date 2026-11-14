const $ = (id) => document.getElementById(id);
const form = $("form"), own = $("own"), start = $("start"), stop = $("stop"), nameBox = $("username");
let controller = null;

const sync = () => { start.disabled = !own.checked || !nameBox.value.trim() || !!controller; };
own.addEventListener("change", sync);
nameBox.addEventListener("input", sync);

const say = (text) => { $("notice").textContent = text; $("notice").classList.toggle("hidden", !text); };
const link = (site, username) => {
  const li = document.createElement("li");
  const a = document.createElement("a");
  a.href = KlinCheck.fill(site.url, username, true);
  a.textContent = site.name;
  a.rel = "noreferrer noopener";
  li.append(a);
  return li;
};

window.klinSites = fetch("../data/sites.json").then((r) => r.json()).then((d) => d.sites);

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const username = nameBox.value.trim();
  if (!own.checked || !username || controller) return;
  say("");
  let granted = false;
  try { granted = await browser.permissions.request({ origins: ["<all_urls>"] }); } catch (e) { granted = false; }
  if (!granted) { say("Without permission to contact websites the check cannot run. Nothing was sent."); return; }

  const sites = await window.klinSites;
  controller = new AbortController();
  start.disabled = true; stop.classList.remove("hidden");
  $("found").replaceChildren(); $("unknown").replaceChildren();
  $("foundBox").classList.add("hidden"); $("unknownBox").classList.add("hidden");
  const bar = $("progress"); bar.classList.remove("hidden"); bar.max = sites.length; bar.value = 0;

  const tally = { found: 0, notfound: 0, unknown: 0, skipped: 0 };
  await KlinCheck.run(sites, username, {
    signal: controller.signal,
    onResult: (r, done, total) => {
      tally[r.state]++;
      bar.value = done;
      $("count").textContent = "Checked " + done + " of " + total + " sites…";
      if (r.state === "found") { $("found").append(link(r.site, username)); $("foundBox").classList.remove("hidden"); }
      if (r.state === "unknown") { $("unknown").append(link(r.site, username)); $("unknownBox").classList.remove("hidden"); }
    },
  });
  const stopped = controller.signal.aborted;
  controller = null;
  stop.classList.add("hidden"); bar.classList.add("hidden");
  $("count").textContent = (stopped ? "Stopped. " : "Done. ") + tally.found + " found, " + tally.notfound + " not found, " +
    tally.unknown + " unclear, " + tally.skipped + " skipped (the name cannot exist there).";
  sync();
});

stop.addEventListener("click", () => { if (controller) controller.abort(); });

// If the alias registry is installed, offer the usernames kept there (the user's own: choosing one ticks the box).
browser.runtime.sendMessage("alias-registry@klin", { type: "usernames" }).then((reply) => {
  const names = reply && reply.usernames;
  if (!names || !names.length) return;
  $("aliasPick").append(...names.map((n) => Object.assign(document.createElement("option"), { value: n, textContent: n })));
  $("fromAliases").classList.remove("hidden");
}).catch(() => {});
$("aliasPick").addEventListener("change", () => {
  if (!$("aliasPick").value) return;
  nameBox.value = $("aliasPick").value; own.checked = true; sync();
});
