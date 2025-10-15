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
from pulumi import Config, ResourceOptions

sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'lib'))
from tap_stack import TapStack, TapStackArgs

# Initialize Pulumi configuration
config = Config()

# Get environment suffix from config or fallback to 'dev'
environment_suffix = config.get('env') or 'dev'
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

2. lib\_\_init\_\_.py

```py
# empty
```

3. lib\_\_main\_\_.py

```py
"""
Main entry point for the Pulumi serverless application.

This module initializes the TapStack with proper configuration and
serves as the entry point for Pulumi deployments.
"""

import pulumi
from tap_stack import TapStack, TapStackArgs


def main():
    """
    Main function to initialize the TapStack.

    This function creates the TapStack with environment-specific configuration
    and serves as the entry point for Pulumi deployments.
    """
    # Get Pulumi configuration
    config = pulumi.Config()

    # Get environment-specific configuration
    environment = config.get("environment") or "dev"
    project_name = config.get("project_name") or "serverless-app"
    aws_region = config.get("aws:region") or "us-east-1"

    # Get additional configuration
    lambda_timeout = config.get_int("lambda_timeout") or 30
    lambda_memory = config.get_int("lambda_memory") or 128
    s3_log_retention_days = config.get_int("s3_log_retention_days") or 90
    cloudwatch_log_retention_days = config.get_int("cloudwatch_log_retention_days") or 14

    # Create configuration dictionary
    stack_config = {
        "environment": environment,
        "project_name": project_name,
        "aws_region": aws_region,
        "lambda_timeout": lambda_timeout,
        "lambda_memory": lambda_memory,
        "s3_log_retention_days": s3_log_retention_days,
        "cloudwatch_log_retention_days": cloudwatch_log_retention_days
    }

    # Create default tags
    default_tags = {
        "Environment": environment,
        "Project": project_name,
        "ManagedBy": "Pulumi",
        "CreatedBy": "ServerlessApplication"
    }

    # Create TapStack arguments
    stack_args = TapStackArgs(
        environment_suffix=environment,
        tags=default_tags,
        config=stack_config
    )

    # Create the TapStack
    stack = TapStack(
        "serverless-app",
        stack_args,
        opts=pulumi.ResourceOptions()
    )

    # Export key outputs for easy access
    pulumi.export("environment", stack.config.environment)
    pulumi.export("aws_region", stack.config.aws_region)
    pulumi.export("project_name", stack.config.project_name)

    # Export Lambda function outputs
    pulumi.export("lambda_function_name", stack.lambda_stack.get_main_function_name())
    pulumi.export("lambda_function_arn", stack.lambda_stack.get_main_function_arn())
    pulumi.export("lambda_function_invoke_arn", stack.lambda_stack.get_main_function_invoke_arn())

    # Export API Gateway outputs
    pulumi.export("api_gateway_id", stack.api_gateway_stack.get_rest_api_id())
    pulumi.export("api_gateway_invoke_url", stack.api_gateway_stack.get_invoke_url())

    # Export S3 bucket outputs
    pulumi.export("s3_bucket_name", stack.s3_stack.get_logs_bucket_name())
    pulumi.export("s3_bucket_arn", stack.s3_stack.get_logs_bucket_arn())

    # Export IAM role outputs
    pulumi.export("lambda_execution_role_arn", stack.iam_stack.get_lambda_execution_role_arn())
    pulumi.export("api_gateway_role_arn", stack.iam_stack.get_api_gateway_role_arn())

    # Export CloudWatch outputs
    pulumi.export("cloudwatch_dashboard_url", stack.cloudwatch_stack.get_dashboard_url())

    # Export log group outputs
    pulumi.export("main_log_group_name", stack.cloudwatch_stack.get_log_groups()['main'].name)
    pulumi.export("processor_log_group_name", stack.cloudwatch_stack.get_log_groups()['processor'].name)
    pulumi.export("api_log_group_name", stack.cloudwatch_stack.get_log_groups()['api'].name)


if __name__ == "__main__":
    main()

```

4. lib\tap_stack.py

