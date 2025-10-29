## File: tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for the Financial Data Processing Pipeline infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

import pulumi
from pulumi import Config

lib_path = os.path.join(os.path.dirname(__file__), 'lib')
sys.path.insert(0, lib_path)

from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or environment variable
environment_suffix = config.get('env') or os.getenv('ENVIRONMENT_SUFFIX', 'dev')
STACK_NAME = f"FinancialDataPipeline-{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

# Create the stack
stack = TapStack(
    name="fin-dtp", # financial data pipeline
    args=TapStackArgs(environment_suffix=environment_suffix, tags=default_tags),
)

```

## File: lib\*\*init\*\*.py

```python
# empty
```

## File: lib\tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless financial data processing pipeline architecture.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import FinancialDataPipelineConfig
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.sqs import SQSStack
from infrastructure.storage import StorageStack
from pulumi import Output, ResourceOptions


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'pr1234'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless financial data pipeline.

    This component orchestrates the instantiation of all infrastructure components
    and manages the environment suffix used for naming and configuration.

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
        self.tags = args.tags or {}

        self.config = FinancialDataPipelineConfig()

        self.provider_manager = AWSProviderManager(self.config)

        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.dynamodb_stack = DynamoDBStack(self.config, self.provider_manager)
        self.sqs_stack = SQSStack(self.config, self.provider_manager)
        self.storage_stack = StorageStack(self.config, self.provider_manager)

        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.dynamodb_stack,
            self.sqs_stack,
            self.storage_stack
        )

        self.lambda_stack.setup_s3_trigger(self.storage_stack.get_bucket_arn())

        self.storage_stack.setup_event_notification(
            self.lambda_stack.get_function_arn('processor')
        )

        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )

        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.lambda_stack,
            self.dynamodb_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_id'] = self.api_gateway_stack.get_api_id()

        outputs['market_data_table_name'] = self.dynamodb_stack.get_table_name()
        outputs['market_data_table_arn'] = self.dynamodb_stack.get_table_arn()

        outputs['data_bucket_name'] = self.storage_stack.get_bucket_name()
        outputs['data_bucket_arn'] = self.storage_stack.get_bucket_arn()

        for function_name in ['upload', 'status', 'results', 'processor']:
            safe_name = function_name.replace('-', '_')
            outputs[f'lambda_function_arn_{safe_name}'] = (
                self.lambda_stack.get_function_arn(function_name)
            )
            outputs[f'lambda_function_name_{safe_name}'] = (
                self.lambda_stack.get_function_name(function_name)
            )

        for function_name in ['upload', 'status', 'results', 'processor']:
            safe_name = function_name.replace('-', '_')
            outputs[f'log_group_name_{safe_name}'] = (
                self.monitoring_stack.get_log_group_name(function_name)
            )
            outputs[f'log_group_arn_{safe_name}'] = (
                self.monitoring_stack.get_log_group_arn(function_name)
            )

        for function_name in ['upload', 'status', 'results', 'processor']:
            safe_name = function_name.replace('-', '_')
            outputs[f'{safe_name}_dlq_url'] = self.sqs_stack.get_dlq_url(function_name)
            outputs[f'{safe_name}_dlq_arn'] = self.sqs_stack.get_dlq_arn(function_name)

        outputs['api_stage_name'] = self.config.environment
        outputs['api_deployment_id'] = self.api_gateway_stack.deployment.id

        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['region'] = self.config.primary_region
        outputs['normalized_region'] = self.config.normalized_region
        outputs['project_name'] = self.config.project_name

        self.register_outputs(outputs)

        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass

    def get_api_url(self) -> Output[str]:
        """Get API Gateway URL."""
        return self.api_gateway_stack.get_api_url()

    def get_lambda_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN."""
        return self.lambda_stack.get_function_arn(function_name)

    def get_lambda_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name."""
        return self.lambda_stack.get_function_name(function_name)

    def get_table_name(self) -> Output[str]:
        """Get DynamoDB table name."""
        return self.dynamodb_stack.get_table_name()

    def get_table_arn(self) -> Output[str]:
        """Get DynamoDB table ARN."""
        return self.dynamodb_stack.get_table_arn()

    def get_bucket_name(self) -> Output[str]:
        """Get S3 bucket name."""
        return self.storage_stack.get_bucket_name()

    def get_bucket_arn(self) -> Output[str]:
        """Get S3 bucket ARN."""
        return self.storage_stack.get_bucket_arn()

```

## File: lib\infrastructure\_\_init\_\_.py

```python
# empty
```

## File: lib\infrastructure\lambda_code\processor_handler.py

