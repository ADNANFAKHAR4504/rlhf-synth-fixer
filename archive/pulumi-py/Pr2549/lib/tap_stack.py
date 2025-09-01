"""
TAP Stack - Secure Cloud Network Environment
============================================

This Pulumi stack creates a secure cloud network environment with:
- VPC with CIDR block 10.0.0.0/16
- Two subnets across different availability zones
- Internet Gateway for external connectivity
- Route table with internet access
- Two EC2 instances with SSH access
- Security group configuration

Author: Infrastructure Team
Date: 2025
"""

import pulumi
import pulumi_aws as aws
from typing import Dict, Any

# Configuration and Parameters
# ===========================

# Stack configuration
config = pulumi.Config()

# Parameterized AMI ID - can be overridden via config
ami_id = config.get("ami_id") or "ami-0c02fb55956c7d316"  # Amazon Linux 2 AMI for us-east-1

# Network Configuration
vpc_cidr = "10.0.0.0/16"
subnet_cidrs = ["10.0.1.0/24", "10.0.2.0/24"]
region = "us-east-1"

# Tags Configuration
common_tags = {
    "Environment": "production",
    "Project": "TAP-Infrastructure",
    "ManagedBy": "Pulumi",
    "Team": "Infrastructure"
}

# Instance Configuration
instance_type = "t2.micro"
key_name = config.get("key_name")  # Make key_name optional - can be None

# VPC Resource
# ============

vpc = aws.ec2.Vpc(
    "MainVPC",
    cidr_block=vpc_cidr,
    enable_dns_hostnames=True,
    enable_dns_support=True,
    tags={
        **common_tags,
        "Name": "MainVPC",
        "Purpose": "Primary network for application infrastructure"
    }
)

# Internet Gateway
# ================

internet_gateway = aws.ec2.InternetGateway(
    "MainInternetGateway",
    vpc_id=vpc.id,
    tags={
        **common_tags,
        "Name": "MainInternetGateway",
        "Purpose": "Provides internet connectivity to VPC"
    }
)

# Subnets
# ========

# Get available AZs in the region
azs = aws.get_availability_zones(state="available")

# Validate we have enough AZs for our subnets
if len(azs.names) < len(subnet_cidrs):
    raise ValueError(f"Not enough availability zones. Need {len(subnet_cidrs)}, got {len(azs.names)}")

# Create subnets in different availability zones
subnets = []
for i, cidr in enumerate(subnet_cidrs):
    subnet = aws.ec2.Subnet(
        f"Subnet{i+1}",
        vpc_id=vpc.id,
        cidr_block=cidr,
        availability_zone=azs.names[i],
        map_public_ip_on_launch=True,  # Enable auto-assign public IP
        tags={
            **common_tags,
            "Name": f"Subnet{i+1}",
            "Purpose": f"Subnet {i+1} for application tier",
            "Tier": "Application"
        }
    )
    subnets.append(subnet)

# Route Table
# ===========

# Main route table
main_route_table = aws.ec2.RouteTable(
    "MainRouteTable",
    vpc_id=vpc.id,
    tags={
        **common_tags,
        "Name": "MainRouteTable",
        "Purpose": "Primary route table for internet access"
    }
)

# Route to Internet Gateway
internet_route = aws.ec2.Route(
    "InternetRoute",
    route_table_id=main_route_table.id,
    destination_cidr_block="0.0.0.0/0",
    gateway_id=internet_gateway.id,
    opts=pulumi.ResourceOptions(depends_on=[internet_gateway])
)

# Associate route table with subnets
route_table_associations = []
for i, subnet in enumerate(subnets):
    association = aws.ec2.RouteTableAssociation(
        f"RouteTableAssociation{i+1}",
        subnet_id=subnet.id,
        route_table_id=main_route_table.id,
        opts=pulumi.ResourceOptions(depends_on=[main_route_table])
    )
    route_table_associations.append(association)

# Security Group
# ==============

