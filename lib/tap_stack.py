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
    aws_iam as iam,
    aws_logs as logs,
    aws_kms as kms,
    aws_ssm as ssm,
    aws_cloudwatch as cloudwatch,
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

    This stack creates a serverless architecture with DynamoDB, Lambda, and API Gateway.
    """

    def __init__(self, scope: Construct, construct_id: str, props: Optional[TapStackProps] = None, **kwargs):
        super().__init__(scope, construct_id, **kwargs)

        # Get environment suffix from props, context, or use 'dev' as default
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # ============================================
        # AWS Systems Manager Parameter Store
        # ============================================
        table_name_param = ssm.StringParameter(
            self,
            "TableNameParameter",
            parameter_name=f"/{environment_suffix}/tap-app/table-name",
            string_value=f"users-table-{environment_suffix}",
            description="DynamoDB table name for the TAP application",
            tier=ssm.ParameterTier.STANDARD,
        )

        api_name_param = ssm.StringParameter(
            self,
            "ApiNameParameter",
            parameter_name=f"/{environment_suffix}/tap-app/api-name",
            string_value=f"tap-api-{environment_suffix}",
            description="API Gateway name for the TAP application",
            tier=ssm.ParameterTier.STANDARD,
        )

        lambda_name_param = ssm.StringParameter(
            self,
            "LambdaNameParameter",
            parameter_name=f"/{environment_suffix}/tap-app/lambda-name",
            string_value=f"tap-handler-{environment_suffix}",
            description="Lambda function name for the TAP application",
            tier=ssm.ParameterTier.STANDARD,
        )

        # ============================================
        # KMS Encryption Key
        # ============================================
        encryption_key = kms.Key(
            self,
            "DynamoDBEncryptionKey",
            description=f"KMS key for DynamoDB table encryption - {environment_suffix}",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY if environment_suffix == "dev" else RemovalPolicy.RETAIN,
            alias=f"alias/dynamodb-{environment_suffix}",
        )

        # ============================================
        # DynamoDB Table
        # ============================================
        users_table = dynamodb.Table(
            self,
            "UsersTable",
            table_name=table_name_param.string_value,
            partition_key=dynamodb.Attribute(
                name="UserId",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=encryption_key,
            point_in_time_recovery_specification=dynamodb.PointInTimeRecoverySpecification(
                point_in_time_recovery_enabled=True
            ),
            contributor_insights_enabled=True,  # Enable CloudWatch Contributor Insights
            removal_policy=RemovalPolicy.DESTROY if environment_suffix == "dev" else RemovalPolicy.RETAIN,
        )

        # ============================================
        # CloudWatch Log Group for Lambda
        # ============================================
        lambda_log_group = logs.LogGroup(
            self,
            "LambdaLogGroup",
            log_group_name=f"/aws/lambda/{lambda_name_param.string_value}",
            retention=logs.RetentionDays.ONE_WEEK if environment_suffix == "dev" else logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY if environment_suffix == "dev" else RemovalPolicy.RETAIN,
        )

        # ============================================
        # Lambda Function Role with Least Privilege
        # ============================================
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Execution role for TAP Lambda function",
        )

        # Add specific CloudWatch Logs permissions
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

        # Add specific DynamoDB permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                ],
                resources=[users_table.table_arn],
            )
        )

        # Add KMS permissions for DynamoDB encryption
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:DescribeKey",
                    "kms:GenerateDataKey",
                ],
                resources=[encryption_key.key_arn],
            )
        )

        # Add Parameter Store read permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "ssm:GetParameter",
                    "ssm:GetParameters",
                ],
                resources=[
                    f"arn:aws:ssm:{self.region}:{self.account}:parameter/{environment_suffix}/tap-app/*"
                ],
            )
        )

        # ============================================
        # Lambda Function with Complete CRUD Code
        # ============================================
        lambda_code = """
import json
import os
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError
from botocore.config import Config

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv("AWS_LAMBDA_LOG_LEVEL", "INFO"))

# Configure boto3 with retry logic
boto3_config = Config(
    retries={
        'max_attempts': 3,
        'mode': 'adaptive'
    }
)

# Initialize AWS clients with retry configuration
dynamodb = boto3.resource("dynamodb", config=boto3_config)
ssm = boto3.client("ssm", config=boto3_config)

# Get configuration from environment variables
TABLE_NAME = os.getenv("TABLE_NAME")
PARAMETER_PREFIX = os.getenv("PARAMETER_PREFIX", "/dev/tap-app")
ENVIRONMENT = os.getenv("ENVIRONMENT", "dev")

