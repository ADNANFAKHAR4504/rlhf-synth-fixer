### Reasoning Trace
---

The user wants me to create a complete AWS CDK setup in Python that includes:

1. A single stack (main.py)
2. Lambda function with Python 3 runtime
3. API Gateway REST endpoint that triggers the Lambda
4. DynamoDB table with primary key and provisioned throughput (5 read, 5 write)
5. CloudWatch Logs for monitoring
6. CORS support on API Gateway
7. Proper IAM roles and policies
8. Tagging with Environment: EnvironmentSuffix
9. Deployment in us-west-2
10. CloudFormation stack description
11. Output Lambda ARN and API Gateway URL

I need to structure this as a complete CDK application with:
- requirements.txt
- app.py (entry point)
- main.py (the main stack)
- lambda function code
- Proper imports and configurations

Let me break this down:

1. app.py - CDK app entry point
2. main.py - Main stack with all resources
3. lambda_function.py - Lambda function code
4. requirements.txt - Dependencies

Key components in the stack:
- DynamoDB table
- Lambda function
- API Gateway
- IAM roles
- CloudWatch logs
- Outputs
### Answer 
---

I'll help you create a complete serverless infrastructure using AWS CDK with Python. Here's the complete setup:

## Project Structure

```
serverless-app/
├── app.py
├── main.py
├── lambda_function.py
├── requirements.txt
└── README.md
```

## 1. requirements.txt

```txt
aws-cdk-lib>=2.80.0
constructs>=10.0.0
boto3>=1.26.0
```

## 2. app.py (CDK Application Entry Point)

```python
#!/usr/bin/env python3
import aws_cdk as cdk
from main import ServerlessStack

app = cdk.App()

# Get environment suffix from context or default to 'dev'
environment_suffix = app.node.try_get_context("environment") or "dev"

ServerlessStack(
    app, 
    "ServerlessStack",
    env=cdk.Environment(region="us-west-2"),
    environment_suffix=environment_suffix,
    description="Serverless infrastructure with Lambda, API Gateway, and DynamoDB for data processing and storage"
)

app.synth()
```

## 3. main.py (Main CDK Stack)

```python
from aws_cdk import (
    Stack,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
    CfnOutput,
    Duration,
    RemovalPolicy,
    Tags
)
from constructs import Construct


class ServerlessStack(Stack):
    def __init__(self, scope: Construct, construct_id: str, environment_suffix: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        # Apply tags to all resources in the stack
        Tags.of(self).add("Environment", environment_suffix)
        
        # Create DynamoDB table
        self.dynamodb_table = self._create_dynamodb_table(environment_suffix)
        
        # Create Lambda execution role
        self.lambda_role = self._create_lambda_role()
        
        # Create Lambda function
        self.lambda_function = self._create_lambda_function(environment_suffix)
        
        # Create API Gateway
        self.api_gateway = self._create_api_gateway(environment_suffix)
        
        # Create CloudWatch Log Group
        self.log_group = self._create_log_group(environment_suffix)
        
        # Create outputs
        self._create_outputs()
    
    def _create_dynamodb_table(self, environment_suffix: str) -> dynamodb.Table:
        """Create DynamoDB table with provisioned throughput"""
        table = dynamodb.Table(
            self, "DataTable",
            table_name=f"serverless-data-table-{environment_suffix}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PROVISIONED,
            read_capacity=5,
            write_capacity=5,
            removal_policy=RemovalPolicy.DESTROY,  # For dev/test environments
            point_in_time_recovery=True
        )
        
        return table
    
    def _create_lambda_role(self) -> iam.Role:
        """Create IAM role for Lambda with necessary permissions"""
        role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )
        
        # Add DynamoDB permissions
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:Query",
                    "dynamodb:Scan",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem"
                ],
                resources=[self.dynamodb_table.table_arn]
            )
        )
        
        # Add CloudWatch Logs permissions (explicit)
        role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=["*"]
            )
        )
        
        return role
    
    def _create_lambda_function(self, environment_suffix: str) -> _lambda.Function:
        """Create Lambda function"""
        lambda_function = _lambda.Function(
            self, "DataProcessorFunction",
            function_name=f"serverless-data-processor-{environment_suffix}",
            runtime=_lambda.Runtime.PYTHON_3_9,
            handler="lambda_function.lambda_handler",
            code=_lambda.Code.from_asset("./"),  # Code is in the same directory
            role=self.lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "DYNAMODB_TABLE_NAME": self.dynamodb_table.table_name,
                "ENVIRONMENT": environment_suffix
            },
            description="Lambda function for processing and storing data in DynamoDB"
        )
        
        return lambda_function
    
    def _create_api_gateway(self, environment_suffix: str) -> apigateway.RestApi:
        """Create API Gateway with CORS support"""
        api = apigateway.RestApi(
            self, "DataProcessorApi",
            rest_api_name=f"serverless-data-api-{environment_suffix}",
            description="API Gateway for serverless data processing application",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=apigateway.Cors.ALL_METHODS,
                allow_headers=["Content-Type", "X-Amz-Date", "Authorization", "X-Api-Key"]
            ),
            endpoint_configuration=apigateway.EndpointConfiguration(
                types=[apigateway.EndpointType.REGIONAL]
            )
        )
        
        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            request_templates={"application/json": '{ "statusCode": "200" }'},
            proxy=True
        )
        
        # Create API Gateway resources and methods
        # POST /data - Create/Update data
        data_resource = api.root.add_resource("data")
        data_resource.add_method("POST", lambda_integration)
        data_resource.add_method("GET", lambda_integration)
        
        # GET /data/{id} - Get specific data
        data_id_resource = data_resource.add_resource("{id}")
        data_id_resource.add_method("GET", lambda_integration)
        data_id_resource.add_method("PUT", lambda_integration)
        data_id_resource.add_method("DELETE", lambda_integration)
        
        return api
    
    def _create_log_group(self, environment_suffix: str) -> logs.LogGroup:
        """Create CloudWatch Log Group for Lambda function"""
        log_group = logs.LogGroup(
            self, "LambdaLogGroup",
            log_group_name=f"/aws/lambda/serverless-data-processor-{environment_suffix}",
            retention=logs.RetentionDays.TWO_WEEKS,
            removal_policy=RemovalPolicy.DESTROY
        )
        
        return log_group
    
    def _create_outputs(self) -> None:
        """Create CloudFormation outputs"""
        CfnOutput(
            self, "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="ARN of the Lambda function",
            export_name=f"LambdaFunctionArn-{self.stack_name}"
        )
        
        CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api_gateway.url,
            description="URL of the API Gateway",
            export_name=f"ApiGatewayUrl-{self.stack_name}"
        )
        
        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="Name of the DynamoDB table",
            export_name=f"DynamoDBTableName-{self.stack_name}"
        )
```

