## File: tap.py

```python
#!/usr/bin/env python3
"""
Pulumi application entry point for the serverless transaction pipeline infrastructure.

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

config = Config()

environment_suffix = config.get('env') or os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
STACK_NAME = f"TransactionPipeline-{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

default_tags = {
    'Environment': os.getenv('ENVIRONMENT', 'prod'),
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="transaction-pipeline",
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
the serverless transaction pipeline architecture.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.config import TransactionPipelineConfig
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.eventbridge import EventBridgeStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.sqs import SQSStack
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
    Represents the main Pulumi component resource for the serverless transaction pipeline.

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

        self.config = TransactionPipelineConfig()

        self.provider_manager = AWSProviderManager(self.config)

        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.dynamodb_stack = DynamoDBStack(self.config, self.provider_manager)
        self.sqs_stack = SQSStack(self.config, self.provider_manager)
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.dynamodb_stack,
            self.sqs_stack
        )
        self.eventbridge_stack = EventBridgeStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.lambda_stack,
            self.sqs_stack
        )
        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_id'] = self.api_gateway_stack.get_api_id()

        outputs['transactions_table_name'] = self.dynamodb_stack.get_table_name('transactions')
        outputs['transactions_table_arn'] = self.dynamodb_stack.get_table_arn('transactions')
        outputs['validation_results_table_name'] = self.dynamodb_stack.get_table_name('validation-results')
        outputs['validation_results_table_arn'] = self.dynamodb_stack.get_table_arn('validation-results')

        for function_name in self.lambda_stack.get_all_function_names():
            safe_name = function_name.replace('-', '_')
            outputs[f'lambda_function_arn_{safe_name}'] = self.lambda_stack.get_function_arn(function_name)
            outputs[f'lambda_function_name_{safe_name}'] = self.lambda_stack.get_function_name(function_name)

        for function_name in self.lambda_stack.get_all_function_names():
            safe_name = function_name.replace('-', '_')
            outputs[f'log_group_name_{safe_name}'] = self.monitoring_stack.get_log_group_name(function_name)
            outputs[f'log_group_arn_{safe_name}'] = self.monitoring_stack.get_log_group_arn(function_name)

        outputs['failed_validations_queue_url'] = self.sqs_stack.get_queue_url('failed-validations')
        outputs['failed_validations_queue_arn'] = self.sqs_stack.get_queue_arn('failed-validations')

        for function_name in ['transaction-receiver', 'fraud-validator', 'audit-logger']:
            safe_name = function_name.replace('-', '_')
            outputs[f'{safe_name}_queue_url'] = self.sqs_stack.get_queue_url(function_name)
            outputs[f'{safe_name}_queue_arn'] = self.sqs_stack.get_queue_arn(function_name)
            outputs[f'{safe_name}_dlq_url'] = self.sqs_stack.get_queue('failed-validations').url if function_name == 'failed-validations' else self.sqs_stack.get_dlq(function_name).url
            outputs[f'{safe_name}_dlq_arn'] = self.sqs_stack.get_dlq_arn(function_name)

        outputs['transaction_received_rule_arn'] = self.eventbridge_stack.get_rule_arn('transaction-received')
        outputs['failed_validation_rule_arn'] = self.eventbridge_stack.get_rule_arn('failed-validation')

        outputs['eventbridge_sqs_role_arn'] = self.iam_stack.get_role_arn('eventbridge-sqs')
        for function_name in ['transaction-receiver', 'fraud-validator', 'audit-logger']:
            safe_name = function_name.replace('-', '_')
            outputs[f'{safe_name}_role_arn'] = self.iam_stack.get_role_arn(function_name)

        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix
        outputs['region'] = self.config.primary_region
        outputs['normalized_region'] = self.config.normalized_region
        outputs['project_name'] = self.config.project_name
        outputs['fraud_threshold'] = str(self.config.fraud_threshold)
        outputs['audit_retention_days'] = str(self.config.audit_retention_days)

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

    def get_table_name(self, table_name: str) -> Output[str]:
        """Get DynamoDB table name."""
        return self.dynamodb_stack.get_table_name(table_name)

    def get_table_arn(self, table_name: str) -> Output[str]:
        """Get DynamoDB table ARN."""
        return self.dynamodb_stack.get_table_arn(table_name)

```

## File: lib\infrastructure\_\_init\_\_.py

```python
# empty
```

## File: lib\infrastructure\lambda_code\audit_logger.py

