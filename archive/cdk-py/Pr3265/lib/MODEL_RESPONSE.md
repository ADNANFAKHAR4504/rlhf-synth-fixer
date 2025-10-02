# CDK Infrastructure for Serverless File Processing System

Here's the complete CDK implementation for the serverless file processing system:

## File: lib/tap_stack.py

```python
"""tap_stack.py
Main CDK stack for the serverless file processing system.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import NestedStack
from constructs import Construct
from .file_processing_stack import FileProcessingStack, FileProcessingStackProps


class TapStackProps(cdk.StackProps):
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[TapStackProps] = None,
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create nested stack for file processing resources
        class NestedFileProcessingStack(NestedStack):
            def __init__(self, scope, id, props=None, **kwargs):
                super().__init__(scope, id, **kwargs)
                self.file_processing = FileProcessingStack(self, "Resource", props=props)

        processing_props = FileProcessingStackProps(
            environment_suffix=environment_suffix
        )

        file_processing_stack = NestedFileProcessingStack(
            self,
            f"FileProcessingStack{environment_suffix}",
            props=processing_props
        )
```

## File: lib/file_processing_stack.py

```python
"""file_processing_stack.py
Stack containing all resources for the serverless file processing system.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    aws_s3 as s3,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_s3_notifications as s3n,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct


class FileProcessingStackProps:
    def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
        self.environment_suffix = environment_suffix


class FileProcessingStack(Construct):
    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[FileProcessingStackProps] = None
    ):
        super().__init__(scope, construct_id)

        environment_suffix = props.environment_suffix if props else 'dev'

        # Create S3 bucket for shipment files
        self.shipment_bucket = s3.Bucket(
            self, f"ShipmentBucket{environment_suffix}",
            bucket_name=f"shipment-files-{cdk.Aws.ACCOUNT_ID}-{cdk.Aws.REGION}-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )

        # Create DynamoDB table for metadata
        self.metadata_table = dynamodb.Table(
            self, f"MetadataTable{environment_suffix}",
            table_name=f"shipment-metadata-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="filename",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="upload_timestamp",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
            point_in_time_recovery=True,
            encryption=dynamodb.TableEncryption.AWS_MANAGED
        )

        # Create CloudWatch log group
        log_group = logs.LogGroup(
            self, f"ProcessorLogGroup{environment_suffix}",
            log_group_name=f"/aws/lambda/shipment-processor-{environment_suffix}",
            retention=logs.RetentionDays.SEVEN,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create IAM role for Lambda
        lambda_role = iam.Role(
            self, f"ProcessorRole{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for shipment file processor Lambda function"
        )

        # Add permissions to Lambda role
        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "s3:GetObject",
                "s3:GetObjectVersion"
            ],
            resources=[f"{self.shipment_bucket.bucket_arn}/*"]
        ))

        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "dynamodb:PutItem"
            ],
            resources=[self.metadata_table.table_arn]
        ))

        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "logs:CreateLogGroup",
                "logs:CreateLogStream",
                "logs:PutLogEvents"
            ],
            resources=[log_group.log_group_arn]
        ))

        lambda_role.add_to_policy(iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "cloudwatch:PutMetricData"
            ],
            resources=["*"],
            conditions={
                "StringEquals": {
                    "cloudwatch:namespace": f"ShipmentProcessing/{environment_suffix}"
                }
            }
        ))

        # Create Lambda function with SnapStart
        self.processor_function = lambda_.Function(
            self, f"ProcessorFunction{environment_suffix}",
            function_name=f"shipment-processor-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_10,
            handler="processor.handler",
            code=lambda_.Code.from_asset("lib/lambda"),
            memory_size=256,
            timeout=Duration.seconds(30),
            environment={
                "METADATA_TABLE": self.metadata_table.table_name,
                "ENVIRONMENT": environment_suffix,
                "METRICS_NAMESPACE": f"ShipmentProcessing/{environment_suffix}"
            },
            role=lambda_role,
            log_group=log_group,
            snap_start=lambda_.SnapStartConf.ON_PUBLISHED_VERSIONS
        )

        # Create Lambda version for SnapStart
        lambda_version = self.processor_function.current_version

        # Add S3 event notification
        self.shipment_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3n.LambdaDestination(lambda_version)
        )

        # Create CloudWatch metrics
        success_metric = cloudwatch.Metric(
            namespace=f"ShipmentProcessing/{environment_suffix}",
            metric_name="ProcessingSuccess",
            statistic="Sum"
        )

        failure_metric = cloudwatch.Metric(
            namespace=f"ShipmentProcessing/{environment_suffix}",
            metric_name="ProcessingFailure",
            statistic="Sum"
        )

        # Create CloudWatch alarm for failure rate
        failure_rate_alarm = cloudwatch.Alarm(
            self, f"FailureRateAlarm{environment_suffix}",
            alarm_name=f"shipment-processing-failure-rate-{environment_suffix}",
            alarm_description="Alert when file processing failure rate exceeds 5%",
            metric=cloudwatch.MathExpression(
                expression="(failures / (successes + failures)) * 100",
                using_metrics={
                    "failures": failure_metric,
                    "successes": success_metric
                },
                period=Duration.minutes(5)
            ),
            threshold=5,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )

        # Outputs
        CfnOutput(
            self, "BucketName",
            value=self.shipment_bucket.bucket_name,
            description="S3 bucket for shipment files"
        )

        CfnOutput(
            self, "TableName",
            value=self.metadata_table.table_name,
            description="DynamoDB table for metadata"
        )

        CfnOutput(
            self, "FunctionName",
            value=self.processor_function.function_name,
            description="Lambda function name"
        )
```