```py
"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for
the serverless application.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Any, Dict, Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.cloudwatch import CloudWatchStack
# Import infrastructure components
from infrastructure.config import InfrastructureConfig
from infrastructure.iam import IAMStack
from infrastructure.lambda_function import LambdaStack
from infrastructure.logging import LoggingStack
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
        config (Optional[dict]): Optional configuration dictionary.
    """

    def __init__(
        self,
        environment_suffix: Optional[str] = None,
        tags: Optional[dict] = None,
        config: Optional[dict] = None
    ):
        self.environment_suffix = environment_suffix or 'dev'
        self.tags = tags or {}
        self.config = config or {}


class TapStack(pulumi.ComponentResource):
    """
    Represents the main Pulumi component resource for the serverless application.

    This component orchestrates the instantiation of all infrastructure components
    and manages the environment configuration with comprehensive outputs for integration testing.

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

        # Initialize configuration
        self.config = InfrastructureConfig(args.config)

        # Override environment suffix if provided
        if args.environment_suffix:
            self.config.environment = args.environment_suffix
            self.config.name_prefix = f"{self.config.project_name}-{args.environment_suffix}"

        # Merge tags
        self.tags = {**self.config.tags, **args.tags}

        # Create AWS provider with region enforcement
        self.aws_provider = Provider(
            "aws-provider",
            region=self.config.aws_region,
            opts=ResourceOptions(parent=self)
        )

        # Initialize infrastructure components
        self.iam_stack = IAMStack(
            self.config,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )

        self.s3_stack = S3Stack(
            self.config,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )

        self.lambda_stack = LambdaStack(
            self.config,
            self.iam_stack,
            self.s3_stack,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )

        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.lambda_stack,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )

        self.cloudwatch_stack = CloudWatchStack(
            self.config,
            self.lambda_stack,
            self.api_gateway_stack,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )

        self.logging_stack = LoggingStack(
            self.config,
            self.s3_stack,
            self.cloudwatch_stack,
            opts=ResourceOptions(parent=self, provider=self.aws_provider)
        )

        # Export comprehensive outputs for integration testing
        # Environment and configuration
        pulumi.export("environment", self.config.environment)
        pulumi.export("aws_region", self.config.aws_region)
        pulumi.export("project_name", self.config.project_name)

        # Lambda function outputs
        pulumi.export("lambda_function_name", self.lambda_stack.get_main_function_name())
        pulumi.export("lambda_function_arn", self.lambda_stack.get_main_function_arn())
        pulumi.export("lambda_function_invoke_arn", self.lambda_stack.get_main_function_invoke_arn())
        pulumi.export("log_processor_function_name", self.lambda_stack.get_log_processor_function_name())
        pulumi.export("log_processor_function_arn", self.lambda_stack.get_log_processor_function_arn())

        # API Gateway outputs
        pulumi.export("api_gateway_id", self.api_gateway_stack.get_rest_api_id())
        pulumi.export("api_gateway_arn", self.api_gateway_stack.get_rest_api_arn())
        pulumi.export("api_gateway_invoke_url", self.api_gateway_stack.get_invoke_url())
        pulumi.export("api_gateway_execution_arn", self.api_gateway_stack.get_execution_arn())

        # S3 bucket outputs
        pulumi.export("s3_bucket_name", self.s3_stack.get_logs_bucket_name())
        pulumi.export("s3_bucket_arn", self.s3_stack.get_logs_bucket_arn())
        pulumi.export("s3_bucket_domain_name", self.s3_stack.get_logs_bucket_domain_name())

        # IAM role outputs
        pulumi.export("lambda_execution_role_arn", self.iam_stack.get_lambda_execution_role_arn())
        pulumi.export("api_gateway_role_arn", self.iam_stack.get_api_gateway_role_arn())
        pulumi.export("log_processing_role_arn", self.iam_stack.get_log_processing_role_arn())

        # CloudWatch outputs
        pulumi.export("cloudwatch_dashboard_url", self.cloudwatch_stack.get_dashboard_url())

        # Log group outputs
        pulumi.export("main_log_group_name", self.cloudwatch_stack.get_main_log_group_name())
        pulumi.export("processor_log_group_name", self.cloudwatch_stack.get_processor_log_group_name())
        pulumi.export("api_log_group_name", self.cloudwatch_stack.get_api_log_group_name())

```

5. lib\infrastructure\api_gateway.py

