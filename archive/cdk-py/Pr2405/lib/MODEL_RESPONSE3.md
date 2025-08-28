I'll help you create a comprehensive serverless web application using AWS CDK with Python. Let me build a solution that meets all your requirements with a focus on security, reliability, and best practices.

## Project Structure

```
serverless-web-app/
├── app.py
├── requirements.txt
├── README.md
├── cdk.json
├── lambda/
│   ├── __init__.py
│   ├── api_handler.py
│   └── requirements.txt
└── infrastructure/
    ├── __init__.py
    ├── serverless_stack.py
    └── monitoring_stack.py
```

## 1. CDK Application Entry Point

**app.py**
```python
#!/usr/bin/env python3
import aws_cdk as cdk
from infrastructure.serverless_stack import ServerlessStack
from infrastructure.monitoring_stack import MonitoringStack

app = cdk.App()

# Deploy to us-west-2 region
env = cdk.Environment(region="us-west-2")

# Main serverless stack
serverless_stack = ServerlessStack(
    app, 
    "ServerlessWebApp",
    env=env,
    description="Serverless web application with Lambda, API Gateway, and DynamoDB"
)

# Monitoring stack
monitoring_stack = MonitoringStack(
    app,
    "ServerlessMonitoring",
    lambda_function=serverless_stack.lambda_function,
    api_gateway=serverless_stack.api_gateway,
    dynamodb_table=serverless_stack.dynamodb_table,
    env=env,
    description="CloudWatch monitoring and alerting for serverless application"
)

# Add dependency
monitoring_stack.add_dependency(serverless_stack)

app.synth()
```

## 2. Requirements Files

**requirements.txt**
```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
boto3>=1.26.0
```

**lambda/requirements.txt**
```txt
boto3>=1.26.0
botocore>=1.29.0
```

## 3. CDK Configuration

**cdk.json**
```json
{
  "app": "python app.py",
  "watch": {
    "include": [
      "**"
    ],
    "exclude": [
      "README.md",
      "cdk*.json",
      "requirements*.txt",
      "**/__pycache__",
      "**/*.pyc"
    ]
  },
  "context": {
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/aws-iam:minimizePolicies": true,
    "@aws-cdk/core:validateSnapshotRemovalPolicy": true,
    "@aws-cdk/aws-apigateway:disableCloudWatchRole": false,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-lambda:useLatestRuntimeVersion": true,
    "@aws-cdk/aws-ec2:restrictDefaultSecurityGroup": true
  }
}
```

## 4. Lambda Function Code