## File: lib/lambda/processor.py

```python
"""processor.py
Lambda function for processing shipment files uploaded to S3.
"""

import json
import os
import time
import boto3
import logging
from datetime import datetime
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb_client = boto3.client('dynamodb')
cloudwatch_client = boto3.client('cloudwatch')

# Environment variables
METADATA_TABLE = os.environ['METADATA_TABLE']
ENVIRONMENT = os.environ['ENVIRONMENT']
METRICS_NAMESPACE = os.environ['METRICS_NAMESPACE']


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process shipment files uploaded to S3.

    Args:
        event: S3 event notification
        context: Lambda context object

    Returns:
        Response with processing status
    """
    start_time = time.time()

    try:
        # Parse S3 event
        for record in event['Records']:
            bucket_name = record['s3']['bucket']['name']
            object_key = record['s3']['object']['key']
            object_size = record['s3']['object']['size']

            logger.info(f"Processing file: s3://{bucket_name}/{object_key}")
            logger.info(f"File size: {object_size} bytes")

            # Get file from S3
            try:
                response = s3_client.get_object(
                    Bucket=bucket_name,
                    Key=object_key
                )
                file_content = response['Body'].read()

                # Process file content (placeholder for actual processing logic)
                processed_records = process_shipment_data(file_content)

                # Calculate processing duration
                processing_duration = time.time() - start_time

                # Store metadata in DynamoDB
                store_metadata(
                    filename=object_key,
                    upload_timestamp=datetime.utcnow().isoformat(),
                    processing_status='SUCCESS',
                    processing_duration=processing_duration,
                    records_processed=processed_records,
                    file_size=object_size
                )

                # Send success metric
                send_metric('ProcessingSuccess', 1)

                logger.info(f"Successfully processed {object_key} in {processing_duration:.2f} seconds")

            except Exception as e:
                logger.error(f"Error processing file {object_key}: {str(e)}")

                # Store failure metadata
                processing_duration = time.time() - start_time
                store_metadata(
                    filename=object_key,
                    upload_timestamp=datetime.utcnow().isoformat(),
                    processing_status='FAILED',
                    processing_duration=processing_duration,
                    error_message=str(e),
                    file_size=object_size
                )

                # Send failure metric
                send_metric('ProcessingFailure', 1)

                raise

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'File processed successfully',
                'processingTime': time.time() - start_time
            })
        }

    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e)
            })
        }


def process_shipment_data(file_content: bytes) -> int:
    """
    Process shipment data from file content.

    Args:
        file_content: Raw file content

    Returns:
        Number of records processed
    """
    try:
        # Decode content
        content_str = file_content.decode('utf-8')

        # Parse as JSON (assuming JSON format for shipment data)
        data = json.loads(content_str)

        # Process each shipment record
        records_processed = 0
        if isinstance(data, list):
            for record in data:
                # Validate required fields
                if all(field in record for field in ['shipment_id', 'status', 'timestamp']):
                    # Process record (placeholder for actual business logic)
                    logger.debug(f"Processing shipment: {record.get('shipment_id')}")
                    records_processed += 1
        elif isinstance(data, dict):
            # Single record
            if all(field in data for field in ['shipment_id', 'status', 'timestamp']):
                logger.debug(f"Processing shipment: {data.get('shipment_id')}")
                records_processed = 1

        return records_processed

    except json.JSONDecodeError as e:
        logger.warning(f"File is not valid JSON, attempting CSV processing: {str(e)}")
        # Fallback to CSV processing
        lines = content_str.split('\n')
        return len([line for line in lines if line.strip()])
    except Exception as e:
        logger.error(f"Error processing shipment data: {str(e)}")
        raise


def store_metadata(filename: str, upload_timestamp: str, processing_status: str,
                  processing_duration: float, **kwargs) -> None:
    """
    Store file metadata in DynamoDB.

    Args:
        filename: Name of the processed file
        upload_timestamp: ISO format timestamp
        processing_status: SUCCESS or FAILED
        processing_duration: Time taken to process in seconds
        **kwargs: Additional metadata fields
    """
    try:
        item = {
            'filename': {'S': filename},
            'upload_timestamp': {'S': upload_timestamp},
            'processing_status': {'S': processing_status},
            'processing_duration': {'N': str(processing_duration)},
            'environment': {'S': ENVIRONMENT}
        }

        # Add optional fields
        for key, value in kwargs.items():
            if value is not None:
                if isinstance(value, (int, float)):
                    item[key] = {'N': str(value)}
                else:
                    item[key] = {'S': str(value)}

        dynamodb_client.put_item(
            TableName=METADATA_TABLE,
            Item=item
        )

        logger.info(f"Metadata stored for {filename}")

    except Exception as e:
        logger.error(f"Error storing metadata: {str(e)}")
        raise


def send_metric(metric_name: str, value: float, unit: str = 'Count') -> None:
    """
    Send custom metric to CloudWatch.

    Args:
        metric_name: Name of the metric
        value: Metric value
        unit: Unit of measurement
    """
    try:
        cloudwatch_client.put_metric_data(
            Namespace=METRICS_NAMESPACE,
            MetricData=[
                {
                    'MetricName': metric_name,
                    'Value': value,
                    'Unit': unit,
                    'Timestamp': datetime.utcnow(),
                    'Dimensions': [
                        {
                            'Name': 'Environment',
                            'Value': ENVIRONMENT
                        }
                    ]
                }
            ]
        )

        logger.debug(f"Metric sent: {metric_name}={value}")

    except Exception as e:
        logger.error(f"Error sending metric: {str(e)}")
```

