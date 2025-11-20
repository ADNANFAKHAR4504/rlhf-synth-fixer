"""
tap_stack.py

Multi-region disaster recovery infrastructure stack.

Orchestrates primary region, DR region, and global resources
for a highly available payment processing system.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions, Output

from .primary_region import PrimaryRegion, PrimaryRegionArgs
from .dr_region import DRRegion, DRRegionArgs
from .global_resources import GlobalResources, GlobalResourcesArgs


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (str): A unique suffix for identifying the deployment environment.
        primary_region (str): Primary AWS region (default: us-east-1).
        dr_region (str): Disaster recovery AWS region (default: us-east-2).
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(
        self,
        environment_suffix: str,
        primary_region: str = 'us-east-1',
        dr_region: str = 'us-east-2',
        tags: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix
        self.primary_region = primary_region
        self.dr_region = dr_region
        self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
    """
    Multi-region disaster recovery infrastructure stack.

    Creates a complete disaster recovery solution with:
    - Primary region infrastructure (us-east-1)
    - DR region infrastructure (us-east-2)
    - Global resources (Route 53, DynamoDB Global Table, CloudWatch)
    - Aurora Global Database
    - S3 cross-region replication
    - Route 53 failover routing

    Args:
        name (str): The logical name of this Pulumi component.
        args (TapStackArgs): Configuration arguments.
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
        self.tags = {
            **args.tags,
            'Environment': args.environment_suffix,
            'ManagedBy': 'Pulumi',
            'Project': 'DisasterRecovery'
        }

        # Primary region infrastructure
        primary_args = PrimaryRegionArgs(
            environment_suffix=args.environment_suffix,
            region=args.primary_region,
            tags=self.tags
        )
        self.primary = PrimaryRegion(
            f'primary-{args.environment_suffix}',
            primary_args,
            opts=ResourceOptions(parent=self)
        )

        # DR region infrastructure
        dr_args = DRRegionArgs(
            environment_suffix=args.environment_suffix,
            region=args.dr_region,
            global_cluster_id=self.primary.global_cluster_id,
            replication_role_arn=self.primary.replication_role_arn,
            primary_bucket_arn=self.primary.bucket_arn,
            tags=self.tags
        )
        self.dr = DRRegion(
            f'dr-{args.environment_suffix}',
            dr_args,
            opts=ResourceOptions(parent=self)
        )

        # Global resources (Route 53, DynamoDB Global Table, CloudWatch)
        global_args = GlobalResourcesArgs(
            environment_suffix=args.environment_suffix,
            primary_region=args.primary_region,
            dr_region=args.dr_region,
            primary_api_endpoint=self.primary.api_endpoint,
            dr_api_endpoint=self.dr.api_endpoint,
            primary_bucket_name=self.primary.bucket_name,
            primary_bucket_arn=self.primary.bucket_arn,
            dr_bucket_name=self.dr.bucket_name,
            dr_bucket_arn=self.dr.bucket_arn,
            replication_role_arn=self.primary.replication_role_arn,
            aurora_primary_cluster_id=self.primary.aurora_cluster.id,
            aurora_dr_cluster_id=self.dr.aurora_cluster.id,
            primary_sns_topic_arn=self.primary.sns_topic_arn,
            dr_sns_topic_arn=self.dr.sns_topic_arn,
            tags=self.tags
        )
        self.global_resources = GlobalResources(
            f'global-{args.environment_suffix}',
            global_args,
            opts=ResourceOptions(parent=self)
        )

        # Register outputs
        self.register_outputs({
            'environment_suffix': args.environment_suffix,
            'primary_region': args.primary_region,
            'dr_region': args.dr_region,
            'primary_vpc_id': self.primary.vpc_id,
            'dr_vpc_id': self.dr.vpc_id,
            'primary_aurora_endpoint': self.primary.aurora_cluster_endpoint,
            'dr_aurora_endpoint': self.dr.aurora_cluster_endpoint,
            'primary_api_endpoint': self.primary.api_endpoint,
            'dr_api_endpoint': self.dr.api_endpoint,
            'primary_bucket_name': self.primary.bucket_name,
            'dr_bucket_name': self.dr.bucket_name,
            'dynamodb_table_name': self.global_resources.dynamodb_table_name,
            'route53_zone_id': self.global_resources.hosted_zone_id,
            'route53_fqdn': self.global_resources.route53_fqdn,
            'primary_lambda_function_name': self.primary.lambda_function_name,
            'dr_lambda_function_name': self.dr.lambda_function_name
        })
