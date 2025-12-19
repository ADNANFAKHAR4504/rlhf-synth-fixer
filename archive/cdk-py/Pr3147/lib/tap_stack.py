"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

from typing import Optional
import json

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigatewayv2 as apigateway,
    aws_apigatewayv2_integrations as integrations,
    aws_logs as logs,
    aws_s3 as s3,
    aws_iam as iam,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_kms as kms,
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
    A secure serverless stack with API Gateway, Lambda, S3 logging, and CloudWatch monitoring.
    Based on the requirements from PROMPT.md to create a simple but secure serverless stack.
    """

    def __init__(
        self,
        scope: Construct,
        construct_id: str,
        props: Optional[TapStackProps] = None,
        **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Use 'Prod' prefix as specified in the prompt
        resource_prefix = "Prod"

        # ==========================================
        # KMS Key for S3 Bucket Encryption
        # ==========================================
        
        self.s3_encryption_key = kms.Key(
            self, f"{resource_prefix}S3EncryptionKey",
            description=f"KMS key for {resource_prefix} S3 logs bucket encryption",
            alias=f"alias/{resource_prefix.lower()}-logs-bucket-key",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

        # ==========================================
        # S3 Bucket for Logs with Encryption
        # ==========================================
        
        self.logs_bucket = s3.Bucket(
            self, f"{resource_prefix}LogsBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.s3_encryption_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldLogs",
                    expiration=Duration.days(90),
                    noncurrent_version_expiration=Duration.days(30)
                )
            ],
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True
        )

        # ==========================================
        # Lambda Execution Role (Least Privilege)
        # ==========================================
        
        self.lambda_execution_role = iam.Role(
            self, f"{resource_prefix}LambdaExecutionRole",
            role_name=f"{resource_prefix}LambdaExecutionRole-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"Execution role for {resource_prefix} Lambda function with least privileges"
        )

        # Add basic Lambda execution permissions
        self.lambda_execution_role.add_managed_policy(
            iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
        )

        # Add permission to write logs to S3 bucket (least privilege)
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:PutObject",
                    "s3:PutObjectAcl"
                ],
                resources=[f"{self.logs_bucket.bucket_arn}/*"]
            )
        )

        # Add permission to use KMS key for S3 encryption
        self.lambda_execution_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:GenerateDataKey",
                    "kms:Decrypt"
                ],
                resources=[self.s3_encryption_key.key_arn]
            )
        )

        # ==========================================
        # CloudWatch Log Groups
        # ==========================================
        
        self.lambda_log_group = logs.LogGroup(
            self, f"{resource_prefix}LambdaLogGroup",
            log_group_name=f"/aws/lambda/{resource_prefix}ServerlessFunction",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        self.api_log_group = logs.LogGroup(
            self, f"{resource_prefix}ApiGatewayLogGroup",
            log_group_name=f"/aws/apigateway/{resource_prefix}ServerlessAPI",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # ==========================================
        # Lambda Function
        # ==========================================
        
        lambda_code = """
import json
import os
import boto3
from datetime import datetime

s3_client = boto3.client('s3')

def handler(event, context):
    # Access environment variables
    env_name = os.environ.get('ENVIRONMENT', 'unknown')
    app_version = os.environ.get('APP_VERSION', '1.0.0')
    log_bucket = os.environ.get('LOG_BUCKET', '')
    
    # Log the incoming event
    print(f"Environment: {env_name}")
    print(f"App Version: {app_version}")
    print(f"Event: {json.dumps(event)}")
    
    try:
        # Process the request
        request_id = context.request_id
        timestamp = datetime.utcnow().isoformat()
        
        # Create response
        response = {
            'message': 'Request processed successfully',
            'environment': env_name,
            'version': app_version,
            'requestId': request_id,
            'timestamp': timestamp
        }
        
        # Log to S3 if bucket is configured
        if log_bucket:
            log_data = {
                'requestId': request_id,
                'timestamp': timestamp,
                'event': event,
                'response': response
            }
            
            s3_key = f"lambda-logs/{timestamp}-{request_id}.json"
            s3_client.put_object(
                Bucket=log_bucket,
                Key=s3_key,
                Body=json.dumps(log_data),
                ServerSideEncryption='aws:kms'
            )
            print(f"Logged to S3: s3://{log_bucket}/{s3_key}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-Id': request_id
            },
            'body': json.dumps(response)
        }
        
    except Exception as e:
        print(f"Error processing request: {str(e)}")
        # This will trigger the CloudWatch alarm
        raise
