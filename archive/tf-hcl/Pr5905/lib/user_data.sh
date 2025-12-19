#!/bin/bash
set -e

# Update system
yum update -y

# Install Docker
amazon-linux-extras install docker -y
systemctl start docker
systemctl enable docker

# Install CloudWatch Agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
./aws/install

# Set environment variables
export ENVIRONMENT="${environment}"
export ENVIRONMENT_SUFFIX="${environment_suffix}"
export S3_BUCKET="${s3_bucket}"
export APP_VERSION="${app_version}"
export DB_PROXY_ENDPOINT="${db_proxy_endpoint}"
export DB_NAME="${db_name}"
export AWS_REGION="${region}"

# Create application directory
mkdir -p /opt/app

# Download application artifact from S3
aws s3 cp s3://$${S3_BUCKET}/app-$${APP_VERSION}.tar.gz /opt/app/app.tar.gz
cd /opt/app
tar -xzf app.tar.gz

# Configure environment file for application
cat > /opt/app/.env <<EOF
ENVIRONMENT=$${ENVIRONMENT}
APP_VERSION=$${APP_VERSION}
DB_HOST=$${DB_PROXY_ENDPOINT}
DB_NAME=$${DB_NAME}
DB_PORT=3306
AWS_REGION=$${AWS_REGION}
EOF

# Pull Docker image or build from Dockerfile
if [ -f /opt/app/Dockerfile ]; then
  docker build -t myapp:$${APP_VERSION} /opt/app/
else
  # Assume pre-built image in ECR or Docker Hub
  docker pull myapp:$${APP_VERSION} || true
fi

# Run Docker container
docker run -d \
  --name myapp \
  --restart always \
  -p 8080:8080 \
  --env-file /opt/app/.env \
  myapp:$${APP_VERSION}

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/$${ENVIRONMENT}",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "CustomApp/$${ENVIRONMENT}",
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

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Health check endpoint
mkdir -p /var/www/html
cat > /var/www/html/health.html <<EOF
<!DOCTYPE html>
<html>
<head><title>Health Check</title></head>
<body>
<h1>OK - $${ENVIRONMENT} - $${APP_VERSION}</h1>
</body>
</html>
EOF

# Simple HTTP server for health checks on port 8080
yum install -y python3
cd /var/www/html
nohup python3 -m http.server 8080 &

echo "User data execution completed successfully for $${ENVIRONMENT} environment"
