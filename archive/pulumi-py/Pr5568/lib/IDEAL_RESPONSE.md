## File: tap.py

```python
"""
tap.py

Main entry point for the Pulumi program.

This module instantiates the TapStack component resource,
which orchestrates all infrastructure components.
"""

import os

from lib.tap_stack import TapStack, TapStackArgs

environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')

stack = TapStack(
    'serverless-stack',
    TapStackArgs(
        environment_suffix=environment_suffix
    )
)


```

## File: lib\*\*init\*\*.py

```python
"""
Serverless infrastructure library.

This package contains the main TapStack component and all infrastructure modules.
"""

from .tap_stack import TapStack, TapStackArgs

__all__ = ['TapStack', 'TapStackArgs']


```

## File: lib\tap_stack.py

```python
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless infrastructure architecture.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions

from .infrastructure import (APIGatewayStack, AWSProviderManager,
                             CloudFrontStack, DynamoDBStack, IAMStack,
                             KMSStack, LambdaStack, MonitoringStack, S3Stack,
                             SecretsStack, ServerlessConfig, SQSStack,
                             StepFunctionsStack, VPCStack)


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

        self.secrets_stack = SecretsStack(
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

        self.s3_stack = S3Stack(
            self.config,
            self.provider_manager,
            self.kms_stack
        )

        self.cloudfront_stack = CloudFrontStack(
            self.config,
            self.provider_manager,
            self.s3_stack
        )

        self.vpc_stack = VPCStack(self.config, self.provider_manager)

        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.dynamodb_stack,
            self.sqs_stack,
            self.kms_stack,
            self.secrets_stack
        )

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

        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.lambda_stack,
            self.step_functions_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_gateway_id'] = self.api_gateway_stack.get_api_id()

        outputs['cloudfront_domain_name'] = self.cloudfront_stack.get_distribution_domain_name('content')

        outputs['content_bucket_name'] = self.s3_stack.get_bucket_name('content')
        outputs['data_bucket_name'] = self.s3_stack.get_bucket_name('data')

        outputs['users_table_name'] = self.dynamodb_stack.get_table_name('users')
        outputs['orders_table_name'] = self.dynamodb_stack.get_table_name('orders')
        outputs['products_table_name'] = self.dynamodb_stack.get_table_name('products')

        outputs['user_service_function_name'] = self.lambda_stack.get_function_name('user-service')
        outputs['order_service_function_name'] = self.lambda_stack.get_function_name('order-service')
        outputs['product_service_function_name'] = self.lambda_stack.get_function_name('product-service')

        outputs['user_service_log_group'] = self.lambda_stack.get_log_group_name('user-service')
        outputs['order_service_log_group'] = self.lambda_stack.get_log_group_name('order-service')
        outputs['product_service_log_group'] = self.lambda_stack.get_log_group_name('product-service')

        outputs['user_service_dlq_url'] = self.sqs_stack.get_queue_url('user-service')
        outputs['order_service_dlq_url'] = self.sqs_stack.get_queue_url('order-service')
        outputs['product_service_dlq_url'] = self.sqs_stack.get_queue_url('product-service')

        outputs['order_workflow_arn'] = self.step_functions_stack.get_state_machine_arn('order-workflow')

        outputs['vpc_id'] = self.vpc_stack.get_vpc_id()
        outputs['dynamodb_endpoint_id'] = self.vpc_stack.get_dynamodb_endpoint_id()

        outputs['kms_key_id'] = self.kms_stack.get_key_id('data')
        outputs['kms_key_arn'] = self.kms_stack.get_key_arn('data')

        outputs['api_secret_arn'] = self.secrets_stack.get_secret_arn('api')
        outputs['database_secret_arn'] = self.secrets_stack.get_secret_arn('database')

        self.register_outputs(outputs)

        try:
            for key, value in outputs.items():
                pulumi.export(key, value)
        except Exception:
            pass

```

## File: lib\infrastructure\_\_init\_\_.py

```python
"""
Infrastructure package for serverless application.

This package contains all infrastructure modules for creating
a secure, scalable serverless architecture on AWS.
"""

from .api_gateway import APIGatewayStack
from .aws_provider import AWSProviderManager
from .cloudfront import CloudFrontStack
from .config import ServerlessConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .lambda_functions import LambdaStack
from .monitoring import MonitoringStack
from .s3 import S3Stack
from .secrets import SecretsStack
from .sqs import SQSStack
from .step_functions import StepFunctionsStack
from .vpc import VPCStack

__all__ = [
    'ServerlessConfig',
    'AWSProviderManager',
    'KMSStack',
    'SecretsStack',
    'DynamoDBStack',
    'SQSStack',
    'IAMStack',
    'S3Stack',
    'CloudFrontStack',
    'VPCStack',
    'LambdaStack',
    'APIGatewayStack',
    'StepFunctionsStack',
    'MonitoringStack'
]


```

## File: lib\infrastructure\lambda_code\order_service.py

```python
"""
Order service Lambda handler.

Handles order-related operations with DynamoDB.
Uses only boto3 and standard library - no external dependencies.
"""

import json
import logging
import os
import time
from decimal import Decimal

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
orders_table = dynamodb.Table(os.environ['ORDERS_TABLE_NAME'])


def decimal_default(obj):
    """JSON serializer for Decimal objects."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def handler(event, context):
    """
    Main Lambda handler for order service.

    Args:
        event: API Gateway event or Step Functions input
        context: Lambda context

    Returns:
        Response dict
    """
    logger.info(f"Received event: {json.dumps(event, default=decimal_default)}")

    try:
        http_method = event.get('httpMethod', '')

        if http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            order_id = body.get('orderId')
            user_id = body.get('userId')
            product_id = body.get('productId')
            quantity = body.get('quantity', 1)

            if not order_id or not user_id or not product_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'orderId, userId, and productId are required'})
                }

            orders_table.put_item(Item={
                'orderId': order_id,
                'userId': user_id,
                'productId': product_id,
                'quantity': Decimal(str(quantity)),
                'status': 'pending',
                'createdAt': Decimal(str(int(time.time())))
            })

            return {
                'statusCode': 200,
                'body': json.dumps({'orderId': order_id, 'status': 'created'})
            }

        elif http_method == 'GET':
            order_id = event.get('pathParameters', {}).get('orderId')

            if not order_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'orderId is required'})
                }

            response = orders_table.get_item(Key={'orderId': order_id})

            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'Order not found'})
                }

            return {
                'statusCode': 200,
                'body': json.dumps(response['Item'], default=decimal_default)
            }

        else:
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }


```

## File: lib\infrastructure\lambda_code\product_service.py

```python
"""
Product service Lambda handler.

Handles product-related operations with DynamoDB.
Uses only boto3 and standard library - no external dependencies.
"""

import json
import logging
import os
from decimal import Decimal

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
products_table = dynamodb.Table(os.environ['PRODUCTS_TABLE_NAME'])


def decimal_default(obj):
    """JSON serializer for Decimal objects."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def handler(event, context):
    """
    Main Lambda handler for product service.

    Args:
        event: API Gateway event or Step Functions input
        context: Lambda context

    Returns:
        Response dict
    """
    logger.info(f"Received event: {json.dumps(event, default=decimal_default)}")

    try:
        http_method = event.get('httpMethod', '')

        if http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            product_id = body.get('productId')
            name = body.get('name')
            category = body.get('category')
            price = body.get('price')

            if not product_id or not name or not category:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'productId, name, and category are required'})
                }

            products_table.put_item(Item={
                'productId': product_id,
                'name': name,
                'category': category,
                'price': Decimal(str(price)) if price else Decimal('0'),
                'status': 'available'
            })

            return {
                'statusCode': 200,
                'body': json.dumps({'productId': product_id, 'status': 'created'})
            }

        elif http_method == 'GET':
            product_id = event.get('pathParameters', {}).get('productId')

            if not product_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'productId is required'})
                }

            response = products_table.get_item(Key={'productId': product_id})

            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'Product not found'})
                }

            return {
                'statusCode': 200,
                'body': json.dumps(response['Item'], default=decimal_default)
            }

        else:
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }


```

## File: lib\infrastructure\lambda_code\user_service.py

