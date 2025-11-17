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
