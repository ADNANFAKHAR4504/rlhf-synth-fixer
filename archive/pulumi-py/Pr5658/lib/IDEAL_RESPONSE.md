## File: tap.py

```py
#!/usr/bin/env python3
"""
Pulumi application entry point for the CI/CD pipeline infrastructure.

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
STACK_NAME = f"CICDPipeline-{environment_suffix}"

repository_name = os.getenv('REPOSITORY', 'unknown')
commit_author = os.getenv('COMMIT_AUTHOR', 'unknown')

default_tags = {
    'Environment': os.getenv('ENVIRONMENT', 'dev'),
    'Repository': repository_name,
    'Author': commit_author,
}

stack = TapStack(
    name="cicd-pipeline",
    args=TapStackArgs(environment_suffix=environment_suffix, tags=default_tags),
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
the CI/CD pipeline infrastructure.

It orchestrates the instantiation of all infrastructure components
and manages environment-specific configurations with proper outputs.
"""

from typing import Optional

import pulumi
from infrastructure.api_gateway import APIGatewayStack
from infrastructure.aws_provider import AWSProviderManager
from infrastructure.cicd import CICDStack
from infrastructure.config import CICDPipelineConfig
from infrastructure.iam import IAMStack
from infrastructure.lambda_functions import LambdaStack
from infrastructure.monitoring import MonitoringStack
from infrastructure.storage import StorageStack
from infrastructure.vpc import VPCStack
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
    Represents the main Pulumi component resource for the CI/CD pipeline.

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

        self.config = CICDPipelineConfig()

        self.provider_manager = AWSProviderManager(self.config)

        self.iam_stack = IAMStack(self.config, self.provider_manager)
        self.vpc_stack = VPCStack(self.config, self.provider_manager)
        self.storage_stack = StorageStack(self.config, self.provider_manager)
        self.lambda_stack = LambdaStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.storage_stack,
            self.vpc_stack
        )
        self.monitoring_stack = MonitoringStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        self.api_gateway_stack = APIGatewayStack(
            self.config,
            self.provider_manager,
            self.lambda_stack
        )
        self.cicd_stack = CICDStack(
            self.config,
            self.provider_manager,
            self.iam_stack,
            self.storage_stack,
            self.lambda_stack
        )

        self._register_outputs()

    def _register_outputs(self):
        """Register all outputs for the stack."""
        outputs = {}

        outputs['api_endpoint_url'] = self.api_gateway_stack.get_api_url()
        outputs['api_id'] = self.api_gateway_stack.get_api_id()
        outputs['api_key_value'] = self.api_gateway_stack.get_api_key_value()

        outputs['lambda_function_name'] = self.lambda_stack.get_function_name('pipeline-handler')
        outputs['lambda_function_arn'] = self.lambda_stack.get_function_arn('pipeline-handler')
        outputs['lambda_dlq_url'] = self.lambda_stack.get_dlq_url('pipeline-handler')
        outputs['lambda_dlq_arn'] = self.lambda_stack.get_dlq_arn('pipeline-handler')

        outputs['log_bucket_name'] = self.storage_stack.get_bucket_name('logs')
        outputs['log_bucket_arn'] = self.storage_stack.get_bucket_arn('logs')
        outputs['artifact_bucket_name'] = self.storage_stack.get_bucket_name('artifacts')
        outputs['artifact_bucket_arn'] = self.storage_stack.get_bucket_arn('artifacts')
        outputs['kms_key_arn'] = self.storage_stack.get_kms_key_arn('s3')

        outputs['vpc_id'] = self.vpc_stack.get_vpc_id()
        outputs['lambda_security_group_id'] = self.vpc_stack.get_lambda_security_group_id()

        outputs['log_group_name'] = self.monitoring_stack.get_log_group_name('pipeline-handler')
        outputs['log_group_arn'] = self.monitoring_stack.get_log_group_arn('pipeline-handler')
        outputs['sns_topic_arn'] = self.monitoring_stack.get_sns_topic_arn()

        outputs['codebuild_project_name'] = self.cicd_stack.get_build_project_name('lambda-build')
        outputs['codebuild_project_arn'] = self.cicd_stack.get_build_project_arn('lambda-build')

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

    def get_lambda_function_arn(self) -> Output[str]:
        """Get Lambda function ARN."""
        return self.lambda_stack.get_function_arn('pipeline-handler')

    def get_lambda_function_name(self) -> Output[str]:
        """Get Lambda function name."""
        return self.lambda_stack.get_function_name('pipeline-handler')

    def get_log_bucket_name(self) -> Output[str]:
        """Get log bucket name."""
        return self.storage_stack.get_bucket_name('logs')

    def get_artifact_bucket_name(self) -> Output[str]:
        """Get artifact bucket name."""
        return self.storage_stack.get_bucket_name('artifacts')


```

## File: lib\infrastructure\_\_init\_\_.py

```py
"""
Infrastructure module for CI/CD pipeline.

This module exports all infrastructure components for easy importing.
"""

from .api_gateway import APIGatewayStack
from .aws_provider import AWSProviderManager
from .cicd import CICDStack
from .config import CICDPipelineConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack
from .monitoring import MonitoringStack
from .storage import StorageStack
from .vpc import VPCStack

__all__ = [
    'CICDPipelineConfig',
    'AWSProviderManager',
    'IAMStack',
    'VPCStack',
    'StorageStack',
    'LambdaStack',
    'APIGatewayStack',
    'MonitoringStack',
    'CICDStack'
]
```

## File: lib\infrastructure\lambda_code\handler.py

