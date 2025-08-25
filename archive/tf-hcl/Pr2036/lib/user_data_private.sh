#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Install CloudWatch agent configuration
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s -c ssm:${cloudwatch_config_name}

# Install application dependencies
yum install -y docker
systemctl enable docker
systemctl start docker

# Configure application logging
mkdir -p /opt/app/logs
chown ec2-user:ec2-user /opt/app/logs

# Set up log forwarding
cat > /etc/rsyslog.d/50-app.conf << 'EOF'
# Forward application logs to CloudWatch
*.info;mail.none;authpriv.none;cron.none                /var/log/messages
$ModLoad imfile
$InputFileName /opt/app/logs/app.log
$InputFileTag app:
$InputFileStateFile stat-app
$InputFileSeverity info
$InputFileFacility local0
$InputRunFileMonitor
local0.*                                                /var/log/app.log
EOF

systemctl restart rsyslog

# Configure SSH hardening
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd