#!/usr/bin/env python3
"""
Secure AWS Infrastructure with CDKTF (Python)
Implements a production-ready baseline with strict security controls:
- S3 buckets with public access blocked and KMS encryption
- IAM roles with least privilege policies
- RDS with encryption at rest
- VPC Flow Logs with CloudWatch integration
- Security Groups with restricted ingress
"""

import os
from constructs import Construct
from cdktf import App, TerraformStack, TerraformOutput
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable
from cdktf_cdktf_provider_aws.route import Route
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup
from cdktf_cdktf_provider_aws.security_group_rule import SecurityGroupRule
from cdktf_cdktf_provider_aws.flow_log import FlowLog
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.s3_bucket import S3Bucket
from cdktf_cdktf_provider_aws.s3_bucket_public_access_block import S3BucketPublicAccessBlock
from cdktf_cdktf_provider_aws.s3_bucket_server_side_encryption_configuration import (
    S3BucketServerSideEncryptionConfiguration,
    S3BucketServerSideEncryptionConfigurationRule,
    S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault
)
from cdktf_cdktf_provider_aws.data_aws_kms_key import DataAwsKmsKey
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.db_instance import DbInstance
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
import json


class SecureAwsInfraStack(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # Configuration
        region = "us-east-1"
        allowed_cidrs = os.getenv("ALLOWED_CIDRS", "203.0.113.0/24").split(",")
        allowed_cidrs = [cidr.strip() for cidr in allowed_cidrs]

        # AWS Provider
        AwsProvider(self, "aws", region=region)

        # Get availability zones
        azs = DataAwsAvailabilityZones(self, "available", state="available")

        # KMS Keys (AWS Managed)
        s3_kms_key = DataAwsKmsKey(self, "s3_kms", key_id="alias/aws/s3")
        rds_kms_key = DataAwsKmsKey(self, "rds_kms", key_id="alias/aws/rds")

        # VPC
        vpc = Vpc(
            self, "main_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": "secure-vpc",
                "Environment": "Production"
            }
        )

        # Internet Gateway
        igw = InternetGateway(
            self, "main_igw",
            vpc_id=vpc.id,
            tags={
                "Name": "secure-igw",
                "Environment": "Production"
            }
        )

        # Public Subnets (2 AZs)
        public_subnets = []
        for i in range(2):
            subnet = Subnet(
                self, f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=f"${{{azs.names}[{i}]}}",
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"secure-public-subnet-{i+1}",
                    "Environment": "Production",
                    "Type": "Public"
                }
            )
            public_subnets.append(subnet)

        # Private Subnets (2 AZs)
        private_subnets = []
        for i in range(2):
            subnet = Subnet(
                self, f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=f"${{{azs.names}[{i}]}}",
                tags={
                    "Name": f"secure-private-subnet-{i+1}",
                    "Environment": "Production",
                    "Type": "Private"
                }
            )
            private_subnets.append(subnet)

        # Route Table for Public Subnets
        public_rt = RouteTable(
            self, "public_rt",
            vpc_id=vpc.id,
            tags={
                "Name": "secure-public-rt",
                "Environment": "Production"
            }
        )

        # Route to Internet Gateway
        Route(
            self, "public_internet_route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Associate public subnets with route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self, f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # CloudWatch Log Group for VPC Flow Logs
        flow_log_group = CloudwatchLogGroup(
            self, "vpc_flow_logs",
            name="/aws/vpc/flowlogs",
            retention_in_days=30,
            tags={
                "Environment": "Production"
            }
        )

        # IAM Role for VPC Flow Logs (Least Privilege)
        flow_log_role_trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "vpc-flow-logs.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        flow_log_role = IamRole(
            self, "vpc_flow_log_role",
            name="vpc-flow-logs-role",
            assume_role_policy=json.dumps(flow_log_role_trust_policy),
            tags={
                "Environment": "Production"
            }
        )

        # IAM Policy for Flow Logs (Least Privilege - only specific log group)
        flow_log_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"{flow_log_group.arn}:*"
                }
            ]
        }

        IamRolePolicy(
            self, "vpc_flow_log_policy",
            name="vpc-flow-logs-policy",
            role=flow_log_role.id,
            policy=json.dumps(flow_log_policy)
        )

        # VPC Flow Logs
        flow_log = FlowLog(
            self, "vpc_flow_log",
            iam_role_arn=flow_log_role.arn,
            log_destination=flow_log_group.arn,
            log_destination_type="cloud-watch-logs",
            resource_id=vpc.id,
            resource_type="VPC",
            traffic_type="ALL",
            tags={
                "Environment": "Production"
            }
        )

        # Security Group - Web/Application (Restricted Ingress)
        web_sg = SecurityGroup(
            self, "web_sg",
            name="secure-web-sg",
            description="Security group for web applications - restricted ingress",
            vpc_id=vpc.id,
            tags={
                "Name": "secure-web-sg",
                "Environment": "Production"
            }
        )

        # Security Group Rules - HTTP (80) from allowed CIDRs only
        for i, cidr in enumerate(allowed_cidrs):
            SecurityGroupRule(
                self, f"web_sg_http_{i}",
                type="ingress",
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=[cidr],
                security_group_id=web_sg.id,
                description=f"HTTP access from {cidr}"
            )

        # Security Group Rules - HTTPS (443) from allowed CIDRs only
        for i, cidr in enumerate(allowed_cidrs):
            SecurityGroupRule(
                self, f"web_sg_https_{i}",
                type="ingress",
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=[cidr],
                security_group_id=web_sg.id,
                description=f"HTTPS access from {cidr}"
            )

        # Security Group Rule - All Egress (default behavior)
        SecurityGroupRule(
            self, "web_sg_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=web_sg.id,
            description="All outbound traffic"
        )

        # S3 Bucket with Security Controls
        app_bucket = S3Bucket(
            self, "secure_app_bucket",
            bucket="secure-app-bucket-prod-${random_id.bucket_suffix.hex}",
            tags={
                "Name": "secure-app-bucket",
                "Environment": "Production"
            }
        )

        # Block all public access to S3 bucket
        S3BucketPublicAccessBlock(
            self, "app_bucket_pab",
            bucket=app_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # S3 Bucket Server-Side Encryption with KMS
        S3BucketServerSideEncryptionConfiguration(
            self, "app_bucket_encryption",
            bucket=app_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRule(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=s3_kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ]
        )

        # IAM Role for Application (Least Privilege Example)
        app_role_trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        app_role = IamRole(
            self, "app_role",
            name="secure-app-role",
            assume_role_policy=json.dumps(app_role_trust_policy),
            tags={
                "Environment": "Production"
            }
        )

        # IAM Policy for Application (Least Privilege - specific bucket path and log group)
        app_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject"
                    ],
                    "Resource": f"{app_bucket.arn}/app-data/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"{flow_log_group.arn}:*"
                }
            ]
        }

        IamRolePolicy(
            self, "app_policy",
            name="secure-app-policy",
            role=app_role.id,
            policy=json.dumps(app_policy)
        )

        # DB Subnet Group for RDS
        db_subnet_group = DbSubnetGroup(
            self, "db_subnet_group",
            name="secure-db-subnet-group",
            subnet_ids=[subnet.id for subnet in private_subnets],
            tags={
                "Name": "secure-db-subnet-group",
                "Environment": "Production"
            }
        )

        # Security Group for RDS
        db_sg = SecurityGroup(
            self, "db_sg",
            name="secure-db-sg",
            description="Security group for RDS database",
            vpc_id=vpc.id,
            tags={
                "Name": "secure-db-sg",
                "Environment": "Production"
            }
        )

        # Allow PostgreSQL access only from web security group
        SecurityGroupRule(
            self, "db_sg_postgres",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=web_sg.id,
            security_group_id=db_sg.id,
            description="PostgreSQL access from web tier"
        )

        # RDS Instance with Encryption
        db_instance = DbInstance(
            self, "secure_db",
            identifier="secure-postgres-db",
            engine="postgres",
            engine_version="15.4",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp2",
            storage_encrypted=True,
            kms_key_id=rds_kms_key.arn,
            db_name="securedb",
            username="dbadmin",
            password="ChangeMe123!",  # In production, use AWS Secrets Manager
            vpc_security_group_ids=[db_sg.id],
            db_subnet_group_name=db_subnet_group.name,
            publicly_accessible=False,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            skip_final_snapshot=True,  # For demo purposes
            tags={
                "Name": "secure-postgres-db",
                "Environment": "Production"
            }
        )

        # Outputs for verification
        TerraformOutput(
            self, "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self, "flow_log_id",
            value=flow_log.id,
            description="VPC Flow Log ID"
        )

        TerraformOutput(
            self, "s3_bucket_name",
            value=app_bucket.bucket,
            description="Secure S3 bucket name"
        )

        TerraformOutput(
            self, "rds_endpoint",
            value=db_instance.endpoint,
            description="RDS instance endpoint"
        )

        TerraformOutput(
            self, "web_security_group_id",
            value=web_sg.id,
            description="Web security group ID"
        )


