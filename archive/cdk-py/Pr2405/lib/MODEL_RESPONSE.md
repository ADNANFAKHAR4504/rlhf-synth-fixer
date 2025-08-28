I'll help you create a comprehensive serverless web application using AWS CDK with Python in a single stack. Let me build a solution that meets all your requirements with a focus on security, reliability, and best practices.

## Project Structure

```
serverless-web-app/
├── main.py
├── requirements.txt
├── README.md
├── cdk.json
├── lambda/
│   ├── __init__.py
│   ├── api_handler.py
│   └── requirements.txt
└── .gitignore
```

## 1. Main CDK Stack

**main.py**
```python
#!/usr/bin/env python3
import aws_cdk as cdk
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
    aws_cloudwatch as cloudwatch,
    aws_sns as sns,
    RemovalPolicy,
    CfnOutput
)
from constructs import Construct

class ServerlessWebAppStack(Stack):
    """
    Comprehensive serverless web application stack with security and monitoring
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
        
        # Create monitoring and alerting
        self._create_monitoring()
        
        # Create outputs
        self._create_outputs()

    def _create_kms_key(self) -> kms.Key:
        """Create KMS key for encryption with automatic rotation"""
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
        """Create DynamoDB table with encryption at rest and best practices"""
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
            stream=dynamodb.StreamViewType.NEW_AND_OLD_IMAGES,
            deletion_protection=False  # Set to True for production
        )
        
        # Add Global Secondary Index for querying by status and creation time
        table.add_global_secondary_index(
            index_name="StatusCreatedIndex",
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
        """Create S3 bucket with encryption at rest and security best practices"""
        bucket = s3.Bucket(
            self, "ServerlessStorageBucket",
            bucket_name=f"serverless-app-storage-{self.account}-{self.region}",
            encryption=s3.BucketEncryption.KMS,
            encryption_key=self.kms_key,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            versioned=True,
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldVersions",
                    enabled=True,
                    noncurrent_version_expiration=Duration.days(30)
                ),
                s3.LifecycleRule(
                    id="TransitionToIA",
                    enabled=True,
                    transitions=[
                        s3.Transition(
                            storage_class=s3.StorageClass.INFREQUENT_ACCESS,
                            transition_after=Duration.days(30)
                        )
                    ]
                )
            ]
        )
        
        return bucket

    def _create_lambda_function(self) -> _lambda.Function:
        """Create Lambda function with proper IAM permissions (least privilege)"""
        
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
                    "s3:HeadBucket",
                    "s3:ListBucket"
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
                    "kms:DescribeKey",
                    "kms:Encrypt",
                    "kms:GenerateDataKey"
                ],
                resources=[self.kms_key.key_arn]
            )
        )

        # Create Lambda function with security best practices
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
            environment_encryption=self.kms_key,
            tracing=_lambda.Tracing.ACTIVE,  # Enable X-Ray tracing
            dead_letter_queue_enabled=True
        )
        
        return lambda_function

    def _create_api_gateway(self) -> apigateway.RestApi:
        """Create API Gateway with usage plan, throttling, and security features"""
        
        # Create API Gateway with security configurations
        api = apigateway.RestApi(
            self, "ServerlessApi",
            rest_api_name=f"Serverless Web App API - {self.region}",
            description="Secure serverless web application API with throttling",
            default_cors_preflight_options=apigateway.CorsOptions(
                allow_origins=apigateway.Cors.ALL_ORIGINS,
                allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
                allow_headers=[
                    "Content-Type", 
                    "Authorization", 
                    "X-Amz-Date", 
                    "X-Api-Key", 
                    "X-Amz-Security-Token"
                ],
                max_age=Duration.seconds(600)
            ),
            cloud_watch_role=True,
            deploy_options=apigateway.StageOptions(
                stage_name="prod",
                throttling_rate_limit=500,   # requests per second
                throttling_burst_limit=1000, # burst capacity
                logging_level=apigateway.MethodLoggingLevel.INFO,
                data_trace_enabled=True,
                metrics_enabled=True,
                caching_enabled=False,  # Enable for production if needed
                variables={
                    "environment": "production"
                }
            )
        )
        
        # Create Lambda integration with error handling
        lambda_integration = apigateway.LambdaIntegration(
            self.lambda_function,
            proxy=True,
            allow_test_invoke=False,  # Security best practice
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
        
        # Create usage plan with comprehensive throttling and quotas
        usage_plan = api.add_usage_plan(
            "ServerlessUsagePlan",
            name=f"Serverless Usage Plan - {self.region}",
            description="Production usage plan with rate limiting and quotas",
            throttle=apigateway.ThrottleSettings(
                rate_limit=300,    # requests per second
                burst_limit=600    # burst capacity
            ),
            quota=apigateway.QuotaSettings(
                limit=100000,      # requests per day
                period=apigateway.Period.DAY
            )
        )
        
        # Create API key for authentication
        api_key = api.add_api_key(
            "ServerlessApiKey",
            api_key_name=f"serverless-api-key-{self.region}",
            description="API key for serverless web application access"
        )
        
        # Associate API key with usage plan
        usage_plan.add_api_key(api_key)
        usage_plan.add_api_stage(stage=api.deployment_stage)
        
        return api

    def _create_monitoring(self):
        """Create comprehensive CloudWatch monitoring and alerting"""
        
        # Create SNS topic for alerts
        alert_topic = sns.Topic(
            self, "AlertTopic",
            topic_name=f"serverless-alerts-{self.region}",
            display_name="Serverless Application Alerts"
        )
        
        # Lambda function error rate alarm
        lambda_error_alarm = cloudwatch.Alarm(
            self, "LambdaErrorAlarm",
            alarm_name=f"lambda-errors-{self.region}",
            metric=self.lambda_function.metric_errors(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=2,
            alarm_description="Lambda function error rate is too high",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        lambda_error_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
        
        # Lambda function duration alarm
        lambda_duration_alarm = cloudwatch.Alarm(
            self, "LambdaDurationAlarm",
            alarm_name=f"lambda-duration-{self.region}",
            metric=self.lambda_function.metric_duration(
                period=Duration.minutes(5),
                statistic="Average"
            ),
            threshold=15000,  # 15 seconds
            evaluation_periods=3,
            alarm_description="Lambda function duration is too high"
        )
        lambda_duration_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
        
        # Lambda throttle alarm
        lambda_throttle_alarm = cloudwatch.Alarm(
            self, "LambdaThrottleAlarm",
            alarm_name=f"lambda-throttles-{self.region}",
            metric=self.lambda_function.metric_throttles(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=1,
            alarm_description="Lambda function is being throttled"
        )
        lambda_throttle_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
        
        # API Gateway 4XX errors alarm
        api_4xx_alarm = cloudwatch.Alarm(
            self, "Api4xxAlarm",
            alarm_name=f"api-4xx-errors-{self.region}",
            metric=self.api_gateway.metric_client_error(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=20,
            evaluation_periods=2,
            alarm_description="API Gateway 4XX error rate is too high"
        )
        api_4xx_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
        
        # API Gateway 5XX errors alarm
        api_5xx_alarm = cloudwatch.Alarm(
            self, "Api5xxAlarm",
            alarm_name=f"api-5xx-errors-{self.region}",
            metric=self.api_gateway.metric_server_error(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=5,
            evaluation_periods=2,
            alarm_description="API Gateway 5XX error rate is too high"
        )
        api_5xx_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
        
        # API Gateway latency alarm
        api_latency_alarm = cloudwatch.Alarm(
            self, "ApiLatencyAlarm",
            alarm_name=f"api-latency-{self.region}",
            metric=self.api_gateway.metric_latency(
                period=Duration.minutes(5),
                statistic="Average"
            ),
            threshold=5000,  # 5 seconds
            evaluation_periods=3,
            alarm_description="API Gateway latency is too high"
        )
        api_latency_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
        
        # DynamoDB read throttle alarm
        dynamo_read_throttle_alarm = cloudwatch.Alarm(
            self, "DynamoReadThrottleAlarm",
            alarm_name=f"dynamo-read-throttles-{self.region}",
            metric=self.dynamodb_table.metric_user_errors(
                period=Duration.minutes(5),
                statistic="Sum"
            ),
            threshold=1,
            evaluation_periods=2,
            alarm_description="DynamoDB read operations are being throttled"
        )
        dynamo_read_throttle_alarm.add_alarm_action(
            cw_actions.SnsAction(alert_topic)
        )
        
        # Create CloudWatch Dashboard
        dashboard = cloudwatch.Dashboard(
            self, "ServerlessDashboard",
            dashboard_name=f"Serverless-App-{self.region}",
            widgets=[
                [
                    cloudwatch.GraphWidget(
                        title="Lambda Function Metrics",
                        left=[
                            self.lambda_function.metric_invocations(),
                            self.lambda_function.metric_errors(),
                            self.lambda_function.metric_throttles()
                        ],
                        right=[
                            self.lambda_function.metric_duration()
                        ]
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="API Gateway Metrics",
                        left=[
                            self.api_gateway.metric_count(),
                            self.api_gateway.metric_client_error(),
                            self.api_gateway.metric_server_error()
                        ],
                        right=[
                            self.api_gateway.metric_latency()
                        ]
                    )
                ],
                [
                    cloudwatch.GraphWidget(
                        title="DynamoDB Metrics",
                        left=[
                            self.dynamodb_table.metric_consumed_read_capacity_units(),
                            self.dynamodb_table.metric_consumed_write_capacity_units()
                        ],
                        right=[
                            self.dynamodb_table.metric_throttled_requests()
                        ]
                    )
                ]
            ]
        )

    def _create_outputs(self):
        """Create CloudFormation outputs for easy access to resources"""
        
        CfnOutput(
            self, "ApiGatewayUrl",
            value=self.api_gateway.url,
            description="API Gateway URL for the serverless application",
            export_name=f"{self.stack_name}-ApiUrl"
        )
        
        CfnOutput(
            self, "ApiGatewayId",
            value=self.api_gateway.rest_api_id,
            description="API Gateway ID",
            export_name=f"{self.stack_name}-ApiId"
        )
        
        CfnOutput(
            self, "DynamoDBTableName",
            value=self.dynamodb_table.table_name,
            description="DynamoDB table name for storing application data",
            export_name=f"{self.stack_name}-TableName"
        )
        
        CfnOutput(
            self, "LambdaFunctionName",
            value=self.lambda_function.function_name,
            description="Lambda function name handling API requests",
            export_name=f"{self.stack_name}-FunctionName"
        )
        
        CfnOutput(
            self, "LambdaFunctionArn",
            value=self.lambda_function.function_arn,
            description="Lambda function ARN",
            export_name=f"{self.stack_name}-FunctionArn"
        )
        
        CfnOutput(
            self, "S3BucketName",
            value=self.s3_bucket.bucket_name,
            description="S3 bucket name for additional storage",
            export_name=f"{self.stack_name}-BucketName"
        )
        
        CfnOutput(
            self, "KMSKeyId",
            value=self.kms_key.key_id,
            description="KMS key ID for encryption",
            export_name=f"{self.stack_name}-KMSKeyId"
        )

# CDK App
app = cdk.App()

# Deploy to us-west-2 region
ServerlessWebAppStack(
    app, 
    "ServerlessWebApp",
    env=cdk.Environment(region="us-west-2"),
    description="Secure and scalable serverless web application with monitoring"
)

app.synth()
```

