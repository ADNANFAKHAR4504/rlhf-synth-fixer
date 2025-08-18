I'll create a comprehensive IaC solution using CDK for Terraform (CDKTF) in Python that meets all your requirements. Let me break this down into modular components.

## Project Structure

```
iac-aws-nova/
├── tap.py                 # Main application entry point
├── tap_stack.py          # Stack definition
├── requirements.txt      # Python dependencies
├── .pre-commit-config.yaml
├── cdktf.json           # CDKTF configuration
└── README.md
```

## 1. Main Application Entry Point (`tap.py`)

```python
#!/usr/bin/env python3
"""
Main application entry point for AWS Nova Model IaC deployment
"""

import os
from constructs import Construct
from cdktf import App, TerraformStack
from tap_stack import TapStack

def main():
    """Initialize and deploy the CDKTF application"""
    app = App()
    
    # Environment configuration
    environment = os.environ.get('ENVIRONMENT', 'dev')
    owner = os.environ.get('OWNER', 'nova-team@company.com')
    region = os.environ.get('AWS_REGION', 'us-west-2')
    
    # Validate region constraint
    if region == 'us-east-1':
        raise ValueError("Deployment to us-east-1 region is explicitly forbidden")
    
    # Create stack with environment-specific naming
    stack_name = f"tap-nova-{environment}"
    
    TapStack(
        app, 
        stack_name,
        environment=environment,
        owner=owner,
        region=region
    )
    
    app.synth()

if __name__ == "__main__":
    main()
```

## 2. Stack Definition (`tap_stack.py`)

