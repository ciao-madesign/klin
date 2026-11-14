# ADR 0006 – Privacy levels: Standard by default, Advanced on request, Anonymous not yet

Status: accepted (owner decision of 13 Nov 2026: Standard is the default; implementation and measurements 14 Nov 2026)

## Context
Klin's first principle is privacy and anonymity by default where possible. Firefox's strong fingerprint protection (`privacy.resistFingerprinting`, "RFP") makes a device harder to recognise but breaks some sites. Tor is not part of Klin yet.

## Decision
- **Three levels**, each stating what it does, what it does not hide and what it costs (text in `extensions/privacy-level/levels.js`, shown on the level page):
  - **Standard** (default): Klin's configuration as shipped. Firefox's settings are not touched.
  - **Advanced**: Standard plus RFP.
  - **Anonymous**: Advanced plus Tor and nothing kept on disk. **Not available** until Tor is integrated (Phase 4); shown, disabled, with the reason.
- **Mechanism: an extension, no Firefox patch** (ADR 0001). `extensions/privacy-level` uses the WebExtensions `privacy` API to set `privacy.websites.resistFingerprinting`. While the extension is installed the setting belongs to it; removing the extension returns it (tested). Standard clears the setting instead of forcing it off, so a user's own preference is respected.
- The level page never promises anonymity: "none of them makes you anonymous" is on the page.

## What Advanced does, measured
Self-test (`extensions/self-test`), Firefox 160.0 on Linux, headless, Klin configuration, Standard vs Advanced:

| Detail | Standard | Advanced |
|---|---|---|
| Screen and window | real (1366×768) | generic |
| Time zone | real | generic name (offset shown as UTC) |
| Canvas read-out | altered by the browser | random on every read |
| Touch screen | no | reports 5 touch points (see below) |
| **Audio fingerprint** | identifier visible | **same identifier** |
| **Processor cores** | visible | **still visible** |
| **Installed fonts** | 5 of 31 tested | **same 5** |
| Browser and system, languages | visible | unchanged here (container already reports generic values) |

So in Firefox 160 Advanced closes the screen, time zone and canvas gaps but **not** the audio, processor and font gaps found in the audit (`PRINCIPLES.md`, principle 1). Those stay open and need other measures (own protection, or Tor Browser's approach). Advanced is therefore a real but partial step, and must not be described as "anonymous".

## Not verified
- **Breakage on real sites.** The build environment has no access to real sites, so the cost text is taken from how RFP is documented to behave (generic time zone and screen, coarser clock, canvas and clock-sensitive pages) and not from a survey. A test on a list of real sites (login, video, maps, banking, e-commerce) is still to do before Advanced is recommended anywhere.
- The "5 touch points" and the pixel ratio were seen in headless Firefox; whether a desktop with a real display shows the same, and whether sites then switch to a mobile layout, needs a check on a real machine.
- That the level persists across a browser restart (`runtime.onStartup` re-applies it; the settings API itself persists). Only the install-time path and removal were exercised.
- Letterboxing (fixed window sizes) is a separate preference not set here; to be decided after the real-site test.

## Consequences
- The dashboard (Phase 1) must show the current level and "what it does not hide", reading it from this extension.
- The Anonymous level needs its own ADR when Tor is integrated.
- Adding levels or changing what a level contains is one file (`levels.js`) plus the background logic, and a new measurement table here.