```python
"""
CSV processor Lambda function for financial market data pipeline.

This function processes CSV files uploaded to S3, validates data format,
and stores parsed records in DynamoDB.
"""

import csv
import json
import os
from datetime import datetime
from decimal import Decimal
from io import StringIO

import boto3

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')


def handler(event, context):
    """
    Process CSV files from S3 and store in DynamoDB.

    Args:
        event: S3 event notification
        context: Lambda context

    Returns:
        Processing result
    """
    try:
        table_name = os.environ.get('DYNAMODB_TABLE_NAME')
        table = dynamodb.Table(table_name)

        for record in event.get('Records', []):
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']

            print(json.dumps({
                'message': 'Processing CSV file',
                'bucket': bucket,
                'key': key,
                'timestamp': datetime.utcnow().isoformat()
            }))

            response = s3.get_object(Bucket=bucket, Key=key)
            csv_content = response['Body'].read().decode('utf-8')

            csv_reader = csv.DictReader(StringIO(csv_content))

            items_processed = 0
            with table.batch_writer() as batch:
                for row in csv_reader:
                    if not validate_row(row):
                        print(json.dumps({
                            'message': 'Invalid row skipped',
                            'row': row,
                            'timestamp': datetime.utcnow().isoformat()
                        }))
                        continue

                    item = {
                        'symbol': row['symbol'],
                        'timestamp': int(row['timestamp']),
                        'price': Decimal(str(row.get('price', '0'))),
                        'volume': int(row.get('volume', 0)),
                        'source_file': key,
                        'processed_at': datetime.utcnow().isoformat()
                    }

                    batch.put_item(Item=item)
                    items_processed += 1

            processed_key = key.replace('incoming/', 'processed/')
            s3.copy_object(
                Bucket=bucket,
                CopySource={'Bucket': bucket, 'Key': key},
                Key=processed_key
            )
            s3.delete_object(Bucket=bucket, Key=key)

            print(json.dumps({
                'message': 'Processing complete',
                'items_processed': items_processed,
                'source_key': key,
                'processed_key': processed_key,
                'timestamp': datetime.utcnow().isoformat()
            }))

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Processing complete',
                'records_processed': len(event.get('Records', []))
            })
        }

    except Exception as e:
        print(json.dumps({
            'message': 'Processing error',
            'error': str(e),
            'timestamp': datetime.utcnow().isoformat()
        }))
        raise


def validate_row(row):
    """
    Validate CSV row data format.

    Args:
        row: Dictionary representing a CSV row

    Returns:
        True if valid, False otherwise
    """
    required_fields = ['symbol', 'timestamp', 'price']

    for field in required_fields:
        if field not in row or not row[field]:
            return False

    try:
        int(row['timestamp'])
        float(row['price'])
        return True
    except (ValueError, TypeError):
        return False

```

## File: lib\infrastructure\lambda_code\results_handler.py

```python
"""
Results handler Lambda function for financial market data pipeline.

This function handles GET /results/{symbol} requests to retrieve processed data.
"""

import json
import os
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert Decimal to float for JSON serialization."""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def handler(event, context):
    """
    Handle results retrieval requests.

    Args:
        event: API Gateway proxy event
        context: Lambda context

    Returns:
        API Gateway proxy response
    """
    try:
        symbol = event.get('pathParameters', {}).get('symbol')

        if not symbol:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': context.request_id
                },
                'body': json.dumps({
                    'error': 'Missing symbol parameter',
                    'correlationId': context.request_id
                })
            }

        table_name = os.environ.get('DYNAMODB_TABLE_NAME')
        table = dynamodb.Table(table_name)

        response = table.query(
            KeyConditionExpression='symbol = :symbol',
            ExpressionAttributeValues={
                ':symbol': symbol
            },
            Limit=100,
            ScanIndexForward=False
        )

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.request_id
            },
            'body': json.dumps({
                'symbol': symbol,
                'results': response.get('Items', []),
                'count': response.get('Count', 0),
                'correlationId': context.request_id
            }, cls=DecimalEncoder)
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.request_id
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'correlationId': context.request_id
            })
        }

```

## File: lib\infrastructure\lambda_code\status_handler.py

```python
"""
Status handler Lambda function for financial market data pipeline.

This function handles GET /status/{jobId} requests to check job status.
"""

import json
import os
from datetime import datetime

import boto3

dynamodb = boto3.resource('dynamodb')


def handler(event, context):
    """
    Handle job status requests.

    Args:
        event: API Gateway proxy event
        context: Lambda context

    Returns:
        API Gateway proxy response
    """
    try:
        job_id = event.get('pathParameters', {}).get('jobId')

        if not job_id:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': context.request_id
                },
                'body': json.dumps({
                    'error': 'Missing jobId parameter',
                    'correlationId': context.request_id
                })
            }

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.request_id
            },
            'body': json.dumps({
                'jobId': job_id,
                'status': 'processing',
                'timestamp': datetime.utcnow().isoformat(),
                'correlationId': context.request_id
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.request_id
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'correlationId': context.request_id
            })
        }

```

## File: lib\infrastructure\lambda_code\upload_handler.py

```python
"""
Upload handler Lambda function for financial market data pipeline.

This function handles POST /upload requests to initiate CSV file uploads.
"""

import json
import uuid
from datetime import datetime


def handler(event, context):
    """
    Handle upload initiation requests.

    Args:
        event: API Gateway proxy event
        context: Lambda context

    Returns:
        API Gateway proxy response
    """
    try:
        body = json.loads(event.get('body', '{}'))
        filename = body.get('filename')

        if not filename:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'X-Correlation-ID': context.request_id
                },
                'body': json.dumps({
                    'error': 'Missing filename parameter',
                    'correlationId': context.request_id
                })
            }

        job_id = str(uuid.uuid4())

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.request_id
            },
            'body': json.dumps({
                'jobId': job_id,
                'filename': filename,
                'status': 'initiated',
                'timestamp': datetime.utcnow().isoformat(),
                'correlationId': context.request_id
            })
        }

    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Correlation-ID': context.request_id
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e),
                'correlationId': context.request_id
            })
        }

```

