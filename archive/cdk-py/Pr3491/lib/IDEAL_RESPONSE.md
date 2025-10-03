# Ideal Response

This document represents the ideal implementation of the `tap_stack.py` file and the inline Lambda function code. The implementation follows AWS best practices for security, performance, and maintainability.

---

## `tap_stack.py`

```python
"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import json
import os

import aws_cdk as cdk
from aws_cdk import (
    aws_s3 as s3,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_iam as iam,
    aws_logs as logs,
    CfnOutput,
    Duration,
    RemovalPolicy
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

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ==========================================
        # S3 Bucket
        # ==========================================
        self.items_bucket = s3.Bucket(
            self,
            "ItemsBucket",
            bucket_name=f"tap-items-{environment_suffix}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN
            if environment_suffix == "prod"
            else RemovalPolicy.DESTROY,
            auto_delete_objects=environment_suffix != "prod",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30),
                    enabled=True,
                )
            ],
        )

        # ==========================================
        # IAM Role for Lambda
        # ==========================================
        self.lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"Execution role for Lambda in {environment_suffix}",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        # Add S3 permissions to Lambda role
        self.lambda_role.add_to_policy(
            iam.PolicyStatement(
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket",
                ],
                resources=[
                    self.items_bucket.bucket_arn,
                    f"{self.items_bucket.bucket_arn}/*",
                ],
            )
        )

        # ==========================================
        # Lambda Function
        # ==========================================
        self.lambda_function = lambda_.Function(
            self,
            "ItemsHandler",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(self._get_lambda_code()),
            role=self.lambda_role,
            environment={
                "BUCKET_NAME": self.items_bucket.bucket_name,
                "ENVIRONMENT": environment_suffix,
            },
            timeout=Duration.seconds(30),
            memory_size=512,
            tracing=lambda_.Tracing.ACTIVE,
        )

        # ==========================================
        # API Gateway
        # ==========================================
        self.api = apigateway.RestApi(
            self,
            "ItemsApi",
            rest_api_name=f"tap-items-api-{environment_suffix}",
            description="API Gateway for managing items",
            deploy_options=apigateway.StageOptions(
                stage_name="v1",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                tracing_enabled=True,
            ),
        )

        # Lambda integration
        lambda_integration = apigateway.LambdaIntegration(self.lambda_function)

        # /items resource
        items_resource = self.api.root.add_resource("items")
        items_resource.add_method("GET", lambda_integration)
        items_resource.add_method("POST", lambda_integration)

        # ==========================================
        # CloudWatch Logs
        # ==========================================
        logs.LogGroup(
            self,
            "ApiLogGroup",
            log_group_name=f"/aws/apigateway/tap-items-api-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ==========================================
        # Outputs
        # ==========================================
        CfnOutput(
            self,
            "S3BucketName",
            value=self.items_bucket.bucket_name,
            description="The name of the S3 bucket used to store items",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="The name of the Lambda function handling API requests",
        )

        CfnOutput(
            self,
            "ApiGatewayUrl",
            value=self.api.url,
            description="The base URL of the API Gateway",
        )

        # ==========================================
        # Additional Outputs
        # ==========================================
        CfnOutput(
            self,
            "S3BucketArn",
            value=self.items_bucket.bucket_arn,
            description="The ARN of the S3 bucket used to store items",
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
            value=f"/aws/apigateway/tap-items-api-{environment_suffix}",
            description="The name of the CloudWatch log group for API Gateway",
        )

    def _get_lambda_code(self) -> str:
        """Returns the inline Python code for the Lambda function."""
        return """
import json
import boto3
import os
from botocore.exceptions import ClientError

s3_client = boto3.client('s3')
BUCKET_NAME = os.environ['BUCKET_NAME']

def handler(event, context):
    method = event['httpMethod']
    path = event['path']

    if path == '/items' and method == 'GET':
        return get_items()
    elif path == '/items' and method == 'POST':
        return create_item(event)
    else:
        return {
            'statusCode': 404,
            'body': json.dumps({'error': 'Not Found'})
        }

def get_items():
    try:
        response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, Prefix='items/')
        items = []
        if 'Contents' in response:
            for obj in response['Contents']:
                items.append(obj['Key'])
        return {
            'statusCode': 200,
            'body': json.dumps({'items': items})
        }
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }

def create_item(event):
    try:
        body = json.loads(event['body'])
        item_id = body.get('id', 'item-' + str(uuid.uuid4()))
        item_data = json.dumps(body)
        s3_client.put_object(Bucket=BUCKET_NAME, Key=f'items/{item_id}.json', Body=item_data)
        return {
            'statusCode': 201,
            'body': json.dumps({'message': 'Item created', 'id': item_id})
        }
    except ClientError as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
"""