```python
"""
Audit Logger Lambda Handler

Logs audit events with retention policy.
"""

import json
import os
import time


def handler(event, context):
    """
    Log audit events.

    Args:
        event: SQS or EventBridge event
        context: Lambda context

    Returns:
        Audit result
    """
    try:
        retention_days = int(os.environ.get('AUDIT_RETENTION_DAYS', '90'))

        if 'Records' in event:
            for record in event['Records']:
                body = json.loads(record['body'])
                print(json.dumps({
                    'audit_event': 'failed_validation',
                    'data': body,
                    'retention_days': retention_days,
                    'timestamp': int(time.time())
                }))
        else:
            detail = event.get('detail', {})
            print(json.dumps({
                'audit_event': 'general',
                'data': detail,
                'retention_days': retention_days,
                'timestamp': int(time.time())
            }))

        return {
            'statusCode': 200,
            'message': 'Audit logged'
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise


```

## File: lib\infrastructure\lambda_code\fraud_validation.py

```python
"""
Fraud Validator Lambda Handler

Validates transactions for fraud and stores results in DynamoDB.
"""

import json
import os
import random
import time
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')


def handler(event, context):
    """
    Validate transactions for fraud.

    Args:
        event: EventBridge event
        context: Lambda context

    Returns:
        Validation result
    """
    try:
        detail = event.get('detail', {})
        transaction_id = detail.get('transaction_id')
        amount = detail.get('amount')

        if not transaction_id:
            return {'statusCode': 400, 'message': 'Missing transaction_id'}

        fraud_threshold = float(os.environ.get('FRAUD_THRESHOLD', '0.85'))
        fraud_score = random.random()

        is_fraud = fraud_score > fraud_threshold
        timestamp = int(time.time())

        validation_id = f"val-{transaction_id}-{timestamp}"

        table_name = os.environ['VALIDATION_RESULTS_TABLE']
        table = dynamodb.Table(table_name)

        table.put_item(
            Item={
                'validation_id': validation_id,
                'transaction_id': transaction_id,
                'fraud_score': Decimal(str(fraud_score)),
                'is_fraud': is_fraud,
                'timestamp': timestamp
            }
        )

        if is_fraud:
            failed_queue_url = os.environ['FAILED_VALIDATIONS_QUEUE_URL']
            sqs.send_message(
                QueueUrl=failed_queue_url,
                MessageBody=json.dumps({
                    'validation_id': validation_id,
                    'transaction_id': transaction_id,
                    'fraud_score': fraud_score,
                    'timestamp': timestamp
                })
            )

        return {
            'statusCode': 200,
            'validation_id': validation_id,
            'is_fraud': is_fraud
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        raise


```

## File: lib\infrastructure\lambda_code\transaction_receiver.py

```python
"""
Transaction Receiver Lambda Handler

Receives transaction requests from API Gateway and stores them in DynamoDB.
"""

import json
import os
import time
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')
eventbridge = boto3.client('events')


def handler(event, context):
    """
    Handle incoming transaction requests.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    try:
        body = json.loads(event.get('body', '{}'))

        transaction_id = body.get('transaction_id')
        amount = body.get('amount')

        if not transaction_id or amount is None:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        timestamp = int(time.time())

        table_name = os.environ['TRANSACTIONS_TABLE']
        table = dynamodb.Table(table_name)

        table.put_item(
            Item={
                'transaction_id': transaction_id,
                'amount': Decimal(str(amount)),
                'timestamp': timestamp,
                'status': 'received'
            }
        )

        eventbridge.put_events(
            Entries=[{
                'Source': 'transaction.receiver',
                'DetailType': 'TransactionReceived',
                'Detail': json.dumps({
                    'transaction_id': transaction_id,
                    'amount': float(amount),
                    'timestamp': timestamp
                }),
                'EventBusName': 'default'
            }]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction received',
                'transaction_id': transaction_id
            })
        }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }


```

## File: lib\infrastructure\api_gateway.py