```py
"""
Lambda handler for the CI/CD pipeline.

This handler processes requests and logs to S3 and CloudWatch.
Uses only boto3 and standard library - no external dependencies.
"""

import json
import logging
import os
from datetime import datetime
from typing import Any, Dict

import boto3

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
cloudwatch_client = boto3.client('cloudwatch')


def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler.

    Args:
        event: API Gateway event or direct invocation
        context: Lambda context

    Returns:
        Response dict
    """
    logger.info(f"Received event: {json.dumps(event)}")

    try:
        http_method = event.get('httpMethod', '')

        if http_method == 'POST':
            return handle_post(event, context)
        elif http_method == 'GET':
            return handle_get(event, context)
        elif not http_method:
            return handle_direct_invocation(event, context)
        else:
            return {
                'statusCode': 405,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }


def handle_post(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle POST requests."""
    try:
        body = json.loads(event.get('body', '{}'))

        if not body:
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Request body is required'})
            }

        request_id = context.aws_request_id
        timestamp = datetime.utcnow().isoformat()

        log_entry = {
            'requestId': request_id,
            'timestamp': timestamp,
            'method': 'POST',
            'body': body,
            'environment': os.getenv('ENVIRONMENT', 'dev')
        }

        log_bucket = os.getenv('LOG_BUCKET')
        if log_bucket:
            try:
                log_key = f"lambda-logs/{datetime.utcnow().strftime('%Y/%m/%d')}/{request_id}.json"
                s3_client.put_object(
                    Bucket=log_bucket,
                    Key=log_key,
                    Body=json.dumps(log_entry),
                    ContentType='application/json'
                )
                logger.info(f"Logged to S3: {log_bucket}/{log_key}")
            except Exception as e:
                logger.error(f"Failed to log to S3: {str(e)}")

        try:
            cloudwatch_client.put_metric_data(
                Namespace='CICDPipeline/Lambda',
                MetricData=[
                    {
                        'MetricName': 'RequestsProcessed',
                        'Value': 1,
                        'Unit': 'Count',
                        'Timestamp': datetime.utcnow()
                    }
                ]
            )
        except Exception as e:
            logger.error(f"Failed to send CloudWatch metric: {str(e)}")

        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Request processed successfully',
                'requestId': request_id,
                'timestamp': timestamp
            })
        }

    except json.JSONDecodeError:
        return {
            'statusCode': 400,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Invalid JSON in request body'})
        }


def handle_get(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle GET requests."""
    request_id = context.aws_request_id
    timestamp = datetime.utcnow().isoformat()

    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'message': 'Lambda function is healthy',
            'requestId': request_id,
            'timestamp': timestamp,
            'environment': os.getenv('ENVIRONMENT', 'dev')
        })
    }


def handle_direct_invocation(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """Handle direct Lambda invocations."""
    request_id = context.aws_request_id
    timestamp = datetime.utcnow().isoformat()

    logger.info(f"Direct invocation with event: {json.dumps(event)}")

    return {
        'statusCode': 200,
        'body': json.dumps({
            'message': 'Direct invocation processed',
            'requestId': request_id,
            'timestamp': timestamp,
            'event': event
        })
    }


```

## File: lib\infrastructure\api_gateway.py

```py
"""
API Gateway module with usage plan and rate limiting.

This module creates API Gateway with proper Lambda integration,
usage plans, rate limiting, and X-Ray tracing.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway resources.

    Creates REST API with Lambda integration, usage plan,
    rate limiting, and X-Ray tracing.
    """

    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.

        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.api = None
        self.deployment = None
        self.stage = None

        self._create_api()
        self._create_resources()
        self._create_deployment()
        self._create_usage_plan()

    def _create_api(self):
        """Create REST API."""
        api_name = self.config.get_resource_name('api')

        self.api = aws.apigateway.RestApi(
            'api',
            name=api_name,
            description=f'API Gateway for {self.config.project_name}',
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
        function_name = 'pipeline-handler'
        function = self.lambda_stack.get_function(function_name)

        resource = aws.apigateway.Resource(
            'api-resource',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part='pipeline',
            opts=self.provider_manager.get_resource_options()
        )

        post_method = aws.apigateway.Method(
            'post-method',
            rest_api=self.api.id,
            resource_id=resource.id,
            http_method='POST',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options()
        )

        post_integration = aws.apigateway.Integration(
            'post-integration',
            rest_api=self.api.id,
            resource_id=resource.id,
            http_method=post_method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=function.invoke_arn,
            opts=self.provider_manager.get_resource_options()
        )

        get_method = aws.apigateway.Method(
            'get-method',
            rest_api=self.api.id,
            resource_id=resource.id,
            http_method='GET',
            authorization='NONE',
            opts=self.provider_manager.get_resource_options()
        )

        get_integration = aws.apigateway.Integration(
            'get-integration',
            rest_api=self.api.id,
            resource_id=resource.id,
            http_method=get_method.http_method,
            integration_http_method='POST',
            type='AWS_PROXY',
            uri=function.invoke_arn,
            opts=self.provider_manager.get_resource_options()
        )

        Output.all(self.api.execution_arn, resource.path).apply(
            lambda args: aws.lambda_.Permission(
                'api-lambda-permission',
                statement_id='AllowAPIGatewayInvoke',
                action='lambda:InvokeFunction',
                function=function.name,
                principal='apigateway.amazonaws.com',
                source_arn=f'{args[0]}/*/*/*',
                opts=self.provider_manager.get_resource_options()
            )
        )

        self.methods = [post_method, get_method]
        self.integrations = [post_integration, get_integration]

    def _create_deployment(self):
        """Create API deployment and stage."""
        deployment_name = self.config.get_resource_name('deployment')
        stage_name = 'v1'

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

        log_group_name = f'/aws/apigateway/{self.config.get_resource_name("api")}'

        log_group = aws.cloudwatch.LogGroup(
            'api-log-group',
            name=log_group_name,
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': log_group_name
            },
            opts=self.provider_manager.get_resource_options()
        )

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
            opts=self.provider_manager.get_resource_options()
        )

        aws.apigateway.MethodSettings(
            'api-method-settings',
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path='*/*',
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                metrics_enabled=True,
                throttling_burst_limit=self.config.api_burst_limit,
                throttling_rate_limit=self.config.api_rate_limit
            ),
            opts=self.provider_manager.get_resource_options()
        )

    def _create_usage_plan(self):
        """Create usage plan with rate limiting."""
        usage_plan_name = self.config.get_resource_name('usage-plan')

        usage_plan = aws.apigateway.UsagePlan(
            'usage-plan',
            name=usage_plan_name,
            api_stages=[aws.apigateway.UsagePlanApiStageArgs(
                api_id=self.api.id,
                stage=self.stage.stage_name
            )],
            quota_settings=aws.apigateway.UsagePlanQuotaSettingsArgs(
                limit=self.config.api_quota_limit,
                period=self.config.api_quota_period
            ),
            throttle_settings=aws.apigateway.UsagePlanThrottleSettingsArgs(
                burst_limit=self.config.api_burst_limit,
                rate_limit=self.config.api_rate_limit
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': usage_plan_name
            },
            opts=self.provider_manager.get_resource_options()
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

        self.usage_plan = usage_plan
        self.api_key = api_key

    def get_api_id(self) -> Output[str]:
        """Get API ID."""
        return self.api.id

    def get_api_url(self) -> Output[str]:
        """Get API URL."""
        return Output.all(self.api.id, self.stage.stage_name).apply(
            lambda args: f'https://{args[0]}.execute-api.{self.config.primary_region}.amazonaws.com/{args[1]}'
        )

    def get_api_key_value(self) -> Output[str]:
        """Get API key value."""
        return self.api_key.value if self.api_key else Output.from_input('')


```

