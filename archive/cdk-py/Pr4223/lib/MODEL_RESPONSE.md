### Reasoning Trace
---

The user wants a complete serverless web application using AWS CDK in Python. Let me break down the requirements:

1. Single Python CDK stack (main.py)
2. AWS Lambda for backend logic
3. API Gateway for HTTP endpoints
4. DynamoDB for data storage with auto-scaling
5. CloudWatch Logs for monitoring
6. S3 bucket for static content
7. Production-ready but simple
8. Should deploy cleanly without manual tweaks

I'll create a comprehensive CDK application that includes:
- A DynamoDB table with auto-scaling
- Lambda functions for CRUD operations
- API Gateway REST API
- S3 bucket for static content
- Proper IAM roles and permissions
- CloudWatch logging
- Lambda function code inline for simplicity

I'll make this a practical example - maybe a simple item management system (like a todo list or product catalog) to demonstrate real functionality.
### Answer 
---

I'll create a complete serverless web application using AWS CDK in Python. This will be a production-ready item management system with CRUD operations, demonstrating all the components you requested.

## Complete Serverless Application Stack

```python
# main.py
import json
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_s3 as s3,
    aws_logs as logs,
    aws_iam as iam,
)
from constructs import Construct


class ServerlessWebAppStack(Stack):
    """
    A complete serverless web application stack with:
    - API Gateway for HTTP endpoints
    - Lambda functions for backend logic
    - DynamoDB for data storage with auto-scaling
    - S3 bucket for static content
    - CloudWatch Logs for monitoring
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ==================== S3 BUCKET FOR STATIC CONTENT ====================
        # Create S3 bucket for storing static assets (HTML, images, config files)
        static_content_bucket = s3.Bucket(
            self, "StaticContentBucket",
            bucket_name=f"serverless-app-static-{self.account}-{self.region}",
            versioned=True,  # Enable versioning for production
            encryption=s3.BucketEncryption.S3_MANAGED,  # Server-side encryption
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,  # Secure by default
            removal_policy=RemovalPolicy.RETAIN,  # Retain bucket on stack deletion
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    noncurrent_version_expiration=Duration.days(30),
                    abort_incomplete_multipart_upload_after=Duration.days(7)
                )
            ],
            cors=[
                s3.CorsRule(
                    allowed_methods=[
                        s3.HttpMethods.GET,
                        s3.HttpMethods.PUT,
                        s3.HttpMethods.POST,
                        s3.HttpMethods.DELETE,
                        s3.HttpMethods.HEAD
                    ],
                    allowed_origins=["*"],  # Configure with your domain in production
                    allowed_headers=["*"],
                    max_age=3000
                )
            ]
        )

        # ==================== DYNAMODB TABLE ====================
        # Create DynamoDB table for storing application data
        items_table = dynamodb.Table(
            self, "ItemsTable",
            table_name="ServerlessAppItems",
            partition_key=dynamodb.Attribute(
                name="item_id",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,  # Base read capacity for development
            write_capacity=5,  # Base write capacity for development
            removal_policy=RemovalPolicy.RETAIN,
            point_in_time_recovery=True,  # Enable point-in-time recovery
            encryption=dynamodb.TableEncryption.AWS_MANAGED,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES  # Enable DynamoDB Streams
        )

        # Configure auto-scaling for DynamoDB
        read_scaling = items_table.auto_scale_read_capacity(
            min_capacity=5,
            max_capacity=100
        )
        read_scaling.scale_on_utilization(
            target_utilization_percent=70
        )

        write_scaling = items_table.auto_scale_write_capacity(
            min_capacity=5,
            max_capacity=100
        )
        write_scaling.scale_on_utilization(
            target_utilization_percent=70
        )

        # Add Global Secondary Index for querying by status
        items_table.add_global_secondary_index(
            index_name="StatusIndex",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            ),
            read_capacity=5,
            write_capacity=5,
            projection_type=dynamodb.ProjectionType.ALL
        )

        # ==================== CLOUDWATCH LOG GROUPS ====================
        # Create CloudWatch Log Group for Lambda functions
        lambda_log_group = logs.LogGroup(
            self, "LambdaLogGroup",
            log_group_name="/aws/lambda/serverless-app",
            retention=logs.RetentionDays.ONE_WEEK,  # Adjust based on requirements
            removal_policy=RemovalPolicy.DESTROY
        )

        # ==================== IAM ROLE FOR LAMBDA ====================
        # Create IAM role for Lambda functions with necessary permissions
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole")
            ],
            inline_policies={
                "DynamoDBAccess": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "dynamodb:GetItem",
                                "dynamodb:PutItem",
                                "dynamodb:UpdateItem",
                                "dynamodb:DeleteItem",
                                "dynamodb:Query",
                                "dynamodb:Scan",
                                "dynamodb:DescribeTable"
                            ],
                            resources=[
                                items_table.table_arn,
                                f"{items_table.table_arn}/index/*"
                            ]
                        )
                    ]
                ),
                "S3Access": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "s3:GetObject",
                                "s3:PutObject",
                                "s3:DeleteObject",
                                "s3:ListBucket"
                            ],
                            resources=[
                                static_content_bucket.bucket_arn,
                                f"{static_content_bucket.bucket_arn}/*"
                            ]
                        )
                    ]
                ),
                "CloudWatchLogs": iam.PolicyDocument(
                    statements=[
                        iam.PolicyStatement(
                            effect=iam.Effect.ALLOW,
                            actions=[
                                "logs:CreateLogStream",
                                "logs:PutLogEvents"
                            ],
                            resources=[f"{lambda_log_group.log_group_arn}:*"]
                        )
                    ]
                )
            }
        )

        # ==================== LAMBDA FUNCTIONS ====================
        # Lambda function code for CRUD operations
        lambda_code = """
import json
import boto3
import os
import uuid
from datetime import datetime
from decimal import Decimal

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')

# Environment variables
TABLE_NAME = os.environ['TABLE_NAME']
BUCKET_NAME = os.environ['BUCKET_NAME']

# Helper function to convert Decimal to float for JSON serialization
def decimal_to_float(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def lambda_handler(event, context):
    print(f"Received event: {json.dumps(event)}")
    
    # Get the HTTP method and path
    http_method = event.get('httpMethod', 'GET')
    path = event.get('path', '/')
    path_parameters = event.get('pathParameters', {})
    query_parameters = event.get('queryStringParameters', {})
    
    # Initialize response
    response = {
        'statusCode': 200,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type'
        }
    }
    
    try:
        table = dynamodb.Table(TABLE_NAME)
        
        # Handle different HTTP methods
        if http_method == 'GET':
            if path_parameters and 'id' in path_parameters:
                # Get specific item
                item_id = path_parameters['id']
                result = table.query(
                    KeyConditionExpression='item_id = :id',
                    ExpressionAttributeValues={':id': item_id},
                    Limit=1
                )
                items = result.get('Items', [])
                if items:
                    response['body'] = json.dumps(items[0], default=decimal_to_float)
                else:
                    response['statusCode'] = 404
                    response['body'] = json.dumps({'error': 'Item not found'})
            else:
                # Get all items (with pagination support)
                limit = int(query_parameters.get('limit', 20))
                last_evaluated_key = query_parameters.get('lastKey')
                
                scan_params = {'Limit': limit}
                if last_evaluated_key:
                    scan_params['ExclusiveStartKey'] = json.loads(last_evaluated_key)
                
                result = table.scan(**scan_params)
                
                response_data = {
                    'items': result.get('Items', []),
                    'count': result.get('Count', 0)
                }
                
                if 'LastEvaluatedKey' in result:
                    response_data['lastKey'] = result['LastEvaluatedKey']
                
                response['body'] = json.dumps(response_data, default=decimal_to_float)
        
        elif http_method == 'POST':
            # Create new item
            body = json.loads(event.get('body', '{}'))
            item_id = str(uuid.uuid4())
            created_at = datetime.utcnow().isoformat()
            
            item = {
                'item_id': item_id,
                'created_at': created_at,
                'status': body.get('status', 'pending'),
                'name': body.get('name', 'Unnamed Item'),
                'description': body.get('description', ''),
                'metadata': body.get('metadata', {}),
                'updated_at': created_at
            }
            
            table.put_item(Item=item)
            
            response['statusCode'] = 201
            response['body'] = json.dumps(item, default=decimal_to_float)
        
        elif http_method == 'PUT':
            # Update existing item
            if not path_parameters or 'id' not in path_parameters:
                response['statusCode'] = 400
                response['body'] = json.dumps({'error': 'Item ID required'})
            else:
                item_id = path_parameters['id']
                body = json.loads(event.get('body', '{}'))
                updated_at = datetime.utcnow().isoformat()
                
                # Build update expression dynamically
                update_expression = "SET updated_at = :updated_at"
                expression_values = {':updated_at': updated_at}
                
                if 'name' in body:
                    update_expression += ", #n = :name"
                    expression_values[':name'] = body['name']
                
                if 'description' in body:
                    update_expression += ", description = :description"
                    expression_values[':description'] = body['description']
                
                if 'status' in body:
                    update_expression += ", #s = :status"
                    expression_values[':status'] = body['status']
                
                if 'metadata' in body:
                    update_expression += ", metadata = :metadata"
                    expression_values[':metadata'] = body['metadata']
                
                # Get created_at for the sort key (simplified - in production, pass this from client)
                query_result = table.query(
                    KeyConditionExpression='item_id = :id',
                    ExpressionAttributeValues={':id': item_id},
                    Limit=1
                )
                
                if not query_result['Items']:
                    response['statusCode'] = 404
                    response['body'] = json.dumps({'error': 'Item not found'})
                else:
                    created_at = query_result['Items'][0]['created_at']
                    
                    result = table.update_item(
                        Key={'item_id': item_id, 'created_at': created_at},
                        UpdateExpression=update_expression,
                        ExpressionAttributeValues=expression_values,
                        ExpressionAttributeNames={'#n': 'name', '#s': 'status'},
                        ReturnValues='ALL_NEW'
                    )
                    
                    response['body'] = json.dumps(result['Attributes'], default=decimal_to_float)
        
        elif http_method == 'DELETE':
            # Delete item
            if not path_parameters or 'id' not in path_parameters:
                response['statusCode'] = 400
                response['body'] = json.dumps({'error': 'Item ID required'})
            else:
                item_id = path_parameters['id']
                
                # Get created_at for the sort key
                query_result = table.query(
                    KeyConditionExpression='item_id = :id',
                    ExpressionAttributeValues={':id': item_id},
                    Limit=1
                )
                
                if not query_result['Items']:
                    response['statusCode'] = 404
                    response['body'] = json.dumps({'error': 'Item not found'})
                else:
                    created_at = query_result['Items'][0]['created_at']
                    
                    table.delete_item(
                        Key={'item_id': item_id, 'created_at': created_at}
                    )
                    
                    response['statusCode'] = 204
                    response['body'] = json.dumps({'message': 'Item deleted successfully'})
        
        elif http_method == 'OPTIONS':
            # Handle preflight requests
            response['body'] = json.dumps({'message': 'CORS preflight successful'})
        
        else:
            response['statusCode'] = 405
            response['body'] = json.dumps({'error': 'Method not allowed'})
    
    except Exception as e:
        print(f"Error: {str(e)}")
        response['statusCode'] = 500
        response['body'] = json.dumps({'error': str(e)})
    
    return response
"""

        # Create Lambda function for API operations
        api_lambda = lambda_.Function(
            self, "ApiLambdaFunction",
            function_name="serverless-app-api",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_inline(lambda_code),
            handler="index.lambda_handler",
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TABLE_NAME": items_table.table_name,
                "BUCKET_NAME": static_content_bucket.bucket_name,
                "LOG_LEVEL": "INFO"
            },
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            retry_attempts=2,
            log_group=lambda_log_group
        )

        # ==================== API GATEWAY ====================
        # Create REST API
        api = apigateway.RestApi(
            self, "ServerlessWebApi",
            rest_api_name="serverless-web-api",
            description="Serverless Web Application API",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_burst_limit=100,
                throttling_rate_limit=50,
                metrics_enabled=True,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                tracing_enabled=True
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=["*"],  # Configure with specific domains in production
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"],
                max_age=Duration.seconds(300)
            )
        )

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            api_lambda,
            request_templates={
                "application/json": '{"statusCode": 200}'
            }
        )

        # Add API endpoints
        # Root endpoint
        api.root.add_method("GET", lambda_integration)
        api.root.add_method("POST", lambda_integration)
        
        # Items resource
        items = api.root.add_resource("items")
        items.add_method("GET", lambda_integration)
        items.add_method("POST", lambda_integration)
        
        # Individual item resource
        item = items.add_resource("{id}")
        item.add_method("GET", lambda_integration)
        item.add_method("PUT", lambda_integration)
        item.add_method("DELETE", lambda_integration)

        # Health check endpoint
        health = api.root.add_resource("health")
        health_lambda_code = """
import json
import boto3
import os

def lambda_handler(event, context):
    dynamodb = boto3.client('dynamodb')
    s3 = boto3.client('s3')
    
    health_status = {
        'status': 'healthy',
        'timestamp': context.aws_request_id,
        'services': {}
    }
    
    # Check DynamoDB
    try:
        dynamodb.describe_table(TableName=os.environ['TABLE_NAME'])
        health_status['services']['dynamodb'] = 'healthy'
    except Exception as e:
        health_status['services']['dynamodb'] = 'unhealthy'
        health_status['status'] = 'unhealthy'
    
    # Check S3
    try:
        s3.head_bucket(Bucket=os.environ['BUCKET_NAME'])
        health_status['services']['s3'] = 'healthy'
    except Exception as e:
        health_status['services']['s3'] = 'unhealthy'
        health_status['status'] = 'unhealthy'
    
    return {
        'statusCode': 200 if health_status['status'] == 'healthy' else 503,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        'body': json.dumps(health_status)
    }
"""

        health_lambda = lambda_.Function(
            self, "HealthCheckLambda",
            function_name="serverless-app-health",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_inline(health_lambda_code),
            handler="index.lambda_handler",
            role=lambda_role,
            timeout=Duration.seconds(5),
            memory_size=128,
            environment={
                "TABLE_NAME": items_table.table_name,
                "BUCKET_NAME": static_content_bucket.bucket_name
            }
        )
        
        health_integration = apigateway.LambdaIntegration(health_lambda)
        health.add_method("GET", health_integration)

        # ==================== OUTPUTS ====================
        # Stack outputs for reference
        CfnOutput(
            self, "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL"
        )
        
        CfnOutput(
            self, "BucketName",
            value=static_content_bucket.bucket_name,
            description="S3 bucket name for static content"
        )
        
        CfnOutput(
            self, "TableName",
            value=items_table.table_name,
            description="DynamoDB table name"
        )
        
        CfnOutput(
            self, "LambdaFunctionName",
            value=api_lambda.function_name,
            description="Main Lambda function name"
        )
        
        CfnOutput(
            self, "LogGroupName",
            value=lambda_log_group.log_group_name,
            description="CloudWatch Log Group name"
        )


# ==================== CDK APP ENTRY POINT ====================
from aws_cdk import App

app = App()
ServerlessWebAppStack(app, "ServerlessWebAppStack",
    env={
        'region': 'us-east-1'  # Change to your preferred region
    }
)

app.synth()
```