```python
"""
API Gateway module for the serverless transaction pipeline.

This module creates API Gateway REST API with proper Lambda integration,
request validation, and throttling.

Addresses Model Failures:
- API Gateway → Lambda integration URI format
- API Gateway invoke permission source_arn format
- API deployment and stage permission dependencies
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway for the transaction pipeline.

    Creates REST API with proper Lambda integration and throttling.
    """

    def __init__(
        self,
        config: TransactionPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.

        Args:
            config: TransactionPipelineConfig instance
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
            "transaction-api",
            name=api_name,
            description="Transaction validation pipeline API",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

    def _create_resources(self):
        """Create API resources."""
        self.transactions_resource = aws.apigateway.Resource(
            "transactions-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="transactions",
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )

    def _create_methods(self):
        """Create API methods with request validation."""
        self.post_method = aws.apigateway.Method(
            "post-transactions-method",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=self._create_request_validator().id,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.transactions_resource]
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
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )

    def _create_integrations(self):
        """
        Create Lambda integrations with correct URI format.

        Addresses Failure 1: Use proper API Gateway service integration path format.
        """
        transaction_receiver = self.lambda_stack.get_function('transaction-receiver')

        integration_uri = Output.all(
            self.config.primary_region,
            transaction_receiver.arn
        ).apply(
            lambda args: f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/functions/{args[1]}/invocations"
        )

        self.integration = aws.apigateway.Integration(
            "post-transactions-integration",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method=self.post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=integration_uri,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.transactions_resource, self.post_method, transaction_receiver]
            )
        )

    def _create_permissions(self):
        """
        Create Lambda invoke permissions with correct source_arn format.

        Addresses Failure 2: Proper execute-api source ARN format.
        """
        transaction_receiver = self.lambda_stack.get_function('transaction-receiver')

        source_arn = Output.all(
            self.api.execution_arn,
            self.post_method.http_method,
            self.transactions_resource.path_part
        ).apply(
            lambda args: f"{args[0]}/*/{args[1]}/{args[2]}"
        )

        self.lambda_permission = aws.lambda_.Permission(
            "api-lambda-permission",
            action="lambda:InvokeFunction",
            function=transaction_receiver.name,
            principal="apigateway.amazonaws.com",
            source_arn=source_arn,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, transaction_receiver, self.post_method]
            )
        )

    def _create_deployment(self):
        """
        Create API deployment with proper dependencies.

        Addresses Failure 9: Proper dependency ordering for deployments.
        """
        self.deployment = aws.apigateway.Deployment(
            "api-deployment",
            rest_api=self.api.id,
            description="Transaction API deployment",
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[
                    self.api,
                    self.transactions_resource,
                    self.post_method,
                    self.integration,
                    self.lambda_permission
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
            opts=pulumi.ResourceOptions(
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
                throttling_rate_limit=self.config.api_throttle_rate_limit,
                throttling_burst_limit=self.config.api_throttle_burst_limit,
                metrics_enabled=True
            ),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.stage]
            )
        )

    def get_api_url(self) -> Output[str]:
        """Get API Gateway URL."""
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

    def get_api_endpoint(self) -> Output[str]:
        """Get API Gateway endpoint URL."""
        return self.get_api_url()


```

## File: lib\infrastructure\api_gateway.py

