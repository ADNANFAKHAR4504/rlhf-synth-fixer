# AWS Web Application Infrastructure with Pulumi

Here's a complete Python script using Pulumi to deploy AWS infrastructure for a web application with environment-specific configurations:

```python
#!/usr/bin/env python3
"""
AWS Web Application Infrastructure using Pulumi
Supports development and production environments with conditional configurations.
"""

import pulumi
import pulumi_aws as aws
import os
from typing import Dict, Any

# Configuration Management
# Get environment from Pulumi config or environment variable
config = pulumi.Config()
environment = config.get("environment") or os.getenv("ENVIRONMENT", "development")

# Validate environment
if environment not in ["development", "production"]:
    raise ValueError(f"Invalid environment: {environment}. Must be 'development' or 'production'")

# Set AWS region
aws_region = "us-west-2"

# Environment-specific configurations
def get_environment_config(env: str) -> Dict[str, Any]:
    """Return environment-specific configuration values."""
    configs = {
        "development": {
            "debug": True,
            "log_level": "debug",
            "instance_type": "t3.micro",
            "tags": {
                "Environment": "development",
                "Project": "web-app",
                "Owner": "dev-team"
            }
        },
        "production": {
            "debug": False,
            "log_level": "info",
            "instance_type": "t3.small",
            "tags": {
                "Environment": "production",
                "Project": "web-app",
                "Owner": "ops-team"
            }
        }
    }
    return configs[env]

# Get current environment configuration
env_config = get_environment_config(environment)

# Create VPC and Security Group
vpc = aws.ec2.get_vpc(default=True)

# Security Group for EC2 instance
security_group = aws.ec2.SecurityGroup(
    f"web-app-sg-{environment}",
    description=f"Security group for web application - {environment}",
    vpc_id=vpc.id,
    ingress=[
        # HTTP access
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
            description="HTTP access"
        ),
        # SSH access
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=22,
            to_port=22,
            cidr_blocks=["0.0.0.0/0"],
            description="SSH access"
        ),
    ],
    egress=[
        # Allow all outbound traffic
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="All outbound traffic"
        ),
    ],
    tags={
        **env_config["tags"],
        "Name": f"web-app-sg-{environment}"
    }
)

# Get the latest Amazon Linux 2 AMI
ami = aws.ec2.get_ami(
    most_recent=True,
    owners=["amazon"],
    filters=[
        aws.ec2.GetAmiFilterArgs(
            name="name",
            values=["amzn2-ami-hvm-*-x86_64-gp2"]
        ),
        aws.ec2.GetAmiFilterArgs(
            name="virtualization-type",
            values=["hvm"]
        ),
    ]
)

# User data script for EC2 instance
user_data_script = f"""#!/bin/bash
# Environment Configuration
export DEBUG={str(env_config["debug"]).lower()}
export LOG_LEVEL={env_config["log_level"]}
export ENVIRONMENT={environment}

# Update system
yum update -y

# Install and start Apache web server
yum install -y httpd
systemctl start httpd
systemctl enable httpd

# Create a simple index page with environment info
cat > /var/www/html/index.html << EOF
<!DOCTYPE html>
<html>
<head>
    <title>Web Application - {environment.title()}</title>
    <style>
        body {{ font-family: Arial, sans-serif; margin: 40px; }}
        .container {{ max-width: 600px; margin: 0 auto; }}
        .env-{environment} {{ background-color: {"#e8f5e8" if environment == "production" else "#fff3cd"}; }}
        .info {{ background-color: #f8f9fa; padding: 20px; border-radius: 5px; }}
    </style>
</head>
<body class="env-{environment}">
    <div class="container">
        <h1>Web Application</h1>
        <div class="info">
            <h2>Environment Information</h2>
            <p><strong>Environment:</strong> {environment}</p>
            <p><strong>Debug Mode:</strong> {env_config["debug"]}</p>
            <p><strong>Log Level:</strong> {env_config["log_level"]}</p>
            <p><strong>AWS Region:</strong> {aws_region}</p>
            <p><strong>Instance Type:</strong> {env_config["instance_type"]}</p>
        </div>
    </div>
</body>
</html>
EOF

# Set environment variables in /etc/environment for persistence
echo "DEBUG={str(env_config["debug"]).lower()}" >> /etc/environment
echo "LOG_LEVEL={env_config["log_level"]}" >> /etc/environment
echo "ENVIRONMENT={environment}" >> /etc/environment

# Log deployment information
echo "$(date): Web application deployed in {environment} environment" >> /var/log/deployment.log
"""

# EC2 Instance
ec2_instance = aws.ec2.Instance(
    f"web-app-instance-{environment}",
    ami=ami.id,
    instance_type=env_config["instance_type"],
    vpc_security_group_ids=[security_group.id],
    user_data=user_data_script,
    tags={
        **env_config["tags"],
        "Name": f"web-app-instance-{environment}"
    },
    opts=pulumi.ResourceOptions(
        depends_on=[security_group]
    )
)

# S3 Bucket with environment-specific naming
bucket_name = f"web-app-{environment}-{pulumi.get_stack()}-{pulumi.get_organization() or 'default'}"

s3_bucket = aws.s3.Bucket(
    f"web-app-bucket-{environment}",
    bucket=bucket_name,
    tags={
        **env_config["tags"],
        "Name": f"web-app-bucket-{environment}"
    }
)

# Enable versioning on S3 bucket
s3_bucket_versioning = aws.s3.BucketVersioningV2(
    f"web-app-bucket-versioning-{environment}",
    bucket=s3_bucket.id,
    versioning_configuration=aws.s3.BucketVersioningV2VersioningConfigurationArgs(
        status="Enabled"
    )
)

# S3 Bucket public access block (security best practice)
s3_bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"web-app-bucket-pab-{environment}",
    bucket=s3_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# Outputs
pulumi.export("environment", environment)
pulumi.export("debug_mode", env_config["debug"])
pulumi.export("log_level", env_config["log_level"])
pulumi.export("ec2_instance_id", ec2_instance.id)
pulumi.export("ec2_instance_public_ip", ec2_instance.public_ip)
pulumi.export("ec2_instance_public_dns", ec2_instance.public_dns)
pulumi.export("s3_bucket_name", s3_bucket.bucket)
pulumi.export("s3_bucket_arn", s3_bucket.arn)
pulumi.export("security_group_id", security_group.id)
pulumi.export("ami_id", ami.id)
pulumi.export("aws_region", aws_region)

# Print environment information
print(f"Deploying to environment: {environment}")
print(f"Debug mode: {env_config['debug']}")
print(f"Log level: {env_config['log_level']}")
print(f"Instance type: {env_config['instance_type']}")
```

