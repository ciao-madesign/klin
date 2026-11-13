# welcome

Klin's presentation page (landing page): opens once, the first time the browser is installed and started, and can be opened again from the **info button** in the toolbar.

Status: **mechanism working; wording and look are a first draft.** Style and tone of Klin are not defined yet (open decision), so the text is neutral and plain.

- Opens only on installation (`runtime.onInstalled`, reason `install`), never on updates, and a stored flag keeps it from opening twice for the same installation.
- The info button brings the open page to the front instead of opening a copy; if it was closed, it opens it again.
- Part of the browser build as a built-in extension (no Firefox patch). A real `about:klin` address would need a patch (ADR 0001); not planned.
- The page loads nothing from the internet and makes no connection.
- Content: what Klin is, what it does for you, **what it does not do** (the honesty rule: it does not promise anonymity), what it stands for (draft, to be replaced by the charter, P36), and how to read the page again.

Test: `tests/acceptance/welcome/run.py FIREFOX_DIR` (10 checks).

Limits:
- A built-in extension is installed by the build; whether `onInstalled` fires with reason `install` at the first start of a fresh profile in that setup is **not tested** (tested with a temporary install only).
- The other Klin pages (collection log, self-test, connections) cannot be linked from here: an extension page cannot link to another extension's page. The text points to their toolbar buttons.
- English only, no illustrations, no logo yet (`branding/` is empty).
