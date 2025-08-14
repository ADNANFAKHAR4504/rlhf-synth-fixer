#!/bin/bash

# Create a simple health check page immediately (no internet required)
echo "<h1>Nova Model App Server</h1>" > /var/www/html/index.html
echo "<p>Health check: OK</p>" >> /var/www/html/index.html
echo "<p>Server started at: $(date)</p>" >> /var/www/html/index.html

# Install and configure Apache (this requires internet via NAT Gateway)
yum update -y
yum install -y amazon-ssm-agent httpd

# Enable and start services
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent
systemctl enable httpd
systemctl start httpd

# Update the health check page with database info
echo "<p>Database endpoint: ${db_endpoint}</p>" >> /var/www/html/index.html
echo "<p>Apache installed and running</p>" >> /var/www/html/index.html

# Set proper permissions
chown apache:apache /var/www/html/index.html

# Create a simple status endpoint
echo "OK" > /var/www/html/health
chown apache:apache /var/www/html/health

echo "User data script completed at $(date)" >> /var/log/user-data.log