# Ideal Solution

This document outlines the ideal implementation of the `TapStack` class, which provisions a serverless backend using AWS CDK with Python. The solution includes DynamoDB, Lambda, and API Gateway, following best practices for security, performance, and maintainability.

---

## **1. TapStack Class**

### **File: `tap_stack.py`**

```python
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
    RemovalPolicy,
    CfnOutput,
    aws_dynamodb as dynamodb,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
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

    This stack is responsible for creating a complete serverless setup with API Gateway, 
    Lambda, and DynamoDB based on the PROMPT requirements.
    It determines the environment suffix from the provided properties, 
        CDK context, or defaults to 'dev'.

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
        environment_suffix = (
            props.environment_suffix if props else None
        ) or self.node.try_get_context('environmentSuffix') or 'dev'

        # Create DynamoDB table with on-demand billing
        user_table = dynamodb.Table(
            self,
            "UserTable",
            table_name=f"user-data-table-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="userId",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.RETAIN,  # Use RETAIN for production
            point_in_time_recovery=True,  # Enable PITR for production data safety
            encryption=dynamodb.TableEncryption.AWS_MANAGED,  # Encryption at rest
        )

        # Create CloudWatch log group for Lambda with 7-day retention
        lambda_log_group = logs.LogGroup(
            self,
            "LambdaLogGroup",
            log_group_name=f"/aws/lambda/user-api-handler-{environment_suffix}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create Lambda execution role with least privilege
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Execution role for User API Lambda function",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ]
        )

        # Grant Lambda read-only access to DynamoDB table
        user_table.grant_read_data(lambda_role)

        # Lambda function code (inline as per MODEL_RESPONSE)
        lambda_code = '''
import json
import logging
import os
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
import boto3
from botocore.exceptions import ClientError

# Configure structured logging
logger = logging.getLogger()
logger.setLevel(os.environ.get("LOG_LEVEL", "INFO"))

# Initialize DynamoDB client
dynamodb = boto3.resource("dynamodb", region_name=os.environ.get("REGION"))
table_name = os.environ.get("TABLE_NAME")
table = dynamodb.Table(table_name)


def create_response(status_code: int, body: Dict[str, Any], error: bool = False) -> Dict[str, Any]:
    """
    Create a standardized API response with proper headers and formatting.
    
    Args:
        status_code: HTTP status code
        body: Response body as dictionary
        error: Whether this is an error response
    
    Returns:
        Formatted API Gateway response
    """
    response_body = {
        "timestamp": datetime.utcnow().isoformat(),
        "success": not error
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
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
            "Access-Control-Allow-Methods": "GET,OPTIONS",
            "X-Request-Id": os.environ.get("AWS_REQUEST_ID", "unknown")
        },
        "body": json.dumps(response_body, default=str)
    }


def validate_user_id(user_id: Optional[str]) -> tuple:
    """
    Validate the userId parameter.
    
    Args:
        user_id: User ID to validate
    
    Returns:
        Tuple of (is_valid, error_message)
    """
    if not user_id:
        return False, "userId is required"
    
    if not isinstance(user_id, str):
        return False, "userId must be a string"
    
    if len(user_id) > 128:
        return False, "userId must not exceed 128 characters"
    
    # Check for valid characters (alphanumeric, dash, underscore)
    import re
    if not re.match(r'^[a-zA-Z0-9-_]+$', user_id):
        return False, "userId contains invalid characters"
    
    return True, None


def get_user_from_dynamodb(user_id: str) -> tuple:
    """
    Retrieve user data from DynamoDB table.
    
    Args:
        user_id: User ID to look up
    
    Returns:
        Tuple of (user_data, error_message)
    """
    try:
        logger.info(f"Fetching user data for userId: {user_id}")
        
        response = table.get_item(
            Key={"userId": user_id},
            ConsistentRead=True,
            ReturnConsumedCapacity="TOTAL"
        )
        
        # Log consumed capacity for monitoring
        if "ConsumedCapacity" in response:
            logger.info(f"DynamoDB consumed capacity: {response['ConsumedCapacity']}")
        
        if "Item" not in response:
            logger.info(f"User not found: {user_id}")
            return None, f"User with ID '{user_id}' not found"
        
        logger.info(f"Successfully retrieved user: {user_id}")
        return response["Item"], None
        
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_message = e.response["Error"]["Message"]
        
        logger.error(f"DynamoDB ClientError: {error_code} - {error_message}")
        
        if error_code == "ResourceNotFoundException":
            return None, "Database table not found. Please contact support."
        elif error_code == "ValidationException":
            return None, "Invalid request parameters"
        elif error_code == "ProvisionedThroughputExceededException":
            return None, "Service temporarily unavailable. Please try again."
        else:
            return None, "An error occurred while accessing the database"
            
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}\\n{traceback.format_exc()}")
        return None, "An unexpected error occurred"


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for user API requests.
    
    Args:
        event: API Gateway event object
        context: Lambda context object
    
    Returns:
        API Gateway response object
    """
    # Log incoming request
    logger.info(f"Incoming request: {json.dumps(event, default=str)}")
    
    try:
        # Extract userId from path parameters
        path_params = event.get("pathParameters", {})
        user_id = path_params.get("userId") if path_params else None
        
        # Validate userId
        is_valid, error_message = validate_user_id(user_id)
        if not is_valid:
            logger.warning(f"Invalid userId: {error_message}")
            return create_response(
                400,
                {"message": error_message, "code": "INVALID_USER_ID"},
                error=True
            )
        
        # Retrieve user from DynamoDB
        user_data, error_message = get_user_from_dynamodb(user_id)
        
        if error_message:
            if "not found" in error_message.lower():
                return create_response(
                    404,
                    {"message": error_message, "code": "USER_NOT_FOUND"},
                    error=True
                )
            else:
                return create_response(
                    500,
                    {"message": error_message, "code": "DATABASE_ERROR"},
                    error=True
                )
        
        # Success response
        return create_response(200, user_data)
        
    except json.JSONDecodeError as e:
        logger.error(f"JSON decode error: {str(e)}")
        return create_response(
            400,
            {"message": "Invalid JSON in request", "code": "INVALID_JSON"},
            error=True
        )
        
    except Exception as e:
        logger.error(f"Unhandled exception: {str(e)}\\n{traceback.format_exc()}")
        return create_response(
            500,
            {"message": "An internal server error occurred", "code": "INTERNAL_ERROR"},
            error=True
        )
'''

        # Create Lambda function
        user_lambda = lambda_.Function(
            self,
            "UserApiHandler",
            function_name=f"user-api-handler-{environment_suffix}",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="index.lambda_handler",
            code=lambda_.Code.from_inline(lambda_code),
            environment={
                "TABLE_NAME": user_table.table_name,
                "TABLE_ARN": user_table.table_arn,
                "LOG_LEVEL": "INFO",
                "REGION": self.region
            },
            role=lambda_role,
            timeout=Duration.seconds(10),
            memory_size=256,
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            description="Lambda function to retrieve user data from DynamoDB",
            log_group=lambda_log_group
        )

        # Create API Gateway REST API
        api = apigateway.RestApi(
            self,
            "UserApi",
            rest_api_name=f"user-data-api-{environment_suffix}",
            description="API for retrieving user information",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                tracing_enabled=True,  # Enable X-Ray tracing
                throttling_rate_limit=100,  # Requests per second
                throttling_burst_limit=200
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=[
                    "Content-Type",
                    "X-Amz-Date",
                    "Authorization",
                    "X-Api-Key",
                    "X-Amz-Security-Token"
                ],
                allow_credentials=True,
                max_age=Duration.hours(1)
            ),
            endpoint_types=[apigateway.EndpointType.REGIONAL],
            cloud_watch_role=True  # Automatically create and configure CloudWatch role
        )

        # Create request validator
        request_validator = apigateway.RequestValidator(
            self,
            "UserRequestValidator",
            rest_api=api,
            request_validator_name="user-request-validator",
            validate_request_parameters=True,
            validate_request_body=False
        )

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            user_lambda,
            proxy=True,
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                ),
                apigateway.IntegrationResponse(
                    status_code="400"
                ),
                apigateway.IntegrationResponse(
                    status_code="404"
                ),
                apigateway.IntegrationResponse(
                    status_code="500"
                )
            ]
        )

        # Add /user resource
        user_resource = api.root.add_resource("user")
        
        # Add /{userId} resource
        user_id_resource = user_resource.add_resource("{userId}")

        # Add GET method with request validation
        user_id_resource.add_method(
            "GET",
            lambda_integration,
            request_parameters={
                "method.request.path.userId": True
            },
            request_validator=request_validator,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True
                    }
                ),
                apigateway.MethodResponse(status_code="400"),
                apigateway.MethodResponse(status_code="404"),
                apigateway.MethodResponse(status_code="500")
            ]
        )

        # Store important attributes for access by other constructs
        self.user_table = user_table
        self.user_lambda = user_lambda
        self.api = api
        self.environment_suffix = environment_suffix

        # Output the API endpoint and other important information
        CfnOutput(
            self,
            "ApiEndpoint",
            value=api.url_for_path("/user/{userId}"),
            description="API Gateway endpoint URL for user retrieval",
        )

        CfnOutput(
            self,
            "TableName",
            value=user_table.table_name,
            description="DynamoDB table name for user data",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=user_lambda.function_name,
            description="Lambda function name for user API",
        )

        CfnOutput(
            self,
            "Environment",
            value=environment_suffix,
            description="Environment suffix used for resource naming",
        )


```