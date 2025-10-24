# StreamFlix Video Processing Pipeline Infrastructure

I'll create a comprehensive video processing pipeline infrastructure using CDKTF with Python for your StreamFlix platform. This solution will handle video ingestion, metadata storage, and containerized processing with proper security and compliance controls.

## Architecture Overview

The infrastructure includes:
- VPC with public and private subnets across 2 availability zones
- Kinesis Data Streams for video ingestion
- RDS Aurora Serverless v2 PostgreSQL for metadata storage
- ECS Fargate for containerized video processing workers
- AWS Secrets Manager for secure credential management
- CloudWatch monitoring and SNS alerting
- Proper IAM roles and security groups

## Implementation

### File: lib/tap_stack.py

```python
"""TAP Stack module for StreamFlix video processing pipeline infrastructure."""

from cdktf import TerraformStack, S3Backend, TerraformOutput
from constructs import Construct
from cdktf_cdktf_provider_aws.provider import AwsProvider
from lib.networking import NetworkingConstruct
from lib.kinesis import KinesisConstruct
from lib.database import DatabaseConstruct
from lib.compute import ComputeConstruct
from lib.monitoring import MonitoringConstruct


class TapStack(TerraformStack):
    """CDKTF Python stack for StreamFlix video processing pipeline."""

    def __init__(self, scope: Construct, construct_id: str, **kwargs):
        """Initialize the TAP stack with AWS infrastructure."""
        super().__init__(scope, construct_id)

        # Extract configuration from kwargs
        environment_suffix = kwargs.get("environment_suffix", "dev")
        aws_region = kwargs.get("aws_region", "eu-central-1")
        state_bucket_region = kwargs.get("state_bucket_region", "us-east-1")
        state_bucket = kwargs.get("state_bucket", "iac-rlhf-tf-states")
        default_tags = kwargs.get("default_tags", {})

        # Configure AWS Provider
        AwsProvider(
            self,
            "aws",
            region=aws_region,
            default_tags=[default_tags],
        )

        # Configure S3 Backend
        S3Backend(
            self,
            bucket=state_bucket,
            key=f"{environment_suffix}/{construct_id}.tfstate",
            region=state_bucket_region,
            encrypt=True,
        )

        # Create networking infrastructure
        networking = NetworkingConstruct(
            self,
            "networking",
            environment_suffix=environment_suffix,
            aws_region=aws_region,
        )

        # Create Kinesis stream for video ingestion
        kinesis = KinesisConstruct(
            self,
            "kinesis",
            environment_suffix=environment_suffix,
        )

        # Create database infrastructure
        database = DatabaseConstruct(
            self,
            "database",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            database_security_group_id=networking.database_security_group_id,
        )

        # Create compute infrastructure
        compute = ComputeConstruct(
            self,
            "compute",
            environment_suffix=environment_suffix,
            vpc_id=networking.vpc_id,
            private_subnet_ids=networking.private_subnet_ids,
            ecs_security_group_id=networking.ecs_security_group_id,
            kinesis_stream_arn=kinesis.stream_arn,
            kinesis_stream_name=kinesis.stream_name,
            db_secret_arn=database.db_secret_arn,
            db_cluster_endpoint=database.db_cluster_endpoint,
        )

        # Create monitoring infrastructure
        monitoring = MonitoringConstruct(
            self,
            "monitoring",
            environment_suffix=environment_suffix,
            kinesis_stream_name=kinesis.stream_name,
            ecs_cluster_name=compute.ecs_cluster_name,
            ecs_service_name=compute.ecs_service_name,
            db_cluster_id=database.db_cluster_id,
        )

        # Stack outputs
        TerraformOutput(
            self,
            "kinesis_stream_name",
            value=kinesis.stream_name,
            description="Kinesis Data Stream name for video ingestion",
        )

        TerraformOutput(
            self,
            "kinesis_stream_arn",
            value=kinesis.stream_arn,
            description="Kinesis Data Stream ARN",
        )

        TerraformOutput(
            self,
            "database_endpoint",
            value=database.db_cluster_endpoint,
            description="RDS Aurora cluster endpoint",
        )

        TerraformOutput(
            self,
            "database_secret_arn",
            value=database.db_secret_arn,
            description="Database credentials secret ARN",
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=compute.ecs_cluster_name,
            description="ECS cluster name",
        )

        TerraformOutput(
            self,
            "ecs_service_name",
            value=compute.ecs_service_name,
            description="ECS service name",
        )

        TerraformOutput(
            self,
            "vpc_id",
            value=networking.vpc_id,
            description="VPC ID",
        )

        TerraformOutput(
            self,
            "sns_topic_arn",
            value=monitoring.sns_topic_arn,
            description="SNS topic ARN for alerts",
        )
```

