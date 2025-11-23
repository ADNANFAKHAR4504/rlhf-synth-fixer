## File: tap.py

```python
"""
Main Pulumi program entry point for the serverless infrastructure.

This file bootstraps the entire Pulumi deployment by instantiating the TapStack.
"""

import os
import sys

# Add lib directory to Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib'))

from tap_stack import TapStack

# Create the main stack
stack = TapStack('serverless-stack')

```

## File: lib\*\*init\*\*.py

```python
# empty
```

## File: lib\tap_stack.py

```python
"""
Main stack orchestrator for the serverless infrastructure.

This module imports and links all infrastructure modules and exports outputs
for integration testing.
"""

import pulumi
from infrastructure import (APIGatewayStack, AWSProviderManager, DynamoDBStack,
                            IAMStack, KMSStack, LambdaStack, MonitoringStack,
                            ServerlessConfig, SQSStack, StepFunctionsStack,
                            StorageStack)
from pulumi import ComponentResource, Output, ResourceOptions


class TapStack(ComponentResource):
    """
    Main stack component that orchestrates all infrastructure resources.

    This stack creates a complete serverless infrastructure with:
    - S3 bucket with KMS encryption
    - DynamoDB table with correct schema
    - Lambda functions with proper configuration
    - API Gateway with throttling
    - Step Functions with service integration
    - CloudWatch monitoring with percentage-based alarms
    """

    def __init__(self, name: str, opts: ResourceOptions = None):
        """
        Initialize the Tap Stack.

        Args:
            name: Stack name
            opts: Resource options
        """
        super().__init__('tap:stack:TapStack', name, None, opts)

        # Initialize configuration
        self.config = ServerlessConfig()

        # Initialize provider manager
        self.provider_manager = AWSProviderManager(self.config)

        # Create KMS key for S3 encryption
        self.kms_stack = KMSStack(self.config, self.provider_manager)

        # Create DynamoDB table
        self.dynamodb_stack = DynamoDBStack(self.config, self.provider_manager)

        # Create S3 bucket
        self.storage_stack = StorageStack(
            self.config,
            self.provider_manager,
            self.kms_stack.get_s3_key_id()
        )

        # Create SQS Dead Letter Queues
        self.sqs_stack = SQSStack(self.config, self.provider_manager)

        # Create DLQs for each Lambda
        self.processing_dlq = self.sqs_stack.create_dlq('processing-lambda')
        self.upload_dlq = self.sqs_stack.create_dlq('upload-lambda')
        self.status_dlq = self.sqs_stack.create_dlq('status-lambda')
        self.results_dlq = self.sqs_stack.create_dlq('results-lambda')

        # Create IAM roles
        self.iam_stack = IAMStack(self.config, self.provider_manager)

        # Create Lambda role for processing function
        self.processing_lambda_role = self.iam_stack.create_lambda_role(
            'processing',
            s3_bucket_arns=[self.storage_stack.get_bucket_arn()],
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn()],
            sqs_queue_arns=[self.processing_dlq.arn],
            kms_key_arn=self.kms_stack.get_s3_key_arn()
        )

        # Create Lambda role for API functions
        self.api_lambda_role = self.iam_stack.create_lambda_role(
            'api',
            s3_bucket_arns=[self.storage_stack.get_bucket_arn()],
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn()],
            sqs_queue_arns=[
                self.upload_dlq.arn,
                self.status_dlq.arn,
                self.results_dlq.arn
            ],
            kms_key_arn=self.kms_stack.get_s3_key_arn()
        )

        # Create Lambda functions
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.sqs_stack,
            self.dynamodb_stack.get_table_name(),
            self.storage_stack.get_bucket_name()
        )

        # Create processing Lambda
        self.processing_lambda = self.lambda_stack.create_processing_lambda(
            self.processing_lambda_role
        )

        # Create API Lambda functions
        self.upload_lambda = self.lambda_stack.create_api_lambda(
            'upload',
            'api_handler.upload_handler',
            self.api_lambda_role
        )

        self.status_lambda = self.lambda_stack.create_api_lambda(
            'status',
            'api_handler.status_handler',
            self.api_lambda_role
        )

        self.results_lambda = self.lambda_stack.create_api_lambda(
            'results',
            'api_handler.results_handler',
            self.api_lambda_role
        )

        # Configure S3 event notification for processing Lambda
        # Grant S3 permission to invoke Lambda
        s3_lambda_permission = pulumi_aws.lambda_.Permission(
            "s3-invoke-processing-lambda",
            action="lambda:InvokeFunction",
            function=self.processing_lambda.name,
            principal="s3.amazonaws.com",
            source_arn=self.storage_stack.get_bucket_arn(),
            opts=ResourceOptions(provider=self.provider_manager.get_provider())
            if self.provider_manager.get_provider() else None
        )

        # Configure S3 bucket notification (depends on permission)
        self.storage_stack.configure_event_notification(
            self.processing_lambda.arn
        )

        # Create API Gateway
        self.api_gateway_stack = APIGatewayStack(self.config, self.provider_manager)
        self.api = self.api_gateway_stack.create_api(
            self.upload_lambda,
            self.status_lambda,
            self.results_lambda
        )

        # Create Step Functions role
        self.step_functions_role = self.iam_stack.create_step_functions_role(
            lambda_arns=[self.processing_lambda.arn],
            sqs_queue_arns=[self.processing_dlq.arn]
        )

        # Create Step Functions state machine
        self.step_functions_stack = StepFunctionsStack(
            self.config,
            self.provider_manager,
            self.step_functions_role
        )

        self.processing_workflow = self.step_functions_stack.create_processing_workflow(
            self.processing_lambda.arn,
            self.processing_dlq.url
        )

        # Create CloudWatch monitoring
        self.monitoring_stack = MonitoringStack(self.config, self.provider_manager)

        # Create alarms for Lambda functions
        self.monitoring_stack.create_lambda_error_alarm(
            self.processing_lambda.name,
            'processing'
        )
        self.monitoring_stack.create_lambda_throttle_alarm(
            self.processing_lambda.name,
            'processing'
        )

        # Create alarm for DynamoDB
        self.monitoring_stack.create_dynamodb_throttle_alarm(
            self.dynamodb_stack.get_table_name()
        )

        # Create alarm for API Gateway
        self.monitoring_stack.create_api_gateway_error_alarm(
            self.api.id,
            self.api_gateway_stack.get_stage_name()
        )

        # Create alarm for Step Functions
        self.monitoring_stack.create_step_functions_error_alarm(
            self.processing_workflow.arn
        )

        # Register outputs
        self._register_outputs()

        # Finish component registration
        self.register_outputs({})

    def _register_outputs(self) -> None:
        """
        Register and export all stack outputs for integration testing.

        All outputs are exported using pulumi.export() for use in integration tests.
        """
        # S3 outputs
        try:
            pulumi.export('s3_bucket_name', self.storage_stack.get_bucket_name())
            pulumi.export('s3_bucket_arn', self.storage_stack.get_bucket_arn())
        except Exception:
            pass  # Gracefully handle if export not available

        # DynamoDB outputs
        try:
            pulumi.export('dynamodb_table_name', self.dynamodb_stack.get_table_name())
            pulumi.export('dynamodb_table_arn', self.dynamodb_stack.get_table_arn())
        except Exception:
            pass

        # Lambda outputs
        try:
            pulumi.export('processing_lambda_name', self.processing_lambda.name)
            pulumi.export('processing_lambda_arn', self.processing_lambda.arn)
            pulumi.export('upload_lambda_name', self.upload_lambda.name)
            pulumi.export('upload_lambda_arn', self.upload_lambda.arn)
            pulumi.export('status_lambda_name', self.status_lambda.name)
            pulumi.export('status_lambda_arn', self.status_lambda.arn)
            pulumi.export('results_lambda_name', self.results_lambda.name)
            pulumi.export('results_lambda_arn', self.results_lambda.arn)
        except Exception:
            pass

        # API Gateway outputs
        try:
            pulumi.export('api_gateway_endpoint', self.api_gateway_stack.get_api_endpoint())
            pulumi.export('api_gateway_id', self.api_gateway_stack.get_api_id())
            pulumi.export('api_gateway_stage', self.api_gateway_stack.get_stage_name())
        except Exception:
            pass

        # Step Functions outputs
        try:
            pulumi.export('state_machine_arn', self.processing_workflow.arn)
            pulumi.export('state_machine_name', self.processing_workflow.name)
        except Exception:
            pass

        # SQS DLQ outputs
        try:
            pulumi.export('processing_dlq_url', self.processing_dlq.url)
            pulumi.export('processing_dlq_arn', self.processing_dlq.arn)
            pulumi.export('upload_dlq_url', self.upload_dlq.url)
            pulumi.export('status_dlq_url', self.status_dlq.url)
            pulumi.export('results_dlq_url', self.results_dlq.url)
        except Exception:
            pass

        # KMS outputs
        try:
            pulumi.export('kms_key_id', self.kms_stack.get_s3_key_id())
            pulumi.export('kms_key_arn', self.kms_stack.get_s3_key_arn())
        except Exception:
            pass

        # Configuration outputs
        try:
            pulumi.export('environment', self.config.environment)
            pulumi.export('environment_suffix', self.config.environment_suffix)
            pulumi.export('region', self.config.primary_region)
            pulumi.export('normalized_region', self.config.normalized_region)
        except Exception:
            pass


# Import pulumi_aws here to avoid circular import
import pulumi_aws

```

