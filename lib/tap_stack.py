"""
tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the Serverless Log Processing Pipeline.

It orchestrates the instantiation of S3 Source, DynamoDB, Error Handling (SQS DLQ, Error S3),
and Lambda Processing stacks. The stack is parameterized for environment-specific
deployments and follows a modular structure using nested stacks.
"""

import os
from dataclasses import dataclass

from aws_cdk import (
  Stack,
  Environment,
  NestedStack,
  CfnOutput,
  aws_s3 as s3,
  aws_dynamodb as dynamodb,
  aws_sqs as sqs,
  aws_s3_notifications as s3_notifications,
  custom_resources as cr,
  aws_iam as iam,
)
from constructs import Construct

# Import the actual resource Construct definitions from their separate files
from lib.s3_construct import S3SourceConstruct
from lib.dynamodb_construct import DynamoDBConstruct
from lib.error_handling_construct import ErrorHandlingConstruct
from lib.lambda_construct import LambdaProcessingConstruct


@dataclass
class TapStackProps:
  environment_suffix: str
  env: Environment
  app_name: str = "tap-serverless"


# --- Nested Stack Classes ---

class NestedS3SourceStack(NestedStack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    s3_construct = S3SourceConstruct(self, "S3SourceConstruct")
    self.s3_bucket = s3_construct.s3_bucket


class NestedDynamoDBStack(NestedStack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    dynamodb_construct = DynamoDBConstruct(self, "DynamoDBConstruct")
    self.dynamodb_table = dynamodb_construct.dynamodb_table


class NestedErrorHandlingStack(NestedStack):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    error_handling_construct = ErrorHandlingConstruct(self, "ErrorHandlingConstruct")
    self.dlq_queue = error_handling_construct.dlq_queue
    self.error_archive_bucket = error_handling_construct.error_archive_bucket


class NestedLambdaProcessingStack(NestedStack):
  # pylint: disable=too-many-arguments
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      input_bucket: s3.Bucket,
      output_table: dynamodb.Table,
      dlq_queue: sqs.Queue,
      error_archive_bucket: s3.Bucket,
      **kwargs
  ) -> None:
    super().__init__(scope, construct_id, **kwargs)
    lambda_processing_construct = LambdaProcessingConstruct(
        self,
        "LambdaProcessingConstruct",
        input_bucket=input_bucket,
        output_table=output_table,
        dlq_queue=dlq_queue,
        error_archive_bucket=error_archive_bucket
    )
    self.lambda_function = lambda_processing_construct.lambda_function


class TapStack(Stack):
  def __init__(self, scope: Construct, construct_id: str, props: TapStackProps, **kwargs) -> None:
    super().__init__(scope, construct_id, env=props.env, **kwargs)

    self.stack_suffix = os.environ.get("STACK_NAME_SUFFIX", props.environment_suffix)
    self.app_name = props.app_name
    self.env = props.env

    self._create_pipeline_components()

  def _create_pipeline_components(self):
    # 1. DynamoDB Stack
    self.dynamodb_stack = NestedDynamoDBStack(
        self,
        f"{self.app_name}-DynamoDB-{self.stack_suffix}"
    )

    # 2. Error Handling Stack
    self.error_handling_stack = NestedErrorHandlingStack(
        self,
        f"{self.app_name}-ErrorHandling-{self.stack_suffix}"
    )

    # 3. S3 Source Stack
    self.s3_source_stack = NestedS3SourceStack(
        self,
        f"{self.app_name}-S3Source-{self.stack_suffix}"
    )

    # 4. Lambda Processing Stack
    self.lambda_processing_stack = NestedLambdaProcessingStack(
        self,
        f"{self.app_name}-LambdaProcessor-{self.stack_suffix}",
        input_bucket=self.s3_source_stack.s3_bucket,
        output_table=self.dynamodb_stack.dynamodb_table,
        dlq_queue=self.error_handling_stack.dlq_queue,
        error_archive_bucket=self.error_handling_stack.error_archive_bucket
    )

    # --- Circular Dependency Fix ---
    # Remove add_dependency and use a custom resource to set bucket notification
    # after both bucket and lambda exist.

    # Construct the Lambda destination configuration
    notification_configuration = {
      "LambdaFunctionConfigurations": [{
        "Events": ["s3:ObjectCreated:*"],
        "LambdaFunctionArn": self.lambda_processing_stack.lambda_function.function_arn,
        "Filter": {
          "Key": {
            "FilterRules": [
              {"Name": "prefix", "Value": "raw-logs/"},
              {"Name": "suffix", "Value": ".json"}
            ]
          }
        }
      }]
    }

    # Grant S3 permission to invoke the Lambda function using aws_iam
    self.lambda_processing_stack.lambda_function.add_permission(
      "AllowS3Invoke",
      principal=iam.ServicePrincipal("s3.amazonaws.com"),
      source_arn=self.s3_source_stack.s3_bucket.bucket_arn
    )

    # Use a custom resource to configure bucket notification to Lambda
    cr.AwsCustomResource(
      self, "S3BucketNotificationCustomResource",
      on_create=cr.AwsSdkCall(
        service="S3",
        action="putBucketNotificationConfiguration",
        parameters={
          "Bucket": self.s3_source_stack.s3_bucket.bucket_name,
          "NotificationConfiguration": notification_configuration
        },
        physical_resource_id=cr.PhysicalResourceId.of(f"{self.app_name}-S3Notification-{self.stack_suffix}")
      ),
      policy=cr.AwsCustomResourcePolicy.from_sdk_calls(
        resources=[self.s3_source_stack.s3_bucket.bucket_arn]
      )
    )

    CfnOutput(
        self, "S3SourceBucketName",
        value=self.s3_source_stack.s3_bucket.bucket_name,
        description="Name of the S3 bucket for raw log files."
    )

    CfnOutput(
        self, "LogProcessorLambdaFunctionName",
        value=self.lambda_processing_stack.lambda_function.function_name,
        description="Name of the Lambda function processing log data."
    )

    CfnOutput(
        self, "DynamoDBTableName",
        value=self.dynamodb_stack.dynamodb_table.table_name,
        description="Name of the DynamoDB table storing processed log data."
    )

    CfnOutput(
        self, "LambdaDLQQueueUrl",
        value=self.error_handling_stack.dlq_queue.queue_url,
        description="URL of the SQS Dead-Letter Queue for Lambda failures."
    )

    CfnOutput(
        self, "ErrorArchiveBucketName",
        value=self.error_handling_stack.error_archive_bucket.bucket_name,
        description="Name of the S3 bucket for archiving malformed log files."
    )

    CfnOutput(
        self, "TestingInstructions",
        value=(
            "To test: Upload a JSON log file (e.g., {'timestamp': '...', 'serviceName': '...', "
            "'message': '...'}) to the S3 Source Bucket (prefix 'raw-logs/'). "
            "Check DynamoDB for processed data and DLQ/Error Archive for failures."
        ),
        description="Instructions for testing the pipeline."
    )