## Usage Instructions

### 1. Prerequisites
Make sure you have the required dependencies installed:

```bash
pip install pulumi pulumi-aws
```

### 2. AWS Configuration
Ensure your AWS credentials are configured:

```bash
aws configure
# or set environment variables:
# export AWS_ACCESS_KEY_ID=your_access_key
# export AWS_SECRET_ACCESS_KEY=your_secret_key
```

### 3. Initialize Pulumi Project
```bash
pulumi new python --name web-app-infrastructure
# Replace the generated __main__.py with the script above
```

### 4. Deploy Infrastructure

**Option 1: Using Pulumi Configuration**
```bash
# For development environment
pulumi config set environment development
pulumi up

# For production environment
pulumi config set environment production
pulumi up
```

**Option 2: Using Environment Variables**
```bash
# For development environment
export ENVIRONMENT=development
pulumi up

# For production environment
export ENVIRONMENT=production
pulumi up
```

### 5. Access Your Application
After deployment, you can access your web application using the public IP or DNS name exported by Pulumi:

```bash
# Get the public IP
pulumi stack output ec2_instance_public_ip

# Visit http://<public_ip> in your browser
```

## Key Features

### Environment-Specific Behavior
- **Development**: Debug mode enabled, debug log level, smaller instance type
- **Production**: Debug mode disabled, info log level, larger instance type

### Security Features
- Security group with controlled access (HTTP and SSH only)
- S3 bucket with public access blocked
- Environment-specific tagging for resource management

### Resource Management
- Unique S3 bucket naming to avoid conflicts
- Proper resource dependencies
- Comprehensive tagging strategy

### Monitoring and Outputs
- All important resource information exported as Pulumi outputs
- Environment variables set on EC2 instance
- Deployment logging for troubleshooting

This script provides a robust foundation for deploying AWS infrastructure with environment-specific configurations using Pulumi and Python.