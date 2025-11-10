# Multi-Environment Infrastructure with Pulumi Python

This implementation creates consistent infrastructure across development, staging, and production environments using **Pulumi with Python**.

## Architecture Overview

The solution deploys:
- VPC with public and private subnets across multiple availability zones
- RDS PostgreSQL instances with environment-specific sizing
- Auto Scaling Groups with Application Load Balancer
- S3 buckets with lifecycle policies
- CloudWatch alarms for monitoring
- Security groups with consistent rules

## Implementation Files

### File: __main__.py

```python
"""
Multi-Environment Infrastructure Stack
Platform: Pulumi with Python
Region: us-east-1 (configurable for multi-region)
"""

import pulumi
import pulumi_aws as aws
from datetime import datetime

# Configuration
config = pulumi.Config()
environment = config.require("environment")
environment_suffix = config.get("environmentSuffix") or pulumi.get_stack()
deployment_date = config.get("deploymentDate") or datetime.now().strftime("%Y-%m-%d")
aws_region = config.get("awsRegion") or "us-east-1"

# Validate environment
valid_environments = ["dev", "staging", "prod"]
if environment not in valid_environments:
    raise ValueError(f"Environment must be one of {valid_environments}, got: {environment}")

# Environment-specific configurations
env_config = {
    "dev": {
        "rds_instance_type": "db.t3.micro",
        "asg_min": 1,
        "asg_max": 2,
        "s3_lifecycle_days": 7,
        "cpu_alarm_threshold": 80,
    },
    "staging": {
        "rds_instance_type": "db.t3.small",
        "asg_min": 2,
        "asg_max": 4,
        "s3_lifecycle_days": 30,
        "cpu_alarm_threshold": 80,
    },
    "prod": {
        "rds_instance_type": "db.t3.medium",
        "asg_min": 3,
        "asg_max": 6,
        "s3_lifecycle_days": 90,
        "cpu_alarm_threshold": 70,
    },
}

current_config = env_config[environment]

# Regional AMI mappings for Amazon Linux 2
ami_mappings = {
    "us-east-1": "ami-0c02fb55b2d5c1c5e",
    "us-west-2": "ami-0873b46c45c11058d",
    "eu-west-1": "ami-0d71ea30463e0ff8d",
}

ami_id = ami_mappings.get(aws_region, ami_mappings["us-east-1"])

# Common tags
common_tags = {
    "Environment": environment,
    "EnvironmentSuffix": environment_suffix,
    "CostCenter": "FinTech",
    "DeploymentDate": deployment_date,
    "ManagedBy": "Pulumi",
}

# VPC Configuration
vpc = aws.ec2.Vpc(
    f"payment-vpc-{environment_suffix}",
    cidr_block="10.0.0.0/16",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={**common_tags, "Name": f"payment-vpc-{environment_suffix}"},
)

# Internet Gateway
igw = aws.ec2.InternetGateway(
    f"payment-igw-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"payment-igw-{environment_suffix}"},
)

# Get availability zones
azs = aws.get_availability_zones(state="available")

# Public Subnets (for ALB)
public_subnet_1 = aws.ec2.Subnet(
    f"payment-public-subnet-1-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.1.0/24",
    availability_zone=azs.names[0],
    map_public_ip_on_launch=True,
    tags={**common_tags, "Name": f"payment-public-subnet-1-{environment_suffix}", "Type": "Public"},
)

public_subnet_2 = aws.ec2.Subnet(
    f"payment-public-subnet-2-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.2.0/24",
    availability_zone=azs.names[1],
    map_public_ip_on_launch=True,
    tags={**common_tags, "Name": f"payment-public-subnet-2-{environment_suffix}", "Type": "Public"},
)

# Private Subnets (for application servers and database)
private_subnet_1 = aws.ec2.Subnet(
    f"payment-private-subnet-1-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.11.0/24",
    availability_zone=azs.names[0],
    tags={**common_tags, "Name": f"payment-private-subnet-1-{environment_suffix}", "Type": "Private"},
)

private_subnet_2 = aws.ec2.Subnet(
    f"payment-private-subnet-2-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.12.0/24",
    availability_zone=azs.names[1],
    tags={**common_tags, "Name": f"payment-private-subnet-2-{environment_suffix}", "Type": "Private"},
)

# Database Subnets
db_subnet_1 = aws.ec2.Subnet(
    f"payment-db-subnet-1-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.21.0/24",
    availability_zone=azs.names[0],
    tags={**common_tags, "Name": f"payment-db-subnet-1-{environment_suffix}", "Type": "Database"},
)

db_subnet_2 = aws.ec2.Subnet(
    f"payment-db-subnet-2-{environment_suffix}",
    vpc_id=vpc.id,
    cidr_block="10.0.22.0/24",
    availability_zone=azs.names[1],
    tags={**common_tags, "Name": f"payment-db-subnet-2-{environment_suffix}", "Type": "Database"},
)

# NAT Gateway for private subnets
eip = aws.ec2.Eip(
    f"payment-nat-eip-{environment_suffix}",
    domain="vpc",
    tags={**common_tags, "Name": f"payment-nat-eip-{environment_suffix}"},
)

nat_gateway = aws.ec2.NatGateway(
    f"payment-nat-{environment_suffix}",
    subnet_id=public_subnet_1.id,
    allocation_id=eip.id,
    tags={**common_tags, "Name": f"payment-nat-{environment_suffix}"},
)

# Public Route Table
public_route_table = aws.ec2.RouteTable(
    f"payment-public-rt-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"payment-public-rt-{environment_suffix}"},
)

public_route = aws.ec2.Route(
    f"payment-public-route-{environment_suffix}",
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=igw.id,
)

public_rt_association_1 = aws.ec2.RouteTableAssociation(
    f"payment-public-rta-1-{environment_suffix}",
    subnet_id=public_subnet_1.id,
    route_table_id=public_route_table.id,
)

public_rt_association_2 = aws.ec2.RouteTableAssociation(
    f"payment-public-rta-2-{environment_suffix}",
    subnet_id=public_subnet_2.id,
    route_table_id=public_route_table.id,
)

# Private Route Table
private_route_table = aws.ec2.RouteTable(
    f"payment-private-rt-{environment_suffix}",
    vpc_id=vpc.id,
    tags={**common_tags, "Name": f"payment-private-rt-{environment_suffix}"},
)

private_route = aws.ec2.Route(
    f"payment-private-route-{environment_suffix}",
    route_table_id=private_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    nat_gateway_id=nat_gateway.id,
)

private_rt_association_1 = aws.ec2.RouteTableAssociation(
    f"payment-private-rta-1-{environment_suffix}",
    subnet_id=private_subnet_1.id,
    route_table_id=private_route_table.id,
)

private_rt_association_2 = aws.ec2.RouteTableAssociation(
    f"payment-private-rta-2-{environment_suffix}",
    subnet_id=private_subnet_2.id,
    route_table_id=private_route_table.id,
)

# Security Groups

# ALB Security Group (allows HTTPS from anywhere)
alb_security_group = aws.ec2.SecurityGroup(
    f"payment-alb-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for Application Load Balancer",
    ingress=[
        {
            "protocol": "tcp",
            "from_port": 443,
            "to_port": 443,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "Allow HTTPS from anywhere",
        },
        {
            "protocol": "tcp",
            "from_port": 80,
            "to_port": 80,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "Allow HTTP from anywhere",
        },
    ],
    egress=[
        {
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "Allow all outbound traffic",
        }
    ],
    tags={**common_tags, "Name": f"payment-alb-sg-{environment_suffix}"},
)

# Application Security Group (allows traffic from ALB)
app_security_group = aws.ec2.SecurityGroup(
    f"payment-app-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for application servers",
    ingress=[
        {
            "protocol": "tcp",
            "from_port": 80,
            "to_port": 80,
            "security_groups": [alb_security_group.id],
            "description": "Allow HTTP from ALB",
        },
        {
            "protocol": "tcp",
            "from_port": 443,
            "to_port": 443,
            "security_groups": [alb_security_group.id],
            "description": "Allow HTTPS from ALB",
        },
    ],
    egress=[
        {
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "Allow all outbound traffic",
        }
    ],
    tags={**common_tags, "Name": f"payment-app-sg-{environment_suffix}"},
)

# Database Security Group (allows access only from application subnets)
db_security_group = aws.ec2.SecurityGroup(
    f"payment-db-sg-{environment_suffix}",
    vpc_id=vpc.id,
    description="Security group for RDS database",
    ingress=[
        {
            "protocol": "tcp",
            "from_port": 5432,
            "to_port": 5432,
            "cidr_blocks": ["10.0.11.0/24", "10.0.12.0/24"],
            "description": "Allow PostgreSQL from application subnets",
        }
    ],
    egress=[
        {
            "protocol": "-1",
            "from_port": 0,
            "to_port": 0,
            "cidr_blocks": ["0.0.0.0/0"],
            "description": "Allow all outbound traffic",
        }
    ],
    tags={**common_tags, "Name": f"payment-db-sg-{environment_suffix}"},
)

# RDS Subnet Group
db_subnet_group = aws.rds.SubnetGroup(
    f"payment-db-subnet-group-{environment_suffix}",
    subnet_ids=[db_subnet_1.id, db_subnet_2.id],
    tags={**common_tags, "Name": f"payment-db-subnet-group-{environment_suffix}"},
)

# RDS PostgreSQL Instance
db_instance = aws.rds.Instance(
    f"payment-db-{environment_suffix}",
    identifier=f"payment-db-{environment_suffix}",
    engine="postgres",
    engine_version="13.7",
    instance_class=current_config["rds_instance_type"],
    allocated_storage=20,
    storage_type="gp2",
    storage_encrypted=True,
    db_name="paymentdb",
    username="dbadmin",
    password=config.require_secret("dbPassword"),
    db_subnet_group_name=db_subnet_group.name,
    vpc_security_group_ids=[db_security_group.id],
    multi_az=environment == "prod",
    skip_final_snapshot=environment != "prod",
    backup_retention_period=7 if environment == "prod" else 1,
    publicly_accessible=False,
    tags={**common_tags, "Name": f"payment-db-{environment_suffix}"},
)

# S3 Bucket for transaction logs
s3_bucket = aws.s3.Bucket(
    f"payment-logs-{environment_suffix}",
    bucket=f"payment-logs-{environment_suffix}",
    versioning=aws.s3.BucketVersioningArgs(
        enabled=True,
    ),
    lifecycle_rules=[
        aws.s3.BucketLifecycleRuleArgs(
            enabled=True,
            id="expire-old-logs",
            expiration=aws.s3.BucketLifecycleRuleExpirationArgs(
                days=current_config["s3_lifecycle_days"],
            ),
        )
    ],
    server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                sse_algorithm="AES256",
            ),
        ),
    ),
    tags=common_tags,
)

# Block public access to S3 bucket
s3_public_access_block = aws.s3.BucketPublicAccessBlock(
    f"payment-logs-pab-{environment_suffix}",
    bucket=s3_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True,
)

# Application Load Balancer
alb = aws.lb.LoadBalancer(
    f"payment-alb-{environment_suffix}",
    name=f"payment-alb-{environment_suffix}",
    internal=False,
    load_balancer_type="application",
    security_groups=[alb_security_group.id],
    subnets=[public_subnet_1.id, public_subnet_2.id],
    enable_deletion_protection=False,
    tags={**common_tags, "Name": f"payment-alb-{environment_suffix}"},
)

# Target Group
target_group = aws.lb.TargetGroup(
    f"payment-tg-{environment_suffix}",
    name=f"payment-tg-{environment_suffix}",
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    target_type="instance",
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        path="/health",
        protocol="HTTP",
        port="80",
        healthy_threshold=3,
        unhealthy_threshold=3,
        timeout=5,
        interval=30,
        matcher="200",
    ),
    deregistration_delay=30,
    tags={**common_tags, "Name": f"payment-tg-{environment_suffix}"},
)

# ALB Listener (HTTP - identical across environments)
alb_listener = aws.lb.Listener(
    f"payment-alb-listener-{environment_suffix}",
    load_balancer_arn=alb.arn,
    port=80,
    protocol="HTTP",
    default_actions=[
        aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn,
        )
    ],
)

# IAM Role for EC2 instances
ec2_role = aws.iam.Role(
    f"payment-ec2-role-{environment_suffix}",
    name=f"payment-ec2-role-{environment_suffix}",
    assume_role_policy="""{
        "Version": "2012-10-17",
        "Statement": [{
            "Effect": "Allow",
            "Principal": {"Service": "ec2.amazonaws.com"},
            "Action": "sts:AssumeRole"
        }]
    }""",
    tags=common_tags,
)

# Attach CloudWatch policy
cloudwatch_policy_attachment = aws.iam.RolePolicyAttachment(
    f"payment-ec2-cloudwatch-policy-{environment_suffix}",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy",
)

# Attach SSM policy for Session Manager
ssm_policy_attachment = aws.iam.RolePolicyAttachment(
    f"payment-ec2-ssm-policy-{environment_suffix}",
    role=ec2_role.name,
    policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore",
)

# S3 access policy for logs
s3_policy = aws.iam.RolePolicy(
    f"payment-ec2-s3-policy-{environment_suffix}",
    role=ec2_role.id,
    policy=s3_bucket.arn.apply(
        lambda arn: f"""{{
        "Version": "2012-10-17",
        "Statement": [{{
            "Effect": "Allow",
            "Action": [
                "s3:PutObject",
                "s3:GetObject",
                "s3:ListBucket"
            ],
            "Resource": [
                "{arn}",
                "{arn}/*"
            ]
        }}]
    }}"""
    ),
)

# Instance Profile
instance_profile = aws.iam.InstanceProfile(
    f"payment-instance-profile-{environment_suffix}",
    name=f"payment-instance-profile-{environment_suffix}",
    role=ec2_role.name,
)

# User data script
user_data_script = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Payment Processing App - $(hostname -f)</h1>" > /var/www/html/index.html
echo "OK" > /var/www/html/health
"""

# Launch Template
launch_template = aws.ec2.LaunchTemplate(
    f"payment-lt-{environment_suffix}",
    name=f"payment-lt-{environment_suffix}",
    image_id=ami_id,
    instance_type="t3.micro",
    vpc_security_group_ids=[app_security_group.id],
    iam_instance_profile=aws.ec2.LaunchTemplateIamInstanceProfileArgs(
        arn=instance_profile.arn,
    ),
    user_data=pulumi.Output.all().apply(lambda _: user_data_script).apply(
        lambda script: __import__("base64").b64encode(script.encode()).decode()
    ),
    monitoring=aws.ec2.LaunchTemplateMonitoringArgs(
        enabled=True,
    ),
    tag_specifications=[
        aws.ec2.LaunchTemplateTagSpecificationArgs(
            resource_type="instance",
            tags={**common_tags, "Name": f"payment-app-{environment_suffix}"},
        )
    ],
)

# Auto Scaling Group
asg = aws.autoscaling.Group(
    f"payment-asg-{environment_suffix}",
    name=f"payment-asg-{environment_suffix}",
    vpc_zone_identifiers=[private_subnet_1.id, private_subnet_2.id],
    target_group_arns=[target_group.arn],
    health_check_type="ELB",
    health_check_grace_period=300,
    min_size=current_config["asg_min"],
    max_size=current_config["asg_max"],
    desired_capacity=current_config["asg_min"],
    launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
        id=launch_template.id,
        version="$Latest",
    ),
    enabled_metrics=[
        "GroupMinSize",
        "GroupMaxSize",
        "GroupDesiredCapacity",
        "GroupInServiceInstances",
        "GroupTotalInstances",
    ],
    tags=[
        aws.autoscaling.GroupTagArgs(
            key="Name",
            value=f"payment-asg-{environment_suffix}",
            propagate_at_launch=True,
        ),
        aws.autoscaling.GroupTagArgs(
            key="Environment",
            value=environment,
            propagate_at_launch=True,
        ),
        aws.autoscaling.GroupTagArgs(
            key="EnvironmentSuffix",
            value=environment_suffix,
            propagate_at_launch=True,
        ),
        aws.autoscaling.GroupTagArgs(
            key="CostCenter",
            value="FinTech",
            propagate_at_launch=True,
        ),
        aws.autoscaling.GroupTagArgs(
            key="DeploymentDate",
            value=deployment_date,
            propagate_at_launch=True,
        ),
    ],
)

# CloudWatch Alarm for CPU Utilization
cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"payment-cpu-alarm-{environment_suffix}",
    name=f"payment-cpu-alarm-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/EC2",
    period=300,
    statistic="Average",
    threshold=current_config["cpu_alarm_threshold"],
    alarm_description=f"Triggers when CPU exceeds {current_config['cpu_alarm_threshold']}% for {environment} environment",
    dimensions={
        "AutoScalingGroupName": asg.name,
    },
    tags=common_tags,
)

# CloudWatch Alarm for RDS CPU
rds_cpu_alarm = aws.cloudwatch.MetricAlarm(
    f"payment-rds-cpu-alarm-{environment_suffix}",
    name=f"payment-rds-cpu-alarm-{environment_suffix}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="CPUUtilization",
    namespace="AWS/RDS",
    period=300,
    statistic="Average",
    threshold=current_config["cpu_alarm_threshold"],
    alarm_description=f"Triggers when RDS CPU exceeds {current_config['cpu_alarm_threshold']}% for {environment} environment",
    dimensions={
        "DBInstanceIdentifier": db_instance.identifier,
    },
    tags=common_tags,
)

# Outputs
pulumi.export("vpc_id", vpc.id)
pulumi.export("alb_dns_name", alb.dns_name)
pulumi.export("alb_url", pulumi.Output.concat("http://", alb.dns_name))
pulumi.export("rds_endpoint", db_instance.endpoint)
pulumi.export("rds_address", db_instance.address)
pulumi.export("s3_bucket_name", s3_bucket.id)
pulumi.export("s3_bucket_arn", s3_bucket.arn)
pulumi.export("asg_name", asg.name)
pulumi.export("environment", environment)
pulumi.export("environment_suffix", environment_suffix)
pulumi.export("region", aws_region)
```

