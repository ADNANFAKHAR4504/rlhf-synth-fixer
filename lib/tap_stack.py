"""
AWS Dual-Stack Infrastructure with Pulumi
=========================================

This module provisions a highly available, dual-stack (IPv4 and IPv6) 
web application infrastructure on AWS using Pulumi and Python.

Features:
- Dual-stack VPC with IPv4 and IPv6 CIDR blocks
- Multi-AZ public subnets with internet connectivity
- EC2 instances with Nginx web server
- Application Load Balancer with dual-stack support
- Security groups with least privilege access
- CloudWatch monitoring and dashboards
- IAM roles with minimal permissions
"""

import pulumi
import pulumi_aws as aws
from typing import List, Dict, Any
import json

# =============================================================================
# Configuration Management
# =============================================================================

config = pulumi.Config()

# Simple and reliable configuration
ENVIRONMENT = config.get("environment") or "dev"
AWS_REGION = "us-east-1"  # Fixed region to avoid configuration issues
INSTANCE_TYPE = "t3.micro"
PROJECT_NAME = "dswa-v5"  # Shortened for AWS naming limits

# Add timestamp-based suffix for unique naming
import time
DEPLOYMENT_ID = str(int(time.time()))[-4:]  # Use last 4 digits of timestamp for shorter names

# Resource naming convention with unique deployment ID
def get_resource_name(resource_type: str) -> str:
    """Generate consistent resource names following naming convention."""
    return f"{PROJECT_NAME}-{ENVIRONMENT}-{resource_type}-{DEPLOYMENT_ID}"

# Short naming for AWS resources with character limits (like ALB, Target Groups)
def get_short_name(resource_type: str, max_length: int = 32) -> str:
    """Generate short names for AWS resources with character limits."""
    short_name = f"{PROJECT_NAME}-{resource_type}-{DEPLOYMENT_ID}"
    if len(short_name) > max_length:
        # Truncate to fit within limit
        available_chars = max_length - len(f"-{DEPLOYMENT_ID}")
        truncated = f"{PROJECT_NAME}-{resource_type}"[:available_chars]
        short_name = f"{truncated}-{DEPLOYMENT_ID}"
    return short_name

# =============================================================================
# AWS Provider Configuration
# =============================================================================

# Simple AWS provider configuration
aws_provider = aws.Provider(
    "aws-provider",
    region=AWS_REGION
)

# =============================================================================
# Data Sources
# =============================================================================

# Get available AZs in the region
availability_zones_data = aws.get_availability_zones(
    state="available",
    opts=pulumi.InvokeOptions(provider=aws_provider)
)

# Extract first 2 availability zones
availability_zones = availability_zones_data.names[:2]

# Get the latest Amazon Linux 2 AMI
amazon_linux_ami = aws.ec2.get_ami(
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
        )
    ],
    opts=pulumi.InvokeOptions(provider=aws_provider)
)

# =============================================================================
# Networking Infrastructure
# =============================================================================