```python
"""
Main stack definition for AWS Nova Model infrastructure
"""

import json
from typing import Dict, Any
from constructs import Construct
from cdktf import TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_encryption import S3BucketEncryption
from cdktf_cdktf_provider_aws.s3_bucket_policy import S3BucketPolicy
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy_document import IamPolicyDocument
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.cloudtrail import Cloudtrail
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias

class TapStack(TerraformStack):
    def __init__(
        self, 
        scope: Construct, 
        id: str, 
        environment: str,
        owner: str,
        region: str,
        **kwargs
    ):
        super().__init__(scope, id, **kwargs)
        
        self.environment = environment
        self.owner = owner
        self.region = region
        
        # Common tags for all resources
        self.common_tags = {
            "Environment": environment,
            "Owner": owner,
            "Project": "tap-nova",
            "ManagedBy": "terraform-cdktf"
        }
        
        # Initialize AWS Provider
        self.aws_provider = AwsProvider(
            self, "aws",
            region=region,
            default_tags=[{
                "tags": self.common_tags
            }]
        )
        
        # Get AWS account info and AZs
        self.caller_identity = DataAwsCallerIdentity(self, "current")
        self.azs = DataAwsAvailabilityZones(
            self, "available",
            state="available"
        )
        
        # Create infrastructure components
        self._create_kms_keys()
        self._create_vpc_infrastructure()
        self._create_s3_buckets()
        self._create_iam_resources()
        self._create_security_groups()
        self._create_rds_infrastructure()
        self._create_cloudtrail()
        self._create_outputs()
    
    def _create_kms_keys(self):
        """Create KMS keys for encryption"""
        # KMS key for S3 encryption
        self.s3_kms_key = KmsKey(
            self, "s3-kms-key",
            description="KMS key for S3 bucket encryption",
            deletion_window_in_days=7,
            tags=self.common_tags
        )
        
        KmsAlias(
            self, "s3-kms-alias",
            name=f"alias/tap-nova-s3-{self.environment}",
            target_key_id=self.s3_kms_key.key_id
        )
        
        # KMS key for CloudTrail
        self.cloudtrail_kms_key = KmsKey(
            self, "cloudtrail-kms-key",
            description="KMS key for CloudTrail encryption",
            deletion_window_in_days=7,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{self.caller_identity.account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Principal": {"Service": "cloudtrail.amazonaws.com"},
                        "Action": [
                            "kms:GenerateDataKey",
                            "kms:DescribeKey",
                            "kms:Encrypt",
                            "kms:ReEncrypt*",
                            "kms:CreateGrant",
                            "kms:Decrypt"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags=self.common_tags
        )
    
    def _create_vpc_infrastructure(self):
        """Create VPC with public and private subnets"""
        # VPC
        self.vpc = Vpc(
            self, "main-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"tap-nova-vpc-{self.environment}"}
        )
        
        # Internet Gateway
        self.igw = InternetGateway(
            self, "igw",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"tap-nova-igw-{self.environment}"}
        )
        
        # Public Subnets
        self.public_subnets = []
        self.private_subnets = []
        
        for i in range(2):  # Create 2 AZs for HA
            # Public subnet
            public_subnet = Subnet(
                self, f"public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=f"{self.azs.names[i]}",
                map_public_ip_on_launch=True,
                tags={**self.common_tags, "Name": f"tap-nova-public-{i+1}-{self.environment}"}
            )
            self.public_subnets.append(public_subnet)
            
            # Private subnet
            private_subnet = Subnet(
                self, f"private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=f"{self.azs.names[i]}",
                tags={**self.common_tags, "Name": f"tap-nova-private-{i+1}-{self.environment}"}
            )
            self.private_subnets.append(private_subnet)
        
        # NAT Gateways for private subnets
        self.nat_gateways = []
        for i, public_subnet in enumerate(self.public_subnets):
            # Elastic IP for NAT Gateway
            eip = Eip(
                self, f"nat-eip-{i+1}",
                domain="vpc",
                tags={**self.common_tags, "Name": f"tap-nova-nat-eip-{i+1}-{self.environment}"}
            )
            
            # NAT Gateway
            nat_gw = NatGateway(
                self, f"nat-gw-{i+1}",
                allocation_id=eip.id,
                subnet_id=public_subnet.id,
                tags={**self.common_tags, "Name": f"tap-nova-nat-{i+1}-{self.environment}"}
            )
            self.nat_gateways.append(nat_gw)
        
        # Route Tables
        # Public route table
        self.public_rt = RouteTable(
            self, "public-rt",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"tap-nova-public-rt-{self.environment}"}
        )
        
        Route(
            self, "public-route",
            route_table_id=self.public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(
                self, f"public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id
            )
        
        # Private route tables (one per AZ)
        for i, (private_subnet, nat_gw) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = RouteTable(
                self, f"private-rt-{i+1}",
                vpc_id=self.vpc.id,
                tags={**self.common_tags, "Name": f"tap-nova-private-rt-{i+1}-{self.environment}"}
            )
            
            Route(
                self, f"private-route-{i+1}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gw.id
            )
            
            RouteTableAssociation(
                self, f"private-rta-{i+1}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id
            )
        
        # VPC Flow Logs
        self.flow_log_group = CloudwatchLogGroup(
            self, "vpc-flow-logs",
            name=f"/aws/vpc/flowlogs-{self.environment}",
            retention_in_days=14,
            tags=self.common_tags
        )
        
        # IAM role for Flow Logs
        flow_log_role_doc = IamPolicyDocument(
            self, "flow-log-assume-role",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Service",
                    "identifiers": ["vpc-flow-logs.amazonaws.com"]
                }],
                "actions": ["sts:AssumeRole"]
            }]
        )
        
        self.flow_log_role = IamRole(
            self, "flow-log-role",
            name=f"tap-nova-flow-log-role-{self.environment}",
            assume_role_policy=flow_log_role_doc.json,
            tags=self.common_tags
        )
        
        flow_log_policy_doc = IamPolicyDocument(
            self, "flow-log-policy",
            statement=[{
                "effect": "Allow",
                "actions": [
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                    "logs:DescribeLogGroups",
                    "logs:DescribeLogStreams"
                ],
                "resources": ["*"]
            }]
        )
        
        flow_log_policy = IamPolicy(
            self, "flow-log-policy-resource",
            name=f"tap-nova-flow-log-policy-{self.environment}",
            policy=flow_log_policy_doc.json,
            tags=self.common_tags
        )
        
        IamRolePolicyAttachment(
            self, "flow-log-policy-attachment",
            role=self.flow_log_role.name,
            policy_arn=flow_log_policy.arn
        )
        
        # VPC Flow Log
        FlowLog(
            self, "vpc-flow-log",
            iam_role_arn=self.flow_log_role.arn,
            log_destination=self.flow_log_group.arn,
            log_destination_type="cloud-watch-logs",
            traffic_type="ALL",
            vpc_id=self.vpc.id,
            tags=self.common_tags
        )
    
    def _create_s3_buckets(self):
        """Create S3 buckets with encryption and policies"""
        # CloudTrail S3 bucket
        self.cloudtrail_bucket = S3Bucket(
            self, "cloudtrail-bucket",
            bucket=f"tap-nova-cloudtrail-{self.environment}-{self.caller_identity.account_id}",
            tags=self.common_tags
        )
        
        # S3 bucket encryption
        S3BucketEncryption(
            self, "cloudtrail-bucket-encryption",
            bucket=self.cloudtrail_bucket.id,
            server_side_encryption_configuration=[{
                "rule": [{
                    "apply_server_side_encryption_by_default": [{
                        "kms_master_key_id": self.cloudtrail_kms_key.arn,
                        "sse_algorithm": "aws:kms"
                    }],
                    "bucket_key_enabled": True
                }]
            }]
        )
        
        # Block public access
        S3BucketPublicAccessBlock(
            self, "cloudtrail-bucket-pab",
            bucket=self.cloudtrail_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
        
        # CloudTrail bucket policy
        cloudtrail_bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "cloudtrail.amazonaws.com"},
                    "Action": "s3:PutObject",
                    "Resource": f"{self.cloudtrail_bucket.arn}/*",
                    "Condition": {
                        "StringEquals": {
                            "s3:x-amz-acl": "bucket-owner-full-control"
                        }
                    }
                },
                {
                    "Effect": "Allow",
                    "Principal": {"Service": "cloudtrail.amazonaws.com"},
                    "Action": "s3:GetBucketAcl",
                    "Resource": self.cloudtrail_bucket.arn
                }
            ]
        }
        
        S3BucketPolicy(
            self, "cloudtrail-bucket-policy",
            bucket=self.cloudtrail_bucket.id,
            policy=json.dumps(cloudtrail_bucket_policy)
        )
        
        # Application data bucket
        self.app_data_bucket = S3Bucket(
            self, "app-data-bucket",
            bucket=f"tap-nova-app-data-{self.environment}-{self.caller_identity.account_id}",
            tags=self.common_tags
        )
        
        S3BucketEncryption(
            self, "app-data-bucket-encryption",
            bucket=self.app_data_bucket.id,
            server_side_encryption_configuration=[{
                "rule": [{
                    "apply_server_side_encryption_by_default": [{
                        "kms_master_key_id": self.s3_kms_key.arn,
                        "sse_algorithm": "aws:kms"
                    }],
                    "bucket_key_enabled": True
                }]
            }]
        )
        
        S3BucketPublicAccessBlock(
            self, "app-data-bucket-pab",
            bucket=self.app_data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )
    
    def _create_iam_resources(self):
        """Create IAM roles and policies"""
        # EC2 read-only policy
        ec2_readonly_policy_doc = IamPolicyDocument(
            self, "ec2-readonly-policy",
            statement=[{
                "effect": "Allow",
                "actions": [
                    "ec2:Describe*",
                    "ec2:Get*",
                    "ec2:List*"
                ],
                "resources": ["*"]
            }]
        )
        
        self.ec2_readonly_policy = IamPolicy(
            self, "ec2-readonly-policy-resource",
            name=f"tap-nova-ec2-readonly-{self.environment}",
            description="Read-only access to EC2 resources",
            policy=ec2_readonly_policy_doc.json,
            tags=self.common_tags
        )
        
        # Application role
        app_role_doc = IamPolicyDocument(
            self, "app-assume-role",
            statement=[{
                "effect": "Allow",
                "principals": [{
                    "type": "Service",
                    "identifiers": ["ec2.amazonaws.com"]
                }],
                "actions": ["sts:AssumeRole"],
                "condition": {
                    "Bool": {
                        "aws:MultiFactorAuthPresent": "true"
                    }
                }
            }]
        )
        
        self.app_role = IamRole(
            self, "app-role",
            name=f"tap-nova-app-role-{self.environment}",
            assume_role_policy=app_role_doc.json,
            tags=self.common_tags
        )
        
        # Attach EC2 read-only policy to app role
        IamRolePolicyAttachment(
            self, "app-role-ec2-readonly",
            role=self.app_role.name,
            policy_arn=self.ec2_readonly_policy.arn
        )
    
    def _create_security_groups(self):
        """Create security groups with documented rules"""
        # Database security group
        self.db_sg = SecurityGroup(
            self, "db-sg",
            name=f"tap-nova-db-sg-{self.environment}",
            description="Security group for RDS database - allows MySQL/Aurora access from application tier",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"tap-nova-db-sg-{self.environment}"}
        )
        
        # Application security group
        self.app_sg = SecurityGroup(
            self, "app-sg",
            name=f"tap-nova-app-sg-{self.environment}",
            description="Security group for application tier - allows HTTP/HTTPS and database access",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"tap-nova-app-sg-{self.environment}"}
        )
        
        # Security group rules with documentation
        # App SG - Allow HTTP inbound
        SecurityGroupRule(
            self, "app-sg-http-inbound",
            type="ingress",
            from_port=80,
            to_port=80,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],  # Only from VPC
            security_group_id=self.app_sg.id,
            description="Allow HTTP traffic from within VPC"
        )
        
        # App SG - Allow HTTPS inbound
        SecurityGroupRule(
            self, "app-sg-https-inbound",
            type="ingress",
            from_port=443,
            to_port=443,
            protocol="tcp",
            cidr_blocks=["10.0.0.0/16"],  # Only from VPC
            security_group_id=self.app_sg.id,
            description="Allow HTTPS traffic from within VPC"
        )
        
        # App SG - Allow all outbound
        SecurityGroupRule(
            self, "app-sg-all-outbound",
            type="egress",
            from_port=0,
            to_port=65535,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.app_sg.id,
            description="Allow all outbound traffic"
        )
        
        # DB SG - Allow MySQL from app SG
        SecurityGroupRule(
            self, "db-sg-mysql-from-app",
            type="ingress",
            from_port=3306,
            to_port=3306,
            protocol="tcp",
            source_security_group_id=self.app_sg.id,
            security_group_id=self.db_sg.id,
            description="Allow MySQL access from application security group"
        )
    
    def _create_rds_infrastructure(self):
        """Create RDS infrastructure with Secrets Manager"""
        # Create DB credentials in Secrets Manager
        self.db_secret = SecretsmanagerSecret(
            self, "db-credentials",
            name=f"tap-nova-db-credentials-{self.environment}",
            description="RDS database credentials",
            tags=self.common_tags
        )
        
        # Store initial credentials
        db_credentials = {
            "username": "admin",
            "password": "ChangeMe123!",  # This should be generated/rotated
            "engine": "mysql",
            "host": "",  # Will be updated after RDS creation
            "port": 3306,
            "dbname": f"tapnova{self.environment}"
        }
        
        SecretsmanagerSecretVersion(
            self, "db-credentials-version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(db_credentials)
        )
        
        # DB Subnet Group
        self.db_subnet_group = DbSubnetGroup(
            self, "db-subnet-group",
            name=f"tap-nova-db-subnet-group-{self.environment}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.common_tags, "Name": f"tap-nova-db-subnet-group-{self.environment}"}
        )
        
        # RDS Instance
        self.rds_instance = DbInstance(
            self, "rds-instance",
            identifier=f"tap-nova-db-{self.environment}",
            engine="mysql",
            engine_version="8.0",
            instance_class=self._get_db_instance_class(),
            allocated_storage=20,
            max_allocated_storage=100,
            storage_type="gp2",
            storage_encrypted=True,
            kms_key_id=self.s3_kms_key.arn,
            db_name=db_credentials["dbname"],
            username=db_credentials["username"],
            manage_master_user_password=True,  # Let AWS manage the password
            master_user_secret_kms_key_id=self.s3_kms_key.arn,
            vpc_security_group_ids=[self.db_sg.id],
            db_subnet_group_name=self.db_subnet_group.name,
            publicly_accessible=False,
            multi_az=self.environment == "prod",
            backup_retention_period=7 if self.environment == "prod" else 1,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            deletion_protection=self.environment == "prod",
            skip_final_snapshot=self.environment != "prod",
            final_snapshot_identifier=f"tap-nova-db-final-snapshot-{self.environment}" if self.environment == "prod" else None,
            tags=self.common_tags
        )
    
    def _create_cloudtrail(self):
        """Create CloudTrail for audit logging"""
        self.cloudtrail = Cloudtrail(
            self, "cloudtrail",
            name=f"tap-nova-cloudtrail-{self.environment}",
            s3_bucket_name=self.cloudtrail_bucket.bucket,
            s3_key_prefix="cloudtrail-logs/",
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_logging=True,
            kms_key_id=self.cloudtrail_kms_key.arn,
            event_selector=[{
                "read_write_type": "All",
                "include_management_events": True,
                "data_resource": [{
                    "type": "AWS::S3::Object",
                    "values": [f"{self.app_data_bucket.arn}/*"]
                }]
            }],
            tags=self.common_tags
        )
    
    def _get_db_instance_class(self) -> str:
        """Get DB instance class based on environment"""
        instance_classes = {
            "dev": "db.t3.micro",
            "staging": "db.t3.small",
            "prod": "db.r5.large"
        }
        return instance_classes.get(self.environment, "db.t3.micro")
    
    def _create_outputs(self):
        """Create Terraform outputs"""
        TerraformOutput(
            self, "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )
        
        TerraformOutput(
            self, "public_subnet_ids",
            value=[subnet.id for subnet in self.public_subnets],
            description="Public subnet IDs"
        )
        
        TerraformOutput(
            self, "private_subnet_ids",
            value=[subnet.id for subnet in self.private_subnets],
            description="Private subnet IDs"
        )
        
        TerraformOutput(
            self, "rds_endpoint",
            value=self.rds_instance.endpoint,
            description="RDS instance endpoint",
            sensitive=True
        )
        
        TerraformOutput(
            self, "app_data_bucket_name",
            value=self.app_data_bucket.bucket,
            description="Application data S3 bucket name"
        )
        
        TerraformOutput(
            self, "cloudtrail_bucket_name",
            value=self.cloudtrail_bucket.bucket,
            description="CloudTrail S3 bucket name"
        )
        
        TerraformOutput(
            self, "db_secret_arn",
            value=self.db_secret.arn,
            description="Database credentials secret ARN",
            sensitive=True
        )
```

