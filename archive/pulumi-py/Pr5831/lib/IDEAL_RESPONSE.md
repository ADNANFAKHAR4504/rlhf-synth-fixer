## File: tap.py

```py
"""
tap.py

Main entry point for the Pulumi program.

This module instantiates the TapStack component resource,
which orchestrates all infrastructure components for the
serverless processor application.
"""

import os

from lib.tap_stack import TapStack, TapStackArgs

environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

stack = TapStack(
    'serverless-processor',
    TapStackArgs(
        environment_suffix=environment_suffix
    )
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
the serverless processor infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (APIGatewayStack, AWSProviderManager, IAMStack,
                             KMSStack, LambdaStack, MonitoringStack,
                             ServerlessProcessorConfig, StorageStack)


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
    Represents the main Pulumi component resource for the serverless processor infrastructure.

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

        self.config = ServerlessProcessorConfig()

        self.provider_manager = AWSProviderManager(self.config)

        self.kms_stack = KMSStack(self.config, self.provider_manager)

        self.storage_stack = StorageStack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )

        self.iam_stack = IAMStack(self.config, self.provider_manager)

        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.storage_stack,
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
            self.lambda_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_gateway_id'] = self.api_gateway_stack.get_api_id()
        outputs['api_gateway_endpoint'] = self.api_gateway_stack.get_api_endpoint()

        outputs['processed_data_bucket_name'] = self.storage_stack.get_bucket_name('processed-data')
        outputs['processed_data_bucket_arn'] = self.storage_stack.get_bucket_arn('processed-data')

        outputs['processor_function_name'] = self.lambda_stack.get_function_name('processor')
        outputs['processor_function_arn'] = self.lambda_stack.get_function_arn('processor')
        outputs['processor_log_group_name'] = self.lambda_stack.get_log_group_name('processor')

        outputs['kms_key_id'] = self.kms_stack.get_key_id('s3')
        outputs['kms_key_arn'] = self.kms_stack.get_key_arn('s3')

        outputs['alarms_sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn()

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
Infrastructure modules for the serverless processor.

This package contains all infrastructure components for the serverless
application, including storage, compute, API Gateway, monitoring, and IAM.
"""

from .api_gateway import APIGatewayStack
from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig
from .iam import IAMStack
from .kms import KMSStack
from .lambda_functions import LambdaStack
from .monitoring import MonitoringStack
from .storage import StorageStack

__all__ = [
    'ServerlessProcessorConfig',
    'AWSProviderManager',
    'KMSStack',
    'StorageStack',
    'IAMStack',
    'LambdaStack',
    'APIGatewayStack',
    'MonitoringStack'
]


```

## File: lib\infrastructure\lambda_code\processor_handler.py

