"""
tap_stack.py

This module defines the TapStack class, the main Pulumi ComponentResource for 
the TAP (Test Automation Platform) project.

It orchestrates the instantiation of other resource-specific components 
and manages environment-specific configurations.
"""

import json
import os
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
    self.environment_suffix = environment_suffix or 'Production'
    self.tags = tags or {}
    self.region = region or 'us-east-1'


class TapStack(pulumi.ComponentResource):  # pylint: disable=too-many-instance-attributes
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

    # Enhanced common tags for all resources
    common_tags = {
      "Environment": "Production",
      "Project": "TAP",
      "ManagedBy": "Pulumi",
      "Region": self.region,
      "DeploymentDate": pulumi.Output.from_input(pulumi.get_stack()).apply(
        lambda _: str(pulumi.get_stack())
      ),
      "CostCenter": "TAP-API",
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

    # Create scoped custom policy for CloudWatch metrics only (no duplicate logging)
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

    # Create CloudWatch Log Group for Lambda function with improved retention
    log_retention_days = 30 if self.environment_suffix == 'prod' else 14
    log_group = cloudwatch.LogGroup(
      f"lambda-log-group-{self.environment_suffix}",
      name=f"/aws/lambda/tap-api-handler-{self.environment_suffix}",
      retention_in_days=log_retention_days,
      tags=common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Validate Lambda code directory exists
    lambda_code_path = "./lib/lambda"
    if not os.path.exists(lambda_code_path):
      raise ValueError(f"Lambda code directory not found at {lambda_code_path}")
    
    if not os.path.exists(os.path.join(lambda_code_path, "handler.py")):
      raise ValueError(f"Lambda handler file not found at {lambda_code_path}/handler.py")

    # Create Lambda function with improved configuration
    lambda_function = lambda_.Function(
      f"tap-api-handler-{self.environment_suffix}",
      runtime="python3.12",  # Upgraded to latest stable Python runtime
      handler="handler.lambda_handler",
      role=lambda_role.arn,
      code=pulumi.AssetArchive({
        ".": pulumi.FileArchive(lambda_code_path)
      }),
      timeout=60,  # Increased timeout for better reliability
      memory_size=512,  # Increased memory for better performance
      environment={
        "variables": {
          "ENVIRONMENT": self.environment_suffix,
          "LOG_LEVEL": "INFO",
          "REGION": self.region,
          "FUNCTION_NAME": f"tap-api-handler-{self.environment_suffix}",
          "ALLOWED_ORIGINS": "https://example.com,https://app.example.com"
        }
      },
      tags=common_tags,
      opts=ResourceOptions(
        parent=self,
        depends_on=[lambda_policy_attachment, cloudwatch_policy_attachment, log_group]
      )
    )

    # Create API Gateway REST API with enhanced configuration
    api_gateway = apigateway.RestApi(
      f"tap-api-{self.environment_suffix}",
      description=f"TAP API Gateway for Lambda - {self.environment_suffix}",
      endpoint_configuration={
        "types": "REGIONAL"
      },
      minimum_compression_size=1024,  # Enable compression for responses > 1KB
      binary_media_types=["*/*"],  # Support binary responses
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

    # Create Lambda integration for proxy resource with REST APIGW-style URI
    api_integration = apigateway.Integration(
      f"api-integration-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_resource.id,
      http_method=api_method.http_method,
      integration_http_method="POST",
      type="AWS_PROXY",
      uri=pulumi.Output.all(lambda_function.arn, self.region).apply(
        lambda args: f"arn:aws:apigateway:{args[1]}:lambda:path/" +
                     f"2015-03-31/functions/{args[0]}/invocations"
      ),
      opts=ResourceOptions(parent=self)
    )

    # Create Lambda integration for root resource with REST APIGW-style URI
    root_integration = apigateway.Integration(
      f"root-integration-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_gateway.root_resource_id,
      http_method=root_method.http_method,
      integration_http_method="POST",
      type="AWS_PROXY",
      uri=pulumi.Output.all(lambda_function.arn, self.region).apply(
        lambda args: f"arn:aws:apigateway:{args[1]}:lambda:path/" +
                     f"2015-03-31/functions/{args[0]}/invocations"
      ),
      opts=ResourceOptions(parent=self)
    )

    # Configure CORS for the API Gateway - Proxy resource OPTIONS
    cors_method = apigateway.Method(
      f"cors-method-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_resource.id,
      http_method="OPTIONS",
      authorization="NONE",
      opts=ResourceOptions(parent=self)
    )
    
    # Configure CORS for the API Gateway - Root resource OPTIONS
    cors_root_method = apigateway.Method(
      f"cors-root-method-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_gateway.root_resource_id,
      http_method="OPTIONS",
      authorization="NONE",
      opts=ResourceOptions(parent=self)
    )

    # CORS integration for proxy resource  
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
    
    # CORS integration for root resource
    apigateway.Integration(
      f"cors-root-integration-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_gateway.root_resource_id,
      http_method=cors_root_method.http_method,
      type="MOCK",
      request_templates={
        "application/json": '{"statusCode": 200}'
      },
      opts=ResourceOptions(parent=self)
    )

    # Method responses for CORS - Proxy resource
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
    
    # Method responses for CORS - Root resource
    cors_root_method_response = apigateway.MethodResponse(
      f"cors-root-method-response-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_gateway.root_resource_id,
      http_method=cors_root_method.http_method,
      status_code="200",
      response_parameters={
        "method.response.header.Access-Control-Allow-Headers": True,
        "method.response.header.Access-Control-Allow-Methods": True,
        "method.response.header.Access-Control-Allow-Origin": True
      },
      opts=ResourceOptions(parent=self)
    )

    # Integration responses with secure CORS headers - Proxy resource
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
        "method.response.header.Access-Control-Allow-Origin": "'https://example.com'"
      },
      opts=ResourceOptions(parent=self)
    )
    
    # Integration responses with secure CORS headers - Root resource
    cors_root_integration_response = apigateway.IntegrationResponse(
      f"cors-root-integration-response-{self.environment_suffix}",
      rest_api=api_gateway.id,
      resource_id=api_gateway.root_resource_id,
      http_method=cors_root_method.http_method,
      status_code=cors_root_method_response.status_code,
      response_parameters={
        "method.response.header.Access-Control-Allow-Headers":
          "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'",
        "method.response.header.Access-Control-Allow-Methods":
          "'GET,POST,PUT,DELETE,OPTIONS'",
        "method.response.header.Access-Control-Allow-Origin": "'https://example.com'"
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
      opts=ResourceOptions(
        parent=self,
        depends_on=[
          api_integration,
          root_integration,
          cors_integration_response,
          cors_root_integration_response,
          lambda_permission
        ]
      )
    )

    # Create enhanced CloudWatch alarms for monitoring
    error_threshold = 3 if self.environment_suffix == 'prod' else 5
    # 45s for prod, 25s for others
    duration_threshold = 45000 if self.environment_suffix == 'prod' else 25000
    
    cloudwatch.MetricAlarm(
      f"lambda-error-alarm-{self.environment_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="Errors",
      namespace="AWS/Lambda",
      period=300,
      statistic="Sum",
      threshold=error_threshold,
      alarm_description=f"Lambda function error rate is too high for {self.environment_suffix}",
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
      threshold=duration_threshold,
      alarm_description=f"Lambda function duration is too high for {self.environment_suffix}",
      dimensions={
        "FunctionName": lambda_function.name
      },
      tags=common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Add throttling alarm for better monitoring
    cloudwatch.MetricAlarm(
      f"lambda-throttles-alarm-{self.environment_suffix}",
      comparison_operator="GreaterThanThreshold",
      evaluation_periods=2,
      metric_name="Throttles",
      namespace="AWS/Lambda",
      period=300,
      statistic="Sum",
      threshold=1,
      alarm_description=f"Lambda function is being throttled for {self.environment_suffix}",
      dimensions={
        "FunctionName": lambda_function.name
      },
      tags=common_tags,
      opts=ResourceOptions(parent=self)
    )

    # Create enhanced CloudWatch dashboard for monitoring
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
                  [".", "Invocations", ".", "."],
                  [".", "Throttles", ".", "."]
                ],
                "period": 300,
                "stat": "Average",
                "region": self.region,
                "title": f"Lambda Function Metrics - {self.environment_suffix.capitalize()}"
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
                "title": f"API Gateway Metrics - {self.environment_suffix.capitalize()}"
              }
            },
            {
              "type": "metric",
              "x": 0,
              "y": 12,
              "width": 12,
              "height": 6,
              "properties": {
                "metrics": [
                  ["AWS/Lambda", "Concurrency", "FunctionName", args[0]],
                  [".", "UnreservedConcurrency", ".", "."]
                ],
                "period": 300,
                "stat": "Average",
                "region": self.region,
                "title": f"Lambda Concurrency - {self.environment_suffix.capitalize()}"
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

    # Create output properties for external access
    self.api_gateway_url = pulumi.Output.concat(
      "https://", api_gateway.id, ".execute-api.", self.region,
      ".amazonaws.com/", self.environment_suffix
    )
    self.lambda_function_name = lambda_function.name
    self.lambda_function_arn = lambda_function.arn
    self.api_gateway_id = api_gateway.id
    self.cloudwatch_log_group = log_group.name
    self.lambda_role_arn = lambda_role.arn
    self.memory_size = lambda_function.memory_size
    self.timeout = lambda_function.timeout
    self.runtime = lambda_function.runtime

    # Register comprehensive outputs
    self.register_outputs({
      "api_gateway_url": self.api_gateway_url,
      "lambda_function_name": self.lambda_function_name,
      "lambda_function_arn": self.lambda_function_arn,
      "api_gateway_id": self.api_gateway_id,
      "cloudwatch_log_group": self.cloudwatch_log_group,
      "environment_suffix": self.environment_suffix,
      "lambda_role_arn": self.lambda_role_arn,
      "region": self.region,
      "memory_size": self.memory_size,
      "timeout": self.timeout,
      "runtime": self.runtime
    })

    # Export outputs at the stack level
    pulumi.export("api_gateway_url", self.api_gateway_url)
    pulumi.export("lambda_function_name", self.lambda_function_name)
    pulumi.export("lambda_function_arn", self.lambda_function_arn)
    pulumi.export("api_gateway_id", self.api_gateway_id)
    pulumi.export("cloudwatch_log_group", self.cloudwatch_log_group)
    pulumi.export("environment_suffix", self.environment_suffix)
    pulumi.export("lambda_role_arn", self.lambda_role_arn)
    pulumi.export("region", self.region)
    pulumi.export("memory_size", self.memory_size)
    pulumi.export("timeout", self.timeout)
    pulumi.export("runtime", self.runtime)
