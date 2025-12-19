```python

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
    aws_lambda as lambda_,
    aws_iam as iam,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_sqs as sqs,
    aws_apigateway as apigw,
    Duration,
    RemovalPolicy,
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


class TapStack(Stack):
    """
    Represents the main CDK stack for the Tap project.

    This stack creates a serverless architecture including Lambda, API Gateway,
    DynamoDB, and S3.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Resource prefix for consistent naming
        resource_prefix = f"{environment_suffix}-tap"

        # 1. Create DynamoDB Table
        table = dynamodb.Table(
            self,
            f"{resource_prefix}-table",
            partition_key=dynamodb.Attribute(name="id", type=dynamodb.AttributeType.STRING),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # 2. Create S3 Bucket
        bucket = s3.Bucket(
            self,
            f"{resource_prefix}-bucket",
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
        )

        # 3. Create SQS Dead Letter Queue
        dlq = sqs.Queue(
            self,
            f"{resource_prefix}-dlq",
            retention_period=Duration.days(14),
        )

        # 4. Define Lambda Function Code Inline
        lambda_code = textwrap.dedent(
            """
            import json
            import boto3
            import os
            from datetime import datetime

            dynamodb = boto3.resource('dynamodb')
            table_name = os.environ['TABLE_NAME']
            table = dynamodb.Table(table_name)

            def handler(event, context):
                try:
                    # Parse the incoming request
                    body = json.loads(event.get('body', '{}'))
                    item_id = body.get('id', str(datetime.utcnow().timestamp()))
                    item_data = {
                        'id': item_id,
                        'data': body.get('data', 'default'),
                        'timestamp': datetime.utcnow().isoformat()
                    }

                    # Put item into DynamoDB
                    table.put_item(Item=item_data)

                    return {
                        'statusCode': 200,
                        'body': json.dumps({'message': 'Item created', 'item': item_data})
                    }
                except Exception as e:
                    return {
                        'statusCode': 500,
                        'body': json.dumps({'error': str(e)})
                    }
            """
        )

        # 5. Create Lambda Function
        lambda_role = iam.Role(
            self,
            f"{resource_prefix}-lambda-role",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"),
            ],
        )
        table.grant_read_write_data(lambda_role)
        bucket.grant_read_write(lambda_role)

        lambda_function = lambda_.Function(
            self,
            f"{resource_prefix}-lambda",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(lambda_code),
            role=lambda_role,
            timeout=Duration.seconds(30),
            environment={
                "TABLE_NAME": table.table_name,
                "BUCKET_NAME": bucket.bucket_name,
            },
            dead_letter_queue=dlq,
        )

        # 6. Create API Gateway
        api = apigw.RestApi(
            self,
            f"{resource_prefix}-api",
            rest_api_name=f"{resource_prefix}-api",
            deploy_options=apigw.StageOptions(stage_name="dev"),
        )
        items = api.root.add_resource("items")
        items.add_method("POST", apigw.LambdaIntegration(lambda_function))

        # 7. Outputs
        cdk.CfnOutput(self, "ApiUrl", value=api.url, description="API Gateway URL")
        cdk.CfnOutput(self, "TableName", value=table.table_name, description="DynamoDB Table Name")
        cdk.CfnOutput(self, "BucketName", value=bucket.bucket_name, description="S3 Bucket Name")

        # Additional Outputs
        cdk.CfnOutput(
            self,
            "LambdaFunctionName",
            value=lambda_function.function_name,
            description="Name of the Lambda function"
        )

        cdk.CfnOutput(
            self,
            "LambdaFunctionArn",
            value=lambda_function.function_arn,
            description="ARN of the Lambda function"
        )

        cdk.CfnOutput(
            self,
            "DeadLetterQueueName",
            value=dlq.queue_name,
            description="Name of the SQS Dead Letter Queue"
        )

        cdk.CfnOutput(
            self,
            "DeadLetterQueueArn",
            value=dlq.queue_arn,
            description="ARN of the SQS Dead Letter Queue"
        )

        cdk.CfnOutput(
            self,
            "BucketArn",
            value=bucket.bucket_arn,
            description="ARN of the S3 Bucket"
        )

        cdk.CfnOutput(
            self,
            "TableArn",
            value=table.table_arn,
            description="ARN of the DynamoDB Table"
        )


```