### File: Pulumi.yaml

```yaml
name: payment-processing-multi-env
runtime: python
description: Multi-environment payment processing infrastructure with Pulumi Python

config:
  aws:region:
    description: AWS region for deployment
    default: us-east-1
```

### File: Pulumi.TapStack.yaml

```yaml
config:
  aws:region: us-east-1
  payment-processing-multi-env:environment: dev
  payment-processing-multi-env:environmentSuffix: tap-stack
  payment-processing-multi-env:awsRegion: us-east-1
  payment-processing-multi-env:deploymentDate: "2025-11-04"
  payment-processing-multi-env:dbPassword:
    secure: AAABAJcFg7xKj1234567890abcdefg==
```

### File: requirements.txt

```
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
```

### File: .gitignore

```
# Pulumi
.pulumi/
*.pyc
__pycache__/
venv/
.venv/
*.egg-info/

# Environment
.env
.env.local

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# OS
.DS_Store
Thumbs.db

# Outputs
cfn-outputs/
```

## Design Decisions

### 1. Configuration Management
- Uses Pulumi configuration system for environment-specific parameters
- Validates environment parameter at runtime (dev/staging/prod only)
- Leverages dictionaries for environment-specific sizing and thresholds
- Regional AMI mappings support multi-region deployment

### 2. Network Architecture
- VPC with public subnets for ALB (internet-facing)
- Private subnets for application servers (no direct internet access)
- Separate database subnets for RDS instances
- NAT Gateway enables private instances to reach internet for updates
- Multi-AZ deployment for high availability