## 2. Lambda Function Code

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
KMS_KEY_ID = os.environ.get('KMS_KEY_ID')

# Initialize DynamoDB table
table = dynamodb.Table(TABLE_NAME) if TABLE_NAME else None

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for API Gateway requests
    Handles routing, validation, and error management
    """
    try:
        # Log the incoming request (excluding sensitive data)
        logger.info(f"Processing request: {event.get('httpMethod')} {event.get('path')}")
        
        # Extract request information
        http_method = event.get('httpMethod', 'GET')
        path = event.get('path', '/')
        path_parameters = event.get('pathParameters') or {}
        query_parameters = event.get('queryStringParameters') or {}
        headers = event.get('headers') or {}
        
        # Validate API key if required (optional security layer)
        if not validate_request(headers):
            return create_response(401, {'error': 'Unauthorized access'})
        
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

def validate_request(headers: Dict[str, str]) -> bool:
    """
    Validate incoming request (implement your validation logic)
    Returns True if request is valid, False otherwise
    """
    # Add your validation logic here (API key, JWT, etc.)
    # For now, we'll allow all requests
    return True

def handle_health_check() -> Dict[str, Any]:
    """Health check endpoint with comprehensive system status"""
    try:
        health_status = {
            'status': 'healthy',
            'timestamp': datetime.utcnow().isoformat(),
            'region': AWS_REGION,
            'version': '1.0.0'
        }
        
        # Test DynamoDB connection
        if table:
            try:
                table.meta.client.describe_table(TableName=TABLE_NAME)
                health_status['services'] = {'dynamodb': 'healthy'}
            except ClientError as e:
                logger.warning(f"DynamoDB health check failed: {str(e)}")
                health_status['services'] = {'dynamodb': 'unhealthy'}
                health_status['status'] = 'degraded'
        else:
            health_status['services'] = {'dynamodb': 'not configured'}
            
        # Test S3 connection
        if BUCKET_NAME:
            try:
                s3_client.head_bucket(Bucket=BUCKET_NAME)
                health_status['services']['s3'] = 'healthy'
            except ClientError as e:
                logger.warning(f"S3 health check failed: {str(e)}")
                health_status['services']['s3'] = 'unhealthy'
                health_status['status'] = 'degraded'
        else:
            health_status['services']['s3'] = 'not configured'
            
        status_code = 200 if health_status['status'] == 'healthy' else 503
        return create_response(status_code, health_status)
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return create_response(503, {
            'status': 'unhealthy',
            'timestamp': datetime.utcnow().isoformat(),
            'error': str(e)
        })

def handle_get_items(query_params: Dict[str, str]) -> Dict[str, Any]:
    """Get all items from DynamoDB with pagination and filtering"""
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
        status_filter = query_params.get('status', 'active')
        
        if filter_name:
            scan_kwargs['FilterExpression'] = 'contains(#name, :name) AND #status = :status'
            scan_kwargs['ExpressionAttributeNames'] = {'#name': 'name', '#status': 'status'}
            scan_kwargs['ExpressionAttributeValues'] = {':name': filter_name, ':status': status_filter}
        else:
            scan_kwargs['FilterExpression'] = '#status = :status'
            scan_kwargs['ExpressionAttributeNames'] = {'#status': 'status'}
            scan_kwargs['ExpressionAttributeValues'] = {':status': status_filter}
        
        response = table.scan(**scan_kwargs)
        items = response.get('Items', [])
        
        result = {
            'items': items,
            'count': len(items),
            'scannedCount': response.get('ScannedCount', 0),
            'timestamp': datetime.utcnow().isoformat()
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
        
        if not item_id or len(item_id.strip()) == 0:
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
    """Create a new item in DynamoDB with validation"""
    try:
        if not table:
            return create_response(500, {'error': 'Database not configured'})
        
        # Parse and validate request body
        try:
            body = json.loads(event.get('body', '{}'))
        except json.JSONDecodeError:
            return create_response(400, {'error': 'Invalid JSON in request body'})
        
        # Validate required fields
        if not body.get('name') or len(body.get('name', '').strip()) == 0:
            return create_response(400, {'error': 'Name is required and cannot be empty'})
        
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
            'status': 'active',
            'version': 1
        }
        
        # Add optional fields if provided
        if 'tags' in body and isinstance(body['tags'], list):
            item['tags'] = [tag.strip() for tag in body['tags'][:10]]  # Limit to 10 tags
        
        if 'metadata' in body and isinstance(body['metadata'], dict):
            item['metadata'] = body['metadata']
        
        # Save to DynamoDB
        table.put_item(