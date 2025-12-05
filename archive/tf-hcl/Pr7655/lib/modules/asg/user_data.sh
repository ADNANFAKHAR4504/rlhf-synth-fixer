#!/bin/bash
set -e

# Update system
yum update -y

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Create application directory
mkdir -p /opt/app
cd /opt/app

# Create a simple health check endpoint
cat > /opt/app/health-check.sh << 'EOF'
#!/bin/bash
while true; do
  echo -e "HTTP/1.1 200 OK\n\nOK" | nc -l -p 8080 -q 1
done
EOF
chmod +x /opt/app/health-check.sh

# Create systemd service for health check
cat > /etc/systemd/system/health-check.service << EOF
[Unit]
Description=Health Check Service
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/app
ExecStart=/opt/app/health-check.sh
Restart=always

[Install]
WantedBy=multi-user.target
EOF

# Start health check service
systemctl daemon-reload
systemctl start health-check.service
systemctl enable health-check.service

# Log environment info
echo "Environment: ${environment}" > /opt/app/env.txt
echo "DB Endpoint: ${db_endpoint}" >> /opt/app/env.txt
