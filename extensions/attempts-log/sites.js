// Site names: pure functions, no browser APIs (also loaded by the unit test).
"use strict";

// Second-level labels that act as a public suffix under two-letter country domains (co.uk, com.br...).
// An approximation: extensions cannot read the browser's public suffix list.
const SECOND_LEVEL = new Set(["co", "com", "org", "net", "gov", "ac", "edu", "or", "ne", "go"]);

// "www.Shop.Example.co.uk" -> "example.co.uk"; null if not a normal site name (IP address, localhost).
function siteName(hostname) {
  const host = String(hostname || "").toLowerCase().replace(/\.$/, "");
  if (!host.includes(".") || /^[\d.]+$/.test(host) || host.includes(":")) return null;
  const labels = host.split(".");
  const tld = labels[labels.length - 1];
  const take = labels.length >= 3 && tld.length === 2 && SECOND_LEVEL.has(labels[labels.length - 2]) ? 3 : 2;
  return labels.slice(-take).join(".");
}

function hostOf(url) {
  try { return new URL(url).hostname; } catch (e) { return null; }
}

// True when `host` belongs to another site than `topHost`. Unknown names count as third party.
function isThirdParty(host, topHost) {
  const a = siteName(host), b = siteName(topHost);
  return !(a && b && a === b) && host !== topHost;
}

if (typeof module !== "undefined") module.exports = { siteName, hostOf, isThirdParty };
