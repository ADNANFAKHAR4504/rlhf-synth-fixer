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
    aws_lambda as lambda_,
    aws_apigateway as apigw,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    CfnOutput,
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

    This stack creates a serverless application with Lambda, API Gateway, DynamoDB, and S3.
    Based on the PROMPT requirements:
    - Lambda function exposed through API Gateway (GET only)
    - DynamoDB table with userId as partition key, on-demand capacity
    - S3 bucket with versioning, private access only
    - CORS configured for GET requests only
    - Logging at WARNING level or higher
    - Least privilege IAM permissions

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
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context("environmentSuffix") or "dev"

        self.environment_suffix = environment_suffix

        # ============================================
        # DynamoDB Table - on-demand with userId partition key
        # ============================================
        dynamodb_table = dynamodb.Table(
            self,
            "UserDataTable",
            table_name=f"user-data-table-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="userId", type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # On-demand capacity
            removal_policy=RemovalPolicy.DESTROY if environment_suffix != "prod" else RemovalPolicy.RETAIN,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
        )

        # ============================================
        # S3 Bucket - private with versioning
        # ============================================
        s3_bucket = s3.Bucket(
            self,
            "DataStorageBucket",
            bucket_name=f"data-storage-bucket-{environment_suffix}-{self.account}-{self.region}",
            versioned=True,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,  # Completely private
            encryption=s3.BucketEncryption.S3_MANAGED,  # Add encryption for security
            removal_policy=RemovalPolicy.DESTROY if environment_suffix != "prod" else RemovalPolicy.RETAIN,
            auto_delete_objects=True if environment_suffix != "prod" else False,
        )

        # ============================================
        # IAM Role for Lambda with least-privilege permissions
        # ============================================
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            role_name=f"lambda-execution-role-{environment_suffix}",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Execution role for serverless app Lambda function",
            managed_policies=[
                # Basic Lambda execution (CloudWatch Logs)
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        # Add specific DynamoDB permissions (least-privilege)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                ],
                resources=[dynamodb_table.table_arn],
            )
        )

        # Add specific S3 permissions (least-privilege)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket",
                ],
                resources=[
                    s3_bucket.bucket_arn,
                    f"{s3_bucket.bucket_arn}/*",
                ],
            )
        )

        # ============================================
        # Lambda Function with inline code
        # ============================================
        lambda_code = '''
import json
import logging
import os
import boto3
from typing import Dict, Any
from botocore.exceptions import ClientError

# Configure logging - only WARNING and above based on environment variable
log_level = os.environ.get("LOG_LEVEL", "WARNING")
logging.basicConfig(level=getattr(logging, log_level))
logger = logging.getLogger(__name__)

# Initialize AWS clients
dynamodb = boto3.resource("dynamodb")
s3 = boto3.client("s3")

# Get environment variables
TABLE_NAME = os.environ["DYNAMODB_TABLE_NAME"]
BUCKET_NAME = os.environ["S3_BUCKET_NAME"]

# Get DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def main(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for GET requests.
    
    Args:
        event: API Gateway event
        context: Lambda context
    
    Returns:
        API Gateway response
    """
    try:
        # Log incoming request (only if WARNING or higher)
        logger.warning(f"Received GET request: {json.dumps(event.get('queryStringParameters', {}))}")
        
        # Extract query parameters
        query_params = event.get("queryStringParameters", {}) or {}
        user_id = query_params.get("userId")
        action = query_params.get("action", "get")  # default action is 'get'
        
        if not user_id:
            logger.warning("Missing userId parameter")
            return create_response(400, {"error": "userId parameter is required"})
        
        # Perform action based on query parameter
        if action == "get":
            result = get_user_data(user_id, context)
        elif action == "list-files":
            result = list_user_files(user_id)
        else:
            logger.warning(f"Invalid action requested: {action}")
            return create_response(400, {"error": f"Invalid action: {action}"})
        
        return create_response(200, result)
        
    except ClientError as e:
        logger.error(f"AWS service error: {str(e)}")
        return create_response(500, {"error": "Internal server error"})
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return create_response(500, {"error": "Internal server error"})


def get_user_data(user_id: str, context: Any) -> Dict[str, Any]:
    """
    Retrieve user data from DynamoDB.
    
    Args:
        user_id: User identifier
        context: Lambda context
    
    Returns:
        User data dictionary
    """
    try:
        response = table.get_item(Key={"userId": user_id})
        
        if "Item" in response:
            logger.info(f"Retrieved data for user: {user_id}")
            return response["Item"]
        else:
            logger.warning(f"No data found for user: {user_id}")
            # Create a default entry
            default_data = {
                "userId": user_id,
                "created": str(context.aws_request_id),
                "status": "new"
            }
            table.put_item(Item=default_data)
            return default_data
            
    except ClientError as e:
        logger.error(f"DynamoDB error: {str(e)}")
        raise


def list_user_files(user_id: str) -> Dict[str, Any]:
    """
    List files in S3 bucket for a specific user.
    
    Args:
        user_id: User identifier
    
    Returns:
        Dictionary containing file list
    """
    try:
        # List objects with user prefix
        prefix = f"users/{user_id}/"
        response = s3.list_objects_v2(
            Bucket=BUCKET_NAME,
            Prefix=prefix,
            MaxKeys=100
        )
        
        files = []
        if "Contents" in response:
            for obj in response["Contents"]:
                files.append({
                    "key": obj["Key"],
                    "size": obj["Size"],
                    "lastModified": obj["LastModified"].isoformat()
                })
        
        return {
            "userId": user_id,
            "files": files,
            "count": len(files)
        }
        
    except ClientError as e:
        logger.error(f"S3 error: {str(e)}")
        raise


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create API Gateway response with CORS headers.
    
    Args:
        status_code: HTTP status code
        body: Response body
    
    Returns:
        API Gateway response dictionary
    """
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",  # Configure as needed
            "Access-Control-Allow-Methods": "GET, OPTIONS",
        },
        "body": json.dumps(body)
    }
'''

        lambda_function = lambda_.Function(
            self,
            "DataProcessorFunction",
            function_name=f"data-processor-function-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_inline(lambda_code),
            handler="index.main",
            role=lambda_role,
            environment={
                "DYNAMODB_TABLE_NAME": dynamodb_table.table_name,
                "S3_BUCKET_NAME": s3_bucket.bucket_name,
                "LOG_LEVEL": "WARNING",  # Only WARNING and above
            },
            timeout=Duration.seconds(30),
            memory_size=256,
            log_retention=logs.RetentionDays.ONE_WEEK,
            tracing=lambda_.Tracing.ACTIVE,  # X-Ray tracing for better debugging
        )

        # ============================================
        # API Gateway with CORS - GET only
        # ============================================
        api = apigw.RestApi(
            self,
            "ServerlessApi",
            rest_api_name=f"serverless-data-api-{environment_suffix}",
            description="API Gateway for serverless application",
            default_cors_preflight_options=apigw.CorsOptions(
                allow_origins=apigw.Cors.ALL_ORIGINS,  # Configure as needed
                allow_methods=["GET", "OPTIONS"],  # Only GET and OPTIONS for CORS
                allow_headers=[
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token",
                ],
                max_age=Duration.hours(1),
            ),
            deploy_options=apigw.StageOptions(
                stage_name="prod",
                throttling_rate_limit=100,
                throttling_burst_limit=200,
            ),
        )

        # Create Lambda integration
        lambda_integration = apigw.LambdaIntegration(
            lambda_function,
            request_templates={"application/json": '{ "statusCode": "200" }'},
        )

        # Add GET method only - no other HTTP methods
        api_resource = api.root.add_resource("data")
        api_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigw.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True,
                    },
                )
            ],
        )

        # ============================================
        # CloudFormation Outputs
        # ============================================
        CfnOutput(
            self,
            "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL",
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=dynamodb_table.table_name,
            description="DynamoDB table name",
        )

        CfnOutput(
            self,
            "S3BucketName",
            value=s3_bucket.bucket_name,
            description="S3 bucket name for file storage",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=lambda_function.function_name,
            description="Lambda function name",
        )

        # Store references for potential use
        self.api_url = api.url
        self.table_name = dynamodb_table.table_name
        self.bucket_name = s3_bucket.bucket_name
        self.lambda_function = lambda_function

        # ============================================
        # Resource Tags
        # ============================================
        cdk.Tags.of(self).add("Environment", environment_suffix)
        cdk.Tags.of(self).add("Project", "serverless-app")
        cdk.Tags.of(self).add("ManagedBy", "CDK")
