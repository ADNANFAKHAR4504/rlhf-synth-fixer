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
    Tags,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
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

    This stack creates a complete serverless infrastructure following production best practices
    around security, monitoring, and automation as specified in the MODEL_RESPONSE.md.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Add common tags to all resources
        Tags.of(self).add("project", "serverless-automation")
        Tags.of(self).add("env", environment_suffix.lower())  # Ensure consistent case for tag keys

        # ===========================================
        # S3 Bucket for Lambda Deployment Artifacts
        # ===========================================
        lambda_bucket = s3.Bucket(
            self,
            "LambdaDeploymentBucket",
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # ===========================================
        # DynamoDB Table
        # ===========================================
        dynamodb_table = dynamodb.Table(
            self,
            "ServerlessTable",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ===========================================
        # IAM Role for Lambda
        # ===========================================
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess"),
            ],
        )
        dynamodb_table.grant_read_write_data(lambda_role)

        # ===========================================
        # Lambda Function
        # ===========================================
        lambda_function = lambda_.Function(
            self,
            "ServerlessFunction",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
table_name = os.environ['DYNAMODB_TABLE_NAME']
table = dynamodb.Table(table_name)

def handler(event, context):
    return {
        'statusCode': 200,
        'body': json.dumps({'message': 'Hello from Lambda!'})
    }
"""),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "DYNAMODB_TABLE_NAME": dynamodb_table.table_name,
                "ENVIRONMENT": environment_suffix,
            },
            tracing=lambda_.Tracing.ACTIVE,
        )

        # ===========================================
        # API Gateway
        # ===========================================
        api = apigateway.RestApi(
            self,
            "ServerlessApi",
            rest_api_name=f"serverless-automation-api-{environment_suffix}",
            description="API Gateway for serverless automation",
            deploy_options=apigateway.StageOptions(
                stage_name=environment_suffix,
                data_trace_enabled=True,
                tracing_enabled=True,
            ),
        )
        api.root.add_method("GET", apigateway.LambdaIntegration(lambda_function))

        # ===========================================
        # CloudWatch Alarms
        # ===========================================
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            "LambdaErrorAlarm",
            metric=lambda_function.metric_errors(),
            threshold=1,
            evaluation_periods=1,
            alarm_description="Alarm for Lambda function errors",
        )

        # ===========================================
        # Outputs
        # ===========================================
        CfnOutput(self, "ApiEndpoint", value=api.url, description="API Gateway endpoint URL")
        CfnOutput(self, "S3BucketName", value=lambda_bucket.bucket_name, description="S3 Bucket Name")
        CfnOutput(self, "S3BucketArn", value=lambda_bucket.bucket_arn, description="S3 Bucket ARN")
        CfnOutput(self, "DynamoDBTableName", value=dynamodb_table.table_name, description="DynamoDB Table Name")
        CfnOutput(self, "DynamoDBTableArn", value=dynamodb_table.table_arn, description="DynamoDB Table ARN")
        CfnOutput(self, "LambdaFunctionName", value=lambda_function.function_name, description="Lambda Function Name")
        CfnOutput(self, "LambdaFunctionArn", value=lambda_function.function_arn, description="Lambda Function ARN")
        CfnOutput(self, "CloudWatchAlarmName", value=lambda_error_alarm.alarm_name, description="CloudWatch Alarm Name")