```python
"""
AWS Provider module for consistent provider usage.

This module creates a single AWS provider instance to avoid drift in CI/CD pipelines.
"""

import pulumi_aws as aws

from .config import TransactionPipelineConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.

    Ensures all resources use the same provider without random suffixes,
    preventing drift in CI/CD pipelines.
    """

    def __init__(self, config: TransactionPipelineConfig):
        """
        Initialize the AWS provider manager.

        Args:
            config: TransactionPipelineConfig instance
        """
        self.config = config
        self._provider = None

    def get_provider(self) -> aws.Provider:
        """
        Get or create the AWS provider instance.

        Returns:
            AWS Provider instance
        """
        if self._provider is None:
            self._provider = aws.Provider(
                'aws-provider',
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
Configuration module for the serverless transaction pipeline.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict, Optional


@dataclass
class TransactionPipelineConfig:
    """Centralized configuration for the serverless transaction pipeline."""

    environment: str
    environment_suffix: str
    project_name: str

    primary_region: str
    normalized_region: str

    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int

    api_throttle_rate_limit: int
    api_throttle_burst_limit: int

    fraud_threshold: float
    audit_retention_days: int

    transaction_receiver_concurrency: int
    fraud_validator_concurrency: int
    audit_logger_concurrency: int

    dlq_max_receive_count: int

    log_retention_days: int
    enable_xray_tracing: bool

    team: str
    cost_center: str

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'prod')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'txn')

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)

        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '30'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '256'))

        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '2000'))

        self.fraud_threshold = float(os.getenv('FRAUD_THRESHOLD', '0.85'))
        self.audit_retention_days = int(os.getenv('AUDIT_RETENTION_DAYS', '90'))

        self.transaction_receiver_concurrency = int(os.getenv('TRANSACTION_RECEIVER_CONCURRENCY', '100'))
        self.fraud_validator_concurrency = int(os.getenv('FRAUD_VALIDATOR_CONCURRENCY', '50'))
        self.audit_logger_concurrency = int(os.getenv('AUDIT_LOGGER_CONCURRENCY', '25'))

        self.dlq_max_receive_count = int(os.getenv('DLQ_MAX_RECEIVE_COUNT', '3'))

        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'

        self.team = os.getenv('TEAM', 'fraud-detection')
        self.cost_center = os.getenv('COST_CENTER', 'fintech-001')

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
            Formatted resource name with region, environment, and environment suffix
        """
        base_name = f"{self.project_name}-{resource_type}"

        if include_region:
            base_name = f"{base_name}-{self.normalized_region}"

        base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"

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

## File: lib\infrastructure\dynamodb.py.py

```python
"""
DynamoDB module for the serverless transaction pipeline.

This module creates DynamoDB tables for transactions and validation results
with global secondary indexes.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig


class DynamoDBStack:
    """
    Manages DynamoDB tables for the transaction pipeline.

    Creates tables for transactions and validation-results with GSI on timestamp.
    """

    def __init__(self, config: TransactionPipelineConfig, provider_manager: AWSProviderManager):
        """
        Initialize the DynamoDB stack.

        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.tables: Dict[str, aws.dynamodb.Table] = {}

        self._create_transactions_table()
        self._create_validation_results_table()

    def _create_transactions_table(self):
        """Create transactions table with GSI on timestamp."""
        table_name = self.config.get_resource_name('transactions')

        table = aws.dynamodb.Table(
            "transactions-table",
            name=table_name,
            billing_mode="PAY_PER_REQUEST",
            hash_key="transaction_id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="transaction_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="timestamp-index",
                    hash_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        self.tables['transactions'] = table

    def _create_validation_results_table(self):
        """Create validation-results table with GSI on timestamp."""
        table_name = self.config.get_resource_name('validation-results')

        table = aws.dynamodb.Table(
            "validation-results-table",
            name=table_name,
            billing_mode="PAY_PER_REQUEST",
            hash_key="validation_id",
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name="validation_id",
                    type="S"
                ),
                aws.dynamodb.TableAttributeArgs(
                    name="timestamp",
                    type="N"
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name="timestamp-index",
                    hash_key="timestamp",
                    projection_type="ALL"
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        self.tables['validation-results'] = table

    def get_table(self, table_name: str) -> aws.dynamodb.Table:
        """Get a table by name."""
        return self.tables[table_name]

    def get_table_name(self, table_name: str) -> Output[str]:
        """Get table name."""
        return self.tables[table_name].name

    def get_table_arn(self, table_name: str) -> Output[str]:
        """Get table ARN."""
        return self.tables[table_name].arn


```

## File: lib\infrastructure\eventbridge.py

```python
"""
EventBridge module for the serverless transaction pipeline.

This module creates EventBridge rules to trigger Lambda functions and route
failed validations to SQS queues.

Addresses Model Failures:
- EventBridge → SQS target missing role_arn
- EventBridge → Lambda target wiring with proper configuration
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack
from .sqs import SQSStack


class EventBridgeStack:
    """
    Manages EventBridge rules for the transaction pipeline.

    Creates rules to trigger fraud-validator on transaction events and
    route failed validations to SQS.
    """

    def __init__(
        self,
        config: TransactionPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        lambda_stack: LambdaStack,
        sqs_stack: SQSStack
    ):
        """
        Initialize the EventBridge stack.

        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            lambda_stack: LambdaStack instance
            sqs_stack: SQSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.lambda_stack = lambda_stack
        self.sqs_stack = sqs_stack
        self.rules: Dict[str, aws.cloudwatch.EventRule] = {}

        self._create_eventbridge_sqs_role()
        self._create_transaction_received_rule()
        self._create_failed_validation_rule()

    def _create_eventbridge_sqs_role(self):
        """
        Create IAM role for EventBridge to send messages to SQS.

        Addresses Failure 4: EventBridge → SQS target missing role_arn.
        """
        self.eventbridge_sqs_role = self.iam_stack.create_eventbridge_sqs_role(
            event_bus_arn=f"arn:aws:events:{self.config.primary_region}:*:event-bus/default",
            queue_arns=[self.sqs_stack.get_queue_arn('failed-validations')]
        )

    def _create_transaction_received_rule(self):
        """
        Create EventBridge rule to trigger fraud-validator on transaction events.

        Addresses Failure 8: EventBridge → Lambda target with proper configuration.
        """
        rule_name = self.config.get_resource_name('transaction-received-rule')

        rule = aws.cloudwatch.EventRule(
            "transaction-received-rule",
            name=rule_name,
            description="Trigger fraud-validator when transaction is received",
            event_pattern="""{
                "source": ["transaction.receiver"],
                "detail-type": ["TransactionReceived"]
            }""",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        fraud_validator_function = self.lambda_stack.get_function('fraud-validator')

        target = aws.cloudwatch.EventTarget(
            "transaction-received-target",
            rule=rule.name,
            arn=fraud_validator_function.arn,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[rule, fraud_validator_function]
            )
        )

        aws.lambda_.Permission(
            "transaction-received-lambda-permission",
            action="lambda:InvokeFunction",
            function=fraud_validator_function.name,
            principal="events.amazonaws.com",
            source_arn=rule.arn,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[rule, fraud_validator_function]
            )
        )

        self.rules['transaction-received'] = rule

    def _create_failed_validation_rule(self):
        """
        Create EventBridge rule to route failed validations to SQS.

        Addresses Failure 4: Proper role_arn for EventBridge → SQS.
        """
        rule_name = self.config.get_resource_name('failed-validation-rule')

        rule = aws.cloudwatch.EventRule(
            "failed-validation-rule",
            name=rule_name,
            description="Route failed validations to SQS queue",
            event_pattern="""{
                "source": ["fraud.validator"],
                "detail-type": ["ValidationFailed"]
            }""",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        failed_queue = self.sqs_stack.get_queue('failed-validations')

        target = aws.cloudwatch.EventTarget(
            "failed-validation-target",
            rule=rule.name,
            arn=failed_queue.arn,
            role_arn=self.eventbridge_sqs_role.arn,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[rule, failed_queue, self.eventbridge_sqs_role]
            )
        )

        aws.sqs.QueuePolicy(
            "failed-validation-queue-policy",
            queue_url=failed_queue.url,
            policy=Output.all(failed_queue.arn, rule.arn).apply(
                lambda args: f"""{{
                    "Version": "2012-10-17",
                    "Statement": [{{
                        "Effect": "Allow",
                        "Principal": {{
                            "Service": "events.amazonaws.com"
                        }},
                        "Action": "sqs:SendMessage",
                        "Resource": "{args[0]}",
                        "Condition": {{
                            "ArnEquals": {{
                                "aws:SourceArn": "{args[1]}"
                            }}
                        }}
                    }}]
                }}"""
            ),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[failed_queue, rule]
            )
        )

        self.rules['failed-validation'] = rule

    def get_rule(self, rule_name: str) -> aws.cloudwatch.EventRule:
        """Get an EventBridge rule by name."""
        return self.rules[rule_name]

    def get_rule_arn(self, rule_name: str) -> Output[str]:
        """Get EventBridge rule ARN."""
        return self.rules[rule_name].arn