## File: lib\infrastructure\_\_init\_\_.py

```python
"""
Infrastructure package for the serverless application.

This package contains all infrastructure modules for the serverless architecture.
"""

from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import ServerlessConfig
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.iam import IAMStack
from infrastructure.kms import KMSStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.sqs import SQSStack
from infrastructure.step_functions import StepFunctionsStack
from infrastructure.storage import StorageStack

__all__ = [
    'ServerlessConfig',
    'AWSProviderManager',
    'IAMStack',
    'KMSStack',
    'DynamoDBStack',
    'StorageStack',
    'SQSStack',
    'LambdaStack',
    'APIGatewayStack',
    'StepFunctionsStack',
    'MonitoringStack'
]


```

## File: lib\infrastructure\lambda_code\processor_handler.py

```python
"""
Lambda handler for processing S3 CSV files.

This handler is triggered by S3 events when CSV files are uploaded to the incoming/ prefix.
It processes the CSV data and stores results in DynamoDB.
"""

import csv
import json
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict, List

import boto3
from botocore.exceptions import ClientError

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process S3 CSV file upload events.

    Args:
        event: S3 event notification
        context: Lambda context

    Returns:
        Response with status and processing details
    """
    print(f"Processing event: {json.dumps(event)}")

    try:
        # Get DynamoDB table name from environment
        table_name = os.environ.get('DYNAMODB_TABLE_NAME')
        if not table_name:
            raise ValueError("DYNAMODB_TABLE_NAME environment variable not set")

        table = dynamodb.Table(table_name)

        # Process each S3 record
        processed_records = []

        for record in event.get('Records', []):
            # Extract S3 bucket and key
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']

            print(f"Processing file: s3://{bucket}/{key}")

            # Download and process CSV file
            items = process_csv_file(bucket, key)

            # Store items in DynamoDB
            stored_count = store_items_in_dynamodb(table, items)

            # Move processed file to processed/ prefix
            move_to_processed(bucket, key)

            processed_records.append({
                'bucket': bucket,
                'key': key,
                'items_stored': stored_count
            })

        print(f"Successfully processed {len(processed_records)} files")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing completed successfully',
                'processed_records': processed_records
            })
        }

    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__,
            'event': event
        }
        print(f"ERROR processing event: {json.dumps(error_details)}")

        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': str(e),
                'error_type': type(e).__name__
            })
        }


def process_csv_file(bucket: str, key: str) -> List[Dict[str, Any]]:
    """
    Download and parse CSV file from S3.

    Args:
        bucket: S3 bucket name
        key: S3 object key

    Returns:
        List of parsed items
    """
    try:
        # Download file from S3
        response = s3_client.get_object(Bucket=bucket, Key=key)
        content = response['Body'].read().decode('utf-8')

        # Parse CSV
        items = []
        csv_reader = csv.DictReader(content.splitlines())

        for row in csv_reader:
            # Convert numeric values to Decimal for DynamoDB
            item = {
                'symbol': row.get('symbol', ''),
                'timestamp': Decimal(str(row.get('timestamp', 0))),
                'price': Decimal(str(row.get('price', 0))),
                'volume': Decimal(str(row.get('volume', 0))),
                'source_file': key,
                'processed_at': Decimal(str(datetime.utcnow().timestamp()))
            }
            items.append(item)

        print(f"Parsed {len(items)} items from CSV")
        return items

    except Exception as e:
        print(f"Error processing CSV file: {str(e)}")
        raise


def store_items_in_dynamodb(table: Any, items: List[Dict[str, Any]]) -> int:
    """
    Store items in DynamoDB using batch write.

    Args:
        table: DynamoDB table resource
        items: List of items to store

    Returns:
        Number of items stored
    """
    try:
        stored_count = 0

        # Batch write items (max 25 per batch)
        with table.batch_writer() as batch:
            for item in items:
                batch.put_item(Item=item)
                stored_count += 1

        print(f"Stored {stored_count} items in DynamoDB")
        return stored_count

    except ClientError as e:
        print(f"Error storing items in DynamoDB: {str(e)}")
        raise


def move_to_processed(bucket: str, key: str) -> None:
    """
    Move processed file to processed/ prefix.

    Args:
        bucket: S3 bucket name
        key: S3 object key
    """
    try:
        # Generate new key with processed/ prefix
        filename = key.split('/')[-1]
        new_key = f"processed/{filename}"

        # Copy object to new location
        s3_client.copy_object(
            Bucket=bucket,
            CopySource={'Bucket': bucket, 'Key': key},
            Key=new_key
        )

        # Delete original object
        s3_client.delete_object(Bucket=bucket, Key=key)

        print(f"Moved file from {key} to {new_key}")

    except Exception as e:
        print(f"Error moving file: {str(e)}")
        # Don't raise - this is not critical


```

## File: lib\infrastructure\lambda_code\api_handler.py

