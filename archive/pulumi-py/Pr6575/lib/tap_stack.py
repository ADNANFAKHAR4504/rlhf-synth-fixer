"""
tap_stack.py

Main TAP stack for disaster recovery infrastructure.
Orchestrates primary region, DR region, and global resources.
"""

from typing import Optional
import pulumi
from pulumi import ComponentResource, ResourceOptions

from lib.primary_region import PrimaryRegion, PrimaryRegionArgs
from lib.dr_region import DRRegion, DRRegionArgs
from lib.global_resources import GlobalResources, GlobalResourcesArgs


class TapStackArgs:
    """Arguments for TAP stack configuration."""

    def __init__(
        self,
        environment_suffix: str = 'dev',
        tags: Optional[dict] = None
    ):
        """
        Initialize TAP stack arguments.
        
        Args:
            environment_suffix: Environment identifier (dev, staging, prod)
            tags: Optional custom tags to merge with default DR tags
        """
        self.environment_suffix = environment_suffix
        
        # Default DR tags
        dr_tags = {
            'Environment': 'DR',
            'CostCenter': 'Operations',
            'Criticality': 'High'
        }
        
        # Merge custom tags with DR tags (DR tags take precedence)
        if tags:
            merged_tags = {**tags, **dr_tags}
            self.tags = merged_tags
        else:
            self.tags = dr_tags


class TapStack(ComponentResource):
    """
    Main TAP stack for multi-region disaster recovery.
    
    Creates infrastructure in primary (us-east-1) and DR (us-east-2) regions
    with global resources for failover and replication.
    """
    
    def __init__(
            self,
        name: str,
        args: TapStackArgs,
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize the TAP stack.
        
        Args:
            name: Stack name
            args: Stack configuration arguments
            opts: Pulumi resource options
        """
        super().__init__('tap:index:TapStack', name, None, opts)
        
        # Store configuration
        self.environment_suffix = args.environment_suffix
        self.tags = args.tags
        
        # Primary region (us-east-1)
        primary_args = PrimaryRegionArgs(
            environment_suffix=args.environment_suffix,
            region='us-east-1',
            tags=args.tags
        )
        self.primary = PrimaryRegion(
            f'primary-{args.environment_suffix}',
            primary_args,
            opts=ResourceOptions(parent=self)
        )
        
        # DR region (us-east-2)
        dr_args = DRRegionArgs(
            environment_suffix=args.environment_suffix,
            region='us-east-2',
            primary_cluster_arn=self.primary.aurora_cluster_arn,
            replication_source_bucket=self.primary.bucket_id,
            replication_role_arn=self.primary.replication_role_arn,
            tags=args.tags
        )
        self.dr = DRRegion(
            f'dr-{args.environment_suffix}',
            dr_args,
            opts=ResourceOptions(parent=self)
        )
        
        # Global resources (Route 53, DynamoDB Global Tables, CloudWatch)
        global_args = GlobalResourcesArgs(
            environment_suffix=args.environment_suffix,
            primary_api_endpoint=self.primary.api_endpoint,
            dr_api_endpoint=self.dr.api_endpoint,
            primary_region='us-east-1',
            dr_region='us-east-2',
            tags=args.tags
        )
        self.global_resources = GlobalResources(
            f'global-{args.environment_suffix}',
            global_args,
            opts=ResourceOptions(parent=self)
        )
        
        # Register stack outputs
        self.register_outputs({
            # Primary region outputs
            'primary_vpc_id': self.primary.vpc_id,
            'primary_cluster_endpoint': self.primary.aurora_cluster_endpoint,
            'primary_api_url': self.primary.api_endpoint,
            'primary_bucket_name': self.primary.bucket_name,
            
            # DR region outputs
            'dr_vpc_id': self.dr.vpc_id,
            'dr_cluster_endpoint': self.dr.aurora_cluster_endpoint,
            'dr_api_url': self.dr.api_endpoint,
            'dr_bucket_name': self.dr.bucket_name,
            
            # Global resources outputs
            'route53_zone_id': self.global_resources.zone_id,
            'failover_domain': self.global_resources.failover_domain,
            'dynamodb_table_name': self.global_resources.dynamodb_table_name,
            'sns_topic_primary_arn': self.global_resources.sns_topic_primary_arn,
            'sns_topic_dr_arn': self.global_resources.sns_topic_dr_arn,
        })
