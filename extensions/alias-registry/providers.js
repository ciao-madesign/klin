// Disposable-address provider: mail.tm (free, no sign-up by a person: the address and its inbox password are made
// by this code through the service's public API). Plain functions; fetch is passed in so it can be tested.
// NOTE: written from the service's published API; not yet verified against the live service (see README).
const KlinMailTm = (() => {
  const base = "https://api.mail.tm";

  const random = (alphabet, n) => {
    const bytes = crypto.getRandomValues(new Uint8Array(n));
    return Array.from(bytes, (b) => alphabet[b % alphabet.length]).join("");
  };

  const call = async (doFetch, path, { method = "GET", body, token, root = base } = {}) => {
    const headers = { Accept: "application/json" };
    if (body) headers["Content-Type"] = "application/json";
    if (token) headers.Authorization = "Bearer " + token;
    const r = await doFetch(root + path, {
      method, headers, body: body ? JSON.stringify(body) : undefined,
      credentials: "omit", referrerPolicy: "no-referrer", cache: "no-store",
    });
    if (!r.ok) throw new Error("The service answered " + r.status + ".");
    return r.status === 204 ? null : r.json();
  };

  // Makes a fresh address with a random name and password. Returns { address, password, accountId }.
  const create = async (doFetch, root) => {
    const domains = await call(doFetch, "/domains", { root });
    const domain = (domains["hydra:member"] || domains.member || []).find((d) => d.isActive !== false);
    if (!domain) throw new Error("The service offers no address domain right now.");
    const address = random("abcdefghijklmnopqrstuvwxyz0123456789", 12) + "@" + domain.domain;
    const password = random("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789", 20);
    const account = await call(doFetch, "/accounts", { method: "POST", body: { address, password }, root });
    return { address, password, accountId: account.id };
  };

  const login = async (doFetch, cred, root) => (await call(doFetch, "/token", { method: "POST", body: { address: cred.address, password: cred.password }, root })).token;

  // Messages in the inbox: [{ id, from, subject, intro, createdAt }]
  const inbox = async (doFetch, cred, root) => {
    const token = await login(doFetch, cred, root);
    const list = await call(doFetch, "/messages", { token, root });
    return (list["hydra:member"] || list.member || []).map((m) => ({
      id: m.id, from: (m.from && (m.from.address || m.from.name)) || "", subject: m.subject || "", intro: m.intro || "", createdAt: m.createdAt || "",
    }));
  };

  // Text of one message, as plain text only (HTML is never shown, so no remote images or scripts can load).
  const read = async (doFetch, cred, id, root) => {
    const token = await login(doFetch, cred, root);
    const m = await call(doFetch, "/messages/" + encodeURIComponent(id), { token, root });
    return { subject: m.subject || "", text: m.text || m.intro || "" };
  };

  // Deletes the address on the service (best effort).
  const remove = async (doFetch, cred, root) => {
    const token = await login(doFetch, cred, root);
    await call(doFetch, "/accounts/" + encodeURIComponent(cred.accountId), { method: "DELETE", token, root });
  };

  return { base, create, inbox, read, remove };
})();

if (typeof module !== "undefined") module.exports = KlinMailTm;
else globalThis.KlinMailTm = KlinMailTm;