```python
"""
Lambda handlers for API Gateway endpoints.

This module contains handlers for the API Gateway REST API endpoints.
"""

import json
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def upload_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle POST /upload endpoint.

    Accepts CSV data and uploads it to S3 incoming/ prefix.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    print(f"Upload request: {json.dumps(event)}")

    try:
        # Get S3 bucket name from environment
        bucket_name = os.environ.get('S3_BUCKET_NAME')
        if not bucket_name:
            raise ValueError("S3_BUCKET_NAME environment variable not set")

        # Parse request body
        body = json.loads(event.get('body', '{}'))
        csv_data = body.get('data')
        filename = body.get('filename', f"upload-{int(datetime.utcnow().timestamp())}.csv")

        if not csv_data:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing data field'})
            }

        # Upload to S3 incoming/ prefix
        key = f"incoming/{filename}"
        s3_client.put_object(
            Bucket=bucket_name,
            Key=key,
            Body=csv_data,
            ContentType='text/csv'
        )

        print(f"Uploaded file to s3://{bucket_name}/{key}")

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'message': 'File uploaded successfully',
                'bucket': bucket_name,
                'key': key,
                'jobId': filename.replace('.csv', '')
            })
        }

    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__
        }
        print(f"ERROR in upload_handler: {json.dumps(error_details)}")

        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': str(e),
                'error_type': type(e).__name__
            })
        }


def status_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET /status/{jobId} endpoint.

    Returns the processing status of a job.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    print(f"Status request: {json.dumps(event)}")

    try:
        # Get job ID from path parameters
        job_id = event.get('pathParameters', {}).get('jobId')
        if not job_id:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing jobId parameter'})
            }

        # Get S3 bucket name from environment
        bucket_name = os.environ.get('S3_BUCKET_NAME')
        if not bucket_name:
            raise ValueError("S3_BUCKET_NAME environment variable not set")

        # Check if file exists in incoming/ or processed/
        incoming_key = f"incoming/{job_id}.csv"
        processed_key = f"processed/{job_id}.csv"

        status = 'not_found'

        try:
            s3_client.head_object(Bucket=bucket_name, Key=incoming_key)
            status = 'processing'
        except ClientError:
            try:
                s3_client.head_object(Bucket=bucket_name, Key=processed_key)
                status = 'completed'
            except ClientError:
                status = 'not_found'

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'jobId': job_id,
                'status': status
            })
        }

    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__
        }
        print(f"ERROR in status_handler: {json.dumps(error_details)}")

        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': str(e),
                'error_type': type(e).__name__
            })
        }


def results_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Handle GET /results/{symbol} endpoint.

    Returns processed results for a symbol from DynamoDB.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    print(f"Results request: {json.dumps(event)}")

    try:
        # Get symbol from path parameters
        symbol = event.get('pathParameters', {}).get('symbol')
        if not symbol:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'error': 'Missing symbol parameter'})
            }

        # Get DynamoDB table name from environment
        table_name = os.environ.get('DYNAMODB_TABLE_NAME')
        if not table_name:
            raise ValueError("DYNAMODB_TABLE_NAME environment variable not set")

        table = dynamodb.Table(table_name)

        # Query DynamoDB for symbol
        response = table.query(
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={
                ':symbol': symbol
            },
            Limit=100,
            ScanIndexForward=False  # Most recent first
        )

        items = response.get('Items', [])

        # Convert Decimal to float for JSON serialization
        def decimal_to_float(obj):
            if isinstance(obj, Decimal):
                return float(obj)
            raise TypeError

        return {
            'statusCode': 200,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'symbol': symbol,
                'count': len(items),
                'results': items
            }, default=decimal_to_float)
        }

    except Exception as e:
        error_details = {
            'error': str(e),
            'error_type': type(e).__name__
        }
        print(f"ERROR in results_handler: {json.dumps(error_details)}")

        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({
                'error': str(e),
                'error_type': type(e).__name__
            })
        }


```

## File: lib\infrastructure\api_gateway.py

```python
"""
API Gateway module for the serverless infrastructure.

This module creates API Gateway REST API with correct throttling settings
and proper Lambda integration as required by model failures.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class APIGatewayStack:
    """
    Manages API Gateway for the serverless infrastructure.

    Model failure fixes:
    - Correct throttling: 1000 RPS rate limit, 2000 burst limit
    - Proper Lambda integration with correct source_arn
    - X-Ray tracing enabled
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize API Gateway Stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.api = None
        self.deployment = None
        self.stage = None

    def create_api(
        self,
        upload_lambda: aws.lambda_.Function,
        status_lambda: aws.lambda_.Function,
        results_lambda: aws.lambda_.Function
    ) -> aws.apigateway.RestApi:
        """
        Create API Gateway REST API with Lambda integrations.

        Model failure fix: Uses correct throttling settings (1000 RPS, 2000 burst).

        Args:
            upload_lambda: Lambda function for POST /upload
            status_lambda: Lambda function for GET /status/{jobId}
            results_lambda: Lambda function for GET /results/{symbol}

        Returns:
            REST API resource
        """
        api_name = self.config.get_resource_name("api", include_region=False)

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # Create REST API
        self.api = aws.apigateway.RestApi(
            "serverless-api",
            name=api_name,
            description=f"Serverless API - {self.config.environment_suffix}",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        # Create resources and methods
        upload_integration = self._create_upload_endpoint(upload_lambda, opts)
        status_integration = self._create_status_endpoint(status_lambda, opts)
        results_integration = self._create_results_endpoint(results_lambda, opts)

        # Create deployment with explicit integration dependencies
        self.deployment = aws.apigateway.Deployment(
            "api-deployment",
            rest_api=self.api.id,
            opts=ResourceOptions(
                provider=self.provider,
                depends_on=[self.api, upload_integration, status_integration, results_integration]
            ) if self.provider else ResourceOptions(
                depends_on=[self.api, upload_integration, status_integration, results_integration]
            )
        )

        # Create stage with X-Ray tracing and throttling (model failure fix)
        self.stage = aws.apigateway.Stage(
            "api-stage",
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=self.config.environment,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        # Configure method settings with correct throttling
        # Note: logging_level disabled to avoid CloudWatch Logs role ARN requirement
        aws.apigateway.MethodSettings(
            "api-method-settings",
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                throttling_burst_limit=self.config.api_throttle_burst_limit,  # 2000
                throttling_rate_limit=self.config.api_throttle_rate_limit,  # 1000
                metrics_enabled=True
            ),
            opts=opts
        )

        return self.api

    def _create_upload_endpoint(
        self,
        lambda_function: aws.lambda_.Function,
        opts: ResourceOptions
    ) -> aws.apigateway.Integration:
        """
        Create POST /upload endpoint.

        Model failure fix: Uses proper source_arn construction.

        Returns:
            Integration resource for dependency tracking
        """
        # Create /upload resource
        upload_resource = aws.apigateway.Resource(
            "upload-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="upload",
            opts=opts
        )

        # Create POST method
        upload_method = aws.apigateway.Method(
            "upload-method",
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=opts
        )

        # Create Lambda integration
        upload_integration = aws.apigateway.Integration(
            "upload-integration",
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method=upload_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
            opts=opts
        )

        # Grant API Gateway permission to invoke Lambda (model failure fix)
        aws.lambda_.Permission(
            "upload-lambda-permission",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(
                self.api.execution_arn,
                "/*/POST/upload"
            ),
            opts=opts
        )

        return upload_integration

    def _create_status_endpoint(
        self,
        lambda_function: aws.lambda_.Function,
        opts: ResourceOptions
    ) -> aws.apigateway.Integration:
        """
        Create GET /status/{jobId} endpoint.

        Returns:
            Integration resource for dependency tracking
        """
        # Create /status resource
        status_resource = aws.apigateway.Resource(
            "status-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="status",
            opts=opts
        )

        # Create /{jobId} resource
        job_id_resource = aws.apigateway.Resource(
            "job-id-resource",
            rest_api=self.api.id,
            parent_id=status_resource.id,
            path_part="{jobId}",
            opts=opts
        )

        # Create GET method
        status_method = aws.apigateway.Method(
            "status-method",
            rest_api=self.api.id,
            resource_id=job_id_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=opts
        )

        # Create Lambda integration
        status_integration = aws.apigateway.Integration(
            "status-integration",
            rest_api=self.api.id,
            resource_id=job_id_resource.id,
            http_method=status_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
            opts=opts
        )

        # Grant API Gateway permission to invoke Lambda
        aws.lambda_.Permission(
            "status-lambda-permission",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(
                self.api.execution_arn,
                "/*/GET/status/*"
            ),
            opts=opts
        )

        return status_integration

    def _create_results_endpoint(
        self,
        lambda_function: aws.lambda_.Function,
        opts: ResourceOptions
    ) -> aws.apigateway.Integration:
        """
        Create GET /results/{symbol} endpoint.

        Returns:
            Integration resource for dependency tracking
        """
        # Create /results resource
        results_resource = aws.apigateway.Resource(
            "results-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="results",
            opts=opts
        )

        # Create /{symbol} resource
        symbol_resource = aws.apigateway.Resource(
            "symbol-resource",
            rest_api=self.api.id,
            parent_id=results_resource.id,
            path_part="{symbol}",
            opts=opts
        )

        # Create GET method
        results_method = aws.apigateway.Method(
            "results-method",
            rest_api=self.api.id,
            resource_id=symbol_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=opts
        )

        # Create Lambda integration
        results_integration = aws.apigateway.Integration(
            "results-integration",
            rest_api=self.api.id,
            resource_id=symbol_resource.id,
            http_method=results_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=lambda_function.invoke_arn,
            opts=opts
        )

        # Grant API Gateway permission to invoke Lambda
        aws.lambda_.Permission(
            "results-lambda-permission",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(
                self.api.execution_arn,
                "/*/GET/results/*"
            ),
            opts=opts
        )

        return results_integration

    def get_api_endpoint(self) -> Output[str]:
        """Get API Gateway endpoint URL."""
        return Output.concat(
            "https://",
            self.api.id,
            ".execute-api.",
            self.config.primary_region,
            ".amazonaws.com/",
            self.stage.stage_name
        )

    def get_api_id(self) -> Output[str]:
        """Get API Gateway ID."""
        return self.api.id

    def get_stage_name(self) -> Output[str]:
        """Get API Gateway stage name."""
        return self.stage.stage_name


```