```py
"""
Lambda function handler for processing HTTP requests.

This handler processes incoming HTTP POST requests, stores results in S3,
and returns structured responses with proper error handling.
"""

import json
import os
from datetime import datetime
from decimal import Decimal
from typing import Any, Dict

import boto3
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')

BUCKET_NAME = os.environ.get('BUCKET_NAME', '')
PROCESSING_CONFIG = json.loads(os.environ.get('PROCESSING_CONFIG', '{}'))


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Process incoming HTTP POST requests and store results in S3.

    Args:
        event: API Gateway Lambda proxy integration event
        context: Lambda context object

    Returns:
        API Gateway Lambda proxy integration response
    """
    request_id = context.aws_request_id

    try:
        print(f"[INFO] Processing request: {request_id}")
        print(f"[DEBUG] Event: {json.dumps(event)}")

        if 'body' not in event or event['body'] is None:
            print(f"[ERROR] Missing request body for request: {request_id}")
            return create_response(400, {
                'error': 'Missing request body',
                'request_id': request_id
            })

        try:
            body = json.loads(event['body'])
        except json.JSONDecodeError as e:
            print(f"[ERROR] Invalid JSON in request body: {str(e)}")
            return create_response(400, {
                'error': 'Invalid JSON in request body',
                'request_id': request_id
            })

        if 'data' not in body:
            print(f"[ERROR] Missing required field 'data' for request: {request_id}")
            return create_response(400, {
                'error': 'Missing required field: data',
                'request_id': request_id
            })

        processed_data = process_data(body['data'], request_id)

        s3_key = f"processed/{datetime.utcnow().strftime('%Y/%m/%d')}/{request_id}.json"

        try:
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=s3_key,
                Body=json.dumps(processed_data, default=decimal_default),
                ContentType='application/json',
                Metadata={
                    'request_id': request_id,
                    'processed_at': datetime.utcnow().isoformat(),
                    'source': 'lambda_processor'
                }
            )

            print(f"[INFO] Successfully stored data to s3://{BUCKET_NAME}/{s3_key}")

        except ClientError as e:
            print(f"[ERROR] Failed to store data in S3: {str(e)}")
            return create_response(500, {
                'error': 'Failed to store processed data',
                'request_id': request_id
            })

        return create_response(200, {
            'message': 'Data processed successfully',
            'request_id': request_id,
            's3_location': f"s3://{BUCKET_NAME}/{s3_key}",
            'processed_at': datetime.utcnow().isoformat()
        })

    except Exception as e:
        print(f"[ERROR] Unexpected error processing request {request_id}: {str(e)}")
        return create_response(500, {
            'error': 'Internal server error',
            'request_id': request_id
        })


def process_data(data: Any, request_id: str) -> Dict[str, Any]:
    """
    Process the input data according to configuration.

    Args:
        data: Input data to process
        request_id: Unique request identifier

    Returns:
        Processed data dictionary
    """
    max_size_mb = PROCESSING_CONFIG.get('max_size_mb', 10)

    data_str = json.dumps(data) if not isinstance(data, str) else data
    data_size_mb = len(data_str.encode('utf-8')) / (1024 * 1024)

    if data_size_mb > max_size_mb:
        raise ValueError(f"Data size {data_size_mb:.2f}MB exceeds maximum {max_size_mb}MB")

    processed = {
        'request_id': request_id,
        'original_data': data,
        'processed_at': datetime.utcnow().isoformat(),
        'processing_config': PROCESSING_CONFIG,
        'metadata': {
            'data_type': type(data).__name__,
            'data_size_bytes': len(data_str.encode('utf-8')),
            'data_size_mb': Decimal(str(round(data_size_mb, 4)))
        }
    }

    return processed


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create an API Gateway Lambda proxy integration response.

    Args:
        status_code: HTTP status code
        body: Response body dictionary

    Returns:
        Properly formatted API Gateway response
    """
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'X-Request-ID': body.get('request_id', 'unknown'),
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Request-ID',
            'Access-Control-Allow-Methods': 'POST,OPTIONS'
        },
        'body': json.dumps(body, default=decimal_default)
    }


def decimal_default(obj):
    """
    JSON serializer for Decimal objects.

    Args:
        obj: Object to serialize

    Returns:
        Serialized value
    """
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


```

## File: lib\infrastructure\api_gateway.py

