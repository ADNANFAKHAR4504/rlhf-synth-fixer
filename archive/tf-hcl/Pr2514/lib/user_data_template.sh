#!/bin/bash

# User Data Script for Web Servers
# This script runs when EC2 instances launch

# Variables from Terraform
DB_SECRET_ARN="${db_secret_arn}"
S3_BUCKET_NAME="${s3_bucket_name}"
CLOUDFRONT_URL="${cloudfront_url}"
PROJECT_NAME="${project_name}"
ENVIRONMENT="${environment}"
AWS_REGION="${aws_region}"
LOG_GROUP_NAME="${log_group_name}"

# Update system
yum update -y

# Install required packages
yum install -y \
    nginx \
    awscli \
    jq \
    mysql \
    htop \
    wget \
    curl \
    unzip

# Install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create application directory
mkdir -p /var/www/html
mkdir -p /var/log/webapp
chown nginx:nginx /var/www/html
chown nginx:nginx /var/log/webapp

# Configure Nginx
cat > /etc/nginx/nginx.conf << 'EOF'
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log;
pid /run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    server {
        listen 80 default_server;
        listen [::]:80 default_server;
        server_name _;
        root /var/www/html;

        # Health check endpoint
        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }

        # Main application
        location / {
            try_files $uri $uri/ /index.html;
        }

        # API endpoints
        location /api/ {
            return 200 "API endpoint\n";
            add_header Content-Type text/plain;
        }

        # Static assets from S3/CloudFront
        location /static/ {
            return 301 https://${cloudfront_url}$request_uri;
        }

        error_page 404 /404.html;
        location = /404.html {
            root /var/www/html;
        }

        error_page 500 502 503 504 /50x.html;
        location = /50x.html {
            root /var/www/html;
        }
    }
}
EOF

# Create a simple index.html
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>${project_name} - ${environment}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #e8f5e8; padding: 20px; border-radius: 5px; }
        .info { background: #e8f4fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>${project_name} - ${environment}</h1>
        <div class="status">
            <h2>✅ Application is running!</h2>
            <p>Your web application infrastructure has been successfully deployed.</p>
        </div>

        <div class="info">
            <h3>Infrastructure Details:</h3>
            <ul>
                <li><strong>Environment:</strong> ${environment}</li>
                <li><strong>Region:</strong> ${aws_region}</li>
                <li><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></li>
                <li><strong>S3 Bucket:</strong> ${s3_bucket_name}</li>
                <li><strong>CloudFront URL:</strong> <a href="https://${cloudfront_url}">https://${cloudfront_url}</a></li>
            </ul>
        </div>

        <div class="info">
            <h3>Available Endpoints:</h3>
            <ul>
                <li><code>/health</code> - Health check endpoint</li>
                <li><code>/api/</code> - API endpoints</li>
                <li><code>/static/</code> - Static assets (redirects to CloudFront)</li>
            </ul>
        </div>
    </div>

    <script>
        // Get instance metadata
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => {
                document.getElementById('instance-id').textContent = data;
            })
            .catch(error => {
                document.getElementById('instance-id').textContent = 'Unable to fetch';
            });
    </script>
</body>
</html>
EOF

# Set proper permissions
chown -R nginx:nginx /var/www/html
chmod -R 755 /var/www/html

# Start and enable Nginx
systemctl start nginx
systemctl enable nginx

# Create application log
echo "$(date): Web server initialization completed" >> /var/log/webapp/app.log
echo "$(date): Project: ${project_name}, Environment: ${environment}" >> /var/log/webapp/app.log
echo "$(date): S3 Bucket: ${s3_bucket_name}" >> /var/log/webapp/app.log
echo "$(date): CloudFront: ${cloudfront_url}" >> /var/log/webapp/app.log

# Final log entry
echo "$(date): User data script completed successfully" >> /var/log/webapp/app.log