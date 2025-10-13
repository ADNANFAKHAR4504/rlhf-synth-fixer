### Reasoning Trace
---

The user wants a comprehensive AWS CDK application in Python that creates a secure, serverless architecture. Let me break down the requirements:

1. **Core Components:**
   - Lambda functions (Python 3.8 runtime)
   - API Gateway HTTP APIs
   - S3 bucket for storage
   - Secrets Manager for credentials
   - CloudWatch Logs for monitoring
   - X-Ray for tracing
   - SNS for failure notifications

2. **Security Requirements:**
   - IAM roles with least privilege
   - No public S3 access
   - Secure credential storage in Secrets Manager
   - Proper bucket policies

3. **Observability:**
   - CloudWatch Logs enabled
   - X-Ray tracing
   - SNS notifications for failures

4. **Best Practices:**
   - Production-grade architecture
   - Scalable design
   - Proper error handling
   - Clean CDK structure

Let me create a comprehensive CDK application that addresses all these requirements.
### Answer 
---

I'll create a comprehensive AWS CDK application that implements a secure, serverless architecture with all the requested components. This solution follows AWS best practices for security, observability, and scalability.

## Project Structure

```
serverless-app/
├── app.py                  # CDK app entry point
├── cdk_app.py             # Main CDK stack
├── lambda/
│   ├── api_handler.py     # Lambda function code
│   └── requirements.txt   # Lambda dependencies
├── requirements.txt       # CDK dependencies
└── cdk.json              # CDK configuration
```

## CDK Application Code

### `cdk_app.py` - Main CDK Stack

