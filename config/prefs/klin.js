// Klin default preferences (Phase 0 draft). Installed as defaults/pref/klin.js;
// users can still change them. Every value must be verified against the
// Firefox version in use (see docs/PHASE0.md).

// --- Telemetry and data collection: off ---
pref("datareporting.healthreport.uploadEnabled", false);
pref("datareporting.policy.dataSubmissionEnabled", false);
pref("toolkit.telemetry.enabled", false);
pref("toolkit.telemetry.unified", false);
pref("toolkit.telemetry.archive.enabled", false);
pref("browser.ping-centre.telemetry", false);
pref("app.shield.optoutstudies.enabled", false);
pref("browser.discovery.enabled", false);
pref("browser.newtabpage.activity-stream.feeds.telemetry", false);
pref("browser.newtabpage.activity-stream.telemetry", false);

// --- Traffic Engine: no speculative network activity ---
pref("network.prefetch-next", false);
pref("network.dns.disablePrefetch", true);
pref("network.predictor.enabled", false);
pref("network.http.speculative-parallel-limit", 0);
pref("browser.urlbar.speculativeConnect.enabled", false);
pref("browser.search.suggest.enabled", false);

// --- Autoplay: block audible and video autoplay ---
pref("media.autoplay.default", 5);
pref("media.autoplay.blocking_policy", 2);

// --- Tabs: unload inactive tabs ---
pref("browser.tabs.unloadOnLowMemory", true);

// --- Privacy (Standard level) ---
pref("privacy.query_stripping.enabled", true);
pref("privacy.query_stripping.enabled.pbmode", true);
pref("privacy.trackingprotection.enabled", true);
pref("privacy.trackingprotection.socialtracking.enabled", true);
pref("privacy.fingerprintingProtection", true);
// Real canvas noise. Upstream's default "efficient" variant only tags exported image files and leaves
// pixel read-out exact (a stable fingerprint); removing it lets CanvasRandomization apply. See docs/PROPOSALS.md.
pref("privacy.fingerprintingProtection.overrides", "-EfficientCanvasRandomization");
pref("network.cookie.cookieBehavior", 5); // total cookie protection (partitioned)
pref("dom.security.https_only_mode", true);

// --- Connection audit (tests/baseline/connection-audit): unnecessary Mozilla services off ---
pref("dom.push.enabled", false);                       // push.services.mozilla.com
pref("dom.push.connection.enabled", false);
pref("browser.region.update.enabled", false);          // location.services.mozilla.com
pref("browser.region.network.url", "");
pref("network.captive-portal-service.enabled", false); // portal detection pings
pref("media.gmp-gmpopenh264.enabled", false);          // Cisco OpenH264 download
pref("media.gmp-gmpopenh264.visible", false);
pref("identity.fxaccounts.enabled", false);            // no Firefox accounts (spec: no accounts)
pref("network.connectivity-service.enabled", false);   // connectivity/portal check

// --- Proposals batch 1 (docs/PROPOSALS.md), verified on Firefox 160.0 ---
pref("privacy.globalprivacycontrol.enabled", true);            // P2: send Global Privacy Control (Sec-GPC: 1)
pref("network.http.referer.XOriginTrimmingPolicy", 2);         // P2: cross-site referrer reduced to scheme+host
pref("security.OCSP.enabled", 0);                              // P5: no OCSP lookups (they tell the CA which site is visited); CRLite stays enforced
pref("pdfjs.enableScripting", false);                          // P16: no JavaScript inside PDFs
pref("media.peerconnection.ice.default_address_only", true);   // WebRTC: do not expose extra local/VPN-bypassing addresses
pref("media.peerconnection.ice.proxy_only_if_behind_proxy", true); // WebRTC: never bypass a configured proxy

// --- Firefox's own advertising, promotion and built-in AI (proposal P21), verified on Firefox 160.0 ---
pref("browser.topsites.contile.enabled", false);                      // sponsored tiles fetched from Mozilla
pref("browser.urlbar.suggest.trending", false);                       // "trending searches": sends a request to the search engine
pref("browser.urlbar.trending.featureGate", false);
pref("browser.newtabpage.activity-stream.discoverystream.enabled", false); // recommended articles
pref("browser.vpn_promo.enabled", false);                             // VPN advertising
pref("extensions.htmlaboutaddons.recommendations.enabled", false);    // add-on recommendations (contact AMO)
pref("browser.search.serpEventTelemetryCategorization.enabled", false); // classifies search result pages
pref("browser.ml.enable", false);                                     // Firefox's own on-device AI: downloads models from Mozilla.
pref("browser.ml.chat.enabled", false);                               // Klin's AI is opt-in and uses local Ollama (spec 4.8)
pref("browser.tabs.groups.smart.enabled", false);

// Klin has its own first start (extensions/welcome): no "Welcome to Firefox" screen, which also talks about data sent to Mozilla.
pref("browser.aboutwelcome.enabled", false);
pref("browser.startup.homepage_override.mstone", "ignore");