## File: lib/lambda/__init__.py

```python
"""Lambda functions for file processing."""
```

## File: tests/unit/test_tap_stack.py

```python
"""Unit tests for the TAP stack."""

import aws_cdk as cdk
import pytest
from aws_cdk.assertions import Template, Match
from lib.tap_stack import TapStack, TapStackProps


def test_stack_creates_s3_bucket():
    """Test that the stack creates an S3 bucket with correct configuration."""
    app = cdk.App()
    props = TapStackProps(environment_suffix='test')
    stack = TapStack(app, "TestStack", props=props)
    template = Template.from_stack(stack)

    # Check S3 bucket exists with versioning
    template.has_resource_properties("AWS::S3::Bucket", {
        "VersioningConfiguration": {
            "Status": "Enabled"
        },
        "BucketEncryption": {
            "ServerSideEncryptionConfiguration": Match.any_value()
        }
    })


def test_stack_creates_dynamodb_table():
    """Test that the stack creates a DynamoDB table with correct attributes."""
    app = cdk.App()
    props = TapStackProps(environment_suffix='test')
    stack = TapStack(app, "TestStack", props=props)
    template = Template.from_stack(stack)

    # Check DynamoDB table exists
    template.has_resource_properties("AWS::DynamoDB::Table", {
        "KeySchema": Match.array_with([
            Match.object_like({
                "AttributeName": "filename",
                "KeyType": "HASH"
            }),
            Match.object_like({
                "AttributeName": "upload_timestamp",
                "KeyType": "RANGE"
            })
        ]),
        "BillingMode": "PAY_PER_REQUEST"
    })


def test_stack_creates_lambda_function():
    """Test that the stack creates a Lambda function with correct configuration."""
    app = cdk.App()
    props = TapStackProps(environment_suffix='test')
    stack = TapStack(app, "TestStack", props=props)
    template = Template.from_stack(stack)

    # Check Lambda function exists
    template.has_resource_properties("AWS::Lambda::Function", {
        "Runtime": "python3.10",
        "MemorySize": 256,
        "Timeout": 30,
        "Handler": "processor.handler"
    })


def test_stack_creates_cloudwatch_alarm():
    """Test that the stack creates a CloudWatch alarm for failure rate."""
    app = cdk.App()
    props = TapStackProps(environment_suffix='test')
    stack = TapStack(app, "TestStack", props=props)
    template = Template.from_stack(stack)

    # Check CloudWatch alarm exists
    template.has_resource_properties("AWS::CloudWatch::Alarm", {
        "ComparisonOperator": "GreaterThanThreshold",
        "EvaluationPeriods": 1,
        "Threshold": 5
    })


def test_lambda_has_correct_permissions():
    """Test that Lambda function has correct IAM permissions."""
    app = cdk.App()
    props = TapStackProps(environment_suffix='test')
    stack = TapStack(app, "TestStack", props=props)
    template = Template.from_stack(stack)

    # Check IAM role policies
    template.has_resource_properties("AWS::IAM::Policy", {
        "PolicyDocument": Match.object_like({
            "Statement": Match.array_with([
                Match.object_like({
                    "Action": Match.array_with(["s3:GetObject", "s3:GetObjectVersion"]),
                    "Effect": "Allow"
                }),
                Match.object_like({
                    "Action": "dynamodb:PutItem",
                    "Effect": "Allow"
                })
            ])
        })
    })


def test_s3_event_notification_configured():
    """Test that S3 bucket has event notification for Lambda."""
    app = cdk.App()
    props = TapStackProps(environment_suffix='test')
    stack = TapStack(app, "TestStack", props=props)
    template = Template.from_stack(stack)

    # Check for Lambda permission for S3 to invoke
    template.has_resource_properties("AWS::Lambda::Permission", {
        "Principal": "s3.amazonaws.com",
        "Action": "lambda:InvokeFunction"
    })
```