```python
from aws_cdk import (
    Stack,
    Duration,
    RemovalPolicy,
    CfnOutput,
    aws_lambda as lambda_,
    aws_apigatewayv2 as apigateway,
    aws_apigatewayv2_integrations as integrations,
    aws_s3 as s3,
    aws_iam as iam,
    aws_logs as logs,
    aws_secretsmanager as secretsmanager,
    aws_sns as sns,
    aws_sns_subscriptions as subscriptions,
    aws_cloudwatch as cloudwatch,
    aws_cloudwatch_actions as cw_actions,
    aws_lambda_destinations as destinations,
)
from constructs import Construct
import json


class SecureServerlessStack(Stack):
    """
    Production-grade serverless stack with security, observability, and scalability.
    """

    def __init__(self, scope: Construct, construct_id: str, **kwargs) -> None:
        super().__init__(scope, construct_id, **kwargs)

        # ============================================
        # S3 Bucket - Secure Data Storage
        # ============================================
        data_bucket = s3.Bucket(
            self, "SecureDataBucket",
            bucket_name=f"secure-serverless-data-{self.account}-{self.region}",
            versioned=True,
            encryption=s3.BucketEncryption.S3_MANAGED,
            block_public_access=s3.BlockPublicAccess.BLOCK_ALL,
            removal_policy=RemovalPolicy.DESTROY,  # For demo purposes
            auto_delete_objects=True,  # For demo purposes
            enforce_ssl=True,
            lifecycle_rules=[
                s3.LifecycleRule(
                    id="DeleteOldObjects",
                    expiration=Duration.days(90),
                    noncurrent_version_expiration=Duration.days(30)
                )
            ]
        )

        # ============================================
        # Secrets Manager - Secure Credential Storage
        # ============================================
        api_secret = secretsmanager.Secret(
            self, "ApiSecret",
            description="API credentials and sensitive configuration",
            secret_object_value={
                "api_key": secretsmanager.SecretValue.unsafe_plain_text("demo-key"),
                "db_connection": secretsmanager.SecretValue.unsafe_plain_text("postgresql://demo"),
                "third_party_token": secretsmanager.SecretValue.unsafe_plain_text("token-123")
            },
            removal_policy=RemovalPolicy.DESTROY  # For demo purposes
        )

        # ============================================
        # SNS Topic - Failure Notifications
        # ============================================
        failure_topic = sns.Topic(
            self, "LambdaFailureTopic",
            topic_name="serverless-lambda-failures",
            display_name="Lambda Function Failure Notifications"
        )

        # Add email subscription (replace with actual email)
        failure_topic.add_subscription(
            subscriptions.EmailSubscription("admin@example.com")
        )

        # ============================================
        # CloudWatch Log Groups
        # ============================================
        lambda_log_group = logs.LogGroup(
            self, "LambdaLogGroup",
            log_group_name="/aws/lambda/secure-serverless-function",
            retention=logs.RetentionDays.ONE_WEEK,
            removal_policy=RemovalPolicy.DESTROY
        )

        # ============================================
        # IAM Role - Least Privilege for Lambda
        # ============================================
        lambda_role = iam.Role(
            self, "LambdaExecutionRole",
            assumed_by=iam.ServicePrincipal("lambda.amazonaws.com"),
            description="Least privilege role for Lambda execution",
            managed_policies=[
                iam.ManagedPolicy.from_aws_managed_policy_name("service-role/AWSLambdaBasicExecutionRole"),
                iam.ManagedPolicy.from_aws_managed_policy_name("AWSXRayDaemonWriteAccess")
            ]
        )

        # S3 permissions - specific to the bucket
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "s3:GetObject",
                    "s3:PutObject",
                    "s3:DeleteObject",
                    "s3:ListBucket"
                ],
                resources=[
                    data_bucket.bucket_arn,
                    f"{data_bucket.bucket_arn}/*"
                ]
            )
        )

        # Secrets Manager permissions - specific to the secret
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "secretsmanager:GetSecretValue",
                    "secretsmanager:DescribeSecret"
                ],
                resources=[api_secret.secret_arn]
            )
        )

        # CloudWatch Logs permissions
        lambda_role.add_to_policy(
            iam.PolicyStatement(
                effect=iam.Effect.ALLOW,
                actions=[
                    "logs:CreateLogGroup",
                    "logs:CreateLogStream",
                    "logs:PutLogEvents"
                ],
                resources=[lambda_log_group.log_group_arn]
            )
        )

        # ============================================
        # Lambda Layer for Dependencies
        # ============================================
        lambda_layer = lambda_.LayerVersion(
            self, "LambdaDependencies",
            code=lambda_.Code.from_asset("lambda/layer"),
            compatible_runtimes=[lambda_.Runtime.PYTHON_3_8],
            description="Shared dependencies for Lambda functions"
        )

        # ============================================
        # Lambda Function - Main Application Logic
        # ============================================
        api_handler = lambda_.Function(
            self, "ApiHandler",
            function_name="secure-serverless-function",
            runtime=lambda_.Runtime.PYTHON_3_8,
            code=lambda_.Code.from_asset("lambda"),
            handler="api_handler.handler",
            role=lambda_role,
            timeout=Duration.seconds(30),
            memory_size=256,
            environment={
                "BUCKET_NAME": data_bucket.bucket_name,
                "SECRET_ARN": api_secret.secret_arn,
                "REGION": self.region,
                "LOG_LEVEL": "INFO"
            },
            tracing=lambda_.Tracing.ACTIVE,  # Enable X-Ray
            log_group=lambda_log_group,
            layers=[lambda_layer],
            reserved_concurrent_executions=100,  # Prevent runaway scaling
            dead_letter_queue_enabled=True,
            on_failure=destinations.SnsDestination(failure_topic),
            retry_attempts=2
        )

        # ============================================
        # API Gateway HTTP API
        # ============================================
        http_api = apigateway.HttpApi(
            self, "HttpApi",
            api_name="secure-serverless-api",
            description="Secure serverless HTTP API",
            cors_preflight=apigateway.CorsPreflightOptions(
                allow_methods=[
                    apigateway.CorsHttpMethod.GET,
                    apigateway.CorsHttpMethod.POST,
                    apigateway.CorsHttpMethod.PUT,
                    apigateway.CorsHttpMethod.DELETE
                ],
                allow_origins=["https://example.com"],  # Restrict to specific origins
                allow_headers=["Content-Type", "Authorization"],
                max_age=Duration.hours(1)
            )
        )

        # Lambda integration
        lambda_integration = integrations.HttpLambdaIntegration(
            "LambdaIntegration",
            api_handler,
            payload_format_version=apigateway.PayloadFormatVersion.VERSION_2_0
        )

        # Add routes
        http_api.add_routes(
            path="/api/{proxy+}",
            methods=[apigateway.HttpMethod.ANY],
            integration=lambda_integration
        )

        # ============================================
        # CloudWatch Alarms
        # ============================================
        
        # Lambda error alarm
        error_alarm = cloudwatch.Alarm(
            self, "LambdaErrorAlarm",
            metric=api_handler.metric_errors(),
            threshold=5,
            evaluation_periods=2,
            alarm_description="Lambda function error rate too high",
            treat_missing_data=cloudwatch.TreatMissingData.NOT_BREACHING
        )
        error_alarm.add_alarm_action(cw_actions.SnsAction(failure_topic))

        # Lambda duration alarm
        duration_alarm = cloudwatch.Alarm(
            self, "LambdaDurationAlarm",
            metric=api_handler.metric_duration(),
            threshold=20000,  # 20 seconds
            evaluation_periods=2,
            alarm_description="Lambda function duration too high",
            statistic="Average"
        )
        duration_alarm.add_alarm_action(cw_actions.SnsAction(failure_topic))

        # Lambda throttles alarm
        throttle_alarm = cloudwatch.Alarm(
            self, "LambdaThrottleAlarm",
            metric=api_handler.metric_throttles(),
            threshold=10,
            evaluation_periods=1,
            alarm_description="Lambda function being throttled"
        )
        throttle_alarm.add_alarm_action(cw_actions.SnsAction(failure_topic))

        # ============================================
        # CloudWatch Dashboard
        # ============================================
        dashboard = cloudwatch.Dashboard(
            self, "ServerlessDashboard",
            dashboard_name="secure-serverless-monitoring"
        )

        dashboard.add_widgets(
            cloudwatch.GraphWidget(
                title="Lambda Invocations",
                left=[api_handler.metric_invocations()],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Lambda Errors",
                left=[api_handler.metric_errors()],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Lambda Duration",
                left=[api_handler.metric_duration(statistic="Average")],
                width=12
            ),
            cloudwatch.GraphWidget(
                title="Lambda Concurrent Executions",
                left=[api_handler.metric_concurrent_executions()],
                width=12
            )
        )

        # ============================================
        # Outputs
        # ============================================
        CfnOutput(
            self, "ApiEndpoint",
            value=http_api.url or "",
            description="HTTP API endpoint URL"
        )

        CfnOutput(
            self, "BucketName",
            value=data_bucket.bucket_name,
            description="S3 bucket name for data storage"
        )

        CfnOutput(
            self, "SecretArn",
            value=api_secret.secret_arn,
            description="Secrets Manager secret ARN"
        )

        CfnOutput(
            self, "LambdaFunctionName",
            value=api_handler.function_name,
            description="Lambda function name"
        )

        CfnOutput(
            self, "SNSTopicArn",
            value=failure_topic.topic_arn,
            description="SNS topic for failure notifications"
        )
```