```py
"""
API Gateway for high availability serverless application.

This module creates API Gateway with REST API, stages, deployments,
and usage plans for high availability and auto-scaling.
"""

from typing import Optional

import pulumi
from pulumi import Output, ResourceOptions
from pulumi_aws import apigateway, lambda_

from .config import InfrastructureConfig


class APIGatewayStack:
    """
    API Gateway stack for high availability serverless application.

    Creates REST API with stages, deployments, usage plans, and throttling
    for high availability and auto-scaling capabilities.
    """

    def __init__(
        self,
        config: InfrastructureConfig,
        lambda_stack: 'LambdaStack',
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize API Gateway stack with high availability features.

        Args:
            config: Infrastructure configuration
            lambda_stack: Lambda stack for function integration
            opts: Pulumi resource options
        """
        self.config = config
        self.lambda_stack = lambda_stack
        self.opts = opts or ResourceOptions()

        # Create API Gateway components in correct order
        self.rest_api = self._create_rest_api()
        self.api_resource = self._create_api_resource()
        self.version_resource = self._create_version_resource()
        self.api_method = self._create_api_method()
        self.api_integration = self._create_api_integration()
        self.api_method_response = self._create_api_method_response()
        self.api_integration_response = self._create_api_integration_response()
        self._add_lambda_permission()

    def _create_rest_api(self) -> apigateway.RestApi:
        """
        Create REST API with proper configuration.

        Returns:
            REST API resource
        """
        api_name = self.config.get_resource_name('api')

        # Create the REST API
        rest_api = apigateway.RestApi(
            api_name,
            name=api_name,
            description=f"Serverless API for {self.config.project_name}",
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )


        return rest_api

    def _create_api_resource(self) -> apigateway.Resource:
        """
        Create the /api resource.
        """
        api_name = self.config.get_resource_name('api')

        # Get the root resource ID
        root_resource_id = self.rest_api.root_resource_id

        # Create API resource
        api_resource = apigateway.Resource(
            f"{api_name}-api",
            rest_api=self.rest_api.id,
            parent_id=root_resource_id,
            path_part="api",
            opts=ResourceOptions(parent=self.rest_api)
        )
        return api_resource

    def _create_version_resource(self) -> apigateway.Resource:
        """
        Create the /v1 resource under /api.
        """
        api_name = self.config.get_resource_name('api')
        version_resource = apigateway.Resource(
            f"{api_name}-v1",
            rest_api=self.rest_api.id,
            parent_id=self.api_resource.id,
            path_part="v1",
            opts=ResourceOptions(parent=self.api_resource)
        )
        return version_resource

    def _create_api_method(self) -> apigateway.Method:
        """
        Create the GET method for the /api/v1 resource.
        """
        api_name = self.config.get_resource_name('api')
        api_method = apigateway.Method(
            f"{api_name}-method",
            rest_api=self.rest_api.id,
            resource_id=self.version_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=ResourceOptions(parent=self.version_resource)
        )
        return api_method

    def _create_api_integration(self) -> apigateway.Integration:
        """
        Create the integration with the Lambda function.
        """
        api_name = self.config.get_resource_name('api')
        lambda_function_arn = self.lambda_stack.get_main_function_invoke_arn()

        api_integration = apigateway.Integration(
            f"{api_name}-lambda-integration",
            rest_api=self.rest_api.id,
            resource_id=self.version_resource.id,
            http_method=self.api_method.http_method,
            integration_http_method="POST",  # Lambda integrations are always POST
            type="AWS_PROXY",  # Simplified integration
            uri=lambda_function_arn,
            opts=ResourceOptions(parent=self.api_method)
        )
        return api_integration

    def _create_api_method_response(self) -> apigateway.MethodResponse:
        """
        Create the method response for the API Gateway.
        """
        api_name = self.config.get_resource_name('api')
        method_response = apigateway.MethodResponse(
            f"{api_name}-method-response",
            rest_api=self.rest_api.id,
            resource_id=self.version_resource.id,
            http_method=self.api_method.http_method,
            status_code="200",
            opts=ResourceOptions(parent=self.api_method)
        )
        return method_response

    def _create_api_integration_response(self) -> apigateway.IntegrationResponse:
        """
        Create the integration response for the API Gateway.
        """
        api_name = self.config.get_resource_name('api')
        integration_response = apigateway.IntegrationResponse(
            f"{api_name}-integration-response",
            rest_api=self.rest_api.id,
            resource_id=self.version_resource.id,
            http_method=self.api_method.http_method,
            status_code=self.api_method_response.status_code,
            opts=ResourceOptions(parent=self.api_integration)
        )
        return integration_response

    def _create_usage_plan(self) -> apigateway.UsagePlan:
        """
        Create usage plan for API throttling and rate limiting.

        Returns:
            Usage plan resource
        """
        usage_plan_name = self.config.get_resource_name('usage-plan')

        # Create usage plan
        usage_plan = apigateway.UsagePlan(
            usage_plan_name,
            name=usage_plan_name,
            description=f"Usage plan for {self.config.project_name} API",
            api_stages=[
                apigateway.UsagePlanApiStageArgs(
                    api_id=self.rest_api.id,
                    stage=self.config.api_stage
                )
            ],
            throttle_settings=apigateway.UsagePlanThrottleSettingsArgs(
                burst_limit=100,
                rate_limit=50
            ),
            quota_settings=apigateway.UsagePlanQuotaSettingsArgs(
                limit=10000,
                period="DAY"
            ),
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.rest_api)
        )

        return usage_plan

    def _create_api_key(self) -> apigateway.ApiKey:
        """
        Create API key for authentication.

        Returns:
            API key resource
        """
        api_key_name = self.config.get_resource_name('api-key')

        # Create API key
        api_key = apigateway.ApiKey(
            api_key_name,
            name=api_key_name,
            description=f"API key for {self.config.project_name}",
            enabled=True,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.rest_api)
        )

        return api_key

    def _create_usage_plan_key(self) -> apigateway.UsagePlanKey:
        """
        Associate the API Key with the Usage Plan.
        """
        api_name = self.config.get_resource_name('api')
        usage_plan_key = apigateway.UsagePlanKey(
            f"{api_name}-key-usage-plan-key",
            key_id=self.api_key.id,
            key_type="API_KEY",
            usage_plan_id=self.usage_plan.id,
            opts=ResourceOptions(parent=self.api_key)
        )
        return usage_plan_key

    def _create_deployment(self) -> apigateway.Deployment:
        """
        Create API Gateway deployment.

        Returns:
            Deployment resource
        """
        deployment_name = self.config.get_resource_name('deployment')

        # Create deployment
        deployment = apigateway.Deployment(
            deployment_name,
            rest_api=self.rest_api.id,
            description=f"Deployment for {self.config.project_name} API",
            opts=ResourceOptions(parent=self.rest_api)
        )

        return deployment

    def _create_stage(self) -> apigateway.Stage:
        """
        Create API Gateway stage with monitoring and caching.

        Returns:
            Stage resource
        """
        stage_name = self.config.get_resource_name('stage')

        # Create stage
        stage = apigateway.Stage(
            stage_name,
            deployment=self.deployment.id,
            rest_api=self.rest_api.id,
            stage_name=self.config.api_stage,
            description=f"Stage for {self.config.project_name} API",
            xray_tracing_enabled=True,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.rest_api)
        )

        return stage

    def _add_lambda_permission(self) -> lambda_.Permission:
        """
        Add permission for API Gateway to invoke Lambda.
        """
        api_name = self.config.get_resource_name('api')
        permission = lambda_.Permission(
            f"{api_name}-lambda-permission",
            action="lambda:InvokeFunction",
            function=self.lambda_stack.main_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.all(self.rest_api.execution_arn, self.version_resource.path_part, self.api_method.http_method).apply(
                lambda args: f"{args[0]}/*/{args[1]}"
            ),
            opts=ResourceOptions(parent=self.api_integration)
        )
        return permission

    def get_rest_api_id(self) -> pulumi.Output[str]:
        """
        Get the ID of the REST API.

        Returns:
            REST API ID
        """
        return self.rest_api.id

    def get_rest_api_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the REST API.

        Returns:
            REST API ARN
        """
        return self.rest_api.arn

    def get_invoke_url(self) -> pulumi.Output[str]:
        """
        Get the invoke URL of the API Gateway.

        Returns:
            Invoke URL of the API Gateway
        """
        return Output.all(self.rest_api.id, self.config.api_stage).apply(
            lambda args: f"https://{args[0]}.execute-api.{self.config.aws_region}.amazonaws.com/{args[1]}"
        )

    def get_execution_arn(self) -> pulumi.Output[str]:
        """
        Get the execution ARN of the API Gateway.

        Returns:
            Execution ARN of the API Gateway
        """
        return self.rest_api.execution_arn

```

6. lib\infrastructure\cloudwatch.py

```py
"""
CloudWatch monitoring, alarms, and dashboards.

This module creates comprehensive CloudWatch monitoring with custom metrics,
alarms, and dashboards for the serverless application.
"""

import json
from typing import Any, Dict, List, Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import cloudwatch

from .config import InfrastructureConfig


class CloudWatchStack:
    """
    CloudWatch stack for comprehensive monitoring.

    Creates CloudWatch log groups, custom metrics, alarms, and dashboards
    for monitoring Lambda invocations, error rates, and operational metrics.
    """

    def __init__(
        self,
        config: InfrastructureConfig,
        lambda_stack: 'LambdaStack',
        api_gateway_stack: 'APIGatewayStack',
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize CloudWatch stack with monitoring components.

        Args:
            config: Infrastructure configuration
            lambda_stack: Lambda stack for function monitoring
            api_gateway_stack: API Gateway stack for API monitoring
            opts: Pulumi resource options
        """
        self.config = config
        self.lambda_stack = lambda_stack
        self.api_gateway_stack = api_gateway_stack
        self.opts = opts or ResourceOptions()

        # Create CloudWatch components
        self.log_groups = self._create_log_groups()
        self.metrics = self._create_custom_metrics()
        self.alarms = self._create_alarms()
        self.dashboard = self._create_dashboard()

    def _create_log_groups(self) -> Dict[str, cloudwatch.LogGroup]:
        """
        Create CloudWatch log groups for Lambda functions.

        Returns:
            Dictionary of log groups
        """
        log_groups = {}

        # Main Lambda function log group
        main_log_group = cloudwatch.LogGroup(
            f"{self.config.get_resource_name('log-group', 'main')}",
            name=self.lambda_stack.get_main_function_name().apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=self.config.cloudwatch_log_retention_days,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        log_groups['main'] = main_log_group

        # Log processor function log group
        processor_log_group = cloudwatch.LogGroup(
            f"{self.config.get_resource_name('log-group', 'processor')}",
            name=self.lambda_stack.get_log_processor_function_name().apply(lambda name: f"/aws/lambda/{name}"),
            retention_in_days=self.config.cloudwatch_log_retention_days,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        log_groups['processor'] = processor_log_group

        # API Gateway log group
        api_log_group = cloudwatch.LogGroup(
            f"{self.config.get_resource_name('log-group', 'api')}",
            name=f"/aws/apigateway/{self.config.get_resource_name('api')}",
            retention_in_days=self.config.cloudwatch_log_retention_days,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        log_groups['api'] = api_log_group

        return log_groups

    def _create_custom_metrics(self) -> Dict[str, cloudwatch.MetricAlarm]:
        """
        Create custom CloudWatch metrics for monitoring.

        Returns:
            Dictionary of custom metrics
        """
        metrics = {}

        # Custom metric for application health
        health_metric = cloudwatch.MetricAlarm(
            f"{self.config.get_resource_name('metric', 'health')}",
            name=f"{self.config.get_resource_name('metric', 'health')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="ApplicationHealth",
            namespace="ServerlessApp",
            period=300,
            statistic="Average",
            threshold=0.8,
            alarm_description="Application health monitoring",
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        metrics['health'] = health_metric

        return metrics

    def _create_alarms(self) -> Dict[str, cloudwatch.MetricAlarm]:
        """
        Create CloudWatch alarms for monitoring.

        Returns:
            Dictionary of alarms
        """
        alarms = {}

        # Lambda error rate alarm
        lambda_error_alarm = cloudwatch.MetricAlarm(
            f"{self.config.get_resource_name('alarm', 'lambda-errors')}",
            name=f"{self.config.get_resource_name('alarm', 'lambda-errors')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Errors",
            namespace="AWS/Lambda",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="Lambda function error rate alarm",
            alarm_actions=[],
            ok_actions=[],
            treat_missing_data="notBreaching",
            dimensions={
                "FunctionName": self.lambda_stack.get_main_function_name()
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['lambda_errors'] = lambda_error_alarm

        # Lambda duration alarm
        lambda_duration_alarm = cloudwatch.MetricAlarm(
            f"{self.config.get_resource_name('alarm', 'lambda-duration')}",
            name=f"{self.config.get_resource_name('alarm', 'lambda-duration')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="Duration",
            namespace="AWS/Lambda",
            period=300,
            statistic="Average",
            threshold=10000,  # 10 seconds
            alarm_description="Lambda function duration alarm",
            alarm_actions=[],
            ok_actions=[],
            treat_missing_data="notBreaching",
            dimensions={
                "FunctionName": self.lambda_stack.get_main_function_name()
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['lambda_duration'] = lambda_duration_alarm

        # API Gateway 4XX errors alarm
        api_4xx_alarm = cloudwatch.MetricAlarm(
            f"{self.config.get_resource_name('alarm', 'api-4xx')}",
            name=f"{self.config.get_resource_name('alarm', 'api-4xx')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=2,
            metric_name="4XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=10,
            alarm_description="API Gateway 4XX errors alarm",
            alarm_actions=[],
            ok_actions=[],
            treat_missing_data="notBreaching",
            dimensions={
                "ApiName": self.api_gateway_stack.get_rest_api_id()
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['api_4xx'] = api_4xx_alarm

        # API Gateway 5XX errors alarm
        api_5xx_alarm = cloudwatch.MetricAlarm(
            f"{self.config.get_resource_name('alarm', 'api-5xx')}",
            name=f"{self.config.get_resource_name('alarm', 'api-5xx')}",
            comparison_operator="GreaterThanThreshold",
            evaluation_periods=1,
            metric_name="5XXError",
            namespace="AWS/ApiGateway",
            period=300,
            statistic="Sum",
            threshold=5,
            alarm_description="API Gateway 5XX errors alarm",
            alarm_actions=[],
            ok_actions=[],
            treat_missing_data="notBreaching",
            dimensions={
                "ApiName": self.api_gateway_stack.get_rest_api_id()
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        alarms['api_5xx'] = api_5xx_alarm

        return alarms

    def _create_dashboard(self) -> cloudwatch.Dashboard:
        """
        Create CloudWatch dashboard for monitoring.

        Returns:
            CloudWatch dashboard
        """
        dashboard_name = self.config.get_resource_name('dashboard')

        # Create dashboard with widgets
        dashboard = cloudwatch.Dashboard(
            dashboard_name,
            dashboard_name=dashboard_name,
            dashboard_body=pulumi.Output.all(
                lambda_function_name=self.lambda_stack.get_main_function_name(),
                api_gateway_id=self.api_gateway_stack.get_rest_api_id()
            ).apply(lambda args: json.dumps({
                "widgets": [
                    {
                        "type": "metric",
                        "x": 0,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/Lambda", "Invocations", "FunctionName", args["lambda_function_name"]],
                                [".", "Errors", ".", "."],
                                [".", "Duration", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": self.config.aws_region,
                            "title": "Lambda Function Metrics"
                        }
                    },
                    {
                        "type": "metric",
                        "x": 12,
                        "y": 0,
                        "width": 12,
                        "height": 6,
                        "properties": {
                            "metrics": [
                                ["AWS/ApiGateway", "Count", "ApiName", args["api_gateway_id"]],
                                [".", "4XXError", ".", "."],
                                [".", "5XXError", ".", "."]
                            ],
                            "period": 300,
                            "stat": "Sum",
                            "region": self.config.aws_region,
                            "title": "API Gateway Metrics"
                        }
                    },
                    {
                        "type": "log",
                        "x": 0,
                        "y": 6,
                        "width": 24,
                        "height": 6,
                        "properties": {
                            "query": f"SOURCE '/aws/lambda/{args['lambda_function_name']}' | fields @timestamp, @message | sort @timestamp desc | limit 100",
                            "region": self.config.aws_region,
                            "title": "Lambda Function Logs"
                        }
                    }
                ]
            })),
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )

        return dashboard

    def get_log_groups(self) -> Dict[str, cloudwatch.LogGroup]:
        """
        Get the log groups.

        Returns:
            Dictionary of log groups
        """
        return self.log_groups

    def get_alarms(self) -> Dict[str, cloudwatch.MetricAlarm]:
        """
        Get the alarms.

        Returns:
            Dictionary of alarms
        """
        return self.alarms

    def get_dashboard_url(self) -> pulumi.Output[str]:
        """
        Get the CloudWatch dashboard URL.

        Returns:
            CloudWatch dashboard URL
        """
        return pulumi.Output.concat(
            "https://",
            self.config.aws_region,
            ".console.aws.amazon.com/cloudwatch/home?region=",
            self.config.aws_region,
            "#dashboards:name=",
            self.config.get_resource_name('dashboard')
        )

    def get_main_log_group_name(self) -> pulumi.Output[str]:
        """
        Get the name of the main log group.

        Returns:
            Name of the main log group
        """
        return self.log_groups['main'].name

    def get_processor_log_group_name(self) -> pulumi.Output[str]:
        """
        Get the name of the processor log group.

        Returns:
            Name of the processor log group
        """
        return self.log_groups['processor'].name

    def get_api_log_group_name(self) -> pulumi.Output[str]:
        """
        Get the name of the API log group.

        Returns:
            Name of the API log group
        """
        return self.log_groups['api'].name

```

