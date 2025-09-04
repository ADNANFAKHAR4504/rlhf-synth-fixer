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
import pulumi_aws as aws
from pulumi import ResourceOptions


class TapStackArgs:
  """
  TapStackArgs defines the input arguments for the TapStack Pulumi component.

  Args:
    environment_suffix (Optional[str]): An optional suffix for identifying 
        the deployment environment (e.g., 'dev', 'prod').
    tags (Optional[dict]): Optional default tags to apply to resources.
  """

  def __init__(self, environment_suffix: Optional[str] = None,
               tags: Optional[dict] = None):
    self.environment_suffix = environment_suffix or 'dev'
    self.tags = tags


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

    # Configuration
    config = pulumi.Config()
    environment = config.get("environment") or "dev"
    project_name = "serverless-infra-pulumi"

    # Common tags for all resources
    common_tags = {
      "project": project_name,
      "environment": environment,
      "managed-by": "pulumi"
    }

    # Create IAM role for Lambda function execution
    lambda_role = aws.iam.Role(
      f"{environment}-lambda-execution-role",
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
      tags=common_tags
    )

    # Attach basic execution policy to Lambda role
    aws.iam.RolePolicyAttachment(
      f"{environment}-lambda-basic-execution",
      role=lambda_role.name,
      policy_arn=("arn:aws:iam::aws:policy/service-role/"
                  "AWSLambdaBasicExecutionRole")
    )

    # Create CloudWatch Log Group for Lambda function
    log_group = aws.cloudwatch.LogGroup(
      f"{environment}-lambda-logs",
      name=f"/aws/lambda/{environment}-api-handler",
      retention_in_days=14,
      tags=common_tags
    )

    # Create Lambda function
    lambda_function = aws.lambda_.Function(
      f"{environment}-api-handler",
      name=f"{environment}-api-handler",
      runtime="python3.9",
      handler="lambda_function.lambda_handler",
      role=lambda_role.arn,
      code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.FileAsset(
          os.path.join(os.path.dirname(__file__), "lambda_function.py")
        )
      }),
      timeout=30,
      memory_size=128,
      environment={
        "variables": {
          "ENVIRONMENT": environment,
          "LOG_LEVEL": "INFO"
        }
      },
      tags=common_tags,
      opts=ResourceOptions(
        parent=self,
        depends_on=[log_group]
      )
    )

    # Create API Gateway REST API
    api_gateway = aws.apigateway.RestApi(
      f"{environment}-serverless-api",
      name=f"{environment}-serverless-api",
      description=f"Serverless API for {environment} environment",
      endpoint_configuration={
        "types": "REGIONAL"
      },
      tags=common_tags
    )

    # Create API Gateway resource (proxy resource to catch all paths)
    api_resource = aws.apigateway.Resource(
      f"{environment}-api-proxy-resource",
      rest_api=api_gateway.id,
      parent_id=api_gateway.root_resource_id,
      path_part="{proxy+}"
    )

    # Create API Gateway method for ANY HTTP method
    api_method = aws.apigateway.Method(
      f"{environment}-api-proxy-method",
      rest_api=api_gateway.id,
      resource_id=api_resource.id,
      http_method="ANY",
      authorization="NONE"
    )

    # Create API Gateway method for root path
    root_method = aws.apigateway.Method(
      f"{environment}-api-root-method",
      rest_api=api_gateway.id,
      resource_id=api_gateway.root_resource_id,
      http_method="ANY",
      authorization="NONE"
    )

    # Create API Gateway integration with Lambda (proxy resource)
    api_integration = aws.apigateway.Integration(
      f"{environment}-api-proxy-integration",
      rest_api=api_gateway.id,
      resource_id=api_resource.id,
      http_method=api_method.http_method,
      integration_http_method="POST",
      type="AWS_PROXY",
      uri=lambda_function.invoke_arn
    )

    # Create API Gateway integration with Lambda (root resource)
    root_integration = aws.apigateway.Integration(
      f"{environment}-api-root-integration",
      rest_api=api_gateway.id,
      resource_id=api_gateway.root_resource_id,
      http_method=root_method.http_method,
      integration_http_method="POST",
      type="AWS_PROXY",
      uri=lambda_function.invoke_arn
    )

    # Grant API Gateway permission to invoke Lambda function
    aws.lambda_.Permission(
      f"{environment}-api-gateway-invoke-lambda",
      statement_id="AllowExecutionFromAPIGateway",
      action="lambda:InvokeFunction",
      function=lambda_function.name,
      principal="apigateway.amazonaws.com",
      source_arn=pulumi.Output.concat(api_gateway.execution_arn, "/*/*")
    )

    # Deploy API Gateway
    api_deployment = aws.apigateway.Deployment(
      f"{environment}-api-deployment",
      opts=ResourceOptions(
        parent=self,
        depends_on=[api_integration, root_integration]
      ),
      rest_api=api_gateway.id
    )

    # Create API Gateway stage
    aws.apigateway.Stage(
      f"{environment}-api-stage",
      deployment=api_deployment.id,
      rest_api=api_gateway.id,
      stage_name=environment,
      tags=common_tags,
      opts=ResourceOptions(parent=self, depends_on=[api_deployment])
    )

    # Export important values
    pulumi.export("lambda_function_name", lambda_function.name)
    pulumi.export("lambda_function_arn", lambda_function.arn)
    pulumi.export("api_gateway_url", pulumi.Output.concat(
      "https://", api_gateway.id,
      ".execute-api.us-west-2.amazonaws.com/", environment
    ))
    pulumi.export("api_gateway_id", api_gateway.id)
    pulumi.export("cloudwatch_log_group", log_group.name)
    self.register_outputs({})