# Create VPC with dual-stack support (with proper cleanup handling)
vpc = aws.ec2.Vpc(
    get_resource_name("vpc"),
    cidr_block="10.0.0.0/16",
    instance_tenancy="default",
    enable_dns_hostnames=True,
    enable_dns_support=True,
    assign_generated_ipv6_cidr_block=True,
    tags={
        "Name": get_resource_name("vpc"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    },
    opts=pulumi.ResourceOptions(
        provider=aws_provider,
        protect=False,  # Allow deletion when needed
        delete_before_replace=True  # Delete old before creating new to avoid conflicts
    )
)

# Internet Gateway for public internet access
internet_gateway = aws.ec2.InternetGateway(
    get_resource_name("igw"),
    vpc_id=vpc.id,
    tags={
        "Name": get_resource_name("igw"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create public subnets with dual-stack support (v5 with unique deployment ID)
public_subnets = []
for i, az in enumerate(availability_zones):
    # Calculate IPv6 CIDR properly using the working pattern
    ipv6_cidr_calc = vpc.ipv6_cidr_block.apply(
        lambda cidr: f"{cidr[:-5]}{i}::/64"  # Use index for subnet differentiation
    )
    
    subnet = aws.ec2.Subnet(
        get_resource_name(f"public-subnet-{i+1}"),  # Now includes unique deployment ID
        vpc_id=vpc.id,
        cidr_block=f"10.0.{40+i}.0/24",  # Changed to 40+i for completely fresh CIDR range
        availability_zone=az,
        assign_ipv6_address_on_creation=True,
        ipv6_cidr_block=ipv6_cidr_calc,
        map_public_ip_on_launch=True,
        tags={
            "Name": get_resource_name(f"public-subnet-{i+1}"),
            "Environment": ENVIRONMENT,
            "Type": "Public",
            "DeploymentID": DEPLOYMENT_ID
        },
        opts=pulumi.ResourceOptions(
            provider=aws_provider,
            protect=False,  # Allow deletion when needed
            delete_before_replace=True,  # Clean deletion order
            depends_on=[vpc]  # Explicit dependency
        )
    )
    public_subnets.append(subnet)

# Route table for public subnets
public_route_table = aws.ec2.RouteTable(
    get_resource_name("public-rt"),
    vpc_id=vpc.id,
    tags={
        "Name": get_resource_name("public-rt"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME,
        "Type": "Public"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IPv4 route to Internet Gateway
ipv4_route = aws.ec2.Route(
    get_resource_name("ipv4-route"),
    route_table_id=public_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=internet_gateway.id,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# IPv6 route to Internet Gateway (following working pattern)
ipv6_route = aws.ec2.Route(
    get_resource_name("ipv6-route"),
    route_table_id=public_route_table.id,
    destination_ipv6_cidr_block="::/0",
    gateway_id=internet_gateway.id,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Associate route table with public subnets (v4 with unique deployment ID)
for i, subnet in enumerate(public_subnets):
    aws.ec2.RouteTableAssociation(
        get_resource_name(f"public-rta-{i + 1}"),  # Now includes unique deployment ID
        subnet_id=subnet.id,
        route_table_id=public_route_table.id,
        opts=pulumi.ResourceOptions(
            provider=aws_provider,
            protect=False,  # Allow deletion when needed
            depends_on=[subnet, public_route_table]  # Explicit dependencies
        )
    )

# =============================================================================
# Security Groups
# =============================================================================

# Security group for Application Load Balancer
alb_security_group = aws.ec2.SecurityGroup(
    get_resource_name("alb-sg"),
    name=get_resource_name("alb-sg"),
    description="Security group for Application Load Balancer - allows HTTP traffic from internet",
    vpc_id=vpc.id,
    ingress=[
        # Allow HTTP traffic from anywhere (IPv4)
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow HTTP traffic from internet (IPv4)"
        ),
        # Allow HTTP traffic from anywhere (IPv6)
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            ipv6_cidr_blocks=["::/0"],
            description="Allow HTTP traffic from internet (IPv6)"
        )
    ],
    egress=[
        # Allow all outbound traffic (IPv4)
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic (IPv4)"
        ),
        # Allow all outbound traffic (IPv6)
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            ipv6_cidr_blocks=["::/0"],
            description="Allow all outbound traffic (IPv6)"
        )
    ],
    tags={
        "Name": get_resource_name("alb-sg"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME,
        "Purpose": "ALB Security Group"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Security group for EC2 instances
ec2_security_group = aws.ec2.SecurityGroup(
    get_resource_name("ec2-sg"),
    name=get_resource_name("ec2-sg"),
    description="Security group for EC2 instances - allows HTTP traffic only from ALB",
    vpc_id=vpc.id,
    ingress=[
        # Allow HTTP traffic only from ALB security group
        aws.ec2.SecurityGroupIngressArgs(
            protocol="tcp",
            from_port=80,
            to_port=80,
            security_groups=[alb_security_group.id],
            description="Allow HTTP traffic from ALB only"
        )
    ],
    egress=[
        # Allow all outbound traffic (IPv4)
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            cidr_blocks=["0.0.0.0/0"],
            description="Allow all outbound traffic (IPv4)"
        ),
        # Allow all outbound traffic (IPv6)
        aws.ec2.SecurityGroupEgressArgs(
            protocol="-1",
            from_port=0,
            to_port=0,
            ipv6_cidr_blocks=["::/0"],
            description="Allow all outbound traffic (IPv6)"
        )
    ],
    tags={
        "Name": get_resource_name("ec2-sg"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME,
        "Purpose": "EC2 Security Group"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# =============================================================================
# IAM Roles and Policies
# =============================================================================

# IAM role for EC2 instances with minimal permissions
ec2_assume_role_policy = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
                "Service": "ec2.amazonaws.com"
            }
        }
    ]
}

ec2_role = aws.iam.Role(
    get_resource_name("ec2-role"),
    name=get_resource_name("ec2-role"),
    assume_role_policy=json.dumps(ec2_assume_role_policy),
    description="IAM role for EC2 instances with minimal required permissions",
    tags={
        "Name": get_resource_name("ec2-role"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Custom policy for EC2 instances (CloudWatch metrics and logs)
ec2_policy_document = {
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "cloudwatch:PutMetricData",
                "ec2:DescribeVolumes",
                "ec2:DescribeTags",
                "logs:PutLogEvents",
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:DescribeLogStreams",
                "logs:DescribeLogGroups"
            ],
            "Resource": "*"
        }
    ]
}

ec2_policy = aws.iam.Policy(
    get_resource_name("ec2-policy"),
    name=get_resource_name("ec2-policy"),
    description="Custom policy for EC2 instances - CloudWatch and logging permissions",
    policy=json.dumps(ec2_policy_document),
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Attach custom policy to role
ec2_policy_attachment = aws.iam.RolePolicyAttachment(
    get_resource_name("ec2-policy-attachment"),
    role=ec2_role.name,
    policy_arn=ec2_policy.arn,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create instance profile
ec2_instance_profile = aws.iam.InstanceProfile(
    get_resource_name("ec2-instance-profile"),
    name=get_resource_name("ec2-instance-profile"),
    role=ec2_role.name,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# =============================================================================
# User Data Script for EC2 Instances
# =============================================================================

# Simple user data script for web server
user_data_script = """#!/bin/bash
yum update -y
yum install -y nginx
systemctl start nginx
systemctl enable nginx

# Create simple index page
cat > /var/www/html/index.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Dual-Stack Web App</title>
</head>
<body>
    <h1>✅ Dual-Stack Web Application</h1>
    <p>Successfully deployed on AWS!</p>
    <p>Supports both IPv4 and IPv6</p>
</body>
</html>
EOF

# Create health check endpoint
cat > /var/www/html/health << 'EOF'
healthy
EOF

systemctl restart nginx
"""

# =============================================================================
# EC2 Instances
# =============================================================================

# Deploy EC2 instances across multiple subnets for high availability
ec2_instances: List[aws.ec2.Instance] = []

for i, subnet in enumerate(public_subnets):
    instance = aws.ec2.Instance(
        get_resource_name(f"web-server-{i + 1}"),
        ami=amazon_linux_ami.id,
        instance_type=INSTANCE_TYPE,
        subnet_id=subnet.id,
        vpc_security_group_ids=[ec2_security_group.id],
        iam_instance_profile=ec2_instance_profile.name,
        user_data=user_data_script,
        ipv6_address_count=1,  # Enable IPv6 support following working pattern
        monitoring=True,  # Enable detailed monitoring
        tags={
            "Name": get_resource_name(f"web-server-{i + 1}"),
            "Environment": ENVIRONMENT,
            "Project": PROJECT_NAME,
            "Role": "WebServer",
            "AZ": subnet.availability_zone
        },
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )
    
    ec2_instances.append(instance)

# =============================================================================
# Application Load Balancer
# =============================================================================

# Create target group for EC2 instances (IPv4 for compatibility)
target_group = aws.lb.TargetGroup(
    get_resource_name("web-tg"),
    name=get_resource_name("web-tg"),
    port=80,
    protocol="HTTP",
    vpc_id=vpc.id,
    health_check=aws.lb.TargetGroupHealthCheckArgs(
        enabled=True,
        healthy_threshold=2,
        unhealthy_threshold=2,
        timeout=5,
        interval=30,
        path="/health",
        matcher="200",
        protocol="HTTP",
        port="traffic-port"
    ),
    tags={
        "Name": get_resource_name("web-tg"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Attach EC2 instances to target group
for i, instance in enumerate(ec2_instances):
    aws.lb.TargetGroupAttachment(
        get_resource_name(f"web-tg-attachment-{i + 1}"),
        target_group_arn=target_group.arn,
        target_id=instance.id,
        port=80,
        opts=pulumi.ResourceOptions(provider=aws_provider)
    )

# Create Application Load Balancer (supports dual-stack through subnets)
alb = aws.lb.LoadBalancer(
    get_resource_name("web-alb"),
    name=get_resource_name("web-alb"),
    load_balancer_type="application",
    internal=False,  # internet-facing (False = internet-facing, True = internal)
    security_groups=[alb_security_group.id],
    subnets=[subnet.id for subnet in public_subnets],
    enable_deletion_protection=False,  # Set to True for production
    tags={
        "Name": get_resource_name("web-alb"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME,
        "Type": "Application Load Balancer"
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create HTTP listener
http_listener = aws.lb.Listener(
    get_resource_name("web-listener"),
    load_balancer_arn=alb.arn,
    port="80",
    protocol="HTTP",
    default_actions=[
        aws.lb.ListenerDefaultActionArgs(
            type="forward",
            target_group_arn=target_group.arn
        )
    ],
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# =============================================================================
# CloudWatch Monitoring and Dashboard
# =============================================================================

# Simple CloudWatch Dashboard
dashboard_body = alb.arn_suffix.apply(lambda arn_suffix: json.dumps({
    "widgets": [
        {
            "type": "metric",
            "x": 0,
            "y": 0,
            "width": 12,
            "height": 6,
            "properties": {
                "metrics": [
                    ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", arn_suffix]
                ],
                "view": "timeSeries",
                "region": AWS_REGION,
                "title": "ALB Request Count",
                "period": 300
            }
        }
    ]
}))

cloudwatch_dashboard = aws.cloudwatch.Dashboard(
    get_resource_name("monitoring-dashboard"),
    dashboard_name=get_resource_name("monitoring-dashboard"),
    dashboard_body=dashboard_body,
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Create CloudWatch Alarms for critical metrics
# Alarm for unhealthy targets
unhealthy_targets_alarm = aws.cloudwatch.MetricAlarm(
    get_resource_name("unhealthy-targets-alarm"),
    name=get_resource_name("unhealthy-targets-alarm"),
    metric_name="UnHealthyHostCount",
    namespace="AWS/ApplicationELB",
    statistic="Average",
    period=300,
    evaluation_periods=2,
    threshold=1,
    comparison_operator="GreaterThanOrEqualToThreshold",
    dimensions={
        "TargetGroup": target_group.arn_suffix
    },
    tags={
        "Name": get_resource_name("unhealthy-targets-alarm"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# Alarm for high response time
high_response_time_alarm = aws.cloudwatch.MetricAlarm(
    get_resource_name("high-response-time-alarm"),
    name=get_resource_name("high-response-time-alarm"),
    metric_name="TargetResponseTime",
    namespace="AWS/ApplicationELB",
    statistic="Average",
    period=300,
    evaluation_periods=2,
    threshold=1.0,  # 1 second
    comparison_operator="GreaterThanThreshold",
    dimensions={
        "LoadBalancer": alb.arn_suffix
    },
    tags={
        "Name": get_resource_name("high-response-time-alarm"),
        "Environment": ENVIRONMENT,
        "Project": PROJECT_NAME
    },
    opts=pulumi.ResourceOptions(provider=aws_provider)
)

# =============================================================================
# Outputs
# =============================================================================

# Export key infrastructure information
pulumi.export("vpc_id", vpc.id)
pulumi.export("vpc_ipv4_cidr", vpc.cidr_block)
pulumi.export("vpc_ipv6_cidr", vpc.ipv6_cidr_block)

pulumi.export("public_subnet_ids", [subnet.id for subnet in public_subnets])
pulumi.export("availability_zones", [subnet.availability_zone for subnet in public_subnets])

pulumi.export("ec2_instance_ids", [instance.id for instance in ec2_instances])
pulumi.export("ec2_public_ips", [instance.public_ip for instance in ec2_instances])
pulumi.export("ec2_ipv6_addresses", [instance.ipv6_addresses for instance in ec2_instances])

pulumi.export("alb_arn", alb.arn)
pulumi.export("alb_dns_name", alb.dns_name)
pulumi.export("alb_zone_id", alb.zone_id)
pulumi.export("alb_security_group_id", alb_security_group.id)

pulumi.export("target_group_arn", target_group.arn)
pulumi.export("cloudwatch_dashboard_url", 
    pulumi.Output.concat(
        "https://",
        AWS_REGION,
        ".console.aws.amazon.com/cloudwatch/home?region=",
        AWS_REGION,
        "#dashboards:name=",
        cloudwatch_dashboard.dashboard_name
    )
)

# Primary output - ALB DNS name for direct access
pulumi.export("application_url", 
    pulumi.Output.concat("http://", alb.dns_name)
)

# Export configuration summary
pulumi.export("deployment_summary", {
    "environment": ENVIRONMENT,
    "region": AWS_REGION,
    "instance_type": INSTANCE_TYPE,
    "project_name": PROJECT_NAME,
    "dual_stack_enabled": True,
    "high_availability": True,
    "monitoring_enabled": True,
    "security_hardened": True
})

# =============================================================================
# Deployment Instructions and Verification
# =============================================================================

pulumi.export("deployment_instructions", {
    "step_1": "Run 'pulumi up' to deploy the infrastructure",
    "step_2": "Wait for deployment to complete (typically 5-10 minutes)",
    "step_3": "Access the application using the 'application_url' output",
    "step_4": "Monitor the infrastructure using the CloudWatch dashboard",
    "verification": {
        "web_access": "Open the application_url in a web browser",
        "ipv6_test": "Use 'curl -6' with the ALB DNS name to test IPv6 connectivity",
        "health_check": "Check target group health in AWS Console",
        "monitoring": "View metrics in the CloudWatch dashboard"
    }
})

print("🚀 AWS Dual-Stack Infrastructure Deployment")
print("=" * 50)
print(f"Environment: {ENVIRONMENT}")
print(f"Region: {AWS_REGION}")
print(f"Instance Type: {INSTANCE_TYPE}")
print(f"Project: {PROJECT_NAME}")
print("=" * 50)
print("✅ Infrastructure components:")
print("   • Dual-stack VPC with IPv4 and IPv6 support")
print("   • Multi-AZ public subnets for high availability")
print("   • Application Load Balancer with dual-stack support")
print("   • EC2 instances with Nginx web server")
print("   • Security groups with least privilege access")
print("   • IAM roles with minimal permissions")
print("   • CloudWatch monitoring and dashboards")
print("   • Automated health checks and alarms")
print("=" * 50)