```py
"""
API Gateway module for HTTP API management.

This module creates and configures API Gateway HTTP APIs with proper
Lambda integration, throttling, and CORS settings.
"""

import json
from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway for the serverless processor.

    Creates HTTP API Gateway with Lambda integration, proper permissions,
    throttling, and CORS configuration.
    """

    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.

        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance for Lambda integration
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.api = None
        self.stage = None
        self.integration = None
        self.route = None

        self._create_api()

    def _create_api(self):
        """Create API Gateway HTTP API."""
        api_name = self.config.get_resource_name('api')

        self.api = aws.apigatewayv2.Api(
            'http-api',
            name=api_name,
            protocol_type='HTTP',
            cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
                allow_origins=['*'],
                allow_methods=['POST', 'OPTIONS'],
                allow_headers=['Content-Type', 'X-Request-ID', 'Authorization'],
                max_age=300
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': api_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        processor_function = self.lambda_stack.get_function('processor')

        self.integration = aws.apigatewayv2.Integration(
            'lambda-integration',
            api_id=self.api.id,
            integration_type='AWS_PROXY',
            integration_uri=self.lambda_stack.get_function_invoke_arn('processor'),
            integration_method='POST',
            payload_format_version='2.0',
            timeout_milliseconds=self.config.lambda_timeout * 1000,
            opts=self.provider_manager.get_resource_options()
        )

        self.route = aws.apigatewayv2.Route(
            'process-route',
            api_id=self.api.id,
            route_key='POST /process',
            target=Output.concat('integrations/', self.integration.id),
            opts=self.provider_manager.get_resource_options()
        )

        log_group_name = f'/aws/apigatewayv2/{api_name}'

        api_log_group = aws.cloudwatch.LogGroup(
            'api-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.stage = aws.apigatewayv2.Stage(
            'api-stage',
            api_id=self.api.id,
            name=self.config.api_stage_name,
            auto_deploy=True,
            access_log_settings=aws.apigatewayv2.StageAccessLogSettingsArgs(
                destination_arn=api_log_group.arn,
                format=json.dumps({
                    'requestId': '$context.requestId',
                    'ip': '$context.identity.sourceIp',
                    'requestTime': '$context.requestTime',
                    'httpMethod': '$context.httpMethod',
                    'routeKey': '$context.routeKey',
                    'status': '$context.status',
                    'protocol': '$context.protocol',
                    'responseLength': '$context.responseLength',
                    'error': '$context.error.message',
                    'integrationError': '$context.integration.error'
                })
            ),
            default_route_settings=aws.apigatewayv2.StageDefaultRouteSettingsArgs(
                throttling_burst_limit=self.config.api_throttle_burst_limit,
                throttling_rate_limit=self.config.api_throttle_rate_limit
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': f'{api_name}-{self.config.api_stage_name}'
            },
            opts=self.provider_manager.get_resource_options(depends_on=[self.route, api_log_group])
        )

        aws.lambda_.Permission(
            'api-lambda-permission',
            action='lambda:InvokeFunction',
            function=processor_function.name,
            principal='apigateway.amazonaws.com',
            source_arn=Output.all(self.api.execution_arn, self.stage.name).apply(
                lambda args: f'{args[0]}/{args[1]}/POST/process'
            ),
            opts=self.provider_manager.get_resource_options()
        )

    def get_api_id(self) -> Output[str]:
        """
        Get API Gateway ID.

        Returns:
            API ID as Output
        """
        return self.api.id

    def get_api_endpoint(self) -> Output[str]:
        """
        Get API Gateway endpoint URL.

        Returns:
            API endpoint URL as Output
        """
        return self.api.api_endpoint

    def get_api_url(self) -> Output[str]:
        """
        Get full API URL with stage and path.

        Returns:
            Full API URL as Output
        """
        return Output.all(self.api.api_endpoint, self.stage.name).apply(
            lambda args: f'{args[0]}/{args[1]}/process'
        )


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

from .config import ServerlessProcessorConfig


class AWSProviderManager:
    """
    Manages AWS Pulumi provider instances.

    Ensures consistent provider usage across all resources to avoid
    drift in CI/CD pipelines by using a fixed provider name without
    random suffixes.
    """

    def __init__(self, config: ServerlessProcessorConfig):
        """
        Initialize the AWS provider manager.

        Args:
            config: ServerlessProcessorConfig instance
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

    def get_resource_options(self, depends_on: Optional[list] = None) -> pulumi.ResourceOptions:
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

## File: lib\infrastructure\config.py

```py
"""
Configuration module for the serverless processor infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict


@dataclass
class ServerlessProcessorConfig:
    """Centralized configuration for the serverless processor infrastructure."""

    environment: str
    environment_suffix: str
    project_name: str

    primary_region: str
    normalized_region: str
    account_id: str

    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int

    api_stage_name: str
    api_throttle_rate_limit: int
    api_throttle_burst_limit: int

    s3_lifecycle_glacier_days: int
    s3_lifecycle_expiration_days: int
    s3_retain_on_delete: bool

    log_retention_days: int
    enable_xray_tracing: bool

    processing_config: Dict[str, any]

    team: str
    application: str
    cost_center: str

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'Production')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless-processor')

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)
        self.account_id = ''

        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '15'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '512'))

        self.api_stage_name = os.getenv('API_STAGE_NAME', 'prod')
        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '2000'))

        self.s3_lifecycle_glacier_days = int(os.getenv('S3_LIFECYCLE_GLACIER_DAYS', '90'))
        self.s3_lifecycle_expiration_days = int(os.getenv('S3_LIFECYCLE_EXPIRATION_DAYS', '365'))
        self.s3_retain_on_delete = os.getenv('S3_RETAIN_ON_DELETE', 'false').lower() == 'true'

        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'

        self.processing_config = {
            'max_size_mb': int(os.getenv('MAX_SIZE_MB', '10')),
            'allowed_content_types': os.getenv('ALLOWED_CONTENT_TYPES', 'application/json,text/plain').split(',')
        }

        self.team = os.getenv('TEAM', 'platform')
        self.application = os.getenv('APPLICATION', 'serverless-processor')
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
            resource_type: Type of resource (e.g., 'processor-lambda', 'data-bucket')
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
            'EnvironmentSuffix': self.environment_suffix,
            'Application': self.application,
            'CostCenter': self.cost_center,
            'Team': self.team,
            'ManagedBy': 'Pulumi',
            'Project': self.project_name
        }


```

## File: lib\infrastructure\iam.py

```py
"""
IAM module for role and policy management.