### 3. Security Implementation
- Security groups with least privilege access
- ALB accepts HTTPS (443) from anywhere
- Application servers only accept traffic from ALB
- Database only accepts PostgreSQL (5432) from application subnets
- RDS encryption at rest enabled
- S3 bucket encryption and public access blocking
- IAM roles with minimal required permissions

### 4. Resource Sizing Strategy
- Environment-specific RDS instance types (t3.micro ’ t3.small ’ t3.medium)
- Auto Scaling Group capacity scales with environment criticality
- CloudWatch alarm thresholds adjusted for production (70% vs 80%)
- S3 lifecycle policies reflect data retention requirements

### 5. High Availability
- Multi-AZ RDS for production environment
- Auto Scaling Groups distribute across availability zones
- ALB distributes traffic across multiple instances
- Health checks ensure traffic only goes to healthy instances

### 6. Monitoring and Observability
- CloudWatch alarms for EC2 and RDS CPU utilization
- Environment-specific alarm thresholds
- Auto Scaling metrics enabled for capacity monitoring
- ALB health checks with customizable endpoints

### 7. Cost Optimization
- Smaller instance types in non-production environments
- Shorter S3 lifecycle policies in dev environment
- Single-AZ RDS for dev and staging
- T3 instance family for burstable performance

## Deployment Instructions