# Initialize DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def get_parameter(parameter_name: str) -> Optional[str]:
    \"\"\"
    Retrieve parameter value from AWS Systems Manager Parameter Store.
    \"\"\"
    try:
        response = ssm.get_parameter(
            Name=f"{PARAMETER_PREFIX}/{parameter_name}",
            WithDecryption=True
        )
        return response["Parameter"]["Value"]
    except ClientError as e:
        logger.error(f"Error retrieving parameter {parameter_name}: {str(e)}")
        return None


def create_response(status_code: int, body: Any, error: bool = False) -> Dict[str, Any]:
    \"\"\"
    Create a properly formatted API Gateway Lambda proxy response.
    \"\"\"
    response_body = {
        "success": not error,
        "timestamp": datetime.utcnow().isoformat(),
        "environment": ENVIRONMENT,
    }
    
    if error:
        response_body["error"] = body
    else:
        response_body["data"] = body
    
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "X-Environment": ENVIRONMENT,
        },
        "body": json.dumps(response_body, default=str),
    }


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    \"\"\"
    Main Lambda handler function for processing API Gateway requests.
    \"\"\"
    request_id = context.aws_request_id
    logger.info(json.dumps({
        "event": "lambda_invocation",
        "request_id": request_id,
        "method": event.get("httpMethod"),
        "path": event.get("path"),
        "environment": ENVIRONMENT
    }))
    
    try:
        # Extract HTTP method and path
        http_method = event.get("httpMethod", "").upper()
        path = event.get("path", "")
        path_parameters = event.get("pathParameters", {})
        query_parameters = event.get("queryStringParameters", {}) or {}
        body = event.get("body", None)
        
        logger.info(f"Processing {http_method} request to {path}")
        
        # Parse request body if present
        request_body = {}
        if body:
            try:
                request_body = json.loads(body)
            except json.JSONDecodeError:
                logger.error("Invalid JSON in request body")
                return create_response(400, "Invalid JSON in request body", error=True)
        
        # Route based on path and method
        if path == "/" and http_method == "GET":
            # Health check endpoint
            return handle_health_check()
        
        elif path == "/users" and http_method == "GET":
            # List all users
            return handle_list_users(query_parameters)
        
        elif path == "/users" and http_method == "POST":
            # Create new user
            return handle_create_user(request_body)
        
        elif path.startswith("/users/") and path_parameters and path_parameters.get("userId"):
            user_id = path_parameters["userId"]
            
            if http_method == "GET":
                # Get specific user
                return handle_get_user(user_id)
            
            elif http_method == "PUT":
                # Update user
                return handle_update_user(user_id, request_body)
            
            elif http_method == "DELETE":
                # Delete user
                return handle_delete_user(user_id)
        
        # If no route matches, return 404
        logger.warning(f"No handler found for {http_method} {path}")
        return create_response(404, "Resource not found", error=True)
        
    except Exception as e:
        logger.error(json.dumps({
            "event": "unexpected_error",
            "error": str(e),
            "request_id": request_id
        }), exc_info=True)
        return create_response(500, "Internal server error", error=True)


def handle_health_check() -> Dict[str, Any]:
    \"\"\"
    Handle health check requests.
    \"\"\"
    logger.info("Processing health check")
    
    # Verify DynamoDB table is accessible
    try:
        table.table_status
        dynamodb_status = "healthy"
    except Exception as e:
        logger.error(f"DynamoDB health check failed: {str(e)}")
        dynamodb_status = "unhealthy"
    
    health_status = {
        "status": "healthy" if dynamodb_status == "healthy" else "degraded",
        "checks": {
            "dynamodb": dynamodb_status,
            "table_name": TABLE_NAME,
        },
        "version": "1.0.0",
    }
    
    return create_response(200, health_status)