## File: lib\infrastructure\aws_provider.py

```py
"""
AWS Provider module for consistent provider usage.

This module creates a single AWS provider instance to avoid drift in CI/CD pipelines.
"""

import pulumi
import pulumi_aws as aws

from .config import CICDPipelineConfig


class AWSProviderManager:
    """
    Manages a consistent AWS provider instance.

    Ensures all resources use the same provider without random suffixes,
    preventing drift in CI/CD pipelines.
    """

    def __init__(self, config: CICDPipelineConfig):
        """
        Initialize the AWS provider manager.

        Args:
            config: CICDPipelineConfig instance
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

## File: lib\infrastructure\cicd.py

```py
"""
CI/CD module with CodeBuild and S3-based artifact management.

This module creates CodeBuild projects for building and deploying
Lambda functions using S3 for source and artifact storage.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig
from .iam import IAMStack
from .lambda_functions import LambdaStack
from .storage import StorageStack


class CICDStack:
    """
    Manages CI/CD resources using CodeBuild and S3.

    Creates CodeBuild projects for building and deploying Lambda functions
    without requiring CodePipeline or CodeCommit.
    """

    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        storage_stack: StorageStack,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the CI/CD stack.

        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            storage_stack: StorageStack instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.storage_stack = storage_stack
        self.lambda_stack = lambda_stack
        self.build_projects = {}

        self._create_build_project()

    def _create_build_project(self):
        """Create CodeBuild project for Lambda deployment."""
        project_name = self.config.get_resource_name('build')

        function_name = 'pipeline-handler'

        role = self.iam_stack.create_codebuild_role(
            s3_bucket_arns=[
                self.storage_stack.get_bucket_arn('artifacts'),
                self.storage_stack.get_bucket_arn('logs')
            ],
            kms_key_arns=[self.storage_stack.get_kms_key_arn('s3')],
            lambda_function_arns=[self.lambda_stack.get_function_arn(function_name)]
        )

        buildspec_content = """version: 0.2

phases:
  install:
    runtime-versions:
      python: 3.11
    commands:
      - echo "Installing dependencies..."
      - pip install --upgrade pip

  build:
    commands:
      - echo "Building Lambda package..."
      - cd lambda_code
      - zip -r ../lambda-package.zip .
      - cd ..
      - echo "Build completed"

  post_build:
    commands:
      - echo "Uploading artifact to S3..."
      - aws s3 cp lambda-package.zip s3://${ARTIFACT_BUCKET}/builds/lambda-package-$(date +%Y%m%d-%H%M%S).zip
      - echo "Updating Lambda function..."
      - aws lambda update-function-code --function-name ${LAMBDA_FUNCTION_NAME} --zip-file fileb://lambda-package.zip
      - echo "Deployment completed"

artifacts:
  files:
    - lambda-package.zip
  name: lambda-package
"""

        build_project = aws.codebuild.Project(
            'build-project',
            name=project_name,
            description=f'Build project for {self.config.project_name}',
            service_role=role.arn,
            artifacts=aws.codebuild.ProjectArtifactsArgs(
                type='S3',
                location=self.storage_stack.get_bucket_name('artifacts'),
                path='builds',
                namespace_type='BUILD_ID',
                packaging='ZIP',
                encryption_disabled=False
            ),
            environment=aws.codebuild.ProjectEnvironmentArgs(
                compute_type='BUILD_GENERAL1_SMALL',
                image='aws/codebuild/standard:7.0',
                type='LINUX_CONTAINER',
                environment_variables=[
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='ARTIFACT_BUCKET',
                        value=self.storage_stack.get_bucket_name('artifacts')
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='LAMBDA_FUNCTION_NAME',
                        value=self.lambda_stack.get_function_name(function_name)
                    ),
                    aws.codebuild.ProjectEnvironmentEnvironmentVariableArgs(
                        name='ENVIRONMENT',
                        value=self.config.environment
                    )
                ]
            ),
            source=aws.codebuild.ProjectSourceArgs(
                type='S3',
                location=Output.concat(
                    self.storage_stack.get_bucket_name('artifacts'),
                    '/source/source.zip'
                ),
                buildspec=buildspec_content
            ),
            logs_config=aws.codebuild.ProjectLogsConfigArgs(
                cloudwatch_logs=aws.codebuild.ProjectLogsConfigCloudwatchLogsArgs(
                    status='ENABLED',
                    group_name=f'/aws/codebuild/{project_name}'
                ),
                s3_logs=aws.codebuild.ProjectLogsConfigS3LogsArgs(
                    status='ENABLED',
                    location=Output.concat(
                        self.storage_stack.get_bucket_name('logs'),
                        '/codebuild'
                    ),
                    encryption_disabled=False
                )
            ),
            tags={
                **self.config.get_common_tags(),
                'Name': project_name
            },
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )

        log_group = aws.cloudwatch.LogGroup(
            'build-log-group',
            name=f'/aws/codebuild/{project_name}',
            retention_in_days=self.config.log_retention_days,
            tags={
                **self.config.get_common_tags(),
                'Name': f'/aws/codebuild/{project_name}'
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.build_projects['lambda-build'] = build_project

    def get_build_project_name(self, project_key: str) -> Output[str]:
        """Get build project name."""
        project = self.build_projects.get(project_key)
        return project.name if project else Output.from_input('')

    def get_build_project_arn(self, project_key: str) -> Output[str]:
        """Get build project ARN."""
        project = self.build_projects.get(project_key)
        return project.arn if project else Output.from_input('')



```

## File: lib\infrastructure\config.py

```py
"""
Configuration module for the CI/CD pipeline infrastructure.

