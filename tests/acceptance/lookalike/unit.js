// Unit test for extensions/lookalike/detect.js. Usage: node tests/acceptance/lookalike/unit.js
const path = require("path");
const d = require(path.join(__dirname, "../../../extensions/lookalike/detect.js"));
const known = ["mybank.com", "paypal.com", "wikipedia.org", "example.co.uk", "apple.com", "google.com", "amazon.it", "repubblica.it"];
const cases = [
  // [hostname, expected known site or null]
  ["www.rnybank.com", "mybank.com"],          // rn for m
  ["paypa1.com", "paypal.com"],               // digit for letter
  ["login.paypal.com", null],                 // subdomain of a known site
  ["paypal.it", null],                        // same name, other suffix: normal
  ["wikipedla.org", "wikipedia.org"],         // one letter changed
  ["wikpedia.org", "wikipedia.org"],          // one letter missing
  ["wikiepdia.org", "wikipedia.org"],         // two letters swapped
  ["wikipedia.org", null],
  ["xn--80ak6aa92e.com", "apple.com"],        // Cyrillic letters that read "apple"
  ["g00gle.com", "google.com"],
  ["googlee.net", null],                      // one letter but another suffix: not reported
  ["examp1e.co.uk", "example.co.uk"],
  ["amazon.com", null],
  ["amazom.it", "amazon.it"],
  ["apple.org", null],
  ["maple.com", null],                        // short names: one-letter rule needs 6+ letters
  ["mozilla.org", null],
  ["192.168.1.1", null],
  ["localhost", null],
  ["repubbiica.it", "repubblica.it"],
];
let failed = 0;
for (const [host, expected] of cases) {
  const r = d.findLookalike(host, known);
  const got = r ? r.known : null;
  if (got !== expected) { failed++; console.log(`FAIL ${host}: expected ${expected}, got ${got}`); }
}
console.log(d.punycodeToUnicode("xn--80ak6aa92e"), d.skeleton("xn--80ak6aa92e"));
console.log(failed ? `${failed} of ${cases.length} failed` : `all ${cases.length} cases pass`);
process.exit(failed ? 1 : 0);
