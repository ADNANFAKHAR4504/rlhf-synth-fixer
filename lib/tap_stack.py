"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

import json
from typing import Optional

import pulumi
from pulumi import ResourceOptions
from pulumi_aws import iam, lambda_, apigateway, cloudwatch

# Import your nested stacks here
# from .dynamodb_stack import DynamoDBStack


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying
      the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
    region (Optional[str]): AWS region for deployment.
  """

  def __init__(self, environment_suffix: Optional[str] = None,
               tags: Optional[dict] = None, region: Optional[str] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags or {}
    self.region = region or 'us-west-2'


class TapStack(pulumi.ComponentResource):
  """
  Represents the main Pulumi component resource for the TAP project.

  This component orchestrates the instantiation of other resource-specific
  components and manages the environment suffix used for naming and
  configuration.

  Note:
      - DO NOT create resources directly here unless they are truly global.
      - Use other components (e.g., DynamoDBStack) for AWS resource definitions.

  Args:
      name (str): The logical name of this Pulumi component.
      args (TapStackArgs): Configuration arguments including environment
        suffix and tags.
      opts (ResourceOptions): Pulumi options.
  """

  def __init__(
      self,
      name: str,
      args: TapStackArgs,
      opts: Optional[ResourceOptions] = None
  ):
    super().__init__('tap:stack:TapStack', name, None, opts)

    self.environment_suffix = args.environment_suffix
    self.tags = args.tags
    self.region = args.region

    # Common tags for all resources
    common_tags = {
      "Environment": "Production",
      "Project": "TAP",
      "ManagedBy": "Pulumi",
      "Region": self.region,
      **self.tags
    }

    # Create IAM role for Lambda execution
    lambda_role = iam.Role(
      f"lambda-execution-role-{self.environment_suffix}",
      assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Action": "sts:AssumeRole",
            "Effect": "Allow",
            "Principal": {
              "Service": "lambda.amazonaws.com"
            }
          }
        ]
      }),
      tags=common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Attach basic Lambda execution policy
    lambda_policy_attachment = iam.RolePolicyAttachment(
      f"lambda-basic-execution-{self.environment_suffix}",
      role=lambda_role.name,
      policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole",
      opts=ResourceOptions(parent=self)
    )

    # Create custom policy for CloudWatch metrics
    cloudwatch_policy = iam.Policy(
      f"lambda-cloudwatch-policy-{self.environment_suffix}",
      description="Allow Lambda to write custom metrics to CloudWatch",
      policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
          {
            "Effect": "Allow",
            "Action": [
              "cloudwatch:PutMetricData"
            ],
            "Resource": "*",
            "Condition": {
              "StringEquals": {
                "cloudwatch:namespace": "AWS/Lambda/Custom"
              }
            }
          }
        ]
      }),
      tags=common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Attach custom CloudWatch policy to Lambda role
    cloudwatch_policy_attachment = iam.RolePolicyAttachment(
      f"lambda-cloudwatch-attachment-{self.environment_suffix}",
      role=lambda_role.name,
      policy_arn=cloudwatch_policy.arn,
      opts=ResourceOptions(parent=self)
    )

    # Create CloudWatch Log Group for Lambda function
    log_group = cloudwatch.LogGroup(
      f"lambda-log-group-{self.environment_suffix}",
      name=f"/aws/lambda/tap-api-handler-{self.environment_suffix}",
      retention_in_days=14,
      tags=common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Create Lambda function
    lambda_function = lambda_.Function(
      f"tap-api-handler-{self.environment_suffix}",
      runtime="python3.9",
      handler="handler.lambda_handler",
      role=lambda_role.arn,
      code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda_function")
      }),
      timeout=30,
      memory_size=128,
      environment={
        "variables": {
          "ENVIRONMENT": self.environment_suffix,
          "LOG_LEVEL": "INFO"
        }
      },
      depends_on=[lambda_policy_attachment, cloudwatch_policy_attachment,
                  log_group],
      tags=common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Create API Gateway REST API
    api_gateway = apigateway.RestApi(
      f"tap-api-{self.environment_suffix}",
      description=f"TAP API Gateway for Lambda - {self.environment_suffix}",
      endpoint_configuration={
        "types": "REGIONAL"
      },
      tags=common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Create API Gateway resource (proxy resource for all paths)
    api_resource = apigateway.Resource(
      f"api-resource-{self.environment_suffix}",
      rest_api=api_gateway.id,
      parent_id=api_gateway.root_resource_id,
      path_part="{proxy+}",
      opts=ResourceOptions(parent=self)
    )

    # Create API Gateway method for ANY HTTP method
    api_method = apigateway.Method(
      f"api-method-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_resource.id,
      http_method="ANY",
      authorization="NONE",
      opts=ResourceOptions(parent=self)
    )

    # Create API Gateway method for root path
    root_method = apigateway.Method(
      f"root-method-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_gateway.root_resource_id,
      http_method="ANY",
      authorization="NONE",
      opts=ResourceOptions(parent=self)
    )

    # Create Lambda integration for proxy resource
    api_integration = apigateway.Integration(
      f"api-integration-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_resource.id,
      http_method=api_method.http_method,
      integration_http_method="POST",
      type="AWS_PROXY",
      uri=lambda_function.invoke_arn,
      opts=ResourceOptions(parent=self)
    )

    # Create Lambda integration for root resource
    root_integration = apigateway.Integration(
      f"root-integration-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_gateway.root_resource_id,
      http_method=root_method.http_method,
      integration_http_method="POST",
      type="AWS_PROXY",
      uri=lambda_function.invoke_arn,
      opts=ResourceOptions(parent=self)
    )

    # Configure CORS for the API Gateway
    cors_method = apigateway.Method(
      f"cors-method-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_resource.id,
      http_method="OPTIONS",
      authorization="NONE",
      opts=ResourceOptions(parent=self)
    )

    apigateway.Integration(
      f"cors-integration-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_resource.id,
      http_method=cors_method.http_method,
      type="MOCK",
      request_templates={
        "application/json": '{"statusCode": 200}'
      },
      opts=ResourceOptions(parent=self)
    )

    cors_method_response = apigateway.MethodResponse(
      f"cors-method-response-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_resource.id,
      http_method=cors_method.http_method,
      status_code="200",
      response_parameters={
        "method.response.header.Access-Control-Allow-Headers": True,
        "method.response.header.Access-Control-Allow-Methods": True,
        "method.response.header.Access-Control-Allow-Origin": True
      },
      opts=ResourceOptions(parent=self)
    )

    cors_integration_response = apigateway.IntegrationResponse(
      f"cors-integration-response-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_resource.id,
      http_method=cors_method.http_method,
      status_code=cors_method_response.status_code,
      response_parameters={
        "method.response.header.Access-Control-Allow-Headers":
          "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        "method.response.header.Access-Control-Allow-Methods":
          "'GET,POST,PUT,DELETE,OPTIONS'",
        "method.response.header.Access-Control-Allow-Origin": "'*'"
      },
      opts=ResourceOptions(parent=self)
    )

    # Grant API Gateway permission to invoke Lambda
    lambda_permission = lambda_.Permission(
      f"api-gateway-lambda-permission-{self.environment_suffix}",
      statement_id="AllowExecutionFromAPIGateway",
      action="lambda:InvokeFunction",
      function=lambda_function.name,
      principal="apigateway.amazonaws.com",
      source_arn=pulumi.Output.concat(api_gateway.execution_arn, "/*/*"),
      opts=ResourceOptions(parent=self)
    )

    # Deploy the API Gateway
    apigateway.Deployment(
      f"api-deployment-{self.environment_suffix}",
      rest_api=api_gateway.id,
      stage_name=self.environment_suffix,
      depends_on=[
        api_integration,
        root_integration,
        cors_integration_response,
        lambda_permission
      ],
      opts=ResourceOptions(parent=self)
    )

    # Create CloudWatch alarms for monitoring
    cloudwatch.MetricAlarm(
      f"lambda-error-alarm-{self.environment_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="Errors",
      namespace="AWS/Lambda",
      period=300,
      statistic="Sum",
      threshold=5,
      alarm_description="Lambda function error rate is too high",
      dimensions={
        "FunctionName": lambda_function.name
      },
      tags=common_tags,
      opts=ResourceOptions(parent=self)
    )

    cloudwatch.MetricAlarm(
      f"lambda-duration-alarm-{self.environment_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="Duration",
      namespace="AWS/Lambda",
      period=300,
      statistic="Average",
      threshold=25000,  # 25 seconds
      alarm_description="Lambda function duration is too high",
      dimensions={
        "FunctionName": lambda_function.name
      },
      tags=common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Create CloudWatch dashboard for monitoring
    cloudwatch.Dashboard(
      f"tap-api-dashboard-{self.environment_suffix}",
      dashboard_name=f"TAP-API-{self.environment_suffix.capitalize()}",
      dashboard_body=pulumi.Output.all(lambda_function.name).apply(
        lambda args: json.dumps({
          "widgets": [
            {
              "type": "metric",
              "x": 0,
              "y": 0,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Duration", "FunctionName", args[0]],
                  [".", "Errors", ".", "."],
                  [".", "Invocations", ".", "."]
                ],
                "period": 300,
                "stat": "Average",
                "region": self.region,
                "title": "Lambda Function Metrics"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 6,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/ApiGateway", "Count", "ApiName",
                   f"tap-api-{self.environment_suffix}"],
                  [".", "Latency", ".", "."],
                  [".", "4XXError", ".", "."],
                  [".", "5XXError", ".", "."]
                ],
                "period": 300,
                "stat": "Sum",
                "region": self.region,
                "title": "API Gateway Metrics"
              }
            }
          ]
        })
      ),
      opts=ResourceOptions(parent=self)
    )

    # Store references to key resources
    self.lambda_function = lambda_function
    self.api_gateway = api_gateway
    self.log_group = log_group
    self.lambda_role = lambda_role

    # Register outputs
    self.register_outputs({
      "api_gateway_url": pulumi.Output.concat(
        "https://", api_gateway.id, ".execute-api.", self.region,
        ".amazonaws.com/", self.environment_suffix
      ),
      "lambda_function_name": lambda_function.name,
      "lambda_function_arn": lambda_function.arn,
      "api_gateway_id": api_gateway.id,
      "cloudwatch_log_group": log_group.name,
      "environment_suffix": self.environment_suffix
    })
