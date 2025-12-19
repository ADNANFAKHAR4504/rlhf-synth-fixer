"""tap_stack.py
This module defines the TapStack class for a serverless application infrastructure
that processes HTTP POST requests through API Gateway, Lambda, S3, DynamoDB, and Step Functions.

LOCALSTACK FIX: Consolidated all resources into single stack (removed nested stacks)
to avoid CDK asset publishing issues with LocalStack S3.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
  CfnOutput,
  Duration,
  RemovalPolicy,
  aws_apigateway as apigateway,
  aws_dynamodb as dynamodb,
  aws_lambda as _lambda,
  aws_s3 as s3,
  aws_stepfunctions as sfn,
)
from constructs import Construct


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
  and Step Functions - all resources consolidated into a single stack.

  This stack creates a production-ready serverless application that:
  - Accepts HTTP POST requests via API Gateway
  - Processes requests with Lambda function
  - Stores payloads in S3
  - Logs metadata in DynamoDB
  - Initiates Step Functions execution for asynchronous processing

  LOCALSTACK COMPATIBILITY:
  - Single stack architecture (no nested stacks) to avoid asset publishing issues
  - RemovalPolicy.DESTROY on all stateful resources for easy cleanup
  - Uses definitionBody instead of deprecated definition for Step Functions
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

    # ========================================================================
    # S3 BUCKET - For storing request payloads
    # ========================================================================

    self.bucket = s3.Bucket(
      self, "RequestBucket",
      removal_policy=RemovalPolicy.DESTROY,
      # LOCALSTACK FIX: Removed auto_delete_objects - requires ECR (not in Community)
      versioned=False,
    )

    # ========================================================================
    # DYNAMODB TABLE - For logging request metadata
    # ========================================================================

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

    # ========================================================================
    # STEP FUNCTIONS STATE MACHINE - For asynchronous processing
    # ========================================================================

    # Simple Pass state for demo
    pass_state = sfn.Pass(
      self, "ProcessPayload",
      comment="Simple processing state",
      result=sfn.Result.from_object({"status": "processed"})
    )

    # Use definitionBody instead of deprecated definition parameter
    self.state_machine = sfn.StateMachine(
      self, "RequestStateMachine",
      state_machine_name=f"tap-{environment_suffix}-statemachine",
      definition_body=sfn.DefinitionBody.from_chainable(pass_state),
      timeout=Duration.minutes(5),
      removal_policy=RemovalPolicy.DESTROY,
    )

    # ========================================================================
    # LAMBDA FUNCTION - For processing HTTP requests
    # ========================================================================

    self.lambda_function = _lambda.Function(
      self, "RequestProcessor",
      function_name=f"tap-{environment_suffix}-processor",
      runtime=_lambda.Runtime.PYTHON_3_12,
      handler="index.handler",
      timeout=Duration.seconds(30),
      environment={
        "BUCKET_NAME": self.bucket.bucket_name,
        "TABLE_NAME": self.table.table_name,
        "STATE_MACHINE_ARN": self.state_machine.state_machine_arn,
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
    self.bucket.grant_read_write(self.lambda_function)
    self.table.grant_read_write_data(self.lambda_function)
    self.state_machine.grant_start_execution(self.lambda_function)

    # ========================================================================
    # API GATEWAY - For HTTP request handling
    # ========================================================================

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
      self.lambda_function,
      request_templates={"application/json": '{"statusCode": "200"}'}
    )

    # Add POST method with IAM authorization
    self.api.root.add_method(
      "POST",
      lambda_integration,
      authorization_type=apigateway.AuthorizationType.IAM,
    )

    # ========================================================================
    # TAGS - Apply to all resources
    # ========================================================================

    cdk.Tags.of(self).add("Environment", "Production")
    cdk.Tags.of(self).add("Project", "TAP")

    # ========================================================================
    # OUTPUTS - Export important values
    # ========================================================================

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
