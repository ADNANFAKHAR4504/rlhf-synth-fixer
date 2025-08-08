"""
tap_stack.py (Refactored)

This module defines the TapStack class, the main Pulumi ComponentResource for
secure AWS infrastructure under the TAP project with enterprise-grade standards.

It integrates KMS, IAM, S3, Logging, and VPC components using modular design
from MODEL_RESPONSE.md and adheres strictly to constraints in PROMPT.md.
"""
import os
import pulumi
from pulumi import ResourceOptions
from lib.modules.vpc import VPCManager
from lib.modules.logging import LoggingManager
from lib.modules.s3 import S3Manager
from lib.modules.iam import IAMManager
from lib.modules.kms import KMSManager


# === Importing secure infrastructure modules ===


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
      environment_suffix (Optional[str]): Deployment environment suffix (e.g., dev, prod).
      tags (Optional[dict]): Tags to apply to resources.
  """

  def __init__(self, environment_suffix=None, tags=None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags or {}


class TapStack(pulumi.ComponentResource):
  """
  Main Pulumi component for orchestrating secure AWS infrastructure.

  This component integrates secure modules for KMS, IAM, logging, and VPC.

  NOTE:
  - Core class structure is preserved.
  - Follows modular design and enterprise security standards.
  """

  def __init__(
          self,
          name: str,
          args: TapStackArgs,
          opts: ResourceOptions = None):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags

    # Project configuration
    project_name = f"aws-nova-model-breaking-{self.environment_suffix}"
    environment = self.environment_suffix

    # Validate required environment variables
    required_vars = ["AWS_ACCOUNT_ID"]
    for var in required_vars:
      if not os.getenv(var):
        raise ValueError(f"Environment variable {var} is required.")

    # === Module Initializations ===
    kms_manager = KMSManager(project_name, environment)
    iam_manager = IAMManager(project_name, environment)
    vpc_manager = VPCManager(project_name, environment)

    # === KMS Keys ===
    master_key = kms_manager.create_master_key()
    logging_key = kms_manager.create_logging_key()

    pulumi.export("master_key_id", master_key.key_id)
    pulumi.export("master_key_arn", master_key.arn)
    pulumi.export("logging_key_id", logging_key.key_id)
    pulumi.export("logging_key_arn", logging_key.arn)

    # === S3 Logging Bucket ===
    s3_manager = S3Manager(project_name, environment, master_key)
    logging_bucket = s3_manager.create_logging_bucket()

    pulumi.export("logging_bucket_name", logging_bucket.bucket)
    pulumi.export("logging_bucket_arn", logging_bucket.arn)

    # === Logging Manager ===
    logging_manager = LoggingManager(
        project_name, environment, master_key, logging_key)
    log_group = logging_manager.create_cloudwatch_log_group()

    pulumi.export("log_group_name", log_group.name)

    # === IAM Roles ===
    cloudtrail_role = iam_manager.create_cloudtrail_role(logging_bucket.arn)
    flow_logs_role = iam_manager.create_vpc_flow_logs_role(log_group.arn)

    # === VPC ===
    vpc = vpc_manager.create_vpc()
    private_subnets = vpc_manager.create_private_subnets(vpc)
    default_sg = vpc_manager.create_security_groups(vpc)

    pulumi.export("vpc_id", vpc.id)

    # === Logging ===
    cloudtrail = logging_manager.create_cloudtrail(logging_bucket)
    vpc_flow_log = logging_manager.create_vpc_flow_logs(
        vpc.id, log_group, flow_logs_role)

    pulumi.export("cloudtrail_arn", cloudtrail.arn)
    pulumi.export("region", "us-west-1")

    # Register outputs for Pulumi tracking
    self.register_outputs({
        "kms_keys": {
            "master_key": master_key.arn,
            "logging_key": logging_key.arn
        },
        "logging_bucket": logging_bucket.arn,
        "vpc_id": vpc.id,
        "cloudtrail": cloudtrail.arn,
        "log_group": log_group.name
    })
