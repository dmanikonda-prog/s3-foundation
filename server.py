#!/usr/bin/env python3
"""
S3 Foundation — Zero-dependency Local Server
No pip install needed. Python 3.6+ only.

Usage:
  python server.py
  python server.py --port 8080 --password mySecretPass

Then open:
  Website:  http://localhost:3000
  Admin:    http://localhost:3000/admin
"""
import http.server
import json
import os
import sys
import argparse
import mimetypes
from pathlib import Path
from urllib.parse import urlparse

# ── Config ─────────────────────────────────────────────────────────────────────
parser = argparse.ArgumentParser(description='S3 Foundation local server')
parser.add_argument('--port',     type=int, default=3000, help='Port (default 3000)')
parser.add_argument('--password', type=str, default='admin123', help='Admin password')
args = parser.parse_args()

PORT           = args.port
ADMIN_PASSWORD = os.environ.get('ADMIN_PASSWORD', args.password)
ROOT_DIR       = Path(__file__).parent.resolve()
CONTENT_FILE   = ROOT_DIR / 'data' / 'content.json'

mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')

# ── Handler ────────────────────────────────────────────────────────────────────
class S3Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=str(ROOT_DIR), **kw)

    def log_message(self, fmt, *args):
        pass  # Suppress default logs

    def send_json(self, code, data):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(body)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def check_auth(self):
        auth = self.headers.get('Authorization', '')
        token = auth.replace('Bearer ', '').strip()
        return token == ADMIN_PASSWORD

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

    def do_GET(self):
        parsed = urlparse(self.path)
        path   = parsed.path.rstrip('/')

        if path == '/api/content':
            try:
                with open(CONTENT_FILE, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                self.send_json(200, data)
            except Exception as e:
                self.send_json(500, {'error': str(e)})
            return

        # /admin → serve admin/index.html
        if path in ('/admin', '/admin/'):
            self.path = '/admin/index.html'

        # Fallback to static file serving
        super().do_GET()

    def do_POST(self):
        parsed  = urlparse(self.path)
        path    = parsed.path
        length  = int(self.headers.get('Content-Length', 0))
        body    = json.loads(self.rfile.read(length) or '{}') if length else {}

        if path == '/api/auth':
            if body.get('password') == ADMIN_PASSWORD:
                self.send_json(200, {'token': ADMIN_PASSWORD, 'ok': True})
            else:
                self.send_json(401, {'error': 'Invalid password'})
            return

        if path == '/api/content':
            if not self.check_auth():
                self.send_json(401, {'error': 'Unauthorized'})
                return
            try:
                CONTENT_FILE.parent.mkdir(parents=True, exist_ok=True)
                with open(CONTENT_FILE, 'w', encoding='utf-8') as f:
                    json.dump(body, f, indent=2, ensure_ascii=False)
                self.send_json(200, {'success': True})
            except Exception as e:
                self.send_json(500, {'error': str(e)})
            return

        self.send_json(404, {'error': 'Not found'})

# ── Start ──────────────────────────────────────────────────────────────────────
if __name__ == '__main__':
    server = http.server.HTTPServer(('', PORT), S3Handler)
    print(f'\n  ✦ S3 Foundation Server running!')
    print(f'  🌐  Website : http://localhost:{PORT}')
    print(f'  🔐  Admin   : http://localhost:{PORT}/admin')
    print(f'  🔑  Password: {ADMIN_PASSWORD}')
    print(f'  Press Ctrl+C to stop\n')
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print('\n  Server stopped.')
