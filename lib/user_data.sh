#!/bin/bash
# user_data.sh
# Bootstrap script for EC2 instances in the Online Education Platform

set -e

# Update system
yum update -y

# Install essential packages
yum install -y \
  httpd \
  php \
  php-mysqlnd \
  php-redis \
  amazon-cloudwatch-agent \
  aws-xray-daemon

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json << 'EOF'
{
  "metrics": {
    "namespace": "OnlineEducationPlatform",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DISK_USED",
            "unit": "Percent"
          }
        ],
        "resources": [
          "*"
        ]
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ]
      }
    }
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/online-education-platform/application",
            "log_stream_name": "{instance_id}/httpd-access"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ec2/online-education-platform/application",
            "log_stream_name": "{instance_id}/httpd-error"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json \
  -s

# Configure X-Ray daemon
cat > /etc/amazon/xray/cfg.yaml << EOF
TotalBufferSizeMB: 24
Region: ${aws_region}
EOF

# Start X-Ray daemon
systemctl enable xray
systemctl start xray

# Configure PHP application
cat > /var/www/html/index.php << 'PHPEOF'
<?php
// Simple health check and session demo
session_start();

// Redis configuration
$redis_host = '${redis_endpoint}';
$redis_port = 6379;

// Database configuration
$db_host = '${db_endpoint}';
$db_name = '${db_name}';
$db_user = '${db_username}';
$db_pass = '${db_password}';

// Health check endpoint
if ($_SERVER['REQUEST_URI'] === '/health') {
    header('Content-Type: application/json');
    echo json_encode([
        'status' => 'healthy',
        'timestamp' => date('c'),
        'instance_id' => file_get_contents('http://169.254.169.254/latest/meta-data/instance-id')
    ]);
    exit;
}

// Main page
?>
<!DOCTYPE html>
<html>
<head>
    <title>Online Education Platform</title>
</head>
<body>
    <h1>Online Education Platform</h1>
    <p>Instance ID: <?php echo file_get_contents('http://169.254.169.254/latest/meta-data/instance-id'); ?></p>
    <p>Session ID: <?php echo session_id(); ?></p>
    <p>Timestamp: <?php echo date('Y-m-d H:i:s'); ?></p>
</body>
</html>
PHPEOF

# Configure Apache
cat > /etc/httpd/conf.d/app.conf << 'EOF'
<VirtualHost *:80>
    DocumentRoot /var/www/html
    ServerName localhost

    <Directory /var/www/html>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog /var/log/httpd/error_log
    CustomLog /var/log/httpd/access_log combined
</VirtualHost>
EOF

# Start Apache
systemctl enable httpd
systemctl start httpd

# Configure firewall
systemctl enable firewalld
systemctl start firewalld
firewall-cmd --permanent --add-service=http
firewall-cmd --permanent --add-service=https
firewall-cmd --reload

echo "User data script completed successfully"
