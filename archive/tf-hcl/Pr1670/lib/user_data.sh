#!/bin/bash
yum update -y
yum install -y httpd awslogs

# Configure CloudWatch Logs
cat > /etc/awslogs/awslogs.conf << EOF
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/httpd/access_log]
file = /var/log/httpd/access_log
log_group_name = ${log_group_name}
log_stream_name = {instance_id}/httpd/access_log
datetime_format = %d/%b/%Y:%H:%M:%S %z

[/var/log/httpd/error_log]
file = /var/log/httpd/error_log
log_group_name = ${log_group_name}
log_stream_name = {instance_id}/httpd/error_log
datetime_format = %a %b %d %H:%M:%S %Y
EOF

# Start services
systemctl start httpd
systemctl enable httpd
systemctl start awslogsd
systemctl enable awslogsd

# Create a simple health check endpoint
echo "OK" > /var/www/html/health

# Basic web page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Web Application</title>
</head>
<body>
    <h1>Welcome to the Migrated Web Application</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF