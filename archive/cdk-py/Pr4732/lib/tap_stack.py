"""tap_stack.py
This module defines the TapStack class, which serves as the main CDK stack for 
the TAP (Test Automation Platform) project.
It orchestrates the instantiation of other resource-specific stacks and 
manages environment-specific configurations.
"""

import os
from typing import Optional

import aws_cdk as cdk
from aws_cdk import (
    Duration,
    CfnOutput,
    RemovalPolicy,
    aws_apigatewayv2 as apigatewayv2,
    aws_apigatewayv2_integrations as integrations,
    aws_lambda as lambda_,
    aws_dynamodb as dynamodb,
    aws_logs as logs,
    aws_iam as iam,
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

    This stack is responsible for orchestrating the instantiation of other resource-specific stacks.
    It determines the environment suffix from the provided properties, 
        CDK context, or defaults to 'dev'.
    Note:
        - Creates serverless API infrastructure with API Gateway, Lambda, and DynamoDB.
        - Follows production-ready security and monitoring best practices.

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

        # Create CloudWatch Log Groups
        api_log_group = logs.LogGroup(
            self,
            "ApiLogGroup",
            log_group_name=f"/aws/apigateway/tap-api-{environment_suffix}",
            retention=logs.RetentionDays.FIVE_DAYS,
            removal_policy=RemovalPolicy.DESTROY,
        )
        
        lambda_log_group = logs.LogGroup(
            self,
            "LambdaLogGroup",
            log_group_name=f"/aws/lambda/tap-api-handler-{environment_suffix}",
            retention=logs.RetentionDays.FIVE_DAYS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create DynamoDB table with encryption
        table = dynamodb.Table(
            self,
            "DataTable",
            table_name=f"tap-api-data-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="createdAt",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            point_in_time_recovery=True,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self,
            "LambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for TAP API Lambda function",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )
        
        # Add specific DynamoDB permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                ],
                resources=[
                    table.table_arn,
                    f"{table.table_arn}/index/*"
                ],
            )
        )
        
        # Add CloudWatch Logs permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents",
                ],
                resources=[lambda_log_group.log_group_arn],
            )
        )

        # Lambda function code inline (as requested)
        lambda_code = """
import json
import os
import boto3
import logging
from datetime import datetime
from typing import Dict, Any, Optional
import uuid
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb")
table_name = os.environ.get("TABLE_NAME")
table = dynamodb.Table(table_name) if table_name else None

# Configuration
ENVIRONMENT = os.environ.get("ENVIRONMENT", "development")
API_KEY = os.environ.get("API_KEY", "")


def create_response(status_code: int, body: Any, error: bool = False) -> Dict[str, Any]:
    \"\"\"Create standardized API response\"\"\"
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,Authorization,X-Api-Key",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
        "body": json.dumps({
            "success": not error,
            "data": body if not error else None,
            "error": body if error else None,
            "timestamp": datetime.utcnow().isoformat(),
            "environment": ENVIRONMENT,
        }),
    }


def validate_api_key(headers: Dict[str, str]) -> bool:
    \"\"\"Validate API key from headers\"\"\"
    if not API_KEY:
        return True  # Skip validation if no API key is configured
    
    # Handle case-insensitive header lookup
    headers_lower = {k.lower(): v for k, v in headers.items()}
    provided_key = headers_lower.get("x-api-key", "")
    return provided_key == API_KEY


def get_item(item_id: str) -> Dict[str, Any]:
    \"\"\"Get a single item from DynamoDB\"\"\"
    try:
        # Query using partition key
        response = table.query(
            KeyConditionExpression=Key("id").eq(item_id),
            ScanIndexForward=False,  # Get most recent first
            Limit=1
        )
        
        items = response.get("Items", [])
        if not items:
            return create_response(404, {"message": f"Item {item_id} not found"}, error=True)
        
        logger.info(f"Retrieved item: {item_id}")
        return create_response(200, items[0])
        
    except ClientError as e:
        logger.error(f"Error getting item {item_id}: {str(e)}")
        return create_response(500, {"message": "Database error occurred"}, error=True)


def get_all_items() -> Dict[str, Any]:
    \"\"\"Get all items from DynamoDB\"\"\"
    try:
        response = table.scan()
        items = response.get("Items", [])
        
        # Handle pagination if needed
        while "LastEvaluatedKey" in response:
            response = table.scan(ExclusiveStartKey=response["LastEvaluatedKey"])
            items.extend(response.get("Items", []))
        
        logger.info(f"Retrieved {len(items)} items")
        return create_response(200, {"items": items, "count": len(items)})
        
    except ClientError as e:
        logger.error(f"Error scanning table: {str(e)}")
        return create_response(500, {"message": "Database error occurred"}, error=True)


def create_item(data: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Create a new item in DynamoDB\"\"\"
    try:
        # Validate required fields
        if not data or "content" not in data:
            return create_response(400, {"message": "Missing required field: content"}, error=True)
        
        # Generate ID and timestamp
        item_id = str(uuid.uuid4())
        created_at = datetime.utcnow().isoformat()
        
        # Create item
        item = {
            "id": item_id,
            "createdAt": created_at,
            "content": data["content"],
            "metadata": data.get("metadata", {}),
            "status": "active",
            "updatedAt": created_at,
        }
        
        # Store in DynamoDB
        table.put_item(Item=item)
        
        logger.info(f"Created item: {item_id}")
        return create_response(201, item)
        
    except ClientError as e:
        logger.error(f"Error creating item: {str(e)}")
        return create_response(500, {"message": "Failed to create item"}, error=True)


def update_item(item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"Update an existing item in DynamoDB\"\"\"
    try:
        # First, get the existing item to get the createdAt value
        existing = table.query(
            KeyConditionExpression=Key("id").eq(item_id),
            ScanIndexForward=False,
            Limit=1
        )
        
        if not existing.get("Items"):
            return create_response(404, {"message": f"Item {item_id} not found"}, error=True)
        
        created_at = existing["Items"][0]["createdAt"]
        updated_at = datetime.utcnow().isoformat()
        
        # Update item
        response = table.update_item(
            Key={"id": item_id, "createdAt": created_at},
            UpdateExpression="SET content = :content, metadata = :metadata, updatedAt = :updated",
            ExpressionAttributeValues={
                ":content": data.get("content", existing["Items"][0].get("content")),
                ":metadata": data.get("metadata", existing["Items"][0].get("metadata", {})),
                ":updated": updated_at,
            },
            ReturnValues="ALL_NEW",
        )
        
        logger.info(f"Updated item: {item_id}")
        return create_response(200, response["Attributes"])
        
    except ClientError as e:
        logger.error(f"Error updating item {item_id}: {str(e)}")
        return create_response(500, {"message": "Failed to update item"}, error=True)


def delete_item(item_id: str) -> Dict[str, Any]:
    \"\"\"Delete an item from DynamoDB\"\"\"
    try:
        # First, get the item to get the createdAt value
        existing = table.query(
            KeyConditionExpression=Key("id").eq(item_id),
            ScanIndexForward=False,
            Limit=1
        )
        
        if not existing.get("Items"):
            return create_response(404, {"message": f"Item {item_id} not found"}, error=True)
        
        created_at = existing["Items"][0]["createdAt"]
        
        # Delete item
        table.delete_item(Key={"id": item_id, "createdAt": created_at})
        
        logger.info(f"Deleted item: {item_id}")
        return create_response(200, {"message": f"Item {item_id} deleted successfully"})
        
    except ClientError as e:
        logger.error(f"Error deleting item {item_id}: {str(e)}")
        return create_response(500, {"message": "Failed to delete item"}, error=True)


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    \"\"\"Main Lambda handler function\"\"\"
    try:
        # Log the incoming event (but don't log sensitive headers)
        safe_event = {k: v for k, v in event.items() if k != 'headers'}
        logger.info(f"Received event: {json.dumps(safe_event)}")
        
        # Handle CORS preflight requests
        http_method = event.get("requestContext", {}).get("http", {}).get("method", "")
        if http_method == "OPTIONS":
            return create_response(200, {"message": "CORS preflight successful"})
        
        # Check if table is configured
        if not table:
            logger.error("DynamoDB table not configured")
            return create_response(500, {"message": "Database not configured"}, error=True)
        
        # Extract request details
        path = event.get("requestContext", {}).get("http", {}).get("path", "")
        headers = event.get("headers", {})
        path_params = event.get("pathParameters", {}) or {}
        
        # Validate API key
        if not validate_api_key(headers):
            logger.warning("Invalid API key provided")
            return create_response(401, {"message": "Unauthorized"}, error=True)
        
        # Parse body for POST/PUT requests
        body = {}
        if event.get("body"):
            try:
                body = json.loads(event["body"])
            except json.JSONDecodeError:
                return create_response(400, {"message": "Invalid JSON in request body"}, error=True)
        
        # Route to appropriate handler
        if path == "/items":
            if http_method == "GET":
                return get_all_items()
            elif http_method == "POST":
                return create_item(body)
                
        elif path.startswith("/items/"):
            item_id = path_params.get("id")
            if not item_id:
                return create_response(400, {"message": "Item ID required"}, error=True)
                
            if http_method == "GET":
                return get_item(item_id)
            elif http_method == "PUT":
                return update_item(item_id, body)
            elif http_method == "DELETE":
                return delete_item(item_id)
        
        # Default response for unmatched routes
        return create_response(404, {"message": "Route not found"}, error=True)
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return create_response(500, {"message": "Internal server error"}, error=True)
"""

        # Create Lambda function with inline code
        lambda_function = lambda_.Function(
            self,
            "ApiHandler",
            function_name=f"tap-api-handler-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(lambda_code),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TABLE_NAME": table.table_name,
                "ENVIRONMENT": environment_suffix,
                "LOG_LEVEL": os.environ.get("LOG_LEVEL", "INFO"),
                "API_KEY": os.environ.get("API_KEY", "tap-default-key"),
            },
            tracing=lambda_.Tracing.ACTIVE,
            retry_attempts=2,
            log_group=lambda_log_group,
        )

        # Grant table permissions to Lambda
        table.grant_read_write_data(lambda_function)

        # Create HTTP API with CORS
        http_api = apigatewayv2.HttpApi(
            self,
            "HttpApi",
            api_name=f"tap-api-{environment_suffix}",
            cors_preflight=apigatewayv2.CorsPreflightOptions(
                allow_origins=["*"],
                allow_methods=[
                    apigatewayv2.CorsHttpMethod.GET,
                    apigatewayv2.CorsHttpMethod.POST,
                    apigatewayv2.CorsHttpMethod.PUT,
                    apigatewayv2.CorsHttpMethod.DELETE,
                    apigatewayv2.CorsHttpMethod.OPTIONS,
                ],
                allow_headers=["Content-Type", "Authorization", "X-Api-Key"],
                max_age=Duration.hours(1),
            ),
            disable_execute_api_endpoint=False,
        )

        # Create Lambda integration
        lambda_integration = integrations.HttpLambdaIntegration(
            "LambdaIntegration",
            handler=lambda_function,
            payload_format_version=apigatewayv2.PayloadFormatVersion.VERSION_2_0,
        )

        # Add routes
        http_api.add_routes(
            path="/items",
            methods=[apigatewayv2.HttpMethod.GET, apigatewayv2.HttpMethod.POST],
            integration=lambda_integration,
        )

        http_api.add_routes(
            path="/items/{id}",
            methods=[
                apigatewayv2.HttpMethod.GET,
                apigatewayv2.HttpMethod.PUT,
                apigatewayv2.HttpMethod.DELETE,
            ],
            integration=lambda_integration,
        )

        # Configure API Gateway logging
        cfn_stage = http_api.default_stage.node.default_child
        cfn_stage.access_log_settings = apigatewayv2.CfnStage.AccessLogSettingsProperty(
            destination_arn=api_log_group.log_group_arn,
            format='$context.requestId $context.requestTime "$context.routeKey" '
                   '$context.status $context.responseLength $context.error.message '
                   '$context.error.messageString'
        )

        # Grant API Gateway permission to write to CloudWatch Logs
        api_log_group.grant_write(iam.ServicePrincipal("apigateway.amazonaws.com"))

        # Store important attributes for access by other constructs
        self.table = table
        self.lambda_function = lambda_function
        self.http_api = http_api
        self.environment_suffix = environment_suffix

        # Outputs
        CfnOutput(
            self,
            "ApiEndpoint",
            value=http_api.url,
            description="HTTP API Gateway endpoint URL",
        )

        CfnOutput(
            self,
            "TableName",
            value=table.table_name,
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
            "ApiLogGroupName",
            value=api_log_group.log_group_name,
            description="API Gateway CloudWatch Log Group",
        )
