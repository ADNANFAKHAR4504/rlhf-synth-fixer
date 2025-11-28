#!/bin/bash
yum update -y
yum install -y httpd

systemctl start httpd
systemctl enable httpd

# Create health check endpoint
cat > /var/www/html/health <<HEALTHEOF
{
  "status": "healthy",
  "region": "${region}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
HEALTHEOF

# Create index page
cat > /var/www/html/index.html <<INDEXEOF
<html>
<head><title>Multi-Region DR Application</title></head>
<body>
<h1>Transaction Processing Application</h1>
<p>Region: ${region}</p>
<p>Status: Active</p>
</body>
</html>
INDEXEOF

chmod 644 /var/www/html/health /var/www/html/index.html
