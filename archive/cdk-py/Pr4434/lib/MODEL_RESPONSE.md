### Reasoning Trace
---

The user wants a comprehensive serverless application using AWS CDK in Python. Let me break down the requirements:

1. **Infrastructure Components:**
   - API Gateway (with detailed monitoring)
   - Lambda function (Python runtime)
   - DynamoDB table (encrypted with KMS, UserId as primary key)
   - CloudWatch logging
   - IAM roles with least privilege
   - AWS Systems Manager Parameter Store for configuration

2. **Specific Requirements:**
   - Single CDK stack in main.py
   - Lambda concurrent executions limited to 5
   - DynamoDB encrypted at rest with KMS
   - Proper error handling and status codes
   - CloudWatch logging for all Lambda invocations
   - Configuration values from Parameter Store
   - Production-ready and following best practices

Let me create a comprehensive solution that includes:
- The CDK stack definition
- Lambda function code
- Proper IAM policies
- Parameter Store integration
- Error handling
- Best practices implementation
### Answer 
---

I'll create a comprehensive serverless application using AWS CDK in Python that meets all your requirements. This solution includes a complete CDK stack, Lambda function, and follows AWS best practices.

## Project Structure

First, let's organize the project structure:

```
serverless-app/
├── main.py                 # CDK stack definition
├── lambda/
│   └── handler.py         # Lambda function code
├── requirements.txt        # Python dependencies
├── cdk.json               # CDK configuration
└── README.md              # Documentation
```

## 1. CDK Stack Definition (main.py)