This module creates IAM roles and policies with least-privilege access
for Lambda functions and other AWS services.
"""

import json
from typing import Dict, List, Optional

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig


class IAMStack:
    """
    Manages IAM roles and policies for the serverless processor.

    Creates least-privilege IAM roles for Lambda functions with scoped
    permissions to specific resources.
    """

    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the IAM stack.

        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.Policy] = {}

    def create_lambda_role(
        self,
        function_name: str,
        s3_bucket_arns: Optional[List[Output[str]]] = None,
        kms_key_arns: Optional[List[Output[str]]] = None,
        log_group_arn: Optional[Output[str]] = None
    ) -> aws.iam.Role:
        """
        Create an IAM role for a Lambda function with least-privilege permissions.

        Args:
            function_name: Name of the Lambda function
            s3_bucket_arns: List of S3 bucket ARNs to grant access to
            kms_key_arns: List of KMS key ARNs to grant access to
            log_group_arn: CloudWatch log group ARN for logging permissions

        Returns:
            Created IAM role
        """
        role_name = self.config.get_resource_name(f'{function_name}-role')

        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {
                    'Service': 'lambda.amazonaws.com'
                },
                'Action': 'sts:AssumeRole'
            }]
        }

        role = aws.iam.Role(
            f'{function_name}-role',
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name,
                'Function': function_name
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
                        's3:PutObject',
                        's3:GetObject',
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

        if self.config.enable_xray_tracing:
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

            policy_name = self.config.get_resource_name(f'{function_name}-policy')

            policy = aws.iam.Policy(
                f'{function_name}-policy',
                name=policy_name,
                policy=policy_document,
                tags={
                    **self.config.get_common_tags(),
                    'Name': policy_name,
                    'Function': function_name
                },
                opts=self.provider_manager.get_resource_options()
            )

            aws.iam.RolePolicyAttachment(
                f'{function_name}-policy-attachment',
                role=role.name,
                policy_arn=policy.arn,
                opts=self.provider_manager.get_resource_options()
            )

            self.policies[function_name] = policy

        self.roles[function_name] = role
        return role

    def get_role_arn(self, function_name: str) -> Output[str]:
        """
        Get IAM role ARN.

        Args:
            function_name: Name of the function

        Returns:
            Role ARN as Output
        """
        return self.roles[function_name].arn

    def get_role_name(self, function_name: str) -> Output[str]:
        """
        Get IAM role name.

        Args:
            function_name: Name of the function

        Returns:
            Role name as Output
        """
        return self.roles[function_name].name


```

## File: lib\infrastructure\kms.py

```py
"""
KMS module for encryption key management.

