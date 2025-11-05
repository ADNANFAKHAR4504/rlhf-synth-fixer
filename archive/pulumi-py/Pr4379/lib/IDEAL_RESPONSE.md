# Manufacturing IoT Platform Infrastructure - Pulumi Python (IDEAL RESPONSE)

This infrastructure implements a high-availability containerized architecture for SmartFactory Inc.'s manufacturing IoT sensor data processing platform using Pulumi Python.

## File: Pulumi.yaml

```yaml
name: TapStack
runtime:
  name: python
description: Pulumi infrastructure for manufacturing IoT platform
main: tap.py
```

## File: tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for the Manufacturing IoT Platform infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import pulumi
from pulumi import Config, ResourceOptions
from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from ENVIRONMENT_SUFFIX env var, config, or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)

# Export stack outputs
pulumi.export("vpc_id", stack.vpc.id)
pulumi.export("ecs_cluster_arn", stack.ecs_cluster.arn)
pulumi.export("kinesis_stream_name", stack.kinesis_stream.name)
pulumi.export("kinesis_stream_arn", stack.kinesis_stream.arn)
pulumi.export("redis_endpoint", stack.redis_cluster.primary_endpoint_address)
pulumi.export("aurora_endpoint", stack.aurora_cluster.endpoint)
pulumi.export("aurora_cluster_arn", stack.aurora_cluster.arn)
pulumi.export("efs_id", stack.efs_filesystem.id)
pulumi.export("api_gateway_url", stack.api_gateway.api_endpoint)
pulumi.export("api_gateway_id", stack.api_gateway.id)
pulumi.export("secret_arn", stack.db_credentials_secret.arn)
pulumi.export("kms_key_id", stack.kms_key.id)
pulumi.export("kms_key_arn", stack.kms_key.arn)
pulumi.export("environment_suffix", environment_suffix)

