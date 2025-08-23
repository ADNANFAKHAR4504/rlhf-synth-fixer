#!/bin/bash

# Update system
yum update -y

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Install AWS CLI v2
curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
unzip awscliv2.zip
sudo ./aws/install

# Install Docker
yum install -y docker
systemctl start docker
systemctl enable docker
usermod -a -G docker ec2-user

# Install Node.js (example application)
curl -sL https://rpm.nodesource.com/setup_16.x | bash -
yum install -y nodejs

# Create application directory
mkdir -p /opt/app
cd /opt/app

# Create a simple Node.js application
cat > app.js << 'EOF'
const express = require('express');
const mysql = require('mysql2');
const app = express();
const port = process.env.APP_PORT || 8080;

// Database connection
const db = mysql.createConnection({
  host: process.env.DB_ENDPOINT,
  user: process.env.DB_USERNAME,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy', timestamp: new Date().toISOString() });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Hello from ${environment} environment!',
    environment: '${environment}',
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`App running on port $${port}`);
});
EOF

# Create package.json
cat > package.json << 'EOF'
{
  "name": "sample-app",
  "version": "1.0.0",
  "description": "Sample application",
  "main": "app.js",
  "scripts": {
    "start": "node app.js"
  },
  "dependencies": {
    "express": "^4.18.0",
    "mysql2": "^2.3.0"
  }
}
EOF

# Install dependencies
npm install

# Create systemd service
cat > /etc/systemd/system/app.service << 'EOF'
[Unit]
Description=Sample Application
After=network.target

[Service]
Type=simple
User=ec2-user
WorkingDirectory=/opt/app
Environment=NODE_ENV=production
Environment=APP_PORT=${app_port}
Environment=DB_ENDPOINT=${db_endpoint}
Environment=DB_NAME=${db_name}
Environment=DB_USERNAME=${db_username}
EnvironmentFile=-/opt/app/.env
ExecStart=/usr/bin/node app.js
Restart=on-failure
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Get database password from SSM
DB_PASSWORD=$(aws ssm get-parameter --name "/${environment}/app/db_password" --with-decryption --region ${aws_region} --query 'Parameter.Value' --output text)

# Create environment file
cat > /opt/app/.env << EOF
DB_PASSWORD=$DB_PASSWORD
EOF

# Set permissions
chown -R ec2-user:ec2-user /opt/app
chmod 600 /opt/app/.env

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "{instance_id}/system"
          },
          {
            "file_path": "/var/log/secure",
            "log_group_name": "${log_group_name}",
            "log_stream_name": "{instance_id}/secure"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "CWAgent",
    "