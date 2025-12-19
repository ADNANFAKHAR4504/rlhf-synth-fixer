1. tap.py

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

# Add the lib directory to the Python path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib'))

from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = pulumi.Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
aws_region = config.get('aws_region') or os.getenv('AWS_REGION', 'us-east-1')

# Create default tags
default_tags = {
    'Project': os.getenv('PROJECT_NAME', 'serverless-app'),
    'Environment': environment_suffix,
    'Region': aws_region,
    'ManagedBy': 'Pulumi',
    'CreatedBy': 'InfrastructureAsCode'
}

# Create stack arguments
stack_args = TapStackArgs(
    environment_suffix=environment_suffix,
    tags=default_tags,
    aws_region=aws_region
)

# Create the main stack
stack = TapStack(
    name="pulumi-infra",
    args=stack_args
)

# Export key outputs for integration testing
pulumi.export("environment_suffix", environment_suffix)
pulumi.export("aws_region", aws_region)
pulumi.export("project_name", os.getenv('PROJECT_NAME', 'serverless-app'))

# Export infrastructure outputs
pulumi.export("api_gateway_invoke_url", stack.api_gateway_stack.get_outputs()["api_gateway_invoke_url"])
pulumi.export("s3_bucket_name", stack.s3_stack.get_outputs()["s3_bucket_name"])
pulumi.export("dynamodb_table_name", stack.dynamodb_stack.get_outputs()["main_table_name"])
pulumi.export("lambda_function_name", stack.lambda_stack.get_outputs()["main_lambda_function_name"])

```

2. lib\_\_init\_\_.py

```py
#empty
```

3. lib\_\_main\_\_.py

```py
"""
Main entry point for the serverless infrastructure Pulumi program.

This module initializes the Pulumi stack with proper configuration,
region settings, and environment variables.
"""

import hashlib
import os
from typing import Any, Dict

import pulumi
from tap_stack import TapStack, TapStackArgs


def main():
    """
    Main entry point for the Pulumi program.

    Initializes the serverless infrastructure stack with proper
    configuration and environment variables.
    """
    # Get configuration from environment variables
    environment_suffix = os.getenv('ENVIRONMENT', 'dev')
    aws_region = os.getenv('AWS_REGION', 'us-east-1')

    # Create default tags
    default_tags = {
        'Project': os.getenv('PROJECT_NAME', 'serverless-app'),
        'Environment': environment_suffix,
        'Region': aws_region,
        'ManagedBy': 'Pulumi',
        'CreatedBy': 'InfrastructureAsCode'
    }

    # Add unique stack name to avoid CI/CD state conflicts
    import time

    # Force unique stack name for CI/CD to avoid stale state
    timestamp = int(time.time())
    ci_cd_suffix = f"-ci-{timestamp}" if os.getenv('CI', 'false') == 'true' else ""
    unique_hash = hashlib.md5(f"serverless-app-{environment_suffix}-{timestamp}{ci_cd_suffix}".encode()).hexdigest()[:8]
    unique_stack_name = f"{environment_suffix}-{unique_hash}"

    # Create stack arguments
    stack_args = TapStackArgs(
        environment_suffix=environment_suffix,
        tags=default_tags,
        aws_region=aws_region
    )

    # Create the main stack
    stack = TapStack(
        name=unique_stack_name,
        args=stack_args
    )

    # Export key outputs for integration testing
    pulumi.export("environment_suffix", environment_suffix)
    pulumi.export("aws_region", aws_region)
    pulumi.export("project_name", os.getenv('PROJECT_NAME', 'serverless-app'))
    pulumi.export("stack_name", unique_stack_name)

    # Export infrastructure outputs
    pulumi.export("api_gateway_invoke_url", stack.api_gateway_stack.get_outputs()["api_gateway_invoke_url"])
    pulumi.export("s3_bucket_name", stack.s3_stack.get_outputs()["s3_bucket_name"])
    pulumi.export("dynamodb_table_name", stack.dynamodb_stack.get_outputs()["main_table_name"])
    pulumi.export("lambda_function_name", stack.lambda_stack.get_outputs()["main_lambda_function_name"])

    return stack


if __name__ == "__main__":
    main()

```

4. lib\tap_stack.py

```py
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless infrastructure project.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations.
"""

from typing import Any, Dict, Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.cloudwatch import CloudWatchStack
# Import infrastructure modules
from infrastructure.config import InfrastructureConfig
from infrastructure.dynamodb import DynamoDBStack
from infrastructure.iam import IAMStack
from infrastructure.lambda_function import LambdaStack
from infrastructure.s3 import S3Stack
from pulumi import ResourceOptions
from pulumi_aws import Provider


class TapStackArgs:
    """
    TapStackArgs defines the input arguments for the TapStack Pulumi component.

    Args:
        environment_suffix (Optional[str]): An optional suffix for identifying the deployment
            environment (e.g., 'dev', 'prod').
        tags (Optional[dict]): Optional default tags to apply to resources.
        aws_region (Optional[str]): AWS region for deployment.
    """

    def __init__(self, environment_suffix: Optional[str] = None,
                 tags: Optional[dict] = None, aws_region: Optional[str] = None):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags
        self.aws_region = aws_region


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
        self.aws_region = args.aws_region or 'us-east-1'

        # Create AWS provider with explicit region
        self.aws_provider = Provider(
            f"aws-provider-{self.environment_suffix}",
            region=self.aws_region,
            opts=ResourceOptions(parent=self)
        )

        # Initialize configuration
        self.config = InfrastructureConfig(environment_suffix=self.environment_suffix)

        # Create infrastructure components
        self._create_infrastructure_components()

        # Register outputs
        self._register_outputs()

    def _create_infrastructure_components(self):
        """Create all infrastructure components in the correct order."""
        # Create IAM stack first (required by other components)
        self.iam_stack = IAMStack(
            config=self.config,
            provider=self.aws_provider
        )

        # Create DynamoDB stack
        self.dynamodb_stack = DynamoDBStack(
            config=self.config,
            provider=self.aws_provider
        )

        # Create Lambda stack (depends on IAM)
        self.lambda_stack = LambdaStack(
            config=self.config,
            iam_outputs=self.iam_stack.get_outputs(),
            provider=self.aws_provider
        )

        # Create API Gateway stack (depends on Lambda)
        self.api_gateway_stack = APIGatewayStack(
            config=self.config,
            lambda_outputs=self.lambda_stack.get_outputs(),
            provider=self.aws_provider
        )

        # Create S3 stack (depends on Lambda for event notifications)
        self.s3_stack = S3Stack(
            config=self.config,
            lambda_outputs=self.lambda_stack.get_outputs(),
            provider=self.aws_provider
        )

        # Create CloudWatch stack (depends on Lambda and API Gateway)
        self.cloudwatch_stack = CloudWatchStack(
            config=self.config,
            lambda_outputs=self.lambda_stack.get_outputs(),
            api_gateway_outputs=self.api_gateway_stack.get_outputs(),
            provider=self.aws_provider
        )

    def _register_outputs(self):
        """Register all stack outputs for integration testing."""
        # Collect outputs from all components
        all_outputs = {
            # Configuration outputs
            "environment_suffix": self.environment_suffix,
            "aws_region": self.aws_region,
            "project_name": self.config.project_name,

            # IAM outputs
            **self.iam_stack.get_outputs(),

            # Lambda outputs
            **self.lambda_stack.get_outputs(),

            # API Gateway outputs
            **self.api_gateway_stack.get_outputs(),

            # DynamoDB outputs
            **self.dynamodb_stack.get_outputs(),

            # S3 outputs
            **self.s3_stack.get_outputs(),

            # CloudWatch outputs
            **self.cloudwatch_stack.get_outputs()
        }

        # Register outputs
        self.register_outputs(all_outputs)

```

5. lib\infrastructure\api_gateway.py

```py
"""
API Gateway module for the serverless infrastructure.

