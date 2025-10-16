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
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
    aws_s3 as s3,
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

    This stack creates a fully serverless backend with Lambda functions, API Gateway,
    DynamoDB table, S3 bucket, and proper IAM roles with CloudWatch logging.

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
        # DynamoDB Table
        # ============================================
        items_table = dynamodb.Table(
            self,
            "ItemsTable",
            table_name=f"tap-app-data-table-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id", type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp", type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN if environment_suffix == "prod" else RemovalPolicy.DESTROY,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
        )

        # ============================================
        # S3 Bucket for file storage
        # ============================================
        storage_bucket = s3.Bucket(
            self,
            "StorageBucket",
            bucket_name=f"tap-app-storage-{environment_suffix}-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            public_read_access=False,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN if environment_suffix == "prod" else RemovalPolicy.DESTROY,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(90),
                    abort_incomplete_multipart_upload_after=Duration.days(7),
                )
            ],
        )

        # ============================================
        # Lambda Function with Inline Code
        # ============================================
        lambda_code = """
import json
import os
import logging
import boto3
import time
import traceback
from typing import Dict, Any
from botocore.exceptions import ClientError
from decimal import Decimal

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

# Initialize AWS clients
s3_client = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

# Environment variables
S3_BUCKET_NAME = os.environ.get("S3_BUCKET_NAME")
DYNAMODB_TABLE_NAME = os.environ.get("DYNAMODB_TABLE_NAME")
ENVIRONMENT = os.environ.get("ENVIRONMENT", "dev")

# DynamoDB table
table = dynamodb.Table(DYNAMODB_TABLE_NAME) if DYNAMODB_TABLE_NAME else None


def decimal_default(obj):
    \"\"\"JSON serializer for objects not serializable by default json code\"\"\"
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError(f"Object of type {type(obj)} is not JSON serializable")


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    \"\"\"
    Main Lambda handler function.
    
    Args:
        event: API Gateway event
        context: Lambda context
    
    Returns:
        API Gateway response
    \"\"\"
    
    # Log the incoming event
    logger.info(f"Received event: {json.dumps(event, default=str)}")
    logger.info(f"Environment: {ENVIRONMENT}")
    
    try:
        # Extract HTTP method and path
        http_method = event.get("httpMethod", "")
        path = event.get("path", "")
        path_parameters = event.get("pathParameters") or {}
        query_parameters = event.get("queryStringParameters") or {}
        body = event.get("body", "{}")
        
        logger.info(f"Processing {http_method} request to {path}")
        
        # Route based on method and path
        if path == "/items" and http_method == "GET":
            response = handle_list_items(query_parameters)
        elif path == "/items" and http_method == "POST":
            response = handle_create_item(json.loads(body) if body else {})
        elif path.startswith("/items/") and http_method == "GET":
            item_id = path_parameters.get("id")
            response = handle_get_item(item_id)
        elif path.startswith("/items/") and http_method == "PUT":
            item_id = path_parameters.get("id")
            response = handle_update_item(item_id, json.loads(body) if body else {})
        elif path.startswith("/items/") and http_method == "DELETE":
            item_id = path_parameters.get("id")
            response = handle_delete_item(item_id)
        else:
            response = create_response(404, {"error": "Not found"})
        
        logger.info(f"Response: {json.dumps(response, default=str)}")
        return response
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return create_response(500, {"error": "Internal server error"})


def handle_list_items(query_params: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"List all items from DynamoDB\"\"\"
    try:
        logger.info("Listing items from DynamoDB")
        
        if not table:
            logger.error("DynamoDB table not configured")
            return create_response(500, {"error": "Database not configured"})
        
        # Use scan to get all items, but exclude deleted items
        scan_params = {
            "FilterExpression": "attribute_not_exists(deleted) OR deleted = :false",
            "ExpressionAttributeValues": {":false": False},
            "Limit": int(query_params.get("limit", 100))
        }
        
        response = table.scan(**scan_params)
        items = response.get("Items", [])
        
        # Convert Decimal objects to regular numbers for JSON serialization
        items = json.loads(json.dumps(items, default=decimal_default))
        
        logger.info(f"Retrieved {len(items)} items")
        
        return create_response(200, {"items": items, "count": len(items)})
        
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {"error": "Failed to list items"})
    except Exception as e:
        logger.error(f"Unexpected error in handle_list_items: {e}")
        return create_response(500, {"error": "Failed to list items"})


def handle_create_item(data: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Create a new item in DynamoDB and optionally store data in S3\"\"\"
    try:
        import uuid
        
        if not table:
            logger.error("DynamoDB table not configured")
            return create_response(500, {"error": "Database not configured"})
        
        item_id = str(uuid.uuid4())
        timestamp = int(time.time() * 1000)  # Millisecond timestamp
        
        # Prepare item for DynamoDB
        item = {
            "id": item_id,
            "timestamp": timestamp,
            "data": data,
            "environment": ENVIRONMENT,
        }
        
        # Store in DynamoDB
        logger.info(f"Creating item with ID: {item_id}")
        table.put_item(Item=item)
        
        # If there's file content, store in S3
        if "file_content" in data and S3_BUCKET_NAME:
            s3_key = f"items/{item_id}/data.json"
            logger.info(f"Storing file in S3: {s3_key}")
            
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_key,
                Body=json.dumps(data["file_content"], default=str),
                ContentType="application/json",
                Metadata={
                    "item_id": item_id,
                    "timestamp": str(timestamp),
                    "environment": ENVIRONMENT,
                },
            )
            
            item["s3_key"] = s3_key
        
        # Convert Decimal objects for JSON response
        item = json.loads(json.dumps(item, default=decimal_default))
        
        logger.info(f"Successfully created item: {item_id}")
        return create_response(201, item)
        
    except ClientError as e:
        logger.error(f"AWS error: {e}")
        return create_response(500, {"error": "Failed to create item"})
    except Exception as e:
        logger.error(f"Unexpected error in handle_create_item: {e}")
        return create_response(500, {"error": "Failed to create item"})


def handle_get_item(item_id: str) -> Dict[str, Any]:
    \"\"\"Get a specific item by ID\"\"\"
    try:
        if not item_id:
            return create_response(400, {"error": "Item ID is required"})
        
        if not table:
            logger.error("DynamoDB table not configured")
            return create_response(500, {"error": "Database not configured"})
        
        logger.info(f"Getting item: {item_id}")
        
        # Query DynamoDB for all versions of this item
        response = table.query(
            KeyConditionExpression="id = :id",
            ExpressionAttributeValues={":id": item_id},
            ScanIndexForward=False,  # Latest first
            Limit=1
        )
        
        items = response.get("Items", [])
        
        if not items:
            logger.warning(f"Item not found: {item_id}")
            return create_response(404, {"error": "Item not found"})
        
        item = items[0]
        
        # If there's an S3 key, fetch the content
        if "s3_key" in item and S3_BUCKET_NAME:
            try:
                s3_response = s3_client.get_object(
                    Bucket=S3_BUCKET_NAME,
                    Key=item["s3_key"]
                )
                item["s3_content"] = json.loads(s3_response["Body"].read())
            except ClientError as e:
                logger.warning(f"Failed to fetch S3 content: {e}")
        
        # Convert Decimal objects for JSON response
        item = json.loads(json.dumps(item, default=decimal_default))
        
        return create_response(200, item)
        
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {"error": "Failed to get item"})
    except Exception as e:
        logger.error(f"Unexpected error in handle_get_item: {e}")
        return create_response(500, {"error": "Failed to get item"})


def handle_update_item(item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Update an existing item\"\"\"
    try:
        if not item_id:
            return create_response(400, {"error": "Item ID is required"})
        
        if not table:
            logger.error("DynamoDB table not configured")
            return create_response(500, {"error": "Database not configured"})
        
        logger.info(f"Updating item: {item_id}")
        
        timestamp = int(time.time() * 1000)
        
        # Create a new version of the item
        item = {
            "id": item_id,
            "timestamp": timestamp,
            "data": data,
            "environment": ENVIRONMENT,
            "updated": True,
        }
        
        table.put_item(Item=item)
        
        # Convert Decimal objects for JSON response
        item = json.loads(json.dumps(item, default=decimal_default))
        
        logger.info(f"Successfully updated item: {item_id}")
        return create_response(200, item)
        
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {"error": "Failed to update item"})
    except Exception as e:
        logger.error(f"Unexpected error in handle_update_item: {e}")
        return create_response(500, {"error": "Failed to update item"})


def handle_delete_item(item_id: str) -> Dict[str, Any]:
    \"\"\"Delete an item (soft delete by marking as deleted)\"\"\"
    try:
        if not item_id:
            return create_response(400, {"error": "Item ID is required"})
        
        if not table:
            logger.error("DynamoDB table not configured")
            return create_response(500, {"error": "Database not configured"})
        
        logger.info(f"Deleting item: {item_id}")
        
        timestamp = int(time.time() * 1000)
        
        # Soft delete - create a deletion record
        item = {
            "id": item_id,
            "timestamp": timestamp,
            "deleted": True,
            "environment": ENVIRONMENT,
        }
        
        table.put_item(Item=item)
        
        logger.info(f"Successfully deleted item: {item_id}")
        return create_response(200, {"message": f"Item {item_id} deleted"})
        
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {"error": "Failed to delete item"})
    except Exception as e:
        logger.error(f"Unexpected error in handle_delete_item: {e}")
        return create_response(500, {"error": "Failed to delete item"})


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"
    Create a properly formatted API Gateway response.
    
    Args:
        status_code: HTTP status code
        body: Response body
    
    Returns:
        API Gateway response dict
    \"\"\"
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
        "body": json.dumps(body, default=decimal_default),
    }
"""

        # ============================================
        # Lambda Function
        # ============================================
        lambda_function = _lambda.Function(
            self,
            "ItemsFunction",
            function_name=f"tap-app-function-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_11,
            code=_lambda.Code.from_inline(lambda_code),
            handler="index.lambda_handler",
            environment={
                "S3_BUCKET_NAME": storage_bucket.bucket_name,
                "DYNAMODB_TABLE_NAME": items_table.table_name,
                "ENVIRONMENT": environment_suffix,
                "LOG_LEVEL": "INFO",
            },
            timeout=Duration.seconds(30),
            memory_size=256,
            tracing=_lambda.Tracing.ACTIVE,  # Enable X-Ray tracing
            architecture=_lambda.Architecture.ARM_64,  # Cost optimization
            log_retention=logs.RetentionDays.TWO_WEEKS,  # This creates the log group with retention
        )

        # ============================================
        # IAM Permissions with Least Privilege
        # ============================================
        # Grant DynamoDB permissions
        items_table.grant_read_write_data(lambda_function)
        
        # Grant S3 permissions
        storage_bucket.grant_read_write(lambda_function)

        # ============================================
        # API Gateway
        # ============================================
        api = apigateway.RestApi(
            self,
            "ItemsApi",
            rest_api_name=f"tap-app-api-{environment_suffix}",
            description="REST API for Items CRUD operations",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                caching_enabled=True,
                cache_ttl=Duration.seconds(60),
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
            ),
            policy=iam.PolicyDocument(
                statements=[
                    iam.PolicyStatement(
                        effect=iam.Effect.ALLOW,
                        principals=[iam.AnyPrincipal()],
                        actions=["execute-api:Invoke"],
                        resources=["*"],
                        conditions={
                            "IpAddress": {
                                "aws:SourceIp": ["0.0.0.0/0"]  # Allow all IPs, modify as needed
                            }
                        },
                    )
                ]
            ),
        )

        # API Resources
        items_resource = api.root.add_resource("items")
        single_item_resource = items_resource.add_resource("{id}")

        # ============================================
        # API Gateway Integrations
        # ============================================
        lambda_integration = apigateway.LambdaIntegration(
            lambda_function,
            request_templates={"application/json": '{ "statusCode": "200" }'},
        )

        # POST /items - Create Item
        items_resource.add_method("POST", lambda_integration)

        # GET /items - List Items
        items_resource.add_method("GET", lambda_integration)

        # GET /items/{id} - Get Item with caching
        single_item_resource.add_method(
            "GET", 
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Cache-Control": True
                    }
                )
            ],
            request_parameters={
                "method.request.path.id": True
            }
        )

        # PUT /items/{id} - Update Item
        single_item_resource.add_method("PUT", lambda_integration)

        # DELETE /items/{id} - Delete Item
        single_item_resource.add_method("DELETE", lambda_integration)

        # ============================================
        # CloudWatch Alarms for Monitoring
        # ============================================
        lambda_function.metric_errors().create_alarm(
            self,
            "LambdaErrorAlarm",
            threshold=5,
            evaluation_periods=2,
            alarm_description="Lambda function error rate",
        )

        lambda_function.metric_throttles().create_alarm(
            self,
            "LambdaThrottleAlarm",
            threshold=1,
            evaluation_periods=1,
            alarm_description="Lambda function throttle alarm",
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
            "S3BucketName",
            value=storage_bucket.bucket_name,
            description="S3 bucket name for file storage",
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=items_table.table_name,
            description="DynamoDB table name",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=lambda_function.function_name,
            description="Lambda function name",
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=lambda_function.function_arn,
            description="Lambda function ARN",
        )

        CfnOutput(
            self,
            "ApiGatewayId",
            value=api.rest_api_id,
            description="API Gateway REST API ID",
        )

        # ============================================
        # Resource Tags
        # ============================================
        cdk.Tags.of(self).add("Environment", environment_suffix)
        cdk.Tags.of(self).add("Project", "tap-app")
        cdk.Tags.of(self).add("Owner", "engineering-team")
        cdk.Tags.of(self).add("ManagedBy", "CDK")
