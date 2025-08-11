"""tap_stack.py
This module defines the TapStack class for a serverless application infrastructure
that processes HTTP POST requests through API Gateway, Lambda, S3, DynamoDB, and Step Functions.

All resource stacks consolidated into a single file as requested.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
  CfnOutput,
  Duration,
  RemovalPolicy,
  NestedStack,
  aws_apigateway as apigateway,
  aws_dynamodb as dynamodb,
  aws_lambda as _lambda,
  aws_s3 as s3,
  aws_stepfunctions as sfn,
)
from constructs import Construct


# Props classes
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


class DynamoDBStackProps:
  """
  DynamoDBStackProps defines the properties for the DynamoDB stack.
  
  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    
  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """
  
  def __init__(self, environment_suffix: Optional[str] = None):
    self.environment_suffix = environment_suffix


class S3StackProps:
  """
  S3StackProps defines the properties for the S3 stack.
  
  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    
  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """
  
  def __init__(self, environment_suffix: Optional[str] = None):
    self.environment_suffix = environment_suffix


class StepFunctionsStackProps:
  """
  StepFunctionsStackProps defines the properties for the Step Functions stack.
  
  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    
  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
  """
  
  def __init__(self, environment_suffix: Optional[str] = None):
    self.environment_suffix = environment_suffix


class LambdaStackProps:
  """
  LambdaStackProps defines the properties for the Lambda stack.
  
  Args:
    environment_suffix (Optional[str]): An optional suffix to identify the 
    deployment environment (e.g., 'dev', 'prod').
    bucket (s3.Bucket): S3 bucket for payload storage
    table (dynamodb.Table): DynamoDB table for metadata
    state_machine (sfn.StateMachine): Step Functions state machine
    
  Attributes:
    environment_suffix (Optional[str]): Stores the environment suffix for the stack.
    bucket (s3.Bucket): S3 bucket reference
    table (dynamodb.Table): DynamoDB table reference  
    state_machine (sfn.StateMachine): Step Functions state machine reference
  """
  
  def __init__(
      self, 
      environment_suffix: Optional[str] = None,
      bucket: Optional[s3.Bucket] = None,
      table: Optional[dynamodb.Table] = None,
      state_machine: Optional[sfn.StateMachine] = None):
    self.environment_suffix = environment_suffix
    self.bucket = bucket
    self.table = table
    self.state_machine = state_machine


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


# Individual stack classes
class DynamoDBStack(cdk.Stack):
  """
  DynamoDB stack for request metadata storage.
  
  This stack creates:
  - DynamoDB table for logging request metadata with request_id as partition key
  """
  
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[DynamoDBStackProps] = None,
      **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    
    # Get environment suffix
    environment_suffix = props.environment_suffix if props else 'dev'
    
    # DynamoDB table for logging request metadata
    self.table = dynamodb.Table(
      self, "RequestTable",
      table_name=f"tap-{environment_suffix}-requests",
      partition_key=dynamodb.Attribute(
        name="request_id",
        type=dynamodb.AttributeType.STRING
      ),
      removal_policy=RemovalPolicy.DESTROY,
      billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
    )


class S3Stack(cdk.Stack):
  """
  S3 stack for request payload storage.
  
  This stack creates:
  - S3 bucket for storing request payloads
  """
  
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[S3StackProps] = None,
      **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    
    # S3 bucket for storing request payloads
    # Let AWS generate unique bucket name to avoid global naming conflicts
    self.bucket = s3.Bucket(
      self, "RequestBucket",
      removal_policy=RemovalPolicy.DESTROY,
      auto_delete_objects=True,
      versioned=False,
    )


class StepFunctionsStack(cdk.Stack):
  """
  Step Functions stack for asynchronous processing.
  
  This stack creates:
  - Step Functions state machine for processing requests
  """
  
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[StepFunctionsStackProps] = None,
      **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    
    # Get environment suffix
    environment_suffix = props.environment_suffix if props else 'dev'
    
    # Step Functions state machine (simple Pass state for demo)
    pass_state = sfn.Pass(
      self, "ProcessPayload",
      comment="Simple processing state",
      result=sfn.Result.from_object({"status": "processed"})
    )

    self.state_machine = sfn.StateMachine(
      self, "RequestStateMachine",
      state_machine_name=f"tap-{environment_suffix}-statemachine",
      definition=pass_state,
      timeout=Duration.minutes(5),
    )


class LambdaStack(cdk.Stack):
  """
  Lambda stack for request processing.
  
  This stack creates:
  - Lambda function for processing HTTP requests
  """
  
  def __init__(
      self,
      scope: Construct,
      construct_id: str,
      props: Optional[LambdaStackProps] = None,
      **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    
    # Get environment suffix and dependencies
    environment_suffix = props.environment_suffix if props else 'dev'
    bucket = props.bucket if props else None
    table = props.table if props else None
    state_machine = props.state_machine if props else None
    
    if not bucket or not table or not state_machine:
      raise ValueError("Lambda stack requires bucket, table, and state_machine dependencies")
    
    # Lambda function for processing requests
    self.lambda_function = _lambda.Function(
      self, "RequestProcessor",
      function_name=f"tap-{environment_suffix}-processor",
      runtime=_lambda.Runtime.PYTHON_3_12,
      handler="index.handler",
      timeout=Duration.seconds(30),
      environment={
        "BUCKET_NAME": bucket.bucket_name,
        "TABLE_NAME": table.table_name,
        "STATE_MACHINE_ARN": state_machine.state_machine_arn,
      },
      code=_lambda.Code.from_inline("""
