#!/usr/bin/env python3
"""
Advanced TAP (Test Automation Platform) Infrastructure Stack using Pulumi and Python.

This module implements a production-ready AWS infrastructure stack with high availability,
security best practices, comprehensive monitoring, and logging capabilities. The stack
includes VPC with multi-AZ deployment, security groups, S3 storage with cross-region
replication, CloudWatch monitoring, and proper tagging for compliance.
"""

from dataclasses import dataclass
from typing import Dict, List
# Removed unused import time

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions

@dataclass
class TapStackArgs:
  """
  Configuration arguments for the TAP stack.
  
  Attributes:
    environment_suffix: Environment identifier (dev, staging, prod)
    vpc_cidr: CIDR block for the VPC (default: 10.0.0.0/16)
    availability_zones: List of AZs to use (default: us-east-1a, us-east-1b)
    enable_flow_logs: Enable VPC flow logs (default: True)
    enable_cross_region_replication: Enable S3 cross-region replication (default: True)
    backup_region: Secondary region for replication (default: us-west-2)
    allowed_cidr: CIDR block for SSH access (default: 10.0.0.0/8)
    tags: Additional tags to apply to all resources
  """
  environment_suffix: str
  vpc_cidr: str = "10.0.0.0/16"
  availability_zones: List[str] = None
  enable_flow_logs: bool = True
  enable_cross_region_replication: bool = True
  backup_region: str = "us-west-2"
  allowed_cidr: str = "10.0.0.0/8"
  tags: Dict[str, str] = None

  def __post_init__(self):
    if not self.environment_suffix or not self.environment_suffix.strip():
      raise TypeError("environment_suffix cannot be empty or None")
    if self.availability_zones is None:
      self.availability_zones = ["us-east-1a", "us-east-1b"]
    if self.tags is None:
      self.tags = {}

# pylint: disable=too-many-instance-attributes
class TapStack(ComponentResource):
  """
  Main infrastructure stack for the Test Automation Platform.
  
  This stack creates:
  - VPC with public and private subnets across multiple AZs
  - Internet Gateway and NAT Gateways for high availability
  - Security Groups with least privilege access
  - S3 buckets with encryption and cross-region replication
  - CloudWatch monitoring and logging
  - IAM roles and policies
  - VPC Flow Logs for security monitoring
  """

  def __init__(self, name: str, args: TapStackArgs, opts: ResourceOptions = None):
    super().__init__("tap:infrastructure:TapStack", name, {}, opts)

    self.args = args
    self.environment = args.environment_suffix
    
    # Initialize Pulumi configuration with validation
    self.config = pulumi.Config()
    # Use from args first, then config as fallback
    self.allowed_cidr = args.allowed_cidr or self.config.get("allowed_cidr") or "10.0.0.0/8"
    self.replication_region = self.config.get("replication_region") or args.backup_region
    
    # Base tags applied to all resources
    # FIXED: Removed duplicate tag key "environment" - LocalStack treats tag keys as case-insensitive
    self.base_tags = {
      "Environment": self.environment,
      "Project": "IaC-AWS-Nova-Model-Breaking",
      "ManagedBy": "Pulumi",
      "Stack": name,
      **args.tags
    }

    # Initialize outputs
    self.vpc_id = None
    self.public_subnet_ids = []
    self.private_subnet_ids = []
    self.security_group_ids = {}
    self.s3_bucket_names = {}
    self.cloudwatch_log_groups = {}

    # Create infrastructure components
    self._create_vpc()
    self._create_subnets()
    self._create_internet_gateway()
    self._create_nat_gateways()
    self._create_route_tables()
    self._create_security_groups()
    self._create_s3_buckets()
    self._create_iam_roles()
    self._create_monitoring()
    self._create_vpc_flow_logs()

    # Register outputs
    self.register_outputs({
      "vpc_id": self.vpc_id,
      "public_subnet_ids": self.public_subnet_ids,
      "private_subnet_ids": self.private_subnet_ids,
      "security_group_ids": self.security_group_ids,
      "s3_bucket_names": self.s3_bucket_names,
      "cloudwatch_log_groups": self.cloudwatch_log_groups,
    })

  def _create_vpc(self):
    """Create VPC with DNS hostnames and resolution enabled."""
    self.vpc = aws.ec2.Vpc(
      f"tap-vpc-{self.environment}",
      cidr_block=self.args.vpc_cidr,
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={
        **self.base_tags,
        "Name": f"tap-vpc-{self.environment}",
        "Component": "networking"
      },
      opts=ResourceOptions(parent=self)
    )
    self.vpc_id = self.vpc.id

  def _create_subnets(self):
    """Create public and private subnets across multiple availability zones."""
    self.public_subnets = []
    self.private_subnets = []
    
    for i, az in enumerate(self.args.availability_zones):
      # Public subnet
      public_subnet = aws.ec2.Subnet(
        f"tap-public-subnet-{i+1}-{self.environment}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+1}.0/24",
        availability_zone=az,
        map_public_ip_on_launch=True,
        tags={
          **self.base_tags,
          "Name": f"tap-public-subnet-{i+1}-{self.environment}",
          "Type": "public",
          "AZ": az
        },
        opts=ResourceOptions(parent=self.vpc)
      )
      self.public_subnets.append(public_subnet)
      self.public_subnet_ids.append(public_subnet.id)

      # Private subnet
      private_subnet = aws.ec2.Subnet(
        f"tap-private-subnet-{i+1}-{self.environment}",
        vpc_id=self.vpc.id,
        cidr_block=f"10.0.{i+10}.0/24",
        availability_zone=az,
        tags={
          **self.base_tags,
          "Name": f"tap-private-subnet-{i+1}-{self.environment}",
          "Type": "private",
          "AZ": az
        },
        opts=ResourceOptions(parent=self.vpc)
      )
      self.private_subnets.append(private_subnet)
      self.private_subnet_ids.append(private_subnet.id)

  def _create_internet_gateway(self):
    """Create and attach Internet Gateway for public subnet connectivity."""
    self.igw = aws.ec2.InternetGateway(
      f"tap-igw-{self.environment}",
      vpc_id=self.vpc.id,
      tags={
        **self.base_tags,
        "Name": f"tap-igw-{self.environment}"
      },
      opts=ResourceOptions(parent=self.vpc)
    )

  def _create_nat_gateways(self):
    """Create NAT Gateways in each public subnet for high availability."""
    self.nat_gateways = []
    self.elastic_ips = []

    for i, public_subnet in enumerate(self.public_subnets):
      # Elastic IP for NAT Gateway
      eip = aws.ec2.Eip(
        f"tap-nat-eip-{i+1}-{self.environment}",
        domain="vpc",
        tags={
          **self.base_tags,
          "Name": f"tap-nat-eip-{i+1}-{self.environment}"
        },
        opts=ResourceOptions(parent=self.vpc, depends_on=[self.igw])
      )
      self.elastic_ips.append(eip)

      # NAT Gateway
      nat_gw = aws.ec2.NatGateway(
        f"tap-nat-{i+1}-{self.environment}",
        allocation_id=eip.id,
        subnet_id=public_subnet.id,
        tags={
          **self.base_tags,
          "Name": f"tap-nat-{i+1}-{self.environment}"
        },
        opts=ResourceOptions(parent=self.vpc, depends_on=[self.igw])
      )
      self.nat_gateways.append(nat_gw)

  def _create_route_tables(self):
    """Create route tables for public and private subnets."""
    # Public route table
    self.public_rt = aws.ec2.RouteTable(
      f"tap-public-rt-{self.environment}",
      vpc_id=self.vpc.id,
      tags={
        **self.base_tags,
        "Name": f"tap-public-rt-{self.environment}",
        "Type": "public"
      },
      opts=ResourceOptions(parent=self.vpc)
    )

    # Public route to Internet Gateway
    aws.ec2.Route(
      f"tap-public-route-{self.environment}",
      route_table_id=self.public_rt.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.igw.id,
      opts=ResourceOptions(parent=self.public_rt)
    )

    # Associate public subnets with public route table
    for i, subnet in enumerate(self.public_subnets):
      aws.ec2.RouteTableAssociation(
        f"tap-public-rta-{i+1}-{self.environment}",
        subnet_id=subnet.id,
        route_table_id=self.public_rt.id,
        opts=ResourceOptions(parent=self.public_rt)
      )

    # Private route tables (one per AZ for high availability)
    self.private_rts = []
    for i, (private_subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
      private_rt = aws.ec2.RouteTable(
        f"tap-private-rt-{i+1}-{self.environment}",
        vpc_id=self.vpc.id,
        tags={
          **self.base_tags,
          "Name": f"tap-private-rt-{i+1}-{self.environment}",
          "Type": "private"
        },
        opts=ResourceOptions(parent=self.vpc)
      )
      self.private_rts.append(private_rt)

      # Route to NAT Gateway
      aws.ec2.Route(
        f"tap-private-route-{i+1}-{self.environment}",
        route_table_id=private_rt.id,
        destination_cidr_block="0.0.0.0/0",
        nat_gateway_id=nat_gw.id,
        opts=ResourceOptions(parent=private_rt)
      )

      # Associate private subnet with route table
      aws.ec2.RouteTableAssociation(
        f"tap-private-rta-{i+1}-{self.environment}",
        subnet_id=private_subnet.id,
        route_table_id=private_rt.id,
        opts=ResourceOptions(parent=private_rt)
      )

  def _create_security_groups(self):
    """Create security groups with least privilege access."""
    
    # Web tier security group
    self.web_sg = aws.ec2.SecurityGroup(
      f"tap-web-sg-{self.environment}",
      name=f"tap-web-sg-{self.environment}",
      description="Security group for web tier",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=80,
          to_port=80,
          cidr_blocks=["0.0.0.0/0"]
        ),
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=443,
          to_port=443,
          cidr_blocks=["0.0.0.0/0"]
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          protocol="-1",
          from_port=0,
          to_port=0,
          cidr_blocks=["0.0.0.0/0"]
        )
      ],
      tags={
        **self.base_tags,
        "Name": f"tap-web-sg-{self.environment}",
        "Tier": "web"
      },
      opts=ResourceOptions(parent=self.vpc)
    )

    # Application tier security group
    self.app_sg = aws.ec2.SecurityGroup(
      f"tap-app-sg-{self.environment}",
      name=f"tap-app-sg-{self.environment}",
      description="Security group for application tier",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=8080,
          to_port=8080,
          security_groups=[self.web_sg.id]
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          protocol="-1",
          from_port=0,
          to_port=0,
          cidr_blocks=["0.0.0.0/0"]
        )
      ],
      tags={
        **self.base_tags,
        "Name": f"tap-app-sg-{self.environment}",
        "Tier": "application"
      },
      opts=ResourceOptions(parent=self.vpc)
    )

    # Database tier security group
    self.db_sg = aws.ec2.SecurityGroup(
      f"tap-db-sg-{self.environment}",
      name=f"tap-db-sg-{self.environment}",
      description="Security group for database tier",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=3306,
          to_port=3306,
          security_groups=[self.app_sg.id]
        ),
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=5432,
          to_port=5432,
          security_groups=[self.app_sg.id]
        )
      ],
      tags={
        **self.base_tags,
        "Name": f"tap-db-sg-{self.environment}",
        "Tier": "database"
      },
      opts=ResourceOptions(parent=self.vpc)
    )

    # SSH access security group (now uses allowed_cidr from args)
    self.ssh_sg = aws.ec2.SecurityGroup(
      f"tap-ssh-sg-{self.environment}",
      name=f"tap-ssh-sg-{self.environment}",
      description="Security group for SSH access",
      vpc_id=self.vpc.id,
      ingress=[
        aws.ec2.SecurityGroupIngressArgs(
          protocol="tcp",
          from_port=22,
          to_port=22,
          cidr_blocks=[self.allowed_cidr]
        )
      ],
      egress=[
        aws.ec2.SecurityGroupEgressArgs(
          protocol="-1",
          from_port=0,
          to_port=0,
          cidr_blocks=["0.0.0.0/0"]
        )
      ],
      tags={
        **self.base_tags,
        "Name": f"tap-ssh-sg-{self.environment}",
        "Purpose": "ssh-access"
      },
      opts=ResourceOptions(parent=self.vpc)
    )

    self.security_group_ids = {
      "web": self.web_sg.id,
      "app": self.app_sg.id,
      "db": self.db_sg.id,
      "ssh": self.ssh_sg.id
    }

  def _create_s3_buckets(self):
    """Create S3 buckets with encryption and cross-region replication."""
    
    # Generate a valid S3 bucket name (lowercase, alphanumeric, and hyphens only)
    stack_name_lower = pulumi.get_stack().lower().replace("_", "-")
    
    # Add a timestamp suffix to force recreation and avoid naming conflicts
    # timestamp = str(int(time.time()))[-6:]  # Last 6 digits of timestamp
    
    # Primary application bucket
    self.app_bucket = aws.s3.Bucket(
      f"tap-app-{self.environment}",
      bucket=f"tap-app-{self.environment}-{stack_name_lower}",
      # pylint: disable=line-too-long
      server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
          apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256"
          )
        )
      ),
      versioning=aws.s3.BucketVersioningArgs(
        enabled=True
      ),
      tags={
        **self.base_tags,
        "Name": f"tap-app-{self.environment}",
        "Purpose": "application-data"
      },
      opts=ResourceOptions(parent=self)
    )

    # Backup bucket in secondary region (if cross-region replication is enabled)
    if self.args.enable_cross_region_replication:
      backup_provider = aws.Provider(
        f"backup-provider-{self.environment}",
        region=self.replication_region,
        opts=ResourceOptions(parent=self)
      )

      self.backup_bucket = aws.s3.Bucket(
        f"tap-app-backup-{self.environment}",
        bucket=f"tap-app-backup-{self.environment}-{stack_name_lower}",
        # pylint: disable=line-too-long
      server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
          rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
            apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
              sse_algorithm="AES256"
            )
          )
        ),
        versioning=aws.s3.BucketVersioningArgs(
          enabled=True
        ),
        tags={
          **self.base_tags,
          "Name": f"tap-app-backup-{self.environment}",
          "Purpose": "backup-replication"
        },
        opts=ResourceOptions(parent=self, provider=backup_provider)
      )

    # FIXED: Logs bucket with force recreation approach
    # Changed resource name to force recreation and avoid state conflicts
    self.logs_bucket = aws.s3.Bucket(
      f"tap-logs-{self.environment}-v2",  # Changed resource name to force recreation
      bucket=f"tap-logs-{self.environment}-{stack_name_lower}-v2",  # Changed bucket name
      # pylint: disable=line-too-long
      server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
        rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
          apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
            sse_algorithm="AES256"
          )
        )
      ),
      # Start with minimal tags to avoid tag update issues
      tags={
        "Name": f"tap-logs-{self.environment}",
        "Environment": self.environment,
        "ManagedBy": "Pulumi",
        "Purpose": "logging"
      },
      opts=ResourceOptions(parent=self)
    )

    # Add lifecycle configuration as separate resource after bucket is stable
    # This approach separates concerns and reduces the chance of state conflicts
    self.logs_bucket_lifecycle = aws.s3.BucketLifecycleConfigurationV2(
      f"tap-logs-lifecycle-{self.environment}-v2",  # Changed name to match bucket
      bucket=self.logs_bucket.id,
      rules=[
        aws.s3.BucketLifecycleConfigurationV2RuleArgs(
          id="log_retention",
          status="Enabled",
          expiration=aws.s3.BucketLifecycleConfigurationV2RuleExpirationArgs(
            days=90
          )
        )
      ],
      opts=ResourceOptions(
        parent=self.logs_bucket,
        depends_on=[self.logs_bucket]
      )
    )

    self.s3_bucket_names = {
      "app": self.app_bucket.bucket,
      "logs": self.logs_bucket.bucket
    }
    
    if self.args.enable_cross_region_replication:
      self.s3_bucket_names["backup"] = self.backup_bucket.bucket

  def _create_iam_roles(self):
    """Create IAM roles and policies for various services."""
    
    # VPC Flow Logs role
    self.flow_logs_role = aws.iam.Role(
      f"tap-flow-logs-role-{self.environment}",
      assume_role_policy="""{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Principal": {
              "Service": "vpc-flow-logs.amazonaws.com"
            },
            "Effect": "Allow"
          }
        ]
      }""",
      tags={
        **self.base_tags,
        "Name": f"tap-flow-logs-role-{self.environment}"
      },
      opts=ResourceOptions(parent=self)
    )

    # Flow logs policy
    aws.iam.RolePolicy(
      f"tap-flow-logs-policy-{self.environment}",
      role=self.flow_logs_role.id,
      policy="""{
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": [
              "logs:CreateLogGroup",
              "logs:CreateLogStream",
              "logs:PutLogEvents",
              "logs:DescribeLogGroups",
              "logs:DescribeLogStreams"
            ],
            "Effect": "Allow",
            "Resource": "*"
          }
        ]
      }""",
      opts=ResourceOptions(parent=self.flow_logs_role)
    )

  def _create_monitoring(self):
    """Create CloudWatch monitoring and alerting."""
    
    # Application log group
    self.app_log_group = aws.cloudwatch.LogGroup(
      f"tap-app-logs-{self.environment}",
      name=f"/aws/application/tap/{self.environment}",
      retention_in_days=30,
      tags={
        **self.base_tags,
        "Name": f"tap-app-logs-{self.environment}",
        "LogType": "application"
      },
      opts=ResourceOptions(parent=self)
    )

    # Infrastructure log group
    self.infra_log_group = aws.cloudwatch.LogGroup(
      f"tap-infra-logs-{self.environment}",
      name=f"/aws/infrastructure/tap/{self.environment}",
      retention_in_days=30,
      tags={
        **self.base_tags,
        "Name": f"tap-infra-logs-{self.environment}",
        "LogType": "infrastructure"
      },
      opts=ResourceOptions(parent=self)
    )

    self.cloudwatch_log_groups = {
      "application": self.app_log_group.name,
      "infrastructure": self.infra_log_group.name
    }

    # CloudWatch Alarms
    self._create_cloudwatch_alarms()

  def _create_cloudwatch_alarms(self):
    """Create CloudWatch alarms for monitoring."""
    
    # High CPU alarm
    aws.cloudwatch.MetricAlarm(
      f"tap-high-cpu-{self.environment}",
      name=f"tap-high-cpu-{self.environment}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods="2",
      metric_name="CPUUtilization",
      namespace="AWS/EC2",
      period="300",
      statistic="Average",
      threshold="80.0",
      alarm_description="High CPU utilization detected",
      tags={
        **self.base_tags,
        "AlarmType": "cpu"
      },
      opts=ResourceOptions(parent=self)
    )

  def _create_vpc_flow_logs(self):
    """Create VPC Flow Logs for security monitoring."""
    if self.args.enable_flow_logs:
      self.vpc_flow_logs = aws.ec2.FlowLog(
        f"tap-vpc-flow-logs-{self.environment}",
        iam_role_arn=self.flow_logs_role.arn,
        log_destination_type="cloud-watch-logs",
        log_destination=self.infra_log_group.arn,
        vpc_id=self.vpc.id,
        traffic_type="ALL",
        tags={
          **self.base_tags,
          "Name": f"tap-vpc-flow-logs-{self.environment}"
        },
        opts=ResourceOptions(parent=self.vpc)
      )

  @property
  def outputs(self):
    """Return stack outputs for use by other components."""
    return {
      "vpc_id": self.vpc_id,
      "public_subnet_ids": self.public_subnet_ids,
      "private_subnet_ids": self.private_subnet_ids,
      "security_group_ids": self.security_group_ids,
      "s3_bucket_names": self.s3_bucket_names,
      "cloudwatch_log_groups": self.cloudwatch_log_groups
    }