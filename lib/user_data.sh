#!/bin/bash
set -e

# Set up error logging
exec > >(tee /var/log/user-data.log)
exec 2>&1

echo "Starting user data script execution at $(date)"

# Update system
yum update -y

# Install necessary packages
yum install -y httpd mysql aws-cli

# Start and enable httpd
systemctl start httpd
systemctl enable httpd

# Ensure httpd is running
sleep 10
if ! systemctl is-active --quiet httpd; then
    echo "Apache failed to start, restarting..."
    systemctl restart httpd
    sleep 10
fi

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent
cat <<EOF > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/${project_prefix}",
            "log_stream_name": "{instance_id}/apache-access"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ec2/${project_prefix}",
            "log_stream_name": "{instance_id}/apache-error"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "CustomMetrics",
    "metrics_collected": {
      "cpu": {
        "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Create a simple web page
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Secure Web Application</title>
</head>
<body>
    <h1>Welcome to the Secure Web Application</h1>
    <p>Database Endpoint: ${db_endpoint}</p>
    <p>S3 Bucket: ${s3_bucket}</p>
    <p>This application is protected by AWS WAF and CloudFront.</p>
</body>
</html>
EOF

systemctl restart httpd

echo "User data script completed successfully at $(date)"