"""
API Gateway management for serverless application.

This module creates a REST API with endpoints that trigger Lambda functions.
"""

import pulumi
import pulumi_aws as aws

from .config import ServerlessConfig


class APIGatewayStack(pulumi.ComponentResource):
    """
    Manages API Gateway for the serverless application.
    
    Creates a REST API with:
    - /items endpoint (POST, GET)
    - Lambda integration
    - Deployment and stage
    """
    
    def __init__(
        self,
        config: ServerlessConfig,
        provider: aws.Provider,
        lambda_stack: 'LambdaStack',
        parent: pulumi.Resource = None
    ):
        """
        Initialize API Gateway stack.
        
        Args:
            config: ServerlessConfig instance
            provider: AWS provider instance
            lambda_stack: Lambda stack with functions
            parent: Parent Pulumi resource
        """
        super().__init__(
            "serverless:apigateway:APIGatewayStack",
            config.get_resource_name("apigateway"),
            None,
            pulumi.ResourceOptions(parent=parent, provider=provider)
        )
        
        self.config = config
        self.provider = provider
        self.lambda_stack = lambda_stack
        
        # Create REST API
        self.rest_api = self._create_rest_api()
        
        # Create /items resource
        self.items_resource = self._create_items_resource()
        
        # Create POST method for /items
        self.post_method, self.post_integration = self._create_post_method()
        
        # Create GET method for /items
        self.get_method, self.get_integration = self._create_get_method()
        
        # Grant API Gateway permission to invoke Lambda
        self._grant_lambda_permission()
        
        # Create deployment and stage
        self.deployment = self._create_deployment()
        self.stage = self._create_stage()
        
        self.register_outputs({
            "rest_api_id": self.rest_api.id,
            "api_url": self.api_url,
        })
    
    def _create_rest_api(self) -> aws.apigateway.RestApi:
        """
        Create REST API.
        
        Returns:
            REST API resource
        """
        return aws.apigateway.RestApi(
            resource_name=self.config.get_resource_name("api"),
            name=self.config.get_resource_name("api"),
            description="Serverless application API",
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def _create_items_resource(self) -> aws.apigateway.Resource:
        """
        Create /items resource.
        
        Returns:
            API Gateway Resource
        """
        return aws.apigateway.Resource(
            resource_name=self.config.get_resource_name("api-resource-items"),
            rest_api=self.rest_api.id,
            parent_id=self.rest_api.root_resource_id,
            path_part="items",
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def _create_post_method(self) -> tuple:
        """
        Create POST method for /items.
        
        Returns:
            Tuple of (Method, Integration)
        """
        # Create method
        method = aws.apigateway.Method(
            resource_name=self.config.get_resource_name("api-method-post-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method="POST",
            authorization="NONE",
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        # Create integration
        integration = aws.apigateway.Integration(
            resource_name=self.config.get_resource_name("api-integration-post-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_stack.api_handler.invoke_arn,
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[method]
            )
        )
        
        # Create method response
        aws.apigateway.MethodResponse(
            resource_name=self.config.get_resource_name("api-method-response-post-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            status_code="200",
            response_models={"application/json": "Empty"},
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[method]
            )
        )
        
        # Create integration response
        aws.apigateway.IntegrationResponse(
            resource_name=self.config.get_resource_name("api-integration-response-post-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            status_code="200",
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[integration]
            )
        )
        
        return method, integration
    
    def _create_get_method(self) -> tuple:
        """
        Create GET method for /items.
        
        Returns:
            Tuple of (Method, Integration)
        """
        # Create method
        method = aws.apigateway.Method(
            resource_name=self.config.get_resource_name("api-method-get-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method="GET",
            authorization="NONE",
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
        
        # Create integration
        integration = aws.apigateway.Integration(
            resource_name=self.config.get_resource_name("api-integration-get-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_stack.api_handler.invoke_arn,
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[method]
            )
        )
        
        # Create method response
        aws.apigateway.MethodResponse(
            resource_name=self.config.get_resource_name("api-method-response-get-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            status_code="200",
            response_models={"application/json": "Empty"},
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[method]
            )
        )
        
        # Create integration response
        aws.apigateway.IntegrationResponse(
            resource_name=self.config.get_resource_name("api-integration-response-get-items"),
            rest_api=self.rest_api.id,
            resource_id=self.items_resource.id,
            http_method=method.http_method,
            status_code="200",
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[integration]
            )
        )
        
        return method, integration
    
    def _grant_lambda_permission(self) -> None:
        """Grant API Gateway permission to invoke Lambda function."""
        aws.lambda_.Permission(
            resource_name=self.config.get_resource_name("api-lambda-permission"),
            action="lambda:InvokeFunction",
            function=self.lambda_stack.api_handler.name,
            principal="apigateway.amazonaws.com",
            source_arn=pulumi.Output.concat(
                self.rest_api.execution_arn,
                "/*/*/*"
            ),
            opts=pulumi.ResourceOptions(parent=self, provider=self.provider)
        )
    
    def _create_deployment(self) -> aws.apigateway.Deployment:
        """
        Create API deployment.
        
        Returns:
            API Gateway Deployment
        """
        return aws.apigateway.Deployment(
            resource_name=self.config.get_resource_name("api-deployment"),
            rest_api=self.rest_api.id,
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[
                    self.post_integration,
                    self.get_integration
                ]
            )
        )
    
    def _create_stage(self) -> aws.apigateway.Stage:
        """
        Create API stage.
        
        Returns:
            API Gateway Stage
        """
        return aws.apigateway.Stage(
            resource_name=self.config.get_resource_name("api-stage"),
            rest_api=self.rest_api.id,
            deployment=self.deployment.id,
            stage_name=self.config.environment_suffix,
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                parent=self,
                provider=self.provider,
                depends_on=[self.deployment]
            )
        )
    
    @property
    def api_url(self) -> pulumi.Output[str]:
        """
        Get the full API Gateway endpoint URL.
        
        Returns:
            API Gateway URL
        """
        return pulumi.Output.concat(
            self.stage.invoke_url,
            "/items"
        )

