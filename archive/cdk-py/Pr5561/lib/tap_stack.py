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
    aws_cognito as cognito,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    aws_cloudwatch as cloudwatch,
)
from constructs import Construct
import json


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
    This stack creates a production-grade serverless data processing system with:
    - Lambda functions for data processing with X-Ray tracing
    - API Gateway with Cognito authentication
    - DynamoDB with explicit capacity management
    - S3 staging bucket with strict access controls
    - CloudWatch monitoring and logging
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
            construct_id: str, 
            props: Optional[TapStackProps] = None, 
            **kwargs
    ):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Environment-specific configuration
        self.config = self._get_environment_config()

        # Create resources in dependency order
        self._create_cognito_user_pool()
        self._create_s3_staging_bucket()
        self._create_dynamodb_table()
        self._create_lambda_functions()
        self._create_api_gateway()
        self._create_cloudwatch_monitoring()
        self._create_outputs()

    def _get_environment_config(self) -> dict:
        """Get environment-specific configuration"""
        configs = {
            "dev": {
                "cognito": {"self_signup": True, "password_min_length": 8},
                "dynamodb": {
                    "read_capacity": 5, "write_capacity": 5,
                    "gsi_read_capacity": 2, "gsi_write_capacity": 2,
                    "min_capacity": 5, "max_capacity": 20
                },
                "s3": {"versioning": False, "retention_days": 7},
                "lambda": {"timeout": 30, "memory_size": 512}
            },
            "prod": {
                "cognito": {"self_signup": False, "password_min_length": 12},
                "dynamodb": {
                    "read_capacity": 25, "write_capacity": 25,
                    "gsi_read_capacity": 10, "gsi_write_capacity": 10,
                    "min_capacity": 25, "max_capacity": 1000
                },
                "s3": {"versioning": True, "retention_days": 90},
                "lambda": {"timeout": 60, "memory_size": 1024}
            }
        }
        return configs.get(self.environment_suffix, configs["dev"])

    def _create_cognito_user_pool(self) -> None:
        """Create Cognito User Pool for API authentication"""

        # User Pool with strong password policy
        self.user_pool = cognito.UserPool(
            self,
            f"{self.environment_suffix}-UserPool",
            user_pool_name=f"{self.environment_suffix}-data-processing-users",
            self_sign_up_enabled=self.config["cognito"]["self_signup"],
            sign_in_aliases=cognito.SignInAliases(
                email=True,
                username=True
            ),
            auto_verify=cognito.AutoVerifiedAttrs(email=True),
            password_policy=cognito.PasswordPolicy(
                min_length=self.config["cognito"]["password_min_length"],
                require_lowercase=True,
                require_uppercase=True,
                require_digits=True,
                require_symbols=True,
                temp_password_validity=Duration.days(3)
            ),
            account_recovery=cognito.AccountRecovery.EMAIL_ONLY,
            removal_policy=RemovalPolicy.RETAIN if self.environment_suffix == "prod" else RemovalPolicy.DESTROY
        )

        # User Pool Client for API access
        self.user_pool_client = self.user_pool.add_client(
            f"{self.environment_suffix}-APIClient",
            user_pool_client_name=f"{self.environment_suffix}-api-client",
            auth_flows=cognito.AuthFlow(
                user_password=True,
                user_srp=True
            ),
            generate_secret=False,
            access_token_validity=Duration.hours(1),
            id_token_validity=Duration.hours(1),
            refresh_token_validity=Duration.days(30)
        )

        # For development environments, provide instructions for user creation
        if self.environment_suffix == "dev":
            CfnOutput(
                self,
                "CreateTestUserInstructions",
                value=f"aws cognito-idp admin-create-user --user-pool-id {self.user_pool.user_pool_id} --username testuser@example.com --user-attributes Name=email,Value=testuser@example.com Name=email_verified,Value=true --temporary-password 'TempPass123!' --message-action SUPPRESS",
                description="Command to create a test user for development",
                export_name=f"{self.stack_name}-CreateTestUserCommand"
            )

    def _create_s3_staging_bucket(self) -> None:
        """Create S3 bucket for staging input data with strict access controls"""

        self.staging_bucket = s3.Bucket(
            self,
            f"{self.environment_suffix}-StagingBucket",
            bucket_name=f"{self.environment_suffix}-data-staging-{self.account}-{self.region}",
            versioned=self.config["s3"]["versioning"],
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN if self.environment_suffix == "prod" else RemovalPolicy.DESTROY,
            auto_delete_objects=self.environment_suffix != "prod",
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="delete-old-staging-data",
                    enabled=True,
                    expiration=Duration.days(self.config["s3"]["retention_days"]),
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )

        # Add bucket policy to enforce SSL/TLS
        self.staging_bucket.add_to_resource_policy(
            iam.PolicyStatement(
                sid="DenyInsecureConnections",
                effect=iam.Effect.DENY,
                principals=[iam.AnyPrincipal()],
                actions=["s3:*"],
                resources=[
                    self.staging_bucket.bucket_arn,
                    f"{self.staging_bucket.bucket_arn}/*"
                ],
                conditions={
                    "Bool": {"aws:SecureTransport": "false"}
                }
            )
        )

    def _create_dynamodb_table(self) -> None:
        """Create DynamoDB table with explicit read/write capacity"""

        self.dynamodb_table = dynamodb.Table(
            self,
            f"{self.environment_suffix}-DataTable",
            table_name=f"{self.environment_suffix}-processed-data",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=self.config["dynamodb"]["read_capacity"],
            write_capacity=self.config["dynamodb"]["write_capacity"],
            removal_policy=RemovalPolicy.RETAIN if self.environment_suffix == "prod" else RemovalPolicy.DESTROY,
            point_in_time_recovery=self.environment_suffix == "prod",
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )

        # Add auto-scaling for production
        if self.environment_suffix == "prod":
            read_scaling = self.dynamodb_table.auto_scale_read_capacity(
                min_capacity=self.config["dynamodb"]["min_capacity"],
                max_capacity=self.config["dynamodb"]["max_capacity"]
            )
            read_scaling.scale_on_utilization(target_utilization_percent=70)

            write_scaling = self.dynamodb_table.auto_scale_write_capacity(
                min_capacity=self.config["dynamodb"]["min_capacity"],
                max_capacity=self.config["dynamodb"]["max_capacity"]
            )
            write_scaling.scale_on_utilization(target_utilization_percent=70)

        # Add Global Secondary Index for querying by status
        self.dynamodb_table.add_global_secondary_index(
            index_name="status-timestamp-index",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            read_capacity=self.config["dynamodb"]["gsi_read_capacity"],
            write_capacity=self.config["dynamodb"]["gsi_write_capacity"],
            projection_type=dynamodb.ProjectionType.ALL
        )

    def _create_lambda_functions(self) -> None:
        """Create Lambda functions with X-Ray tracing and CloudWatch logs"""

        # Base Lambda configuration
        lambda_config = {
            "runtime": lambda_.Runtime.PYTHON_3_11,
            "timeout": Duration.seconds(self.config["lambda"]["timeout"]),
            "memory_size": self.config["lambda"]["memory_size"],
            "tracing": lambda_.Tracing.ACTIVE,  # Enable X-Ray
            "environment": {
                "ENVIRONMENT": self.environment_suffix,
                "DYNAMODB_TABLE": self.dynamodb_table.table_name,
                "S3_BUCKET": self.staging_bucket.bucket_name,
                "LOG_LEVEL": "DEBUG" if self.environment_suffix == "dev" else "INFO",
                "POWERTOOLS_SERVICE_NAME": "data-processing",
                "POWERTOOLS_METRICS_NAMESPACE": f"{self.environment_suffix}/DataProcessing"
            }
        }

        # Data Validation Lambda with inline code from MODEL_RESPONSE
        self.validate_lambda = lambda_.Function(
            self,
            f"{self.environment_suffix}-ValidateDataLambda",
            function_name=f"{self.environment_suffix}-validate-data",
            description="Validates incoming data before processing",
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
import time
import logging
from datetime import datetime
# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))
# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE']
BUCKET_NAME = os.environ['S3_BUCKET']
def lambda_handler(event, context):
    \"\"\"
    Validates incoming data from API Gateway
    \"\"\"
    try:
        # Log the incoming event
        logger.info(f"Received validation request: {json.dumps(event)}")
        
        # Parse the request body
        body = json.loads(event.get('body', '{}'))
        
        # Validation logic
        if not body.get('data'):
            logger.warning("Validation failed: missing data field")
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Missing required field: data'})
            }
        
        # Additional validation checks
        data = body['data']
        if not isinstance(data, dict):
            return {
                'statusCode': 400,
                'headers': {
                    'Content-Type': 'application/json',
                    'Access-Control-Allow-Origin': '*'
                },
                'body': json.dumps({'error': 'Data must be an object'})
            }
        
        # Store validation result in DynamoDB
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(
            Item={
                'id': context.aws_request_id,
                'timestamp': int(time.time()),
                'status': 'validated',
                'data': data,
                'created_at': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Data validated successfully for request: {context.aws_request_id}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Data validated successfully',
                'request_id': context.aws_request_id
            })
        }
        
    except Exception as e:
        logger.exception("Validation error occurred")
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }
            """),
            **lambda_config
        )

        # Data Processing Lambda with inline code from MODEL_RESPONSE
        self.process_lambda = lambda_.Function(
            self,
            f"{self.environment_suffix}-ProcessDataLambda",
            function_name=f"{self.environment_suffix}-process-data",
            description="Processes validated data and stores results",
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline("""
import json
import os
import boto3
import time
import logging
from datetime import datetime
# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))
# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')
# Environment variables
TABLE_NAME = os.environ['DYNAMODB_TABLE']
BUCKET_NAME = os.environ['S3_BUCKET']
def lambda_handler(event, context):
    \"\"\"
    Processes validated data and stores results
    \"\"\"
    try:
        logger.info(f"Processing data request: {json.dumps(event)}")
        
        body = json.loads(event.get('body', '{}'))
        
        # Process the data (example transformation)
        processed_data = {
            'original': body.get('data', {}),
            'processed_at': context.aws_request_id,
            'processed_time': datetime.utcnow().isoformat(),
            'transformed': {
                k: v.upper() if isinstance(v, str) else v 
                for k, v in body.get('data', {}).items()
            }
        }
        
        # Store processed data in S3
        s3_key = f"processed/{context.aws_request_id}.json"
        s3_client.put_object(
            Bucket=BUCKET_NAME,
            Key=s3_key,
            Body=json.dumps(processed_data, indent=2),
            ContentType='application/json',
            ServerSideEncryption='AES256'
        )
        
        # Update DynamoDB with processing status
        table = dynamodb.Table(TABLE_NAME)
        table.put_item(
            Item={
                'id': context.aws_request_id,
                'timestamp': int(time.time()),
                'status': 'processed',
                's3_key': s3_key,
                'processed_data': processed_data,
                'created_at': datetime.utcnow().isoformat()
            }
        )
        
        logger.info(f"Data processed successfully, stored at: {s3_key}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'message': 'Data processed successfully',
                'request_id': context.aws_request_id,
                's3_key': s3_key
            })
        }
        
    except Exception as e:
        logger.exception("Processing error occurred")
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': 'Processing failed'})
        }
            """),
            **lambda_config
        )

        # Health Check Lambda - Fixed import statement
        self.health_lambda = lambda_.Function(
            self,
            f"{self.environment_suffix}-HealthLambda",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.handler",
            code=lambda_.Code.from_inline("""
