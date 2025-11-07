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
the multi-region serverless infrastructure architecture.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (APIGatewayStack, AWSProviderManager, CICDStack,
                             DynamoDBStack, IAMStack, KMSStack, LambdaStack,
                             MonitoringStack, S3Stack, ServerlessConfig,
                             SQSStack, VPCStack)


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
    Represents the main Pulumi component resource for the serverless infrastructure.

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

        self.config = ServerlessConfig()

        self.provider_manager = AWSProviderManager(self.config)

        self.kms_stack = KMSStack(self.config, self.provider_manager)

        self.dynamodb_stack = DynamoDBStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )

        self.s3_stack = S3Stack(
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

        self.vpc_stack = VPCStack(self.config, self.provider_manager)

        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.dynamodb_stack,
            self.s3_stack,
            self.sqs_stack,
            self.kms_stack,
            self.vpc_stack
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

        self.cicd_stack = CICDStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.s3_stack,
            self.kms_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_gateway_id'] = self.api_gateway_stack.get_api_id()
        outputs['api_stage_name'] = self.api_gateway_stack.get_stage_name()

        outputs['data_bucket_name'] = self.s3_stack.get_bucket_name('data')
        outputs['pipeline_artifacts_bucket_name'] = self.s3_stack.get_bucket_name('pipeline-artifacts')

        outputs['dynamodb_table_name'] = self.dynamodb_stack.get_table_name('data')

        outputs['api_handler_function_name'] = self.lambda_stack.get_function_name('api-handler')
        outputs['api_handler_function_arn'] = self.lambda_stack.get_function_arn('api-handler')
        outputs['s3_processor_function_name'] = self.lambda_stack.get_function_name('s3-processor')
        outputs['s3_processor_function_arn'] = self.lambda_stack.get_function_arn('s3-processor')

        outputs['api_handler_log_group'] = self.lambda_stack.get_log_group_name('api-handler')
        outputs['s3_processor_log_group'] = self.lambda_stack.get_log_group_name('s3-processor')

        outputs['api_handler_dlq_url'] = self.sqs_stack.get_queue_url('api-handler')
        outputs['s3_processor_dlq_url'] = self.sqs_stack.get_queue_url('s3-processor')

        outputs['vpc_id'] = self.vpc_stack.get_vpc_id()
        outputs['dynamodb_endpoint_id'] = self.vpc_stack.get_dynamodb_endpoint_id()

        outputs['s3_kms_key_id'] = self.kms_stack.get_key_id('s3')
        outputs['s3_kms_key_arn'] = self.kms_stack.get_key_arn('s3')
        outputs['dynamodb_kms_key_id'] = self.kms_stack.get_key_id('dynamodb')
        outputs['dynamodb_kms_key_arn'] = self.kms_stack.get_key_arn('dynamodb')

        outputs['sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn()

        outputs['codebuild_project_name'] = self.cicd_stack.get_codebuild_project_name()

        outputs['primary_region'] = self.config.primary_region
        outputs['secondary_region'] = self.config.secondary_region

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
from .cicd import CICDStack
from .config import ServerlessConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .lambda_functions import LambdaStack
from .monitoring import MonitoringStack
from .s3 import S3Stack
from .sqs import SQSStack
from .vpc import VPCStack

__all__ = [
    'ServerlessConfig',
    'AWSProviderManager',
    'KMSStack',
    'DynamoDBStack',
    'S3Stack',
    'SQSStack',
    'IAMStack',
    'VPCStack',
    'LambdaStack',
    'APIGatewayStack',
    'MonitoringStack',
    'CICDStack'
]


```

## File: lib\infrastructure\lambda_code\api_handler.py

```py
"""
API Handler Lambda function.

This function handles API Gateway requests, processes data,
stores it in DynamoDB and S3 with structured JSON logging.
"""

import json
import logging
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')
BUCKET_NAME = os.environ.get('S3_BUCKET_NAME')


def decimal_default(obj):
    """JSON serializer for Decimal objects."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for API Gateway requests.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    request_id = context.aws_request_id

    logger.info(json.dumps({
        'message': 'Processing request',
        'request_id': request_id,
        'event': event
    }))

    try:
        body = json.loads(event.get('body', '{}'))

        symbol = body.get('symbol')
        data = body.get('data')

        if not symbol or not data:
            logger.error(json.dumps({
                'message': 'Missing required fields',
                'request_id': request_id,
                'body': body
            }))
            return create_response(400, {
                'error': 'Missing required fields: symbol and data',
                'request_id': request_id
            })

        timestamp = Decimal(str(datetime.utcnow().timestamp()))

        item = {
            'symbol': symbol,
            'timestamp': timestamp,
            'data': data,
            'request_id': request_id,
            'processed_at': datetime.utcnow().isoformat()
        }

        table = dynamodb.Table(TABLE_NAME)
        table.put_item(Item=item)

        logger.info(json.dumps({
            'message': 'Item stored in DynamoDB',
            'request_id': request_id,
            'symbol': symbol,
            'timestamp': float(timestamp)
        }))

        s3_key = f'processed/{symbol}/{request_id}.json'
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=json.dumps(item, default=decimal_default),
            ContentType='application/json'
        )

        logger.info(json.dumps({
            'message': 'Data stored in S3',
            'request_id': request_id,
            's3_key': s3_key
        }))

        return create_response(200, {
            'message': 'Data processed successfully',
            'request_id': request_id,
            'symbol': symbol,
            'timestamp': float(timestamp)
        })

    except Exception as e:
        logger.error(json.dumps({
            'message': 'Error processing request',
            'request_id': request_id,
            'error': str(e)
        }), exc_info=True)

        return create_response(500, {
            'error': 'Internal server error',
            'request_id': request_id
        })


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create API Gateway response with CORS headers.

    Args:
        status_code: HTTP status code
        body: Response body

    Returns:
        API Gateway response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'X-Request-ID': body.get('request_id', '')
        },
        'body': json.dumps(body)
    }


```

## File: lib\infrastructure\lambda_code\s3_processor.py

```py
"""
S3 Event Processor Lambda function.

This function handles S3 event notifications, processes uploaded files,
and stores results in DynamoDB with structured JSON logging.
"""

import json
import logging
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

TABLE_NAME = os.environ.get('DYNAMODB_TABLE_NAME')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Lambda handler for S3 event notifications.

    Args:
        event: S3 event
        context: Lambda context

    Returns:
        Processing result
    """
    request_id = context.aws_request_id

    logger.info(json.dumps({
        'message': 'Processing S3 event',
        'request_id': request_id,
        'event': event
    }))

    try:
        for record in event.get('Records', []):
            bucket = record['s3']['bucket']['name']
            key = record['s3']['object']['key']

            logger.info(json.dumps({
                'message': 'Processing S3 object',
                'request_id': request_id,
                'bucket': bucket,
                'key': key
            }))

            response = s3_client.get_object(Bucket=bucket, Key=key)
            content = response['Body'].read().decode('utf-8')
            data = json.loads(content)

            symbol = data.get('symbol', 'unknown')
            timestamp = Decimal(str(datetime.utcnow().timestamp()))

            item = {
                'symbol': symbol,
                'timestamp': timestamp,
                's3_bucket': bucket,
                's3_key': key,
                'data': data,
                'request_id': request_id,
                'processed_at': datetime.utcnow().isoformat()
            }

            table = dynamodb.Table(TABLE_NAME)
            table.put_item(Item=item)

            logger.info(json.dumps({
                'message': 'S3 object processed and stored in DynamoDB',
                'request_id': request_id,
                'symbol': symbol,
                'timestamp': float(timestamp)
            }))

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'S3 events processed successfully',
                'request_id': request_id
            })
        }

    except Exception as e:
        logger.error(json.dumps({
            'message': 'Error processing S3 event',
            'request_id': request_id,
            'error': str(e)
        }), exc_info=True)

        raise


