// Test-only stand-in for a content blocker: cancels every request to tracker.example.net.
browser.webRequest.onBeforeRequest.addListener(() => ({ cancel: true }), { urls: ["*://tracker.example.net/*"] }, ["blocking"]);
