"""
API Gateway module.

This module creates a REST API Gateway that triggers Lambda functions
with proper integration and deployment configuration.
"""

import pulumi
import pulumi_aws as aws
from pulumi import Output, ResourceOptions

from .config import ServerlessConfig


class APIGatewayStack:
    """
    Manages API Gateway for Lambda function invocation.
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        lambda_function_arn: Output[str],
        lambda_function_name: Output[str],
        parent: pulumi.Resource
    ):
        """
        Initialize API Gateway stack.
        
        Args:
            config: Serverless configuration
            provider: AWS provider instance
            lambda_function_arn: Lambda function ARN
            lambda_function_name: Lambda function name
            parent: Parent resource for dependency management
        """
        self.config = config
        self.provider = provider
        self.lambda_function_arn = lambda_function_arn
        self.lambda_function_name = lambda_function_name
        self.parent = parent
        
        # Create API Gateway
        self.rest_api = self._create_rest_api()
        self.resource = self._create_resource()
        self.method = self._create_method()
        self.integration = self._create_integration()
        self._create_method_response()
        self._create_integration_response()
        self.deployment = self._create_deployment()
        self.stage = self._create_stage()
        self._configure_lambda_permission()
        
        # Construct API URL
        self.api_url = Output.concat(
            "https://",
            self.rest_api.id,
            ".execute-api.",
            self.config.primary_region,
            ".amazonaws.com/",
            self.stage.stage_name,
            "/process"
        )
    
    def _create_rest_api(self) -> aws.apigateway.RestApi:
        """Create REST API."""
        api_name = self.config.get_resource_name('api')
        
        return aws.apigateway.RestApi(
            api_name,
            name=api_name,
            description="API for serverless file processing",
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def _create_resource(self) -> aws.apigateway.Resource:
        """Create API resource."""
        api_name = self.config.get_resource_name('api')
        
        return aws.apigateway.Resource(
            f"{api_name}-resource",
            rest_api=self.rest_api.id,
            parent_id=self.rest_api.root_resource_id,
            path_part="process",
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def _create_method(self) -> aws.apigateway.Method:
        """Create POST method."""
        api_name = self.config.get_resource_name('api')
        
        return aws.apigateway.Method(
            f"{api_name}-method",
            rest_api=self.rest_api.id,
            resource_id=self.resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def _create_integration(self) -> aws.apigateway.Integration:
        """Create Lambda integration."""
        api_name = self.config.get_resource_name('api')
        
        return aws.apigateway.Integration(
            f"{api_name}-integration",
            rest_api=self.rest_api.id,
            resource_id=self.resource.id,
            http_method=self.method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_function_arn.apply(
                lambda arn: f"arn:aws:apigateway:{self.config.primary_region}:lambda:path/2015-03-31/functions/{arn}/invocations"
            ),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def _create_method_response(self):
        """Create method response."""
        api_name = self.config.get_resource_name('api')
        
        aws.apigateway.MethodResponse(
            f"{api_name}-method-response",
            rest_api=self.rest_api.id,
            resource_id=self.resource.id,
            http_method=self.method.http_method,
            status_code="200",
            response_models={
                "application/json": "Empty"
            },
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def _create_integration_response(self):
        """Create integration response."""
        api_name = self.config.get_resource_name('api')
        
        aws.apigateway.IntegrationResponse(
            f"{api_name}-integration-response",
            rest_api=self.rest_api.id,
            resource_id=self.resource.id,
            http_method=self.method.http_method,
            status_code="200",
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent,
                depends_on=[self.integration]
            )
        )
    
    def _create_deployment(self) -> aws.apigateway.Deployment:
        """Create API deployment."""
        api_name = self.config.get_resource_name('api')
        
        return aws.apigateway.Deployment(
            f"{api_name}-deployment",
            rest_api=self.rest_api.id,
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent,
                depends_on=[self.method, self.integration]
            )
        )
    
    def _create_stage(self) -> aws.apigateway.Stage:
        """Create API stage with throttling."""
        api_name = self.config.get_resource_name('api')
        
        return aws.apigateway.Stage(
            f"{api_name}-stage",
            rest_api=self.rest_api.id,
            deployment=self.deployment.id,
            stage_name=self.config.environment_suffix,
            tags=self.config.get_common_tags(),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def _configure_lambda_permission(self):
        """Grant API Gateway permission to invoke Lambda."""
        api_name = self.config.get_resource_name('api')
        
        aws.lambda_.Permission(
            f"{api_name}-lambda-permission",
            action="lambda:InvokeFunction",
            function=self.lambda_function_name,
            principal="apigateway.amazonaws.com",
            source_arn=Output.concat(
                self.rest_api.execution_arn,
                "/*/*"
            ),
            opts=ResourceOptions(
                provider=self.provider,
                parent=self.parent
            )
        )
    
    def get_api_url(self) -> Output[str]:
        """
        Get API Gateway URL.
        
        Returns:
            API URL as Output
        """
        return self.api_url
    
    def get_rest_api_id(self) -> Output[str]:
        """
        Get REST API ID.
        
        Returns:
            REST API ID as Output
        """
        return self.rest_api.id

