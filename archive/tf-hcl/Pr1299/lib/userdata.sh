#!/bin/bash
yum update -y
yum install -y httpd aws-cli amazon-cloudwatch-agent

# Get instance ID and region
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
REGION=$(curl -s http://169.254.169.254/latest/dynamic/instance-identity/document | grep region | cut -d'"' -f4)

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "agent": {
    "metrics_collection_interval": 300,
    "run_as_user": "root"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/${project_name}",
            "log_stream_name": "$INSTANCE_ID/httpd/access_log"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ec2/${project_name}",
            "log_stream_name": "$INSTANCE_ID/httpd/error_log"
          }
        ]
      }
    }
  }
}
EOF

# Start and enable services
systemctl start httpd
systemctl enable httpd
systemctl start amazon-cloudwatch-agent
systemctl enable amazon-cloudwatch-agent

# Configure log shipping to S3
echo "*/5 * * * * aws logs create-export-task --log-group-name /aws/ec2/${project_name} --from 0 --to \$(date +%s)000 --destination ${s3_logs_bucket} --destination-prefix ec2-logs/" >> /var/spool/cron/root

# Create a simple index page
echo "<h1>Web Application Migration - Instance $INSTANCE_ID</h1>" > /var/www/html/index.html

# Set up log rotation and ensure proper permissions
chmod 600 /var/spool/cron/root
systemctl restart crond