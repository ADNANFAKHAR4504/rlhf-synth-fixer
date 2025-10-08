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
    aws_iam as iam,
    aws_logs as logs,
    aws_kms as kms,
    aws_secretsmanager as secretsmanager,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
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

        # ===========================================
        # KMS Key for Encryption
        # ===========================================
        kms_key = kms.Key(
            self,
            "KMSKey",
            description=f"KMS key for encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.RETAIN,
            alias=f"alias/tap-stack-{environment_suffix}"
        )

        # ===========================================
        # Secrets Manager
        # ===========================================
        app_secret = secretsmanager.Secret(
            self,
            "AppSecret",
            description=f"Application secrets for {environment_suffix} environment",
            encryption_key=kms_key,
            removal_policy=RemovalPolicy.RETAIN
        )

        # ===========================================
        # S3 Bucket
        # ===========================================
        storage_bucket = s3.Bucket(
            self,
            "StorageBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(90)
                )
            ],
            removal_policy=RemovalPolicy.RETAIN
        )

        # ===========================================
        # DynamoDB Table
        # ===========================================
        dynamodb_table = dynamodb.Table(
            self,
            "DynamoDBTable",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=kms_key,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            removal_policy=RemovalPolicy.RETAIN
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
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess")
            ],
            inline_policies={
                "DynamoDBPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=[
                                "dynamodb:GetItem",
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:DeleteItem",
                                "dynamodb:Query",
                                "dynamodb:Scan"
                            ],
                            resources=[dynamodb_table.table_arn]
                        )
                    ]
                ),
                "S3Policy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject"
                            ],
                            resources=[storage_bucket.bucket_arn, f"{storage_bucket.bucket_arn}/*"]
                        )
                    ]
                ),
                "SecretsManagerPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=["secretsmanager:GetSecretValue"],
                            resources=[app_secret.secret_arn]
                        )
                    ]
                ),
                "KMSPolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            actions=[
                                "kms:Decrypt",
                                "kms:GenerateDataKey"
                            ],
                            resources=[kms_key.key_arn]
                        )
                    ]
                )
            }
        )

        # ===========================================
        # Lambda Function
        # ===========================================
        lambda_function_code = """
import json
import os
import boto3
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
secretsmanager = boto3.client('secretsmanager')

def handler(event, context):
    table_name = os.environ['TABLE_NAME']
    bucket_name = os.environ['BUCKET_NAME']
    secret_arn = os.environ['SECRET_ARN']

    table = dynamodb.Table(table_name)

    try:
        # Example: Put an item into DynamoDB
        item = {
            'id': 'example-id',
            'timestamp': int(datetime.now().timestamp()),
            'data': 'example-data'
        }
        table.put_item(Item=item)

        # Example: Put an object into S3
        s3.put_object(
            Bucket=bucket_name,
            Key='example-key',
            Body=json.dumps(item)
        )

        # Example: Retrieve a secret from Secrets Manager
        secret = secretsmanager.get_secret_value(SecretId=secret_arn)
        secret_value = secret['SecretString']

        return {
            'statusCode': 200,
            'body': json.dumps({
                'message': 'Success',
                'secret': secret_value
            })
        }
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
        """

        lambda_function = lambda_.Function(
            self,
            "LambdaFunction",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(lambda_function_code),
            role=lambda_role,
            environment={
                "TABLE_NAME": dynamodb_table.table_name,
                "BUCKET_NAME": storage_bucket.bucket_name,
                "SECRET_ARN": app_secret.secret_arn
            },
            timeout=Duration.seconds(30),
            memory_size=256,
            tracing=lambda_.Tracing.ACTIVE
        )

        # ===========================================
        # API Gateway
        # ===========================================
        api = apigateway.RestApi(
            self,
            "ApiGateway",
            rest_api_name=f"tap-api-{environment_suffix}",
            description=f"API Gateway for {environment_suffix} environment",
            deploy_options=apigateway.StageOptions(
                stage_name=environment_suffix,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )

        items = api.root.add_resource("items")
        items.add_method(
            "GET",
            apigateway.LambdaIntegration(lambda_function),
            authorization_type=apigateway.AuthorizationType.NONE
        )

        # ===========================================
        # CloudWatch Alarms
        # ===========================================
        error_alarm = cloudwatch.Alarm(
            self,
            "LambdaErrorAlarm",
            metric=lambda_function.metric_errors(),
            threshold=1,
            evaluation_periods=1,
            alarm_description="Alarm for Lambda function errors",
            alarm_name=f"tap-lambda-errors-{environment_suffix}"
        )

        # ===========================================
        # Outputs
        # ===========================================
        CfnOutput(self, "ApiEndpoint", value=api.url, description="API Gateway endpoint URL")
        CfnOutput(self, "S3BucketName", value=storage_bucket.bucket_name, description="S3 Bucket Name")
        CfnOutput(self, "S3BucketArn", value=storage_bucket.bucket_arn, description="S3 Bucket ARN")
        CfnOutput(self, "DynamoDBTableName", value=dynamodb_table.table_name, description="DynamoDB Table Name")
        CfnOutput(self, "DynamoDBTableArn", value=dynamodb_table.table_arn, description="DynamoDB Table ARN")
        CfnOutput(self, "LambdaFunctionName", value=lambda_function.function_name, description="Lambda Function Name")
        CfnOutput(self, "LambdaFunctionArn", value=lambda_function.function_arn, description="Lambda Function ARN")
        CfnOutput(self, "KMSKeyArn", value=kms_key.key_arn, description="KMS Key ARN")
        CfnOutput(self, "SecretsManagerSecretArn", value=app_secret.secret_arn, description="Secrets Manager Secret ARN")
        CfnOutput(self, "CloudWatchAlarmName", value=error_alarm.alarm_name, description="CloudWatch Alarm Name")
        CfnOutput(self, "CloudWatchAlarmArn", value=error_alarm.alarm_arn, description="CloudWatch Alarm ARN")


```