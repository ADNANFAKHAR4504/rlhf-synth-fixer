# Healthcare Analytics Platform Infrastructure - Pulumi Python Implementation

This implementation provides a complete containerized healthcare analytics platform using Amazon ECS Fargate with ElastiCache Redis for session management and caching.

## Architecture Overview

- VPC with public and private subnets across two availability zones
- NAT Gateway for outbound internet access from private subnets
- ECS Fargate cluster for containerized workloads
- ElastiCache Redis cluster with Secrets Manager-backed authentication
- IAM roles and security groups enforcing least-privilege access

## File: lib/tap_stack.py

```python
"""
tap_stack.py

Main Pulumi ComponentResource for Healthcare Analytics Platform
Orchestrates VPC, ECS Fargate, ElastiCache Redis, and supporting resources
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions

from .vpc_stack import VPCStack, VPCStackArgs
from .redis_stack import RedisStack, RedisStackArgs
from .ecs_stack import ECSStack, ECSStackArgs


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Suffix for identifying deployment environment
        tags (Optional[dict]): Default tags to apply to resources
        region (Optional[str]): AWS region for deployment (default: eu-west-1)
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        region: Optional[str] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.region = region or 'eu-west-1'


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component for Healthcare Analytics Platform

    Orchestrates:
    - VPC with public/private subnets and NAT Gateway
    - ElastiCache Redis cluster with TLS encryption
    - ECS Fargate cluster with task definitions
    - Secrets Manager for Redis credentials
    - IAM roles and security groups

    Args:
        name (str): Logical name of this Pulumi component
        args (TapStackArgs): Configuration arguments
        opts (ResourceOptions): Pulumi options
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
            'Environment': self.environment_suffix,
            'Project': 'HealthTech-Analytics',
            'ManagedBy': 'Pulumi'
        }

        # Create VPC with public and private subnets
        self.vpc_stack = VPCStack(
            f"vpc-{self.environment_suffix}",
            VPCStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags,
                cidr_block='10.0.0.0/16'
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache Redis cluster with TLS encryption
        self.redis_stack = RedisStack(
            f"redis-{self.environment_suffix}",
            RedisStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags,
                vpc_id=self.vpc_stack.vpc_id,
                private_subnet_ids=self.vpc_stack.private_subnet_ids
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create ECS Fargate cluster and task definitions
        self.ecs_stack = ECSStack(
            f"ecs-{self.environment_suffix}",
            ECSStackArgs(
                environment_suffix=self.environment_suffix,
                tags=self.tags,
                vpc_id=self.vpc_stack.vpc_id,
                private_subnet_ids=self.vpc_stack.private_subnet_ids,
                redis_endpoint=self.redis_stack.redis_endpoint,
                redis_port=self.redis_stack.redis_port,
                redis_secret_arn=self.redis_stack.redis_secret_arn
            ),
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc_stack.vpc_id,
            'ecs_cluster_name': self.ecs_stack.cluster_name,
            'ecs_cluster_arn': self.ecs_stack.cluster_arn,
            'redis_endpoint': self.redis_stack.redis_endpoint,
            'redis_port': self.redis_stack.redis_port,
            'task_definition_arn': self.ecs_stack.task_definition_arn
        })
```

## File: lib/vpc_stack.py