# Add random ID for bucket naming
from cdktf_cdktf_provider_random.id import Id as RandomId
from cdktf_cdktf_provider_random.provider import RandomProvider

class SecureAwsInfraStackWithRandom(TerraformStack):
    def __init__(self, scope: Construct, id: str):
        super().__init__(scope, id)

        # Random provider for unique bucket naming
        RandomProvider(self, "random")
        
        bucket_suffix = RandomId(
            self, "bucket_suffix",
            byte_length=4
        )

        # Configuration
        region = "us-east-1"
        allowed_cidrs = os.getenv("ALLOWED_CIDRS", "203.0.113.0/24").split(",")
        allowed_cidrs = [cidr.strip() for cidr in allowed_cidrs]

        # AWS Provider
        AwsProvider(self, "aws", region=region)

        # Get availability zones
        azs = DataAwsAvailabilityZones(self, "available", state="available")

        # KMS Keys (AWS Managed)
        s3_kms_key = DataAwsKmsKey(self, "s3_kms", key_id="alias/aws/s3")
        rds_kms_key = DataAwsKmsKey(self, "rds_kms", key_id="alias/aws/rds")

        # VPC
        vpc = Vpc(
            self, "main_vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": "secure-vpc",
                "Environment": "Production"
            }
        )

        # Internet Gateway
        igw = InternetGateway(
            self, "main_igw",
            vpc_id=vpc.id,
            tags={
                "Name": "secure-igw",
                "Environment": "Production"
            }
        )

        # Public Subnets (2 AZs)
        public_subnets = []
        for i in range(2):
            subnet = Subnet(
                self, f"public_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=f"${{{azs.names}[{i}]}}",
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"secure-public-subnet-{i+1}",
                    "Environment": "Production",
                    "Type": "Public"
                }
            )
            public_subnets.append(subnet)

        # Private Subnets (2 AZs)
        private_subnets = []
        for i in range(2):
            subnet = Subnet(
                self, f"private_subnet_{i}",
                vpc_id=vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=f"${{{azs.names}[{i}]}}",
                tags={
                    "Name": f"secure-private-subnet-{i+1}",
                    "Environment": "Production",
                    "Type": "Private"
                }
            )
            private_subnets.append(subnet)

        # Route Table for Public Subnets
        public_rt = RouteTable(
            self, "public_rt",
            vpc_id=vpc.id,
            tags={
                "Name": "secure-public-rt",
                "Environment": "Production"
            }
        )

        # Route to Internet Gateway
        Route(
            self, "public_internet_route",
            route_table_id=public_rt.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id
        )

        # Associate public subnets with route table
        for i, subnet in enumerate(public_subnets):
            RouteTableAssociation(
                self, f"public_rt_assoc_{i}",
                subnet_id=subnet.id,
                route_table_id=public_rt.id
            )

        # CloudWatch Log Group for VPC Flow Logs
        flow_log_group = CloudwatchLogGroup(
            self, "vpc_flow_logs",
            name="/aws/vpc/flowlogs",
            retention_in_days=30,
            tags={
                "Environment": "Production"
            }
        )

        # IAM Role for VPC Flow Logs (Least Privilege)
        flow_log_role_trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "vpc-flow-logs.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        flow_log_role = IamRole(
            self, "vpc_flow_log_role",
            name="vpc-flow-logs-role",
            assume_role_policy=json.dumps(flow_log_role_trust_policy),
            tags={
                "Environment": "Production"
            }
        )

        # IAM Policy for Flow Logs (Least Privilege - only specific log group)
        flow_log_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"{flow_log_group.arn}:*"
                }
            ]
        }

        IamRolePolicy(
            self, "vpc_flow_log_policy",
            name="vpc-flow-logs-policy",
            role=flow_log_role.id,
            policy=json.dumps(flow_log_policy)
        )

        # VPC Flow Logs
        flow_log = FlowLog(
            self, "vpc_flow_log",
            iam_role_arn=flow_log_role.arn,
            log_destination=flow_log_group.arn,
            log_destination_type="cloud-watch-logs",
            resource_id=vpc.id,
            resource_type="VPC",
            traffic_type="ALL",
            tags={
                "Environment": "Production"
            }
        )

        # Security Group - Web/Application (Restricted Ingress)
        web_sg = SecurityGroup(
            self, "web_sg",
            name="secure-web-sg",
            description="Security group for web applications - restricted ingress",
            vpc_id=vpc.id,
            tags={
                "Name": "secure-web-sg",
                "Environment": "Production"
            }
        )

        # Security Group Rules - HTTP (80) from allowed CIDRs only
        for i, cidr in enumerate(allowed_cidrs):
            SecurityGroupRule(
                self, f"web_sg_http_{i}",
                type="ingress",
                from_port=80,
                to_port=80,
                protocol="tcp",
                cidr_blocks=[cidr],
                security_group_id=web_sg.id,
                description=f"HTTP access from {cidr}"
            )

        # Security Group Rules - HTTPS (443) from allowed CIDRs only
        for i, cidr in enumerate(allowed_cidrs):
            SecurityGroupRule(
                self, f"web_sg_https_{i}",
                type="ingress",
                from_port=443,
                to_port=443,
                protocol="tcp",
                cidr_blocks=[cidr],
                security_group_id=web_sg.id,
                description=f"HTTPS access from {cidr}"
            )

        # Security Group Rule - All Egress (default behavior)
        SecurityGroupRule(
            self, "web_sg_egress",
            type="egress",
            from_port=0,
            to_port=0,
            protocol="-1",
            cidr_blocks=["0.0.0.0/0"],
            security_group_id=web_sg.id,
            description="All outbound traffic"
        )

        # S3 Bucket with Security Controls
        app_bucket = S3Bucket(
            self, "secure_app_bucket",
            bucket=f"secure-app-bucket-prod-{bucket_suffix.hex}",
            tags={
                "Name": "secure-app-bucket",
                "Environment": "Production"
            }
        )

        # Block all public access to S3 bucket
        S3BucketPublicAccessBlock(
            self, "app_bucket_pab",
            bucket=app_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True
        )

        # S3 Bucket Server-Side Encryption with KMS
        S3BucketServerSideEncryptionConfiguration(
            self, "app_bucket_encryption",
            bucket=app_bucket.id,
            rule=[
                S3BucketServerSideEncryptionConfigurationRule(
                    apply_server_side_encryption_by_default=S3BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefault(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=s3_kms_key.arn
                    ),
                    bucket_key_enabled=True
                )
            ]
        )

        # IAM Role for Application (Least Privilege Example)
        app_role_trust_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ec2.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }
            ]
        }

        app_role = IamRole(
            self, "app_role",
            name="secure-app-role",
            assume_role_policy=json.dumps(app_role_trust_policy),
            tags={
                "Environment": "Production"
            }
        )

        # IAM Policy for Application (Least Privilege - specific bucket path and log group)
        app_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject"
                    ],
                    "Resource": f"{app_bucket.arn}/app-data/*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"{flow_log_group.arn}:*"
                }
            ]
        }

        IamRolePolicy(
            self, "app_policy",
            name="secure-app-policy",
            role=app_role.id,
            policy=json.dumps(app_policy)
        )

        # DB Subnet Group for RDS
        db_subnet_group = DbSubnetGroup(
            self, "db_subnet_group",
            name="secure-db-subnet-group",
            subnet_ids=[subnet.id for subnet in private_subnets],
            tags={
                "Name": "secure-db-subnet-group",
                "Environment": "Production"
            }
        )

        # Security Group for RDS
        db_sg = SecurityGroup(
            self, "db_sg",
            name="secure-db-sg",
            description="Security group for RDS database",
            vpc_id=vpc.id,
            tags={
                "Name": "secure-db-sg",
                "Environment": "Production"
            }
        )

        # Allow PostgreSQL access only from web security group
        SecurityGroupRule(
            self, "db_sg_postgres",
            type="ingress",
            from_port=5432,
            to_port=5432,
            protocol="tcp",
            source_security_group_id=web_sg.id,
            security_group_id=db_sg.id,
            description="PostgreSQL access from web tier"
        )

        # RDS Instance with Encryption
        db_instance = DbInstance(
            self, "secure_db",
            identifier="secure-postgres-db",
            engine="postgres",
            engine_version="15.4",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp2",
            storage_encrypted=True,
            kms_key_id=rds_kms_key.arn,
            db_name="securedb",
            username="dbadmin",
            password="ChangeMe123!",  # In production, use AWS Secrets Manager
            vpc_security_group_ids=[db_sg.id],
            db_subnet_group_name=db_subnet_group.name,
            publicly_accessible=False,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            skip_final_snapshot=True,  # For demo purposes
            tags={
                "Name": "secure-postgres-db",
                "Environment": "Production"
            }
        )

        # Outputs for verification
        TerraformOutput(
            self, "vpc_id",
            value=vpc.id,
            description="VPC ID"
        )

        TerraformOutput(
            self, "flow_log_id",
            value=flow_log.id,
            description="VPC Flow Log ID"
        )

        TerraformOutput(
            self, "s3_bucket_name",
            value=app_bucket.bucket,
            description="Secure S3 bucket name"
        )

        TerraformOutput(
            self, "rds_endpoint",
            value=db_instance.endpoint,
            description="RDS instance endpoint"
        )

        TerraformOutput(
            self, "web_security_group_id",
            value=web_sg.id,
            description="Web security group ID"
        )


app = App()
SecureAwsInfraStackWithRandom(app, "secure-aws-infra")
app.synth()