## 3. Configuration Files

### `requirements.txt`
```txt
cdktf>=0.15.0
cdktf-cdktf-provider-aws>=10.0.0
constructs>=10.0.0
```

### `cdktf.json`
```json
{
  "language": "python",
  "app": "python tap.py",
  "projectId": "tap-nova-iac",
  "terraformProviders": [
    "aws@~> 4.0"
  ],
  "terraformModules": [],
  "context": {
    "excludeStackIdFromLogicalIds": "true",
    "allowSepCharsInLogicalIds": "true"
  }
}
```

### `.pre-commit-config.yaml`
```yaml
repos:
  - repo: https://github.com/pre-commit/pre-commit-hooks
    rev: v4.4.0
    hooks:
      - id: trailing-whitespace
      - id: end-of-file-fixer
      - id: check-yaml
      - id: check-json

  - repo: https://github.com/psf/black
    rev: 23.3.0
    hooks:
      - id: black
        language_version: python3

  - repo: https://github.com/pycqa/flake8
    rev: 6.0.0
    hooks:
      - id: flake8

  - repo: local
    hooks:
      - id: cdktf-fmt
        name: cdktf fmt
        entry: cdktf
        args: [fmt]
        language: system
        pass_filenames: false
        
      - id: cdktf-synth
        name: cdktf synth
        entry: cdktf
        args: [synth]
        language: system
        pass_filenames: false
```

## 4. Deployment Instructions

### Environment Setup
```bash
# Install dependencies
pip install -r requirements.txt

# Install pre-commit hooks
pre-commit install

# Set environment variables
export ENVIRONMENT=dev  # or staging, prod
export OWNER=nova-team@company.com
export AWS_REGION=us-west-2
```

### Deployment Commands
```bash
# Initialize CDKTF
cdktf init

# Synthesize Terraform configuration
cdktf synth

# Deploy infrastructure
cdktf deploy

# Destroy infrastructure (if needed)