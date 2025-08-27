#!/bin/bash

# Update system packages
yum update -y

# Install necessary packages
yum install -y httpd aws-cli awslogs

# Configure AWS CLI region
aws configure set region ${region}

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Get database endpoint from SSM Parameter Store for security
DB_ENDPOINT=$(aws ssm get-parameter --name "/${app_name}/database/endpoint" --query 'Parameter.Value' --output text --region ${region})

# Create a simple HTML page
cat > /var/www/html/index.html << 'HTML'
<!DOCTYPE html>
<html>
<head>
    <title>${app_name} Application</title>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f5f5f5; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #333; }
        .info { background: #e8f4fd; padding: 15px; border-radius: 4px; margin: 10px 0; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to ${app_name}</h1>
        <p>This is a highly available web application running on AWS.</p>
        
        <div class="info">
            <strong>Instance Information:</strong><br>
            Server Hostname: <span id="hostname"></span><br>
            Current Time: <span id="datetime"></span><br>
            Database Status: <span id="db-status">Connected</span>
        </div>
        
        <div class="info">
            <strong>Architecture Features:</strong>
            <ul>
                <li>Multi-AZ deployment across availability zones</li>
                <li>Auto Scaling Group with CPU-based scaling</li>
                <li>Application Load Balancer with health checks</li>
                <li>RDS PostgreSQL with encryption and backups</li>
                <li>S3 logging with lifecycle management</li>
                <li>CloudFront CDN with WAF protection</li>
                <li>SSL/TLS encryption throughout</li>
            </ul>
        </div>
    </div>
    
    <script>
        document.getElementById('hostname').textContent = window.location.hostname;
        document.getElementById('datetime').textContent = new Date().toLocaleString();
    </script>
</body>
</html>
HTML

# Set proper permissions
chown apache:apache /var/www/html/index.html
chmod 644 /var/www/html/index.html

# Configure CloudWatch Logs
cat > /etc/awslogs/awslogs.conf << 'AWSLOGS'
[general]
state_file = /var/lib/awslogs/agent-state

[/var/log/httpd/access_log]
file = /var/log/httpd/access_log
log_group_name = /${app_name}/httpd/access_log
log_stream_name = {instance_id}
datetime_format = %d/%b/%Y:%H:%M:%S %z

[/var/log/httpd/error_log]
file = /var/log/httpd/error_log
log_group_name = /${app_name}/httpd/error_log
log_stream_name = {instance_id}
datetime_format = %a %b %d %H:%M:%S %Y
AWSLOGS

# Update awslogs region configuration
sed -i "s/region = us-east-1/region = ${region}/g" /etc/awslogs/awscli.conf

# Start and enable CloudWatch Logs Agent
systemctl start awslogsd
systemctl enable awslogsd

# Create a simple health check endpoint
cat > /var/www/html/health << 'HEALTH'
OK
HEALTH

# Restart Apache to ensure all changes take effect
systemctl restart httpd

# Log successful completion
logger "User data script completed successfully for ${app_name}"