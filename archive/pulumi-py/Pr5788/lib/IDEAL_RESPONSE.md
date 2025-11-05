## File: tap.py

```py
#!/usr/bin/env python3
"""
Pulumi application entry point for the TAP (Test Automation Platform) infrastructure.

This module defines the core Pulumi stack and instantiates the TapStack with appropriate
configuration based on the deployment environment. It handles environment-specific settings,
tagging, and deployment configuration for AWS resources.

The stack created by this module uses environment suffixes to distinguish between
different deployment environments (development, staging, production, etc.).
"""
import os
import sys

import pulumi
from pulumi import Config, ResourceOptions

# Add project root to Python path for lib imports
project_root = os.path.dirname(os.path.abspath(__file__))
if project_root not in sys.path:
    sys.path.insert(0, project_root)

from lib.tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from CI, config or fallback to 'dev'
environment_suffix = os.getenv('ENVIRONMENT_SUFFIX') or config.get('env') or 'dev'
STACK_NAME = f"TapStack{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

# Create a resource options object with default tags
default_tags = {
    'Environment': environment_suffix,
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="pulumi-infra",
    args=TapStackArgs(environment_suffix=environment_suffix),
)

```

## File: lib\*\*init\*\*.py

```py
# empty
```

## File: lib\tap_stack.py

```py
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless transaction processing infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (APIGatewayStack, AWSProviderManager, DynamoDBStack,
                             IAMStack, KMSStack, LambdaStack, MonitoringStack,
                             S3Stack, SQSStack, TransactionConfig)


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment environment.
        tags (Optional[dict]): Optional default tags to apply to resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None, tags: Optional[dict] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless transaction processing infrastructure.

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

        self.config = TransactionConfig()

        self.provider_manager = AWSProviderManager(self.config)

        self.kms_stack = KMSStack(self.config, self.provider_manager)

        self.s3_stack = S3Stack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )

        self.dynamodb_stack = DynamoDBStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )

        self.sqs_stack = SQSStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )

        self.iam_stack = IAMStack(self.config, self.provider_manager)

        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.dynamodb_stack,
            self.sqs_stack,
            self.kms_stack
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
        outputs['api_gateway_id'] = self.api_gateway_stack.get_api_id()

        outputs['logs_bucket_name'] = self.s3_stack.get_bucket_name('logs')
        outputs['logs_bucket_arn'] = self.s3_stack.get_bucket_arn('logs')

        outputs['transactions_table_name'] = self.dynamodb_stack.get_table_name('transactions')
        outputs['transactions_table_arn'] = self.dynamodb_stack.get_table_arn('transactions')

        outputs['analytics_queue_url'] = self.sqs_stack.get_queue_url('analytics')
        outputs['analytics_queue_arn'] = self.sqs_stack.get_queue_arn('analytics')
        outputs['reporting_queue_url'] = self.sqs_stack.get_queue_url('reporting')
        outputs['reporting_queue_arn'] = self.sqs_stack.get_queue_arn('reporting')

        outputs['analytics_dlq_url'] = self.sqs_stack.get_dlq_url('analytics-dlq')
        outputs['reporting_dlq_url'] = self.sqs_stack.get_dlq_url('reporting-dlq')

        outputs['transaction_validator_function_name'] = self.lambda_stack.get_function_name('transaction-validator')
        outputs['transaction_validator_function_arn'] = self.lambda_stack.get_function_arn('transaction-validator')
        outputs['transaction_validator_log_group'] = self.lambda_stack.get_log_group_name('transaction-validator')
        outputs['transaction_validator_dlq_url'] = self.sqs_stack.get_dlq_url('transaction-validator-lambda')

        outputs['notification_handler_function_name'] = self.lambda_stack.get_function_name('notification-handler')
        outputs['notification_handler_function_arn'] = self.lambda_stack.get_function_arn('notification-handler')
        outputs['notification_handler_log_group'] = self.lambda_stack.get_log_group_name('notification-handler')
        outputs['notification_handler_dlq_url'] = self.sqs_stack.get_dlq_url('notification-handler-lambda')

        outputs['analytics_processor_function_name'] = self.lambda_stack.get_function_name('analytics-processor')
        outputs['analytics_processor_function_arn'] = self.lambda_stack.get_function_arn('analytics-processor')
        outputs['analytics_processor_log_group'] = self.lambda_stack.get_log_group_name('analytics-processor')
        outputs['analytics_processor_dlq_url'] = self.sqs_stack.get_dlq_url('analytics-processor-lambda')

        outputs['reporting_processor_function_name'] = self.lambda_stack.get_function_name('reporting-processor')
        outputs['reporting_processor_function_arn'] = self.lambda_stack.get_function_arn('reporting-processor')
        outputs['reporting_processor_log_group'] = self.lambda_stack.get_log_group_name('reporting-processor')
        outputs['reporting_processor_dlq_url'] = self.sqs_stack.get_dlq_url('reporting-processor-lambda')

        outputs['kms_s3_key_id'] = self.kms_stack.get_key_id('s3')
        outputs['kms_s3_key_arn'] = self.kms_stack.get_key_arn('s3')
        outputs['kms_dynamodb_key_id'] = self.kms_stack.get_key_id('dynamodb')
        outputs['kms_dynamodb_key_arn'] = self.kms_stack.get_key_arn('dynamodb')
        outputs['kms_sqs_key_id'] = self.kms_stack.get_key_id('sqs')
        outputs['kms_sqs_key_arn'] = self.kms_stack.get_key_arn('sqs')

        outputs['alarms_sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn()

        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass

        self.register_outputs(outputs)

```

## File: lib\infrastructure\_\_init\_\_.py

```py
"""
Infrastructure module initialization.

Exports all infrastructure components for easy importing.
"""

from .api_gateway import APIGatewayStack
from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .lambda_functions import LambdaStack
from .monitoring import MonitoringStack
from .s3 import S3Stack
from .sqs import SQSStack

__all__ = [
    'APIGatewayStack',
    'AWSProviderManager',
    'DynamoDBStack',
    'IAMStack',
    'KMSStack',
    'LambdaStack',
    'MonitoringStack',
    'S3Stack',
    'SQSStack',
    'TransactionConfig',
]


```

## File: lib\infrastructure\lambda_code\analytics_processor.py

