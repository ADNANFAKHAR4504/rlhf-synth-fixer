#!/bin/bash

# User Data Script for Web Servers
set -e

# Variables from Terraform
ENVIRONMENT="${environment}"
PROJECT_NAME="${project_name}"
APP_PORT="${app_port}"
SECRETS_ARN="${secrets_arn}"

# Update system
yum update -y

# Install required packages
yum install -y \
    amazon-cloudwatch-agent \
    aws-cli \
    docker \
    git \
    htop \
    jq \
    nginx \
    python3 \
    ${additional_packages}

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
${cloudwatch_config}
EOF

# Start and enable services
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent
systemctl enable docker
systemctl start docker
systemctl enable nginx
systemctl start nginx

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Create application directory
mkdir -p /opt/app
chown ec2-user:ec2-user /opt/app

# Configure nginx
cat > /etc/nginx/conf.d/app.conf << EOF
upstream app {
    server localhost:$APP_PORT;
}

server {
    listen 80;
    server_name _;

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }

    location / {
        proxy_pass http://app;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Remove default nginx configuration
rm -f /etc/nginx/conf.d/default.conf

# Test nginx configuration and restart
nginx -t && systemctl restart nginx

# Retrieve secrets if configured
if [ ! -z "$SECRETS_ARN" ]; then
    echo "Retrieving secrets from AWS Secrets Manager..."
    aws secretsmanager get-secret-value \
        --secret-id "$SECRETS_ARN" \
        --region $(curl -s http://169.254.169.254/latest/meta-data/placement/region) \
        --query SecretString \
        --output text > /opt/app/.env
    
    chown ec2-user:ec2-user /opt/app/.env
    chmod 600 /opt/app/.env
fi

# Create a simple health check application
cat > /opt/app/health_server.py << 'EOF'
#!/usr/bin/env python3
import http.server
import socketserver
import json
import os
from datetime import datetime

class HealthHandler(http.server.SimpleHTTPRequestHandler):
    def do_GET(self):
        if self.path == '/health':
            self.send_response(200)
            self.send_header('Content-type', 'application/json')
            self.end_headers()
            
            health_data = {
                'status': 'healthy',
                'timestamp': datetime.now().isoformat(),
                'environment': os.environ.get('ENVIRONMENT', 'unknown'),
                'project': os.environ.get('PROJECT_NAME', 'unknown'),
                'instance_id': self.get_instance_id()
            }
            
            self.wfile.write(json.dumps(health_data).encode())
        else:
            super().do_GET()
    
    def get_instance_id(self):
        try:
            import urllib.request
            response = urllib.request.urlopen('http://169.254.169.254/latest/meta-data/instance-id')
            return response.read().decode()
        except:
            return 'unknown'

if __name__ == "__main__":
    PORT = int(os.environ.get('APP_PORT', 8080))
    with socketserver.TCPServer(("", PORT), HealthHandler) as httpd:
        print(f"Health server running on port {PORT}")
        httpd.serve_forever()
EOF

# Make health server executable
chmod +x /opt/app/health_server.py

# Create systemd service for health server
cat > /etc/systemd/system/health-server.service << EOF
[Unit]
Description=Health Check Server
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/app
Environment=ENVIRONMENT=$ENVIRONMENT
Environment=PROJECT_NAME=$PROJECT_NAME
Environment=APP_PORT=$APP_PORT
ExecStart=/usr/bin/python3 /opt/app/health_server.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Start and enable health server
systemctl daemon-reload
systemctl enable health-server
systemctl start health-server

# Signal completion
/opt/aws/bin/cfn-signal -e $? --stack $${AWS::StackName} --resource AutoScalingGroup --region $${AWS::Region} || true

echo "User data script completed successfully"