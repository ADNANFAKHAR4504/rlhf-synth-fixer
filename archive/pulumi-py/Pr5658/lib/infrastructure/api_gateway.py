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