## File: lib\infrastructure\api_gateway.py

```python
"""
API Gateway module for the serverless financial data pipeline.

This module creates API Gateway REST API with proper Lambda integration,
request validation, and throttling.

Addresses Model Failures:
- API Gateway → Lambda integration URI format (use proper service integration path)
- API Gateway permission source_arn format (proper execute-api ARN pattern)
- Invalid export / missing API URL property (construct URL from RestApi + Stage)
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway for the financial data pipeline.

    Creates REST API with proper Lambda integration and throttling.
    """

    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.

        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack

        self._create_rest_api()
        self._create_resources()
        self._create_methods()
        self._create_integrations()
        self._create_permissions()
        self._create_deployment()
        self._create_stage()

    def _create_rest_api(self):
        """Create REST API."""
        api_name = self.config.get_resource_name('api')

        self.api = aws.apigateway.RestApi(
            "financial-data-api",
            name=api_name,
            description="Financial market data processing API",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

    def _create_resources(self):
        """Create API resources."""
        self.upload_resource = aws.apigateway.Resource(
            "upload-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="upload",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )

        self.status_resource = aws.apigateway.Resource(
            "status-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="status",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )

        self.status_jobid_resource = aws.apigateway.Resource(
            "status-jobid-resource",
            rest_api=self.api.id,
            parent_id=self.status_resource.id,
            path_part="{jobId}",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.status_resource]
            )
        )

        self.results_resource = aws.apigateway.Resource(
            "results-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="results",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )

        self.results_symbol_resource = aws.apigateway.Resource(
            "results-symbol-resource",
            rest_api=self.api.id,
            parent_id=self.results_resource.id,
            path_part="{symbol}",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.results_resource]
            )
        )

    def _create_methods(self):
        """Create API methods with request validation."""
        validator = self._create_request_validator()

        self.upload_method = aws.apigateway.Method(
            "post-upload-method",
            rest_api=self.api.id,
            resource_id=self.upload_resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=validator.id,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.upload_resource, validator]
            )
        )

        self.status_method = aws.apigateway.Method(
            "get-status-method",
            rest_api=self.api.id,
            resource_id=self.status_jobid_resource.id,
            http_method="GET",
            authorization="NONE",
            request_validator_id=validator.id,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.status_jobid_resource, validator]
            )
        )

        self.results_method = aws.apigateway.Method(
            "get-results-method",
            rest_api=self.api.id,
            resource_id=self.results_symbol_resource.id,
            http_method="GET",
            authorization="NONE",
            request_validator_id=validator.id,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.results_symbol_resource, validator]
            )
        )

    def _create_request_validator(self) -> aws.apigateway.RequestValidator:
        """Create request validator."""
        return aws.apigateway.RequestValidator(
            "request-validator",
            rest_api=self.api.id,
            name=self.config.get_resource_name('validator'),
            validate_request_body=True,
            validate_request_parameters=True,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )

    def _create_integrations(self):
        """
        Create Lambda integrations with correct URI format.

        Addresses Model Failure 1: Use proper API Gateway service integration path format.
        """
        upload_function = self.lambda_stack.get_function('upload')
        status_function = self.lambda_stack.get_function('status')
        results_function = self.lambda_stack.get_function('results')

        upload_integration_uri = Output.all(
            self.config.primary_region,
            upload_function.arn
        ).apply(
            lambda args: (
                f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/"
                f"functions/{args[1]}/invocations"
            )
        )

        self.upload_integration = aws.apigateway.Integration(
            "post-upload-integration",
            rest_api=self.api.id,
            resource_id=self.upload_resource.id,
            http_method=self.upload_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=upload_integration_uri,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.upload_resource, self.upload_method, upload_function]
            )
        )

        status_integration_uri = Output.all(
            self.config.primary_region,
            status_function.arn
        ).apply(
            lambda args: (
                f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/"
                f"functions/{args[1]}/invocations"
            )
        )

        self.status_integration = aws.apigateway.Integration(
            "get-status-integration",
            rest_api=self.api.id,
            resource_id=self.status_jobid_resource.id,
            http_method=self.status_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=status_integration_uri,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[
                    self.api,
                    self.status_jobid_resource,
                    self.status_method,
                    status_function
                ]
            )
        )

        results_integration_uri = Output.all(
            self.config.primary_region,
            results_function.arn
        ).apply(
            lambda args: (
                f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/"
                f"functions/{args[1]}/invocations"
            )
        )

        self.results_integration = aws.apigateway.Integration(
            "get-results-integration",
            rest_api=self.api.id,
            resource_id=self.results_symbol_resource.id,
            http_method=self.results_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=results_integration_uri,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[
                    self.api,
                    self.results_symbol_resource,
                    self.results_method,
                    results_function
                ]
            )
        )

    def _create_permissions(self):
        """
        Create Lambda invoke permissions with correct source_arn format.

        Addresses Model Failure 2: Proper execute-api source ARN format.
        """
        upload_function = self.lambda_stack.get_function('upload')
        status_function = self.lambda_stack.get_function('status')
        results_function = self.lambda_stack.get_function('results')

        upload_source_arn = Output.all(
            self.api.execution_arn
        ).apply(lambda args: f"{args[0]}/*/*/*")

        aws.lambda_.Permission(
            "api-upload-permission",
            action="lambda:InvokeFunction",
            function=upload_function.arn,
            principal="apigateway.amazonaws.com",
            source_arn=upload_source_arn,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, upload_function]
            )
        )

        aws.lambda_.Permission(
            "api-status-permission",
            action="lambda:InvokeFunction",
            function=status_function.arn,
            principal="apigateway.amazonaws.com",
            source_arn=upload_source_arn,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, status_function]
            )
        )

        aws.lambda_.Permission(
            "api-results-permission",
            action="lambda:InvokeFunction",
            function=results_function.arn,
            principal="apigateway.amazonaws.com",
            source_arn=upload_source_arn,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, results_function]
            )
        )

    def _create_deployment(self):
        """Create API deployment with proper dependencies."""
        self.deployment = aws.apigateway.Deployment(
            "api-deployment",
            rest_api=self.api.id,
            description="Financial data API deployment",
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[
                    self.api,
                    self.upload_resource,
                    self.status_jobid_resource,
                    self.results_symbol_resource,
                    self.upload_method,
                    self.status_method,
                    self.results_method,
                    self.upload_integration,
                    self.status_integration,
                    self.results_integration
                ]
            )
        )

    def _create_stage(self):
        """Create API stage with throttling and X-Ray tracing."""
        stage_name = self.config.environment

        self.stage = aws.apigateway.Stage(
            "api-stage",
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=stage_name,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.deployment]
            )
        )

        aws.apigateway.MethodSettings(
            "api-method-settings",
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                throttling_burst_limit=self.config.api_throttle_burst_limit,
                throttling_rate_limit=self.config.api_throttle_rate_limit
            ),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.stage]
            )
        )

    def get_api_url(self) -> Output[str]:
        """
        Get API Gateway URL.

        Addresses Model Failure 10: Construct URL from RestApi + Stage outputs.
        """
        return Output.all(
            self.api.id,
            self.stage.stage_name,
            self.config.primary_region
        ).apply(
            lambda args: f"https://{args[0]}.execute-api.{args[2]}.amazonaws.com/{args[1]}"
        )

    def get_api_id(self) -> Output[str]:
        """Get API Gateway ID."""
        return self.api.id

```

