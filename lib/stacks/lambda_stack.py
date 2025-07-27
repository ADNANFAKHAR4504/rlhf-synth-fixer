"""lambda_stack.py
This module defines the Lambda stack for request processing.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    NestedStack,
    aws_lambda as _lambda,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_stepfunctions as sfn,
)
from constructs import Construct


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


class NestedLambdaStack(NestedStack):
    """
    Nested Lambda stack wrapper.
    
    This nested stack wraps the Lambda stack to be used within the main TapStack.
    """
    
    def __init__(self, scope, id, props=None, **kwargs):
        super().__init__(scope, id, **kwargs)
        # Use the original LambdaStack logic here
        self.lambda_stack = LambdaStack(self, "Resource", props=props)
        self.lambda_function = self.lambda_stack.lambda_function