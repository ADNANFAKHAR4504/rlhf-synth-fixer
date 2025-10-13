"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components
and manages environment-specific configurations.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions

# Import nested stacks for PCI-DSS payment processing environment
from .monitoring_stack import MonitoringStack, MonitoringStackArgs
from .vpc_stack import VpcStack, VpcStackArgs
from .security_stack import SecurityStack, SecurityStackArgs
from .rds_stack import RdsStack, RdsStackArgs
from .ecs_stack import EcsStack, EcsStackArgs


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying
            the deployment environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the TAP project.

    This component orchestrates a PCI-DSS compliant payment processing environment with:
    - VPC with public and private subnets
    - Aurora Serverless PostgreSQL database (encrypted)
    - ECS Fargate cluster for payment processing
    - KMS encryption keys
    - Security groups with least privilege access
    - CloudWatch logging and S3 audit logs

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

        # Step 1: Create monitoring infrastructure (needed for VPC Flow Logs)
        self.monitoring = MonitoringStack(
            "monitoring",
            MonitoringStackArgs(
                environment_suffix=self.environment_suffix,
                log_retention_days=7
            ),
            opts=ResourceOptions(parent=self)
        )

        # Step 2: Create VPC and networking
        self.vpc = VpcStack(
            "vpc",
            VpcStackArgs(
                environment_suffix=self.environment_suffix,
                cidr_block="10.0.0.0/16",
                log_bucket_arn=self.monitoring.log_bucket.arn
            ),
            opts=ResourceOptions(parent=self)
        )

        # Step 3: Create security infrastructure (KMS keys, security groups)
        self.security = SecurityStack(
            "security",
            SecurityStackArgs(
                environment_suffix=self.environment_suffix,
                vpc_id=self.vpc.vpc.id
            ),
            opts=ResourceOptions(parent=self)
        )

        # Step 4: Create RDS database
        self.rds = RdsStack(
            "rds",
            RdsStackArgs(
                environment_suffix=self.environment_suffix,
                subnet_ids=[s.id for s in self.vpc.private_subnets],
                security_group_id=self.security.rds_security_group.id,
                kms_key_arn=self.security.rds_kms_key.arn
            ),
            opts=ResourceOptions(parent=self)
        )

        # Step 5: Create ECS cluster and task definitions
        self.ecs = EcsStack(
            "ecs",
            EcsStackArgs(
                environment_suffix=self.environment_suffix,
                log_group_name=self.monitoring.ecs_log_group.name,
                security_group_id=self.security.ecs_security_group.id,
                subnet_ids=[s.id for s in self.vpc.private_subnets]
            ),
            opts=ResourceOptions(parent=self)
        )

        # Export key infrastructure outputs
        self.register_outputs({
            "vpc_id": self.vpc.vpc.id,
            "rds_endpoint": self.rds.db_cluster.endpoint,
            "ecs_cluster_name": self.ecs.cluster.name,
            "log_bucket_name": self.monitoring.log_bucket.bucket,
        })