```python
"""
User service Lambda handler.

Handles user-related operations with DynamoDB.
Uses only boto3 and standard library - no external dependencies.
"""

import json
import logging
import os
from decimal import Decimal

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

dynamodb = boto3.resource('dynamodb')
users_table = dynamodb.Table(os.environ['USERS_TABLE_NAME'])


def decimal_default(obj):
    """JSON serializer for Decimal objects."""
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError


def handler(event, context):
    """
    Main Lambda handler for user service.

    Args:
        event: API Gateway event or Step Functions input
        context: Lambda context

    Returns:
        Response dict
    """
    logger.info(f"Received event: {json.dumps(event, default=decimal_default)}")

    try:
        http_method = event.get('httpMethod', '')

        if http_method == 'POST':
            body = json.loads(event.get('body', '{}'))
            user_id = body.get('userId')
            email = body.get('email')
            name = body.get('name')

            if not user_id or not email:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'userId and email are required'})
                }

            users_table.put_item(Item={
                'userId': user_id,
                'email': email,
                'name': name or '',
                'status': 'active'
            })

            return {
                'statusCode': 200,
                'body': json.dumps({'userId': user_id, 'status': 'created'})
            }

        elif http_method == 'GET':
            user_id = event.get('pathParameters', {}).get('userId')

            if not user_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'userId is required'})
                }

            response = users_table.get_item(Key={'userId': user_id})

            if 'Item' not in response:
                return {
                    'statusCode': 404,
                    'body': json.dumps({'error': 'User not found'})
                }

            return {
                'statusCode': 200,
                'body': json.dumps(response['Item'], default=decimal_default)
            }

        else:
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }


```

## File: lib\infrastructure\api_gateway.py

```python
"""
API Gateway module.

This module creates API Gateway REST API with proper Lambda integration,
permissions, usage plans, and X-Ray tracing.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway REST API.

    Creates API Gateway with proper Lambda proxy integration,
    HTTPS enforcement, usage plans, and X-Ray tracing.
    """

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
        self.api = None
        self.deployment = None
        self.stage = None
        self.resources = {}
        self.methods = {}
        self.integrations = {}

        self._create_api()
        self._create_resources()
        self._create_methods_and_integrations()
        self._create_deployment_and_stage()
        self._create_usage_plan()

    def _create_api(self):
        """Create REST API."""
        api_name = self.config.get_resource_name('api', include_region=False)
        opts = self.provider_manager.get_resource_options()

        self.api = aws.apigateway.RestApi(
            'main-api',
            name=api_name,
            description='Serverless REST API',
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types='REGIONAL'
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )

    def _create_resources(self):
        """Create API resources."""
        opts = self.provider_manager.get_resource_options()

        users_resource = aws.apigateway.Resource(
            'users-resource',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='users',
            opts=opts
        )

        user_id_resource = aws.apigateway.Resource(
            'user-id-resource',
            rest_api=self.api.id,
            parent_id=users_resource.id,
            path_part='{userId}',
            opts=opts
        )

        orders_resource = aws.apigateway.Resource(
            'orders-resource',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='orders',
            opts=opts
        )

        order_id_resource = aws.apigateway.Resource(
            'order-id-resource',
            rest_api=self.api.id,
            parent_id=orders_resource.id,
            path_part='{orderId}',
            opts=opts
        )

        products_resource = aws.apigateway.Resource(
            'products-resource',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='products',
            opts=opts
        )

        product_id_resource = aws.apigateway.Resource(
            'product-id-resource',
            rest_api=self.api.id,
            parent_id=products_resource.id,
            path_part='{productId}',
            opts=opts
        )

        self.resources = {
            'users': users_resource,
            'user-id': user_id_resource,
            'orders': orders_resource,
            'order-id': order_id_resource,
            'products': products_resource,
            'product-id': product_id_resource
        }

    def _create_methods_and_integrations(self):
        """Create methods and Lambda integrations with proper ARN format."""
        region = self.config.primary_region
        account_id = aws.get_caller_identity().account_id

        method_configs = [
            ('users', 'POST', 'user-service'),
            ('user-id', 'GET', 'user-service'),
            ('orders', 'POST', 'order-service'),
            ('order-id', 'GET', 'order-service'),
            ('products', 'POST', 'product-service'),
            ('product-id', 'GET', 'product-service')
        ]

        for resource_key, http_method, function_key in method_configs:
            self._create_method_and_integration(
                resource_key,
                http_method,
                function_key,
                region,
                account_id
            )

    def _create_method_and_integration(
        self,
        resource_key: str,
        http_method: str,
        function_key: str,
        region: str,
        account_id: str
    ):
        """Create a method and its Lambda integration."""
        opts = self.provider_manager.get_resource_options()
        resource = self.resources[resource_key]
        lambda_function = self.lambda_stack.get_function(function_key)

        method = aws.apigateway.Method(
            f'{http_method}-{resource_key}-method',
            rest_api=self.api.id,
            resource_id=resource.id,
            http_method=http_method,
            authorization='NONE',
            opts=opts
        )

        integration_uri = Output.all(
            region=region,
            function_arn=lambda_function.arn
        ).apply(
            lambda args: f"arn:aws:apigateway:{args['region']}:lambda:path/2015-03-31/functions/{args['function_arn']}/invocations"
        )

        integration = aws.apigateway.Integration(
            f'{http_method}-{resource_key}-integration',
            rest_api=self.api.id,
            resource_id=resource.id,
            http_method=method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=integration_uri,
            opts=opts
        )

        source_arn = Output.all(
            region=region,
            account_id=account_id,
            api_id=self.api.id
        ).apply(
            lambda args: f"arn:aws:execute-api:{args['region']}:{args['account_id']}:{args['api_id']}/*/*"
        )

        aws.lambda_.Permission(
            f'api-gateway-lambda-permission-{http_method}-{resource_key}',
            action='lambda:InvokeFunction',
            function=lambda_function.name,
            principal='apigateway.amazonaws.com',
            source_arn=source_arn,
            opts=opts
        )

        self.methods[f'{http_method}-{resource_key}'] = method
        self.integrations[f'{http_method}-{resource_key}'] = integration

    def _create_deployment_and_stage(self):
        """Create deployment and stage with X-Ray tracing."""
        opts = self.provider_manager.get_resource_options()

        # Deployment must wait for both methods and integrations
        deployment_dependencies = list(self.methods.values()) + list(self.integrations.values())

        opts_with_deps = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider(),
            depends_on=deployment_dependencies
        ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
            depends_on=deployment_dependencies
        )

        self.deployment = aws.apigateway.Deployment(
            'api-deployment',
            rest_api=self.api.id,
            opts=opts_with_deps
        )

        log_group = aws.cloudwatch.LogGroup(
            'api-gateway-logs',
            name=f"/aws/apigateway/{self.config.get_resource_name('api', include_region=False)}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.stage = aws.apigateway.Stage(
            'api-stage',
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=self.config.api_stage_name,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[log_group]
            ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
                depends_on=[log_group]
            )
        )

        # X-Ray tracing (data_trace_enabled) provides sufficient observability
        aws.apigateway.MethodSettings(
            'api-method-settings',
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path='*/*',
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                metrics_enabled=True,
                data_trace_enabled=True,
                throttling_rate_limit=self.config.api_throttle_rate_limit,
                throttling_burst_limit=self.config.api_throttle_burst_limit
            ),
            opts=opts
        )

    def _create_usage_plan(self):
        """Create usage plan for rate limiting."""
        opts = self.provider_manager.get_resource_options()

        usage_plan = aws.apigateway.UsagePlan(
            'api-usage-plan',
            name=self.config.get_resource_name('usage-plan', include_region=False),
            description='Usage plan for API rate limiting',
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
            tags=self.config.get_common_tags(),
            opts=opts
        )

    def get_api_url(self) -> Output[str]:
        """
        Get the API Gateway URL.

        Returns:
            API URL as Output
        """
        return Output.all(
            api_id=self.api.id,
            region=self.config.primary_region,
            stage_name=self.stage.stage_name
        ).apply(
            lambda args: f"https://{args['api_id']}.execute-api.{args['region']}.amazonaws.com/{args['stage_name']}"
        )

    def get_api_id(self) -> Output[str]:
        """
        Get the API Gateway ID.

        Returns:
            API ID as Output
        """
        return self.api.id


```

## File: lib\infrastructure\aws_provider.py

```python
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
    drift in CI/CD pipelines.
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

    def get_resource_options(self) -> pulumi.ResourceOptions:
        """
        Get ResourceOptions with the provider attached.

        Returns:
            ResourceOptions with provider or empty options
        """
        provider = self.get_provider()
        if provider:
            return pulumi.ResourceOptions(provider=provider)
        return pulumi.ResourceOptions()


```