**lambda/api_handler.py**
```python
import json
import boto3
import os
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from botocore.exceptions import ClientError
import uuid

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS services
dynamodb = boto3.resource('dynamodb')
s3_client = boto3.client('s3')

# Environment variables
TABLE_NAME = os.environ.get('TABLE_NAME')
BUCKET_NAME = os.environ.get('BUCKET_NAME')
AWS_REGION = os.environ.get('AWS_REGION')

# Initialize DynamoDB table
table = dynamodb.Table(TABLE_NAME) if TABLE_NAME else None

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for API Gateway requests
    Handles routing and error management
    """
    try:
        # Log the incoming request
        logger.info(f"Processing request: {event.get('httpMethod')} {event.get('path')}")
        
        # Extract request information
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        
        # Route based on HTTP method and path
        if http_method == 'GET' and path == '/health':
            return handle_health_check()
        elif http_method == 'GET' and path == '/items':
            return handle_get_items(query_parameters)
        elif http_method == 'POST' and path == '/items':
            return handle_create_item(event)
        elif http_method == 'GET' and path.startswith('/items/'):
            item_id = path_parameters.get('id') or path.split('/')[-1]
            return handle_get_item(item_id)
        elif http_method == 'PUT' and path.startswith('/items/'):
            item_id = path_parameters.get('id') or path.split('/')[-1]
            return handle_update_item(item_id, event)
        elif http_method == 'DELETE' and path.startswith('/items/'):
            item_id = path_parameters.get('id') or path.split('/')[-1]
            return handle_delete_item(item_id)
        else:
            return create_response(404, {
                'error': 'Not Found',
                'message': f'Endpoint {http_method} {path} not found'
            })
            
    except Exception as e:
        logger.error(f"Unhandled error processing request: {str(e)}", exc_info=True)
        return create_response(500, {
            'error': 'Internal Server Error',
            'message': 'An unexpected error occurred'
        })

def handle_health_check() -> Dict[str, Any]:
    """Health check endpoint with system status"""
    try:
        # Test DynamoDB connection
        db_status = "healthy"
        if table:
            table.meta.client.describe_table(TableName=TABLE_NAME)
        else:
            db_status = "not configured"
            
        # Test S3 connection
        s3_status = "healthy"
        if BUCKET_NAME:
            s3_client.head_bucket(Bucket=BUCKET_NAME)
        else:
            s3_status = "not configured"
            
        return create_response(200, {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'region': AWS_REGION,
            'services': {
                'dynamodb': db_status,
                's3': s3_status
            }
        })
        
    except ClientError as e:
        logger.warning(f"Health check failed: {str(e)}")
        return create_response(503, {
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        })

def handle_get_items(query_params: Dict[str, str]) -> Dict[str, Any]:
    """Get all items from DynamoDB with optional filtering"""
    try:
        if not table:
            return create_response(500, {'error': 'Database not configured'})
        
        # Handle pagination
        limit = min(int(query_params.get('limit', 50)), 100)  # Max 100 items
        last_key = query_params.get('lastKey')
        
        scan_kwargs = {'Limit': limit}
        
        if last_key:
            try:
                scan_kwargs['ExclusiveStartKey'] = {'id': last_key}
            except Exception:
                return create_response(400, {'error': 'Invalid lastKey parameter'})
        
        # Add filter if provided
        filter_name = query_params.get('name')
        if filter_name:
            scan_kwargs['FilterExpression'] = 'contains(#name, :name)'
            scan_kwargs['ExpressionAttributeNames'] = {'#name': 'name'}
            scan_kwargs['ExpressionAttributeValues'] = {':name': filter_name}
        
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])
        
        result = {
            'items': items,
            'count': len(items),
            'scannedCount': response.get('ScannedCount', 0)
        }
        
        # Include pagination info
        if 'LastEvaluatedKey' in response:
            result['lastKey'] = response['LastEvaluatedKey']['id']
            result['hasMore'] = True
        else:
            result['hasMore'] = False
            
        return create_response(200, result)
        
    except ClientError as e:
        logger.error(f"DynamoDB error getting items: {str(e)}")
        return create_response(500, {'error': 'Failed to retrieve items'})

def handle_get_item(item_id: str) -> Dict[str, Any]:
    """Get a specific item from DynamoDB"""
    try:
        if not table:
            return create_response(500, {'error': 'Database not configured'})
        
        if not item_id:
            return create_response(400, {'error': 'Item ID is required'})
            
        response = table.get_item(Key={'id': item_id})
        
        if 'Item' in response:
            return create_response(200, response['Item'])
        else:
            return create_response(404, {'error': 'Item not found'})
            
    except ClientError as e:
        logger.error(f"DynamoDB error getting item {item_id}: {str(e)}")
        return create_response(500, {'error': 'Failed to retrieve item'})

def handle_create_item(event: Dict[str, Any]) -> Dict[str, Any]:
    """Create a new item in DynamoDB"""
    try:
        if not table:
            return create_response(500, {'error': 'Database not configured'})
        
        # Parse and validate request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return create_response(400, {'error': 'Invalid JSON in request body'})
        
        # Validate required fields
        if not body.get('name'):
            return create_response(400, {'error': 'Name is required'})
        
        if len(body.get('name', '')) > 100:
            return create_response(400, {'error': 'Name must be 100 characters or less'})
        
        # Create item with generated ID and metadata
        item_id = str(uuid.uuid4())
        current_time = datetime.utcnow().isoformat()
        
        item = {
            'id': item_id,
            'name': body['name'].strip(),
            'description': body.get('description', '').strip()[:500],  # Limit description
            'category': body.get('category', 'general').strip(),
            'created_at': current_time,
            'updated_at': current_time,
            'region': AWS_REGION,
            'status': 'active'
        }
        
        # Add optional fields if provided
        if 'tags' in body and isinstance(body['tags'], list):
            item['tags'] = body['tags'][:10]  # Limit to 10 tags
        
        # Save to DynamoDB
        table.put_item(Item=item)
        
        logger.info(f"Created item with ID: {item_id}")
        return create_response(201, item)
        
    except ClientError as e:
        logger.error(f"DynamoDB error creating item: {str(e)}")
        return create_response(500, {'error': 'Failed to create item'})

def handle_update_item(item_id: str, event: Dict[str, Any]) -> Dict[str, Any]:
    """Update an existing item in DynamoDB"""
    try:
        if not table:
            return create_response(500, {'error': 'Database not configured'})
        
        if not item_id:
            return create_response(400, {'error': 'Item ID is required'})
        
        # Parse request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return create_response(400, {'error': 'Invalid JSON in request body'})
        
        # Check if item exists
        existing_item = table.get_item(Key={'id': item_id})
        if 'Item' not in existing_item:
            return create_response(404, {'error': 'Item not found'})
        
        # Build update expression
        update_expression = "SET updated_at = :updated_at"
        expression_values = {':updated_at': datetime.utcnow().isoformat()}
        
        if 'name' in body:
            if not body['name'] or len(body['name']) > 100:
                return create_response(400, {'error': 'Invalid name'})
            update_expression += ", #name = :name"
            expression_values[':name'] = body['name'].strip()
        
        if 'description' in body:
            update_expression += ", description = :description"
            expression_values[':description'] = body.get('description', '').strip()[:500]
        
        if 'category' in body:
            update_expression += ", category = :category"
            expression_values[':category'] = body.get('category', 'general').strip()
        
        if 'status' in body and body['status'] in ['active', 'inactive']:
            update_expression += ", #status = :status"
            expression_values[':status'] = body['status']
        
        expression_names = {}
        if '#name' in update_expression:
            expression_names['#name'] = 'name'
        if '#status' in update_expression:
            expression_names['#status'] = 'status'
        
        # Update the item
        update_kwargs = {
            'Key': {'id': item_id},
            'UpdateExpression': update_expression,
            'ExpressionAttributeValues': expression_values,
            'ReturnValues': 'ALL_NEW'
        }
        
        if expression_names:
            update_kwargs['ExpressionAttributeNames'] = expression_names
        
        response = table.update_item(**update_kwargs)
        
        logger.info(f"Updated item with ID: {item_id}")
        return create_response(200, response['Attributes'])
        
    except ClientError as e:
        logger.error(f"DynamoDB error updating item {item_id}: {str(e)}")
        return create_response(500, {'error': 'Failed to update item'})

def handle_delete_item(item_id: str) -> Dict[str, Any]:
    """Delete an item from DynamoDB"""
    try:
        if not table:
            return create_response(500, {'error': 'Database not configured'})
        
        if not item_id:
            return create_response(400, {'error': 'Item ID is required'})
        
        # Check if item exists before deletion
        existing_item = table.get_item(Key={'id': item_id})
        if 'Item' not in existing_item:
            return create_response(404, {'error': 'Item not found'})
        
        # Delete the item
        table.delete_item(Key={'id': item_id})
        
        logger.info(f"Deleted item with ID: {item_id}")
        return create_response(200, {'message': 'Item deleted successfully'})
        
    except ClientError as e:
        logger.error(f"DynamoDB error deleting item {item_id}: {str(e)}")
        return create_response(500, {'error': 'Failed to delete item'})

def create_response(status_code: int, body: Dict[str, Any]) -> Dict[str, Any]:
    """Create a properly formatted API Gateway response with security headers"""
    return {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
            'X-Content-Type-Options': 'nosniff',
            'X-Frame-Options': 'DENY',
            'X-XSS-Protection': '1; mode=block',
            'Strict-Transport-Security': 'max-age=31536000; includeSubDomains'
        },
        'body': json.dumps(body, default=str)
    }
```

