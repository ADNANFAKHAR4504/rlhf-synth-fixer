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