## File: lib\infrastructure\cloudfront.py

```python
"""
CloudFront module for CDN distribution management.

This module creates CloudFront distributions with S3 origins,
geo-restrictions, and HTTPS-only access.
"""

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .s3 import S3Stack


class CloudFrontStack:
    """
    Manages CloudFront distributions.

    Creates distributions with S3 origins, configurable geo-restrictions,
    and HTTPS enforcement.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        s3_stack: S3Stack
    ):
        """
        Initialize the CloudFront stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            s3_stack: S3Stack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.s3_stack = s3_stack
        self.distributions = {}
        self.oais = {}

        self._create_content_distribution()

    def _create_content_distribution(self):
        """Create CloudFront distribution for static content."""
        opts = self.provider_manager.get_resource_options()

        oai = aws.cloudfront.OriginAccessIdentity(
            'content-oai',
            comment='OAI for content bucket',
            opts=opts
        )

        self.oais['content'] = oai

        content_bucket = self.s3_stack.get_bucket('content')

        bucket_policy = pulumi.Output.all(
            bucket_name=content_bucket.id,
            oai_arn=oai.iam_arn
        ).apply(lambda args: {
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Principal": {
                    "AWS": args['oai_arn']
                },
                "Action": "s3:GetObject",
                "Resource": f"arn:aws:s3:::{args['bucket_name']}/*"
            }]
        })

        aws.s3.BucketPolicy(
            'content-bucket-policy',
            bucket=content_bucket.id,
            policy=bucket_policy.apply(lambda p: pulumi.Output.json_dumps(p)),
            opts=opts
        )

        distribution = aws.cloudfront.Distribution(
            'content-distribution',
            enabled=True,
            is_ipv6_enabled=True,
            comment='Content distribution',
            default_root_object='index.html',
            origins=[
                aws.cloudfront.DistributionOriginArgs(
                    domain_name=content_bucket.bucket_regional_domain_name,
                    origin_id='S3-content',
                    s3_origin_config=aws.cloudfront.DistributionOriginS3OriginConfigArgs(
                        origin_access_identity=oai.cloudfront_access_identity_path
                    )
                )
            ],
            default_cache_behavior=aws.cloudfront.DistributionDefaultCacheBehaviorArgs(
                allowed_methods=['GET', 'HEAD', 'OPTIONS'],
                cached_methods=['GET', 'HEAD'],
                target_origin_id='S3-content',
                viewer_protocol_policy='redirect-to-https',
                compress=True,
                forwarded_values=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesArgs(
                    query_string=False,
                    cookies=aws.cloudfront.DistributionDefaultCacheBehaviorForwardedValuesCookiesArgs(
                        forward='none'
                    )
                ),
                min_ttl=0,
                default_ttl=3600,
                max_ttl=86400
            ),
            restrictions=aws.cloudfront.DistributionRestrictionsArgs(
                geo_restriction=aws.cloudfront.DistributionRestrictionsGeoRestrictionArgs(
                    restriction_type=self.config.cloudfront_geo_restriction_type,
                    locations=self.config.cloudfront_geo_locations
                )
            ),
            viewer_certificate=aws.cloudfront.DistributionViewerCertificateArgs(
                cloudfront_default_certificate=True
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.distributions['content'] = distribution

    def get_distribution(self, dist_key: str) -> aws.cloudfront.Distribution:
        """
        Get a distribution by key.

        Args:
            dist_key: Key of the distribution

        Returns:
            CloudFront Distribution resource
        """
        return self.distributions.get(dist_key)

    def get_distribution_domain_name(self, dist_key: str) -> pulumi.Output[str]:
        """
        Get the domain name of a distribution.

        Args:
            dist_key: Key of the distribution

        Returns:
            Distribution domain name as Output
        """
        dist = self.get_distribution(dist_key)
        return dist.domain_name if dist else None


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
from typing import Dict


@dataclass
class ServerlessConfig:
    """Centralized configuration for the serverless infrastructure."""

    environment: str
    environment_suffix: str
    project_name: str

    primary_region: str
    normalized_region: str

    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    lambda_reserved_concurrency: int

    api_throttle_rate_limit: int
    api_throttle_burst_limit: int
    api_stage_name: str

    dynamodb_read_capacity: int
    dynamodb_write_capacity: int

    s3_lifecycle_expiration_days: int
    s3_event_prefix: str
    s3_event_suffix: str

    cloudfront_geo_restriction_type: str
    cloudfront_geo_locations: list

    log_retention_days: int
    enable_xray_tracing: bool
    enable_contributor_insights: bool

    dlq_max_receive_count: int

    team: str
    application: str
    cost_center: str

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'Production')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'dev')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless')

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)

        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '30'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '512'))
        self.lambda_reserved_concurrency = int(os.getenv('LAMBDA_RESERVED_CONCURRENCY', '5'))

        self.api_throttle_rate_limit = int(os.getenv('API_THROTTLE_RATE_LIMIT', '1000'))
        self.api_throttle_burst_limit = int(os.getenv('API_THROTTLE_BURST_LIMIT', '200'))
        self.api_stage_name = os.getenv('API_STAGE_NAME', 'prod')

        self.dynamodb_read_capacity = int(os.getenv('DYNAMODB_READ_CAPACITY', '5'))
        self.dynamodb_write_capacity = int(os.getenv('DYNAMODB_WRITE_CAPACITY', '5'))

        self.s3_lifecycle_expiration_days = int(os.getenv('S3_LIFECYCLE_EXPIRATION_DAYS', '30'))
        self.s3_event_prefix = os.getenv('S3_EVENT_PREFIX', 'incoming/')
        self.s3_event_suffix = os.getenv('S3_EVENT_SUFFIX', '.csv')

        self.cloudfront_geo_restriction_type = os.getenv('CLOUDFRONT_GEO_RESTRICTION_TYPE', 'whitelist')
        geo_locations_str = os.getenv('CLOUDFRONT_GEO_LOCATIONS', 'US,CA,GB')
        self.cloudfront_geo_locations = [loc.strip() for loc in geo_locations_str.split(',')]

        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'
        self.enable_contributor_insights = os.getenv('ENABLE_CONTRIBUTOR_INSIGHTS', 'true').lower() == 'true'

        self.dlq_max_receive_count = int(os.getenv('DLQ_MAX_RECEIVE_COUNT', '3'))

        self.team = os.getenv('TEAM', 'platform')
        self.application = os.getenv('APPLICATION', 'serverless-app')
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
            'Project': self.project_name
        }


```

## File: lib\infrastructure\dynamodb.py

