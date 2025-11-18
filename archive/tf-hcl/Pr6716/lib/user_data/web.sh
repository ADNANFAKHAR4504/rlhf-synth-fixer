#!/bin/bash
set -euo pipefail

# Web tier user data script
ENVIRONMENT="${environment}"
ENVIRONMENT_SUFFIX="${environment_suffix}"
REGION="${region}"

# Update system
yum update -y

# Install web server
yum install -y nginx

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure nginx
cat > /etc/nginx/conf.d/app.conf <<EOF
upstream backend {
    server localhost:8080;
}

server {
    listen 80;
    server_name _;

    location / {
        proxy_pass http://backend;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
    }

    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
}
EOF

# Start nginx
systemctl enable nginx
systemctl start nginx

echo "Web tier initialized successfully"