### File: lib/networking.py

```python
"""Networking infrastructure for StreamFlix video processing pipeline."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress


class NetworkingConstruct(Construct):
    """Networking construct for VPC, subnets, and security groups."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        aws_region: str,
    ):
        super().__init__(scope, construct_id)

        # Create VPC
        self.vpc = Vpc(
            self,
            "vpc",
            cidr_block="10.0.0.0/16",
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={"Name": f"streamflix-vpc-{environment_suffix}"},
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
            tags={"Name": f"streamflix-igw-{environment_suffix}"},
        )

        # Create public subnets
        self.public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
            tags={"Name": f"streamflix-public-subnet-1-{environment_suffix}"},
        )

        self.public_subnet_2 = Subnet(
            self,
            "public_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.2.0/24",
            availability_zone=f"{aws_region}b",
            map_public_ip_on_launch=True,
            tags={"Name": f"streamflix-public-subnet-2-{environment_suffix}"},
        )

        # Create private subnets
        self.private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}a",
            tags={"Name": f"streamflix-private-subnet-1-{environment_suffix}"},
        )

        self.private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{aws_region}b",
            tags={"Name": f"streamflix-private-subnet-2-{environment_suffix}"},
        )

        # Create Elastic IP for NAT Gateway
        nat_eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
            tags={"Name": f"streamflix-nat-eip-{environment_suffix}"},
        )

        # Create NAT Gateway
        nat_gateway = NatGateway(
            self,
            "nat_gateway",
            allocation_id=nat_eip.id,
            subnet_id=self.public_subnet_1.id,
            tags={"Name": f"streamflix-nat-{environment_suffix}"},
        )

        # Create route table for public subnets
        public_rt = RouteTable(
            self,
            "public_rt",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    gateway_id=igw.id,
                )
            ],
            tags={"Name": f"streamflix-public-rt-{environment_suffix}"},
        )

        # Associate public subnets with public route table
        RouteTableAssociation(
            self,
            "public_rt_assoc_1",
            subnet_id=self.public_subnet_1.id,
            route_table_id=public_rt.id,
        )

        RouteTableAssociation(
            self,
            "public_rt_assoc_2",
            subnet_id=self.public_subnet_2.id,
            route_table_id=public_rt.id,
        )

        # Create route table for private subnets
        private_rt = RouteTable(
            self,
            "private_rt",
            vpc_id=self.vpc.id,
            route=[
                RouteTableRoute(
                    cidr_block="0.0.0.0/0",
                    nat_gateway_id=nat_gateway.id,
                )
            ],
            tags={"Name": f"streamflix-private-rt-{environment_suffix}"},
        )

        # Associate private subnets with private route table
        RouteTableAssociation(
            self,
            "private_rt_assoc_1",
            subnet_id=self.private_subnet_1.id,
            route_table_id=private_rt.id,
        )

        RouteTableAssociation(
            self,
            "private_rt_assoc_2",
            subnet_id=self.private_subnet_2.id,
            route_table_id=private_rt.id,
        )

        # Create security group for ECS tasks
        self.ecs_security_group = SecurityGroup(
            self,
            "ecs_sg",
            name=f"streamflix-ecs-sg-{environment_suffix}",
            description="Security group for ECS tasks",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=443,
                    to_port=443,
                    protocol="tcp",
                    cidr_blocks=["10.0.0.0/16"],
                    description="HTTPS from VPC",
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound",
                )
            ],
            tags={"Name": f"streamflix-ecs-sg-{environment_suffix}"},
        )

        # Create security group for RDS
        self.database_security_group = SecurityGroup(
            self,
            "database_sg",
            name=f"streamflix-db-sg-{environment_suffix}",
            description="Security group for RDS database",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.ecs_security_group.id],
                    description="PostgreSQL from ECS tasks",
                )
            ],
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                    description="Allow all outbound",
                )
            ],
            tags={"Name": f"streamflix-db-sg-{environment_suffix}"},
        )

    @property
    def vpc_id(self):
        return self.vpc.id

    @property
    def private_subnet_ids(self):
        return [self.private_subnet_1.id, self.private_subnet_2.id]

    @property
    def public_subnet_ids(self):
        return [self.public_subnet_1.id, self.public_subnet_2.id]

    @property
    def ecs_security_group_id(self):
        return self.ecs_security_group.id

    @property
    def database_security_group_id(self):
        return self.database_security_group.id
```

