#!/usr/bin/env python3
"""
TAP Stack Infrastructure Implementation using Pulumi and AWS.

This module implements a comprehensive, secure, and resilient cloud environment
following enterprise-grade security protocols, high availability configurations,
and automated backup strategies.
"""

import base64
import json
import os
import random
import re
import string
import uuid
from typing import Optional

import pulumi
import pulumi_aws as aws
from pulumi import ComponentResource, ResourceOptions


class TapStackArgs:
    """Arguments for the TapStack component."""
    
    def __init__(self, environment_suffix: str = "dev"):
        self.environment_suffix = environment_suffix


class TapStack(ComponentResource):
    """
    Main TAP Stack component that creates a comprehensive AWS infrastructure
    with security, scalability, and monitoring capabilities.
    """
    
    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        super().__init__("tap:infrastructure:TapStack", name, {}, opts)
        
        self.environment_suffix = args.environment_suffix
        self.name_prefix = f"tap-{self.environment_suffix}"
        
        # Generate a unique suffix for ASG to avoid conflicts
        self.unique_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=6))
        
        # Initialize all infrastructure components
        self._create_kms_key()
        self._create_vpc_and_networking()
        self._create_security_groups()
        self._create_iam_roles()
        self._create_s3_buckets()
        self._create_rds_instance()
        self._create_secrets_manager()
        self._create_launch_template()
        self._create_auto_scaling_group()
        self._create_application_load_balancer()
        self._create_waf()
        self._create_fargate_cluster()
        self._create_fargate_service()
        self._create_cloudwatch_alarms()
        self._create_backup_vault()
        self._create_codepipeline()
        
        # Register outputs
        self.register_outputs({
            "vpc_id": self.vpc.id,
            "load_balancer_dns": self.alb.dns_name,
            "rds_endpoint": self.rds_instance.endpoint,
            "fargate_cluster_name": self.ecs_cluster.name,
        })
    
    def _create_kms_key(self):
        """Create KMS key for encryption at rest."""
        current_region = pulumi.Config("aws").get("region") or os.environ.get("AWS_REGION", "us-east-1")
        current = aws.get_caller_identity()
        
        self.kms_key = aws.kms.Key(
            f"{self.name_prefix}-kms-key",
            description=f"KMS key for {self.name_prefix} encryption",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Allow CloudWatch Logs to use the key",
                        "Effect": "Allow",
                        "Principal": {"Service": f"logs.{current_region}.amazonaws.com"},
                        "Action": [
                            "kms:GenerateDataKey*",
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEquals": {
                                "kms:EncryptionContext:aws:logs:arn": (
                                    f"arn:aws:logs:{current_region}:{current.account_id}:*"
                                )
                            },
                            "StringLike": {
                                "kms:CallerAccount": current.account_id,
                                "kms:ViaService": f"logs.{current_region}.amazonaws.com"
                            }
                        }
                    },
                    {
                        "Sid": "Allow Administration of the key",
                        "Effect": "Allow",
                        "Principal": {"AWS": f"arn:aws:iam::{current.account_id}:root"},
                        "Action": "kms:*",
                        "Resource": "*"
                    }
                ]
            }),
            tags={
                "Name": f"{self.name_prefix}-kms-key",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # FIXED: Unique alias name
        self.kms_alias = aws.kms.Alias(
            f"{self.name_prefix}-kms-alias",
            name=f"alias/{self.name_prefix}-key-{self.unique_suffix}",
            target_key_id=self.kms_key.key_id,
            opts=ResourceOptions(parent=self)
        )


    
    def _create_vpc_and_networking(self):
        """Create VPC with isolated subnets for database instances."""
        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"{self.name_prefix}-vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                "Name": f"{self.name_prefix}-vpc",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"{self.name_prefix}-igw",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.name_prefix}-igw",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Get availability zones
        azs = aws.get_availability_zones(state="available")
        
        # Create public subnets
        self.public_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{self.name_prefix}-public-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+1}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    "Name": f"{self.name_prefix}-public-subnet-{i+1}",
                    "Environment": self.environment_suffix,
                    "Type": "Public",
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)
        
        # Create private subnets for applications
        self.private_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{self.name_prefix}-private-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"{self.name_prefix}-private-subnet-{i+1}",
                    "Environment": self.environment_suffix,
                    "Type": "Private",
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)
        
        # Create isolated subnets for database
        self.db_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"{self.name_prefix}-db-subnet-{i+1}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+20}.0/24",
                availability_zone=az,
                tags={
                    "Name": f"{self.name_prefix}-db-subnet-{i+1}",
                    "Environment": self.environment_suffix,
                    "Type": "Database",
                },
                opts=ResourceOptions(parent=self)
            )
            self.db_subnets.append(subnet)
        
        # Create NAT Gateways
        self.nat_gateways = []
        for i, subnet in enumerate(self.public_subnets):
            eip = aws.ec2.Eip(
                f"{self.name_prefix}-nat-eip-{i+1}",
                domain="vpc",
                tags={
                    "Name": f"{self.name_prefix}-nat-eip-{i+1}",
                    "Environment": self.environment_suffix,
                },
                opts=ResourceOptions(parent=self)
            )
            
            nat = aws.ec2.NatGateway(
                f"{self.name_prefix}-nat-gateway-{i+1}",
                allocation_id=eip.id,
                subnet_id=subnet.id,
                tags={
                    "Name": f"{self.name_prefix}-nat-gateway-{i+1}",
                    "Environment": self.environment_suffix,
                },
                opts=ResourceOptions(parent=self)
            )
            self.nat_gateways.append(nat)
        
        # Create route tables
        self._create_route_tables()
    
    def _create_route_tables(self):
        """Create and configure route tables."""
        # Public route table
        self.public_rt = aws.ec2.RouteTable(
            f"{self.name_prefix}-public-rt",
            vpc_id=self.vpc.id,
            routes=[{
                "cidr_block": "0.0.0.0/0",
                "gateway_id": self.igw.id,
            }],
            tags={
                "Name": f"{self.name_prefix}-public-rt",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.name_prefix}-public-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id,
                opts=ResourceOptions(parent=self)
            )
        
        # Private route tables
        self.private_rts = []
        for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            rt = aws.ec2.RouteTable(
                f"{self.name_prefix}-private-rt-{i+1}",
                vpc_id=self.vpc.id,
                routes=[{
                    "cidr_block": "0.0.0.0/0",
                    "nat_gateway_id": nat.id,
                }],
                tags={
                    "Name": f"{self.name_prefix}-private-rt-{i+1}",
                    "Environment": self.environment_suffix,
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_rts.append(rt)
            
            aws.ec2.RouteTableAssociation(
                f"{self.name_prefix}-private-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=rt.id,
                opts=ResourceOptions(parent=self)
            )
        
        # Database route table (no internet access)
        self.db_rt = aws.ec2.RouteTable(
            f"{self.name_prefix}-db-rt",
            vpc_id=self.vpc.id,
            tags={
                "Name": f"{self.name_prefix}-db-rt",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        for i, subnet in enumerate(self.db_subnets):
            aws.ec2.RouteTableAssociation(
                f"{self.name_prefix}-db-rta-{i+1}",
                subnet_id=subnet.id,
                route_table_id=self.db_rt.id,
                opts=ResourceOptions(parent=self)
            )
    
    def _create_security_groups(self):
        """Create security groups with restricted access."""
        # ALB Security Group
        self.alb_sg = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-alb-sg",
            description="Security group for Application Load Balancer",
            vpc_id=self.vpc.id,
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 80,
                    "to_port": 80,
                    "cidr_blocks": ["0.0.0.0/0"],
                },
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "cidr_blocks": ["0.0.0.0/0"],
                },
            ],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
            }],
            tags={
                "Name": f"{self.name_prefix}-alb-sg",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # EC2 Security Group
        self.ec2_sg = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-ec2-sg",
            description="Security group for EC2 instances",
            vpc_id=self.vpc.id,
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 22,
                    "to_port": 22,
                    "cidr_blocks": ["10.0.0.0/16"],  # Restricted SSH access to VPC CIDR
                },
                {
                    "protocol": "tcp",
                    "from_port": 80,
                    "to_port": 80,
                    "security_groups": [self.alb_sg.id],
                },
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "security_groups": [self.alb_sg.id],
                },
            ],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
            }],
            tags={
                "Name": f"{self.name_prefix}-ec2-sg",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # RDS Security Group
        self.rds_sg = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-rds-sg",
            description="Security group for RDS instances",
            vpc_id=self.vpc.id,
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 3306,
                    "to_port": 3306,
                    "security_groups": [self.ec2_sg.id],
                },
            ],
            tags={
                "Name": f"{self.name_prefix}-rds-sg",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Fargate Security Group
        self.fargate_sg = aws.ec2.SecurityGroup(
            f"{self.name_prefix}-fargate-sg",
            description="Security group for Fargate tasks",
            vpc_id=self.vpc.id,
            ingress=[
                {
                    "protocol": "tcp",
                    "from_port": 80,
                    "to_port": 80,
                    "security_groups": [self.alb_sg.id],
                },
                {
                    "protocol": "tcp",
                    "from_port": 443,
                    "to_port": 443,
                    "security_groups": [self.alb_sg.id],
                },
            ],
            egress=[{
                "protocol": "-1",
                "from_port": 0,
                "to_port": 0,
                "cidr_blocks": ["0.0.0.0/0"],
            }],
            tags={
                "Name": f"{self.name_prefix}-fargate-sg",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
    
    def _create_iam_roles(self):
        """Create IAM roles with least privilege principle."""
        # EC2 Instance Role
        self.ec2_role = aws.iam.Role(
            f"{self.name_prefix}-ec2-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ec2.amazonaws.com"},
                }],
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/CloudWatchAgentServerPolicy"
            ],
            tags={
                "Name": f"{self.name_prefix}-ec2-role",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # EC2 Instance Profile
        self.ec2_instance_profile = aws.iam.InstanceProfile(
            f"{self.name_prefix}-ec2-profile",
            role=self.ec2_role.name,
            opts=ResourceOptions(parent=self)
        )
        
        # Fargate Task Execution Role
        self.fargate_execution_role = aws.iam.Role(
            f"{self.name_prefix}-fargate-execution-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                }],
            }),
            managed_policy_arns=[
                "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
            ],
            tags={
                "Name": f"{self.name_prefix}-fargate-execution-role",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Fargate Task Role
        self.fargate_task_role = aws.iam.Role(
            f"{self.name_prefix}-fargate-task-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                }],
            }),
            tags={
                "Name": f"{self.name_prefix}-fargate-task-role",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # CodePipeline Service Role with no managed policies
        self.codepipeline_role = aws.iam.Role(
            f"{self.name_prefix}-codepipeline-role",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {"Service": "codepipeline.amazonaws.com"},
                }],
            }),
            tags={
                "Name": f"{self.name_prefix}-codepipeline-role",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Create custom policy for CodePipeline with all necessary permissions
        self.codepipeline_policy = aws.iam.RolePolicy(
            f"{self.name_prefix}-codepipeline-policy",
            role=self.codepipeline_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetBucketVersioning",
                            "s3:GetObject",
                            "s3:GetObjectVersion",
                            "s3:PutObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            "arn:aws:s3:::*",
                            "arn:aws:s3:::*/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "codebuild:BatchGetBuilds",
                            "codebuild:StartBuild"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "ecs:DescribeServices",
                            "ecs:DescribeTaskDefinition",
                            "ecs:DescribeTasks",
                            "ecs:ListTasks",
                            "ecs:RegisterTaskDefinition",
                            "ecs:UpdateService"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "iam:PassRole"
                        ],
                        "Resource": "*",
                        "Condition": {
                            "StringEqualsIfExists": {
                                "iam:PassedToService": [
                                    "ecs-tasks.amazonaws.com"
                                ]
                            }
                        }
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "arn:aws:logs:*:*:*"
                    }
                ]
            }),
            opts=ResourceOptions(parent=self)
        )
    
    def _create_s3_buckets(self):
        """Create S3 buckets with encryption and versioning."""
        # Get stack name and make it lowercase and remove invalid characters
        stack_name = pulumi.get_stack().lower()
        # Remove any invalid characters and replace with hyphens
        stack_name = re.sub(r'[^a-z0-9-]', '-', stack_name)
        # Remove consecutive hyphens
        stack_name = re.sub(r'-+', '-', stack_name)
        # Remove leading/trailing hyphens
        stack_name = stack_name.strip('-')
        
        # Add a random suffix to ensure uniqueness
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        
        # Application Bucket
        self.app_bucket = aws.s3.Bucket(
            f"{self.name_prefix}-app-bucket",
            bucket=f"{self.name_prefix}-app-{stack_name}-{random_suffix}".lower(),
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
                            sse_algorithm="aws:kms",
                            kms_master_key_id=self.kms_key.arn,
                        )
                    ),
                    bucket_key_enabled=True,
                )
            ),
            tags={
                "Name": f"{self.name_prefix}-app-bucket",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Public Access Block for Application Bucket
        self.app_bucket_pab = aws.s3.BucketPublicAccessBlock(
            f"{self.name_prefix}-app-bucket-pab",
            bucket=self.app_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )
        
        # Backup Bucket
        self.backup_bucket = aws.s3.Bucket(
            f"{self.name_prefix}-backup-bucket",
            bucket=f"{self.name_prefix}-backup-{stack_name}-{random_suffix}".lower(),
            versioning=aws.s3.BucketVersioningArgs(enabled=True),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
                            sse_algorithm="aws:kms",
                            kms_master_key_id=self.kms_key.arn,
                        )
                    ),
                    bucket_key_enabled=True,
                )
            ),
            tags={
                "Name": f"{self.name_prefix}-backup-bucket",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Public Access Block for Backup Bucket
        self.backup_bucket_pab = aws.s3.BucketPublicAccessBlock(
            f"{self.name_prefix}-backup-bucket-pab",
            bucket=self.backup_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )
    
    def _create_rds_instance(self):
        """Create RDS instance with Multi-AZ deployment."""
        # DB Subnet Group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"{self.name_prefix}-db-subnet-group",
            subnet_ids=[subnet.id for subnet in self.db_subnets],
            tags={
                "Name": f"{self.name_prefix}-db-subnet-group",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # FIXED: RDS Instance with unique identifier
        self.rds_instance = aws.rds.Instance(
            f"{self.name_prefix}-db",
            identifier=f"{self.name_prefix}-db-{self.unique_suffix}",  # Add unique suffix
            engine="mysql",
            engine_version="8.0",
            instance_class="db.t3.micro",
            allocated_storage=20,
            max_allocated_storage=100,
            storage_type="gp2",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name="tapdb",
            username="admin",
            password="changeme123!",  # In production, use Secrets Manager
            vpc_security_group_ids=[self.rds_sg.id],
            db_subnet_group_name=self.db_subnet_group.name,
            multi_az=True,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="sun:04:00-sun:05:00",
            skip_final_snapshot=True,
            deletion_protection=False,
            tags={
                "Name": f"{self.name_prefix}-db",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

    
    def _create_secrets_manager(self):
        """Create secrets in AWS Secrets Manager."""
        # FIXED: Unique secret name
        self.db_secret = aws.secretsmanager.Secret(
            f"{self.name_prefix}-db-secret",
            name=f"{self.name_prefix}/database/credentials-{self.unique_suffix}",
            description="Database credentials for TAP application",
            kms_key_id=self.kms_key.arn,
            tags={
                "Name": f"{self.name_prefix}-db-secret",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        def create_secret_string(endpoint):
            return json.dumps({
                "username": "admin",
                "password": "changeme123!",
                "engine": "mysql",
                "host": endpoint,
                "port": 3306,
                "dbname": "tapdb"
            })
        
        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"{self.name_prefix}-db-secret-version",
            secret_id=self.db_secret.id,
            secret_string=self.rds_instance.endpoint.apply(create_secret_string),
            opts=ResourceOptions(parent=self)
        )

    
    def _create_launch_template(self):
        """Create launch template for Auto Scaling Group with proper network config and user data."""

        # Get latest Amazon Linux 2 AMI
        ami = aws.ec2.get_ami(
            most_recent=True,
            owners=["amazon"],
            filters=[
                {"name": "name", "values": ["amzn2-ami-hvm-*"]},
                {"name": "architecture", "values": ["x86_64"]},
            ],
        )

        # User data script (ensure this never fails fatally)
        user_data_script = """#!/bin/bash
    set -ex
    exec > >(tee /var/log/user-data.log|logger -t user-data -s 2>/dev/console) 2>&1
    yum update -y
    yum install -y amazon-cloudwatch-agent httpd docker
    systemctl start httpd
    systemctl enable httpd
    systemctl start docker
    systemctl enable docker
    echo '<h1>Instance launched successfully</h1>' > /var/www/html/index.html
    echo "User data script completed."
    """

        user_data_b64 = base64.b64encode(user_data_script.encode('utf-8')).decode('utf-8')

        self.launch_template = aws.ec2.LaunchTemplate(
            f"{self.name_prefix}-launch-template",
            name_prefix=f"{self.name_prefix}-lt-",
            image_id=ami.id,
            instance_type="t3.micro",
            user_data=user_data_b64,
            # REMOVED: vpc_security_group_ids=[self.ec2_sg.id], - this conflicts with network_interfaces
            monitoring={"enabled": True},
            iam_instance_profile={
                "name": self.ec2_instance_profile.name
            },
            # Security groups are specified here in network_interfaces
            network_interfaces=[{
                "associatePublicIpAddress": True,
                "deviceIndex": 0,
                "securityGroups": [self.ec2_sg.id],
            }],
            tag_specifications=[{
                "resourceType": "instance",
                "tags": {
                    "Name": f"{self.name_prefix}-ec2-instance",
                    "Environment": self.environment_suffix,
                }
            }],
            opts=ResourceOptions(parent=self),
        )



    
    def _create_auto_scaling_group(self):
        """Create Auto Scaling Group for high availability."""
        # Use unique name with suffix to avoid conflicts
        asg_name = f"{self.name_prefix}-asg-{self.unique_suffix}"
        
        self.asg = aws.autoscaling.Group(
            f"{self.name_prefix}-asg",
            name=asg_name,
            vpc_zone_identifiers=[subnet.id for subnet in self.private_subnets],
            health_check_type="EC2",  # Use EC2 health checks instead of ELB initially
            health_check_grace_period=600,  # Increased grace period to allow startup time
            min_size=1,  # Reduced to 1 for faster deployment
            max_size=6,
            desired_capacity=1,  # Reduced to 1 for faster deployment
            launch_template=aws.autoscaling.GroupLaunchTemplateArgs(
                id=self.launch_template.id,
                version="$Latest",
            ),
            enabled_metrics=[
                "GroupMinSize",
                "GroupMaxSize",
                "GroupDesiredCapacity",
                "GroupInServiceInstances",
                "GroupTotalInstances",
            ],
            wait_for_capacity_timeout="15m",  # Increased timeout
            tags=[
                aws.autoscaling.GroupTagArgs(
                    key="Name",
                    value=f"{self.name_prefix}-asg-instance",
                    propagate_at_launch=True,
                ),
                aws.autoscaling.GroupTagArgs(
                    key="Environment",
                    value=self.environment_suffix,
                    propagate_at_launch=True,
                ),
                aws.autoscaling.GroupTagArgs(
                    key="UniqueId",
                    value=self.unique_suffix,
                    propagate_at_launch=True,
                ),
            ],
            opts=ResourceOptions(parent=self)
        )
    
    def _create_application_load_balancer(self):
        """Create Application Load Balancer."""
        # FIXED: Target Group with unique suffix
        self.target_group = aws.lb.TargetGroup(
            f"{self.name_prefix}-tg",
            name=f"{self.name_prefix}-tg-{self.unique_suffix}",  # Add unique suffix
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/",  # Changed to root path since we're serving a simple page
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=2,
            ),
            tags={
                "Name": f"{self.name_prefix}-tg",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Application Load Balancer (also add unique suffix for safety)
        self.alb = aws.lb.LoadBalancer(
            f"{self.name_prefix}-alb",
            name=f"{self.name_prefix}-alb-{self.unique_suffix}",  # Add unique suffix
            load_balancer_type="application",
            subnets=[subnet.id for subnet in self.public_subnets],
            security_groups=[self.alb_sg.id],
            enable_deletion_protection=False,
            tags={
                "Name": f"{self.name_prefix}-alb",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # ALB Listener
        self.alb_listener = aws.lb.Listener(
            f"{self.name_prefix}-alb-listener",
            load_balancer_arn=self.alb.arn,
            port=80,
            protocol="HTTP",
            default_actions=[aws.lb.ListenerDefaultActionArgs(
                type="forward",
                target_group_arn=self.target_group.arn,
            )],
            opts=ResourceOptions(parent=self)
        )
        
        # Update ASG with target group (attach after ALB is created)
        self.asg_attachment = aws.autoscaling.Attachment(
            f"{self.name_prefix}-asg-attachment",
            autoscaling_group_name=self.asg.id,
            lb_target_group_arn=self.target_group.arn,
            opts=ResourceOptions(parent=self, depends_on=[self.asg, self.target_group])
        )

    
    def _create_waf(self):
        """Create WAF to protect against OWASP top 10 threats, with unique name to avoid collision."""
        # Create a unique WAF name by adding the unique suffix
        unique_waf_name = f"{self.name_prefix}-waf-{self.unique_suffix}"

        # WAF Web ACL
        self.waf_web_acl = aws.wafv2.WebAcl(
            f"{self.name_prefix}-waf",
            name=unique_waf_name,  # Use unique name here!
            scope="REGIONAL",
            default_action=aws.wafv2.WebAclDefaultActionArgs(allow={}),
            rules=[
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesCommonRuleSet",
                    priority=1,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesCommonRuleSet",
                            vendor_name="AWS",
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesCommonRuleSetMetric",
                        sampled_requests_enabled=True,
                    ),
                ),
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesKnownBadInputsRuleSet",
                    priority=2,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesKnownBadInputsRuleSet",
                            vendor_name="AWS",
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesKnownBadInputsRuleSetMetric",
                        sampled_requests_enabled=True,
                    ),
                ),
                aws.wafv2.WebAclRuleArgs(
                    name="AWSManagedRulesSQLiRuleSet",
                    priority=3,
                    override_action=aws.wafv2.WebAclRuleOverrideActionArgs(none={}),
                    statement=aws.wafv2.WebAclRuleStatementArgs(
                        managed_rule_group_statement=aws.wafv2.WebAclRuleStatementManagedRuleGroupStatementArgs(
                            name="AWSManagedRulesSQLiRuleSet",
                            vendor_name="AWS",
                        )
                    ),
                    visibility_config=aws.wafv2.WebAclRuleVisibilityConfigArgs(
                        cloudwatch_metrics_enabled=True,
                        metric_name="AWSManagedRulesSQLiRuleSetMetric",
                        sampled_requests_enabled=True,
                    ),
                ),
            ],
            tags={
                "Name": unique_waf_name,
                "Environment": self.environment_suffix,
            },
            visibility_config=aws.wafv2.WebAclVisibilityConfigArgs(
                cloudwatch_metrics_enabled=True,
                metric_name=f"{unique_waf_name}WebAcl",
                sampled_requests_enabled=True,
            ),
            opts=ResourceOptions(parent=self)
        )

        # Associate WAF with ALB
        self.waf_association = aws.wafv2.WebAclAssociation(
            f"{self.name_prefix}-waf-association",
            resource_arn=self.alb.arn,
            web_acl_arn=self.waf_web_acl.arn,
            opts=ResourceOptions(parent=self)
        )

    
    def _create_fargate_cluster(self):
        """Create ECS Fargate cluster."""
        self.ecs_cluster = aws.ecs.Cluster(
            f"{self.name_prefix}-cluster",
            name=f"{self.name_prefix}-cluster",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled",
                )
            ],
            tags={
                "Name": f"{self.name_prefix}-cluster",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Use unique log group name to avoid conflicts
        unique_log_group_name = f"/ecs/{self.name_prefix}-{self.unique_suffix}"
        
        self.log_group = aws.cloudwatch.LogGroup(
            f"{self.name_prefix}-log-group",
            name=unique_log_group_name,
            retention_in_days=14,
            tags={
                "Name": f"{self.name_prefix}-log-group",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Get current AWS region
        current_region = pulumi.Config("aws").get("region") or os.environ.get("AWS_REGION", "us-east-1")
        
        # Create container definition with proper Output handling
        def create_container_definition(log_group_name):
            return json.dumps([{
                "name": f"{self.name_prefix}-container",
                "image": "nginx:latest",
                "portMappings": [{
                    "containerPort": 80,
                    "protocol": "tcp",
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": log_group_name,
                        "awslogs-region": current_region,
                        "awslogs-stream-prefix": "ecs",
                    },
                },
                "environment": [
                    {"name": "ENVIRONMENT", "value": self.environment_suffix}
                ],
            }])
        
        # Task Definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"{self.name_prefix}-task",
            family=f"{self.name_prefix}-task",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=self.fargate_execution_role.arn,
            task_role_arn=self.fargate_task_role.arn,
            container_definitions=self.log_group.name.apply(create_container_definition),
            tags={
                "Name": f"{self.name_prefix}-task",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

    
    def _create_fargate_service(self):
        """Create ECS Fargate service."""
        
        # Target Group for Fargate
        self.fargate_target_group = aws.lb.TargetGroup(
            f"{self.name_prefix}-fargate-tg",
            name=f"{self.name_prefix}-fargate-tg-{self.unique_suffix}",
            port=80,
            protocol="HTTP",
            vpc_id=self.vpc.id,
            target_type="ip",
            health_check=aws.lb.TargetGroupHealthCheckArgs(
                enabled=True,
                healthy_threshold=2,
                interval=30,
                matcher="200",
                path="/",
                port="traffic-port",
                protocol="HTTP",
                timeout=5,
                unhealthy_threshold=2,
            ),
            tags={
                "Name": f"{self.name_prefix}-fargate-tg",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # ALB Listener Rule for Fargate
        self.fargate_listener_rule = aws.lb.ListenerRule(
            f"{self.name_prefix}-fargate-rule",
            listener_arn=self.alb_listener.arn,
            priority=100,
            actions=[aws.lb.ListenerRuleActionArgs(
                type="forward",
                target_group_arn=self.fargate_target_group.arn,
            )],
            conditions=[aws.lb.ListenerRuleConditionArgs(
                path_pattern=aws.lb.ListenerRuleConditionPathPatternArgs(
                    values=["/api/*"]
                ),
            )],
            opts=ResourceOptions(parent=self)
        )
        
        # ECS Service with more unique naming
        additional_unique_id = uuid.uuid4().hex[:6]
        unique_service_name = f"{self.name_prefix}-service-{self.unique_suffix}-{additional_unique_id}"
        
        self.ecs_service = aws.ecs.Service(
            f"{self.name_prefix}-service",
            name=unique_service_name,  # Use the more unique name
            cluster=self.ecs_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=[subnet.id for subnet in self.private_subnets],
                security_groups=[self.fargate_sg.id],
                assign_public_ip=False,
            ),
            load_balancers=[aws.ecs.ServiceLoadBalancerArgs(
                target_group_arn=self.fargate_target_group.arn,
                container_name=f"{self.name_prefix}-container",
                container_port=80,
            )],
            tags={
                "Name": f"{self.name_prefix}-service",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(
                parent=self,
                depends_on=[self.alb_listener]
            )
        )


    
    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for monitoring."""
        # CPU Utilization Alarm for ASG
        self.cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"{self.name_prefix}-cpu-alarm",
            name=f"{self.name_prefix}-high-cpu",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/EC2",
            period=300,
            statistic="Average",
            threshold=75.0,
            alarm_description="This metric monitors ec2 cpu utilization",
            dimensions={
                "AutoScalingGroupName": self.asg.name,
            },
            tags={
                "Name": f"{self.name_prefix}-cpu-alarm",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Auto Scaling Policies
        self.scale_up_policy = aws.autoscaling.Policy(
            f"{self.name_prefix}-scale-up",
            name=f"{self.name_prefix}-scale-up",
            scaling_adjustment=1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=self.asg.name,
            opts=ResourceOptions(parent=self)
        )
        
        self.scale_down_policy = aws.autoscaling.Policy(
            f"{self.name_prefix}-scale-down",
            name=f"{self.name_prefix}-scale-down",
            scaling_adjustment=-1,
            adjustment_type="ChangeInCapacity",
            cooldown=300,
            autoscaling_group_name=self.asg.name,
            opts=ResourceOptions(parent=self)
        )
    
    def _create_backup_vault(self):
        """Create AWS Backup vault and plan."""
        # FIXED: Backup Vault with unique suffix
        self.backup_vault = aws.backup.Vault(
            f"{self.name_prefix}-backup-vault",
            name=f"{self.name_prefix}-backup-vault-{self.unique_suffix}",  # Add unique suffix
            kms_key_arn=self.kms_key.arn,
            tags={
                "Name": f"{self.name_prefix}-backup-vault",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Backup Plan (no name conflicts, but update for consistency)
        self.backup_plan = aws.backup.Plan(
            f"{self.name_prefix}-backup-plan",
            name=f"{self.name_prefix}-backup-plan-{self.unique_suffix}",  # Add unique suffix
            rules=[
                aws.backup.PlanRuleArgs(
                    rule_name="DailyBackups",
                    target_vault_name=self.backup_vault.name,
                    schedule="cron(0 5 ? * * *)",  # Daily at 5 AM UTC
                    lifecycle=aws.backup.PlanRuleLifecycleArgs(
                        cold_storage_after=30,
                        delete_after=120,
                    ),
                    recovery_point_tags={
                        "Environment": self.environment_suffix,
                    },
                )
            ],
            tags={
                "Name": f"{self.name_prefix}-backup-plan",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )

    
    def _create_codepipeline(self):
        """Create CI/CD pipeline using AWS CodePipeline."""
        # Get stack name and make it lowercase and remove invalid characters
        stack_name = pulumi.get_stack().lower()
        # Remove any invalid characters and replace with hyphens
        stack_name = re.sub(r'[^a-z0-9-]', '-', stack_name)
        # Remove consecutive hyphens
        stack_name = re.sub(r'-+', '-', stack_name)
        # Remove leading/trailing hyphens
        stack_name = stack_name.strip('-')
        
        # Add a random suffix to ensure uniqueness
        random_suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
        
        # CodePipeline Artifact Store (S3 Bucket)
        self.pipeline_bucket = aws.s3.Bucket(
            f"{self.name_prefix}-pipeline-bucket",
            bucket=f"{self.name_prefix}-pipeline-{stack_name}-{random_suffix}".lower(),
            server_side_encryption_configuration=aws.s3.BucketServerSideEncryptionConfigurationArgs(
                rule=aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=(
                        aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(  # pylint: disable=line-too-long
                            sse_algorithm="aws:kms",
                            kms_master_key_id=self.kms_key.arn,
                        )
                    ),
                )
            ),
            tags={
                "Name": f"{self.name_prefix}-pipeline-bucket",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
        
        # Public Access Block for Pipeline Bucket
        self.pipeline_bucket_pab = aws.s3.BucketPublicAccessBlock(
            f"{self.name_prefix}-pipeline-bucket-pab",
            bucket=self.pipeline_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self)
        )
        
        # CodePipeline
        self.codepipeline = aws.codepipeline.Pipeline(
            f"{self.name_prefix}-pipeline",
            name=f"{self.name_prefix}-pipeline",
            role_arn=self.codepipeline_role.arn,
            artifact_stores=[
                aws.codepipeline.PipelineArtifactStoreArgs(
                    location=self.pipeline_bucket.bucket,
                    type="S3",
                    encryption_key=aws.codepipeline.PipelineArtifactStoreEncryptionKeyArgs(
                        id=self.kms_key.arn,
                        type="KMS",
                    ),
                )
            ],
            stages=[
                aws.codepipeline.PipelineStageArgs(
                    name="Source",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Source",
                            category="Source",
                            owner="ThirdParty",
                            provider="GitHub",
                            version="1",
                            output_artifacts=["source_output"],
                            configuration={
                                "Owner": "your-github-username",
                                "Repo": "your-repo-name",
                                "Branch": "main",
                                "OAuthToken": "your-github-token",  # Use Secrets Manager in production
                            },
                        )
                    ],
                ),
                aws.codepipeline.PipelineStageArgs(
                    name="Deploy",
                    actions=[
                        aws.codepipeline.PipelineStageActionArgs(
                            name="Deploy",
                            category="Deploy",
                            owner="AWS",
                            provider="ECS",
                            version="1",
                            input_artifacts=["source_output"],
                            configuration={
                                "ClusterName": self.ecs_cluster.name,
                                "ServiceName": self.ecs_service.name,
                                "FileName": "imagedefinitions.json",
                            },
                        )
                    ],
                ),
            ],
            tags={
                "Name": f"{self.name_prefix}-pipeline",
                "Environment": self.environment_suffix,
            },
            opts=ResourceOptions(parent=self)
        )
