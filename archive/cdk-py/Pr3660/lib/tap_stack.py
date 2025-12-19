"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) inventory management project.
It orchestrates the instantiation of constructs for a serverless inventory API and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    CfnOutput,
    Tags,
    aws_logs as logs,
)
from constructs import Construct

# Import constructs
from .constructs.database_construct import DatabaseConstruct
from .constructs.lambda_construct import LambdaConstruct
from .constructs.api_construct import ApiConstruct


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
  Represents the main CDK stack for the TAP inventory management project.

  This stack is responsible for orchestrating the instantiation of constructs for a 
  serverless inventory management API. It determines the environment suffix from the 
  provided properties, CDK context, or defaults to 'dev'.
  
  The stack creates:
    - DynamoDB table with auto-scaling and GSIs for inventory data
    - Lambda functions for CRUD operations with proper IAM roles
    - API Gateway REST API with validation and security features
    - CloudWatch logging and monitoring
    - Parameter Store for configuration management

  Args:
    scope (Construct): The parent construct.
    construct_id (str): The unique identifier for this stack.
    props (Optional[TapStackProps]): Optional properties for configuring the 
      stack, including environment suffix.
    **kwargs: Additional keyword arguments passed to the CDK Stack.

  Attributes:
    environment_suffix (str): The environment suffix used for resource naming and configuration.
    table: The DynamoDB table for inventory data.
    api_endpoint: The API Gateway endpoint URL.
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

    # Store environment suffix for reference
    self.environment_suffix = environment_suffix

    # Add stack-level tags
    Tags.of(self).add("Environment", environment_suffix)
    Tags.of(self).add("Application", "InventoryManagement")
    Tags.of(self).add("ManagedBy", "CDK")
    Tags.of(self).add("Project", "TAP")

    # Create DynamoDB table with auto-scaling
    database = DatabaseConstruct(
        self,
        "Database",
        env_name=environment_suffix
    )

    # Create Lambda functions with proper IAM roles
    lambda_functions = LambdaConstruct(
        self,
        "LambdaFunctions",
        table=database.table,
        env_name=environment_suffix
    )

    # Create API Gateway
    api = ApiConstruct(
        self,
        "Api",
        lambda_functions=lambda_functions.functions,
        env_name=environment_suffix
    )

    # Make resources available as properties of this stack
    self.table = database.table
    self.api_endpoint = api.rest_api.url

    # Outputs
    CfnOutput(
        self,
        "ApiEndpoint",
        value=api.rest_api.url,
        description="API Gateway endpoint URL",
        export_name=f"InventoryApi-{environment_suffix}-Endpoint"
    )

    CfnOutput(
        self,
        "TableName",
        value=database.table.table_name,
        description="DynamoDB table name",
        export_name=f"InventoryApi-{environment_suffix}-TableName"
    )

    CfnOutput(
        self,
        "EnvironmentName",
        value=environment_suffix,
        description="Environment name",
        export_name=f"InventoryApi-{environment_suffix}-Environment"
    )
