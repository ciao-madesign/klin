// Advanced level: the pages you visit see UTC as the time zone. Runs inside each page (world MAIN) before the
// page's own scripts. This is an approximation of what Firefox's own "fixed time zone" protection does; a page that
// looks hard can notice it, and workers are not covered (see README and ADR 0007).
(() => {
  "use strict";
  const D = Date, P = D.prototype;
  const define = (obj, name, value) => Object.defineProperty(obj, name, { value, writable: true, configurable: true, enumerable: false });

  // make replaced functions print as native code, like the originals
  const nativeText = new WeakMap();
  const nativeLike = (fn, name) => { nativeText.set(fn, "function " + name + "() {\n    [native code]\n}"); return fn; };
  const fts = Function.prototype.toString;
  define(Function.prototype, "toString", nativeLike(new Proxy(fts, { apply: (t, self, args) => nativeText.has(self) ? nativeText.get(self) : Reflect.apply(t, self, args) }), "toString"));

  const U = {};
  for (const n of ["FullYear", "Month", "Date", "Day", "Hours", "Minutes", "Seconds", "Milliseconds"]) U[n] = P["getUTC" + n];
  const getTime = P.getTime;

  // local getters and setters become the UTC ones
  for (const n of ["FullYear", "Month", "Date", "Day", "Hours", "Minutes", "Seconds", "Milliseconds"]) {
    define(P, "get" + n, nativeLike({ ["get" + n]() { return U[n].call(this); } }["get" + n], "get" + n));
  }
  for (const n of ["FullYear", "Month", "Date", "Hours", "Minutes", "Seconds", "Milliseconds"]) {
    const set = P["setUTC" + n];
    define(P, "set" + n, nativeLike({ ["set" + n](...a) { return Reflect.apply(set, this, a); } }["set" + n], "set" + n));
  }
  define(P, "getYear", nativeLike(function getYear() { return U.FullYear.call(this) - 1900; }, "getYear"));
  define(P, "getTimezoneOffset", nativeLike(function getTimezoneOffset() { return Number.isNaN(getTime.call(this)) ? NaN : 0; }, "getTimezoneOffset"));

  const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const pad = (n, l = 2) => String(n).padStart(l, "0");
  const dateText = (d) => DAYS[U.Day.call(d)] + " " + MONTHS[U.Month.call(d)] + " " + pad(U.Date.call(d)) + " " + pad(U.FullYear.call(d), 4);
  const timeText = (d) => pad(U.Hours.call(d)) + ":" + pad(U.Minutes.call(d)) + ":" + pad(U.Seconds.call(d)) + " GMT+0000 (Coordinated Universal Time)";
  const valid = (d) => !Number.isNaN(getTime.call(d));
  define(P, "toString", nativeLike(function toString() { return valid(this) ? dateText(this) + " " + timeText(this) : "Invalid Date"; }, "toString"));
  define(P, "toDateString", nativeLike(function toDateString() { return valid(this) ? dateText(this) : "Invalid Date"; }, "toDateString"));
  define(P, "toTimeString", nativeLike(function toTimeString() { return valid(this) ? timeText(this) : "Invalid Date"; }, "toTimeString"));

  const withUTC = (o) => (o === null || typeof o !== "object") && o !== undefined ? o : (o && o.timeZone !== undefined ? o : Object.assign({}, o, { timeZone: "UTC" }));
  for (const n of ["toLocaleString", "toLocaleDateString", "toLocaleTimeString"]) {
    const orig = P[n];
    define(P, n, nativeLike({ [n](locales, options) { return Reflect.apply(orig, this, [locales, withUTC(options)]); } }[n], n));
  }

  // dates written without a zone are read as UTC, not as the real local time
  const hasZone = /(?:Z|[+-]\d{2}:?\d{2}|GMT|UTC|UT)\s*(?:\(.*\))?$/i;
  const fixText = (s) => {
    if (typeof s !== "string") return s;
    const t = s.trim();
    if (hasZone.test(t) || /^\d{4}-\d{2}-\d{2}$/.test(t)) return s;
    return /^\d{4}-\d{2}-\d{2}T/.test(t) ? t + "Z" : t + " UTC";
  };
  const FakeDate = new Proxy(D, {
    construct(t, args, nt) {
      if (args.length >= 2) return Reflect.construct(t, [D.UTC(...args)], nt);
      if (args.length === 1) return Reflect.construct(t, [fixText(args[0])], nt);
      return Reflect.construct(t, [], nt);
    },
    apply() { return P.toString.call(new D()); },
    get(t, key, recv) { return key === "parse" ? nativeLike(function parse(s) { return D.parse(fixText(String(s))); }, "parse") : Reflect.get(t, key, recv); },
  });
  define(P, "constructor", FakeDate);
  define(window, "Date", FakeDate);

  const IDF = Intl.DateTimeFormat;
  const fixOpts = (o) => (o === undefined ? { timeZone: "UTC" } : (o && typeof o === "object" && o.timeZone === undefined ? Object.assign({}, o, { timeZone: "UTC" }) : o));
  const FakeIDF = new Proxy(IDF, {
    construct: (t, [l, o], nt) => Reflect.construct(t, [l, fixOpts(o)], nt),
    apply: (t, self, [l, o]) => Reflect.apply(t, self, [l, fixOpts(o)]),
  });
  define(IDF.prototype, "constructor", FakeIDF);
  define(Intl, "DateTimeFormat", FakeIDF);
  if (typeof Temporal !== "undefined" && Temporal.Now) define(Temporal.Now, "timeZoneId", nativeLike(function timeZoneId() { return "UTC"; }, "timeZoneId"));
})();
