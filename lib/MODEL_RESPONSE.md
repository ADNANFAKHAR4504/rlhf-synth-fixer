### Reasoning Trace
---

The user wants me to create a comprehensive AWS CDK application in Python that sets up a serverless REST API. Let me break down the requirements:

1. **Single stack** CDK app in Python (main.py)
2. **Region**: us-west-2
3. **Components needed**:
   - API Gateway (REST API)
   - Lambda function (handles GET, POST, DELETE)
   - DynamoDB table
   - IAM roles with least privilege
   - CloudWatch logging and monitoring
   - Environment variables for Lambda

4. **Best practices**:
   - Principle of least privilege for IAM
   - Environment variables for configuration
   - Production-grade architecture
   - Proper logging and monitoring

Let me create a complete CDK project structure:

1. The main CDK stack file (main.py)
2. Lambda function code
3. Requirements files
4. CDK app entry point

I'll design this as a simple items/products API where you can:
- GET /items - List all items
- GET /items/{id} - Get a specific item
- POST /items - Create a new item
- DELETE /items/{id} - Delete an item

The DynamoDB table will store these items with an 'id' as the partition key.
### Answer 
---

I'll create a production-ready serverless REST API using AWS CDK with Python. This will include a complete project structure with proper IAM roles, environment variables, and monitoring.

## Project Structure

```
serverless-api-cdk/
├── app.py                  # CDK app entry point
├── main.py                 # Main CDK stack definition
├── lambda/
│   └── handler.py          # Lambda function code
├── requirements.txt        # CDK dependencies
├── requirements-lambda.txt # Lambda dependencies
├── cdk.json               # CDK configuration
└── README.md
```

## Main CDK Stack (main.py)

```python
#!/usr/bin/env python3
import os
from constructs import Construct
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
)


class ServerlessApiStack(Stack):
    """
    Production-grade serverless REST API stack with Lambda, API Gateway, and DynamoDB.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create DynamoDB table with on-demand billing
        items_table = dynamodb.Table(
            self,
            "ItemsTable",
            table_name="serverless-api-items",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test. Use RETAIN for production
            point_in_time_recovery=True,  # Enable PITR for production data protection
            encryption=dynamodb.TableEncryption.AWS_MANAGED,  # Encryption at rest
        )

        # Create CloudWatch Log Group for Lambda with retention policy
        log_group = logs.LogGroup(
            self,
            "ApiLambdaLogGroup",
            log_group_name="/aws/lambda/serverless-api-handler",
            retention=logs.RetentionDays.ONE_WEEK,  # Adjust based on requirements
            removal_policy=RemovalPolicy.DESTROY
        )

        # Create IAM role for Lambda with least privilege principle
        lambda_role = iam.Role(
            self,
            "ApiLambdaRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Role for Serverless API Lambda function",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )

        # Add specific DynamoDB permissions (least privilege)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:UpdateItem"
                ],
                resources=[items_table.table_arn]
            )
        )

        # Add CloudWatch Logs permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=[log_group.log_group_arn]
            )
        )

        # Create Lambda function
        api_handler = lambda_.Function(
            self,
            "ApiHandler",
            function_name="serverless-api-handler",
            runtime=lambda_.Runtime.PYTHON_3_11,
            code=lambda_.Code.from_asset("lambda"),
            handler="handler.lambda_handler",
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "TABLE_NAME": items_table.table_name,
                "REGION": "us-west-2",
                "LOG_LEVEL": "INFO",
                "ENVIRONMENT": "production"
            },
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray tracing
            retry_attempts=2,
            description="Handles REST API requests for serverless application"
        )

        # Create API Gateway REST API
        api = apigateway.RestApi(
            self,
            "ServerlessApi",
            rest_api_name="serverless-rest-api",
            description="Production-grade serverless REST API",
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                throttling_rate_limit=1000,
                throttling_burst_limit=2000
            ),
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            )
        )

        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            api_handler,
            request_templates={"application/json": '{ "statusCode": "200" }'}
        )

        # Define API resources and methods
        items_resource = api.root.add_resource("items")
        
        # GET /items - List all items
        items_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Content-Type": True
                    }
                )
            ]
        )

        # POST /items - Create new item
        items_resource.add_method(
            "POST",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(status_code="201"),
                apigateway.MethodResponse(status_code="400")
            ]
        )

        # Single item resource
        item_resource = items_resource.add_resource("{id}")
        
        # GET /items/{id} - Get specific item
        item_resource.add_method(
            "GET",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(status_code="200"),
                apigateway.MethodResponse(status_code="404")
            ]
        )

        # DELETE /items/{id} - Delete item
        item_resource.add_method(
            "DELETE",
            lambda_integration,
            method_responses=[
                apigateway.MethodResponse(status_code="204"),
                apigateway.MethodResponse(status_code="404")
            ]
        )

        # Add CloudWatch alarms for monitoring
        lambda_errors_alarm = api_handler.metric_errors().create_alarm(
            self,
            "LambdaErrorsAlarm",
            threshold=5,
            evaluation_periods=2,
            alarm_description="Alert when Lambda function errors exceed threshold"
        )

        lambda_throttles_alarm = api_handler.metric_throttles().create_alarm(
            self,
            "LambdaThrottlesAlarm",
            threshold=10,
            evaluation_periods=1,
            alarm_description="Alert when Lambda function is throttled"
        )

        # Output important values
        CfnOutput(
            self,
            "ApiEndpoint",
            value=api.url,
            description="API Gateway endpoint URL"
        )

        CfnOutput(
            self,
            "TableName",
            value=items_table.table_name,
            description="DynamoDB table name"
        )

        CfnOutput(
            self,
            "LambdaFunctionName",
            value=api_handler.function_name,
            description="Lambda function name"
        )

        CfnOutput(
            self,
            "LambdaRoleArn",
            value=lambda_role.role_arn,
            description="Lambda execution role ARN"
        )
```

## Lambda Function (lambda/handler.py)

```python
#!/usr/bin/env python3
import json
import os
import uuid
import logging
from datetime import datetime
from decimal import Decimal
import boto3
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb', region_name=os.environ.get('REGION', 'us-west-2'))
table_name = os.environ.get('TABLE_NAME', 'serverless-api-items')
table = dynamodb.Table(table_name)


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal types to JSON"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def create_response(status_code, body, headers=None):
    """Create standardized API response"""
    response = {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,DELETE,OPTIONS'
        },
        'body': json.dumps(body, cls=DecimalEncoder)
    }
    
    if headers:
        response['headers'].update(headers)
    
    return response


def get_all_items():
    """Retrieve all items from DynamoDB"""
    try:
        response = table.scan()
        items = response.get('Items', [])
        
        # Handle pagination if needed
        while 'LastEvaluatedKey' in response:
            response = table.scan(ExclusiveStartKey=response['LastEvaluatedKey'])
            items.extend(response.get('Items', []))
        
        logger.info(f"Retrieved {len(items)} items")
        return create_response(200, {'items': items, 'count': len(items)})
    
    except ClientError as e:
        logger.error(f"Error retrieving items: {str(e)}")
        return create_response(500, {'error': 'Failed to retrieve items'})


def get_item(item_id):
    """Retrieve a specific item by ID"""
    try:
        response = table.get_item(Key={'id': item_id})
        
        if 'Item' in response:
            logger.info(f"Retrieved item: {item_id}")
            return create_response(200, response['Item'])
        else:
            logger.warning(f"Item not found: {item_id}")
            return create_response(404, {'error': f'Item {item_id} not found'})
    
    except ClientError as e:
        logger.error(f"Error retrieving item {item_id}: {str(e)}")
        return create_response(500, {'error': 'Failed to retrieve item'})


def create_item(body):
    """Create a new item in DynamoDB"""
    try:
        # Validate request body
        if not body:
            return create_response(400, {'error': 'Request body is required'})
        
        item_data = json.loads(body) if isinstance(body, str) else body
        
        # Generate unique ID if not provided
        if 'id' not in item_data:
            item_data['id'] = str(uuid.uuid4())
        
        # Add metadata
        item_data['created_at'] = datetime.utcnow().isoformat()
        item_data['updated_at'] = datetime.utcnow().isoformat()
        
        # Store in DynamoDB
        table.put_item(Item=item_data)
        
        logger.info(f"Created item: {item_data['id']}")
        return create_response(201, item_data)
    
    except json.JSONDecodeError:
        logger.error("Invalid JSON in request body")
        return create_response(400, {'error': 'Invalid JSON format'})
    except ClientError as e:
        logger.error(f"Error creating item: {str(e)}")
        return create_response(500, {'error': 'Failed to create item'})


def delete_item(item_id):
    """Delete an item from DynamoDB"""
    try:
        # Check if item exists first
        response = table.get_item(Key={'id': item_id})
        
        if 'Item' not in response:
            logger.warning(f"Item not found for deletion: {item_id}")
            return create_response(404, {'error': f'Item {item_id} not found'})
        
        # Delete the item
        table.delete_item(Key={'id': item_id})
        
        logger.info(f"Deleted item: {item_id}")
        return create_response(204, None)
    
    except ClientError as e:
        logger.error(f"Error deleting item {item_id}: {str(e)}")
        return create_response(500, {'error': 'Failed to delete item'})


def lambda_handler(event, context):
    """Main Lambda handler function"""
    
    # Log the incoming event for debugging
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Extract HTTP method and path
    http_method = event.get('httpMethod', '').upper()
    path = event.get('path', '')
    path_parameters = event.get('pathParameters', {})
    body = event.get('body', '')
    
    try:
        # Route to appropriate handler based on method and path
        if path == '/items':
            if http_method == 'GET':
                return get_all_items()
            elif http_method == 'POST':
                return create_item(body)
            else:
                return create_response(405, {'error': 'Method not allowed'})
        
        elif path.startswith('/items/') and path_parameters:
            item_id = path_parameters.get('id')
            
            if not item_id:
                return create_response(400, {'error': 'Item ID is required'})
            
            if http_method == 'GET':
                return get_item(item_id)
            elif http_method == 'DELETE':
                return delete_item(item_id)
            else:
                return create_response(405, {'error': 'Method not allowed'})
        
        else:
            return create_response(404, {'error': 'Resource not found'})
    
    except Exception as e:
        logger.error(f"Unexpected error: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})
```

