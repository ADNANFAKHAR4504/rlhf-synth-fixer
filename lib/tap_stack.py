"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and
manages environment-specific configurations.
"""

import os
from typing import Optional
from textwrap import dedent
from aws_cdk import (
    Duration,
    RemovalPolicy,
    aws_lambda as _lambda,
    aws_apigatewayv2 as apigw,
    aws_apigatewayv2_integrations as integrations,
    aws_logs as logs,
    CfnOutput
)
import aws_cdk as cdk
from constructs import Construct

# Detect LocalStack environment
IS_LOCALSTACK = (
    os.getenv('AWS_ENDPOINT_URL', '').find('localhost') != -1 or
    os.getenv('AWS_ENDPOINT_URL', '').find('4566') != -1
)

# Import your stacks here
# from .ddb_stack import DynamoDBStack, DynamoDBStackProps


class TapStackProps(cdk.StackProps):
  """
  TapStackProps defines the properties for the TapStack CDK stack.

  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """

  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix


class TapStack(cdk.Stack):
  """
  Represents the main CDK stack for the Tap project.

  This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
  It determines the environment suffix from the provided properties, 
    CDK context, or defaults to 'dev'.
  Note:
    - Do NOT create AWS resources directly in this stack.
    - Instead, instantiate separate stacks for each resource type within this stack.

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the 
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
  """

  def __init__(
          self,
          scope: Construct,
          construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
        props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'
    
    # Use environment suffix in resource naming for uniqueness
    stack_prefix = f"tap-{environment_suffix}"

    # Create CloudWatch log groups manually for LocalStack compatibility
    # (avoids log retention custom resource that requires S3 asset upload)
    hello_log_group = logs.LogGroup(
      self,
      "HelloWorldFunctionLogGroup",
      log_group_name=f"/aws/lambda/TapStack{environment_suffix}-HelloWorldFunction",
      retention=logs.RetentionDays.ONE_WEEK,
      removal_policy=RemovalPolicy.DESTROY
    )

    # Lambda function for Hello World endpoint
    hello_lambda = _lambda.Function(
      self,
      "HelloWorldFunction",
      runtime=_lambda.Runtime.PYTHON_3_9,
      handler="index.lambda_handler",
      code=_lambda.Code.from_inline(dedent("""\
          import json
          import datetime

          def lambda_handler(event, context):
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*',
                    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                    'Access-Control-Allow-Headers': 'Content-Type'
                },
                'body': json.dumps({
                    'message': 'Hello, World!',
                    'timestamp': datetime.datetime.utcnow().isoformat(),
                    'path': event.get('rawPath', '/'),
                    'method': event.get('requestContext', {}).get('http', {}).get('method', 'UNKNOWN')
                })
            }
      """)),
      timeout=Duration.seconds(30),
      memory_size=128,
      description="Simple Hello World Lambda function",
      # Use explicit log_group instead of log_retention for LocalStack
      log_group=hello_log_group
    )

    # Create CloudWatch log group for user info function
    user_info_log_group = logs.LogGroup(
      self,
      "UserInfoFunctionLogGroup",
      log_group_name=f"/aws/lambda/TapStack{environment_suffix}-UserInfoFunction",
      retention=logs.RetentionDays.ONE_WEEK,
      removal_policy=RemovalPolicy.DESTROY
    )

    # Lambda function for user info endpoint
    user_info_lambda = _lambda.Function(
      self,
      "UserInfoFunction",
      runtime=_lambda.Runtime.PYTHON_3_9,
      handler="index.lambda_handler",
      code=_lambda.Code.from_inline(dedent("""\
        import json
        import datetime

        def lambda_handler(event, context):
          query_params = event.get('queryStringParameters') or {}
          path_params = event.get('pathParameters') or {}

          user_id = path_params.get('userId', 'anonymous')

          return {
              'statusCode': 200,
              'headers': {
                  'Content-Type': 'application/json',
                  'Access-Control-Allow-Origin': '*',
                  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                  'Access-Control-Allow-Headers': 'Content-Type'
              },
              'body': json.dumps({
                  'userId': user_id,
                  'message': f'Hello, {user_id}!',
                  'timestamp': datetime.datetime.utcnow().isoformat(),
                  'queryParams': query_params,
                  'requestId': context.aws_request_id
              })
          }
    """)),
        timeout=Duration.seconds(30),
        memory_size=128,
        description="User info Lambda function",
        # Use explicit log_group instead of log_retention for LocalStack
        log_group=user_info_log_group
    )

    http_api = apigw.HttpApi(
      self,
      "TapHttpApi",
      api_name=f"{stack_prefix}-serverless-api",
      description="Serverless API for TAP application",
      cors_preflight=apigw.CorsPreflightOptions(
        allow_origins=["*"],
        allow_methods=[
            apigw.CorsHttpMethod.GET,
            apigw.CorsHttpMethod.POST,
            apigw.CorsHttpMethod.OPTIONS
        ],
        allow_headers=["Content-Type", "Authorization"]
      )
    )

    hello_integration = integrations.HttpLambdaIntegration(
      "HelloIntegration", hello_lambda)

    user_info_integration = integrations.HttpLambdaIntegration(
      "UserInfoIntegration", user_info_lambda)

    http_api.add_routes(
      path="/hello",
      methods=[apigw.HttpMethod.GET, apigw.HttpMethod.POST],
      integration=hello_integration
    )

    http_api.add_routes(
      path="/user/{userId}",
      methods=[apigw.HttpMethod.GET],
      integration=user_info_integration
    )

    http_api.add_routes(
      path="/user",
      methods=[apigw.HttpMethod.GET],
      integration=user_info_integration
    )

    CfnOutput(
      self, "ApiUrl",
      value=http_api.url,
      description="HTTP API Gateway URL",
      export_name="TapApiUrl"
    )

    CfnOutput(
      self, "HelloEndpoint",
      value=f"{http_api.url}hello",
      description="Hello World endpoint URL"
    )

    CfnOutput(
      self, "UserEndpoint",
      value=f"{http_api.url}user/{{userId}}",
      description="User info endpoint URL (replace {{userId}} with actual user ID)"
    )
