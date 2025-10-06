#!/bin/bash

# Update system
yum update -y

# Install required packages
yum install -y httpd php php-mysqlnd git

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create web application directory
mkdir -p /var/www/html/app

# Create a simple web application
cat > /var/www/html/app/index.php << 'EOF'
<?php
$servername = "${db_endpoint}";
$username = "dbadmin";
$password = "SecurePassword123!"; // In production, use AWS Secrets Manager
$dbname = "webapp";

try {
    $pdo = new PDO("mysql:host=$servername;dbname=$dbname", $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create table if it doesn't exist
    $sql = "CREATE TABLE IF NOT EXISTS users (
        id INT(6) UNSIGNED AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(30) NOT NULL,
        email VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )";
    $pdo->exec($sql);
    
    // Insert sample data
    $sql = "INSERT INTO users (name, email) VALUES ('John Doe', 'john@example.com') ON DUPLICATE KEY UPDATE name=name";
    $pdo->exec($sql);
    
    echo "<h1>Welcome to Financial Services Web App</h1>";
    echo "<p>Environment: ${environment}</p>";
    echo "<p>Region: ${region}</p>";
    echo "<p>Database Connection: Success</p>";
    echo "<p>Server Time: " . date('Y-m-d H:i:s') . "</p>";
    
} catch(PDOException $e) {
    echo "<h1>Database Connection Failed</h1>";
    echo "<p>Error: " . $e->getMessage() . "</p>";
}
?>
EOF

# Create health check endpoint
cat > /var/www/html/health << 'EOF'
<?php
http_response_code(200);
echo "OK";
?>
EOF

# Set proper permissions
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html

# Configure Apache virtual host
cat > /etc/httpd/conf.d/app.conf << 'EOF'
<VirtualHost *:80>
    DocumentRoot /var/www/html/app
    ServerName localhost
    
    <Directory /var/www/html/app>
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog /var/log/httpd/app_error.log
    CustomLog /var/log/httpd/app_access.log combined
</VirtualHost>
EOF

# Restart Apache
systemctl restart httpd

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "metrics": {
        "namespace": "CWAgent",
        "metrics_collected": {
            "cpu": {
                "measurement": ["cpu_usage_idle", "cpu_usage_iowait", "cpu_usage_user", "cpu_usage_system"],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": ["used_percent"],
                "metrics_collection_interval": 60,
                "resources": ["*"]
            },
            "mem": {
                "measurement": ["mem_used_percent"],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/app_error.log",
                        "log_group_name": "/aws/ec2/webapp/error",
                        "log_stream_name": "{instance_id}/error.log"
                    },
                    {
                        "file_path": "/var/log/httpd/app_access.log",
                        "log_group_name": "/aws/ec2/webapp/access",
                        "log_stream_name": "{instance_id}/access.log"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json \
    -s

# Create a simple status page
cat > /var/www/html/status.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>System Status</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .status { padding: 10px; margin: 10px 0; border-radius: 5px; }
        .healthy { background-color: #d4edda; color: #155724; }
        .warning { background-color: #fff3cd; color: #856404; }
        .error { background-color: #f8d7da; color: #721c24; }
    </style>
</head>
<body>
    <h1>System Status</h1>
    <div class="status healthy">
        <strong>Web Server:</strong> Running
    </div>
    <div class="status healthy">
        <strong>Database:</strong> Connected
    </div>
    <div class="status healthy">
        <strong>Region:</strong> ${region}
    </div>
    <div class="status healthy">
        <strong>Environment:</strong> ${environment}
    </div>
    <p><a href="/app/">Go to Application</a></p>
</body>
</html>
EOF

# Set proper ownership for status page
chown apache:apache /var/www/html/status.html

# Log completion
echo "User data script completed at $(date)" >> /var/log/user-data.log
