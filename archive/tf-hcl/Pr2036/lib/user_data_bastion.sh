#!/bin/bash
yum update -y
yum install -y amazon-cloudwatch-agent

# Install CloudWatch agent configuration
/opt/aws/amazon-cloudwatch-agent/bin/amazon-cloudwatch-agent-ctl \
  -a fetch-config -m ec2 -s -c ssm:${cloudwatch_config_name}

# Configure SSH hardening
sed -i 's/#PermitRootLogin yes/PermitRootLogin no/' /etc/ssh/sshd_config
sed -i 's/#PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
systemctl restart sshd

# Enable fail2ban for additional security
yum install -y epel-release
yum install -y fail2ban
systemctl enable fail2ban
systemctl start fail2ban

# Set up log forwarding
cat > /etc/rsyslog.d/49-bastion.conf << 'EOF'
# Forward bastion logs to CloudWatch
*.info;mail.none;authpriv.none;cron.none                /var/log/messages
authpriv.*                                              /var/log/secure
EOF

systemctl restart rsyslog