// The privacy levels. Plain data, so the page, the background and the tests agree on one definition.
const KlinLevels = {
  default: "standard",
  levels: {
    standard: {
      name: "Standard",
      available: true,
      does: "Blocks advertising and trackers, keeps cookies apart per site, adds noise to the canvas read-out, hides the local network address, trims referrers. Sites keep working.",
      hides: "It does not hide your time zone, screen size, languages, processor count, installed fonts or audio fingerprint, and sites still see your internet address.",
      cost: "No cost: this is the level most people should use.",
    },
    advanced: {
      name: "Advanced",
      available: true,
      does: "Everything in Standard, plus Firefox's strong fingerprint protection: it reports a generic screen size and time zone, makes the canvas read-out random on every read, blurs the clock's precision and answers with generic values for more details.",
      hides: "Measured on Firefox 160: it still does not hide the audio fingerprint, processor count or installed fonts, and sites still see your internet address and your provider still sees which sites you visit.",
      cost: "Some sites misbehave: dates and times show in a generic time zone, pages may look as if the window had a fixed size, games and video tools that read the canvas or the clock closely can break, and sites that ask for the local time may be wrong. Switch back to Standard for those sites.",
    },
    anonymous: {
      name: "Anonymous",
      available: false,
      does: "Advanced plus traffic through Tor and nothing kept on disk.",
      hides: "Not available: Tor is not part of Klin yet.",
      cost: "Slower; some sites refuse Tor.",
    },
  },
};
if (typeof module !== "undefined") module.exports = KlinLevels;
else globalThis.KlinLevels = KlinLevels;
