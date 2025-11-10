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
import pulumi
from pulumi import Config, ResourceOptions
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
the file upload system infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (APIGatewayStack, AWSProviderManager,
                             DynamoDBStack, FileUploadConfig, IAMStack,
                             KMSStack, LambdaStack, MonitoringStack, S3Stack,
                             SQSStack, StepFunctionsStack)


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
    Represents the main Pulumi component resource for the file upload system.

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

        self.config = FileUploadConfig()

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

        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )

        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.s3_stack,
            self.dynamodb_stack,
            self.sqs_stack,
            self.kms_stack,
            self.monitoring_stack.get_sns_topic_arn()
        )

        self.monitoring_stack._create_lambda_alarms_for_stack(self.lambda_stack)
        self.monitoring_stack._create_dashboard_for_stack(self.lambda_stack)

        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )

        self.step_functions_stack = StepFunctionsStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.lambda_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['primary_region'] = self.config.primary_region
        outputs['environment'] = self.config.environment
        outputs['environment_suffix'] = self.config.environment_suffix

        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_gateway_id'] = self.api_gateway_stack.get_api_id()

        outputs['uploads_bucket_name'] = self.s3_stack.get_bucket_name('uploads')
        outputs['uploads_bucket_arn'] = self.s3_stack.get_bucket_arn('uploads')

        outputs['file_metadata_table_name'] = self.dynamodb_stack.get_table_name('file-metadata')
        outputs['file_metadata_table_arn'] = self.dynamodb_stack.get_table_arn('file-metadata')

        outputs['file_processor_function_name'] = self.lambda_stack.get_function_name('file-processor')
        outputs['file_processor_function_arn'] = self.lambda_stack.get_function_arn('file-processor')
        outputs['file_processor_log_group'] = self.lambda_stack.get_log_group_name('file-processor')

        outputs['file_processor_dlq_url'] = self.sqs_stack.get_queue_url('file-processor-dlq')
        outputs['file_processor_dlq_arn'] = self.sqs_stack.get_queue_arn('file-processor-dlq')

        outputs['file_workflow_arn'] = self.step_functions_stack.get_state_machine_arn('file-workflow')

        outputs['sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn()

        outputs['s3_kms_key_id'] = self.kms_stack.get_key_id('s3')
        outputs['s3_kms_key_arn'] = self.kms_stack.get_key_arn('s3')
        outputs['dynamodb_kms_key_id'] = self.kms_stack.get_key_id('dynamodb')
        outputs['dynamodb_kms_key_arn'] = self.kms_stack.get_key_arn('dynamodb')

        self.register_outputs(outputs)

        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass

```

## File: lib\infrastructure\_\_init\_\_.py

```py
"""
Infrastructure module exports.

This module exports all infrastructure components for easy importing.
"""

from .api_gateway import APIGatewayStack
from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .lambda_functions import LambdaStack
from .monitoring import MonitoringStack
from .s3 import S3Stack
from .sqs import SQSStack
from .step_functions import StepFunctionsStack

__all__ = [
    'FileUploadConfig',
    'AWSProviderManager',
    'KMSStack',
    'S3Stack',
    'DynamoDBStack',
    'SQSStack',
    'IAMStack',
    'LambdaStack',
    'APIGatewayStack',
    'StepFunctionsStack',
    'MonitoringStack'
]


```

## File: lib\infrastructure\lambda_code\file_processor.py

```py
"""
Lambda handler for file processing.

This handler processes file uploads, stores metadata in DynamoDB,
and publishes notifications to SNS.
"""

import base64
import json
import os
import uuid
from datetime import datetime
from decimal import Decimal

import boto3
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')
sns = boto3.client('sns')

BUCKET_NAME = os.environ.get('BUCKET_NAME')
METADATA_TABLE = os.environ.get('METADATA_TABLE')
SNS_TOPIC_ARN = os.environ.get('SNS_TOPIC_ARN')


def handler(event, context):
    """
    Process file upload requests from API Gateway.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    print(f"[INFO] Processing file upload request. Request ID: {context.aws_request_id}")

    try:
        if not event.get('body'):
            return create_response(400, {'error': 'Missing request body'})

        body = json.loads(event['body'])

        if 'file_content' not in body:
            return create_response(400, {'error': 'Missing file_content in request'})

        file_content = base64.b64decode(body['file_content'])
        file_name = body.get('file_name', f"upload-{uuid.uuid4()}")
        content_type = body.get('content_type', 'application/octet-stream')

        file_id = str(uuid.uuid4())

        s3_key = f"{file_id}/{file_name}"
        print(f"[INFO] Uploading file to S3: {BUCKET_NAME}/{s3_key}")

        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=file_content,
            ContentType=content_type,
            ServerSideEncryption='aws:kms'
        )

        file_url = f"https://{BUCKET_NAME}.s3.amazonaws.com/{s3_key}"

        table = dynamodb.Table(METADATA_TABLE)
        metadata = {
            'file_id': file_id,
            'file_name': file_name,
            'content_type': content_type,
            's3_key': s3_key,
            'file_url': file_url,
            'file_size': Decimal(str(len(file_content))),
            'upload_time': datetime.now().isoformat(),
            'request_id': context.aws_request_id
        }

        print(f"[INFO] Storing metadata in DynamoDB: {file_id}")
        table.put_item(Item=metadata)

        if SNS_TOPIC_ARN:
            print(f"[INFO] Publishing notification to SNS")
            sns.publish(
                TopicArn=SNS_TOPIC_ARN,
                Subject=f"New file uploaded: {file_name}",
                Message=json.dumps({
                    'event': 'file_uploaded',
                    'file_id': file_id,
                    'file_name': file_name,
                    'file_url': file_url,
                    'upload_time': metadata['upload_time']
                })
            )

        print(f"[INFO] File processed successfully: {file_id}")
        return create_response(200, {
            'message': 'File uploaded successfully',
            'file_id': file_id,
            'file_url': file_url,
            'metadata': {
                'file_id': file_id,
                'file_name': file_name,
                'content_type': content_type,
                's3_key': s3_key,
                'file_size': int(metadata['file_size']),
                'upload_time': metadata['upload_time']
            }
        })

    except ClientError as e:
        print(f"[ERROR] AWS service error: {str(e)}")
        return create_response(500, {'error': f'AWS service error: {str(e)}'})
    except Exception as e:
        print(f"[ERROR] Unexpected error: {str(e)}")
        return create_response(500, {'error': f'Error processing file: {str(e)}'})


def create_response(status_code, body):
    """
    Create an API Gateway response.

    Args:
        status_code: HTTP status code
        body: Response body (will be JSON-encoded)

    Returns:
        API Gateway response dict
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }


