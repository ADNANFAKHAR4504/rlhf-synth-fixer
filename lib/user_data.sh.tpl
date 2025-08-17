user_data = base64encode(<<-EOF
#!/bin/bash
yum update -y
yum install -y httpd

# Start web server
systemctl start httpd
systemctl enable httpd

# Create health endpoint
echo "OK" > /var/www/html/health

# Create index page
cat > /var/www/html/index.html <<'HTML'
<!DOCTYPE html>
<html>
<head><title>TAP App - 015246</title></head>
<body>
    <h1>TAP Application</h1>
    <p>Instance launched at: 015246</p>
    <p>Environment: dev</p>
    <p>Status: Running</p>
</body>
</html>
HTML

systemctl restart httpd
EOF
)