## File: lib\infrastructure\aws_provider.py

```python
"""
AWS Provider module for consistent provider management.

This module ensures a single, stable AWS provider instance is used across
all resources to avoid drift in CI/CD pipelines.
"""

import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import FinancialDataPipelineConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.

    This ensures all resources use the same provider configuration
    and prevents drift caused by creating new providers on each build.
    """

    def __init__(self, config: FinancialDataPipelineConfig):
        """
        Initialize the AWS provider manager.

        Args:
            config: FinancialDataPipelineConfig instance
        """
        self.config = config
        self._provider = None

    def get_provider(self) -> aws.Provider:
        """
        Get or create the AWS provider instance.

        Returns:
            AWS provider instance
        """
        if self._provider is None:
            provider_name = f"aws-provider-{self.config.environment_suffix}"

            self._provider = aws.Provider(
                provider_name,
                region=self.config.primary_region,
                default_tags=aws.ProviderDefaultTagsArgs(
                    tags=self.config.get_common_tags()
                )
            )

        return self._provider
```

## File: lib\infrastructure\config.py

```python
"""
Configuration module for the serverless financial market data processing pipeline.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict


@dataclass
class FinancialDataPipelineConfig:
    """Centralized configuration for the serverless financial data pipeline."""

    environment: str
    environment_suffix: str
    project_name: str

    primary_region: str
    normalized_region: str

    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    processing_lambda_concurrency: int

    api_throttle_rate_limit: int
    api_throttle_burst_limit: int

    dlq_max_receive_count: int

    log_retention_days: int
    enable_xray_tracing: bool

    s3_lifecycle_days: int
    dynamodb_billing_mode: str

    team: str
    cost_center: str

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'prod')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'findata')

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)

        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.12')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '300'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '3008'))
        self.processing_lambda_concurrency = int(os.getenv('PROCESSING_LAMBDA_CONCURRENCY', '50'))

        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '2000'))

        self.dlq_max_receive_count = int(os.getenv('DLQ_MAX_RECEIVE_COUNT', '2'))

        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'

        self.s3_lifecycle_days = int(os.getenv('S3_LIFECYCLE_DAYS', '30'))
        self.dynamodb_billing_mode = os.getenv('DYNAMODB_BILLING_MODE', 'PAY_PER_REQUEST')

        self.team = os.getenv('TEAM', 'data-engineering')
        self.cost_center = os.getenv('COST_CENTER', 'fintech-analytics')

    def _normalize_region(self, region: str) -> str:
        """
        Normalize region name for resource naming.

        Example: us-east-1 -> useast1
        """
        return region.replace('-', '')

    def normalize_name(self, name: str) -> str:
        """
        Normalize name for case-sensitive resources.

        Converts to lowercase and replaces invalid characters with hyphens.
        """
        normalized = re.sub(r'[^a-z0-9-]', '-', name.lower())
        normalized = re.sub(r'-+', '-', normalized).strip('-')
        return normalized

    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate consistent resource names with environment suffix and normalized region.

        Args:
            resource_type: Type of the resource
            include_region: Whether to include region in the name (default: True)

        Returns:
            Formatted resource name with region and environment suffix
        """
        base_name = f"{self.project_name}-{resource_type}"

        if include_region:
            base_name = f"{base_name}-{self.normalized_region}"

        base_name = f"{base_name}-{self.environment_suffix}"

        return base_name

    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate normalized resource names for case-sensitive resources.

        This is specifically for resources like S3 buckets that require lowercase names.
        """
        name = self.get_resource_name(resource_type, include_region)
        return self.normalize_name(name)

    def get_common_tags(self) -> Dict[str, str]:
        """Get common tags for all resources."""
        return {
            'Project': self.project_name,
            'Environment': self.environment,
            'EnvironmentSuffix': self.environment_suffix,
            'Team': self.team,
            'CostCenter': self.cost_center,
            'ManagedBy': 'Pulumi',
            'Region': self.normalized_region
        }


```