```python
"""
DynamoDB module for table management.

This module creates DynamoDB tables with on-demand capacity, proper schemas,
Contributor Insights, and KMS encryption.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class DynamoDBStack:
    """
    Manages DynamoDB tables.

    Creates tables with on-demand capacity, proper schemas, Contributor Insights,
    and KMS encryption for data at rest.
    """

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
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.tables: Dict[str, aws.dynamodb.Table] = {}
        self.contributor_insights: Dict[str, aws.dynamodb.ContributorInsights] = {}

        self._create_users_table()
        self._create_orders_table()
        self._create_products_table()

    def _create_users_table(self):
        """Create users table with userId as partition key."""
        table_name = self.config.get_resource_name('users-table', include_region=False)
        opts = self.provider_manager.get_resource_options()

        table = aws.dynamodb.Table(
            'users-table',
            name=table_name,
            billing_mode='PAY_PER_REQUEST',
            hash_key='userId',
            attributes=[
                aws.dynamodb.TableAttributeArgs(name='userId', type='S'),
                aws.dynamodb.TableAttributeArgs(name='email', type='S')
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='email-index',
                    hash_key='email',
                    projection_type='ALL'
                )
            ],
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_stack.get_key_arn('data')
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.tables['users'] = table

        if self.config.enable_contributor_insights:
            self._enable_contributor_insights('users', table.name)

    def _create_orders_table(self):
        """Create orders table with orderId as partition key."""
        table_name = self.config.get_resource_name('orders-table', include_region=False)
        opts = self.provider_manager.get_resource_options()

        table = aws.dynamodb.Table(
            'orders-table',
            name=table_name,
            billing_mode='PAY_PER_REQUEST',
            hash_key='orderId',
            attributes=[
                aws.dynamodb.TableAttributeArgs(name='orderId', type='S'),
                aws.dynamodb.TableAttributeArgs(name='userId', type='S'),
                aws.dynamodb.TableAttributeArgs(name='status', type='S')
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='userId-index',
                    hash_key='userId',
                    projection_type='ALL'
                ),
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='status-index',
                    hash_key='status',
                    projection_type='ALL'
                )
            ],
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_stack.get_key_arn('data')
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.tables['orders'] = table

        if self.config.enable_contributor_insights:
            self._enable_contributor_insights('orders', table.name)

    def _create_products_table(self):
        """Create products table with productId as partition key."""
        table_name = self.config.get_resource_name('products-table', include_region=False)
        opts = self.provider_manager.get_resource_options()

        table = aws.dynamodb.Table(
            'products-table',
            name=table_name,
            billing_mode='PAY_PER_REQUEST',
            hash_key='productId',
            attributes=[
                aws.dynamodb.TableAttributeArgs(name='productId', type='S'),
                aws.dynamodb.TableAttributeArgs(name='category', type='S')
            ],
            global_secondary_indexes=[
                aws.dynamodb.TableGlobalSecondaryIndexArgs(
                    name='category-index',
                    hash_key='category',
                    projection_type='ALL'
                )
            ],
            server_side_encryption=aws.dynamodb.TableServerSideEncryptionArgs(
                enabled=True,
                kms_key_arn=self.kms_stack.get_key_arn('data')
            ),
            point_in_time_recovery=aws.dynamodb.TablePointInTimeRecoveryArgs(
                enabled=True
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.tables['products'] = table

        if self.config.enable_contributor_insights:
            self._enable_contributor_insights('products', table.name)

    def _enable_contributor_insights(self, table_key: str, table_name: pulumi.Output[str]):
        """
        Enable Contributor Insights for a table.

        Args:
            table_key: Key to store the insights resource
            table_name: Table name as Output
        """
        opts = self.provider_manager.get_resource_options()

        insights = aws.dynamodb.ContributorInsights(
            f'{table_key}-contributor-insights',
            table_name=table_name,
            opts=opts
        )

        self.contributor_insights[table_key] = insights

    def get_table(self, table_name: str) -> aws.dynamodb.Table:
        """
        Get a table by name.

        Args:
            table_name: Name of the table

        Returns:
            DynamoDB Table resource
        """
        return self.tables.get(table_name)

    def get_table_name(self, table_name: str) -> pulumi.Output[str]:
        """
        Get the name of a table.

        Args:
            table_name: Key of the table

        Returns:
            Table name as Output
        """
        table = self.get_table(table_name)
        return table.name if table else None

    def get_table_arn(self, table_name: str) -> pulumi.Output[str]:
        """
        Get the ARN of a table.

        Args:
            table_name: Key of the table

        Returns:
            Table ARN as Output
        """
        table = self.get_table(table_name)
        return table.arn if table else None


```

## File: lib\infrastructure\iam.py

```python
"""
IAM module for role and policy management.

This module creates IAM roles and policies with least-privilege principles,
proper scoping, and correct Pulumi Output handling.
"""

import json
from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class IAMStack:
    """
    Manages IAM roles and policies.

    Creates roles with least-privilege policies, proper ARN scoping,
    and correct Output handling to avoid nested Output issues.
    """

    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the IAM stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
        self.account_id: str = aws.get_caller_identity().account_id

    def create_lambda_role(
        self,
        role_name: str,
        dynamodb_table_arns: List[Output[str]] = None,
        sqs_queue_arns: List[Output[str]] = None,
        kms_key_arns: List[Output[str]] = None,
        secrets_arns: List[Output[str]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create an IAM role for Lambda with least-privilege permissions.

        Args:
            role_name: Name of the role
            dynamodb_table_arns: List of DynamoDB table ARNs
            sqs_queue_arns: List of SQS queue ARNs
            kms_key_arns: List of KMS key ARNs
            secrets_arns: List of Secrets Manager ARNs
            enable_xray: Whether to enable X-Ray tracing

        Returns:
            IAM Role resource
        """
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }]
        })

        opts = self.provider_manager.get_resource_options()

        role = aws.iam.Role(
            f"lambda-role-{role_name}",
            assume_role_policy=assume_role_policy,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self._attach_cloudwatch_logs_policy(role, role_name)

        if dynamodb_table_arns:
            self._attach_dynamodb_policy(role, role_name, dynamodb_table_arns)

        if sqs_queue_arns:
            self._attach_sqs_policy(role, role_name, sqs_queue_arns)

        if kms_key_arns:
            self._attach_kms_policy(role, role_name, kms_key_arns)

        if secrets_arns:
            self._attach_secrets_policy(role, role_name, secrets_arns)

        if enable_xray:
            self._attach_xray_policy(role, role_name)

        self.roles[role_name] = role
        return role

    def _attach_cloudwatch_logs_policy(self, role: aws.iam.Role, role_name: str):
        """Attach CloudWatch Logs policy with scoped permissions."""
        region = self.config.primary_region
        log_group_name = f"/aws/lambda/{self.config.get_resource_name(role_name)}"

        policy_document = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": ["logs:CreateLogGroup"],
                    "Resource": f"arn:aws:logs:{region}:{self.account_id}:*"
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": f"arn:aws:logs:{region}:{self.account_id}:log-group:{log_group_name}:*"
                }
            ]
        })

        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-logs-policy",
            role=role.id,
            policy=policy_document,
            opts=self.provider_manager.get_resource_options()
        )

    def _attach_dynamodb_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        table_arns: List[Output[str]]
    ):
        """Attach DynamoDB policy with scoped table ARNs."""
        def create_policy(arns):
            resources = []
            for arn in arns:
                resources.append(arn)
                resources.append(f"{arn}/index/*")

            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan",
                        "dynamodb:BatchGetItem",
                        "dynamodb:BatchWriteItem"
                    ],
                    "Resource": resources
                }]
            })

        policy = Output.all(*table_arns).apply(create_policy)

        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-dynamodb-policy",
            role=role.id,
            policy=policy,
            opts=self.provider_manager.get_resource_options()
        )

    def _attach_sqs_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        queue_arns: List[Output[str]]
    ):
        """Attach SQS policy with scoped queue ARNs."""
        def create_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "sqs:SendMessage",
                        "sqs:GetQueueAttributes"
                    ],
                    "Resource": list(arns)
                }]
            })

        policy = Output.all(*queue_arns).apply(create_policy)

        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-sqs-policy",
            role=role.id,
            policy=policy,
            opts=self.provider_manager.get_resource_options()
        )

    def _attach_kms_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        key_arns: List[Output[str]]
    ):
        """Attach KMS policy with scoped key ARNs."""
        def create_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey"
                    ],
                    "Resource": list(arns)
                }]
            })

        policy = Output.all(*key_arns).apply(create_policy)

        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-kms-policy",
            role=role.id,
            policy=policy,
            opts=self.provider_manager.get_resource_options()
        )

    def _attach_secrets_policy(
        self,
        role: aws.iam.Role,
        role_name: str,
        secret_arns: List[Output[str]]
    ):
        """Attach Secrets Manager policy with scoped secret ARNs."""
        def create_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["secretsmanager:GetSecretValue"],
                    "Resource": list(arns)
                }]
            })

        policy = Output.all(*secret_arns).apply(create_policy)

        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-secrets-policy",
            role=role.id,
            policy=policy,
            opts=self.provider_manager.get_resource_options()
        )

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

        aws.iam.RolePolicy(
            f"lambda-role-{role_name}-xray-policy",
            role=role.id,
            policy=policy_document,
            opts=self.provider_manager.get_resource_options()
        )

    def create_step_functions_role(
        self,
        role_name: str,
        lambda_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create an IAM role for Step Functions.

        Args:
            role_name: Name of the role
            lambda_arns: List of Lambda function ARNs to invoke

        Returns:
            IAM Role resource
        """
        assume_role_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "states.amazonaws.com"
                }
            }]
        })

        opts = self.provider_manager.get_resource_options()

        role = aws.iam.Role(
            f"step-functions-role-{role_name}",
            assume_role_policy=assume_role_policy,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        def create_lambda_policy(arns):
            return json.dumps({
                "Version": "2012-10-17",
                "Statement": [{
                    "Effect": "Allow",
                    "Action": ["lambda:InvokeFunction"],
                    "Resource": list(arns)
                }]
            })

        policy = Output.all(*lambda_arns).apply(create_lambda_policy)

        aws.iam.RolePolicy(
            f"step-functions-role-{role_name}-lambda-policy",
            role=role.id,
            policy=policy,
            opts=opts
        )

        region = self.config.primary_region
        logs_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [{
                "Effect": "Allow",
                "Action": [
                    "logs:CreateLogDelivery",
                    "logs:GetLogDelivery",
                    "logs:UpdateLogDelivery",
                    "logs:DeleteLogDelivery",
                    "logs:ListLogDeliveries",
                    "logs:PutResourcePolicy",
                    "logs:DescribeResourcePolicies",
                    "logs:DescribeLogGroups"
                ],
                "Resource": "*"
            }]
        })

        aws.iam.RolePolicy(
            f"step-functions-role-{role_name}-logs-policy",
            role=role.id,
            policy=logs_policy,
            opts=opts
        )

        self.roles[role_name] = role
        return role

    def get_role(self, role_name: str) -> aws.iam.Role:
        """
        Get a role by name.

        Args:
            role_name: Name of the role

        Returns:
            IAM Role resource
        """
        return self.roles.get(role_name)


```

