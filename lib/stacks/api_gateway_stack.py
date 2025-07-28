"""API Gateway Stack for TapStack Architecture

This module defines the API Gateway stack responsible for creating 
the HTTP API with CORS and Lambda integration.
"""

from typing import Optional

from aws_cdk import Duration
from aws_cdk import aws_apigatewayv2 as apigw
from aws_cdk import aws_apigatewayv2_integrations as integrations
from aws_cdk import aws_lambda as _lambda
from constructs import Construct


class ApiGatewayStackProps:
  """Properties for API Gateway Stack"""
  
  def __init__(self, lambda_function: _lambda.Function, environment_suffix: Optional[str] = None):
    self.lambda_function = lambda_function
    self.environment_suffix = environment_suffix


class ApiGatewayStack(Construct):
  """API Gateway Stack for HTTP API"""
  
  def __init__(self, scope: Construct, construct_id: str, props: ApiGatewayStackProps):
    super().__init__(scope, construct_id)
    
    # API Gateway HTTP API with CORS enabled for all origins
    self.http_api = apigw.HttpApi(
      self,
      "HttpApi",
      cors_preflight=apigw.CorsPreflightOptions(
        allow_headers=["Content-Type", "Authorization"],
        allow_methods=[
          apigw.CorsHttpMethod.GET,
          apigw.CorsHttpMethod.POST,
          apigw.CorsHttpMethod.OPTIONS
        ],
        allow_origins=["*"],  # Enable CORS for all origins as required
        max_age=Duration.hours(1)
      )
    )
    
    # Add Lambda integration to API Gateway
    self.http_api.add_routes(
      path="/{proxy+}",
      methods=[apigw.HttpMethod.ANY],
      integration=integrations.HttpLambdaIntegration(
        "LambdaIntegration",
        props.lambda_function
      )
    )
