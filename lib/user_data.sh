#!/bin/bash

# user_data.sh - Bootstrap script for EC2 instances
# This script is executed when EC2 instances are launched

set -e

# Variables passed from Terraform
ENVIRONMENT="${environment}"
REGION="${region}"
BUCKET_NAME="${bucket_name}"

# System updates and basic packages
yum update -y
yum install -y httpd aws-cli htop

# Install CloudWatch agent
wget https://amazoncloudwatch-agent.s3.amazonaws.com/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "tap-${environment}-httpd-access",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 7
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "tap-${environment}-httpd-error",
            "log_stream_name": "{instance_id}",
            "retention_in_days": 7
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "CWAgent",
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

# Create a simple index.html page
mkdir -p /var/www/html
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>TAP Application - ${environment}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        .header { color: #333; border-bottom: 2px solid #007EC7; padding-bottom: 10px; }
        .info { background: #e7f3ff; padding: 15px; margin: 20px 0; border-radius: 4px; border-left: 4px solid #007EC7; }
        .status { color: #28a745; font-weight: bold; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">TAP Application</h1>
        <div class="info">
            <h3>Instance Information</h3>
            <p><strong>Environment:</strong> ${environment}</p>
            <p><strong>Region:</strong> ${region}</p>
            <p><strong>Instance ID:</strong> <span id="instance-id">Loading...</span></p>
            <p><strong>Availability Zone:</strong> <span id="az">Loading...</span></p>
            <p><strong>Private IP:</strong> <span id="private-ip">Loading...</span></p>
            <p><strong>S3 Bucket:</strong> ${bucket_name}</p>
            <p><strong>Status:</strong> <span class="status">Running</span></p>
        </div>
        
        <h3>Health Check</h3>
        <p>This instance is healthy and ready to serve traffic.</p>
        
        <h3>Features</h3>
        <ul>
            <li>Multi-region deployment</li>
            <li>Auto Scaling Group management</li>
            <li>Load Balancer integration</li>
            <li>S3 cross-region replication</li>
            <li>CloudWatch monitoring</li>
        </ul>
    </div>
    
    <script>
        // Fetch instance metadata
        fetch('http://169.254.169.254/latest/meta-data/instance-id')
            .then(response => response.text())
            .then(data => document.getElementById('instance-id').textContent = data)
            .catch(error => document.getElementById('instance-id').textContent = 'Unable to fetch');
            
        fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
            .then(response => response.text())
            .then(data => document.getElementById('az').textContent = data)
            .catch(error => document.getElementById('az').textContent = 'Unable to fetch');
            
        fetch('http://169.254.169.254/latest/meta-data/local-ipv4')
            .then(response => response.text())
            .then(data => document.getElementById('private-ip').textContent = data)
            .catch(error => document.getElementById('private-ip').textContent = 'Unable to fetch');
    </script>
</body>
</html>
EOF

# Create a health check endpoint
cat > /var/www/html/health << EOF
OK
EOF

# Configure httpd
systemctl start httpd
systemctl enable httpd

# Configure CloudWatch agent and start it
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Log successful completion
echo "$(date): User data script completed successfully" >> /var/log/user-data.log
echo "Environment: ${environment}" >> /var/log/user-data.log
echo "Region: ${region}" >> /var/log/user-data.log
echo "Bucket: ${bucket_name}" >> /var/log/user-data.log

# Create a test file in S3 bucket
echo "Hello from instance $(curl -s http://169.254.169.254/latest/meta-data/instance-id) in ${region}" > /tmp/instance-info.txt
aws s3 cp /tmp/instance-info.txt s3://${bucket_name}/instances/$(curl -s http://169.254.169.254/latest/meta-data/instance-id).txt || echo "Failed to upload to S3"

# Signal that the instance is ready
/opt/aws/bin/cfn-signal -e $? --stack ${environment} --resource AutoScalingGroup --region ${region} || echo "CFN signal not available"