## CDK App Entry Point (app.py)

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from main import ServerlessApiStack

# Set AWS environment
env = cdk.Environment(
    account=os.environ.get("CDK_DEFAULT_ACCOUNT"),
    region="us-west-2"
)

app = cdk.App()

# Create the serverless API stack
ServerlessApiStack(
    app,
    "ServerlessApiStack",
    env=env,
    description="Production-grade serverless REST API with Lambda, API Gateway, and DynamoDB",
    tags={
        "Project": "ServerlessAPI",
        "Environment": "Production",
        "ManagedBy": "CDK"
    }
)

app.synth()
```

## Requirements Files

**requirements.txt** (CDK dependencies):
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

**requirements-lambda.txt** (Lambda dependencies):
```txt
boto3>=1.26.0
```

## CDK Configuration (cdk.json)

```json
{
  "app": "python3 app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "**/__pycache__",
      ".git"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:enableStackNameDuplicates": false,
    "aws-cdk:enableDiffNoFail": true,
    "@aws-cdk/aws-ecr-assets:dockerIgnoreSupport": true,
    "@aws-cdk/aws-secretsmanager:parseOwnedSecretName": true,
    "@aws-cdk/aws-kms:defaultKeyPolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true
  }
}
```

## Deployment Script (deploy.sh)

```bash
#!/bin/bash
set -e

echo "🚀 Deploying Serverless API Stack..."

# Install dependencies
echo "📦 Installing CDK dependencies..."
pip install -r requirements.txt

# Install Lambda dependencies
echo "📦 Installing Lambda dependencies..."
pip install -r requirements-lambda.txt -t lambda/

# Bootstrap CDK (if needed)
echo "🔧 Bootstrapping CDK..."
cdk bootstrap aws://unknown-account/us-west-2

# Synthesize the stack
echo "🔨 Synthesizing CloudFormation template..."
cdk synth

# Deploy the stack
echo "🚢 Deploying to AWS..."
cdk deploy --require-approval never

echo "✅ Deployment complete!"
```

## Testing Script (test_api.py)

```python
#!/usr/bin/env python3
"""
Simple integration test script for the deployed API
"""
import requests
import json
import sys
import time

