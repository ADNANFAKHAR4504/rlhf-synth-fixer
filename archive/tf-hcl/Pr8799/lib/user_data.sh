#!/bin/bash
set -e

# Update system
yum update -y

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Install application dependencies
yum install -y java-11-amazon-corretto postgresql15

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/application.log",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "{instance_id}/application.log",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "PaymentProcessing",
    "metrics_collected": {
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MemoryUtilization",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DiskUtilization",
            "unit": "Percent"
          }
        ],
        "metrics_collection_interval": 60,
        "resources": [
          "/"
        ]
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
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Create application directory
mkdir -p /opt/payment-app

# Create application health check endpoint
cat > /opt/payment-app/health.sh <<'HEALTHEOF'
#!/bin/bash
echo "HTTP/1.1 200 OK"
echo "Content-Type: application/json"
echo ""
echo '{"status":"healthy","timestamp":"'$(date -Iseconds)'"}'
HEALTHEOF
chmod +x /opt/payment-app/health.sh

# Simple HTTP server for health checks
cat > /opt/payment-app/server.sh <<'SERVEREOF'
#!/bin/bash
while true; do
  echo -e "HTTP/1.1 200 OK\r\nContent-Type: application/json\r\n\r\n{\"status\":\"healthy\"}" | nc -l -p 8080 -q 1
done
SERVEREOF
chmod +x /opt/payment-app/server.sh

# Create systemd service
cat > /etc/systemd/system/payment-app.service <<'SERVICEEOF'
[Unit]
Description=Payment Processing Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/payment-app
ExecStart=/opt/payment-app/server.sh
Restart=always

[Install]
WantedBy=multi-user.target
SERVICEEOF

# Enable and start service
systemctl daemon-reload
systemctl enable payment-app
systemctl start payment-app

# Store database connection info (for future application deployment)
cat > /opt/payment-app/db-config.json <<EOF
{
  "db_endpoint": "${db_endpoint}",
  "db_name": "${db_name}",
  "region": "${region}"
}
EOF

# Log completion
echo "User data script completed successfully" >> /var/log/user-data.log