## File: lib\infrastructure\kms.py

```python
"""
KMS module for encryption key management.

This module creates and manages KMS keys for encrypting data at rest
across all services with automatic key rotation enabled.
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class KMSStack:
    """
    Manages KMS keys for encryption at rest.

    Creates KMS keys with automatic rotation enabled and proper key policies.
    """

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
        self.aliases: Dict[str, aws.kms.Alias] = {}

        self._create_data_key()

    def _create_data_key(self):
        """Create KMS key for general data encryption."""
        account_id = aws.get_caller_identity().account_id
        region = self.config.primary_region

        key_policy = json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "Enable IAM User Permissions",
                    "Effect": "Allow",
                    "Principal": {
                        "AWS": f"arn:aws:iam::{account_id}:root"
                    },
                    "Action": "kms:*",
                    "Resource": "*"
                },
                {
                    "Sid": "Allow services to use the key",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": [
                            "lambda.amazonaws.com",
                            "dynamodb.amazonaws.com",
                            "s3.amazonaws.com",
                            "secretsmanager.amazonaws.com",
                            "sqs.amazonaws.com"
                        ]
                    },
                    "Action": [
                        "kms:Decrypt",
                        "kms:GenerateDataKey",
                        "kms:CreateGrant"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "StringEquals": {
                            "kms:ViaService": [
                                f"dynamodb.{region}.amazonaws.com",
                                f"s3.{region}.amazonaws.com",
                                f"secretsmanager.{region}.amazonaws.com",
                                f"sqs.{region}.amazonaws.com"
                            ]
                        }
                    }
                },
                {
                    "Sid": "Allow CloudWatch Logs",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": f"logs.{region}.amazonaws.com"
                    },
                    "Action": [
                        "kms:Encrypt",
                        "kms:Decrypt",
                        "kms:ReEncrypt*",
                        "kms:GenerateDataKey*",
                        "kms:CreateGrant",
                        "kms:DescribeKey"
                    ],
                    "Resource": "*",
                    "Condition": {
                        "ArnLike": {
                            "kms:EncryptionContext:aws:logs:arn": f"arn:aws:logs:{region}:{account_id}:log-group:*"
                        }
                    }
                }
            ]
        })

        opts = self.provider_manager.get_resource_options()

        key = aws.kms.Key(
            'data-encryption-key',
            description='KMS key for encrypting data at rest',
            deletion_window_in_days=10,
            enable_key_rotation=True,
            policy=key_policy,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        alias = aws.kms.Alias(
            'data-encryption-key-alias',
            name=f"alias/{self.config.get_resource_name('data-key', include_region=False)}",
            target_key_id=key.id,
            opts=opts
        )

        self.keys['data'] = key
        self.aliases['data'] = alias

    def get_key(self, key_name: str) -> aws.kms.Key:
        """
        Get a KMS key by name.

        Args:
            key_name: Name of the key

        Returns:
            KMS Key resource
        """
        return self.keys.get(key_name)

    def get_key_arn(self, key_name: str) -> pulumi.Output[str]:
        """
        Get the ARN of a KMS key.

        Args:
            key_name: Name of the key

        Returns:
            Key ARN as Output
        """
        key = self.get_key(key_name)
        return key.arn if key else None

    def get_key_id(self, key_name: str) -> pulumi.Output[str]:
        """
        Get the ID of a KMS key.

        Args:
            key_name: Name of the key

        Returns:
            Key ID as Output
        """
        key = self.get_key(key_name)
        return key.id if key else None


```

## File: lib\infrastructure\lambda_functions.py

```python
"""
Lambda Functions module.

This module creates Lambda functions with proper DLQ attachment,
X-Ray tracing, sizing, and concurrency limits.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import FileArchive

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .dynamodb import DynamoDBStack
from .iam import IAMStack
from .kms import KMSStack
from .secrets import SecretsStack
from .sqs import SQSStack


class LambdaStack:
    """
    Manages Lambda functions.

    Creates Lambda functions with proper DLQ attachment, X-Ray tracing,
    sizing, concurrency, and CloudWatch Logs retention.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        dynamodb_stack: DynamoDBStack,
        sqs_stack: SQSStack,
        kms_stack: KMSStack,
        secrets_stack: SecretsStack
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            dynamodb_stack: DynamoDBStack instance
            sqs_stack: SQSStack instance
            kms_stack: KMSStack instance
            secrets_stack: SecretsStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.dynamodb_stack = dynamodb_stack
        self.sqs_stack = sqs_stack
        self.kms_stack = kms_stack
        self.secrets_stack = secrets_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}

        self._create_user_service()
        self._create_order_service()
        self._create_product_service()

    def _get_lambda_code_path(self) -> str:
        """Get the path to Lambda function code directory."""
        current_dir = os.path.dirname(__file__)
        return os.path.join(current_dir, 'lambda_code')

    def _create_user_service(self):
        """Create user service Lambda function."""
        function_name = 'user-service'

        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('users')],
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('user-service')],
            kms_key_arns=[self.kms_stack.get_key_arn('data')],
            secrets_arns=[self.secrets_stack.get_secret_arn('api')],
            enable_xray=self.config.enable_xray_tracing
        )

        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f"/aws/lambda/{resource_name}"

        opts = self.provider_manager.get_resource_options()

        log_group = aws.cloudwatch.LogGroup(
            f"{function_name}-logs",
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            kms_key_id=self.kms_stack.get_key_arn('data'),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.log_groups[function_name] = log_group

        code_path = self._get_lambda_code_path()

        opts_with_deps = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider(),
            depends_on=[role, log_group]
        ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
            depends_on=[role, log_group]
        )

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='user_service.handler',
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'USERS_TABLE_NAME': self.dynamodb_stack.get_table_name('users'),
                    'API_SECRET_ARN': self.secrets_stack.get_secret_arn('api')
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_queue_arn('user-service')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=opts_with_deps
        )

        self.functions[function_name] = function

    def _create_order_service(self):
        """Create order service Lambda function."""
        function_name = 'order-service'

        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('orders')],
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('order-service')],
            kms_key_arns=[self.kms_stack.get_key_arn('data')],
            enable_xray=self.config.enable_xray_tracing
        )

        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f"/aws/lambda/{resource_name}"

        opts = self.provider_manager.get_resource_options()

        log_group = aws.cloudwatch.LogGroup(
            f"{function_name}-logs",
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            kms_key_id=self.kms_stack.get_key_arn('data'),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.log_groups[function_name] = log_group

        code_path = self._get_lambda_code_path()

        opts_with_deps = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider(),
            depends_on=[role, log_group]
        ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
            depends_on=[role, log_group]
        )

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='order_service.handler',
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'ORDERS_TABLE_NAME': self.dynamodb_stack.get_table_name('orders')
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_queue_arn('order-service')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=opts_with_deps
        )

        self.functions[function_name] = function

    def _create_product_service(self):
        """Create product service Lambda function."""
        function_name = 'product-service'

        role = self.iam_stack.create_lambda_role(
            function_name,
            dynamodb_table_arns=[self.dynamodb_stack.get_table_arn('products')],
            sqs_queue_arns=[self.sqs_stack.get_queue_arn('product-service')],
            kms_key_arns=[self.kms_stack.get_key_arn('data')],
            enable_xray=self.config.enable_xray_tracing
        )

        resource_name = self.config.get_resource_name(function_name)
        log_group_name = f"/aws/lambda/{resource_name}"

        opts = self.provider_manager.get_resource_options()

        log_group = aws.cloudwatch.LogGroup(
            f"{function_name}-logs",
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            kms_key_id=self.kms_stack.get_key_arn('data'),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.log_groups[function_name] = log_group

        code_path = self._get_lambda_code_path()

        opts_with_deps = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider(),
            depends_on=[role, log_group]
        ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
            depends_on=[role, log_group]
        )


        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='product_service.handler',
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'PRODUCTS_TABLE_NAME': self.dynamodb_stack.get_table_name('products')
                }
            ),
            dead_letter_config=aws.lambda_.FunctionDeadLetterConfigArgs(
                target_arn=self.sqs_stack.get_queue_arn('product-service')
            ),
            tracing_config=aws.lambda_.FunctionTracingConfigArgs(
                mode='Active' if self.config.enable_xray_tracing else 'PassThrough'
            ),
            tags=self.config.get_common_tags(),
            opts=opts_with_deps
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

    def get_function_name(self, function_name: str) -> pulumi.Output[str]:
        """
        Get the name of a Lambda function.

        Args:
            function_name: Key of the function

        Returns:
            Function name as Output
        """
        function = self.get_function(function_name)
        return function.name if function else None

    def get_function_arn(self, function_name: str) -> pulumi.Output[str]:
        """
        Get the ARN of a Lambda function.

        Args:
            function_name: Key of the function

        Returns:
            Function ARN as Output
        """
        function = self.get_function(function_name)
        return function.arn if function else None

    def get_log_group_name(self, function_name: str) -> pulumi.Output[str]:
        """
        Get the CloudWatch log group name for a function.

        Args:
            function_name: Key of the function

        Returns:
            Log group name as Output
        """
        log_group = self.log_groups.get(function_name)
        return log_group.name if log_group else None


```