```

## File: lib\infrastructure\api_gateway.py

```py
"""
API Gateway module.

This module creates and manages API Gateway with CORS, throttling,
request validation, and proper Lambda integration.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """Manages API Gateway with CORS, throttling, and Lambda integration."""

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack

        self._create_api()
        self._create_resources()
        self._create_methods()
        self._create_deployment()
        self._create_usage_plan()

    def _create_api(self):
        """Create REST API."""
        api_name = self.config.get_resource_name('api')

        self.api = aws.apigateway.RestApi(
            'api-gateway',
            name=api_name,
            description=f'Serverless API for {self.config.project_name}',
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
        """Create API resources."""
        self.process_resource = aws.apigateway.Resource(
            'api-resource-process',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='process',
            opts=self.provider_manager.get_resource_options(depends_on=[self.api])
        )

    def _create_methods(self):
        """Create API methods with CORS."""
        self.methods = []
        self.integrations = []

        post_method = aws.apigateway.Method(
            'api-method-post',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method='POST',
            authorization='NONE',
            request_validator_id=self._create_request_validator().id,
            opts=self.provider_manager.get_resource_options(depends_on=[self.process_resource])
        )
        self.methods.append(post_method)

        post_integration = aws.apigateway.Integration(
            'api-integration-post',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method=post_method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=self.lambda_stack.get_function_invoke_arn('api-handler'),
            opts=self.provider_manager.get_resource_options(depends_on=[post_method])
        )
        self.integrations.append(post_integration)

        options_method = aws.apigateway.Method(
            'api-method-options',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method='OPTIONS',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options(depends_on=[self.process_resource])
        )
        self.methods.append(options_method)

        options_integration = aws.apigateway.Integration(
            'api-integration-options',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method=options_method.http_method,
            type='MOCK',
            request_templates={
                'application/json': '{"statusCode": 200}'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[options_method])
        )
        self.integrations.append(options_integration)

        aws.apigateway.MethodResponse(
            'api-method-response-options',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
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
            'api-integration-response-options',
            rest_api=self.api.id,
            resource_id=self.process_resource.id,
            http_method=options_method.http_method,
            status_code='200',
            response_parameters={
                'method.response.header.Access-Control-Allow-Headers': "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
                'method.response.header.Access-Control-Allow-Methods': "'GET,POST,PUT,DELETE,OPTIONS'",
                'method.response.header.Access-Control-Allow-Origin': "'*'"
            },
            opts=self.provider_manager.get_resource_options(depends_on=[options_integration])
        )

        lambda_permission = aws.lambda_.Permission(
            'api-lambda-permission',
            action='lambda:InvokeFunction',
            function=self.lambda_stack.get_function_name('api-handler'),
            principal='apigateway.amazonaws.com',
            source_arn=Output.all(self.api.id, self.api.execution_arn).apply(
                lambda args: f'{args[1]}/*/*/*'
            ),
            opts=self.provider_manager.get_resource_options()
        )

    def _create_request_validator(self) -> aws.apigateway.RequestValidator:
        """Create request validator."""
        return aws.apigateway.RequestValidator(
            'api-request-validator',
            rest_api=self.api.id,
            name=self.config.get_resource_name('validator'),
            validate_request_body=True,
            validate_request_parameters=True,
            opts=self.provider_manager.get_resource_options(depends_on=[self.api])
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

        self.stage = aws.apigateway.Stage(
            'api-stage',
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=self.config.api_stage_name,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'api-stage-{self.config.api_stage_name}')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.deployment])
        )

    def _create_usage_plan(self):
        """Create usage plan with throttling."""
        usage_plan = aws.apigateway.UsagePlan(
            'api-usage-plan',
            name=self.config.get_resource_name('usage-plan'),
            api_stages=[
                aws.apigateway.UsagePlanApiStageArgs(
                    api_id=self.api.id,
                    stage=self.stage.stage_name
                )
            ],
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
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('api-key')
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.apigateway.UsagePlanKey(
            'api-usage-plan-key',
            key_id=api_key.id,
            key_type='API_KEY',
            usage_plan_id=usage_plan.id,
            opts=self.provider_manager.get_resource_options(depends_on=[usage_plan, api_key])
        )

    def get_api_id(self) -> Output[str]:
        """Get API Gateway ID."""
        return self.api.id

    def get_api_url(self) -> Output[str]:
        """Get full API URL with stage and path."""
        return Output.all(self.api.id, self.stage.stage_name, self.config.primary_region).apply(
            lambda args: f'https://{args[0]}.execute-api.{args[2]}.amazonaws.com/{args[1]}/process'
        )

    def get_stage_name(self) -> Output[str]:
        """Get API Gateway stage name."""
        return self.stage.stage_name


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

from .config import ServerlessConfig


class AWSProviderManager:
    """
    Manages AWS Pulumi provider instances.

    Ensures consistent provider usage across all resources to avoid
    drift in CI/CD pipelines by using a single provider instance.
    """

    def __init__(self, config: ServerlessConfig):
        """
        Initialize the AWS provider manager.

        Args:
            config: ServerlessConfig instance
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
            return None

        return self._provider

    def get_resource_options(self, depends_on: list = None) -> pulumi.ResourceOptions:
        """
        Get ResourceOptions with the provider attached.

        Args:
            depends_on: Optional list of resources this resource depends on

        Returns:
            ResourceOptions with provider or empty options
        """
        provider = self.get_provider()
        if provider:
            return pulumi.ResourceOptions(provider=provider, depends_on=depends_on or [])
        return pulumi.ResourceOptions(depends_on=depends_on or [])