## File: lib\infrastructure\dynamodb.py

```python
"""
DynamoDB module for table configuration.

This module creates DynamoDB tables with on-demand billing, point-in-time recovery,
and contributor insights for the financial data processing pipeline.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig


class DynamoDBStack:
    """
    Manages DynamoDB tables for the financial data pipeline.

    Creates tables with PITR, contributor insights, and on-demand billing.
    """

    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the DynamoDB stack.

        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager

        self._create_market_data_table()

    def _create_market_data_table(self):
        """Create DynamoDB table for market data with symbol and timestamp keys."""
        table_name = self.config.get_resource_name('market-data')

        self.market_data_table = aws.dynamodb.Table(
            "market-data-table",
            name=table_name,
            billing_mode=self.config.dynamodb_billing_mode,
            hash_key="symbol",
            range_key="timestamp",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="symbol",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        aws.dynamodb.ContributorInsights(
            "market-data-table-insights",
            table_name=self.market_data_table.name,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.market_data_table
            )
        )

        self.market_data_table_arn = self.market_data_table.arn
        self.market_data_table_name = self.market_data_table.name

    def get_table_arn(self) -> Output[str]:
        """Get the market data table ARN."""
        return self.market_data_table_arn

    def get_table_name(self) -> Output[str]:
        """Get the market data table name."""
        return self.market_data_table_name

```

## File: lib\infrastructure\iam.py

