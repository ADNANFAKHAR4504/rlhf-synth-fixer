#!/bin/bash
yum update -y
yum install -y awslogs

# Configure CloudWatch Logs agent
cat > /etc/awslogs/awslogs.conf << EOF
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/messages]
file = /var/log/messages
log_group_name = ${log_group_name}
log_stream_name = {instance_id}/var/log/messages
datetime_format = %b %d %H:%M:%S

[/var/log/secure]
file = /var/log/secure
log_group_name = ${log_group_name}
log_stream_name = {instance_id}/var/log/secure
datetime_format = %b %d %H:%M:%S
EOF

# Start CloudWatch Logs agent
systemctl start awslogsd
systemctl enable awslogsd

# Install and start Apache
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html