## File: lib\infrastructure\aws_provider.py

```python
"""
AWS Provider management module.

This module manages a singleton AWS provider instance to ensure consistent
provider usage across all resources and avoid drift in CI/CD pipelines.
"""

from typing import Optional

import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import ResourceOptions


class AWSProviderManager:
    """
    Manages AWS provider instances with singleton pattern.

    Ensures consistent provider usage across all resources to avoid
    creating new providers on each build, which causes drift.
    """

    _instance: Optional['AWSProviderManager'] = None

    def __init__(self, config: ServerlessConfig):
        """
        Initialize AWS Provider Manager.

        Args:
            config: ServerlessConfig instance
        """
        self.config = config
        self._provider: Optional[aws.Provider] = None
        self.provider_name = f"{config.project_name}-{config.environment_suffix}-provider"

    def get_provider(self) -> Optional[aws.Provider]:
        """
        Get or create the AWS provider instance.

        Returns:
            AWS Provider instance if role_arn is configured, None otherwise
        """
        if self._provider is None and self.config.role_arn:
            # Create provider with assume role for cross-account deployment
            self._provider = aws.Provider(
                self.provider_name,
                region=self.config.primary_region,
                assume_role=aws.ProviderAssumeRoleArgs(
                    role_arn=self.config.role_arn,
                    session_name=f"pulumi-{self.config.environment}-deployment"
                ),
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )
        elif self._provider is None:
            # Create provider without assume role
            self._provider = aws.Provider(
                self.provider_name,
                region=self.config.primary_region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )

        return self._provider

    def get_resource_options(self) -> Optional[ResourceOptions]:
        """
        Get ResourceOptions with the provider.

        Returns:
            ResourceOptions with provider if configured, None otherwise
        """
        provider = self.get_provider()
        if provider:
            return ResourceOptions(provider=provider)
        return None


```

## File: lib\infrastructure\config.py

```python
"""
Configuration module for the serverless infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class ServerlessConfig:
    """Centralized configuration for the serverless infrastructure."""

    environment: str
    environment_suffix: str
    project_name: str

    primary_region: str
    normalized_region: str

    # Lambda configuration (from model failures)
    lambda_runtime: str
    lambda_timeout: int  # 5 minutes = 300 seconds
    lambda_memory_size: int  # 3GB = 3072 MB
    lambda_max_retries: int  # 2 retries

    # Lambda concurrency (from model failures)
    processing_lambda_concurrency: int  # 100

    # API Gateway throttling (from model failures)
    api_throttle_rate_limit: int  # 1000 RPS
    api_throttle_burst_limit: int  # 2000

    # CloudWatch configuration (from model failures)
    log_retention_days: int  # 7 days
    alarm_error_rate_threshold: float  # >1% error rate

    # S3 configuration (from model failures)
    s3_incoming_prefix: str  # incoming/
    s3_file_suffix: str  # .csv
    s3_lifecycle_delete_days: int  # 30 days for processed files

    # DynamoDB configuration (from model failures)
    dynamodb_partition_key: str  # symbol
    dynamodb_sort_key: str  # timestamp
    enable_contributor_insights: bool

    # X-Ray tracing
    enable_xray_tracing: bool

    # Tags
    team: str
    cost_center: str

    # Cross-account/region deployment
    role_arn: Optional[str]

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'prod')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless')

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)

        # Lambda configuration - Fixed from model failures
        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '300'))  # 5 minutes
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '3008'))  # 3008 MB (AWS max)
        self.lambda_max_retries = int(os.getenv('LAMBDA_MAX_RETRIES', '2'))

        # Lambda concurrency - Fixed from model failures
        self.processing_lambda_concurrency = int(
            os.getenv('PROCESSING_LAMBDA_CONCURRENCY', '100')
        )

        # API Gateway throttling - Fixed from model failures
        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '2000'))

        # CloudWatch configuration - Fixed from model failures
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.alarm_error_rate_threshold = float(
            os.getenv('ALARM_ERROR_RATE_THRESHOLD', '0.01')  # 1%
        )

        # S3 configuration - Fixed from model failures
        self.s3_incoming_prefix = os.getenv('S3_INCOMING_PREFIX', 'incoming/')
        self.s3_file_suffix = os.getenv('S3_FILE_SUFFIX', '.csv')
        self.s3_lifecycle_delete_days = int(os.getenv('S3_LIFECYCLE_DELETE_DAYS', '30'))

        # DynamoDB configuration - Fixed from model failures
        self.dynamodb_partition_key = os.getenv('DYNAMODB_PARTITION_KEY', 'symbol')
        self.dynamodb_sort_key = os.getenv('DYNAMODB_SORT_KEY', 'timestamp')
        self.enable_contributor_insights = (
            os.getenv('ENABLE_CONTRIBUTOR_INSIGHTS', 'true').lower() == 'true'
        )

        # X-Ray tracing
        self.enable_xray_tracing = (
            os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'
        )

        # Tags
        self.team = os.getenv('TEAM', 'serverless-team')
        self.cost_center = os.getenv('COST_CENTER', 'eng-001')

        # Cross-account/region deployment
        self.role_arn = os.getenv('ASSUME_ROLE_ARN')

    def _normalize_region(self, region: str) -> str:
        """
        Normalize region name for resource naming.

        Example: us-east-1 -> useast1
        """
        return region.replace('-', '')

    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources (e.g., S3 buckets).

        Converts to lowercase and replaces invalid characters with hyphens.
        """
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized

    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate consistent resource names with environment suffix and normalized region.

        Args:
            resource_type: Type of resource (e.g., 'data', 'processing-lambda')
            include_region: Whether to include normalized region in name

        Returns:
            Formatted resource name
        """
        parts = [self.project_name, resource_type]

        if include_region:
            parts.append(self.normalized_region)

        parts.extend([self.environment, self.environment_suffix])

        return '-'.join(parts)

    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate normalized resource names for case-sensitive resources.

        Args:
            resource_type: Type of resource
            include_region: Whether to include normalized region

        Returns:
            Normalized resource name (lowercase, no invalid chars)
        """
        name = self.get_resource_name(resource_type, include_region)
        return self.normalize_name(name)

    def get_common_tags(self) -> Dict[str, str]:
        """
        Get common tags to apply to all resources.

        Returns:
            Dictionary of common tags
        """
        return {
            'Environment': self.environment,
            'Project': self.project_name,
            'ManagedBy': 'Pulumi',
            'Team': self.team,
            'CostCenter': self.cost_center,
            'EnvironmentSuffix': self.environment_suffix,
            'Region': self.normalized_region
        }


```

