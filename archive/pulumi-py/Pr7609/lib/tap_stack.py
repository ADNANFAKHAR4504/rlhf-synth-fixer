"""
tap_stack.py

Main Pulumi stack for JapanCart Transaction Monitoring System.
Orchestrates all infrastructure components for real-time transaction processing.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
from pulumi_aws import get_availability_zones

from .vpc_stack import VpcStack
from .kinesis_stack import KinesisStack
from .secrets_stack import SecretsStack
from .elasticache_stack import ElastiCacheStack
from .rds_stack import RdsStack
from .monitoring_stack import MonitoringStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack component.

    Args:
        environment_suffix (Optional[str]): Suffix for identifying the deployment environment
        tags (Optional[dict]): Default tags to apply to resources
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component resource for JapanCart Transaction Monitoring System.

    This component orchestrates:
    - VPC and networking infrastructure
    - Kinesis Data Stream for transaction ingestion
    - ElastiCache Redis for transaction history cache
    - RDS PostgreSQL for permanent storage
    - Secrets Manager for credential management
    - CloudWatch monitoring and alarms

    Args:
        name (str): The logical name of this Pulumi component
        args (TapStackArgs): Configuration arguments including environment suffix and tags
        opts (ResourceOptions): Pulumi resource options
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
            'Project': 'JapanCart',
            'ManagedBy': 'Pulumi',
            'Environment': self.environment_suffix
        }

        # Get availability zones
        azs = get_availability_zones(state="available")

        # Create VPC and networking infrastructure
        self.vpc = VpcStack(
            f"vpc-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            azs=azs.names[:2],  # Use first 2 AZs for Multi-AZ
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Kinesis Data Stream
        self.kinesis = KinesisStack(
            f"kinesis-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create Secrets Manager for RDS credentials
        self.secrets = SecretsStack(
            f"secrets-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create ElastiCache Redis cluster
        self.elasticache = ElastiCacheStack(
            f"elasticache-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            vpc_id=self.vpc.vpc_id,
            subnet_ids=self.vpc.private_subnet_ids,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create RDS PostgreSQL instance
        self.rds = RdsStack(
            f"rds-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            vpc_id=self.vpc.vpc_id,
            subnet_ids=self.vpc.private_subnet_ids,
            db_secret_arn=self.secrets.db_secret_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create CloudWatch monitoring and alarms
        self.monitoring = MonitoringStack(
            f"monitoring-{self.environment_suffix}",
            environment_suffix=self.environment_suffix,
            kinesis_stream_name=self.kinesis.stream_name,
            elasticache_cluster_id=self.elasticache.cluster_id,
            rds_instance_id=self.rds.instance_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'vpc_id': self.vpc.vpc_id,
            'kinesis_stream_name': self.kinesis.stream_name,
            'kinesis_stream_arn': self.kinesis.stream_arn,
            'redis_endpoint': self.elasticache.redis_endpoint,
            'redis_port': self.elasticache.redis_port,
            'rds_endpoint': self.rds.endpoint,
            'rds_port': self.rds.port,
            'db_secret_arn': self.secrets.db_secret_arn,
            'elasticache_security_group_id': self.elasticache.security_group_id,
            'rds_security_group_id': self.rds.security_group_id
        })