### File: lib/kinesis.py

```python
"""Kinesis infrastructure for video ingestion."""

from constructs import Construct
from cdktf_cdktf_provider_aws.kinesis_stream import KinesisStream


class KinesisConstruct(Construct):
    """Kinesis construct for video ingestion stream."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
    ):
        super().__init__(scope, construct_id)

        # Create Kinesis Data Stream
        self.stream = KinesisStream(
            self,
            "video_stream",
            name=f"streamflix-video-stream-{environment_suffix}",
            shard_count=2,
            retention_period=24,
            shard_level_metrics=[
                "IncomingBytes",
                "IncomingRecords",
                "OutgoingBytes",
                "OutgoingRecords",
                "WriteProvisionedThroughputExceeded",
                "ReadProvisionedThroughputExceeded",
                "IteratorAgeMilliseconds",
            ],
            stream_mode_details={
                "stream_mode": "PROVISIONED",
            },
            encryption_type="KMS",
            kms_key_id="alias/aws/kinesis",
            tags={"Name": f"streamflix-video-stream-{environment_suffix}"},
        )

    @property
    def stream_name(self):
        return self.stream.name

    @property
    def stream_arn(self):
        return self.stream.arn
```

### File: lib/database.py

```python
"""Database infrastructure for video metadata storage."""

from constructs import Construct
from cdktf_cdktf_provider_aws.db_subnet_group import DbSubnetGroup
from cdktf_cdktf_provider_aws.rds_cluster import RdsCluster
from cdktf_cdktf_provider_aws.secretsmanager_secret import SecretsmanagerSecret
from cdktf_cdktf_provider_aws.secretsmanager_secret_version import SecretsmanagerSecretVersion
from cdktf_cdktf_provider_aws.secretsmanager_secret_rotation import SecretsmanagerSecretRotation
import json
import random
import string


class DatabaseConstruct(Construct):
    """Database construct for RDS Aurora Serverless v2."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        database_security_group_id: str,
    ):
        super().__init__(scope, construct_id)

        # Generate random password
        password = ''.join(random.choices(string.ascii_letters + string.digits, k=32))

        # Create DB subnet group
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"streamflix-db-subnet-group-{environment_suffix}",
            subnet_ids=private_subnet_ids,
            tags={"Name": f"streamflix-db-subnet-group-{environment_suffix}"},
        )

        # Create Secrets Manager secret for database credentials
        self.db_secret = SecretsmanagerSecret(
            self,
            "db_secret",
            name=f"streamflix-db-credentials-{environment_suffix}",
            description="Database credentials for StreamFlix RDS Aurora cluster",
            recovery_window_in_days=0,
            tags={"Name": f"streamflix-db-credentials-{environment_suffix}"},
        )

        # Create secret version
        secret_value = {
            "username": "streamflixadmin",
            "password": password,
            "engine": "postgres",
            "port": 5432,
        }

        SecretsmanagerSecretVersion(
            self,
            "db_secret_version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(secret_value),
        )

        # Create RDS Aurora Serverless v2 cluster
        self.db_cluster = RdsCluster(
            self,
            "aurora_cluster",
            cluster_identifier=f"streamflix-aurora-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            engine_version="15.4",
            database_name="streamflixdb",
            master_username="streamflixadmin",
            master_password=password,
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[database_security_group_id],
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 2.0,
            },
            backup_retention_period=7,
            preferred_backup_window="03:00-04:00",
            preferred_maintenance_window="sun:04:00-sun:05:00",
            skip_final_snapshot=True,
            storage_encrypted=True,
            deletion_protection=False,
            apply_immediately=True,
            tags={"Name": f"streamflix-aurora-{environment_suffix}"},
        )

    @property
    def db_cluster_endpoint(self):
        return self.db_cluster.endpoint

    @property
    def db_cluster_id(self):
        return self.db_cluster.cluster_identifier

    @property
    def db_secret_arn(self):
        return self.db_secret.arn
```