```py
"""
Analytics processor Lambda function.

This function processes transactions from the analytics queue
for analytics and reporting purposes.
"""

import json
import os

import boto3

cloudwatch = boto3.client('cloudwatch')


def handler(event, context):
    """
    Lambda handler for processing analytics data.

    Args:
        event: SQS event
        context: Lambda context

    Returns:
        Success response
    """
    try:
        processed_count = 0

        for record in event.get('Records', []):
            message_body = record.get('body', '{}')
            message_data = json.loads(message_body)

            processed_count += 1

        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'AnalyticsProcessed',
                    'Value': processed_count,
                    'Unit': 'Count'
                }
            ]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Analytics processed successfully',
                'processed_count': processed_count
            })
        }

    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'AnalyticsErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

```

## File: lib\infrastructure\lambda_code\notifications_handler.py

```py
"""
Notification handler Lambda function.

This function sends notifications via SNS for transaction events.
"""

import json
import os

import boto3

sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')


def handler(event, context):
    """
    Lambda handler for sending notifications.

    Args:
        event: Event data
        context: Lambda context

    Returns:
        Success response
    """
    try:
        topic_arn = os.environ.get('SNS_TOPIC_ARN')

        for record in event.get('Records', []):
            message_body = record.get('body', '{}')
            message_data = json.loads(message_body)

            sns.publish(
                TopicArn=topic_arn,
                Subject='Transaction Notification',
                Message=json.dumps(message_data)
            )

        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'NotificationsSent',
                    'Value': len(event.get('Records', [])),
                    'Unit': 'Count'
                }
            ]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({'message': 'Notifications sent successfully'})
        }

    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'NotificationErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

```

## File: lib\infrastructure\lambda_code\reporting_processor.py

```py
"""
Reporting processor Lambda function.

This function processes transactions from the reporting queue
for generating reports.
"""

import json
import os

import boto3

cloudwatch = boto3.client('cloudwatch')


def handler(event, context):
    """
    Lambda handler for processing reporting data.

    Args:
        event: SQS event
        context: Lambda context

    Returns:
        Success response
    """
    try:
        processed_count = 0

        for record in event.get('Records', []):
            message_body = record.get('body', '{}')
            message_data = json.loads(message_body)

            processed_count += 1

        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'ReportsProcessed',
                    'Value': processed_count,
                    'Unit': 'Count'
                }
            ]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Reports processed successfully',
                'processed_count': processed_count
            })
        }

    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'ReportingErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

```

## File: lib\infrastructure\lambda_code\transaction_validator.py

```py
"""
Transaction validator Lambda function.

This function validates payment transactions and sends them to
analytics and reporting queues for async processing.
"""

import json
import os
from decimal import Decimal

import boto3

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')
cloudwatch = boto3.client('cloudwatch')


def handler(event, context):
    """
    Lambda handler for transaction validation.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    try:
        table_name = os.environ.get('TRANSACTIONS_TABLE')
        analytics_queue_url = os.environ.get('ANALYTICS_QUEUE_URL')
        reporting_queue_url = os.environ.get('REPORTING_QUEUE_URL')

        body = json.loads(event.get('body', '{}'))
        transaction_id = body.get('transaction_id')
        merchant_id = body.get('merchant_id')
        amount = body.get('amount')

        if not all([transaction_id, merchant_id, amount]):
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Missing required fields'})
            }

        table = dynamodb.Table(table_name)

        item = {
            'transaction_id': transaction_id,
            'merchant_id': merchant_id,
            'amount': Decimal(str(amount)),
            'status': 'validated',
            'transaction_date': body.get('transaction_date', '2024-01-01')
        }

        table.put_item(Item=item)

        message_body = json.dumps({
            'transaction_id': transaction_id,
            'merchant_id': merchant_id,
            'amount': float(amount)
        })

        sqs.send_message(
            QueueUrl=analytics_queue_url,
            MessageBody=message_body
        )

        sqs.send_message(
            QueueUrl=reporting_queue_url,
            MessageBody=message_body
        )

        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'TransactionsValidated',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Transaction validated successfully',
                'transaction_id': transaction_id
            })
        }

    except Exception as e:
        cloudwatch.put_metric_data(
            Namespace='TransactionProcessing',
            MetricData=[
                {
                    'MetricName': 'TransactionErrors',
                    'Value': 1,
                    'Unit': 'Count'
                }
            ]
        )

        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

```

## File: lib\infrastructure\api_gateway.py