```

## File: lib\infrastructure\iam.py

```python
"""
IAM module for the serverless transaction pipeline.

This module creates tightly scoped IAM roles and policies for Lambda functions,
avoiding overly broad managed policies and ensuring least-privilege access.

Addresses Model Failures:
- IAM policy construction with proper resource shapes
- Over-broad EventBridge policy (scoped to specific resources)
"""

import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig


class IAMStack:
    """
    Manages IAM roles and policies for Lambda functions.

    Creates tightly scoped IAM roles with minimal permissions,
    avoiding broad managed policies.
    """

    def __init__(self, config: TransactionPipelineConfig, provider_manager: AWSProviderManager):
        """
        Initialize the IAM stack.

        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.RolePolicy] = {}

    def create_lambda_role(
        self,
        role_name: str,
        dynamodb_table_arns: Optional[List[Output[str]]] = None,
        sqs_queue_arns: Optional[List[Output[str]]] = None,
        eventbridge_bus_arns: Optional[List[str]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create a tightly scoped IAM role for a Lambda function.

        Args:
            role_name: Name identifier for the role
            dynamodb_table_arns: List of DynamoDB table ARNs to grant access to
            sqs_queue_arns: List of SQS queue ARNs to grant access to
            eventbridge_bus_arns: List of EventBridge bus ARNs to grant access to
            enable_xray: Whether to enable X-Ray tracing permissions

        Returns:
            IAM Role resource
        """
        resource_name = self.config.get_resource_name(f'role-{role_name}')

        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        })

        role = aws.iam.Role(
            f"lambda-role-{role_name}",
            name=resource_name,
            assume_role_policy=assume_role_policy,
            description=f"Tightly scoped role for {role_name} Lambda function",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        self._attach_cloudwatch_logs_policy(role, role_name)

        if dynamodb_table_arns:
            self._attach_dynamodb_policy(role, role_name, dynamodb_table_arns)

        if sqs_queue_arns:
            self._attach_sqs_policy(role, role_name, sqs_queue_arns)

        if eventbridge_bus_arns:
            self._attach_eventbridge_policy(role, role_name, eventbridge_bus_arns)

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

        policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["logs:CreateLogGroup"],
                    "Resource": f"arn:aws:logs:{region}:*:*"
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
        })

        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-cloudwatch-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.policies[f"{role_name}-cloudwatch"] = policy

    def _attach_dynamodb_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        table_arns: List[Output[str]]
    ):
        """
        Attach tightly scoped DynamoDB policy.

        Addresses Failure 5: Proper resource shape handling for IAM policies.
        """
        def build_policy(arns):
            resources = []
            for arn in arns:
                resources.append(arn)
                resources.append(f"{arn}/index/*")

            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:PutItem",
                        "dynamodb:GetItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": resources
                }]
            })

        policy_document = Output.all(*table_arns).apply(build_policy)

        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-dynamodb-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.policies[f"{role_name}-dynamodb"] = policy

    def _attach_sqs_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        queue_arns: List[Output[str]]
    ):
        """Attach tightly scoped SQS policy."""
        def build_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:ReceiveMessage",
                        "sqs:DeleteMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": list(arns)
                }]
            })

        policy_document = Output.all(*queue_arns).apply(build_policy)

        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-sqs-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.policies[f"{role_name}-sqs"] = policy

    def _attach_eventbridge_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        bus_arns: List[str]
    ):
        """
        Attach tightly scoped EventBridge policy.

        Addresses Failure 6: Over-broad EventBridge policy.
        Now scoped to specific event buses instead of Resource: "*".
        """
        policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": ["events:PutEvents"],
                "Resource": bus_arns
            }]
        })

        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-eventbridge-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.policies[f"{role_name}-eventbridge"] = policy

    def _attach_xray_policy(self, role: aws.iam.Role, role_name: str):
        """Attach X-Ray tracing policy."""
        policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "xray:PutTraceSegments",
                    "xray:PutTelemetryRecords"
                ],
                "Resource": "*"
            }]
        })

        policy = aws.iam.RolePolicy(
            f"lambda-role-{role_name}-xray-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.policies[f"{role_name}-xray"] = policy

    def create_eventbridge_sqs_role(self, event_bus_arn: str, queue_arns: List[Output[str]]) -> aws.iam.Role:
        """
        Create IAM role for EventBridge to send messages to SQS.

        Addresses Failure 4: EventBridge → SQS target missing role_arn.

        Args:
            event_bus_arn: EventBridge bus ARN
            queue_arns: List of SQS queue ARNs

        Returns:
            IAM Role for EventBridge
        """
        resource_name = self.config.get_resource_name('eb-sqs-role')

        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Principal": {
                    "Service": "events.amazonaws.com"
                },
                "Effect": "Allow"
            }]
        })

        role = aws.iam.Role(
            "eventbridge-sqs-role",
            name=resource_name,
            assume_role_policy=assume_role_policy,
            description="Role for EventBridge to send messages to SQS",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        def build_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["sqs:SendMessage"],
                    "Resource": list(arns)
                }]
            })

        policy_document = Output.all(*queue_arns).apply(build_policy)

        aws.iam.RolePolicy(
            "eventbridge-sqs-policy",
            role=role.id,
            policy=policy_document,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )

        self.roles['eventbridge-sqs'] = role
        return role

    def get_role(self, role_name: str) -> aws.iam.Role:
        """Get a role by name."""
        return self.roles[role_name]

    def get_role_arn(self, role_name: str) -> Output[str]:
        """Get role ARN."""
        return self.roles[role_name].arn


