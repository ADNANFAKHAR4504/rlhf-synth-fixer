#!/bin/bash
# User data script for EC2 instances
exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1

echo "Starting User Data Script..."

# 2. Update system
yum update -y

# 3. Install packages 
amazon-linux-extras enable postgresql14
amazon-linux-extras enable nginx1
yum clean metadata
yum install -y postgresql nginx amazon-cloudwatch-agent python3 python3-pip

# 4. Configure CloudWatch agent (Your config)
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << EOF
{
  "metrics": {
    "namespace": "${environment}-payment-app",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {"name": "cpu_usage_idle", "rename": "CPU_IDLE", "unit": "Percent"},
          "cpu_usage_iowait"
        ],
        "metrics_collection_interval": 60
      },
      "disk": {
        "measurement": [
          {"name": "used_percent", "rename": "DISK_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60,
        "resources": ["/"]
      },
      "mem": {
        "measurement": [
          {"name": "mem_used_percent", "rename": "MEM_USED", "unit": "Percent"}
        ],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json -s

# 5. Install Python PostgreSQL adapter
pip3 install psycopg2-binary boto3 --quiet

# 6. Create Python HTTP server for E2E testing
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
import subprocess
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
            
            # Test connection using psql
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

# 7. Create systemd service for Python app
cat > /etc/systemd/system/payment-app.service << EOF
[Unit]
Description=Payment App Python Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/payment-app
Environment="DB_ENDPOINT=${db_endpoint}"
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

# 8. Configure Nginx to proxy to Python server
cat > /etc/nginx/conf.d/payment-app.conf << EOF
server {
    listen 80 default_server;
    server_name _;
    
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_connect_timeout 5s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
EOF

# Remove default config to prevent conflicts
rm -f /etc/nginx/conf.d/default.conf

# 9. Start services
systemctl daemon-reload
systemctl enable payment-app
systemctl start payment-app
systemctl enable nginx
systemctl restart nginx

# 10. Store DB info (for reference)
mkdir -p /etc/payment-app
cat > /etc/payment-app/db.conf << EOF
DB_ENDPOINT=${db_endpoint}
DB_NAME=${db_name}
ENVIRONMENT=${environment}
DB_SECRET_NAME=${secret_name}
AWS_REGION=${aws_region}
EOF

# 11. Create helper script to retrieve DB credentials
cat > /usr/local/bin/get-db-credentials << 'EOF'
#!/bin/bash
# Helper script to retrieve database credentials from Secrets Manager
aws secretsmanager get-secret-value \
  --secret-id ${secret_name} \
  --region ${aws_region} \
  --query SecretString \
  --output text
EOF

chmod +x /usr/local/bin/get-db-credentials

# 12. Wait for services to be ready
sleep 5
systemctl status payment-app --no-pager || true
systemctl status nginx --no-pager || true

echo "User Data Script Completed Successfully"