#!/bin/bash
set -e

# Configure AWS region
export AWS_DEFAULT_REGION="${region}"

# Update system packages
yum update -y

# Install required packages
yum install -y httpd aws-cli jq

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
cat > /var/www/html/health <<'EOF'
OK
EOF

# Create index page with region info
cat > /var/www/html/index.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>Transaction Processing - ${region}</title>
</head>
<body>
    <h1>Transaction Processing Application</h1>
    <p>Region: ${region}</p>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF

# Configure CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent

# Create CloudWatch agent configuration
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "root"
  },
  "metrics": {
    "namespace": "TransactionProcessing",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["disk_used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Log startup completion
echo "User data script completed successfully in region ${region}" | logger