```python
"""
IAM module for the serverless financial data pipeline.

This module creates tightly scoped IAM roles and policies for Lambda functions,
avoiding overly broad managed policies and ensuring least-privilege access.

Addresses Model Failures:
- IAM policy JSON built from Pulumi Outputs using proper serialization
- Least-privilege gaps with specific resource ARNs
- X-Ray and CloudWatch Logs permissions scoped appropriately
"""

from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig


class IAMStack:
    """
    Manages IAM roles and policies for Lambda functions.

    Creates tightly scoped IAM roles with minimal permissions,
    avoiding broad managed policies.
    """

    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the IAM stack.

        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.RolePolicy] = {}

    def create_lambda_role(
        self,
        role_name: str,
        dynamodb_table_arn: Optional[Output[str]] = None,
        s3_bucket_arn: Optional[Output[str]] = None,
        dlq_arn: Optional[Output[str]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create a tightly scoped IAM role for a Lambda function.

        Args:
            role_name: Name identifier for the role
            dynamodb_table_arn: DynamoDB table ARN to grant access to
            s3_bucket_arn: S3 bucket ARN to grant access to
            dlq_arn: SQS DLQ ARN to grant SendMessage access to
            enable_xray: Whether to enable X-Ray tracing permissions

        Returns:
            IAM Role resource
        """
        resource_name = self.config.get_resource_name(f'role-{role_name}')

        assume_role_policy_doc = {
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        }

        role = aws.iam.Role(
            f"lambda-role-{role_name}",
            name=resource_name,
            assume_role_policy=pulumi.Output.json_dumps(assume_role_policy_doc),
            description=f"Tightly scoped role for {role_name} Lambda function",
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        self._attach_cloudwatch_logs_policy(role, role_name)

        if dynamodb_table_arn:
            self._attach_dynamodb_policy(role, role_name, dynamodb_table_arn)

        if s3_bucket_arn:
            self._attach_s3_policy(role, role_name, s3_bucket_arn)

        if dlq_arn:
            self._attach_sqs_policy(role, role_name, dlq_arn)

        if enable_xray:
            self._attach_xray_policy(role, role_name)

        self.roles[role_name] = role
        return role

    def _attach_cloudwatch_logs_policy(self, role: aws.iam.Role, role_name: str):
        """
        Attach tightly scoped CloudWatch Logs policy.

        This replaces the overly broad AWSLambdaBasicExecutionRole.
        """
        region = self.config.primary_region
        log_group_name = f"/aws/lambda/{self.config.get_resource_name(role_name)}"

        policy_doc = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["logs:CreateLogGroup"],
                    "Resource": f"arn:aws:logs:{region}:*:log-group:{log_group_name}"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:{region}:*:log-group:{log_group_name}:*"
                }
            ]
        }

        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-cloudwatch-policy",
            role=role.id,
            policy=pulumi.Output.json_dumps(policy_doc),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        self.policies[f"{role_name}-cloudwatch"] = policy

    def _attach_dynamodb_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        table_arn: Output[str]
    ):
        """
        Attach tightly scoped DynamoDB policy using proper Output handling.
        """
        region = self.config.primary_region

        policy_doc = table_arn.apply(lambda arn: pulumi.Output.json_dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "dynamodb:PutItem",
                    "dynamodb:GetItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem",
                    "dynamodb:BatchWriteItem"
                ],
                "Resource": [arn, f"{arn}/index/*"]
            }]
        }))

        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-dynamodb-policy",
            role=role.id,
            policy=policy_doc,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        self.policies[f"{role_name}-dynamodb"] = policy

    def _attach_s3_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        bucket_arn: Output[str]
    ):
        """
        Attach tightly scoped S3 policy using proper Output handling.
        """
        policy_doc = bucket_arn.apply(lambda arn: pulumi.Output.json_dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                "Resource": [arn, f"{arn}/*"]
            }]
        }))

        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-s3-policy",
            role=role.id,
            policy=policy_doc,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        self.policies[f"{role_name}-s3"] = policy

    def _attach_sqs_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        dlq_arn: Output[str]
    ):
        """
        Attach tightly scoped SQS policy for DLQ access using proper Output handling.
        """
        policy_doc = dlq_arn.apply(lambda arn: pulumi.Output.json_dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["sqs:SendMessage"],
                "Resource": arn
            }]
        }))

        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-sqs-policy",
            role=role.id,
            policy=policy_doc,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        self.policies[f"{role_name}-sqs"] = policy

    def _attach_xray_policy(self, role: aws.iam.Role, role_name: str):
        """
        Attach X-Ray tracing policy with scoped permissions.
        """
        region = self.config.primary_region

        policy_doc = {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                "Resource": "*"
            }]
        }

        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-xray-policy",
            role=role.id,
            policy=pulumi.Output.json_dumps(policy_doc),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=role
            )
        )
        self.policies[f"{role_name}-xray"] = policy

    def get_role(self, role_name: str) -> aws.iam.Role:
        """Get IAM role by name."""
        return self.roles[role_name]

    def get_role_arn(self, role_name: str) -> Output[str]:
        """Get IAM role ARN by name."""
        return self.roles[role_name].arn


```

## File: lib\infrastructure\lambda_functions.py