```python
#!/usr/bin/env python3
import os
import json
from aws_cdk import (
    App,
    Stack,
    Duration,
    CfnOutput,
    RemovalPolicy,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
    aws_kms as kms,
    aws_ssm as ssm,
)
from constructs import Construct


class ServerlessApplicationStack(Stack):
    """
    Production-ready serverless application stack with API Gateway, Lambda, and DynamoDB.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Environment configuration
        environment = os.getenv("ENVIRONMENT", "dev")
        
        # ========================================
        # AWS Systems Manager Parameter Store
        # ========================================
        
        # Store configuration values in Parameter Store
        table_name_param = ssm.StringParameter(
            self,
            "TableNameParameter",
            parameter_name=f"/{environment}/serverless-app/table-name",
            string_value=f"users-table-{environment}",
            description="DynamoDB table name for the serverless application",
            tier=ssm.ParameterTier.STANDARD,
        )

        api_name_param = ssm.StringParameter(
            self,
            "ApiNameParameter",
            parameter_name=f"/{environment}/serverless-app/api-name",
            string_value=f"serverless-api-{environment}",
            description="API Gateway name for the serverless application",
            tier=ssm.ParameterTier.STANDARD,
        )

        lambda_name_param = ssm.StringParameter(
            self,
            "LambdaNameParameter",
            parameter_name=f"/{environment}/serverless-app/lambda-name",
            string_value=f"serverless-handler-{environment}",
            description="Lambda function name for the serverless application",
            tier=ssm.ParameterTier.STANDARD,
        )

        # ========================================
        # KMS Encryption Key
        # ========================================
        
        # Create KMS key for DynamoDB encryption
        encryption_key = kms.Key(
            self,
            "DynamoDBEncryptionKey",
            description=f"KMS key for DynamoDB table encryption - {environment}",
            enable_key_rotation=True,  # Best practice for production
            removal_policy=RemovalPolicy.DESTROY if environment == "dev" else RemovalPolicy.RETAIN,
            alias=f"alias/dynamodb-{environment}",
        )

        # ========================================
        # DynamoDB Table
        # ========================================
        
        # Create DynamoDB table with encryption
        users_table = dynamodb.Table(
            self,
            "UsersTable",
            table_name=table_name_param.string_value,
            partition_key=dynamodb.Attribute(
                name="UserId",
                type=dynamodb.AttributeType.STRING,
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # On-demand pricing
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=encryption_key,
            point_in_time_recovery=True,  # Enable PITR for production
            removal_policy=RemovalPolicy.DESTROY if environment == "dev" else RemovalPolicy.RETAIN,
            # Enable CloudWatch Contributor Insights for better monitoring
            contributor_insights_enabled=True,
        )

        # ========================================
        # Lambda Function
        # ========================================
        
        # Create CloudWatch Log Group with retention
        lambda_log_group = logs.LogGroup(
            self,
            "LambdaLogGroup",
            log_group_name=f"/aws/lambda/{lambda_name_param.string_value}",
            retention=logs.RetentionDays.ONE_WEEK if environment == "dev" else logs.RetentionDays.ONE_MONTH,
            removal_policy=RemovalPolicy.DESTROY if environment == "dev" else RemovalPolicy.RETAIN,
        )

        # Create Lambda execution role with least privilege
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Execution role for serverless Lambda function",
            managed_policies=[],  # We'll add specific policies instead of managed ones
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
                    f"arn:aws:ssm:{self.region}:{self.account}:parameter/{environment}/serverless-app/*"
                ],
            )
        )

        # Create Lambda function
        lambda_function = lambda_.Function(
            self,
            "ServerlessHandler",
            function_name=lambda_name_param.string_value,
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("lambda"),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            reserved_concurrent_executions=5,  # Limit concurrent executions
            environment={
                "TABLE_NAME": users_table.table_name,
                "ENVIRONMENT": environment,
                "PARAMETER_PREFIX": f"/{environment}/serverless-app",
                "AWS_LAMBDA_LOG_LEVEL": "INFO",
                "POWERTOOLS_SERVICE_NAME": "serverless-app",
                "POWERTOOLS_METRICS_NAMESPACE": "ServerlessApp",
            },
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            retry_attempts=2,  # Configure retry behavior
            log_group=lambda_log_group,
            description=f"Serverless handler function for {environment} environment",
        )

        # ========================================
        # API Gateway
        # ========================================
        
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

        # Create REST API
        api = apigateway.RestApi(
            self,
            "ServerlessApi",
            rest_api_name=api_name_param.string_value,
            description=f"Serverless API Gateway for {environment} environment",
            deploy_options=apigateway.StageOptions(
                stage_name=environment,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True if environment == "dev" else False,
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

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            lambda_function,
            credentials_role=api_role,
            proxy=True,  # Use Lambda proxy integration for easier request/response handling
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'",
                        "method.response.header.Content-Type": "'application/json'",
                    },
                ),
                apigateway.IntegrationResponse(
                    status_code="400",
                    selection_pattern=".*Bad Request.*",
                ),
                apigateway.IntegrationResponse(
                    status_code="500",
                    selection_pattern=".*Internal Server Error.*",
                ),
            ],
        )

        # Add methods to API
        # Root resource - GET (health check)
        api.root.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": True,
                        "method.response.header.Content-Type": True,
                    },
                ),
            ],
        )

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

        # ========================================
        # CloudWatch Alarms (Optional but recommended)
        # ========================================
        
        # You can add CloudWatch alarms here for monitoring
        # Example: Lambda errors, API Gateway 4xx/5xx errors, DynamoDB throttles

        # ========================================
        # Stack Outputs
        # ========================================
        
        CfnOutput(
            self,
            "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL",
            export_name=f"{environment}-api-endpoint",
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=lambda_function.function_name,
            description="Lambda function name",
            export_name=f"{environment}-lambda-function",
        )

        CfnOutput(
            self,
            "DynamoDBTableName",
            value=users_table.table_name,
            description="DynamoDB table name",
            export_name=f"{environment}-dynamodb-table",
        )

        CfnOutput(
            self,
            "KMSKeyId",
            value=encryption_key.key_id,
            description="KMS encryption key ID",
            export_name=f"{environment}-kms-key",
        )


# ========================================
# CDK App Entry Point
# ========================================

app = App()

# Get environment from context or environment variable
environment = app.node.try_get_context("environment") or os.getenv("ENVIRONMENT", "dev")

# Create the stack
ServerlessApplicationStack(
    app,
    f"ServerlessApplicationStack-{environment}",
    env={
        "account": os.getenv("CDK_DEFAULT_ACCOUNT"),
        "region": os.getenv("CDK_DEFAULT_REGION", "us-east-1"),
    },
    description=f"Serverless application stack for {environment} environment",
    tags={
        "Environment": environment,
        "Project": "ServerlessApp",
        "ManagedBy": "CDK",
        "Owner": "DevOps",
    },
)

app.synth()
```

