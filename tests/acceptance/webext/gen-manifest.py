import json, sys
mv = int(sys.argv[1])
m = {"manifest_version": mv, "name": "Klin capability probe", "version": "0.0.1",
     "browser_specific_settings": {"gecko": {"id": "klin-probe@example.invalid"}},
     "content_scripts": [{"matches": ["http://news.test/*"], "js": ["content.js"], "run_at": "document_idle"}],
     "sidebar_action": {"default_panel": "panel.html", "default_title": "Klin"}}
perms = ["webRequest", "webRequestBlocking", "storage", "tabs", "bookmarks", "history", "contextualIdentities", "cookies", "search",
         "alarms", "downloads", "sessions", "dns", "privacy", "idle", "scripting", "menus", "declarativeNetRequest", "tabGroups", "proxy"]
if mv == 2:
    m["permissions"] = perms + ["<all_urls>"]; m["background"] = {"scripts": ["background.js"], "persistent": False}
else:
    m["permissions"] = perms
    m["host_permissions"] = ["<all_urls>"]
    m["background"] = {"scripts": ["background.js"]}
    # The default MV3 CSP adds upload-insecure-requests (http -> https upgrade); relaxed here to reach the http mock.
    m["content_security_policy"] = {"extension_pages": "script-src 'self'; object-src 'self';"}
json.dump(m, open(sys.argv[2], "w"), indent=1)
