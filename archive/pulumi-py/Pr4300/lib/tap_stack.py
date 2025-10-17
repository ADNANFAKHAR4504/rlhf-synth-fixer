"""
tap_stack.py

Multi-region disaster recovery solution for e-commerce platform.
Implements active-passive configuration with automated failover capabilities.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
from .networking_stack import NetworkingStack
from .database_stack import DatabaseStack
from .storage_stack import StorageStack
from .compute_stack import ComputeStack
from .monitoring_stack import MonitoringStack
from .dr_automation_stack import DRAutomationStack


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): Suffix for identifying deployment environment.
        tags (Optional[dict]): Default tags to apply to resources.
        primary_region (str): Primary AWS region (default: us-east-1).
        secondary_region (str): Secondary AWS region for DR (default: us-west-2).
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        primary_region: str = "us-east-1",
        secondary_region: str = "us-west-2"
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.primary_region = primary_region
        self.secondary_region = secondary_region


class TapStack(pulumi.ComponentResource):
    """
    Main Pulumi component orchestrating multi-region DR infrastructure.

    Implements active-passive disaster recovery with:
    - Multi-region networking
    - Database replication
    - Storage replication
    - Automated health monitoring
    - Failover automation
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
            'Project': 'ECommerceDR',
            'Environment': self.environment_suffix,
            'ManagedBy': 'Pulumi'
        }

        # Create networking infrastructure in both regions
        self.networking = NetworkingStack(
            "networking",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            secondary_region=args.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create database layer with cross-region replication
        self.database = DatabaseStack(
            "database",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            secondary_region=args.secondary_region,
            primary_vpc_id=self.networking.primary_vpc_id,
            secondary_vpc_id=self.networking.secondary_vpc_id,
            primary_subnet_ids=self.networking.primary_private_subnet_ids,
            secondary_subnet_ids=self.networking.secondary_private_subnet_ids,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create storage layer with cross-region replication
        self.storage = StorageStack(
            "storage",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            secondary_region=args.secondary_region,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create compute layer (application servers)
        self.compute = ComputeStack(
            "compute",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            secondary_region=args.secondary_region,
            primary_vpc_id=self.networking.primary_vpc_id,
            secondary_vpc_id=self.networking.secondary_vpc_id,
            primary_subnet_ids=self.networking.primary_public_subnet_ids,
            secondary_subnet_ids=self.networking.secondary_public_subnet_ids,
            database_endpoint=self.database.primary_endpoint,
            storage_bucket=self.storage.primary_bucket_name,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create monitoring and alerting
        self.monitoring = MonitoringStack(
            "monitoring",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            compute_target_group=self.compute.primary_target_group_arn,
            database_cluster_id=self.database.primary_cluster_id,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Create DR automation
        self.dr_automation = DRAutomationStack(
            "dr-automation",
            environment_suffix=self.environment_suffix,
            primary_region=args.primary_region,
            secondary_region=args.secondary_region,
            health_check_id=self.monitoring.health_check_id,
            hosted_zone_id=self.networking.hosted_zone_id,
            sns_topic_arn=self.monitoring.sns_topic_arn,
            tags=self.tags,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'primary_endpoint': self.networking.primary_endpoint,
            'primary_alb_dns': self.compute.primary_alb_dns,
            'secondary_alb_dns': self.compute.secondary_alb_dns,
            'database_primary_endpoint': self.database.primary_endpoint,
            'database_secondary_endpoint': self.database.secondary_endpoint,
            'storage_bucket_primary': self.storage.primary_bucket_name,
            'storage_bucket_secondary': self.storage.secondary_bucket_name,
            'sns_topic_arn': self.monitoring.sns_topic_arn,
        })
