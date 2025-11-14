"""
tap_stack.py

Main Pulumi ComponentResource for disaster recovery infrastructure.
Orchestrates primary and DR region deployments with failover capabilities.
"""

from typing import Optional
import pulumi
from pulumi import ResourceOptions
from lib.primary_region import PrimaryRegion, PrimaryRegionArgs
from lib.dr_region import DRRegion, DRRegionArgs
from lib.global_resources import GlobalResources, GlobalResourcesArgs


class TapStackArgs:
    """
    Arguments for TapStack component.

    Args:
        environment_suffix: Deployment environment identifier
        tags: Default tags for all resources
    """
    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        # Merge DR-specific tags
        self.tags.update({
            'Environment': 'DR',
            'CostCenter': 'Operations',
            'Criticality': 'High'
        })


class TapStack(pulumi.ComponentResource):
    """
    Main disaster recovery infrastructure stack.

    Implements active-passive DR pattern with:
    - Primary region (us-east-1) with full infrastructure
    - DR region (us-east-2) with standby infrastructure
    - Aurora Global Database for data replication
    - Route 53 failover routing
    - Cross-region S3 replication
    - DynamoDB global tables for session state
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

        # Primary region infrastructure (us-east-1)
        self.primary = PrimaryRegion(
            f"primary-{self.environment_suffix}",
            PrimaryRegionArgs(
                environment_suffix=self.environment_suffix,
                region='us-east-1',
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # DR region infrastructure (us-east-2)
        self.dr = DRRegion(
            f"dr-{self.environment_suffix}",
            DRRegionArgs(
                environment_suffix=self.environment_suffix,
                region='us-east-2',
                primary_cluster_arn=self.primary.aurora_cluster_arn,
                replication_source_bucket=self.primary.bucket_id,
                replication_role_arn=self.primary.replication_role_arn,
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Global resources (Route 53, DynamoDB Global Tables, CloudWatch)
        self.global_resources = GlobalResources(
            f"global-{self.environment_suffix}",
            GlobalResourcesArgs(
                environment_suffix=self.environment_suffix,
                primary_api_endpoint=self.primary.api_endpoint,
                dr_api_endpoint=self.dr.api_endpoint,
                primary_region='us-east-1',
                dr_region='us-east-2',
                tags=self.tags
            ),
            opts=ResourceOptions(parent=self)
        )

        # Export outputs
        self.register_outputs({
            'primary_vpc_id': self.primary.vpc_id,
            'primary_cluster_endpoint': self.primary.aurora_cluster_endpoint,
            'primary_api_url': self.primary.api_endpoint,
            'primary_bucket_name': self.primary.bucket_name,
            'dr_vpc_id': self.dr.vpc_id,
            'dr_cluster_endpoint': self.dr.aurora_cluster_endpoint,
            'dr_api_url': self.dr.api_endpoint,
            'dr_bucket_name': self.dr.bucket_name,
            'route53_zone_id': self.global_resources.zone_id,
            'failover_domain': self.global_resources.failover_domain,
            'dynamodb_table_name': self.global_resources.dynamodb_table_name,
            'sns_topic_primary_arn': self.global_resources.sns_topic_primary_arn,
            'sns_topic_dr_arn': self.global_resources.sns_topic_dr_arn
        })
