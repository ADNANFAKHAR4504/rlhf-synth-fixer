```python

"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It creates a comprehensive serverless web application with security and monitoring.
"""

from typing import Optional
import aws_cdk as cdk
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput
)
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_apigateway as apigateway
from aws_cdk import aws_dynamodb as dynamodb
from aws_cdk import aws_iam as iam
from aws_cdk import aws_logs as logs
from aws_cdk import aws_s3 as s3
from aws_cdk import aws_kms as kms
from aws_cdk import aws_cloudwatch as cloudwatch
from aws_cdk import aws_cloudwatch_actions as cw_actions
from aws_cdk import aws_sns as sns
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
    Comprehensive serverless web application stack with security and monitoring.
    
    Creates:
    - KMS key for encryption
    - DynamoDB table with encryption at rest
    - S3 bucket with encryption and lifecycle policies
    - Lambda function with least privilege IAM role
    - API Gateway with usage plans and throttling
    - CloudWatch monitoring and alarms
    - SNS topic for alerts
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

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()
        
        # Create DynamoDB table with encryption
        self.dynamodb_table = self._create_dynamodb_table()
        
        # Create S3 bucket for additional storage
        self.s3_bucket = self._create_s3_bucket()
        
        # Create Lambda function
        self.lambda_function = self._create_lambda_function()
        
        # Create API Gateway with usage plan
        self.api_gateway = self._create_api_gateway()
        
        # Create monitoring and alerting
        self._create_monitoring()
        
        # Create outputs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption with automatic rotation"""
        key = kms.Key(
            self, "ServerlessAppKey",
            description=f"KMS key for serverless application encryption - {self.environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY  # For demo purposes
        )
        
        # Add alias for easier reference
        kms.Alias(
            self, "ServerlessAppKeyAlias",
            alias_name=f"alias/serverless-app-key-{self.environment_suffix}",
            target_key=key
        )
        
        # Add tags
        cdk.Tags.of(key).add("Environment", self.environment_suffix)
        cdk.Tags.of(key).add("Service", "TapStack")
        cdk.Tags.of(key).add("Component", "Encryption")
        
        return key

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with encryption at rest and best practices"""
        table = dynamodb.Table(
            self, "ItemsTable",
            table_name=f"serverless-items-{self.environment_suffix}-{self.region}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            point_in_time_recovery=True,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            deletion_protection=False  # Set to True for production
        )
        
        # Add Global Secondary Index for querying by status and creation time
        table.add_global_secondary_index(
            index_name="StatusCreatedIndex",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            )
        )
        
        # Add tags
        cdk.Tags.of(table).add("Environment", self.environment_suffix)
        cdk.Tags.of(table).add("Service", "TapStack")
        cdk.Tags.of(table).add("Component", "Database")
        
        return table

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with encryption at rest and security best practices"""
        bucket = s3.Bucket(
            self, "ServerlessStorageBucket",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            versioned=True,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(30)
                ),
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ]
        )
        
        # Add tags
        cdk.Tags.of(bucket).add("Environment", self.environment_suffix)
        cdk.Tags.of(bucket).add("Service", "TapStack")
        cdk.Tags.of(bucket).add("Component", "Storage")
        
        return bucket

    def _create_lambda_function(self) -> _lambda.Function:
        """Create Lambda function with proper IAM permissions (least privilege)"""
        
        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            role_name=f"lambda-execution-role-{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )
        
        # Add DynamoDB permissions (least privilege)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:DescribeTable"
                ],
                resources=[
                    self.dynamodb_table.table_arn,
                    f"{self.dynamodb_table.table_arn}/index/*"
                ]
            )
        )
        
        # Add S3 permissions (least privilege)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:HeadBucket",
                    "s3:ListBucket"
                ],
                resources=[
                    self.s3_bucket.bucket_arn,
                    f"{self.s3_bucket.bucket_arn}/*"
                ]
            )
        )
        
        # Add KMS permissions for encryption/decryption
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:DescribeKey",
                    "kms:Encrypt",
                    "kms:GenerateDataKey"
                ],
                resources=[self.kms_key.key_arn]
            )
        )

        # Create Lambda function with security best practices
        lambda_function = _lambda.Function(
            self, "ApiHandler",
            function_name=f"api-handler-{self.environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=_lambda.Code.from_inline("""
import json
import os
import logging
from datetime import datetime

logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    try:
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        if http_method == 'GET' and path == '/health':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'status': 'healthy',
                    'timestamp': datetime.utcnow().isoformat(),
                    'environment': os.environ.get('ENVIRONMENT', 'dev'),
                    'service': 'api-handler',
                    'function_name': context.function_name,
                    'memory_limit': context.memory_limit_in_mb
                })
            }
        elif http_method == 'GET' and path == '/items':
            return {
                'statusCode': 200,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'items': [
                        {'id': '1', 'name': 'Sample Item 1', 'status': 'active'},
                        {'id': '2', 'name': 'Sample Item 2', 'status': 'active'},
                        {'id': '3', 'name': 'Sample Item 3', 'status': 'active'}
                    ],
                    'count': 3,
                    'environment': os.environ.get('ENVIRONMENT', 'dev'),
                    'service': 'api-handler'
                })
            }
        else:
            return {
                'statusCode': 404,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({
                    'error': 'Not Found',
                    'message': f'Endpoint {http_method} {path} not found'
                })
            }
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': 'An unexpected error occurred'
            })
        }
            """),
            role=lambda_role,
            environment={
                "TABLE_NAME": self.dynamodb_table.table_name,
                "BUCKET_NAME": self.s3_bucket.bucket_name,
                "KMS_KEY_ID": self.kms_key.key_id,
                "ENVIRONMENT": self.environment_suffix
            },
            timeout=Duration.seconds(30),
            memory_size=512,
            log_retention=logs.RetentionDays.TWO_WEEKS,
            environment_encryption=self.kms_key,
            tracing=_lambda.Tracing.ACTIVE,  # Enable X-Ray tracing
            dead_letter_queue_enabled=True
        )
        
        # Add tags
        cdk.Tags.of(lambda_function).add("Environment", self.environment_suffix)
        cdk.Tags.of(lambda_function).add("Service", "TapStack")
        cdk.Tags.of(lambda_function).add("Component", "Compute")
        
        return lambda_function

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with usage plan, throttling, and security features"""
        
        # Create API Gateway with security configurations
        api = apigateway.RestApi(
            self, "ServerlessApi",
            rest_api_name=f"Serverless Web App API - {self.environment_suffix}",
            description=f"Secure serverless web application API with throttling - {self.environment_suffix}",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=[
                    "Content-Type", 
                    "Authorization", 
                    "X-Amz-Date", 
                    "X-Api-Key", 
                    "X-Amz-Security-Token"
                ],
                max_age=Duration.seconds(600)
            ),
            cloud_watch_role=True,
            deploy_options=apigateway.StageOptions(
                stage_name=self.environment_suffix,
                throttling_rate_limit=500,   # requests per second
                throttling_burst_limit=1000, # burst capacity
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                caching_enabled=False,  # Enable for production if needed
                variables={
                    "environment": self.environment_suffix
                }
            )
        )
        
        # Create Lambda integration with error handling
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            proxy=True,
            allow_test_invoke=False,  # Security best practice
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                )
            ]
        )
        
        # Add method response for CORS
        method_response = apigateway.MethodResponse(
            status_code="200",
            response_parameters={
                "method.response.header.Access-Control-Allow-Origin": True
            }
        )
        
        # Health check endpoint
        health_resource = api.root.add_resource("health")
        health_resource.add_method(
            "GET", 
            lambda_integration,
            method_responses=[method_response]
        )
        
        # Items resource with full CRUD operations
        items_resource = api.root.add_resource("items")
        items_resource.add_method("GET", lambda_integration, method_responses=[method_response])
        items_resource.add_method("POST", lambda_integration, method_responses=[method_response])
        
        # Individual item resource
        item_resource = items_resource.add_resource("{id}")
        item_resource.add_method("GET", lambda_integration, method_responses=[method_response])
        item_resource.add_method("PUT", lambda_integration, method_responses=[method_response])
        item_resource.add_method("DELETE", lambda_integration, method_responses=[method_response])
        
        # Create usage plan with comprehensive throttling and quotas
        usage_plan = api.add_usage_plan(
            "ServerlessUsagePlan",
            name=f"Serverless Usage Plan - {self.environment_suffix}",
            description=f"Production usage plan with rate limiting and quotas - {self.environment_suffix}",
            throttle=apigateway.ThrottleSettings(
                rate_limit=300,    # requests per second
                burst_limit=600    # burst capacity
            ),
            quota=apigateway.QuotaSettings(
                limit=100000,      # requests per day
                period=apigateway.Period.DAY
            )
        )
        
        # Create API key for authentication
        api_key = api.add_api_key(
            "ServerlessApiKey",
            api_key_name=f"serverless-api-key-{self.environment_suffix}",
            description=f"API key for serverless web application access - {self.environment_suffix}"
        )
        
        # Associate API key with usage plan
        usage_plan.add_api_key(api_key)
        usage_plan.add_api_stage(stage=api.deployment_stage)
        
        # Add tags
        cdk.Tags.of(api).add("Environment", self.environment_suffix)
        cdk.Tags.of(api).add("Service", "TapStack")
        cdk.Tags.of(api).add("Component", "API")
        
        return api

    def _create_monitoring(self):
        """Create comprehensive CloudWatch monitoring and alerting"""
        
        # Create SNS topic for alerts
        alert_topic = sns.Topic(
            self, "AlertTopic",
            topic_name=f"serverless-alerts-{self.environment_suffix}",
            display_name=f"Serverless Application Alerts - {self.environment_suffix}"
        )
        
        # Lambda function error rate alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self, "LambdaErrorAlarm",
            alarm_name=f"lambda-errors-{self.environment_suffix}",
            metric=self.lambda_function.metric_errors(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=2,
            alarm_description="Lambda function error rate is too high",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        lambda_error_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
        
        # Lambda function duration alarm
        lambda_duration_alarm = cloudwatch.Alarm(
            self, "LambdaDurationAlarm",
            alarm_name=f"lambda-duration-{self.environment_suffix}",
            metric=self.lambda_function.metric_duration(
                period=Duration.minutes(5),
                statistic="Average"
            ),
            threshold=15000,  # 15 seconds
            evaluation_periods=3,
            alarm_description="Lambda function duration is too high"
        )
        lambda_duration_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
        
        # API Gateway 4XX errors alarm
        api_4xx_alarm = cloudwatch.Alarm(
            self, "Api4xxAlarm",
            alarm_name=f"api-4xx-errors-{self.environment_suffix}",
            metric=self.api_gateway.metric_client_error(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=20,
            evaluation_periods=2,
            alarm_description="API Gateway 4XX error rate is too high"
        )
        api_4xx_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
        
        # Create CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, "ServerlessDashboard",
            dashboard_name=f"Serverless-App-{self.environment_suffix}",
            widgets=[
                [
                    cloudwatch.GraphWidget(
                        title="Lambda Function Metrics",
                        left=[
                            self.lambda_function.metric_invocations(),
                            self.lambda_function.metric_errors(),
                            self.lambda_function.metric_throttles()
                        ],
                        right=[
                            self.lambda_function.metric_duration()
                        ]
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="API Gateway Metrics",
                        left=[
                            self.api_gateway.metric_count(),
                            self.api_gateway.metric_client_error(),
                            self.api_gateway.metric_server_error()
                        ],
                        right=[
                            self.api_gateway.metric_latency()
                        ]
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="DynamoDB Metrics",
                        left=[
                            self.dynamodb_table.metric_consumed_read_capacity_units(),
                            self.dynamodb_table.metric_consumed_write_capacity_units()
                        ],
                        right=[
                            self.dynamodb_table.metric_throttled_requests()
                        ]
                    )
                ]
            ]
        )

        # Add tags
        cdk.Tags.of(alert_topic).add("Environment", self.environment_suffix)
        cdk.Tags.of(alert_topic).add("Service", "TapStack")
        cdk.Tags.of(alert_topic).add("Component", "Monitoring")

    def _create_outputs(self):
        """Create CloudFormation outputs for easy access to resources"""
        
        CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api_gateway.url,
            description="API Gateway URL for the serverless application",
            export_name=f"{self.stack_name}-ApiUrl"
        )
        
        CfnOutput(
            self, "ApiGatewayId",
            value=self.api_gateway.rest_api_id,
            description="API Gateway ID",
            export_name=f"{self.stack_name}-ApiId"
        )
        
        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB table name for storing application data",
            export_name=f"{self.stack_name}-TableName"
        )
        
        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda function name handling API requests",
            export_name=f"{self.stack_name}-FunctionName"
        )
        
        CfnOutput(
            self, "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="Lambda function ARN",
            export_name=f"{self.stack_name}-FunctionArn"
        )
        
        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 bucket name for additional storage",
            export_name=f"{self.stack_name}-BucketName"
        )
        
        CfnOutput(
            self, "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS key ID for encryption",
            export_name=f"{self.stack_name}-KMSKeyId"
        )


```