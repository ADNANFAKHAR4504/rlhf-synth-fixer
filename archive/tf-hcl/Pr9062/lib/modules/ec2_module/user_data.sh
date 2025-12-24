#!/bin/bash
# Update package list
apt-get update -y

# Install Apache2
apt-get install -y apache2

# Enable Apache2 to start on boot
systemctl enable apache2

# Start Apache2 service
systemctl start apache2

# Create a basic index.html page
echo "<h1>Apache is running on $(hostname -f)</h1>" > /var/www/html/index.html