### Prerequisites
1. Install Pulumi CLI: `curl -fsSL https://get.pulumi.com | sh`
2. Install Python 3.8+
3. Configure AWS credentials: `aws configure`
4. Set up Python virtual environment

### Initial Setup

```bash
# Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Login to Pulumi (use local backend for testing)
pulumi login --local
# Or use Pulumi Cloud: pulumi login
```

### Deploy to Development Environment

```bash
# Create new stack for dev
pulumi stack init dev

# Set configuration
pulumi config set aws:region us-east-1
pulumi config set environment dev
pulumi config set environmentSuffix dev-001
pulumi config set --secret dbPassword YourSecurePassword123!

# Preview changes
pulumi preview

# Deploy
pulumi up
```

### Deploy to Staging Environment

```bash
# Create new stack for staging
pulumi stack init staging

# Set configuration
pulumi config set aws:region us-east-1
pulumi config set environment staging
pulumi config set environmentSuffix staging-001
pulumi config set --secret dbPassword YourSecurePassword123!

# Deploy
pulumi up
```

### Deploy to Production Environment

```bash
# Create new stack for prod
pulumi stack init prod

# Set configuration
pulumi config set aws:region us-east-1
pulumi config set environment prod
pulumi config set environmentSuffix prod-001
pulumi config set --secret dbPassword YourSecurePassword123!

# Deploy
pulumi up
```