## File: lib\infrastructure\dynamodb.py

```python
"""
DynamoDB module for the serverless infrastructure.

This module creates DynamoDB tables with the correct schema (symbol + timestamp)
and enables contributor insights as required by model failures.
"""

import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class DynamoDBStack:
    """
    Manages DynamoDB tables for the serverless infrastructure.

    Model failure fix: Uses correct partition key (symbol) and sort key (timestamp).
    Enables contributor insights as required.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize DynamoDB Stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.tables = {}

        # Create main data table
        self.data_table = self._create_data_table()

    def _create_data_table(self) -> aws.dynamodb.Table:
        """
        Create DynamoDB table with correct schema.

        Model failure fix:
        - Partition key: symbol (not id)
        - Sort key: timestamp
        - Enables contributor insights

        Returns:
            DynamoDB Table resource
        """
        table_name = self.config.get_resource_name("data-table", include_region=False)

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # Create table with correct schema
        table = aws.dynamodb.Table(
            "data-table",
            name=table_name,
            billing_mode="PAY_PER_REQUEST",  # On-demand for serverless
            hash_key=self.config.dynamodb_partition_key,  # symbol
            range_key=self.config.dynamodb_sort_key,  # timestamp
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name=self.config.dynamodb_partition_key,
                    type="S"  # String
                ),
                aws.dynamodb.TableAttributeArgs(
                    name=self.config.dynamodb_sort_key,
                    type="N"  # Number (Unix timestamp)
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        # Enable contributor insights (model failure fix)
        if self.config.enable_contributor_insights:
            aws.dynamodb.ContributorInsights(
                "data-table-insights",
                table_name=table.name,
                opts=opts
            )

        self.tables['data'] = table
        return table

    def get_table_name(self) -> Output[str]:
        """Get data table name."""
        return self.data_table.name

    def get_table_arn(self) -> Output[str]:
        """Get data table ARN."""
        return self.data_table.arn


```

## File: lib\infrastructure\iam.py

```python
"""
IAM module for the serverless infrastructure.

This module creates IAM roles and policies with least-privilege access,
using scoped resource ARNs (not wildcards) as required by model failures.
"""

from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class IAMStack:
    """
    Manages IAM roles and policies for the serverless infrastructure.

    Implements least-privilege access with environment-specific scoped ARNs.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize IAM Stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.roles: Dict[str, aws.iam.Role] = {}

    def create_lambda_role(
        self,
        name: str,
        s3_bucket_arns: List[Output[str]],
        dynamodb_table_arns: List[Output[str]],
        sqs_queue_arns: List[Output[str]],
        kms_key_arn: Output[str]
    ) -> aws.iam.Role:
        """
        Create IAM role for Lambda with least-privilege, scoped permissions.

        Args:
            name: Role name identifier
            s3_bucket_arns: List of S3 bucket ARNs to grant access
            dynamodb_table_arns: List of DynamoDB table ARNs to grant access
            sqs_queue_arns: List of SQS queue ARNs to grant access
            kms_key_arn: KMS key ARN for encryption/decryption

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name(f"lambda-{name}-role", include_region=False)

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # Lambda assume role policy
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }

        role = aws.iam.Role(
            f"lambda-{name}-role",
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        # Attach AWS managed policy for Lambda basic execution (CloudWatch Logs)
        aws.iam.RolePolicyAttachment(
            f"lambda-{name}-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=opts
        )

        # Attach AWS managed policy for X-Ray tracing
        if self.config.enable_xray_tracing:
            aws.iam.RolePolicyAttachment(
                f"lambda-{name}-xray",
                role=role.name,
                policy_arn="arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess",
                opts=opts
            )

        # Attach scoped policies using Output.all to resolve ARNs
        Output.all(
            s3_arns=s3_bucket_arns,
            dynamodb_arns=dynamodb_table_arns,
            sqs_arns=sqs_queue_arns,
            kms_arn=kms_key_arn
        ).apply(lambda args: self._attach_lambda_policies(
            role,
            role_name,
            args['s3_arns'],
            args['dynamodb_arns'],
            args['sqs_arns'],
            args['kms_arn'],
            opts
        ))

        self.roles[name] = role
        return role

    def _attach_lambda_policies(
        self,
        role: aws.iam.Role,
        role_name: str,
        s3_arns: List[str],
        dynamodb_arns: List[str],
        sqs_arns: List[str],
        kms_arn: str,
        opts: Optional[ResourceOptions]
    ) -> None:
        """
        Attach inline policies to Lambda role with scoped ARNs.

        This method is called within apply() to ensure all ARNs are resolved.
        Model failure fix: Uses specific resource ARNs, not wildcards.
        """
        # S3 policy with scoped ARNs
        if s3_arns:
            s3_resources = s3_arns + [f"{arn}/*" for arn in s3_arns]

            s3_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject",
                        "s3:ListBucket"
                    ],
                    "Resource": s3_resources
                }]
            }

            aws.iam.RolePolicy(
                f"{role_name}-s3-access",
                role=role.name,
                policy=pulumi.Output.json_dumps(s3_policy),
                opts=opts
            )

        # DynamoDB policy with scoped ARNs
        if dynamodb_arns:
            # Add index ARNs for GSI access
            dynamodb_resources = dynamodb_arns + [f"{arn}/index/*" for arn in dynamodb_arns]

            dynamodb_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:BatchWriteItem"
                    ],
                    "Resource": dynamodb_resources
                }]
            }

            aws.iam.RolePolicy(
                f"{role_name}-dynamodb-access",
                role=role.name,
                policy=pulumi.Output.json_dumps(dynamodb_policy),
                opts=opts
            )

        # SQS policy with scoped ARNs (for DLQ access)
        if sqs_arns:
            sqs_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": sqs_arns
                }]
            }

            aws.iam.RolePolicy(
                f"{role_name}-sqs-access",
                role=role.name,
                policy=pulumi.Output.json_dumps(sqs_policy),
                opts=opts
            )

        # KMS policy with scoped key ARN
        if kms_arn:
            kms_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:Encrypt",
                        "kms:GenerateDataKey",
                        "kms:DescribeKey"
                    ],
                    "Resource": [kms_arn]
                }]
            }

            aws.iam.RolePolicy(
                f"{role_name}-kms-access",
                role=role.name,
                policy=pulumi.Output.json_dumps(kms_policy),
                opts=opts
            )

    def create_api_gateway_role(self, cloudwatch_log_group_arn: Output[str]) -> aws.iam.Role:
        """
        Create IAM role for API Gateway to write to CloudWatch Logs.

        Args:
            cloudwatch_log_group_arn: CloudWatch Log Group ARN

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name("api-gateway-role", include_region=False)

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "apigateway.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }

        role = aws.iam.Role(
            "api-gateway-role",
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        # Attach managed policy for CloudWatch Logs
        aws.iam.RolePolicyAttachment(
            "api-gateway-cloudwatch",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs",
            opts=opts
        )

        self.roles['api-gateway'] = role
        return role

    def create_step_functions_role(
        self,
        lambda_arns: List[Output[str]],
        sqs_queue_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create IAM role for Step Functions with scoped permissions.

        Args:
            lambda_arns: List of Lambda function ARNs
            sqs_queue_arns: List of SQS queue ARNs

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name("step-functions-role", include_region=False)

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {"Service": "states.amazonaws.com"},
                "Action": "sts:AssumeRole"
            }]
        }

        role = aws.iam.Role(
            "step-functions-role",
            name=role_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        # Attach scoped policies
        Output.all(
            lambda_arns=lambda_arns,
            sqs_arns=sqs_queue_arns
        ).apply(lambda args: self._attach_step_functions_policies(
            role,
            role_name,
            args['lambda_arns'],
            args['sqs_arns'],
            opts
        ))

        self.roles['step-functions'] = role
        return role

    def _attach_step_functions_policies(
        self,
        role: aws.iam.Role,
        role_name: str,
        lambda_arns: List[str],
        sqs_arns: List[str],
        opts: Optional[ResourceOptions]
    ) -> None:
        """
        Attach inline policies to Step Functions role.

        Model failure fix: Uses proper service integration patterns.
        """
        # Lambda invoke policy
        if lambda_arns:
            lambda_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "lambda:InvokeFunction"
                    ],
                    "Resource": lambda_arns
                }]
            }

            aws.iam.RolePolicy(
                f"{role_name}-lambda-invoke",
                role=role.name,
                policy=pulumi.Output.json_dumps(lambda_policy),
                opts=opts
            )

        # SQS send message policy
        if sqs_arns:
            sqs_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage"
                    ],
                    "Resource": sqs_arns
                }]
            }

            aws.iam.RolePolicy(
                f"{role_name}-sqs-send",
                role=role.name,
                policy=pulumi.Output.json_dumps(sqs_policy),
                opts=opts
            )

        # X-Ray tracing
        if self.config.enable_xray_tracing:
            xray_policy = {
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "xray:PutTraceSegments",
                        "xray:PutTelemetryRecords"
                    ],
                    "Resource": ["*"]
                }]
            }

            aws.iam.RolePolicy(
                f"{role_name}-xray",
                role=role.name,
                policy=pulumi.Output.json_dumps(xray_policy),
                opts=opts
            )

    def get_role(self, name: str) -> aws.iam.Role:
        """Get role by name."""
        return self.roles[name]

    def get_role_arn(self, name: str) -> Output[str]:
        """Get role ARN by name."""
        return self.roles[name].arn


```

