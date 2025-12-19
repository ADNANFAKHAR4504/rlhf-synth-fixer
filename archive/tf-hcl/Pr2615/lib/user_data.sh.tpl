#!/bin/bash
yum update -y
yum install -y python3 python3-pip amazon-cloudwatch-agent

# Install AWS CLI
pip3 install awscli

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'CWEOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/webapp/*.log",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "{instance_id}/webapp",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/access.log",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "{instance_id}/nginx-access",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/nginx/error.log",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "{instance_id}/nginx-error",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "WebApp",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_USAGE_IDLE",
            "unit": "Percent"
          },
          "cpu_usage_iowait"
        ],
        "totalcpu": false
      },
      "disk": {
        "measurement": [
          {
            "name": "used_percent",
            "rename": "DISK_USED_PERCENT",
            "unit": "Percent"
          }
        ],
        "resources": [
          "/"
        ]
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED_PERCENT",
            "unit": "Percent"
          }
        ]
      }
    }
  }
}
CWEOF

# Start CloudWatch Agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl -a fetch-config -m ec2 -s -c file:/opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json

# Create app directory
mkdir -p /opt/webapp
mkdir -p /var/log/webapp
cd /opt/webapp

# Create Flask application
cat > app.py << 'PYEOF'
from flask import Flask, jsonify
import os
import boto3
import json
import logging
from botocore.exceptions import ClientError
from datetime import datetime

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('/var/log/webapp/app.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

app = Flask(__name__)

def get_secret():
    secret_name = "${db_secret_name}"
    region_name = "${region}"
    
    logger.info(f"Attempting to retrieve secret: {secret_name}")
    
    session = boto3.session.Session()
    client = session.client(
        service_name='secretsmanager',
        region_name=region_name
    )
    
    try:
        get_secret_value_response = client.get_secret_value(
            SecretId=secret_name
        )
        logger.info("Successfully retrieved secret")
        return get_secret_value_response['SecretString']
    except ClientError as e:
        logger.error(f"Failed to retrieve secret: {str(e)}")
        return None

@app.route('/')
def hello():
    instance_id = os.environ.get('EC2_INSTANCE_ID', 'unknown')
    logger.info(f"Root endpoint accessed from instance: {instance_id}")
    return jsonify({
        'message': 'Hello World from Flask!',
        'status': 'success',
        'instance_id': instance_id,
        'timestamp': datetime.utcnow().isoformat()
    })

@app.route('/health')
def health():
    logger.info("Health check endpoint accessed")
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.utcnow().isoformat()
    }), 200

@app.route('/db-test')
def db_test():
    logger.info("Database test endpoint accessed")
    secret = get_secret()
    if secret:
        return jsonify({
            'database': 'connected',
            'status': 'success',
            'timestamp': datetime.utcnow().isoformat()
        })
    else:
        return jsonify({
            'database': 'connection failed',
            'status': 'error',
            'timestamp': datetime.utcnow().isoformat()
        }), 500

if __name__ == '__main__':
    logger.info("Starting Flask application")
    app.run(host='0.0.0.0', port=5000, debug=False)
PYEOF

# Install Flask
pip3 install flask boto3

# Get instance metadata
export EC2_INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)

# Create systemd service
cat > /etc/systemd/system/webapp.service << SVCEOF
[Unit]
Description=Flask Web Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/webapp
Environment=EC2_INSTANCE_ID=$EC2_INSTANCE_ID
ExecStart=/usr/bin/python3 /opt/webapp/app.py
Restart=always
RestartSec=10
StandardOutput=append:/var/log/webapp/service.log
StandardError=append:/var/log/webapp/service-error.log

[Install]
WantedBy=multi-user.target
SVCEOF

# Set permissions
chown -R ec2-user:ec2-user /opt/webapp
chown -R ec2-user:ec2-user /var/log/webapp
chmod +x /opt/webapp/app.py

# Enable and start service
systemctl daemon-reload
systemctl enable webapp
systemctl start webapp

# Install and configure nginx as reverse proxy
yum install -y nginx

# Remove default nginx config
rm -f /etc/nginx/conf.d/default.conf

cat > /etc/nginx/conf.d/webapp.conf << 'NGEOF'
server {
    listen 80;
    server_name _;

    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    location /health {
        proxy_pass http://127.0.0.1:5000/health;
        proxy_set_header Host $host;
        proxy_connect_timeout 10s;
        proxy_send_timeout 10s;
        proxy_read_timeout 10s;
    }
}
NGEOF

systemctl enable nginx
systemctl start nginx

# Log startup completion
echo "User data script completed at $(date)" >> /var/log/webapp/startup.log