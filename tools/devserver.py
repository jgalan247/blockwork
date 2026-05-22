#!/usr/bin/env python3
"""
Optional dev server for Blockwork.

Identical to `python -m http.server`, but adds `Cache-Control: no-store` so the
browser always re-fetches your edited files on reload. Plain `http.server` sends
no cache headers, which makes browsers heuristically cache ES modules — handy in
production, annoying while developing.

    python3 tools/devserver.py [port]   # default 8000

You do NOT need this to use or deploy Blockwork; it's purely a developer
convenience. Any static server works.
"""

import http.server
import socketserver
import sys

PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, max-age=0")
        super().end_headers()


socketserver.TCPServer.allow_reuse_address = True
with socketserver.TCPServer(("", PORT), NoCacheHandler) as httpd:
    print(f"Blockwork dev server: http://localhost:{PORT}  (Ctrl+C to stop)")
    httpd.serve_forever()