## 4. lambda_function.py (Lambda Function Code)

```python
import json
import boto3
import os
import uuid
from datetime import datetime
from botocore.exceptions import ClientError


# Initialize DynamoDB client
dynamodb = boto3.resource('dynamodb')
table_name = os.environ.get('DYNAMODB_TABLE_NAME')
table = dynamodb.Table(table_name)


def lambda_handler(event, context):
    """
    Lambda function handler for processing API Gateway requests
    """
    try:
        # Log the incoming event
        print(f"Received event: {json.dumps(event)}")
        
        # Extract HTTP method and path
        http_method = event.get('httpMethod', '')
        path = event.get('path', '')
        
        # Handle different HTTP methods
        if http_method == 'POST' and path == '/data':
            return handle_create_data(event, context)
        elif http_method == 'GET' and path == '/data':
            return handle_list_data(event, context)
        elif http_method == 'GET' and '/data/' in path:
            return handle_get_data(event, context)
        elif http_method == 'PUT' and '/data/' in path:
            return handle_update_data(event, context)
        elif http_method == 'DELETE' and '/data/' in path:
            return handle_delete_data(event, context)
        else:
            return create_response(405, {'error': 'Method not allowed'})
            
    except Exception as e:
        print(f"Error: {str(e)}")
        return create_response(500, {'error': 'Internal server error'})


def handle_create_data(event, context):
    """Handle POST /data - Create new data entry"""
    try:
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Generate unique ID if not provided
        item_id = body.get('id', str(uuid.uuid4()))
        
        # Create item
        item = {
            'id': item_id,
            'data': body.get('data', ''),
            'timestamp': datetime.utcnow().isoformat(),
            'source': 'api'
        }
        
        # Save to DynamoDB
        table.put_item(Item=item)
        
        return create_response(201, {
            'message': 'Data created successfully',
            'id': item_id,
            'item': item
        })
        
    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return create_response(500, {'error': 'Failed to create data'})
    except json.JSONDecodeError:
        return create_response(400, {'error': 'Invalid JSON in request body'})


def handle_list_data(event, context):
    """Handle GET /data - List all data entries"""
    try:
        response = table.scan()
        items = response.get('Items', [])
        
        return create_response(200, {
            'message': 'Data retrieved successfully',
            'items': items,
            'count': len(items)
        })
        
    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return create_response(500, {'error': 'Failed to retrieve data'})


def handle_get_data(event, context):
    """Handle GET /data/{id} - Get specific data entry"""
    try:
        # Extract ID from path parameters
        item_id = event.get('pathParameters', {}).get('id')
        
        if not item_id:
            return create_response(400, {'error': 'ID parameter is required'})
        
        # Get item from DynamoDB
        response = table.get_item(Key={'id': item_id})
        
        if 'Item' not in response:
            return create_response(404, {'error': 'Data not found'})
        
        return create_response(200, {
            'message': 'Data retrieved successfully',
            'item': response['Item']
        })
        
    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return create_response(500, {'error': 'Failed to retrieve data'})


def handle_update_data(event, context):
    """Handle PUT /data/{id} - Update specific data entry"""
    try:
        # Extract ID from path parameters
        item_id = event.get('pathParameters', {}).get('id')
        
        if not item_id:
            return create_response(400, {'error': 'ID parameter is required'})
        
        # Parse request body
        body = json.loads(event.get('body', '{}'))
        
        # Update item
        response = table.update_item(
            Key={'id': item_id},
            UpdateExpression='SET #data = :data, #timestamp = :timestamp',
            ExpressionAttributeNames={
                '#data': 'data',
                '#timestamp': 'timestamp'
            },
            ExpressionAttributeValues={
                ':data': body.get('data', ''),
                ':timestamp': datetime.utcnow().isoformat()
            },
            ReturnValues='ALL_NEW'
        )
        
        return create_response(200, {
            'message': 'Data updated successfully',
            'item': response.get('Attributes', {})
        })
        
    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return create_response(500, {'error': 'Failed to update data'})
    except json.JSONDecodeError:
        return create_response(400, {'error': 'Invalid JSON in request body'})


def handle_delete_data(event, context):
    """Handle DELETE /data/{id} - Delete specific data entry"""
    try:
        # Extract ID from path parameters
        item_id = event.get('pathParameters', {}).get('id')
        
        if not item_id:
            return create_response(400, {'error': 'ID parameter is required'})
        
        # Delete item from DynamoDB
        table.delete_item(Key={'id': item_id})
        
        return create_response(200, {
            'message': 'Data deleted successfully',
            'id': item_id
        })
        
    except ClientError as e:
        print(f"DynamoDB error: {str(e)}")
        return create_response(500, {'error': 'Failed to delete data'})


def create_response(status_code, body):
    """Create HTTP response with CORS headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        'body': json.dumps(body)
    }
```

