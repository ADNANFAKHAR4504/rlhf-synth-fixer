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

from lib.components.cloudwatch_alarm import CloudWatchAlarm, CloudWatchAlarmConfig
from lib.components.iam_role import S3IAMRole, S3IAMRoleConfig
from lib.components.kms_key import KMSKey, KMSKeyConfig
from lib.components.s3_bucket import SecureS3Bucket, SecureS3BucketConfig
from lib.components.sns_topic import SNSTopic, SNSTopicConfig

# Configuration
config = pulumi.Config()
project_name = pulumi.get_project()
stack_name = pulumi.get_stack()
email_endpoint = config.get("email_endpoint")  # Optional email for notifications


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.
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

    # Create a separate logging bucket (optional but recommended)
    logging_bucket = aws.s3.Bucket(
      "access-logging-bucket",
      bucket=f"{project_name}-access-logs-{stack_name}".lower(),
      force_destroy=True  # Only for demo purposes
    )

    # Block public access for logging bucket
    aws.s3.BucketPublicAccessBlock(
      "logging-bucket-public-access-block",
      bucket=logging_bucket.id,
      block_public_acls=True,
      block_public_policy=True,
      ignore_public_acls=True,
      restrict_public_buckets=True
    )

    # Create KMS key for encryption
    kms_key = KMSKey(
      f"{project_name}-kms",
      KMSKeyConfig(
        description="KMS key for S3 bucket encryption and SNS topic"
      )
    )

    # Create SNS topic for notifications
    sns_topic = SNSTopic(
      f"{project_name}-sns",
      SNSTopicConfig(
        kms_key_id=kms_key.key.key_id,
        email_endpoint=email_endpoint
      )
    )

    # Create the secure S3 bucket
    s3_bucket = SecureS3Bucket(
      f"{project_name}-s3",
      SecureS3BucketConfig(
        kms_key_id=kms_key.key.key_id,
        sns_topic_arn=sns_topic.topic.arn,
        access_logging_bucket=logging_bucket.bucket.apply(lambda b: f"{b}"),
        sns_topic_component=sns_topic  # Pass the full SNS topic component for dependency
      )
    )

    # Create IAM role with least privilege access
    iam_role = S3IAMRole(
      f"{project_name}-iam",
      S3IAMRoleConfig(
        bucket_arn=s3_bucket.bucket.arn,
        kms_key_arn=kms_key.key.arn
      )
    )

    # Create CloudWatch alarms
    CloudWatchAlarm(
      f"{project_name}-cw",
      CloudWatchAlarmConfig(
        bucket_name=s3_bucket.bucket.bucket,
        sns_topic_arn=sns_topic.topic.arn
      )
    )

    # Export important values
    pulumi.export("bucket_name", s3_bucket.bucket.bucket)
    pulumi.export("bucket_arn", s3_bucket.bucket.arn)
    pulumi.export("kms_key_id", kms_key.key.key_id)
    pulumi.export("kms_key_arn", kms_key.key.arn)
    pulumi.export("iam_role_arn", iam_role.role.arn)
    pulumi.export("sns_topic_arn", sns_topic.topic.arn)
    pulumi.export("logging_bucket_name", logging_bucket.bucket)