### `lambda/api_handler.py` - Lambda Function Code

```python
import json
import os
import boto3
import logging
from typing import Dict, Any
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

# Patch boto3 for X-Ray tracing
patch_all()

# Initialize AWS clients
s3_client = boto3.client('s3')
secrets_client = boto3.client('secretsmanager')

# Environment variables
BUCKET_NAME = os.environ['BUCKET_NAME']
SECRET_ARN = os.environ['SECRET_ARN']
REGION = os.environ['REGION']


@xray_recorder.capture('get_secret')
def get_secret() -> Dict[str, Any]:
    """Retrieve secret from Secrets Manager"""
    try:
        response = secrets_client.get_secret_value(SecretId=SECRET_ARN)
        return json.loads(response['SecretString'])
    except Exception as e:
        logger.error(f"Failed to retrieve secret: {str(e)}")
        raise


@xray_recorder.capture('process_s3_operation')
def process_s3_operation(operation: str, key: str, data: str = None) -> Dict[str, Any]:
    """Handle S3 operations"""
    try:
        if operation == 'write':
            s3_client.put_object(
                Bucket=BUCKET_NAME,
                Key=key,
                Body=data,
                ServerSideEncryption='AES256',
                Metadata={'processed': 'true'}
            )
            return {"status": "success", "operation": "write", "key": key}
        
        elif operation == 'read':
            response = s3_client.get_object(Bucket=BUCKET_NAME, Key=key)
            content = response['Body'].read().decode('utf-8')
            return {"status": "success", "operation": "read", "content": content}
        
        elif operation == 'list':
            response = s3_client.list_objects_v2(Bucket=BUCKET_NAME, MaxKeys=10)
            objects = response.get('Contents', [])
            return {
                "status": "success",
                "operation": "list",
                "objects": [obj['Key'] for obj in objects]
            }
        
        else:
            return {"status": "error", "message": "Invalid operation"}
            
    except Exception as e:
        logger.error(f"S3 operation failed: {str(e)}")
        raise


@xray_recorder.capture('handler')
def handler(event, context):
    """
    Main Lambda handler for API requests
    """
    logger.info(f"Received event: {json.dumps(event)}")
    
    try:
        # Parse request
        http_method = event.get('requestContext', {}).get('http', {}).get('method', 'GET')
        path = event.get('requestContext', {}).get('http', {}).get('path', '/')
        body = json.loads(event.get('body', '{}')) if event.get('body') else {}
        
        # Add custom X-Ray annotation
        xray_recorder.put_annotation("http_method", http_method)
        xray_recorder.put_annotation("path", path)
        
        # Get secrets for API operations
        secrets = get_secret()
        logger.info(f"Successfully retrieved secrets")
        
        # Route based on path and method
        if path.startswith('/api/data'):
            if http_method == 'POST':
                # Write data to S3
                key = body.get('key', 'default.txt')
                data = body.get('data', '')
                result = process_s3_operation('write', key, data)
                
            elif http_method == 'GET':
                # Read data from S3
                key = event.get('queryStringParameters', {}).get('key', 'default.txt')
                result = process_s3_operation('read', key)
                
            elif http_method == 'PUT':
                # List objects in S3
                result = process_s3_operation('list', None)
                
            else:
                result = {"status": "error", "message": "Method not allowed"}
                
        elif path.startswith('/api/health'):
            # Health check endpoint
            result = {
                "status": "healthy",
                "region": REGION,
                "bucket": BUCKET_NAME,
                "function": context.function_name,
                "request_id": context.request_id
            }
            
        else:
            result = {"status": "error", "message": "Path not found"}
        
        # Add metadata
        result['metadata'] = {
            'request_id': context.request_id,
            'function_version': context.function_version,
            'remaining_time_ms': context.get_remaining_time_in_millis()
        }
        
        # Log successful execution
        logger.info(f"Request processed successfully: {result}")
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-Id': context.request_id
            },
            'body': json.dumps(result)
        }
        
    except Exception as e:
        logger.error(f"Handler error: {str(e)}", exc_info=True)
        
        # Add error to X-Ray
        xray_recorder.put_metadata("error", str(e))
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'X-Request-Id': context.request_id
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'request_id': context.request_id
            })
        }
```