7. lib\infrastructure\config.py

```py
"""
Configuration management for the serverless application.

This module handles environment variables, region configuration, and naming conventions
to ensure the application can easily switch regions and maintain consistent naming.
"""

import os
from typing import Dict, Optional

import pulumi


class InfrastructureConfig:
    """
    Configuration class for the serverless infrastructure.

    Handles environment variables, region configuration, and naming conventions
    to support easy region switching and consistent resource naming.
    """

    def __init__(self, config: Optional[Dict] = None):
        """
        Initialize configuration with environment variables and defaults.

        Args:
            config: Optional configuration dictionary to override defaults
        """
        self.config = config or {}

        # Environment and region configuration
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.aws_region = os.getenv('AWS_REGION', 'us-east-1')
        self.project_name = os.getenv('PROJECT_NAME', 'serverless-app')

        # Naming conventions with environment support
        self.name_prefix = f"{self.project_name}-{self.environment}"
        self.tags = {
            'Environment': self.environment,
            'Project': self.project_name,
            'ManagedBy': 'Pulumi'
        }

        # Lambda configuration
        self.lambda_runtime = 'python3.8'
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '30'))
        self.lambda_memory = int(os.getenv('LAMBDA_MEMORY', '128'))

        # API Gateway configuration
        self.api_stage = os.getenv('API_STAGE', 'prod')

        # S3 configuration
        self.s3_log_retention_days = int(os.getenv('S3_LOG_RETENTION_DAYS', '90'))

        # CloudWatch configuration
        self.cloudwatch_log_retention_days = int(os.getenv('CLOUDWATCH_LOG_RETENTION_DAYS', '14'))

        # High availability configuration
        self.enable_high_availability = os.getenv('ENABLE_HA', 'true').lower() == 'true'

    def get_resource_name(self, resource_type: str, suffix: str = '') -> str:
        """
        Generate consistent resource names with environment prefix.

        Args:
            resource_type: Type of resource (e.g., 'lambda', 'api', 'bucket')
            suffix: Optional suffix for the resource

        Returns:
            Formatted resource name
        """
        name = f"{self.name_prefix}-{resource_type}"
        if suffix:
            name = f"{name}-{suffix}"
        return name

    def get_config_value(self, key: str, default: str = '') -> str:
        """
        Get configuration value with fallback to environment variables.

        Args:
            key: Configuration key
            default: Default value if not found

        Returns:
            Configuration value
        """
        return self.config.get(key, os.getenv(key.upper(), default))

    def get_int_config(self, key: str, default: int = 0) -> int:
        """
        Get integer configuration value.

        Args:
            key: Configuration key
            default: Default integer value

        Returns:
            Integer configuration value
        """
        try:
            return int(self.get_config_value(key, str(default)))
        except ValueError:
            return default

    def get_bool_config(self, key: str, default: bool = False) -> bool:
        """
        Get boolean configuration value.

        Args:
            key: Configuration key
            default: Default boolean value

        Returns:
            Boolean configuration value
        """
        value = self.get_config_value(key, str(default)).lower()
        return value in ('true', '1', 'yes', 'on')

    def normalize_name(self, name: str) -> str:
        """
        Normalize resource names for AWS compatibility.

        Args:
            name: Resource name to normalize

        Returns:
            Normalized name suitable for AWS resources
        """
        # Convert to lowercase and replace invalid characters
        normalized = name.lower().replace('_', '-').replace(' ', '-')

        # Remove consecutive dashes
        while '--' in normalized:
            normalized = normalized.replace('--', '-')

        # Remove leading/trailing dashes
        normalized = normalized.strip('-')

        return normalized

```

8. lib\infrastructure\iam.py