def handle_list_users(query_parameters: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"
    Handle listing all users from DynamoDB.
    \"\"\"
    logger.info("Listing all users")
    
    try:
        # Perform scan operation (consider pagination for production)
        limit = int(query_parameters.get("limit", 100))
        limit = min(limit, 100)  # Cap at 100 items
        
        response = table.scan(Limit=limit)
        
        users = response.get("Items", [])
        logger.info(json.dumps({
            "event": "users_retrieved",
            "count": len(users)
        }))
        
        result = {
            "users": users,
            "count": len(users),
        }
        
        # Add pagination token if present
        if "LastEvaluatedKey" in response:
            result["nextToken"] = json.dumps(response["LastEvaluatedKey"])
        
        return create_response(200, result)
        
    except ClientError as e:
        logger.error(f"Error listing users: {str(e)}")
        return create_response(500, "Failed to list users", error=True)


def handle_create_user(request_body: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"
    Handle creating a new user in DynamoDB.
    \"\"\"
    logger.info("Creating new user")
    
    # Validate required fields
    if not request_body.get("name") or not request_body.get("email"):
        return create_response(400, "Name and email are required", error=True)
    
    # Generate user ID if not provided
    user_id = request_body.get("UserId", str(uuid.uuid4()))
    
    try:
        # Create user item
        user_item = {
            "UserId": user_id,
            "name": request_body["name"],
            "email": request_body["email"],
            "createdAt": datetime.utcnow().isoformat(),
            "updatedAt": datetime.utcnow().isoformat(),
        }
        
        # Add optional fields
        if "phone" in request_body:
            user_item["phone"] = request_body["phone"]
        if "address" in request_body:
            user_item["address"] = request_body["address"]
        
        # Put item in DynamoDB
        table.put_item(Item=user_item)
        
        logger.info(json.dumps({
            "event": "user_created",
            "user_id": user_id
        }))
        return create_response(201, user_item)
        
    except ClientError as e:
        logger.error(f"Error creating user: {str(e)}")
        return create_response(500, "Failed to create user", error=True)


def handle_get_user(user_id: str) -> Dict[str, Any]:
    \"\"\"
    Handle getting a specific user from DynamoDB.
    \"\"\"
    logger.info(f"Getting user with ID: {user_id}")
    
    try:
        response = table.get_item(Key={"UserId": user_id})
        
        if "Item" not in response:
            logger.warning(f"User not found: {user_id}")
            return create_response(404, "User not found", error=True)
        
        user = response["Item"]
        logger.info(f"Retrieved user: {user_id}")
        return create_response(200, user)
        
    except ClientError as e:
        logger.error(f"Error getting user: {str(e)}")
        return create_response(500, "Failed to get user", error=True)


def handle_update_user(user_id: str, request_body: Dict[str, Any]) -> Dict[str, Any]:
    \"\"\"
    Handle updating a user in DynamoDB.
    \"\"\"
    logger.info(f"Updating user with ID: {user_id}")
    
    if not request_body:
        return create_response(400, "Request body is required", error=True)
    
    try:
        # Build update expression
        update_expression_parts = ["#updatedAt = :updatedAt"]
        expression_attribute_names = {"#updatedAt": "updatedAt"}
        expression_attribute_values = {":updatedAt": datetime.utcnow().isoformat()}
        
        # Add fields to update
        for field in ["name", "email", "phone", "address"]:
            if field in request_body:
                placeholder = f"#{field}"
                value_placeholder = f":{field}"
                update_expression_parts.append(f"{placeholder} = {value_placeholder}")
                expression_attribute_names[placeholder] = field
                expression_attribute_values[value_placeholder] = request_body[field]
        
        if len(update_expression_parts) == 1:
            return create_response(400, "No valid fields to update", error=True)
        
        update_expression = "SET " + ", ".join(update_expression_parts)
        
        # Update item
        response = table.update_item(
            Key={"UserId": user_id},
            UpdateExpression=update_expression,
            ExpressionAttributeNames=expression_attribute_names,
            ExpressionAttributeValues=expression_attribute_values,
            ReturnValues="ALL_NEW",
            ConditionExpression="attribute_exists(UserId)",
        )
        
        updated_user = response["Attributes"]
        logger.info(json.dumps({
            "event": "user_updated",
            "user_id": user_id
        }))
        return create_response(200, updated_user)
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.warning(f"User not found for update: {user_id}")
            return create_response(404, "User not found", error=True)
        logger.error(f"Error updating user: {str(e)}")
        return create_response(500, "Failed to update user", error=True)


def handle_delete_user(user_id: str) -> Dict[str, Any]:
    \"\"\"
    Handle deleting a user from DynamoDB.
    \"\"\"
    logger.info(f"Deleting user with ID: {user_id}")
    
    try:
        # Delete item with condition check
        table.delete_item(
            Key={"UserId": user_id},
            ConditionExpression="attribute_exists(UserId)",
        )
        
        logger.info(json.dumps({
            "event": "user_deleted",
            "user_id": user_id
        }))
        return create_response(200, {"message": f"User {user_id} deleted successfully"})
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.warning(f"User not found for deletion: {user_id}")
            return create_response(404, "User not found", error=True)
        logger.error(f"Error deleting user: {str(e)}")
        return create_response(500, "Failed to delete user", error=True)
"""

        lambda_function = lambda_.Function(
            self,
            "TapHandler",
            function_name=lambda_name_param.string_value,
            runtime=lambda_.Runtime.PYTHON_3_11,  # Updated to match model response
            code=lambda_.Code.from_inline(lambda_code),
            handler="index.lambda_handler",
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TABLE_NAME": users_table.table_name,
                "ENVIRONMENT": environment_suffix,
                "PARAMETER_PREFIX": f"/{environment_suffix}/tap-app",
                "AWS_LAMBDA_LOG_LEVEL": "INFO",
                "POWERTOOLS_SERVICE_NAME": "tap-app",
                "POWERTOOLS_METRICS_NAMESPACE": "TapApp",
            },
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            retry_attempts=2,  # Configure retry behavior
            log_group=lambda_log_group,
            description=f"TAP handler function for {environment_suffix} environment",
        )

        # ============================================
        # API Gateway with Complete REST API
        # ============================================
        
        # Create API Gateway execution role with least privilege
        api_role = iam.Role(
            self,
            "ApiGatewayRole",
            assumed_by=iam.ServicePrincipal("apigateway.amazonaws.com"),
            description="Execution role for API Gateway to invoke Lambda",
        )

        # Add permission to invoke only our specific Lambda
        api_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=["lambda:InvokeFunction"],
                resources=[lambda_function.function_arn],
            )
        )

        api = apigateway.RestApi(
            self,
            "TapApi",
            rest_api_name=api_name_param.string_value,
            description=f"TAP API Gateway for {environment_suffix} environment",
            deploy_options=apigateway.StageOptions(
                stage_name=environment_suffix,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True if environment_suffix == "dev" else False,
                metrics_enabled=True,  # Enable detailed CloudWatch metrics
                tracing_enabled=True,  # Enable X-Ray tracing
                throttling_burst_limit=100,
                throttling_rate_limit=50,
            ),
            cloud_watch_role=True,
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            ),
        )

        # Create Lambda integration with proper configuration
        lambda_integration = apigateway.LambdaIntegration(
            lambda_function,
            credentials_role=api_role,
            proxy=True,  # Use Lambda proxy integration
        )

        # Root resource - GET (health check)
        api.root.add_method("GET", lambda_integration)

        # Users resource - CRUD operations
        users_resource = api.root.add_resource("users")
        
        # GET /users - List all users
        users_resource.add_method("GET", lambda_integration)
        
        # POST /users - Create new user
        users_resource.add_method("POST", lambda_integration)
        
        # Single user resource - /users/{userId}
        user_resource = users_resource.add_resource("{userId}")
        
        # GET /users/{userId} - Get specific user
        user_resource.add_method("GET", lambda_integration)
        
        # PUT /users/{userId} - Update user
        user_resource.add_method("PUT", lambda_integration)
        
        # DELETE /users/{userId} - Delete user
        user_resource.add_method("DELETE", lambda_integration)

        # Add CORS support
        users_resource.add_cors_preflight(
            allow_origins=["*"],
            allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
        )

        user_resource.add_cors_preflight(
            allow_origins=["*"],
            allow_methods=["GET", "PUT", "DELETE", "OPTIONS"],
            allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
        )

        # ============================================
        # CloudWatch Alarms for Monitoring
        # ============================================
        
        lambda_error_alarm = cloudwatch.Alarm(
            self,
            "LambdaErrorAlarm",
            metric=lambda_function.metric_errors(),
            threshold=1,
            evaluation_periods=1,
            alarm_description="Lambda function errors"
        )

        api_4xx_alarm = cloudwatch.Alarm(
            self,
            "Api4xxErrorAlarm",
            metric=api.metric_client_error(),
            threshold=5,
            evaluation_periods=2,
            alarm_description="API Gateway 4xx errors"
        )

        api_5xx_alarm = cloudwatch.Alarm(
            self,
            "Api5xxErrorAlarm",
            metric=api.metric_server_error(),
            threshold=1,
            evaluation_periods=1,
            alarm_description="API Gateway 5xx errors"
        )

        # ============================================
        # Stack Outputs
        # ============================================
        CfnOutput(
            self,
            "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL",
            export_name=f"{environment_suffix}-api-endpoint",
        )

        CfnOutput(
            self,
            "ApiGatewayId",
            value=api.rest_api_id,
            description="API Gateway ID"
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=lambda_function.function_name,
            description="Lambda function name",
            export_name=f"{environment_suffix}-lambda-function",
        )

        CfnOutput(
            self,
            "LambdaFunctionArn",
            value=lambda_function.function_arn,
            description="Lambda function ARN"
        )

        CfnOutput(
            self,
            "TableName",
            value=users_table.table_name,
            description="DynamoDB table name",
            export_name=f"{environment_suffix}-dynamodb-table",
        )

        CfnOutput(
            self,
            "TableArn",
            value=users_table.table_arn,
            description="DynamoDB table ARN"
        )

        CfnOutput(
            self,
            "KMSKeyId",
            value=encryption_key.key_id,
            description="KMS encryption key ID",
            export_name=f"{environment_suffix}-kms-key",
        )

        CfnOutput(
            self,
            "LogGroupName",
            value=lambda_log_group.log_group_name,
            description="CloudWatch Log Group name"
        )
