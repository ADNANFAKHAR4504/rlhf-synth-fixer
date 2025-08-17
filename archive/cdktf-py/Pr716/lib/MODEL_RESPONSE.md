# main.py
#!/usr/bin/env python3

import os
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput, S3Backend
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupRule
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_encryption import S3BucketEncryption
from cdktf_cdktf_provider_aws.s3_bucket_versioning import S3BucketVersioning
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.cloudtrail import Cloudtrail
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.data_aws_caller_identity import DataAwsCallerIdentity
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret_version import DataAwsSecretsmanagerSecretVersion
import json

class SecureInfrastructureStack(TerraformStack):
    def __init__(self, scope: Construct, id: str, region: str):
        super().__init__(scope, id)
        
        self.region = region
        self.environment = "prod"
        self.common_tags = {
            "env": self.environment,
            "managed_by": "terraform",
            "region": region,
            "project": "secure-infrastructure"
        }
        
        # Configure AWS Provider
        AwsProvider(self, "aws",
            region=region,
            default_tags=[{
                "tags": self.common_tags
            }]
        )
        
        # Get current AWS account info
        self.current = DataAwsCallerIdentity(self, "current")
        
        # Create KMS key for encryption
        self.create_kms_encryption()
        
        # Create S3 bucket for CloudTrail logs
        self.create_cloudtrail_bucket()
        
        # Create IAM roles and policies
        self.create_iam_resources()
        
        # Create VPC and networking
        self.create_vpc_resources()
        
        # Create security groups
        self.create_security_groups()
        
        # Enable CloudTrail logging
        self.create_cloudtrail()
        
        # Create secrets in AWS Secrets Manager
        self.create_secrets()
        
        # Output important values
        self.create_outputs()

    def create_kms_encryption(self):
        """Create KMS key for encryption"""
        kms_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{self.current.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudTrail to encrypt logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    },
                    "Action": [
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*"
                },
                {
                    "Sid": "Allow S3 service to use the key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "s3.amazonaws.com"
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": "*"
                }
            ]
        }
        
        self.kms_key = KmsKey(self, "encryption_key",
            description="KMS key for encrypting infrastructure resources",
            policy=json.dumps(kms_policy),
            tags=self.common_tags
        )
        
        KmsAlias(self, "encryption_key_alias",
            name=f"alias/secure-infrastructure-{self.region}",
            target_key_id=self.kms_key.key_id
        )

    def create_cloudtrail_bucket(self):
        """Create S3 bucket for CloudTrail logs with encryption"""
        bucket_name = f"secure-infrastructure-cloudtrail-{self.region}-{self.current.account_id}"
        
        self.cloudtrail_bucket = S3Bucket(self, "cloudtrail_bucket",
            bucket=bucket_name,
            tags=self.common_tags
        )
        
        # Enable versioning
        S3BucketVersioning(self, "cloudtrail_bucket_versioning",
            bucket=self.cloudtrail_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            }
        )
        
        # Enable encryption
        S3BucketEncryption(self, "cloudtrail_bucket_encryption",
            bucket=self.cloudtrail_bucket.id,
            server_side_encryption_configuration={
                "rule": {
                    "apply_server_side_encryption_by_default": {
                        "kms_master_key_id": self.kms_key.arn,
                        "sse_algorithm": "aws:kms"
                    }
                }
            }
        )
        
        # Block public access
        S3BucketPublicAccessBlock(self, "cloudtrail_bucket_pab",
            bucket=self.cloudtrail_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

    def create_iam_resources(self):
        """Create IAM roles and policies for RBAC"""
        
        # CloudTrail service role
        cloudtrail_assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "cloudtrail.amazonaws.com"
                    }
                }
            ]
        }
        
        self.cloudtrail_role = IamRole(self, "cloudtrail_role",
            name=f"CloudTrailRole-{self.region}",
            assume_role_policy=json.dumps(cloudtrail_assume_role_policy),
            tags=self.common_tags
        )
        
        # CloudTrail policy for S3 access
        cloudtrail_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:GetBucketAcl"
                    ],
                    "Resource": [
                        self.cloudtrail_bucket.arn,
                        f"{self.cloudtrail_bucket.arn}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:GenerateDataKey*",
                        "kms:DescribeKey"
                    ],
                    "Resource": self.kms_key.arn
                }
            ]
        }
        
        cloudtrail_policy = IamPolicy(self, "cloudtrail_policy",
            name=f"CloudTrailPolicy-{self.region}",
            policy=json.dumps(cloudtrail_policy_document),
            tags=self.common_tags
        )
        
        IamRolePolicyAttachment(self, "cloudtrail_policy_attachment",
            role=self.cloudtrail_role.name,
            policy_arn=cloudtrail_policy.arn
        )
        
        # Application role with restricted permissions
        app_assume_role_policy = {
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
        
        self.app_role = IamRole(self, "app_role",
            name=f"ApplicationRole-{self.region}",
            assume_role_policy=json.dumps(app_assume_role_policy),
            tags=self.common_tags
        )
        
        # Application policy with minimal required permissions
        app_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue"
                    ],
                    "Resource": f"arn:aws:secretsmanager:{self.region}:{self.current.account_id}:secret:secure-infrastructure/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt"
                    ],
                    "Resource": self.kms_key.arn
                }
            ]
        }
        
        app_policy = IamPolicy(self, "app_policy",
            name=f"ApplicationPolicy-{self.region}",
            policy=json.dumps(app_policy_document),
            tags=self.common_tags
        )
        
        IamRolePolicyAttachment(self, "app_policy_attachment",
            role=self.app_role.name,
            policy_arn=app_policy.arn
        )

    def create_vpc_resources(self):
        """Create VPC and networking resources"""
        # Create VPC
        self.vpc = Vpc(self, "main_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.common_tags, "Name": f"secure-vpc-{self.region}"}
        )
        
        # Create Internet Gateway
        self.igw = InternetGateway(self, "main_igw",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"secure-igw-{self.region}"}
        )
        
        # Create public subnet
        self.public_subnet = Subnet(self, "public_subnet",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{self.region}a",
            map_public_ip_on_launch=True,
            tags={**self.common_tags, "Name": f"secure-public-subnet-{self.region}"}
        )
        
        # Create private subnet
        self.private_subnet = Subnet(self, "private_subnet",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{self.region}b",
            tags={**self.common_tags, "Name": f"secure-private-subnet-{self.region}"}
        )
        
        # Create route table for public subnet
        self.public_rt = RouteTable(self, "public_rt",
            vpc_id=self.vpc.id,
            route=[{
                "cidr_block": "0.0.0.0/0",
                "gateway_id": self.igw.id
            }],
            tags={**self.common_tags, "Name": f"secure-public-rt-{self.region}"}
        )
        
        # Associate route table with public subnet
        RouteTableAssociation(self, "public_rt_association",
            subnet_id=self.public_subnet.id,
            route_table_id=self.public_rt.id
        )

    def create_security_groups(self):
        """Create security groups with restricted access"""
        
        # Predefined allowed IP addresses (replace with your actual IPs)
        allowed_ips = [
            "203.0.113.0/24",  # Example IP range - replace with your actual IPs
            "198.51.100.0/24"  # Example IP range - replace with your actual IPs
        ]
        
        # Web tier security group
        self.web_sg = SecurityGroup(self, "web_sg",
            name=f"web-sg-{self.region}",
            description="Security group for web tier",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"web-sg-{self.region}"}
        )
        
        # Allow HTTPS from specific IPs only
        for i, ip in enumerate(allowed_ips):
            SecurityGroupRule(self, f"web_sg_https_rule_{i}",
                type="ingress",
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=[ip],
                security_group_id=self.web_sg.id,
                description=f"HTTPS access from {ip}"
            )
        
        # Allow HTTP from specific IPs only
        for i, ip in enumerate(allowed_ips):
            SecurityGroupRule(self, f"web_sg_http_rule_{i}",
                type="ingress",
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=[ip],
                security_group_id=self.web_sg.id,
                description=f"HTTP access from {ip}"
            )
        
        # Allow all outbound traffic
        SecurityGroupRule(self, "web_sg_egress_rule",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.web_sg.id,
            description="All outbound traffic"
        )
        
        # Application tier security group
        self.app_sg = SecurityGroup(self, "app_sg",
            name=f"app-sg-{self.region}",
            description="Security group for application tier",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"app-sg-{self.region}"}
        )
        
        # Allow traffic from web tier only
        SecurityGroupRule(self, "app_sg_ingress_rule",
            type="ingress",
            from_port=8080,
            to_port=8080,
            protocol="tcp",
            source_security_group_id=self.web_sg.id,
            security_group_id=self.app_sg.id,
            description="Application port from web tier"
        )
        
        # Allow all outbound traffic
        SecurityGroupRule(self, "app_sg_egress_rule",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.app_sg.id,
            description="All outbound traffic"
        )
        
        # Database tier security group
        self.db_sg = SecurityGroup(self, "db_sg",
            name=f"db-sg-{self.region}",
            description="Security group for database tier",
            vpc_id=self.vpc.id,
            tags={**self.common_tags, "Name": f"db-sg-{self.region}"}
        )
        
        # Allow database traffic from application tier only
        SecurityGroupRule(self, "db_sg_ingress_rule",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=self.app_sg.id,
            security_group_id=self.db_sg.id,
            description="PostgreSQL from application tier"
        )
        
        # Allow all outbound traffic
        SecurityGroupRule(self, "db_sg_egress_rule",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=self.db_sg.id,
            description="All outbound traffic"
        )

    def create_cloudtrail(self):
        """Create CloudTrail for logging all resource changes"""
        self.cloudtrail = Cloudtrail(self, "main_cloudtrail",
            name=f"secure-infrastructure-trail-{self.region}",
            s3_bucket_name=self.cloudtrail_bucket.bucket,
            include_global_service_events=True,
            is_multi_region_trail=True,
            enable_logging=True,
            kms_key_id=self.kms_key.arn,
            event_selector=[{
                "read_write_type": "All",
                "include_management_events": True,
                "data_resource": [{
                    "type": "AWS::S3::Object",
                    "values": ["arn:aws:s3:::*/*"]
                }]
            }],
            tags=self.common_tags
        )

    def create_secrets(self):
        """Create secrets in AWS Secrets Manager"""
        
        # Database credentials secret
        self.db_secret = SecretsmanagerSecret(self, "db_credentials",
            name=f"secure-infrastructure/db-credentials-{self.region}",
            description="Database credentials for the application",
            kms_key_id=self.kms_key.key_id,
            tags=self.common_tags
        )
        
        # Example secret value (in production, this would be set externally)
        db_credentials = {
            "username": "app_user",
            "password": "generated_secure_password_123!",
            "host": f"db.{self.region}.internal",
            "port": 5432,
            "database": "app_db"
        }
        
        SecretsmanagerSecretVersion(self, "db_credentials_version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(db_credentials)
        )
        
        # API keys secret
        self.api_secret = SecretsmanagerSecret(self, "api_keys",
            name=f"secure-infrastructure/api-keys-{self.region}",
            description="API keys for external services",
            kms_key_id=self.kms_key.key_id,
            tags=self.common_tags
        )
        
        api_keys = {
            "payment_gateway_key": "pk_live_example_key_123456789",
            "email_service_key": "SG.example_key_abcdefghijklmnop",
            "monitoring_key": "mon_example_key_xyz789"
        }
        
        SecretsmanagerSecretVersion(self, "api_keys_version",
            secret_id=self.api_secret.id,
            secret_string=json.dumps(api_keys)
        )

    def create_outputs(self):
        """Create Terraform outputs"""
        TerraformOutput(self, "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )
        
        TerraformOutput(self, "public_subnet_id",
            value=self.public_subnet.id,
            description="Public subnet ID"
        )
        
        TerraformOutput(self, "private_subnet_id",
            value=self.private_subnet.id,
            description="Private subnet ID"
        )
        
        TerraformOutput(self, "web_security_group_id",
            value=self.web_sg.id,
            description="Web tier security group ID"
        )
        
        TerraformOutput(self, "app_security_group_id",
            value=self.app_sg.id,
            description="Application tier security group ID"
        )
        
        TerraformOutput(self, "db_security_group_id",
            value=self.db_sg.id,
            description="Database tier security group ID"
        )
        
        TerraformOutput(self, "kms_key_id",
            value=self.kms_key.key_id,
            description="KMS key ID for encryption"
        )
        
        TerraformOutput(self, "cloudtrail_arn",
            value=self.cloudtrail.arn,
            description="CloudTrail ARN"
        )
        
        TerraformOutput(self, "db_secret_arn",
            value=self.db_secret.arn,
            description="Database credentials secret ARN"
        )
        
        TerraformOutput(self, "api_secret_arn",
            value=self.api_secret.arn,
            description="API keys secret ARN"
        )

app = App()

# Create stacks for both regions
us_east_1_stack = SecureInfrastructureStack(app, "secure-infrastructure-us-east-1", "us-east-1")
us_west_2_stack = SecureInfrastructureStack(app, "secure-infrastructure-us-west-2", "us-west-2")

# Configure encrypted S3 backend for Terraform state
S3Backend(us_east_1_stack,
    bucket="your-terraform-state-bucket-us-east-1",  # Replace with your actual bucket
    key="secure-infrastructure/us-east-1/terraform.tfstate",
    region="us-east-1",
    encrypt=True,
    kms_key_id="alias/terraform-state-key",  # Replace with your KMS key
    dynamodb_table="terraform-state-lock"  # Replace with your DynamoDB table
)

S3Backend(us_west_2_stack,
    bucket="your-terraform-state-bucket-us-west-2",  # Replace with your actual bucket
    key="secure-infrastructure/us-west-2/terraform.tfstate",
    region="us-west-2",
    encrypt=True,
    kms_key_id="alias/terraform-state-key",  # Replace with your KMS key
    dynamodb_table="terraform-state-lock"  # Replace with your DynamoDB table
)

app.synth()