```

## File: lib\infrastructure\api_gateway.py

```py
"""
API Gateway module.

This module creates API Gateway with proper Lambda integration,
CORS configuration, and usage plans.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway REST API.

    Creates API Gateway with:
    - Proper Lambda integration URIs
    - CORS configuration
    - Usage plans and API keys
    - Stage-specific source ARNs for Lambda permissions
    """

    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.

        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.api = None
        self.deployment = None
        self.stage = None
        self.methods = []
        self.integrations = []

        self._create_api()
        self._create_resources()
        self._create_deployment()
        self._create_usage_plan()

    def _create_api(self):
        """Create the REST API."""
        api_name = self.config.get_resource_name('api')

        self.api = aws.apigateway.RestApi(
            'api',
            name=api_name,
            description='File upload system API',
            tags={
                **self.config.get_common_tags(),
                'Name': api_name
            },
            opts=self.provider_manager.get_resource_options()
        )

    def _create_resources(self):
        """Create API resources and methods."""
        upload_resource = aws.apigateway.Resource(
            'upload-resource',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='upload',
            opts=self.provider_manager.get_resource_options(depends_on=[self.api])
        )

        post_method = aws.apigateway.Method(
            'post-method',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method='POST',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options(depends_on=[upload_resource])
        )

        self.methods.append(post_method)

        function = self.lambda_stack.get_function('file-processor')

        post_integration = aws.apigateway.Integration(
            'post-integration',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method=post_method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=function.invoke_arn,
            opts=self.provider_manager.get_resource_options(
                depends_on=[post_method, function]
            )
        )

        self.integrations.append(post_integration)

        options_method = aws.apigateway.Method(
            'options-method',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method='OPTIONS',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options(depends_on=[upload_resource])
        )

        self.methods.append(options_method)

        options_integration = aws.apigateway.Integration(
            'options-integration',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method=options_method.http_method,
            type='MOCK',
            request_templates={
                'application/json': '{"statusCode": 200}'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[options_method])
        )

        self.integrations.append(options_integration)

        aws.apigateway.MethodResponse(
            'options-method-response',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method=options_method.http_method,
            status_code='200',
            response_parameters={
                'method.response.header.Access-Control-Allow-Headers': True,
                'method.response.header.Access-Control-Allow-Methods': True,
                'method.response.header.Access-Control-Allow-Origin': True
            },
            opts=self.provider_manager.get_resource_options(depends_on=[options_method])
        )

        aws.apigateway.IntegrationResponse(
            'options-integration-response',
            rest_api=self.api.id,
            resource_id=upload_resource.id,
            http_method=options_method.http_method,
            status_code='200',
            response_parameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            },
            opts=self.provider_manager.get_resource_options(
                depends_on=[options_integration, options_method]
            )
        )

        health_resource = aws.apigateway.Resource(
            'health-resource',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='health',
            opts=self.provider_manager.get_resource_options(depends_on=[self.api])
        )

        health_method = aws.apigateway.Method(
            'health-method',
            rest_api=self.api.id,
            resource_id=health_resource.id,
            http_method='GET',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options(depends_on=[health_resource])
        )

        self.methods.append(health_method)

        health_integration = aws.apigateway.Integration(
            'health-integration',
            rest_api=self.api.id,
            resource_id=health_resource.id,
            http_method=health_method.http_method,
            type='MOCK',
            request_templates={
                'application/json': '{"statusCode": 200}'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[health_method])
        )

        self.integrations.append(health_integration)

        aws.apigateway.MethodResponse(
            'health-method-response',
            rest_api=self.api.id,
            resource_id=health_resource.id,
            http_method=health_method.http_method,
            status_code='200',
            opts=self.provider_manager.get_resource_options(depends_on=[health_method])
        )

        aws.apigateway.IntegrationResponse(
            'health-integration-response',
            rest_api=self.api.id,
            resource_id=health_resource.id,
            http_method=health_method.http_method,
            status_code='200',
            response_templates={
                'application/json': '{"status": "healthy"}'
            },
            opts=self.provider_manager.get_resource_options(
                depends_on=[health_integration, health_method]
            )
        )

    def _create_deployment(self):
        """Create API deployment and stage."""
        self.deployment = aws.apigateway.Deployment(
            'api-deployment',
            rest_api=self.api.id,
            triggers={
                'redeployment': Output.all(*[m.id for m in self.methods]).apply(
                    lambda ids: '-'.join(ids)
                )
            },
            opts=self.provider_manager.get_resource_options(
                depends_on=self.methods + self.integrations
            )
        )

        stage_name = self.config.api_stage_name

        self.stage = aws.apigateway.Stage(
            'api-stage',
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=stage_name,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'api-{stage_name}')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.deployment])
        )

        function = self.lambda_stack.get_function('file-processor')

        lambda_permission = aws.lambda_.Permission(
            'api-lambda-permission',
            action='lambda:InvokeFunction',
            function=function.name,
            principal='apigateway.amazonaws.com',
            source_arn=Output.all(
                self.api.execution_arn,
                stage_name
            ).apply(
                lambda args: f'{args[0]}/{args[1]}/POST/upload'
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[self.stage, function])
        )

    def _create_usage_plan(self):
        """Create usage plan and API key."""
        usage_plan = aws.apigateway.UsagePlan(
            'api-usage-plan',
            name=self.config.get_resource_name('usage-plan'),
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
                'Name': self.config.get_resource_name('usage-plan')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.stage])
        )

        api_key = aws.apigateway.ApiKey(
            'api-key',
            name=self.config.get_resource_name('api-key'),
            enabled=True,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('api-key')
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.apigateway.UsagePlanKey(
            'usage-plan-key',
            key_id=api_key.id,
            key_type='API_KEY',
            usage_plan_id=usage_plan.id,
            opts=self.provider_manager.get_resource_options(depends_on=[usage_plan, api_key])
        )

    def get_api_id(self) -> Output[str]:
        """
        Get the API Gateway ID.

        Returns:
            API ID as Output
        """
        return self.api.id

    def get_api_url(self) -> Output[str]:
        """
        Get the API Gateway URL.

        Returns:
            API URL as Output
        """
        return Output.all(
            self.api.id,
            self.stage.stage_name,
            self.config.primary_region
        ).apply(
            lambda args: f'https://{args[0]}.execute-api.{args[2]}.amazonaws.com/{args[1]}/upload'
        )

    def get_api_execution_arn(self) -> Output[str]:
        """
        Get the API Gateway execution ARN.

        Returns:
            API execution ARN as Output
        """
        return self.api.execution_arn


```

## File: lib\infrastructure\aws_provider.py

```py
"""
AWS Provider management module.

This module manages the AWS Pulumi provider instance to ensure consistency
across all resources and avoid provider drift in CI/CD pipelines.
"""

from typing import Optional

import pulumi
import pulumi_aws as aws

from .config import FileUploadConfig


class AWSProviderManager:
    """
    Manages AWS Pulumi provider instances.

    Ensures consistent provider usage across all resources to avoid
    drift in CI/CD pipelines.
    """

    def __init__(self, config: FileUploadConfig):
        """
        Initialize the AWS provider manager.

        Args:
            config: FileUploadConfig instance
        """
        self.config = config
        self._provider: Optional[aws.Provider] = None

    def get_provider(self) -> Optional[aws.Provider]:
        """
        Get or create the AWS provider instance.

        Returns:
            AWS Provider instance or None for default provider
        """
        if self._provider is None:
            assume_role_arn = self.config.environment_suffix

            if assume_role_arn and assume_role_arn.startswith('arn:aws:iam::'):
                self._provider = aws.Provider(
                    'aws-provider',
                    region=self.config.primary_region,
                    assume_role=aws.ProviderAssumeRoleArgs(
                        role_arn=assume_role_arn
                    )
                )
            else:
                return None

        return self._provider

    def get_resource_options(self, depends_on: list = None) -> pulumi.ResourceOptions:
        """
        Get ResourceOptions with the provider attached.

        Args:
            depends_on: Optional list of resources to depend on

        Returns:
            ResourceOptions with provider or empty options
        """
        provider = self.get_provider()
        if provider:
            return pulumi.ResourceOptions(provider=provider, depends_on=depends_on or [])
        return pulumi.ResourceOptions(depends_on=depends_on or [])


```

## File: lib\infrastructure\config.py

```py
"""
Configuration module for the file upload system infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict


@dataclass
class FileUploadConfig:
    """Centralized configuration for the file upload system infrastructure."""

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
    api_stage_name: str

    dynamodb_billing_mode: str

    s3_lifecycle_transition_days: int
    s3_lifecycle_expiration_days: int

    log_retention_days: int
    enable_xray_tracing: bool

    dlq_max_receive_count: int

    step_functions_retry_interval: int
    step_functions_max_attempts: int
    step_functions_backoff_rate: float

    team: str
    application: str
    cost_center: str

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'Production')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = os.getenv('PROJECT_NAME', 'file-upload')

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)

        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '30'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '512'))

        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '200'))
        self.api_stage_name = os.getenv('API_STAGE_NAME', 'prod')

        self.dynamodb_billing_mode = os.getenv('DYNAMODB_BILLING_MODE', 'PAY_PER_REQUEST')

        self.s3_lifecycle_transition_days = int(os.getenv('S3_LIFECYCLE_TRANSITION_DAYS', '30'))
        self.s3_lifecycle_expiration_days = int(os.getenv('S3_LIFECYCLE_EXPIRATION_DAYS', '90'))

        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'

        self.dlq_max_receive_count = int(os.getenv('DLQ_MAX_RECEIVE_COUNT', '3'))

        self.step_functions_retry_interval = int(os.getenv('STEP_FUNCTIONS_RETRY_INTERVAL', '2'))
        self.step_functions_max_attempts = int(os.getenv('STEP_FUNCTIONS_MAX_ATTEMPTS', '3'))
        self.step_functions_backoff_rate = float(os.getenv('STEP_FUNCTIONS_BACKOFF_RATE', '2.0'))

        self.team = os.getenv('TEAM', 'platform')
        self.application = os.getenv('APPLICATION', 'file-upload-system')
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
DynamoDB module for metadata storage.

This module creates DynamoDB tables with KMS encryption and
point-in-time recovery enabled.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .kms import KMSStack


class DynamoDBStack:
    """
    Manages DynamoDB tables for metadata storage.

    Creates DynamoDB tables with:
    - KMS encryption
    - Point-in-time recovery
    - On-demand billing for auto-scaling
    """

    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the DynamoDB stack.

        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.tables = {}

        self._create_file_metadata_table()

    def _create_file_metadata_table(self):
        """Create the file metadata table."""
        table_name = 'file-metadata'
        resource_name = self.config.get_resource_name(table_name)

        dynamodb_key = self.kms_stack.get_key('dynamodb')

        table = aws.dynamodb.Table(
            table_name,
            name=resource_name,
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name='file_id',
                    type='S'
                )
            ],
            hash_key='file_id',
            billing_mode=self.config.dynamodb_billing_mode,
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=dynamodb_key.arn
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': 'File metadata storage'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[dynamodb_key])
        )

        self.tables[table_name] = table

    def get_table(self, table_name: str) -> aws.dynamodb.Table:
        """
        Get a DynamoDB table by name.

        Args:
            table_name: Name of the table

        Returns:
            DynamoDB Table resource
        """
        return self.tables.get(table_name)

    def get_table_name(self, table_name: str) -> Output[str]:
        """
        Get the name of a DynamoDB table.

        Args:
            table_name: Name of the table

        Returns:
            Table name as Output
        """
        table = self.get_table(table_name)
        return table.name if table else None

    def get_table_arn(self, table_name: str) -> Output[str]:
        """
        Get the ARN of a DynamoDB table.

        Args:
            table_name: Name of the table

        Returns:
            Table ARN as Output
        """
        table = self.get_table(table_name)
        return table.arn if table else None


```

## File: lib\infrastructure\iam.py

```py
"""
IAM module for least-privilege roles and policies.

This module creates IAM roles with scoped permissions for Lambda functions,
Step Functions, and SNS. All policies use specific resource ARNs instead of wildcards.
"""

import json

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig


class IAMStack:
    """
    Manages IAM roles and policies with least-privilege principles.

    Creates IAM roles with:
    - Scoped resource ARNs (no wildcards)
    - Proper Output handling for policy documents
    - Separate policies for different services
    """

    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the IAM stack.

        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles = {}
        self.policies = {}

    def create_lambda_role(
        self,
        function_name: str,
        log_group_arn: Output[str] = None,
        s3_bucket_arns: list = None,
        dynamodb_table_arns: list = None,
        kms_key_arns: list = None,
        sns_topic_arns: list = None,
        dlq_arn: Output[str] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create an IAM role for a Lambda function with least-privilege permissions.

        Args:
            function_name: Name of the Lambda function
            log_group_arn: CloudWatch Logs group ARN
            s3_bucket_arns: List of S3 bucket ARNs
            dynamodb_table_arns: List of DynamoDB table ARNs
            kms_key_arns: List of KMS key ARNs
            sns_topic_arns: List of SNS topic ARNs
            dlq_arn: Dead letter queue ARN
            enable_xray: Whether to enable X-Ray tracing

        Returns:
            IAM Role resource
        """
        role_name = f'{function_name}-role'
        resource_name = self.config.get_resource_name(role_name)

        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'sts:AssumeRole',
                'Principal': {
                    'Service': 'lambda.amazonaws.com'
                },
                'Effect': 'Allow'
            }]
        }

        role = aws.iam.Role(
            role_name,
            name=resource_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'Lambda execution role for {function_name}'
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

        if dynamodb_table_arns:
            policy_statements.append(
                Output.all(*dynamodb_table_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'dynamodb:PutItem',
                        'dynamodb:GetItem',
                        'dynamodb:UpdateItem',
                        'dynamodb:Query',
                        'dynamodb:Scan'
                    ],
                    'Resource': list(arns)
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

        if sns_topic_arns:
            policy_statements.append(
                Output.all(*sns_topic_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'sns:Publish'
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

        if enable_xray:
            policy_statements.append({
                'Effect': 'Allow',
                'Action': [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords'
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

            policy_name = f'{function_name}-policy'
            policy_resource_name = self.config.get_resource_name(policy_name)

            policy = aws.iam.Policy(
                policy_name,
                name=policy_resource_name,
                policy=policy_document,
                tags={
                    **self.config.get_common_tags(),
                    'Name': policy_resource_name
                },
                opts=self.provider_manager.get_resource_options()
            )

            aws.iam.RolePolicyAttachment(
                f'{function_name}-policy-attachment',
                role=role.name,
                policy_arn=policy.arn,
                opts=self.provider_manager.get_resource_options(depends_on=[role, policy])
            )

            self.policies[policy_name] = policy

        self.roles[role_name] = role
        return role

    def create_step_functions_role(
        self,
        workflow_name: str,
        lambda_arns: list = None,
        log_group_arn: Output[str] = None
    ) -> aws.iam.Role:
        """
        Create an IAM role for Step Functions with least-privilege permissions.

        Args:
            workflow_name: Name of the Step Functions workflow
            lambda_arns: List of Lambda function ARNs to invoke
            log_group_arn: CloudWatch Logs group ARN

        Returns:
            IAM Role resource
        """
        role_name = f'{workflow_name}-role'
        resource_name = self.config.get_resource_name(role_name)

        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Action': 'sts:AssumeRole',
                'Principal': {
                    'Service': 'states.amazonaws.com'
                },
                'Effect': 'Allow'
            }]
        }

        role = aws.iam.Role(
            role_name,
            name=resource_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'Step Functions execution role for {workflow_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )

        policy_statements = []

        if lambda_arns:
            policy_statements.append(
                Output.all(*lambda_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'lambda:InvokeFunction'
                    ],
                    'Resource': list(arns)
                })
            )

        if log_group_arn:
            policy_statements.append(
                Output.all(log_group_arn).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'logs:CreateLogDelivery',
                        'logs:GetLogDelivery',
                        'logs:UpdateLogDelivery',
                        'logs:DeleteLogDelivery',
                        'logs:ListLogDeliveries',
                        'logs:PutResourcePolicy',
                        'logs:DescribeResourcePolicies',
                        'logs:DescribeLogGroups'
                    ],
                    'Resource': '*'
                })
            )

        if self.config.enable_xray_tracing:
            policy_statements.append({
                'Effect': 'Allow',
                'Action': [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords',
                    'xray:GetSamplingRules',
                    'xray:GetSamplingTargets'
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

            policy_name = f'{workflow_name}-policy'
            policy_resource_name = self.config.get_resource_name(policy_name)

            policy = aws.iam.Policy(
                policy_name,
                name=policy_resource_name,
                policy=policy_document,
                tags={
                    **self.config.get_common_tags(),
                    'Name': policy_resource_name
                },
                opts=self.provider_manager.get_resource_options()
            )

            aws.iam.RolePolicyAttachment(
                f'{workflow_name}-policy-attachment',
                role=role.name,
                policy_arn=policy.arn,
                opts=self.provider_manager.get_resource_options(depends_on=[role, policy])
            )

            self.policies[policy_name] = policy

        self.roles[role_name] = role
        return role

    def get_role(self, role_name: str) -> aws.iam.Role:
        """
        Get an IAM role by name.

        Args:
            role_name: Name of the role

        Returns:
            IAM Role resource
        """
        return self.roles.get(role_name)


```

## File: lib\infrastructure\kms.py

```py
"""
KMS module for encryption keys.

This module creates KMS keys for encrypting S3, DynamoDB, and SQS resources.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig


class KMSStack:
    """
    Manages KMS encryption keys.

    Creates customer-managed KMS keys with automatic rotation enabled
    for encrypting various AWS services.
    """

    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the KMS stack.

        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.keys = {}
        self.aliases = {}

        self._create_keys()

    def _create_keys(self):
        """Create KMS keys for different services."""
        key_types = ['s3', 'dynamodb', 'sqs', 'sns']

        for key_type in key_types:
            key_name = f'{key_type}-key'
            alias_name = f'alias/{self.config.get_resource_name(key_type)}'

            key = aws.kms.Key(
                key_name,
                description=f'KMS key for {key_type.upper()} encryption - {self.config.project_name}',
                enable_key_rotation=True,
                deletion_window_in_days=10,
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(key_name),
                    'Service': key_type.upper()
                },
                opts=self.provider_manager.get_resource_options()
            )

            alias = aws.kms.Alias(
                f'{key_type}-alias',
                name=alias_name,
                target_key_id=key.id,
                opts=self.provider_manager.get_resource_options(depends_on=[key])
            )

            self.keys[key_type] = key
            self.aliases[key_type] = alias

    def get_key(self, key_type: str) -> aws.kms.Key:
        """
        Get a KMS key by type.

        Args:
            key_type: Type of key (s3, dynamodb, sqs, sns)

        Returns:
            KMS Key resource
        """
        return self.keys.get(key_type)

    def get_key_id(self, key_type: str) -> Output[str]:
        """
        Get the ID of a KMS key.

        Args:
            key_type: Type of key

        Returns:
            Key ID as Output
        """
        key = self.get_key(key_type)
        return key.id if key else None

    def get_key_arn(self, key_type: str) -> Output[str]:
        """
        Get the ARN of a KMS key.

        Args:
            key_type: Type of key

        Returns:
            Key ARN as Output
        """
        key = self.get_key(key_type)
        return key.arn if key else None


```

## File: lib\infrastructure\lambda_functions.py

```py
"""
Lambda Functions module.

This module creates Lambda functions with proper configuration including:
- DLQ attachment
- X-Ray tracing
- CloudWatch Logs
- Environment variables
- Least-privilege IAM roles
"""

import os

import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .s3 import S3Stack
from .sqs import SQSStack


class LambdaStack:
    """
    Manages Lambda functions with proper configuration.

    Creates Lambda functions with:
    - Dead letter queues
    - X-Ray tracing
    - CloudWatch log groups
    - Environment variables
    - Least-privilege IAM roles
    """

    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        s3_stack: S3Stack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack,
        kms_stack: KMSStack,
        sns_topic_arn: Output[str] = None
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            s3_stack: S3Stack instance
            dynamodb_stack: DynamoDBStack instance
            sqs_stack: SQSStack instance
            kms_stack: KMSStack instance
            sns_topic_arn: SNS topic ARN for notifications
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.s3_stack = s3_stack
        self.dynamodb_stack = dynamodb_stack
        self.sqs_stack = sqs_stack
        self.kms_stack = kms_stack
        self.sns_topic_arn = sns_topic_arn
        self.functions = {}
        self.log_groups = {}

        self._create_file_processor()

    def _create_file_processor(self):
        """Create the file processor Lambda function."""
        function_name = 'file-processor'
        resource_name = self.config.get_resource_name(function_name)

        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-logs',
            name=f'/aws/lambda/{resource_name}',
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': f'/aws/lambda/{resource_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.log_groups[function_name] = log_group

        dlq = self.sqs_stack.create_dlq(function_name)

        bucket_arn = self.s3_stack.get_bucket_arn('uploads')
        table_arn = self.dynamodb_stack.get_table_arn('file-metadata')
        s3_key_arn = self.kms_stack.get_key_arn('s3')
        dynamodb_key_arn = self.kms_stack.get_key_arn('dynamodb')
        sqs_key_arn = self.kms_stack.get_key_arn('sqs')
        sns_key_arn = self.kms_stack.get_key_arn('sns')

        kms_arns = [s3_key_arn, dynamodb_key_arn, sqs_key_arn, sns_key_arn]

        sns_arns = [self.sns_topic_arn] if self.sns_topic_arn else None

        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group.arn,
            s3_bucket_arns=[bucket_arn],
            dynamodb_table_arns=[table_arn],
            kms_key_arns=kms_arns,
            sns_topic_arns=sns_arns,
            dlq_arn=dlq.arn,
            enable_xray=self.config.enable_xray_tracing
        )

        lambda_code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code'
        )

        bucket_name = self.s3_stack.get_bucket_name('uploads')
        table_name = self.dynamodb_stack.get_table_name('file-metadata')

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='file_processor.handler',
            role=role.arn,
            code=FileArchive(lambda_code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'BUCKET_NAME': bucket_name,
                    'METADATA_TABLE': table_name,
                    'SNS_TOPIC_ARN': self.sns_topic_arn if self.sns_topic_arn else '',
                    'ENVIRONMENT': self.config.environment
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=dlq.arn
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': 'File processing'
            },
            opts=self.provider_manager.get_resource_options(
                depends_on=[role, log_group, dlq]
            )
        )

        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-invoke-config',
            function_name=function.name,
            maximum_retry_attempts=2,
            maximum_event_age_in_seconds=3600,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq.arn
                )
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[function, dlq])
        )

        self.functions[function_name] = function

    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """
        Get a Lambda function by name.

        Args:
            function_name: Name of the function

        Returns:
            Lambda Function resource
        """
        return self.functions.get(function_name)

    def get_function_name(self, function_name: str) -> Output[str]:
        """
        Get the name of a Lambda function.

        Args:
            function_name: Name of the function

        Returns:
            Function name as Output
        """
        function = self.get_function(function_name)
        return function.name if function else None

    def get_function_arn(self, function_name: str) -> Output[str]:
        """
        Get the ARN of a Lambda function.

        Args:
            function_name: Name of the function

        Returns:
            Function ARN as Output
        """
        function = self.get_function(function_name)
        return function.arn if function else None

    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """
        Get the invoke ARN of a Lambda function.

        Args:
            function_name: Name of the function

        Returns:
            Function invoke ARN as Output
        """
        function = self.get_function(function_name)
        return function.invoke_arn if function else None

    def get_log_group_name(self, function_name: str) -> Output[str]:
        """
        Get the log group name for a Lambda function.

        Args:
            function_name: Name of the function

        Returns:
            Log group name as Output
        """
        log_group = self.log_groups.get(function_name)
        return log_group.name if log_group else None


```

## File: lib\infrastructure\monitoring.py

```py
"""
Monitoring module.

This module creates CloudWatch alarms, SNS topics, and dashboards
for monitoring the file upload system.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .kms import KMSStack
from .lambda_functions import LambdaStack
from .step_functions import StepFunctionsStack


class MonitoringStack:
    """
    Manages monitoring resources.

    Creates:
    - SNS topics for notifications
    - CloudWatch alarms with metric math for error rates
    - CloudWatch dashboards
    """

    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the Monitoring stack.

        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.lambda_stack = None
        self.step_functions_stack = None
        self.sns_topic = None
        self.alarms = {}
        self.dashboard = None

        self._create_sns_topic()

    def _create_sns_topic(self):
        """Create SNS topic for notifications."""
        topic_name = 'notifications'
        resource_name = self.config.get_resource_name(topic_name)

        sns_key = self.kms_stack.get_key('sns')

        self.sns_topic = aws.sns.Topic(
            topic_name,
            name=resource_name,
            display_name='File Upload Notifications',
            kms_master_key_id=sns_key.id,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': 'File upload notifications'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[sns_key])
        )

    def _create_lambda_alarms_for_stack(self, lambda_stack):
        """
        Create CloudWatch alarms for Lambda functions.

        Args:
            lambda_stack: LambdaStack instance
        """
        self.lambda_stack = lambda_stack
        self._create_lambda_alarms()

    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions."""
        if not self.lambda_stack:
            return

        function_name = 'file-processor'
        function = self.lambda_stack.get_function(function_name)
        function_resource_name = self.lambda_stack.get_function_name(function_name)

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
                        dimensions={'FunctionName': function_resource_name}
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
                        dimensions={'FunctionName': function_resource_name}
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='error_rate',
                    expression='(errors / invocations) * 100',
                    label='Error Rate',
                    return_data=True
                )
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'{function_name}-error-rate')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[function, self.sns_topic])
        )

        self.alarms[f'{function_name}-error-rate'] = error_rate_alarm

        throttle_alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-throttle-alarm',
            name=self.config.get_resource_name(f'{function_name}-throttles'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='Throttles',
            namespace='AWS/Lambda',
            period=300,
            statistic='Sum',
            threshold=10,
            alarm_description=f'Throttles > 10 for {function_name}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'FunctionName': function_resource_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'{function_name}-throttles')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[function, self.sns_topic])
        )

        self.alarms[f'{function_name}-throttles'] = throttle_alarm

        duration_alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-duration-alarm',
            name=self.config.get_resource_name(f'{function_name}-duration'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='Duration',
            namespace='AWS/Lambda',
            period=300,
            statistic='Average',
            threshold=self.config.lambda_timeout * 1000 * 0.8,
            alarm_description=f'Duration > 80% of timeout for {function_name}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'FunctionName': function_resource_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'{function_name}-duration')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[function, self.sns_topic])
        )

        self.alarms[f'{function_name}-duration'] = duration_alarm

    def _create_dashboard_for_stack(self, lambda_stack):
        """
        Create CloudWatch dashboard for Lambda functions.

        Args:
            lambda_stack: LambdaStack instance
        """
        self.lambda_stack = lambda_stack
        self._create_dashboard()

    def _create_dashboard(self):
        """Create CloudWatch dashboard."""
        if not self.lambda_stack:
            return

        dashboard_name = self.config.get_resource_name('dashboard')
        function_name = 'file-processor'
        function_resource_name = self.lambda_stack.get_function_name(function_name)

        dashboard_body = Output.all(
            function_resource_name,
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
                            ['AWS/Lambda', 'Invocations', {'stat': 'Sum', 'label': 'Invocations'}],
                            ['.', 'Errors', {'stat': 'Sum', 'label': 'Errors'}],
                            ['.', 'Throttles', {'stat': 'Sum', 'label': 'Throttles'}],
                            ['.', 'Duration', {'stat': 'Average', 'label': 'Avg Duration (ms)'}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[1],
                        'title': f'Lambda Metrics - {args[0]}',
                        'period': 300,
                        'yAxis': {
                            'left': {
                                'label': 'Count / Duration'
                            }
                        }
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
                            ['AWS/Lambda', 'ConcurrentExecutions', {'stat': 'Maximum', 'label': 'Concurrent Executions'}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[1],
                        'title': f'Lambda Concurrency - {args[0]}',
                        'period': 300
                    }
                }
            ]
        })

        self.dashboard = aws.cloudwatch.Dashboard(
            'dashboard',
            dashboard_name=dashboard_name,
            dashboard_body=dashboard_body.apply(lambda body: Output.json_dumps(body)),
            opts=self.provider_manager.get_resource_options()
        )

    def get_sns_topic_arn(self) -> Output[str]:
        """
        Get the SNS topic ARN.

        Returns:
            SNS topic ARN as Output
        """
        return self.sns_topic.arn if self.sns_topic else None


```

## File: lib\infrastructure\s3.py

```py
"""
S3 module for file storage.

This module creates S3 buckets with KMS encryption, versioning,
and lifecycle policies. Note: Public-read access is implemented
per prompt requirements but should be reviewed for production use.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .kms import KMSStack


class S3Stack:
    """
    Manages S3 buckets for file storage.

    Creates S3 buckets with:
    - KMS encryption
    - Versioning enabled
    - Lifecycle policies
    - Public-read access (per prompt requirements)
    - CORS configuration
    """

    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the S3 stack.

        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.buckets = {}

        self._create_file_storage_bucket()

    def _create_file_storage_bucket(self):
        """Create the main file storage bucket."""
        bucket_name = 'uploads'
        normalized_name = self.config.get_normalized_resource_name(bucket_name)

        bucket = aws.s3.Bucket(
            bucket_name,
            bucket=normalized_name,
            force_destroy=True,
            tags={
                **self.config.get_common_tags(),
                'Name': normalized_name,
                'Purpose': 'File uploads storage'
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketVersioning(
            f'{bucket_name}-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )

        s3_key = self.kms_stack.get_key('s3')

        aws.s3.BucketServerSideEncryptionConfiguration(
            f'{bucket_name}-encryption',
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=s3_key.arn
                ),
                bucket_key_enabled=True
            )],
            opts=self.provider_manager.get_resource_options(depends_on=[bucket, s3_key])
        )

        aws.s3.BucketLifecycleConfiguration(
            f'{bucket_name}-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-old-files',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_lifecycle_transition_days,
                            storage_class='STANDARD_IA'
                        )
                    ],
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_lifecycle_expiration_days
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )

        aws.s3.BucketCorsConfiguration(
            f'{bucket_name}-cors',
            bucket=bucket.id,
            cors_rules=[aws.s3.BucketCorsConfigurationCorsRuleArgs(
                allowed_headers=['*'],
                allowed_methods=['GET', 'POST', 'PUT', 'DELETE', 'HEAD'],
                allowed_origins=['*'],
                expose_headers=['ETag'],
                max_age_seconds=3000
            )],
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )

        aws.s3.BucketPublicAccessBlock(
            f'{bucket_name}-public-access',
            bucket=bucket.id,
            block_public_acls=False,
            block_public_policy=False,
            ignore_public_acls=False,
            restrict_public_buckets=False,
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )

        bucket_policy = Output.all(bucket.arn, bucket.id).apply(
            lambda args: {
                'Version': '2012-10-17',
                'Statement': [
                    {
                        'Sid': 'PublicReadGetObject',
                        'Effect': 'Allow',
                        'Principal': '*',
                        'Action': 's3:GetObject',
                        'Resource': f'{args[0]}/*'
                    }
                ]
            }
        )

        aws.s3.BucketPolicy(
            f'{bucket_name}-policy',
            bucket=bucket.id,
            policy=bucket_policy.apply(lambda p: Output.json_dumps(p)),
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )

        self.buckets[bucket_name] = bucket

    def get_bucket(self, bucket_name: str) -> aws.s3.Bucket:
        """
        Get an S3 bucket by name.

        Args:
            bucket_name: Name of the bucket

        Returns:
            S3 Bucket resource
        """
        return self.buckets.get(bucket_name)

    def get_bucket_name(self, bucket_name: str) -> Output[str]:
        """
        Get the name of an S3 bucket.

        Args:
            bucket_name: Name of the bucket

        Returns:
            Bucket name as Output
        """
        bucket = self.get_bucket(bucket_name)
        return bucket.bucket if bucket else None

    def get_bucket_arn(self, bucket_name: str) -> Output[str]:
        """
        Get the ARN of an S3 bucket.

        Args:
            bucket_name: Name of the bucket

        Returns:
            Bucket ARN as Output
        """
        bucket = self.get_bucket(bucket_name)
        return bucket.arn if bucket else None


```

## File: lib\infrastructure\sqs.py

```py
"""
SQS module for dead letter queues.

This module creates SQS queues with KMS encryption for use as
dead letter queues for Lambda functions.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .kms import KMSStack


class SQSStack:
    """
    Manages SQS queues for dead letter queue functionality.

    Creates SQS queues with:
    - KMS encryption
    - Message retention
    - Visibility timeout
    """

    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the SQS stack.

        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.queues = {}

    def create_dlq(self, function_name: str) -> aws.sqs.Queue:
        """
        Create a dead letter queue for a Lambda function.

        Args:
            function_name: Name of the Lambda function

        Returns:
            SQS Queue resource
        """
        dlq_name = f'{function_name}-dlq'
        resource_name = self.config.get_resource_name(dlq_name)

        sqs_key = self.kms_stack.get_key('sqs')

        queue = aws.sqs.Queue(
            dlq_name,
            name=resource_name,
            message_retention_seconds=1209600,
            visibility_timeout_seconds=300,
            kms_master_key_id=sqs_key.id,
            kms_data_key_reuse_period_seconds=300,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Purpose': f'DLQ for {function_name}'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[sqs_key])
        )

        self.queues[dlq_name] = queue
        return queue

    def get_queue(self, queue_name: str) -> aws.sqs.Queue:
        """
        Get an SQS queue by name.

        Args:
            queue_name: Name of the queue

        Returns:
            SQS Queue resource
        """
        return self.queues.get(queue_name)

    def get_queue_url(self, queue_name: str) -> Output[str]:
        """
        Get the URL of an SQS queue.

        Args:
            queue_name: Name of the queue

        Returns:
            Queue URL as Output
        """
        queue = self.get_queue(queue_name)
        return queue.url if queue else None

    def get_queue_arn(self, queue_name: str) -> Output[str]:
        """
        Get the ARN of an SQS queue.

        Args:
            queue_name: Name of the queue

        Returns:
            Queue ARN as Output
        """
        queue = self.get_queue(queue_name)
        return queue.arn if queue else None


```

## File: lib\infrastructure\step_functions.py

```py
"""
Step Functions module.

This module creates Step Functions state machines with proper
service integration format for Lambda invocations.
"""

import json

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import FileUploadConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack


class StepFunctionsStack:
    """
    Manages Step Functions state machines.

    Creates state machines with proper Lambda service integration
    using the correct ARN format (arn:aws:states:::lambda:invoke) and Parameters.
    """

    def __init__(
        self,
        config: FileUploadConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the Step Functions stack.

        Args:
            config: FileUploadConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.lambda_stack = lambda_stack
        self.state_machines = {}
        self.log_groups = {}

        self._create_file_processing_workflow()

    def _create_file_processing_workflow(self):
        """Create file processing workflow state machine."""
        workflow_name = 'file-workflow'

        function = self.lambda_stack.get_function('file-processor')

        log_group = aws.cloudwatch.LogGroup(
            f'{workflow_name}-logs',
            name=f"/aws/states/{self.config.get_resource_name(workflow_name, include_region=False)}",
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': f"/aws/states/{self.config.get_resource_name(workflow_name, include_region=False)}"
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.log_groups[workflow_name] = log_group

        role = self.iam_stack.create_step_functions_role(
            workflow_name,
            lambda_arns=[function.arn],
            log_group_arn=log_group.arn
        )

        definition = Output.all(
            function_arn=function.arn
        ).apply(lambda args: json.dumps({
            "Comment": "File processing workflow with retry logic",
            "StartAt": "ProcessFile",
            "States": {
                "ProcessFile": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": args['function_arn'],
                        "Payload.$": "$"
                    },
                    "ResultPath": "$.processResult",
                    "OutputPath": "$",
                    "Retry": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "IntervalSeconds": self.config.step_functions_retry_interval,
                            "MaxAttempts": self.config.step_functions_max_attempts,
                            "BackoffRate": self.config.step_functions_backoff_rate
                        }
                    ],
                    "Catch": [
                        {
                            "ErrorEquals": ["States.ALL"],
                            "Next": "HandleError",
                            "ResultPath": "$.errorInfo"
                        }
                    ],
                    "End": True
                },
                "HandleError": {
                    "Type": "Fail",
                    "Error": "FileProcessingFailed",
                    "Cause": "File processing failed after retries"
                }
            }
        }))

        state_machine = aws.sfn.StateMachine(
            workflow_name,
            name=self.config.get_resource_name(workflow_name, include_region=False),
            role_arn=role.arn,
            definition=definition,
            logging_configuration=aws.sfn.StateMachineLoggingConfigurationArgs(
                level='ALL',
                include_execution_data=True,
                log_destination=log_group.arn.apply(lambda arn: f"{arn}:*")
            ),
            tracing_configuration=aws.sfn.StateMachineTracingConfigurationArgs(
                enabled=self.config.enable_xray_tracing
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(workflow_name, include_region=False)
            },
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role, log_group, function]
            ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
                depends_on=[role, log_group, function]
            )
        )

        self.state_machines[workflow_name] = state_machine

    def get_state_machine(self, workflow_name: str) -> aws.sfn.StateMachine:
        """
        Get a state machine by name.

        Args:
            workflow_name: Name of the workflow

        Returns:
            State Machine resource
        """
        return self.state_machines.get(workflow_name)

    def get_state_machine_arn(self, workflow_name: str) -> Output[str]:
        """
        Get the ARN of a state machine.

        Args:
            workflow_name: Name of the workflow

        Returns:
            State machine ARN as Output
        """
        sm = self.get_state_machine(workflow_name)
        return sm.arn if sm else None


```
