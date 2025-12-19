#!/bin/bash
set -e

# Log everything to help debug
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting user data script at $(date)"

# Wait for network connectivity
echo "Waiting for network connectivity..."
for i in {1..30}; do
    if ping -c 1 8.8.8.8 >/dev/null 2>&1; then
        echo "Network connectivity established"
        break
    fi
    echo "Attempt $i: Waiting for network..."
    sleep 10
done

# Update system
echo "Updating system packages..."
yum update -y

wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install and configure Apache web server
yum install -y httpd
systemctl enable httpd
systemctl start httpd

# Create a simple health check endpoint
cat <<EOF > /var/www/html/health
<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <h1>OK</h1>
    <p>Service is healthy</p>
</body>
</html>
EOF

# Create a simple index page
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Region App</title>
</head>
<body>
    <h1>Welcome to Multi-Region Infrastructure</h1>
    <p>Environment: ${environment}</p>
    <p>Region: ${region}</p>
    <p>Instance ID: \$(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Status: Healthy</p>
</body>
</html>
EOF

# Ensure proper permissions
chown apache:apache /var/www/html/index.html /var/www/html/health
chmod 644 /var/www/html/index.html /var/www/html/health

# Test the health endpoint
echo "Testing health endpoint..."
curl -f http://localhost/health || echo "Health endpoint test failed"

echo "User data script completed at $(date)"

cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "metrics": {
    "namespace": "CustomApp/${environment}",
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
        "resources": [
          "/"
        ]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/${environment}/${region}/system",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a query -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s