This module centralizes all configuration including environment variables,
region settings, and naming conventions. It uses ENVIRONMENT_SUFFIX for
consistent naming across all resources.
"""

import os
import re
from dataclasses import dataclass
from typing import Dict


@dataclass
class CICDPipelineConfig:
    """Centralized configuration for the CI/CD pipeline infrastructure."""

    environment: str
    environment_suffix: str
    project_name: str

    primary_region: str
    normalized_region: str

    lambda_runtime: str
    lambda_timeout: int
    lambda_memory_size: int
    lambda_reserved_concurrency: int
    lambda_max_retry_attempts: int

    api_rate_limit: int
    api_burst_limit: int
    api_quota_limit: int
    api_quota_period: str

    vpc_cidr: str
    vpc_availability_zones: int

    log_retention_days: int
    enable_xray_tracing: bool

    kms_key_rotation_enabled: bool

    team: str
    cost_center: str
    owner: str

    def __init__(self):
        """Initialize configuration from environment variables."""
        self.environment = os.getenv('ENVIRONMENT', 'dev')
        self.environment_suffix = os.getenv('ENVIRONMENT_SUFFIX', 'pr1234')
        self.project_name = os.getenv('PROJECT_NAME', 'cicd-pipeline')

        self.primary_region = os.getenv('AWS_REGION', 'us-east-1')
        self.normalized_region = self._normalize_region(self.primary_region)

        self.lambda_runtime = os.getenv('LAMBDA_RUNTIME', 'python3.11')
        self.lambda_timeout = int(os.getenv('LAMBDA_TIMEOUT', '300'))
        self.lambda_memory_size = int(os.getenv('LAMBDA_MEMORY_SIZE', '512'))
        self.lambda_reserved_concurrency = int(os.getenv('LAMBDA_RESERVED_CONCURRENCY', '10'))
        self.lambda_max_retry_attempts = int(os.getenv('LAMBDA_MAX_RETRY_ATTEMPTS', '2'))

        self.api_rate_limit = int(os.getenv('API_RATE_LIMIT', '1000'))
        self.api_burst_limit = int(os.getenv('API_BURST_LIMIT', '2000'))
        self.api_quota_limit = int(os.getenv('API_QUOTA_LIMIT', '10000'))
        self.api_quota_period = os.getenv('API_QUOTA_PERIOD', 'DAY')

        self.vpc_cidr = os.getenv('VPC_CIDR', '10.0.0.0/16')
        self.vpc_availability_zones = int(os.getenv('VPC_AVAILABILITY_ZONES', '2'))

        self.log_retention_days = int(os.getenv('LOG_RETENTION_DAYS', '7'))
        self.enable_xray_tracing = os.getenv('ENABLE_XRAY_TRACING', 'true').lower() == 'true'

        self.kms_key_rotation_enabled = os.getenv('KMS_KEY_ROTATION_ENABLED', 'true').lower() == 'true'

        self.team = os.getenv('TEAM', 'DevOps Team')
        self.cost_center = os.getenv('COST_CENTER', 'Engineering')
        self.owner = os.getenv('OWNER', 'DevOps Team')

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
            'Owner': self.owner,
            'ManagedBy': 'Pulumi',
            'Region': self.normalized_region
        }


```

## File: lib\infrastructure\iam.py

```py
"""
IAM module for least-privilege roles.

