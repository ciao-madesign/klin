// Username check logic. Plain functions, no browser APIs except fetch (passed in), so it can be tested in Node.
// Site entries come from data/sites.json (converted from Sherlock's list by build/gen-sherlock-sites.py).
const KlinCheck = (() => {
  const fill = (value, username, encode) => {
    if (typeof value === "string") return value.split("{}").join(encode ? encodeURIComponent(username) : username);
    if (Array.isArray(value)) return value.map((v) => fill(v, username, false));
    if (value && typeof value === "object") return Object.fromEntries(Object.entries(value).map(([k, v]) => [k, fill(v, username, false)]));
    return value;
  };

  // false when the site's own rules say this name cannot exist there (no request is then needed)
  const nameFits = (site, username) => {
    if (!site.regex) return true;
    try { return new RegExp(site.regex).test(username); } catch (e) { return true; }
  };

  // Sherlock's choice: sites judged by status code are asked with HEAD (no page is downloaded) unless stated otherwise.
  const requestFor = (site, username) => {
    const method = site.method || (site.type === "status_code" ? "HEAD" : "GET");
    const init = {
      method,
      credentials: "omit",            // never send the user's own cookies: the check must not log in or leave a session trail
      referrerPolicy: "no-referrer",
      cache: "no-store",
      redirect: site.type === "response_url" ? "manual" : "follow",
      headers: Object.assign({}, site.headers),
    };
    if (site.payload) {
      init.body = JSON.stringify(fill(site.payload, username, false));
      init.headers["content-type"] = "application/json";
    }
    return { url: fill(site.probe || site.url, username, true), init };
  };

  const codes = (site) => [].concat(site.code === undefined ? [] : site.code);

  // res: { status, redirectedAway (opaque redirect), text (only for type "message") }
  // returns "found" | "notfound" | "unknown" (the site did not give a usable answer: blocked, rate limited, error)
  const classify = (site, res) => {
    if (res.redirectedAway) return site.type === "response_url" ? "notfound" : "unknown";
    const s = res.status;
    if (s === 429 || s >= 500) return "unknown";
    if (site.type === "status_code") {
      if (site.code !== undefined) return codes(site).includes(s) ? "notfound" : (s >= 200 && s < 300 ? "found" : "unknown");
      return s >= 200 && s < 300 ? "found" : (s === 404 || s === 410 ? "notfound" : "unknown");
    }
    if (site.type === "response_url") return s >= 200 && s < 300 ? "found" : "notfound";
    if (site.type === "message") {
      const text = res.text || "";
      if ([].concat(site.msg || []).some((m) => text.includes(m))) return "notfound";
      return s >= 200 && s < 300 ? "found" : "unknown";
    }
    return "unknown";
  };

  const checkOne = async (site, username, doFetch, timeout) => {
    if (!nameFits(site, username)) return { site, state: "skipped" };
    const { url, init } = requestFor(site, username);
    const ctl = new AbortController();
    const timer = setTimeout(() => ctl.abort(), timeout);
    try {
      const r = await doFetch(url, Object.assign(init, { signal: ctl.signal }));
      const res = { status: r.status, redirectedAway: r.type === "opaqueredirect" };
      if (site.type === "message" && !res.redirectedAway) res.text = await r.text();
      return { site, state: classify(site, res), status: r.status };
    } catch (e) {
      return { site, state: "unknown", error: String((e && e.name) || e) };
    } finally {
      clearTimeout(timer);
    }
  };

  // Runs the checks a few at a time (gentle on the network and on the machine).
  // opts: { fetch, concurrency, timeout, onResult(result, done, total), signal }
  const run = async (sites, username, opts = {}) => {
    const doFetch = opts.fetch || ((u, i) => fetch(u, i));
    const concurrency = opts.concurrency || 6;
    const timeout = opts.timeout || 15000;
    const results = [];
    let next = 0, done = 0;
    const worker = async () => {
      while (next < sites.length && !(opts.signal && opts.signal.aborted)) {
        const site = sites[next++];
        const result = await checkOne(site, username, doFetch, timeout);
        results.push(result);
        done++;
        if (opts.onResult) opts.onResult(result, done, sites.length);
      }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, sites.length) }, worker));
    return results;
  };

  return { fill, nameFits, requestFor, classify, checkOne, run };
})();

if (typeof module !== "undefined") module.exports = KlinCheck;
else globalThis.KlinCheck = KlinCheck;
