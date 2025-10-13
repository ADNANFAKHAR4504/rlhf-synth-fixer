"""
API Gateway module for the serverless infrastructure.

This module creates API Gateway with proper Lambda integration URIs,
IP restrictions, and resource policies, addressing the model failures
about incorrect integration URIs and source ARN construction.
"""

import json
from typing import List, Optional

import pulumi
import pulumi_aws as aws
from pulumi import ResourceOptions

from .config import InfrastructureConfig


class APIGatewayStack:
    """
    API Gateway stack for managing REST API endpoints.
    
    Creates API Gateway with:
    - Proper Lambda integration URIs
    - IP address restrictions
    - Resource policies
    - Correct source ARN construction
    """
    
    def __init__(
        self, 
        config: InfrastructureConfig, 
        lambda_stack,
        iam_stack,
        opts: Optional[ResourceOptions] = None
    ):
        """
        Initialize the API Gateway stack.
        
        Args:
            config: Infrastructure configuration
            lambda_stack: Lambda stack for function references
            iam_stack: IAM stack for roles
            opts: Pulumi resource options
        """
        self.config = config
        self.lambda_stack = lambda_stack
        self.iam_stack = iam_stack
        self.opts = opts or ResourceOptions()
        
        # Create REST API
        self.rest_api = self._create_rest_api()
        
        # Initialize integrations list before creating resources
        self.integrations = []  # Will be populated by _create_integrations
        
        # Create resources and methods (store integrations for dependency)
        self.resources = self._create_resources()
        
        # Create deployment and stage (after methods are created)
        self.deployment = self._create_deployment()
        self.stage = self._create_stage()
        
        # Create Lambda permissions with correct source ARN (after stage is created)
        self._create_lambda_permissions()
    
    def _create_rest_api(self):
        """Create the REST API with resource policy for IP restrictions."""
        api_name = f"{self.config.get_resource_name('api-gateway', 'rest-api')}-{self.config.environment}"
        
        # Create resource policy for IP restrictions
        resource_policy = self._create_resource_policy()
        
        # Create the REST API
        rest_api = aws.apigateway.RestApi(
            api_name,
            name=api_name,
            description="Serverless API Gateway",
            policy=resource_policy,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return rest_api
    
    def _create_resource_policy(self):
        """Create resource policy for IP restrictions."""
        # Build IP condition for policy
        ip_conditions = []
        for ip in self.config.allowed_ips:
            ip_conditions.append({
                "StringEquals": {
                    "aws:SourceIp": ip
                }
            })
        
        policy_document = {
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Principal": "*",
                    "Action": "execute-api:Invoke",
                    "Resource": "*",
                    "Condition": {
                        "IpAddress": {
                            "aws:SourceIp": self.config.allowed_ips
                        }
                    }
                }
            ]
        }
        
        return pulumi.Output.from_input(policy_document).apply(lambda x: json.dumps(x))
    
    def _create_resources(self):
        """Create API Gateway resources and methods."""
        resources = {}
        
        # Create root resource
        root_resource = aws.apigateway.Resource(
            self.config.get_resource_name('api-gateway-resource', 'root'),
            rest_api=self.rest_api.id,
            parent_id=self.rest_api.root_resource_id,
            path_part="api",
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        resources['root'] = root_resource
        
        # Create v1 resource
        v1_resource = aws.apigateway.Resource(
            self.config.get_resource_name('api-gateway-resource', 'v1'),
            rest_api=self.rest_api.id,
            parent_id=root_resource.id,
            path_part="v1",
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        resources['v1'] = v1_resource
        
        # Create data resource
        data_resource = aws.apigateway.Resource(
            self.config.get_resource_name('api-gateway-resource', 'data'),
            rest_api=self.rest_api.id,
            parent_id=v1_resource.id,
            path_part="data",
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        resources['data'] = data_resource
        
        # Create methods for data resource
        self._create_methods(data_resource)
        
        return resources
    
    def _create_methods(self, resource):
        """Create HTTP methods for the resource."""
        # GET method
        get_method = aws.apigateway.Method(
            self.config.get_resource_name('api-gateway-method', 'get'),
            rest_api=self.rest_api.id,
            resource_id=resource.id,
            http_method="GET",
            authorization="NONE",
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # POST method
        post_method = aws.apigateway.Method(
            self.config.get_resource_name('api-gateway-method', 'post'),
            rest_api=self.rest_api.id,
            resource_id=resource.id,
            http_method="POST",
            authorization="NONE",
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        # Create integrations with CORRECT Lambda integration URI
        self._create_integrations(resource, get_method, post_method)
    
    def _create_integrations(self, resource, get_method, post_method):
        """Create Lambda integrations with correct URIs."""
        # Get method integration - CORRECT Lambda integration URI
        get_integration = aws.apigateway.Integration(
            self.config.get_resource_name('api-gateway-integration', 'get'),
            rest_api=self.rest_api.id,
            resource_id=resource.id,
            http_method=get_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_stack.get_api_handler_invoke_arn(),
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        self.integrations.append(get_integration)
        
        # POST method integration
        post_integration = aws.apigateway.Integration(
            self.config.get_resource_name('api-gateway-integration', 'post'),
            rest_api=self.rest_api.id,
            resource_id=resource.id,
            http_method=post_method.http_method,
            integration_http_method="POST",
            type="AWS_PROXY",
            uri=self.lambda_stack.get_api_handler_invoke_arn(),
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        self.integrations.append(post_integration)
    
    def _create_deployment(self):
        """Create API Gateway deployment."""
        # Depend on all integrations to ensure methods are fully configured
        deployment = aws.apigateway.Deployment(
            self.config.get_resource_name('api-gateway-deployment', 'main'),
            rest_api=self.rest_api.id,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider, depends_on=self.integrations)
        )
        
        return deployment
    
    def _create_stage(self):
        """Create API Gateway stage."""
        stage = aws.apigateway.Stage(
            self.config.get_resource_name('api-gateway-stage', 'main'),
            deployment=self.deployment.id,
            rest_api=self.rest_api.id,
            stage_name=self.config.api_stage_name,
            tags=self.config.tags,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
        
        return stage
    
    def _create_lambda_permissions(self):
        """Create Lambda permissions with CORRECT source ARN construction."""
        # Get AWS account ID
        account_id = aws.get_caller_identity().account_id
        
        # Construct the correct source ARN for API Gateway
        source_arn = pulumi.Output.all(
            self.rest_api.id,
            self.stage.stage_name,
            account_id
        ).apply(lambda args: f"arn:aws:execute-api:{self.config.aws_region}:{args[2]}:{args[0]}/{args[1]}/*")
        
        # Create Lambda permission for API Gateway
        lambda_permission = aws.lambda_.Permission(
            self.config.get_resource_name('lambda-permission', 'api-gateway'),
            statement_id="AllowExecutionFromAPIGateway",
            action="lambda:InvokeFunction",
            function=self.lambda_stack.api_handler.name,
            principal="apigateway.amazonaws.com",
            source_arn=source_arn,
            opts=ResourceOptions(parent=self.opts.parent, provider=self.opts.provider)
        )
    
    def get_api_endpoint(self) -> pulumi.Output[str]:
        """Get the API Gateway endpoint URL."""
        return self.stage.invoke_url
    
    def get_rest_api_id(self) -> pulumi.Output[str]:
        """Get the REST API ID."""
        return self.rest_api.id
    
    def get_stage_name(self) -> pulumi.Output[str]:
        """Get the stage name."""
        return self.stage.stage_name