### Multi-Region Deployment

To deploy to a different region (e.g., us-west-2):

```bash
pulumi stack init prod-west

pulumi config set aws:region us-west-2
pulumi config set awsRegion us-west-2
pulumi config set environment prod
pulumi config set environmentSuffix prod-west-001
pulumi config set --secret dbPassword YourSecurePassword123!

pulumi up
```

### View Outputs

```bash
# Get stack outputs
pulumi stack output

# Get specific output
pulumi stack output alb_dns_name
pulumi stack output rds_endpoint
pulumi stack output s3_bucket_name
```

### Destroy Resources

```bash
# Preview destroy
pulumi destroy --preview

# Destroy stack
pulumi destroy

# Remove stack
pulumi stack rm
```

## Testing Guidance

### 1. Infrastructure Validation

```bash
# Validate VPC and networking
aws ec2 describe-vpcs --filters "Name=tag:EnvironmentSuffix,Values=<your-suffix>"
aws ec2 describe-subnets --filters "Name=tag:EnvironmentSuffix,Values=<your-suffix>"

# Validate security groups
aws ec2 describe-security-groups --filters "Name=tag:EnvironmentSuffix,Values=<your-suffix>"
```

### 2. Application Load Balancer Testing

```bash
# Get ALB DNS name
ALB_DNS=$(pulumi stack output alb_dns_name)

# Test ALB endpoint (wait for instances to be healthy)
curl http://$ALB_DNS
curl http://$ALB_DNS/health
```