## 5. Main Infrastructure Stack

**infrastructure/serverless_stack.py**
```python
from aws_cdk import (
    Stack,
    Duration,
    aws_lambda as _lambda,
    aws_apigateway as apigateway,
    aws_dynamodb as dynamodb,
    aws_iam as iam,
    aws_logs as logs,
    aws_s3 as s3,
    aws_kms as kms,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class ServerlessStack(Stack):
    """
    Main serverless stack with Lambda, API Gateway, and DynamoDB
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # Create KMS key for encryption
        self.kms_key = self._create_kms_key()
        
        # Create DynamoDB table with encryption
        self.dynamodb_table = self._create_dynamodb_table()
        
        # Create S3 bucket for additional storage
        self.s3_bucket = self._create_s3_bucket()
        
        # Create Lambda function
        self.lambda_function = self._create_lambda_function()
        
        # Create API Gateway with usage plan
        self.api_gateway = self._create_api_gateway()
        
        # Create outputs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption"""
        key = kms.Key(
            self, "ServerlessAppKey",
            description="KMS key for serverless application encryption",
            enable_key_rotation=True,
            removal_policy=RemovalPolicy.DESTROY  # For demo purposes
        )
        
        # Add alias for easier reference
        kms.Alias(
            self, "ServerlessAppKeyAlias",
            alias_name="alias/serverless-app-key",
            target_key=key
        )
        
        return key

    def _create_dynamodb_table(self) -> dynamodb.Table:
        """Create DynamoDB table with encryption at rest"""
        table = dynamodb.Table(
            self, "ItemsTable",
            table_name=f"serverless-items-{self.region}",
            partition_key=dynamodb.Attribute(
                name="id",
                type=dynamodb.AttributeType.STRING
            ),
            billing_mode=dynamodb.BillingMode.PAY_PER_REQUEST,
            encryption=dynamodb.TableEncryption.CUSTOMER_MANAGED,
            encryption_key=self.kms_key,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            point_in_time_recovery=True,
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
        )
        
        # Add Global Secondary Index for querying by status
        table.add_global_secondary_index(
            index_name="StatusIndex",
            partition_key=dynamodb.Attribute(
                name="status",
                type=dynamodb.AttributeType.STRING
            ),
            sort_key=dynamodb.Attribute(
                name="created_at",
                type=dynamodb.AttributeType.STRING
            )
        )
        
        return table

    def _create_s3_bucket(self) -> s3.Bucket:
        """Create S3 bucket with encryption at rest"""
        bucket = s3.Bucket(
            self, "ServerlessStorageBucket",
            bucket_name=f"serverless-app-storage-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            versioned=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )
        
        return bucket

    def _create_lambda_function(self) -> _lambda.Function:
        """Create Lambda function with proper IAM permissions"""
        
        # Create IAM role for Lambda with least privilege
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AWSLambdaBasicExecutionRole"
                )
            ]
        )
        
        # Add DynamoDB permissions (least privilege)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "dynamodb:GetItem",
                    "dynamodb:PutItem",
                    "dynamodb:UpdateItem",
                    "dynamodb:DeleteItem",
                    "dynamodb:Scan",
                    "dynamodb:Query",
                    "dynamodb:DescribeTable"
                ],
                resources=[
                    self.dynamodb_table.table_arn,
                    f"{self.dynamodb_table.table_arn}/index/*"
                ]
            )
        )
        
        # Add S3 permissions (least privilege)
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:HeadBucket"
                ],
                resources=[
                    self.s3_bucket.bucket_arn,
                    f"{self.s3_bucket.bucket_arn}/*"
                ]
            )
        )
        
        # Add KMS permissions for encryption/decryption
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "kms:Decrypt",
                    "kms:DescribeKey"
                ],
                resources=[self.kms_key.key_arn]
            )
        )

        # Create Lambda function
        lambda_function = _lambda.Function(
            self, "ApiHandler",
            runtime=_lambda.Runtime.PYTHON_3_11,
            handler="api_handler.lambda_handler",
            code=_lambda.Code.from_asset("lambda"),
            role=lambda_role,
            environment={
                "TABLE_NAME": self.dynamodb_table.table_name,
                "BUCKET_NAME": self.s3_bucket.bucket_name,
                "KMS_KEY_ID": self.kms_key.key_id
            },
            timeout=Duration.seconds(30),
            memory_size=512,
            log_retention=logs.RetentionDays.TWO_WEEKS,
            reserved_concurrent_executions=100,  # Prevent runaway costs
            environment_encryption=self.kms_key
        )
        
        return lambda_function

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with usage plan and throttling"""
        
        # Create CloudWatch role for API Gateway
        api_gateway_role = iam.Role(
            self, "ApiGatewayCloudWatchRole",
            assumed_by=iam.ServicePrincipal("apigateway.amazonaws.com"),
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name(
                    "service-role/AmazonAPIGatewayPushToCloudWatchLogs"
                )
            ]
        )
        
        # Create API Gateway
        api = apigateway.RestApi(
            self, "ServerlessApi",
            rest_api_name=f"Serverless Web App API - {self.region}",
            description="Secure serverless web application API",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=[
                    "Content-Type", 
                    "Authorization", 
                    "X-Amz-Date", 
                    "X-Api-Key", 
                    "X-Amz-Security-Token"
                ]
            ),
            cloud_watch_role=True,
            cloud_watch_role_removal_policy=RemovalPolicy.DESTROY,
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=1000,
                throttling_burst_limit=2000,
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True
            )
        )
        
        # Create Lambda integration
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            proxy=True,
            integration_responses=[
                apigateway.IntegrationResponse(
                    status_code="200",
                    response_parameters={
                        "method.response.header.Access-Control-Allow-Origin": "'*'"
                    }
                )
            ]
        )
        
        # Add method response for CORS
        method_response = apigateway.MethodResponse(
            status_code="200",
            response_parameters={
                "method.response.header.Access-Control-Allow-Origin": True
            }
        )
        
        # Health check endpoint
        health_resource = api.root.add_resource("health")
        health_resource.add_method(
            "GET", 
            lambda_integration,
            method_responses=[method_response]
        )
        
        # Items resource with full CRUD operations
        items_resource = api.root.add_resource("items")
        items_resource.add_method("GET", lambda_integration, method_responses=[method_response])
        items_resource.add_method("POST", lambda_integration, method_responses=[method_response])
        
        # Individual item resource
        item_resource = items_resource.add_resource("{id}")
        item_resource.add_method("GET", lambda_integration, method_responses=[method_response])
        item_resource.add_method("PUT", lambda_integration, method_responses=[method_response])
        item_resource.add_method("DELETE", lambda_integration, method_responses=[method_response])
        
        # Create usage plan with throttling and quotas
        usage_plan = api.add_usage_plan(
            "ServerlessUsagePlan",
            name=f"Serverless Usage Plan - {self.region}",
            description="Usage plan for serverless web app with rate limiting",
            throttle=apigateway.ThrottleSettings(
                rate_limit=500,    # requests per second
                burst_limit=1000   # burst capacity
            ),
            quota=apigateway.QuotaSettings(
                limit=50000,       # requests per day
                period=apigateway.Period.DAY
            )
        )
        
        # Create API key
        api_key = api.add_api_key(
            "ServerlessApiKey",
            api_key_name=f"serverless-api-key-{self.region}",
            description="API key for serverless web application"
        )
        
        # Associate API key with usage plan
        usage_plan.add_api_key(api_key)
        usage_plan.add_api_stage(
            stage=api.deployment_stage
        )
        
        return api

    def _create_outputs(self):
        """Create CloudFormation outputs"""
        
        CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api_gateway.url,
            description="API Gateway URL",
            export_name=f"{self.stack_name}-ApiUrl"
        )
        
        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB table name",
            export_name=f"{self.stack_name}-TableName"
        )
        
        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda function name",
            export_name=f"{self.stack_name}-FunctionName"
        )
        
        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 bucket name",
            export_name=f"{self.stack_name}-BucketName"
        )
        
        CfnOutput(
            self, "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS key ID for encryption",
            export_name=f"{self.stack_name}-KMSKeyId"
        )
```

