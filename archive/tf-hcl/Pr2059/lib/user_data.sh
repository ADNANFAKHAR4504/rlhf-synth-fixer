#!/bin/bash
# User data script for EC2 instances

# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Install nginx
amazon-linux-extras install nginx1 -y

# Create CloudWatch agent configuration
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/nginx/access.log",
                        "log_group_name": "${log_group_name}",
                        "log_stream_name": "{instance_id}/nginx/access.log"
                    },
                    {
                        "file_path": "/var/log/nginx/error.log",
                        "log_group_name": "${log_group_name}",
                        "log_stream_name": "{instance_id}/nginx/error.log"
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
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a start -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Retrieve application configuration from Parameter Store
APP_ENVIRONMENT=$(aws ssm get-parameter --name "${parameter_path}/app/environment" --query 'Parameter.Value' --output text --region $(curl -s http://169.254.169.254/latest/meta-data/placement/region))
LOG_LEVEL=$(aws ssm get-parameter --name "${parameter_path}/app/log_level" --query 'Parameter.Value' --output text --region $(curl -s http://169.254.169.254/latest/meta-data/placement/region))

# Create a simple web application
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Web Application - ${parameter_path}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { background: #e8f5e8; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Web Application Dashboard</h1>
        <div class="status">
            <h2>System Status: ✅ Online</h2>
            <p><strong>Environment:</strong> $APP_ENVIRONMENT</p>
            <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            <p><strong>Log Level:</strong> $LOG_LEVEL</p>
            <p><strong>Deployment Time:</strong> $(date)</p>
        </div>
        <h2>Application Features</h2>
        <ul>
            <li>Auto Scaling Group with minimum 2 instances</li>
            <li>Application Load Balancer with HTTPS support</li>
            <li>PostgreSQL RDS database with automatic backups</li>
            <li>CloudWatch monitoring and logging</li>
            <li>Secure configuration via AWS Parameter Store</li>
            <li>Multi-AZ deployment for high availability</li>
        </ul>
    </div>
</body>
</html>
EOF

# Configure nginx
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

        location / {
            index index.html index.htm;
        }

        location /health {
            access_log off;
            return 200 "healthy\n";
            add_header Content-Type text/plain;
        }
    }
}
EOF

# Start and enable nginx
systemctl start nginx
systemctl enable nginx

# Create log directories if they don't exist
mkdir -p /var/log/nginx
chown nginx:nginx /var/log/nginx

# Log startup completion
echo "$(date): User data script completed successfully" >> /var/log/user-data.log