```

## File: lib\infrastructure\cicd.py

```py
"""
CI/CD module.

This module creates and manages CodePipeline for automated deployment
with S3 source and CodeBuild for building and deploying.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .iam import IAMStack
from .kms import KMSStack
from .s3 import S3Stack


class CICDStack:
    """Manages CodePipeline for CI/CD automation."""

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        s3_stack: S3Stack,
        kms_stack: KMSStack
    ):
        """
        Initialize the CI/CD stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            s3_stack: S3Stack instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.s3_stack = s3_stack
        self.kms_stack = kms_stack

        self._create_codebuild_project()

    def _create_codebuild_project(self):
        """Create CodeBuild project for deployment."""
        project_name = self.config.get_resource_name('codebuild')

        role = self.iam_stack.create_codebuild_role(
            s3_bucket_arns=[self.s3_stack.get_bucket_arn('pipeline-artifacts')],
            kms_key_arns=[self.kms_stack.get_key_arn('s3')]
        )

        self.codebuild_project = aws.codebuild.Project(
            'codebuild-project',
            name=project_name,
            service_role=role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type='S3',
                location=self.s3_stack.get_bucket_name('pipeline-artifacts'),
                path='builds/',
                namespace_type='BUILD_ID',
                packaging='ZIP'
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type='BUILD_GENERAL1_SMALL',
                image='aws/codebuild/standard:7.0',
                type='LINUX_CONTAINER',
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='ENVIRONMENT',
                        value=self.config.environment
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='REGION',
                        value=self.config.primary_region
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type='S3',
                location=Output.concat(
                    self.s3_stack.get_bucket_name('pipeline-artifacts'),
                    '/source/source.zip'
                )
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': project_name
            },
            opts=self.provider_manager.get_resource_options(depends_on=[role])
        )

    def get_codebuild_project_name(self) -> Output[str]:
        """Get CodeBuild project name."""
        return self.codebuild_project.name


```

## File: lib\infrastructure\config.py

```py
"""
Configuration module for the multi-region serverless infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict, List


@dataclass
class ServerlessConfig:
    """Centralized configuration for the serverless infrastructure."""

    environment: str
    environment_suffix: str
    project_name: str

    primary_region: str
    secondary_region: str
    normalized_primary_region: str
    normalized_secondary_region: str

    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    lambda_max_retry_attempts: int

    api_throttle_rate_limit: int
    api_throttle_burst_limit: int
    api_stage_name: str

    dynamodb_partition_key: str
    dynamodb_sort_key: str
    dynamodb_billing_mode: str
    dynamodb_read_capacity: int
    dynamodb_write_capacity: int
    dynamodb_autoscaling_min_read: int
    dynamodb_autoscaling_max_read: int
    dynamodb_autoscaling_min_write: int
    dynamodb_autoscaling_max_write: int
    dynamodb_autoscaling_target_utilization: int

    s3_lifecycle_expiration_days: int
    s3_event_prefix: str
    s3_event_suffix: str
    s3_retain_on_delete: bool

    log_retention_days: int
    enable_xray_tracing: bool
    enable_contributor_insights: bool
    enable_point_in_time_recovery: bool

    dlq_max_receive_count: int

    team: str
    application: str
    cost_center: str

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'Production')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = 'ServApp'

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.secondary_region = os.getenv('SECONDARY_REGION', 'us-west-2')
        self.normalized_primary_region = self._normalize_region(self.primary_region)
        self.normalized_secondary_region = self._normalize_region(self.secondary_region)

        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.12')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '15'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '512'))
        self.lambda_max_retry_attempts = int(os.getenv('LAMBDA_MAX_RETRY_ATTEMPTS', '2'))

        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '2000'))
        self.api_stage_name = os.getenv('API_STAGE_NAME', 'prod')

        self.dynamodb_partition_key = 'symbol'
        self.dynamodb_sort_key = 'timestamp'
        self.dynamodb_billing_mode = os.getenv('DYNAMODB_BILLING_MODE', 'PROVISIONED')
        self.dynamodb_read_capacity = int(os.getenv('DYNAMODB_READ_CAPACITY', '5'))
        self.dynamodb_write_capacity = int(os.getenv('DYNAMODB_WRITE_CAPACITY', '5'))
        self.dynamodb_autoscaling_min_read = int(os.getenv('DYNAMODB_AUTOSCALING_MIN_READ', '1'))
        self.dynamodb_autoscaling_max_read = int(os.getenv('DYNAMODB_AUTOSCALING_MAX_READ', '10'))
        self.dynamodb_autoscaling_min_write = int(os.getenv('DYNAMODB_AUTOSCALING_MIN_WRITE', '1'))
        self.dynamodb_autoscaling_max_write = int(os.getenv('DYNAMODB_AUTOSCALING_MAX_WRITE', '10'))
        self.dynamodb_autoscaling_target_utilization = int(os.getenv('DYNAMODB_AUTOSCALING_TARGET_UTILIZATION', '70'))

        self.s3_lifecycle_expiration_days = int(os.getenv('S3_LIFECYCLE_EXPIRATION_DAYS', '30'))
        self.s3_event_prefix = os.getenv('S3_EVENT_PREFIX', 'uploads/')
        self.s3_event_suffix = os.getenv('S3_EVENT_SUFFIX', '.json')
        self.s3_retain_on_delete = os.getenv('S3_RETAIN_ON_DELETE', 'false').lower() == 'true'

        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'
        self.enable_contributor_insights = os.getenv('ENABLE_CONTRIBUTOR_INSIGHTS', 'true').lower() == 'true'
        self.enable_point_in_time_recovery = os.getenv('ENABLE_POINT_IN_TIME_RECOVERY', 'true').lower() == 'true'

        self.dlq_max_receive_count = int(os.getenv('DLQ_MAX_RECEIVE_COUNT', '2'))

        self.team = os.getenv('TEAM', 'platform')
        self.application = os.getenv('APPLICATION', 'serv-app')
        self.cost_center = os.getenv('COST_CENTER', 'eng-001')

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
            base_name = f"{base_name}-{self.normalized_primary_region}"

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
            'EnvironmentSuffix': self.environment_suffix,
            'Region': self.primary_region,
            'Project': self.project_name,
            'Application': self.application,
            'CostCenter': self.cost_center,
            'Team': self.team,
            'ManagedBy': 'Pulumi'
        }

    def get_regions(self) -> List[str]:
        """
        Get list of all regions for multi-region deployment.

        Returns:
            List of AWS regions
        """
        return [self.primary_region, self.secondary_region]


```

## File: lib\infrastructure\dynamodb.py

```py
"""
DynamoDB module for table management.

