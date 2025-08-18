#!/bin/bash
set -e

# User data script for EC2 instance configuration
# This script runs on first boot of the instance

echo "Starting user data script execution..."

# Update system packages
yum update -y

# Install additional packages
yum install -y \
    jq \
    wget \
    curl \
    git \
    unzip \
    python3 \
    python3-pip

# Configure CloudWatch agent for logging
yum install -y amazon-cloudwatch-agent

# Create application directory
mkdir -p /opt/app
chown ec2-user:ec2-user /opt/app

# Function to get IMDSv2 token and metadata
get_metadata() {
    local token=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)
    curl -H "X-aws-ec2-metadata-token: $token" "http://169.254.169.254/latest/meta-data/$1" 2>/dev/null
}

# Set up basic monitoring
cat > /opt/app/health-check.sh << 'EOF'
#!/bin/bash
# Basic health check script
echo "Instance health check - $(date)"

# Get IMDSv2 token
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)

# Get instance metadata using IMDSv2
INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/instance-id" 2>/dev/null)
AZ=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/placement/availability-zone" 2>/dev/null)

echo "Instance ID: $INSTANCE_ID"
echo "Availability Zone: $AZ"
echo "System load: $(uptime)"
echo "Memory usage: $(free -h)"
echo "Disk usage: $(df -h /)"
EOF

chmod +x /opt/app/health-check.sh

# Create a simple web server for health checks (optional)
cat > /opt/app/simple-server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import json
import subprocess
import datetime

PORT = 8080

class HealthCheckHandler(http.server.BaseHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            # Get instance metadata using IMDSv2
            try:
                # Get IMDSv2 token
                token = subprocess.check_output([
                    'curl', '-X', 'PUT', 
                    'http://169.254.169.254/latest/api/token',
                    '-H', 'X-aws-ec2-metadata-token-ttl-seconds: 21600'
                ]).decode().strip()
                
                # Get metadata with token
                instance_id = subprocess.check_output([
                    'curl', '-H', f'X-aws-ec2-metadata-token: {token}',
                    'http://169.254.169.254/latest/meta-data/instance-id'
                ]).decode().strip()
                
                az = subprocess.check_output([
                    'curl', '-H', f'X-aws-ec2-metadata-token: {token}',
                    'http://169.254.169.254/latest/meta-data/placement/availability-zone'
                ]).decode().strip()
            except:
                instance_id = "unknown"
                az = "unknown"
            
            health_data = {
                "status": "healthy",
                "timestamp": datetime.datetime.now().isoformat(),
                "instance_id": instance_id,
                "availability_zone": az,
                "uptime": subprocess.check_output(['uptime']).decode().strip()
            }
            
            self.wfile.write(json.dumps(health_data, indent=2).encode())
        else:
            self.send_response(404)
            self.end_headers()
            self.wfile.write(b"Not Found")

if __name__ == "__main__":
    with socketserver.TCPServer(("", PORT), HealthCheckHandler) as httpd:
        print(f"Server running on port {PORT}")
        httpd.serve_forever()
EOF

chmod +x /opt/app/simple-server.py

# Create systemd service for the simple server
cat > /etc/systemd/system/simple-server.service << EOF
[Unit]
Description=Simple Health Check Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/app
ExecStart=/usr/bin/python3 /opt/app/simple-server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Enable and start the service
systemctl enable simple-server.service
systemctl start simple-server.service

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "agent": {
        "metrics_collection_interval": 60,
        "run_as_user": "cwagent"
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/{instance_id}/messages",
                        "log_stream_name": "{instance_id}",
                        "timezone": "UTC"
                    },
                    {
                        "file_path": "/var/log/secure",
                        "log_group_name": "/aws/ec2/{instance_id}/secure",
                        "log_stream_name": "{instance_id}",
                        "timezone": "UTC"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60,
                "totalcpu": false
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "diskio": {
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            },
            "netstat": {
                "measurement": [
                    "tcp_established",
                    "tcp_time_wait"
                ],
                "metrics_collection_interval": 60
            },
            "swap": {
                "measurement": [
                    "swap_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

# Create a completion marker
echo "User data script completed successfully at $(date)" > /var/log/user-data-complete.log

echo "User data script execution completed."