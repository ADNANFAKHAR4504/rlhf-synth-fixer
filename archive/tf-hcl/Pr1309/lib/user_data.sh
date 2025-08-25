#!/bin/bash
yum update -y
yum install -y httpd amazon-cloudwatch-agent

# Install and configure CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-config-wizard -o AmazonCloudWatch-linux -a fetch-config -m ec2 -s -c ssm:${project_name}-cloudwatch-config

# Start and enable httpd
systemctl start httpd
systemctl enable httpd

# Create a simple HTML page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Multi-Region HA Application</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background-color: #f0f0f0; }
        .container { background-color: white; padding: 20px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
        .header { color: #333; text-align: center; margin-bottom: 20px; }
        .info { background-color: #e8f4fd; padding: 15px; border-radius: 5px; margin: 10px 0; }
        .status { background-color: #d4edda; padding: 10px; border-radius: 5px; color: #155724; }
    </style>
</head>
<body>
    <div class="container">
        <h1 class="header">Multi-Region High Availability Application</h1>
        <div class="status">
            ✓ Application Status: Healthy
        </div>
        <div class="info">
            <strong>Region:</strong> ${region}<br>
            <strong>Availability Zone:</strong> <script>
                fetch('http://169.254.169.254/latest/meta-data/placement/availability-zone')
                .then(response => response.text())
                .then(data => document.write(data))
                .catch(error => document.write('Unable to fetch AZ'));
            </script><br>
            <strong>Instance ID:</strong> <script>
                fetch('http://169.254.169.254/latest/meta-data/instance-id')
                .then(response => response.text())
                .then(data => document.write(data))
                .catch(error => document.write('Unable to fetch instance ID'));
            </script>
        </div>
        <div class="info">
            <h3>Features Implemented:</h3>
            <ul>
                <li>Multi-Region VPC Setup (us-west-2 & us-east-1)</li>
                <li>Auto Scaling Groups with ARC Zonal Shift</li>
                <li>Application Load Balancers</li>
                <li>Multi-AZ RDS with Cross-Region Replicas</li>
                <li>Route 53 Health Checks & DNS Failover</li>
                <li>AWS Application Recovery Controller (ARC)</li>
                <li>SNS Notifications & CloudWatch Monitoring</li>
                <li>Cross-Region Failover Capabilities</li>
            </ul>
        </div>
    </div>
</body>
</html>
EOF

# Create health check endpoint
cat > /var/www/html/health << EOF
OK
EOF

# Start CloudWatch agent
systemctl start amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent

# Configure log monitoring
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
    "logs": {
        "logs_collected": {
            "files": {
                "collect_list": [
                    {
                        "file_path": "/var/log/httpd/access_log",
                        "log_group_name": "${project_name}-httpd-access",
                        "log_stream_name": "{instance_id}-access.log"
                    },
                    {
                        "file_path": "/var/log/httpd/error_log",
                        "log_group_name": "${project_name}-httpd-error",
                        "log_stream_name": "{instance_id}-error.log"
                    }
                ]
            }
        }
    },
    "metrics": {
        "namespace": "CustomApp/EC2",
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
            "mem": {
                "measurement": [
                    "mem_used_percent"
                ],
                "metrics_collection_interval": 60
            }
        }
    }
}
EOF

# Restart CloudWatch agent with new configuration
systemctl restart amazon-cloudwatch-agent