import json
import boto3
import uuid
from datetime import datetime
import os

s3_client = boto3.client('s3')
dynamodb_client = boto3.client('dynamodb')
stepfunctions_client = boto3.client('stepfunctions')

def handler(event, context):
    try:
        # Generate unique request ID
        request_id = str(uuid.uuid4())
        timestamp = datetime.utcnow().isoformat()
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Store payload in S3
        s3_key = f"requests/{request_id}.json"
        s3_client.put_object(
            Bucket=os.environ['BUCKET_NAME'],
            Key=s3_key,
            Body=json.dumps(body),
            ContentType='application/json'
        )
        
        # Start Step Functions execution
        execution_response = stepfunctions_client.start_execution(
            stateMachineArn=os.environ['STATE_MACHINE_ARN'],
            name=f"execution-{request_id}",
            input=json.dumps({"request_id": request_id, "payload": body})
        )
        execution_arn = execution_response['executionArn']
        
        # Log metadata in DynamoDB
        dynamodb_client.put_item(
            TableName=os.environ['TABLE_NAME'],
            Item={
                'request_id': {'S': request_id},
                'timestamp': {'S': timestamp},
                's3_key': {'S': s3_key},
                'status': {'S': 'processing'},
                'step_function_execution_arn': {'S': execution_arn}
            }
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Request processed successfully',
                'request_id': request_id,
                'execution_arn': execution_arn
            })
        }
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }
""")
    )

    # Grant Lambda permissions to access S3, DynamoDB, and Step Functions
    bucket.grant_read_write(self.lambda_function)
    table.grant_read_write_data(self.lambda_function)
    state_machine.grant_start_execution(self.lambda_function)


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


# Nested stack wrappers
class NestedDynamoDBStack(NestedStack):
  """
  Nested DynamoDB stack wrapper.
  
  This nested stack wraps the DynamoDB stack to be used within the main TapStack.
  """
  
  def __init__(self, scope, construct_id, props=None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    # Use the original DynamoDBStack logic here
    self.ddb_stack = DynamoDBStack(self, "Resource", props=props)
    self.table = self.ddb_stack.table


class NestedS3Stack(NestedStack):
  """
  Nested S3 stack wrapper.
  
  This nested stack wraps the S3 stack to be used within the main TapStack.
  """
  
  def __init__(self, scope, construct_id, props=None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    # Use the original S3Stack logic here
    self.s3_stack = S3Stack(self, "Resource", props=props)
    self.bucket = self.s3_stack.bucket


class NestedStepFunctionsStack(NestedStack):
  """
  Nested Step Functions stack wrapper.
  
  This nested stack wraps the Step Functions stack to be used within the main TapStack.
  """
  
  def __init__(self, scope, construct_id, props=None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    # Use the original StepFunctionsStack logic here
    self.sf_stack = StepFunctionsStack(self, "Resource", props=props)
    self.state_machine = self.sf_stack.state_machine


class NestedLambdaStack(NestedStack):
  """
  Nested Lambda stack wrapper.
  
  This nested stack wraps the Lambda stack to be used within the main TapStack.
  """
  
  def __init__(self, scope, construct_id, props=None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    # Use the original LambdaStack logic here
    self.lambda_stack = LambdaStack(self, "Resource", props=props)
    self.lambda_function = self.lambda_stack.lambda_function


class NestedApiGatewayStack(NestedStack):
  """
  Nested API Gateway stack wrapper.
  
  This nested stack wraps the API Gateway stack to be used within the main TapStack.
  """
  
  def __init__(self, scope, construct_id, props=None, **kwargs):
    super().__init__(scope, construct_id, **kwargs)
    # Use the original ApiGatewayStack logic here
    self.api_stack = ApiGatewayStack(self, "Resource", props=props)
    self.api = self.api_stack.api


# Main TapStack
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
