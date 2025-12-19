#!/bin/bash
yum update -y
yum install -y httpd mysql

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple web page
cat <<EOF > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Web Application</title>
</head>
<body>
    <h1>High Availability Web Application</h1>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
    <p>Database Endpoint: ${db_endpoint}</p>
    <p>Timestamp: $(date)</p>
</body>
</html>
EOF

# Configure CloudWatch agent (optional)
yum install -y amazon-cloudwatch-agent