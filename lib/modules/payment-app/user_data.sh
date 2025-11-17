#!/bin/bash
# User data script for EC2 instances

# Update system
yum update -y

# Install necessary packages
yum install -y postgresql15 nginx amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "namespace": "${environment}-payment-app",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          "cpu_usage_iowait"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Configure nginx as a simple web server for health checks
cat > /etc/nginx/conf.d/default.conf << EOF
server {
    listen 80;
    server_name _;
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

# Start nginx
systemctl enable nginx
systemctl start nginx

# Store database connection info (for application use)
cat > /etc/payment-app/db.conf << EOF
DB_ENDPOINT=${db_endpoint}
DB_NAME=${db_name}
ENVIRONMENT=${environment}
EOF

# Log the initialization
echo "EC2 instance initialized for ${environment} environment" >> /var/log/payment-app.log