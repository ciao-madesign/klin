# welcome

Klin's presentation page (landing page): opens once, the first time the browser is installed and started, and can be opened again from the **info button** in the toolbar.

Status: **mechanism working; wording and look are a first draft.** Style and tone of Klin are not defined yet (open decision), so the text is neutral and plain.

- Opens only on installation (`runtime.onInstalled`, reason `install`), never on updates, and a stored flag keeps it from opening twice for the same installation.
- The info button brings the open page to the front instead of opening a copy; if it was closed, it opens it again.
- Part of the browser build as a built-in extension (no Firefox patch). A real `about:klin` address would need a patch (ADR 0001); not planned.
- The page loads nothing from the internet and makes no connection.
- A small link on the page leads to a second page in the same extension, **Klin and Greenweb** (`page/greenweb.html`): what each one does, how they fit together, what Greenweb does not do. From there one link goes to Greenweb's project page on the web; it is the only link that leaves the browser, it is labelled as such, and nothing is contacted unless it is clicked.
- Content: what Klin is, what it does for you, **what it does not do** (the honesty rule: it does not promise anonymity), what it stands for (draft, to be replaced by the charter, P36), and how to read the page again.

Test: `tests/acceptance/welcome/run.py FIREFOX_DIR` (16 checks).

Limits:
- A built-in extension is installed by the build; with the signed bundle on Firefox 160.0 (`tests/acceptance/bundle`) the welcome page does open at the first start of a fresh profile; whether it opens again after a Klin update is not tested.
- The other Klin pages (collection log, self-test, connections) cannot be linked from here: an extension page cannot link to another extension's page. The text points to their toolbar buttons.
- The Klin and Greenweb page cannot open Greenweb's own page (same limit as above); it points to the leaf button and to the project page on the web. It says Greenweb is part of the build; that holds only for a build made with `build/bundle-third-party.py` (see `tests/acceptance/bundle`).
- If the tab is on the Klin and Greenweb page, the info button opens the welcome page in a new tab instead of reusing that one.
- English only, no illustrations, no logo yet (`branding/` is empty).
