# Mozilla / third-party connections audit

Method: `tests/baseline/connection-audit/run.sh` starts Firefox 160.0 headless on a fresh profile, routed through a local proxy that logs and refuses every request. 90 s idle, Linux. Counts include retries after refusal, so read them as "destinations", not exact request numbers.

## Result
The table is generated from `extensions/connections/data/connections.json`, the same file shown to the user by the "Klin connections" page (`extensions/connections`). Edit the JSON, then run `python3 build/gen-connections-doc.py`.
"when": `idle` = seen in the idle audit; `browsing` = browsing-time connection, switched off by a pref whose value was verified, not yet observed on the wire.

<!-- connections:begin (generated, do not edit) -->
| Connection | Destination | When | Stock | Klin | Purpose | Decision |
|---|---|---|---|---|---|---|
| Remote Settings | firefox.settings.services.mozilla.com | idle | yes | yes | Downloads security data: blocklists of harmful add-ons, certificate revocation data (CRLite), intermediate certificates. | Keep. Security data; Klin relies on CRLite instead of OCSP. |
| Browser updates | aus5.mozilla.org | idle | yes | yes | Checks for and downloads new browser versions. | Keep. Timely security updates are mandatory (specification 4.5). |
| Safe Browsing lists | safebrowsing.googleapis.com, update.googleapis.com | idle | yes | yes | Downloads lists of known phishing and malware sites. Pages are checked against the local copy. | Keep, user-switchable. Privacy versus protection trade-off still open (see docs/PROPOSALS.md). |
| Add-on metadata and updates | services.addons.mozilla.org | idle | yes | yes | Checks installed extensions for updates and fetches their descriptions. | Keep while extensions are installed: extension updates are security updates. |
| uBlock Origin download | addons.mozilla.org | idle | no | yes | First start only: downloads uBlock Origin, as required by the Klin policy. | Remove by bundling uBlock Origin in the build. |
| uBlock Origin filter lists | ublockorigin.github.io, ublockorigin.pages.dev, cdn.jsdelivr.net, raw.githubusercontent.com, curbengh.github.io, malware-filter.gitlab.io, pgl.yoyo.org, publicsuffix.org, secure.fanboy.co.nz (fallback for the cookie-notice list) | idle | no | yes | Updates the lists of ads, trackers, malware domains and cookie banners to block or hide. | Keep. Blocking quality depends on fresh lists (specification 4.2). |
| Web Push | push.services.mozilla.com | idle | yes | **no** | Keeps a permanent connection open so sites can send notifications while closed. | Disabled. A permanent background connection is against low impact. |
| Region detection | location.services.mozilla.com | idle | yes | **no** | Guesses your country to choose regional defaults such as the search engine. | Disabled. Not needed. |
| Captive portal and connectivity checks | firefox-portal-detection.com | idle | yes | **no** | Pings a test page to detect Wi-Fi login pages (hotels, trains) and whether the network works. | Disabled. Recurring background pings. |
| OpenH264 codec download | ciscobinary.openh264.org | idle | yes | **no** | Downloads a video codec used for H.264 in video calls. | Disabled. Third-party binary download. |
| Firefox Accounts and Sync | accounts.firefox.com | idle | yes | **no** | Sign-in and synchronisation through a Mozilla account. | Disabled. Klin has no accounts (specification 2). |
| Certificate status lookups (OCSP) | the certificate authority of each site | browsing | yes | **no** | Asks the authority that issued a site's certificate whether it has been revoked. | Disabled. Revocation is checked locally with CRLite. |
| Search suggestions and trending searches | your default search engine | browsing | yes | **no** | Sends what you type in the address bar to the search engine to show suggestions, and asks it for trending searches when you click the bar. | Disabled. Nothing is sent until you search. |
| Speculative connections | sites linked from the page or guessed from typing | browsing | yes | **no** | Connects in advance to sites you might open next, to save a moment if you do. | Disabled. Wasted traffic and energy (specification 4.3). |
| Sponsored tiles, recommendations and built-in AI downloads | contile.services.mozilla.com (sponsored tiles), Mozilla content and model servers | browsing | yes | **no** | Fetches sponsored shortcuts, recommended articles, add-on recommendations and VPN promotions, and downloads models for Firefox's own on-device AI features. | Disabled. Klin shows no advertising or sponsored content (specification 6); its AI is opt-in and uses local Ollama (specification 4.8). |
<!-- connections:end -->

Remote Settings also has a backup host (firefox-settings.mozilla-backup.org), contacted by stock Firefox in the audit but not by Klin.
Disabling has a cost: Web Push stops working; captive portals on public Wi-Fi are no longer detected; OpenH264 affects H.264 in WebRTC only.

Stock: 47 requests, 11 destinations. Klin v3: 23 requests, 6 destinations (5 once uBO is bundled).

## Limits of this audit
- Idle fresh profile only. Browsing-time connections (search suggestions, favicons, OCSP, DoH, extension traffic) are not covered yet.
- Refusing everything can trigger retries that a normal run would not show, and can hide follow-up requests.
- Linux only.

## Proposed definition for the requirement "no unnecessary proprietary connections"
Allowed: security updates, security data (Remote Settings, Safe Browsing), extension updates. Everything else off by default. Each remaining connection is documented here and user-switchable where safe. To be confirmed.

## Update: with uBlock Origin 1.76.0 installed (idle, 120 s, fresh profile)
uBlock downloads its filter lists on first run from third-party hosts, in addition to the Mozilla ones above:

Hosts: see the "uBlock Origin filter lists" row above (uBlock's own lists mirrored on three hosts, third-party malware and ad-server lists, the public suffix list).

Decision (confirmed): keep list updates, since blocking quality depends on them (spec 4.2: updatable lists). Consequences:
- These hosts see the user's IP and the update timing, not browsing. This must be disclosed in the privacy docs.
- The default list set (bundled with the extension, loaded locally first) is what ships; Klin should review which lists are enabled to limit the number of hosts, and offer a switch to disable updates.
- Open: mirror the lists in a Klin-controlled place? Rejected for now (needs infrastructure; spec forbids proprietary servers).