This module creates and manages KMS keys for encrypting S3 buckets
and other AWS resources.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig


class KMSStack:
    """
    Manages KMS encryption keys for the serverless processor.

    Creates customer-managed KMS keys with automatic key rotation enabled
    for encrypting S3 buckets and other sensitive data.
    """

    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the KMS stack.

        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.keys: Dict[str, aws.kms.Key] = {}
        self.aliases: Dict[str, aws.kms.Alias] = {}

        self._create_keys()

    def _create_keys(self):
        """Create KMS keys for different services."""
        self._create_s3_key()

    def _create_s3_key(self):
        """Create KMS key for S3 bucket encryption."""
        key_name = self.config.get_resource_name('s3-kms-key')
        alias_name = f"alias/{self.config.get_normalized_resource_name('s3-key', include_region=False)}"

        key = aws.kms.Key(
            's3-kms-key',
            description=f'KMS key for S3 bucket encryption - {self.config.project_name}',
            enable_key_rotation=True,
            deletion_window_in_days=30,
            tags={
                **self.config.get_common_tags(),
                'Name': key_name,
                'Purpose': 'S3 Encryption'
            },
            opts=self.provider_manager.get_resource_options()
        )

        alias = aws.kms.Alias(
            's3-kms-alias',
            name=alias_name,
            target_key_id=key.id,
            opts=self.provider_manager.get_resource_options()
        )

        self.keys['s3'] = key
        self.aliases['s3'] = alias

    def get_key_id(self, key_name: str) -> Output[str]:
        """
        Get KMS key ID.

        Args:
            key_name: Name of the key (e.g., 's3')

        Returns:
            KMS key ID as Output
        """
        return self.keys[key_name].id

    def get_key_arn(self, key_name: str) -> Output[str]:
        """
        Get KMS key ARN.

        Args:
            key_name: Name of the key (e.g., 's3')

        Returns:
            KMS key ARN as Output
        """
        return self.keys[key_name].arn


```

## File: lib\infrastructure\lambda_functions.py

```py
"""
Lambda functions module for serverless compute.

This module creates and manages Lambda functions with proper configuration,
environment variables, and CloudWatch logging.
"""

import json
from typing import Dict

import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig
from .iam import IAMStack
from .kms import KMSStack
from .storage import StorageStack


