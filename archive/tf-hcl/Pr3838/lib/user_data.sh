#!/bin/bash
set -e

# Update system
yum update -y

# Install dependencies
yum install -y httpd php php-pgsql amazon-cloudwatch-agent

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/config.json <<EOF
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/httpd/access_log",
            "log_group_name": "/aws/ec2/${project_name}",
            "log_stream_name": "{instance_id}/access_log"
          },
          {
            "file_path": "/var/log/httpd/error_log",
            "log_group_name": "/aws/ec2/${project_name}",
            "log_stream_name": "{instance_id}/error_log"
          }
        ]
      }
    }
  }
}
EOF

/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config \
  -m ec2 \
  -s \
  -c file:/opt/aws/amazon-cloudwatch-agent/etc/config.json

# Configure web application
cat > /var/www/html/index.php <<'EOF'
<?php
header('Content-Type: application/json');

$redis_host = '${redis_endpoint}';
$db_host = '${db_endpoint}';
$db_user = '${db_username}';
$db_name = '${db_name}';
$s3_bucket = '${s3_bucket}';
$cloudfront_domain = '${cloudfront_domain}';

$response = array(
    'status' => 'healthy',
    'timestamp' => date('c'),
    'version' => '1.0.0',
    'services' => array(
        'redis' => $redis_host,
        'database' => $db_host,
        's3' => $s3_bucket,
        'cloudfront' => $cloudfront_domain
    )
);

echo json_encode($response, JSON_PRETTY_PRINT);
?>
EOF

cat > /var/www/html/health <<'EOF'
OK
EOF

# Start services
systemctl enable httpd
systemctl start httpd

# Configure permissions
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html