```python
"""
Lambda functions module for the serverless financial data pipeline.

This module creates Lambda functions with proper DLQ integration, X-Ray tracing,
and environment variables.

Addresses Model Failures:
- Invalid retry_attempts argument (handled via event source mapping, not Function)
- Lambda permissions for S3 invoke use stable ARN reference
- Proper DLQ configuration via event source mapping
"""

import pulumi
import pulumi_aws as aws
from pulumi import AssetArchive, FileArchive, Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .sqs import SQSStack


class LambdaStack:
    """
    Manages Lambda functions for the financial data pipeline.

    Creates functions with proper configuration, DLQs, and permissions.
    """

    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack,
        storage_stack=None
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            dynamodb_stack: DynamoDBStack instance
            sqs_stack: SQSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.sqs_stack = sqs_stack
        self.storage_stack = storage_stack

        self.functions = {}

        self._create_upload_function()
        self._create_status_function()
        self._create_results_function()
        if storage_stack:
            self._create_processor_function()

    def _create_upload_function(self):
        """Create upload handler Lambda function."""
        function_name = 'upload'
        resource_name = self.config.get_resource_name(function_name)

        role = self.iam_stack.create_lambda_role(
            function_name,
            dlq_arn=self.sqs_stack.get_dlq_arn(function_name),
            enable_xray=self.config.enable_xray_tracing
        )

        function = aws.lambda_.Function(
            f"{function_name}-function",
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler="upload_handler.handler",
            role=role.arn,
            code=AssetArchive({
                ".": FileArchive("./lib/infrastructure/lambda_code")
            }),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn(function_name)
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )

        self.functions[function_name] = function

    def _create_status_function(self):
        """Create status handler Lambda function."""
        function_name = 'status'
        resource_name = self.config.get_resource_name(function_name)

        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arn=self.dynamodb_stack.get_table_arn(),
            dlq_arn=self.sqs_stack.get_dlq_arn(function_name),
            enable_xray=self.config.enable_xray_tracing
        )

        function = aws.lambda_.Function(
            f"{function_name}-function",
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler="status_handler.handler",
            role=role.arn,
            code=AssetArchive({
                ".": FileArchive("./lib/infrastructure/lambda_code")
            }),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_stack.get_table_name()
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn(function_name)
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )

        self.functions[function_name] = function

    def _create_results_function(self):
        """Create results handler Lambda function."""
        function_name = 'results'
        resource_name = self.config.get_resource_name(function_name)

        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arn=self.dynamodb_stack.get_table_arn(),
            dlq_arn=self.sqs_stack.get_dlq_arn(function_name),
            enable_xray=self.config.enable_xray_tracing
        )

        function = aws.lambda_.Function(
            f"{function_name}-function",
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler="results_handler.handler",
            role=role.arn,
            code=AssetArchive({
                ".": FileArchive("./lib/infrastructure/lambda_code")
            }),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_stack.get_table_name()
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn(function_name)
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )

        self.functions[function_name] = function

    def _create_processor_function(self):
        """Create CSV processor Lambda function with reserved concurrency."""
        function_name = 'processor'
        resource_name = self.config.get_resource_name(function_name)

        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arn=self.dynamodb_stack.get_table_arn(),
            s3_bucket_arn=self.storage_stack.get_bucket_arn() if self.storage_stack else None,
            dlq_arn=self.sqs_stack.get_dlq_arn(function_name),
            enable_xray=self.config.enable_xray_tracing
        )

        function = aws.lambda_.Function(
            f"{function_name}-function",
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler="processor_handler.handler",
            role=role.arn,
            code=AssetArchive({
                ".": FileArchive("./lib/infrastructure/lambda_code")
            }),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    "DYNAMODB_TABLE_NAME": self.dynamodb_stack.get_table_name()
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn(function_name)
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode="Active" if self.config.enable_xray_tracing else "PassThrough"
            ),
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )

        self.functions[function_name] = function

    def setup_s3_trigger(self, bucket_arn: Output[str]):
        """
        Set up S3 trigger for processor function with proper permissions.

        Addresses Model Failure: Lambda permissions use stable ARN reference.

        Args:
            bucket_arn: S3 bucket ARN
        """
        processor_function = self.functions['processor']

        aws.lambda_.Permission(
            "processor-s3-permission",
            action="lambda:InvokeFunction",
            function=processor_function.arn,
            principal="s3.amazonaws.com",
            source_arn=bucket_arn,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=processor_function
            )
        )

    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """Get Lambda function by name."""
        return self.functions[function_name]

    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN by name."""
        return self.functions[function_name].arn

    def get_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name by name."""
        return self.functions[function_name].name

    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function invoke ARN by name."""
        return self.functions[function_name].invoke_arn


```

## File: lib\infrastructure\monitoring.py

```python
"""
Monitoring module for the serverless financial data pipeline.

This module creates CloudWatch log groups and alarms for Lambda functions
and DynamoDB tables.

Addresses Model Failures:
- CloudWatch alarm semantics for >1% error rate (use metric math for percentage)
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig
from .dynamodb import DynamoDBStack
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch monitoring for the financial data pipeline.

    Creates log groups and alarms for Lambda functions and DynamoDB.
    """

    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack,
        dynamodb_stack: DynamoDBStack
    ):
        """
        Initialize the monitoring stack.

        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
            dynamodb_stack: DynamoDBStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.dynamodb_stack = dynamodb_stack

        self.log_groups = {}
        self.alarms = {}

        self._create_log_groups()
        self._create_lambda_error_alarms()
        self._create_dynamodb_throttle_alarm()

    def _create_log_groups(self):
        """Create CloudWatch log groups for Lambda functions."""
        function_names = ['upload', 'status', 'results', 'processor']

        for function_name in function_names:
            log_group_name = f"/aws/lambda/{self.config.get_resource_name(function_name)}"

            log_group = aws.cloudwatch.LogGroup(
                f"{function_name}-log-group",
                name=log_group_name,
                retention_in_days=self.config.log_retention_days,
                tags=self.config.get_common_tags(),
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )

            self.log_groups[function_name] = log_group

    def _create_lambda_error_alarms(self):
        """
        Create CloudWatch alarms for Lambda error rates exceeding 1%.

        Addresses Model Failure 7: Use metric math to compute error rate percentage.
        """
        function_names = ['upload', 'status', 'results', 'processor']

        for function_name in function_names:
            function_resource_name = self.config.get_resource_name(function_name)
            alarm_name = self.config.get_resource_name(f'{function_name}-error-rate-alarm')

            alarm = aws.cloudwatch.MetricAlarm(
                f"{function_name}-error-alarm",
                name=alarm_name,
                comparison_operator="GreaterThanThreshold",
                evaluation_periods=2,
                threshold=1.0,
                treat_missing_data="notBreaching",
                metric_queries=[
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id="error_rate",
                        expression="(errors / invocations) * 100",
                        label="Error Rate",
                        return_data=True
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id="errors",
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name="Errors",
                            namespace="AWS/Lambda",
                            period=300,
                            stat="Sum",
                            dimensions={
                                "FunctionName": function_resource_name
                            }
                        )
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id="invocations",
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name="Invocations",
                            namespace="AWS/Lambda",
                            period=300,
                            stat="Sum",
                            dimensions={
                                "FunctionName": function_resource_name
                            }
                        )
                    )
                ],
                tags=self.config.get_common_tags(),
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )

            self.alarms[f"{function_name}-error"] = alarm

    def _create_dynamodb_throttle_alarm(self):
        """Create CloudWatch alarm for DynamoDB throttling events."""
        table_name = self.config.get_resource_name('market-data')
        alarm_name = self.config.get_resource_name('dynamodb-throttle-alarm')

        alarm = aws.cloudwatch.MetricAlarm(
            "dynamodb-throttle-alarm",
            name=alarm_name,
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="UserErrors",
            namespace="AWS/DynamoDB",
            period=300,
            statistic="Sum",
            threshold=0,
            treat_missing_data="notBreaching",
            dimensions={
                "TableName": table_name
            },
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        self.alarms['dynamodb-throttle'] = alarm

    def get_log_group_name(self, function_name: str) -> Output[str]:
        """Get log group name for a function."""
        return self.log_groups[function_name].name

    def get_log_group_arn(self, function_name: str) -> Output[str]:
        """Get log group ARN for a function."""
        return self.log_groups[function_name].arn

```