## 6. Monitoring Stack

**infrastructure/monitoring_stack.py**
```python
from aws_cdk import (
    Stack,
    Duration,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_sns as sns,
    aws_logs as logs,
    CfnOutput
)
from constructs import Construct
from aws_cdk import aws_lambda as _lambda
from aws_cdk import aws_apigateway as apigateway
from aws_cdk import aws_dynamodb as dynamodb

class MonitoringStack(Stack):
    """
    CloudWatch monitoring and alerting stack
    """

    def __init__(
        self, 
        scope: Construct, 
        construct_id: str,
        lambda_function: _lambda.Function,
        api_gateway: apigateway.RestApi,
        dynamodb_table: dynamodb.Table,
        **kwargs
    ) -> None:
        super().__init__(scope, construct_id, **kwargs)
        
        self.lambda_function = lambda_function
        self.api_gateway = api_gateway
        self.dynamodb_table = dynamodb_table
        
        # Create SNS topic for alerts
        self.alert_topic = self._create_alert_topic()
        
        # Create CloudWatch dashboard
        self.dashboard = self._create_dashboard()
        
        # Create alarms
        self._create_lambda_alarms()
        self._create_api_gateway_alarms()
        self._create_dynamodb_alarms()
        
        # Create outputs
        self._create_outputs()

    def _create_alert_topic(self) -> sns.Topic:
        """Create SNS topic for CloudWatch alarms"""
        topic = sns.Topic(
            self, "AlertTopic",
            topic_name=f"serverless-alerts-{self.region}",
            display_name="Serverless Application Alerts"
        )
        
        return topic

    def _create_dashboard(self) -> cloudwatch.Dashboard:
        """Create CloudWatch dashboard"""
        dashboard = cloudwatch.Dashboard(
            self, "ServerlessDashboard",
            dashboard_name=f"