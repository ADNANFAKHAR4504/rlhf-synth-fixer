#!/bin/bash
# User data script for EC2 instances in ${environment}
# This script sets up Apache and creates test endpoints for integration testing

set -e

# Update system
yum update -y
yum install -y httpd jq postgresql

# Start Apache
systemctl start httpd
systemctl enable httpd

# Create health check endpoint
cat <<'HEALTH_EOF' > /var/www/html/health
OK
HEALTH_EOF

# Create detailed health endpoint with JSON response
cat <<'HEALTH_JSON_EOF' > /var/www/html/health.json
{
  "status": "healthy",
  "environment": "${environment}",
  "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
}
HEALTH_JSON_EOF

# Create main index page
cat <<'INDEX_EOF' > /var/www/html/index.html
<!DOCTYPE html>
<html>
<head>
    <title>Environment: ${environment}</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #f0f0f0; }
        .container { background: white; padding: 30px; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
        h1 { color: #232f3e; }
        .info { margin: 20px 0; }
        .endpoint { background: #232f3e; color: white; padding: 5px 10px; border-radius: 4px; font-family: monospace; }
        ul { list-style-type: none; padding: 0; }
        li { margin: 10px 0; }
        a { color: #ff9900; text-decoration: none; }
        a:hover { text-decoration: underline; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Welcome to ${environment} Environment</h1>
        
        <div class="info">
            <p><strong>Instance ID:</strong> <span class="endpoint">INSTANCE_ID_PLACEHOLDER</span></p>
            <p><strong>Availability Zone:</strong> <span class="endpoint">AZ_PLACEHOLDER</span></p>
            <p><strong>Instance Type:</strong> <span class="endpoint">INSTANCE_TYPE_PLACEHOLDER</span></p>
            <p><strong>Private IP:</strong> <span class="endpoint">PRIVATE_IP_PLACEHOLDER</span></p>
        </div>

        <h2>Available Test Endpoints:</h2>
        <ul>
            <li><a href="/health">/health</a> - Simple health check</li>
            <li><a href="/health.json">/health.json</a> - Health check (JSON)</li>
            <li><a href="/status">/status</a> - Detailed status information</li>
            <li><a href="/db-test">/db-test</a> - Database connectivity test</li>
            <li><a href="/s3-test">/s3-test</a> - S3 bucket connectivity test</li>
            <li><a href="/secrets-test">/secrets-test</a> - Secrets Manager test</li>
            <li><a href="/metadata">/metadata</a> - EC2 metadata</li>
            <li><a href="/env">/env</a> - Environment information</li>
            <li><a href="/config">/config</a> - Configuration details</li>
        </ul>
    </div>
</body>
</html>
INDEX_EOF

# Get instance metadata
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null || echo "")
if [ -n "$TOKEN" ]; then
    INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null)
    AZ=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone 2>/dev/null)
    INSTANCE_TYPE=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-type 2>/dev/null)
    PRIVATE_IP=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4 2>/dev/null)
else
    INSTANCE_ID=$(ec2-metadata --instance-id | cut -d " " -f 2)
    AZ=$(ec2-metadata --availability-zone | cut -d " " -f 2)
    INSTANCE_TYPE=$(ec2-metadata --instance-type | cut -d " " -f 2)
    PRIVATE_IP=$(ec2-metadata --local-ipv4 | cut -d " " -f 2)
fi

# Update index.html with actual values
sed -i "s|INSTANCE_ID_PLACEHOLDER|$INSTANCE_ID|g" /var/www/html/index.html
sed -i "s|AZ_PLACEHOLDER|$AZ|g" /var/www/html/index.html
sed -i "s|INSTANCE_TYPE_PLACEHOLDER|$INSTANCE_TYPE|g" /var/www/html/index.html
sed -i "s|PRIVATE_IP_PLACEHOLDER|$PRIVATE_IP|g" /var/www/html/index.html

# Create status endpoint
cat > /var/www/html/status <<'STATUS_EOF'
#!/bin/bash
echo "Content-type: text/html"
echo ""
echo "<html><body>"
echo "<h1>System Status</h1>"
echo "<p>Uptime: $(uptime)</p>"
echo "<p>Memory: $(free -h | grep Mem | awk '{print "Used: "$3" / Total: "$2}')</p>"
echo "<p>Disk: $(df -h / | tail -1 | awk '{print "Used: "$3" / Total: "$2" ("$5" full)"}')</p>"
echo "<p>Load Average: $(cat /proc/loadavg | cut -d' ' -f1-3)</p>"
echo "</body></html>"
STATUS_EOF
chmod +x /var/www/html/status

# Create DB test endpoint (PHP-like bash CGI)
cat > /var/www/html/db-test <<'DB_TEST_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""

# Get RDS endpoint from environment
RDS_ENDPOINT="${rds_endpoint}"

if [ -z "$RDS_ENDPOINT" ]; then
    echo '{"status":"error","message":"RDS endpoint not configured"}'
    exit 0
fi

# Extract host from endpoint (remove port if present)
RDS_HOST="$${RDS_ENDPOINT%%:*}"

