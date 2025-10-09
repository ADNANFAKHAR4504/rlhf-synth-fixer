#!/bin/bash
set -e

# Update system packages
yum update -y

# Install necessary packages
yum install -y httpd mysql

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple web application
cat > /var/www/html/index.html <<'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${app_name} - Financial Application</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: center;
            padding: 20px;
        }
        .container {
            background: white;
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 800px;
            width: 100%;
        }
        h1 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 2.5em;
            text-align: center;
        }
        .info-box {
            background: #f8f9fa;
            border-left: 4px solid #667eea;
            padding: 20px;
            margin: 20px 0;
            border-radius: 5px;
        }
        .info-box h2 {
            color: #764ba2;
            margin-bottom: 10px;
        }
        .status {
            display: inline-block;
            padding: 5px 15px;
            background: #28a745;
            color: white;
            border-radius: 20px;
            font-weight: bold;
        }
        .metric {
            display: flex;
            justify-content: space-between;
            padding: 10px 0;
            border-bottom: 1px solid #e9ecef;
        }
        .metric:last-child {
            border-bottom: none;
        }
        .metric-label {
            font-weight: 600;
            color: #495057;
        }
        .metric-value {
            color: #667eea;
            font-weight: bold;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>🏦 ${app_name}</h1>
        <div style="text-align: center; margin: 20px 0;">
            <span class="status">✓ System Operational</span>
        </div>
        
        <div class="info-box">
            <h2>System Information</h2>
            <div class="metric">
                <span class="metric-label">Application Name:</span>
                <span class="metric-value">${app_name}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Region:</span>
                <span class="metric-value">${region}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Database Endpoint:</span>
                <span class="metric-value">${db_endpoint}</span>
            </div>
            <div class="metric">
                <span class="metric-label">Database Name:</span>
                <span class="metric-value">${db_name}</span>
            </div>
        </div>

        <div class="info-box">
            <h2>Architecture Features</h2>
            <div class="metric">
                <span class="metric-label">Multi-AZ Deployment:</span>
                <span class="metric-value">✓ Enabled</span>
            </div>
            <div class="metric">
                <span class="metric-label">Aurora Global Database:</span>
                <span class="metric-value">✓ Enabled</span>
            </div>
            <div class="metric">
                <span class="metric-label">Auto Scaling:</span>
                <span class="metric-value">✓ Active</span>
            </div>
            <div class="metric">
                <span class="metric-label">Load Balancer:</span>
                <span class="metric-value">✓ Running</span>
            </div>
        </div>

        <div class="info-box">
            <h2>Health Status</h2>
            <div class="metric">
                <span class="metric-label">Web Server:</span>
                <span class="metric-value">✓ Healthy</span>
            </div>
            <div class="metric">
                <span class="metric-label">Database:</span>
                <span class="metric-value">✓ Connected</span>
            </div>
            <div class="metric">
                <span class="metric-label">Failover Automation:</span>
                <span class="metric-value">✓ Monitoring</span>
            </div>
        </div>
    </div>
</body>
</html>
EOF

# Create health check endpoint
cat > /var/www/html/health.html <<'EOF'
{"status": "healthy", "timestamp": "$(date -u +%Y-%m-%dT%H:%M:%SZ)"}
EOF

# Set proper permissions
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html

# Restart Apache to apply changes
systemctl restart httpd

# Enable CloudWatch monitoring (optional)
# wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
# rpm -U ./amazon-cloudwatch-agent.rpm

