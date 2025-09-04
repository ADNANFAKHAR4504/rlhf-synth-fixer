# Serverless Log Processing Pipeline with AWS CDK Python

## Architecture Overview

This solution implements a serverless log processing pipeline using AWS CDK in Python that processes log files from S3, transforms the data using Lambda, and stores results in DynamoDB with comprehensive error handling via SQS DLQ and error archival in S3.

## Implementation

### Main Stack Module

**File: lib/tap_stack.py**
```python
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
)
from constructs import Construct

from lib.s3_construct import S3SourceConstruct
from lib.dynamodb_construct import DynamoDBConstruct
from lib.error_handling_construct import ErrorHandlingConstruct
from lib.lambda_construct import LambdaProcessingConstruct

@dataclass
class TapStackProps:
  environment_suffix: str
  env: Environment
  app_name: str = "tap-serverless"

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
    self.dynamodb_stack = NestedDynamoDBStack(
        self,
        f"{self.app_name}-DynamoDB-{self.stack_suffix}"
    )
    self.error_handling_stack = NestedErrorHandlingStack(
        self,
        f"{self.app_name}-ErrorHandling-{self.stack_suffix}"
    )
    self.s3_source_stack = NestedS3SourceStack(
        self,
        f"{self.app_name}-S3Source-{self.stack_suffix}"
    )
    self.lambda_processing_stack = NestedLambdaProcessingStack(
        self,
        f"{self.app_name}-LambdaProcessor-{self.stack_suffix}",
        input_bucket=self.s3_source_stack.s3_bucket,
        output_table=self.dynamodb_stack.dynamodb_table,
        dlq_queue=self.error_handling_stack.dlq_queue,
        error_archive_bucket=self.error_handling_stack.error_archive_bucket
    )
    self._output_all_resources()

  def _output_all_resources(self):
    CfnOutput(self, "S3SourceBucket", value=self.s3_source_stack.s3_bucket.bucket_name, description="S3 Source Bucket for log upload")
    CfnOutput(self, "DynamoDBTableName", value=self.dynamodb_stack.dynamodb_table.table_name, description="DynamoDB output table")
    CfnOutput(self, "LambdaFunctionName", value=self.lambda_processing_stack.lambda_function.function_name, description="Log processing Lambda")
    CfnOutput(self, "DLQQueueURL", value=self.error_handling_stack.dlq_queue.queue_url, description="Dead letter queue for failed processing")
    CfnOutput(self, "ErrorArchiveBucket", value=self.error_handling_stack.error_archive_bucket.bucket_name, description="S3 bucket for error archive")
```

### S3 Source Construct

**File: lib/s3_construct.py**
```python
"""
s3_construct.py
This module defines the S3SourceConstruct for creating the input S3 bucket.
"""

from aws_cdk import (
  aws_s3 as s3,
  CfnOutput,
)
from constructs import Construct

class S3SourceConstruct(Construct):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    
    self.s3_bucket = s3.Bucket(
        self,
        "LogSourceBucket",
        versioned=True,
        event_bridge_enabled=True,
    )
    
    CfnOutput(self, "BucketName", value=self.s3_bucket.bucket_name, description="S3 Source Bucket Name")
    CfnOutput(self, "BucketArn", value=self.s3_bucket.bucket_arn, description="S3 Source Bucket ARN")
```

### DynamoDB Construct

**File: lib/dynamodb_construct.py**
```python
"""
dynamodb_construct.py
This module defines the DynamoDBConstruct for creating the output DynamoDB table.
"""

from aws_cdk import (
  aws_dynamodb as dynamodb,
  CfnOutput,
)
from constructs import Construct

class DynamoDBConstruct(Construct):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    
    self.dynamodb_table = dynamodb.Table(
        self,
        "ProcessedLogsTable",
        partition_key=dynamodb.Attribute(
            name="log_id",
            type=dynamodb.AttributeType.STRING
        ),
        sort_key=dynamodb.Attribute(
            name="timestamp",
            type=dynamodb.AttributeType.NUMBER
        ),
        billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
    )
    
    CfnOutput(self, "TableName", value=self.dynamodb_table.table_name, description="DynamoDB Table Name")
    CfnOutput(self, "TableArn", value=self.dynamodb_table.table_arn, description="DynamoDB Table ARN")
```

### Error Handling Construct

**File: lib/error_handling_construct.py**
```python
"""
error_handling_construct.py
This module defines the ErrorHandlingConstruct for creating error handling resources.
"""

from aws_cdk import (
  aws_sqs as sqs,
  aws_s3 as s3,
  Duration,
  CfnOutput,
)
from constructs import Construct

class ErrorHandlingConstruct(Construct):
  def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
    super().__init__(scope, construct_id, **kwargs)
    
    self.dlq_queue = sqs.Queue(
        self,
        "ProcessingDLQ",
        visibility_timeout=Duration.seconds(300),
        retention_period=Duration.days(14),
    )
    
    self.error_archive_bucket = s3.Bucket(
        self,
        "ErrorArchiveBucket",
        versioned=False,
        lifecycle_rules=[
            s3.LifecycleRule(
                id="DeleteOldErrorLogs",
                expiration=Duration.days(30)
            )
        ]
    )
    
    CfnOutput(self, "DLQUrl", value=self.dlq_queue.queue_url, description="DLQ URL")
    CfnOutput(self, "DLQArn", value=self.dlq_queue.queue_arn, description="DLQ ARN")
    CfnOutput(self, "ErrorBucketName", value=self.error_archive_bucket.bucket_name, description="Error Archive Bucket Name")
    CfnOutput(self, "ErrorBucketArn", value=self.error_archive_bucket.bucket_arn, description="Error Archive Bucket ARN")
```

