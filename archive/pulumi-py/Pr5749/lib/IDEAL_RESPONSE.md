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
    engine_version="13.22",
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

## Key Features

1. **Multi-Environment Support**: Configurable for dev, staging, and production with environment-specific resource sizing
2. **Network Architecture**: Complete VPC setup with public/private/database subnets, NAT Gateway, and routing
3. **Security**: Security groups with least privilege, RDS encryption, S3 encryption and public access blocking
4. **Auto Scaling**: Auto Scaling Groups with environment-specific capacity and health checks
5. **Load Balancing**: Application Load Balancer with target groups and health checks
6. **Monitoring**: CloudWatch alarms for EC2 and RDS CPU utilization
7. **Storage**: S3 bucket with versioning and lifecycle policies
8. **IAM**: Instance profiles with CloudWatch, SSM, and S3 permissions
9. **Multi-Region**: AMI mappings for us-east-1, us-west-2, and eu-west-1
10. **Consistent Tagging**: Environment, EnvironmentSuffix, CostCenter, DeploymentDate tags across all resources
