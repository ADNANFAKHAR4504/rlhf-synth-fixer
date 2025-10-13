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
    SecretValue,
    aws_lambda as lambda_,
    aws_apigatewayv2 as apigateway,
    aws_apigatewayv2_integrations as integrations,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    aws_secretsmanager as secretsmanager,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_lambda_destinations as destinations,
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
    S3, Secrets Manager, SNS, and CloudWatch Logs, following AWS best practices.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ============================================
        # S3 Bucket - Secure Data Storage
        # ============================================
        data_bucket = s3.Bucket(
            self, "SecureDataBucket",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldObjects",
                    expiration=Duration.days(90),
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )

        # ============================================
        # Secrets Manager - Secure Credential Storage
        # ============================================
        api_secret = secretsmanager.Secret(
            self, "ApiSecret",
            description="API credentials and sensitive configuration",
            secret_object_value={
                "api_key": SecretValue.unsafe_plain_text("demo-key"),
                "db_connection": SecretValue.unsafe_plain_text("postgresql://demo"),
                "third_party_token": SecretValue.unsafe_plain_text("token-123")
            },
            removal_policy=RemovalPolicy.DESTROY
        )

        # ============================================
        # SNS Topic - Failure Notifications
        # ============================================
        failure_topic = sns.Topic(
            self, "LambdaFailureTopic",
            topic_name=f"tap-{environment_suffix}-lambda-failures",
            display_name="Lambda Function Failure Notifications"
        )

        # Add email subscription (replace with actual email)
        failure_topic.add_subscription(
            subscriptions.EmailSubscription("admin@example.com")
        )

        # ============================================
        # IAM Role - Least Privilege for Lambda
        # ============================================
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Least privilege role for Lambda execution",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess")
            ]
        )

        # S3 permissions - specific to the bucket
        data_bucket.grant_read_write(lambda_role)

        # Secrets Manager permissions - specific to the secret
        api_secret.grant_read(lambda_role)

        # ============================================
        # Lambda Function - Main Application Logic
        # ============================================
        api_handler = lambda_.Function(
            self, "ApiHandler",
            function_name=f"tap-{environment_suffix}-function",
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
import logging

logger = logging.getLogger()
logger.setLevel(logging.INFO)

s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')

BUCKET_NAME = os.environ['BUCKET_NAME']
SECRET_ARN = os.environ['SECRET_ARN']

def handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    try:
        # Example: Retrieve secret
        secret = secrets_client.get_secret_value(SecretId=SECRET_ARN)
        logger.info(f"Retrieved secret: {secret['Name']}")

        # Example: Write to S3
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key="example.txt",
            Body="Hello, World!"
        )
        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Success"})
        }
    except Exception as e:
        logger.error(f"Error: {str(e)}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
            """),
            handler="index.handler",
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "BUCKET_NAME": data_bucket.bucket_name,
                "SECRET_ARN": api_secret.secret_arn
            },
            tracing=lambda_.Tracing.ACTIVE
        )

        # ============================================
        # API Gateway HTTP API
        # ============================================
        http_api = apigateway.HttpApi(
            self, "HttpApi",
            api_name=f"tap-{environment_suffix}-api",
            description="HTTP API for TAP project"
        )

        # Lambda integration
        lambda_integration = integrations.HttpLambdaIntegration(
            "LambdaIntegration",
            api_handler
        )

        # Add routes
        http_api.add_routes(
            path="/api/{proxy+}",
            methods=[apigateway.HttpMethod.ANY],
            integration=lambda_integration
        )

        # ============================================
        # Outputs
        # ============================================
        CfnOutput(self, "ApiEndpoint", value=http_api.url, description="HTTP API endpoint URL")
        CfnOutput(self, "ApiGatewayId", value=http_api.http_api_id, description="API Gateway ID")
        CfnOutput(self, "S3BucketName", value=data_bucket.bucket_name, description="S3 bucket name")
        CfnOutput(self, "S3BucketArn", value=data_bucket.bucket_arn, description="S3 bucket ARN")
        CfnOutput(self, "SecretArn", value=api_secret.secret_arn, description="Secrets Manager secret ARN")
        CfnOutput(self, "LambdaFunctionName", value=api_handler.function_name, description="Lambda function name")
        CfnOutput(self, "LambdaFunctionArn", value=api_handler.function_arn, description="Lambda function ARN")
        CfnOutput(self, "SNSTopicArn", value=failure_topic.topic_arn, description="SNS topic ARN")
        CfnOutput(self, "SNSTopicName", value=failure_topic.topic_name, description="SNS topic name")