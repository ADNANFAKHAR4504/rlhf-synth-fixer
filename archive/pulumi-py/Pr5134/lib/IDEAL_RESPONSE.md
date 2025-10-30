# FastCart Order Processing Infrastructure - Pulumi Python Implementation

Production-ready Pulumi Python component that provisions FastCart's event-driven order processing platform in `eu-central-1`, covering networking, data stores, compute, observability, and supporting security controls.

## Architecture Overview

- **Networking**: VPC (`10.0.0.0/16`) with paired public and private subnets across two AZs, Internet Gateway, single NAT Gateway, and dedicated route tables.
- **Security**: Customer-managed KMS key, environment-scoped tagging, three security groups (ECS, RDS, Redis), IAM roles/policies for execution and task workloads, Secrets Manager for database credentials.
- **Data Stores**: RDS PostgreSQL (`db.t3.micro`, encrypted, backups, logs), ElastiCache Redis replication group (TLS, auth token, multi-AZ), stored credentials secret.
- **Streaming & Compute**: Kinesis Data Stream (2 shards, KMS encrypted) feeding an ECS Fargate service (2 tasks, private subnets, AWS Logs).
- **Observability & Registries**: CloudWatch log group with KMS encryption, alarms for Kinesis iterator age and RDS CPU, ECR repository for container artifacts.
- **Outputs**: Rich metadata persisted to `cfn-outputs/flat-outputs.json` for integration validation.

## File: `lib/tap_stack.py`

