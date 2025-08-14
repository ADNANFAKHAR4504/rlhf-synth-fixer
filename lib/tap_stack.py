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
from lib.components.iam_roles import IAMRoles
from lib.components.lambda_function import LambdaFunction, LambdaConfig
from lib.components.s3_bucket import S3Bucket


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix
    for identifying the deployment environment (e.g., 'dev', 'prod').
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

    # Get current AWS region
    provider = aws.Provider("aws-provider", region="us-west-2")

    # Create S3 bucket
    s3_bucket = S3Bucket("serverless-app")

    # Create IAM roles and policies
    iam_roles = IAMRoles("serverless-app", bucket_arn=s3_bucket.bucket.arn)

    # Create Lambda function
    lambda_function = LambdaFunction(
      "serverless-app",
      LambdaConfig(role_arn=iam_roles.lambda_role.arn))

    # Add S3 trigger to Lambda function
    s3_permission = lambda_function.add_s3_trigger(
      bucket_arn=s3_bucket.bucket.arn
    )

    # Configure S3 bucket notification
    s3_bucket.add_lambda_notification(
      lambda_function_arn=lambda_function.function.arn,
      lambda_permission=s3_permission
    )

    # Export the ARNs as stack outputs
    pulumi.export("lambda_function_arn", lambda_function.function.arn)
    pulumi.export("s3_bucket_arn", s3_bucket.bucket.arn)
    pulumi.export("lambda_function_name", lambda_function.function.name)
    pulumi.export("s3_bucket_name", s3_bucket.bucket.bucket)
    pulumi.export("region", provider.region)

    # Additional useful outputs
    pulumi.export("lambda_role_arn", iam_roles.lambda_role.arn)
