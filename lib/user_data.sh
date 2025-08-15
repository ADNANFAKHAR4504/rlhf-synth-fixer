#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>${project_name}</title>
</head>
<body>
    <h1>Welcome to ${project_name}</h1>
    <p>This is a secure AWS infrastructure deployment.</p>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
    <p>Availability Zone: $(curl -s http://169.254.169.254/latest/meta-data/placement/availability-zone)</p>
</body>
</html>
EOF

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent