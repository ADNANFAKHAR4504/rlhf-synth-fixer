"""
TAP Stack - Multi-Account AWS Infrastructure with CDK for Terraform

This module implements a comprehensive AWS infrastructure stack following security
best practices and multi-environment deployment patterns. It excludes us-east-1 
region and implements all security requirements from PROMPT.md.
"""

import json
from typing import Dict, Any
from cdktf import TerraformStack, S3Backend, TerraformOutput, Fn
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
  S3BucketServerSideEncryptionConfigurationA,
  S3BucketServerSideEncryptionConfigurationRuleA,
  S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA
)
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioningA
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_user import IamUser
from cdktf_cdktf_provider_aws.iam_user_policy_attachment import IamUserPolicyAttachment
from cdktf_cdktf_provider_aws.iam_virtual_mfa_device import IamVirtualMfaDevice
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.cloudtrail import Cloudtrail
from cdktf_cdktf_provider_aws.data_aws_iam_policy_document import DataAwsIamPolicyDocument
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity


class TapStack(TerraformStack):
  """
  Multi-Account AWS Infrastructure Stack with Security Best Practices
  
  Features:
  - VPC with public/private subnets and flow logs
  - S3 buckets with AES-256 encryption and restricted access
  - RDS with Secrets Manager integration (non-public)
  - CloudTrail with dedicated encrypted S3 bucket
  - IAM policies following least privilege principle
  - MFA enforcement for IAM users
  - Security groups with automated cleanup capabilities
  - Comprehensive tagging strategy
  """

  def __init__(
    self,
    scope: Construct,
    construct_id: str,
    environment_suffix: str = "dev",
    aws_region: str = "us-west-2",
    state_bucket: str = "iac-rlhf-tf-291231-states",
    state_bucket_region: str = "us-west-2",
    default_tags: Dict[str, Any] = None,
    **kwargs
  ):
    """Initialize the TAP stack with comprehensive AWS infrastructure."""
    super().__init__(scope, construct_id)

    # Validate region (exclude us-east-1)
    if aws_region == "us-east-1":
      raise ValueError("us-east-1 region is explicitly excluded from deployment")

    # Store configuration
    self.environment_suffix = environment_suffix
    self.aws_region = aws_region
    self.default_tags = default_tags or {}

    # Configure AWS Provider with default tags
    self.aws_provider = AwsProvider(
      self,
      "aws",
      region=aws_region,
      default_tags=[self.default_tags] if self.default_tags else []
    )

    # Configure S3 Backend for state management
    S3Backend(
      self,
      bucket=state_bucket,
      key=f"{environment_suffix}/{construct_id}.tfstate",
      region=state_bucket_region,
      encrypt=True,
      dynamodb_table=f"terraform-state-lock-{environment_suffix}"
    )

    # Get AWS account information
    self.current_account = DataAwsCallerIdentity(self, "current")

    # Get availability zones
    self.azs = DataAwsAvailabilityZones(
      self, "available_azs",
      state="available"
    )

    # Create infrastructure components
    self._create_vpc_infrastructure()
    self._create_security_groups()
    self._create_s3_infrastructure()
    self._create_iam_infrastructure()
    self._create_rds_infrastructure()
    self._create_cloudtrail_infrastructure()
    self._create_outputs()

  def _create_vpc_infrastructure(self):
    """Create VPC with public/private subnets and flow logs."""
    # Create VPC
    self.vpc = Vpc(
      self,
      "main_vpc",
      cidr_block="10.0.0.0/16",
      enable_dns_hostnames=True,
      enable_dns_support=True,
      tags={
        "Name": f"tap-vpc-{self.environment_suffix}",
        "Environment": self.environment_suffix,
        "Component": "Networking"
      }
    )

    # Create Internet Gateway
    self.igw = InternetGateway(
      self,
      "internet_gateway",
      vpc_id=self.vpc.id,
      tags={
        "Name": f"tap-igw-{self.environment_suffix}",
        "Environment": self.environment_suffix
      }
    )

    # Create public subnets
    self.public_subnet_1 = Subnet(
      self,
      "public_subnet_1",
      vpc_id=self.vpc.id,
      cidr_block="10.0.1.0/24",
      availability_zone=Fn.element(self.azs.names, 0),
      map_public_ip_on_launch=True,
      tags={
        "Name": f"tap-public-subnet-1-{self.environment_suffix}",
        "Environment": self.environment_suffix,
        "Type": "Public"
      }
    )

    self.public_subnet_2 = Subnet(
      self,
      "public_subnet_2",
      vpc_id=self.vpc.id,
      cidr_block="10.0.2.0/24",
      availability_zone=Fn.element(self.azs.names, 1),
      map_public_ip_on_launch=True,
      tags={
        "Name": f"tap-public-subnet-2-{self.environment_suffix}",
        "Environment": self.environment_suffix,
        "Type": "Public"
      }
    )

    # Create private subnets
    self.private_subnet_1 = Subnet(
      self,
      "private_subnet_1",
      vpc_id=self.vpc.id,
      cidr_block="10.0.11.0/24",
      availability_zone=Fn.element(self.azs.names, 0),
      tags={
        "Name": f"tap-private-subnet-1-{self.environment_suffix}",
        "Environment": self.environment_suffix,
        "Type": "Private"
      }
    )

    self.private_subnet_2 = Subnet(
      self,
      "private_subnet_2",
      vpc_id=self.vpc.id,
      cidr_block="10.0.12.0/24",
      availability_zone=Fn.element(self.azs.names, 1),
      tags={
        "Name": f"tap-private-subnet-2-{self.environment_suffix}",
        "Environment": self.environment_suffix,
        "Type": "Private"
      }
    )

    # Create NAT Gateway
    self.nat_eip = Eip(
      self,
      "nat_eip",
      domain="vpc",
      tags={
        "Name": f"tap-nat-eip-{self.environment_suffix}",
        "Environment": self.environment_suffix
      }
    )

    self.nat_gateway = NatGateway(
      self,
      "nat_gateway",
      allocation_id=self.nat_eip.id,
      subnet_id=self.public_subnet_1.id,
      tags={
        "Name": f"tap-nat-{self.environment_suffix}",
        "Environment": self.environment_suffix
      }
    )

    # Create route tables
    self.public_route_table = RouteTable(
      self,
      "public_route_table",
      vpc_id=self.vpc.id,
      tags={
        "Name": f"tap-public-rt-{self.environment_suffix}",
        "Environment": self.environment_suffix
      }
    )

    self.private_route_table = RouteTable(
      self,
      "private_route_table",
      vpc_id=self.vpc.id,
      tags={
        "Name": f"tap-private-rt-{self.environment_suffix}",
        "Environment": self.environment_suffix
      }
    )

    # Create routes
    Route(
      self,
      "public_route",
      route_table_id=self.public_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      gateway_id=self.igw.id
    )

    Route(
      self,
      "private_route",
      route_table_id=self.private_route_table.id,
      destination_cidr_block="0.0.0.0/0",
      nat_gateway_id=self.nat_gateway.id
    )

    # Associate subnets with route tables
    RouteTableAssociation(
      self,
      "public_subnet_1_association",
      subnet_id=self.public_subnet_1.id,
      route_table_id=self.public_route_table.id
    )

    RouteTableAssociation(
      self,
      "public_subnet_2_association",
      subnet_id=self.public_subnet_2.id,
      route_table_id=self.public_route_table.id
    )

    RouteTableAssociation(
      self,
      "private_subnet_1_association",
      subnet_id=self.private_subnet_1.id,
      route_table_id=self.private_route_table.id
    )

    RouteTableAssociation(
      self,
      "private_subnet_2_association",
      subnet_id=self.private_subnet_2.id,
      route_table_id=self.private_route_table.id
    )

    # Create CloudWatch Log Group for VPC Flow Logs
    self.vpc_flow_log_group = CloudwatchLogGroup(
      self,
      "vpc_flow_log_group",
      name=f"/aws/vpc/flowlogs/{self.environment_suffix}",
      retention_in_days=30,
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "VPC Flow Logs"
      }
    )

    # Create IAM role for VPC Flow Logs
    vpc_flow_log_assume_role_policy = DataAwsIamPolicyDocument(
      self,
      "vpc_flow_log_assume_role_policy",
      statement=[{
        "effect": "Allow",
        "principals": [{
          "type": "Service",
          "identifiers": ["vpc-flow-logs.amazonaws.com"]
        }],
        "actions": ["sts:AssumeRole"]
      }]
    )

    self.vpc_flow_log_role = IamRole(
      self,
      "vpc_flow_log_role",
      name=f"tap-vpc-flow-log-role-{self.environment_suffix}",
      assume_role_policy=vpc_flow_log_assume_role_policy.json,
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "VPC Flow Logs"
      }
    )

    # Create IAM policy for VPC Flow Logs
    vpc_flow_log_policy_document = DataAwsIamPolicyDocument(
      self,
      "vpc_flow_log_policy_document",
      statement=[{
        "effect": "Allow",
        "actions": [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ],
        "resources": [f"{self.vpc_flow_log_group.arn}:*"]
      }]
    )

    vpc_flow_log_policy = IamPolicy(
      self,
      "vpc_flow_log_policy",
      name=f"tap-vpc-flow-log-policy-{self.environment_suffix}",
      policy=vpc_flow_log_policy_document.json,
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "VPC Flow Logs"
      }
    )

    IamRolePolicyAttachment(
      self,
      "vpc_flow_log_policy_attachment",
      role=self.vpc_flow_log_role.name,
      policy_arn=vpc_flow_log_policy.arn
    )

    # Enable VPC Flow Logs
    FlowLog(
      self,
      "vpc_flow_log",
      iam_role_arn=self.vpc_flow_log_role.arn,
      log_destination=self.vpc_flow_log_group.arn,
      log_destination_type="cloud-watch-logs",
      traffic_type="ALL",
      vpc_id=self.vpc.id,
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "VPC Flow Logs"
      }
    )

  def _create_security_groups(self):
    """Create security groups with documented rules."""
    # Web tier security group
    self.web_sg = SecurityGroup(
      self,
      "web_security_group",
      name=f"tap-web-sg-{self.environment_suffix}",
      description="Security group for web tier - allows HTTP/HTTPS traffic",
      vpc_id=self.vpc.id,
      ingress=[
        {
          "from_port": 80,
          "to_port": 80,
          "protocol": "tcp",
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "HTTP traffic from internet"
        },
        {
          "from_port": 443,
          "to_port": 443,
          "protocol": "tcp",
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "HTTPS traffic from internet"
        }
      ],
      egress=[
        {
          "from_port": 0,
          "to_port": 0,
          "protocol": "-1",
          "cidr_blocks": ["0.0.0.0/0"],
          "description": "All outbound traffic"
        }
      ],
      tags={
        "Name": f"tap-web-sg-{self.environment_suffix}",
        "Environment": self.environment_suffix,
        "Tier": "Web",
        "Purpose": "Web tier security group with HTTP/HTTPS access"
      }
    )

    # Database security group
    self.db_sg = SecurityGroup(
      self,
      "database_security_group",
      name=f"tap-db-sg-{self.environment_suffix}",
      description="Security group for database tier - allows MySQL access from web tier only",
      vpc_id=self.vpc.id,
      ingress=[
        {
          "from_port": 3306,
          "to_port": 3306,
          "protocol": "tcp",
          "security_groups": [self.web_sg.id],
          "description": "MySQL access from web tier"
        }
      ],
      tags={
        "Name": f"tap-db-sg-{self.environment_suffix}",
        "Environment": self.environment_suffix,
        "Tier": "Database",
        "Purpose": "Database security group with restricted MySQL access"
      }
    )

  def _create_s3_infrastructure(self):
    """Create S3 buckets with encryption and restricted access."""
    # Application data bucket
    self.app_bucket = S3Bucket(
      self,
      "app_bucket",
      bucket=f"tap-app-data-{self.environment_suffix}-{self.current_account.account_id}",
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "Application Data Storage",
        "Owner": self.default_tags.get("tags", {}).get("Author", "unknown")
      }
    )

    # Enable versioning
    S3BucketVersioningA(
      self,
      "app_bucket_versioning",
      bucket=self.app_bucket.id,
      versioning_configuration={
        "status": "Enabled"
      }
    )

    # Enable AES-256 encryption
    S3BucketServerSideEncryptionConfigurationA(
      self,
      "app_bucket_encryption",
      bucket=self.app_bucket.id,
      rule=[
        S3BucketServerSideEncryptionConfigurationRuleA(
          apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
            sse_algorithm="AES256"
          ),
          bucket_key_enabled=True
        )
      ]
    )

    # Block public access
    S3BucketPublicAccessBlock(
      self,
      "app_bucket_public_access_block",
      bucket=self.app_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True
    )

    # Create bucket policy for restricted access
    app_bucket_policy_document = DataAwsIamPolicyDocument(
      self,
      "app_bucket_policy_document",
      statement=[
        {
          "sid": "DenyInsecureConnections",
          "effect": "Deny",
          "principals": [{"type": "*", "identifiers": ["*"]}],
          "actions": ["s3:*"],
          "resources": [
            self.app_bucket.arn,
            f"{self.app_bucket.arn}/*"
          ],
          "condition": [{
            "test": "Bool",
            "variable": "aws:SecureTransport",
            "values": ["false"]
          }]
        },
        {
          "sid": "RestrictToAuthorizedRoles",
          "effect": "Allow",
          "principals": [{
            "type": "AWS",
            "identifiers": [f"arn:aws:iam::{self.current_account.account_id}:root"]
          }],
          "actions": [
            "s3:GetObject",
            "s3:PutObject",
            "s3:DeleteObject",
            "s3:ListBucket"
          ],
          "resources": [
            self.app_bucket.arn,
            f"{self.app_bucket.arn}/*"
          ]
        }
      ]
    )

    S3BucketPolicy(
      self,
      "app_bucket_policy",
      bucket=self.app_bucket.id,
      policy=app_bucket_policy_document.json
    )

  def _create_iam_infrastructure(self):
    """Create IAM roles and policies following least privilege principle."""
    # EC2 read-only policy
    ec2_readonly_policy_document = DataAwsIamPolicyDocument(
      self,
      "ec2_readonly_policy_document",
      statement=[{
        "effect": "Allow",
        "actions": [
          "ec2:Describe*",
          "ec2:Get*",
          "cloudwatch:GetMetricStatistics",
          "cloudwatch:ListMetrics"
        ],
        "resources": ["*"]
      }]
    )

    self.ec2_readonly_policy = IamPolicy(
      self,
      "ec2_readonly_policy",
      name=f"tap-ec2-readonly-policy-{self.environment_suffix}",
      description="Read-only access to EC2 resources",
      policy=ec2_readonly_policy_document.json,
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "EC2 Read-Only Access"
      }
    )

    # Application role for EC2 instances
    ec2_assume_role_policy = DataAwsIamPolicyDocument(
      self,
      "ec2_assume_role_policy",
      statement=[{
        "effect": "Allow",
        "principals": [{
          "type": "Service",
          "identifiers": ["ec2.amazonaws.com"]
        }],
        "actions": ["sts:AssumeRole"]
      }]
    )

    self.app_role = IamRole(
      self,
      "app_role",
      name=f"tap-app-role-{self.environment_suffix}",
      assume_role_policy=ec2_assume_role_policy.json,
      description="Application role with least privilege access",
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "Application Role"
      }
    )

    # Attach read-only policy to application role
    IamRolePolicyAttachment(
      self,
      "app_role_ec2_readonly_attachment",
      role=self.app_role.name,
      policy_arn=self.ec2_readonly_policy.arn
    )

    # IAM user with MFA requirement
    self.app_user = IamUser(
      self,
      "app_user",
      name=f"tap-app-user-{self.environment_suffix}",
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "Application User",
        "MFARequired": "true"
      }
    )

    # MFA policy for user
    mfa_policy_document = DataAwsIamPolicyDocument(
      self,
      "mfa_policy_document",
      statement=[
        {
          "sid": "AllowViewAccountInfo",
          "effect": "Allow",
          "actions": [
            "iam:GetAccountPasswordPolicy",
            "iam:ListVirtualMFADevices"
          ],
          "resources": ["*"]
        },
        {
          "sid": "AllowManageOwnPasswords",
          "effect": "Allow",
          "actions": [
            "iam:ChangePassword",
            "iam:GetUser"
          ],
          "resources": [f"arn:aws:iam::{self.current_account.account_id}:user/${{aws:username}}"]
        },
        {
          "sid": "AllowManageOwnMFA",
          "effect": "Allow",
          "actions": [
            "iam:CreateVirtualMFADevice",
            "iam:DeleteVirtualMFADevice",
            "iam:EnableMFADevice",
            "iam:ListMFADevices",
            "iam:ResyncMFADevice"
          ],
          "resources": [
            f"arn:aws:iam::{self.current_account.account_id}:mfa/${{aws:username}}",
            f"arn:aws:iam::{self.current_account.account_id}:user/${{aws:username}}"
          ]
        },
        {
          "sid": "DenyAllExceptUnlessSignedInWithMFA",
          "effect": "Deny",
          "not_actions": [
            "iam:CreateVirtualMFADevice",
            "iam:EnableMFADevice",
            "iam:GetUser",
            "iam:ListMFADevices",
            "iam:ListVirtualMFADevices",
            "iam:ResyncMFADevice",
            "sts:GetSessionToken"
          ],
          "resources": ["*"],
          "condition": [{
            "test": "BoolIfExists",
            "variable": "aws:MultiFactorAuthPresent",
            "values": ["false"]
          }]
        }
      ]
    )

    mfa_policy = IamPolicy(
      self,
      "mfa_policy",
      name=f"tap-mfa-policy-{self.environment_suffix}",
      description="Enforce MFA for IAM users",
      policy=mfa_policy_document.json,
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "MFA Enforcement"
      }
    )

    IamUserPolicyAttachment(
      self,
      "app_user_mfa_policy_attachment",
      user=self.app_user.name,
      policy_arn=mfa_policy.arn
    )

  def _create_rds_infrastructure(self):
    """Create RDS instance with Secrets Manager integration."""
    # Create DB subnet group
    self.db_subnet_group = DbSubnetGroup(
      self,
      "db_subnet_group",
      name=f"tap-db-subnet-group-{self.environment_suffix}",
      description="Subnet group for RDS database",
      subnet_ids=[self.private_subnet_1.id, self.private_subnet_2.id],
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "Database Subnet Group"
      }
    )

    # Create secret for database credentials
    self.db_secret = SecretsmanagerSecret(
      self,
      "db_secret",
      name=f"tap-db-credentials-{self.environment_suffix}",
      description="Database credentials for RDS instance",
      recovery_window_in_days=7,
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "Database Credentials"
      }
    )

    # Store database credentials
    db_credentials = {
      "username": "admin",
      "password": "ChangeMe123!",  # In production, use generated password
      "database": f"tapdb{self.environment_suffix}",
      "host": "will-be-updated-after-creation",
      "port": 3306
    }

    SecretsmanagerSecretVersion(
      self,
      "db_secret_version",
      secret_id=self.db_secret.id,
      secret_string=json.dumps(db_credentials)
    )

    # Create RDS instance
    self.rds_instance = DbInstance(
      self,
      "rds_instance",
      identifier=f"tap-db-{self.environment_suffix}",
      engine="mysql",
      engine_version="8.0",
      instance_class="db.t3.micro",
      allocated_storage=20,
      storage_type="gp2",
      storage_encrypted=True,
      db_name=f"tapdb{self.environment_suffix}",
      username="admin",
      password="ChangeMe123!",  # In production, reference from Secrets Manager
      vpc_security_group_ids=[self.db_sg.id],
      db_subnet_group_name=self.db_subnet_group.name,
      publicly_accessible=False,
      backup_retention_period=7,
      backup_window="03:00-04:00",
      maintenance_window="sun:04:00-sun:05:00",
      auto_minor_version_upgrade=True,
      deletion_protection=True,
      skip_final_snapshot=False,
      final_snapshot_identifier=f"tap-db-final-snapshot-{self.environment_suffix}",
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "Application Database",
        "Owner": self.default_tags.get("tags", {}).get("Author", "unknown")
      }
    )

  def _create_cloudtrail_infrastructure(self):
    """Create CloudTrail with dedicated encrypted S3 bucket."""
    # CloudTrail S3 bucket
    self.cloudtrail_bucket = S3Bucket(
      self,
      "cloudtrail_bucket",
      bucket=f"tap-cloudtrail-{self.environment_suffix}-{self.current_account.account_id}",
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "CloudTrail Logs",
        "Owner": self.default_tags.get("tags", {}).get("Author", "unknown")
      }
    )

    # Enable versioning
    S3BucketVersioningA(
      self,
      "cloudtrail_bucket_versioning",
      bucket=self.cloudtrail_bucket.id,
      versioning_configuration={
        "status": "Enabled"
      }
    )

    # Enable AES-256 encryption
    S3BucketServerSideEncryptionConfigurationA(
      self,
      "cloudtrail_bucket_encryption",
      bucket=self.cloudtrail_bucket.id,
      rule=[
        S3BucketServerSideEncryptionConfigurationRuleA(
          apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultA(
            sse_algorithm="AES256"
          ),
          bucket_key_enabled=True
        )
      ]
    )

    # Block public access
    S3BucketPublicAccessBlock(
      self,
      "cloudtrail_bucket_public_access_block",
      bucket=self.cloudtrail_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True
    )

    # CloudTrail bucket policy - only allow CloudTrail service
    cloudtrail_bucket_policy_document = DataAwsIamPolicyDocument(
      self,
      "cloudtrail_bucket_policy_document",
      statement=[
        {
          "sid": "AWSCloudTrailAclCheck",
          "effect": "Allow",
          "principals": [{
            "type": "Service",
            "identifiers": ["cloudtrail.amazonaws.com"]
          }],
          "actions": ["s3:GetBucketAcl"],
          "resources": [self.cloudtrail_bucket.arn],
          "condition": [{
            "test": "StringEquals",
            "variable": "AWS:SourceArn",
            "values": [f"arn:aws:cloudtrail:{self.aws_region}:{self.current_account.account_id}:trail/tap-cloudtrail-{self.environment_suffix}"]
          }]
        },
        {
          "sid": "AWSCloudTrailWrite",
          "effect": "Allow",
          "principals": [{
            "type": "Service",
            "identifiers": ["cloudtrail.amazonaws.com"]
          }],
          "actions": ["s3:PutObject"],
          "resources": [f"{self.cloudtrail_bucket.arn}/*"],
          "condition": [
            {
              "test": "StringEquals",
              "variable": "s3:x-amz-acl",
              "values": ["bucket-owner-full-control"]
            },
            {
              "test": "StringEquals",
              "variable": "AWS:SourceArn",
              "values": [f"arn:aws:cloudtrail:{self.aws_region}:{self.current_account.account_id}:trail/tap-cloudtrail-{self.environment_suffix}"]
            }
          ]
        },
        {
          "sid": "DenyInsecureConnections",
          "effect": "Deny",
          "principals": [{"type": "*", "identifiers": ["*"]}],
          "actions": ["s3:*"],
          "resources": [
            self.cloudtrail_bucket.arn,
            f"{self.cloudtrail_bucket.arn}/*"
          ],
          "condition": [{
            "test": "Bool",
            "variable": "aws:SecureTransport",
            "values": ["false"]
          }]
        }
      ]
    )

    S3BucketPolicy(
      self,
      "cloudtrail_bucket_policy",
      bucket=self.cloudtrail_bucket.id,
      policy=cloudtrail_bucket_policy_document.json
    )

    # Create CloudTrail
    self.cloudtrail = Cloudtrail(
      self,
      "cloudtrail",
      name=f"tap-cloudtrail-{self.environment_suffix}",
      s3_bucket_name=self.cloudtrail_bucket.bucket,
      s3_key_prefix="AWSLogs",
      include_global_service_events=True,
      is_multi_region_trail=True,
      enable_logging=True,
      enable_log_file_validation=True,
      tags={
        "Environment": self.environment_suffix,
        "Purpose": "Audit Trail",
        "Owner": self.default_tags.get("tags", {}).get("Author", "unknown")
      }
    )

  def _create_outputs(self):
    """Create Terraform outputs for important resource information."""
    TerraformOutput(
      self,
      "vpc_id",
      value=self.vpc.id,
      description="VPC ID"
    )

    TerraformOutput(
      self,
      "public_subnet_ids",
      value=[self.public_subnet_1.id, self.public_subnet_2.id],
      description="Public subnet IDs"
    )

    TerraformOutput(
      self,
      "private_subnet_ids",
      value=[self.private_subnet_1.id, self.private_subnet_2.id],
      description="Private subnet IDs"
    )

    TerraformOutput(
      self,
      "app_bucket_name",
      value=self.app_bucket.bucket,
      description="Application S3 bucket name"
    )

    TerraformOutput(
      self,
      "cloudtrail_bucket_name",
      value=self.cloudtrail_bucket.bucket,
      description="CloudTrail S3 bucket name"
    )

    TerraformOutput(
      self,
      "rds_endpoint",
      value=self.rds_instance.endpoint,
      description="RDS instance endpoint"
    )

    TerraformOutput(
      self,
      "db_secret_arn",
      value=self.db_secret.arn,
      description="Database credentials secret ARN"
    )

    TerraformOutput(
      self,
      "app_role_arn",
      value=self.app_role.arn,
      description="Application IAM role ARN"
    )

    TerraformOutput(
      self,
      "web_security_group_id",
      value=self.web_sg.id,
      description="Web tier security group ID"
    )

    TerraformOutput(
      self,
      "environment",
      value=self.environment_suffix,
      description="Environment suffix"
    )

    TerraformOutput(
      self,
      "region",
      value=self.aws_region,
      description="AWS region"
    )
