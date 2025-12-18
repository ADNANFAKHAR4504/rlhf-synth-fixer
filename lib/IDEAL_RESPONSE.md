```
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of all core AWS resources as described in the model response.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
  Stack,
  aws_lambda as _lambda,
  aws_apigatewayv2 as apigwv2,
  aws_apigatewayv2_integrations as integrations,
  aws_iam as iam,
  aws_logs as logs,
  Duration,
  RemovalPolicy,
  CfnOutput
)
from constructs import Construct

class TapStackProps(cdk.StackProps):
  def __init__(self, environment_suffix: Optional[str] = None, **kwargs):
    super().__init__(**kwargs)
    self.environment_suffix = environment_suffix

class TapStack(Stack):
  """
  Main stack implementing a secure serverless app as in the model response.
  """
  def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Environment suffix for resource naming
    environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # CloudWatch Log Group for Lambda
    lambda_log_group = logs.LogGroup(
      self,
      "LambdaLogGroup",
      log_group_name=f"/aws/lambda/tap-{environment_suffix}-function",
      retention=logs.RetentionDays.ONE_WEEK,
      removal_policy=RemovalPolicy.DESTROY
    )

    # IAM Role for Lambda (least privilege)
    lambda_execution_role = iam.Role(
      self,
      "LambdaExecutionRole",
      assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
      description="Execution role for secure serverless Lambda function",
      managed_policies=[
        iam.ManagedPolicy.from_aws_managed_policy_name(
          "service-role/AWSLambdaBasicExecutionRole"
        )
      ],
      inline_policies={
        "CloudWatchLogsPolicy": iam.PolicyDocument(
          statements=[
            iam.PolicyStatement(
              effect=iam.Effect.ALLOW,
              actions=[
                "logs:CreateLogStream",
                "logs:PutLogEvents"
              ],
              resources=[lambda_log_group.log_group_arn]
            )
          ]
        )
      }
    )

    # Lambda function
    lambda_function = _lambda.Function(
      self,
      "SecureServerlessFunction",
      runtime=_lambda.Runtime.PYTHON_3_11,
      handler="index.lambda_handler",
      role=lambda_execution_role,
      code=_lambda.Code.from_inline(
        """
import json
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        logger.info(f"Processing request from path: {event.get('rawPath', 'unknown')}")
        http_method = event.get('requestContext', {}).get('http', {}).get('method', 'UNKNOWN')
        source_ip = event.get('requestContext', {}).get('http', {}).get('sourceIp', 'unknown')
        user_agent = event.get('headers', {}).get('user-agent', 'unknown')
        response_data = {
            "message": "Hello from secure serverless application!",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "request_info": {
                "method": http_method,
                "source_ip": source_ip,
                "user_agent": user_agent
            },
            "lambda_info": {
                "function_name": context.function_name,
                "function_version": context.function_version,
                "request_id": context.aws_request_id
            }
        }
        logger.info("Request processed successfully")
        return {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block",
                "Strict-Transport-Security": "max-age=31536000; includeSubDomains"
            },
            "body": json.dumps(response_data, indent=2)
        }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "X-Content-Type-Options": "nosniff",
                "X-Frame-Options": "DENY",
                "X-XSS-Protection": "1; mode=block"
            },
            "body": json.dumps({
                "error": "Internal server error",
                "request_id": context.aws_request_id
            })
        }
        """
      ),
      timeout=Duration.seconds(30),
      memory_size=128,
      environment={
        "LOG_LEVEL": "INFO",
        "ENVIRONMENT": environment_suffix
      },
      description="Secure serverless Lambda function with proper error handling and logging"
    )

    # HTTP API Gateway
    http_api = apigwv2.HttpApi(
      self,
      "SecureServerlessApi",
      api_name=f"tap-{environment_suffix}-api",
      description="Secure HTTP API for serverless application",
      cors_preflight=apigwv2.CorsPreflightOptions(
        allow_origins=["*"],  # In production, specify exact origins
        allow_methods=[apigwv2.CorsHttpMethod.GET, apigwv2.CorsHttpMethod.POST],
        allow_headers=["Content-Type", "Authorization"],
        max_age=Duration.days(1)
      )
    )

    # Lambda integration
    lambda_integration = integrations.HttpLambdaIntegration(
      "LambdaIntegration",
      handler=lambda_function,
      payload_format_version=apigwv2.PayloadFormatVersion.VERSION_2_0
    )

    # Add routes to the API
    http_api.add_routes(
      path="/",
      methods=[apigwv2.HttpMethod.GET, apigwv2.HttpMethod.POST],
      integration=lambda_integration
    )
    http_api.add_routes(
      path="/health",
      methods=[apigwv2.HttpMethod.GET],
      integration=lambda_integration
    )

    # Outputs
    CfnOutput(
      self,
      "ApiEndpoint",
      value=http_api.url,
      description="HTTP API Gateway endpoint URL"
    )
    CfnOutput(
      self,
      "LambdaFunctionName",
      value=lambda_function.function_name,
      description="Lambda function name"
    )
    CfnOutput(
      self,
      "LambdaFunctionArn",
      value=lambda_function.function_arn,
      description="Lambda function ARN"
    )
    CfnOutput(
      self,
      "HttpApiId",
      value=http_api.http_api_id,
      description="HTTP API Gateway ID"
    )
    CfnOutput(
      self,
      "HttpApiEndpoint",
      value=http_api.url,
      description="HTTP API Gateway endpoint URL"
    )


```