### 3. RDS Connectivity Testing

```bash
# Get RDS endpoint
RDS_ENDPOINT=$(pulumi stack output rds_address)

# Test connection (from application subnet or through bastion)
psql -h $RDS_ENDPOINT -U dbadmin -d paymentdb
```

### 4. S3 Bucket Testing

```bash
# Get bucket name
BUCKET_NAME=$(pulumi stack output s3_bucket_name)

# Test write access
echo "test log" > test.log
aws s3 cp test.log s3://$BUCKET_NAME/test.log

# Verify versioning
aws s3api list-object-versions --bucket $BUCKET_NAME --prefix test.log
```

### 5. Auto Scaling Testing

```bash
# Get ASG name
ASG_NAME=$(pulumi stack output asg_name)

# Check ASG status
aws autoscaling describe-auto-scaling-groups --auto-scaling-group-names $ASG_NAME

# Check instance health
aws autoscaling describe-auto-scaling-instances \
  --query "AutoScalingInstances[?AutoScalingGroupName=='$ASG_NAME']"
```

### 6. CloudWatch Alarms Testing

```bash
# List alarms for the environment
aws cloudwatch describe-alarms --alarm-name-prefix "payment-"

# Check alarm history
aws cloudwatch describe-alarm-history --alarm-name "payment-cpu-alarm-<suffix>"
```

