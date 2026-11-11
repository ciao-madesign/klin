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
pref("network.cookie.cookieBehavior", 5); // total cookie protection (partitioned)
pref("dom.security.https_only_mode", true);
