const $ = (id) => document.getElementById(id);
const steps = [...document.querySelectorAll(".step")];
let index = 0;
let sequence = [];

const path = () => document.querySelector('input[name="path"]:checked').value;
const hostOf = (site) => String(site || "").trim().toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").split(/[/?#]/)[0].replace(/[^a-z0-9.-]/g, "");

// The steps that apply to the chosen way, in order.
function build() {
  const p = path();
  sequence = steps.filter((s) => s.dataset.path === "both" || s.dataset.path === p).sort((a, b) => Number(a.dataset.step) - Number(b.dataset.step));
}

function show() {
  build();
  index = Math.min(index, sequence.length - 1);
  for (const s of steps) s.classList.toggle("hidden", s !== sequence[index]);
  $("progress").textContent = klin.t("g_step", "Step {1} of {2}", index + 1, sequence.length);
  $("back").classList.toggle("hidden", index === 0);
  $("next").classList.toggle("hidden", index === sequence.length - 1);
  if (sequence[index].dataset.step === "6") {          // coming from the "make an address" step: carry it over
    const made = $("madeAddress").textContent;
    if (made && !$("galias").value) $("galias").value = made;
    if (!$("gsite2").value && $("gsite").value) $("gsite2").value = hostOf($("gsite").value);
  }
}

async function start() {
  await klin.ready;
  $("next").addEventListener("click", () => { index++; show(); });
  $("back").addEventListener("click", () => { index--; show(); });
  for (const r of document.querySelectorAll('input[name="path"]')) r.addEventListener("change", show);

  // Own domain: the address for one site is "site@yourdomain". Pure text work, nothing is sent anywhere.
  $("make").addEventListener("submit", (event) => {
    event.preventDefault();
    const domain = $("domain").value.trim().toLowerCase().replace(/^@/, "");
    const site = hostOf($("gsite").value);
    const address = site && /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain) ? site + "@" + domain : "";
    $("makeError").classList.toggle("hidden", !!address);
    $("made").classList.toggle("hidden", !address);
    $("madeAddress").textContent = address;
    if (address) { $("galias").value = address; $("gsite2").value = site; }
  });

  $("save").addEventListener("submit", async (event) => {
    event.preventDefault();
    $("saveError").classList.add("hidden"); $("savedNote").classList.add("hidden");
    const r = KlinRegistry.make({ kind: "email", value: $("galias").value, site: $("gsite2").value });
    if (r.error) { $("saveError").textContent = r.error; $("saveError").classList.remove("hidden"); return; }
    const { entries = [] } = await browser.storage.local.get("entries");
    if (!entries.some((e) => e.value.toLowerCase() === r.entry.value.toLowerCase() && e.site.toLowerCase() === r.entry.site.toLowerCase())) {
      await browser.storage.local.set({ entries: [...entries, r.entry] });
    }
    $("savedNote").classList.remove("hidden");
    $("save").reset();
  });
  show();
}
start();
