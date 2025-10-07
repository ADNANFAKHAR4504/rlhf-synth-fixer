#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Install Node.js for the application
curl -sL https://rpm.nodesource.com/setup_18.x | bash -
yum install -y nodejs

# Install PM2 process manager
npm install -g pm2

# Create application directory
mkdir -p /opt/app
cd /opt/app

# Create a simple health check endpoint
cat > /opt/app/server.js << 'EOF'
const http = require('http');
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200);
    res.end('OK');
  } else if (req.url.startsWith('/api/')) {
    res.writeHead(200, {'Content-Type': 'application/json'});
    res.end(JSON.stringify({message: 'API endpoint', path: req.url}));
  } else if (req.url.startsWith('/admin/')) {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Admin Panel</h1>');
  } else {
    res.writeHead(200, {'Content-Type': 'text/html'});
    res.end('<h1>Project Management Platform</h1>');
  }
});

server.listen(80, () => {
  console.log('Server running on port 80');
});
EOF

# Start the application with PM2
pm2 start /opt/app/server.js --name project-mgmt
pm2 startup systemd
pm2 save

# Configure CloudWatch agent
cat > /opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json << 'EOF'
{
  "logs": {
    "logs_collected": {
      "files": {
        "collect_list": [
          {
            "file_path": "/var/log/messages",
            "log_group_name": "/aws/application/project-mgmt",
            "log_stream_name": "{instance_id}/messages"
          }
        ]
      }
    }
  },
  "metrics": {
    "namespace": "project-mgmt/Application",
    "metrics_collected": {
      "cpu": {
        "measurement": [
          {
            "name": "cpu_usage_idle",
            "rename": "CPU_IDLE",
            "unit": "Percent"
          }
        ],
        "totalcpu": false
      },
      "mem": {
        "measurement": [
          {
            "name": "mem_used_percent",
            "rename": "MEM_USED",
            "unit": "Percent"
          }
        ]
      }
    }
  }
}
EOF

# Start CloudWatch agent
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
    -a fetch-config \
    -m ec2 \
    -s \
    -c file:/opt/aws/amazon-cloudwatch-agent/etc/cloudwatch-config.json