```python
"""
vpc_stack.py

VPC stack with public/private subnets and NAT Gateway
Provides network isolation for ECS tasks in private subnets
"""

from typing import Optional, List

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class VPCStackArgs:
    """Arguments for VPC stack"""

    def __init__(
        self,
        environment_suffix: str,
        tags: dict,
        cidr_block: str = '10.0.0.0/16'
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags
        self.cidr_block = cidr_block


class VPCStack(pulumi.ComponentResource):
    """
    VPC stack with public and private subnets across multiple AZs
    Includes NAT Gateway for outbound internet access from private subnets
    """

    def __init__(
        self,
        name: str,
        args: VPCStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:vpc:VPCStack', name, None, opts)

        # Create VPC
        self.vpc = aws.ec2.Vpc(
            f"vpc-{args.environment_suffix}",
            cidr_block=args.cidr_block,
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **args.tags,
                'Name': f'vpc-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create Internet Gateway
        self.igw = aws.ec2.InternetGateway(
            f"igw-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            tags={
                **args.tags,
                'Name': f'igw-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Get availability zones for eu-west-1
        azs = aws.get_availability_zones(state='available')

        # Create public subnets (2 AZs)
        self.public_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"public-subnet-{i}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i}.0/24',
                availability_zone=azs.names[i],
                map_public_ip_on_launch=True,
                tags={
                    **args.tags,
                    'Name': f'public-subnet-{i}-{args.environment_suffix}',
                    'Type': 'public'
                },
                opts=ResourceOptions(parent=self)
            )
            self.public_subnets.append(subnet)

        # Create private subnets (2 AZs)
        self.private_subnets = []
        for i in range(2):
            subnet = aws.ec2.Subnet(
                f"private-subnet-{i}-{args.environment_suffix}",
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i+10}.0/24',
                availability_zone=azs.names[i],
                map_public_ip_on_launch=False,
                tags={
                    **args.tags,
                    'Name': f'private-subnet-{i}-{args.environment_suffix}',
                    'Type': 'private'
                },
                opts=ResourceOptions(parent=self)
            )
            self.private_subnets.append(subnet)

        # Create Elastic IP for NAT Gateway
        self.eip = aws.ec2.Eip(
            f"nat-eip-{args.environment_suffix}",
            domain='vpc',
            tags={
                **args.tags,
                'Name': f'nat-eip-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create NAT Gateway in first public subnet
        self.nat_gateway = aws.ec2.NatGateway(
            f"nat-{args.environment_suffix}",
            allocation_id=self.eip.id,
            subnet_id=self.public_subnets[0].id,
            tags={
                **args.tags,
                'Name': f'nat-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self, depends_on=[self.igw])
        )

        # Create public route table
        self.public_route_table = aws.ec2.RouteTable(
            f"public-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block='0.0.0.0/0',
                    gateway_id=self.igw.id
                )
            ],
            tags={
                **args.tags,
                'Name': f'public-rt-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate public subnets with public route table
        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f"public-rta-{i}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.public_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Create private route table
        self.private_route_table = aws.ec2.RouteTable(
            f"private-rt-{args.environment_suffix}",
            vpc_id=self.vpc.id,
            routes=[
                aws.ec2.RouteTableRouteArgs(
                    cidr_block='0.0.0.0/0',
                    nat_gateway_id=self.nat_gateway.id
                )
            ],
            tags={
                **args.tags,
                'Name': f'private-rt-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Associate private subnets with private route table
        for i, subnet in enumerate(self.private_subnets):
            aws.ec2.RouteTableAssociation(
                f"private-rta-{i}-{args.environment_suffix}",
                subnet_id=subnet.id,
                route_table_id=self.private_route_table.id,
                opts=ResourceOptions(parent=self)
            )

        # Export properties
        self.vpc_id = self.vpc.id
        self.public_subnet_ids = [subnet.id for subnet in self.public_subnets]
        self.private_subnet_ids = [subnet.id for subnet in self.private_subnets]

        self.register_outputs({
            'vpc_id': self.vpc_id,
            'public_subnet_ids': self.public_subnet_ids,
            'private_subnet_ids': self.private_subnet_ids
        })
```

## File: lib/redis_stack.py

