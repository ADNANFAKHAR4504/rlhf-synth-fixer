"""apigateway_stack.py
This module defines the API Gateway stack for HTTP request handling.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    NestedStack,
    aws_apigateway as apigateway,
    aws_lambda as _lambda,
)
from constructs import Construct


class ApiGatewayStackProps:
    """
    ApiGatewayStackProps defines the properties for the API Gateway stack.
    
    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        lambda_function (_lambda.Function): Lambda function to integrate with
        
    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
        lambda_function (_lambda.Function): Lambda function reference
    """
    
    def __init__(
            self, 
            environment_suffix: Optional[str] = None,
            lambda_function: Optional[_lambda.Function] = None):
        self.environment_suffix = environment_suffix
        self.lambda_function = lambda_function


class ApiGatewayStack(cdk.Stack):
    """
    API Gateway stack for HTTP request handling.
    
    This stack creates:
    - REST API Gateway with Lambda integration and IAM authentication
    """
    
    def __init__(
            self,
            scope: Construct,
            construct_id: str,
            props: Optional[ApiGatewayStackProps] = None,
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)
        
        # Get environment suffix and dependencies
        environment_suffix = props.environment_suffix if props else 'dev'
        lambda_function = props.lambda_function if props else None
        
        if not lambda_function:
            raise ValueError("API Gateway stack requires lambda_function dependency")
        
        # HTTP API Gateway with IAM authentication
        self.api = apigateway.RestApi(
            self, "RequestApi",
            rest_api_name=f"tap-{environment_suffix}-api",
            description="API for processing HTTP POST requests",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date",
                            "Authorization", "X-Api-Key", "X-Amz-Security-Token"]
            ),
        )

        # Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            lambda_function,
            request_templates={"application/json": '{"statusCode": "200"}'}
        )

        # Add POST method with IAM authorization
        self.api.root.add_method(
            "POST",
            lambda_integration,
            authorization_type=apigateway.AuthorizationType.IAM,
        )


class NestedApiGatewayStack(NestedStack):
    """
    Nested API Gateway stack wrapper.
    
    This nested stack wraps the API Gateway stack to be used within the main TapStack.
    """
    
    def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        # Use the original ApiGatewayStack logic here
        self.api_stack = ApiGatewayStack(self, "Resource", props=props)
        self.api = self.api_stack.api