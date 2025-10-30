#!/bin/bash
yum update -y
yum install -y httpd php php-pgsql

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple PHP application
cat > /var/www/html/index.php << 'EOF'
<?php
$db_endpoint = "${db_endpoint}";
?>
<!DOCTYPE html>
<html>
<head>
    <title>Payment Processing Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .container { max-width: 800px; margin: 0 auto; }
        .status { padding: 20px; background-color: #f0f8ff; border: 1px solid #0066cc; border-radius: 5px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Payment Processing Web Application</h1>
        <div class="status">
            <h2>System Status</h2>
            <p><strong>Server:</strong> <?php echo gethostname(); ?></p>
            <p><strong>Timestamp:</strong> <?php echo date('Y-m-d H:i:s'); ?></p>
            <p><strong>Database Endpoint:</strong> <?php echo $db_endpoint; ?></p>
            <p><strong>Instance ID:</strong> <?php 
                $instance_id = file_get_contents('http://169.254.169.254/latest/meta-data/instance-id');
                echo $instance_id;
            ?></p>
        </div>
        <h2>Features</h2>
        <ul>
            <li>✓ Secure three-tier architecture</li>
            <li>✓ Auto-scaling web tier</li>
            <li>✓ High-availability Aurora PostgreSQL</li>
            <li>✓ Application Load Balancer</li>
            <li>✓ VPC with public/private subnets</li>
            <li>✓ KMS encryption for EBS and RDS</li>
            <li>✓ NAT Gateway for outbound connectivity</li>
            <li>✓ CloudWatch monitoring and alarms</li>
        </ul>
    </div>
</body>
</html>
EOF

# Set proper permissions
chown apache:apache /var/www/html/index.php
chmod 644 /var/www/html/index.php

# Install CloudWatch agent for monitoring
yum install -y amazon-cloudwatch-agent

# Create CloudWatch agent config
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
    "metrics": {
        "namespace": "PaymentProcessor/EC2",
        "metrics_collected": {
            "cpu": {
                "measurement": [
                    "cpu_usage_idle",
                    "cpu_usage_iowait",
                    "cpu_usage_user",
                    "cpu_usage_system"
                ],
                "metrics_collection_interval": 60
            },
            "disk": {
                "measurement": [
                    "used_percent"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "diskio": {
                "measurement": [
                    "io_time"
                ],
                "metrics_collection_interval": 60,
                "resources": [
                    "*"
                ]
            },
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    },
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "/aws/ec2/httpd/access",
                        "log_stream_name": "{instance_id}"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "/aws/ec2/httpd/error",
                        "log_stream_name": "{instance_id}"
                    }
                ]
            }
        }
    }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# Create health check endpoint
cat > /var/www/html/health.html << 'EOF'
<!DOCTYPE html>
<html>
<head><title>Health Check</title></head>
<body><h1>OK</h1></body>
</html>
EOF

# Restart Apache to ensure all changes take effect
systemctl restart httpd