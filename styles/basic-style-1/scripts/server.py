"""Static server for Basic style 1 (Windows, Mac, Linux). Same behaviour as server.ps1.

python server.py --root <folder-kerja> [--port 8767]

GET  serves files under --root (no cache).
POST /save?name=x        body = data URL  -> writes <root>/frames/x
POST /save?name=x&raw=1  body = raw bytes -> writes <root>/frames/x
"""
import argparse
import base64
import os
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import parse_qs, urlparse

ap = argparse.ArgumentParser()
ap.add_argument("--root", required=True)
ap.add_argument("--port", type=int, default=8765)
a = ap.parse_args()
ROOT = os.path.abspath(a.root)
OUT = os.path.join(ROOT, "frames")
os.makedirs(OUT, exist_ok=True)


class H(SimpleHTTPRequestHandler):
    extensions_map = {**SimpleHTTPRequestHandler.extensions_map, ".js": "text/javascript", ".mjs": "text/javascript",
                      ".json": "application/json", ".mp4": "video/mp4", ".mp3": "audio/mpeg", ".html": "text/html"}

    def __init__(self, *args, **kw):
        super().__init__(*args, directory=ROOT, **kw)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()

    def log_message(self, *args):
        pass

    def do_POST(self):
        try:
            q = parse_qs(urlparse(self.path).query)
            name = os.path.basename(q.get("name", [""])[0])
            if not name:
                self.send_response(400); self.end_headers(); return
            n = int(self.headers.get("Content-Length") or 0)
            body = self.rfile.read(n)
            if q.get("raw", [""])[0] != "1":
                body = base64.b64decode(body[body.index(b",") + 1:])
            with open(os.path.join(OUT, name), "wb") as f:
                f.write(body)
            self.send_response(200)
        except Exception:
            self.send_response(500)
        self.end_headers()


print(f"serving {ROOT} on http://localhost:{a.port}/", flush=True)
ThreadingHTTPServer(("localhost", a.port), H).serve_forever()
