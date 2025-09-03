#!/bin/bash
set -e

# Update system packages
yum update -y

# Install required packages
yum install -y amazon-cloudwatch-agent nginx

# Start and enable nginx
systemctl start nginx
systemctl enable nginx

# Create a simple health check endpoint
cat > /var/www/html/health << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <h1>OK</h1>
    <p>Server is healthy</p>
    <p>Environment: ${environment}</p>
    <p>Project: ${project}</p>
</body>
</html>
EOF

# Create a simple index page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Welcome</title>
</head>
<body>
    <h1>Welcome to ${project}</h1>
    <p>Environment: ${environment}</p>
    <p>Server is running successfully!</p>
</body>
</html>
EOF

# Set proper permissions
chown -R nginx:nginx /var/www/html/
chmod -R 755 /var/www/html/

# Configure nginx to ensure it's working properly
cat > /etc/nginx/conf.d/default.conf << 'EOF'
server {
    listen 80;
    server_name _;
    root /var/www/html;
    index index.html;

    location / {
        try_files $uri $uri/ =404;
    }

    location /health {
        access_log off;
        return 200 "OK";
        add_header Content-Type text/plain;
    }
}
EOF

# Test nginx configuration and reload
nginx -t && systemctl reload nginx

# Configure CloudWatch agent
mkdir -p /opt/aws/amazon-cloudwatch-agent/etc/
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "metrics": {
        "namespace": "${project}/${environment}",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60
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
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Verify nginx is running
systemctl status nginx

# Test health endpoint locally
curl -f http://localhost/health || exit 1

echo "User data script completed successfully"