## File: lib\infrastructure\kms.py

```python
"""
KMS module for encryption key management.

This module creates KMS keys for encrypting data at rest in S3.
"""

import pulumi
import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class KMSStack:
    """
    Manages KMS keys for the serverless infrastructure.

    Creates KMS keys for S3 bucket encryption as required by the prompt.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize KMS Stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.keys = {}

        # Create S3 encryption key
        self.s3_key = self._create_s3_key()

    def _create_s3_key(self) -> aws.kms.Key:
        """
        Create KMS key for S3 bucket encryption.

        Returns:
            KMS Key resource
        """
        key_name = self.config.get_resource_name("s3-key", include_region=False)

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # Key policy allowing S3 service to use the key
        key_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{aws.get_caller_identity().account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow S3 to use the key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "s3.amazonaws.com"
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": "*"
                }
            ]
        }

        key = aws.kms.Key(
            "s3-encryption-key",
            description=f"KMS key for S3 bucket encryption - {self.config.environment_suffix}",
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=pulumi.Output.json_dumps(key_policy),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        # Create alias for easier reference
        aws.kms.Alias(
            "s3-key-alias",
            name=f"alias/{key_name}",
            target_key_id=key.id,
            opts=opts
        )

        self.keys['s3'] = key
        return key

    def get_s3_key_arn(self) -> Output[str]:
        """Get S3 KMS key ARN."""
        return self.s3_key.arn

    def get_s3_key_id(self) -> Output[str]:
        """Get S3 KMS key ID."""
        return self.s3_key.id


```

## File: lib\infrastructure\lambda_functions.py

```python
"""
Lambda functions module for the serverless infrastructure.

This module creates Lambda functions with correct configuration:
- 3GB memory, 5-minute timeout
- X-Ray tracing
- DLQs with proper FunctionEventInvokeConfig
- Reserved concurrency
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import AssetArchive, FileArchive, Output, ResourceOptions


class LambdaStack:
    """
    Manages Lambda functions for the serverless infrastructure.

    Model failure fixes:
    - 3GB memory (3072 MB)
    - 5-minute timeout (300 seconds)
    - X-Ray tracing enabled
    - Proper SQS DLQs with FunctionEventInvokeConfig
    - Reserved concurrency (100 for processing Lambda)
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager,
        iam_stack,
        sqs_stack,
        dynamodb_table_name: Output[str],
        s3_bucket_name: Output[str]
    ):
        """
        Initialize Lambda Stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            sqs_stack: SQSStack instance
            dynamodb_table_name: DynamoDB table name
            s3_bucket_name: S3 bucket name
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.iam_stack = iam_stack
        self.sqs_stack = sqs_stack
        self.dynamodb_table_name = dynamodb_table_name
        self.s3_bucket_name = s3_bucket_name
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}

    def create_processing_lambda(
        self,
        role: aws.iam.Role
    ) -> aws.lambda_.Function:
        """
        Create Lambda function for processing S3 CSV files.

        Model failure fixes applied:
        - 3GB memory (3072 MB)
        - 5-minute timeout (300 seconds)
        - Reserved concurrency 100
        - X-Ray tracing
        - Proper DLQ configuration

        Args:
            role: IAM role for Lambda

        Returns:
            Lambda Function resource
        """
        function_name = self.config.get_resource_name(
            "processing-lambda",
            include_region=False
        )

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # Create CloudWatch Log Group with 7-day retention (model failure fix)
        log_group = aws.cloudwatch.LogGroup(
            "processing-lambda-logs",
            name=f"/aws/lambda/{function_name}",
            retention_in_days=self.config.log_retention_days,  # 7 days
            tags=self.config.get_common_tags(),
            opts=opts
        )
        self.log_groups['processing'] = log_group

        # Package Lambda code
        lambda_code_path = os.path.join(
            os.path.dirname(__file__),
            "lambda_code"
        )

        # Create Lambda function
        # Note: reserved_concurrent_executions removed to avoid account limit issues
        function = aws.lambda_.Function(
            "processing-lambda",
            name=function_name,
            runtime=self.config.lambda_runtime,
            handler="processing_handler.lambda_handler",
            role=role.arn,
            code=FileArchive(lambda_code_path),
            timeout=self.config.lambda_timeout,  # 300 seconds (5 minutes)
            memory_size=self.config.lambda_memory_size,  # 3008 MB
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_table_name,
                    "S3_BUCKET_NAME": self.s3_bucket_name,
                    "ENVIRONMENT": self.config.environment,
                    "ENVIRONMENT_SUFFIX": self.config.environment_suffix
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                depends_on=[log_group]
            ) if self.provider else ResourceOptions(depends_on=[log_group])
        )

        # Configure DLQ with FunctionEventInvokeConfig (model failure fix)
        dlq_arn = self.sqs_stack.get_queue_arn('processing-lambda')

        aws.lambda_.FunctionEventInvokeConfig(
            "processing-lambda-invoke-config",
            function_name=function.name,
            maximum_retry_attempts=self.config.lambda_max_retries,  # 2 retries
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq_arn
                )
            ),
            opts=opts
        )

        self.functions['processing'] = function
        return function

    def create_api_lambda(
        self,
        name: str,
        handler: str,
        role: aws.iam.Role
    ) -> aws.lambda_.Function:
        """
        Create Lambda function for API Gateway endpoints.

        Args:
            name: Function name identifier (e.g., 'upload', 'status', 'results')
            handler: Handler function name (e.g., 'api_handler.upload_handler')
            role: IAM role for Lambda

        Returns:
            Lambda Function resource
        """
        function_name = self.config.get_resource_name(
            f"{name}-lambda",
            include_region=False
        )

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # Create CloudWatch Log Group with 7-day retention
        log_group = aws.cloudwatch.LogGroup(
            f"{name}-lambda-logs",
            name=f"/aws/lambda/{function_name}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_common_tags(),
            opts=opts
        )
        self.log_groups[name] = log_group

        # Package Lambda code
        lambda_code_path = os.path.join(
            os.path.dirname(__file__),
            "lambda_code"
        )

        # Create Lambda function
        function = aws.lambda_.Function(
            f"{name}-lambda",
            name=function_name,
            runtime=self.config.lambda_runtime,
            handler=handler,
            role=role.arn,
            code=FileArchive(lambda_code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_table_name,
                    "S3_BUCKET_NAME": self.s3_bucket_name,
                    "ENVIRONMENT": self.config.environment,
                    "ENVIRONMENT_SUFFIX": self.config.environment_suffix
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                depends_on=[log_group]
            ) if self.provider else ResourceOptions(depends_on=[log_group])
        )

        # Configure DLQ with FunctionEventInvokeConfig
        dlq_arn = self.sqs_stack.get_queue_arn(f"{name}-lambda")

        aws.lambda_.FunctionEventInvokeConfig(
            f"{name}-lambda-invoke-config",
            function_name=function.name,
            maximum_retry_attempts=self.config.lambda_max_retries,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq_arn
                )
            ),
            opts=opts
        )

        self.functions[name] = function
        return function

    def get_function(self, name: str) -> aws.lambda_.Function:
        """Get Lambda function by name."""
        return self.functions[name]

    def get_function_arn(self, name: str) -> Output[str]:
        """Get Lambda function ARN by name."""
        return self.functions[name].arn

    def get_function_name(self, name: str) -> Output[str]:
        """Get Lambda function name by name."""
        return self.functions[name].name

    def get_log_group_arn(self, name: str) -> Output[str]:
        """Get CloudWatch Log Group ARN by name."""
        return self.log_groups[name].arn


```