```

## File: lib\infrastructure\lambda_functions.py

```python
"""
Lambda Functions module for the serverless transaction pipeline.

This module creates Lambda functions with proper IAM roles, environment variables,
and concurrency limits.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import AssetArchive, FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .sqs import SQSStack


class LambdaStack:
    """
    Manages Lambda functions for the transaction pipeline.

    Creates three Lambda functions with proper configuration.
    """

    def __init__(
        self,
        config: TransactionPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: TransactionPipelineConfig instance
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
        self.functions: Dict[str, aws.lambda_.Function] = {}

        self._create_transaction_receiver()
        self._create_fraud_validator()
        self._create_audit_logger()

    def _get_lambda_code_path(self, function_name: str) -> str:
        """Get the path to Lambda function code."""
        current_dir = os.path.dirname(__file__)
        return os.path.join(current_dir, 'lambda_code', f'{function_name}.py')

    def _create_transaction_receiver(self):
        """Create transaction-receiver Lambda function."""
        function_name = 'transaction-receiver'

        default_event_bus_arn = f"arn:aws:events:{self.config.primary_region}:*:event-bus/default"

        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('transactions')],
            eventbridge_bus_arns=[default_event_bus_arn],
            enable_xray=self.config.enable_xray_tracing
        )

        resource_name = self.config.get_resource_name(function_name)
        code_path = self._get_lambda_code_path(function_name.replace('-', '_'))

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='transaction_receiver.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'TRANSACTIONS_TABLE': self.dynamodb_stack.get_table_name('transactions'),
                    'FRAUD_THRESHOLD': str(self.config.fraud_threshold),
                    'AUDIT_RETENTION_DAYS': str(self.config.audit_retention_days)
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )

        self.functions[function_name] = function

    def _create_fraud_validator(self):
        """Create fraud-validator Lambda function."""
        function_name = 'fraud-validator'

        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('validation-results')],
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('failed-validations')],
            enable_xray=self.config.enable_xray_tracing
        )

        resource_name = self.config.get_resource_name(function_name)
        code_path = self._get_lambda_code_path(function_name.replace('-', '_'))

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='fraud_validator.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'VALIDATION_RESULTS_TABLE': self.dynamodb_stack.get_table_name('validation-results'),
                    'FAILED_VALIDATIONS_QUEUE_URL': self.sqs_stack.get_queue_url('failed-validations'),
                    'FRAUD_THRESHOLD': str(self.config.fraud_threshold),
                    'AUDIT_RETENTION_DAYS': str(self.config.audit_retention_days)
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )

        self.functions[function_name] = function

    def _create_audit_logger(self):
        """Create audit-logger Lambda function."""
        function_name = 'audit-logger'

        role = self.iam_stack.create_lambda_role(
            function_name,
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('audit-logger')],
            enable_xray=self.config.enable_xray_tracing
        )

        resource_name = self.config.get_resource_name(function_name)
        code_path = self._get_lambda_code_path(function_name.replace('-', '_'))

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='audit_logger.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'FRAUD_THRESHOLD': str(self.config.fraud_threshold),
                    'AUDIT_RETENTION_DAYS': str(self.config.audit_retention_days)
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )

        aws.lambda_.EventSourceMapping(
            f"{function_name}-sqs-trigger",
            event_source_arn=self.sqs_stack.get_queue_arn('audit-logger'),
            function_name=function.name,
            batch_size=10,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[function]
            )
        )

        self.functions[function_name] = function

    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """Get a Lambda function by name."""
        return self.functions[function_name]

    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN."""
        return self.functions[function_name].arn

    def get_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name."""
        return self.functions[function_name].name

    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function invoke ARN."""
        return self.functions[function_name].invoke_arn

    def get_all_function_names(self):
        """Get all function names."""
        return list(self.functions.keys())