## File: tests/unit/test_lambda.py

```python
"""Unit tests for Lambda function."""

import json
import os
import pytest
from unittest.mock import Mock, patch, MagicMock
import sys

# Add lambda directory to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '../../lib/lambda'))

# Set environment variables before import
os.environ['METADATA_TABLE'] = 'test-table'
os.environ['ENVIRONMENT'] = 'test'
os.environ['METRICS_NAMESPACE'] = 'TestNamespace'

from processor import handler, process_shipment_data, store_metadata, send_metric


@pytest.fixture
def s3_event():
    """Create a sample S3 event."""
    return {
        'Records': [{
            's3': {
                'bucket': {'name': 'test-bucket'},
                'object': {
                    'key': 'test-file.json',
                    'size': 1024
                }
            }
        }]
    }


@patch('processor.s3_client')
@patch('processor.dynamodb_client')
@patch('processor.cloudwatch_client')
def test_handler_success(mock_cw, mock_ddb, mock_s3, s3_event):
    """Test successful file processing."""
    # Mock S3 response
    mock_s3.get_object.return_value = {
        'Body': MagicMock(read=lambda: b'{"shipment_id": "123", "status": "delivered", "timestamp": "2024-01-01T00:00:00Z"}')
    }

    # Call handler
    result = handler(s3_event, None)

    # Assertions
    assert result['statusCode'] == 200
    assert 'File processed successfully' in result['body']
    mock_ddb.put_item.assert_called_once()
    mock_cw.put_metric_data.assert_called()


@patch('processor.s3_client')
@patch('processor.dynamodb_client')
@patch('processor.cloudwatch_client')
def test_handler_failure(mock_cw, mock_ddb, mock_s3, s3_event):
    """Test file processing failure."""
    # Mock S3 error
    mock_s3.get_object.side_effect = Exception("S3 error")

    # Call handler
    result = handler(s3_event, None)

    # Assertions
    assert result['statusCode'] == 500
    assert 'error' in result['body']


def test_process_shipment_data_json():
    """Test processing JSON shipment data."""
    data = b'[{"shipment_id": "1", "status": "shipped", "timestamp": "2024-01-01"}]'
    result = process_shipment_data(data)
    assert result == 1


def test_process_shipment_data_csv():
    """Test processing CSV shipment data."""
    data = b'header\nrow1\nrow2\nrow3'
    result = process_shipment_data(data)
    assert result == 4


@patch('processor.dynamodb_client')
def test_store_metadata(mock_ddb):
    """Test storing metadata to DynamoDB."""
    store_metadata(
        filename='test.json',
        upload_timestamp='2024-01-01T00:00:00Z',
        processing_status='SUCCESS',
        processing_duration=1.5,
        records_processed=10
    )

    mock_ddb.put_item.assert_called_once()
    call_args = mock_ddb.put_item.call_args[1]
    assert call_args['TableName'] == 'test-table'
    assert 'filename' in call_args['Item']


@patch('processor.cloudwatch_client')
def test_send_metric(mock_cw):
    """Test sending metrics to CloudWatch."""
    send_metric('TestMetric', 1.0)

    mock_cw.put_metric_data.assert_called_once()
    call_args = mock_cw.put_metric_data.call_args[1]
    assert call_args['Namespace'] == 'TestNamespace'
    assert call_args['MetricData'][0]['MetricName'] == 'TestMetric'
```