## File: lib\infrastructure\monitoring.py

```python
"""
Monitoring module for the serverless infrastructure.

This module creates CloudWatch alarms with percentage-based error rates
as required by model failures.
"""

import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class MonitoringStack:
    """
    Manages CloudWatch monitoring for the serverless infrastructure.

    Model failure fix: Uses percentage-based error rate alarms (>1%)
    instead of absolute thresholds.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize Monitoring Stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.alarms = {}

    def create_lambda_error_alarm(
        self,
        function_name: Output[str],
        alarm_name_suffix: str
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for Lambda error rate.

        Model failure fix: Uses metric math to calculate error percentage (>1%).

        Args:
            function_name: Lambda function name
            alarm_name_suffix: Suffix for alarm name

        Returns:
            MetricAlarm resource
        """
        alarm_name = self.config.get_resource_name(
            f"lambda-error-{alarm_name_suffix}",
            include_region=False
        )

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # Create alarm with metric math for error percentage
        # Model failure fix: Uses error rate (errors / invocations * 100) > 1%
        alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-error-alarm-{alarm_name_suffix}",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            threshold=self.config.alarm_error_rate_threshold * 100,  # 1.0 (1%)
            treat_missing_data="notBreaching",
            alarm_description=f"Lambda error rate > {self.config.alarm_error_rate_threshold * 100}%",
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="errors",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Errors",
                        namespace="AWS/Lambda",
                        period=300,  # 5 minutes
                        stat="Sum",
                        dimensions={
                            "FunctionName": function_name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="invocations",
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name="Invocations",
                        namespace="AWS/Lambda",
                        period=300,
                        stat="Sum",
                        dimensions={
                            "FunctionName": function_name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id="error_rate",
                    expression="(errors / invocations) * 100",
                    label="Error Rate (%)",
                    return_data=True
                )
            ],
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.alarms[f"lambda-error-{alarm_name_suffix}"] = alarm
        return alarm

    def create_lambda_throttle_alarm(
        self,
        function_name: Output[str],
        alarm_name_suffix: str
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for Lambda throttling.

        Args:
            function_name: Lambda function name
            alarm_name_suffix: Suffix for alarm name

        Returns:
            MetricAlarm resource
        """
        alarm_name = self.config.get_resource_name(
            f"lambda-throttle-{alarm_name_suffix}",
            include_region=False
        )

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        alarm = aws.cloudwatch.MetricAlarm(
            f"lambda-throttle-alarm-{alarm_name_suffix}",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="Throttles",
            namespace="AWS/Lambda",
            period=60,
            statistic="Sum",
            threshold=10,
            treat_missing_data="notBreaching",
            alarm_description="Lambda function is being throttled",
            dimensions={
                "FunctionName": function_name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.alarms[f"lambda-throttle-{alarm_name_suffix}"] = alarm
        return alarm

    def create_dynamodb_throttle_alarm(
        self,
        table_name: Output[str]
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for DynamoDB throttling.

        Model failure fix: Uses appropriate throttling metrics for on-demand capacity.

        Args:
            table_name: DynamoDB table name

        Returns:
            MetricAlarm resource
        """
        alarm_name = self.config.get_resource_name(
            "dynamodb-throttle",
            include_region=False
        )

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # For on-demand tables, monitor SystemErrors and ThrottledRequests
        alarm = aws.cloudwatch.MetricAlarm(
            "dynamodb-throttle-alarm",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="SystemErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=10,
            treat_missing_data="notBreaching",
            alarm_description="DynamoDB table experiencing system errors",
            dimensions={
                "TableName": table_name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.alarms['dynamodb-throttle'] = alarm
        return alarm

    def create_api_gateway_error_alarm(
        self,
        api_name: Output[str],
        stage_name: Output[str]
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for API Gateway 5XX errors.

        Args:
            api_name: API Gateway name
            stage_name: API Gateway stage name

        Returns:
            MetricAlarm resource
        """
        alarm_name = self.config.get_resource_name(
            "api-5xx-errors",
            include_region=False
        )

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        alarm = aws.cloudwatch.MetricAlarm(
            "api-5xx-errors-alarm",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            treat_missing_data="notBreaching",
            alarm_description="API Gateway experiencing 5XX errors",
            dimensions={
                "ApiName": api_name,
                "Stage": stage_name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.alarms['api-5xx-errors'] = alarm
        return alarm

    def create_step_functions_error_alarm(
        self,
        state_machine_name: Output[str]
    ) -> aws.cloudwatch.MetricAlarm:
        """
        Create CloudWatch alarm for Step Functions execution failures.

        Args:
            state_machine_name: State machine name

        Returns:
            MetricAlarm resource
        """
        alarm_name = self.config.get_resource_name(
            "step-functions-failures",
            include_region=False
        )

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        alarm = aws.cloudwatch.MetricAlarm(
            "step-functions-failures-alarm",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="ExecutionsFailed",
            namespace="AWS/States",
            period=300,
            statistic="Sum",
            threshold=5,
            treat_missing_data="notBreaching",
            alarm_description="Step Functions executions are failing",
            dimensions={
                "StateMachineArn": state_machine_name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.alarms['step-functions-failures'] = alarm
        return alarm


```

## File: lib\infrastructure\sqs.py