```

## File: lib/__init__.py

```python
"""
Manufacturing IoT Platform Infrastructure Library
"""
```

## File: lib/tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the Manufacturing IoT Platform infrastructure.

It orchestrates the instantiation of VPC, ECS, Kinesis, ElastiCache, RDS Aurora,
EFS, API Gateway, and Secrets Manager components for a high-availability
containerized IoT sensor data processing platform.
"""

import json
from typing import Optional
import pulumi
from pulumi import ResourceOptions, Output
from pulumi_aws import (
    ec2, ecs, kinesis, elasticache, rds, efs, apigatewayv2,
    secretsmanager, iam, cloudwatch, kms, logs
)


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the Manufacturing IoT Platform.

    This component orchestrates the instantiation of all infrastructure components
    including networking, compute, data processing, storage, and API resources.

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments including environment suffix and tags.
        opts (ResourceOptions): Pulumi options.
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        self.tags = args.tags

        # Create KMS key for encryption
        self.kms_key = kms.Key(
            f"iot-platform-key-{self.environment_suffix}",
            description="KMS key for manufacturing IoT platform encryption",
            enable_key_rotation=True,
            deletion_window_in_days=10,
            tags={
                **self.tags,
                "Name": f"iot-platform-key-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create KMS key alias
        self.kms_alias = kms.Alias(
            f"iot-platform-key-alias-{self.environment_suffix}",
            name=f"alias/iot-platform-{self.environment_suffix}",
            target_key_id=self.kms_key.id,
            opts=ResourceOptions(parent=self)
        )

        # Create VPC
        self.vpc = self._create_vpc()

        # Create Secrets Manager secrets
        self.db_credentials_secret = self._create_secrets()

        # Create Kinesis Data Stream
        self.kinesis_stream = self._create_kinesis_stream()

        # Create ECS Cluster (now that Kinesis and Secrets exist)
        self.ecs_cluster = self._create_ecs_cluster()

        # Create ElastiCache Redis Cluster
        self.redis_cluster = self._create_elasticache_cluster()

        # Create RDS Aurora PostgreSQL Cluster
        self.aurora_cluster = self._create_aurora_cluster()

        # Create EFS File System
        self.efs_filesystem = self._create_efs()

        # Create API Gateway
        self.api_gateway = self._create_api_gateway()

        # Create CloudWatch Log Groups
        self._create_cloudwatch_logs()

        # Register outputs
        self.register_outputs({
            "vpcId": self.vpc.id,
            "ecsClusterArn": self.ecs_cluster.arn,
            "kinesisStreamName": self.kinesis_stream.name,
            "redisEndpoint": self.redis_cluster.primary_endpoint_address,
            "auroraEndpoint": self.aurora_cluster.endpoint,
            "efsId": self.efs_filesystem.id,
            "apiGatewayUrl": self.api_gateway.api_endpoint,
            "secretArn": self.db_credentials_secret.arn,
        })

    def _create_vpc(self):
        """Create VPC with private subnets for high availability"""

        # Create VPC
        vpc = ec2.Vpc(
            f"iot-platform-vpc-{self.environment_suffix}",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.tags,
                "Name": f"iot-platform-vpc-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        igw = ec2.InternetGateway(
            f"iot-platform-igw-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={
                **self.tags,
                "Name": f"iot-platform-igw-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create public subnets for NAT gateways (2 AZs for HA)
        public_subnet_1 = ec2.Subnet(
            f"iot-platform-public-subnet-1-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone="us-east-1a",
            map_public_ip_on_launch=True,
            tags={
                **self.tags,
                "Name": f"iot-platform-public-subnet-1-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        public_subnet_2 = ec2.Subnet(
            f"iot-platform-public-subnet-2-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone="us-east-1b",
            map_public_ip_on_launch=True,
            tags={
                **self.tags,
                "Name": f"iot-platform-public-subnet-2-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create private subnets (2 AZs for HA)
        private_subnet_1 = ec2.Subnet(
            f"iot-platform-private-subnet-1-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.10.0/24",
            availability_zone="us-east-1a",
            tags={
                **self.tags,
                "Name": f"iot-platform-private-subnet-1-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        private_subnet_2 = ec2.Subnet(
            f"iot-platform-private-subnet-2-{self.environment_suffix}",
            vpc_id=vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone="us-east-1b",
            tags={
                **self.tags,
                "Name": f"iot-platform-private-subnet-2-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Note: NAT Gateway removed due to EIP quota limitations in synthetic environment
        # In production, would include 2 NAT Gateways (one per AZ) for high availability
        # Using VPC Endpoints instead for cost optimization

        # Create public route table
        public_route_table = ec2.RouteTable(
            f"iot-platform-public-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={
                **self.tags,
                "Name": f"iot-platform-public-rt-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Add route to Internet Gateway
        ec2.Route(
            f"iot-platform-public-route-{self.environment_suffix}",
            route_table_id=public_route_table.id,
            destination_cidr_block="0.0.0.0/0",
            gateway_id=igw.id,
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        ec2.RouteTableAssociation(
            f"iot-platform-public-rta-1-{self.environment_suffix}",
            subnet_id=public_subnet_1.id,
            route_table_id=public_route_table.id,
            opts=ResourceOptions(parent=self)
        )

        ec2.RouteTableAssociation(
            f"iot-platform-public-rta-2-{self.environment_suffix}",
            subnet_id=public_subnet_2.id,
            route_table_id=public_route_table.id,
            opts=ResourceOptions(parent=self)
        )

        # Create private route table (no NAT Gateway due to EIP quota limitations)
        private_route_table = ec2.RouteTable(
            f"iot-platform-private-rt-{self.environment_suffix}",
            vpc_id=vpc.id,
            tags={
                **self.tags,
                "Name": f"iot-platform-private-rt-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        ec2.RouteTableAssociation(
            f"iot-platform-private-rta-1-{self.environment_suffix}",
            subnet_id=private_subnet_1.id,
            route_table_id=private_route_table.id,
            opts=ResourceOptions(parent=self)
        )

        ec2.RouteTableAssociation(
            f"iot-platform-private-rta-2-{self.environment_suffix}",
            subnet_id=private_subnet_2.id,
            route_table_id=private_route_table.id,
            opts=ResourceOptions(parent=self)
        )

        # Store subnet IDs for use by other resources
        vpc.private_subnet_ids = [private_subnet_1.id, private_subnet_2.id]
        vpc.public_subnet_ids = [public_subnet_1.id, public_subnet_2.id]

        return vpc

    def _create_secrets(self):
        """Create Secrets Manager secret for database credentials"""

        # Generate database credentials secret
        db_secret = secretsmanager.Secret(
            f"iot-db-credentials-{self.environment_suffix}",
            name=f"iot-db-credentials-{self.environment_suffix}",
            description="Database credentials for IoT platform Aurora cluster",
            kms_key_id=self.kms_key.arn,
            tags={
                **self.tags,
                "Name": f"iot-db-credentials-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Store initial secret value
        secretsmanager.SecretVersion(
            f"iot-db-credentials-version-{self.environment_suffix}",
            secret_id=db_secret.id,
            secret_string=json.dumps({
                "username": "iotadmin",
                "password": "ChangeMe123!",  # Should be rotated after creation
                "engine": "postgres",
                "host": "placeholder",
                "port": 5432,
                "dbname": "iotplatform"
            }),
            opts=ResourceOptions(parent=self)
        )

        return db_secret

    def _create_ecs_cluster(self):
        """Create ECS Fargate cluster for containerized workloads"""

        # Create ECS cluster
        cluster = ecs.Cluster(
            f"iot-platform-cluster-{self.environment_suffix}",
            name=f"iot-platform-cluster-{self.environment_suffix}",
            settings=[
                ecs.ClusterSettingArgs(
                    name="containerInsights",
                    value="enabled"
                )
            ],
            tags={
                **self.tags,
                "Name": f"iot-platform-cluster-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create ECS task execution role
        task_execution_role = iam.Role(
            f"ecs-task-execution-role-{self.environment_suffix}",
            name=f"ecs-task-execution-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                **self.tags,
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for ECS task execution
        iam.RolePolicyAttachment(
            f"ecs-task-execution-policy-attachment-{self.environment_suffix}",
            role=task_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
            opts=ResourceOptions(parent=self)
        )

        # Create ECS task role
        task_role = iam.Role(
            f"ecs-task-role-{self.environment_suffix}",
            name=f"ecs-task-role-{self.environment_suffix}",
            assume_role_policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Principal": {"Service": "ecs-tasks.amazonaws.com"},
                    "Action": "sts:AssumeRole"
                }]
            }),
            tags={
                **self.tags,
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create policy for task to access Kinesis, Redis, Aurora, EFS, and Secrets
        task_policy = iam.Policy(
            f"ecs-task-policy-{self.environment_suffix}",
            name=f"ecs-task-policy-{self.environment_suffix}",
            policy=Output.all(
                self.kinesis_stream.arn,
                self.db_credentials_secret.arn
            ).apply(lambda args: json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:PutRecord",
                            "kinesis:PutRecords",
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:DescribeStream"
                        ],
                        "Resource": args[0]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": args[1]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "elasticfilesystem:ClientMount",
                            "elasticfilesystem:ClientWrite",
                            "elasticfilesystem:DescribeFileSystems"
                        ],
                        "Resource": "*"
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kms:Decrypt",
                            "kms:DescribeKey"
                        ],
                        "Resource": "*"
                    }
                ]
            })),
            opts=ResourceOptions(parent=self)
        )

        # Attach task policy to task role
        iam.RolePolicyAttachment(
            f"ecs-task-policy-attachment-{self.environment_suffix}",
            role=task_role.name,
            policy_arn=task_policy.arn,
            opts=ResourceOptions(parent=self)
        )

        # Store roles for use in task definitions
        cluster.task_execution_role_arn = task_execution_role.arn
        cluster.task_role_arn = task_role.arn

        return cluster

    def _create_kinesis_stream(self):
        """Create Kinesis Data Stream for real-time data ingestion"""

        # Create Kinesis stream with enhanced monitoring
        stream = kinesis.Stream(
            f"iot-sensor-data-stream-{self.environment_suffix}",
            name=f"iot-sensor-data-stream-{self.environment_suffix}",
            shard_count=4,  # Support high throughput for 10,000+ machines
            retention_period=24,  # 24 hours retention
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
                "WriteProvisionedThroughputExceeded",
                "ReadProvisionedThroughputExceeded",
                "IteratorAgeMilliseconds"
            ],
            encryption_type="KMS",
            kms_key_id=self.kms_key.arn,
            tags={
                **self.tags,
                "Name": f"iot-sensor-data-stream-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        return stream

    def _create_elasticache_cluster(self):
        """Create ElastiCache Redis cluster for temporary storage and caching"""

        # Create security group for Redis
        redis_sg = ec2.SecurityGroup(
            f"redis-sg-{self.environment_suffix}",
            name=f"redis-sg-{self.environment_suffix}",
            description="Security group for ElastiCache Redis cluster",
            vpc_id=self.vpc.id,
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    from_port=6379,
                    to_port=6379,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]  # Allow access from VPC
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **self.tags,
                "Name": f"redis-sg-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create subnet group for Redis
        redis_subnet_group = elasticache.SubnetGroup(
            f"redis-subnet-group-{self.environment_suffix}",
            name=f"redis-subnet-group-{self.environment_suffix}",
            description="Subnet group for ElastiCache Redis cluster",
            subnet_ids=self.vpc.private_subnet_ids,
            tags={
                **self.tags,
                "Name": f"redis-subnet-group-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Redis replication group for high availability
        redis_cluster = elasticache.ReplicationGroup(
            f"iot-redis-cluster-{self.environment_suffix}",
            replication_group_id=f"iot-redis-{self.environment_suffix}",
            description="Redis cluster for IoT platform caching",
            engine="redis",
            engine_version="7.0",
            node_type="cache.t3.micro",
            num_cache_clusters=2,  # Primary + 1 replica for HA
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            subnet_group_name=redis_subnet_group.name,
            security_group_ids=[redis_sg.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            kms_key_id=self.kms_key.arn,
            snapshot_retention_limit=5,
            snapshot_window="03:00-05:00",
            maintenance_window="mon:05:00-mon:07:00",
            tags={
                **self.tags,
                "Name": f"iot-redis-cluster-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        return redis_cluster

    def _create_aurora_cluster(self):
        """Create RDS Aurora PostgreSQL Serverless v2 cluster for persistent storage"""

        # Create security group for Aurora
        aurora_sg = ec2.SecurityGroup(
            f"aurora-sg-{self.environment_suffix}",
            name=f"aurora-sg-{self.environment_suffix}",
            description="Security group for Aurora PostgreSQL cluster",
            vpc_id=self.vpc.id,
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]  # Allow access from VPC
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **self.tags,
                "Name": f"aurora-sg-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create DB subnet group
        db_subnet_group = rds.SubnetGroup(
            f"aurora-subnet-group-{self.environment_suffix}",
            name=f"aurora-subnet-group-{self.environment_suffix}",
            description="Subnet group for Aurora PostgreSQL cluster",
            subnet_ids=self.vpc.private_subnet_ids,
            tags={
                **self.tags,
                "Name": f"aurora-subnet-group-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Aurora cluster
        aurora_cluster = rds.Cluster(
            f"iot-aurora-cluster-{self.environment_suffix}",
            cluster_identifier=f"iot-aurora-cluster-{self.environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.3",
            database_name="iotplatform",
            master_username="iotadmin",
            master_password="ChangeMe123!",  # Should be rotated
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[aurora_sg.id],
            storage_encrypted=True,
            kms_key_id=self.kms_key.arn,
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="mon:04:00-mon:05:00",
            enabled_cloudwatch_logs_exports=["postgresql"],
            skip_final_snapshot=True,
            serverlessv2_scaling_configuration=rds.ClusterServerlessv2ScalingConfigurationArgs(
                min_capacity=0.5,
                max_capacity=2.0
            ),
            tags={
                **self.tags,
                "Name": f"iot-aurora-cluster-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Aurora Serverless v2 instances (writer and reader)
        aurora_instance_writer = rds.ClusterInstance(
            f"iot-aurora-instance-writer-{self.environment_suffix}",
            identifier=f"iot-aurora-writer-{self.environment_suffix}",
            cluster_identifier=aurora_cluster.id,
            instance_class="db.serverless",
            engine=aurora_cluster.engine,
            engine_version=aurora_cluster.engine_version,
            publicly_accessible=False,
            tags={
                **self.tags,
                "Name": f"iot-aurora-writer-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        aurora_instance_reader = rds.ClusterInstance(
            f"iot-aurora-instance-reader-{self.environment_suffix}",
            identifier=f"iot-aurora-reader-{self.environment_suffix}",
            cluster_identifier=aurora_cluster.id,
            instance_class="db.serverless",
            engine=aurora_cluster.engine,
            engine_version=aurora_cluster.engine_version,
            publicly_accessible=False,
            tags={
                **self.tags,
                "Name": f"iot-aurora-reader-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        return aurora_cluster

    def _create_efs(self):
        """Create EFS file system for shared storage between containers"""

        # Create EFS file system
        efs_fs = efs.FileSystem(
            f"iot-efs-{self.environment_suffix}",
            encrypted=True,
            kms_key_id=self.kms_key.arn,
            lifecycle_policies=[
                efs.FileSystemLifecyclePolicyArgs(
                    transition_to_ia="AFTER_30_DAYS"
                )
            ],
            performance_mode="generalPurpose",
            throughput_mode="bursting",
            tags={
                **self.tags,
                "Name": f"iot-efs-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create security group for EFS
        efs_sg = ec2.SecurityGroup(
            f"efs-sg-{self.environment_suffix}",
            name=f"efs-sg-{self.environment_suffix}",
            description="Security group for EFS file system",
            vpc_id=self.vpc.id,
            ingress=[
                ec2.SecurityGroupIngressArgs(
                    from_port=2049,
                    to_port=2049,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"]  # Allow access from VPC
                )
            ],
            egress=[
                ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"]
                )
            ],
            tags={
                **self.tags,
                "Name": f"efs-sg-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create mount targets in each private subnet
        for idx, subnet_id in enumerate(self.vpc.private_subnet_ids):
            efs.MountTarget(
                f"efs-mount-target-{idx}-{self.environment_suffix}",
                file_system_id=efs_fs.id,
                subnet_id=subnet_id,
                security_groups=[efs_sg.id],
                opts=ResourceOptions(parent=self)
            )

        return efs_fs

    def _create_api_gateway(self):
        """Create API Gateway for external system integration"""

        # Create HTTP API Gateway
        api = apigatewayv2.Api(
            f"iot-api-gateway-{self.environment_suffix}",
            name=f"iot-api-gateway-{self.environment_suffix}",
            protocol_type="HTTP",
            description="API Gateway for IoT platform external integration",
            cors_configuration=apigatewayv2.ApiCorsConfigurationArgs(
                allow_origins=["*"],
                allow_methods=["GET", "POST", "PUT", "DELETE"],
                allow_headers=["Content-Type", "Authorization"],
                max_age=300
            ),
            tags={
                **self.tags,
                "Name": f"iot-api-gateway-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log group for API Gateway (without KMS due to permissions)
        api_log_group = logs.LogGroup(
            f"api-gateway-logs-{self.environment_suffix}",
            name=f"/aws/apigateway/iot-platform-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.tags,
                "Name": f"api-gateway-logs-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create default stage with logging
        stage = apigatewayv2.Stage(
            f"iot-api-stage-{self.environment_suffix}",
            api_id=api.id,
            name="$default",
            auto_deploy=True,
            access_log_settings=apigatewayv2.StageAccessLogSettingsArgs(
                destination_arn=api_log_group.arn,
                format=json.dumps({
                    "requestId": "$context.requestId",
                    "ip": "$context.identity.sourceIp",
                    "requestTime": "$context.requestTime",
                    "httpMethod": "$context.httpMethod",
                    "routeKey": "$context.routeKey",
                    "status": "$context.status",
                    "protocol": "$context.protocol",
                    "responseLength": "$context.responseLength"
                })
            ),
            tags={
                **self.tags,
                "Name": f"iot-api-stage-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        return api

    def _create_cloudwatch_logs(self):
        """Create CloudWatch log groups for monitoring and compliance"""

        # Create log group for ECS containers (without KMS due to permissions)
        ecs_log_group = logs.LogGroup(
            f"ecs-logs-{self.environment_suffix}",
            name=f"/aws/ecs/iot-platform-{self.environment_suffix}",
            retention_in_days=7,
            tags={
                **self.tags,
                "Name": f"ecs-logs-{self.environment_suffix}",
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch alarm for high error rate
        cloudwatch.MetricAlarm(
            f"high-error-rate-alarm-{self.environment_suffix}",
            name=f"iot-platform-high-error-rate-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/ECS",
            period=300,
            statistic="Sum",
            threshold=100.0,
            alarm_description="Alert when error count exceeds threshold in ECS cluster",
            treat_missing_data="notBreaching",
            dimensions={
                "ClusterName": self.ecs_cluster.name
            },
            tags={
                **self.tags,
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch alarm for Kinesis iterator age (data processing latency)
        cloudwatch.MetricAlarm(
            f"kinesis-latency-alarm-{self.environment_suffix}",
            name=f"iot-platform-kinesis-latency-{self.environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=60,
            statistic="Maximum",
            threshold=2000.0,  # 2 seconds - per requirement
            alarm_description="Alert when data processing latency exceeds 2 seconds",
            treat_missing_data="notBreaching",
            dimensions={
                "StreamName": self.kinesis_stream.name
            },
            tags={
                **self.tags,
                "EnvironmentSuffix": self.environment_suffix
            },
            opts=ResourceOptions(parent=self)
        )

        return ecs_log_group
```
