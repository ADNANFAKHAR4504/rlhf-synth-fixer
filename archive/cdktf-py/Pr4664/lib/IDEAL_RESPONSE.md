# EduTech Brasil LMS Infrastructure – IDEAL Implementation

The LMS stack is delivered with CDK for Terraform (CDKTF) using Python and targets a containerized workload on AWS Fargate. The implementation below captures the production-ready architecture with secure networking, encrypted storage, and consistent tagging.

## Architecture Highlights
- Parameterized stack that derives unique resource names via deterministic suffixing.
- Multi-AZ VPC layout with public and private subnets, NAT gateway, and dedicated route tables.
- Encrypted storage across EFS and ElastiCache with customer-managed AWS KMS keys.
- IAM roles scoped for task execution, secrets access, logging, and EFS integration.
- ECS service configured for Fargate, CloudWatch logging, and access to Redis and shared storage.
- Terraform outputs exposing identifiers for downstream automation and validation.

## lib/tap_stack.py

```python
"""
EduTech Brasil LMS Infrastructure Stack
CDKTF Python implementation for containerized LMS deployment
"""

from constructs import Construct
from cdktf import TerraformStack, TerraformOutput, Fn
from cdktf_cdktf_provider_aws.provider import AwsProvider
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.efs_file_system import EfsFileSystem, EfsFileSystemLifecyclePolicy
from cdktf_cdktf_provider_aws.efs_mount_target import EfsMountTarget
from cdktf_cdktf_provider_aws.elasticache_subnet_group import ElasticacheSubnetGroup
from cdktf_cdktf_provider_aws.elasticache_replication_group import ElasticacheReplicationGroup
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret import DataAwsSecretsmanagerSecret
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret_version import DataAwsSecretsmanagerSecretVersion
import json
import uuid


class TapStack(TerraformStack):
    """
    EduTech Brasil LMS Infrastructure Stack

    Deploys containerized LMS using ECS Fargate with:
    - ElastiCache Redis for session management
    - EFS for shared content storage
    - Multi-AZ high availability
    - Encryption at rest and in transit
    """

    def __init__(self, scope: Construct, id: str, environment_suffix: str,
                 state_bucket: str = None, state_bucket_region: str = None,
                 aws_region: str = None, default_tags: dict = None):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.region = aws_region if aws_region else "sa-east-1"
        self.common_tags = {
            "environment": "production",
            "project": "edutechbr-lms",
            "managed_by": "cdktf"
        }

        unique_token = uuid.uuid4().hex[:8]
        self.unique_suffix = f"{environment_suffix}-{unique_token}"

        # Merge default tags if provided
        if default_tags and "tags" in default_tags:
            self.common_tags.update(default_tags["tags"])

        # AWS Provider
        AwsProvider(self, "aws",
            region=self.region
        )

        # Get availability zones
        self.azs = DataAwsAvailabilityZones(self, "available",
            state="available"
        )

        # Create VPC and networking
        self._create_vpc()

        # Create KMS encryption keys
        self._create_kms_keys()

        # Create security groups
        self._create_security_groups()

        # Create EFS file system
        self._create_efs()

        # Create ElastiCache Redis
        self._create_elasticache()

        # Create IAM roles
        self._create_iam_roles()

        # Create CloudWatch log group
        self._create_cloudwatch_logs()

        # Create ECS cluster and service
        self._create_ecs()

        # Create outputs
        self._create_outputs()

    def _id(self, base: str) -> str:
        return f"{base}-{self.unique_suffix}"

    def _tags(self, base: str, extra: dict | None = None) -> dict:
        tags = {k: v for k, v in self.common_tags.items() if k.lower() != "name"}
        tags["Name"] = self._id(base)
        if extra:
            tags.update(extra)
        return tags

    def _create_vpc(self):
        """Create VPC with public and private subnets across multiple AZs"""

        # VPC
        self.vpc = Vpc(self, self._id("vpc"),
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags=self._tags("lms-vpc")
        )

        # Internet Gateway
        self.igw = InternetGateway(self, self._id("igw"),
            vpc_id=self.vpc.id,
            tags=self._tags("lms-igw")
        )

        # Public and Private Subnets (2 AZs for HA)
        self.public_subnets = []
        self.private_subnets = []

        for i in range(2):
            # Public subnet
            public_subnet = Subnet(self, self._id(f"public-subnet-{i}"),
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                map_public_ip_on_launch=True,
                tags=self._tags(f"lms-public-subnet-{i}", {"Type": "public"})
            )
            self.public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = Subnet(self, self._id(f"private-subnet-{i}"),
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                tags=self._tags(f"lms-private-subnet-{i}", {"Type": "private"})
            )
            self.private_subnets.append(private_subnet)

        # Public route table
        self.public_rt = RouteTable(self, self._id("public-rt"),
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id
            )],
            tags=self._tags("lms-public-rt")
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(self, self._id(f"public-rta-{i}"),
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id
            )

        # Create Elastic IP for NAT Gateway
        self.eip = Eip(self, self._id("nat-eip"),
            domain="vpc",
            tags=self._tags("lms-nat-eip")
        )

        # Create NAT Gateway in the first public subnet
        self.nat_gateway = NatGateway(self, self._id("nat-gateway"),
            allocation_id=self.eip.id,
            subnet_id=self.public_subnets[0].id,
            tags=self._tags("lms-nat-gateway")
        )

        # Private route table with route to NAT Gateway
        self.private_rt = RouteTable(self, self._id("private-rt"),
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                nat_gateway_id=self.nat_gateway.id
            )],
            tags=self._tags("lms-private-rt")
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            RouteTableAssociation(self, self._id(f"private-rta-{i}"),
                subnet_id=subnet.id,
                route_table_id=self.private_rt.id
            )

    def _create_kms_keys(self):
        """Create KMS keys for encryption"""

        # KMS key for EFS
        self.efs_kms_key = KmsKey(self, self._id("efs-kms"),
            description=f"KMS key for EFS encryption - {self.unique_suffix}",
            enable_key_rotation=True,
            tags=self._tags("lms-efs-kms")
        )

        KmsAlias(self, self._id("efs-kms-alias"),
            name=f"alias/{self._id('lms-efs')}",
            target_key_id=self.efs_kms_key.key_id
        )

        # KMS key for ElastiCache
        self.elasticache_kms_key = KmsKey(self, self._id("elasticache-kms"),
            description=f"KMS key for ElastiCache encryption - {self.unique_suffix}",
            enable_key_rotation=True,
            tags=self._tags("lms-elasticache-kms")
        )

        KmsAlias(self, self._id("elasticache-kms-alias"),
            name=f"alias/{self._id('lms-elasticache')}",
            target_key_id=self.elasticache_kms_key.key_id
        )

    def _create_security_groups(self):
        """Create security groups for ECS, EFS, and ElastiCache"""

        # ECS Tasks Security Group
        self.ecs_sg = SecurityGroup(self, self._id("ecs-sg"),
            vpc_id=self.vpc.id,
            description="Security group for ECS tasks",
            ingress=[
                SecurityGroupIngress(
                    from_port=80,
                    to_port=80,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTP from anywhere"
                ),
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["0.0.0.0/0"],
                    description="HTTPS from anywhere"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags=self._tags("lms-ecs-sg")
        )

        # EFS Security Group
        self.efs_sg = SecurityGroup(self, self._id("efs-sg"),
            vpc_id=self.vpc.id,
            description="Security group for EFS",
            ingress=[
                SecurityGroupIngress(
                    from_port=2049,
                    to_port=2049,
                    protocol="tcp",
                    security_groups=[self.ecs_sg.id],
                    description="NFS from ECS tasks"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags=self._tags("lms-efs-sg")
        )

        # ElastiCache Security Group
        self.elasticache_sg = SecurityGroup(self, self._id("elasticache-sg"),
            vpc_id=self.vpc.id,
            description="Security group for ElastiCache Redis",
            ingress=[
                SecurityGroupIngress(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    security_groups=[self.ecs_sg.id],
                    description="Redis from ECS tasks"
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound"
                )
            ],
            tags=self._tags("lms-elasticache-sg")
        )

    def _create_efs(self):
        """Create EFS file system for shared content storage"""

        self.efs = EfsFileSystem(
            self, self._id("efs"),
            encrypted=True,
            kms_key_id=self.efs_kms_key.arn,
            performance_mode="generalPurpose",
            throughput_mode="bursting",
            lifecycle_policy=[
                EfsFileSystemLifecyclePolicy(
                    transition_to_ia="AFTER_30_DAYS",
                )
            ],
            tags=self._tags("lms-efs"),
        )

        # Create mount targets in each private subnet
        self.efs_mount_targets = []
        for i, subnet in enumerate(self.private_subnets):
            mount_target = EfsMountTarget(self, self._id(f"efs-mt-{i}"),
                file_system_id=self.efs.id,
                subnet_id=subnet.id,
                security_groups=[self.efs_sg.id]
            )
            self.efs_mount_targets.append(mount_target)

    def _create_elasticache(self):
        """Create ElastiCache Redis cluster for session management"""

        # Subnet group for ElastiCache
        self.elasticache_subnet_group = ElasticacheSubnetGroup(
            self, self._id("elasticache-subnet-group"),
            name=self._id("lms-redis-subnet-group"),
            description="Subnet group for LMS Redis cluster",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags=self._tags("lms-redis-subnet-group")
        )

        # ElastiCache Redis replication group
        self.elasticache = ElasticacheReplicationGroup(
            self, self._id("elasticache"),
            replication_group_id=self._id("lms-redis"),
            description="Redis cluster for LMS session management",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=2,
            port=6379,
            parameter_group_name="default.redis7",
            subnet_group_name=self.elasticache_subnet_group.name,
            security_group_ids=[self.elasticache_sg.id],
            at_rest_encryption_enabled="true",
            kms_key_id=self.elasticache_kms_key.arn,
            transit_encryption_enabled=True,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            maintenance_window="mon:05:00-mon:07:00",
            auto_minor_version_upgrade="true",
            tags=self._tags("lms-redis")
        )

    def _create_iam_roles(self):
        """Create IAM roles for ECS tasks"""

        # ECS Task Execution Role
        self.task_execution_role = IamRole(self, self._id("ecs-task-exec-role"),
            name=self._id("lms-ecs-task-exec-role"),
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        # Attach AWS managed policy for ECS task execution
        IamRolePolicyAttachment(self, self._id("ecs-task-exec-policy"),
            role=self.task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Custom policy for Secrets Manager access
        IamRolePolicy(self, self._id("ecs-secrets-policy"),
            role=self.task_execution_role.id,
            name=self._id("lms-secrets-policy"),
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": f"arn:aws:secretsmanager:{self.region}:*:secret:*"
                }, {
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*"
                }]
            })
        )

        # ECS Task Role
        self.task_role = IamRole(self, self._id("ecs-task-role"),
            name=self._id("lms-ecs-task-role"),
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "ecs-tasks.amazonaws.com"
                    },
                    "Action": "sts:AssumeRole"
                }]
            })
        )

        # Task role policy for EFS and other AWS services
        IamRolePolicy(self, self._id("ecs-task-policy"),
            role=self.task_role.id,
            name=self._id("lms-task-policy"),
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "elasticfilesystem:ClientMount",
                        "elasticfilesystem:ClientWrite",
                        "elasticfilesystem:DescribeFileSystems"
                    ],
                    "Resource": self.efs.arn
                }, {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": "*"
                }]
            })
        )

    def _create_cloudwatch_logs(self):
        """Create CloudWatch log group for ECS container logs"""

        self.log_group = CloudwatchLogGroup(self, self._id("ecs-log-group"),
            name=f"/ecs/{self._id('lms')}",
            retention_in_days=7,
            tags=self._tags("lms-ecs-logs")
        )

    def _create_ecs(self):
        """Create ECS cluster, task definition, and service"""

        # ECS Cluster
        self.ecs_cluster = EcsCluster(self, self._id("ecs-cluster"),
            name=self._id("lms-cluster"),
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags=self._tags("lms-cluster")
        )

        # Task definition
        container_definitions = [{
            "name": "lms-app",
            "image": "nginx:latest",
            "cpu": 512,
            "memory": 1024,
            "essential": True,
            "portMappings": [{
                "containerPort": 80,
                "hostPort": 80,
                "protocol": "tcp"
            }],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": self.log_group.name,
                    "awslogs-region": self.region,
                    "awslogs-stream-prefix": "lms"
                }
            },
            "environment": [{
                "name": "REDIS_ENDPOINT",
                "value": self.elasticache.primary_endpoint_address
            }, {
                "name": "REDIS_PORT",
                "value": "6379"
            }, {
                "name": "EFS_MOUNT_PATH",
                "value": "/mnt/efs"
            }],
            "mountPoints": [{
                "sourceVolume": "efs-storage",
                "containerPath": "/mnt/efs",
                "readOnly": False
            }]
        }]

        self.task_definition = EcsTaskDefinition(self, self._id("ecs-task-def"),
            family=self._id("lms-task"),
            requires_compatibilities=["FARGATE"],
            network_mode="awsvpc",
            cpu="512",
            memory="1024",
            execution_role_arn=self.task_execution_role.arn,
            task_role_arn=self.task_role.arn,
            container_definitions=json.dumps(container_definitions),
            volume=[{
                "name": "efs-storage",
                "efs_volume_configuration": {
                    "file_system_id": self.efs.id,
                    "transit_encryption": "ENABLED",
                    "authorization_config": {
                        "iam": "ENABLED"
                    }
                }
            }],
            tags=self._tags("lms-task")
        )

        # ECS Service
        self.ecs_service = EcsService(self, self._id("ecs-service"),
            name=self._id("lms-service"),
            cluster=self.ecs_cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=2,
            launch_type="FARGATE",
            platform_version="LATEST",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=[subnet.id for subnet in self.private_subnets],
                security_groups=[self.ecs_sg.id],
                assign_public_ip=False
            ),
            enable_execute_command=True,
            tags=self._tags("lms-service"),
            depends_on=[self.efs_mount_targets[0], self.efs_mount_targets[1]]
        )

    def _create_outputs(self):
        """Create Terraform outputs"""

        TerraformOutput(self, "vpc_id",
            value=self.vpc.id,
            description="VPC ID"
        )

        TerraformOutput(self, "ecs_cluster_name",
            value=self.ecs_cluster.name,
            description="ECS Cluster Name"
        )

        TerraformOutput(self, "ecs_service_name",
            value=self.ecs_service.name,
            description="ECS Service Name"
        )

        TerraformOutput(self, "redis_endpoint",
            value=self.elasticache.primary_endpoint_address,
            description="Redis Primary Endpoint"
        )

        TerraformOutput(self, "efs_id",
            value=self.efs.id,
            description="EFS File System ID"
        )

        TerraformOutput(self, "efs_dns_name",
            value=self.efs.dns_name,
            description="EFS DNS Name"
        )
```

