"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_lambda_event_sources as lambda_event_sources,
    aws_sqs as sqs,
    aws_apigateway as apigateway,
    aws_iam as iam,
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
    Represents the main CDK stack for the Tap project.

    This stack creates a secure, serverless architecture with DynamoDB, Lambda, SQS, and API Gateway.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ============================================
        # IAM Role for Lambda
        # ============================================
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            inline_policies={
                "DynamoDBAccess": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "dynamodb:GetRecords",
                                "dynamodb:GetShardIterator",
                                "dynamodb:DescribeStream",
                                "dynamodb:ListStreams"
                            ],
                            resources=["*"]  # Replace with specific resource ARN if needed
                        )
                    ]
                )
            }
        )

        # ============================================
        # SQS Dead Letter Queue
        # ============================================
        dlq = sqs.Queue(
            self, "DLQ",
            queue_name=f"tap-{environment_suffix}-dlq",
            retention_period=Duration.days(14),
            encryption=sqs.QueueEncryption.KMS_MANAGED,
            visibility_timeout=Duration.seconds(300),
        )

        # Add permissions for the Lambda function to access the SQS queue
        dlq.grant_send_messages(lambda_role)
        dlq.grant(lambda_role, "sqs:GetQueueAttributes", "sqs:GetQueueUrl")

        # ============================================
        # DynamoDB Table
        # ============================================
        table = dynamodb.Table(
            self, "DynamoDBTable",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.RETAIN,
        )

        # ============================================
        # Lambda Function
        # ============================================
        lambda_code = """
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
sqs = boto3.client('sqs')

TABLE_NAME = os.environ.get('TABLE_NAME')
DLQ_URL = os.environ.get('DLQ_URL')

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    try:
        # Check if the event is from DynamoDB stream
        if 'Records' in event:
            print("Processing DynamoDB stream event")
            for record in event['Records']:
                print(f"Processing record: {record}")
                # Add your DynamoDB stream processing logic here
            return {"statusCode": 200, "body": "DynamoDB stream processed successfully"}
        
        # Check if the event is from API Gateway
        elif 'httpMethod' in event and 'body' in event:
            print("Processing API Gateway event")
            body = json.loads(event['body'])
            print(f"Received API Gateway body: {body}")
            # Add your API Gateway processing logic here
            return {"statusCode": 200, "body": json.dumps({"message": "API Gateway event processed successfully"})}
        
        else:
            raise ValueError("Unknown event source")
    
    except Exception as e:
        print(f"Error: {str(e)}")
        if DLQ_URL:
            sqs.send_message(QueueUrl=DLQ_URL, MessageBody=json.dumps(event))
        return {"statusCode": 500, "body": f"Error: {str(e)}"}
"""
        stream_processor = lambda_.Function(
            self, "StreamProcessor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_inline(lambda_code),
            handler="index.lambda_handler",
            role=lambda_role,
            timeout=Duration.seconds(60),
            memory_size=1024,
            environment={
                "TABLE_NAME": table.table_name,
                "DLQ_URL": dlq.queue_url
            }
        )

        # Add DynamoDB stream as event source
        stream_processor.add_event_source(
            lambda_event_sources.DynamoEventSource(
                table=table,
                starting_position=lambda_.StartingPosition.LATEST,
                batch_size=100,
                bisect_batch_on_error=True,
                on_failure=lambda_event_sources.SqsDlq(dlq),
            )
        )

        # ============================================
        # API Gateway
        # ============================================
        api = apigateway.RestApi(
            self, "ApiGateway",
            rest_api_name=f"tap-{environment_suffix}-api",
            description="API Gateway for TAP project",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=100,
                throttling_burst_limit=200,
            )
        )

        # Add a resource policy to allow unrestricted access for testing
        api_policy = apigateway.CfnRestApi(
            self, "ApiGatewayPolicy",
            name=f"tap-{environment_suffix}-api-policy",
            policy={
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Principal": "*",
                        "Action": "execute-api:Invoke",
                        "Resource": f"arn:aws:execute-api:{self.region}:{self.account}:{api.rest_api_id}/*"
                    }
                ]
            }
        )

        # Add POST method to invoke Lambda
        api.root.add_method(
            "POST",
            apigateway.LambdaIntegration(stream_processor),
            api_key_required=False  # Disable API key requirement for testing
        )

        # ============================================
        # Outputs
        # ============================================
        CfnOutput(self, "ApiEndpoint", value=api.url, description="API Gateway endpoint URL")
        CfnOutput(self, "ApiGatewayId", value=api.rest_api_id, description="API Gateway ID")
        CfnOutput(self, "TableName", value=table.table_name, description="DynamoDB table name")
        CfnOutput(self, "TableArn", value=table.table_arn, description="DynamoDB table ARN")
        CfnOutput(self, "DLQUrl", value=dlq.queue_url, description="Dead Letter Queue URL")
        CfnOutput(self, "DLQArn", value=dlq.queue_arn, description="Dead Letter Queue ARN")
        CfnOutput(self, "LambdaFunctionName", value=stream_processor.function_name, description="Lambda function name")
        CfnOutput(self, "LambdaFunctionArn", value=stream_processor.function_arn, description="Lambda function ARN")
