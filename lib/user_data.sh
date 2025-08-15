#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple health check endpoint
cat > /var/www/html/health <<EOF
OK
EOF

# Create a simple index page
cat > /var/www/html/index.html <<EOF
<!DOCTYPE html>
<html>
<head>
    <title>${app_name} - ${environment}</title>
</head>
<body>
    <h1>Welcome to ${app_name}</h1>
    <p>Environment: ${environment}</p>
    <p>Server Time: $(date)</p>
    <p>Instance ID: $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</p>
</body>
</html>
EOF

systemctl restart httpd