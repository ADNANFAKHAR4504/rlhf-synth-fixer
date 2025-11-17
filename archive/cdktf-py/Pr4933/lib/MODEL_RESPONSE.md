# StreamFlix Video Processing Pipeline Infrastructure

I'll create a video processing pipeline infrastructure using CDKTF with Python. This will handle video ingestion through Kinesis, store metadata in RDS, and process videos using ECS Fargate.

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

        # Create Kinesis stream
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
        )

        # Stack outputs
        TerraformOutput(
            self,
            "kinesis_stream_name",
            value=kinesis.stream_name,
        )

        TerraformOutput(
            self,
            "database_endpoint",
            value=database.db_cluster_endpoint,
        )

        TerraformOutput(
            self,
            "ecs_cluster_name",
            value=compute.ecs_cluster_name,
        )
```

### File: lib/networking.py

```python
"""Networking infrastructure for StreamFlix video processing pipeline."""

from constructs import Construct
from cdktf_cdktf_provider_aws.vpc import Vpc
from cdktf_cdktf_provider_aws.subnet import Subnet
from cdktf_cdktf_provider_aws.internet_gateway import InternetGateway
from cdktf_cdktf_provider_aws.nat_gateway import NatGateway
from cdktf_cdktf_provider_aws.eip import Eip
from cdktf_cdktf_provider_aws.route_table import RouteTable, RouteTableRoute
from cdktf_cdktf_provider_aws.route_table_association import RouteTableAssociation
from cdktf_cdktf_provider_aws.security_group import SecurityGroup, SecurityGroupIngress, SecurityGroupEgress