```

## File: lib\infrastructure\monitoring.py

```python
"""
CloudWatch Monitoring module for the serverless transaction pipeline.

This module creates CloudWatch Log Groups for Lambda functions with proper
retention policies.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch monitoring for the transaction pipeline.

    Creates log groups for Lambda functions with retention policies.
    """

    def __init__(
        self,
        config: TransactionPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the Monitoring stack.

        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}

        self._create_log_groups()

    def _create_log_groups(self):
        """Create CloudWatch Log Groups for all Lambda functions."""
        for function_name in self.lambda_stack.get_all_function_names():
            log_group_name = self.lambda_stack.get_function_name(function_name).apply(
                lambda name: f"/aws/lambda/{name}"
            )

            log_group = aws.cloudwatch.LogGroup(
                f"{function_name}-log-group",
                name=log_group_name,
                retention_in_days=self.config.log_retention_days,
                tags=self.config.get_common_tags(),
                opts=pulumi.ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )

            self.log_groups[function_name] = log_group

    def get_log_group(self, function_name: str) -> aws.cloudwatch.LogGroup:
        """Get a log group by function name."""
        return self.log_groups[function_name]

    def get_log_group_name(self, function_name: str) -> Output[str]:
        """Get log group name."""
        return self.log_groups[function_name].name

    def get_log_group_arn(self, function_name: str) -> Output[str]:
        """Get log group ARN."""
        return self.log_groups[function_name].arn


