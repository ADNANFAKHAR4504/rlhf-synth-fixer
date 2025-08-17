#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Install basic web server
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple health check endpoint
cat > /var/www/html/health <<EOF
OK
EOF

# Create a simple index page
cat > /var/www/html/index.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>TAP App - ${timestamp}</title>
</head>
<body>
    <h1>TAP Application</h1>
    <p>Instance launched at: ${timestamp}</p>
    <p>Environment: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
</body>
</html>
EOF

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json <<EOF
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${ec2_log_group_name}",
                        "log_stream_name": "{instance_id}/httpd/access_log"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${ec2_log_group_name}",
                        "log_stream_name": "{instance_id}/httpd/error_log"
                    }
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
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Ensure httpd is running
systemctl restart httpd