"""lambda_stack.py
This module defines the Lambda function stack for processing reviews.
"""

from typing import Optional

from aws_cdk import CfnOutput, Duration, RemovalPolicy
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from aws_cdk import aws_lambda as lambda_
from aws_cdk import aws_logs as logs
from constructs import Construct


class LambdaStackProps:
    """Properties for LambdaStack."""

    def __init__(
        self, environment_suffix: Optional[str] = None, table: dynamodb.Table = None
    ):
        self.environment_suffix = environment_suffix
        self.table = table


class LambdaStack(Construct):
    """Stack for Lambda function to process reviews."""

    def __init__(
        self, scope: Construct, construct_id: str, props: LambdaStackProps = None
    ):
        super().__init__(scope, construct_id)

        suffix = props.environment_suffix if props else "dev"

        # Create CloudWatch Log Group explicitly to prevent conflicts
        # This prevents "AlreadyExists" errors when redeploying after failed stacks
        log_group = logs.LogGroup(
            self,
            f"ReviewProcessorLogGroup{suffix}",
            log_group_name=f"/aws/lambda/ReviewProcessorV2-{suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create Lambda execution role
        lambda_role = iam.Role(
            self,
            f"ReviewProcessorV2Role{suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                ),
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "AWSXRayDaemonWriteAccess"
                ),
            ],
        )

        # Create Lambda function with explicit log group dependency
        self.function = lambda_.Function(
            self,
            f"ReviewProcessorV2{suffix}",
            function_name=f"ReviewProcessorV2-{suffix}",
            log_group=log_group,  # Use explicit log group to prevent conflicts
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(
                """
import json
import boto3
import os
import uuid
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

patch_all()

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['TABLE_NAME']
table = dynamodb.Table(table_name)

@xray_recorder.capture('lambda_handler')
def handler(event, context):
    try:
        # Parse request
        body = json.loads(event.get('body', '{}'))
        http_method = event.get('httpMethod', 'GET')

        if http_method == 'POST':
            # Process new review submission
            review_id = str(uuid.uuid4())
            timestamp = datetime.utcnow().isoformat()

            item = {
                'product_id': body.get('product_id'),
                'review_id': review_id,
                'reviewer_id': body.get('reviewer_id'),
                'rating': body.get('rating'),
                'comment': body.get('comment'),
                'timestamp': timestamp
            }

            # Validate required fields
            if not item['product_id'] or not item['reviewer_id']:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'Missing required fields'})
                }

            # Save to DynamoDB
            table.put_item(Item=item)

            return {
                'statusCode': 201,
                'body': json.dumps({
                    'message': 'Review created successfully',
                    'review_id': review_id
                })
            }

        elif http_method == 'GET':
            # Retrieve reviews
            product_id = event.get('queryStringParameters', {}).get('product_id')

            if not product_id:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': 'product_id parameter required'})
                }

            # Query reviews for product
            response = table.query(
                KeyConditionExpression='product_id = :pid',
                ExpressionAttributeValues={
                    ':pid': product_id
                }
            )

            return {
                'statusCode': 200,
                'body': json.dumps({
                    'reviews': response['Items'],
                    'count': response['Count']
                })
            }

        else:
            return {
                'statusCode': 405,
                'body': json.dumps({'error': 'Method not allowed'})
            }

    except Exception as e:
        print(f"Error: {str(e)}")
        return {
            'statusCode': 500,
            'body': json.dumps({'error': 'Internal server error'})
        }
"""
            ),
            role=lambda_role,
            memory_size=256,
            timeout=Duration.seconds(30),
            # Reduce concurrent executions for PR environments to avoid throttling
            reserved_concurrent_executions=(10 if suffix.startswith("pr") else 50),
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "TABLE_NAME": (
                    props.table.table_name
                    if props and props.table
                    else "ProductReviews"
                )
            },
        )

        # Grant Lambda permissions to access DynamoDB
        if props and props.table:
            props.table.grant_read_write_data(self.function)

        # Output function ARN
        CfnOutput(
            self,
            "FunctionArn",
            value=self.function.function_arn,
            description="Lambda Function ARN",
        )