### Lambda Processing Construct

**File: lib/lambda_construct.py**
```python
"""
lambda_construct.py
This module defines the LambdaProcessingConstruct for creating the log processing Lambda function.
"""

import os
from aws_cdk import (
  aws_lambda as _lambda,
  aws_s3 as s3,
  aws_dynamodb as dynamodb,
  aws_sqs as sqs,
  aws_iam as iam,
  aws_s3_notifications as s3_notifications,
  Duration,
  CfnOutput,
)
from constructs import Construct

class LambdaProcessingConstruct(Construct):
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
    
    # Create Lambda execution role
    lambda_role = iam.Role(
        self,
        "LogProcessorRole",
        assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
        managed_policies=[
            iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
        ]
    )
    
    # Grant permissions
    input_bucket.grant_read(lambda_role)
    output_table.grant_write_data(lambda_role)
    dlq_queue.grant_send_messages(lambda_role)
    error_archive_bucket.grant_write(lambda_role)
    
    # Lambda function
    self.lambda_function = _lambda.Function(
        self,
        "LogProcessor",
        runtime=_lambda.Runtime.PYTHON_3_9,
        handler="index.handler",
        role=lambda_role,
        timeout=Duration.seconds(60),
        memory_size=256,
        dead_letter_queue=dlq_queue,
        environment={
            "DYNAMODB_TABLE": output_table.table_name,
            "ERROR_BUCKET": error_archive_bucket.bucket_name,
        },
        code=_lambda.Code.from_inline("""
import os
import json
import boto3
import uuid
from datetime import datetime

s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def handler(event, context):
    table_name = os.environ['DYNAMODB_TABLE']
    error_bucket = os.environ['ERROR_BUCKET']
    table = dynamodb.Table(table_name)
    
    try:
        # Process S3 event
        for record in event['Records']:
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']
            
            # Get the log file from S3
            response = s3_client.get_object(Bucket=bucket, Key=key)
            log_content = response['Body'].read().decode('utf-8')
            
            # Parse and transform the log data
            log_lines = log_content.strip().split('\\n')
            for line in log_lines:
                if line:
                    # Create unique log entry
                    log_entry = {
                        'log_id': str(uuid.uuid4()),
                        'timestamp': int(datetime.now().timestamp()),
                        'source_file': key,
                        'log_data': line,
                        'processed_at': datetime.now().isoformat()
                    }
                    
                    # Store in DynamoDB
                    table.put_item(Item=log_entry)
            
            print(f"Successfully processed {len(log_lines)} log entries from {key}")
            
    except Exception as e:
        print(f"Error processing logs: {str(e)}")
        # Archive failed logs to error bucket
        error_key = f"errors/{datetime.now().isoformat()}/{key}"
        s3_client.copy_object(
            Bucket=error_bucket,
            CopySource={'Bucket': bucket, 'Key': key},
            Key=error_key
        )
        raise e
    
    return {
        'statusCode': 200,
        'body': json.dumps('Log processing completed')
    }
        """)
    )
    
    # Add S3 event notification
    self.lambda_function.add_event_source(
        s3_notifications.S3EventSource(
            input_bucket,
            events=[s3.EventType.OBJECT_CREATED],
            filters=[s3_notifications.NotificationKeyFilter(suffix=".log")]
        )
    )
    
    CfnOutput(self, "FunctionName", value=self.lambda_function.function_name, description="Lambda Function Name")
    CfnOutput(self, "FunctionArn", value=self.lambda_function.function_arn, description="Lambda Function ARN")
```

### Application Entry Point

**File: tap.py**
```python
#!/usr/bin/env python3
"""
CDK application entry point for the TAP (Test Automation Platform) infrastructure.
"""
import os
import aws_cdk as cdk
from aws_cdk import Tags
from lib.tap_stack import TapStack, TapStackProps

app = cdk.App()

# Get environment suffix from context (set by CI/CD pipeline) or use 'dev' as default
environment_suffix = app.node.try_get_context('environmentSuffix') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Apply tags to all stacks in this app
Tags.of(app).add('Environment', environment_suffix)
Tags.of(app).add('Repository', repository_name)
Tags.of(app).add('Author', commit_author)

# Create stack properties
props = TapStackProps(
    environment_suffix=environment_suffix,
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION')
    )
)

# Initialize the stack with proper parameters
TapStack(app, STACK_NAME, props=props)

app.synth()
```

## Key Features

1. **S3 Source Bucket**: Versioned bucket with EventBridge integration for receiving log files
2. **Lambda Processing**: Processes log files on S3 upload, transforms data, and stores in DynamoDB
3. **DynamoDB Table**: Stores processed log entries with partition and sort keys for efficient querying
4. **Error Handling**: SQS Dead Letter Queue for failed processing attempts
5. **Error Archival**: S3 bucket for storing logs that failed processing with 30-day lifecycle
6. **Event-Driven**: Automatic processing triggered by S3 object creation events
7. **Modular Architecture**: Separated constructs for better maintainability and testing

## Deployment

```bash
# Install dependencies
pipenv install

# Bootstrap CDK (first time only)
npx cdk bootstrap

# Synthesize CloudFormation template
npx cdk synth --context environmentSuffix=dev

# Deploy to AWS
npx cdk deploy --all --require-approval never --context environmentSuffix=dev

# Clean up resources
npx cdk destroy --all --force --context environmentSuffix=dev
```

This solution provides a production-ready serverless log processing pipeline following AWS best practices with comprehensive error handling and monitoring capabilities.