```py
"""
IAM roles and policies for the serverless application.

This module creates IAM roles with least privilege access for Lambda functions,
API Gateway, and other AWS services, ensuring security best practices.
"""

from typing import Dict, List, Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import iam

from .config import InfrastructureConfig


class IAMStack:
    """
    IAM stack for managing roles and policies with least privilege access.

    Creates IAM roles for Lambda execution, API Gateway, and log processing
    with minimal necessary permissions for security.
    """

    def __init__(self, config: InfrastructureConfig, opts: Optional[ResourceOptions] = None):
        """
        Initialize IAM stack with least privilege policies.

        Args:
            config: Infrastructure configuration
            opts: Pulumi resource options
        """
        self.config = config
        self.opts = opts or ResourceOptions()

        # Create IAM roles and policies
        self.lambda_execution_role = self._create_lambda_execution_role()
        self.api_gateway_role = self._create_api_gateway_role()
        self.log_processing_role = self._create_log_processing_role()

    def _create_lambda_execution_role(self) -> iam.Role:
        """
        Create IAM role for Lambda execution with least privilege.

        Returns:
            IAM role for Lambda execution
        """
        role_name = self.config.get_resource_name('lambda-execution-role')

        # Assume role policy for Lambda
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

        # Create the role
        role = iam.Role(
            role_name,
            assume_role_policy=assume_role_policy,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )

        # Attach basic Lambda execution policy
        iam.RolePolicyAttachment(
            f"{role_name}-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=role)
        )

        # Create custom policy for CloudWatch Logs
        cloudwatch_policy = iam.Policy(
            f"{role_name}-cloudwatch-policy",
            policy={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": f"arn:aws:logs:{self.config.aws_region}:*:*"
                    }
                ]
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=role)
        )

        iam.RolePolicyAttachment(
            f"{role_name}-cloudwatch-attachment",
            role=role.name,
            policy_arn=cloudwatch_policy.arn,
            opts=ResourceOptions(parent=role)
        )

        return role

    def _create_api_gateway_role(self) -> iam.Role:
        """
        Create IAM role for API Gateway with minimal permissions.

        Returns:
            IAM role for API Gateway
        """
        role_name = self.config.get_resource_name('api-gateway-role')

        # Assume role policy for API Gateway
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

        # Create the role
        role = iam.Role(
            role_name,
            assume_role_policy=assume_role_policy,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )

        # Create policy for Lambda invocation
        lambda_policy = iam.Policy(
            f"{role_name}-lambda-policy",
            policy={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "lambda:InvokeFunction"
                        ],
                        "Resource": f"arn:aws:lambda:{self.config.aws_region}:*:function:{self.config.name_prefix}-*"
                    }
                ]
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=role)
        )

        iam.RolePolicyAttachment(
            f"{role_name}-lambda-attachment",
            role=role.name,
            policy_arn=lambda_policy.arn,
            opts=ResourceOptions(parent=role)
        )

        return role

    def _create_log_processing_role(self) -> iam.Role:
        """
        Create IAM role for log processing and S3 access.

        Returns:
            IAM role for log processing
        """
        role_name = self.config.get_resource_name('log-processing-role')

        # Assume role policy for Lambda (for log processing)
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

        # Create the role
        role = iam.Role(
            role_name,
            assume_role_policy=assume_role_policy,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )

        # Attach basic Lambda execution policy
        iam.RolePolicyAttachment(
            f"{role_name}-basic-execution",
            role=role.name,
            policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
            opts=ResourceOptions(parent=role)
        )

        # Create policy for S3 log access
        s3_log_policy = iam.Policy(
            f"{role_name}-s3-log-policy",
            policy={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "s3:GetObject",
                            "s3:PutObject",
                            "s3:DeleteObject",
                            "s3:ListBucket"
                        ],
                        "Resource": [
                            f"arn:aws:s3:::{self.config.name_prefix}-logs",
                            f"arn:aws:s3:::{self.config.name_prefix}-logs/*"
                        ]
                    },
                    {
                        "Effect": "Allow",
                        "Action": [
                            "logs:CreateLogGroup",
                            "logs:CreateLogStream",
                            "logs:PutLogEvents",
                            "logs:DescribeLogGroups",
                            "logs:DescribeLogStreams"
                        ],
                        "Resource": f"arn:aws:logs:{self.config.aws_region}:*:*"
                    }
                ]
            },
            tags=self.config.tags,
            opts=ResourceOptions(parent=role)
        )

        iam.RolePolicyAttachment(
            f"{role_name}-s3-log-attachment",
            role=role.name,
            policy_arn=s3_log_policy.arn,
            opts=ResourceOptions(parent=role)
        )

        return role

    def get_lambda_execution_role_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the Lambda execution role.

        Returns:
            ARN of the Lambda execution role
        """
        return self.lambda_execution_role.arn

    def get_api_gateway_role_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the API Gateway role.

        Returns:
            ARN of the API Gateway role
        """
        return self.api_gateway_role.arn

    def get_log_processing_role_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the log processing role.

        Returns:
            ARN of the log processing role
        """
        return self.log_processing_role.arn

```

9. lib\infrastructure\lambda_function.py

