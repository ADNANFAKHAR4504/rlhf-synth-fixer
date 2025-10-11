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
    aws_sqs as sqs,
    aws_kms as kms,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cloudwatch_actions,
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

        project_name = "tap"

        # ===========================================
        # KMS Key for Encryption
        # ===========================================
        kms_key = kms.Key(
            self,
            "DataEncryptionKey",
            description=f"KMS key for {project_name} data encryption",
            enable_key_rotation=True,
            alias=f"{project_name}-{environment_suffix}-key",
        )

        # ===========================================
        # S3 Bucket for Temporary/Intermediate Storage
        # ===========================================
        data_bucket = s3.Bucket(
            self,
            "DataBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=kms_key,
            enforce_ssl=True,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="delete-old-objects",
                    expiration=Duration.days(7),
                    prefix="raw/",
                ),
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
        )

        # ===========================================
        # DynamoDB Table
        # ===========================================
        data_table = dynamodb.Table(
            self,
            "ProcessedDataTable",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING,
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER,
            ),
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=kms_key,
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # ===========================================
        # Dead Letter Queue for Lambda
        # ===========================================
        dlq = sqs.Queue(
            self,
            "ProcessingDLQ",
            queue_name=f"{project_name}-{environment_suffix}-dlq",
            encryption=sqs.QueueEncryption.KMS,
            encryption_master_key=kms_key,
            retention_period=Duration.days(14),
        )

        # ===========================================
        # Lambda Execution Role
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
        data_bucket.grant_read_write(lambda_role)
        data_table.grant_read_write_data(lambda_role)
        kms_key.grant_encrypt_decrypt(lambda_role)
        dlq.grant_send_messages(lambda_role)

        # ===========================================
        # Lambda Function
        # ===========================================
        lambda_function = lambda_.Function(
            self,
            "DataProcessorFunction",
            function_name=f"{project_name}-{environment_suffix}-processor",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
import uuid
from datetime import datetime

dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

TABLE_NAME = os.environ['TABLE_NAME']
BUCKET_NAME = os.environ['BUCKET_NAME']

def handler(event, context):
    try:
        http_method = event['httpMethod']
        if http_method == 'POST':
            # Parse the incoming data
            data = json.loads(event['body']) if 'body' in event else event

            # Generate a unique ID and timestamp
            item_id = str(uuid.uuid4())
            timestamp = int(datetime.now().timestamp() * 1000)

            # Store the data in DynamoDB
            table = dynamodb.Table(TABLE_NAME)
            table.put_item(Item={
                'id': item_id,
                'timestamp': timestamp,
                'data': data,
            })

            # Store the raw data in S3
            s3.put_object(
                Bucket=BUCKET_NAME,
                Key=f"raw/{item_id}.json",
                Body=json.dumps(data),
                ServerSideEncryption='aws:kms',
            )

            return {
                'statusCode': 200,
                'body': json.dumps({'message': 'Data processed successfully', 'id': item_id}),
            }

        elif http_method == 'GET':
            # Retrieve all items from DynamoDB
            table = dynamodb.Table(TABLE_NAME)
            response = table.scan()
            items = response.get('Items', [])

            return {
                'statusCode': 200,
                'body': json.dumps({'items': items}),
            }

        else:
            return {
                'statusCode': 400,
                'body': json.dumps({'message': 'Unsupported HTTP method'}),
            }

    except Exception as e:
        print(f"Error processing data: {e}")
        return {
            'statusCode': 500,
            'body': json.dumps({'message': 'Error processing data', 'error': str(e)}),
        }
            """),
            memory_size=512,
            timeout=Duration.seconds(30),
            environment={
                "TABLE_NAME": data_table.table_name,
                "BUCKET_NAME": data_bucket.bucket_name,
            },
            dead_letter_queue=dlq,
            tracing=lambda_.Tracing.ACTIVE,
            role=lambda_role,
        )

        # ===========================================
        # API Gateway
        # ===========================================
        api = apigateway.RestApi(
            self,
            "DataProcessingApi",
            rest_api_name=f"{project_name}-{environment_suffix}-api",
            description="API for real-time data processing",
        )
        api.root.add_method("POST", apigateway.LambdaIntegration(lambda_function))
        api.root.add_method("GET", apigateway.LambdaIntegration(lambda_function))

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
        )

        # ===========================================
        # Outputs
        # ===========================================
        CfnOutput(self, "ApiEndpoint", value=api.url, description="API Gateway endpoint URL")
        CfnOutput(self, "S3BucketName", value=data_bucket.bucket_name, description="S3 Bucket Name")
        CfnOutput(self, "S3BucketArn", value=data_bucket.bucket_arn, description="S3 Bucket ARN")
        CfnOutput(self, "DynamoDBTableName", value=data_table.table_name, description="DynamoDB Table Name")
        CfnOutput(self, "DynamoDBTableArn", value=data_table.table_arn, description="DynamoDB Table ARN")
        CfnOutput(self, "LambdaFunctionName", value=lambda_function.function_name, description="Lambda Function Name")
        CfnOutput(self, "LambdaFunctionArn", value=lambda_function.function_arn, description="Lambda Function ARN")
        CfnOutput(self, "CloudWatchAlarmName", value=error_alarm.alarm_name, description="CloudWatch Alarm Name")
        CfnOutput(self, "CloudWatchAlarmArn", value=error_alarm.alarm_arn, description="CloudWatch Alarm ARN")
        CfnOutput(self, "KMSKeyId", value=kms_key.key_id, description="KMS Key ID")
        CfnOutput(self, "KMSKeyArn", value=kms_key.key_arn, description="KMS Key ARN")
        CfnOutput(self, "DLQName", value=dlq.queue_name, description="Dead Letter Queue Name")
        CfnOutput(self, "DLQArn", value=dlq.queue_arn, description="Dead Letter Queue ARN")


```