This module creates and manages DynamoDB tables with autoscaling,
encryption, point-in-time recovery, and contributor insights.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class DynamoDBStack:
    """Manages DynamoDB tables with autoscaling and encryption."""

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the DynamoDB stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.tables: Dict[str, aws.dynamodb.Table] = {}

        self._create_tables()

    def _create_tables(self):
        """Create DynamoDB tables."""
        self.tables['data'] = self._create_table('data')

    def _create_table(self, table_name: str) -> aws.dynamodb.Table:
        """
        Create a DynamoDB table with all required features.

        Args:
            table_name: Name identifier for the table

        Returns:
            DynamoDB Table resource
        """
        resource_name = self.config.get_resource_name(f'table-{table_name}')

        table = aws.dynamodb.Table(
            f'dynamodb-table-{table_name}',
            name=resource_name,
            billing_mode=self.config.dynamodb_billing_mode,
            hash_key=self.config.dynamodb_partition_key,
            range_key=self.config.dynamodb_sort_key,
            attributes=[
                aws.dynamodb.TableAttributeArgs(
                    name=self.config.dynamodb_partition_key,
                    type='S'
                ),
                aws.dynamodb.TableAttributeArgs(
                    name=self.config.dynamodb_sort_key,
                    type='N'
                )
            ],
            read_capacity=self.config.dynamodb_read_capacity if self.config.dynamodb_billing_mode == 'PROVISIONED' else None,
            write_capacity=self.config.dynamodb_write_capacity if self.config.dynamodb_billing_mode == 'PROVISIONED' else None,
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_stack.get_key_arn('dynamodb')
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=self.config.enable_point_in_time_recovery
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        if self.config.enable_contributor_insights:
            aws.dynamodb.ContributorInsights(
                f'dynamodb-insights-{table_name}',
                table_name=table.name,
                opts=self.provider_manager.get_resource_options(depends_on=[table])
            )

        if self.config.dynamodb_billing_mode == 'PROVISIONED':
            self._setup_autoscaling(table_name, table)

        return table

    def _setup_autoscaling(self, table_name: str, table: aws.dynamodb.Table):
        """
        Setup autoscaling for DynamoDB table.

        Args:
            table_name: Name identifier for the table
            table: DynamoDB Table resource
        """
        read_target = aws.appautoscaling.Target(
            f'dynamodb-read-target-{table_name}',
            max_capacity=self.config.dynamodb_autoscaling_max_read,
            min_capacity=self.config.dynamodb_autoscaling_min_read,
            resource_id=table.name.apply(lambda name: f'table/{name}'),
            scalable_dimension='dynamodb:table:ReadCapacityUnits',
            service_namespace='dynamodb',
            opts=self.provider_manager.get_resource_options(depends_on=[table])
        )

        aws.appautoscaling.Policy(
            f'dynamodb-read-policy-{table_name}',
            name=self.config.get_resource_name(f'read-scaling-{table_name}'),
            policy_type='TargetTrackingScaling',
            resource_id=read_target.resource_id,
            scalable_dimension=read_target.scalable_dimension,
            service_namespace=read_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBReadCapacityUtilization'
                ),
                target_value=float(self.config.dynamodb_autoscaling_target_utilization)
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[read_target])
        )

        write_target = aws.appautoscaling.Target(
            f'dynamodb-write-target-{table_name}',
            max_capacity=self.config.dynamodb_autoscaling_max_write,
            min_capacity=self.config.dynamodb_autoscaling_min_write,
            resource_id=table.name.apply(lambda name: f'table/{name}'),
            scalable_dimension='dynamodb:table:WriteCapacityUnits',
            service_namespace='dynamodb',
            opts=self.provider_manager.get_resource_options(depends_on=[table])
        )

        aws.appautoscaling.Policy(
            f'dynamodb-write-policy-{table_name}',
            name=self.config.get_resource_name(f'write-scaling-{table_name}'),
            policy_type='TargetTrackingScaling',
            resource_id=write_target.resource_id,
            scalable_dimension=write_target.scalable_dimension,
            service_namespace=write_target.service_namespace,
            target_tracking_scaling_policy_configuration=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationArgs(
                predefined_metric_specification=aws.appautoscaling.PolicyTargetTrackingScalingPolicyConfigurationPredefinedMetricSpecificationArgs(
                    predefined_metric_type='DynamoDBWriteCapacityUtilization'
                ),
                target_value=float(self.config.dynamodb_autoscaling_target_utilization)
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[write_target])
        )

    def get_table_name(self, table_name: str) -> Output[str]:
        """
        Get DynamoDB table name.

        Args:
            table_name: Name identifier for the table

        Returns:
            Table name as Output
        """
        return self.tables[table_name].name

    def get_table_arn(self, table_name: str) -> Output[str]:
        """
        Get DynamoDB table ARN.

        Args:
            table_name: Name identifier for the table

        Returns:
            Table ARN as Output
        """
        return self.tables[table_name].arn


