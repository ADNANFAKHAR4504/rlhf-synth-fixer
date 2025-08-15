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
import pulumi_aws as aws
from lib.components.compute import ComputeComponent
from lib.components.iam import IAMComponent
from lib.components.database import DatabaseComponent
from lib.components.storage import StorageComponent
from lib.components.monitoring import MonitoringComponent
from lib.components.serverless import ServerlessComponent


class TapStackArgs:
  def __init__(
      self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None
  ):
    self.environment_suffix = environment_suffix or "dev"
    self.tags = tags

class TapStack(pulumi.ComponentResource):
  def __init__(
      self, name: str, args: TapStackArgs, opts: Optional[ResourceOptions] = None
  ):
    super().__init__("tap:stack:TapStack", name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.regions = ['us-east-1', 'us-west-1']
    self.tags = args.tags

    # self.register_outputs({})

    # Get configuration values
    # self.environment_specific_vars = pulumi.Config("aws-multi-environment-infrastructure")
    # self.environment = self.environment_specific_vars.require("environment")
    # self.vpc_cidr = self.environment_specific_vars.get("vpc_cidr") or "10.0.0.0/16"
    # self.instance_type = self.environment_specific_vars.require("instance_type")

    # Get current AWS region
    self.current_region = aws.get_region()

    # Common tags for all resources
    common_tags = {
        "Environment": self.environment_suffix,
        "Project": "tap-stack",
        "ManagedBy": "Pulumi",
        "Owner": "Turing",
    }

    # 1. Create compute resources (Vpc, EC2, LoadBalancer)
    self.iam_component = IAMComponent(
        f"iam-{self.environment_suffix}",
        environment=self.environment_suffix,
        tags=common_tags,
        opts=ResourceOptions(parent=self),
    )

    # 2. Create IAM roles and policies
    self.compute_component = ComputeComponent(
        f"vpc-{self.environment_suffix}",
        environment=self.environment_suffix,
        tags=common_tags,
        instance_profile=self.iam_component.instance_profile.name,
        opts=ResourceOptions(parent=self, depends_on=[self.iam_component]),
    )

    # 3. Create S3 buckets with encryption
    self.storage_component = StorageComponent(
        f"storage-{self.environment_suffix}",
        environment=self.environment_suffix,
        tags=common_tags,
        opts=ResourceOptions(parent=self),
    )

    # 4. Create DynamoDB tables with PITR
    self.database_component = DatabaseComponent(
        f"database-{self.environment_suffix}",
        environment=self.environment_suffix,
        tags=common_tags,
        opts=ResourceOptions(parent=self),
    )

    # 5. Create serverless resources (Lambda)
    self.serverless_component = ServerlessComponent(
        f"serverless-{self.environment_suffix}",
        environment=self.environment_suffix,
        tags=common_tags,
        lambda_role_arn=self.iam_component.lambda_role.arn,
        opts=ResourceOptions(parent=self, depends_on=[self.iam_component]),
    )

    # 7. Create monitoring and alarms
    self.monitoring_component = MonitoringComponent(
        name=f"ec2-monitoring-{self.environment_suffix}",
        instances=self.compute_component.ec2_instances,
        tags=common_tags,
        notification_email="ogunfowokan.e@turing.com",
        opts=ResourceOptions(parent=self),
    )

    # Export important resource information
    pulumi.export("vpc_id", self.compute_component.vpc.id)
    pulumi.export("alb_dns_name", self.compute_component.alb.dns_name)
    pulumi.export("dynamodb_table_name", self.database_component.table.name)
    pulumi.export("s3_bucket_name", self.storage_component.bucket.bucket)
    pulumi.export(
        "lambda_function_name", self.serverless_component.lambda_function.name
    )
    pulumi.export("environment", self.environment_suffix)
    pulumi.export("region", self.current_region.name)
