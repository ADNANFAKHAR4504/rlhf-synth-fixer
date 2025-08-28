#!/bin/bash
yum update -y
yum install -y httpd

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple HTML page with region information
echo "<h1>Apache is running on $(hostname -f)</h1>" > /var/www/html/index.html

# Set proper permissions
chown apache:apache /var/www/html/index.html
chmod 644 /var/www/html/index.html