import json
import os
def handler(event, context):
    return {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps({
            'status': 'healthy', 
            'service': 'data-processing-api',
            'environment': os.environ.get('ENVIRONMENT', 'unknown')
        })
    }
            """),
            timeout=Duration.seconds(5),
            tracing=lambda_.Tracing.ACTIVE,
            environment={
                "ENVIRONMENT": self.environment_suffix
            }
        )

        # Grant permissions
        self.staging_bucket.grant_read_write(self.validate_lambda)
        self.staging_bucket.grant_read_write(self.process_lambda)
        self.dynamodb_table.grant_read_write_data(self.process_lambda)
        self.dynamodb_table.grant_read_write_data(self.validate_lambda)

        # Add X-Ray permissions
        xray_policy = iam.PolicyStatement(
            effect=iam.Effect.ALLOW,
            actions=[
                "xray:PutTraceSegments",
                "xray:PutTelemetryRecords"
            ],
            resources=["*"]
        )

        for lambda_func in [self.validate_lambda, self.process_lambda, self.health_lambda]:
            lambda_func.add_to_role_policy(xray_policy)

    def _create_api_gateway(self) -> None:
        """Create REST API Gateway with Cognito authorization"""

        # Create REST API
        self.api = apigateway.RestApi(
            self,
            f"{self.environment_suffix}-DataAPI",
            rest_api_name=f"{self.environment_suffix}-data-processing-api",
            description="Data Processing REST API Gateway",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                data_trace_enabled=True,
                metrics_enabled=True,
                throttling_rate_limit=1000,
                throttling_burst_limit=2000
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Authorization", "Content-Type", "X-Api-Key"]
            )
        )

        # Create Cognito authorizer
        authorizer = apigateway.CognitoUserPoolsAuthorizer(
            self,
            f"{self.environment_suffix}-CognitoAuthorizer",
            cognito_user_pools=[self.user_pool],
            authorizer_name=f"{self.environment_suffix}-cognito-auth"
        )

        # Create Lambda integrations
        validate_integration = apigateway.LambdaIntegration(
            self.validate_lambda,
            request_templates={"application/json": '{ "statusCode": "200" }'}
        )

        process_integration = apigateway.LambdaIntegration(
            self.process_lambda,
            request_templates={"application/json": '{ "statusCode": "200" }'}
        )

        health_integration = apigateway.LambdaIntegration(
            self.health_lambda,
            request_templates={"application/json": '{ "statusCode": "200" }'}
        )

        # Add routes
        # Validation endpoint
        validate_resource = self.api.root.add_resource("validate")
        validate_resource.add_method(
            "POST",
            validate_integration,
            authorization_type=apigateway.AuthorizationType.COGNITO,
            authorizer=authorizer,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Content-Type": True,
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                ),
                apigateway.MethodResponse(status_code="400"),
                apigateway.MethodResponse(status_code="500")
            ]
        )

        # Processing endpoint
        process_resource = self.api.root.add_resource("process")
        process_resource.add_method(
            "POST",
            process_integration,
            authorization_type=apigateway.AuthorizationType.COGNITO,
            authorizer=authorizer,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Content-Type": True,
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                ),
                apigateway.MethodResponse(status_code="500")
            ]
        )

        # Health check endpoint (no auth required)
        health_resource = self.api.root.add_resource("health")
        health_resource.add_method(
            "GET",
            health_integration,
            method_responses=[
                apigateway.MethodResponse(status_code="200")
            ]
        )

        # Create API Gateway CloudWatch Log Group
        self.api_log_group = logs.LogGroup(
            self,
            f"{self.environment_suffix}-APILogGroup",
            log_group_name=f"/aws/apigateway/{self.environment_suffix}-data-api",
            retention=logs.RetentionDays.ONE_WEEK if self.environment_suffix == "dev" else logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY if self.environment_suffix == "dev" else RemovalPolicy.RETAIN
        )

    def _create_cloudwatch_monitoring(self) -> None:
        """Create CloudWatch alarms for monitoring"""

        # Lambda Error Alarms
        self.validate_errors_alarm = cloudwatch.Alarm(
            self,
            f"{self.environment_suffix}-ValidateLambdaErrorsAlarm",
            metric=self.validate_lambda.metric_errors(),
            threshold=5,
            evaluation_periods=2,
            alarm_description="Alert when validation Lambda function errors exceed threshold"
        )

        self.process_errors_alarm = cloudwatch.Alarm(
            self,
            f"{self.environment_suffix}-ProcessLambdaErrorsAlarm",
            metric=self.process_lambda.metric_errors(),
            threshold=5,
            evaluation_periods=2,
            alarm_description="Alert when processing Lambda function errors exceed threshold"
        )

        # Lambda Throttling Alarms
        self.validate_throttles_alarm = cloudwatch.Alarm(
            self,
            f"{self.environment_suffix}-ValidateLambdaThrottlesAlarm",
            metric=self.validate_lambda.metric_throttles(),
            threshold=10,
            evaluation_periods=1,
            alarm_description="Alert when validation Lambda function is throttled"
        )

        self.process_throttles_alarm = cloudwatch.Alarm(
            self,
            f"{self.environment_suffix}-ProcessLambdaThrottlesAlarm",
            metric=self.process_lambda.metric_throttles(),
            threshold=10,
            evaluation_periods=1,
            alarm_description="Alert when processing Lambda function is throttled"
        )

        # DynamoDB Throttling Alarms
        self.dynamodb_read_throttles_alarm = cloudwatch.Alarm(
            self,
            f"{self.environment_suffix}-DynamoDBReadThrottlesAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/DynamoDB",
                metric_name="ReadThrottledEvents",
                dimensions_map={"TableName": self.dynamodb_table.table_name}
            ),
            threshold=0,
            evaluation_periods=2,
            alarm_description="Alert when DynamoDB read operations are throttled"
        )

        self.dynamodb_write_throttles_alarm = cloudwatch.Alarm(
            self,
            f"{self.environment_suffix}-DynamoDBWriteThrottlesAlarm",
            metric=cloudwatch.Metric(
                namespace="AWS/DynamoDB",
                metric_name="WriteThrottledEvents",
                dimensions_map={"TableName": self.dynamodb_table.table_name}
            ),
            threshold=0,
            evaluation_periods=2,
            alarm_description="Alert when DynamoDB write operations are throttled"
        )

    def _create_outputs(self) -> None:
        """Create stack outputs for easy reference"""

        CfnOutput(
            self, 
            "APIEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
            export_name=f"{self.stack_name}-APIEndpoint"
        )

        CfnOutput(
            self,
            "UserPoolId",
            value=self.user_pool.user_pool_id,
            description="Cognito User Pool ID",
            export_name=f"{self.stack_name}-UserPoolId"
        )

        CfnOutput(
            self,
            "UserPoolClientId",
            value=self.user_pool_client.user_pool_client_id,
            description="Cognito User Pool Client ID",
            export_name=f"{self.stack_name}-UserPoolClientId"
        )

        CfnOutput(
            self,
            "StagingBucketName",
            value=self.staging_bucket.bucket_name,
            description="S3 Staging Bucket Name",
            export_name=f"{self.stack_name}-StagingBucketName"
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB Table Name",
            export_name=f"{self.stack_name}-DynamoDBTableName"
        )

        CfnOutput(
            self,
            "ValidateLambdaFunctionName",
            value=self.validate_lambda.function_name,
            description="Validate Lambda Function Name",
            export_name=f"{self.stack_name}-ValidateLambdaFunctionName"
        )

        CfnOutput(
            self,
            "ProcessLambdaFunctionName",
            value=self.process_lambda.function_name,
            description="Process Lambda Function Name",
            export_name=f"{self.stack_name}-ProcessLambdaFunctionName"
        )

        CfnOutput(
            self,
            "Environment",
            value=self.environment_suffix,
            description="Environment suffix used for resource naming",
            export_name=f"{self.stack_name}-Environment"
        )