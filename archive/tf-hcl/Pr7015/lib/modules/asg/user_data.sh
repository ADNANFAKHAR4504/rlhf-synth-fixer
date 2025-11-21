#!/bin/bash
# User data script for EC2 instances in ${environment}

set -e

# Update system
yum update -y
amazon-linux-extras enable postgresql14
yum install -y httpd jq postgresql python3 python3-pip

# Install Python PostgreSQL adapter and boto3
pip3 install psycopg2-binary boto3 --quiet

# Create Python HTTP server for E2E testing
mkdir -p /opt/payment-app
cat > /opt/payment-app/app.py << 'PYTHON_EOF'
#!/usr/bin/env python3
"""
Simple HTTP server for E2E testing
Handles health checks and database connectivity tests
"""
import json
import os
import sys
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs

# Load configuration
DB_ENDPOINT = os.environ.get('DB_ENDPOINT', '')
DB_NAME = os.environ.get('DB_NAME', 'paymentdb')
DB_SECRET_NAME = os.environ.get('DB_SECRET_NAME', '')
AWS_REGION = os.environ.get('AWS_REGION', 'us-east-1')

class PaymentAppHandler(BaseHTTPRequestHandler):
    def do_GET(self):
        parsed_path = urlparse(self.path)
        path = parsed_path.path
        
        if path == '/health':
            self.send_health_response()
        elif path == '/db-test':
            self.send_db_test_response()
        elif path == '/':
            self.send_root_response()
        else:
            self.send_error(404, "Not Found")
    
    def send_health_response(self):
        """Health check endpoint"""
        response = {
            "status": "healthy",
            "service": "payment-app"
        }
        self.send_json_response(200, response)
    
    def send_db_test_response(self):
        """Test database connectivity"""
        try:
            # Get DB credentials from Secrets Manager
            import boto3
            secrets_client = boto3.client('secretsmanager', region_name=AWS_REGION)
            
            secret_response = secrets_client.get_secret_value(SecretId=DB_SECRET_NAME)
            db_creds = json.loads(secret_response['SecretString'])
            
            db_host = DB_ENDPOINT.split(':')[0] if ':' in DB_ENDPOINT else DB_ENDPOINT
            db_port = DB_ENDPOINT.split(':')[1] if ':' in DB_ENDPOINT else '5432'
            db_user = db_creds.get('username') or db_creds.get('user') or 'dbadmin'
            db_password = db_creds.get('password')
            db_name = db_creds.get('dbname') or db_creds.get('database') or DB_NAME
            
            # Test connection using psycopg2
            import psycopg2
            conn = psycopg2.connect(
                host=db_host,
                port=db_port,
                user=db_user,
                password=db_password,
                database=db_name,
                connect_timeout=5
            )
            
            cursor = conn.cursor()
            cursor.execute("SELECT 1 as test_result, current_timestamp as query_time;")
            result = cursor.fetchone()
            cursor.close()
            conn.close()
            
            response = {
                "status": "success",
                "message": "Database connection successful",
                "test_result": result[0],
                "query_time": str(result[1]),
                "endpoint": DB_ENDPOINT
            }
            self.send_json_response(200, response)
            
        except Exception as e:
            response = {
                "status": "error",
                "message": f"Database connection failed: {str(e)}",
                "endpoint": DB_ENDPOINT
            }
            self.send_json_response(500, response)
    
    def send_root_response(self):
        """Root endpoint"""
        html = f"""<html>
<head><title>Payment App</title></head>
<body>
    <h1>Welcome to Payment App ({os.environ.get('ENVIRONMENT', 'dev')})</h1>
    <p>DB Endpoint: {DB_ENDPOINT}</p>
    <ul>
        <li><a href="/health">Health Check</a></li>
        <li><a href="/db-test">Database Test</a></li>
    </ul>
</body>
</html>"""
        self.send_response(200)
        self.send_header('Content-Type', 'text/html')
        self.send_header('Content-Length', str(len(html)))
        self.end_headers()
        self.wfile.write(html.encode())
    
    def send_json_response(self, status_code, data):
        """Send JSON response"""
        json_data = json.dumps(data, indent=2)
        self.send_response(status_code)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(json_data)))
        self.end_headers()
        self.wfile.write(json_data.encode())
    
    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 8080))
    server = HTTPServer(('0.0.0.0', port), PaymentAppHandler)
    print(f'Starting Payment App server on port {port}...')
    server.serve_forever()
PYTHON_EOF

chmod +x /opt/payment-app/app.py

# Create systemd service for Python app
cat > /etc/systemd/system/payment-app.service << EOF
[Unit]
Description=Payment App Python Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/payment-app
Environment="DB_ENDPOINT=${rds_endpoint}"
Environment="DB_NAME=${db_name}"
Environment="DB_SECRET_NAME=${secret_name}"
Environment="AWS_REGION=${aws_region}"
Environment="ENVIRONMENT=${environment}"
Environment="PORT=8080"
ExecStart=/usr/bin/python3 /opt/payment-app/app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure Apache to proxy to Python server
cat >> /etc/httpd/conf/httpd.conf << 'APACHE_PROXY_EOF'

# Proxy to Python server
LoadModule proxy_module modules/mod_proxy.so
LoadModule proxy_http_module modules/mod_proxy_http.so

<Location /db-test>
    ProxyPass http://127.0.0.1:8080/db-test
    ProxyPassReverse http://127.0.0.1:8080/db-test
</Location>

<Location /health>
    ProxyPass http://127.0.0.1:8080/health
    ProxyPassReverse http://127.0.0.1:8080/health
</Location>
APACHE_PROXY_EOF

# Start Python server
systemctl daemon-reload
systemctl enable payment-app
systemctl start payment-app

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

# Enable CGI execution in Apache
cat >> /etc/httpd/conf/httpd.conf <<'APACHE_EOF'

# Enable CGI execution
LoadModule cgi_module modules/mod_cgi.so
AddHandler cgi-script .cgi .sh
<Directory "/var/www/html">
    Options +ExecCGI +FollowSymLinks
    AllowOverride None
    Require all granted
</Directory>
APACHE_EOF

# Restart Apache to apply changes
systemctl restart httpd

# Log completion
echo "User data script completed successfully for ${environment}" >> /var/log/user-data.log
