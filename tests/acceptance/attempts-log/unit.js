// Unit test for extensions/attempts-log/sites.js. Usage: node tests/acceptance/attempts-log/unit.js
const s = require("../../../extensions/attempts-log/sites.js");
let failed = 0, total = 0;
const eq = (label, got, want) => { total++; if (got !== want) { failed++; console.log(`FAIL ${label}: got ${got}, want ${want}`); } };
eq("plain", s.siteName("www.example.org"), "example.org");
eq("deep subdomain", s.siteName("a.b.c.example.org"), "example.org");
eq("co.uk", s.siteName("shop.example.co.uk"), "example.co.uk");
eq("com.br", s.siteName("loja.example.com.br"), "example.com.br");
eq("ip", s.siteName("192.168.1.1"), null);
eq("localhost", s.siteName("localhost"), null);
eq("uppercase and trailing dot", s.siteName("WWW.Example.ORG."), "example.org");
eq("hostOf", s.hostOf("https://cdn.example.net/a.js?x=1"), "cdn.example.net");
eq("hostOf bad", s.hostOf("not a url"), null);
eq("same site", s.isThirdParty("static.example.org", "www.example.org"), false);
eq("other site", s.isThirdParty("tracker.example.net", "www.example.org"), true);
eq("same host unknown name", s.isThirdParty("localhost", "localhost"), false);
eq("ip vs ip differ", s.isThirdParty("10.0.0.1", "10.0.0.2"), true);
console.log(failed ? `${failed} of ${total} failed` : `all ${total} cases pass`);
process.exit(failed ? 1 : 0);
