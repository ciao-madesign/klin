"""Mock web (note: hosts on the browser HSTS preload list, e.g. google-analytics.com, are
upgraded to https and never reach this server, so they cannot be used here).
Mock web for ad/tracker blocking tests. Acts as an HTTP proxy that answers for any host.
Logs every requested URL. Usage: python3 -I mockweb.py PORT LOGFILE [DELAY_SECONDS]
The start page (http://wait.test/) redirects to http://news.test/ after DELAY seconds,
giving the extension time to initialise before the test page loads.
"""
import sys, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

port, logf = int(sys.argv[1]), sys.argv[2]
delay = int(sys.argv[3]) if len(sys.argv) > 3 else 20

# (host, path-prefix) -> role. Role "must-load" = first-party content; others should be blocked.
RESOURCES = {
    ("news.test", "/style.css"): "first-party content",
    ("news.test", "/app.js"): "first-party content",
    ("news.test", "/ads/banner.js"): "first-party ad path",
    ("googleads.g.doubleclick.net", "/pagead/ads"): "ad network",
    ("pagead2.googlesyndication.com", "/pagead/js/adsbygoogle.js"): "ad network",
    ("cdn.segment.com", "/analytics.js/v1/x/analytics.min.js"): "tracker",
    ("cdn.mxpnl.com", "/libs/mixpanel-2-latest.min.js"): "tracker",
    ("static.criteo.net", "/js/ld/ld.js"): "ad network",
    ("widgets.outbrain.com", "/outbrain.js"): "ad network",
    ("sb.scorecardresearch.com", "/beacon.js"): "tracker",
    ("static.hotjar.com", "/c/hotjar-1.js"): "tracker",
}

PAGE = b"""<!doctype html><title>News</title>
<link rel=stylesheet href="/style.css">
<h1>Mock news</h1><p>Article text.</p>
<script src="/app.js"></script>
<script src="/ads/banner.js"></script>
<script async src="http://googleads.g.doubleclick.net/pagead/ads?client=x"></script>
<script async src="http://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"></script>
<script async src="http://cdn.segment.com/analytics.js/v1/x/analytics.min.js"></script>
<script async src="http://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js"></script>
<script async src="http://static.criteo.net/js/ld/ld.js"></script>
<script async src="http://widgets.outbrain.com/outbrain.js"></script>
<script async src="http://sb.scorecardresearch.com/beacon.js"></script>
<script async src="http://static.hotjar.com/c/hotjar-1.js"></script>
"""
WAIT = ("<!doctype html><title>wait</title><script>setTimeout(()=>location='http://news.test/',%d)</script>" % (delay * 1000)).encode()

class H(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def do_GET(self):
        from urllib.parse import urlsplit
        u = urlsplit(self.path)
        host, path = u.hostname or self.headers.get("Host", ""), u.path
        with open(logf, "a") as f:
            f.write(f"{time.time():.1f} {host}{path}\n")
        if host == "wait.test": body, ct = WAIT, "text/html"
        elif host == "news.test" and path == "/": body, ct = PAGE, "text/html"
        elif path.endswith(".css"): body, ct = b"body{font:16px sans-serif}", "text/css"
        else: body, ct = b"/* mock */", "application/javascript"
        self.send_response(200); self.send_header("Content-Type", ct)
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)

ThreadingHTTPServer(("127.0.0.1", port), H).serve_forever()