class LambdaStack:
    """
    Manages Lambda functions for the serverless processor.

    Creates Lambda functions with proper IAM roles, environment variables,
    CloudWatch logging, and X-Ray tracing.
    """

    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        storage_stack: StorageStack,
        kms_stack: KMSStack
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance for IAM roles
            storage_stack: StorageStack instance for S3 access
            kms_stack: KMSStack instance for encryption
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.storage_stack = storage_stack
        self.kms_stack = kms_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}

        self._create_functions()

    def _create_functions(self):
        """Create Lambda functions."""
        self._create_processor_function()

    def _create_processor_function(self):
        """Create the main processor Lambda function."""
        function_name = 'processor'
        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f'/aws/lambda/{resource_name}'

        log_group = aws.cloudwatch.LogGroup(
            f'{function_name}-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name,
                'Function': function_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.log_groups[function_name] = log_group

        role = self.iam_stack.create_lambda_role(
            function_name,
            s3_bucket_arns=[self.storage_stack.get_bucket_arn('processed-data')],
            kms_key_arns=[self.kms_stack.get_key_arn('s3')],
            log_group_arn=log_group.arn
        )

        processing_config_json = Output.from_input(self.config.processing_config).apply(
            lambda config: json.dumps(config)
        )

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='processor_handler.handler',
            role=role.arn,
            code=FileArchive('./lib/infrastructure/lambda_code'),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'BUCKET_NAME': self.storage_stack.get_bucket_name('processed-data'),
                    'PROCESSING_CONFIG': processing_config_json,
                    'ENVIRONMENT': self.config.environment,
                    'LOG_LEVEL': 'INFO'
                }
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name,
                'Function': function_name
            },
            opts=self.provider_manager.get_resource_options(depends_on=[log_group, role])
        )

        self.functions[function_name] = function

    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """
        Get Lambda function resource.

        Args:
            function_name: Name of the function

        Returns:
            Lambda function resource
        """
        return self.functions[function_name]

    def get_function_name(self, function_name: str) -> Output[str]:
        """
        Get Lambda function name.

        Args:
            function_name: Name of the function

        Returns:
            Function name as Output
        """
        return self.functions[function_name].name

    def get_function_arn(self, function_name: str) -> Output[str]:
        """
        Get Lambda function ARN.

        Args:
            function_name: Name of the function

        Returns:
            Function ARN as Output
        """
        return self.functions[function_name].arn

    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """
        Get Lambda function invoke ARN.

        Args:
            function_name: Name of the function

        Returns:
            Function invoke ARN as Output
        """
        return self.functions[function_name].invoke_arn

    def get_log_group_name(self, function_name: str) -> Output[str]:
        """
        Get CloudWatch log group name.

        Args:
            function_name: Name of the function

        Returns:
            Log group name as Output
        """
        return self.log_groups[function_name].name

    def get_log_group_arn(self, function_name: str) -> Output[str]:
        """
        Get CloudWatch log group ARN.

        Args:
            function_name: Name of the function

        Returns:
            Log group ARN as Output
        """
        return self.log_groups[function_name].arn


```

## File: lib\infrastructure\monitoring.py

```py
"""
Monitoring module for CloudWatch alarms and metrics.

This module creates CloudWatch alarms for monitoring Lambda functions
and API Gateway with proper metric math for error rates.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch monitoring for the serverless processor.

    Creates CloudWatch alarms with metric math for error rate monitoring
    and SNS topics for alarm notifications.
    """

    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the monitoring stack.

        Args:
            config: ServerlessProcessorConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance for Lambda monitoring
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        self.sns_topic = None

        self._create_sns_topic()
        self._create_lambda_alarms()

    def _create_sns_topic(self):
        """Create SNS topic for alarm notifications."""
        topic_name = self.config.get_resource_name('alarms-topic')

        self.sns_topic = aws.sns.Topic(
            'alarms-topic',
            name=topic_name,
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name
            },
            opts=self.provider_manager.get_resource_options()
        )

    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions."""
        self._create_lambda_error_rate_alarm('processor')
        self._create_lambda_duration_alarm('processor')

    def _create_lambda_error_rate_alarm(self, function_name: str):
        """
        Create error rate alarm using metric math.

        Args:
            function_name: Name of the Lambda function
        """
        alarm_name = self.config.get_resource_name(f'{function_name}-error-rate')
        function_resource_name = self.config.get_resource_name(function_name)

        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-error-rate-alarm',
            name=alarm_name,
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
                'Name': alarm_name,
                'Function': function_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.alarms[f'{function_name}-error-rate'] = alarm

    def _create_lambda_duration_alarm(self, function_name: str):
        """
        Create duration alarm for Lambda function.

        Args:
            function_name: Name of the Lambda function
        """
        alarm_name = self.config.get_resource_name(f'{function_name}-duration')
        function_resource_name = self.config.get_resource_name(function_name)

        threshold = self.config.lambda_timeout * 1000 * 0.8

        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-duration-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='Duration',
            namespace='AWS/Lambda',
            period=300,
            statistic='Average',
            threshold=threshold,
            alarm_description=f'Duration > 80% of timeout ({threshold}ms) for {function_name}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'FunctionName': function_resource_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': alarm_name,
                'Function': function_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.alarms[f'{function_name}-duration'] = alarm

    def get_sns_topic_arn(self) -> Output[str]:
        """
        Get SNS topic ARN.

        Returns:
            SNS topic ARN as Output
        """
        return self.sns_topic.arn

    def get_alarm_name(self, alarm_key: str) -> Output[str]:
        """
        Get CloudWatch alarm name.

        Args:
            alarm_key: Key identifying the alarm

        Returns:
            Alarm name as Output
        """
        return self.alarms[alarm_key].name


```

## File: lib\infrastructure\storage.py

```py
"""
Storage module for S3 bucket management.