```python
"""
redis_stack.py

ElastiCache Redis cluster with TLS encryption and Secrets Manager integration
Provides session management and caching for healthcare analytics platform
"""

from typing import Optional, List
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class RedisStackArgs:
    """Arguments for Redis stack"""

    def __init__(
        self,
        environment_suffix: str,
        tags: dict,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]]
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids


class RedisStack(pulumi.ComponentResource):
    """
    ElastiCache Redis cluster with TLS encryption
    Includes Secrets Manager for Redis authentication
    """

    def __init__(
        self,
        name: str,
        args: RedisStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:redis:RedisStack', name, None, opts)

        # Create security group for Redis
        self.redis_sg = aws.ec2.SecurityGroup(
            f"redis-sg-{args.environment_suffix}",
            vpc_id=args.vpc_id,
            description='Security group for ElastiCache Redis cluster',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=6379,
                    to_port=6379,
                    cidr_blocks=['10.0.0.0/16'],
                    description='Allow Redis access from VPC'
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic'
                )
            ],
            tags={
                **args.tags,
                'Name': f'redis-sg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create subnet group for Redis
        self.redis_subnet_group = aws.elasticache.SubnetGroup(
            f"redis-subnet-group-{args.environment_suffix}",
            subnet_ids=args.private_subnet_ids,
            description='Subnet group for ElastiCache Redis cluster',
            tags={
                **args.tags,
                'Name': f'redis-subnet-group-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Generate random auth token for Redis
        import random
        import string
        auth_token = ''.join(random.choices(string.ascii_letters + string.digits, k=32))

        # Store Redis auth token in Secrets Manager
        self.redis_secret = aws.secretsmanager.Secret(
            f"redis-auth-{args.environment_suffix}",
            name=f"redis-auth-{args.environment_suffix}",
            description='Redis authentication token for healthcare analytics platform',
            tags={
                **args.tags,
                'Name': f'redis-auth-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        self.redis_secret_version = aws.secretsmanager.SecretVersion(
            f"redis-auth-version-{args.environment_suffix}",
            secret_id=self.redis_secret.id,
            secret_string=json.dumps({
                'auth_token': auth_token,
                'port': 6379
            }),
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache replication group (Redis cluster)
        self.redis_cluster = aws.elasticache.ReplicationGroup(
            f"redis-cluster-{args.environment_suffix}",
            replication_group_id=f"redis-{args.environment_suffix}",
            description='Redis cluster for healthcare analytics session management',
            engine='redis',
            engine_version='7.0',
            node_type='cache.t3.micro',
            num_cache_clusters=2,
            parameter_group_name='default.redis7',
            port=6379,
            subnet_group_name=self.redis_subnet_group.name,
            security_group_ids=[self.redis_sg.id],
            at_rest_encryption_enabled=True,
            transit_encryption_enabled=True,
            auth_token=auth_token,
            automatic_failover_enabled=True,
            multi_az_enabled=True,
            snapshot_retention_limit=5,
            snapshot_window='03:00-05:00',
            maintenance_window='mon:05:00-mon:07:00',
            auto_minor_version_upgrade=True,
            tags={
                **args.tags,
                'Name': f'redis-cluster-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.redis_endpoint = self.redis_cluster.primary_endpoint_address
        self.redis_port = pulumi.Output.from_input(6379)
        self.redis_secret_arn = self.redis_secret.arn

        self.register_outputs({
            'redis_endpoint': self.redis_endpoint,
            'redis_port': self.redis_port,
            'redis_secret_arn': self.redis_secret_arn
        })
```

## File: lib/ecs_stack.py