class NetworkingConstruct(Construct):
    """Networking construct for VPC and subnets."""

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
        )

        # Create Internet Gateway
        igw = InternetGateway(
            self,
            "igw",
            vpc_id=self.vpc.id,
        )

        # Create public subnet
        self.public_subnet_1 = Subnet(
            self,
            "public_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.1.0/24",
            availability_zone=f"{aws_region}a",
            map_public_ip_on_launch=True,
        )

        # Create private subnets
        self.private_subnet_1 = Subnet(
            self,
            "private_subnet_1",
            vpc_id=self.vpc.id,
            cidr_block="10.0.11.0/24",
            availability_zone=f"{aws_region}a",
        )

        self.private_subnet_2 = Subnet(
            self,
            "private_subnet_2",
            vpc_id=self.vpc.id,
            cidr_block="10.0.12.0/24",
            availability_zone=f"{aws_region}b",
        )

        # Create Elastic IP for NAT Gateway
        nat_eip = Eip(
            self,
            "nat_eip",
            domain="vpc",
        )

        # Create NAT Gateway
        nat_gateway = NatGateway(
            self,
            "nat_gateway",
            allocation_id=nat_eip.id,
            subnet_id=self.public_subnet_1.id,
        )

        # Create route table for public subnet
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
        )

        RouteTableAssociation(
            self,
            "public_rt_assoc_1",
            subnet_id=self.public_subnet_1.id,
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
        )

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

        # Create security group for ECS
        self.ecs_security_group = SecurityGroup(
            self,
            "ecs_sg",
            name=f"ecs-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            egress=[
                SecurityGroupEgress(
                    from_port=0,
                    to_port=0,
                    protocol="-1",
                    cidr_blocks=["0.0.0.0/0"],
                )
            ],
        )

        # Create security group for RDS
        self.database_security_group = SecurityGroup(
            self,
            "database_sg",
            name=f"db-sg-{environment_suffix}",
            vpc_id=self.vpc.id,
            ingress=[
                SecurityGroupIngress(
                    from_port=5432,
                    to_port=5432,
                    protocol="tcp",
                    security_groups=[self.ecs_security_group.id],
                )
            ],
        )

    @property
    def vpc_id(self):
        return self.vpc.id

    @property
    def private_subnet_ids(self):
        return [self.private_subnet_1.id, self.private_subnet_2.id]

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
            name=f"video-stream-{environment_suffix}",
            shard_count=2,
            retention_period=24,
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
import json


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

        # Create DB subnet group
        db_subnet_group = DbSubnetGroup(
            self,
            "db_subnet_group",
            name=f"db-subnet-group-{environment_suffix}",
            subnet_ids=private_subnet_ids,
        )

        # Create Secrets Manager secret
        self.db_secret = SecretsmanagerSecret(
            self,
            "db_secret",
            name=f"db-credentials-{environment_suffix}",
            recovery_window_in_days=0,
        )

        # Create secret version
        secret_value = {
            "username": "admin",
            "password": "Password123!",
            "engine": "postgres",
        }

        SecretsmanagerSecretVersion(
            self,
            "db_secret_version",
            secret_id=self.db_secret.id,
            secret_string=json.dumps(secret_value),
        )

        # Create RDS Aurora cluster
        self.db_cluster = RdsCluster(
            self,
            "aurora_cluster",
            cluster_identifier=f"aurora-cluster-{environment_suffix}",
            engine="aurora-postgresql",
            engine_mode="provisioned",
            master_username="admin",
            master_password="Password123!",
            db_subnet_group_name=db_subnet_group.name,
            vpc_security_group_ids=[database_security_group_id],
            serverlessv2_scaling_configuration={
                "min_capacity": 0.5,
                "max_capacity": 1.0,
            },
            skip_final_snapshot=True,
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
from cdktf_cdktf_provider_aws.ecs_task_definition import EcsTaskDefinition
from cdktf_cdktf_provider_aws.ecs_service import EcsService, EcsServiceNetworkConfiguration
from cdktf_cdktf_provider_aws.iam_role import IamRole
from cdktf_cdktf_provider_aws.iam_role_policy_attachment import IamRolePolicyAttachment
from cdktf_cdktf_provider_aws.cloudwatch_log_group import CloudwatchLogGroup
import json


class ComputeConstruct(Construct):
    """Compute construct for ECS Fargate workers."""

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
    ):
        super().__init__(scope, construct_id)

        # Create CloudWatch log group
        log_group = CloudwatchLogGroup(
            self,
            "ecs_log_group",
            name=f"/ecs/streamflix-{environment_suffix}",
            retention_in_days=7,
        )

        # Create ECS cluster
        self.cluster = EcsCluster(
            self,
            "ecs_cluster",
            name=f"cluster-{environment_suffix}",
        )

        # Create IAM role for task execution
        execution_role = IamRole(
            self,
            "execution_role",
            name=f"ecs-execution-role-{environment_suffix}",
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
        )

        IamRolePolicyAttachment(
            self,
            "execution_role_policy",
            role=execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy",
        )

        # Create task definition
        container_definitions = [{
            "name": "video-processor",
            "image": "public.ecr.aws/docker/library/python:3.11-slim",
            "essential": True,
            "memory": 512,
            "cpu": 256,
            "logConfiguration": {
                "logDriver": "awslogs",
                "options": {
                    "awslogs-group": log_group.name,
                    "awslogs-region": "eu-central-1",
                    "awslogs-stream-prefix": "processor",
                }
            },
        }]

        self.task_definition = EcsTaskDefinition(
            self,
            "task_definition",
            family=f"processor-{environment_suffix}",
            network_mode="awsvpc",
            requires_compatibilities=["FARGATE"],
            cpu="256",
            memory="512",
            execution_role_arn=execution_role.arn,
            container_definitions=json.dumps(container_definitions),
        )

        # Create ECS service
        self.service = EcsService(
            self,
            "ecs_service",
            name=f"processor-service-{environment_suffix}",
            cluster=self.cluster.id,
            task_definition=self.task_definition.arn,
            desired_count=1,
            launch_type="FARGATE",
            network_configuration=EcsServiceNetworkConfiguration(
                subnets=private_subnet_ids,
                security_groups=[ecs_security_group_id],
            ),
        )

    @property
    def ecs_cluster_name(self):
        return self.cluster.name

    @property
    def ecs_service_name(self):
        return self.service.name
```

### File: lib/__init__.py

```python
"""StreamFlix infrastructure package."""
```