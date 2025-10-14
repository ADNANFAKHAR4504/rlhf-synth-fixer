```python


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
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_logs as logs,
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

    This stack creates a secure, serverless architecture with Lambda, API Gateway,
    DynamoDB, S3, and CloudWatch Logs, following AWS best practices.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ============================================
        # S3 Bucket - Static Content Storage
        # ============================================
        static_content_bucket = s3.Bucket(
            self, "StaticContentBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )

        # ============================================
        # DynamoDB Table - Application Data Storage
        # ============================================
        items_table = dynamodb.Table(
            self, "ItemsTable",
            partition_key=dynamodb.Attribute(
                name="item_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,
            point_in_time_recovery=True
        )

        # ============================================
        # IAM Role - Least Privilege for Lambda
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
                                "dynamodb:GetItem",
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:DeleteItem",
                                "dynamodb:Query",
                                "dynamodb:Scan",
                                "dynamodb:DescribeTable"
                            ],
                            resources=[items_table.table_arn]
                        )
                    ]
                ),
                "S3Access": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject",
                                "s3:ListBucket"
                            ],
                            resources=[
                                static_content_bucket.bucket_arn,
                                f"{static_content_bucket.bucket_arn}/*"
                            ]
                        )
                    ]
                )
            }
        )

        # ============================================
        # Lambda Function - Main Application Logic
        # ============================================
        lambda_code = """
import json
import boto3
import os

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

TABLE_NAME = os.environ['TABLE_NAME']
BUCKET_NAME = os.environ['BUCKET_NAME']

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Hello from Lambda!'})
    }
"""
        api_lambda = lambda_.Function(
            self, "ApiLambdaFunction",
            function_name=f"tap-{environment_suffix}-api",
            runtime=lambda_.Runtime.PYTHON_3_9,
            code=lambda_.Code.from_inline(lambda_code),
            handler="index.lambda_handler",
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TABLE_NAME": items_table.table_name,
                "BUCKET_NAME": static_content_bucket.bucket_name
            }
        )

        # ============================================
        # API Gateway - HTTP API
        # ============================================
        api = apigateway.RestApi(
            self, "TapApi",
            rest_api_name=f"tap-{environment_suffix}-api",
            description="API Gateway for TAP project",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_burst_limit=100,
                throttling_rate_limit=50
            )
        )

        # Lambda integration
        lambda_integration = apigateway.LambdaIntegration(api_lambda)

        # Add API routes
        api.root.add_method("GET", lambda_integration)
        api.root.add_method("POST", lambda_integration)

        # ============================================
        # Outputs
        # ============================================
        CfnOutput(self, "ApiEndpoint", value=api.url, description="API Gateway endpoint URL")
        CfnOutput(self, "ApiGatewayId", value=api.rest_api_id, description="API Gateway ID")
        CfnOutput(self, "BucketName", value=static_content_bucket.bucket_name, description="S3 bucket name")
        CfnOutput(self, "BucketArn", value=static_content_bucket.bucket_arn, description="S3 bucket ARN")
        CfnOutput(self, "TableName", value=items_table.table_name, description="DynamoDB table name")
        CfnOutput(self, "TableArn", value=items_table.table_arn, description="DynamoDB table ARN")
        CfnOutput(self, "LambdaFunctionName", value=api_lambda.function_name, description="Lambda function name")
        CfnOutput(self, "LambdaFunctionArn", value=api_lambda.function_arn, description="Lambda function ARN")


```