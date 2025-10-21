# FedRAMP High-Compliant Emergency Alert Processing System

I'll create the infrastructure using Pulumi with Python for the federal emergency management agency's critical alert processing system.

## File: lib/tap_stack.py

```python
"""
tap_stack.py

FedRAMP High-Compliant Emergency Alert Processing System
Implements a secure, highly available system for processing emergency alerts
with full encryption at rest and in transit.
"""

from typing import Optional
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for
            identifying the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the FedRAMP High-compliant
    emergency alert processing system.

    This component orchestrates all required AWS resources including VPC, Kinesis,
    ECS Fargate, RDS, ElastiCache, API Gateway, EFS, and Secrets Manager.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = {
            **args.tags,
            'Project': 'EmergencyAlertProcessing',
            'Compliance': 'FedRAMP-High',
            'Environment': self.environment_suffix
        }

        # Region configuration - hardcoded to ap-southeast-1 for data sovereignty
        self.region = 'ap-southeast-1'

        # Get availability zones for Multi-AZ deployment
        azs = aws.get_availability_zones(state="available")

        # ===========================
        # 1. VPC and Networking Setup
        # ===========================

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"emergency-alert-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={**self.tags, 'Name': f'emergency-alert-vpc-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"emergency-alert-igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, 'Name': f'emergency-alert-igw-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets in multiple AZs
        self.public_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"emergency-alert-public-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={**self.tags, 'Name': f'emergency-alert-public-{i}-{self.environment_suffix}', 'Type': 'Public'},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.public_subnets.append(subnet)

        # Create private subnets in multiple AZs
        self.private_subnets = []
        for i, az in enumerate(azs.names[:2]):
            subnet = aws.ec2.Subnet(
                f"emergency-alert-private-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i+10}.0/24",
                availability_zone=az,
                tags={**self.tags, 'Name': f'emergency-alert-private-{i}-{self.environment_suffix}', 'Type': 'Private'},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.private_subnets.append(subnet)

        # Create Elastic IPs for NAT Gateways
        self.eips = []
        for i in range(2):
            eip = aws.ec2.Eip(
                f"emergency-alert-nat-eip-{i}-{self.environment_suffix}",
                domain="vpc",
                tags={**self.tags, 'Name': f'emergency-alert-nat-eip-{i}-{self.environment_suffix}'},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.eips.append(eip)

        # Create NAT Gateways in each public subnet
        self.nat_gateways = []
        for i, public_subnet in enumerate(self.public_subnets):
            nat = aws.ec2.NatGateway(
                f"emergency-alert-nat-{i}-{self.environment_suffix}",
                subnet_id=public_subnet.id,
                allocation_id=self.eips[i].id,
                tags={**self.tags, 'Name': f'emergency-alert-nat-{i}-{self.environment_suffix}'},
                opts=ResourceOptions(parent=self.vpc)
            )
            self.nat_gateways.append(nat)

        # Create route table for public subnets
        self.public_route_table = aws.ec2.RouteTable(
            f"emergency-alert-public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={**self.tags, 'Name': f'emergency-alert-public-rt-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Add route to Internet Gateway
        aws.ec2.Route(
            f"emergency-alert-public-route-{self.environment_suffix}",
            route_table_id=self.public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=self.igw.id,
            opts=ResourceOptions(parent=self.public_route_table)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"emergency-alert-public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self.public_route_table)
            )

        # Create private route tables (one per AZ for HA)
        for i, (private_subnet, nat_gateway) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f"emergency-alert-private-rt-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                tags={**self.tags, 'Name': f'emergency-alert-private-rt-{i}-{self.environment_suffix}'},
                opts=ResourceOptions(parent=self.vpc)
            )

            aws.ec2.Route(
                f"emergency-alert-private-route-{i}-{self.environment_suffix}",
                route_table_id=private_rt.id,
                destination_cidr_block="0.0.0.0/0",
                nat_gateway_id=nat_gateway.id,
                opts=ResourceOptions(parent=private_rt)
            )

            aws.ec2.RouteTableAssociation(
                f"emergency-alert-private-rta-{i}-{self.environment_suffix}",
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id,
                opts=ResourceOptions(parent=private_rt)
            )

        # ===========================
        # 2. Security Groups
        # ===========================

        # Security group for ECS tasks
        self.ecs_security_group = aws.ec2.SecurityGroup(
            f"emergency-alert-ecs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ECS Fargate tasks",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    self=True,
                    description="Allow all traffic within security group"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={**self.tags, 'Name': f'emergency-alert-ecs-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security group for RDS
        self.rds_security_group = aws.ec2.SecurityGroup(
            f"emergency-alert-rds-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for RDS PostgreSQL",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=5432,
                    to_port=5432,
                    security_groups=[self.ecs_security_group.id],
                    description="Allow PostgreSQL from ECS"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={**self.tags, 'Name': f'emergency-alert-rds-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security group for ElastiCache
        self.elasticache_security_group = aws.ec2.SecurityGroup(
            f"emergency-alert-elasticache-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for ElastiCache Redis",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=6379,
                    to_port=6379,
                    security_groups=[self.ecs_security_group.id],
                    description="Allow Redis from ECS"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={**self.tags, 'Name': f'emergency-alert-elasticache-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Security group for EFS
        self.efs_security_group = aws.ec2.SecurityGroup(
            f"emergency-alert-efs-sg-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            description="Security group for EFS",
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol="tcp",
                    from_port=2049,
                    to_port=2049,
                    security_groups=[self.ecs_security_group.id],
                    description="Allow NFS from ECS"
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol="-1",
                    from_port=0,
                    to_port=0,
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound traffic"
                )
            ],
            tags={**self.tags, 'Name': f'emergency-alert-efs-sg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # ===========================
        # 3. KMS Keys for Encryption
        # ===========================

        # Get AWS account ID and region for KMS policy
        caller_identity = aws.get_caller_identity()

        # KMS key for general encryption
        kms_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{caller_identity.account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{self.region}.amazonaws.com"
                    },
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:CreateGrant",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "ArnLike": {
                            "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{self.region}:{caller_identity.account_id}:log-group:*"
                        }
                    }
                }
            ]
        }

        self.kms_key = aws.kms.Key(
            f"emergency-alert-kms-{self.environment_suffix}",
            description="KMS key for emergency alert system encryption",
            enable_key_rotation=True,
            policy=json.dumps(kms_policy),
            tags={**self.tags, 'Name': f'emergency-alert-kms-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        self.kms_alias = aws.kms.Alias(
            f"emergency-alert-kms-alias-{self.environment_suffix}",
            target_key_id=self.kms_key.id,
            name=f"alias/emergency-alert-{self.environment_suffix}",
            opts=ResourceOptions(parent=self.kms_key)
        )

        # ===========================
        # 4. Secrets Manager
        # ===========================

        # Database credentials
        self.db_secret = aws.secretsmanager.Secret(
            f"emergency-alert-db-secret-{self.environment_suffix}",
            description="Database credentials for emergency alert system",
            kms_key_id=self.kms_key.id,
            tags={**self.tags, 'Name': f'emergency-alert-db-secret-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Generate random password for database
        db_password_value = {
            "username": "alertadmin",
            "password": "TempPassword123!ChangeMe",
            "engine": "postgres",
            "host": "placeholder",
            "port": 5432,
            "dbname": "emergencyalerts"
        }

        self.db_secret_version = aws.secretsmanager.SecretVersion(
            f"emergency-alert-db-secret-version-{self.environment_suffix}",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(db_password_value),
            opts=ResourceOptions(parent=self.db_secret)
        )

        # Redis auth token secret
        self.redis_secret = aws.secretsmanager.Secret(
            f"emergency-alert-redis-secret-{self.environment_suffix}",
            description="Redis auth token for emergency alert system",
            kms_key_id=self.kms_key.id,
            tags={**self.tags, 'Name': f'emergency-alert-redis-secret-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        redis_auth_value = {
            "auth_token": "TempRedisToken123!ChangeMe"
        }

        self.redis_secret_version = aws.secretsmanager.SecretVersion(
            f"emergency-alert-redis-secret-version-{self.environment_suffix}",
            secret_id=self.redis_secret.id,
            secret_string=json.dumps(redis_auth_value),
            opts=ResourceOptions(parent=self.redis_secret)
        )

        # ===========================
        # 5. Kinesis Data Stream
        # ===========================

        # BUG 1: Missing environment_suffix in resource name
        self.kinesis_stream = aws.kinesis.Stream(
            "emergency-alert-stream",
            shard_count=4,
            retention_period=24,
            encryption_type="KMS",
            kms_key_id=self.kms_key.id,
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
            ],
            stream_mode_details=aws.kinesis.StreamStreamModeDetailsArgs(
                stream_mode="PROVISIONED"
            ),
            tags={**self.tags, 'Name': f'emergency-alert-stream-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # ===========================
        # 6. RDS Multi-AZ PostgreSQL
        # ===========================

        # Create DB subnet group
        self.db_subnet_group = aws.rds.SubnetGroup(
            f"emergency-alert-db-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.tags, 'Name': f'emergency-alert-db-subnet-group-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create DB parameter group with FIPS compliance
        self.db_parameter_group = aws.rds.ParameterGroup(
            f"emergency-alert-db-pg-{self.environment_suffix}",
            family="postgres15",
            description="Parameter group for FedRAMP High compliance",
            parameters=[
                aws.rds.ParameterGroupParameterArgs(
                    name="rds.force_ssl",
                    value="1"
                )
            ],
            tags={**self.tags, 'Name': f'emergency-alert-db-pg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # BUG 2: RDS instance without Multi-AZ enabled
        self.rds_instance = aws.rds.Instance(
            f"emergency-alert-db-{self.environment_suffix}",
            identifier=f"emergency-alert-db-{self.environment_suffix}",
            engine="postgres",
            engine_version="15.8",
            instance_class="db.t3.medium",
            allocated_storage=100,
            storage_type="gp3",
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            db_name="emergencyalerts",
            username="alertadmin",
            password=Output.secret("TempPassword123!ChangeMe"),
            multi_az=False,  # BUG: Should be True for high availability
            db_subnet_group_name=self.db_subnet_group.name,
            vpc_security_group_ids=[self.rds_security_group.id],
            parameter_group_name=self.db_parameter_group.name,
            backup_retention_period=30,
            backup_window="03:00-04:00",
            maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql", "upgrade"],
            deletion_protection=False,
            skip_final_snapshot=True,
            publicly_accessible=False,
            tags={**self.tags, 'Name': f'emergency-alert-db-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, ignore_changes=["password"])
        )

        # ===========================
        # 7. ElastiCache Redis Cluster
        # ===========================

        # Create ElastiCache subnet group
        self.elasticache_subnet_group = aws.elasticache.SubnetGroup(
            f"emergency-alert-cache-subnet-group-{self.environment_suffix}",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={**self.tags, 'Name': f'emergency-alert-cache-subnet-group-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.vpc)
        )

        # Create ElastiCache parameter group
        self.elasticache_parameter_group = aws.elasticache.ParameterGroup(
            f"emergency-alert-cache-pg-{self.environment_suffix}",
            family="redis7",
            description="Parameter group for Redis with encryption in transit",
            parameters=[
                aws.elasticache.ParameterGroupParameterArgs(
                    name="maxmemory-policy",
                    value="allkeys-lru"
                )
            ],
            tags={**self.tags, 'Name': f'emergency-alert-cache-pg-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # ElastiCache Replication Group (Redis cluster with Multi-AZ)
        self.elasticache_cluster = aws.elasticache.ReplicationGroup(
            f"emergency-alert-cache-{self.environment_suffix}",
            replication_group_id=f"emergency-alert-cache-{self.environment_suffix}",
            description="Redis cluster for emergency alert correlation",
            engine="redis",
            engine_version="7.1",
            node_type="cache.t3.medium",
            num_cache_clusters=2,
            parameter_group_name=self.elasticache_parameter_group.name,
            subnet_group_name=self.elasticache_subnet_group.name,
            security_group_ids=[self.elasticache_security_group.id],
            at_rest_encryption_enabled=True,
            kms_key_id=self.kms_key.arn,
            transit_encryption_enabled=True,
            auth_token="TempRedisToken123!ChangeMe",
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            maintenance_window="mon:05:00-mon:07:00",
            log_delivery_configurations=[
                aws.elasticache.ReplicationGroupLogDeliveryConfigurationArgs(
                    destination_type="cloudwatch-logs",
                    destination="emergency-alert-redis-logs",
                    log_format="json",
                    log_type="slow-log"
                )
            ],
            tags={**self.tags, 'Name': f'emergency-alert-cache-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self, ignore_changes=["auth_token"])
        )

        # ===========================
        # 8. EFS File System
        # ===========================

        # BUG 3: EFS without encryption enabled
        self.efs = aws.efs.FileSystem(
            f"emergency-alert-efs-{self.environment_suffix}",
            lifecycle_policies=[
                aws.efs.FileSystemLifecyclePolicyArgs(
                    transition_to_ia="AFTER_30_DAYS"
                )
            ],
            performance_mode="generalPurpose",
            throughput_mode="bursting",
            tags={**self.tags, 'Name': f'emergency-alert-efs-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Create EFS mount targets in each AZ
        self.efs_mount_targets = []
        for i, subnet in enumerate(self.private_subnets):
            mount_target = aws.efs.MountTarget(
                f"emergency-alert-efs-mt-{i}-{self.environment_suffix}",
                file_system_id=self.efs.id,
                subnet_id=subnet.id,
                security_groups=[self.efs_security_group.id],
                opts=ResourceOptions(parent=self.efs)
            )
            self.efs_mount_targets.append(mount_target)

        # ===========================
        # 9. ECS Cluster and IAM Roles
        # ===========================

        # ECS Cluster
        self.ecs_cluster = aws.ecs.Cluster(
            f"emergency-alert-cluster-{self.environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags={**self.tags, 'Name': f'emergency-alert-cluster-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # IAM role for ECS task execution
        self.ecs_task_execution_role = aws.iam.Role(
            f"emergency-alert-ecs-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, 'Name': f'emergency-alert-ecs-execution-role-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for ECS task execution
        aws.iam.RolePolicyAttachment(
            f"emergency-alert-ecs-execution-policy-{self.environment_suffix}",
            role=self.ecs_task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self.ecs_task_execution_role)
        )

        # IAM policy for accessing Secrets Manager
        self.secrets_access_policy = aws.iam.RolePolicy(
            f"emergency-alert-secrets-policy-{self.environment_suffix}",
            role=self.ecs_task_execution_role.id,
            policy=Output.all(self.db_secret.arn, self.redis_secret.arn, self.kms_key.arn).apply(
                lambda args: json.dumps({
                    "Version": "2012-10-17",
                    "Statement": [
                        {
                            "Effect": "Allow",
                            "Action": [
                                "secretsmanager:GetSecretValue",
                                "secretsmanager:DescribeSecret"
                            ],
                            "Resource": [args[0], args[1]]
                        },
                        {
                            "Effect": "Allow",
                            "Action": [
                                "kms:Decrypt",
                                "kms:DescribeKey"
                            ],
                            "Resource": args[2]
                        }
                    ]
                })
            ),
            opts=ResourceOptions(parent=self.ecs_task_execution_role)
        )

        # IAM role for ECS tasks
        self.ecs_task_role = aws.iam.Role(
            f"emergency-alert-ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={**self.tags, 'Name': f'emergency-alert-ecs-task-role-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # BUG 4: Overly broad IAM policy using wildcards
        self.kinesis_access_policy = aws.iam.RolePolicy(
            f"emergency-alert-kinesis-policy-{self.environment_suffix}",
            role=self.ecs_task_role.id,
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": "kinesis:*",  # BUG: Too broad, should be specific actions
                    "Resource": "*"  # BUG: Should be specific to the stream ARN
                }]
            }),
            opts=ResourceOptions(parent=self.ecs_task_role)
        )

        # CloudWatch log group for ECS
        self.ecs_log_group = aws.cloudwatch.LogGroup(
            f"emergency-alert-ecs-logs-{self.environment_suffix}",
            name=f"/ecs/emergency-alert-{self.environment_suffix}",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            tags={**self.tags, 'Name': f'emergency-alert-ecs-logs-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # ECS Task Definition
        self.ecs_task_definition = aws.ecs.TaskDefinition(
            f"emergency-alert-task-{self.environment_suffix}",
            family=f"emergency-alert-task-{self.environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="1024",
            memory="2048",
            execution_role_arn=self.ecs_task_execution_role.arn,
            task_role_arn=self.ecs_task_role.arn,
            container_definitions=Output.all(
                self.ecs_log_group.name,
                self.region,
                self.db_secret.arn,
                self.redis_secret.arn,
                self.kinesis_stream.name
            ).apply(lambda args: json.dumps([{
                "name": "alert-processor",
                "image": "amazon/aws-cli:latest",
                "essential": True,
                "environment": [
                    {"name": "AWS_REGION", "value": args[1]},
                    {"name": "KINESIS_STREAM", "value": args[4]},
                    {"name": "FIPS_MODE", "value": "enabled"}
                ],
                "secrets": [
                    {"name": "DB_SECRET", "valueFrom": args[2]},
                    {"name": "REDIS_SECRET", "valueFrom": args[3]}
                ],
                "logConfiguration": {
                    "logDriver": "awslogs",
                    "options": {
                        "awslogs-group": args[0],
                        "awslogs-region": args[1],
                        "awslogs-stream-prefix": "alert-processor"
                    }
                },
                "mountPoints": [{
                    "sourceVolume": "efs-storage",
                    "containerPath": "/mnt/efs",
                    "readOnly": False
                }]
            }])),
            volumes=[
                aws.ecs.TaskDefinitionVolumeArgs(
                    name="efs-storage",
                    efs_volume_configuration=aws.ecs.TaskDefinitionVolumeEfsVolumeConfigurationArgs(
                        file_system_id=self.efs.id,
                        transit_encryption="ENABLED",
                        authorization_config=aws.ecs.TaskDefinitionVolumeEfsVolumeConfigurationAuthorizationConfigArgs(
                            iam="ENABLED"
                        )
                    )
                )
            ],
            tags={**self.tags, 'Name': f'emergency-alert-task-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.ecs_cluster)
        )

        # ECS Service
        self.ecs_service = aws.ecs.Service(
            f"emergency-alert-service-{self.environment_suffix}",
            cluster=self.ecs_cluster.id,
            task_definition=self.ecs_task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            network_configuration=aws.ecs.ServiceNetworkConfigurationArgs(
                subnets=[subnet.id for subnet in self.private_subnets],
                security_groups=[self.ecs_security_group.id],
                assign_public_ip=False
            ),
            enable_execute_command=True,
            tags={**self.tags, 'Name': f'emergency-alert-service-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.ecs_cluster, depends_on=self.efs_mount_targets)
        )

        # Application Auto Scaling Target
        self.ecs_autoscaling_target = aws.appautoscaling.Target(
            f"emergency-alert-autoscaling-target-{self.environment_suffix}",
            max_capacity=10,
            min_capacity=2,
            resource_id=Output.concat("service/", self.ecs_cluster.name, "/", self.ecs_service.name),
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs",
            opts=ResourceOptions(parent=self.ecs_service)
        )

        # Auto Scaling Policy - CPU
        scaling_config = aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
            predefined_metric_specification=aws.appautoscaling.
            PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                predefined_metric_type="ECSServiceAverageCPUUtilization"
            ),
            target_value=70.0,
            scale_in_cooldown=300,
            scale_out_cooldown=60
        )

        self.ecs_autoscaling_policy_cpu = aws.appautoscaling.Policy(
            f"emergency-alert-autoscaling-cpu-{self.environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=self.ecs_autoscaling_target.resource_id,
            scalable_dimension=self.ecs_autoscaling_target.scalable_dimension,
            service_namespace=self.ecs_autoscaling_target.service_namespace,
            target_tracking_scaling_policy_configuration=scaling_config,
            opts=ResourceOptions(parent=self.ecs_autoscaling_target)
        )

        # ===========================
        # 10. API Gateway
        # ===========================

        # CloudWatch log group for API Gateway
        self.api_log_group = aws.cloudwatch.LogGroup(
            f"emergency-alert-api-logs-{self.environment_suffix}",
            name=f"/aws/apigateway/emergency-alert-{self.environment_suffix}",
            retention_in_days=30,
            kms_key_id=self.kms_key.arn,
            tags={**self.tags, 'Name': f'emergency-alert-api-logs-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # API Gateway REST API
        self.api_gateway = aws.apigateway.RestApi(
            f"emergency-alert-api-{self.environment_suffix}",
            name=f"emergency-alert-api-{self.environment_suffix}",
            description="API Gateway for emergency alert processing system",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags={**self.tags, 'Name': f'emergency-alert-api-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # API Gateway resource
        self.api_resource = aws.apigateway.Resource(
            f"emergency-alert-api-resource-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            parent_id=self.api_gateway.root_resource_id,
            path_part="alerts",
            opts=ResourceOptions(parent=self.api_gateway)
        )

        # API Gateway method
        self.api_method = aws.apigateway.Method(
            f"emergency-alert-api-method-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method="POST",
            authorization="AWS_IAM",
            opts=ResourceOptions(parent=self.api_resource)
        )

        # Mock integration for API Gateway
        self.api_integration = aws.apigateway.Integration(
            f"emergency-alert-api-integration-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            type="MOCK",
            request_templates={
                "application/json": '{"statusCode": 200}'
            },
            opts=ResourceOptions(parent=self.api_method)
        )

        # API Gateway method response
        self.api_method_response = aws.apigateway.MethodResponse(
            f"emergency-alert-api-method-response-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            status_code="200",
            opts=ResourceOptions(parent=self.api_method)
        )

        # API Gateway integration response
        self.api_integration_response = aws.apigateway.IntegrationResponse(
            f"emergency-alert-api-integration-response-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            resource_id=self.api_resource.id,
            http_method=self.api_method.http_method,
            status_code=self.api_method_response.status_code,
            opts=ResourceOptions(parent=self.api_method_response)
        )

        # API Gateway deployment
        self.api_deployment = aws.apigateway.Deployment(
            f"emergency-alert-api-deployment-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            opts=ResourceOptions(
                parent=self.api_gateway,
                depends_on=[self.api_integration_response]
            )
        )

        # API Gateway stage
        self.api_stage = aws.apigateway.Stage(
            f"emergency-alert-api-stage-{self.environment_suffix}",
            rest_api=self.api_gateway.id,
            deployment=self.api_deployment.id,
            stage_name=self.environment_suffix,
            xray_tracing_enabled=True,
            access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
                destination_arn=self.api_log_group.arn,
                format='$context.requestId'
            ),
            tags={**self.tags, 'Name': f'emergency-alert-api-stage-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.api_deployment)
        )

        # ===========================
        # 11. CloudWatch Alarms
        # ===========================

        # SNS topic for alarms
        self.alarm_topic = aws.sns.Topic(
            f"emergency-alert-alarms-{self.environment_suffix}",
            kms_master_key_id=self.kms_key.id,
            tags={**self.tags, 'Name': f'emergency-alert-alarms-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self)
        )

        # CloudWatch alarm for ECS CPU
        self.ecs_cpu_alarm = aws.cloudwatch.MetricAlarm(
            f"emergency-alert-ecs-cpu-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="Alert when ECS CPU exceeds 80%",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "ClusterName": self.ecs_cluster.name,
                "ServiceName": self.ecs_service.name
            },
            tags={**self.tags, 'Name': f'emergency-alert-ecs-cpu-alarm-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.ecs_service)
        )

        # CloudWatch alarm for Kinesis iterator age
        self.kinesis_iterator_alarm = aws.cloudwatch.MetricAlarm(
            f"emergency-alert-kinesis-alarm-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Maximum",
            threshold=60000,
            alarm_description="Alert when Kinesis iterator age exceeds 1 minute",
            alarm_actions=[self.alarm_topic.arn],
            dimensions={
                "StreamName": self.kinesis_stream.name
            },
            tags={**self.tags, 'Name': f'emergency-alert-kinesis-alarm-{self.environment_suffix}'},
            opts=ResourceOptions(parent=self.kinesis_stream)
        )

        # BUG 5: Missing CloudWatch alarm for RDS - no monitoring for database CPU or connections

        # ===========================
        # 12. Outputs
        # ===========================

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.id,
            'kinesis_stream_name': self.kinesis_stream.name,
            'kinesis_stream_arn': self.kinesis_stream.arn,
            'ecs_cluster_name': self.ecs_cluster.name,
            'ecs_cluster_arn': self.ecs_cluster.arn,
            'ecs_service_name': self.ecs_service.name,
            'rds_endpoint': self.rds_instance.endpoint,
            'rds_address': self.rds_instance.address,
            'elasticache_endpoint': self.elasticache_cluster.configuration_endpoint_address,
            'efs_id': self.efs.id,
            'efs_dns_name': self.efs.dns_name,
            'api_gateway_url': Output.concat(
                "https://", self.api_gateway.id, ".execute-api.",
                self.region, ".amazonaws.com/", self.api_stage.stage_name
            ),
            'db_secret_arn': self.db_secret.arn,
            'redis_secret_arn': self.redis_secret.arn,
            'kms_key_id': self.kms_key.id,
            'alarm_topic_arn': self.alarm_topic.arn
        })
```

This implementation provides a FedRAMP High-compliant emergency alert processing system with all the required AWS services configured for high availability and security.