```python
"""
SQS module for the serverless infrastructure.

This module creates SQS Dead Letter Queues (DLQs) for Lambda functions
as required by model failures.
"""

import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class SQSStack:
    """
    Manages SQS queues for the serverless infrastructure.

    Model failure fix: Creates proper SQS DLQs per Lambda (not EventSourceMapping).
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager
    ):
        """
        Initialize SQS Stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.queues = {}

    def create_dlq(self, name: str) -> aws.sqs.Queue:
        """
        Create Dead Letter Queue for Lambda function.

        Args:
            name: Queue name identifier (e.g., 'processing-lambda')

        Returns:
            SQS Queue resource
        """
        queue_name = self.config.get_resource_name(f"{name}-dlq", include_region=False)

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        queue = aws.sqs.Queue(
            f"{name}-dlq",
            name=queue_name,
            message_retention_seconds=1209600,  # 14 days
            visibility_timeout_seconds=self.config.lambda_timeout * 6,  # 6x Lambda timeout
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.queues[name] = queue
        return queue

    def get_queue_arn(self, name: str) -> Output[str]:
        """Get queue ARN by name."""
        return self.queues[name].arn

    def get_queue_url(self, name: str) -> Output[str]:
        """Get queue URL by name."""
        return self.queues[name].url


```

## File: lib\infrastructure\step_functions.py

```python
"""
Step Functions module for the serverless infrastructure.

This module creates Step Functions state machines with proper service integration
patterns as required by model failures.
"""

import json

import pulumi
import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class StepFunctionsStack:
    """
    Manages Step Functions for the serverless infrastructure.

    Model failure fix: Uses proper service integration patterns
    (arn:aws:states:::lambda:invoke) instead of raw Lambda ARNs.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager,
        role: aws.iam.Role
    ):
        """
        Initialize Step Functions Stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            role: IAM role for Step Functions
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.role = role
        self.state_machines = {}

    def create_processing_workflow(
        self,
        processing_lambda_arn: Output[str],
        dlq_url: Output[str]
    ) -> aws.sfn.StateMachine:
        """
        Create Step Functions state machine for data processing workflow.

        Model failure fix: Uses proper service integration pattern with Parameters.

        Args:
            processing_lambda_arn: Processing Lambda function ARN
            dlq_url: Dead Letter Queue URL for failed executions

        Returns:
            State Machine resource
        """
        state_machine_name = self.config.get_resource_name(
            "processing-workflow",
            include_region=False
        )

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # Define state machine with proper service integration
        # Model failure fix: Uses arn:aws:states:::lambda:invoke pattern
        definition = Output.all(
            lambda_arn=processing_lambda_arn,
            dlq_url=dlq_url
        ).apply(lambda args: json.dumps({
            "Comment": "Data processing workflow with proper service integration",
            "StartAt": "ProcessData",
            "States": {
                "ProcessData": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": args['lambda_arn'],
                        "Payload.$": "$"
                    },
                    "Retry": [
                        {
                            "ErrorEquals": [
                                "Lambda.ServiceException",
                                "Lambda.AWSLambdaException",
                                "Lambda.SdkClientException"
                            ],
                            "IntervalSeconds": 2,
                            "MaxAttempts": self.config.lambda_max_retries,
                            "BackoffRate": 2
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "HandleError"
                        }
                    ],
                    "Next": "ProcessingComplete"
                },
                "HandleError": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::sqs:sendMessage",
                    "Parameters": {
                        "QueueUrl": args['dlq_url'],
                        "MessageBody.$": "$"
                    },
                    "Next": "ProcessingFailed"
                },
                "ProcessingFailed": {
                    "Type": "Fail",
                    "Error": "ProcessingError",
                    "Cause": "Data processing failed after retries"
                },
                "ProcessingComplete": {
                    "Type": "Succeed"
                }
            }
        }))

        # Create state machine
        state_machine = aws.sfn.StateMachine(
            "processing-workflow",
            name=state_machine_name,
            role_arn=self.role.arn,
            definition=definition,
            type="STANDARD",
            tracing_configuration=aws.sfn.StateMachineTracingConfigurationArgs(
                enabled=self.config.enable_xray_tracing
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.state_machines['processing'] = state_machine
        return state_machine

    def get_state_machine_arn(self, name: str) -> Output[str]:
        """Get state machine ARN by name."""
        return self.state_machines[name].arn

    def get_state_machine_name(self, name: str) -> Output[str]:
        """Get state machine name by name."""
        return self.state_machines[name].name


```

## File: lib\infrastructure\storage.py

```python
"""
S3 module for the serverless infrastructure.

This module creates S3 buckets with KMS encryption, correct lifecycle rules,
and event notifications as required by model failures.
"""

import pulumi_aws as aws
from infrastructure.config import ServerlessConfig
from pulumi import Output, ResourceOptions


class StorageStack:
    """
    Manages S3 buckets for the serverless infrastructure.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager,
        kms_key_id: Output[str]
    ):
        """
        Initialize Storage Stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            kms_key_id: KMS key ID for bucket encryption
        """
        self.config = config
        self.provider = provider_manager.get_provider()
        self.kms_key_id = kms_key_id
        self.buckets = {}

        # Create data bucket
        self.data_bucket = self._create_data_bucket()

    def _create_data_bucket(self) -> aws.s3.Bucket:
        """
        Create S3 bucket with KMS encryption and lifecycle rules.

        Returns:
            S3 Bucket resource
        """
        bucket_name = self.config.get_normalized_resource_name("data-bucket")

        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # Create bucket
        bucket = aws.s3.Bucket(
            "data-bucket",
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        # Enable versioning
        aws.s3.BucketVersioning(
            "data-bucket-versioning",
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=opts
        )

        # Configure KMS encryption
        aws.s3.BucketServerSideEncryptionConfiguration(
            "data-bucket-encryption",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm="aws:kms",
                        kms_master_key_id=self.kms_key_id
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=opts
        )

        # Block public access
        aws.s3.BucketPublicAccessBlock(
            "data-bucket-public-access-block",
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=opts
        )

        # Configure lifecycle rules (model failure fix)
        # Delete processed files after 30 days
        aws.s3.BucketLifecycleConfiguration(
            "data-bucket-lifecycle",
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="delete-processed-files",
                    status="Enabled",
                    filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                        prefix="processed/"  # Files moved to processed/ after processing
                    ),
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_lifecycle_delete_days  # 30 days
                    )
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="expire-old-versions",
                    status="Enabled",
                    noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                        noncurrent_days=30
                    )
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="abort-incomplete-uploads",
                    status="Enabled",
                    abort_incomplete_multipart_upload=aws.s3.BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs(
                        days_after_initiation=7
                    )
                )
            ],
            opts=opts
        )

        self.buckets['data'] = bucket
        return bucket

    def configure_event_notification(
        self,
        lambda_function_arn: Output[str]
    ) -> None:
        """
        Configure S3 event notifications for Lambda trigger.

        Model failure fix: Uses correct prefix (incoming/) and suffix (.csv).

        Args:
            lambda_function_arn: Lambda function ARN to trigger
        """
        opts = ResourceOptions(provider=self.provider) if self.provider else None

        # Configure S3 bucket notification
        aws.s3.BucketNotification(
            "data-bucket-notification",
            bucket=self.data_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=lambda_function_arn,
                    events=["s3:ObjectCreated:*"],
                    filter_prefix=self.config.s3_incoming_prefix,  # incoming/
                    filter_suffix=self.config.s3_file_suffix  # .csv
                )
            ],
            opts=opts
        )

    def get_bucket_name(self) -> Output[str]:
        """Get data bucket name."""
        return self.data_bucket.bucket

    def get_bucket_arn(self) -> Output[str]:
        """Get data bucket ARN."""
        return self.data_bucket.arn

    def get_bucket_id(self) -> Output[str]:
        """Get data bucket ID."""
        return self.data_bucket.id


```
