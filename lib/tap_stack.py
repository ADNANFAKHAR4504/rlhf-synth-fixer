"""Production-Grade AWS Infrastructure using CDKTF Python
Implements: VPC + Multi-AZ + ASG + ELB + NAT Gateway + State Management
"""

import json
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend, App
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.launch_template import LaunchTemplate
from cdktf_cdktf_provider_aws.autoscaling_group import AutoscalingGroup
from cdktf_cdktf_provider_aws.lb import Lb
from cdktf_cdktf_provider_aws.lb_target_group import LbTargetGroup
from cdktf_cdktf_provider_aws.lb_listener import LbListener
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_instance_profile import IamInstanceProfile
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.dynamodb_table import DynamodbTable
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity


class TapStack(TerraformStack):
  """Production-Grade AWS Infrastructure Stack with CDKTF Python."""

  def __init__(self, scope: Construct, construct_id: str, **kwargs):
    """Initialize the production infrastructure stack."""
    super().__init__(scope, construct_id)

    # Extract configuration from kwargs
    self.environment_suffix = kwargs.get('environment_suffix', 'prod')
    self.aws_region = kwargs.get('aws_region', 'us-east-1')
    self.state_bucket_region = kwargs.get('state_bucket_region', 'us-east-1')
    self.state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
    self.default_tags = kwargs.get('default_tags', {})

    # Infrastructure configuration
    self.environment = "prod"
    self.vpc_cidr = "10.0.0.0/16"
    self.instance_type = "t3.micro"
    self.min_size = 2
    self.max_size = 4
    self.desired_capacity = 2

    # Common tags
    self.common_tags = {
      "Environment": self.environment,
      "ManagedBy": "terraform",
      "Project": "production-infrastructure",
      **self.default_tags
    }

    # Configure AWS Provider
    AwsProvider(self, "aws",
      region=self.aws_region,
      default_tags=[{
        "tags": self.common_tags
      }]
    )

    # Get current AWS account and availability zones
    self.current = DataAwsCallerIdentity(self, "current")
    self.azs = DataAwsAvailabilityZones(self, "azs", state="available")

    # Create state management resources
    self.create_state_management()

    # Create VPC and networking
    self.create_vpc_resources()

    # Create security groups
    self.create_security_groups()

    # Create IAM roles and instance profile
    self.create_iam_resources()

    # Create launch template
    self.create_launch_template()

    # Create load balancer
    self.create_load_balancer()

    # Create Auto Scaling Group
    self.create_autoscaling_group()

    # Create outputs
    self.create_outputs()

  def create_state_management(self):
    """Create S3 bucket and DynamoDB table for Terraform state management"""
    
    # S3 bucket for state storage
    self.state_bucket_resource = S3Bucket(self, "terraform-state",
      bucket=f"terraform-state-{self.current.account_id}",
      tags=self.common_tags
    )
    
    S3BucketVersioningA(self, "state-versioning",
      bucket=self.state_bucket_resource.id,
      versioning_configuration=[{
        "status": "Enabled"
      }]
    )
    
    S3BucketPublicAccessBlock(self, "state-public-access-block",
      bucket=self.state_bucket_resource.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True
    )
    
    # DynamoDB table for state locking
    self.state_lock_table = DynamodbTable(self, "terraform-locks",
      name="terraform-state-locks",
      billing_mode="PAY_PER_REQUEST",
      hash_key="LockID",
      attribute=[{
        "name": "LockID",
        "type": "S"
      }],
      tags=self.common_tags
    )
    
    # Configure backend
    S3Backend(self,
      bucket=self.state_bucket_resource.id,
      key="terraform.tfstate",
      region=self.aws_region,
      dynamodb_table=self.state_lock_table.name,
      encrypt=True
    )

  def create_vpc_resources(self):
    """Create VPC with multi-AZ subnets, Internet Gateway, and NAT Gateway"""
    
    # Create VPC
    self.vpc = Vpc(self, "prod-vpc",
      cidr_block=self.vpc_cidr,
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={**self.common_tags, "Name": "prod-vpc"}
    )
    
    # Create public subnets in multiple AZs
    self.public_subnets = []
    self.private_subnets = []
    
    for i, az in enumerate(self.azs.names[:2]):  # Use first 2 AZs
      # Public subnet
      public_subnet = Subnet(self, f"public-subnet-{i}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={**self.common_tags, "Name": f"public-subnet-{i}", "Type": "public"}
      )
      self.public_subnets.append(public_subnet)
      
      # Private subnet
      private_subnet = Subnet(self, f"private-subnet-{i}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        tags={**self.common_tags, "Name": f"private-subnet-{i}", "Type": "private"}
      )
      self.private_subnets.append(private_subnet)
    
    # Create Internet Gateway
    self.internet_gateway = InternetGateway(self, "internet-gateway",
      vpc_id=self.vpc.id,
      tags={**self.common_tags, "Name": "internet-gateway"}
    )
    
    # Create Elastic IP for NAT Gateway
    self.nat_eip = Eip(self, "nat-eip",
      domain="vpc",
      tags={**self.common_tags, "Name": "nat-gateway-eip"}
    )
    
    # Create NAT Gateway
    self.nat_gateway = NatGateway(self, "nat-gateway",
      allocation_id=self.nat_eip.id,
      subnet_id=self.public_subnets[0].id,
      tags={**self.common_tags, "Name": "nat-gateway"}
    )
    
    # Create route tables
    self.create_route_tables()

  def create_route_tables(self):
    """Create route tables for public and private subnets"""
    
    # Public route table
    self.public_route_table = RouteTable(self, "public-route-table",
      vpc_id=self.vpc.id,
      tags={**self.common_tags, "Name": "public-route-table"}
    )
    
    # Route to Internet Gateway
    Route(self, "public-route",
      route_table_id=self.public_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.internet_gateway.id
    )
    
    # Associate public subnets with public route table
    for i, subnet in enumerate(self.public_subnets):
      RouteTableAssociation(self, f"public-rta-{i}",
        subnet_id=subnet.id,
        route_table_id=self.public_route_table.id
      )
    
    # Private route table
    self.private_route_table = RouteTable(self, "private-route-table",
      vpc_id=self.vpc.id,
      tags={**self.common_tags, "Name": "private-route-table"}
    )
    
    # Route to NAT Gateway
    Route(self, "private-route",
      route_table_id=self.private_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      nat_gateway_id=self.nat_gateway.id
    )
    
    # Associate private subnets with private route table
    for i, subnet in enumerate(self.private_subnets):
      RouteTableAssociation(self, f"private-rta-{i}",
        subnet_id=subnet.id,
        route_table_id=self.private_route_table.id
      )

  def create_security_groups(self):
    """Create security groups for load balancer and EC2 instances"""
    
    # Security group for load balancer
    self.lb_security_group = SecurityGroup(self, "lb-security-group",
      name="lb-security-group",
      description="Security group for load balancer",
      vpc_id=self.vpc.id,
      ingress=[{
        "description": "HTTP from internet",
        "from_port": 80,
        "to_port": 80,
        "protocol": "tcp",
        "cidr_blocks": ["0.0.0.0/0"]
      }],
      egress=[{
        "from_port": 0,
        "to_port": 0,
        "protocol": "-1",
        "cidr_blocks": ["0.0.0.0/0"]
      }],
      tags={**self.common_tags, "Name": "lb-security-group"}
    )
    
    # Security group for EC2 instances
    self.instance_security_group = SecurityGroup(self, "instance-security-group",
      name="instance-security-group",
      description="Security group for EC2 instances",
      vpc_id=self.vpc.id,
      ingress=[{
        "description": "HTTP from load balancer",
        "from_port": 80,
        "to_port": 80,
        "protocol": "tcp",
        "security_groups": [self.lb_security_group.id]
      }],
      egress=[{
        "from_port": 0,
        "to_port": 0,
        "protocol": "-1",
        "cidr_blocks": ["0.0.0.0/0"]
      }],
      tags={**self.common_tags, "Name": "instance-security-group"}
    )

  def create_iam_resources(self):
    """Create IAM role and instance profile for EC2 instances"""
    
    # IAM role for EC2 instances
    self.instance_role = IamRole(self, "instance-role",
      name="ec2-instance-role",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [{
          "Effect": "Allow",
          "Principal": {"Service": "ec2.amazonaws.com"},
          "Action": "sts:AssumeRole"
        }]
      }),
      tags=self.common_tags
    )
    
    # Attach basic policies
    IamRolePolicyAttachment(self, "ssm-policy",
      role=self.instance_role.name,
      policy_arn="arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
    )
    
    # Instance profile
    self.instance_profile = IamInstanceProfile(self, "instance-profile",
      name="ec2-instance-profile",
      role=self.instance_role.name
    )

  def create_launch_template(self):
    """Create launch template for Auto Scaling Group"""
    
    # User data script for simple web server
    user_data = """#!/bin/bash
yum update -y
yum install -y httpd
systemctl start httpd
systemctl enable httpd
echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
"""
    
    self.launch_template = LaunchTemplate(self, "launch-template",
      name="asg-launch-template",
      image_id="ami-0c02fb55956c7d316",  # Amazon Linux 2 AMI
      instance_type=self.instance_type,
      vpc_security_group_ids=[self.instance_security_group.id],
      iam_instance_profile=[{
        "name": self.instance_profile.name
      }],
      user_data=user_data,
      tag_specifications=[{
        "resource_type": "instance",
        "tags": self.common_tags
      }],
      tags={**self.common_tags, "Name": "asg-launch-template"}
    )

  def create_load_balancer(self):
    """Create Application Load Balancer with target group"""
    
    # Create ALB
    self.load_balancer = Lb(self, "load-balancer",
      name="prod-alb",
      internal=False,
      load_balancer_type="application",
      security_groups=[self.lb_security_group.id],
      subnets=[subnet.id for subnet in self.public_subnets],
      enable_deletion_protection=False,
      tags={**self.common_tags, "Name": "prod-alb"}
    )
    
    # Create target group
    self.target_group = LbTargetGroup(self, "target-group",
      name="prod-target-group",
      port=80,
      protocol="HTTP",
      vpc_id=self.vpc.id,
      target_type="instance",
      health_check=[{
        "enabled": True,
        "healthy_threshold": 2,
        "interval": 30,
        "matcher": "200",
        "path": "/",
        "port": "traffic-port",
        "protocol": "HTTP",
        "timeout": 5,
        "unhealthy_threshold": 2
      }],
      tags={**self.common_tags, "Name": "prod-target-group"}
    )
    
    # Create listener
    self.listener = LbListener(self, "listener",
      load_balancer_arn=self.load_balancer.arn,
      port=80,
      protocol="HTTP",
      default_action=[{
        "type": "forward",
        "target_group_arn": self.target_group.arn
      }]
    )

  def create_autoscaling_group(self):
    """Create Auto Scaling Group with health checks and scaling policies"""
    
    self.autoscaling_group = AutoscalingGroup(self, "autoscaling-group",
      name="prod-asg",
      desired_capacity=self.desired_capacity,
      max_size=self.max_size,
      min_size=self.min_size,
      vpc_zone_identifier=[subnet.id for subnet in self.private_subnets],
      launch_template=[{
        "id": self.launch_template.id,
        "version": "$Latest"
      }],
      target_group_arns=[self.target_group.arn],
      health_check_type="ELB",
      health_check_grace_period=300,
      tag=[{
        "key": "Name",
        "value": "prod-asg-instance",
        "propagate_at_launch": True
      }]
    )

  def create_outputs(self):
    """Create outputs for important resources"""
    
    TerraformOutput(self, "vpc_id",
      value=self.vpc.id,
      description="VPC ID"
    )
    
    TerraformOutput(self, "load_balancer_dns",
      value=self.load_balancer.dns_name,
      description="Load Balancer DNS Name"
    )
    
    TerraformOutput(self, "autoscaling_group_name",
      value=self.autoscaling_group.name,
      description="Auto Scaling Group Name"
    )
    
    TerraformOutput(self, "state_bucket_name",
      value=self.state_bucket_resource.id,
      description="Terraform State Bucket Name"
    )


# CDKTF App Entry Point
app = App()
TapStack(app, "production-infrastructure")
app.synth()
