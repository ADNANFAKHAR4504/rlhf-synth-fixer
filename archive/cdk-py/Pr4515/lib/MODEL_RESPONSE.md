### Reasoning Trace
---

The user wants a production-ready serverless application using AWS CDK v2 in Python. Let me break down the requirements:

1. Single CDK stack (main.py)
2. Lambda function (Python runtime) with CloudWatch logging
3. API Gateway with:
   - 60-second caching TTL
   - "prod" stage
   - Logging enabled
4. S3 bucket with versioning enabled
5. DynamoDB table with:
   - Partition key: `id`
   - Sort key: `timestamp`
6. IAM permissions following least privilege
7. Tags for all resources: Environment, Project, Owner
8. Using AWS CDK v2

I'll create a comprehensive CDK stack that includes all these components with proper configurations and best practices.
### Answer 
---

I'll help you build a production-ready serverless application using AWS CDK v2 in Python. This will be a complete, single-stack solution with all the components you've specified.

## Project Structure

First, let's set up the project structure:

```
serverless-app/
├── main.py                 # CDK stack definition
├── lambda/
│   └── handler.py         # Lambda function code
├── requirements.txt       # Python dependencies
└── cdk.json              # CDK configuration
```

## CDK Stack Implementation

Here's the complete `main.py` file with all your requirements:

```python
#!/usr/bin/env python3
import os
from aws_cdk import (
    App,
    Stack,
    Duration,
    RemovalPolicy,
    Tags,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_s3 as s3,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
)
from constructs import Construct


class ServerlessApplicationStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Configuration
        ENVIRONMENT = "prod"
        PROJECT_NAME = "serverless-app"
        OWNER = "engineering-team"
        
        # Create S3 bucket with versioning
        storage_bucket = s3.Bucket(
            self,
            "StorageBucket",
            bucket_name=f"{PROJECT_NAME}-storage-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.RETAIN,  # Retain in production
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="delete-old-versions",
                    noncurrent_version_expiration=Duration.days(90),
                    abort_incomplete_multipart_upload_after=Duration.days(7),
                )
            ],
        )

        # Create DynamoDB table with id and timestamp keys
        data_table = dynamodb.Table(
            self,
            "DataTable",
            table_name=f"{PROJECT_NAME}-data-table",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="timestamp",
                type=dynamodb.AttributeType.NUMBER
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,  # On-demand pricing
            point_in_time_recovery=True,  # Enable PITR for production
            removal_policy=RemovalPolicy.RETAIN,  # Retain in production
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
        )

        # Create CloudWatch Log Group for Lambda
        lambda_log_group = logs.LogGroup(
            self,
            "LambdaLogGroup",
            log_group_name=f"/aws/lambda/{PROJECT_NAME}-function",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self,
            "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description=f"Execution role for {PROJECT_NAME} Lambda function",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ],
        )

        # Add specific permissions for S3 bucket
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:GetObjectVersion",
                    "s3:PutObject",
                    "s3:DeleteObject",
                ],
                resources=[f"{storage_bucket.bucket_arn}/*"],
            )
        )

        # Add permissions for S3 bucket operations
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:ListBucket",
                    "s3:GetBucketVersioning",
                ],
                resources=[storage_bucket.bucket_arn],
            )
        )

        # Add specific permissions for DynamoDB table
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
                resources=[data_table.table_arn],
            )
        )

        # Create Lambda function
        lambda_function = lambda_.Function(
            self,
            "ProcessingFunction",
            function_name=f"{PROJECT_NAME}-function",
            runtime=lambda_.Runtime.PYTHON_3_11,
            handler="handler.lambda_handler",
            code=lambda_.Code.from_asset("lambda"),
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "ENVIRONMENT": ENVIRONMENT,
                "S3_BUCKET_NAME": storage_bucket.bucket_name,
                "DYNAMODB_TABLE_NAME": data_table.table_name,
                "LOG_LEVEL": "INFO",
            },
            log_group=lambda_log_group,
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            retry_attempts=2,
        )

        # Create CloudWatch Log Group for API Gateway
        api_log_group = logs.LogGroup(
            self,
            "ApiGatewayLogGroup",
            log_group_name=f"/aws/apigateway/{PROJECT_NAME}",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY,
        )

        # Create API Gateway with caching and logging
        api = apigateway.RestApi(
            self,
            "ServiceApi",
            rest_api_name=f"{PROJECT_NAME}-api",
            description=f"API Gateway for {PROJECT_NAME}",
            deploy_options=apigateway.StageOptions(
                stage_name=ENVIRONMENT,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                tracing_enabled=True,  # Enable X-Ray tracing
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                cache_cluster_enabled=True,
                cache_cluster_size="0.5",  # Smallest cache size
                cache_ttl=Duration.seconds(60),
                cache_data_encrypted=True,
                access_log_destination=apigateway.LogGroupLogDestination(api_log_group),
                access_log_format=apigateway.AccessLogFormat.json_with_standard_fields(
                    caller=True,
                    http_method=True,
                    ip=True,
                    protocol=True,
                    request_time=True,
                    resource_path=True,
                    response_length=True,
                    status=True,
                    user=True,
                ),
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],  # Configure based on your requirements
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
            ),
        )

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            lambda_function,
            request_templates={"application/json": '{ "statusCode": "200" }'},
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_templates={"application/json": ""},
                )
            ],
        )

        # Add API endpoints
        items = api.root.add_resource("items")
        items.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={"application/json": apigateway.Model.EMPTY_MODEL},
                )
            ],
        )
        items.add_method(
            "POST",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={"application/json": apigateway.Model.EMPTY_MODEL},
                )
            ],
        )

        # Add item by ID endpoint
        item = items.add_resource("{id}")
        item.add_method(
            "GET",
            lambda_integration,
            request_parameters={"method.request.path.id": True},
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={"application/json": apigateway.Model.EMPTY_MODEL},
                )
            ],
        )
        item.add_method(
            "PUT",
            lambda_integration,
            request_parameters={"method.request.path.id": True},
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={"application/json": apigateway.Model.EMPTY_MODEL},
                )
            ],
        )
        item.add_method(
            "DELETE",
            lambda_integration,
            request_parameters={"method.request.path.id": True},
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_models={"application/json": apigateway.Model.EMPTY_MODEL},
                )
            ],
        )

        # Apply tags to all resources
        Tags.of(self).add("Environment", ENVIRONMENT)
        Tags.of(self).add("Project", PROJECT_NAME)
        Tags.of(self).add("Owner", OWNER)

        # Outputs
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
            description="S3 bucket name",
        )
        
        CfnOutput(
            self,
            "DynamoDBTableName",
            value=data_table.table_name,
            description="DynamoDB table name",
        )
        
        CfnOutput(
            self,
            "LambdaFunctionName",
            value=lambda_function.function_name,
            description="Lambda function name",
        )


def main():
    app = App()
    
    ServerlessApplicationStack(
        app,
        "ServerlessApplicationStack",
        env={
            "account": os.environ.get("CDK_DEFAULT_ACCOUNT"),
            "region": os.environ.get("CDK_DEFAULT_REGION"),
        },
        stack_name="serverless-application-prod",
        description="Production-ready serverless application with API Gateway, Lambda, DynamoDB, and S3",
    )
    
    app.synth()


if __name__ == "__main__":
    main()
```

