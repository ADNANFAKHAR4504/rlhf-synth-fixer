#!/bin/bash
set -euxo pipefail

# Log all output for debugging
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

# Install Python 3 if not present
if command -v yum >/dev/null 2>&1; then
  yum install -y python3
elif command -v apt-get >/dev/null 2>&1; then
  apt-get update
  apt-get install -y python3
fi

# Wait for Python to be installed
command -v python3

# Install and start SSM agent (for AL2023)
if ! systemctl is-active --quiet amazon-ssm-agent; then
  if command -v yum >/dev/null 2>&1; then
    yum install -y amazon-ssm-agent
  elif command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y amazon-ssm-agent
  fi
  systemctl enable amazon-ssm-agent
  systemctl start amazon-ssm-agent
fi

# Install curl with --aws-sigv4 support if not present
if ! curl --help | grep -q aws-sigv4; then
  if command -v dnf >/dev/null 2>&1; then
    dnf install -y curl
  elif command -v yum >/dev/null 2>&1; then
    yum install -y curl
  elif command -v apt-get >/dev/null 2>&1; then
    apt-get update
    apt-get install -y curl
  fi
fi

# Log curl version and features for debugging
curl --version > /tmp/curl-version.txt 2>&1 || true
curl --help > /tmp/curl-help.txt 2>&1 || true

# Export environment variables for the Python server
export ENVIRONMENT="${environment}"
export LOG_LEVEL="${log_level}"
export BUCKET="${bucket}"

# Pre-create /alb.html and /code.txt for SSM curl tests
echo "ENVIRONMENT=${environment}" > /tmp/alb.html
echo "200" > /tmp/code.txt

cat >/tmp/web.py <<EOF
import os
from http.server import BaseHTTPRequestHandler, HTTPServer
import urllib.request

class Handler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path in ["/", "/index.html"]:
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            for key in ["ENVIRONMENT", "LOG_LEVEL", "BUCKET"]:
                val = os.environ.get(key, "")
                self.wfile.write(f"{key}={val}\\n".encode())
        elif self.path == "/egress.txt":
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            try:
                ip = urllib.request.urlopen("https://checkip.amazonaws.com", timeout=2).read().decode().strip()
            except Exception:
                ip = "unavailable"
            self.wfile.write(f"{ip}\\n".encode())
        elif self.path == "/alb.html":
            self.send_response(200)
            self.send_header("Content-type", "text/html")
            self.end_headers()
            with open("/tmp/alb.html", "rb") as f:
                self.wfile.write(f.read())
        elif self.path == "/code.txt":
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            with open("/tmp/code.txt", "rb") as f:
                self.wfile.write(f.read())
        else:
            self.send_response(404)
            self.end_headers()

    def do_HEAD(self):
        if self.path in ["/", "/index.html"]:
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
        elif self.path in ["/alb.html", "/code.txt"]:
            self.send_response(200)
            self.end_headers()
        elif self.path == "/egress.txt":
            self.send_response(200)
            self.end_headers()
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    port = 80
    server = HTTPServer(("0.0.0.0", port), Handler)
    server.serve_forever()
EOF

# Run the server as root to bind to port 80, and keep it running after script exits
nohup sudo python3 /tmp/web.py > /tmp/web.log 2>&1 &

# Wait and check if server is running
sleep 5
if ! sudo lsof -i :80; then
  echo "Python HTTP server failed to start" >&2
  exit 1
fi