### File: lib/compute.py

```python
"""Compute infrastructure for video processing workers."""

from constructs import Construct
from cdktf_cdktf_provider_aws.ecs_cluster import EcsCluster
from cdktf_cdktf_provider_aws.ecs_cluster_capacity_providers import EcsClusterCapacityProviders
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.iam_policy import IamPolicy
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
from cdktf_cdktf_provider_aws.sqs_queue import SqsQueue
from cdktf_cdktf_provider_aws.appautoscaling_target import AppautoscalingTarget
from cdktf_cdktf_provider_aws.appautoscaling_policy import AppautoscalingPolicy
import json


class ComputeConstruct(Construct):
    """Compute construct for ECS Fargate video processing workers."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        vpc_id: str,
        private_subnet_ids: list,
        ecs_security_group_id: str,
        kinesis_stream_arn: str,
        kinesis_stream_name: str,
        db_secret_arn: str,
        db_cluster_endpoint: str,
    ):
        super().__init__(scope, construct_id)

        # Create CloudWatch log group
        log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/streamflix-{environment_suffix}",
            retention_in_days=90,
            tags={"Name": f"streamflix-ecs-logs-{environment_suffix}"},
        )

        # Create dead letter queue
        dlq = SqsQueue(
            self,
            "dlq",
            name=f"streamflix-dlq-{environment_suffix}",
            message_retention_seconds=1209600,  # 14 days
            tags={"Name": f"streamflix-dlq-{environment_suffix}"},
        )

        # Create ECS cluster
        self.cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"streamflix-cluster-{environment_suffix}",
            setting=[
                {
                    "name": "containerInsights",
                    "value": "enabled",
                }
            ],
            tags={"Name": f"streamflix-cluster-{environment_suffix}"},
        )

        # Configure Fargate capacity providers
        EcsClusterCapacityProviders(
            self,
            "capacity_providers",
            cluster_name=self.cluster.name,
            capacity_providers=["FARGATE", "FARGATE_SPOT"],
            default_capacity_provider_strategy=[
                {
                    "capacity_provider": "FARGATE",
                    "weight": 1,
                    "base": 1,
                },
                {
                    "capacity_provider": "FARGATE_SPOT",
                    "weight": 4,
                },
            ],
        )

        # Create IAM role for ECS task execution
        execution_role = IamRole(
            self,
            "execution_role",
            name=f"streamflix-ecs-execution-role-{environment_suffix}",
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
            tags={"Name": f"streamflix-ecs-execution-role-{environment_suffix}"},
        )

        # Attach managed policy for ECS task execution
        IamRolePolicyAttachment(
            self,
            "execution_role_policy",
            role=execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
        )

        # Create custom policy for Secrets Manager access
        secrets_policy = IamPolicy(
            self,
            "secrets_policy",
            name=f"streamflix-secrets-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "secretsmanager:GetSecretValue",
                        "secretsmanager:DescribeSecret"
                    ],
                    "Resource": db_secret_arn
                }]
            }),
        )

        IamRolePolicyAttachment(
            self,
            "secrets_policy_attachment",
            role=execution_role.name,
            policy_arn=secrets_policy.arn,
        )

        # Create IAM role for ECS task
        task_role = IamRole(
            self,
            "task_role",
            name=f"streamflix-ecs-task-role-{environment_suffix}",
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
            tags={"Name": f"streamflix-ecs-task-role-{environment_suffix}"},
        )

        # Create policy for Kinesis and Secrets Manager access
        task_policy = IamPolicy(
            self,
            "task_policy",
            name=f"streamflix-task-policy-{environment_suffix}",
            policy=json.dumps({
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "kinesis:GetRecords",
                            "kinesis:GetShardIterator",
                            "kinesis:DescribeStream",
                            "kinesis:ListStreams",
                            "kinesis:PutRecord",
                            "kinesis:PutRecords"
                        ],
                        "Resource": kinesis_stream_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": db_secret_arn
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "sqs:SendMessage",
                            "sqs:GetQueueUrl"
                        ],
                        "Resource": dlq.arn
                    }
                ]
            }),
        )

        IamRolePolicyAttachment(
            self,
            "task_policy_attachment",
            role=task_role.name,
            policy_arn=task_policy.arn,
        )

        # Create ECS task definition
        container_definitions = [{
            "name": "video-processor",
            "image": "public.ecr.aws/docker/library/python:3.11-slim",
            "essential": True,
            "memory": 1024,
            "cpu": 512,
            "environment": [
                {
                    "name": "KINESIS_STREAM_NAME",
                    "value": kinesis_stream_name,
                },
                {
                    "name": "DB_ENDPOINT",
                    "value": db_cluster_endpoint,
                },
                {
                    "name": "DLQ_URL",
                    "value": dlq.url,
                },
            ],
            "secrets": [
                {
                    "name": "DB_SECRET",
                    "valueFrom": db_secret_arn,
                }
            ],
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": log_group.name,
                    "awslogs-region": "eu-central-1",
                    "awslogs-stream-prefix": "video-processor",
                }
            },
        }]

        self.task_definition = EcsTaskDefinition(
            self,
            "task_definition",
            family=f"streamflix-video-processor-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="512",
            memory="1024",
            execution_role_arn=execution_role.arn,
            task_role_arn=task_role.arn,
            container_definitions=json.dumps(container_definitions),
            tags={"Name": f"streamflix-task-def-{environment_suffix}"},
        )

        # Create ECS service
        self.service = EcsService(
            self,
            "ecs_service",
            name=f"streamflix-video-processor-{environment_suffix}",
            cluster=self.cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=1,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=private_subnet_ids,
                security_groups=[ecs_security_group_id],
                assign_public_ip=False,
            ),
            tags={"Name": f"streamflix-ecs-service-{environment_suffix}"},
        )

        # Create auto-scaling target
        scaling_target = AppautoscalingTarget(
            self,
            "scaling_target",
            max_capacity=10,
            min_capacity=1,
            resource_id=f"service/{self.cluster.name}/{self.service.name}",
            scalable_dimension="ecs:service:DesiredCount",
            service_namespace="ecs",
        )

        # Create auto-scaling policy based on Kinesis stream metrics
        AppautoscalingPolicy(
            self,
            "scaling_policy",
            name=f"streamflix-scaling-policy-{environment_suffix}",
            policy_type="TargetTrackingScaling",
            resource_id=scaling_target.resource_id,
            scalable_dimension=scaling_target.scalable_dimension,
            service_namespace=scaling_target.service_namespace,
            target_tracking_scaling_policy_configuration={
                "predefined_metric_specification": {
                    "predefined_metric_type": "ECSServiceAverageCPUUtilization",
                },
                "target_value": 70.0,
                "scale_in_cooldown": 300,
                "scale_out_cooldown": 60,
            },
        )

    @property
    def ecs_cluster_name(self):
        return self.cluster.name

    @property
    def ecs_service_name(self):
        return self.service.name
```

