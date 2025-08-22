#!/bin/bash
# User Data Script for EC2 - Secure Production Environment
# Logs all actions to CloudWatch

set -e

# Update system and log to CloudWatch
logger "[USER DATA] Starting system update"
yum update -y
logger "[USER DATA] System update complete"

# Install CloudWatch agent and log
logger "[USER DATA] Installing CloudWatch agent"
yum install -y amazon-cloudwatch-agent
logger "[USER DATA] CloudWatch agent installed"

# Install Apache and log
logger "[USER DATA] Installing Apache (httpd)"
yum install -y httpd
logger "[USER DATA] Apache installed"

# Start and enable services, log actions
logger "[USER DATA] Starting and enabling Apache service"
systemctl start httpd
systemctl enable httpd
logger "[USER DATA] Apache service started and enabled"

# Create a simple index page and log
logger "[USER DATA] Creating index.html"
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Secure Production Environment</title>
</head>
<body>
    <h1>Welcome to Secure Production Environment</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Timestamp: $(date)</p>
</body>
</html>
EOF
logger "[USER DATA] index.html created"

# Configure CloudWatch agent (example config)
logger "[USER DATA] Configuring CloudWatch agent"
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/messages",
                        "log_group_name": "/aws/ec2/secure-production",
                        "log_stream_name": "{instance_id}"
                    },
                    {
                        "file_path": "/var/log/cloud-init.log",
                        "log_group_name": "/aws/ec2/secure-production",
                        "log_stream_name": "cloud-init-{instance_id}"
                    }
                ]
            }
        }
    }
}
EOF
logger "[USER DATA] CloudWatch agent configuration created"

# Start CloudWatch agent and log
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s
logger "[USER DATA] CloudWatch agent started"

logger "[USER DATA] User data script completed"
