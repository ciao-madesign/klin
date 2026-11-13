// Storage benchmark: IndexedDB vs SQLite (sql.js, WASM) on a 100k-row "history" table. Test only.
const N = 100000, now = Date.now();
const rows = Array.from({ length: N }, (_, i) => ({ id: i + 1, url: `https://site${i % 2000}.example/page${i}`, domain: `site${i % 2000}.example`, title: "Title " + i + " lorem ipsum", ts: now - i * 60000, visits: i % 7 }));
const R = { rows: N, idb: {}, sqlite: {} };
const t = async (o, name, fn) => { const s = performance.now(); const v = await fn(); o[name] = { ms: Math.round(performance.now() - s), ...(v !== undefined ? { result: v } : {}) }; };
const req = (r) => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
const done = (tx) => new Promise((res, rej) => { tx.oncomplete = res; tx.onerror = () => rej(tx.error); });

async function encrypt(bytes) {   // what the encrypted export archive would do
  const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt: new Uint8Array(16), iterations: 200000, hash: "SHA-256" },
    await crypto.subtle.importKey("raw", new TextEncoder().encode("pw"), "PBKDF2", false, ["deriveKey"]), { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
  return new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: new Uint8Array(12) }, key, bytes));
}

async function benchIDB() {
  const o = R.idb; indexedDB.deleteDatabase("bench");
  const db = await new Promise((res, rej) => { const q = indexedDB.open("bench", 1);
    q.onupgradeneeded = () => { const s = q.result.createObjectStore("h", { keyPath: "id" }); s.createIndex("domain", "domain"); s.createIndex("ts", "ts"); };
    q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
  await t(o, "insert 100k", async () => { for (let i = 0; i < N; i += 5000) { const tx = db.transaction("h", "readwrite"); rows.slice(i, i + 5000).forEach((r) => tx.objectStore("h").put(r)); await done(tx); } });
  await t(o, "100 lookups by domain", async () => { let c = 0; for (let i = 0; i < 100; i++) c += await req(db.transaction("h").objectStore("h").index("domain").count(`site${i}.example`)); return c; });
  await t(o, "latest 50 (by date)", async () => new Promise((res) => { const out = []; db.transaction("h").objectStore("h").index("ts").openCursor(null, "next").onsuccess = (e) => { const c = e.target.result; if (c && out.length < 50) { out.push(c.value.id); c.continue(); } else res(out.length); }; }));
  await t(o, "text search in titles (full scan)", async () => new Promise((res) => { let n = 0; db.transaction("h").objectStore("h").openCursor().onsuccess = (e) => { const c = e.target.result; if (c) { if (c.value.title.includes("Title 5000 ")) n++; c.continue(); } else res(n); }; }));
  let all; await t(o, "export all to JSON", async () => { all = new TextEncoder().encode(JSON.stringify(await req(db.transaction("h").objectStore("h").getAll()))); return Math.round(all.length / 1e6 * 10) / 10 + " MB"; });
  await t(o, "encrypt export (AES-GCM)", async () => (await encrypt(all)).length > 0);
  db.close();
}

async function benchSQLite() {
  const o = R.sqlite; let SQL;
  await t(o, "load SQLite (WASM)", async () => { SQL = await initSqlJs({ locateFile: (f) => f }); });
  const db = new SQL.Database();
  db.run("CREATE TABLE h (id INTEGER PRIMARY KEY, url TEXT, domain TEXT, title TEXT, ts INTEGER, visits INTEGER); CREATE INDEX i_d ON h(domain); CREATE INDEX i_t ON h(ts);");
  await t(o, "insert 100k", async () => { db.run("BEGIN"); const st = db.prepare("INSERT INTO h VALUES (?,?,?,?,?,?)"); for (const r of rows) st.run([r.id, r.url, r.domain, r.title, r.ts, r.visits]); st.free(); db.run("COMMIT"); });
  await t(o, "100 lookups by domain", async () => { let c = 0; const st = db.prepare("SELECT COUNT(*) FROM h WHERE domain=?"); for (let i = 0; i < 100; i++) { st.bind([`site${i}.example`]); st.step(); c += st.get()[0]; st.reset(); } st.free(); return c; });
  await t(o, "latest 50 (by date)", async () => db.exec("SELECT id FROM h ORDER BY ts DESC LIMIT 50")[0].values.length);
  await t(o, "text search in titles (full scan)", async () => db.exec("SELECT COUNT(*) FROM h WHERE title LIKE '%Title 5000 %'")[0].values[0][0]);
  let bytes; await t(o, "export whole DB file", async () => { bytes = db.export(); return Math.round(bytes.length / 1e6 * 10) / 10 + " MB"; });
  await t(o, "encrypt export (AES-GCM)", async () => (await encrypt(bytes)).length > 0);
  await t(o, "save DB file into IndexedDB (needed to persist)", async () => { const d = await new Promise((res) => { const q = indexedDB.open("sqlfile", 1); q.onupgradeneeded = () => q.result.createObjectStore("f"); q.onsuccess = () => res(q.result); }); const tx = d.transaction("f", "readwrite"); tx.objectStore("f").put(bytes, "db"); await done(tx); d.close(); });
  await t(o, "reopen DB from saved file", async () => { const d = await new Promise((res) => { const q = indexedDB.open("sqlfile", 1); q.onsuccess = () => res(q.result); }); const b = await req(d.transaction("f").objectStore("f").get("db")); const db2 = new SQL.Database(b); const n = db2.exec("SELECT COUNT(*) FROM h")[0].values[0][0]; db2.close(); d.close(); return n; });
}

const post = (o) => fetch("http://report.test/report", { method: "POST", mode: "no-cors", headers: { "Content-Type": "text/plain" }, body: JSON.stringify(o) });
setTimeout(async () => {
  await post({ progress: "started", initSqlJs: typeof initSqlJs });
  try { await benchIDB(); } catch (e) { R.idb.error = String(e); }
  await post({ progress: "idb done", idb: R.idb });
  try { await benchSQLite(); } catch (e) { R.sqlite.error = String(e); }
  await post(R);
}, 8000);