```py
"""
API Gateway module.

This module creates API Gateway with proper Lambda integration,
caching, usage plans, and X-Ray tracing.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """Manages API Gateway with Lambda integration."""

    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.

        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack

        self._create_api()
        self._create_resources()
        self._create_deployment()
        self._create_usage_plan()

    def _create_api(self):
        """Create REST API."""
        api_name = self.config.get_resource_name('api')

        self.api = aws.apigateway.RestApi(
            'transaction-api',
            name=api_name,
            description='Transaction processing API',
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types='REGIONAL'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': api_name
            },
            opts=self.provider_manager.get_resource_options()
        )

    def _create_resources(self):
        """Create API resources and methods."""
        transactions_resource = aws.apigateway.Resource(
            'transactions-resource',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='transactions',
            opts=self.provider_manager.get_resource_options()
        )

        post_method = aws.apigateway.Method(
            'post-transactions-method',
            rest_api=self.api.id,
            resource_id=transactions_resource.id,
            http_method='POST',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options()
        )

        integration_uri = Output.all(
            self.config.primary_region,
            self.lambda_stack.get_function_arn('transaction-validator')
        ).apply(
            lambda args: f'arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/functions/{args[1]}/invocations'
        )

        integration = aws.apigateway.Integration(
            'post-transactions-integration',
            rest_api=self.api.id,
            resource_id=transactions_resource.id,
            http_method=post_method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=integration_uri,
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[post_method])
        )

        lambda_permission = aws.lambda_.Permission(
            'api-lambda-permission',
            action='lambda:InvokeFunction',
            function=self.lambda_stack.get_function_name('transaction-validator'),
            principal='apigateway.amazonaws.com',
            source_arn=Output.all(
                self.api.execution_arn,
                self.config.api_stage_name
            ).apply(
                lambda args: f'{args[0]}/{args[1]}/POST/transactions'
            ),
            opts=self.provider_manager.get_resource_options()
        )

        self.methods = [post_method]
        self.integrations = [integration]

    def _create_deployment(self):
        """Create API deployment and stage."""
        deployment_name = self.config.get_resource_name('deployment')

        self.deployment = aws.apigateway.Deployment(
            'api-deployment',
            rest_api=self.api.id,
            triggers={
                'redeployment': Output.all(*[m.id for m in self.methods]).apply(
                    lambda ids: '-'.join(ids)
                )
            },
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=self.methods + self.integrations
            )
        )

        self.stage = aws.apigateway.Stage(
            'api-stage',
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=self.config.api_stage_name,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            cache_cluster_enabled=True,
            cache_cluster_size='0.5',
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'api-{self.config.api_stage_name}')
            },
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[self.deployment])
        )

        aws.apigateway.MethodSettings(
            'api-method-settings',
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path='*/*',
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                metrics_enabled=True,
                caching_enabled=True,
                cache_ttl_in_seconds=self.config.api_cache_ttl_seconds,
                cache_data_encrypted=True
            ),
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[self.stage])
        )

    def _create_usage_plan(self):
        """Create usage plan with rate limiting."""
        usage_plan_name = self.config.get_resource_name('usage-plan')

        usage_plan = aws.apigateway.UsagePlan(
            'api-usage-plan',
            name=usage_plan_name,
            api_stages=[aws.apigateway.UsagePlanApiStageArgs(
                api_id=self.api.id,
                stage=self.stage.stage_name
            )],
            throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
                rate_limit=self.config.api_throttle_rate_limit,
                burst_limit=self.config.api_throttle_burst_limit
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': usage_plan_name
            },
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[self.stage])
        )

        api_key_name = self.config.get_resource_name('api-key')

        api_key = aws.apigateway.ApiKey(
            'api-key',
            name=api_key_name,
            enabled=True,
            tags={
                **self.config.get_common_tags(),
                'Name': api_key_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.apigateway.UsagePlanKey(
            'usage-plan-key',
            key_id=api_key.id,
            key_type='API_KEY',
            usage_plan_id=usage_plan.id,
            opts=self.provider_manager.get_resource_options()
        )

    def get_api_id(self) -> Output[str]:
        """Get API Gateway ID."""
        return self.api.id

    def get_api_url(self) -> Output[str]:
        """Get API Gateway URL."""
        return Output.all(
            self.api.id,
            self.stage.stage_name,
            self.config.primary_region
        ).apply(
            lambda args: f'https://{args[0]}.execute-api.{args[2]}.amazonaws.com/{args[1]}'
        )

    def get_api_endpoint(self) -> Output[str]:
        """Get API Gateway endpoint URL."""
        return self.get_api_url()

```

## File: lib\infrastructure\aws_provider.py

```py
"""
AWS Provider module for consistent provider usage.

This module creates a single AWS provider instance to avoid drift in CI/CD pipelines.
"""

import pulumi
import pulumi_aws as aws

from .config import TransactionConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.

    Ensures all resources use the same provider without random suffixes,
    preventing drift in CI/CD pipelines.
    """

    def __init__(self, config: TransactionConfig):
        """
        Initialize the AWS provider manager.

        Args:
            config: TransactionConfig instance
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

    def get_resource_options(self) -> pulumi.ResourceOptions:
        """
        Get ResourceOptions with the provider.

        Returns:
            ResourceOptions with provider set
        """
        return pulumi.ResourceOptions(provider=self.get_provider())


```

## File: lib\infrastructure\config.py

```py
"""
Configuration module for the serverless transaction processing infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict


@dataclass
class TransactionConfig:
    """Centralized configuration for the serverless transaction processing infrastructure."""

    environment: str
    environment_suffix: str
    project_name: str

    primary_region: str
    normalized_region: str
    account_id: str

    lambda_runtime: str
    lambda_timeout: int

    transaction_validator_memory: int
    transaction_validator_concurrency: int
    notification_handler_memory: int

    api_throttle_rate_limit: int
    api_throttle_burst_limit: int
    api_stage_name: str
    api_cache_ttl_seconds: int

    dynamodb_target_utilization: int
    dynamodb_pitr_enabled: bool

    s3_glacier_transition_days: int
    s3_log_expiration_days: int

    log_retention_days: int
    enable_xray_tracing: bool

    dlq_max_receive_count: int

    cloudwatch_concurrent_execution_limit: int
    cloudwatch_concurrent_execution_threshold_percent: int

    cost_target_monthly: int

    team: str
    application: str
    cost_center: str

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'prod')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = os.getenv('PROJECT_NAME', 'txn-proc')

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)
        self.account_id = os.getenv('AWS_ACCOUNT_ID', '123456789012')

        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '30'))

        self.transaction_validator_memory = int(os.getenv('TRANSACTION_VALIDATOR_MEMORY', '1536'))
        self.transaction_validator_concurrency = int(os.getenv('TRANSACTION_VALIDATOR_CONCURRENCY', '50'))
        self.notification_handler_memory = int(os.getenv('NOTIFICATION_HANDLER_MEMORY', '512'))

        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '200'))
        self.api_stage_name = os.getenv('API_STAGE_NAME', 'prod')
        self.api_cache_ttl_seconds = int(os.getenv('API_CACHE_TTL_SECONDS', '300'))

        self.dynamodb_target_utilization = int(os.getenv('DYNAMODB_TARGET_UTILIZATION', '70'))
        self.dynamodb_pitr_enabled = os.getenv('DYNAMODB_PITR_ENABLED', 'true').lower() == 'true'

        self.s3_glacier_transition_days = int(os.getenv('S3_GLACIER_TRANSITION_DAYS', '7'))
        self.s3_log_expiration_days = int(os.getenv('S3_LOG_EXPIRATION_DAYS', '365'))

        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'

        self.dlq_max_receive_count = int(os.getenv('DLQ_MAX_RECEIVE_COUNT', '3'))

        self.cloudwatch_concurrent_execution_limit = int(os.getenv('CLOUDWATCH_CONCURRENT_EXECUTION_LIMIT', '1000'))
        self.cloudwatch_concurrent_execution_threshold_percent = int(os.getenv('CLOUDWATCH_CONCURRENT_EXECUTION_THRESHOLD_PERCENT', '80'))

        self.cost_target_monthly = int(os.getenv('COST_TARGET_MONTHLY', '1000'))

        self.team = os.getenv('TEAM', 'platform')
        self.application = os.getenv('APPLICATION', 'transaction-processing')
        self.cost_center = os.getenv('COST_CENTER', 'engineering-001')

    def _normalize_region(self, region: str) -> str:
        """
        Normalize AWS region by removing hyphens for use in resource names.

        Args:
            region: AWS region (e.g., 'us-east-1')

        Returns:
            Normalized region string (e.g., 'useast1')
        """
        return region.replace('-', '')

    def normalize_name(self, name: str) -> str:
        """
        Normalize resource name to be lowercase and alphanumeric.

        Args:
            name: Resource name to normalize

        Returns:
            Normalized name (lowercase, alphanumeric with hyphens)
        """
        normalized = re.sub(r'[^a-zA-Z0-9-]', '', name.lower())
        normalized = re.sub(r'-+', '-', normalized)
        return normalized.strip('-')

    def get_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate a consistent resource name following the naming convention.

        Args:
            resource_type: Type of resource (e.g., 'lambda', 'dynamodb-table')
            include_region: Whether to include region in the name

        Returns:
            Formatted resource name
        """
        base_name = f"{self.project_name}-{resource_type}"

        if include_region:
            base_name = f"{base_name}-{self.normalized_region}"

        base_name = f"{base_name}-{self.environment}-{self.environment_suffix}"

        return base_name

    def get_normalized_resource_name(self, resource_type: str, include_region: bool = True) -> str:
        """
        Generate a normalized resource name (lowercase, suitable for S3, etc.).

        Args:
            resource_type: Type of resource
            include_region: Whether to include region in the name

        Returns:
            Normalized resource name
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
            'Application': self.application,
            'CostCenter': self.cost_center,
            'Team': self.team,
            'ManagedBy': 'Pulumi',
            'Project': self.project_name,
            'EnvironmentSuffix': self.environment_suffix
        }




```

