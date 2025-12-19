#!/bin/bash
# User data script for media streaming EC2 instances

# Update system
yum update -y

# Install CloudWatch agent
wget https://s3.amazonaws.com/amazoncloudwatch-agent/amazon_linux/amd64/latest/amazon-cloudwatch-agent.rpm
rpm -U ./amazon-cloudwatch-agent.rpm

# Install SSM agent (usually pre-installed on Amazon Linux 2)
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Get configuration from SSM Parameter Store
aws ssm get-parameter --name "${ssm_parameter_path}" --region us-east-1 --query 'Parameter.Value' --output text > /tmp/app-config.json

# Install application dependencies
yum install -y docker
systemctl start docker
systemctl enable docker

# Add ec2-user to docker group
usermod -a -G docker ec2-user

# Signal completion
echo "User data script completed successfully"