This module creates IAM roles and policies with strict least-privilege
access for Lambda functions, CodeBuild, and other services.
"""

import json
from typing import Dict, List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class IAMStack:
    """
    Manages IAM roles and policies with least-privilege access.

    Creates roles for Lambda, CodeBuild, and other services with
    scoped permissions.
    """

    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the IAM stack.

        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.roles: Dict[str, aws.iam.Role] = {}
        self.policies: Dict[str, aws.iam.Policy] = {}

    def create_lambda_role(
        self,
        function_name: str,
        log_group_arn: Optional[Output[str]] = None,
        s3_bucket_arns: Optional[List[Output[str]]] = None,
        kms_key_arns: Optional[List[Output[str]]] = None,
        dlq_arn: Optional[Output[str]] = None,
        enable_xray: bool = True
    ) -> aws.iam.Role:
        """
        Create IAM role for Lambda function with least-privilege permissions.

        Args:
            function_name: Name of the Lambda function
            log_group_arn: CloudWatch log group ARN
            s3_bucket_arns: List of S3 bucket ARNs
            kms_key_arns: List of KMS key ARNs
            dlq_arn: Dead letter queue ARN
            enable_xray: Enable X-Ray tracing permissions

        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name(f'{function_name}-role')

        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'lambda.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        }

        role = aws.iam.Role(
            f'{function_name}-role',
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.iam.RolePolicyAttachment(
            f'{function_name}-vpc-execution-attachment',
            role=role.name,
            policy_arn='arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole',
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

        if kms_key_arns:
            policy_statements.append(
                Output.all(*kms_key_arns).apply(lambda arns: {
                    'Effect': 'Allow',
                    'Action': [
                        'kms:Decrypt',
                        'kms:Encrypt',
                        'kms:GenerateDataKey'
                    ],
                    'Resource': arns
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
                'Resource': ['*']
            })

        if policy_statements:
            Output.all(*policy_statements).apply(lambda statements:
                aws.iam.RolePolicy(
                    f'{function_name}-policy',
                    role=role.id,
                    policy=json.dumps({
                        'Version': '2012-10-17',
                        'Statement': statements
                    }),
                    opts=self.provider_manager.get_resource_options()
                )
            )

        self.roles[function_name] = role
        return role

    def create_codebuild_role(
        self,
        s3_bucket_arns: List[Output[str]],
        kms_key_arns: List[Output[str]],
        lambda_function_arns: List[Output[str]]
    ) -> aws.iam.Role:
        """
        Create IAM role for CodeBuild with least-privilege permissions.

        Args:
            s3_bucket_arns: List of S3 bucket ARNs
            kms_key_arns: List of KMS key ARNs
            lambda_function_arns: List of Lambda function ARNs

        Returns:
            IAM Role
        """
        role_name = self.config.get_resource_name('codebuild-role')

        assume_role_policy = {
            'Version': '2012-10-17',
            'Statement': [{
                'Effect': 'Allow',
                'Principal': {'Service': 'codebuild.amazonaws.com'},
                'Action': 'sts:AssumeRole'
            }]
        }

        role = aws.iam.Role(
            'codebuild-role',
            name=role_name,
            assume_role_policy=json.dumps(assume_role_policy),
            tags={
                **self.config.get_common_tags(),
                'Name': role_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        Output.all(*s3_bucket_arns, *kms_key_arns, *lambda_function_arns).apply(
            lambda args: aws.iam.RolePolicy(
                'codebuild-policy',
                role=role.id,
                policy=json.dumps({
                    'Version': '2012-10-17',
                    'Statement': [
                        {
                            'Effect': 'Allow',
                            'Action': [
                                'logs:CreateLogGroup',
                                'logs:CreateLogStream',
                                'logs:PutLogEvents'
                            ],
                            'Resource': [
                                f'arn:aws:logs:{self.config.primary_region}:*:log-group:/aws/codebuild/{self.config.project_name}-*'
                            ]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                's3:GetObject',
                                's3:PutObject',
                                's3:ListBucket'
                            ],
                            'Resource': [arn for arn in args[:len(s3_bucket_arns)]] +
                                       [f'{arn}/*' for arn in args[:len(s3_bucket_arns)]]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                'kms:Decrypt',
                                'kms:Encrypt',
                                'kms:GenerateDataKey'
                            ],
                            'Resource': args[len(s3_bucket_arns):len(s3_bucket_arns)+len(kms_key_arns)]
                        },
                        {
                            'Effect': 'Allow',
                            'Action': [
                                'lambda:UpdateFunctionCode',
                                'lambda:UpdateFunctionConfiguration',
                                'lambda:GetFunction'
                            ],
                            'Resource': args[len(s3_bucket_arns)+len(kms_key_arns):]
                        }
                    ]
                }),
                opts=self.provider_manager.get_resource_options()
            )
        )

        self.roles['codebuild'] = role
        return role

    def get_role(self, role_name: str) -> Optional[aws.iam.Role]:
        """Get role by name."""
        return self.roles.get(role_name)

    def get_role_arn(self, role_name: str) -> Output[str]:
        """Get role ARN."""
        role = self.roles.get(role_name)
        return role.arn if role else Output.from_input('')



```

## File: lib\infrastructure\lambda_functions.py

```py
"""
Lambda Functions module for the CI/CD pipeline.

This module creates Lambda functions with proper IAM roles, environment variables,
VPC configuration, DLQ, X-Ray tracing, and retry configuration.
"""

import os
from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import FileArchive, Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig
from .iam import IAMStack
from .storage import StorageStack
from .vpc import VPCStack


class LambdaStack:
    """
    Manages Lambda functions for the CI/CD pipeline.

    Creates Lambda functions with proper configuration including VPC,
    DLQ, X-Ray tracing, and retry policies.
    """

    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager,
        iam_stack: IAMStack,
        storage_stack: StorageStack,
        vpc_stack: VPCStack
    ):
        """
        Initialize the Lambda stack.

        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
            iam_stack: IAMStack instance
            storage_stack: StorageStack instance
            vpc_stack: VPCStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.iam_stack = iam_stack
        self.storage_stack = storage_stack
        self.vpc_stack = vpc_stack
        self.functions: Dict[str, aws.lambda_.Function] = {}
        self.dlqs: Dict[str, aws.sqs.Queue] = {}

        self._create_pipeline_function()

    def _create_dlq(self, function_name: str) -> aws.sqs.Queue:
        """Create dead letter queue for Lambda function."""
        queue_name = self.config.get_resource_name(f'{function_name}-dlq')

        dlq = aws.sqs.Queue(
            f'{function_name}-dlq',
            name=queue_name,
            message_retention_seconds=1209600,
            tags={
                **self.config.get_common_tags(),
                'Name': queue_name,
                'Purpose': 'Lambda DLQ'
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.dlqs[function_name] = dlq
        return dlq

    def _create_pipeline_function(self):
        """Create pipeline Lambda function."""
        function_name = 'pipeline-handler'

        dlq = self._create_dlq(function_name)

        log_group_arn = Output.concat(
            f'arn:aws:logs:{self.config.primary_region}:',
            aws.get_caller_identity().account_id,
            f':log-group:/aws/lambda/{self.config.get_resource_name(function_name)}'
        )

        role = self.iam_stack.create_lambda_role(
            function_name,
            log_group_arn=log_group_arn,
            s3_bucket_arns=[
                self.storage_stack.get_bucket_arn('logs'),
                self.storage_stack.get_bucket_arn('artifacts')
            ],
            kms_key_arns=[self.storage_stack.get_kms_key_arn('s3')],
            dlq_arn=dlq.arn,
            enable_xray=self.config.enable_xray_tracing
        )

        resource_name = self.config.get_resource_name(function_name)
        code_path = os.path.join(os.path.dirname(__file__), 'lambda_code')

        function = aws.lambda_.Function(
            function_name,
            name=resource_name,
            runtime=self.config.lambda_runtime,
            handler='handler.handler',
            role=role.arn,
            code=FileArchive(code_path),
            timeout=self.config.lambda_timeout,
            memory_size=self.config.lambda_memory_size,
            environment=aws.lambda_.FunctionEnvironmentArgs(
                variables={
                    'ENVIRONMENT': self.config.environment,
                    'LOG_BUCKET': self.storage_stack.get_bucket_name('logs'),
                    'ARTIFACT_BUCKET': self.storage_stack.get_bucket_name('artifacts')
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
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[role]
            )
        )

        aws.lambda_.FunctionEventInvokeConfig(
            f'{function_name}-event-config',
            function_name=function.name,
            maximum_retry_attempts=self.config.lambda_max_retry_attempts,
            maximum_event_age_in_seconds=21600,
            destination_config=aws.lambda_.FunctionEventInvokeConfigDestinationConfigArgs(
                on_failure=aws.lambda_.FunctionEventInvokeConfigDestinationConfigOnFailureArgs(
                    destination=dlq.arn
                )
            ),
            opts=self.provider_manager.get_resource_options()
        )

        self.functions[function_name] = function

    def get_function(self, function_name: str) -> aws.lambda_.Function:
        """Get Lambda function by name."""
        return self.functions.get(function_name)

    def get_function_name(self, function_name: str) -> Output[str]:
        """Get Lambda function name."""
        function = self.functions.get(function_name)
        return function.name if function else Output.from_input('')

    def get_function_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function ARN."""
        function = self.functions.get(function_name)
        return function.arn if function else Output.from_input('')

    def get_function_invoke_arn(self, function_name: str) -> Output[str]:
        """Get Lambda function invoke ARN."""
        function = self.functions.get(function_name)
        return function.invoke_arn if function else Output.from_input('')

    def get_dlq_url(self, function_name: str) -> Output[str]:
        """Get DLQ URL."""
        dlq = self.dlqs.get(function_name)
        return dlq.url if dlq else Output.from_input('')

    def get_dlq_arn(self, function_name: str) -> Output[str]:
        """Get DLQ ARN."""
        dlq = self.dlqs.get(function_name)
        return dlq.arn if dlq else Output.from_input('')


```

## File: lib\infrastructure\monitoring.py

```py
"""
Monitoring module for CloudWatch logs, alarms, and dashboards.

This module creates CloudWatch log groups with proper retention,
error rate alarms using metric math, and dashboards for visualization.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig
from .lambda_functions import LambdaStack


class MonitoringStack:
    """
    Manages CloudWatch monitoring resources.

    Creates log groups, error rate alarms, and dashboards.
    """

    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the monitoring stack.

        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.log_groups: Dict[str, aws.cloudwatch.LogGroup] = {}
        self.alarms: Dict[str, aws.cloudwatch.MetricAlarm] = {}
        self.sns_topic = None

        self._create_sns_topic()
        self._create_lambda_log_groups()
        self._create_lambda_alarms()
        self._create_dashboard()

    def _create_sns_topic(self):
        """Create SNS topic for alarm notifications."""
        topic_name = self.config.get_resource_name('alarms')

        self.sns_topic = aws.sns.Topic(
            'alarm-topic',
            name=topic_name,
            tags={
                **self.config.get_common_tags(),
                'Name': topic_name
            },
            opts=self.provider_manager.get_resource_options()
        )

    def _create_lambda_log_groups(self):
        """Create CloudWatch log groups for Lambda functions."""
        function_name = 'pipeline-handler'
        log_group_name = f'/aws/lambda/{self.config.get_resource_name(function_name)}'

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

        self.log_groups[function_name] = log_group

    def _create_lambda_alarms(self):
        """Create CloudWatch alarms for Lambda functions with error rate metrics."""
        function_name = 'pipeline-handler'

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

        throttle_alarm = aws.cloudwatch.MetricAlarm(
            f'{function_name}-throttle-alarm',
            name=self.config.get_resource_name(f'{function_name}-throttles'),
            comparison_operator='GreaterThanThreshold',
            evaluation_periods=1,
            metric_name='Throttles',
            namespace='AWS/Lambda',
            period=300,
            statistic='Sum',
            threshold=5,
            alarm_description=f'Throttles detected for {function_name}',
            alarm_actions=[self.sns_topic.arn],
            dimensions={
                'FunctionName': function_resource_name
            },
            tags={
                **self.config.get_common_tags(),
                'Name': self.config.get_resource_name(f'{function_name}-throttles')
            },
            opts=self.provider_manager.get_resource_options()
        )

        self.alarms[f'{function_name}-throttle'] = throttle_alarm

    def _create_dashboard(self):
        """Create CloudWatch dashboard for Lambda metrics."""
        dashboard_name = self.config.get_resource_name('dashboard')
        function_name = 'pipeline-handler'
        function_resource_name = self.config.get_resource_name(function_name)

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
                            ['AWS/Lambda', 'Invocations', {'stat': 'Sum'}],
                            ['AWS/Lambda', 'Errors', {'stat': 'Sum'}],
                            ['AWS/Lambda', 'Throttles', {'stat': 'Sum'}],
                            ['AWS/Lambda', 'Duration', {'stat': 'Average'}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[1],
                        'title': f'Lambda Metrics - {args[0]}',
                        'period': 300,
                        'yAxis': {'left': {'label': 'Count'}}
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
                            [{'expression': '(m1 / m2) * 100', 'label': 'Error Rate (%)', 'id': 'e1'}],
                            ['AWS/Lambda', 'Errors', {'id': 'm1', 'visible': False}],
                            ['AWS/Lambda', 'Invocations', {'id': 'm2', 'visible': False}]
                        ],
                        'view': 'timeSeries',
                        'stacked': False,
                        'region': args[1],
                        'title': 'Error Rate %',
                        'period': 300,
                        'yAxis': {'left': {'label': 'Percent'}}
                    }
                }
            ]
        })

        dashboard = aws.cloudwatch.Dashboard(
            'lambda-dashboard',
            dashboard_name=dashboard_name,
            dashboard_body=dashboard_body.apply(lambda body: pulumi.Output.json_dumps(body)),
            opts=self.provider_manager.get_resource_options()
        )

    def get_log_group(self, function_name: str) -> aws.cloudwatch.LogGroup:
        """Get log group by function name."""
        return self.log_groups.get(function_name)

    def get_log_group_name(self, function_name: str) -> Output[str]:
        """Get log group name."""
        log_group = self.log_groups.get(function_name)
        return log_group.name if log_group else Output.from_input('')

    def get_log_group_arn(self, function_name: str) -> Output[str]:
        """Get log group ARN."""
        log_group = self.log_groups.get(function_name)
        return log_group.arn if log_group else Output.from_input('')

    def get_sns_topic_arn(self) -> Output[str]:
        """Get SNS topic ARN."""
        return self.sns_topic.arn if self.sns_topic else Output.from_input('')


```

## File: lib\infrastructure\storage.py

```py
"""
Storage module for S3 buckets.

This module creates S3 buckets for logs and artifacts with proper
encryption, versioning, and lifecycle policies.
"""

from typing import Dict

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class StorageStack:
    """
    Manages S3 buckets for logs and artifacts.

    Creates buckets with KMS encryption, versioning, and lifecycle policies.
    """

    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the storage stack.

        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.buckets: Dict[str, aws.s3.Bucket] = {}
        self.kms_keys: Dict[str, aws.kms.Key] = {}

        self._create_kms_keys()
        self._create_log_bucket()
        self._create_artifact_bucket()

    def _create_kms_keys(self):
        """Create KMS keys for S3 encryption."""
        s3_key_name = self.config.get_resource_name('s3-key')

        s3_key = aws.kms.Key(
            's3-kms-key',
            description='KMS key for S3 bucket encryption',
            enable_key_rotation=self.config.kms_key_rotation_enabled,
            tags={
                **self.config.get_common_tags(),
                'Name': s3_key_name
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.kms.Alias(
            's3-kms-alias',
            target_key_id=s3_key.id,
            name=f'alias/{self.config.get_resource_name("s3", include_region=False)}',
            opts=self.provider_manager.get_resource_options()
        )

        self.kms_keys['s3'] = s3_key

    def _create_log_bucket(self):
        """Create S3 bucket for Lambda logs."""
        bucket_name = self.config.get_normalized_resource_name('logs')

        log_bucket = aws.s3.Bucket(
            'log-bucket',
            bucket=bucket_name,
            tags={
                **self.config.get_common_tags(),
                'Name': bucket_name,
                'Purpose': 'Lambda Logs'
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketVersioning(
            'log-bucket-versioning',
            bucket=log_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketServerSideEncryptionConfiguration(
            'log-bucket-encryption',
            bucket=log_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=self.kms_keys['s3'].arn
                ),
                bucket_key_enabled=True
            )],
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketPublicAccessBlock(
            'log-bucket-public-access-block',
            bucket=log_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketLifecycleConfiguration(
            'log-bucket-lifecycle',
            bucket=log_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='transition-to-ia',
                    status='Enabled',
                    transitions=[
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=30,
                            storage_class='STANDARD_IA'
                        ),
                        aws.s3.BucketLifecycleConfigurationRuleTransitionArgs(
                            days=90,
                            storage_class='GLACIER'
                        )
                    ]
                ),
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-logs',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=365
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options()
        )

        self.buckets['logs'] = log_bucket

    def _create_artifact_bucket(self):
        """Create S3 bucket for build artifacts."""
        bucket_name = self.config.get_normalized_resource_name('artifacts')

        artifact_bucket = aws.s3.Bucket(
            'artifact-bucket',
            bucket=bucket_name,
            tags={
                **self.config.get_common_tags(),
                'Name': bucket_name,
                'Purpose': 'Build Artifacts'
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketVersioning(
            'artifact-bucket-versioning',
            bucket=artifact_bucket.id,
            versioning_configuration=aws.s3.BucketVersioningVersioningConfigurationArgs(
                status='Enabled'
            ),
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketServerSideEncryptionConfiguration(
            'artifact-bucket-encryption',
            bucket=artifact_bucket.id,
            rules=[aws.s3.BucketServerSideEncryptionConfigurationRuleArgs(
                apply_server_side_encryption_by_default=aws.s3.BucketServerSideEncryptionConfigurationRuleApplyServerSideEncryptionByDefaultArgs(
                    sse_algorithm='aws:kms',
                    kms_master_key_id=self.kms_keys['s3'].arn
                ),
                bucket_key_enabled=True
            )],
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketPublicAccessBlock(
            'artifact-bucket-public-access-block',
            bucket=artifact_bucket.id,
            block_public_acls=True,
            block_public_policy=True,
            ignore_public_acls=True,
            restrict_public_buckets=True,
            opts=self.provider_manager.get_resource_options()
        )

        aws.s3.BucketLifecycleConfiguration(
            'artifact-bucket-lifecycle',
            bucket=artifact_bucket.id,
            rules=[
                aws.s3.BucketLifecycleConfigurationRuleArgs(
                    id='expire-old-artifacts',
                    status='Enabled',
                    expiration=aws.s3.BucketLifecycleConfigurationRuleExpirationArgs(
                        days=90
                    )
                )
            ],
            opts=self.provider_manager.get_resource_options()
        )

        self.buckets['artifacts'] = artifact_bucket

    def get_bucket(self, bucket_type: str) -> aws.s3.Bucket:
        """Get bucket by type."""
        return self.buckets.get(bucket_type)

    def get_bucket_name(self, bucket_type: str) -> Output[str]:
        """Get bucket name."""
        bucket = self.buckets.get(bucket_type)
        return bucket.id if bucket else Output.from_input('')

    def get_bucket_arn(self, bucket_type: str) -> Output[str]:
        """Get bucket ARN."""
        bucket = self.buckets.get(bucket_type)
        return bucket.arn if bucket else Output.from_input('')

    def get_kms_key_arn(self, key_type: str) -> Output[str]:
        """Get KMS key ARN."""
        key = self.kms_keys.get(key_type)
        return key.arn if key else Output.from_input('')



```

## File: lib\infrastructure\vpc.py

```py
"""
VPC module for Lambda functions.

This module creates VPC resources including subnets, security groups,
NAT gateways, and VPC endpoints for secure Lambda deployment.
"""

from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import CICDPipelineConfig


class VPCStack:
    """
    Manages VPC resources for Lambda functions.

    Creates VPC with public and private subnets, NAT gateways,
    and VPC endpoints for S3 and other AWS services.
    """

    def __init__(
        self,
        config: CICDPipelineConfig,
        provider_manager: AWSProviderManager
    ):
        """
        Initialize the VPC stack.

        Args:
            config: CICDPipelineConfig instance
            provider_manager: AWSProviderManager instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.vpc = None
        self.public_subnets: List[aws.ec2.Subnet] = []
        self.private_subnets: List[aws.ec2.Subnet] = []
        self.private_route_tables: List[aws.ec2.RouteTable] = []
        self.security_groups: Dict[str, aws.ec2.SecurityGroup] = {}
        self.vpc_endpoints: Dict[str, aws.ec2.VpcEndpoint] = {}

        self._create_vpc()
        self._create_subnets()
        self._create_internet_gateway()
        self._create_nat_gateways()
        self._create_route_tables()
        self._create_security_groups()
        self._create_vpc_endpoints()

    def _create_vpc(self):
        """Create VPC."""
        resource_name = self.config.get_resource_name('vpc')

        self.vpc = aws.ec2.Vpc(
            'vpc',
            cidr_block=self.config.vpc_cidr,
            enable_dns_support=True,
            enable_dns_hostnames=True,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )

    def _create_subnets(self):
        """Create public and private subnets across availability zones."""
        azs_output = aws.get_availability_zones(state='available')
        azs = azs_output.names[:self.config.vpc_availability_zones]

        for i, az in enumerate(azs):
            public_subnet_name = self.config.get_resource_name(f'public-subnet-{i+1}')
            private_subnet_name = self.config.get_resource_name(f'private-subnet-{i+1}')

            public_subnet = aws.ec2.Subnet(
                f'public-subnet-{i}',
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i*2}.0/24',
                availability_zone=az,
                map_public_ip_on_launch=True,
                tags={
                    **self.config.get_common_tags(),
                    'Name': public_subnet_name,
                    'Type': 'Public'
                },
                opts=self.provider_manager.get_resource_options()
            )
            self.public_subnets.append(public_subnet)

            private_subnet = aws.ec2.Subnet(
                f'private-subnet-{i}',
                vpc_id=self.vpc.id,
                cidr_block=f'10.0.{i*2+1}.0/24',
                availability_zone=az,
                tags={
                    **self.config.get_common_tags(),
                    'Name': private_subnet_name,
                    'Type': 'Private'
                },
                opts=self.provider_manager.get_resource_options()
            )
            self.private_subnets.append(private_subnet)

    def _create_internet_gateway(self):
        """Create Internet Gateway for public subnets."""
        resource_name = self.config.get_resource_name('igw')

        self.igw = aws.ec2.InternetGateway(
            'igw',
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': resource_name
            },
            opts=self.provider_manager.get_resource_options()
        )

    def _create_nat_gateways(self):
        """Create NAT Gateways for private subnets."""
        self.nat_gateways = []

        for i, public_subnet in enumerate(self.public_subnets):
            eip_name = self.config.get_resource_name(f'nat-eip-{i+1}')
            nat_name = self.config.get_resource_name(f'nat-{i+1}')

            eip = aws.ec2.Eip(
                f'nat-eip-{i}',
                domain='vpc',
                tags={
                    **self.config.get_common_tags(),
                    'Name': eip_name
                },
                opts=self.provider_manager.get_resource_options()
            )

            nat = aws.ec2.NatGateway(
                f'nat-{i}',
                subnet_id=public_subnet.id,
                allocation_id=eip.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': nat_name
                },
                opts=self.provider_manager.get_resource_options()
            )
            self.nat_gateways.append(nat)

    def _create_route_tables(self):
        """Create route tables for public and private subnets."""
        public_rt_name = self.config.get_resource_name('public-rt')

        public_rt = aws.ec2.RouteTable(
            'public-rt',
            vpc_id=self.vpc.id,
            tags={
                **self.config.get_common_tags(),
                'Name': public_rt_name,
                'Type': 'Public'
            },
            opts=self.provider_manager.get_resource_options()
        )

        aws.ec2.Route(
            'public-route',
            route_table_id=public_rt.id,
            destination_cidr_block='0.0.0.0/0',
            gateway_id=self.igw.id,
            opts=self.provider_manager.get_resource_options()
        )

        for i, public_subnet in enumerate(self.public_subnets):
            aws.ec2.RouteTableAssociation(
                f'public-rt-assoc-{i}',
                subnet_id=public_subnet.id,
                route_table_id=public_rt.id,
                opts=self.provider_manager.get_resource_options()
            )

        for i, (private_subnet, nat) in enumerate(zip(self.private_subnets, self.nat_gateways)):
            private_rt_name = self.config.get_resource_name(f'private-rt-{i+1}')

            private_rt = aws.ec2.RouteTable(
                f'private-rt-{i}',
                vpc_id=self.vpc.id,
                tags={
                    **self.config.get_common_tags(),
                    'Name': private_rt_name,
                    'Type': 'Private'
                },
                opts=self.provider_manager.get_resource_options()
            )
            self.private_route_tables.append(private_rt)

            aws.ec2.Route(
                f'private-route-{i}',
                route_table_id=private_rt.id,
                destination_cidr_block='0.0.0.0/0',
                nat_gateway_id=nat.id,
                opts=self.provider_manager.get_resource_options()
            )

            aws.ec2.RouteTableAssociation(
                f'private-rt-assoc-{i}',
                subnet_id=private_subnet.id,
                route_table_id=private_rt.id,
                opts=self.provider_manager.get_resource_options()
            )

    def _create_security_groups(self):
        """Create security groups for Lambda functions."""
        lambda_sg_name = self.config.get_resource_name('lambda-sg')

        lambda_sg = aws.ec2.SecurityGroup(
            'lambda-sg',
            vpc_id=self.vpc.id,
            description='Security group for Lambda functions',
            egress=[aws.ec2.SecurityGroupEgressArgs(
                from_port=0,
                to_port=0,
                protocol='-1',
                cidr_blocks=['0.0.0.0/0'],
                description='Allow all outbound traffic'
            )],
            tags={
                **self.config.get_common_tags(),
                'Name': lambda_sg_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        self.security_groups['lambda'] = lambda_sg

    def _create_vpc_endpoints(self):
        """Create VPC endpoints for AWS services."""
        s3_endpoint_name = self.config.get_resource_name('s3-endpoint')

        s3_endpoint = aws.ec2.VpcEndpoint(
            's3-endpoint',
            vpc_id=self.vpc.id,
            service_name=f'com.amazonaws.{self.config.primary_region}.s3',
            vpc_endpoint_type='Gateway',
            route_table_ids=[rt.id for rt in self.private_route_tables],
            tags={
                **self.config.get_common_tags(),
                'Name': s3_endpoint_name
            },
            opts=self.provider_manager.get_resource_options()
        )
        self.vpc_endpoints['s3'] = s3_endpoint

    def get_vpc_id(self) -> Output[str]:
        """Get VPC ID."""
        return self.vpc.id

    def get_private_subnet_ids(self) -> Output[List[str]]:
        """Get private subnet IDs."""
        return Output.all(*[subnet.id for subnet in self.private_subnets])

    def get_lambda_security_group_id(self) -> Output[str]:
        """Get Lambda security group ID."""
        return self.security_groups['lambda'].id


```