"""

        self.lambda_function = lambda_.Function(
            self, f"{resource_prefix}ServerlessFunction",
            function_name=f"{resource_prefix}ServerlessFunction-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.handler",
            code=lambda_.Code.from_inline(lambda_code),
            memory_size=128,  # As requested in prompt
            timeout=Duration.seconds(15),  # As requested in prompt
            role=self.lambda_execution_role,
            environment={
                "ENVIRONMENT": f"Production-{environment_suffix}",
                "APP_VERSION": "1.0.0",
                "LOG_BUCKET": self.logs_bucket.bucket_name,
                "LOG_LEVEL": "INFO"
            },
            log_group=self.lambda_log_group,
            description=f"{resource_prefix} serverless function with secure configuration",
            tracing=lambda_.Tracing.ACTIVE
        )

        # ==========================================
        # API Gateway HTTP API
        # ==========================================
        
        self.http_api = apigateway.HttpApi(
            self, f"{resource_prefix}ServerlessAPI",
            api_name=f"{resource_prefix}ServerlessAPI-{environment_suffix}",
            description=f"{resource_prefix} Serverless HTTP API",
            cors_preflight={
                "allow_origins": ["*"],
                "allow_methods": [apigateway.CorsHttpMethod.GET],
                "allow_headers": ["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
                "max_age": Duration.seconds(300)
            },
            disable_execute_api_endpoint=False
        )

        # Create Lambda integration
        lambda_integration = integrations.HttpLambdaIntegration(
            f"{resource_prefix}LambdaIntegration",
            self.lambda_function
        )

        # Add route for GET requests
        self.http_api.add_routes(
            path="/",
            methods=[apigateway.HttpMethod.GET],
            integration=lambda_integration
        )

        # Grant API Gateway permission to write logs
        self.api_log_group.grant_write(iam.ServicePrincipal("apigateway.amazonaws.com"))

        # ==========================================
        # SNS Topic for Alarms
        # ==========================================
        
        self.alarm_topic = sns.Topic(
            self, f"{resource_prefix}LambdaAlarmTopic",
            topic_name=f"{resource_prefix}LambdaAlarmTopic-{environment_suffix}",
            display_name=f"{resource_prefix} Lambda Error Alerts"
        )

        # ==========================================
        # CloudWatch Alarms
        # ==========================================
        
        # Lambda error alarm
        self.error_alarm = cloudwatch.Alarm(
            self, f"{resource_prefix}LambdaErrorAlarm",
            alarm_name=f"{resource_prefix}LambdaErrorAlarm-{environment_suffix}",
            alarm_description="Alert when Lambda function encounters errors",
            metric=self.lambda_function.metric_errors(
                period=Duration.minutes(1),
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=1,
            datapoints_to_alarm=1,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        self.error_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )

        # Lambda throttle alarm
        self.throttle_alarm = cloudwatch.Alarm(
            self, f"{resource_prefix}LambdaThrottleAlarm",
            alarm_name=f"{resource_prefix}LambdaThrottleAlarm-{environment_suffix}",
            alarm_description="Alert when Lambda function is throttled",
            metric=self.lambda_function.metric_throttles(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=1,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        self.throttle_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )

        # Lambda duration alarm
        self.duration_alarm = cloudwatch.Alarm(
            self, f"{resource_prefix}LambdaDurationAlarm",
            alarm_name=f"{resource_prefix}LambdaDurationAlarm-{environment_suffix}",
            alarm_description="Alert when Lambda function execution is slow",
            metric=self.lambda_function.metric_duration(
                period=Duration.minutes(5),
                statistic="Average"
            ),
            threshold=10000,  # 10 seconds
            evaluation_periods=2,
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )

        self.duration_alarm.add_alarm_action(
            cw_actions.SnsAction(self.alarm_topic)
        )

        # ==========================================
        # Stack Outputs
        # ==========================================
        
        CfnOutput(
            self,
            "ApiEndpoint",
            value=self.http_api.url,
            description="API Gateway endpoint URL"
        )
        
        CfnOutput(
            self,
            "LogsBucketName",
            value=self.logs_bucket.bucket_name,
            description="S3 bucket name for logs"
        )
        
        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda function name"
        )
        
        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="Lambda function ARN"
        )
        
        CfnOutput(
            self,
            "AlarmTopicArn",
            value=self.alarm_topic.topic_arn,
            description="SNS topic ARN for alarms"
        )
        
        CfnOutput(
            self,
            "KMSKeyId",
            value=self.s3_encryption_key.key_id,
            description="KMS key ID for S3 encryption"
        )
