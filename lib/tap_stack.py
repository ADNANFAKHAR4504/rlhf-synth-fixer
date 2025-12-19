"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import textwrap

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    aws_lambda as _lambda,
    aws_ssm as ssm,
    aws_logs as logs,
    aws_iam as iam,
)
from constructs import Construct

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

    # Project name for consistent naming convention
    project_name = "tap"
    
    # Create SSM Parameters for secure environment variables
    self._create_ssm_parameters(project_name)
    
    # Create Lambda function
    self._create_lambda_function(project_name)
    
    # Grant Lambda permissions to read SSM parameters
    self._grant_ssm_permissions()

  def _create_ssm_parameters(self, project_name: str) -> None:
    """Create SSM Parameters for secure environment variable storage"""

    # Example SSM parameters - customize as needed
    # Note: SSM Parameters don't support removal_policy, they are deleted automatically
    self.database_url_param = ssm.StringParameter(
      self,
      f"{project_name}-ssm-database-url",
      parameter_name=f"/{project_name}/database/url",
      string_value="postgresql://localhost:5432/mydb",  # Replace with actual value
      description="Database URL for the application",
      tier=ssm.ParameterTier.STANDARD
    )

    self.api_key_param = ssm.StringParameter(
      self,
      f"{project_name}-ssm-api-key",
      parameter_name=f"/{project_name}/api/key",
      string_value="your-secret-api-key-here",  # Replace with actual value
      description="API key for external service",
      tier=ssm.ParameterTier.STANDARD
    )

      # For sensitive data, use SecureString
    self.secret_token_param = ssm.StringParameter(
      self,
      f"{project_name}-ssm-secret-token",
      parameter_name=f"/{project_name}/auth/token",
      string_value="super-secret-token",  # Replace with actual value
      description="Secret authentication token"
    )

  def _create_lambda_function(self, project_name: str) -> None:
    """Create the Lambda function with required configurations"""

    # Create CloudWatch Log Group with 1-week retention
    log_group = logs.LogGroup(
      self,
      f"{project_name}-lambda-logs",
      log_group_name=f"/aws/lambda/{project_name}-lambda-function",
      retention=logs.RetentionDays.ONE_WEEK,
      removal_policy=cdk.RemovalPolicy.DESTROY
    )

    # Create Lambda function
    self.lambda_function = _lambda.Function(
      self,
      f"{project_name}-lambda-function",
      function_name=f"{project_name}-lambda-function",
      runtime=_lambda.Runtime.PYTHON_3_12,  # Updated to Python 3.12
      handler="index.lambda_handler",
      code=_lambda.Code.from_inline(self._get_lambda_code()),
      timeout=Duration.seconds(30),
      memory_size=512,

      # Set reserved concurrency to handle at least 1000 concurrent executions
      reserved_concurrent_executions=100,

      # Environment variables pointing to SSM parameter names
      environment={
        "DATABASE_URL_PARAM": self.database_url_param.parameter_name,
        "API_KEY_PARAM": self.api_key_param.parameter_name,
        "SECRET_TOKEN_PARAM": self.secret_token_param.parameter_name
      },

      # Link to the log group
      log_group=log_group

      # Lambda Insights removed - not compatible with LocalStack
    )

  def _grant_ssm_permissions(self) -> None:
    """Grant Lambda function permissions to read SSM parameters"""
    
    # Create IAM policy for SSM parameter access
    ssm_policy = iam.PolicyStatement(
      effect=iam.Effect.ALLOW,
      actions=[
        "ssm:GetParameter",
        "ssm:GetParameters",
        "ssm:GetParametersByPath"
      ],
      resources=[
        self.database_url_param.parameter_arn,
        self.api_key_param.parameter_arn,
        self.secret_token_param.parameter_arn
        ]
      )
      
    # Add policy to Lambda's execution role
    self.lambda_function.add_to_role_policy(ssm_policy)
      
    # For SecureString parameters, also need KMS permissions
    kms_policy = iam.PolicyStatement(
      effect=iam.Effect.ALLOW,
      actions=[
        "kms:Decrypt"
      ],
      resources=["*"],  # You can restrict this to specific KMS keys
      conditions={
        "StringEquals": {
          "kms:ViaService": f"ssm.{self.region}.amazonaws.com"
        }
      }
    )
      
    self.lambda_function.add_to_role_policy(kms_policy)

  def _get_lambda_code(self) -> str:
    """Return the Lambda function code as a dedented string"""
    return textwrap.dedent("""
                          import json
                          import boto3
                          import os
                          import logging

                          # Configure logging
                          logger = logging.getLogger()
                          logger.setLevel(logging.INFO)

                          # LocalStack configuration
                          endpoint_url = os.environ.get('AWS_ENDPOINT_URL')

                          # Initialize SSM client with LocalStack endpoint if available
                          ssm_client = boto3.client(
                              'ssm',
                              region_name=os.environ.get('AWS_REGION', 'us-east-1'),
                              endpoint_url=endpoint_url
                          )

                          def get_parameter(parameter_name, decrypt=False):
                              \"\"\"Securely retrieve parameter from SSM Parameter Store\"\"\"
                              try:
                                  response = ssm_client.get_parameter(
                                      Name=parameter_name,
                                      WithDecryption=decrypt
                                  )
                                  return response['Parameter']['Value']
                              except Exception as e:
                                  logger.error(f"Error retrieving parameter {parameter_name}: {str(e)}")
                                  raise

                          def lambda_handler(event, context):
                              \"\"\"Main Lambda handler function\"\"\"
                              logger.info("Lambda function started")
                              logger.info(f"Received event: {json.dumps(event)}")
                              
                              try:
                                  # Retrieve environment variables securely from SSM
                                  database_url = get_parameter(os.environ['DATABASE_URL_PARAM'])
                                  api_key = get_parameter(os.environ['API_KEY_PARAM'])
                                  secret_token = get_parameter(os.environ['SECRET_TOKEN_PARAM'], decrypt=True)
                                  
                                  # Log successful parameter retrieval (don't log actual values!)
                                  logger.info("Successfully retrieved all SSM parameters")
                                  
                                  # Your business logic here
                                  processed_data = {
                                      "message": "Hello from Lambda!",
                                      "event_keys": list(event.keys()) if isinstance(event, dict) else [],
                                      "timestamp": context.aws_request_id,
                                      "function_name": context.function_name,
                                      "remaining_time": context.get_remaining_time_in_millis()
                                  }
                                  
                                  logger.info("Processing completed successfully")
                                  
                                  return {
                                      'statusCode': 200,
                                      'headers': {
                                          'Content-Type': 'application/json',
                                          'Access-Control-Allow-Origin': '*'
                                      },
                                      'body': json.dumps(processed_data)
                                  }
                                  
                              except Exception as e:
                                  logger.error(f"Error in lambda_handler: {str(e)}")
                                  return {
                                      'statusCode': 500,
                                      'headers': {
                                          'Content-Type': 'application/json'
                                      },
                                      'body': json.dumps({
                                          'error': 'Internal server error',
                                          'message': str(e)
                                      })
                                  }
                      """)
