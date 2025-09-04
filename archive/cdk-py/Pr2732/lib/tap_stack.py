"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It creates a serverless infrastructure with Lambda, API Gateway, S3, and IAM resources.
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
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
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
    Represents the main CDK stack for the TAP project with serverless infrastructure.

    This stack creates all AWS resources including Lambda function, API Gateway, 
    S3 bucket, IAM roles, and CloudWatch logs in a single stack.

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
            **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        self.environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Stack-level tags for cost tracking
        Tags.of(self).add("Environment", self.environment_suffix)
        Tags.of(self).add("Project", "tap-serverless")
        Tags.of(self).add("Owner", "devops-team")
        Tags.of(self).add("CostCenter", "engineering")

        # Create all serverless resources in order of dependencies
        self._create_s3_bucket()
        self._create_lambda_role()
        self._create_lambda_function()
        self._create_api_gateway_account()  # Add this line
        self._create_api_gateway()
        self._create_outputs()

    def _create_s3_bucket(self):
        """Create S3 bucket with versioning and lifecycle rules"""
        # Use a more unique bucket name to avoid conflicts
        unique_id = f"{self.account}-{self.region}-{self.environment_suffix.lower()}"
        
        self.data_bucket = s3.Bucket(
            self, 
            f"DataBucket{self.environment_suffix}",
            # Remove explicit bucket name to let CDK generate a unique one
            # Or use a guaranteed unique name with timestamp
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # Changed to DESTROY for easier cleanup
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="delete-old-versions",
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ]
        )

    def _create_lambda_role(self):
        """Create IAM role for Lambda function with S3 write permissions"""
        # CloudWatch Log Group for Lambda function
        self.lambda_log_group = logs.LogGroup(
            self,
            f"LambdaLogGroup{self.environment_suffix}",
            log_group_name=f"/aws/lambda/serverless-api-handler-{self.environment_suffix.lower()}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # IAM Role for Lambda function
        self.lambda_role = iam.Role(
            self,
            f"LambdaExecutionRole{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
            inline_policies={
                "S3WritePolicy": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:PutObject",
                                "s3:PutObjectAcl",
                                "s3:GetObject",
                                "s3:GetObjectVersion",
                                "s3:DeleteObject",
                                "s3:ListBucket"
                            ],
                            resources=[
                                self.data_bucket.bucket_arn,
                                f"{self.data_bucket.bucket_arn}/*"
                            ]
                        ),
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            resources=[f"{self.lambda_log_group.log_group_arn}:*"]
                        )
                    ]
                )
            }
        )

    def _create_lambda_function(self):
        """Create Lambda function with environment variables"""
        self.api_handler = lambda_.Function(
            self,
            f"ApiHandler{self.environment_suffix}",
            function_name=f"serverless-api-handler-{self.environment_suffix.lower()}",
            runtime=lambda_.Runtime.PYTHON_3_9,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline("""
import json
import boto3
import os
import logging
from datetime import datetime
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv('LOG_LEVEL', 'INFO'))

# Initialize AWS clients
s3_client = boto3.client('s3')
bucket_name = os.getenv('BUCKET_NAME')
region = os.getenv('REGION')
stage = os.getenv('STAGE', 'dev')

def lambda_handler(event, context):
    # Define CORS headers at the top to avoid reference errors
    cors_headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json'
    }
    
    try:
        logger.info(f"Received event: {json.dumps(event)}")
        
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        
        # Handle OPTIONS requests for CORS preflight
        if http_method == 'OPTIONS':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({'message': 'CORS preflight'})
            }
        
        # Health check endpoint
        if path == '/health':
            return {
                'statusCode': 200,
                'headers': cors_headers,
                'body': json.dumps({
                    'status': 'healthy',
                    'timestamp': datetime.utcnow().isoformat(),
                    'region': region,
                    'stage': stage,
                    'bucket': bucket_name
                })
            }
        
        # Handle data operations
        if path == '/data':
            if http_method == 'POST':
                return handle_post_data(event, cors_headers)
            elif http_method == 'GET':
                return handle_get_data(event, cors_headers)
        
        # Default response
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Serverless API is working!',
                'timestamp': datetime.utcnow().isoformat(),
                'path': path,
                'method': http_method
            })
        }
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': str(e)
            })
        }

def handle_post_data(event, cors_headers):
    try:
        body = json.loads(event.get('body', '{}'))
        
        # Generate unique file key
        timestamp = datetime.utcnow().strftime('%Y/%m/%d/%H')
        file_id = str(uuid.uuid4())
        s3_key = f"data/{timestamp}/{file_id}.json"
        
        # Add metadata
        data_with_metadata = {
            'id': file_id,
            'timestamp': datetime.utcnow().isoformat(),
            'data': body,
            'source': 'api-gateway',
            'stage': stage
        }
        
        # Store in S3
        s3_client.put_object(
            Bucket=bucket_name,
            Key=s3_key,
            Body=json.dumps(data_with_metadata, indent=2),
            ContentType='application/json'
        )
        
        logger.info(f"Successfully stored data in S3: {s3_key}")
        
        return {
            'statusCode': 201,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Data stored successfully',
                'id': file_id,
                's3_key': s3_key,
                'bucket': bucket_name
            })
        }
        
    except Exception as e:
        logger.error(f"Error storing data: {str(e)}")
        return {
            'statusCode': 400,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'Bad Request',
                'message': str(e)
            })
        }

def handle_get_data(event, cors_headers):
    try:
        # List recent objects
        response = s3_client.list_objects_v2(
            Bucket=bucket_name,
            Prefix='data/',
            MaxKeys=10
        )
        
        objects = []
        if 'Contents' in response:
            for obj in response['Contents']:
                objects.append({
                    'key': obj['Key'],
                    'size': obj['Size'],
                    'last_modified': obj['LastModified'].isoformat()
                })
        
        return {
            'statusCode': 200,
            'headers': cors_headers,
            'body': json.dumps({
                'message': 'Data retrieved successfully',
                'bucket': bucket_name,
                'objects': objects,
                'count': len(objects)
            })
        }
        
    except Exception as e:
        logger.error(f"Error retrieving data: {str(e)}")
        return {
            'statusCode': 500,
            'headers': cors_headers,
            'body': json.dumps({
                'error': 'Internal Server Error',
                'message': 'Failed to retrieve data'
            })
        }
            """),
        role=self.lambda_role,
        timeout=Duration.seconds(30),
        memory_size=256,
        environment={
            "BUCKET_NAME": self.data_bucket.bucket_name,
            "REGION": self.region,
            "LOG_LEVEL": "INFO",
            "STAGE": self.environment_suffix.lower()
        },
        log_group=self.lambda_log_group,
        description=f"Lambda function to handle API requests and write to S3 - {self.environment_suffix}"
    )

    def _create_api_gateway(self):
        """Create API Gateway REST API with logging enabled"""
        # API Gateway CloudWatch Log Group
        self.api_log_group = logs.LogGroup(
            self,
            f"ApiGatewayLogGroup{self.environment_suffix}", 
            log_group_name=f"/aws/apigateway/serverless-api-{self.environment_suffix.lower()}",
            retention=logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY
        )

        # API Gateway REST API
        self.api = apigateway.RestApi(
            self,
            f"ServerlessApi{self.environment_suffix}",
            rest_api_name=f"serverless-data-api-{self.environment_suffix.lower()}",
            description=f"REST API for serverless data processing - {self.environment_suffix}",
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            ),
            deploy_options=apigateway.StageOptions(
                stage_name=self.environment_suffix.lower(),
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                access_log_destination=apigateway.LogGroupLogDestination(self.api_log_group),
                access_log_format=apigateway.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True
                )
            ),
            # CORS is handled automatically - this creates OPTIONS methods for all resources
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            )
        )

        # Simple Lambda integration (proxy mode handles all responses)
        lambda_integration = apigateway.LambdaIntegration(
            self.api_handler,
            proxy=True  # This handles all status codes automatically
        )

        # API Gateway resources and methods
        data_resource = self.api.root.add_resource("data")
        
        # Remove manual OPTIONS methods - they're created automatically by default_cors_preflight_options
        # data_resource.add_method("OPTIONS", lambda_integration)  # ❌ Remove this line
        
        # POST method for creating data
        data_resource.add_method("POST", lambda_integration)

        # GET method for retrieving data
        data_resource.add_method("GET", lambda_integration)

        # Health check endpoint
        health_resource = self.api.root.add_resource("health")
        health_resource.add_method("GET", lambda_integration)
        # health_resource.add_method("OPTIONS", lambda_integration)  # ❌ Remove this line too

    def _create_api_gateway_account(self):
        """Create API Gateway account configuration for CloudWatch logging"""
        # Create CloudWatch role for API Gateway
        api_gateway_cloudwatch_role = iam.Role(
            self,
            f"ApiGatewayCloudWatchRole{self.environment_suffix}",
            assumed_by=iam.ServicePrincipal("apigateway.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
                )
            ]
        )

        # API Gateway account configuration
        apigateway.CfnAccount(
            self,
            f"ApiGatewayAccount{self.environment_suffix}",
            cloud_watch_role_arn=api_gateway_cloudwatch_role.role_arn
        )

    def _create_outputs(self):
        """Create CloudFormation outputs with dynamic values"""
        CfnOutput(
            self,
            "ApiEndpoint",
            value=self.api.url,
            description="API Gateway endpoint URL",
            export_name=f"TapStack-{self.environment_suffix}-ApiEndpoint"
        )

        CfnOutput(
            self,
            "BucketName",
            value=self.data_bucket.bucket_name,
            description="S3 bucket name for data storage",
            export_name=f"TapStack-{self.environment_suffix}-BucketName"
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=self.api_handler.function_name,
            description="Lambda function name",
            export_name=f"TapStack-{self.environment_suffix}-LambdaFunction"
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=self.api_handler.function_arn,
            description="Lambda function ARN",
            export_name=f"TapStack-{self.environment_suffix}-LambdaArn"
        )

        CfnOutput(
            self,
            "EnvironmentSuffix",
            value=self.environment_suffix,
            description="Environment suffix used for resource naming",
            export_name=f"TapStack-{self.environment_suffix}-EnvironmentSuffix"
        )