## File: lib\infrastructure\dynamodb.py

```py
"""
DynamoDB module for managing tables with GSIs and auto-scaling.

This module creates DynamoDB tables with Global Secondary Indexes,
auto-scaling, and point-in-time recovery.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .kms import KMSStack


class DynamoDBStack:
    """Manages DynamoDB tables with GSIs and auto-scaling."""

    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the DynamoDB stack.

        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.tables: Dict[str, aws.dynamodb.Table] = {}
        self.autoscaling_targets: Dict[str, Dict[str, aws.appautoscaling.Target]] = {}
        self.autoscaling_policies: Dict[str, Dict[str, aws.appautoscaling.Policy]] = {}

        self._create_tables()

    def _create_tables(self):
        """Create DynamoDB tables."""
        self._create_transactions_table()

    def _create_transactions_table(self):
        """Create transactions table with GSIs for merchant and date range queries."""
        table_name = self.config.get_resource_name('transactions-table')

        table = aws.dynamodb.Table(
            'transactions-table',
            name=table_name,
            billing_mode='PROVISIONED',
            read_capacity=5,
            write_capacity=5,
            hash_key='transaction_id',
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name='transaction_id',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='merchant_id',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='transaction_date',
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name='status',
                    type='S'
                )
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='merchant-date-index',
                    hash_key='merchant_id',
                    range_key='transaction_date',
                    projection_type='ALL',
                    read_capacity=5,
                    write_capacity=5
                ),
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='status-date-index',
                    hash_key='status',
                    range_key='transaction_date',
                    projection_type='ALL',
                    read_capacity=5,
                    write_capacity=5
                )
            ],
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=self.config.dynamodb_pitr_enabled
            ),
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_stack.get_key_arn('dynamodb')
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': table_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.tables['transactions'] = table

        self._setup_autoscaling('transactions', table.name)

    def _setup_autoscaling(self, table_key: str, table_name: Output[str]):
        """
        Setup DynamoDB auto-scaling with 70% target utilization.

        Args:
            table_key: Internal key for the table
            table_name: DynamoDB table name
        """
        self.autoscaling_targets[table_key] = {}
        self.autoscaling_policies[table_key] = {}

        read_target = aws.appautoscaling.Target(
            f'{table_key}-read-target',
            max_capacity=100,
            min_capacity=5,
            resource_id=table_name.apply(lambda name: f'table/{name}'),
            scalable_dimension='dynamodb:table:ReadCapacityUnits',
            service_namespace='dynamodb',
            opts=self.provider_manager.get_resource_options()
        )

        read_policy = aws.appautoscaling.Policy(
            f'{table_key}-read-policy',
            policy_type='TargetTrackingScaling',
            resource_id=read_target.resource_id,
            scalable_dimension=read_target.scalable_dimension,
            service_namespace=read_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBReadCapacityUtilization'
                ),
                target_value=self.config.dynamodb_target_utilization
            ),
            opts=self.provider_manager.get_resource_options()
        )

        write_target = aws.appautoscaling.Target(
            f'{table_key}-write-target',
            max_capacity=100,
            min_capacity=5,
            resource_id=table_name.apply(lambda name: f'table/{name}'),
            scalable_dimension='dynamodb:table:WriteCapacityUnits',
            service_namespace='dynamodb',
            opts=self.provider_manager.get_resource_options()
        )

        write_policy = aws.appautoscaling.Policy(
            f'{table_key}-write-policy',
            policy_type='TargetTrackingScaling',
            resource_id=write_target.resource_id,
            scalable_dimension=write_target.scalable_dimension,
            service_namespace=write_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBWriteCapacityUtilization'
                ),
                target_value=self.config.dynamodb_target_utilization
            ),
            opts=self.provider_manager.get_resource_options()
        )

        self.autoscaling_targets[table_key]['read'] = read_target
        self.autoscaling_targets[table_key]['write'] = write_target
        self.autoscaling_policies[table_key]['read'] = read_policy
        self.autoscaling_policies[table_key]['write'] = write_policy

    def get_table_name(self, table_key: str) -> Output[str]:
        """Get DynamoDB table name."""
        return self.tables[table_key].name

    def get_table_arn(self, table_key: str) -> Output[str]:
        """Get DynamoDB table ARN."""
        return self.tables[table_key].arn




```