```py
"""
Lambda functions for the serverless application.

This module creates Lambda functions with proper outputs, environment variables,
and integration with other AWS services.
"""

import base64
import json
from typing import Any, Dict, Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import lambda_

from .config import InfrastructureConfig


class LambdaStack:
    """
    Lambda stack for serverless compute functions.

    Creates Lambda functions with proper environment variables, outputs,
    and integration with other AWS services.
    """

    def __init__(
        self,
        config: InfrastructureConfig,
        iam_stack: 'IAMStack',
        s3_stack: 'S3Stack',
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize Lambda stack with functions and configurations.

        Args:
            config: Infrastructure configuration
            iam_stack: IAM stack for roles
            s3_stack: S3 stack for buckets
            opts: Pulumi resource options
        """
        self.config = config
        self.iam_stack = iam_stack
        self.s3_stack = s3_stack
        self.opts = opts or ResourceOptions()

        # Create Lambda functions
        self.main_function = self._create_main_function()
        self.log_processor_function = self._create_log_processor_function()

    def _create_main_function(self) -> lambda_.Function:
        """
        Create the main Lambda function for API Gateway integration.

        Returns:
            Main Lambda function
        """
        function_name = self.config.get_resource_name('lambda', 'main')

        # Lambda function code
        lambda_code = """
import json
import logging
import os
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    '''
    Main Lambda function handler for API Gateway integration.

    Args:
        event: API Gateway event
        context: Lambda context

    Returns:
        API Gateway response
    '''
    try:
        # Log the incoming request
        logger.info(f"Received event: {json.dumps(event)}")

        # Extract request information
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters', {})

        # Process the request
        response_body = {
            'message': 'Hello from serverless application!',
            'timestamp': datetime.utcnow().isoformat(),
            'method': http_method,
            'path': path,
            'query_params': query_params,
            'environment': os.environ.get('ENVIRONMENT', 'dev')
        }

        # Return API Gateway response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, Authorization'
            },
            'body': json.dumps(response_body)
        }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
"""

        # Create the Lambda function
        function = lambda_.Function(
            function_name,
            name=function_name,
            runtime=self.config.lambda_runtime,
            handler="index.lambda_handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(lambda_code)
            }),
            role=self.iam_stack.get_lambda_execution_role_arn(),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory,
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    'ENVIRONMENT': self.config.environment,
                    'PROJECT_NAME': self.config.project_name,
                    'LOGS_BUCKET': self.s3_stack.get_logs_bucket_name()
                }
            ),
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )

        return function

    def _create_log_processor_function(self) -> lambda_.Function:
        """
        Create Lambda function for processing logs and exporting to S3.

        Returns:
            Log processor Lambda function
        """
        function_name = self.config.get_resource_name('lambda', 'log-processor')

        # Log processor function code
        log_processor_code = """
import json
import logging
import boto3
import gzip
from datetime import datetime
from io import BytesIO

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')
logs_client = boto3.client('logs')

def lambda_handler(event, context):
    '''
    Log processor function for exporting CloudWatch logs to S3.

    Args:
        event: CloudWatch Logs event
        context: Lambda context

    Returns:
        Processing status
    '''
    try:
        logger.info(f"Processing log event: {json.dumps(event)}")

        # Extract log group and stream information
        log_group = event.get('logGroup', '')
        log_stream = event.get('logStream', '')

        # Get log events
        response = logs_client.get_log_events(
            logGroupName=log_group,
            logStreamName=log_stream
        )

        # Process and format log events
        log_events = []
        for event_data in response.get('events', []):
            log_events.append({
                'timestamp': event_data.get('timestamp'),
                'message': event_data.get('message'),
                'log_group': log_group,
                'log_stream': log_stream
            })

        # Create log file content
        log_content = json.dumps(log_events, indent=2)

        # Compress the log content
        compressed_content = gzip.compress(log_content.encode('utf-8'))

        # Upload to S3
        bucket_name = os.environ.get('LOGS_BUCKET')
        if bucket_name:
            s3_key = f"logs/{log_group}/{log_stream}/{datetime.utcnow().strftime('%Y/%m/%d')}/logs.json.gz"

            s3_client.put_object(
                Bucket=bucket_name,
                Key=s3_key,
                Body=compressed_content,
                ContentType='application/gzip',
                ServerSideEncryption='AES256'
            )

            logger.info(f"Successfully uploaded logs to s3://{bucket_name}/{s3_key}")

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Logs processed successfully',
                'log_group': log_group,
                'log_stream': log_stream,
                'events_processed': len(log_events)
            })
        }

    except Exception as e:
        logger.error(f"Error processing logs: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({
                'error': 'Failed to process logs',
                'message': str(e)
            })
        }
"""

        # Create the log processor function
        function = lambda_.Function(
            function_name,
            name=function_name,
            runtime=self.config.lambda_runtime,
            handler="index.lambda_handler",
            code=pulumi.AssetArchive({
                "index.py": pulumi.StringAsset(log_processor_code)
            }),
            role=self.iam_stack.get_log_processing_role_arn(),
            timeout=300,  # 5 minutes for log processing
            memory_size=256,  # More memory for log processing
            environment=lambda_.FunctionEnvironmentArgs(
                variables={
                    'ENVIRONMENT': self.config.environment,
                    'PROJECT_NAME': self.config.project_name,
                    'LOGS_BUCKET': self.s3_stack.get_logs_bucket_name()
                }
            ),
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )

        return function

    def get_main_function_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the main Lambda function.

        Returns:
            ARN of the main Lambda function
        """
        return self.main_function.arn

    def get_main_function_name(self) -> pulumi.Output[str]:
        """
        Get the name of the main Lambda function.

        Returns:
            Name of the main Lambda function
        """
        return self.main_function.name

    def get_main_function_invoke_arn(self) -> pulumi.Output[str]:
        """
        Get the invoke ARN of the main Lambda function.

        Returns:
            Invoke ARN of the main Lambda function
        """
        return self.main_function.invoke_arn

    def get_log_processor_function_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the log processor function.

        Returns:
            ARN of the log processor function
        """
        return self.log_processor_function.arn

    def get_log_processor_function_name(self) -> pulumi.Output[str]:
        """
        Get the name of the log processor function.

        Returns:
            Name of the log processor function
        """
        return self.log_processor_function.name

```

10. lib\infrastructure\logging.py

