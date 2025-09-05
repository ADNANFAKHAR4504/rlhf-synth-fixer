#!/bin/bash

# Update the system
yum update -y

# Install necessary packages
yum install -y amazon-cloudwatch-agent awscli jq

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
            "log_group_name": "/aws/ec2/${environment}/${region}",
            "log_stream_name": "{instance_id}/messages"
          },
          {
            "file_path": "/var/log/secure",
            "log_group_name": "/aws/ec2/${environment}/${region}",
            "log_stream_name": "{instance_id}/secure"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "${environment}/EC2",
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
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Install and configure a simple web server
yum install -y httpd
systemctl enable httpd
systemctl start httpd

# Create a simple health check endpoint
cat > /var/www/html/health << 'EOF'
{
  "status": "healthy",
  "region": "${region}",
  "environment": "${environment}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "instance_id": "$(curl -s http://169.254.169.254/latest/meta-data/instance-id)"
}
EOF

# Create a simple application page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>${environment} - ${region}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #f0f0f0; padding: 20px; border-radius: 5px; }
        .region { color: #0066cc; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Application Running in <span class="region">${region}</span></h1>
        <p>Environment: <strong>${environment}</strong></p>
        <p>Instance ID: <strong>$(curl -s http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || echo "unknown")</strong></p>
        <p>Timestamp: <strong>$(date)</strong></p>
    </div>
    
    <h2>Application Status</h2>
    <p>✓ Web server is running</p>
    <p>✓ CloudWatch monitoring configured</p>
    <p>✓ Instance is healthy</p>
    
    <h2>Health Check</h2>
    <p><a href="/health">Health Check Endpoint</a></p>
</body>
</html>
EOF

# Set up log rotation
cat > /etc/logrotate.d/application << 'EOF'
/var/log/httpd/*log {
    daily
    rotate 30
    compress
    delaycompress
    missingok
    notifempty
    create 640 apache apache
    postrotate
        /bin/systemctl reload httpd.service > /dev/null 2>/dev/null || true
    endscript
}
EOF

# Retrieve application secrets if needed (example)
# SECRET_VALUE=$(aws secretsmanager get-secret-value --secret-id ${secrets_arn} --region ${region} --query SecretString --output text)

# Ensure httpd starts on boot and is running
systemctl enable httpd
systemctl start httpd

# Create a startup script that runs on every boot
cat > /etc/rc.d/rc.local << 'EOF'
#!/bin/bash
# Ensure services are running
systemctl start httpd
systemctl start amazon-cloudwatch-agent

# Update health check with current timestamp
cat > /var/www/html/health << 'HEALTHEOF'
{
  "status": "healthy",
  "region": "${region}",
  "environment": "${environment}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "instance_id": "$(curl -s http://169.254.169.254/latest/meta-data/instance-id)"
}
HEALTHEOF

exit 0
EOF

chmod +x /etc/rc.d/rc.local

# Signal that the instance is ready (using simple success message)
# Note: In a real deployment, you might want to signal success to ASG via CloudWatch or other means
echo "Instance is ready and healthy" | logger -t user-data

echo "User data script completed successfully" >> /var/log/user-data.log