## Lambda Function Implementation

Here's the Lambda function code (`lambda/handler.py`):

```python
import json
import os
import logging
import boto3
import time
import traceback
from typing import Dict, Any
from botocore.exceptions import ClientError

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


def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler function.
    
    Args:
        event: API Gateway event
        context: Lambda context
    
    Returns:
        API Gateway response
    """
    
    # Log the incoming event
    logger.info(f"Received event: {json.dumps(event)}")
    logger.info(f"Environment: {ENVIRONMENT}")
    
    try:
        # Extract HTTP method and path
        http_method = event.get("httpMethod", "")
        path = event.get("path", "")
        path_parameters = event.get("pathParameters", {})
        query_parameters = event.get("queryStringParameters", {})
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
        
        logger.info(f"Response: {response}")
        return response
        
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        logger.error(f"Traceback: {traceback.format_exc()}")
        return create_response(500, {"error": "Internal server error"})


def handle_list_items(query_params: Dict[str, Any]) -> Dict[str, Any]:
    """List all items from DynamoDB"""
    try:
        logger.info("Listing items from DynamoDB")
        
        response = table.scan(
            Limit=int(query_params.get("limit", 100))
        )
        
        items = response.get("Items", [])
        logger.info(f"Retrieved {len(items)} items")
        
        return create_response(200, {"items": items, "count": len(items)})
        
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {"error": "Failed to list items"})


def handle_create_item(data: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new item in DynamoDB and optionally store data in S3"""
    try:
        import uuid
        
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
        if "file_content" in data:
            s3_key = f"items/{item_id}/data.json"
            logger.info(f"Storing file in S3: {s3_key}")
            
            s3_client.put_object(
                Bucket=S3_BUCKET_NAME,
                Key=s3_key,
                Body=json.dumps(data["file_content"]),
                ContentType="application/json",
                Metadata={
                    "item_id": item_id,
                    "timestamp": str(timestamp),
                    "environment": ENVIRONMENT,
                },
            )
            
            item["s3_key"] = s3_key
        
        logger.info(f"Successfully created item: {item_id}")
        return create_response(201, item)
        
    except ClientError as e:
        logger.error(f"AWS error: {e}")
        return create_response(500, {"error": "Failed to create item"})


def handle_get_item(item_id: str) -> Dict[str, Any]:
    """Get a specific item by ID"""
    try:
        if not item_id:
            return create_response(400, {"error": "Item ID is required"})
        
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
        if "s3_key" in item:
            try:
                s3_response = s3_client.get_object(
                    Bucket=S3_BUCKET_NAME,
                    Key=item["s3_key"]
                )
                item["s3_content"] = json.loads(s3_response["Body"].read())
            except ClientError as e:
                logger.warning(f"Failed to fetch S3 content: {e}")
        
        return create_response(200, item)
        
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {"error": "Failed to get item"})


def handle_update_item(item_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing item"""
    try:
        if not item_id:
            return create_response(400, {"error": "Item ID is required"})
        
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
        
        logger.info(f"Successfully updated item: {item_id}")
        return create_response(200, item)
        
    except ClientError as e:
        logger.error(f"DynamoDB error: {e}")
        return create_response(500, {"error": "Failed to update item"})


def handle_delete_item(item_id: str) -> Dict[str, Any]:
    """Delete an item (soft delete by marking as deleted)"""
    try:
        if not item_id:
            return create_response(400, {"error": "Item ID is required"})
        
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


def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """
    Create a properly formatted API Gateway response.
    
    Args:
        status_code: HTTP status code
        body: Response body
    
    Returns:
        API Gateway response dict
    """
    return {
        "statusCode": status_code,
        "headers": {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type,X-Amz-Date,Authorization,X-Api-Key",
            "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
        "body": json.dumps(body, default=str),
    }
```

