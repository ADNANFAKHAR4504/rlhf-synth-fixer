"""
tap_stack.py

Main Pulumi ComponentResource that orchestrates all infrastructure components
for the GlobeCart e-commerce platform.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions

from .vpc_stack import VpcStack
from .secrets_stack import SecretsStack
from .rds_stack import RdsStack
from .elasticache_stack import ElastiCacheStack
from .efs_stack import EfsStack
from .ecs_stack import EcsStack


class TapStackArgs:
    """
    Arguments for the TapStack component.

    Args:
        environment_suffix: Environment identifier (e.g., 'dev', 'prod')
        tags: Optional default tags to apply to resources
    """
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main stack component for GlobeCart infrastructure.

    Orchestrates the creation of VPC, RDS Aurora, ElastiCache, ECS Fargate,
    EFS, and Secrets Manager with automated rotation.
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
            'Environment': self.environment_suffix,
            'Project': 'GlobeCart',
            'ManagedBy': 'Pulumi',
            **args.tags
        }

        child_opts = ResourceOptions(parent=self)

        # Create VPC and networking infrastructure
        self.vpc = VpcStack(
            f'vpc-{self.environment_suffix}',
            tags=self.tags,
            opts=child_opts
        )

        # Create Secrets Manager with rotation
        self.secrets = SecretsStack(
            f'secrets-{self.environment_suffix}',
            vpc_id=self.vpc.vpc_id,
            private_subnet_ids=self.vpc.private_subnet_ids,
            tags=self.tags,
            opts=child_opts
        )

        # Create RDS Aurora Serverless v2 cluster
        self.rds = RdsStack(
            f'rds-{self.environment_suffix}',
            vpc_id=self.vpc.vpc_id,
            private_subnet_ids=self.vpc.private_subnet_ids,
            secret_arn=self.secrets.db_secret_arn,
            tags=self.tags,
            opts=child_opts
        )

        # Update secret with RDS connection info
        self.secrets.attach_to_rds(
            cluster_arn=self.rds.cluster_arn,
            cluster_id=self.rds.cluster_id
        )

        # Create ElastiCache Redis cluster
        self.elasticache = ElastiCacheStack(
            f'elasticache-{self.environment_suffix}',
            vpc_id=self.vpc.vpc_id,
            private_subnet_ids=self.vpc.private_subnet_ids,
            tags=self.tags,
            opts=child_opts
        )

        # Create EFS for persistent storage
        self.efs = EfsStack(
            f'efs-{self.environment_suffix}',
            vpc_id=self.vpc.vpc_id,
            private_subnet_ids=self.vpc.private_subnet_ids,
            tags=self.tags,
            opts=child_opts
        )

        # Create ECS Fargate cluster
        self.ecs = EcsStack(
            f'ecs-{self.environment_suffix}',
            vpc_id=self.vpc.vpc_id,
            private_subnet_ids=self.vpc.private_subnet_ids,
            public_subnet_ids=self.vpc.public_subnet_ids,
            rds_security_group_id=self.rds.security_group_id,
            elasticache_security_group_id=self.elasticache.security_group_id,
            efs_id=self.efs.file_system_id,
            rds_endpoint=self.rds.cluster_endpoint,
            rds_reader_endpoint=self.rds.reader_endpoint,
            elasticache_endpoint=self.elasticache.configuration_endpoint,
            db_secret_arn=self.secrets.db_secret_arn,
            tags=self.tags,
            opts=child_opts
        )

        # Export outputs
        self.register_outputs({
            'vpc_id': self.vpc.vpc_id,
            'rds_cluster_endpoint': self.rds.cluster_endpoint,
            'rds_reader_endpoint': self.rds.reader_endpoint,
            'elasticache_configuration_endpoint': self.elasticache.configuration_endpoint,
            'ecs_cluster_name': self.ecs.cluster_name,
            'efs_file_system_id': self.efs.file_system_id,
            'db_secret_arn': self.secrets.db_secret_arn,
        })
