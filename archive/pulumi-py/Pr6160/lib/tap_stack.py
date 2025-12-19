"""
tap_stack.py

Main Pulumi stack orchestrating multi-environment infrastructure deployment.
This stack creates VPC, compute, database, load balancing, storage, and monitoring resources
with environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import Config, ResourceOptions

from .vpc_stack import VpcStack
from .compute_stack import ComputeStack
from .database_stack import DatabaseStack
from .load_balancer_stack import LoadBalancerStack
from .storage_stack import StorageStack
from .monitoring_stack import MonitoringStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix: Environment identifier (dev, staging, prod)
        tags: Optional default tags to apply to resources
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource orchestrating the multi-environment infrastructure.

    This component creates a complete infrastructure stack including:
    - VPC with public/private subnets across multiple AZs
    - Auto Scaling Group with environment-specific instance types
    - Application Load Balancer
    - RDS MySQL database (Single-AZ for dev/staging, Multi-AZ for prod)
    - S3 buckets for static assets
    - CloudWatch monitoring and alarms

    Args:
        name: The logical name of this Pulumi component
        args: Configuration arguments including environment suffix and tags
        opts: Pulumi resource options
    """

    def __init__(
        self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix
        config = Config()

        # Get environment-specific configuration
        cost_center = config.get('costCenter') or 'engineering'

        # Merge tags
        self.tags = {
            'Environment': self.environment_suffix,
            'CostCenter': cost_center,
            'ManagedBy': 'Pulumi',
            **args.tags
        }

        # Create VPC infrastructure
        self.vpc_stack = VpcStack(
            f'vpc-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create storage resources (needed for ALB logs)
        self.storage_stack = StorageStack(
            f'storage-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create load balancer
        self.load_balancer_stack = LoadBalancerStack(
            f'alb-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            vpc_id=self.vpc_stack.vpc_id,
            public_subnet_ids=self.vpc_stack.public_subnet_ids,
            log_bucket_name=self.storage_stack.alb_logs_bucket_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create compute resources
        self.compute_stack = ComputeStack(
            f'compute-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            vpc_id=self.vpc_stack.vpc_id,
            private_subnet_ids=self.vpc_stack.private_subnet_ids,
            alb_security_group_id=self.load_balancer_stack.alb_security_group_id,
            alb_target_group_arn=self.load_balancer_stack.target_group_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create database
        self.database_stack = DatabaseStack(
            f'database-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            vpc_id=self.vpc_stack.vpc_id,
            private_subnet_ids=self.vpc_stack.private_subnet_ids,
            app_security_group_id=self.compute_stack.instance_security_group_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create monitoring
        self.monitoring_stack = MonitoringStack(
            f'monitoring-{self.environment_suffix}',
            environment_suffix=self.environment_suffix,
            alb_arn_suffix=self.load_balancer_stack.alb_arn_suffix,
            target_group_arn_suffix=self.load_balancer_stack.target_group_arn_suffix,
            asg_name=self.compute_stack.asg_name,
            db_instance_id=self.database_stack.db_instance_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        pulumi.export('vpc_id', self.vpc_stack.vpc_id)
        pulumi.export('alb_dns_name', self.load_balancer_stack.alb_dns_name)
        pulumi.export('alb_zone_id', self.load_balancer_stack.alb_zone_id)
        pulumi.export('rds_endpoint', self.database_stack.db_endpoint)
        pulumi.export('rds_port', self.database_stack.db_port)
        pulumi.export('static_assets_bucket', self.storage_stack.static_assets_bucket_name)
        pulumi.export('sns_topic_arn', self.monitoring_stack.sns_topic_arn)