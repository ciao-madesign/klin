// The privacy levels. Plain data, so the page, the background and the tests agree on one definition.
// Decided by the project owner (13-14 Nov 2026): Standard by default; Advanced hides the time zone only; the third
// level is called Maximum (never "Anonymous": Klin does not promise anonymity).
const KlinLevels = {
  default: "standard",
  levels: {
    standard: {
      name: "Standard",
      available: true,
      line: "Standard: blocks trackers and makes your device harder to recognise. Sites keep working.",
      does: "Blocks advertising and trackers, keeps cookies apart per site, adds noise to the canvas read-out, hides the local network address, trims referrers.",
      hides: "Does not hide your time zone, screen size, languages, processor count, fonts or audio fingerprint. Sites see your IP address.",
      cost: "None. This is the level for most people.",
    },
    advanced: {
      name: "Advanced",
      available: true,
      line: "Advanced: hides your time zone. Does not hide your screen size.",
      does: "Everything in Standard, and pages see UTC as your time zone.",
      hides: "Does not hide screen and window size, touch, languages, processor count, fonts or audio fingerprint. Sites see your IP address. It is an approximation done inside the page: a page that looks hard can notice it, and background workers are not covered.",
      cost: "Times on booking and calendar sites can appear shifted by one or two hours. One click back to Standard.",
    },
    maximum: {
      name: "Maximum",
      available: false,
      line: "Maximum: Advanced plus Tor and nothing kept on disk. Not available yet.",
      does: "The full set of Firefox's fingerprint protections, traffic through Tor, no persistent data.",
      hides: "Not available: Tor is not part of Klin yet. Even then sites will not see your IP address, but Klin will not call this anonymous.",
      cost: "Slower. Some sites refuse Tor or break.",
    },
  },
};
if (typeof module !== "undefined") module.exports = KlinLevels;
else globalThis.KlinLevels = KlinLevels;