## File: lib\infrastructure\iam.py

```py
"""
IAM module for managing roles and policies.

This module creates IAM roles with least-privilege policies,
scoping all permissions to specific resource ARNs.
"""

import json
from typing import List, Optional

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig


class IAMStack:
    """Manages IAM roles and policies with least-privilege access."""

    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the IAM stack.

        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager

    def create_lambda_role(
        self,
        function_name: str,
        log_group_arn: Optional[Output[str]] = None,
        dynamodb_table_arns: Optional[List[Output[str]]] = None,
        sqs_queue_arns: Optional[List[Output[str]]] = None,
        dlq_arn: Optional[Output[str]] = None,
        kms_key_arns: Optional[List[Output[str]]] = None,
        s3_bucket_arns: Optional[List[Output[str]]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create an IAM role for a Lambda function with scoped permissions.

        Args:
            function_name: Name of the Lambda function
            log_group_arn: CloudWatch Logs group ARN
            dynamodb_table_arns: List of DynamoDB table ARNs
            sqs_queue_arns: List of SQS queue ARNs
            dlq_arn: Dead letter queue ARN
            kms_key_arns: List of KMS key ARNs
            s3_bucket_arns: List of S3 bucket ARNs
            enable_xray: Whether to enable X-Ray tracing

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name(f'{function_name}-role')
        policy_name = self.config.get_resource_name(f'{function_name}-policy')

        assume_role_policy = json.dumps({
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {
                    'Service': 'lambda.amazonaws.com'
                },
                'Action': 'sts:AssumeRole'
            }]
        })

        role = aws.iam.Role(
            f'{function_name}-role',
            name=role_name,
            assume_role_policy=assume_role_policy,
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        policy_statements = []

        if log_group_arn:
            policy_statements.append(
                Output.all(log_group_arn).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogStream',
                        'logs:PutLogEvents'
                    ],
                    'Resource': [arns[0], f'{arns[0]}:*']
                })
            )

        if dynamodb_table_arns:
            policy_statements.append(
                Output.all(*dynamodb_table_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'dynamodb:GetItem',
                        'dynamodb:PutItem',
                        'dynamodb:UpdateItem',
                        'dynamodb:DeleteItem',
                        'dynamodb:Query',
                        'dynamodb:Scan'
                    ],
                    'Resource': [arn for arn in arns] + [f'{arn}/index/*' for arn in arns]
                })
            )

        if sqs_queue_arns:
            policy_statements.append(
                Output.all(*sqs_queue_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'sqs:SendMessage',
                        'sqs:GetQueueAttributes',
                        'sqs:ReceiveMessage',
                        'sqs:DeleteMessage',
                        'sqs:GetQueueUrl'
                    ],
                    'Resource': list(arns)
                })
            )

        if dlq_arn:
            policy_statements.append(
                Output.all(dlq_arn).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'sqs:SendMessage',
                        'sqs:GetQueueAttributes'
                    ],
                    'Resource': [arns[0]]
                })
            )

        if kms_key_arns:
            policy_statements.append(
                Output.all(*kms_key_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'kms:Decrypt',
                        'kms:Encrypt',
                        'kms:GenerateDataKey',
                        'kms:DescribeKey'
                    ],
                    'Resource': list(arns)
                })
            )

        if s3_bucket_arns:
            policy_statements.append(
                Output.all(*s3_bucket_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        's3:GetObject',
                        's3:PutObject',
                        's3:ListBucket'
                    ],
                    'Resource': [arn for arn in arns] + [f'{arn}/*' for arn in arns]
                })
            )

        if enable_xray:
            policy_statements.append({
                'Effect': 'Allow',
                'Action': [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords'
                ],
                'Resource': '*'
            })

        # Add CloudWatch PutMetricData permission for custom metrics
        policy_statements.append({
            'Effect': 'Allow',
            'Action': [
                'cloudwatch:PutMetricData'
            ],
            'Resource': '*'
        })

        if policy_statements:
            policy_document = Output.all(*policy_statements).apply(
                lambda statements: json.dumps({
                    'Version': '2012-10-17',
                    'Statement': statements
                })
            )

            policy = aws.iam.Policy(
                f'{function_name}-policy',
                name=policy_name,
                policy=policy_document,
                tags={
                    **self.config.get_common_tags(),
                    'Name': policy_name
                },
                opts=self.provider_manager.get_resource_options()
            )

            aws.iam.RolePolicyAttachment(
                f'{function_name}-policy-attachment',
                role=role.name,
                policy_arn=policy.arn,
                opts=self.provider_manager.get_resource_options()
            )

        return role

```

## File: lib\infrastructure\kms.py

```py
"""
KMS module for managing encryption keys.

This module creates and manages KMS keys for encrypting S3 buckets,
DynamoDB tables, SQS queues, and other AWS resources.
"""

import json
from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig


class KMSStack:
    """Manages KMS keys for encryption."""

    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the KMS stack.

        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.keys: Dict[str, aws.kms.Key] = {}
        self.aliases: Dict[str, aws.kms.Alias] = {}

        self._create_keys()

    def _create_keys(self):
        """Create KMS keys for different services."""
        key_configs = {
            's3': 'KMS key for S3 bucket encryption',
            'dynamodb': 'KMS key for DynamoDB table encryption',
            'sqs': 'KMS key for SQS queue encryption',
            'logs': 'KMS key for CloudWatch Logs encryption'
        }

        for key_name, description in key_configs.items():
            self._create_key(key_name, description)

    def _create_key(self, key_name: str, description: str):
        """
        Create a KMS key with alias.

        Args:
            key_name: Name identifier for the key
            description: Description of the key's purpose
        """
        resource_name = self.config.get_resource_name(f'kms-{key_name}')

        caller_identity = aws.get_caller_identity()

        policy = Output.all(caller_identity.account_id, self.config.primary_region).apply(
            lambda args: json.dumps({
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Sid': 'Enable IAM User Permissions',
                        'Effect': 'Allow',
                        'Principal': {
                            'AWS': f'arn:aws:iam::{args[0]}:root'
                        },
                        'Action': 'kms:*',
                        'Resource': '*'
                    },
                    {
                        'Sid': 'Allow services to use the key',
                        'Effect': 'Allow',
                        'Principal': {
                            'Service': [
                                's3.amazonaws.com',
                                'dynamodb.amazonaws.com',
                                'sqs.amazonaws.com',
                                'logs.amazonaws.com',
                                'lambda.amazonaws.com'
                            ]
                        },
                        'Action': [
                            'kms:Decrypt',
                            'kms:GenerateDataKey',
                            'kms:CreateGrant'
                        ],
                        'Resource': '*',
                        'Condition': {
                            'StringEquals': {
                                'kms:ViaService': [
                                    f's3.{args[1]}.amazonaws.com',
                                    f'dynamodb.{args[1]}.amazonaws.com',
                                    f'sqs.{args[1]}.amazonaws.com',
                                    f'logs.{args[1]}.amazonaws.com',
                                    f'lambda.{args[1]}.amazonaws.com'
                                ]
                            }
                        }
                    }
                ]
            })
        )

        key = aws.kms.Key(
            f'kms-{key_name}',
            description=f'{description} - {resource_name}',
            enable_key_rotation=True,
            policy=policy,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        alias = aws.kms.Alias(
            f'kms-alias-{key_name}',
            name=f'alias/{resource_name}',
            target_key_id=key.id,
            opts=self.provider_manager.get_resource_options()
        )

        self.keys[key_name] = key
        self.aliases[key_name] = alias

    def get_key_id(self, key_name: str) -> Output[str]:
        """Get KMS key ID."""
        return self.keys[key_name].id

    def get_key_arn(self, key_name: str) -> Output[str]:
        """Get KMS key ARN."""
        return self.keys[key_name].arn




```