## File: lib\infrastructure\monitoring.py

```python
"""
Monitoring module.

This module creates CloudWatch alarms with proper metric math
for percentage-based thresholds (e.g., error rates).
"""

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .lambda_functions import LambdaStack
from .step_functions import StepFunctionsStack


class MonitoringStack:
    """
    Manages CloudWatch alarms and monitoring.

    Creates alarms with metric math expressions for percentage-based
    thresholds instead of absolute counts.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack,
        step_functions_stack: StepFunctionsStack = None
    ):
        """
        Initialize the Monitoring stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
            step_functions_stack: StepFunctionsStack instance (optional)
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.step_functions_stack = step_functions_stack
        self.alarms = {}

        self._create_lambda_alarms()
        if step_functions_stack:
            self._create_step_functions_alarms()

    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions."""
        function_names = ['user-service', 'order-service', 'product-service']

        for function_name in function_names:
            self._create_lambda_error_rate_alarm(function_name)
            self._create_lambda_throttle_alarm(function_name)
            self._create_lambda_duration_alarm(function_name)

    def _create_lambda_error_rate_alarm(self, function_name: str):
        """
        Create error rate alarm using metric math for percentage calculation.

        Args:
            function_name: Name of the Lambda function
        """
        lambda_function = self.lambda_stack.get_function(function_name)
        alarm_name = self.config.get_resource_name(f'{function_name}-error-rate', include_region=False)
        opts = self.provider_manager.get_resource_options()

        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-error-rate-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            threshold=1.0,
            alarm_description=f'Alarm when {function_name} error rate exceeds 1%',
            treat_missing_data='notBreaching',
            metric_queries=[
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='errors',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='Errors',
                        namespace='AWS/Lambda',
                        period=60,
                        stat='Sum',
                        dimensions={
                            'FunctionName': lambda_function.name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='invocations',
                    metric=aws.cloudwatch.MetricAlarmMetricQueryMetricArgs(
                        metric_name='Invocations',
                        namespace='AWS/Lambda',
                        period=60,
                        stat='Sum',
                        dimensions={
                            'FunctionName': lambda_function.name
                        }
                    ),
                    return_data=False
                ),
                aws.cloudwatch.MetricAlarmMetricQueryArgs(
                    id='error_rate',
                    expression='IF(invocations > 0, (errors / invocations) * 100, 0)',
                    label='Error Rate (%)',
                    return_data=True
                )
            ],
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.alarms[f'{function_name}-error-rate'] = alarm

    def _create_lambda_throttle_alarm(self, function_name: str):
        """
        Create throttle alarm for Lambda function.

        Args:
            function_name: Name of the Lambda function
        """
        lambda_function = self.lambda_stack.get_function(function_name)
        alarm_name = self.config.get_resource_name(f'{function_name}-throttles', include_region=False)
        opts = self.provider_manager.get_resource_options()

        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-throttle-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='Throttles',
            namespace='AWS/Lambda',
            period=60,
            statistic='Sum',
            threshold=0,
            alarm_description=f'Alarm when {function_name} is throttled',
            treat_missing_data='notBreaching',
            dimensions={
                'FunctionName': lambda_function.name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.alarms[f'{function_name}-throttles'] = alarm

    def _create_lambda_duration_alarm(self, function_name: str):
        """
        Create duration alarm for Lambda function.

        Args:
            function_name: Name of the Lambda function
        """
        lambda_function = self.lambda_stack.get_function(function_name)
        alarm_name = self.config.get_resource_name(f'{function_name}-duration', include_region=False)
        opts = self.provider_manager.get_resource_options()

        threshold_ms = (self.config.lambda_timeout - 5) * 1000

        alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-duration-alarm',
            name=alarm_name,
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=2,
            metric_name='Duration',
            namespace='AWS/Lambda',
            period=60,
            statistic='Maximum',
            threshold=threshold_ms,
            alarm_description=f'Alarm when {function_name} duration approaches timeout',
            treat_missing_data='notBreaching',
            dimensions={
                'FunctionName': lambda_function.name
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.alarms[f'{function_name}-duration'] = alarm

    def _create_step_functions_alarms(self):
        """Create CloudWatch alarms for Step Functions."""
        if not self.step_functions_stack:
            return

        workflow_name = 'order-workflow'
        state_machine = self.step_functions_stack.get_state_machine(workflow_name)

        if not state_machine:
            return

        opts = self.provider_manager.get_resource_options()

        failed_alarm = aws.cloudwatch.MetricAlarm(
            f'{workflow_name}-failed-alarm',
            name=self.config.get_resource_name(f'{workflow_name}-failed', include_region=False),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='ExecutionsFailed',
            namespace='AWS/States',
            period=60,
            statistic='Sum',
            threshold=0,
            alarm_description=f'Alarm when {workflow_name} executions fail',
            treat_missing_data='notBreaching',
            dimensions={
                'StateMachineArn': state_machine.arn
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.alarms[f'{workflow_name}-failed'] = failed_alarm

        timeout_alarm = aws.cloudwatch.MetricAlarm(
            f'{workflow_name}-timeout-alarm',
            name=self.config.get_resource_name(f'{workflow_name}-timeout', include_region=False),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='ExecutionsTimedOut',
            namespace='AWS/States',
            period=60,
            statistic='Sum',
            threshold=0,
            alarm_description=f'Alarm when {workflow_name} executions timeout',
            treat_missing_data='notBreaching',
            dimensions={
                'StateMachineArn': state_machine.arn
            },
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.alarms[f'{workflow_name}-timeout'] = timeout_alarm

    def get_alarm(self, alarm_name: str) -> aws.cloudwatch.MetricAlarm:
        """
        Get an alarm by name.

        Args:
            alarm_name: Name of the alarm

        Returns:
            CloudWatch MetricAlarm resource
        """
        return self.alarms.get(alarm_name)


```

## File: lib\infrastructure\s3.py

