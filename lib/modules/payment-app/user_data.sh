#!/bin/bash
# User data script for EC2 instances
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting User Data Script..."

# 2. Update system
yum update -y

# 3. Install packages 
amazon-linux-extras enable postgresql14
amazon-linux-extras enable nginx1
yum clean metadata
yum install -y postgresql nginx amazon-cloudwatch-agent

# 4. Configure CloudWatch agent (Your config)
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
  -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# 5. Configure Nginx
cat > /etc/nginx/conf.d/payment-app.conf << EOF
server {
    listen 80 default_server;
    server_name _;
    
    location /health {
        access_log off;
        return 200 "healthy\n";
        add_header Content-Type text/plain;
    }
    
    location / {
        # Serve a static page to prove the server is working
        return 200 "<h1>Welcome to Payment App (${environment})</h1><p>DB Endpoint: ${db_endpoint}</p>";
        add_header Content-Type text/html;
    }
}
EOF

# Remove default config to prevent conflicts
rm -f /etc/nginx/conf.d/default.conf

# 6. Start Nginx
systemctl enable nginx
systemctl restart nginx

# 7. Store DB info
cat > /etc/payment-app/db.conf << EOF
DB_ENDPOINT=${db_endpoint}
DB_NAME=${db_name}
ENVIRONMENT=${environment}
EOF

echo "User Data Script Completed Successfully"