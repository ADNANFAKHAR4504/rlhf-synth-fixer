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

# --- Install AWS CLI + jq (+ netcat for TCP probe) ---
if [ "$PM" = "apt" ]; then
  DEBIAN_FRONTEND=noninteractive apt-get install -y awscli jq netcat || true
else
  $PM install awscli jq nmap-ncat || true
fi

# Ensure SSM agent is running
systemctl enable amazon-ssm-agent || true
systemctl start amazon-ssm-agent || true

# --- Detect region via IMDSv2 and export for awscli ---
TOKEN="$(curl -sS -X PUT -H 'X-aws-ec2-metadata-token-ttl-seconds: 60' http://169.254.169.254/latest/api/token || true)"
IIDOC="$(curl -sS -H "X-aws-ec2-metadata-token: ${TOKEN}" http://169.254.169.254/latest/dynamic/instance-identity/document || true)"
REGION="$(printf '%s' "$IIDOC" | python3 - <<'PY' || true
import sys,json
try:
  print(json.load(sys.stdin).get("region",""))
except Exception:
  print("")
PY
)"
export AWS_REGION="${REGION:-us-east-2}"
export AWS_DEFAULT_REGION="$AWS_REGION"
printf 'export AWS_REGION=%s\nexport AWS_DEFAULT_REGION=%s\n' "$AWS_REGION" "$AWS_REGION" >/etc/profile.d/aws_region.sh

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

# --- Helper used by the E2E smoke step (SSM Run Command friendly) ---
install -d -m 0755 /usr/local/bin
cat >/usr/local/bin/e2e-smoke.sh <<'EOSMOKE'
#!/usr/bin/env bash
set -euo pipefail

AWS_REGION="${AWS_REGION:-${AWS_DEFAULT_REGION:-us-east-2}}"

get_param() {
  local name="$1"
  aws ssm get-parameter --name "$name" --query 'Parameter.Value' --output text --region "$AWS_REGION" 2>/dev/null || true
}

ALB_PARAM="/cloud-setup/${ENVIRONMENT:-dev}/alb/http_url"
RDS_PARAM="/cloud-setup/${ENVIRONMENT:-dev}/rds/endpoint"

ALB_URL="$(get_param "$ALB_PARAM")"
RDS_HOST="$(get_param "$RDS_PARAM")"
RDS_PORT="${RDS_PORT:-5432}"

HTTP_CODE="$( (curl -sS -o /dev/null -w '%{http_code}' --max-time 5 "${ALB_URL:-http://127.0.0.1/alb.html}") || echo 0 )"

RDS_OK=0
if [[ -n "${RDS_HOST}" ]]; then
  if command -v nc >/dev/null 2>&1; then
    if nc -z -w 3 "$RDS_HOST" "$RDS_PORT" 2>/dev/null; then RDS_OK=1; fi
  else
    (timeout 3 bash -c "exec 3<>/dev/tcp/${RDS_HOST}/${RDS_PORT}" && RDS_OK=1) || true
  fi
fi

echo "${HTTP_CODE}" > /tmp/code.txt
printf '{"http_code":%s,"rds_count":%s,"alb_url":"%s","rds_host":"%s"}\n' \
  "${HTTP_CODE:-0}" "${RDS_OK}" "${ALB_URL:-}" "${RDS_HOST:-}" > /tmp/e2e.json

echo "http_code=${HTTP_CODE} rds_count=${RDS_OK}"
EOSMOKE
chmod +x /usr/local/bin/e2e-smoke.sh

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
Environment=ENVIRONMENT=$${ENVIRONMENT}
Environment=LOG_LEVEL=$${LOG_LEVEL}
Environment=BUCKET=$${BUCKET}

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