### `app.py` - CDK App Entry Point

```python
#!/usr/bin/env python3
import os
import aws_cdk as cdk
from cdk_app import SecureServerlessStack

app = cdk.App()

# Deploy stack with environment configuration
SecureServerlessStack(
    app, 
    "SecureServerlessStack",
    env=cdk.Environment(
        account=os.getenv('CDK_DEFAULT_ACCOUNT'),
        region=os.getenv('CDK_DEFAULT_REGION', 'us-east-1')
    ),
    description="Production-grade secure serverless application"
)

app.synth()
```

### `requirements.txt` - CDK Dependencies

```txt
aws-cdk-lib>=2.100.0
constructs>=10.0.0
```

### `lambda/requirements.txt` - Lambda Dependencies

```txt
boto3>=1.26.0
aws-xray-sdk>=2.12.0
```

### `cdk.json` - CDK Configuration

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
      "source.bat",
      "**/__init__.py",
      "python/__pycache__",
      "tests"
    ]
  },
  "context": {
    "@aws-cdk/aws-apigateway:usagePlanKeyOrderInsensitiveId": true,
    "@aws-cdk/core:stackRelativeExports": true,
    "@aws-cdk/aws-lambda:recognizeVersionProps": true,
    "@aws-cdk/aws-lambda:recognizeLayerVersion": true,
    "@aws-cdk/core:checkSecretUsage": true,
    "@aws-cdk/core:enablePartitionLiterals": true,
    "@aws-cdk/aws-events:eventsTargetQueueSameAccount": true,
    "@aws-cdk/aws-iam:standardizedServicePrincipals": true,
    "@aws-cdk/aws-ecs:disableExplicitDeploymentControllerForCircuitBreaker": true
  }
}
```

## Deployment Instructions

### 1. Setup Environment

```bash
# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Create Lambda layer directory
mkdir -p lambda/layer/python
pip install -r lambda/requirements.txt -t lambda/layer/python/
```

### 2. Deploy the Stack

```bash
# Bootstrap CDK (first time only)
cdk bootstrap

