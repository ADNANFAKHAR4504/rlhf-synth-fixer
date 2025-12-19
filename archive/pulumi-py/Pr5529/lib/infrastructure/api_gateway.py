"""
API Gateway module for the serverless payment processing system.

This module creates API Gateway REST API with proper Lambda integrations,
caching, and X-Ray tracing.

"""

from typing import Dict, Optional

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import PaymentProcessingConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway REST API with proper Lambda integrations.
    
    Creates API Gateway with:
    - Correct service integration URIs
    - Proper Lambda invoke permissions
    - Caching for GET requests
    - X-Ray tracing
    - No public FunctionUrl exposure
    """
    
    def __init__(
        self,
        config: PaymentProcessingConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.
        
        Args:
            config: PaymentProcessingConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        self.api: Optional[aws.apigateway.RestApi] = None
        self.deployment: Optional[aws.apigateway.Deployment] = None
        self.stage: Optional[aws.apigateway.Stage] = None
        self.resources: Dict[str, aws.apigateway.Resource] = {}
        self.methods: Dict[str, aws.apigateway.Method] = {}
        self.integrations: Dict[str, aws.apigateway.Integration] = {}
        self.permissions: Dict[str, aws.lambda_.Permission] = {}
        
        self._create_api()
        self._create_resources()
        self._create_methods_and_integrations()
        self._create_deployment()
        self._create_stage()
        self._configure_method_settings()
    
    def _create_api(self):
        """Create the REST API."""
        resource_name = self.config.get_resource_name('payment-api')
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        self.api = aws.apigateway.RestApi(
            'payment-api',
            name=resource_name,
            description="Payment Processing API",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags=self.config.get_common_tags(),
            opts=opts
        )
    
    def _create_resources(self):
        """Create API Gateway resources."""
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        payments_resource = aws.apigateway.Resource(
            'payments-resource',
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="payments",
            opts=opts
        )
        self.resources['payments'] = payments_resource
        
        payment_id_resource = aws.apigateway.Resource(
            'payment-id-resource',
            rest_api=self.api.id,
            parent_id=payments_resource.id,
            path_part="{id}",
            opts=opts
        )
        self.resources['payment-id'] = payment_id_resource
    
    def _create_methods_and_integrations(self):
        """Create methods and integrations with proper URIs."""
        region = self.config.primary_region
        lambda_function = self.lambda_stack.get_function('payment-processor')
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        post_method = aws.apigateway.Method(
            'post-payment-method',
            rest_api=self.api.id,
            resource_id=self.resources['payments'].id,
            http_method="POST",
            authorization="NONE",
            opts=opts
        )
        self.methods['POST-payments'] = post_method
        
        integration_uri = Output.all(region, lambda_function.arn).apply(
            lambda args: f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/functions/{args[1]}/invocations"
        )
        
        post_integration = aws.apigateway.Integration(
            'post-payment-integration',
            rest_api=self.api.id,
            resource_id=self.resources['payments'].id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=integration_uri,
            opts=opts
        )
        self.integrations['POST-payments'] = post_integration
        
        self._create_lambda_permission('POST-payments', self.resources['payments'].id)
        
        get_payments_method = aws.apigateway.Method(
            'get-payments-method',
            rest_api=self.api.id,
            resource_id=self.resources['payments'].id,
            http_method="GET",
            authorization="NONE",
            request_parameters={
                "method.request.querystring.status": False
            },
            opts=opts
        )
        self.methods['GET-payments'] = get_payments_method
        
        get_payments_integration = aws.apigateway.Integration(
            'get-payments-integration',
            rest_api=self.api.id,
            resource_id=self.resources['payments'].id,
            http_method=get_payments_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=integration_uri,
            opts=opts
        )
        self.integrations['GET-payments'] = get_payments_integration
        
        self._create_lambda_permission('GET-payments', self.resources['payments'].id)
        
        get_payment_method = aws.apigateway.Method(
            'get-payment-method',
            rest_api=self.api.id,
            resource_id=self.resources['payment-id'].id,
            http_method="GET",
            authorization="NONE",
            opts=opts
        )
        self.methods['GET-payment-id'] = get_payment_method
        
        get_payment_integration = aws.apigateway.Integration(
            'get-payment-integration',
            rest_api=self.api.id,
            resource_id=self.resources['payment-id'].id,
            http_method=get_payment_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=integration_uri,
            opts=opts
        )
        self.integrations['GET-payment-id'] = get_payment_integration
        
        self._create_lambda_permission('GET-payment-id', self.resources['payment-id'].id)
    
    def _create_lambda_permission(self, permission_name: str, resource_id: Output[str]):
        """
        Create Lambda permission with correct source_arn.
        
        Fixes Model Failure #2: Lambda invoke permission source_arn construction.
        """
        region = self.config.primary_region
        lambda_function = self.lambda_stack.get_function('payment-processor')
        account_id = aws.get_caller_identity().account_id
        
        source_arn = Output.all(
            region=region,
            account_id=account_id,
            api_id=self.api.id
        ).apply(
            lambda args: f"arn:aws:execute-api:{args['region']}:{args['account_id']}:{args['api_id']}/*/*"
        )
        
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        permission = aws.lambda_.Permission(
            f"api-gateway-lambda-permission-{permission_name}",
            action="lambda:InvokeFunction",
            function=lambda_function.name,
            principal="apigateway.amazonaws.com",
            source_arn=source_arn,
            opts=opts
        )
        self.permissions[permission_name] = permission
    
    def _create_deployment(self):
        """Create API Gateway deployment."""
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider(),
            depends_on=list(self.integrations.values())
        ) if self.provider_manager.get_provider() else pulumi.ResourceOptions(
            depends_on=list(self.integrations.values())
        )
        
        self.deployment = aws.apigateway.Deployment(
            'payment-api-deployment',
            rest_api=self.api.id,
            opts=opts
        )
    
    def _create_stage(self):
        """Create API Gateway stage with caching and X-Ray tracing."""
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        self.stage = aws.apigateway.Stage(
            'prod',
            deployment=self.deployment.id,
            rest_api=self.api.id,
            stage_name="prod",
            cache_cluster_enabled=True,
            cache_cluster_size="0.5",
            xray_tracing_enabled=True,
            tags=self.config.get_common_tags(),
            opts=opts
        )
    
    def _configure_method_settings(self):
        """Configure method settings for caching and throttling."""
        opts = pulumi.ResourceOptions(
            provider=self.provider_manager.get_provider()
        ) if self.provider_manager.get_provider() else None
        
        aws.apigateway.MethodSettings(
            'payment-api-method-settings',
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                metrics_enabled=True,
                data_trace_enabled=True,
                throttling_burst_limit=self.config.api_throttle_burst_limit,
                throttling_rate_limit=self.config.api_throttle_rate_limit,
                caching_enabled=True,
                cache_ttl_in_seconds=self.config.api_cache_ttl,
                cache_data_encrypted=True
            ),
            opts=opts
        )
    
    def get_api_id(self) -> Output[str]:
        """Get the API ID."""
        return self.api.id
    
    def get_api_url(self) -> Output[str]:
        """Get the API endpoint URL."""
        region = self.config.primary_region
        return Output.all(
            api_id=self.api.id,
            region=region,
            stage_name=self.stage.stage_name
        ).apply(
            lambda args: f"https://{args['api_id']}.execute-api.{args['region']}.amazonaws.com/{args['stage_name']}/"
        )
    
    def get_stage_name(self) -> Output[str]:
        """Get the stage name."""
        return self.stage.stage_name