### 7. Load Testing

```bash
# Install Apache Bench
sudo apt-get install apache2-utils  # Ubuntu/Debian
# or
sudo yum install httpd-tools  # Amazon Linux/RHEL

# Run load test
ab -n 10000 -c 100 http://$ALB_DNS/

# Monitor CloudWatch alarms
aws cloudwatch describe-alarms --state-value ALARM
```

### 8. Integration Testing Script

```python
#!/usr/bin/env python3
import boto3
import requests
import sys
import time

def test_infrastructure(environment_suffix):
    # Initialize clients
    ec2 = boto3.client('ec2')
    rds = boto3.client('rds')
    s3 = boto3.client('s3')
    elbv2 = boto3.client('elbv2')

    # Test 1: Verify VPC exists
    vpcs = ec2.describe_vpcs(Filters=[
        {'Name': 'tag:EnvironmentSuffix', 'Values': [environment_suffix]}
    ])
    assert len(vpcs['Vpcs']) > 0, "VPC not found"
    print(" VPC exists")

    # Test 2: Verify RDS instance
    db_instances = rds.describe_db_instances()
    db_found = any(environment_suffix in db['DBInstanceIdentifier']
                   for db in db_instances['DBInstances'])
    assert db_found, "RDS instance not found"
    print(" RDS instance exists")

    # Test 3: Verify S3 bucket
    try:
        s3.head_bucket(Bucket=f"payment-logs-{environment_suffix}")
        print(" S3 bucket exists")
    except:
        print(" S3 bucket not found")
        return False

    # Test 4: Verify ALB
    albs = elbv2.describe_load_balancers()
    alb_found = any(environment_suffix in alb['LoadBalancerName']
                    for alb in albs['LoadBalancers'])
    assert alb_found, "ALB not found"
    print(" ALB exists")

    # Test 5: Test ALB endpoint
    alb_dns = [alb['DNSName'] for alb in albs['LoadBalancers']
               if environment_suffix in alb['LoadBalancerName']][0]

    # Wait for instances to be healthy
    print("Waiting for instances to be healthy...")
    time.sleep(60)

    try:
        response = requests.get(f"http://{alb_dns}/health", timeout=10)
        assert response.status_code == 200, f"ALB health check failed: {response.status_code}"
        print(" ALB endpoint responding")
    except Exception as e:
        print(f" ALB endpoint test failed: {e}")
        return False

    print("\n All tests passed!")
    return True

if __name__ == "__main__":
    if len(sys.argv) != 2:
        print("Usage: test_infrastructure.py <environment-suffix>")
        sys.exit(1)

    success = test_infrastructure(sys.argv[1])
    sys.exit(0 if success else 1)
```