## Setup and Deployment Instructions

### Prerequisites

```bash
# Install AWS CDK CLI
npm install -g aws-cdk

# Install Python dependencies
pip install aws-cdk-lib constructs
```

### Project Structure

```
serverless-app/
├── main.py          # The CDK stack code above
├── cdk.json         # CDK configuration file
└── requirements.txt # Python dependencies
```

### Create `cdk.json`:

```json
{
  "app": "python main.py",
  "watch": {
    "include": ["**"],
    "exclude": ["cdk.out"]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-rds:lowercaseDbIdentifier": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true
  }
}
```

### Create `requirements.txt`:

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### Deploy the Stack

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Deploy the stack
cdk deploy

# Optional: View the synthesized CloudFormation template
cdk synth
```

## Key Features

### 1. **DynamoDB with Auto-scaling**
- Provisioned capacity with auto-scaling (5-100 units)
- Global Secondary Index for querying by status
- Point-in-time recovery enabled
- DynamoDB Streams for real-time data processing

### 2. **Lambda Functions**
- Main API handler with CRUD operations
- Health check endpoint
- X-Ray tracing enabled
- Automatic retry configuration

### 3. **API Gateway**
- RESTful API with proper HTTP methods
- CORS configuration
- Request throttling (50 requests/sec, 100 burst)
- CloudWatch logging and metrics

### 4. **S3 Bucket**
- Versioning enabled
- Server-side encryption
- Lifecycle rules for old versions
- CORS configuration for web access

### 5. **Monitoring & Logging**
- CloudWatch Log Groups with retention policies
- Lambda function metrics
- API Gateway access logs
- X-Ray tracing for performance analysis

## API Endpoints

After deployment, you'll have these endpoints available:

- `GET /items` - List all items
- `POST /items` - Create a new item
- `GET /items/{id}` - Get specific item
- `PUT /items/{id}` - Update an item
- `DELETE /items/{id}` - Delete an item
- `GET /health` - Health check endpoint

## Testing the API

```bash
# Get the API endpoint from stack outputs
API_URL="https://your-api-id.execute-api.us-east-1.amazonaws.com/prod"

# Create an item
curl -X POST $API_URL/items \
  -H "Content-Type: application/json" \
  -d '{"name": "Test Item", "description": "This is a test", "status": "active"}'

# List all items
curl $API_URL/items

# Get health status
curl $API_URL/health
```

## Production Considerations

1. **Security**: Update CORS origins to specific domains
2. **Monitoring**: Set up CloudWatch alarms for errors and throttling
3. **Backup**: Configure DynamoDB backups
4. **Cost**: Monitor usage and adjust capacity/retention as needed
5. **API Keys**: Consider adding API key authentication for public endpoints

This complete serverless stack provides a robust foundation for web applications with automatic scaling, comprehensive logging, and production-ready configurations.