```python
"""
ecs_stack.py

ECS Fargate cluster with task definitions for healthcare analytics platform
Includes IAM roles and security configurations
"""

from typing import Optional, List
import json

import pulumi
from pulumi import ResourceOptions, Output
import pulumi_aws as aws


class ECSStackArgs:
    """Arguments for ECS stack"""

    def __init__(
        self,
        environment_suffix: str,
        tags: dict,
        vpc_id: Output[str],
        private_subnet_ids: List[Output[str]],
        redis_endpoint: Output[str],
        redis_port: Output[int],
        redis_secret_arn: Output[str]
    ):
        self.environment_suffix = environment_suffix
        self.tags = tags
        self.vpc_id = vpc_id
        self.private_subnet_ids = private_subnet_ids
        self.redis_endpoint = redis_endpoint
        self.redis_port = redis_port
        self.redis_secret_arn = redis_secret_arn


class ECSStack(pulumi.ComponentResource):
    """
    ECS Fargate cluster with task definitions
    Includes IAM roles for task execution and application permissions
    """

    def __init__(
        self,
        name: str,
        args: ECSStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:ecs:ECSStack', name, None, opts)

        # Create security group for ECS tasks
        self.ecs_task_sg = aws.ec2.SecurityGroup(
            f"ecs-task-sg-{args.environment_suffix}",
            vpc_id=args.vpc_id,
            description='Security group for ECS tasks',
            ingress=[
                aws.ec2.SecurityGroupIngressArgs(
                    protocol='tcp',
                    from_port=8080,
                    to_port=8080,
                    cidr_blocks=['10.0.0.0/16'],
                    description='Allow inbound traffic to application'
                )
            ],
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    protocol='-1',
                    from_port=0,
                    to_port=0,
                    cidr_blocks=['0.0.0.0/0'],
                    description='Allow all outbound traffic'
                )
            ],
            tags={
                **args.tags,
                'Name': f'ecs-task-sg-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create ECS cluster
        self.cluster = aws.ecs.Cluster(
            f"ecs-cluster-{args.environment_suffix}",
            name=f"healthcare-analytics-{args.environment_suffix}",
            settings=[
                aws.ecs.ClusterSettingArgs(
                    name='containerInsights',
                    value='enabled'
                )
            ],
            tags={
                **args.tags,
                'Name': f'ecs-cluster-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for ECS task execution
        self.task_execution_role = aws.iam.Role(
            f"ecs-task-execution-role-{args.environment_suffix}",
            name=f"ecs-task-execution-{args.environment_suffix}",
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'ecs-tasks.amazonaws.com'
                    },
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={
                **args.tags,
                'Name': f'ecs-task-execution-role-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Attach AWS managed policy for ECS task execution
        aws.iam.RolePolicyAttachment(
            f"ecs-task-execution-policy-{args.environment_suffix}",
            role=self.task_execution_role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy',
            opts=ResourceOptions(parent=self)
        )

        # Add policy for Secrets Manager access
        self.secrets_policy = aws.iam.RolePolicy(
            f"ecs-secrets-policy-{args.environment_suffix}",
            role=self.task_execution_role.id,
            policy=args.redis_secret_arn.apply(
                lambda arn: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [{
                        'Effect': 'Allow',
                        'Action': [
                            'secretsmanager:GetSecretValue'
                        ],
                        'Resource': [arn]
                    }]
                })
            ),
            opts=ResourceOptions(parent=self)
        )

        # Create IAM role for ECS task
        self.task_role = aws.iam.Role(
            f"ecs-task-role-{args.environment_suffix}",
            name=f"ecs-task-{args.environment_suffix}",
            assume_role_policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Principal': {
                        'Service': 'ecs-tasks.amazonaws.com'
                    },
                    'Action': 'sts:AssumeRole'
                }]
            }),
            tags={
                **args.tags,
                'Name': f'ecs-task-role-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Add CloudWatch Logs policy for task role
        self.logs_policy = aws.iam.RolePolicy(
            f"ecs-logs-policy-{args.environment_suffix}",
            role=self.task_role.id,
            policy=json.dumps({
                'Version': '2012-10-17',
                'Statement': [{
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogGroup',
                        'logs:CreateLogStream',
                        'logs:PutLogEvents'
                    ],
                    'Resource': 'arn:aws:logs:*:*:*'
                }]
            }),
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch log group
        self.log_group = aws.cloudwatch.LogGroup(
            f"ecs-log-group-{args.environment_suffix}",
            name=f"/ecs/healthcare-analytics-{args.environment_suffix}",
            retention_in_days=7,
            tags={
                **args.tags,
                'Name': f'ecs-log-group-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Create ECS task definition
        self.task_definition = aws.ecs.TaskDefinition(
            f"ecs-task-def-{args.environment_suffix}",
            family=f"healthcare-analytics-{args.environment_suffix}",
            network_mode='awsvpc',
            requires_compatibilities=['FARGATE'],
            cpu='256',
            memory='512',
            execution_role_arn=self.task_execution_role.arn,
            task_role_arn=self.task_role.arn,
            container_definitions=Output.all(
                args.redis_endpoint,
                args.redis_port,
                args.redis_secret_arn,
                self.log_group.name
            ).apply(
                lambda args_list: json.dumps([{
                    'name': 'healthcare-analytics-app',
                    'image': 'nginx:latest',
                    'essential': True,
                    'portMappings': [{
                        'containerPort': 8080,
                        'protocol': 'tcp'
                    }],
                    'environment': [
                        {
                            'name': 'REDIS_ENDPOINT',
                            'value': args_list[0]
                        },
                        {
                            'name': 'REDIS_PORT',
                            'value': str(args_list[1])
                        },
                        {
                            'name': 'ENVIRONMENT',
                            'value': args.environment_suffix
                        }
                    ],
                    'secrets': [{
                        'name': 'REDIS_AUTH_TOKEN',
                        'valueFrom': f"{args_list[2]}:auth_token::"
                    }],
                    'logConfiguration': {
                        'logDriver': 'awslogs',
                        'options': {
                            'awslogs-group': args_list[3],
                            'awslogs-region': 'eu-west-1',
                            'awslogs-stream-prefix': 'ecs'
                        }
                    }
                }])
            ),
            tags={
                **args.tags,
                'Name': f'ecs-task-def-{args.environment_suffix}'
            },
            opts=ResourceOptions(parent=self)
        )

        # Export properties
        self.cluster_name = self.cluster.name
        self.cluster_arn = self.cluster.arn
        self.task_definition_arn = self.task_definition.arn

        self.register_outputs({
            'cluster_name': self.cluster_name,
            'cluster_arn': self.cluster_arn,
            'task_definition_arn': self.task_definition_arn
        })
```

