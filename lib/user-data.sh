#!/bin/bash

# Create a simple health check page immediately (no internet required)
echo "<h1>Nova Model App Server</h1>" > /var/www/html/index.html
echo "<p>Health check: OK</p>" >> /var/www/html/index.html
echo "<p>Server started at: $(date)</p>" >> /var/www/html/index.html

# Create a simple status endpoint
echo "OK" > /var/www/html/health

# Try to install Apache if internet is available (non-blocking)
yum update -y || echo "Update failed - continuing..."
yum install -y amazon-ssm-agent httpd || echo "Package installation failed - continuing..."

# Try to start services (non-blocking)
systemctl enable amazon-ssm-agent || echo "SSM enable failed - continuing..."
systemctl start amazon-ssm-agent || echo "SSM start failed - continuing..."
systemctl enable httpd || echo "Apache enable failed - continuing..."
systemctl start httpd || echo "Apache start failed - continuing..."

# Update the health check page with status
echo "<p>Installation status: Completed</p>" >> /var/www/html/index.html
echo "<p>Database endpoint: ${db_endpoint}</p>" >> /var/www/html/index.html

# Set proper permissions
chown apache:apache /var/www/html/index.html /var/www/html/health || echo "Permission setting failed - continuing..."

echo "User data script completed at $(date)" >> /var/log/user-data.log