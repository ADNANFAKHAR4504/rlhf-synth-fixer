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
from pulumi_aws import s3  # example import for any AWS resource

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


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

        # Import and create image processing infrastructure
        from infrastructure import iam, lambda_function, monitoring, s3
        from infrastructure.config import create_config

        # Create image processing infrastructure
        pipeline_config = create_config()

        # Create KMS Key for S3 encryption
        self.kms_key = s3.create_kms_key("img-proc")

        # Create Dead Letter Queue (DLQ)
        dlq = lambda_function.create_dead_letter_queue(pipeline_config)
        self.dlq_arn = dlq.arn

        # Create source S3 bucket for image uploads
        self.source_bucket = s3.create_source_bucket(self.environment_suffix, self.kms_key)

        # Create destination S3 bucket for processed images
        self.dest_bucket = s3.create_destination_bucket(self.environment_suffix, self.kms_key)

        # Create IAM role for Lambda execution
        self.lambda_role = iam.create_lambda_role(
            name_prefix="img-proc",
            source_bucket_arn=self.source_bucket.arn,
            dest_bucket_arn=self.dest_bucket.arn,
            kms_key_arn=self.kms_key.arn,
            dlq_arn=self.dlq_arn
        )

        # Create Lambda function for image processing
        self.processor_function = lambda_function.create_lambda_function(
            name_prefix="img-proc",
            role_arn=self.lambda_role.arn,
            source_bucket_name=self.source_bucket.bucket,
            dest_bucket_name=self.dest_bucket.bucket,
            dlq_arn=self.dlq_arn
        )

        # Create CloudWatch log group for Lambda
        self.log_group = monitoring.create_log_group(self.processor_function.name)

        # Configure S3 trigger for Lambda
        lambda_function.configure_s3_trigger(
            lambda_function=self.processor_function,
            source_bucket=self.source_bucket
        )

        # Create CloudWatch alarms for monitoring
        self.alarms = monitoring.create_cloudwatch_alarms(
            function_name=self.processor_function.name,
            function_arn=self.processor_function.arn
        )

        # Export key outputs for external consumption
        pulumi.export("aws_region", "us-east-1")  # Add AWS region export
        pulumi.export("source_bucket_name", self.source_bucket.bucket)
        pulumi.export("destination_bucket_name", self.dest_bucket.bucket)
        pulumi.export("lambda_function_name", self.processor_function.name)
        pulumi.export("lambda_function_arn", self.processor_function.arn)
        pulumi.export("log_group_name", self.log_group.name)
        pulumi.export("kms_key_id", self.kms_key.id)
        pulumi.export("upload_prefix", "uploads/")
        pulumi.export("instructions", "Upload images to the source bucket with prefix 'uploads/' to trigger processing")
        
        # Register outputs for component communication
        self.register_outputs({
            "source_bucket": self.source_bucket.bucket,
            "dest_bucket": self.dest_bucket.bucket,
            "lambda_function": self.processor_function.name,
            "log_group": self.log_group.name,
            "upload_prefix": "uploads/",
            "instructions": "Upload images to the source bucket with prefix 'uploads/' to trigger processing"
        })
