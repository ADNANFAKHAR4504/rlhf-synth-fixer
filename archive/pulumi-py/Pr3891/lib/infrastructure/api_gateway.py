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