## 2. Lambda Function Code (lambda/handler.py)

```python
import json
import os
import logging
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import boto3
from boto3.dynamodb.conditions import Key
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.getenv("AWS_LAMBDA_LOG_LEVEL", "INFO"))

# Initialize AWS clients
dynamodb = boto3.resource("dynamodb")
ssm = boto3.client("ssm")

# Get configuration from environment variables
TABLE_NAME = os.getenv("TABLE_NAME")
PARAMETER_PREFIX = os.getenv("PARAMETER_PREFIX", "/dev/serverless-app")
ENVIRONMENT = os.getenv("ENVIRONMENT", "dev")

# Initialize DynamoDB table
table = dynamodb.Table(TABLE_NAME)


def get_parameter(parameter_name: str) -> Optional[str]:
    """
    Retrieve parameter value from AWS Systems Manager Parameter Store.
    """
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
    """
    Create a properly formatted API Gateway Lambda proxy response.
    """
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
    """
    Main Lambda handler function for processing API Gateway requests.
    """
    request_id = context.request_id
    logger.info(f"Request ID: {request_id}")
    logger.info(f"Event: {json.dumps(event)}")
    
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
        
        elif path.startswith("/users/") and path_parameters.get("userId"):
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
        logger.error(f"Unexpected error: {str(e)}", exc_info=True)
        return create_response(500, "Internal server error", error=True)


def handle_health_check() -> Dict[str, Any]:
    """
    Handle health check requests.
    """
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
    """
    Handle listing all users from DynamoDB.
    """
    logger.info("Listing all users")
    
    try:
        # Perform scan operation (consider pagination for production)
        limit = int(query_parameters.get("limit", 100))
        limit = min(limit, 100)  # Cap at 100 items
        
        response = table.scan(Limit=limit)
        
        users = response.get("Items", [])
        logger.info(f"Retrieved {len(users)} users")
        
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
    """
    Handle creating a new user in DynamoDB.
    """
    logger.info("Creating new user")
    
    # Validate required fields
    if not request_body.get("name") or not request_body.get("email"):
        return create_response(400, "Name and email are required", error=True)
    
    # Generate user ID
    user_id = str(uuid.uuid4())
    
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
        
        logger.info(f"Created user with ID: {user_id}")
        return create_response(201, user_item)
        
    except ClientError as e:
        logger.error(f"Error creating user: {str(e)}")
        return create_response(500, "Failed to create user", error=True)


def handle_get_user(user_id: str) -> Dict[str, Any]:
    """
    Handle getting a specific user from DynamoDB.
    """
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
    """
    Handle updating a user in DynamoDB.
    """
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
        logger.info(f"Updated user: {user_id}")
        return create_response(200, updated_user)
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.warning(f"User not found for update: {user_id}")
            return create_response(404, "User not found", error=True)
        logger.error(f"Error updating user: {str(e)}")
        return create_response(500, "Failed to update user", error=True)


def handle_delete_user(user_id: str) -> Dict[str, Any]:
    """
    Handle deleting a user from DynamoDB.
    """
    logger.info(f"Deleting user with ID: {user_id}")
    
    try:
        # Delete item with condition check
        table.delete_item(
            Key={"UserId": user_id},
            ConditionExpression="attribute_exists(UserId)",
        )
        
        logger.info(f"Deleted user: {user_id}")
        return create_response(200, {"message": f"User {user_id} deleted successfully"})
        
    except ClientError as e:
        if e.response["Error"]["Code"] == "ConditionalCheckFailedException":
            logger.warning(f"User not found for deletion: {user_id}")
            return create_response(404, "User not found", error=True)
        logger.error(f"Error deleting user: {str(e)}")
        return create_response(500, "Failed to delete user", error=True)
```