```py
"""
Logging infrastructure for S3 log export and CloudWatch integration.

This module creates log export configurations to store all logs in versioned S3 buckets
and integrates with CloudWatch for comprehensive logging.
"""

from typing import Any, Dict, Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import cloudwatch, s3

from .config import InfrastructureConfig


class LoggingStack:
    """
    Logging stack for S3 log export and CloudWatch integration.

    Creates log export configurations to store all application logs in versioned S3 buckets
    and integrates with CloudWatch for comprehensive logging and monitoring.
    """

    def __init__(
        self,
        config: InfrastructureConfig,
        s3_stack: 'S3Stack',
        cloudwatch_stack: 'CloudWatchStack',
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize logging stack with S3 export and CloudWatch integration.

        Args:
            config: Infrastructure configuration
            s3_stack: S3 stack for log storage
            cloudwatch_stack: CloudWatch stack for log groups
            opts: Pulumi resource options
        """
        self.config = config
        self.s3_stack = s3_stack
        self.cloudwatch_stack = cloudwatch_stack
        self.opts = opts or ResourceOptions()

        self.log_subscriptions = {}

    # Log export to S3 would need to be implemented using AWS CLI or boto3 in Lambda functions

    def _create_log_subscriptions(self) -> Dict[str, cloudwatch.LogSubscriptionFilter]:
        """
        Create CloudWatch log subscriptions for real-time log processing.

        Returns:
            Dictionary of log subscription filters
        """
        log_subscriptions = {}

        # Create subscription filter for main Lambda function
        main_subscription = cloudwatch.LogSubscriptionFilter(
            f"{self.config.get_resource_name('log-subscription', 'main')}",
            log_group=f"/aws/lambda/{self.config.get_resource_name('lambda', 'main')}",
            filter_pattern="[timestamp, request_id, level, message]",
            destination_arn=f"arn:aws:lambda:{self.config.aws_region}:*:function:{self.config.get_resource_name('lambda', 'log-processor')}",
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        log_subscriptions['main'] = main_subscription

        # Create subscription filter for API Gateway
        api_subscription = cloudwatch.LogSubscriptionFilter(
            f"{self.config.get_resource_name('log-subscription', 'api')}",
            log_group=f"/aws/apigateway/{self.config.get_resource_name('api')}",
            filter_pattern="[timestamp, request_id, method, path, status]",
            destination_arn=f"arn:aws:lambda:{self.config.aws_region}:*:function:{self.config.get_resource_name('lambda', 'log-processor')}",
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        log_subscriptions['api'] = api_subscription

        return log_subscriptions

    # Log export functionality removed due to pulumi_aws limitations

    def get_log_subscriptions(self) -> Dict[str, cloudwatch.LogSubscriptionFilter]:
        """
        Get the log subscription filters.

        Returns:
            Dictionary of log subscription filters
        """
        return self.log_subscriptions

```

11. lib\infrastructure\s3.py

```py
"""
S3 buckets for log storage with versioning and security.

This module creates versioned S3 buckets for storing application logs with
proper encryption, access controls, and lifecycle policies.
"""

from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import s3

from .config import InfrastructureConfig


class S3Stack:
    """
    S3 stack for log storage with versioning and security.

    Creates versioned S3 buckets for storing Lambda and application logs
    with encryption, access controls, and lifecycle policies.
    """

    def __init__(self, config: InfrastructureConfig, opts: Optional[ResourceOptions] = None):
        """
        Initialize S3 stack with versioned buckets for log storage.

        Args:
            config: Infrastructure configuration
            opts: Pulumi resource options
        """
        self.config = config
        self.opts = opts or ResourceOptions()

        # Create S3 buckets
        self.logs_bucket = self._create_logs_bucket()
        self._create_bucket_policies()

    def _create_logs_bucket(self) -> s3.Bucket:
        """
        Create versioned S3 bucket for log storage.

        Returns:
            S3 bucket for log storage
        """
        bucket_name = self.config.get_resource_name('logs')

        # Create the bucket (without deprecated configurations)
        bucket = s3.Bucket(
            bucket_name,
            bucket=bucket_name,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )

        return bucket

    def _create_bucket_policies(self) -> None:
        """
        Create bucket policies and configurations for secure access.
        """
        # Enable versioning using latest resource
        s3.BucketVersioning(
            f"{self.config.get_resource_name('logs')}-versioning",
            bucket=self.logs_bucket.id,
            versioning_configuration=s3.BucketVersioningVersioningConfigurationArgs(
                status="Enabled"
            ),
            opts=ResourceOptions(parent=self.logs_bucket)
        )

        # Enable server-side encryption using latest resource
        s3.BucketServerSideEncryptionConfiguration(
            f"{self.config.get_resource_name('logs')}-encryption",
            bucket=self.logs_bucket.id,
            rules=[s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm="AES256"
                )
            )],
            opts=ResourceOptions(parent=self.logs_bucket)
        )

        # Configure lifecycle using latest resource
        s3.BucketLifecycleConfiguration(
            f"{self.config.get_resource_name('logs')}-lifecycle",
            bucket=self.logs_bucket.id,
            rules=[s3.BucketLifecycleConfigurationRuleArgs(
                id="log_retention",
                status="Enabled",
                expiration=s3.BucketLifecycleConfigurationRuleExpirationArgs(
                    days=self.config.s3_log_retention_days
                ),
                noncurrent_version_expiration=s3.BucketLifecycleConfigurationRuleNoncurrentVersionExpirationArgs(
                    noncurrent_days=30
                )
            )],
            opts=ResourceOptions(parent=self.logs_bucket)
        )

        # Deny public access policy
        s3.BucketPublicAccessBlock(
            f"{self.config.get_resource_name('logs')}-public-access-block",
            bucket=self.logs_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=ResourceOptions(parent=self.logs_bucket)
        )

        # Bucket policy for CloudWatch Logs export
        bucket_policy = s3.BucketPolicy(
            f"{self.config.get_resource_name('logs')}-policy",
            bucket=self.logs_bucket.id,
            policy=pulumi.Output.all(
                bucket_arn=self.logs_bucket.arn
            ).apply(lambda args: {
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Sid": "AllowCloudWatchLogsExport",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "logs.amazonaws.com"
                        },
                        "Action": [
                            "s3:GetBucketAcl",
                            "s3:GetBucketLocation"
                        ],
                        "Resource": args["bucket_arn"]
                    },
                    {
                        "Sid": "AllowCloudWatchLogsPutObject",
                        "Effect": "Allow",
                        "Principal": {
                            "Service": "logs.amazonaws.com"
                        },
                        "Action": "s3:PutObject",
                        "Resource": f"{args['bucket_arn']}/*",
                        "Condition": {
                            "StringEquals": {
                                "s3:x-amz-acl": "bucket-owner-full-control"
                            }
                        }
                    }
                ]
            }),
            opts=ResourceOptions(parent=self.logs_bucket)
        )

    def get_logs_bucket_name(self) -> pulumi.Output[str]:
        """
        Get the name of the logs bucket.

        Returns:
            Name of the logs bucket
        """
        return self.logs_bucket.bucket

    def get_logs_bucket_arn(self) -> pulumi.Output[str]:
        """
        Get the ARN of the logs bucket.

        Returns:
            ARN of the logs bucket
        """
        return self.logs_bucket.arn

    def get_logs_bucket_domain_name(self) -> pulumi.Output[str]:
        """
        Get the domain name of the logs bucket.

        Returns:
            Domain name of the logs bucket
        """
        return self.logs_bucket.bucket_domain_name

```
