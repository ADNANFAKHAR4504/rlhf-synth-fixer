"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""
import os
from typing import Optional

import pulumi
from pulumi import ResourceOptions

from lib.components.dynamodb_table import DynamoDBTableComponent
from lib.components.iam_role import IAMRoleComponent
from lib.components.s3_bucket import S3BucketComponent


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.

  This component orchestrates the instantiation of other resource-specific components
  and manages the environment suffix used for naming and configuration.

  Note:
      - DO NOT create resources directly here unless they are truly global.
      - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

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

    config = pulumi.Config()

    # Determine environment from config or environment variable
    environment = config.get("environment") or os.getenv("PULUMI_ENVIRONMENT", "staging")

    # Validate environment
    if environment not in ["staging", "production"]:
      raise ValueError(f"Invalid environment: {environment}. Must be 'staging' or 'production'")

    # Set AWS region
    aws_config = pulumi.Config("aws")
    region = aws_config.get("region") or "us-west-2"

    # Common tags for all resources
    common_tags = {
      "Environment": environment,
      "Project": "aws-infrastructure",
      "ManagedBy": "Pulumi",
      "Region": region,
      "CostCenter": f"{environment}-infrastructure"
    }

    # Create S3 bucket component
    s3_bucket = S3BucketComponent(
      name="app-data",
      environment=environment,
      tags={
        **common_tags,
        "Purpose": "ApplicationData",
        "BackupRequired": "true" if environment == "production" else "false"
      }
    )

    # Create DynamoDB table component
    dynamodb_table = DynamoDBTableComponent(
      name="app-table",
      environment=str(environment),
      hash_key="id",
      range_key="timestamp",
      attributes=[
        {"name": "id", "type": "S"},
        {"name": "timestamp", "type": "S"}
      ],
      tags={
        **common_tags,
        "Purpose": "ApplicationData",
        "DataClassification": "Internal"
      }
    )

    # Create IAM role component with access to S3 and DynamoDB
    iam_role = IAMRoleComponent(
      name="app-service",
      environment=str(environment),
      trusted_services=["ec2.amazonaws.com", "lambda.amazonaws.com"],
      s3_bucket_arn=s3_bucket.bucket_arn,
      dynamodb_table_arn=dynamodb_table.table_arn,
      tags={
        **common_tags,
        "Purpose": "ServiceRole",
        "AccessLevel": "ReadWrite"
      }
    )

    # Export important values
    pulumi.export("environment", environment)
    pulumi.export("region", region)

    # S3 exports
    pulumi.export("s3_bucket_name", s3_bucket.bucket_name)
    pulumi.export("s3_bucket_arn", s3_bucket.bucket_arn)

    # DynamoDB exports
    pulumi.export("dynamodb_table_name", dynamodb_table.table_name)
    pulumi.export("dynamodb_table_arn", dynamodb_table.table_arn)

    # IAM exports
    pulumi.export("iam_role_name", iam_role.role_name)
    pulumi.export("iam_role_arn", iam_role.role_arn)

    # Environment-specific outputs
    if environment == "production":
      pulumi.export("production_ready", True)
      pulumi.export("backup_enabled", True)
    else:
      pulumi.export("development_mode", True)
      pulumi.export("cost_optimized", True)
