# Mozilla / third-party connections audit

Method: `tests/baseline/connection-audit/run.sh` starts Firefox 160.0 headless on a fresh profile, routed through a local proxy that logs and refuses every request. 90 s idle, Linux. Counts include retries after refusal, so read them as "destinations", not exact request numbers.

## Result
| Destination | Stock | Klin v3 | Purpose | Decision |
|---|---|---|---|---|
| firefox.settings.services.mozilla.com, firefox-settings.mozilla-backup.org | yes | yes (main only) | Remote Settings: blocklists, certificate revocation data (CRLite), intermediates | **Keep** – security. Open: can the content be mirrored or reduced? |
| aus5.mozilla.org | yes | yes | Browser updates | **Keep** – security updates are mandatory (spec 4.5) |
| safebrowsing.googleapis.com, update.googleapis.com | yes | yes | Google Safe Browsing lists (hash prefixes) | **Keep, user-switchable.** Open: privacy vs. protection trade-off to confirm |
| services.addons.mozilla.org | yes | yes | Add-on metadata and update checks | **Keep** while extensions are installed |
| addons.mozilla.org | no | yes | Policy installs uBlock Origin | **Remove** by bundling uBO in the build |
| push.services.mozilla.com | yes | **no** | Web Push | Disabled (`dom.push.*`); Web Push stops working |
| location.services.mozilla.com | yes | **no** | Region detection | Disabled |
| firefox-portal-detection.com | yes | **no** | Captive portal / connectivity check | Disabled; captive portals on public Wi-Fi are no longer detected |
| ciscobinary.openh264.org | yes | **no** | OpenH264 codec download | Disabled; affects H.264 in WebRTC only |
| accounts.firefox.com | yes | **no** | Firefox Accounts | Disabled (spec: no accounts) |

Stock: 47 requests, 11 destinations. Klin v3: 23 requests, 6 destinations (5 once uBO is bundled).

## Limits of this audit
- Idle fresh profile only. Browsing-time connections (search suggestions, favicons, OCSP, DoH, extension traffic) are not covered yet.
- Refusing everything can trigger retries that a normal run would not show, and can hide follow-up requests.
- Linux only.

## Proposed definition for the requirement "no unnecessary proprietary connections"
Allowed: security updates, security data (Remote Settings, Safe Browsing), extension updates. Everything else off by default. Each remaining connection is documented here and user-switchable where safe. To be confirmed.
