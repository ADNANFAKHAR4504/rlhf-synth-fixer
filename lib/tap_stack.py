"""
main_pipeline_stack.py
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
)
from constructs import Construct

# Import the actual resource Construct definitions from their separate files
from lib.s3_construct import S3SourceConstruct
from lib.dynamodb_construct import DynamoDBConstruct
from lib.error_handling_construct import ErrorHandlingConstruct
from lib.lambda_construct import LambdaProcessingConstruct


@dataclass
class TapStackProps:
  """
  TapStackProps defines the properties required for instantiating the TapStack.

  Attributes:
    environment_suffix (str): A suffix for naming resources per environment (e.g., 'dev', 'prod').
    env (Environment): CDK environment (account and region).
    app_name (str): Application name prefix used in naming resources.
  """
  environment_suffix: str
  env: Environment
  app_name: str = "tap-serverless"


# --- Nested Stack Classes ---

class NestedS3SourceStack(NestedStack):
  """
  NestedS3SourceStack defines an S3 bucket within its own nested CloudFormation stack.
  It calls the S3SourceConstruct to create the actual S3 bucket resource.
  """
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    # Instantiate the S3SourceConstruct from its separate file
    s3_construct = S3SourceConstruct(self, "S3SourceConstruct")
    self.s3_bucket = s3_construct.s3_bucket


class NestedDynamoDBStack(NestedStack):
  """
  NestedDynamoDBStack defines a DynamoDB table within its own nested CloudFormation stack.
  It calls the DynamoDBConstruct to create the actual DynamoDB table resource.
  """
  def __init__(self, scope: Construct, construct_id: str, 
               table_name: str = None, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    # Instantiate the DynamoDBConstruct from its separate file
    dynamodb_construct = DynamoDBConstruct(self, "DynamoDBConstruct", table_name=table_name)
    self.dynamodb_table = dynamodb_construct.dynamodb_table


class NestedErrorHandlingStack(NestedStack):
  """
  NestedErrorHandlingStack defines an SQS DLQ and an Error Archive S3 bucket
  within its own nested CloudFormation stack. It calls the ErrorHandlingConstruct
  to create these resources.
  """
  def __init__(self, scope: Construct, construct_id: str, 
               queue_name: str = None, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    # Instantiate the ErrorHandlingConstruct from its separate file
    error_handling_construct = ErrorHandlingConstruct(self, "ErrorHandlingConstruct", queue_name=queue_name)
    self.dlq_queue = error_handling_construct.dlq_queue
    self.error_archive_bucket = error_handling_construct.error_archive_bucket


class NestedLambdaProcessingStack(NestedStack):
  """
  NestedLambdaProcessingStack defines the Lambda function within its own nested
  CloudFormation stack. It calls the LambdaProcessingConstruct to create the
  Lambda resource and configure its triggers and permissions.
  """
  # pylint: disable=too-many-arguments
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      input_bucket: s3.Bucket,            # Input from S3 Nested Stack
      output_table: dynamodb.Table,       # Input from DynamoDB Nested Stack
      dlq_queue: sqs.Queue,               # Input from Error Handling Nested Stack
      error_archive_bucket: s3.Bucket,    # Input from Error Handling Nested Stack
      **kwargs
  ) -> None:
    super().__init__(scope, construct_id, **kwargs)
    # Instantiate the LambdaProcessingConstruct from its separate file
    lambda_processing_construct = LambdaProcessingConstruct(
        self,
        "LambdaProcessingConstruct",
        input_bucket=input_bucket,
        output_table=output_table,
        dlq_queue=dlq_queue,
        error_archive_bucket=error_archive_bucket
    )
    self.lambda_function = lambda_processing_construct.lambda_function


# --- Main TapStack Class ---

class TapStack(Stack):
  """
  Main orchestration CDK stack for the Serverless Log Processing Pipeline.

  This stack creates S3 Source, DynamoDB, Error Handling (SQS DLQ, Error S3),
  and Lambda Processing components, each encapsulated within its own nested stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for the stack.
    props (TapStackProps): Properties containing environment configuration.
    **kwargs: Additional keyword arguments for the base Stack.
  """

  def __init__(self, scope: Construct, construct_id: str, props: TapStackProps, **kwargs) -> None:
    super().__init__(scope, construct_id, env=props.env, **kwargs)

    self.stack_suffix = os.environ.get("STACK_NAME_SUFFIX", props.environment_suffix)
    self.app_name = props.app_name
    self.env = props.env # Store the environment for passing to nested stacks

    # Orchestrate pipeline components
    self._create_pipeline_components()

  def _create_pipeline_components(self):
    """
    Create S3 Source, DynamoDB, Error Handling, and Lambda Processing stacks.
    Results are stored in attributes for potential reference.
    """
    # 1. Nested DynamoDB Stack
    # This stack is created first because the Lambda function will need
    # its table to write data.
    dynamodb_table_name = f"{self.app_name}-ProcessedLogEntries-{self.stack_suffix}"
    self.dynamodb_stack = NestedDynamoDBStack(
        self,
        f"{self.app_name}-DynamoDB-{self.stack_suffix}",
        table_name=dynamodb_table_name
    )

    # 2. Nested Error Handling Stack (SQS DLQ and Error S3 Bucket)
    # The Lambda function will need these for its DLQ and error archiving.
    dlq_queue_name = f"{self.app_name}-LambdaDLQ-{self.stack_suffix}"
    self.error_handling_stack = NestedErrorHandlingStack(
        self,
        f"{self.app_name}-ErrorHandling-{self.stack_suffix}",
        queue_name=dlq_queue_name
    )

    # 3. Nested S3 Source Stack
    # The S3 bucket will be the trigger for the Lambda function.
    self.s3_source_stack = NestedS3SourceStack(
        self,
        f"{self.app_name}-S3Source-{self.stack_suffix}"
    )

    # 4. Nested Lambda Processing Stack
    # This stack depends on the S3 bucket (for triggers), the DynamoDB table
    # (for write permissions and table name), and the error handling components.
    self.lambda_processing_stack = NestedLambdaProcessingStack(
        self,
        f"{self.app_name}-LambdaProcessor-{self.stack_suffix}",
        input_bucket=self.s3_source_stack.s3_bucket,
        output_table=self.dynamodb_stack.dynamodb_table,
        dlq_queue=self.error_handling_stack.dlq_queue,
        error_archive_bucket=self.error_handling_stack.error_archive_bucket
    )

    # Configure S3 bucket to trigger the Lambda function on new object creation
    self.s3_source_stack.s3_bucket.add_event_notification(
        s3.EventType.OBJECT_CREATED,
        s3_notifications.LambdaDestination(self.lambda_processing_stack.lambda_function),
        s3.NotificationKeyFilter(prefix="raw-logs/", suffix=".json")
    )

    # Output the names/ARNs of the created resources for easy reference
    # These outputs will be visible in the CloudFormation console for the main stack.
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

    # Optional: Add a note about how to test the pipeline
    CfnOutput(
        self, "TestingInstructions",
        value=(
            "To test: Upload a JSON log file (e.g., {'timestamp': '...', 'serviceName': '...', "
            "'message': '...'}) to the S3 Source Bucket (prefix 'raw-logs/'). "
            "Check DynamoDB for processed data and DLQ/Error Archive for failures."
        ),
        description="Instructions for testing the pipeline."
    )
