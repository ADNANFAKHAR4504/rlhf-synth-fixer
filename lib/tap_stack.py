"""tap_stack.py
This module defines the TapStack class for a serverless application infrastructure
that processes HTTP POST requests through API Gateway, Lambda, S3, DynamoDB, and Step Functions.

Refactored to use separate nested stacks for each resource type.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    CfnOutput,
)
from constructs import Construct

from lib.stacks.dynamodb_stack import NestedDynamoDBStack, DynamoDBStackProps
from lib.stacks.s3_stack import NestedS3Stack, S3StackProps
from lib.stacks.stepfunctions_stack import NestedStepFunctionsStack, StepFunctionsStackProps
from lib.stacks.lambda_stack import NestedLambdaStack, LambdaStackProps
from lib.stacks.apigateway_stack import NestedApiGatewayStack, ApiGatewayStackProps


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
  Serverless application infrastructure stack with API Gateway, Lambda, S3, DynamoDB,
  and Step Functions using nested stacks for each resource type.

  This stack creates a production-ready serverless application that:
  - Accepts HTTP POST requests via API Gateway
  - Processes requests with Lambda function
  - Stores payloads in S3
  - Logs metadata in DynamoDB
  - Initiates Step Functions execution for asynchronous processing
  """

  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[TapStackProps] = None,
      **kwargs):
    super().__init__(scope, construct_id, **kwargs)

    # Get environment suffix from props, context, or use 'dev' as default
    environment_suffix = (
      props.environment_suffix if props else None
    ) or self.node.try_get_context('environmentSuffix') or 'dev'

    # Create S3 nested stack
    s3_props = S3StackProps(
        environment_suffix=environment_suffix
    )
    s3_stack = NestedS3Stack(
        self,
        f"S3Stack{environment_suffix}",
        props=s3_props
    )
    # Make the bucket available as a property of this stack
    self.bucket = s3_stack.bucket

    # Create DynamoDB nested stack
    db_props = DynamoDBStackProps(
        environment_suffix=environment_suffix
    )
    dynamodb_stack = NestedDynamoDBStack(
        self,
        f"DynamoDBStack{environment_suffix}",
        props=db_props
    )
    # Make the table available as a property of this stack
    self.table = dynamodb_stack.table

    # Create Step Functions nested stack
    sf_props = StepFunctionsStackProps(
        environment_suffix=environment_suffix
    )
    stepfunctions_stack = NestedStepFunctionsStack(
        self,
        f"StepFunctionsStack{environment_suffix}",
        props=sf_props
    )
    # Make the state machine available as a property of this stack
    self.state_machine = stepfunctions_stack.state_machine

    # Create Lambda nested stack (depends on S3, DynamoDB, and Step Functions)
    lambda_props = LambdaStackProps(
        environment_suffix=environment_suffix,
        bucket=self.bucket,
        table=self.table,
        state_machine=self.state_machine
    )
    lambda_stack = NestedLambdaStack(
        self,
        f"LambdaStack{environment_suffix}",
        props=lambda_props
    )
    # Make the lambda function available as a property of this stack
    self.lambda_function = lambda_stack.lambda_function

    # Create API Gateway nested stack (depends on Lambda)
    api_props = ApiGatewayStackProps(
        environment_suffix=environment_suffix,
        lambda_function=self.lambda_function
    )
    apigateway_stack = NestedApiGatewayStack(
        self,
        f"ApiGatewayStack{environment_suffix}",
        props=api_props
    )
    # Make the API available as a property of this stack
    self.api = apigateway_stack.api

    # Tag all resources
    cdk.Tags.of(self).add("Environment", "Production")
    cdk.Tags.of(self).add("Project", "TAP")

    # Output important values
    CfnOutput(
      self, "ApiEndpoint",
      value=self.api.url,
      description="API Gateway endpoint URL"
    )

    CfnOutput(
      self, "BucketName",
      value=self.bucket.bucket_name,
      description="S3 bucket name for request storage"
    )

    CfnOutput(
      self, "TableName",
      value=self.table.table_name,
      description="DynamoDB table name for request metadata"
    )

    CfnOutput(
      self, "StateMachineArn",
      value=self.state_machine.state_machine_arn,
      description="Step Functions state machine ARN"
    )

    CfnOutput(
      self, "LambdaFunctionName",
      value=self.lambda_function.function_name,
      description="Lambda function name"
    )