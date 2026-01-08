#!/usr/bin/env python3
import http.server
import socketserver
import os

PORT = 8080

class MyHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Enable CORS
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()
    
    def do_GET(self):
        # Serve index.html for root path
        if self.path == '/':
            self.path = '/index.html'
        return super().do_GET()

# Change to frontend directory
os.chdir(os.path.dirname(os.path.abspath(__file__)))

print(f"""
╔════════════════════════════════════════╗
║  📚 Library System Frontend Server    ║
╠════════════════════════════════════════╣
║  Server running at:                    ║
║  → http://localhost:{PORT}             ║
║                                        ║
║  Backend API:                          ║
║  → http://localhost:3001               ║
╚════════════════════════════════════════╝
""")

with socketserver.TCPServer(("", PORT), MyHTTPRequestHandler) as httpd:
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n👋 Server stopped")
