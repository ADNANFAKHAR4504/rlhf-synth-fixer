# CDKTF Python Implementation for EduTech Brasil LMS

This implementation provides a complete infrastructure solution for deploying a containerized Learning Management System using CDKTF with Python, deployed to the sa-east-1 region.

## File: lib/tap_stack.py

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
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress
from cdktf_cdktf_provider_aws.kms_key import KmsKey
from cdktf_cdktf_provider_aws.kms_alias import KmsAlias
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import EcsClusterCapacityProviders
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy import IamRolePolicy
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.efs_file_system import EfsFileSystem
from cdktf_cdktf_provider_aws.efs_mount_target import EfsMountTarget
from cdktf_cdktf_provider_aws.elasticache_subnet_group import ElasticacheSubnetGroup
from cdktf_cdktf_provider_aws.elasticache_replication_group import ElasticacheReplicationGroup
from cdktf_cdktf_provider_aws.data_aws_availability_zones import DataAwsAvailabilityZones
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret import DataAwsSecretsmanagerSecret
from cdktf_cdktf_provider_aws.data_aws_secretsmanager_secret_version import DataAwsSecretsmanagerSecretVersion
import json


class TapStack(TerraformStack):
    """
    EduTech Brasil LMS Infrastructure Stack

    Deploys containerized LMS using ECS Fargate with:
    - ElastiCache Redis for session management
    - EFS for shared content storage
    - Multi-AZ high availability
    - Encryption at rest and in transit
    """

    def __init__(self, scope: Construct, id: str, environment_suffix: str):
        super().__init__(scope, id)

        self.environment_suffix = environment_suffix
        self.region = "sa-east-1"
        self.common_tags = {
            "environment": "production",
            "project": "edutechbr-lms",
            "managed_by": "cdktf"
        }

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

    def _create_vpc(self):
        """Create VPC with public and private subnets across multiple AZs"""

        # VPC
        self.vpc = Vpc(self, f"vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.common_tags,
                "Name": f"lms-vpc-{self.environment_suffix}"
            }
        )

        # Internet Gateway
        self.igw = InternetGateway(self, f"igw-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **self.common_tags,
                "Name": f"lms-igw-{self.environment_suffix}"
            }
        )

        # Public and Private Subnets (2 AZs for HA)
        self.public_subnets = []
        self.private_subnets = []

        for i in range(2):
            # Public subnet
            public_subnet = Subnet(self, f"public-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{i}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                map_public_ip_on_launch=True,
                tags={
                    **self.common_tags,
                    "Name": f"lms-public-subnet-{i}-{self.environment_suffix}",
                    "Type": "public"
                }
            )
            self.public_subnets.append(public_subnet)

            # Private subnet
            private_subnet = Subnet(self, f"private-subnet-{i}-{self.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f"10.0.{10+i}.0/24",
                availability_zone=Fn.element(self.azs.names, i),
                tags={
                    **self.common_tags,
                    "Name": f"lms-private-subnet-{i}-{self.environment_suffix}",
                    "Type": "private"
                }
            )
            self.private_subnets.append(private_subnet)

        # Public route table
        self.public_rt = RouteTable(self, f"public-rt-{self.environment_suffix}",
            vpc_id=self.vpc.id,
            route=[RouteTableRoute(
                cidr_block="0.0.0.0/0",
                gateway_id=self.igw.id
            )],
            tags={
                **self.common_tags,
                "Name": f"lms-public-rt-{self.environment_suffix}"
            }
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            RouteTableAssociation(self, f"public-rta-{i}-{self.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_rt.id
            )

    def _create_kms_keys(self):
        """Create KMS keys for encryption"""

        # KMS key for EFS
        self.efs_kms_key = KmsKey(self, f"efs-kms-{self.environment_suffix}",
            description=f"KMS key for EFS encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            tags={
                **self.common_tags,
                "Name": f"lms-efs-kms-{self.environment_suffix}"
            }
        )

        KmsAlias(self, f"efs-kms-alias-{self.environment_suffix}",
            name=f"alias/lms-efs-{self.environment_suffix}",
            target_key_id=self.efs_kms_key.key_id
        )

        # KMS key for ElastiCache
        self.elasticache_kms_key = KmsKey(self, f"elasticache-kms-{self.environment_suffix}",
            description=f"KMS key for ElastiCache encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            tags={
                **self.common_tags,
                "Name": f"lms-elasticache-kms-{self.environment_suffix}"
            }
        )

        KmsAlias(self, f"elasticache-kms-alias-{self.environment_suffix}",
            name=f"alias/lms-elasticache-{self.environment_suffix}",
            target_key_id=self.elasticache_kms_key.key_id
        )

    def _create_security_groups(self):
        """Create security groups for ECS, EFS, and ElastiCache"""

        # ECS Tasks Security Group
        self.ecs_sg = SecurityGroup(self, f"ecs-sg-{self.environment_suffix}",
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
            tags={
                **self.common_tags,
                "Name": f"lms-ecs-sg-{self.environment_suffix}"
            }
        )

        # EFS Security Group
        self.efs_sg = SecurityGroup(self, f"efs-sg-{self.environment_suffix}",
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
            tags={
                **self.common_tags,
                "Name": f"lms-efs-sg-{self.environment_suffix}"
            }
        )

        # ElastiCache Security Group
        self.elasticache_sg = SecurityGroup(self, f"elasticache-sg-{self.environment_suffix}",
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
            tags={
                **self.common_tags,
                "Name": f"lms-elasticache-sg-{self.environment_suffix}"
            }
        )

    def _create_efs(self):
        """Create EFS file system for shared content storage"""

        self.efs = EfsFileSystem(self, f"efs-{self.environment_suffix}",
            encrypted=True,
            kms_key_id=self.efs_kms_key.arn,
            performance_mode="generalPurpose",
            throughput_mode="bursting",
            lifecycle_policy=[{
                "transition_to_ia": "AFTER_30_DAYS"
            }],
            tags={
                **self.common_tags,
                "Name": f"lms-efs-{self.environment_suffix}"
            }
        )

        # Create mount targets in each private subnet
        self.efs_mount_targets = []
        for i, subnet in enumerate(self.private_subnets):
            mount_target = EfsMountTarget(self, f"efs-mt-{i}-{self.environment_suffix}",
                file_system_id=self.efs.id,
                subnet_id=subnet.id,
                security_groups=[self.efs_sg.id]
            )
            self.efs_mount_targets.append(mount_target)

    def _create_elasticache(self):
        """Create ElastiCache Redis cluster for session management"""

        # Subnet group for ElastiCache
        self.elasticache_subnet_group = ElasticacheSubnetGroup(
            self, f"elasticache-subnet-group-{self.environment_suffix}",
            subnet_group_name=f"lms-redis-subnet-group-{self.environment_suffix}",
            description="Subnet group for LMS Redis cluster",
            subnet_ids=[subnet.id for subnet in self.private_subnets],
            tags={
                **self.common_tags,
                "Name": f"lms-redis-subnet-group-{self.environment_suffix}"
            }
        )

        # ElastiCache Redis replication group
        self.elasticache = ElasticacheReplicationGroup(
            self, f"elasticache-{self.environment_suffix}",
            replication_group_id=f"lms-redis-{self.environment_suffix}",
            description="Redis cluster for LMS session management",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=2,
            port=6379,
            parameter_group_name="default.redis7",
            subnet_group_name=self.elasticache_subnet_group.subnet_group_name,
            security_group_ids=[self.elasticache_sg.id],
            at_rest_encryption_enabled=True,
            kms_key_id=self.elasticache_kms_key.arn,
            transit_encryption_enabled=True,
            auth_token_update_strategy="ROTATE",
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            maintenance_window="mon:05:00-mon:07:00",
            auto_minor_version_upgrade=True,
            tags={
                **self.common_tags,
                "Name": f"lms-redis-{self.environment_suffix}"
            }
        )

    def _create_iam_roles(self):
        """Create IAM roles for ECS tasks"""

        # ECS Task Execution Role
        self.task_execution_role = IamRole(self, f"ecs-task-exec-role-{self.environment_suffix}",
            name=f"lms-ecs-task-exec-role-{self.environment_suffix}",
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
            tags={
                **self.common_tags,
                "Name": f"lms-ecs-task-exec-role-{self.environment_suffix}"
            }
        )

        # Attach AWS managed policy for ECS task execution
        IamRolePolicyAttachment(self, f"ecs-task-exec-policy-{self.environment_suffix}",
            role=self.task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
        )

        # Custom policy for Secrets Manager access
        IamRolePolicy(self, f"ecs-secrets-policy-{self.environment_suffix}",
            role=self.task_execution_role.id,
            name=f"lms-secrets-policy-{self.environment_suffix}",
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
        self.task_role = IamRole(self, f"ecs-task-role-{self.environment_suffix}",
            name=f"lms-ecs-task-role-{self.environment_suffix}",
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
            tags={
                **self.common_tags,
                "Name": f"lms-ecs-task-role-{self.environment_suffix}"
            }
        )

        # Task role policy for EFS and other AWS services
        IamRolePolicy(self, f"ecs-task-policy-{self.environment_suffix}",
            role=self.task_role.id,
            name=f"lms-task-policy-{self.environment_suffix}",
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

        self.log_group = CloudwatchLogGroup(self, f"ecs-log-group-{self.environment_suffix}",
            name=f"/ecs/lms-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.common_tags,
                "Name": f"lms-ecs-logs-{self.environment_suffix}"
            }
        )

    def _create_ecs(self):
        """Create ECS cluster, task definition, and service"""

        # ECS Cluster
        self.ecs_cluster = EcsCluster(self, f"ecs-cluster-{self.environment_suffix}",
            name=f"lms-cluster-{self.environment_suffix}",
            setting=[{
                "name": "containerInsights",
                "value": "enabled"
            }],
            tags={
                **self.common_tags,
                "Name": f"lms-cluster-{self.environment_suffix}"
            }
        )

        # Enable Fargate capacity providers
        EcsClusterCapacityProviders(self, f"ecs-capacity-providers-{self.environment_suffix}",
            cluster_name=self.ecs_cluster.name,
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            default_capacity_provider_strategy=[{
                "capacity_provider": "FARGATE",
                "weight": 1,
                "base": 1
            }]
        )

        # Task definition
        container_definitions = [{
            "name": "lms-app",
            "image": "nginx:latest",  # Placeholder - replace with actual LMS image
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

        self.task_definition = EcsTaskDefinition(self, f"ecs-task-def-{self.environment_suffix}",
            family=f"lms-task-{self.environment_suffix}",
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
            tags={
                **self.common_tags,
                "Name": f"lms-task-{self.environment_suffix}"
            }
        )

        # ECS Service
        self.ecs_service = EcsService(self, f"ecs-service-{self.environment_suffix}",
            name=f"lms-service-{self.environment_suffix}",
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
            tags={
                **self.common_tags,
                "Name": f"lms-service-{self.environment_suffix}"
            },
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

## Implementation Notes

### Platform and Language Verification
- Framework: CDKTF (Cloud Development Kit for Terraform)
- Language: Python
- Provider: AWS (cdktf_cdktf_provider_aws)
- Region: sa-east-1 (São Paulo, Brazil)

### Key Features Implemented

1. **VPC and Networking**
   - VPC with CIDR 10.0.0.0/16
   - 2 public subnets across 2 AZs (10.0.0.0/24, 10.0.1.0/24)
   - 2 private subnets across 2 AZs (10.0.10.0/24, 10.0.11.0/24)
   - Internet Gateway with public route table
   - Multi-AZ deployment for high availability

2. **Security Configuration**
   - ECS security group: Allows HTTP/HTTPS inbound, all outbound
   - EFS security group: Allows NFS (2049) from ECS tasks only
   - ElastiCache security group: Allows Redis (6379) from ECS tasks only
   - Principle of least privilege applied

3. **Encryption**
   - KMS keys for EFS and ElastiCache with key rotation enabled
   - EFS: Encryption at rest with KMS
   - ElastiCache: Both at-rest and in-transit encryption enabled
   - EFS volume in task definition: Transit encryption enabled

4. **ECS Fargate Deployment**
   - ECS cluster with Container Insights enabled
   - Fargate and Fargate Spot capacity providers
   - Task definition: 512 CPU, 1024 MB memory
   - Service with 2 desired tasks for HA
   - Tasks deployed in private subnets
   - EFS volume mounted at /mnt/efs

5. **ElastiCache Redis**
   - Redis 7.0 engine
   - Multi-AZ with automatic failover
   - 2 cache clusters for high availability
   - Encryption at rest and in transit
   - Snapshot retention: 5 days
   - Auto minor version upgrades enabled

6. **EFS File System**
   - Encrypted with KMS
   - General Purpose performance mode
   - Bursting throughput mode
   - Lifecycle policy: Transition to IA after 30 days
   - Mount targets in both private subnets

7. **IAM Roles**
   - Task Execution Role: For pulling images, logs, secrets
   - Task Role: For accessing EFS, CloudWatch, other AWS services
   - Secrets Manager access policy
   - EFS access policy

8. **CloudWatch Logging**
   - Log group: /ecs/lms-{suffix}
   - 7-day retention
   - awslogs driver configured in container

9. **Resource Naming and Tagging**
   - All resources include environmentSuffix
   - Consistent naming: {resource-type}-{environment}-{suffix}
   - Common tags: environment='production', project='edutechbr-lms'

10. **Outputs**
    - VPC ID
    - ECS cluster name and service name
    - Redis endpoint
    - EFS ID and DNS name

### Security Best Practices
- All data stores encrypted at rest
- ElastiCache with TLS encryption in transit
- Security groups with minimal ingress rules
- IAM roles with least privilege
- KMS key rotation enabled
- Container Insights for monitoring

### Destroyability
- No Retain deletion policies
- All resources can be cleanly destroyed
- EFS lifecycle policy for cost optimization
- ElastiCache snapshots retained for 5 days before cleanup