## File: lib\infrastructure\lambda_functions.py

```py
"""
Lambda functions module.

This module creates Lambda functions with proper configuration including
DLQs, X-Ray tracing, layers, and event invoke configs.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .sqs import SQSStack


class LambdaStack:
    """Manages Lambda functions with proper configuration."""

    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack,
        kms_stack: KMSStack
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            dynamodb_stack: DynamoDBStack instance
            sqs_stack: SQSStack instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.sqs_stack = sqs_stack
        self.kms_stack = kms_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}

        self._create_functions()

    def _create_functions(self):
        """Create Lambda functions."""
        self._create_transaction_validator()
        self._create_notification_handler()
        self._create_analytics_processor()
        self._create_reporting_processor()

    def _create_transaction_validator(self):
        """Create transaction validator Lambda function."""
        function_name = 'transaction-validator'
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f'/aws/lambda/{resource_name}'

        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group.arn,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('transactions')],
            sqs_queue_arns=[
                self.sqs_stack.get_queue_arn('analytics'),
                self.sqs_stack.get_queue_arn('reporting')
            ],
            dlq_arn=self.sqs_stack.get_dlq_arn('transaction-validator-lambda'),
            kms_key_arns=[
                self.kms_stack.get_key_arn('dynamodb'),
                self.kms_stack.get_key_arn('sqs'),
                self.kms_stack.get_key_arn('logs')
            ],
            enable_xray=self.config.enable_xray_tracing
        )

        code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code',
            'transaction_validator.py'
        )

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='transaction_validator.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.transaction_validator_memory,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'TRANSACTIONS_TABLE': self.dynamodb_stack.get_table_name('transactions'),
                    'ANALYTICS_QUEUE_URL': self.sqs_stack.get_queue_url('analytics'),
                    'REPORTING_QUEUE_URL': self.sqs_stack.get_queue_url('reporting'),
                    'LOG_LEVEL': 'INFO'
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn('transaction-validator-lambda')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[log_group, role])
        )

        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-event-invoke-config',
            function_name=function.name,
            maximum_event_age_in_seconds=3600,
            maximum_retry_attempts=2,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=self.sqs_stack.get_dlq_arn('transaction-validator-lambda')
                )
            ),
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )

        self.functions[function_name] = function
        self.log_groups[function_name] = log_group

    def _create_notification_handler(self):
        """Create notification handler Lambda function."""
        function_name = 'notification-handler'
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f'/aws/lambda/{resource_name}'

        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group.arn,
            dlq_arn=self.sqs_stack.get_dlq_arn('notification-handler-lambda'),
            kms_key_arns=[
                self.kms_stack.get_key_arn('sqs'),
                self.kms_stack.get_key_arn('logs')
            ],
            enable_xray=self.config.enable_xray_tracing
        )

        code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code',
            'notification_handler.py'
        )

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='notification_handler.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.notification_handler_memory,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'SNS_TOPIC_ARN': 'arn:aws:sns:us-east-1:123456789012:notifications',
                    'LOG_LEVEL': 'INFO'
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn('notification-handler-lambda')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[log_group, role])
        )

        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-event-invoke-config',
            function_name=function.name,
            maximum_event_age_in_seconds=3600,
            maximum_retry_attempts=2,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=self.sqs_stack.get_dlq_arn('notification-handler-lambda')
                )
            ),
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )

        self.functions[function_name] = function
        self.log_groups[function_name] = log_group

    def _create_analytics_processor(self):
        """Create analytics processor Lambda function."""
        function_name = 'analytics-processor'
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f'/aws/lambda/{resource_name}'

        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group.arn,
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('analytics')],
            dlq_arn=self.sqs_stack.get_dlq_arn('analytics-processor-lambda'),
            kms_key_arns=[
                self.kms_stack.get_key_arn('sqs'),
                self.kms_stack.get_key_arn('logs')
            ],
            enable_xray=self.config.enable_xray_tracing
        )

        code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code',
            'analytics_processor.py'
        )

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='analytics_processor.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.notification_handler_memory,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'LOG_LEVEL': 'INFO'
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn('analytics-processor-lambda')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[log_group, role])
        )

        aws.lambda_.EventSourceMapping(
            f'{function_name}-event-source',
            event_source_arn=self.sqs_stack.get_queue_arn('analytics'),
            function_name=function.name,
            batch_size=10,
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )

        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-event-invoke-config',
            function_name=function.name,
            maximum_event_age_in_seconds=3600,
            maximum_retry_attempts=2,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=self.sqs_stack.get_dlq_arn('analytics-processor-lambda')
                )
            ),
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )

        self.functions[function_name] = function
        self.log_groups[function_name] = log_group

    def _create_reporting_processor(self):
        """Create reporting processor Lambda function."""
        function_name = 'reporting-processor'
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f'/aws/lambda/{resource_name}'

        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group.arn,
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('reporting')],
            dlq_arn=self.sqs_stack.get_dlq_arn('reporting-processor-lambda'),
            kms_key_arns=[
                self.kms_stack.get_key_arn('sqs'),
                self.kms_stack.get_key_arn('logs')
            ],
            enable_xray=self.config.enable_xray_tracing
        )

        code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code',
            'reporting_processor.py'
        )

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='reporting_processor.handler',
            role=role.arn,
            code=FileArchive(os.path.dirname(code_path)),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.notification_handler_memory,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'LOG_LEVEL': 'INFO'
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_dlq_arn('reporting-processor-lambda')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[log_group, role])
        )

        aws.lambda_.EventSourceMapping(
            f'{function_name}-event-source',
            event_source_arn=self.sqs_stack.get_queue_arn('reporting'),
            function_name=function.name,
            batch_size=10,
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )

        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-event-invoke-config',
            function_name=function.name,
            maximum_event_age_in_seconds=3600,
            maximum_retry_attempts=2,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=self.sqs_stack.get_dlq_arn('reporting-processor-lambda')
                )
            ),
            opts=pulumi.ResourceOptions(provider=self.provider_manager.get_provider(), depends_on=[function])
        )

        self.functions[function_name] = function
        self.log_groups[function_name] = log_group

    def get_function_name(self, function_key: str) -> Output[str]:
        """Get Lambda function name."""
        return self.functions[function_key].name

    def get_function_arn(self, function_key: str) -> Output[str]:
        """Get Lambda function ARN."""
        return self.functions[function_key].arn

    def get_function_invoke_arn(self, function_key: str) -> Output[str]:
        """Get Lambda function invoke ARN."""
        return self.functions[function_key].invoke_arn

    def get_log_group_name(self, function_key: str) -> Output[str]:
        """Get CloudWatch log group name."""
        return self.log_groups[function_key].name

    def get_log_group_arn(self, function_key: str) -> Output[str]:
        """Get CloudWatch log group ARN."""
        return self.log_groups[function_key].arn

```

