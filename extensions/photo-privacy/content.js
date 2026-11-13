// Intercepts photos chosen with a site's upload button, before the site sees them.
// If a photo carries hidden data, the user decides; the site then receives the cleaned or the original file.
// Everything happens in this tab: files are read in memory, nothing is sent or stored.
"use strict";

(() => {
  const MAX_BYTES = 40 * 1024 * 1024;            // larger files are passed through unchecked
  const isCandidate = (f) => /^image\/(jpeg|png)$/.test(f.type) || /\.(jpe?g|png)$/i.test(f.name);
  const pending = new WeakMap();                  // input -> token of the selection being checked
  let redispatching = false;

  async function examine(files) {
    const items = [];
    for (const file of files) {
      const item = { file, info: null, bytes: null };
      if (isCandidate(file) && file.size <= MAX_BYTES) {
        try {
          // Copy into a buffer owned by this script: a view over the page's buffer cannot be sliced
          // (Firefox denies access to its `constructor`), which would break removal.
          const view = new Uint8Array(await file.arrayBuffer());
          item.bytes = new Uint8Array(view.length);
          item.bytes.set(view);
          item.info = KlinPhotoMetadata.inspect(item.bytes);
        } catch (e) { item.info = null; }
      }
      items.push(item);
    }
    return items;
  }

  function cleaned(item) {
    const bytes = KlinPhotoMetadata.strip(item.bytes, item.info);
    return new File([bytes], item.file.name, { type: item.file.type, lastModified: item.file.lastModified });
  }

  // ---- messages shown to the user (closed shadow root: the page cannot read or click them) ----------
  function ui() {
    const host = document.createElement("div");
    host.style.cssText = "all:initial;position:fixed;z-index:2147483647;inset:0;pointer-events:none";
    const root = host.attachShadow({ mode: "closed" });
    const style = document.createElement("style");
    style.textContent = `
      :host{all:initial}
      .box{pointer-events:auto;position:fixed;left:50%;top:16px;transform:translateX(-50%);width:min(460px,calc(100vw - 24px));
        font:15px/1.45 system-ui,sans-serif;color:#1c211e;background:#fff;border:1px solid #cfd5cd;border-radius:12px;padding:16px;
        box-shadow:0 8px 30px rgba(0,0,0,.25)}
      h2{all:unset;display:block;font-weight:700;font-size:16px;margin-bottom:6px}
      p{margin:6px 0}.muted{color:#5b655f;font-size:13px}
      ul{margin:6px 0;padding-left:20px}
      .row{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
      button{font:inherit;padding:7px 14px;border-radius:8px;border:1px solid #cfd5cd;background:#fff;color:inherit;cursor:pointer}
      button.primary{background:#2f7d5b;border-color:#2f7d5b;color:#fff;font-weight:600}
      button:focus-visible{outline:2px solid #2f7d5b;outline-offset:2px}
      @media (prefers-color-scheme:dark){.box{background:#1e2421;color:#e8ece9;border-color:#323a35}.muted{color:#a3ada7}
        button{background:#1e2421;border-color:#323a35}button.primary{background:#6fc29a;border-color:#6fc29a;color:#151917}}`;
    root.append(style);
    document.documentElement.append(host);
    return { host, root };
  }
  const el = (tag, props = {}, kids = []) => { const n = Object.assign(document.createElement(tag), props); n.append(...[].concat(kids)); return n; };

  function ask(items) {
    const withData = items.filter((i) => i.info && i.info.any);
    const kinds = [...new Set(withData.flatMap((i) => KlinPhotoMetadata.describe(i.info.found)))];
    const names = withData.map((i) => i.file.name);
    return new Promise((resolve) => {
      const { host, root } = ui();
      const done = (answer) => { host.remove(); resolve(answer); };
      const click = (answer) => (e) => { if (e.isTrusted) done(answer); };
      const remove = el("button", { className: "primary", type: "button", textContent: "Remove and continue" });
      const keep = el("button", { type: "button", textContent: "Keep as is" });
      const cancel = el("button", { type: "button", textContent: "Cancel upload" });
      remove.addEventListener("click", click("remove"));
      keep.addEventListener("click", click("keep"));
      cancel.addEventListener("click", click("cancel"));
      const box = el("div", { className: "box", role: "alertdialog", ariaLabel: "Photo privacy" }, [
        el("h2", { textContent: "This photo shares where it was taken" }),
        el("p", { textContent: (names.length > 2 ? `${names.length} photos contain` : `${names.join(", ")} contains`) + " hidden data the site can read:" }),
        el("ul", {}, kinds.map((k) => el("li", { textContent: k }))),
        el("div", { className: "row" }, [remove, keep, cancel]),
        el("p", { className: "muted", textContent: "Removing does not change the picture itself. Klin only checks files chosen with the upload button, not photos dragged in or pasted, and cannot tell what a site does with a photo you keep." }),
      ]);
      box.addEventListener("keydown", (e) => { if (e.isTrusted && e.key === "Escape") done("cancel"); });
      root.append(box);
      remove.focus();
    });
  }

  function notice(text) {
    const { host, root } = ui();
    const box = el("div", { className: "box", role: "status" }, [el("p", { textContent: text })]);
    root.append(box);
    setTimeout(() => host.remove(), 7000);
  }

  // ---- interception --------------------------------------------------------------------------------
  function deliver(input, files) {
    const transfer = new DataTransfer();
    for (const f of files) transfer.items.add(f);
    input.files = transfer.files;
    redispatching = true;
    try {
      input.dispatchEvent(new Event("input", { bubbles: true, composed: true }));
      input.dispatchEvent(new Event("change", { bubbles: true }));
    } finally { redispatching = false; }
  }

  async function handle(input) {
    const token = Symbol();
    pending.set(input, token);
    const original = [...input.files];
    try {
      const items = await examine(original);
      if (pending.get(input) !== token) return;
      const withData = items.filter((i) => i.info && i.info.any);
      let files = original;
      if (withData.length) {
        const location = withData.some((i) => i.info.found.location);
        const answer = location ? await ask(items) : "remove";
        if (pending.get(input) !== token) return;
        if (answer === "cancel") { pending.delete(input); input.value = ""; return; }
        if (answer === "remove") {
          files = items.map((i) => (i.info && i.info.any ? cleaned(i) : i.file));
          if (!location) {
            const kinds = [...new Set(withData.flatMap((i) => KlinPhotoMetadata.describe(i.info.found)))];
            notice(`Klin removed hidden details (${kinds.join(", ")}) from ${withData.length === 1 ? withData[0].file.name : withData.length + " photos"}.`);
          }
        }
      }
      pending.delete(input);
      deliver(input, files);
    } catch (e) {
      // Never leave the user's upload dead: say so, and let the original selection through.
      console.error("Klin Photo Privacy:", e);
      if (pending.get(input) === token) {
        pending.delete(input);
        notice("Klin could not check this photo, so it was sent as it is.");
        deliver(input, original);
      }
    }
  }

  function onSelect(event) {
    if (redispatching || !event.isTrusted) return;
    const input = event.target;
    if (!(input instanceof HTMLInputElement) || input.type !== "file" || !input.files || !input.files.length) return;
    if (![...input.files].some(isCandidate)) return;
    event.stopImmediatePropagation();             // the site hears about the selection only after the check
    if (event.type === "input" || !pending.has(input)) handle(input);
  }

  window.addEventListener("input", onSelect, true);
  window.addEventListener("change", onSelect, true);
})();