## 3. Requirements Files

### requirements.txt (CDK dependencies)
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### lambda/requirements.txt (Lambda dependencies)
```txt
boto3>=1.26.0
```

## 4. CDK Configuration (cdk.json)

```json
{
  "app": "python3 main.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "source.bat",
      "**/__init__.py",
      "python/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true,
    "@aws-cdk-containers/ecs-service-extensions:enableDefaultLogDriver": true,
    "@aws-cdk/aws-ec2:uniqueImdsv2TemplateName": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/aws-ecs:arnFormatIncludesClusterName": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-codepipeline:crossAccountKeyAliasStackSafeResourceName": true,
    "@aws-cdk/aws-s3:createDefaultLoggingPolicy": true,
    "@aws-cdk/aws-sns-subscriptions:restrictSqsDescryption": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "environment": "dev"
  }
}
```

## 5. Deployment Instructions

### Setup and Deployment

```bash
# 1. Create and activate virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install CDK dependencies
pip install -r requirements.txt

# 3. Bootstrap CDK (first time only)
cdk bootstrap

# 4. Deploy to development environment
ENVIRONMENT=dev cdk deploy

# 5. Deploy to production environment
ENVIRONMENT=prod cdk deploy

# 6. View stack outputs
cdk outputs
```

### Testing the Application

```bash
# Get the API endpoint from stack outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name ServerlessApplicationStack-dev \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
  --output text)

# 1. Health check
curl -X GET "${API_ENDPOINT}"

# 2. Create a user
curl -X POST "${API_ENDPOINT}users" \
  -H "Content-Type: application/json" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# 3. List all users
curl -X GET "${API_ENDPOINT}users"

# 4. Get specific user (replace USER_ID)
curl -X GET "${API_ENDPOINT}users/USER_ID"

# 5. Update user
curl -X PUT "${API_ENDPOINT}users/USER_ID" \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe", "phone": "+1234567890"}'

# 6. Delete user
curl -X DELETE "${API_ENDPOINT}users/USER_ID"
```

## Key Features Implemented

### Security Best Practices
- **IAM Least Privilege**: Each component has minimal required permissions
- **KMS Encryption**: DynamoDB data encrypted at rest with customer-managed keys
- **Parameter Store**: Configuration values stored securely, not hardcoded
- **API Throttling**: Rate limiting configured on API Gateway

### Operational Excellence
- **CloudWatch Logging**: Comprehensive logging for debugging and monitoring
- **X-Ray Tracing**: Distributed tracing enabled for performance analysis
- **Detailed Metrics**: CloudWatch metrics enabled for all components
- **Error Handling**: Graceful error handling with appropriate HTTP status codes

### Reliability
- **Concurrent Execution Limit**: Lambda limited to 5 concurrent executions
- **Retry Logic**: Configured retry attempts for transient failures
- **Point-in-Time Recovery**: Enabled for DynamoDB in production

### Performance
- **On-Demand Scaling**: DynamoDB uses pay-per-request billing
- **Regional Endpoints**: API Gateway uses regional endpoints for lower latency
- **Optimized Memory**: Lambda configured with appropriate memory allocation

### Cost Optimization
- **Pay-Per-Use**: All services use on-demand pricing
- **Log Retention**: Appropriate retention periods for different environments
- **Resource Tagging**: Proper tagging for cost allocation

This solution provides a production-ready, secure, and maintainable serverless application that follows AWS best practices and can be easily deployed across different environments.