#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Simple web application
cat << 'EOF' > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>E-commerce Application</title>
</head>
<body>
    <h1>Welcome to E-commerce Platform</h1>
    <p>PCI-DSS Compliant Web Application</p>
    <p>Database Endpoint: ${db_endpoint}</p>
    <p>Server: $(hostname)</p>
</body>
</html>
EOF

# Install CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent