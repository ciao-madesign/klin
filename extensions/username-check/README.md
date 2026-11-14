# username-check

"Where am I registered?" (P38). You type a username that is yours, press **Check**, and Klin asks about 460 websites whether a profile with that name exists. Opens from its toolbar button.

Status: **v0.1, working and verified in Firefox 160.0.**

- **By hand only.** Nothing runs until you press Check. You must tick "this is my own username" first.
- **Permission asked each time.** The extension holds no access to websites by default; pressing Check asks for it, and refusing sends nothing.
- **Gentle.** Six requests at a time, 15 seconds at most per site, a Stop button. Sites judged by status code are asked with `HEAD`, so no page is downloaded.
- **No trace of you.** Requests carry no cookies and no referrer, so you are never logged in and no session is touched. The name is kept in memory only and disappears when the page closes.
- **Result in three groups:** exists, not found, unclear (blocked, rate limited, slow, down). Unclear sites are listed with a link so you can look yourself. Names a site cannot accept (its own rule) are skipped without a request.
- **Site list:** from the open-source [Sherlock](https://github.com/sherlock-project/sherlock) project (MIT), pinned to one commit and checked by SHA-256 in `build/third-party.json`; only the list is used, not its code. Converted by `build/gen-sherlock-sites.py` into `data/sites.json` (adult sites left out); licence kept in `data/SHERLOCK-LICENSE`. `build/gen-sherlock-sites.py --check` fails if the committed list differs from the pin.

## What it does not do
- It does not delete accounts, it only finds them. The page tells you to look for the deletion option in each account's settings. A list of direct deletion pages (for example JustDeleteMe, licence still to check) and the data-removal requests (P25, P27) are separate steps.
- It can be wrong: a site may use the name for someone else, change how it answers, or hide the answer from automated requests.
- It looks only at usernames. Not email addresses, phone numbers or data held by data brokers.
- Every site you check receives a request with your internet address and the name you typed. Klin and nobody else receives anything. Over Tor or a proxy of your choice (P32) the address would be different; not available yet.
- A site that answers with a generic page for any name can show up as "exists". Treat the result as a lead.

## Not done yet
- Use the names from the alias registry (P26) instead of typing; keep your own list of confirmed accounts and of deletions done.
- Deletion links per site.
- Routing through a chosen proxy or Tor (P32).
- Sherlock's list changes: update the pin on purpose, re-run the generator and the tests.
- Permanent install needs the extension signed (ADR 0004 on another branch); the permission prompt was tested by granting it from the browser's own code, not by a click on the real prompt.

## Tests
- `node tests/acceptance/username-check/unit.js`: 27 checks (requests, classification, name rules, the list, concurrency, stop, timeout).
- `python3 tests/acceptance/username-check/run.py FIREFOX_DIR`: 23 checks in a real Firefox with stand-in sites (status code, own error code, message, redirect, POST probe, rate limit, slow, skipped name), including that no cookie or referrer is sent, that nothing can be read without permission, and the page end to end.