This module creates S3 buckets for storing processed data with proper
encryption, versioning, lifecycle policies, and public access blocking.
"""

from typing import Dict

import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .aws_provider import AWSProviderManager
from .config import ServerlessProcessorConfig
from .kms import KMSStack


class StorageStack:
    """
    Manages S3 buckets for the serverless processor.

    Creates S3 buckets with KMS encryption, versioning, lifecycle policies,
    and public access blocking for storing processed data.
    """

    def __init__(
        self,
        config: ServerlessProcessorConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the storage stack.

        Args:
            config: ServerlessProcessorConfig instance
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
        self._create_processed_data_bucket()

    def _create_processed_data_bucket(self):
        """Create S3 bucket for storing processed data."""
        bucket_name = self.config.get_normalized_resource_name('processed-data')

        bucket = aws.s3.Bucket(
            'processed-data-bucket',
            bucket=bucket_name,
            tags={
                **self.config.get_common_tags(),
                'Name': bucket_name,
                'Purpose': 'Processed Data Storage'
            },
            opts=ResourceOptions(
                provider=self.provider_manager.get_provider(),
                protect=True,
                retain_on_delete=self.config.s3_retain_on_delete
            )
        )

        aws.s3.BucketVersioning(
            'processed-data-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketServerSideEncryptionConfiguration(
            'processed-data-encryption',
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
            'processed-data-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketLifecycleConfiguration(
            'processed-data-lifecycle',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-to-glacier',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=self.config.s3_lifecycle_glacier_days,
                            storage_class='GLACIER'
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-data',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=self.config.s3_lifecycle_expiration_days
                    )
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='cleanup-incomplete-uploads',
                    status='Enabled',
                    abort_incomplete_multipart_upload=aws.s3.BucketLifecycleConfigurationRuleAbortIncompleteMultipartUploadArgs(
                        days_after_initiation=7
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options()
        )

        self.buckets['processed-data'] = bucket

    def get_bucket_name(self, bucket_key: str) -> Output[str]:
        """
        Get S3 bucket name.

        Args:
            bucket_key: Key identifying the bucket (e.g., 'processed-data')

        Returns:
            Bucket name as Output
        """
        return self.buckets[bucket_key].bucket

    def get_bucket_arn(self, bucket_key: str) -> Output[str]:
        """
        Get S3 bucket ARN.

        Args:
            bucket_key: Key identifying the bucket (e.g., 'processed-data')

        Returns:
            Bucket ARN as Output
        """
        return self.buckets[bucket_key].arn

    def get_bucket_id(self, bucket_key: str) -> Output[str]:
        """
        Get S3 bucket ID.

        Args:
            bucket_key: Key identifying the bucket (e.g., 'processed-data')

        Returns:
            Bucket ID as Output
        """
        return self.buckets[bucket_key].id


```
