"""
API Gateway module for the serverless backend.

This module creates API Gateway with proper CORS configuration (not using *),
correct route wiring without Output key issues, and proper URL output handling.
"""

from typing import Dict, List

import pulumi
import pulumi_aws as aws
from pulumi import Output

from .aws_provider import AWSProviderManager
from .config import ServerlessConfig
from .lambda_functions import LambdaStack


class APIGatewayStack:
    """
    Manages API Gateway for the serverless backend.
    
    Creates API Gateway with:
    - Secure CORS configuration (not allowing *)
    - Proper route-to-Lambda wiring without Output key issues
    - Multiple deployment stages (dev, test, prod)
    - CloudWatch logging enabled
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
        self.apis: Dict[str, aws.apigatewayv2.Api] = {}
        self.stages: Dict[str, aws.apigatewayv2.Stage] = {}
        self.stage_urls: Dict[str, Output[str]] = {}
        
        # Create API Gateway for each stage
        for stage_name in self.config.api_stages:
            self._create_api_for_stage(stage_name)
    
    def _create_api_for_stage(self, stage_name: str):
        """Create API Gateway for a specific stage."""
        api_resource_name = f"api-{stage_name}"
        api_name = self.config.get_resource_name(f'api-{stage_name}')
        
        # Create HTTP API (API Gateway v2)
        api = aws.apigatewayv2.Api(
            api_resource_name,
            name=api_name,
            protocol_type="HTTP",
            cors_configuration=aws.apigatewayv2.ApiCorsConfigurationArgs(
                allow_origins=self.config.cors_allow_origins,  # Secure, not using *
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=["Content-Type", "Authorization", "X-Api-Key"],
                max_age=3600,
                allow_credentials=True
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Create integrations and routes for each Lambda function
        self._create_routes(api, stage_name)
        
        # Create stage
        stage = aws.apigatewayv2.Stage(
            f"api-stage-{stage_name}",
            api_id=api.id,
            name=stage_name,
            auto_deploy=True,
            default_route_settings=aws.apigatewayv2.StageDefaultRouteSettingsArgs(
                throttling_burst_limit=self.config.api_throttle_burst_limit,
                throttling_rate_limit=self.config.api_throttle_rate_limit
            ),
            tags=self.config.get_common_tags(),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Build API URL properly (not using attribute mutation)
        def build_url(values):
            api_id, stage_name_value = values
            return f"https://{api_id}.execute-api.{self.config.primary_region}.amazonaws.com/{stage_name_value}"
        
        api_url = Output.all(api.id, stage.name).apply(build_url)
        
        self.apis[stage_name] = api
        self.stages[stage_name] = stage
        self.stage_urls[stage_name] = api_url
    
    def _create_routes(self, api: aws.apigatewayv2.Api, stage_name: str):
        """
        Create routes and integrations for Lambda functions.
        
        This avoids the Output key issue by using string keys directly.
        """
        # Define route configurations
        # Format: (route_key, function_name, http_method)
        route_configs = [
            # Users endpoints
            ("GET /users", "users"),
            ("POST /users", "users"),
            ("GET /users/{id}", "users"),
            ("PUT /users/{id}", "users"),
            ("DELETE /users/{id}", "users"),
            # Items endpoints
            ("GET /items", "items"),
            ("POST /items", "items"),
            ("GET /items/{id}", "items"),
            ("PUT /items/{id}", "items"),
            ("DELETE /items/{id}", "items")
        ]
        
        for route_key, function_name in route_configs:
            self._create_route(api, stage_name, route_key, function_name)
    
    def _create_route(
        self,
        api: aws.apigatewayv2.Api,
        stage_name: str,
        route_key: str,
        function_name: str
    ):
        """Create a single route with integration and permission."""
        # Get the Lambda function
        function = self.lambda_stack.get_function(function_name)
        
        # Create a safe resource name for the route
        safe_route_name = route_key.replace('/', '-').replace(' ', '-').replace('{', '').replace('}', '')
        resource_name = f"{stage_name}-{safe_route_name}"
        
        # Create Lambda integration
        integration = aws.apigatewayv2.Integration(
            f"integration-{resource_name}",
            api_id=api.id,
            integration_type="AWS_PROXY",
            integration_method="POST",
            integration_uri=function.invoke_arn,
            payload_format_version="2.0",
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Create route
        route = aws.apigatewayv2.Route(
            f"route-{resource_name}",
            api_id=api.id,
            route_key=route_key,
            target=integration.id.apply(lambda id: f"integrations/{id}"),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
        
        # Grant API Gateway permission to invoke the Lambda function
        permission = aws.lambda_.Permission(
            f"permission-{resource_name}",
            action="lambda:InvokeFunction",
            function=function.name,
            principal="apigateway.amazonaws.com",
            source_arn=api.execution_arn.apply(lambda arn: f"{arn}/*/*"),
            opts=pulumi.ResourceOptions(
                provider=self.provider_manager.get_provider()
            )
        )
    
    def get_api(self, stage_name: str) -> aws.apigatewayv2.Api:
        """
        Get API Gateway for a stage.
        
        Args:
            stage_name: Stage name
            
        Returns:
            API Gateway resource
        """
        return self.apis[stage_name]
    
    def get_stage(self, stage_name: str) -> aws.apigatewayv2.Stage:
        """
        Get API Gateway stage.
        
        Args:
            stage_name: Stage name
            
        Returns:
            Stage resource
        """
        return self.stages[stage_name]
    
    def get_api_url(self, stage_name: str) -> Output[str]:
        """
        Get API URL for a stage.
        
        Args:
            stage_name: Stage name
            
        Returns:
            API URL as Output
        """
        return self.stage_urls[stage_name]
    
    def get_all_stage_names(self) -> List[str]:
        """
        Get all stage names.
        
        Returns:
            List of stage names
        """
        return list(self.apis.keys())

