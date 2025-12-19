"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    aws_s3 as s3,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_logs as logs,
    aws_s3_notifications as s3_notifications,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Stack
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

    This stack creates the resources required for the serverless backend, including:
    - S3 bucket for storing items.
    - Lambda function for handling API requests.
    - API Gateway for exposing the Lambda function.
    - IAM role for Lambda with least privilege.
    - CloudWatch logs for observability.

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the 
          stack, including environment suffix.
        **kwargs: Additional keyword arguments passed to the CDK Stack.

    Attributes:
        environment_suffix (str): The environment suffix used for resource naming and configuration.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # ==========================================
        # S3 Bucket
        # ==========================================
        self.json_bucket = s3.Bucket(
            self,
            "JsonProcessorBucket",
            bucket_name=f"tap-json-processor-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test - change for production
            auto_delete_objects=True,  # For dev/test - change for production
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )

        # ==========================================
        # IAM Role for Lambda
        # ==========================================
        self.lambda_role = iam.Role(
            self,
            "JsonProcessorLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for JSON processor Lambda function",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Add specific S3 permissions - only for this bucket
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:ListBucket"
                ],
                resources=[
                    self.json_bucket.bucket_arn,
                    self.json_bucket.arn_for_objects("*")
                ]
            )
        )

        # ==========================================
        # Lambda Function
        # ==========================================
        self.lambda_function = lambda_.Function(
            self,
            "JsonProcessorFunction",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(self._get_lambda_code()),
            role=self.lambda_role,
            timeout=Duration.seconds(60),
            memory_size=512,
            environment={
                "BUCKET_NAME": self.json_bucket.bucket_name,
                "LOG_LEVEL": "INFO"
            },
            description="Processes JSON files uploaded to S3",
        )

        # Add S3 event notification for JSON files
        self.json_bucket.add_event_notification(
            s3.EventType.OBJECT_CREATED,
            s3_notifications.LambdaDestination(self.lambda_function),
            s3.NotificationKeyFilter(suffix=".json")
        )

        # ==========================================
        # API Gateway
        # ==========================================
        self.api = apigateway.RestApi(
            self,
            "JsonProcessorApi",
            rest_api_name="JSON Processor API",
            description="API for processing JSON files",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=100,
                throttling_burst_limit=200,
                data_trace_enabled=True
            )
        )

        # Create usage plan
        usage_plan = self.api.add_usage_plan(
            "JsonProcessorUsagePlan",
            name="JSON Processor Usage Plan",
            throttle={
                "rate_limit": 100,
                "burst_limit": 200
            },
            quota={
                "limit": 10000,
                "period": apigateway.Period.MONTH
            }
        )

        # Create API key
        api_key = self.api.add_api_key(
            "JsonProcessorApiKey",
            api_key_name="json-processor-api-key",
            description="API key for JSON processor"
        )

        # Associate API key with usage plan
        usage_plan.add_api_key(api_key)

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(self.lambda_function)

        # Add POST method to process JSON
        process_resource = self.api.root.add_resource("process")
        process_resource.add_method(
            "POST",
            lambda_integration,
            api_key_required=True
        )

        # ==========================================
        # Outputs
        # ==========================================
        CfnOutput(
            self, "S3BucketName",
            value=self.json_bucket.bucket_name,
            description="Name of the S3 bucket for JSON files"
        )

        CfnOutput(
            self, "ApiEndpoint",
            value=self.api.url + "process",
            description="API Gateway endpoint URL"
        )

        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Name of the Lambda function"
        )

        CfnOutput(
            self, "ApiKeyId",
            value=api_key.key_id,
            description="API Key ID (retrieve actual key from console)"
        )

        # ==========================================
        # Additional Outputs
        # ==========================================
        CfnOutput(
            self,
            "S3BucketArn",
            value=self.json_bucket.bucket_arn,
            description="The ARN of the S3 bucket used to store JSON files",
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="The ARN of the Lambda function handling API requests",
        )

        CfnOutput(
            self,
            "ApiGatewayRestApiId",
            value=self.api.rest_api_id,
            description="The ID of the API Gateway REST API",
        )

        CfnOutput(
            self,
            "ApiGatewayStageName",
            value=self.api.deployment_stage.stage_name,
            description="The stage name of the API Gateway",
        )

        CfnOutput(
            self,
            "CloudWatchLogGroupName",
            value=f"/aws/apigateway/json-processor-api-{self.api.deployment_stage.stage_name}",
            description="The name of the CloudWatch log group for API Gateway",
        )

    def _get_lambda_code(self) -> str:
        """Returns the inline Python code for the Lambda function."""
        return """
import json
import boto3
import os
import logging
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize S3 client
s3_client = boto3.client('s3')

def lambda_handler(event, context):
    logger.info(f"Received event: {json.dumps(event)}")
    try:
        if 'Records' in event:  # S3 trigger
            for record in event['Records']:
                bucket_name = record['s3']['bucket']['name']
                object_key = record['s3']['object']['key']
                process_file(bucket_name, object_key)
        else:  # API Gateway trigger
            body = json.loads(event['body'])
            bucket_name = os.environ['BUCKET_NAME']
            object_key = f"api-uploads/{datetime.now().isoformat()}.json"
            s3_client.put_object(Bucket=bucket_name, Key=object_key, Body=json.dumps(body))
            process_file(bucket_name, object_key)
        return {"statusCode": 200, "body": json.dumps({"message": "Success"})}
    except Exception as e:
        logger.error(f"Error processing event: {str(e)}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}

def process_file(bucket_name, object_key):
    try:
        response = s3_client.get_object(Bucket=bucket_name, Key=object_key)
        content = response['Body'].read().decode('utf-8')
        data = json.loads(content)
        logger.info(f"Processed data: {data}")
    except Exception as e:
        logger.error(f"Error processing file {object_key}: {str(e)}")
"""