```

## File: lib\infrastructure\iam.py

```py
"""
IAM module for role and policy management.

This module creates and manages IAM roles with least-privilege policies
for Lambda functions and CodeBuild/CodePipeline.
"""

import json
from typing import List, Optional

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class IAMStack:
    """Manages IAM roles and policies with least-privilege access."""

    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the IAM stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager

    def create_lambda_role(
        self,
        function_name: str,
        dynamodb_table_arns: Optional[List[Output[str]]] = None,
        s3_bucket_arns: Optional[List[Output[str]]] = None,
        kms_key_arns: Optional[List[Output[str]]] = None,
        dlq_arn: Optional[Output[str]] = None,
        log_group_arn: Optional[Output[str]] = None
    ) -> aws.iam.Role:
        """
        Create IAM role for Lambda function with least-privilege permissions.

        Args:
            function_name: Name of the Lambda function
            dynamodb_table_arns: List of DynamoDB table ARNs
            s3_bucket_arns: List of S3 bucket ARNs
            kms_key_arns: List of KMS key ARNs
            dlq_arn: Dead letter queue ARN
            log_group_arn: CloudWatch log group ARN

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name(f'lambda-role-{function_name}')

        assume_role_policy = json.dumps({
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'lambda.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        })

        role = aws.iam.Role(
            f'lambda-role-{function_name}',
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
                        's3:DeleteObject',
                        's3:ListBucket'
                    ],
                    'Resource': [arn for arn in arns] + [f'{arn}/*' for arn in arns]
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

        if self.config.enable_xray_tracing:
            policy_statements.append({
                'Effect': 'Allow',
                'Action': [
                    'xray:PutTraceSegments',
                    'xray:PutTelemetryRecords'
                ],
                'Resource': '*'
            })

        policy_statements.append({
            'Effect': 'Allow',
            'Action': [
                'ec2:CreateNetworkInterface',
                'ec2:DescribeNetworkInterfaces',
                'ec2:DeleteNetworkInterface',
                'ec2:AssignPrivateIpAddresses',
                'ec2:UnassignPrivateIpAddresses'
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
                f'lambda-policy-{function_name}',
                name=self.config.get_resource_name(f'lambda-policy-{function_name}'),
                policy=policy_document,
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'lambda-policy-{function_name}')
                },
                opts=self.provider_manager.get_resource_options()
            )

            aws.iam.RolePolicyAttachment(
                f'lambda-policy-attachment-{function_name}',
                role=role.name,
                policy_arn=policy.arn,
                opts=self.provider_manager.get_resource_options(depends_on=[role, policy])
            )

        return role

    def create_codebuild_role(
        self,
        s3_bucket_arns: List[Output[str]],
        kms_key_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create IAM role for CodeBuild with least-privilege permissions.

        Args:
            s3_bucket_arns: List of S3 bucket ARNs
            kms_key_arns: List of KMS key ARNs

        Returns:
            IAM Role resource
        """
        role_name = self.config.get_resource_name('codebuild-role')

        assume_role_policy = json.dumps({
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'codebuild.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        })

        role = aws.iam.Role(
            'codebuild-role',
            name=role_name,
            assume_role_policy=assume_role_policy,
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        policy_statements = [
            {
                'Effect': 'Allow',
                'Action': [
                    'logs:CreateLogGroup',
                    'logs:CreateLogStream',
                    'logs:PutLogEvents'
                ],
                'Resource': f'arn:aws:logs:{self.config.primary_region}:*:log-group:/aws/codebuild/*'
            }
        ]

        policy_statements.append(
            Output.all(*s3_bucket_arns).apply(lambda arns: {
                'Effect': 'Allow',
                'Action': [
                    's3:GetObject',
                    's3:GetObjectVersion',
                    's3:PutObject'
                ],
                'Resource': [f'{arn}/*' for arn in arns]
            })
        )

        policy_statements.append(
            Output.all(*kms_key_arns).apply(lambda arns: {
                'Effect': 'Allow',
                'Action': [
                    'kms:Decrypt',
                    'kms:Encrypt',
                    'kms:GenerateDataKey'
                ],
                'Resource': list(arns)
            })
        )

        policy_document = Output.all(*policy_statements).apply(
            lambda statements: json.dumps({
                'Version': '2012-10-17',
                'Statement': statements
            })
        )

        policy = aws.iam.Policy(
            'codebuild-policy',
            name=self.config.get_resource_name('codebuild-policy'),
            policy=policy_document,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('codebuild-policy')
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.iam.RolePolicyAttachment(
            'codebuild-policy-attachment',
            role=role.name,
            policy_arn=policy.arn,
            opts=self.provider_manager.get_resource_options(depends_on=[role, policy])
        )

        return role


```

## File: lib\infrastructure\kms.py

```py
"""
KMS module for encryption key management.

This module creates and manages KMS keys for encrypting S3 buckets,
DynamoDB tables, and other AWS resources.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class KMSStack:
    """Manages KMS keys for encryption."""

    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the KMS stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.keys: Dict[str, aws.kms.Key] = {}

        self._create_keys()

    def _create_keys(self):
        """Create KMS keys for different services."""
        self.keys['s3'] = self._create_key(
            's3',
            'KMS key for S3 bucket encryption'
        )

        self.keys['dynamodb'] = self._create_key(
            'dynamodb',
            'KMS key for DynamoDB table encryption'
        )

        self.keys['sqs'] = self._create_key(
            'sqs',
            'KMS key for SQS queue encryption'
        )

    def _create_key(self, key_name: str, description: str) -> aws.kms.Key:
        """
        Create a KMS key with automatic rotation enabled.

        Args:
            key_name: Name identifier for the key
            description: Description of the key purpose

        Returns:
            KMS Key resource
        """
        resource_name = self.config.get_resource_name(f'kms-{key_name}')

        key = aws.kms.Key(
            f'kms-{key_name}',
            description=f'{description} - {self.config.project_name}',
            enable_key_rotation=True,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.kms.Alias(
            f'kms-{key_name}-alias',
            name=f'alias/{resource_name}',
            target_key_id=key.id,
            opts=self.provider_manager.get_resource_options()
        )

        return key

    def get_key_id(self, key_name: str) -> Output[str]:
        """
        Get KMS key ID.

        Args:
            key_name: Name of the key

        Returns:
            Key ID as Output
        """
        return self.keys[key_name].id

    def get_key_arn(self, key_name: str) -> Output[str]:
        """
        Get KMS key ARN.

        Args:
            key_name: Name of the key

        Returns:
            Key ARN as Output
        """
        return self.keys[key_name].arn


```

## File: lib\infrastructure\lambda_functions.py

```py
"""
Lambda functions module.

This module creates and manages Lambda functions with VPC configuration,
X-Ray tracing, dead letter queues, and proper IAM permissions.
"""

import os
from typing import Dict

import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .s3 import S3Stack
from .sqs import SQSStack
from .vpc import VPCStack


class LambdaStack:
    """Manages Lambda functions with VPC, X-Ray, and DLQ configuration."""

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        s3_stack: S3Stack,
        sqs_stack: SQSStack,
        kms_stack: KMSStack,
        vpc_stack: VPCStack
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            dynamodb_stack: DynamoDBStack instance
            s3_stack: S3Stack instance
            sqs_stack: SQSStack instance
            kms_stack: KMSStack instance
            vpc_stack: VPCStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.s3_stack = s3_stack
        self.sqs_stack = sqs_stack
        self.kms_stack = kms_stack
        self.vpc_stack = vpc_stack

        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}

        self._create_functions()

    def _create_functions(self):
        """Create Lambda functions."""
        self.functions['api-handler'] = self._create_function(
            'api-handler',
            'api_handler.py',
            'api_handler.handler'
        )

        self.functions['s3-processor'] = self._create_function(
            's3-processor',
            's3_processor.py',
            's3_processor.handler'
        )

        self.s3_stack.setup_event_notification(
            'data',
            self.functions['s3-processor'].arn,
            self.functions['s3-processor'].name
        )

    def _create_function(
        self,
        function_name: str,
        handler_file: str,
        handler: str
    ) -> aws.lambda_.Function:
        """
        Create a Lambda function with all required configuration.

        Args:
            function_name: Name identifier for the function
            handler_file: Handler file name
            handler: Handler function path

        Returns:
            Lambda Function resource
        """
        resource_name = self.config.get_resource_name(f'lambda-{function_name}')
        log_group_name = f'/aws/lambda/{resource_name}'

        log_group = aws.cloudwatch.LogGroup(
            f'lambda-log-group-{function_name}',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.log_groups[function_name] = log_group

        dlq = self.sqs_stack.create_dlq(function_name)

        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('data')],
            s3_bucket_arns=[
                self.s3_stack.get_bucket_arn('data'),
                self.s3_stack.get_bucket_arn('pipeline-artifacts')
            ],
            kms_key_arns=[
                self.kms_stack.get_key_arn('s3'),
                self.kms_stack.get_key_arn('dynamodb'),
                self.kms_stack.get_key_arn('sqs')
            ],
            dlq_arn=dlq.arn,
            log_group_arn=log_group.arn
        )

        code_path = os.path.join(
            os.path.dirname(__file__),
            'lambda_code'
        )

        function = aws.lambda_.Function(
            f'lambda-{function_name}',
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler=handler,
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'DYNAMODB_TABLE_NAME': self.dynamodb_stack.get_table_name('data'),
                    'S3_BUCKET_NAME': self.s3_stack.get_bucket_name('data'),
                    'ENVIRONMENT': self.config.environment,
                    'LOG_LEVEL': 'INFO'
                }
            ),
            vpc_config=aws.lambda_.FunctionVpcConfigArgs(
                subnet_ids=self.vpc_stack.get_private_subnet_ids(),
                security_group_ids=[self.vpc_stack.get_lambda_security_group_id()]
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=dlq.arn
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options(depends_on=[role, log_group, dlq])
        )

        aws.lambda_.FunctionEventInvokeConfig(
            f'lambda-event-config-{function_name}',
            function_name=function.name,
            maximum_retry_attempts=self.config.lambda_max_retry_attempts,
            opts=self.provider_manager.get_resource_options(depends_on=[function])
        )

        return function

    def get_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name."""
        return self.functions[function_name].name

    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN."""
        return self.functions[function_name].arn

    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function invoke ARN."""
        return self.functions[function_name].invoke_arn

    def get_log_group_name(self, function_name: str) -> Output[str]:
        """Get CloudWatch log group name."""
        return self.log_groups[function_name].name


```

## File: lib\infrastructure\monitoring.py

```py
"""
Monitoring module.

This module creates and manages CloudWatch alarms with metric math
for Lambda error rates and DynamoDB throttling events.
"""

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .dynamodb import DynamoDBStack
from .lambda_functions import LambdaStack


class MonitoringStack:
    """Manages CloudWatch alarms and monitoring."""

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack,
        dynamodb_stack: DynamoDBStack
    ):
        """
        Initialize the Monitoring stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
            dynamodb_stack: DynamoDBStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.dynamodb_stack = dynamodb_stack

        self._create_sns_topic()
        self._create_lambda_alarms()
        self._create_dynamodb_alarms()

    def _create_sns_topic(self):
        """Create SNS topic for alarm notifications."""
        topic_name = self.config.get_resource_name('alarms')

        self.sns_topic = aws.sns.Topic(
            'sns-topic-alarms',
            name=topic_name,
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name
            },
            opts=self.provider_manager.get_resource_options()
        )

    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions with metric math."""
        for function_name in ['api-handler', 's3-processor']:
            resource_name = self.config.get_resource_name(f'lambda-{function_name}')

            aws.cloudwatch.MetricAlarm(
                f'lambda-error-rate-alarm-{function_name}',
                name=self.config.get_resource_name(f'lambda-error-rate-{function_name}'),
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
                            dimensions={'FunctionName': resource_name}
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
                            dimensions={'FunctionName': resource_name}
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
                    'Name': self.config.get_resource_name(f'lambda-error-rate-{function_name}')
                },
                opts=self.provider_manager.get_resource_options(depends_on=[self.sns_topic])
            )

    def _create_dynamodb_alarms(self):
        """Create CloudWatch alarms for DynamoDB throttling."""
        table_name = self.config.get_resource_name('table-data')

        aws.cloudwatch.MetricAlarm(
            'dynamodb-read-throttle-alarm',
            name=self.config.get_resource_name('dynamodb-read-throttle'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='ReadThrottleEvents',
            namespace='AWS/DynamoDB',
            period=60,
            statistic='Sum',
            threshold=0,
            alarm_description='DynamoDB read throttling detected',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'TableName': table_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('dynamodb-read-throttle')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.sns_topic])
        )

        aws.cloudwatch.MetricAlarm(
            'dynamodb-write-throttle-alarm',
            name=self.config.get_resource_name('dynamodb-write-throttle'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='WriteThrottleEvents',
            namespace='AWS/DynamoDB',
            period=60,
            statistic='Sum',
            threshold=0,
            alarm_description='DynamoDB write throttling detected',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'TableName': table_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('dynamodb-write-throttle')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.sns_topic])
        )

    def get_sns_topic_arn(self) -> Output[str]:
        """Get SNS topic ARN."""
        return self.sns_topic.arn


