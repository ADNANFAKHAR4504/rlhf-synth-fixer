#user_data.sh
#!/bin/bash
set -e

# Function to get IMDSv2 token and metadata
get_metadata() {
  local token=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)
  curl -H "X-aws-ec2-metadata-token: $token" "http://169.254.169.254/latest/meta-data/$1" 2>/dev/null
}

# Update system packages
yum update -y

# Install required packages
yum install -y \
  amazon-cloudwatch-agent \
  python3 \
  python3-pip \
  httpd \
  mod_ssl \
  wget \
  curl \
  jq

# Get IMDSv2 token
TOKEN=$(curl -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 21600" 2>/dev/null)

# Get instance metadata using IMDSv2
INSTANCE_ID=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/instance-id" 2>/dev/null)
AZ=$(curl -H "X-aws-ec2-metadata-token: $TOKEN" "http://169.254.169.254/latest/meta-data/placement/availability-zone" 2>/dev/null)

echo "Instance ID: $INSTANCE_ID"
echo "Availability Zone: $AZ"

# Configure CloudWatch Agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/amazon-cloudwatch-agent.json << 'EOF'
{
  "agent": {
    "metrics_collection_interval": 60,
    "run_as_user": "cwagent"
  },
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/ec2/$${project_name}-$${environment}/system",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          },
          {
            "file_path": "/var/log/secure",
            "log_group_name": "/aws/ec2/$${project_name}-$${environment}/security",
            "log_stream_name": "{instance_id}",
            "timezone": "UTC"
          }
        ]
      }
    }
  },
  "metrics": {
    "metrics_collected": {
      "disk": {
        "measurement": ["used_percent"],
        "metrics_collection_interval": 60,
        "resources": ["*"]
      },
      "mem": {
        "measurement": ["mem_used_percent"],
        "metrics_collection_interval": 60
      }
    }
  }
}
EOF

# Start CloudWatch Agent
systemctl enable amazon-cloudwatch-agent
systemctl start amazon-cloudwatch-agent

# Create a simple web server for health checks
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Health Check</title>
</head>
<body>
    <h1>Instance is healthy!</h1>
    <p>Instance ID: <span id="instance-id"></span></p>
    <p>Availability Zone: <span id="az"></span></p>
    <p>Region: <span id="region"></span></p>
    <p>Timestamp: <span id="timestamp"></span></p>
</body>
<script>
// Get instance metadata using IMDSv2
async function getMetadata(path) {
    const token = await fetch('http://169.254.169.254/latest/api/token', {
        method: 'PUT',
        headers: {
            'X-aws-ec2-metadata-token-ttl-seconds': '21600'
        }
    }).then(r => r.text());
    
    return fetch(`http://169.254.169.254/latest/meta-data/$${path}`, {
        headers: {
            'X-aws-ec2-metadata-token': token
        }
    }).then(r => r.text());
}

// Get instance metadata using IMDSv2
async function updatePage() {
    try {
        const instanceId = await getMetadata('instance-id');
        const az = await getMetadata('placement/availability-zone');
        const region = az.slice(0, -1);
        
        document.getElementById('instance-id').textContent = instanceId;
        document.getElementById('az').textContent = az;
        document.getElementById('region').textContent = region;
        document.getElementById('timestamp').textContent = new Date().toISOString();
    } catch (error) {
        console.error('Error fetching metadata:', error);
    }
}

updatePage();
setInterval(updatePage, 30000); // Update every 30 seconds
</script>
</html>
EOF

# Start Apache
systemctl enable httpd
systemctl start httpd

# Create a simple health check endpoint
cat > /var/www/cgi-bin/health << 'EOF'
#!/bin/bash
echo "Content-Type: application/json"
echo ""
echo '{"status":"healthy","timestamp":"'$(date -u +%Y-%m-%dT%H:%M:%SZ)'"}'
EOF

chmod +x /var/www/cgi-bin/health

# Configure firewall (if using firewalld)
if systemctl is-active --quiet firewalld; then
    firewall-cmd --permanent --add-service=http
    firewall-cmd --permanent --add-service=https
    firewall-cmd --reload
fi

# Set up log rotation for application logs
cat > /etc/logrotate.d/app-logs << 'EOF'
/var/log/app/*.log {
    daily
    missingok
    rotate 7
    compress
    delaycompress
    notifempty
    create 644 root root
}
EOF

echo "User data script completed successfully"