# Test connection (without actual credentials for security)
if timeout 3 bash -c "cat < /dev/null > /dev/tcp/$RDS_HOST/5432" 2>/dev/null; then
    echo "{\"status\":\"success\",\"message\":\"RDS endpoint reachable\",\"endpoint\":\"$RDS_ENDPOINT\",\"port\":5432}"
else
    echo "{\"status\":\"error\",\"message\":\"Cannot reach RDS endpoint\",\"endpoint\":\"$RDS_ENDPOINT\"}"
fi
DB_TEST_EOF
chmod +x /var/www/html/db-test

# Create S3 test endpoint
cat > /var/www/html/s3-test <<'S3_TEST_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""

S3_BUCKET="${s3_bucket}"

if [ -z "$S3_BUCKET" ]; then
    echo '{"status":"error","message":"S3 bucket not configured"}'
    exit 0
fi

# Test S3 access using AWS CLI
if aws s3 ls "s3://$S3_BUCKET" --region ${aws_region} >/dev/null 2>&1; then
    echo "{\"status\":\"success\",\"message\":\"S3 bucket accessible\",\"bucket\":\"$S3_BUCKET\"}"
else
    echo "{\"status\":\"error\",\"message\":\"Cannot access S3 bucket\",\"bucket\":\"$S3_BUCKET\"}"
fi
S3_TEST_EOF
chmod +x /var/www/html/s3-test

# Create Secrets Manager test endpoint
cat > /var/www/html/secrets-test <<'SECRETS_TEST_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""

SECRET_NAME="${secret_name}"

if [ -z "$SECRET_NAME" ]; then
    echo '{"status":"error","message":"Secret name not configured"}'
    exit 0
fi

# Test Secrets Manager access
if aws secretsmanager describe-secret --secret-id "$SECRET_NAME" --region ${aws_region} >/dev/null 2>&1; then
    echo "{\"status\":\"success\",\"message\":\"Secret accessible\",\"secret_name\":\"$SECRET_NAME\"}"
else
    echo "{\"status\":\"error\",\"message\":\"Cannot access secret\",\"secret_name\":\"$SECRET_NAME\"}"
fi
SECRETS_TEST_EOF
chmod +x /var/www/html/secrets-test

# Create metadata endpoint
cat > /var/www/html/metadata <<'METADATA_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""

TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null || echo "")

if [ -n "$TOKEN" ]; then
    INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id)
    AZ=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone)
    REGION=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/region)
    INSTANCE_TYPE=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-type)
    PRIVATE_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/local-ipv4)
    PUBLIC_IP=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || echo "N/A")
    AMI_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/ami-id)
else
    INSTANCE_ID="unavailable"
    AZ="unavailable"
    REGION="${aws_region}"
    INSTANCE_TYPE="unavailable"
    PRIVATE_IP="unavailable"
    PUBLIC_IP="N/A"
    AMI_ID="unavailable"
fi

cat <<METADATA_JSON
{
  "instance_id": "$INSTANCE_ID",
  "availability_zone": "$AZ",
  "region": "$REGION",
  "instance_type": "$INSTANCE_TYPE",
  "private_ip": "$PRIVATE_IP",
  "public_ip": "$PUBLIC_IP",
  "ami_id": "$AMI_ID",
  "environment": "${environment}"
}
METADATA_JSON
METADATA_EOF
chmod +x /var/www/html/metadata

# Create environment info endpoint
cat > /var/www/html/env <<'ENV_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""
cat <<ENV_JSON
{
  "environment": "${environment}",
  "vpc_id": "${vpc_id}",
  "alb_dns": "${alb_dns}",
  "region": "${aws_region}"
}
ENV_JSON
ENV_EOF
chmod +x /var/www/html/env

# Create config endpoint with all resource information
cat > /var/www/html/config <<'CONFIG_EOF'
#!/bin/bash
echo "Content-type: application/json"
echo ""
cat <<CONFIG_JSON
{
  "environment": "${environment}",
  "resources": {
    "vpc_id": "${vpc_id}",
    "alb_dns": "${alb_dns}",
    "s3_bucket": "${s3_bucket}",
    "rds_endpoint": "${rds_endpoint}",
    "secret_name": "${secret_name}",
    "kms_rds_key_id": "${kms_rds_key_id}",
    "kms_ebs_key_id": "${kms_ebs_key_id}"
  },
  "endpoints": [
    "/health",
    "/health.json",
    "/status",
    "/db-test",
    "/s3-test",
    "/secrets-test",
    "/metadata",
    "/env",
    "/config"
  ]
}
CONFIG_JSON
CONFIG_EOF
chmod +x /var/www/html/config

# Enable CGI execution
echo 'AddHandler cgi-script .cgi' >> /etc/httpd/conf/httpd.conf
echo '<Directory "/var/www/html">' >> /etc/httpd/conf/httpd.conf
echo '    Options +ExecCGI' >> /etc/httpd/conf/httpd.conf
echo '    AddHandler cgi-script .sh' >> /etc/httpd/conf/httpd.conf
echo '</Directory>' >> /etc/httpd/conf/httpd.conf

# Restart Apache to apply changes
systemctl restart httpd

# Log completion
echo "User data script completed successfully for ${environment}" >> /var/log/user-data.log
