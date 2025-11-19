#!/bin/bash
set -euo pipefail

# Worker tier user data script
ENVIRONMENT="${environment}"
ENVIRONMENT_SUFFIX="${environment_suffix}"
REGION="${region}"

# Update system
yum update -y

# Install worker runtime
yum install -y docker python3 pip3
systemctl enable docker
systemctl start docker

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Worker startup script placeholder
cat > /usr/local/bin/start-worker.sh <<'EOF'
#!/bin/bash
# Start worker containers
docker run -d --name worker your-worker:latest
EOF

chmod +x /usr/local/bin/start-worker.sh

echo "Worker tier initialized successfully"