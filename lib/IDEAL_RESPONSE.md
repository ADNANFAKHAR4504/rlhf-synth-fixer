```python

"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It creates a serverless architecture with Lambda, API Gateway, DynamoDB, and S3.
"""

from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_kms as kms,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
)
from constructs import Construct


class TapStackProps(cdk.StackProps):
    """
    TapStackProps defines the properties for the TapStack CDK stack.

    Args:
        environment_suffix (Optional[str]): An optional suffix to identify the 
        deployment environment (e.g., 'dev', 'prod').
        notification_email (Optional[str]): Email address for alarm notifications.
        **kwargs: Additional keyword arguments passed to the base cdk.StackProps.

    Attributes:
        environment_suffix (Optional[str]): Stores the environment suffix for the stack.
        notification_email (Optional[str]): Email for SNS notifications.
    """

    def __init__(self, environment_suffix: Optional[str] = None, 
                 notification_email: Optional[str] = None, **kwargs):
        super().__init__(**kwargs)
        self.environment_suffix = environment_suffix
        self.notification_email = notification_email


class TapStack(cdk.Stack):
    """
    Represents the main CDK stack for the TAP project.

    This stack creates a comprehensive serverless architecture including:
    - KMS key for encryption
    - DynamoDB table with on-demand capacity and encryption
    - S3 bucket with versioning and encryption
    - Lambda function with Python runtime
    - API Gateway with CORS support
    - CloudWatch monitoring and alarms
    - SNS notifications

    Args:
        scope (Construct): The parent construct.
        construct_id (str): The unique identifier for this stack.
        props (Optional[TapStackProps]): Optional properties for configuring the 
          stack, including environment suffix and notification email.
        **kwargs: Additional keyword arguments passed to the CDK Stack.
    """

    def __init__(
            self,
            scope: Construct,
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Get notification email from props or context
        self.notification_email = (
            props.notification_email if props else None
        ) or self.node.try_get_context('notificationEmail')

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()
        
        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table()
        
        # Create S3 bucket
        self.s3_bucket = self._create_s3_bucket()
        
        # Create Lambda function
        self.lambda_function = self._create_lambda_function()
        
        # Create API Gateway
        self.api_gateway = self._create_api_gateway()
        
        # Create CloudWatch alarms (after API Gateway is created)
        self._create_cloudwatch_alarms()
        
        # Create outputs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption"""
        return kms.Key(
            self, f"TapKMSKey{self.environment_suffix}",
            description="KMS key for TAP serverless application encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY
        )

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with point-in-time recovery"""
        return dynamodb.Table(
            self, f"TapDynamoDBTable{self.environment_suffix}",
            # Remove explicit table_name to avoid conflicts - CDK will generate unique name
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
            # Enable streams for monitoring
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with versioning and encryption"""
        return s3.Bucket(
            self, f"TapS3Bucket{self.environment_suffix}",
            # Remove explicit bucket_name to ensure global uniqueness - CDK will generate unique name
            versioned=True,
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,
            auto_delete_objects=True,
            # Lifecycle rules
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(30)
                ),
                s3.LifecycleRule(
                    id="TransitionToGlacier",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.GLACIER,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ]
        )

    def _create_lambda_function(self) -> _lambda.Function:
        """Create Lambda function with proper IAM permissions"""
        
        # Create IAM role for Lambda
        lambda_role = iam.Role(
            self, f"TapLambdaExecutionRole{self.environment_suffix}",
            # Remove explicit role_name to avoid conflicts - CDK will generate unique name
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Grant permissions to DynamoDB and S3
        self.dynamodb_table.grant_read_write_data(lambda_role)
        self.s3_bucket.grant_read_write(lambda_role)
        
        # Grant KMS permissions for Lambda to access encrypted resources
        self.kms_key.grant_encrypt_decrypt(lambda_role)

        # Create Lambda function
        lambda_function = _lambda.Function(
            self, f"TapLambdaFunction{self.environment_suffix}",
            # Keep function name with suffix for identification
            function_name=f"tap-api-handler-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=_lambda.Code.from_inline("""
import json
import os
from datetime import datetime

def lambda_handler(event, context):
    print(f"Event: {json.dumps(event)}")
    
    # Extract HTTP method and path
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    
    # Simple routing logic
    response_body = {
        'message': f'Hello from TAP Lambda! Method: {http_method}, Path: {path}',
        'environment': os.environ.get('ENVIRONMENT_SUFFIX', 'dev'),
        'timestamp': datetime.utcnow().isoformat(),
        'function_name': context.function_name if context else 'unknown',
        'request_id': context.aws_request_id if context else 'unknown'
    }
    
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
        },
        'body': json.dumps(response_body)
    }
            """),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "S3_BUCKET_NAME": self.s3_bucket.bucket_name,
                "REGION": self.region,
                "ENVIRONMENT_SUFFIX": self.environment_suffix
            },
            # Enable logging
            log_retention=logs.RetentionDays.ONE_WEEK,
            # Enable tracing
            tracing=_lambda.Tracing.ACTIVE
        )

        return lambda_function

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with CORS and custom domain support"""
        
        # Create API Gateway
        api = apigateway.RestApi(
            self, f"TapAPIGateway{self.environment_suffix}",
            rest_api_name=f"tap-serverless-api-{self.environment_suffix}",
            description="TAP serverless application API",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key", "X-Amz-Security-Token"]
            ),
            # Enable logging
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            request_templates={"application/json": '{ "statusCode": "200" }'}
        )

        # Add resources and methods
        items_resource = api.root.add_resource("items")
        items_resource.add_method("GET", lambda_integration)
        items_resource.add_method("POST", lambda_integration)
        
        item_resource = items_resource.add_resource("{id}")
        item_resource.add_method("GET", lambda_integration)
        item_resource.add_method("PUT", lambda_integration)
        item_resource.add_method("DELETE", lambda_integration)

        # Add a simple health check endpoint
        health_resource = api.root.add_resource("health")
        health_resource.add_method("GET", lambda_integration)

        return api

    def _create_cloudwatch_alarms(self) -> None:
        """Create CloudWatch alarms for monitoring"""
        
        # Create SNS topic for notifications
        self.alarm_topic = sns.Topic(
            self, f"TapAlarmTopic{self.environment_suffix}",
            topic_name=f"tap-serverless-alarms-{self.environment_suffix}"
        )

        # Add email subscription if notification email is provided
        if self.notification_email:
            sns.Subscription(
                self, f"TapAlarmEmailSubscription{self.environment_suffix}",
                topic=self.alarm_topic,
                endpoint=self.notification_email,
                protocol=sns.SubscriptionProtocol.EMAIL
            )

        # Lambda error alarm
        self.error_alarm = cloudwatch.Alarm(
            self, f"TapLambdaErrorAlarm{self.environment_suffix}",
            alarm_name=f"tap-lambda-errors-{self.environment_suffix}",
            alarm_description="TAP Lambda function errors",
            metric=self.lambda_function.metric_errors(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        self.error_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))

        # Lambda duration alarm
        self.duration_alarm = cloudwatch.Alarm(
            self, f"TapLambdaDurationAlarm{self.environment_suffix}",
            alarm_name=f"tap-lambda-duration-{self.environment_suffix}",
            alarm_description="TAP Lambda function duration",
            metric=self.lambda_function.metric_duration(
                period=Duration.minutes(5),
                statistic="Average"
            ),
            threshold=20000,  # 20 seconds in milliseconds
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        
        self.duration_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))

        # API Gateway 4XX errors alarm - Fixed to use ApiId instead of ApiName
        self.api_4xx_alarm = cloudwatch.Alarm(
            self, f"TapAPI4XXAlarm{self.environment_suffix}",
            alarm_name=f"tap-api-4xx-errors-{self.environment_suffix}",
            alarm_description="TAP API Gateway 4XX errors",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="4XXError",
                dimensions_map={
                    "ApiId": self.api_gateway.rest_api_id,  # Fixed: use ApiId instead of ApiName
                    "Stage": "prod"
                },
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=10,
            evaluation_periods=2,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD
        )
        
        self.api_4xx_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))

        # API Gateway 5XX errors alarm - Additional monitoring
        self.api_5xx_alarm = cloudwatch.Alarm(
            self, f"TapAPI5XXAlarm{self.environment_suffix}",
            alarm_name=f"tap-api-5xx-errors-{self.environment_suffix}",
            alarm_description="TAP API Gateway 5XX errors",
            metric=cloudwatch.Metric(
                namespace="AWS/ApiGateway",
                metric_name="5XXError",
                dimensions_map={
                    "ApiId": self.api_gateway.rest_api_id,
                    "Stage": "prod"
                },
                statistic="Sum",
                period=Duration.minutes(5)
            ),
            threshold=1,
            evaluation_periods=1,
            comparison_operator=cloudwatch.ComparisonOperator.GREATER_THAN_OR_EQUAL_TO_THRESHOLD
        )
        
        self.api_5xx_alarm.add_alarm_action(cw_actions.SnsAction(self.alarm_topic))

    def _create_outputs(self) -> None:
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self, "APIGatewayURL",
            value=self.api_gateway.url,
            description="API Gateway URL",
            export_name=f"TapAPIURL-{self.environment_suffix}"
        )

        CfnOutput(
            self, "LambdaFunctionARN",
            value=self.lambda_function.function_arn,
            description="Lambda Function ARN",
            export_name=f"TapLambdaARN-{self.environment_suffix}"
        )

        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda Function Name",
            export_name=f"TapLambdaName-{self.environment_suffix}"
        )

        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB Table Name",
            export_name=f"TapDynamoDBTable-{self.environment_suffix}"
        )

        CfnOutput(
            self, "DynamoDBTableArn",
            value=self.dynamodb_table.table_arn,
            description="DynamoDB Table ARN",
            export_name=f"TapDynamoDBTableArn-{self.environment_suffix}"
        )

        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 Bucket Name",
            export_name=f"TapS3Bucket-{self.environment_suffix}"
        )

        CfnOutput(
            self, "S3BucketArn",
            value=self.s3_bucket.bucket_arn,
            description="S3 Bucket ARN",
            export_name=f"TapS3BucketArn-{self.environment_suffix}"
        )

        CfnOutput(
            self, "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS Key ID",
            export_name=f"TapKMSKey-{self.environment_suffix}"
        )

        CfnOutput(
            self, "KMSKeyArn",
            value=self.kms_key.key_arn,
            description="KMS Key ARN",
            export_name=f"TapKMSKeyArn-{self.environment_suffix}"
        )

        CfnOutput(
            self, "SNSTopicArn",
            value=self.alarm_topic.topic_arn,
            description="SNS Topic ARN for alarms",
            export_name=f"TapSNSTopic-{self.environment_suffix}"
        )

        # Output the environment suffix for reference
        CfnOutput(
            self, "EnvironmentSuffix",
            value=self.environment_suffix,
            description="Environment suffix used for resource naming",
            export_name=f"TapEnvironmentSuffix-{self.environment_suffix}"
        )


```