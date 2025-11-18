#!/bin/bash
set -euo pipefail

# Application tier user data script
ENVIRONMENT="${environment}"
ENVIRONMENT_SUFFIX="${environment_suffix}"
REGION="${region}"

# Update system
yum update -y

# Install application runtime
yum install -y docker
systemctl enable docker
systemctl start docker

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Application startup script placeholder
cat > /usr/local/bin/start-app.sh <<'EOF'
#!/bin/bash
# Start application containers
docker run -d --name app -p 8080:8080 your-app:latest
EOF

chmod +x /usr/local/bin/start-app.sh

echo "Application tier initialized successfully"