```python
"""
FastCart Order Processing Stack - Event-Driven E-Commerce Infrastructure

This module implements a scalable, event-driven order processing system for
an e-commerce platform using Kinesis, ECS Fargate, RDS PostgreSQL, and ElastiCache Redis.
All resources are deployed in eu-central-1 with encryption and security best practices.
"""

import json
import os
from pathlib import Path
from typing import Optional
import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws
from pulumi_aws import (
    ec2, ecs, rds, elasticache, kinesis, kms, cloudwatch,
    iam, secretsmanager, ecr, efs
)
from pulumi_random import RandomPassword

CREDENTIAL_CHARSET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-.:;<=>?[]^_{|}~"


class TapStackArgs:
    """
    Configuration arguments for the FastCart Order Processing Stack.

    Args:
        environment_suffix: Unique suffix for resource naming and isolation
        availability_zones: Optional override for availability zones (used in tests)
    """
    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        availability_zones: Optional[list[str]] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.availability_zones = availability_zones


class TapStack(pulumi.ComponentResource):
    """
    Main stack component for event-driven order processing infrastructure.

    Implements:
    - Kinesis Data Stream for order ingestion
    - ECS Fargate cluster for order processing
    - RDS PostgreSQL for order storage with encryption
    - ElastiCache Redis for query caching with encryption
    - Secrets Manager for credential management with rotation
    - VPC with private subnets and NAT Gateway
    - KMS encryption for all data stores
    - CloudWatch logging and monitoring
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Common tags for all resources
        region_env = os.getenv('AWS_REGION')
        if region_env:
            from types import SimpleNamespace
            region = SimpleNamespace(name=region_env)
        else:
            region = aws.get_region()

        common_tags = {
            'Environment': self.environment_suffix,
            'Application': 'FastCartOrderProcessing',
            'ManagedBy': 'Pulumi',
            'Region': region.name
        }

        # Get current AWS account ID and region for KMS policy
        current = aws.get_caller_identity()

        # ========================================
        # KMS Key for Encryption
        # ========================================
        self.kms_key = kms.Key(
            f"fastcart-kms-{self.environment_suffix}",
            description=f"KMS key for FastCart order processing encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "Enable IAM User Permissions",
                        "Effect": "Allow",
                        "Principal": {
                            "AWS": f"arn:aws:iam::{current.account_id}:root"
                        },
                        "Action": "kms:*",
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow CloudWatch Logs",
                        "Effect": "Allow",
                        "Principal": {
                            # Allow the CloudWatch Logs service in the current region
                            "Service": f"logs.{region.name}.amazonaws.com"
                        },
                        "Action": [
                            "kms:Encrypt",
                            "kms:Decrypt",
                            "kms:ReEncrypt*",
                            "kms:GenerateDataKey*",
                            "kms:CreateGrant",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Sid": "Allow AWS Services",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": [
                                "ecs-tasks.amazonaws.com",
                                "rds.amazonaws.com",
                                "elasticache.amazonaws.com",
                                "kinesis.amazonaws.com",
                                "secretsmanager.amazonaws.com",
                                "ecr.amazonaws.com"
                            ]
                        },
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": "*"
                    }
                ]
            }),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        self.kms_alias = kms.Alias(
            f"fastcart-kms-alias-{self.environment_suffix}",
            name=f"alias/fastcart-{self.environment_suffix}",
            target_key_id=self.kms_key.id,
            opts=ResourceOptions(parent=self.kms_key)
        )

        # ========================================
        # VPC and Networking
        # ========================================
        self.vpc = ec2.Vpc(
            f"fastcart-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**common_tags, 'Name': f'fastcart-vpc-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Internet Gateway
        self.igw = ec2.InternetGateway(
            f"fastcart-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, 'Name': f'fastcart-igw-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Get available AZs dynamically
        az_names = args.availability_zones or aws.get_availability_zones(
            state="available"
        ).names

        # Public Subnets for NAT Gateway
        self.public_subnet_1 = ec2.Subnet(
            f"fastcart-public-subnet-1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=az_names[0],
            map_public_ip_on_launch=True,
            tags={**common_tags, 'Name': f'fastcart-public-1-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        self.public_subnet_2 = ec2.Subnet(
            f"fastcart-public-subnet-2-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=az_names[1],
            map_public_ip_on_launch=True,
            tags={**common_tags, 'Name': f'fastcart-public-2-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Private Subnets for ECS, RDS, and ElastiCache
        self.private_subnet_1 = ec2.Subnet(
            f"fastcart-private-subnet-1-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=az_names[0],
            tags={**common_tags, 'Name': f'fastcart-private-1-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        self.private_subnet_2 = ec2.Subnet(
            f"fastcart-private-subnet-2-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=az_names[1],
            tags={**common_tags, 'Name': f'fastcart-private-2-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Elastic IP for NAT Gateway
        self.nat_eip = ec2.Eip(
            f"fastcart-nat-eip-{self.environment_suffix}",
            domain="vpc",
            tags={**common_tags, 'Name': f'fastcart-nat-eip-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # NAT Gateway in public subnet
        self.nat_gateway = ec2.NatGateway(
            f"fastcart-nat-{self.environment_suffix}",
            allocation_id=self.nat_eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={**common_tags, 'Name': f'fastcart-nat-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc, depends_on=[self.igw])
        )

        # Public Route Table
        self.public_route_table = ec2.RouteTable(
            f"fastcart-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, 'Name': f'fastcart-public-rt-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        self.public_route = ec2.Route(
            f"fastcart-public-route-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        self.public_rta_1 = ec2.RouteTableAssociation(
            f"fastcart-public-rta-1-{self.environment_suffix}",
            subnet_id=self.public_subnet_1.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        self.public_rta_2 = ec2.RouteTableAssociation(
            f"fastcart-public-rta-2-{self.environment_suffix}",
            subnet_id=self.public_subnet_2.id,
            route_table_id=self.public_route_table.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        # Private Route Table
        self.private_route_table = ec2.RouteTable(
            f"fastcart-private-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**common_tags, 'Name': f'fastcart-private-rt-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        self.private_route = ec2.Route(
            f"fastcart-private-route-{self.environment_suffix}",
            route_table_id=self.private_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            nat_gateway_id=self.nat_gateway.id,
            opts=ResourceOptions(parent=self.private_route_table)
        )

        self.private_rta_1 = ec2.RouteTableAssociation(
            f"fastcart-private-rta-1-{self.environment_suffix}",
            subnet_id=self.private_subnet_1.id,
            route_table_id=self.private_route_table.id,
            opts=ResourceOptions(parent=self.private_route_table)
        )

        self.private_rta_2 = ec2.RouteTableAssociation(
            f"fastcart-private-rta-2-{self.environment_suffix}",
            subnet_id=self.private_subnet_2.id,
            route_table_id=self.private_route_table.id,
            opts=ResourceOptions(parent=self.private_route_table)
        )

        # ========================================
        # Security Groups
        # ========================================
        # Security Group for ECS tasks
        self.ecs_sg = ec2.SecurityGroup(
            f"fastcart-ecs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ECS tasks processing orders",
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=8080,
                    to_port=8080,
                    cidr_blocks=["10.0.0.0/16"],
                    description="HTTP from VPC"
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, 'Name': f'fastcart-ecs-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security Group for RDS
        self.rds_sg = ec2.SecurityGroup(
            f"fastcart-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS PostgreSQL database",
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[self.ecs_sg.id],
                    description="PostgreSQL from ECS tasks"
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, 'Name': f'fastcart-rds-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security Group for ElastiCache Redis
        self.redis_sg = ec2.SecurityGroup(
            f"fastcart-redis-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ElastiCache Redis cluster",
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    security_groups=[self.ecs_sg.id],
                    description="Redis from ECS tasks"
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags={**common_tags, 'Name': f'fastcart-redis-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # ========================================
        # Secrets Manager for Database Credentials
        # ========================================
        self.db_password = RandomPassword(
            f"fastcart-db-password-{self.environment_suffix}",
            length=30,
            override_characters=CREDENTIAL_CHARSET,
            min_upper=4,
            min_lower=4,
            min_numeric=4,
            special=True,
            min_special=2
        )
        db_password_value = pulumi.Output.secret(self.db_password.result)

        self.db_password_secret = secretsmanager.Secret(
            f"fastcart-db-password-{self.environment_suffix}",
            name=f"fastcart-db-password-{self.environment_suffix}",
            description="Database password for FastCart order processing",
            kms_key_id=self.kms_key.id,
            recovery_window_in_days=0,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        db_secret_payload = pulumi.Output.all(db_password_value).apply(
            lambda args: json.dumps({
                "username": "fastcart_admin",
                "password": args[0],
                "engine": "postgres",
                "port": 5432,
                "dbname": "ordersdb"
            })
        )

        # Store database credentials
        self.db_password_version = secretsmanager.SecretVersion(
            f"fastcart-db-password-version-{self.environment_suffix}",
            secret_id=self.db_password_secret.id,
            secret_string=db_secret_payload,
            opts=ResourceOptions(parent=self.db_password_secret)
        )

        # Note: Secret rotation requires Lambda function configuration
        # For production, implement rotation with AWS Lambda and set rotation_lambda_arn

        # ========================================
        # RDS PostgreSQL Database
        # ========================================
        # DB subnet group
        self.db_subnet_group = rds.SubnetGroup(
            f"fastcart-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[self.private_subnet_1.id, self.private_subnet_2.id],
            tags={**common_tags, 'Name': f'fastcart-db-subnet-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # RDS PostgreSQL instance
        self.rds_instance = rds.Instance(
            f"fastcart-rds-{self.environment_suffix}",
            identifier=f"fastcart-rds-{self.environment_suffix}",
            engine="postgres",
            engine_version="16.9",
            instance_class="db.t3.micro",
            allocated_storage=20,
            storage_type="gp2",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name="ordersdb",
            username="fastcart_admin",
            password=db_password_value,
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_sg.id],
            publicly_accessible=False,
            backup_retention_period=7,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            skip_final_snapshot=True,
            multi_az=False,
            tags={**common_tags, 'Name': f'fastcart-rds-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # ========================================
        # ElastiCache Redis Cluster
        # ========================================
        self.redis_auth_token = RandomPassword(
            f"fastcart-redis-auth-{self.environment_suffix}",
            length=48,
            override_characters=CREDENTIAL_CHARSET,
            min_upper=4,
            min_lower=4,
            min_numeric=4,
            special=True,
            min_special=2
        )
        redis_auth_value = pulumi.Output.secret(self.redis_auth_token.result)

        self.redis_auth_secret = secretsmanager.Secret(
            f"fastcart-redis-auth-secret-{self.environment_suffix}",
            name=f"fastcart-redis-auth-{self.environment_suffix}",
            description="Redis authentication token for FastCart order processing",
            kms_key_id=self.kms_key.id,
            recovery_window_in_days=0,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        redis_secret_payload = pulumi.Output.all(redis_auth_value).apply(
            lambda args: json.dumps({
                "auth_token": args[0],
                "port": 6379
            })
        )

        self.redis_auth_secret_version = secretsmanager.SecretVersion(
            f"fastcart-redis-auth-secret-version-{self.environment_suffix}",
            secret_id=self.redis_auth_secret.id,
            secret_string=redis_secret_payload,
            opts=ResourceOptions(parent=self.redis_auth_secret)
        )

        # ElastiCache subnet group
        self.redis_subnet_group = elasticache.SubnetGroup(
            f"fastcart-redis-subnet-group-{self.environment_suffix}",
            name=f"fastcart-redis-subnet-{self.environment_suffix}",
            subnet_ids=[self.private_subnet_1.id, self.private_subnet_2.id],
            tags={**common_tags, 'Name': f'fastcart-redis-subnet-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # ElastiCache Redis cluster with encryption
        self.redis_cluster = elasticache.ReplicationGroup(
            f"fastcart-redis-{self.environment_suffix}",
            replication_group_id=f"fastcart-redis-{self.environment_suffix}",
            description="Redis cluster for FastCart query caching",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=2,
            parameter_group_name="default.redis7",
            port=6379,
            subnet_group_name=self.redis_subnet_group.name,
            security_group_ids=[self.redis_sg.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auth_token=redis_auth_value,
            kms_key_id=self.kms_key.arn,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window="02:00-03:00",
            maintenance_window="sun:05:00-sun:06:00",
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # ========================================
        # Kinesis Data Stream
        # ========================================
        self.kinesis_stream = kinesis.Stream(
            f"fastcart-orders-stream-{self.environment_suffix}",
            name=f"fastcart-orders-stream-{self.environment_suffix}",
            shard_count=2,
            retention_period=24,
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
                "WriteProvisionedThroughputExceeded",
                "ReadProvisionedThroughputExceeded"
            ],
            stream_mode_details=kinesis.StreamStreamModeDetailsArgs(
                stream_mode="PROVISIONED"
            ),
            encryption_type="KMS",
            kms_key_id=self.kms_key.id,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # ========================================
        # CloudWatch Log Groups
        # ========================================
        self.log_group = cloudwatch.LogGroup(
            f"fastcart-ecs-logs-{self.environment_suffix}",
            name=f"/ecs/fastcart-order-processor-{self.environment_suffix}",
            retention_in_days=7,
            kms_key_id=self.kms_key.arn,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # ========================================
        # IAM Roles and Policies
        # ========================================
        # ECS Task Execution Role
        self.ecs_execution_role = iam.Role(
            f"fastcart-ecs-exec-role-{self.environment_suffix}",
            name=f"fastcart-ecs-exec-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Attach managed policy
        self.ecs_execution_policy_attachment = iam.RolePolicyAttachment(
            f"fastcart-ecs-exec-policy-{self.environment_suffix}",
            role=self.ecs_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self.ecs_execution_role)
        )

        # Custom policy for Secrets Manager and KMS
        self.ecs_execution_custom_policy = iam.RolePolicy(
            f"fastcart-ecs-exec-custom-policy-{self.environment_suffix}",
            role=self.ecs_execution_role.id,
            policy=pulumi.Output.all(
                self.kms_key.arn,
                self.db_password_secret.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self.ecs_execution_role)
        )

        # ECS Task Role
        self.ecs_task_role = iam.Role(
            f"fastcart-ecs-task-role-{self.environment_suffix}",
            name=f"fastcart-ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Task role policy for Kinesis, RDS, and Redis access
        self.ecs_task_policy = iam.RolePolicy(
            f"fastcart-ecs-task-policy-{self.environment_suffix}",
            role=self.ecs_task_role.id,
            policy=pulumi.Output.all(
                self.kms_key.arn,
                self.kinesis_stream.arn,
                self.db_password_secret.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:GenerateDataKey"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:DescribeStream",
                            "kinesis:ListShards",
                            "kinesis:ListStreams"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue"
                        ],
                        "Resource": args[2]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self.ecs_task_role)
        )

        # ========================================
        # ECR Repository
        # ========================================
        self.ecr_repository = ecr.Repository(
            f"fastcart-order-processor-{self.environment_suffix}",
            name=f"fastcart-order-processor-{self.environment_suffix}",
            image_scanning_configuration=ecr.RepositoryImageScanningConfigurationArgs(
                scan_on_push=True
            ),
            encryption_configurations=[
                ecr.RepositoryEncryptionConfigurationArgs(
                    encryption_type="KMS",
                    kms_key=self.kms_key.arn
                )
            ],
            image_tag_mutability="MUTABLE",
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # ========================================
        # ECS Cluster and Task Definition
        # ========================================
        self.ecs_cluster = ecs.Cluster(
            f"fastcart-cluster-{self.environment_suffix}",
            name=f"fastcart-cluster-{self.environment_suffix}",
            settings=[
                ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # ECS Task Definition
        self.task_definition = ecs.TaskDefinition(
            f"fastcart-task-{self.environment_suffix}",
            family=f"fastcart-order-processor-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="512",
            memory="1024",
            execution_role_arn=self.ecs_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=pulumi.Output.all(
                self.ecr_repository.repository_url,
                self.log_group.name,
                self.rds_instance.endpoint,
                self.redis_cluster.configuration_endpoint_address,
                self.kinesis_stream.name,
                self.db_password_secret.arn
            ).apply(lambda args: json.dumps([{
                "name": "order-processor",
                "image": f"{args[0]}:latest",
                "essential": True,
                "portMappings": [{
                    "containerPort": 8080,
                    "protocol": "tcp"
                }],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[1],
                        "awslogs-region": "eu-central-1",
                        "awslogs-stream-prefix": "ecs"
                    }
                },
                "environment": [
                    {
                        "name": "DB_HOST",
                        "value": args[2]
                    },
                    {
                        "name": "DB_NAME",
                        "value": "ordersdb"
                    },
                    {
                        "name": "DB_PORT",
                        "value": "5432"
                    },
                    {
                        "name": "REDIS_HOST",
                        "value": args[3]
                    },
                    {
                        "name": "REDIS_PORT",
                        "value": "6379"
                    },
                    {
                        "name": "KINESIS_STREAM",
                        "value": args[4]
                    },
                    {
                        "name": "AWS_REGION",
                        "value": region.name
                    }
                ],
                "secrets": [
                    {
                        "name": "DB_CREDENTIALS",
                        "valueFrom": args[5]
                    }
                ]
            }])),
            tags=common_tags,
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # ECS Service
        self.ecs_service = ecs.Service(
            f"fastcart-service-{self.environment_suffix}",
            name=f"fastcart-order-processor-{self.environment_suffix}",
            cluster=self.ecs_cluster.arn,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=ecs.ServiceNetworkConfigurationArgs(
                assign_public_ip=False,
                subnets=[self.private_subnet_1.id, self.private_subnet_2.id],
                security_groups=[self.ecs_sg.id]
            ),
            tags=common_tags,
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # ========================================
        # CloudWatch Alarms for Monitoring
        # ========================================
        self.kinesis_iterator_age_alarm = cloudwatch.MetricAlarm(
            f"fastcart-kinesis-iterator-age-{self.environment_suffix}",
            name=f"fastcart-kinesis-iterator-age-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Average",
            threshold=60000,
            alarm_description="Alert when Kinesis iterator age exceeds 1 minute",
            dimensions={
                "StreamName": self.kinesis_stream.name
            },
            tags=common_tags,
            opts=ResourceOptions(parent=self.kinesis_stream)
        )

        self.rds_cpu_alarm = cloudwatch.MetricAlarm(
            f"fastcart-rds-cpu-{self.environment_suffix}",
            name=f"fastcart-rds-cpu-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when RDS CPU exceeds 80%",
            dimensions={
                "DBInstanceIdentifier": self.rds_instance.identifier
            },
            tags=common_tags,
            opts=ResourceOptions(parent=self.rds_instance)
        )

        # ========================================
        # Outputs
        # ========================================
        public_subnet_ids = pulumi.Output.all(
            self.public_subnet_1.id,
            self.public_subnet_2.id
        ).apply(list)

        public_subnet_arns = pulumi.Output.all(
            self.public_subnet_1.arn,
            self.public_subnet_2.arn
        ).apply(list)

        private_subnet_ids = pulumi.Output.all(
            self.private_subnet_1.id,
            self.private_subnet_2.id
        ).apply(list)

        private_subnet_arns = pulumi.Output.all(
            self.private_subnet_1.arn,
            self.private_subnet_2.arn
        ).apply(list)

        stack_outputs = {
            'environment_suffix': self.environment_suffix,
            'availability_zones': az_names,
            'kms_key_id': self.kms_key.id,
            'kms_key_arn': self.kms_key.arn,
            'kms_alias_name': self.kms_alias.name,
            'kms_alias_arn': self.kms_alias.arn,
            'vpc_id': self.vpc.id,
            'vpc_arn': self.vpc.arn,
            'vpc_cidr': self.vpc.cidr_block,
            'internet_gateway_id': self.igw.id,
            'nat_gateway_id': self.nat_gateway.id,
            'nat_eip_allocation_id': self.nat_eip.id,
            'nat_eip_public_ip': self.nat_eip.public_ip,
            'public_subnet_ids': public_subnet_ids,
            'public_subnet_arns': public_subnet_arns,
            'private_subnet_ids': private_subnet_ids,
            'private_subnet_arns': private_subnet_arns,
            'public_route_table_id': self.public_route_table.id,
            'private_route_table_id': self.private_route_table.id,
            'public_route_id': self.public_route.id,
            'private_route_id': self.private_route.id,
            'ecs_security_group_id': self.ecs_sg.id,
            'rds_security_group_id': self.rds_sg.id,
            'redis_security_group_id': self.redis_sg.id,
            'db_secret_id': self.db_password_secret.id,
            'db_secret_arn': self.db_password_secret.arn,
            'db_secret_version_id': self.db_password_version.id,
            'redis_secret_id': self.redis_auth_secret.id,
            'redis_secret_arn': self.redis_auth_secret.arn,
            'redis_secret_version_id': self.redis_auth_secret_version.id,
            'db_subnet_group_name': self.db_subnet_group.name,
            'rds_instance_id': self.rds_instance.id,
            'rds_instance_arn': self.rds_instance.arn,
            'rds_endpoint': self.rds_instance.endpoint,
            'rds_address': self.rds_instance.address,
            'redis_subnet_group_name': self.redis_subnet_group.name,
            'redis_replication_group_id': self.redis_cluster.replication_group_id,
            'redis_endpoint': self.redis_cluster.configuration_endpoint_address,
            'redis_configuration_endpoint': self.redis_cluster.configuration_endpoint_address,
            'redis_primary_endpoint': self.redis_cluster.primary_endpoint_address,
            'redis_port': Output.from_input(6379),
            'redis_auth_token_enabled': Output.from_input(True),
            'kinesis_stream_name': self.kinesis_stream.name,
            'kinesis_stream_arn': self.kinesis_stream.arn,
            'kinesis_stream_shard_count': self.kinesis_stream.shard_count,
            'kinesis_stream_retention_period': self.kinesis_stream.retention_period,
            'log_group_name': self.log_group.name,
            'log_group_arn': self.log_group.arn,
            'log_group_kms_key': self.log_group.kms_key_id,
            'log_group_retention_days': self.log_group.retention_in_days,
            'ecs_execution_role_name': self.ecs_execution_role.name,
            'ecs_execution_role_arn': self.ecs_execution_role.arn,
            'ecs_task_role_name': self.ecs_task_role.name,
            'ecs_task_role_arn': self.ecs_task_role.arn,
            'ecs_cluster_name': self.ecs_cluster.name,
            'ecs_cluster_arn': self.ecs_cluster.arn,
            'ecs_service_name': self.ecs_service.name,
            'ecs_service_id': self.ecs_service.id,
            'ecs_service_cluster_arn': self.ecs_service.cluster,
            'ecs_service_desired_count': self.ecs_service.desired_count,
            'task_definition_arn': self.task_definition.arn,
            'task_definition_family': self.task_definition.family,
            'ecr_repository_url': self.ecr_repository.repository_url,
            'ecr_repository_arn': self.ecr_repository.arn,
            'ecr_repository_name': self.ecr_repository.name,
            'kinesis_iterator_age_alarm_name': self.kinesis_iterator_age_alarm.name,
            'kinesis_iterator_age_alarm_arn': self.kinesis_iterator_age_alarm.arn,
            'rds_cpu_alarm_name': self.rds_cpu_alarm.name,
            'rds_cpu_alarm_arn': self.rds_cpu_alarm.arn,
            'flat_outputs_path': "cfn-outputs/flat-outputs.json"
        }

        self.outputs = {
            key: Output.from_input(value)
            for key, value in stack_outputs.items()
        }

        def _write_flat_outputs(resolved_outputs):
            output_dir = Path("cfn-outputs")
            output_dir.mkdir(parents=True, exist_ok=True)
            output_file = output_dir / "flat-outputs.json"
            output_file.write_text(
                json.dumps(resolved_outputs, indent=2, sort_keys=True)
            )
            return resolved_outputs

        pulumi.Output.all(**self.outputs).apply(_write_flat_outputs)

        self.register_outputs(self.outputs)

```

## File: `lib/__init__.py`

_File intentionally left empty; module exports rely on direct imports._

## Registered Outputs

The component makes the following values available (and persists them to `cfn-outputs/flat-outputs.json`):

- `environment_suffix`, `availability_zones`
- Networking: `vpc_id`, `vpc_arn`, `public_subnet_ids`, `private_subnet_ids`, route tables, NAT/IGW identifiers
- Security: `kms_key_id`, `kms_key_arn`, KMS alias, security group IDs, Secrets Manager secret metadata
- Data stores: `rds_instance_id`, `rds_instance_arn`, `rds_endpoint`, `redis_replication_group_id`, `redis_endpoint`, `redis_primary_endpoint`
- Streaming & Compute: `kinesis_stream_name`, `kinesis_stream_arn`, `ecs_cluster_arn`, `ecs_service_name`, `task_definition_arn`, `ecr_repository_url`
- Observability: CloudWatch log group identifiers, alarm names/ARNs
- Utility: `flat_outputs_path` pointing to the generated JSON artifact