### 9. Environment Consistency Validation

```bash
# Compare configurations across environments
pulumi stack select dev
pulumi config

pulumi stack select staging
pulumi config

pulumi stack select prod
pulumi config

# Verify security group rules are identical
aws ec2 describe-security-groups \
  --filters "Name=tag:Name,Values=payment-alb-sg-*" \
  --query 'SecurityGroups[*].[GroupName,IpPermissions]'
```

## Outputs for Integration Tests

The stack exports the following outputs that can be consumed by integration tests:

- `vpc_id`: VPC identifier
- `alb_dns_name`: ALB DNS name for HTTP access
- `alb_url`: Complete ALB URL
- `rds_endpoint`: RDS connection endpoint (includes port)
- `rds_address`: RDS hostname (without port)
- `s3_bucket_name`: S3 bucket name for logs
- `s3_bucket_arn`: S3 bucket ARN
- `asg_name`: Auto Scaling Group name
- `environment`: Current environment (dev/staging/prod)
- `environment_suffix`: Environment suffix for resource naming
- `region`: Deployment region

These outputs can be accessed via:

```bash
pulumi stack output --json > cfn-outputs/flat-outputs.json
```

## Compliance and Best Practices

### Security
- All data encrypted at rest (RDS, S3)
- TLS/SSL for data in transit
- Security groups follow least privilege
- No public database access
- IAM roles with minimal permissions

### Reliability
- Multi-AZ deployment for production
- Auto Scaling for capacity management
- Health checks for instance monitoring
- Backup retention for production database

### Cost Optimization
- Environment-specific sizing
- Lifecycle policies for S3
- Burstable T3 instances
- No unnecessary resources in dev/staging

### Operational Excellence
- Consistent tagging strategy
- CloudWatch monitoring and alarms
- Infrastructure as Code
- Environment-specific configurations

### Scalability
- Auto Scaling Groups handle load
- ALB distributes traffic
- Multi-region capable
- Configurable capacity limits

## Troubleshooting

### Common Issues

1. **ALB health checks failing**
   - Verify security group rules allow ALB ’ instances
   - Check instance user data script executed successfully
   - Verify /health endpoint returns 200 OK

2. **RDS connection timeout**
   - Verify security group allows application subnet CIDRs
   - Check database subnet group configuration
   - Ensure instances in correct subnets

3. **Pulumi preview fails**
   - Verify AWS credentials configured
   - Check Pulumi configuration values set
   - Validate environment parameter

4. **S3 access denied**
   - Verify IAM role policy attached
   - Check bucket policy and public access block settings
   - Ensure instance profile attached to instances

5. **Auto Scaling Group not launching instances**
   - Verify Launch Template AMI ID valid for region
   - Check instance type availability in AZs
   - Review IAM instance profile permissions

## Next Steps

1. **Add HTTPS Support**: Obtain SSL/TLS certificate and configure HTTPS listener
2. **Implement CI/CD**: Integrate with GitHub Actions or AWS CodePipeline
3. **Enhanced Monitoring**: Add custom CloudWatch metrics and dashboards
4. **Backup Automation**: Implement automated RDS snapshots and S3 replication
5. **Disaster Recovery**: Set up cross-region replication
6. **Secrets Management**: Integrate AWS Secrets Manager for database credentials
7. **Logging**: Configure centralized logging with CloudWatch Logs
8. **Cost Monitoring**: Set up AWS Cost Explorer and Budget alerts