```python
"""
S3 module for bucket management.

This module creates S3 buckets with KMS encryption, lifecycle rules,
and proper event notifications for Lambda triggers.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class S3Stack:
    """
    Manages S3 buckets.

    Creates buckets with KMS encryption, lifecycle rules, versioning,
    and event notifications with correct prefix/suffix filters.
    """

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
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.buckets: Dict[str, aws.s3.Bucket] = {}
        self.bucket_policies: Dict[str, aws.s3.BucketPolicy] = {}

        self._create_content_bucket()
        self._create_data_bucket()

    def _create_content_bucket(self):
        """Create S3 bucket for static content (CloudFront origin)."""
        bucket_name = self.config.get_normalized_resource_name('content', include_region=True)
        opts = self.provider_manager.get_resource_options()

        bucket = aws.s3.Bucket(
            'content-bucket',
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        aws.s3.BucketVersioning(
            'content-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=opts
        )

        aws.s3.BucketServerSideEncryptionConfiguration(
            'content-bucket-encryption',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='aws:kms',
                        kms_master_key_id=self.kms_stack.get_key_id('data')
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=opts
        )

        aws.s3.BucketPublicAccessBlock(
            'content-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=opts
        )

        self.buckets['content'] = bucket

    def _create_data_bucket(self):
        """Create S3 bucket for data processing with lifecycle rules."""
        bucket_name = self.config.get_normalized_resource_name('data', include_region=True)
        opts = self.provider_manager.get_resource_options()

        bucket = aws.s3.Bucket(
            'data-bucket',
            bucket=bucket_name,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        aws.s3.BucketVersioning(
            'data-bucket-versioning',
            bucket=bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=opts
        )

        aws.s3.BucketServerSideEncryptionConfiguration(
            'data-bucket-encryption',
            bucket=bucket.id,
            rules=[
                aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                    apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                        sse_algorithm='aws:kms',
                        kms_master_key_id=self.kms_stack.get_key_id('data')
                    ),
                    bucket_key_enabled=True
                )
            ],
            opts=opts
        )

        aws.s3.BucketLifecycleConfiguration(
            'data-bucket-lifecycle',
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
                    )
                )
            ],
            opts=opts
        )

        aws.s3.BucketPublicAccessBlock(
            'data-bucket-public-access-block',
            bucket=bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=opts
        )

        self.buckets['data'] = bucket

    def add_lambda_notification(
        self,
        bucket_key: str,
        lambda_function_arn: pulumi.Output[str],
        events: list = None,
        filter_prefix: str = None,
        filter_suffix: str = None
    ):
        """
        Add Lambda notification to a bucket.

        Args:
            bucket_key: Key of the bucket
            lambda_function_arn: Lambda function ARN
            events: List of S3 events (default: ['s3:ObjectCreated:*'])
            filter_prefix: Prefix filter for objects
            filter_suffix: Suffix filter for objects
        """
        if events is None:
            events = ['s3:ObjectCreated:*']

        bucket = self.get_bucket(bucket_key)
        if not bucket:
            return

        opts = self.provider_manager.get_resource_options()

        filter_rules = []
        if filter_prefix:
            filter_rules.append(aws.s3.BucketNotificationLambdaFunctionFilterRuleArgs(
                name='prefix',
                value=filter_prefix
            ))
        if filter_suffix:
            filter_rules.append(aws.s3.BucketNotificationLambdaFunctionFilterRuleArgs(
                name='suffix',
                value=filter_suffix
            ))

        lambda_function_config = aws.s3.BucketNotificationLambdaFunctionArgs(
            lambda_function_arn=lambda_function_arn,
            events=events
        )

        if filter_rules:
            lambda_function_config = aws.s3.BucketNotificationLambdaFunctionArgs(
                lambda_function_arn=lambda_function_arn,
                events=events,
                filter_prefix=filter_prefix,
                filter_suffix=filter_suffix
            )

        aws.s3.BucketNotification(
            f'{bucket_key}-bucket-notification',
            bucket=bucket.id,
            lambda_functions=[lambda_function_config],
            opts=opts
        )

    def get_bucket(self, bucket_key: str) -> aws.s3.Bucket:
        """
        Get a bucket by key.

        Args:
            bucket_key: Key of the bucket

        Returns:
            S3 Bucket resource
        """
        return self.buckets.get(bucket_key)

    def get_bucket_name(self, bucket_key: str) -> pulumi.Output[str]:
        """
        Get the name of a bucket.

        Args:
            bucket_key: Key of the bucket

        Returns:
            Bucket name as Output
        """
        bucket = self.get_bucket(bucket_key)
        return bucket.bucket if bucket else None

    def get_bucket_arn(self, bucket_key: str) -> pulumi.Output[str]:
        """
        Get the ARN of a bucket.

        Args:
            bucket_key: Key of the bucket

        Returns:
            Bucket ARN as Output
        """
        bucket = self.get_bucket(bucket_key)
        return bucket.arn if bucket else None

    def get_bucket_domain_name(self, bucket_key: str) -> pulumi.Output[str]:
        """
        Get the regional domain name of a bucket.

        Args:
            bucket_key: Key of the bucket

        Returns:
            Bucket regional domain name as Output
        """
        bucket = self.get_bucket(bucket_key)
        return bucket.bucket_regional_domain_name if bucket else None


```

## File: lib\infrastructure\secrets.py

```python
"""
Secrets Manager module for secure secret storage.

This module creates and manages AWS Secrets Manager secrets with KMS encryption
for secure injection into Lambda environment variables.
"""

import json
from typing import Dict

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class SecretsStack:
    """
    Manages AWS Secrets Manager secrets.

    Creates secrets with KMS encryption for secure storage and retrieval.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        kms_stack: KMSStack
    ):
        """
        Initialize the Secrets stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.secrets: Dict[str, aws.secretsmanager.Secret] = {}
        self.secret_versions: Dict[str, aws.secretsmanager.SecretVersion] = {}

        self._create_api_secret()
        self._create_database_secret()

    def _create_api_secret(self):
        """Create secret for API credentials."""
        secret_name = self.config.get_resource_name('api-secret', include_region=False)
        opts = self.provider_manager.get_resource_options()

        secret = aws.secretsmanager.Secret(
            'api-secret',
            name=secret_name,
            description='API credentials for external services',
            kms_key_id=self.kms_stack.get_key_id('data'),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        secret_value = json.dumps({
            'api_key': 'placeholder-api-key',
            'api_secret': 'placeholder-api-secret'
        })

        secret_version = aws.secretsmanager.SecretVersion(
            'api-secret-version',
            secret_id=secret.id,
            secret_string=secret_value,
            opts=opts
        )

        self.secrets['api'] = secret
        self.secret_versions['api'] = secret_version

    def _create_database_secret(self):
        """Create secret for database credentials."""
        secret_name = self.config.get_resource_name('db-secret', include_region=False)
        opts = self.provider_manager.get_resource_options()

        secret = aws.secretsmanager.Secret(
            'database-secret',
            name=secret_name,
            description='Database credentials',
            kms_key_id=self.kms_stack.get_key_id('data'),
            tags=self.config.get_common_tags(),
            opts=opts
        )

        secret_value = json.dumps({
            'username': 'admin',
            'password': 'placeholder-password'
        })

        secret_version = aws.secretsmanager.SecretVersion(
            'database-secret-version',
            secret_id=secret.id,
            secret_string=secret_value,
            opts=opts
        )

        self.secrets['database'] = secret
        self.secret_versions['database'] = secret_version

    def get_secret(self, secret_name: str) -> aws.secretsmanager.Secret:
        """
        Get a secret by name.

        Args:
            secret_name: Name of the secret

        Returns:
            Secret resource
        """
        return self.secrets.get(secret_name)

    def get_secret_arn(self, secret_name: str) -> pulumi.Output[str]:
        """
        Get the ARN of a secret.

        Args:
            secret_name: Name of the secret

        Returns:
            Secret ARN as Output
        """
        secret = self.get_secret(secret_name)
        return secret.arn if secret else None


```

## File: lib\infrastructure\sqs.py