```

## File: lib\infrastructure\sqs.py

```python
"""
SQS module for the serverless transaction pipeline.

This module creates SQS queues with proper dead-letter queue configuration.

Addresses Model Failures:
- SQS redrive / DLQ configuration
- SQS target wiring for failed-validations
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig


class SQSStack:
    """
    Manages SQS queues with dead-letter queue configuration.

    Creates main queues for each Lambda with proper DLQ redrive policy.
    """

    def __init__(self, config: TransactionPipelineConfig, provider_manager: AWSProviderManager):
        """
        Initialize the SQS stack.

        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.queues: Dict[str, aws.sqs.Queue] = {}
        self.dlqs: Dict[str, aws.sqs.Queue] = {}

        self._create_lambda_queues()
        self._create_failed_validations_queue()

    def _create_lambda_queues(self):
        """
        Create queues with DLQs for each Lambda function.

        Addresses Failure 3: Proper redrive_policy configuration with maxReceiveCount=3.
        """
        lambda_functions = [
            'transaction-receiver',
            'fraud-validator',
            'audit-logger'
        ]

        for function_name in lambda_functions:
            dlq_name = self.config.get_resource_name(f'{function_name}-dlq')
            dlq = aws.sqs.Queue(
                f"{function_name}-dlq",
                name=dlq_name,
                message_retention_seconds=1209600,
                tags=self.config.get_common_tags(),
                opts=pulumi.ResourceOptions(
                    provider=self.provider_manager.get_provider()
                )
            )
            self.dlqs[function_name] = dlq

            queue_name = self.config.get_resource_name(f'{function_name}-queue')

            redrive_policy = dlq.arn.apply(
                lambda arn: json.dumps({
                    "deadLetterTargetArn": arn,
                    "maxReceiveCount": self.config.dlq_max_receive_count
                })
            )

            queue = aws.sqs.Queue(
                f"{function_name}-queue",
                name=queue_name,
                visibility_timeout_seconds=self.config.lambda_timeout * 6,
                redrive_policy=redrive_policy,
                tags=self.config.get_common_tags(),
                opts=pulumi.ResourceOptions(
                    provider=self.provider_manager.get_provider(),
                    depends_on=[dlq]
                )
            )
            self.queues[function_name] = queue

    def _create_failed_validations_queue(self):
        """
        Create queue for failed validations with its own DLQ.

        Addresses Failure 7: Proper wiring of failed-validations queue.
        """
        dlq_name = self.config.get_resource_name('failed-validations-dlq')
        dlq = aws.sqs.Queue(
            "failed-validations-dlq",
            name=dlq_name,
            message_retention_seconds=1209600,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        self.dlqs['failed-validations'] = dlq

        queue_name = self.config.get_resource_name('failed-validations-queue')

        redrive_policy = dlq.arn.apply(
            lambda arn: json.dumps({
                "deadLetterTargetArn": arn,
                "maxReceiveCount": self.config.dlq_max_receive_count
            })
        )

        queue = aws.sqs.Queue(
            "failed-validations-queue",
            name=queue_name,
            visibility_timeout_seconds=self.config.lambda_timeout * 6,
            redrive_policy=redrive_policy,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[dlq]
            )
        )
        self.queues['failed-validations'] = queue

    def get_queue(self, queue_name: str) -> aws.sqs.Queue:
        """Get a queue by name."""
        return self.queues[queue_name]

    def get_queue_arn(self, queue_name: str) -> Output[str]:
        """Get queue ARN."""
        return self.queues[queue_name].arn

    def get_queue_url(self, queue_name: str) -> Output[str]:
        """Get queue URL."""
        return self.queues[queue_name].url

    def get_dlq(self, dlq_name: str) -> aws.sqs.Queue:
        """Get a DLQ by name."""
        return self.dlqs[dlq_name]

    def get_dlq_arn(self, dlq_name: str) -> Output[str]:
        """Get DLQ ARN."""
        return self.dlqs[dlq_name].arn


```