```

## File: lib\infrastructure\s3.py

```py
"""
S3 module for bucket management.

This module creates and manages S3 buckets with KMS encryption, versioning,
lifecycle policies, and event notifications.
"""

from typing import Dict, Optional

import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class S3Stack:
    """Manages S3 buckets with encryption, versioning, and lifecycle policies."""

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the S3 stack.

        Args:
            config: ServerlessConfig instance
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
        self.buckets['data'] = self._create_bucket('data')
        self.buckets['pipeline-artifacts'] = self._create_bucket('pipeline-artifacts')

    def _create_bucket(self, bucket_name: str) -> aws.s3.Bucket:
        """
        Create an S3 bucket with all required features.

        Args:
            bucket_name: Name identifier for the bucket

        Returns:
            S3 Bucket resource
        """
        resource_name = self.config.get_normalized_resource_name(f'bucket-{bucket_name}')

        bucket = aws.s3.Bucket(
            f's3-bucket-{bucket_name}',
            bucket=resource_name,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                retain_on_delete=self.config.s3_retain_on_delete
            )
        )

        aws.s3.BucketPublicAccessBlock(
            f's3-public-access-block-{bucket_name}',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )

        aws.s3.BucketVersioning(
            f's3-versioning-{bucket_name}',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )

        aws.s3.BucketServerSideEncryptionConfiguration(
            f's3-encryption-{bucket_name}',
            bucket=bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=self.kms_stack.get_key_arn('s3')
                ),
                bucket_key_enabled=True
            )],
            opts=self.provider_manager.get_resource_options(depends_on=[bucket])
        )

        if bucket_name == 'data':
            aws.s3.BucketLifecycleConfiguration(
                f's3-lifecycle-{bucket_name}',
                bucket=bucket.id,
                rules=[
                    aws.s3.BucketLifecycleConfigurationRuleArgs(
                        id='expire-processed-files',
                        status='Enabled',
                        filter=aws.s3.BucketLifecycleConfigurationRuleFilterArgs(
                            prefix='processed/'
                        ),
                        expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                            days=self.config.s3_lifecycle_expiration_days
                        ),
                        noncurrent_version_expiration=aws.s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                            noncurrent_days=self.config.s3_lifecycle_expiration_days
                        )
                    )
                ],
                opts=self.provider_manager.get_resource_options(depends_on=[bucket])
            )

        return bucket

    def setup_event_notification(
        self,
        bucket_name: str,
        lambda_function_arn: Output[str],
        lambda_function_name: Output[str]
    ):
        """
        Setup S3 event notification to trigger Lambda.

        Args:
            bucket_name: Name identifier for the bucket
            lambda_function_arn: ARN of the Lambda function
            lambda_function_name: Name of the Lambda function
        """
        bucket = self.buckets[bucket_name]

        permission = aws.lambda_.Permission(
            f's3-lambda-permission-{bucket_name}',
            action='lambda:InvokeFunction',
            function=lambda_function_name,
            principal='s3.amazonaws.com',
            source_arn=bucket.arn,
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketNotification(
            f's3-notification-{bucket_name}',
            bucket=bucket.id,
            lambda_functions=[
                aws.s3.BucketNotificationLambdaFunctionArgs(
                    lambda_function_arn=lambda_function_arn,
                    events=['s3:ObjectCreated:*'],
                    filter_prefix=self.config.s3_event_prefix,
                    filter_suffix=self.config.s3_event_suffix
                )
            ],
            opts=self.provider_manager.get_resource_options(depends_on=[permission])
        )

    def get_bucket_name(self, bucket_name: str) -> Output[str]:
        """
        Get S3 bucket name.

        Args:
            bucket_name: Name identifier for the bucket

        Returns:
            Bucket name as Output
        """
        return self.buckets[bucket_name].bucket

    def get_bucket_arn(self, bucket_name: str) -> Output[str]:
        """
        Get S3 bucket ARN.

        Args:
            bucket_name: Name identifier for the bucket

        Returns:
            Bucket ARN as Output
        """
        return self.buckets[bucket_name].arn


```

## File: lib\infrastructure\sqs.py

```py
"""
SQS module for queue management.

This module creates and manages SQS queues for Lambda dead letter queues
with KMS encryption.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class SQSStack:
    """Manages SQS queues for dead letter queues."""

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the SQS stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.queues: Dict[str, aws.sqs.Queue] = {}

    def create_dlq(self, function_name: str) -> aws.sqs.Queue:
        """
        Create a dead letter queue for a Lambda function.

        Args:
            function_name: Name of the Lambda function

        Returns:
            SQS Queue resource
        """
        resource_name = self.config.get_resource_name(f'dlq-{function_name}')

        queue = aws.sqs.Queue(
            f'sqs-dlq-{function_name}',
            name=resource_name,
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_stack.get_key_id('sqs'),
            kms_data_key_reuse_period_seconds=300,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.queues[function_name] = queue
        return queue

    def get_queue_arn(self, function_name: str) -> Output[str]:
        """
        Get SQS queue ARN.

        Args:
            function_name: Name of the Lambda function

        Returns:
            Queue ARN as Output
        """
        return self.queues[function_name].arn

    def get_queue_url(self, function_name: str) -> Output[str]:
        """
        Get SQS queue URL.

        Args:
            function_name: Name of the Lambda function

        Returns:
            Queue URL as Output
        """
        return self.queues[function_name].url


```

## File: lib\infrastructure\vpc.py

```py
"""
VPC module for network infrastructure.

This module creates and manages VPC, subnets, NAT gateways, security groups,
and VPC endpoints for Lambda functions.
"""

from typing import List

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class VPCStack:
    """Manages VPC and networking resources for Lambda functions."""

    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the VPC stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager

        self._create_vpc()
        self._create_subnets()
        self._create_internet_gateway()
        self._create_nat_gateways()
        self._create_route_tables()
        self._create_security_groups()
        self._create_vpc_endpoints()

    def _create_vpc(self):
        """Create VPC."""
        vpc_name = self.config.get_resource_name('vpc')

        self.vpc = aws.ec2.Vpc(
            'vpc',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.config.get_common_tags(),
                'Name': vpc_name
            },
            opts=self.provider_manager.get_resource_options()
        )

    def _create_subnets(self):
        """Create public and private subnets across availability zones."""
        self.public_subnets = []
        self.private_subnets = []

        azs = ['a', 'b']

        for i, az in enumerate(azs):
            public_subnet = aws.ec2.Subnet(
                f'public-subnet-{az}',
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i}.0/24',
                availability_zone=f'{self.config.primary_region}{az}',
                map_public_ip_on_launch=True,
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'public-subnet-{az}'),
                    'Type': 'Public'
                },
                opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
            )
            self.public_subnets.append(public_subnet)

            private_subnet = aws.ec2.Subnet(
                f'private-subnet-{az}',
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i+10}.0/24',
                availability_zone=f'{self.config.primary_region}{az}',
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'private-subnet-{az}'),
                    'Type': 'Private'
                },
                opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
            )
            self.private_subnets.append(private_subnet)

    def _create_internet_gateway(self):
        """Create Internet Gateway."""
        self.igw = aws.ec2.InternetGateway(
            'igw',
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('igw')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
        )

    def _create_nat_gateways(self):
        """Create NAT Gateways for private subnets."""
        self.nat_gateways = []

        for i, public_subnet in enumerate(self.public_subnets):
            eip = aws.ec2.Eip(
                f'nat-eip-{i}',
                domain='vpc',
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'nat-eip-{i}')
                },
                opts=self.provider_manager.get_resource_options()
            )

            nat = aws.ec2.NatGateway(
                f'nat-gateway-{i}',
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'nat-gateway-{i}')
                },
                opts=self.provider_manager.get_resource_options(depends_on=[eip, public_subnet])
            )
            self.nat_gateways.append(nat)

    def _create_route_tables(self):
        """Create route tables for public and private subnets."""
        public_rt = aws.ec2.RouteTable(
            'public-rt',
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('public-rt')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
        )

        aws.ec2.Route(
            'public-route',
            route_table_id=public_rt.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=self.provider_manager.get_resource_options(depends_on=[public_rt, self.igw])
        )

        for i, subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'public-rta-{i}',
                subnet_id=subnet.id,
                route_table_id=public_rt.id,
                opts=self.provider_manager.get_resource_options(depends_on=[public_rt, subnet])
            )

        self.private_route_tables = []
        for i, (subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt = aws.ec2.RouteTable(
                f'private-rt-{i}',
                vpc_id=self.vpc.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': self.config.get_resource_name(f'private-rt-{i}')
                },
                opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
            )

            aws.ec2.Route(
                f'private-route-{i}',
                route_table_id=private_rt.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat.id,
                opts=self.provider_manager.get_resource_options(depends_on=[private_rt, nat])
            )

            aws.ec2.RouteTableAssociation(
                f'private-rta-{i}',
                subnet_id=subnet.id,
                route_table_id=private_rt.id,
                opts=self.provider_manager.get_resource_options(depends_on=[private_rt, subnet])
            )

            self.private_route_tables.append(private_rt)

    def _create_security_groups(self):
        """Create security groups for Lambda functions."""
        self.lambda_sg = aws.ec2.SecurityGroup(
            'lambda-sg',
            vpc_id=self.vpc.id,
            description='Security group for Lambda functions',
            egress=[
                aws.ec2.SecurityGroupEgressArgs(
                    from_port=0,
                    to_port=0,
                    protocol='-1',
                    cidr_blocks=['0.0.0.0/0']
                )
            ],
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('lambda-sg')
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.vpc])
        )

    def _create_vpc_endpoints(self):
        """Create VPC endpoints for AWS services."""
        self.dynamodb_endpoint = aws.ec2.VpcEndpoint(
            'dynamodb-endpoint',
            vpc_id=self.vpc.id,
            service_name=f'com.amazonaws.{self.config.primary_region}.dynamodb',
            vpc_endpoint_type='Gateway',
            route_table_ids=[rt.id for rt in self.private_route_tables],
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('dynamodb-endpoint')
            },
            opts=self.provider_manager.get_resource_options(depends_on=self.private_route_tables)
        )

        self.s3_endpoint = aws.ec2.VpcEndpoint(
            's3-endpoint',
            vpc_id=self.vpc.id,
            service_name=f'com.amazonaws.{self.config.primary_region}.s3',
            vpc_endpoint_type='Gateway',
            route_table_ids=[rt.id for rt in self.private_route_tables],
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name('s3-endpoint')
            },
            opts=self.provider_manager.get_resource_options(depends_on=self.private_route_tables)
        )

    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id

    def get_private_subnet_ids(self) -> List[Output[str]]:
        """Get list of private subnet IDs."""
        return [subnet.id for subnet in self.private_subnets]

    def get_lambda_security_group_id(self) -> Output[str]:
        """Get Lambda security group ID."""
        return self.lambda_sg.id

    def get_dynamodb_endpoint_id(self) -> Output[str]:
        """Get DynamoDB VPC endpoint ID."""
        return self.dynamodb_endpoint.id


```
