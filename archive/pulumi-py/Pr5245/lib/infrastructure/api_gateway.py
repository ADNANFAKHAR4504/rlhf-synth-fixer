"""
API Gateway module for the serverless transaction pipeline.

This module creates API Gateway REST API with proper Lambda integration,
request validation, and throttling.

Addresses Model Failures:
- API Gateway → Lambda integration URI format
- API Gateway invoke permission source_arn format
- API deployment and stage permission dependencies
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import TransactionPipelineConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway for the transaction pipeline.
    
    Creates REST API with proper Lambda integration and throttling.
    """
    
    def __init__(
        self,
        config: TransactionPipelineConfig,
        provider_manager: AWSProviderManager,
        lambda_stack: LambdaStack
    ):
        """
        Initialize the API Gateway stack.
        
        Args:
            config: TransactionPipelineConfig instance
            provider_manager: AWSProviderManager instance
            lambda_stack: LambdaStack instance
        """
        self.config = config
        self.provider_manager = provider_manager
        self.lambda_stack = lambda_stack
        
        self._create_rest_api()
        self._create_resources()
        self._create_methods()
        self._create_integrations()
        self._create_permissions()
        self._create_deployment()
        self._create_stage()
    
    def _create_rest_api(self):
        """Create REST API."""
        api_name = self.config.get_resource_name('api')
        
        self.api = aws.apigateway.RestApi(
            "transaction-api",
            name=api_name,
            description="Transaction validation pipeline API",
            endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
                types="REGIONAL"
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
    
    def _create_resources(self):
        """Create API resources."""
        self.transactions_resource = aws.apigateway.Resource(
            "transactions-resource",
            rest_api=self.api.id,
            parent_id=self.api.root_resource_id,
            path_part="transactions",
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )
    
    def _create_methods(self):
        """Create API methods with request validation."""
        self.post_method = aws.apigateway.Method(
            "post-transactions-method",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method="POST",
            authorization="NONE",
            request_validator_id=self._create_request_validator().id,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.transactions_resource]
            )
        )
    
    def _create_request_validator(self) -> aws.apigateway.RequestValidator:
        """Create request validator."""
        return aws.apigateway.RequestValidator(
            "request-validator",
            rest_api=self.api.id,
            name=self.config.get_resource_name('validator'),
            validate_request_body=True,
            validate_request_parameters=True,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api]
            )
        )
    
    def _create_integrations(self):
        """
        Create Lambda integrations with correct URI format.
        
        Addresses Failure 1: Use proper API Gateway service integration path format.
        """
        transaction_receiver = self.lambda_stack.get_function('transaction-receiver')
        
        integration_uri = Output.all(
            self.config.primary_region,
            transaction_receiver.arn
        ).apply(
            lambda args: f"arn:aws:apigateway:{args[0]}:lambda:path/2015-03-31/functions/{args[1]}/invocations"
        )
        
        self.integration = aws.apigateway.Integration(
            "post-transactions-integration",
            rest_api=self.api.id,
            resource_id=self.transactions_resource.id,
            http_method=self.post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=integration_uri,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.transactions_resource, self.post_method, transaction_receiver]
            )
        )
    
    def _create_permissions(self):
        """
        Create Lambda invoke permissions with correct source_arn format.
        
        Addresses Failure 2: Proper execute-api source ARN format.
        """
        transaction_receiver = self.lambda_stack.get_function('transaction-receiver')
        
        source_arn = Output.all(
            self.api.execution_arn,
            self.post_method.http_method,
            self.transactions_resource.path_part
        ).apply(
            lambda args: f"{args[0]}/*/{args[1]}/{args[2]}"
        )
        
        self.lambda_permission = aws.lambda_.Permission(
            "api-lambda-permission",
            action="lambda:InvokeFunction",
            function=transaction_receiver.name,
            principal="apigateway.amazonaws.com",
            source_arn=source_arn,
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, transaction_receiver, self.post_method]
            )
        )
    
    def _create_deployment(self):
        """
        Create API deployment with proper dependencies.
        
        Addresses Failure 9: Proper dependency ordering for deployments.
        """
        self.deployment = aws.apigateway.Deployment(
            "api-deployment",
            rest_api=self.api.id,
            description="Transaction API deployment",
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[
                    self.api,
                    self.transactions_resource,
                    self.post_method,
                    self.integration,
                    self.lambda_permission
                ]
            )
        )
    
    def _create_stage(self):
        """Create API stage with throttling and X-Ray tracing."""
        stage_name = self.config.environment
        
        self.stage = aws.apigateway.Stage(
            "api-stage",
            rest_api=self.api.id,
            deployment=self.deployment.id,
            stage_name=stage_name,
            xray_tracing_enabled=self.config.enable_xray_tracing,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.deployment]
            )
        )
        
        aws.apigateway.MethodSettings(
            "api-method-settings",
            rest_api=self.api.id,
            stage_name=self.stage.stage_name,
            method_path="*/*",
            settings=aws.apigateway.MethodSettingsSettingsArgs(
                throttling_rate_limit=self.config.api_throttle_rate_limit,
                throttling_burst_limit=self.config.api_throttle_burst_limit,
                metrics_enabled=True
            ),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider(),
                depends_on=[self.api, self.stage]
            )
        )
    
    def get_api_url(self) -> Output[str]:
        """Get API Gateway URL."""
        return Output.all(
            self.api.id,
            self.stage.stage_name,
            self.config.primary_region
        ).apply(
            lambda args: f"https://{args[0]}.execute-api.{args[2]}.amazonaws.com/{args[1]}"
        )
    
    def get_api_id(self) -> Output[str]:
        """Get API Gateway ID."""
        return self.api.id
    
    def get_api_endpoint(self) -> Output[str]:
        """Get API Gateway endpoint URL."""
        return self.get_api_url()

