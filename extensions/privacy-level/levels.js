// The privacy levels. Plain data, so the page, the background and the tests agree on one definition.
// The wording lives in _locales (keys pl_<level>_name, _line, _does, _hides, _cost).
// Decided by the project owner (13-14 Nov 2026): Standard by default; Advanced hides the time zone only; the third
// level is called Maximum (never "Anonymous": Klin does not promise anonymity).
const KlinLevels = {
  default: "standard",
  levels: {
    standard: { available: true },
    advanced: { available: true },
    maximum: { available: false },   // needs Tor, which Klin does not have yet
  },
};
if (typeof module !== "undefined") module.exports = KlinLevels;
else globalThis.KlinLevels = KlinLevels;
