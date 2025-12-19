#!/bin/bash
set -euxo pipefail

# Log all output for debugging
exec > >(tee /var/log/user-data.log | logger -t user-data -s 2>/dev/console) 2>&1

# Detect package manager
PM=""
if command -v dnf >/dev/null 2>&1; then
  PM="dnf -y"
elif command -v yum >/dev/null 2>&1; then
  PM="yum -y"
elif command -v apt-get >/dev/null 2>&1; then
  PM="apt"
else
  echo "No supported package manager found" >&2
  exit 1
fi

# Install Python 3, curl, lsof (idempotent)
if [ "$PM" = "apt" ]; then
  apt-get update -y
  DEBIAN_FRONTEND=noninteractive apt-get install -y python3 curl lsof amazon-ssm-agent || true
else
  $PM install python3 curl lsof amazon-ssm-agent || true
fi

# Ensure SSM agent is running
systemctl enable amazon-ssm-agent || true
systemctl start amazon-ssm-agent || true

# Log curl version and features for debugging
curl --version > /tmp/curl-version.txt 2>&1 || true
curl --help > /tmp/curl-help.txt 2>&1 || true

# Export environment variables for the Python server (templated by Terraform)
export ENVIRONMENT="${environment}"
export LOG_LEVEL="${log_level}"
export BUCKET="${bucket}"

# Pre-create /alb.html and /code.txt for ALB/SSM tests
echo "ENVIRONMENT=${ENVIRONMENT}" > /tmp/alb.html
echo "200" > /tmp/code.txt

# Write app
install -d -m 0755 /opt/web
cat >/opt/web/web.py <<'EOF'
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
                self.wfile.write(f"{key}={val}\n".encode())
        elif self.path == "/egress.txt":
            self.send_response(200)
            self.send_header("Content-type", "text/plain")
            self.end_headers()
            try:
                ip = urllib.request.urlopen("https://checkip.amazonaws.com", timeout=2).read().decode().strip()
            except Exception:
                ip = "unavailable"
            self.wfile.write(f"{ip}\n".encode())
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
        if self.path in ["/", "/index.html", "/alb.html", "/code.txt", "/egress.txt"]:
            self.send_response(200); self.end_headers()
        else:
            self.send_response(404); self.end_headers()

    def log_message(self, format, *args):
        pass

if __name__ == "__main__":
    HTTPServer(("0.0.0.0", 80), Handler).serve_forever()
EOF

# systemd service for durability
cat >/etc/systemd/system/web.service <<EOF
[Unit]
Description=Tiny HTTP server for ALB healthchecks
After=network-online.target
Wants=network-online.target

[Service]
Type=simple
ExecStart=/usr/bin/python3 /opt/web/web.py
Restart=always
RestartSec=1
Environment=ENVIRONMENT=${ENVIRONMENT}
Environment=LOG_LEVEL=${LOG_LEVEL}
Environment=BUCKET=${BUCKET}

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable web
systemctl start web

# Wait until the service is actually serving before exiting user-data
for i in $(seq 1 30); do
  if curl -fsS --max-time 2 http://127.0.0.1/alb.html >/dev/null; then
    echo "Local HTTP is up"; break
  fi
  echo "Waiting for web service... ($i/30)"
  sleep 2
done

# Final assert (fail the boot if the app didn't come up)
curl -fsS --max-time 2 http://127.0.0.1/alb.html >/dev/null
echo "User-data completed successfully."
