#!/bin/bash
# terraform/user_data.sh

yum update -y
yum install -y httpd

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple web page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Region Web App</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .region { background: #f0f0f0; padding: 20px; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Multi-Region Web Application</h1>
        <div class="region">
            <h2>Server Information</h2>
            <p><strong>Region:</strong> ${region}</p>
            <p><strong>Instance ID:</strong> $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
            <p><strong>Availability Zone:</strong> $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
            <p><strong>Timestamp:</strong> $(date)</p>
        </div>
        <div style="margin-top: 20px;">
            <h3>Health Check</h3>
            <p>Status: <span style="color: green;">✓ Healthy</span></p>
        </div>
    </div>
</body>
</html>
EOF

# Set proper permissions
chown apache:apache /var/www/html/index.html
chmod 644 /var/www/html/index.html

# Configure Apache to start on boot
systemctl enable httpd