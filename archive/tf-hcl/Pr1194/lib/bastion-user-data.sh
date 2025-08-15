#!/bin/bash
yum update -y
yum install -y amazon-ssm-agent

# Enable and start SSM Agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install useful tools for troubleshooting
yum install -y htop curl wget postgresql15

echo "Bastion host setup complete" > /var/log/bastion-init.log