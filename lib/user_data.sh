#!/bin/bash
# user_data.sh - EC2 instance initialization script

yum update -y
yum install -y amazon-ssm-agent
systemctl enable amazon-ssm-agent
systemctl start amazon-ssm-agent

# Install CloudWatch agent
yum install -y amazon-cloudwatch-agent

# Configure instance for patch management
aws ssm put-parameter \
  --region ${region} \
  --name "/aws/service/global-infrastructure/regions/${region}/services/ssm" \
  --type "String" \
  --value "available" \
  --overwrite || true

# Tag instance for patch group
INSTANCE_ID=$(curl -s http://169.254.169.254/latest/meta-data/instance-id)
aws ec2 create-tags \
  --region ${region} \
  --resources $INSTANCE_ID \
  --tags Key=PatchGroup,Value=${project_name}-web-servers || true

# Install and start web server
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Secure Infrastructure</title>
</head>
<body>
    <h1>Secure Infrastructure is Running</h1>
    <p>Instance ID: $INSTANCE_ID</p>
    <p>Region: ${region}</p>
</body>
</html>
EOF

# Set proper permissions
chown -R apache:apache /var/www/html
chmod -R 755 /var/www/html