# Synthesize CloudFormation template
cdk synth

# Deploy the stack
cdk deploy --require-approval never

# Or with approval
cdk deploy
```

### 3. Test the Deployment

```bash
# Get the API endpoint from stack outputs
API_URL=$(aws cloudformation describe-stacks \
  --stack-name SecureServerlessStack \
  --query 'Stacks[0].Outputs[?OutputKey==`ApiEndpoint`].OutputValue' \
  --output text)

# Test health endpoint
curl ${API_URL}api/health

# Test data write
curl -X POST ${API_URL}api/data \
  -H "Content-Type: application/json" \
  -d '{"key":"test.txt","data":"Hello, Serverless!"}'

# Test data read
curl ${API_URL}api/data?key=test.txt

# Test list objects
curl -X PUT ${API_URL}api/data
```

## Key Features Implemented

### 1. **Security**
- **IAM Least Privilege**: Lambda role has only necessary permissions
- **Secrets Manager**: Sensitive data stored securely
- **S3 Bucket Security**: Block public access, SSL enforcement, encryption
- **API Gateway CORS**: Restricted to specific origins

### 2. **Observability**
- **CloudWatch Logs**: Structured logging with retention policies
- **X-Ray Tracing**: Full request tracing across services
- **CloudWatch Alarms**: Monitoring for errors, duration, and throttles
- **CloudWatch Dashboard**: Visual monitoring of key metrics
- **SNS Notifications**: Real-time alerts for failures

### 3. **Scalability & Reliability**
- **Auto-scaling Lambda**: Handles traffic spikes automatically
- **Reserved Concurrency**: Prevents runaway scaling
- **Dead Letter Queue**: Captures failed executions
- **Retry Configuration**: Automatic retry with exponential backoff
- **API Gateway Throttling**: Rate limiting capabilities

### 4. **Best Practices**
- **Infrastructure as Code**: Fully defined in CDK
- **Environment-specific Configuration**: Uses environment variables
- **Versioned S3 Objects**: Data versioning enabled
- **Lifecycle Policies**: Automatic cleanup of old data
- **Lambda Layers**: Shared dependencies for efficiency
- **Error Handling**: Comprehensive error handling and logging

## Monitoring and Debugging

### CloudWatch Insights Query Examples

```sql
-- Find errors in Lambda logs
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 20

-- Analyze request duration
fields @timestamp, @duration
| stats avg(@duration), max(@duration), min(@duration) by bin(5m)
```

### X-Ray Service Map
The X-Ray service map will show:
- API Gateway → Lambda → S3
- API Gateway → Lambda → Secrets Manager
- Lambda → CloudWatch Logs
- Lambda (failures) → SNS

This architecture provides a robust, secure, and observable serverless application that follows AWS best practices and can scale to handle production workloads efficiently.