## File: lib/__init__.py

```python
"""
Healthcare Analytics Platform Infrastructure
Pulumi Python implementation for ECS Fargate with ElastiCache Redis
"""

from .tap_stack import TapStack, TapStackArgs
from .vpc_stack import VPCStack, VPCStackArgs
from .redis_stack import RedisStack, RedisStackArgs
from .ecs_stack import ECSStack, ECSStackArgs

__all__ = [
    'TapStack',
    'TapStackArgs',
    'VPCStack',
    'VPCStackArgs',
    'RedisStack',
    'RedisStackArgs',
    'ECSStack',
    'ECSStackArgs'
]
```

## Implementation Details

### AWS Services Utilized

1. Amazon VPC with public and private subnets
2. NAT Gateway and Internet Gateway for network routing
3. Amazon ElastiCache (Redis) with multi-AZ failover
4. AWS Secrets Manager for Redis authentication tokens
5. Amazon ECS Fargate for containerized workloads
6. AWS CloudWatch Logs for centralized logging
7. AWS IAM roles and inline policies enforcing least privilege

### Security and Compliance Highlights

- TLS in-transit and encryption at rest enabled for Redis
- Redis auth token generated per deployment and stored in Secrets Manager
- ECS tasks restricted to private subnets with controlled ingress/egress
- IAM roles scoped to required AWS services only
- Centralized logging for operational visibility

### High Availability Characteristics

- Multi-AZ networking footprint with redundant subnets
- ElastiCache replication group with automatic failover
- Serverless Fargate capacity to distribute workloads across availability zones