## File: lib\infrastructure\monitoring.py

```py
"""
Monitoring module for CloudWatch logs, alarms, and dashboards.

This module creates CloudWatch monitoring resources for transaction processing.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .dynamodb import DynamoDBStack
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch monitoring resources.

    Creates SNS topics, alarms, and dashboards.
    """

    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack,
        dynamodb_stack: DynamoDBStack
    ):
        """
        Initialize the monitoring stack.

        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
            dynamodb_stack: DynamoDBStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.dynamodb_stack = dynamodb_stack
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        self.sns_topic = None
        self.dashboard = None

        self._create_sns_topic()
        self._create_lambda_alarms()
        self._create_dynamodb_alarms()
        self._create_dashboard()

    def _create_sns_topic(self):
        """Create SNS topic for alarm notifications."""
        topic_name = self.config.get_resource_name('alarms-topic')

        self.sns_topic = aws.sns.Topic(
            'alarm-topic',
            name=topic_name,
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name
            },
            opts=self.provider_manager.get_resource_options()
        )

    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions."""
        for function_name in ['transaction-validator', 'analytics-processor', 'reporting-processor', 'notification-handler']:
            function_resource_name = self.config.get_resource_name(function_name)

            error_rate_alarm = aws.cloudwatch.MetricAlarm(
                f'{function_name}-error-rate-alarm',
                name=self.config.get_resource_name(f'{function_name}-error-rate'),
                comparison_operator='GreaterThanThreshold',
                evaluation_periods=2,
                threshold=1.0,
                alarm_description=f'Error rate > 1% for {function_name}',
                alarm_actions=[self.sns_topic.arn],
                treat_missing_data='notBreaching',
                metric_queries=[
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id='errors',
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name='Errors',
                            namespace='AWS/Lambda',
                            period=300,
                            stat='Sum',
                            dimensions={
                                'FunctionName': function_resource_name
                            }
                        ),
                        return_data=False
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id='invocations',
                        metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                            metric_name='Invocations',
                            namespace='AWS/Lambda',
                            period=300,
                            stat='Sum',
                            dimensions={
                                'FunctionName': function_resource_name
                            }
                        ),
                        return_data=False
                    ),
                    aws.cloudwatch.MetricAlarmMetricQueryArgs(
                        id='error_rate',
                        expression='(errors / invocations) * 100',
                        label='Error Rate (%)',
                        return_data=True
                    )
                ],
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'{function_name}-error-rate')
                },
                opts=self.provider_manager.get_resource_options()
            )

            self.alarms[f'{function_name}-error-rate'] = error_rate_alarm

    def _create_dynamodb_alarms(self):
        """Create CloudWatch alarms for DynamoDB tables."""
        table_name = self.config.get_resource_name('transactions-table')

        read_throttle_alarm = aws.cloudwatch.MetricAlarm(
            'dynamodb-read-throttle-alarm',
            name=self.config.get_resource_name('dynamodb-read-throttles'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='ReadThrottleEvents',
            namespace='AWS/DynamoDB',
            period=300,
            statistic='Sum',
            threshold=10,
            alarm_description='DynamoDB read throttle events detected',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'TableName': table_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('dynamodb-read-throttles')
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.alarms['dynamodb-read-throttle'] = read_throttle_alarm

    def _create_dashboard(self):
        """Create CloudWatch dashboard."""
        dashboard_name = self.config.get_resource_name('dashboard')

        dashboard_body = Output.all(
            self.config.primary_region
        ).apply(lambda args: {
            'widgets': [
                {
                    'type': 'metric',
                    'x': 0,
                    'y': 0,
                    'width': 12,
                    'height': 6,
                    'properties': {
                        'metrics': [
                            ['AWS/Lambda', 'Invocations', {'stat': 'Sum'}],
                            ['AWS/Lambda', 'Errors', {'stat': 'Sum'}],
                            ['AWS/Lambda', 'Duration', {'stat': 'Average'}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[0],
                        'title': 'Lambda Metrics',
                        'period': 300
                    }
                },
                {
                    'type': 'metric',
                    'x': 12,
                    'y': 0,
                    'width': 12,
                    'height': 6,
                    'properties': {
                        'metrics': [
                            ['AWS/DynamoDB', 'ConsumedReadCapacityUnits', {'stat': 'Sum'}],
                            ['AWS/DynamoDB', 'ConsumedWriteCapacityUnits', {'stat': 'Sum'}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[0],
                        'title': 'DynamoDB Capacity',
                        'period': 300
                    }
                }
            ]
        })

        self.dashboard = aws.cloudwatch.Dashboard(
            'transaction-dashboard',
            dashboard_name=dashboard_name,
            dashboard_body=dashboard_body.apply(lambda body: pulumi.Output.json_dumps(body)),
            opts=self.provider_manager.get_resource_options()
        )

    def get_sns_topic_arn(self) -> Output[str]:
        """Get SNS topic ARN."""
        return self.sns_topic.arn if self.sns_topic else Output.from_input('')


```

