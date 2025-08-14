#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent httpd

# Enable and start services
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
systemctl enable httpd
systemctl start httpd

# Create a simple health check page
echo "<h1>Nova Model App Server</h1>" > /var/www/html/index.html
echo "<p>Database endpoint: ${db_endpoint}</p>" >> /var/www/html/index.html
echo "<p>Health check: OK</p>" >> /var/www/html/index.html

# Set proper permissions
chown apache:apache /var/www/html/index.html