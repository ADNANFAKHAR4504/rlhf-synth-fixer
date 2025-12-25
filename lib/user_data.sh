#!/bin/bash
# user_data.sh
yum update -y
yum install -y httpd awscli

# Install CloudWatch agent
wget https://s3.${region}.amazonaws.com/amazoncloudwatch-agent-${region}/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Start web server
systemctl start httpd
systemctl enable httpd

# Create a simple web page
echo "<h1>Secure Corp Web Server</h1>" > /var/www/html/index.html
echo "<p>This server follows security best practices:</p>" >> /var/www/html/index.html
echo "<ul>" >> /var/www/html/index.html
echo "<li>Uses approved AMI from trusted source</li>" >> /var/www/html/index.html
echo "<li>Follows least privilege IAM principles</li>" >> /var/www/html/index.html
echo "<li>Security groups allow only HTTP/HTTPS</li>" >> /var/www/html/index.html
echo "<li>Database password auto-generated and stored in Secrets Manager</li>" >> /var/www/html/index.html
echo "</ul>" >> /var/www/html/index.html

# Example of how to retrieve database password from Secrets Manager
# aws secretsmanager get-secret-value --secret-id ${secret_name} --region ${region}