security_group = aws.ec2.SecurityGroup(
    "ApplicationSecurityGroup",
    description="Security group for application instances",
    vpc_id=vpc.id,
    ingress=[
        aws.ec2.SecurityGroupIngressArgs(
            description="SSH access from anywhere",
            from_port=22,
            to_port=22,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
        ),
        # Add HTTP access for web applications
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTP access",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
        ),
        # Add HTTPS access
        aws.ec2.SecurityGroupIngressArgs(
            description="HTTPS access",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    egress=[
        aws.ec2.SecurityGroupEgressArgs(
            description="Allow all outbound traffic",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"]
        )
    ],
    tags={
        **common_tags,
        "Name": "ApplicationSecurityGroup",
        "Purpose": "Security group for application instances"
    }
)

# EC2 Instances
# =============

# User data script for instance initialization
user_data_script = """#!/bin/bash
# Update system packages
yum update -y

# Install common utilities
yum install -y httpd git

# Start and enable Apache
systemctl start httpd
systemctl enable httpd

# Create a simple index page
echo "<h1>Welcome to TAP Infrastructure - Instance $(curl -s http://169.254.169.254/latest/meta-data/instance-id)</h1>" > /var/www/html/index.html

# Log instance details
echo "Instance initialized at $(date)" >> /var/log/instance-init.log
"""

# Create EC2 instances
instances = []
instance_names = ["WebServer1", "WebServer2"]

for i, (subnet, instance_name) in enumerate(zip(subnets, instance_names)):
    instance = aws.ec2.Instance(
        instance_name,
        ami=ami_id,
        instance_type=instance_type,
        subnet_id=subnet.id,
        vpc_security_group_ids=[security_group.id],
        key_name=key_name,
        user_data=user_data_script,
        tags={
            **common_tags,
            "Name": instance_name,
            "Purpose": f"Web server {i+1}",
            "Tier": "Application"
        },
        metadata_options=aws.ec2.InstanceMetadataOptionsArgs(
            http_tokens="required",  # Require IMDSv2
            http_put_response_hop_limit=1
        ),
        opts=pulumi.ResourceOptions(
            depends_on=[security_group, subnet]
        )
    )
    instances.append(instance)

# Outputs
# ========

# Export important values
pulumi.export("vpc_id", vpc.id)
pulumi.export("vpc_cidr", vpc.cidr_block)
pulumi.export("internet_gateway_id", internet_gateway.id)
pulumi.export("security_group_id", security_group.id)
pulumi.export("subnet_ids", [subnet.id for subnet in subnets])
pulumi.export("instance_ids", [instance.id for instance in instances])
pulumi.export("instance_public_ips", [instance.public_ip for instance in instances])
pulumi.export("instance_private_ips", [instance.private_ip for instance in instances])

# Export key pair information if specified
if key_name:
    pulumi.export("key_name", key_name)

# Export connection information
ssh_commands = []
for instance in instances:
    if key_name:
        ssh_commands.append(f"ssh -i {key_name}.pem ec2-user@{instance.public_ip}")
    else:
        ssh_commands.append(f"ssh ec2-user@{instance.public_ip}")

pulumi.export("ssh_commands", ssh_commands)

# Export subnet information for integration tests
pulumi.export("public_subnet_ids", [subnet.id for subnet in subnets])
pulumi.export("private_subnet_id", None)  # We don't have private subnets in this setup
pulumi.export("public_security_group_id", security_group.id)
pulumi.export("private_security_group_id", None)  # We don't have private security groups

# Export web access URLs
pulumi.export("web_urls", [
    f"http://{instance.public_ip}" 
    for instance in instances
])

# Stack Summary
# =============

pulumi.export("stack_summary", {
    "region": region,
    "vpc_cidr": vpc_cidr,
    "subnet_count": len(subnets),
    "instance_count": len(instances),
    "instance_type": instance_type,
    "ami_id": ami_id
})

# Metadata for documentation
pulumi.export("metadata", {
    "description": "TAP Stack - Secure Cloud Network Environment",
    "version": "1.0.0",
    "author": "Infrastructure Team",
    "last_updated": "2025",
    "requirements": {
        "pulumi_version": ">=3.0.0",
        "pulumi_aws_version": ">=5.0.0",
        "python_version": ">=3.8"
    }
})