```python
"""
SQS module for Dead Letter Queue management.

This module creates SQS queues for use as Dead Letter Queues (DLQs)
for Lambda functions with KMS encryption.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .kms import KMSStack


class SQSStack:
    """
    Manages SQS queues for Dead Letter Queues.

    Creates SQS queues with KMS encryption for failed Lambda invocations.
    """

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
            kms_stack: KMSStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.kms_stack = kms_stack
        self.queues: Dict[str, aws.sqs.Queue] = {}

        self._create_user_service_dlq()
        self._create_order_service_dlq()
        self._create_product_service_dlq()

    def _create_user_service_dlq(self):
        """Create DLQ for user service Lambda."""
        queue_name = self.config.get_resource_name('user-service-dlq', include_region=False)
        opts = self.provider_manager.get_resource_options()

        queue = aws.sqs.Queue(
            'user-service-dlq',
            name=queue_name,
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_stack.get_key_id('data'),
            kms_data_key_reuse_period_seconds=300,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.queues['user-service'] = queue

    def _create_order_service_dlq(self):
        """Create DLQ for order service Lambda."""
        queue_name = self.config.get_resource_name('order-service-dlq', include_region=False)
        opts = self.provider_manager.get_resource_options()

        queue = aws.sqs.Queue(
            'order-service-dlq',
            name=queue_name,
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_stack.get_key_id('data'),
            kms_data_key_reuse_period_seconds=300,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.queues['order-service'] = queue

    def _create_product_service_dlq(self):
        """Create DLQ for product service Lambda."""
        queue_name = self.config.get_resource_name('product-service-dlq', include_region=False)
        opts = self.provider_manager.get_resource_options()

        queue = aws.sqs.Queue(
            'product-service-dlq',
            name=queue_name,
            message_retention_seconds=1209600,
            kms_master_key_id=self.kms_stack.get_key_id('data'),
            kms_data_key_reuse_period_seconds=300,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.queues['product-service'] = queue

    def get_queue(self, queue_name: str) -> aws.sqs.Queue:
        """
        Get a queue by name.

        Args:
            queue_name: Name of the queue

        Returns:
            SQS Queue resource
        """
        return self.queues.get(queue_name)

    def get_queue_url(self, queue_name: str) -> pulumi.Output[str]:
        """
        Get the URL of a queue.

        Args:
            queue_name: Key of the queue

        Returns:
            Queue URL as Output
        """
        queue = self.get_queue(queue_name)
        return queue.url if queue else None

    def get_queue_arn(self, queue_name: str) -> pulumi.Output[str]:
        """
        Get the ARN of a queue.

        Args:
            queue_name: Key of the queue

        Returns:
            Queue ARN as Output
        """
        queue = self.get_queue(queue_name)
        return queue.arn if queue else None


```

## File: lib\infrastructure\step_functions.py

```python
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
from .config import ServerlessConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack


class StepFunctionsStack:
    """
    Manages Step Functions state machines.

    Creates state machines with proper Lambda service integration
    using the correct ARN format and Parameters.
    """

    def __init__(
        self,
        config: ServerlessConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the Step Functions stack.

        Args:
            config: ServerlessConfig instance
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

        self._create_order_workflow()

    def _create_order_workflow(self):
        """Create order processing workflow state machine."""
        workflow_name = 'order-workflow'

        user_function = self.lambda_stack.get_function('user-service')
        order_function = self.lambda_stack.get_function('order-service')
        product_function = self.lambda_stack.get_function('product-service')

        role = self.iam_stack.create_step_functions_role(
            workflow_name,
            lambda_arns=[
                user_function.arn,
                order_function.arn,
                product_function.arn
            ]
        )

        definition = Output.all(
            user_arn=user_function.arn,
            order_arn=order_function.arn,
            product_arn=product_function.arn
        ).apply(lambda args: json.dumps({
            "Comment": "Order processing workflow",
            "StartAt": "ValidateUser",
            "States": {
                "ValidateUser": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": args['user_arn'],
                        "Payload.$": "$"
                    },
                    "Next": "ProcessOrder",
                    "Retry": [{
                        "ErrorEquals": ["States.ALL"],
                        "IntervalSeconds": 2,
                        "MaxAttempts": 3,
                        "BackoffRate": 2.0
                    }],
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleError"
                    }]
                },
                "ProcessOrder": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": args['order_arn'],
                        "Payload.$": "$"
                    },
                    "Next": "UpdateInventory",
                    "Retry": [{
                        "ErrorEquals": ["States.ALL"],
                        "IntervalSeconds": 2,
                        "MaxAttempts": 3,
                        "BackoffRate": 2.0
                    }],
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleError"
                    }]
                },
                "UpdateInventory": {
                    "Type": "Task",
                    "Resource": "arn:aws:states:::lambda:invoke",
                    "Parameters": {
                        "FunctionName": args['product_arn'],
                        "Payload.$": "$"
                    },
                    "End": True,
                    "Retry": [{
                        "ErrorEquals": ["States.ALL"],
                        "IntervalSeconds": 2,
                        "MaxAttempts": 3,
                        "BackoffRate": 2.0
                    }],
                    "Catch": [{
                        "ErrorEquals": ["States.ALL"],
                        "Next": "HandleError"
                    }]
                },
                "HandleError": {
                    "Type": "Fail",
                    "Error": "WorkflowFailed",
                    "Cause": "An error occurred during workflow execution"
                }
            }
        }))

        opts = self.provider_manager.get_resource_options()

        log_group = aws.cloudwatch.LogGroup(
            f'{workflow_name}-logs',
            name=f"/aws/states/{self.config.get_resource_name(workflow_name, include_region=False)}",
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_common_tags(),
            opts=opts
        )

        self.log_groups[workflow_name] = log_group

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
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role, log_group]
            ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
                depends_on=[role, log_group]
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

## File: lib\infrastructure\vpc.py

```python
"""
VPC module for network infrastructure.

This module creates VPC with DynamoDB VPC endpoint for private access
to DynamoDB without going through the internet.
"""

import pulumi
import pulumi_aws as aws

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig


class VPCStack:
    """
    Manages VPC and VPC endpoints.

    Creates VPC with DynamoDB VPC endpoint to enable private access
    and prevent public data access.
    """

    def __init__(self, config: ServerlessConfig, provider_manager: AWSProviderManager):
        """
        Initialize the VPC stack.

        Args:
            config: ServerlessConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.vpc = None
        self.subnets = []
        self.route_table = None
        self.dynamodb_endpoint = None

        self._create_vpc()
        self._create_subnets()
        self._create_route_table()
        self._create_dynamodb_endpoint()

    def _create_vpc(self):
        """Create VPC."""
        vpc_name = self.config.get_resource_name('vpc', include_region=False)
        opts = self.provider_manager.get_resource_options()

        self.vpc = aws.ec2.Vpc(
            'main-vpc',
            cidr_block='10.0.0.0/16',
            enable_dns_hostnames=True,
            enable_dns_support=True,
            tags={
                **self.config.get_common_tags(),
                'Name': vpc_name
            },
            opts=opts
        )

    def _create_subnets(self):
        """Create subnets in the VPC."""
        opts = self.provider_manager.get_resource_options()

        subnet1 = aws.ec2.Subnet(
            'subnet-1',
            vpc_id=self.vpc.id,
            cidr_block='10.0.1.0/24',
            availability_zone=f"{self.config.primary_region}a",
            tags={
                **self.config.get_common_tags(),
                'Name': f"{self.config.get_resource_name('subnet-1', include_region=False)}"
            },
            opts=opts
        )

        subnet2 = aws.ec2.Subnet(
            'subnet-2',
            vpc_id=self.vpc.id,
            cidr_block='10.0.2.0/24',
            availability_zone=f"{self.config.primary_region}b",
            tags={
                **self.config.get_common_tags(),
                'Name': f"{self.config.get_resource_name('subnet-2', include_region=False)}"
            },
            opts=opts
        )

        self.subnets = [subnet1, subnet2]

    def _create_route_table(self):
        """Create route table for the VPC."""
        opts = self.provider_manager.get_resource_options()

        self.route_table = aws.ec2.RouteTable(
            'main-route-table',
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': f"{self.config.get_resource_name('route-table', include_region=False)}"
            },
            opts=opts
        )

        for i, subnet in enumerate(self.subnets):
            aws.ec2.RouteTableAssociation(
                f'route-table-association-{i+1}',
                subnet_id=subnet.id,
                route_table_id=self.route_table.id,
                opts=opts
            )

    def _create_dynamodb_endpoint(self):
        """Create VPC endpoint for DynamoDB."""
        opts = self.provider_manager.get_resource_options()

        self.dynamodb_endpoint = aws.ec2.VpcEndpoint(
            'dynamodb-endpoint',
            vpc_id=self.vpc.id,
            service_name=f"com.amazonaws.{self.config.primary_region}.dynamodb",
            vpc_endpoint_type='Gateway',
            route_table_ids=[self.route_table.id],
            tags={
                **self.config.get_common_tags(),
                'Name': f"{self.config.get_resource_name('dynamodb-endpoint', include_region=False)}"
            },
            opts=opts
        )

    def get_vpc_id(self) -> pulumi.Output[str]:
        """
        Get the VPC ID.

        Returns:
            VPC ID as Output
        """
        return self.vpc.id if self.vpc else None

    def get_subnet_ids(self) -> list:
        """
        Get the subnet IDs.

        Returns:
            List of subnet IDs as Outputs
        """
        return [subnet.id for subnet in self.subnets]

    def get_dynamodb_endpoint_id(self) -> pulumi.Output[str]:
        """
        Get the DynamoDB VPC endpoint ID.

        Returns:
            VPC endpoint ID as Output
        """
        return self.dynamodb_endpoint.id if self.dynamodb_endpoint else None


```