def test_api(api_endpoint):
    """Test the deployed API endpoints"""
    
    print(f"Testing API at: {api_endpoint}")
    
    # Test 1: Create an item
    print("\n1. Testing POST /items...")
    create_response = requests.post(
        f"{api_endpoint}/items",
        json={
            "name": "Test Item",
            "description": "This is a test item",
            "price": 29.99,
            "category": "test"
        }
    )
    
    if create_response.status_code == 201:
        print("✅ Item created successfully")
        item_id = create_response.json().get('id')
        print(f"   Item ID: {item_id}")
    else:
        print(f"❌ Failed to create item: {create_response.text}")
        return False
    
    # Test 2: Get all items
    print("\n2. Testing GET /items...")
    list_response = requests.get(f"{api_endpoint}/items")
    
    if list_response.status_code == 200:
        items = list_response.json().get('items', [])
        print(f"✅ Retrieved {len(items)} items")
    else:
        print(f"❌ Failed to list items: {list_response.text}")
        return False
    
    # Test 3: Get specific item
    print(f"\n3. Testing GET /items/{item_id}...")
    get_response = requests.get(f"{api_endpoint}/items/{item_id}")
    
    if get_response.status_code == 200:
        print("✅ Item retrieved successfully")
        print(f"   Item: {json.dumps(get_response.json(), indent=2)}")
    else:
        print(f"❌ Failed to get item: {get_response.text}")
        return False
    
    # Test 4: Delete item
    print(f"\n4. Testing DELETE /items/{item_id}...")
    delete_response = requests.delete(f"{api_endpoint}/items/{item_id}")
    
    if delete_response.status_code == 204:
        print("✅ Item deleted successfully")
    else:
        print(f"❌ Failed to delete item: {delete_response.text}")
        return False
    
    # Test 5: Verify deletion
    print(f"\n5. Verifying item deletion...")
    verify_response = requests.get(f"{api_endpoint}/items/{item_id}")
    
    if verify_response.status_code == 404:
        print("✅ Item confirmed deleted")
    else:
        print(f"❌ Item still exists after deletion")
        return False
    
    print("\n🎉 All tests passed!")
    return True

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python test_api.py <api_endpoint>")
        sys.exit(1)
    
    api_endpoint = sys.argv[1].rstrip('/')
    success = test_api(api_endpoint)
    sys.exit(0 if success else 1)
```

## README.md

```markdown
# Serverless REST API with AWS CDK

A production-grade serverless REST API built with AWS CDK, Lambda, API Gateway, and DynamoDB.

## Architecture

- **API Gateway**: REST API with CORS enabled
- **Lambda Function**: Python 3.11 handler with environment variables
- **DynamoDB**: On-demand billing table for data persistence
- **IAM**: Least privilege roles and policies
- **CloudWatch**: Comprehensive logging and monitoring

## Prerequisites

- Python 3.8+
- AWS CLI configured with credentials
- AWS CDK CLI (`npm install -g aws-cdk`)

## Installation

1. Clone the repository
2. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

## Deployment

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Synthesize CloudFormation template
cdk synth

# Deploy the stack
cdk deploy
```

## API Endpoints

- `GET /items` - List all items
- `POST /items` - Create a new item
- `GET /items/{id}` - Get a specific item
- `DELETE /items/{id}` - Delete an item

## Testing

After deployment, test the API:

```bash
# Get the API endpoint from stack outputs
API_ENDPOINT=$(aws cloudformation describe-stacks \
  --stack-name ServerlessApiStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Run integration tests
python test_api.py $API_ENDPOINT
```

## Monitoring

- CloudWatch Logs: `/aws/lambda/serverless-api-handler`
- X-Ray traces enabled for distributed tracing
- CloudWatch alarms for errors and throttles

## Clean Up

```bash
cdk destroy
```

## Security Features

- Least privilege IAM policies
- Encrypted DynamoDB table
- API throttling enabled
- CORS configured
- Environment variables for sensitive data
```

## Deployment Commands

To deploy this stack:

```bash
# 1. Create and activate virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt

# 3. Bootstrap CDK (first time only)
cdk bootstrap aws://YOUR_ACCOUNT_ID/us-west-2

# 4. Synthesize and review the CloudFormation template
cdk synth

# 5. Deploy the stack
cdk deploy

# 6. Test the deployed API
python test_api.py <API_ENDPOINT_FROM_OUTPUT>
```

This complete solution provides:

1. **Production-grade architecture** with proper error handling, logging, and monitoring
2. **Least privilege IAM** policies for Lambda execution
3. **Environment variables** for configuration management
4. **CloudWatch integration** for comprehensive logging and alarms
5. **API Gateway** with throttling, CORS, and proper method responses
6. **DynamoDB** with on-demand billing and encryption
7. **Testing utilities** to validate the deployment
8. **Clean code structure** with proper separation of concerns

The stack is fully automated through CloudFormation and ready for production deployment with proper security, monitoring, and scalability features built in.