## 5. README.md

```markdown
# Serverless Data Processing Application

A complete serverless infrastructure built with AWS CDK that provides a REST API for data processing and storage.

## Architecture

- **API Gateway**: REST API with CORS support
- **Lambda Function**: Python 3.9 runtime for data processing
- **DynamoDB**: NoSQL database with provisioned throughput
- **CloudWatch**: Logging and monitoring
- **IAM**: Secure role-based access control

## Deployment

1. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```

2. Deploy the stack:
   ```bash
   cdk deploy --context environment=prod
   ```

3. Clean up:
   ```bash
   cdk destroy
   ```

## API Endpoints

- `POST /data` - Create new data entry
- `GET /data` - List all data entries  
- `GET /data/{id}` - Get specific data entry
- `PUT /data/{id}` - Update specific data entry
- `DELETE /data/{id}` - Delete specific data entry

## Environment Variables

- `environment`: Environment suffix for resource naming (default: dev)
```

## Deployment Instructions

1. **Initialize CDK** (if not already done):
   ```bash
   cdk bootstrap aws://YOUR-ACCOUNT-ID/us-west-2
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Deploy the stack**:
   ```bash
   # Deploy with default environment (dev)
   cdk deploy

   # Deploy with specific environment
   cdk deploy --context environment=prod
   ```

4. **View outputs**:
   The deployment will output the Lambda function ARN and API Gateway URL.

## Key Features Implemented

✅ **Single stack deployment** in `main.py`  
✅ **Lambda function** with Python 3.9 runtime  
✅ **API Gateway REST** endpoint with Lambda integration  
✅ **DynamoDB table** with primary key and provisioned throughput (5 read/5 write)  
✅ **CloudWatch Logs** monitoring  
✅ **CORS support** for client-side applications  
✅ **Resource tagging** with `Environment: EnvironmentSuffix`  
✅ **us-west-2** region deployment  
✅ **IAM roles and policies** with least privilege access  
✅ **CloudFormation stack description**  
✅ **Output values** for Lambda ARN and API Gateway URL  

The infrastructure is production-ready with proper error handling, logging, and security best practices.