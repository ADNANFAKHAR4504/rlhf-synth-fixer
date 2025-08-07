"""Production-Grade AWS Infrastructure using CDKTF Python
Implements: VPC + Multi-AZ + ASG + ELB + NAT Gateway + State Management
"""

import json
import base64
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, S3Backend, App, Fn
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
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
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
from cdktf_cdktf_provider_aws.data_aws_ami import DataAwsAmi


class TapStack(TerraformStack):
  """Production-Grade AWS Infrastructure Stack with CDKTF Python."""

  def __init__(self, scope: Construct, construct_id: str, **kwargs):
    """Initialize the production infrastructure stack."""
    super().__init__(scope, construct_id)

    # Extract configuration from kwargs
    self.environment_suffix = kwargs.get('environment_suffix', 'prod')
    self.aws_region = kwargs.get('aws_region', 'us-east-2')
    self.state_bucket_region = kwargs.get('state_bucket_region', 'us-east-2')
    self.state_bucket = kwargs.get('state_bucket', 'iac-rlhf-tf-states')
    self.default_tags = kwargs.get('default_tags', {}) or {}

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

    # Get availability zone names as a list
    self.az_names = Fn.tolist(self.azs.names)

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
                                          bucket=f"terraform-state-{
                                              self.current.account_id}",
                                          tags=self.common_tags
                                          )

    S3BucketVersioningA(self, "state-versioning",
                        bucket=self.state_bucket_resource.id,
                        versioning_configuration={
                            "status": "Enabled"
                        }
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

    # Note: S3 backend configuration removed to avoid circular dependency
    # The backend should be configured externally or in a separate stack

  def create_vpc_resources(self):
    """Create VPC with multi-AZ subnets, Internet Gateway, and NAT Gateway"""

    # Create VPC
    self.vpc = Vpc(self, "prod-vpc-1",
                   cidr_block=self.vpc_cidr,
                   enable_dns_hostnames=True,
                   enable_dns_support=True,
                   tags={**self.common_tags, "Name": "prod-vpc-1"}
                   )

    # Create public subnets in multiple AZs
    self.public_subnets = []
    self.private_subnets = []

    # Create subnets for first 2 AZs using proper token handling
    # Public subnet 1
    public_subnet_1 = Subnet(self, "public-subnet-1",
                             vpc_id=self.vpc.id,
                             cidr_block="10.0.1.0/24",
                             availability_zone=Fn.element(self.az_names, 0),
                             map_public_ip_on_launch=True,
                             tags={**self.common_tags,
                                   "Name": "public-subnet-1", "Type": "public"}
                             )
    self.public_subnets.append(public_subnet_1)

    # Private subnet 1
    private_subnet_1 = Subnet(self, "private-subnet-1",
                              vpc_id=self.vpc.id,
                              cidr_block="10.0.10.0/24",
                              availability_zone=Fn.element(self.az_names, 0),
                              tags={**self.common_tags,
                                    "Name": "private-subnet-1", "Type": "private"}
                              )
    self.private_subnets.append(private_subnet_1)

    # Public subnet 2
    public_subnet_2 = Subnet(self, "public-subnet-2",
                             vpc_id=self.vpc.id,
                             cidr_block="10.0.2.0/24",
                             availability_zone=Fn.element(self.az_names, 1),
                             map_public_ip_on_launch=True,
                             tags={**self.common_tags,
                                   "Name": "public-subnet-2", "Type": "public"}
                             )
    self.public_subnets.append(public_subnet_2)

    # Private subnet 2
    private_subnet_2 = Subnet(self, "private-subnet-2",
                              vpc_id=self.vpc.id,
                              cidr_block="10.0.11.0/24",
                              availability_zone=Fn.element(self.az_names, 1),
                              tags={**self.common_tags,
                                    "Name": "private-subnet-2", "Type": "private"}
                              )
    self.private_subnets.append(private_subnet_2)

    # Create Internet Gateway
    self.internet_gateway = InternetGateway(self, "internet-gateway",
                                            vpc_id=self.vpc.id,
                                            tags={**self.common_tags,
                                                  "Name": "internet-gateway"}
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
                                  tags={**self.common_tags,
                                        "Name": "nat-gateway"}
                                  )

    # Create route tables
    self.create_route_tables()

  def create_route_tables(self):
    """Create route tables for public and private subnets"""

    # Public route table
    self.public_route_table = RouteTable(self, "public-route-table",
                                         vpc_id=self.vpc.id,
                                         tags={**self.common_tags,
                                               "Name": "public-route-table"}
                                         )

    # Route to Internet Gateway
    Route(self, "public-route",
          route_table_id=self.public_route_table.id,
          destination_cidr_block="0.0.0.0/0",
          gateway_id=self.internet_gateway.id
          )

    # Associate public subnets with public route table
    RouteTableAssociation(self, "public-rta-1",
                          subnet_id=self.public_subnets[0].id,
                          route_table_id=self.public_route_table.id
                          )

    RouteTableAssociation(self, "public-rta-2",
                          subnet_id=self.public_subnets[1].id,
                          route_table_id=self.public_route_table.id
                          )

    # Private route table
    self.private_route_table = RouteTable(self, "private-route-table",
                                          vpc_id=self.vpc.id,
                                          tags={**self.common_tags,
                                                "Name": "private-route-table"}
                                          )

    # Route to NAT Gateway
    Route(self, "private-route",
          route_table_id=self.private_route_table.id,
          destination_cidr_block="0.0.0.0/0",
          nat_gateway_id=self.nat_gateway.id
          )

    # Associate private subnets with private route table
    RouteTableAssociation(self, "private-rta-1",
                          subnet_id=self.private_subnets[0].id,
                          route_table_id=self.private_route_table.id
                          )

    RouteTableAssociation(self, "private-rta-2",
                          subnet_id=self.private_subnets[1].id,
                          route_table_id=self.private_route_table.id
                          )

  def create_security_groups(self):
    """Create security groups for load balancer and EC2 instances"""

    # Security group for load balancer
    self.lb_security_group = SecurityGroup(self, "lb-security-group",
                                           name="lb-security-group",
                                           description="Security group for load balancer",
                                           vpc_id=self.vpc.id,
                                           tags={**self.common_tags,
                                                 "Name": "lb-security-group"}
                                           )

    # Security group for EC2 instances
    self.instance_security_group = SecurityGroup(self, "instance-security-group",
                                                 name="instance-security-group",
                                                 description="Security group for EC2 instances",
                                                 vpc_id=self.vpc.id,
                                                 tags={
                                                     **self.common_tags, "Name": "instance-security-group"}
                                                 )

    # Add rules to load balancer security group
    SecurityGroupRule(self, "lb-ingress-http",
                      type="ingress",
                      from_port=80,
                      to_port=80,
                      protocol="tcp",
                      cidr_blocks=["0.0.0.0/0"],
                      security_group_id=self.lb_security_group.id,
                      description="HTTP from internet"
                      )

    SecurityGroupRule(self, "lb-egress-all",
                      type="egress",
                      from_port=0,
                      to_port=0,
                      protocol="-1",
                      cidr_blocks=["0.0.0.0/0"],
                      security_group_id=self.lb_security_group.id
                      )

    # Add rules to instance security group
    SecurityGroupRule(self, "instance-ingress-http",
                      type="ingress",
                      from_port=80,
                      to_port=80,
                      protocol="tcp",
                      source_security_group_id=self.lb_security_group.id,
                      security_group_id=self.instance_security_group.id,
                      description="HTTP from load balancer"
                      )

    SecurityGroupRule(self, "instance-egress-all",
                      type="egress",
                      from_port=0,
                      to_port=0,
                      protocol="-1",
                      cidr_blocks=["0.0.0.0/0"],
                      security_group_id=self.instance_security_group.id
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
    raw_user_data = """#!/bin/bash
    yum update -y
    yum install -y httpd
    systemctl start httpd
    systemctl enable httpd
    echo "<h1>Hello from $(hostname -f)</h1>" > /var/www/html/index.html
    """

    user_data = base64.b64encode(raw_user_data.encode("utf-8")).decode("utf-8")

    self.amazon_linux_ami = DataAwsAmi(self, "amazon-linux-2",
                                       most_recent=True,
                                       owners=["amazon"],
                                       filter=[{
                                           "name": "name",
                                           "values": ["amzn2-ami-hvm-*-x86_64-gp2"]
                                       }, {
                                           "name": "virtualization-type",
                                           "values": ["hvm"]
                                       }]
                                       )

    self.launch_template = LaunchTemplate(self, "launch-template",
                                          name="asg-launch-template",
                                          image_id=self.amazon_linux_ami.id,  # Amazon Linux 2 AMI
                                          instance_type=self.instance_type,
                                          vpc_security_group_ids=[
                                              self.instance_security_group.id],
                                          iam_instance_profile={
                                              "name": self.instance_profile.name
                                          },
                                          user_data=user_data,
                                          tags={**self.common_tags,
                                                "Name": "asg-launch-template"}
                                          )

  def create_load_balancer(self):
    """Create Application Load Balancer with target group"""

    # Create ALB
    self.load_balancer = Lb(self, "load-balancer",
                            name="prod-alb",
                            internal=False,
                            load_balancer_type="application",
                            security_groups=[self.lb_security_group.id],
                            subnets=[self.public_subnets[0].id,
                                     self.public_subnets[1].id],
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
                                      health_check={
                                          "enabled": True,
                                          "healthy_threshold": 2,
                                          "interval": 30,
                                          "matcher": "200",
                                          "path": "/",
                                          "port": "traffic-port",
                                          "protocol": "HTTP",
                                          "timeout": 5,
                                          "unhealthy_threshold": 2
                                      },
                                      tags={**self.common_tags,
                                            "Name": "prod-target-group"}
                                      )

    # Create listener
    self.listener = LbListener(self, "listener",
                               load_balancer_arn=self.load_balancer.arn,
                               port=80,
                               protocol="HTTP",
                               default_action=[{
                                   "type": "forward",
                                   "forward": {
                                       "targetGroup": [{
                                           "arn": self.target_group.arn,
                                           "weight": 100
                                       }]
                                   }
                               }]
                               )

  def create_autoscaling_group(self):
    """Create Auto Scaling Group with health checks and scaling policies"""

    self.autoscaling_group = AutoscalingGroup(self, "autoscaling-group",
                                              name="prod-asg",
                                              desired_capacity=self.desired_capacity,
                                              max_size=self.max_size,
                                              min_size=self.min_size,
                                              vpc_zone_identifier=[
                                                  self.private_subnets[0].id, self.private_subnets[1].id],
                                              launch_template={
                                                  "id": self.launch_template.id,
                                                  "version": "$Latest"
                                              },
                                              target_group_arns=[
                                                  self.target_group.arn],
                                              health_check_type="ELB",
                                              health_check_grace_period=300,
                                              tag=[{
                                                  "key": "Name",
                                                  "value": "prod-asg-instance",
                                                  "propagateAtLaunch": True
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


# CDKTF App Entry Point - only run when executed directly
if __name__ == "__main__":
  from cdktf import App
  app = App()
  TapStack(app, "production-infrastructure")
  app.synth()