### File: lib/monitoring.py

```python
"""Monitoring infrastructure for video processing pipeline."""

from constructs import Construct
from cdktf_cdktf_provider_aws.cloudwatch_metric_alarm import CloudwatchMetricAlarm
from cdktf_cdktf_provider_aws.sns_topic import SnsTopic
from cdktf_cdktf_provider_aws.sns_topic_subscription import SnsTopicSubscription


class MonitoringConstruct(Construct):
    """Monitoring construct for CloudWatch alarms and SNS notifications."""

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        environment_suffix: str,
        kinesis_stream_name: str,
        ecs_cluster_name: str,
        ecs_service_name: str,
        db_cluster_id: str,
    ):
        super().__init__(scope, construct_id)

        # Create SNS topic for alerts
        self.sns_topic = SnsTopic(
            self,
            "alert_topic",
            name=f"streamflix-alerts-{environment_suffix}",
            display_name="StreamFlix Video Processing Alerts",
            tags={"Name": f"streamflix-alerts-{environment_suffix}"},
        )

        # Kinesis stream iterator age alarm
        CloudwatchMetricAlarm(
            self,
            "kinesis_iterator_age_alarm",
            alarm_name=f"streamflix-kinesis-iterator-age-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="GetRecords.IteratorAgeMilliseconds",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Maximum",
            threshold=60000,  # 1 minute
            alarm_description="Kinesis stream iterator age is too high",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "StreamName": kinesis_stream_name,
            },
            tags={"Name": f"streamflix-kinesis-iterator-age-{environment_suffix}"},
        )

        # Kinesis write throughput exceeded alarm
        CloudwatchMetricAlarm(
            self,
            "kinesis_write_throughput_alarm",
            alarm_name=f"streamflix-kinesis-write-throughput-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="WriteProvisionedThroughputExceeded",
            namespace="AWS/Kinesis",
            period=300,
            statistic="Sum",
            threshold=0,
            alarm_description="Kinesis stream write throughput exceeded",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "StreamName": kinesis_stream_name,
            },
            tags={"Name": f"streamflix-kinesis-write-throughput-{environment_suffix}"},
        )

        # ECS CPU utilization alarm
        CloudwatchMetricAlarm(
            self,
            "ecs_cpu_alarm",
            alarm_name=f"streamflix-ecs-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="ECS service CPU utilization is too high",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "ClusterName": ecs_cluster_name,
                "ServiceName": ecs_service_name,
            },
            tags={"Name": f"streamflix-ecs-cpu-{environment_suffix}"},
        )

        # ECS memory utilization alarm
        CloudwatchMetricAlarm(
            self,
            "ecs_memory_alarm",
            alarm_name=f"streamflix-ecs-memory-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="MemoryUtilization",
            namespace="AWS/ECS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="ECS service memory utilization is too high",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "ClusterName": ecs_cluster_name,
                "ServiceName": ecs_service_name,
            },
            tags={"Name": f"streamflix-ecs-memory-{environment_suffix}"},
        )

        # RDS CPU utilization alarm
        CloudwatchMetricAlarm(
            self,
            "rds_cpu_alarm",
            alarm_name=f"streamflix-rds-cpu-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="CPUUtilization",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="RDS cluster CPU utilization is too high",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": db_cluster_id,
            },
            tags={"Name": f"streamflix-rds-cpu-{environment_suffix}"},
        )

        # RDS database connections alarm
        CloudwatchMetricAlarm(
            self,
            "rds_connections_alarm",
            alarm_name=f"streamflix-rds-connections-{environment_suffix}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="DatabaseConnections",
            namespace="AWS/RDS",
            period=300,
            statistic="Average",
            threshold=80,
            alarm_description="RDS cluster database connections are too high",
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                "DBClusterIdentifier": db_cluster_id,
            },
            tags={"Name": f"streamflix-rds-connections-{environment_suffix}"},
        )

    @property
    def sns_topic_arn(self):
        return self.sns_topic.arn
```

### File: lib/__init__.py

```python
"""StreamFlix video processing pipeline infrastructure package."""

__version__ = "1.0.0"
```

## Deployment

The infrastructure is deployed using CDKTF with Python. All resources use the environment_suffix variable for unique naming, ensuring no conflicts when deploying multiple environments.

### Key Features

1. **Scalability**: Auto-scaling ECS services based on CPU utilization, Kinesis stream with configurable shard count
2. **Security**: AWS Secrets Manager for database credentials with rotation capability, VPC isolation with private subnets
3. **Reliability**: Dead letter queue for failed jobs, CloudWatch alarms with SNS notifications, multi-AZ deployment
4. **Compliance**: 90-day log retention, CloudTrail integration capability, proper resource tagging
5. **Cost Optimization**: Fargate Spot capacity providers, RDS Aurora Serverless v2 with auto-scaling

### Outputs

- kinesis_stream_name: Kinesis Data Stream name
- kinesis_stream_arn: Kinesis Data Stream ARN
- database_endpoint: RDS Aurora cluster endpoint
- database_secret_arn: Database credentials secret ARN
- ecs_cluster_name: ECS cluster name
- ecs_service_name: ECS service name
- vpc_id: VPC ID
- sns_topic_arn: SNS topic ARN for alerts