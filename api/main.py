"""Placeholder API.

This is stdlib only so that it prescribes nothing. Replace the whole file
with your framework of choice. The only things that have to survive are:

    GET /health  ->  200

the service listening on 8000, and CORS allowing the web origin. The web app
runs on :5173 and calls this on :8000, so without the CORS headers below the
browser blocks every call and the page reports the API as down. Whatever
framework you swap in, turn its CORS middleware on.
"""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

PORT = 8000
WEB_ORIGIN = os.environ.get("WEB_ORIGIN", "http://localhost:5173")


class Handler(BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", WEB_ORIGIN)
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.send_header("Content-Length", "0")
        self.end_headers()

    def do_GET(self):
        if self.path == "/health":
            body = json.dumps({"status": "ok"}).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self._cors()
            self.end_headers()
            self.wfile.write(body)
        else:
            self.send_error(404)

    def log_message(self, fmt, *args):
        print(f"[api] {fmt % args}", flush=True)


if __name__ == "__main__":
    print(f"[api] listening on :{PORT}, allowing origin {WEB_ORIGIN}", flush=True)
    ThreadingHTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