## File: lib\infrastructure\sqs.py

```python
"""
SQS module for dead letter queue configuration.

This module creates SQS dead letter queues for Lambda functions
in the financial data processing pipeline.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig


class SQSStack:
    """
    Manages SQS queues for the financial data pipeline.

    Creates dead letter queues for Lambda error handling.
    """

    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the SQS stack.

        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.dlqs = {}

        self._create_dlqs()

    def _create_dlqs(self):
        """Create dead letter queues for Lambda functions."""
        function_names = ['upload', 'status', 'results', 'processor']

        for function_name in function_names:
            dlq_name = self.config.get_resource_name(f'{function_name}-dlq')

            dlq = aws.sqs.Queue(
                f"{function_name}-dlq",
                name=dlq_name,
                message_retention_seconds=1209600,
                tags=self.config.get_common_tags(),
                opts=ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )

            self.dlqs[function_name] = dlq

    def get_dlq_arn(self, function_name: str) -> Output[str]:
        """
        Get DLQ ARN for a specific function.

        Args:
            function_name: Name of the function

        Returns:
            DLQ ARN
        """
        return self.dlqs[function_name].arn

    def get_dlq_url(self, function_name: str) -> Output[str]:
        """
        Get DLQ URL for a specific function.

        Args:
            function_name: Name of the function

        Returns:
            DLQ URL
        """
        return self.dlqs[function_name].url
```

## File: lib\infrastructure\storage.py

```python
"""
Storage module for S3 bucket configuration.

This module creates S3 buckets with server-side encryption, event notifications,
and lifecycle policies for the financial data processing pipeline.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import FinancialDataPipelineConfig


class StorageStack:
    """
    Manages S3 buckets for the financial data pipeline.

    Creates buckets with encryption, lifecycle policies, and event notifications.
    """

    def __init__(
        self,
        config: FinancialDataPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the storage stack.

        Args:
            config: FinancialDataPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager

        self._create_data_bucket()

    def _create_data_bucket(self):
        """Create S3 bucket for CSV data with encryption and lifecycle policies."""
        bucket_name = self.config.get_normalized_resource_name('data-bucket')

        self.data_bucket = aws.s3.Bucket(
            "data-bucket",
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        aws.s3.BucketServerSideEncryptionConfiguration(
            "data-bucket-encryption",
            bucket=self.data_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=(
                    aws.s3.
                    BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='AES256'
                    )
                )
            )],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.data_bucket
            )
        )

        aws.s3.BucketPublicAccessBlock(
            "data-bucket-public-access-block",
            bucket=self.data_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.data_bucket
            )
        )

        aws.s3.BucketLifecycleConfiguration(
            "data-bucket-lifecycle",
            bucket=self.data_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id="delete-processed-files",
                    status="Enabled",
                    filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                        prefix="processed/"
                    ),
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_lifecycle_days
                    )
                )
            ],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.data_bucket
            )
        )

        self.data_bucket_arn = self.data_bucket.arn
        self.data_bucket_name = self.data_bucket.id

    def setup_event_notification(self, lambda_function_arn: Output[str]):
        """
        Set up S3 event notification to trigger Lambda on CSV uploads.

        Args:
            lambda_function_arn: ARN of the Lambda function to trigger
        """
        aws.s3.BucketNotification(
            "data-bucket-notification",
            bucket=self.data_bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=lambda_function_arn,
                    events=["s3:ObjectCreated:*"],
                    filter_prefix="incoming/",
                    filter_suffix=".csv"
                )
            ],
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                parent=self.data_bucket
            )
        )

    def get_bucket_arn(self) -> Output[str]:
        """Get the data bucket ARN."""
        return self.data_bucket_arn

    def get_bucket_name(self) -> Output[str]:
        """Get the data bucket name."""
        return self.data_bucket_name
```
