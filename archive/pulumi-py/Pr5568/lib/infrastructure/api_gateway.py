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