## Requirements Files

### `requirements.txt`
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### `cdk.json`
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
      "**/__pycache__",
      "**/.pytest_cache",
      "**/.venv",
      "**/.git"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:target-partitions": ["aws", "aws-cn"],
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-cloudfront:defaultSecurityPolicyTLSv1.2_2021": true
  }
}
```

## Deployment Instructions

1. **Install dependencies:**
```bash
pip install -r requirements.txt
```

2. **Bootstrap CDK (first time only):**
```bash
cdk bootstrap
```

3. **Deploy the stack:**
```bash
cdk deploy
```

4. **Test the API:**
```bash
# Get the API endpoint from the stack outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name serverless-application-prod \
  --query "Stacks[0].Outputs[?OutputKey=='ApiEndpoint'].OutputValue" \
  --output text)

# Test creating an item
curl -X POST $API_ENDPOINT/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Item", "description": "This is a test"}'

# Test listing items
curl $API_ENDPOINT/items
```

## Key Features Implemented

### 🔐 **Security**
- Least privilege IAM policies for Lambda
- S3 bucket with encryption and versioning
- DynamoDB with encryption
- API Gateway with throttling limits

### 📊 **Observability**
- CloudWatch logs for Lambda and API Gateway
- X-Ray tracing enabled
- Structured logging with appropriate log levels
- Detailed API Gateway access logs

### 🚀 **Performance**
- API Gateway caching (60-second TTL)
- DynamoDB on-demand billing
- Lambda with appropriate memory allocation

### 🏷️ **Governance**
- Consistent tagging (Environment, Project, Owner)
- Resource retention policies for production data
- S3 lifecycle rules for old versions

### 🔄 **Reliability**
- Lambda retry configuration
- DynamoDB point-in-time recovery
- S3 versioning for data protection
- Soft deletes in DynamoDB

This setup provides a solid foundation for a production-ready serverless application that can be easily extended and scaled as needed.