## File: lib\infrastructure\s3.py

```py
"""
S3 module for managing storage buckets.

This module creates S3 buckets with KMS encryption, versioning,
lifecycle policies, and public access blocks.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .kms import KMSStack


class S3Stack:
    """Manages S3 buckets for log storage and exports."""

    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the S3 stack.

        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.buckets: Dict[str, aws.s3.Bucket] = {}

        self._create_buckets()

    def _create_buckets(self):
        """Create S3 buckets."""
        self._create_logs_bucket()

    def _create_logs_bucket(self):
        """Create S3 bucket for CloudWatch log exports with Glacier lifecycle."""
        bucket_name = self.config.get_normalized_resource_name('logs-bucket')

        bucket = aws.s3.Bucket(
            'logs-bucket',
            bucket=bucket_name,
            tags={
                **self.config.get_common_tags(),
                'Name': bucket_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketVersioning(
            'logs-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketServerSideEncryptionConfiguration(
            'logs-bucket-encryption',
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=self.kms_stack.get_key_arn('s3')
                ),
                bucket_key_enabled=True
            )],
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketPublicAccessBlock(
            'logs-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketLifecycleConfiguration(
            'logs-bucket-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='archive-old-logs-to-glacier',
                    status='Enabled',
                    filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                        prefix='logs/'
                    ),
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_glacier_transition_days,
                            storage_class='GLACIER'
                        )
                    ],
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_log_expiration_days
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options()
        )

        self.buckets['logs'] = bucket

    def get_bucket_name(self, bucket_type: str) -> Output[str]:
        """Get S3 bucket name."""
        return self.buckets[bucket_type].bucket

    def get_bucket_arn(self, bucket_type: str) -> Output[str]:
        """Get S3 bucket ARN."""
        return self.buckets[bucket_type].arn

    def get_bucket_id(self, bucket_type: str) -> Output[str]:
        """Get S3 bucket ID."""
        return self.buckets[bucket_type].id

```

## File: lib\infrastructure\sqs.py

```py
"""
SQS module for managing queues and dead-letter queues.

This module creates SQS queues for async processing with their own DLQs
and KMS encryption.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionConfig
from .kms import KMSStack


class SQSStack:
    """Manages SQS queues and dead-letter queues."""

    def __init__(
        self,
        config: TransactionConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the SQS stack.

        Args:
            config: TransactionConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.queues: Dict[str, aws.sqs.Queue] = {}
        self.dlqs: Dict[str, aws.sqs.Queue] = {}

        self._create_queues()

    def _create_queues(self):
        """Create SQS queues."""
        self._create_queue_with_dlq('analytics', 'Analytics processing queue')
        self._create_queue_with_dlq('reporting', 'Reporting processing queue')

        self._create_lambda_dlqs()

    def _create_queue_with_dlq(self, queue_name: str, description: str):
        """
        Create an SQS queue with its own DLQ.

        Args:
            queue_name: Name identifier for the queue
            description: Description of the queue's purpose
        """
        dlq_resource_name = self.config.get_resource_name(f'{queue_name}-dlq')
        queue_resource_name = self.config.get_resource_name(f'{queue_name}-queue')

        dlq = aws.sqs.Queue(
            f'{queue_name}-dlq',
            name=dlq_resource_name,
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_stack.get_key_id('sqs'),
            tags={
                **self.config.get_common_tags(),
                'Name': dlq_resource_name,
                'Description': f'DLQ for {description}'
            },
            opts=self.provider_manager.get_resource_options()
        )

        queue = aws.sqs.Queue(
            f'{queue_name}-queue',
            name=queue_resource_name,
            visibility_timeout_seconds=300,
            message_retention_seconds=86400,
            kms_master_key_id=self.kms_stack.get_key_id('sqs'),
            redrive_policy=dlq.arn.apply(
                lambda arn: f'{{"deadLetterTargetArn":"{arn}","maxReceiveCount":{self.config.dlq_max_receive_count}}}'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': queue_resource_name,
                'Description': description
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.queues[queue_name] = queue
        self.dlqs[f'{queue_name}-dlq'] = dlq

    def _create_lambda_dlqs(self):
        """Create DLQs for Lambda functions."""
        lambda_functions = [
            'transaction-validator',
            'notification-handler',
            'analytics-processor',
            'reporting-processor'
        ]

        for func_name in lambda_functions:
            dlq_resource_name = self.config.get_resource_name(f'{func_name}-dlq')

            dlq = aws.sqs.Queue(
                f'{func_name}-lambda-dlq',
                name=dlq_resource_name,
                message_retention_seconds=1209600,
                kms_master_key_id=self.kms_stack.get_key_id('sqs'),
                tags={
                    **self.config.get_common_tags(),
                    'Name': dlq_resource_name,
                    'Description': f'DLQ for {func_name} Lambda function'
                },
                opts=self.provider_manager.get_resource_options()
            )

            self.dlqs[f'{func_name}-lambda'] = dlq

    def get_queue_url(self, queue_name: str) -> Output[str]:
        """Get SQS queue URL."""
        return self.queues[queue_name].url

    def get_queue_arn(self, queue_name: str) -> Output[str]:
        """Get SQS queue ARN."""
        return self.queues[queue_name].arn

    def get_dlq_url(self, dlq_name: str) -> Output[str]:
        """Get DLQ URL."""
        return self.dlqs[dlq_name].url

    def get_dlq_arn(self, dlq_name: str) -> Output[str]:
        """Get DLQ ARN."""
        return self.dlqs[dlq_name].arn

```
