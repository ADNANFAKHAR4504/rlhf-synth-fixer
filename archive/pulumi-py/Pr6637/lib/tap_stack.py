"""
Main Pulumi stack for financial services infrastructure.
Orchestrates all infrastructure components.
"""
from typing import Any, Dict, Optional

import pulumi
from pulumi import ComponentResource, Output, ResourceOptions

from lib.config import InfraConfig
from lib.database import DatabaseStack
from lib.iam import IAMStack
from lib.monitoring import MonitoringStack
from lib.networking import NetworkingStack
from lib.storage import StorageStack
from lib.web_tier import WebTier, WebTierArgs


class TapStackArgs:
    """Arguments for TapStack component."""

    def __init__(
      self, 
      environment_suffix: Optional[str] = None, 
      tags: Optional[dict] = None,
      environment: Optional[str] = None,
      aws_region: Optional[str] = None
  ):
        """
        Initialize TapStack arguments.

        Args:
            environment_suffix: Environment suffix for resource naming
            tags: Additional tags to apply
            environment: Environment name
            aws_region: AWS region
        """
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags
        self.environment = environment or 'dev'
        self.aws_region = aws_region or 'us-east-1'


class TapStack(ComponentResource):
    """
    Main Pulumi component resource for financial services infrastructure.
    Orchestrates networking, compute, database, and storage resources.
    """

    def __init__(self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None):
        """
        Initialize the main infrastructure stack.

        Args:
            name: Stack name
            args: Stack arguments
            opts: Pulumi resource options
        """
        super().__init__('tap:stack:TapStack', name, None, opts)

        self.environment_suffix = args.environment_suffix

        # Load configuration
        config = InfraConfig()
        common_tags = config.get_common_tags(args.tags)

        # Create networking infrastructure
        networking = NetworkingStack(
            name="networking",
            environment_suffix=self.environment_suffix,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create storage infrastructure (can be parallel with networking)
        storage = StorageStack(
            name="storage",
            data_bucket_name=config.data_bucket_name,
            logs_bucket_name=config.logs_bucket_name,
            environment_suffix=self.environment_suffix,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create IAM roles and policies
        iam = IAMStack(
            name="iam",
            data_bucket_arn=storage.data_bucket.arn,
            logs_bucket_arn=storage.logs_bucket.arn,
            environment_suffix=self.environment_suffix,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create database infrastructure
        database = DatabaseStack(
            name="database",
            vpc_id=networking.vpc.id,
            private_subnet_ids=[s.id for s in networking.private_subnets],
            security_group_id=networking.rds_sg.id,
            db_name=config.db_name,
            db_username=config.db_username,
            db_password=config.db_password,
            instance_class=config.db_instance_class,
            allocated_storage=config.db_allocated_storage,
            environment_suffix=self.environment_suffix,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Create web tier (ALB + ASG + Target Group)
        web_tier_args = WebTierArgs(
            vpc_id=networking.vpc.id,
            public_subnet_ids=[s.id for s in networking.public_subnets],
            private_subnet_ids=[s.id for s in networking.private_subnets],
            alb_security_group_id=networking.alb_sg.id,
            ec2_security_group_id=networking.ec2_sg.id,
            instance_profile_arn=iam.instance_profile.arn,
            ami_id=config.ami_id,
            instance_type=config.instance_type,
            min_size=config.min_size,
            max_size=config.max_size,
            desired_capacity=config.desired_capacity,
            environment_suffix=self.environment_suffix,
            tags=common_tags
        )

        web_tier = WebTier(
            name="web-tier",
            args=web_tier_args,
            opts=ResourceOptions(parent=self)
        )

        # Create monitoring infrastructure (CloudWatch Logs, Alarms, VPC Flow Logs)
        monitoring = MonitoringStack(
            name="monitoring",
            vpc_id=networking.vpc.id,
            alb_arn=web_tier.alb.arn,
            rds_instance_id=database.db_instance.id,
            asg_name=web_tier.asg.name,
            logs_bucket_name=storage.logs_bucket.bucket,
            environment_suffix=self.environment_suffix,
            tags=common_tags,
            opts=ResourceOptions(parent=self)
        )

        # Store outputs as instance variables for access
        self.vpc_id = networking.vpc.id
        self.alb_dns_name = web_tier.alb.dns_name
        self.alb_arn = web_tier.alb.arn
        self.rds_endpoint = database.db_instance.endpoint
        self.rds_address = database.db_instance.address
        self.data_bucket_arn = storage.data_bucket.arn
        self.data_bucket_name = storage.data_bucket.bucket
        self.logs_bucket_arn = storage.logs_bucket.arn
        self.logs_bucket_name = storage.logs_bucket.bucket

        # Export stack outputs
        self.register_outputs({
            "vpc_id": self.vpc_id,
            "alb_dns_name": self.alb_dns_name,
            "alb_arn": self.alb_arn,
            "rds_endpoint": self.rds_endpoint,
            "rds_address": self.rds_address,
            "data_bucket_arn": self.data_bucket_arn,
            "data_bucket_name": self.data_bucket_name,
            "logs_bucket_arn": self.logs_bucket_arn,
            "logs_bucket_name": self.logs_bucket_name
        })
