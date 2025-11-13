#!/bin/bash
set -e

# Update system packages
dnf update -y

# Install required packages
dnf install -y \
    amazon-cloudwatch-agent \
    aws-cli \
    docker \
    git \
    mysql

# Start and enable Docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -aG docker ec2-user

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/ecommerce-${region}",
            "log_stream_name": "{instance_id}/messages"
          },
          {
            "file_path": "/var/log/application.log",
            "log_group_name": "/aws/ec2/ecommerce-${region}",
            "log_stream_name": "{instance_id}/application"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "ECommerce/Application",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {"name": "mem_used_percent"}
        ]
      },
      "disk": {
        "measurement": [
          {"name": "disk_used_percent"}
        ]
      }
    }
  }
}
EOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Create application directory
mkdir -p /opt/app
cd /opt/app

# Create a simple health check endpoint
cat > /opt/app/health-server.py <<'PYTHON'
from http.server import HTTPServer, BaseHTTPRequestHandler
import json

class HealthCheckHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            response = {'status': 'healthy', 'service': 'ecommerce'}
            self.wfile.write(json.dumps(response).encode())
        else:
            self.send_response(404)
            self.end_headers()

    def log_message(self, format, *args):
        # Log to application log file
        with open('/var/log/application.log', 'a') as f:
            f.write(f"{self.address_string()} - [{self.log_date_time_string()}] {format%args}\n")

if __name__ == '__main__':
    server = HTTPServer(('0.0.0.0', 80), HealthCheckHandler)
    print('Starting health check server on port 80...')
    server.serve_forever()
PYTHON

# Install Python (AL2023 comes with Python 3.9)
dnf install -y python3-pip

# Create systemd service for health check
cat > /etc/systemd/system/health-server.service <<EOF
[Unit]
Description=Health Check Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/app
ExecStart=/usr/bin/python3 /opt/app/health-server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start the health check service
systemctl daemon-reload
systemctl start health-server
systemctl enable health-server

# Log successful initialization
echo "User data script completed successfully" >> /var/log/user-data.log
