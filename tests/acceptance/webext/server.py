"""Mock web + mock Ollama for the WebExtensions probe.
Usage: python3 -I server.py PROXY_PORT REPORT_FILE REQ_LOG [DELAY]
- Proxy port: answers for any host (news.test page with ads/tracker/sponsored element, report.test POST sink).
- 127.0.0.1:11434: mock Ollama (/api/tags, /api/generate), deliberately WITHOUT CORS headers.
"""
import sys, json, threading, time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

port, report, reqlog = int(sys.argv[1]), sys.argv[2], sys.argv[3]
delay = int(sys.argv[4]) if len(sys.argv) > 4 else 10
pad = lambda n, c: (c * n)[:n].encode()
PAGE = b"""<!doctype html><title>News</title><link rel=stylesheet href="/style.css">
<h1>News</h1><p class=article>Article.</p><div class=sponsored>Sponsored: buy now</div>
<script src="/app.js"></script><script src="http://ad.test/ad.js"></script>"""
WAIT = ("<!doctype html><script>setTimeout(()=>location='http://news.test/',%d)</script>" % (delay * 1000)).encode()

class Web(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _send(self, body, ct):
        self.send_response(200); self.send_header("Content-Type", ct)
        self.send_header("Content-Length", str(len(body))); self.end_headers(); self.wfile.write(body)
    def do_GET(self):
        u = urlsplit(self.path); host, path = u.hostname, u.path
        open(reqlog, "a").write(f"{host}{path}\n")
        if host == "wait.test": self._send(WAIT, "text/html")
        elif host == "news.test" and path == "/": self._send(PAGE, "text/html")
        elif path == "/style.css": self._send(pad(500, "/*x*/"), "text/css")
        elif path == "/app.js": self._send(pad(1000, "//x\n"), "application/javascript")
        else: self._send(b"", "text/plain")
    def do_POST(self):
        n = int(self.headers.get("Content-Length", 0)); body = self.rfile.read(n)
        if urlsplit(self.path).hostname == "report.test":
            open(report, "ab").write(body + b"\n")
        self._send(b"ok", "text/plain")

class Ollama(BaseHTTPRequestHandler):
    def log_message(self, *a): pass
    def _j(self, o):
        b = json.dumps(o).encode(); self.send_response(200); self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(b))); self.end_headers(); self.wfile.write(b)
    def do_GET(self): self._j({"models": [{"name": "mock:1b"}]})
    def do_POST(self):
        self.rfile.read(int(self.headers.get("Content-Length", 0))); self._j({"response": "mock summary", "done": True})

threading.Thread(target=ThreadingHTTPServer(("127.0.0.1", 11434), Ollama).serve_forever, daemon=True).start()
ThreadingHTTPServer(("127.0.0.1", port), Web).serve_forever()