This module creates a RESTful API Gateway with proper endpoints,
CORS configuration, and Lambda integration.
"""

from typing import Any, Dict, Optional

from pulumi import ResourceOptions
from pulumi_aws import apigateway
from pulumi_aws import lambda_ as lambda_aws

from .config import InfrastructureConfig


class APIGatewayStack:
    """
    API Gateway stack for managing RESTful API endpoints.

    Creates API Gateway with proper routing, CORS configuration,
    and Lambda integration for serverless API endpoints.
    """

    def __init__(self, config: InfrastructureConfig, lambda_outputs: Dict[str, Any], provider: Optional[Any] = None):
        """
        Initialize API Gateway stack.

        Args:
            config: Infrastructure configuration
            lambda_outputs: Lambda stack outputs for function ARNs
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider
        self.lambda_outputs = lambda_outputs

        # Create API Gateway
        self._create_api_gateway()

        # Create Lambda permissions
        self._create_lambda_permissions()

        # Create API resources and methods
        self._create_api_resources()

        # Create deployment
        self._create_deployment()

    def _create_api_gateway(self):
        """Create API Gateway with proper configuration."""
        api_config = self.config.get_api_gateway_config('main')

        self.api_gateway = apigateway.RestApi(
            api_config['api_name'],
            name=api_config['api_name'],
            description='Serverless API Gateway for the application',
            endpoint_configuration={
                'types': 'REGIONAL'
            },
            tags=api_config['tags'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_lambda_permissions(self):
        """Create Lambda permissions for API Gateway integration."""
        # Permission for main Lambda function
        self.lambda_permission = lambda_aws.Permission(
            self.config.get_naming_convention("lambda-permission", "api-gateway"),
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function=self.lambda_outputs['main_lambda_function_name'],
            principal="apigateway.amazonaws.com",
            source_arn=self.api_gateway.execution_arn.apply(lambda arn: f"{arn}/*/*"),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_api_resources(self):
        """Create API Gateway resources and methods."""
        # Root resource - use the API Gateway's root resource directly
        # No need to create a separate root resource

        # Health check resource
        self.health_resource = apigateway.Resource(
            self.config.get_naming_convention("api-resource", "health"),
            rest_api=self.api_gateway.id,
            path_part="health",
            parent_id=self.api_gateway.root_resource_id,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Items resource
        self.items_resource = apigateway.Resource(
            self.config.get_naming_convention("api-resource", "items"),
            rest_api=self.api_gateway.id,
            path_part="items",
            parent_id=self.api_gateway.root_resource_id,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Item by ID resource
        self.item_resource = apigateway.Resource(
            self.config.get_naming_convention("api-resource", "item"),
            rest_api=self.api_gateway.id,
            path_part="{id}",
            parent_id=self.items_resource.id,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Create methods for each resource
        self._create_methods()

    def _create_methods(self):
        """Create HTTP methods for API endpoints."""
        # Health check GET method
        self.health_get_method = apigateway.Method(
            self.config.get_naming_convention("api-method", "health-get"),
            rest_api=self.api_gateway.id,
            resource_id=self.health_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Items GET method
        self.items_get_method = apigateway.Method(
            self.config.get_naming_convention("api-method", "items-get"),
            rest_api=self.api_gateway.id,
            resource_id=self.items_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Items POST method
        self.items_post_method = apigateway.Method(
            self.config.get_naming_convention("api-method", "items-post"),
            rest_api=self.api_gateway.id,
            resource_id=self.items_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Item PUT method
        self.item_put_method = apigateway.Method(
            self.config.get_naming_convention("api-method", "item-put"),
            rest_api=self.api_gateway.id,
            resource_id=self.item_resource.id,
            http_method="PUT",
            authorization="NONE",
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Item DELETE method
        self.item_delete_method = apigateway.Method(
            self.config.get_naming_convention("api-method", "item-delete"),
            rest_api=self.api_gateway.id,
            resource_id=self.item_resource.id,
            http_method="DELETE",
            authorization="NONE",
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Create integrations for each method
        self._create_integrations()

    def _create_integrations(self):
        """Create Lambda integrations for API methods."""
        # Health check integration
        self.health_integration = apigateway.Integration(
            self.config.get_naming_convention("api-integration", "health"),
            rest_api=self.api_gateway.id,
            resource_id=self.health_resource.id,
            http_method=self.health_get_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_outputs['main_lambda_function_invoke_arn'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Items GET integration
        self.items_get_integration = apigateway.Integration(
            self.config.get_naming_convention("api-integration", "items-get"),
            rest_api=self.api_gateway.id,
            resource_id=self.items_resource.id,
            http_method=self.items_get_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_outputs['main_lambda_function_invoke_arn'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Items POST integration
        self.items_post_integration = apigateway.Integration(
            self.config.get_naming_convention("api-integration", "items-post"),
            rest_api=self.api_gateway.id,
            resource_id=self.items_resource.id,
            http_method=self.items_post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_outputs['main_lambda_function_invoke_arn'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Item PUT integration
        self.item_put_integration = apigateway.Integration(
            self.config.get_naming_convention("api-integration", "item-put"),
            rest_api=self.api_gateway.id,
            resource_id=self.item_resource.id,
            http_method=self.item_put_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_outputs['main_lambda_function_invoke_arn'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Item DELETE integration
        self.item_delete_integration = apigateway.Integration(
            self.config.get_naming_convention("api-integration", "item-delete"),
            rest_api=self.api_gateway.id,
            resource_id=self.item_resource.id,
            http_method=self.item_delete_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_outputs['main_lambda_function_invoke_arn'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_deployment(self):
        """Create API Gateway deployment."""
        # Create deployment with explicit dependencies on all methods and integrations
        self.deployment = apigateway.Deployment(
            self.config.get_naming_convention("api-deployment", "main"),
            rest_api=self.api_gateway.id,
            description=f"Deployment for {self.config.environment_suffix} environment",
            opts=ResourceOptions(
                provider=self.provider,
                depends_on=[
                    self.health_get_method,
                    self.items_get_method,
                    self.items_post_method,
                    self.item_put_method,
                    self.item_delete_method,
                    self.health_integration,
                    self.items_get_integration,
                    self.items_post_integration,
                    self.item_put_integration,
                    self.item_delete_integration
                ]
            ) if self.provider else ResourceOptions(
                depends_on=[
                    self.health_get_method,
                    self.items_get_method,
                    self.items_post_method,
                    self.item_put_method,
                    self.item_delete_method,
                    self.health_integration,
                    self.items_get_integration,
                    self.items_post_integration,
                    self.item_put_integration,
                    self.item_delete_integration
                ]
            )
        )

        # Create stage
        self.stage = apigateway.Stage(
            self.config.get_naming_convention("api-stage", "main"),
            deployment=self.deployment.id,
            rest_api=self.api_gateway.id,
            stage_name=self.config.environment_suffix,
            description=f"Stage for {self.config.environment_suffix} environment",
            tags=self.config.get_tags({
                'StageName': self.config.environment_suffix,
                'Purpose': 'API Gateway stage'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def get_outputs(self) -> Dict[str, Any]:
        """
        Get API Gateway stack outputs.

        Returns:
            Dictionary containing API Gateway outputs
        """
        return {
            "api_gateway_id": self.api_gateway.id,
            "api_gateway_arn": self.api_gateway.arn,
            "api_gateway_execution_arn": self.api_gateway.execution_arn,
            "api_gateway_invoke_url": self.stage.invoke_url,
            "api_gateway_stage_name": self.stage.stage_name,
            "api_gateway_deployment_id": self.deployment.id
        }

```

6. lib\infrastructure\cloudwatch.py

```py
"""
CloudWatch module for the serverless infrastructure.

This module creates CloudWatch log groups, alarms, and monitoring
for Lambda functions, API Gateway, and DynamoDB.
"""

from typing import Any, Dict, Optional

from pulumi import ResourceOptions
from pulumi_aws import cloudwatch

from .config import InfrastructureConfig


class CloudWatchStack:
    """
    CloudWatch stack for managing logging and monitoring.

    Creates CloudWatch log groups, alarms, and monitoring
    for comprehensive observability of the serverless infrastructure.
    """

    def __init__(self, config: InfrastructureConfig, lambda_outputs: Dict[str, Any], api_gateway_outputs: Dict[str, Any], provider: Optional[Any] = None):
        """
        Initialize CloudWatch stack.

        Args:
            config: Infrastructure configuration
            lambda_outputs: Lambda stack outputs for log group names
            api_gateway_outputs: API Gateway stack outputs for monitoring
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider
        self.lambda_outputs = lambda_outputs
        self.api_gateway_outputs = api_gateway_outputs

        # Create log groups
        self._create_log_groups()

        # Create CloudWatch alarms
        self._create_cloudwatch_alarms()

        # Create log metric filters
        self._create_log_metric_filters()

    def _create_log_groups(self):
        """Create CloudWatch log groups for Lambda functions."""
        # Main Lambda function log group
        self.main_lambda_log_group = cloudwatch.LogGroup(
            self.config.get_naming_convention("log-group", "main-lambda"),
            name=self.lambda_outputs['main_lambda_function_name'].apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags({
                'LogGroupName': 'main-lambda',
                'Purpose': 'Lambda function logging'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # S3 processor Lambda function log group
        self.s3_processor_log_group = cloudwatch.LogGroup(
            self.config.get_naming_convention("log-group", "s3-processor-lambda"),
            name=self.lambda_outputs['s3_processor_lambda_function_name'].apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags({
                'LogGroupName': 's3-processor-lambda',
                'Purpose': 'S3 processor Lambda logging'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # API Gateway log group
        self.api_gateway_log_group = cloudwatch.LogGroup(
            self.config.get_naming_convention("log-group", "api-gateway"),
            name=self.api_gateway_outputs['api_gateway_id'].apply(lambda id: f"/aws/apigateway/{id}"),
            retention_in_days=self.config.log_retention_days,
            tags=self.config.get_tags({
                'LogGroupName': 'api-gateway',
                'Purpose': 'API Gateway logging'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_cloudwatch_alarms(self):
        """Create CloudWatch alarms for monitoring."""
        # Lambda function error alarm
        self.lambda_error_alarm = cloudwatch.MetricAlarm(
            self.config.get_naming_convention("alarm", "lambda-errors"),
            name=self.config.get_naming_convention("alarm", "lambda-errors"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function errors",
            alarm_actions=[],
            dimensions={
                "FunctionName": self.lambda_outputs['main_lambda_function_name']
            },
            tags=self.config.get_tags({
                'AlarmName': 'lambda-errors',
                'Purpose': 'Lambda error monitoring'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Lambda function duration alarm
        self.lambda_duration_alarm = cloudwatch.MetricAlarm(
            self.config.get_naming_convention("alarm", "lambda-duration"),
            name=self.config.get_naming_convention("alarm", "lambda-duration"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=10000,  # 10 seconds in milliseconds
            alarm_description="Lambda function duration",
            alarm_actions=[],
            dimensions={
                "FunctionName": self.lambda_outputs['main_lambda_function_name']
            },
            tags=self.config.get_tags({
                'AlarmName': 'lambda-duration',
                'Purpose': 'Lambda performance monitoring'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # API Gateway 4XX error alarm
        self.api_gateway_4xx_alarm = cloudwatch.MetricAlarm(
            self.config.get_naming_convention("alarm", "api-gateway-4xx"),
            name=self.config.get_naming_convention("alarm", "api-gateway-4xx"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="API Gateway 4XX errors",
            alarm_actions=[],
            dimensions={
                "ApiName": self.api_gateway_outputs['api_gateway_id']
            },
            tags=self.config.get_tags({
                'AlarmName': 'api-gateway-4xx',
                'Purpose': 'API Gateway error monitoring'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # API Gateway 5XX error alarm
        self.api_gateway_5xx_alarm = cloudwatch.MetricAlarm(
            self.config.get_naming_convention("alarm", "api-gateway-5xx"),
            name=self.config.get_naming_convention("alarm", "api-gateway-5xx"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="API Gateway 5XX errors",
            alarm_actions=[],
            dimensions={
                "ApiName": self.api_gateway_outputs['api_gateway_id']
            },
            tags=self.config.get_tags({
                'AlarmName': 'api-gateway-5xx',
                'Purpose': 'API Gateway error monitoring'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # API Gateway latency alarm
        self.api_gateway_latency_alarm = cloudwatch.MetricAlarm(
            self.config.get_naming_convention("alarm", "api-gateway-latency"),
            name=self.config.get_naming_convention("alarm", "api-gateway-latency"),
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Latency",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Average",
            threshold=2000,  # 2 seconds in milliseconds
            alarm_description="API Gateway latency",
            alarm_actions=[],
            dimensions={
                "ApiName": self.api_gateway_outputs['api_gateway_id']
            },
            tags=self.config.get_tags({
                'AlarmName': 'api-gateway-latency',
                'Purpose': 'API Gateway performance monitoring'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_log_metric_filters(self):
        """Create CloudWatch log metric filters for custom metrics."""
        # Lambda function error filter
        self.lambda_error_filter = cloudwatch.LogMetricFilter(
            self.config.get_naming_convention("metric-filter", "lambda-errors"),
            name=self.config.get_naming_convention("metric-filter", "lambda-errors"),
            log_group_name=self.main_lambda_log_group.name,
            pattern="ERROR",
            metric_transformation={
                "name": "LambdaErrorCount",
                "namespace": "Custom/Lambda",
                "value": "1"
            },
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # API Gateway error filter
        self.api_gateway_error_filter = cloudwatch.LogMetricFilter(
            self.config.get_naming_convention("metric-filter", "api-gateway-errors"),
            name=self.config.get_naming_convention("metric-filter", "api-gateway-errors"),
            log_group_name=self.api_gateway_log_group.name,
            pattern="ERROR",
            metric_transformation={
                "name": "ApiGatewayErrorCount",
                "namespace": "Custom/ApiGateway",
                "value": "1"
            },
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def get_outputs(self) -> Dict[str, Any]:
        """
        Get CloudWatch stack outputs.

        Returns:
            Dictionary containing CloudWatch outputs
        """
        return {
            "main_lambda_log_group_name": self.main_lambda_log_group.name,
            "s3_processor_log_group_name": self.s3_processor_log_group.name,
            "api_gateway_log_group_name": self.api_gateway_log_group.name,
            "lambda_error_alarm_name": self.lambda_error_alarm.name,
            "lambda_duration_alarm_name": self.lambda_duration_alarm.name,
            "api_gateway_4xx_alarm_name": self.api_gateway_4xx_alarm.name,
            "api_gateway_5xx_alarm_name": self.api_gateway_5xx_alarm.name,
            "api_gateway_latency_alarm_name": self.api_gateway_latency_alarm.name,
            "lambda_error_filter_name": self.lambda_error_filter.name,
            "api_gateway_error_filter_name": self.api_gateway_error_filter.name
        }

```

7. lib\infrastructure\config.py

```py
"""
Configuration module for the serverless infrastructure.

This module provides centralized configuration management with support for
environment variables, region flexibility, and consistent naming conventions.
"""

import hashlib
import os
from typing import Any, Dict, Optional

from pulumi import Config


class InfrastructureConfig:
    """
    Centralized configuration for the serverless infrastructure.

    Handles environment variables, region configuration, naming conventions,
    and provides consistent tagging across all resources.
    """

    def __init__(self, environment_suffix: Optional[str] = None):
        """
        Initialize configuration with environment-specific settings.

        Args:
            environment_suffix: Environment identifier (dev, staging, prod)
        """
        self.pulumi_config = Config()

        # Environment configuration
        self.environment_suffix = environment_suffix or os.getenv('ENVIRONMENT', 'dev')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless-app')

        # AWS configuration
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.aws_account_id = os.getenv('AWS_ACCOUNT_ID', '')

        # Application configuration
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '30'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '128'))
        self.dynamodb_billing_mode = os.getenv('DYNAMODB_BILLING_MODE', 'PAY_PER_REQUEST')

        # Security configuration
        self.enable_encryption = os.getenv('ENABLE_ENCRYPTION', 'true').lower() == 'true'
        self.enable_public_access = os.getenv('ENABLE_PUBLIC_ACCESS', 'false').lower() == 'true'

        # Monitoring configuration
        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '14'))
        self.enable_detailed_monitoring = os.getenv('ENABLE_DETAILED_MONITORING', 'true').lower() == 'true'

        # Generate stable hash for consistent naming
        self._stable_hash = self._generate_stable_hash()

    def _generate_stable_hash(self) -> str:
        """Generate a stable hash for consistent resource naming."""
        hash_input = f"{self.project_name}-{self.environment_suffix}"
        return hashlib.md5(hash_input.encode()).hexdigest()[:8]

    def get_naming_convention(self, resource_type: str, resource_name: str = None) -> str:
        """
        Generate consistent naming convention for AWS resources.

        Args:
            resource_type: Type of AWS resource (lambda, api-gateway, etc.)
            resource_name: Specific name for the resource

        Returns:
            Formatted resource name following naming conventions
        """
        # Normalize resource type for case sensitivity
        resource_type = resource_type.lower().replace('_', '-')

        if resource_name:
            resource_name = resource_name.lower().replace('_', '-')
            return f"{self.project_name}-{resource_type}-{resource_name}-{self.environment_suffix}-{self._stable_hash}"
        else:
            return f"{self.project_name}-{resource_type}-{self.environment_suffix}-{self._stable_hash}"

    def get_tags(self, additional_tags: Optional[Dict[str, str]] = None) -> Dict[str, str]:
        """
        Generate consistent tags for AWS resources.

        Args:
            additional_tags: Additional tags to include

        Returns:
            Dictionary of tags to apply to resources
        """
        base_tags = {
            'Project': self.project_name,
            'Environment': self.environment_suffix,
            'Region': self.aws_region,
            'ManagedBy': 'Pulumi',
            'CreatedBy': 'InfrastructureAsCode'
        }

        if additional_tags:
            base_tags.update(additional_tags)

        return base_tags

    def get_lambda_config(self, function_name: str) -> Dict[str, Any]:
        """
        Get Lambda function configuration.

        Args:
            function_name: Name of the Lambda function

        Returns:
            Dictionary with Lambda configuration
        """
        return {
            'function_name': self.get_naming_convention('lambda', function_name),
            'timeout': self.lambda_timeout,
            'memory_size': self.lambda_memory_size,
            'runtime': 'python3.9',
            'handler': 'lambda_function.lambda_handler',
            'tags': self.get_tags({
                'FunctionName': function_name,
                'Purpose': 'Serverless processing'
            })
        }

    def get_dynamodb_config(self, table_name: str) -> Dict[str, Any]:
        """
        Get DynamoDB table configuration.

        Args:
            table_name: Name of the DynamoDB table

        Returns:
            Dictionary with DynamoDB configuration
        """
        return {
            'table_name': self.get_naming_convention('dynamodb', table_name),
            'billing_mode': self.dynamodb_billing_mode,
            'tags': self.get_tags({
                'TableName': table_name,
                'Purpose': 'Data storage'
            })
        }

    def get_s3_config(self, bucket_name: str) -> Dict[str, Any]:
        """
        Get S3 bucket configuration.

        Args:
            bucket_name: Name of the S3 bucket

        Returns:
            Dictionary with S3 configuration
        """
        return {
            'bucket_name': self.get_naming_convention('s3', bucket_name),
            'enable_public_access': self.enable_public_access,
            'enable_encryption': self.enable_encryption,
            'tags': self.get_tags({
                'BucketName': bucket_name,
                'Purpose': 'Static asset storage'
            })
        }

    def get_api_gateway_config(self, api_name: str) -> Dict[str, Any]:
        """
        Get API Gateway configuration.

        Args:
            api_name: Name of the API Gateway

        Returns:
            Dictionary with API Gateway configuration
        """
        return {
            'api_name': self.get_naming_convention('api-gateway', api_name),
            'tags': self.get_tags({
                'ApiName': api_name,
                'Purpose': 'RESTful API endpoint'
            })
        }

    def get_cloudwatch_config(self, log_group_name: str) -> Dict[str, Any]:
        """
        Get CloudWatch log group configuration.

        Args:
            log_group_name: Name of the log group

        Returns:
            Dictionary with CloudWatch configuration
        """
        return {
            'log_group_name': self.get_naming_convention('log-group', log_group_name),
            'retention_days': self.log_retention_days,
            'tags': self.get_tags({
                'LogGroupName': log_group_name,
                'Purpose': 'Application logging'
            })
        }

```

8. lib\infrastructure\dynamodb.py

```py
"""
DynamoDB module for the serverless infrastructure.

This module creates DynamoDB tables with proper configuration,
indexes, and encryption for data storage.
"""

from typing import Any, Dict, Optional

from pulumi import ResourceOptions
from pulumi_aws import dynamodb

from .config import InfrastructureConfig


class DynamoDBStack:
    """
    DynamoDB stack for managing data storage.

    Creates DynamoDB tables with proper configuration, indexes,
    and encryption for secure data storage.
    """

    def __init__(self, config: InfrastructureConfig, provider: Optional[Any] = None):
        """
        Initialize DynamoDB stack.

        Args:
            config: Infrastructure configuration
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider

        # Create main application table
        self._create_main_table()

        # Create file metadata table
        self._create_file_metadata_table()

    def _create_main_table(self):
        """Create main application DynamoDB table."""
        table_config = self.config.get_dynamodb_config('main')

        self.main_table = dynamodb.Table(
            table_config['table_name'],
            name=table_config['table_name'],
            billing_mode=table_config['billing_mode'],
            hash_key='id',
            attributes=[
                {
                    'name': 'id',
                    'type': 'S'
                },
                {
                    'name': 'created_at',
                    'type': 'S'
                }
            ],
            global_secondary_indexes=[
                {
                    'name': 'created-at-index',
                    'hash_key': 'created_at',
                    'projection_type': 'ALL'
                }
            ],
            server_side_encryption={
                'enabled': self.config.enable_encryption
            },
            point_in_time_recovery={
                'enabled': True
            },
            tags=table_config['tags'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_file_metadata_table(self):
        """Create file metadata DynamoDB table for S3 object tracking."""
        file_metadata_config = self.config.get_dynamodb_config('file-metadata')

        self.file_metadata_table = dynamodb.Table(
            file_metadata_config['table_name'],
            name=file_metadata_config['table_name'],
            billing_mode=file_metadata_config['billing_mode'],
            hash_key='file_key',
            attributes=[
                {
                    'name': 'file_key',
                    'type': 'S'
                },
                {
                    'name': 'bucket',
                    'type': 'S'
                },
                {
                    'name': 'last_modified',
                    'type': 'S'
                }
            ],
            global_secondary_indexes=[
                {
                    'name': 'bucket-index',
                    'hash_key': 'bucket',
                    'range_key': 'last_modified',
                    'projection_type': 'ALL'
                }
            ],
            server_side_encryption={
                'enabled': self.config.enable_encryption
            },
            point_in_time_recovery={
                'enabled': True
            },
            tags=file_metadata_config['tags'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def get_outputs(self) -> Dict[str, Any]:
        """
        Get DynamoDB stack outputs.

        Returns:
            Dictionary containing DynamoDB table outputs
        """
        return {
            "main_table_name": self.main_table.name,
            "main_table_arn": self.main_table.arn,
            "main_table_stream_arn": self.main_table.stream_arn,
            "file_metadata_table_name": self.file_metadata_table.name,
            "file_metadata_table_arn": self.file_metadata_table.arn,
            "file_metadata_table_stream_arn": self.file_metadata_table.stream_arn
        }

```

9. lib\infrastructure\\iam.py

```py
"""
IAM module for the serverless infrastructure.

This module creates IAM roles and policies with least-privilege access
for Lambda functions, API Gateway, and other AWS services.
"""

from typing import Any, Dict, Optional

from pulumi import ResourceOptions
from pulumi_aws import iam

from .config import InfrastructureConfig


class IAMStack:
    """
    IAM stack for managing roles and policies with least-privilege access.

    Creates specific IAM roles for Lambda functions, API Gateway, and other
    services with minimal required permissions.
    """

    def __init__(self, config: InfrastructureConfig, provider: Optional[Any] = None):
        """
        Initialize IAM stack.

        Args:
            config: Infrastructure configuration
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider
        self._create_lambda_execution_role()
        self._create_api_gateway_role()
        self._create_dynamodb_access_policy()
        self._create_s3_access_policy()
        self._create_cloudwatch_logs_policy()

    def _create_lambda_execution_role(self):
        """Create IAM role for Lambda function execution."""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    }
                }
            ]
        }

        self.lambda_execution_role = iam.Role(
            self.config.get_naming_convention("iam-role", "lambda-execution"),
            name=self.config.get_naming_convention("iam-role", "lambda-execution"),
            assume_role_policy=assume_role_policy,
            tags=self.config.get_tags({
                "Name": "Lambda Execution Role",
                "Purpose": "Lambda function execution permissions"
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Attach basic Lambda execution policy
        self.lambda_basic_policy = iam.RolePolicyAttachment(
            self.config.get_naming_convention("iam-policy-attachment", "lambda-basic"),
            role=self.lambda_execution_role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_api_gateway_role(self):
        """Create IAM role for API Gateway."""
        assume_role_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Action": "sts:AssumeRole",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "apigateway.amazonaws.com"
                    }
                }
            ]
        }

        self.api_gateway_role = iam.Role(
            self.config.get_naming_convention("iam-role", "api-gateway"),
            name=self.config.get_naming_convention("iam-role", "api-gateway"),
            assume_role_policy=assume_role_policy,
            tags=self.config.get_tags({
                "Name": "API Gateway Role",
                "Purpose": "API Gateway execution permissions"
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_dynamodb_access_policy(self):
        """Create fine-grained DynamoDB access policy."""
        dynamodb_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "dynamodb:GetItem",
                        "dynamodb:PutItem",
                        "dynamodb:UpdateItem",
                        "dynamodb:DeleteItem",
                        "dynamodb:Query",
                        "dynamodb:Scan"
                    ],
                    "Resource": [
                        f"arn:aws:dynamodb:{self.config.aws_region}:*:table/{self.config.get_naming_convention('dynamodb', 'main')}",
                        f"arn:aws:dynamodb:{self.config.aws_region}:*:table/{self.config.get_naming_convention('dynamodb', 'main')}/index/*"
                    ]
                }
            ]
        }

        self.dynamodb_policy = iam.Policy(
            self.config.get_naming_convention("iam-policy", "dynamodb-access"),
            name=self.config.get_naming_convention("iam-policy", "dynamodb-access"),
            policy=dynamodb_policy_document,
            tags=self.config.get_tags({
                "Name": "DynamoDB Access Policy",
                "Purpose": "Fine-grained DynamoDB access"
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Attach DynamoDB policy to Lambda role
        self.dynamodb_policy_attachment = iam.RolePolicyAttachment(
            self.config.get_naming_convention("iam-policy-attachment", "lambda-dynamodb"),
            role=self.lambda_execution_role.name,
            policy_arn=self.dynamodb_policy.arn,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_s3_access_policy(self):
        """Create fine-grained S3 access policy."""
        s3_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject",
                        "s3:DeleteObject"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{self.config.get_naming_convention('s3', 'static-assets')}/*"
                    ]
                },
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:ListBucket"
                    ],
                    "Resource": [
                        f"arn:aws:s3:::{self.config.get_naming_convention('s3', 'static-assets')}"
                    ]
                }
            ]
        }

        self.s3_policy = iam.Policy(
            self.config.get_naming_convention("iam-policy", "s3-access"),
            name=self.config.get_naming_convention("iam-policy", "s3-access"),
            policy=s3_policy_document,
            tags=self.config.get_tags({
                "Name": "S3 Access Policy",
                "Purpose": "Fine-grained S3 access"
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Attach S3 policy to Lambda role
        self.s3_policy_attachment = iam.RolePolicyAttachment(
            self.config.get_naming_convention("iam-policy-attachment", "lambda-s3"),
            role=self.lambda_execution_role.name,
            policy_arn=self.s3_policy.arn,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_cloudwatch_logs_policy(self):
        """Create CloudWatch Logs policy for Lambda functions."""
        logs_policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "logs:CreateLogGroup",
                        "logs:CreateLogStream",
                        "logs:PutLogEvents"
                    ],
                    "Resource": [
                        f"arn:aws:logs:{self.config.aws_region}:*:log-group:/aws/lambda/{self.config.get_naming_convention('lambda', 'main')}*"
                    ]
                }
            ]
        }

        self.cloudwatch_logs_policy = iam.Policy(
            self.config.get_naming_convention("iam-policy", "cloudwatch-logs"),
            name=self.config.get_naming_convention("iam-policy", "cloudwatch-logs"),
            policy=logs_policy_document,
            tags=self.config.get_tags({
                "Name": "CloudWatch Logs Policy",
                "Purpose": "Lambda logging permissions"
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Attach CloudWatch Logs policy to Lambda role
        self.cloudwatch_logs_policy_attachment = iam.RolePolicyAttachment(
            self.config.get_naming_convention("iam-policy-attachment", "lambda-cloudwatch-logs"),
            role=self.lambda_execution_role.name,
            policy_arn=self.cloudwatch_logs_policy.arn,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def get_outputs(self) -> Dict[str, Any]:
        """
        Get IAM stack outputs.

        Returns:
            Dictionary containing IAM resource outputs
        """
        return {
            "lambda_execution_role_arn": self.lambda_execution_role.arn,
            "lambda_execution_role_name": self.lambda_execution_role.name,
            "api_gateway_role_arn": self.api_gateway_role.arn,
            "api_gateway_role_name": self.api_gateway_role.name,
            "dynamodb_policy_arn": self.dynamodb_policy.arn,
            "s3_policy_arn": self.s3_policy.arn,
            "cloudwatch_logs_policy_arn": self.cloudwatch_logs_policy.arn
        }

```

10. lib\infrastructure\lambda_function.py

```py
"""
Lambda function module for the serverless infrastructure.

This module creates Lambda functions with proper packaging, event triggers,
and integration with other AWS services.
"""

import json
from typing import Any, Dict, Optional

from pulumi import AssetArchive, FileArchive, ResourceOptions, StringAsset
from pulumi_aws import lambda_ as lambda_aws

from .config import InfrastructureConfig


class LambdaStack:
    """
    Lambda stack for managing serverless functions.

    Creates Lambda functions with proper packaging, environment variables,
    and integration with API Gateway, DynamoDB, and S3.
    """

    def __init__(self, config: InfrastructureConfig, iam_outputs: Dict[str, Any], provider: Optional[Any] = None):
        """
        Initialize Lambda stack.

        Args:
            config: Infrastructure configuration
            iam_outputs: IAM stack outputs for role ARNs
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider
        self.iam_outputs = iam_outputs

        # Create Lambda function code
        self._create_lambda_code()

        # Create main Lambda function
        self._create_main_lambda()

        # Create Lambda function for S3 event processing
        self._create_s3_processor_lambda()

    def _create_lambda_code(self):
        """Create Lambda function code with proper error handling and logging."""
        lambda_code = '''
import json
import boto3
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for API Gateway requests.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    """
    try:
        logger.info(f"Received event: {json.dumps(event)}")

        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')

        # Route requests based on method and path
        if http_method == 'GET' and path == '/health':
            return _handle_health_check()
        elif http_method == 'GET' and path.startswith('/items'):
            return _handle_get_items(event)
        elif http_method == 'POST' and path == '/items':
            return _handle_create_item(event)
        elif http_method == 'PUT' and path.startswith('/items/'):
            return _handle_update_item(event)
        elif http_method == 'DELETE' and path.startswith('/items/'):
            return _handle_delete_item(event)
        else:
            return _create_response(404, {"error": "Not Found"})

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return _create_response(500, {"error": "Internal Server Error"})

def _handle_health_check() -> Dict[str, Any]:
    """Handle health check endpoint."""
    return _create_response(200, {"status": "healthy", "service": "serverless-api"})

def _handle_get_items(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle GET /items endpoint."""
    try:
        table_name = event.get('pathParameters', {}).get('table', 'main')
        table = dynamodb.Table(table_name)

        # Scan table (in production, use Query with proper indexes)
        response = table.scan()
        items = response.get('Items', [])

        return _create_response(200, {"items": items})
    except Exception as e:
        logger.error(f"Error getting items: {str(e)}")
        return _create_response(500, {"error": "Failed to retrieve items"})

def _handle_create_item(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle POST /items endpoint."""
    try:
        body = json.loads(event.get('body', '{}'))
        table_name = body.get('table', 'main')
        table = dynamodb.Table(table_name)

        # Generate item ID
        import uuid
        item_id = str(uuid.uuid4())
        body['id'] = item_id

        # Put item in DynamoDB
        table.put_item(Item=body)

        return _create_response(201, {"id": item_id, "item": body})
    except Exception as e:
        logger.error(f"Error creating item: {str(e)}")
        return _create_response(500, {"error": "Failed to create item"})

def _handle_update_item(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle PUT /items/{id} endpoint."""
    try:
        item_id = event.get('pathParameters', {}).get('id')
        if not item_id:
            return _create_response(400, {"error": "Item ID required"})

        body = json.loads(event.get('body', '{}'))
        table_name = body.get('table', 'main')
        table = dynamodb.Table(table_name)

        # Update item in DynamoDB
        response = table.update_item(
            Key={'id': item_id},
            UpdateExpression='SET #data = :data, #updated_at = :updated_at',
            ExpressionAttributeNames={
                '#data': 'data',
                '#updated_at': 'updated_at'
            },
            ExpressionAttributeValues={
                ':data': body.get('data', {}),
                ':updated_at': str(int(time.time()))
            },
            ReturnValues='ALL_NEW'
        )

        return _create_response(200, {"item": response.get('Attributes')})
    except Exception as e:
        logger.error(f"Error updating item: {str(e)}")
        return _create_response(500, {"error": "Failed to update item"})

def _handle_delete_item(event: Dict[str, Any]) -> Dict[str, Any]:
    """Handle DELETE /items/{id} endpoint."""
    try:
        item_id = event.get('pathParameters', {}).get('id')
        if not item_id:
            return _create_response(400, {"error": "Item ID required"})

        table_name = event.get('queryStringParameters', {}).get('table', 'main')
        table = dynamodb.Table(table_name)

        # Delete item from DynamoDB
        table.delete_item(Key={'id': item_id})

        return _create_response(200, {"message": "Item deleted successfully"})
    except Exception as e:
        logger.error(f"Error deleting item: {str(e)}")
        return _create_response(500, {"error": "Failed to delete item"})

def _create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create API Gateway response."""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        },
        'body': json.dumps(body)
    }
'''

        # Create deployment package using inline code
        self.lambda_code_archive = AssetArchive({
            'lambda_function.py': StringAsset(lambda_code),
            'requirements.txt': StringAsset('boto3>=1.26.0\nbotocore>=1.29.0\n')
        })

    def _create_main_lambda(self):
        """Create main Lambda function for API Gateway."""
        lambda_config = self.config.get_lambda_config('main')

        self.main_lambda = lambda_aws.Function(
            lambda_config['function_name'],
            name=lambda_config['function_name'],
            runtime=lambda_config['runtime'],
            handler=lambda_config['handler'],
            code=self.lambda_code_archive,
            role=self.iam_outputs['lambda_execution_role_arn'],
            timeout=lambda_config['timeout'],
            memory_size=lambda_config['memory_size'],
            environment={
                'variables': {
                    'DYNAMODB_TABLE_NAME': self.config.get_naming_convention('dynamodb', 'main'),
                    'S3_BUCKET_NAME': self.config.get_naming_convention('s3', 'static-assets'),
                    'LOG_LEVEL': 'INFO'
                }
            },
            tags=lambda_config['tags'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_s3_processor_lambda(self):
        """Create Lambda function for S3 event processing."""
        s3_processor_code = '''
import json
import boto3
import logging
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
dynamodb = boto3.resource('dynamodb')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    S3 event processor Lambda handler.

    Processes S3 events and updates DynamoDB with file metadata.

    Args:
        event: S3 event
        context: Lambda context

    Returns:
        Processing result
    """
    try:
        logger.info(f"Processing S3 event: {json.dumps(event)}")

        # Process each record in the event
        for record in event.get('Records', []):
            if record.get('eventName', '').startswith('ObjectCreated'):
                _process_object_created(record)
            elif record.get('eventName', '').startswith('ObjectRemoved'):
                _process_object_removed(record)

        return {"statusCode": 200, "message": "Processing completed"}

    except Exception as e:
        logger.error(f"Error processing S3 event: {str(e)}")
        raise e

def _process_object_created(record: Dict[str, Any]):
    """Process object created event with metadata extraction."""
    try:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        size = record['s3']['object']['size']

        # Get file metadata
        response = s3_client.head_object(Bucket=bucket, Key=key)
        content_type = response.get('ContentType', 'application/octet-stream')
        last_modified = response.get('LastModified', '').isoformat()

        # For image files, create a copy in the processed bucket
        if content_type.startswith('image/'):
            # Copy image to destination bucket for processing
            destination_bucket = bucket.replace('static-assets', 'processed-images')
            destination_key = f"processed/{key.replace('uploads/', '')}"

            # Copy object to destination bucket
            s3_client.copy_object(
                Bucket=destination_bucket,
                CopySource={'Bucket': bucket, 'Key': key},
                Key=destination_key,
                MetadataDirective='COPY'
            )

            logger.info(f"Copied image to processed bucket: {destination_key}")

            # Store metadata with processing info
            table = dynamodb.Table('file-metadata')
            table.put_item(Item={
                'file_key': key,
                'bucket': bucket,
                'size': size,
                'content_type': content_type,
                'last_modified': last_modified,
                'status': 'processed',
                'processed_key': destination_key,
                'processed_bucket': destination_bucket
            })
        else:
            # Store metadata for non-image files
            table = dynamodb.Table('file-metadata')
            table.put_item(Item={
                'file_key': key,
                'bucket': bucket,
                'size': size,
                'content_type': content_type,
                'last_modified': last_modified,
                'status': 'processed'
            })

        logger.info(f"Processed file: {key}")

    except Exception as e:
        logger.error(f"Error processing object created: {str(e)}")
        raise e

def _process_object_removed(record: Dict[str, Any]):
    """Process object removed event."""
    try:
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']

        # Remove metadata from DynamoDB
        table = dynamodb.Table('file-metadata')
        table.delete_item(Key={'file_key': key})

        logger.info(f"Removed file metadata: {key}")

    except Exception as e:
        logger.error(f"Error processing object removed: {str(e)}")
        raise e
'''

        # Create S3 processor deployment package using inline code
        # Note: For production, consider using Lambda Layers for heavy dependencies like Pillow
        s3_processor_archive = AssetArchive({
            'lambda_function.py': StringAsset(s3_processor_code)
        })

        # Create S3 processor Lambda function
        self.s3_processor_lambda = lambda_aws.Function(
            self.config.get_naming_convention('lambda', 's3-processor'),
            name=self.config.get_naming_convention('lambda', 's3-processor'),
            runtime='python3.9',
            handler='lambda_function.lambda_handler',
            code=s3_processor_archive,
            role=self.iam_outputs['lambda_execution_role_arn'],
            timeout=30,
            memory_size=128,
            environment={
                'variables': {
                    'DYNAMODB_TABLE_NAME': self.config.get_naming_convention('dynamodb', 'file-metadata'),
                    'S3_BUCKET_NAME': self.config.get_naming_convention('s3', 'static-assets'),
                    'LOG_LEVEL': 'INFO'
                }
            },
            tags=self.config.get_tags({
                'FunctionName': 's3-processor',
                'Purpose': 'S3 event processing'
            }),
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def get_outputs(self) -> Dict[str, Any]:
        """
        Get Lambda stack outputs.

        Returns:
            Dictionary containing Lambda function outputs
        """
        return {
            "main_lambda_function_name": self.main_lambda.name,
            "main_lambda_function_arn": self.main_lambda.arn,
            "main_lambda_function_invoke_arn": self.main_lambda.invoke_arn,
            "s3_processor_lambda_function_name": self.s3_processor_lambda.name,
            "s3_processor_lambda_function_arn": self.s3_processor_lambda.arn,
            "s3_processor_lambda_function_invoke_arn": self.s3_processor_lambda.invoke_arn
        }

```

11. lib\infrastructure\s3.py

```py
"""
S3 module for the serverless infrastructure.

This module creates S3 buckets with strict security policies,
encryption, and event notifications for Lambda processing.
"""

from typing import Any, Dict, Optional

from pulumi import ResourceOptions
from pulumi_aws import s3, s3control

from .config import InfrastructureConfig


class S3Stack:
    """
    S3 stack for managing static asset storage.

    Creates S3 buckets with strict security policies, encryption,
    and event notifications for automated processing.
    """

    def __init__(self, config: InfrastructureConfig, lambda_outputs: Dict[str, Any], provider: Optional[Any] = None):
        """
        Initialize S3 stack.

        Args:
            config: Infrastructure configuration
            lambda_outputs: Lambda stack outputs for event notifications
            provider: AWS provider instance
        """
        self.config = config
        self.provider = provider
        self.lambda_outputs = lambda_outputs

        # Create S3 bucket
        self._create_s3_bucket()

        # Create bucket policy
        self._create_bucket_policy()


        # Create bucket versioning
        self._create_bucket_versioning()

        # Create bucket encryption
        self._create_bucket_encryption()

        # Create public access block
        self._create_public_access_block()

    def _create_s3_bucket(self):
        """Create S3 bucket with proper configuration."""
        bucket_config = self.config.get_s3_config('static-assets')

        self.s3_bucket = s3.Bucket(
            bucket_config['bucket_name'],
            bucket=bucket_config['bucket_name'],
            force_destroy=True,  # Allow destruction for testing
            tags=bucket_config['tags'],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_bucket_policy(self):
        """Create strict S3 bucket policy to deny public access."""
        # Create a simple policy that allows Lambda access
        # We'll use the bucket name to construct the ARN
        bucket_name = self.config.get_naming_convention('s3', 'static-assets')

        bucket_policy = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Sid": "AllowLambdaAccess",
                    "Effect": "Allow",
                    "Principal": {
                        "Service": "lambda.amazonaws.com"
                    },
                    "Action": [
                        "s3:GetObject",
                        "s3:PutObject"
                    ],
                    "Resource": f"arn:aws:s3:::{bucket_name}/*"
                }
            ]
        }

        self.bucket_policy = s3.BucketPolicy(
            self.config.get_naming_convention("s3-policy", "static-assets"),
            bucket=self.s3_bucket.id,
            policy=bucket_policy,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_event_notifications(self):
        """Create S3 event notifications for Lambda processing."""
        # Event notification for object creation
        self.object_created_notification = s3.BucketNotification(
            self.config.get_naming_convention("s3-notification", "object-created"),
            bucket=self.s3_bucket.id,
            lambda_functions=[
                {
                    "lambda_function_arn": self.lambda_outputs['s3_processor_lambda_function_arn'],
                    "events": ["s3:ObjectCreated:*"],
                    "filter_prefix": "uploads/",
                    "filter_suffix": ".jpg"
                }
            ],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

        # Event notification for object removal
        self.object_removed_notification = s3.BucketNotification(
            self.config.get_naming_convention("s3-notification", "object-removed"),
            bucket=self.s3_bucket.id,
            lambda_functions=[
                {
                    "lambda_function_arn": self.lambda_outputs['s3_processor_lambda_function_arn'],
                    "events": ["s3:ObjectRemoved:*"],
                    "filter_prefix": "uploads/",
                    "filter_suffix": ".jpg"
                }
            ],
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_bucket_versioning(self):
        """Create S3 bucket versioning configuration."""
        self.bucket_versioning = s3.BucketVersioning(
            self.config.get_naming_convention("s3-versioning", "static-assets"),
            bucket=self.s3_bucket.id,
            versioning_configuration={
                "status": "Enabled"
            },
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def _create_bucket_encryption(self):
        """Create S3 bucket encryption configuration."""
        if self.config.enable_encryption:
            self.bucket_encryption = s3.BucketServerSideEncryptionConfiguration(
                self.config.get_naming_convention("s3-encryption", "static-assets"),
                bucket=self.s3_bucket.id,
                rules=[
                    {
                        "apply_server_side_encryption_by_default": {
                            "sse_algorithm": "AES256"
                        },
                        "bucket_key_enabled": True
                    }
                ],
                opts=ResourceOptions(provider=self.provider) if self.provider else None
            )

    def _create_public_access_block(self):
        """Create S3 public access block configuration."""
        self.public_access_block = s3.BucketPublicAccessBlock(
            self.config.get_naming_convention("s3-public-access-block", "static-assets"),
            bucket=self.s3_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(provider=self.provider) if self.provider else None
        )

    def get_outputs(self) -> Dict[str, Any]:
        """
        Get S3 stack outputs.

        Returns:
            Dictionary containing S3 bucket outputs
        """
        return {
            "s3_bucket_name": self.s3_bucket.bucket,
            "s3_bucket_arn": self.s3_bucket.arn,
            "s3_bucket_domain_name": self.s3_bucket.bucket_domain_name,
            "s3_bucket_regional_domain_name": self.s3_bucket.bucket_regional_domain_name
        }

```
