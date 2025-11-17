#!/bin/bash
yum update -y
yum install -y httpd

# Start Apache
systemctl start httpd
systemctl enable httpd

# Create a simple health check endpoint
cat <<EOF > /var/www/html/health
OK
EOF

# Create a simple index page
cat <<EOF > /var/www/html/index.html
<html>
<head><title>Environment: ${environment}</title></head>
<body>
<h1>Welcome to ${environment} environment</h1>
<p>Instance ID: $(ec2-metadata --instance-id | cut -d " " -f 2)</p>
<p>Availability Zone: $(ec2-metadata --availability-zone | cut -d " " -f 2)</p>
</body>
</html>
EOF