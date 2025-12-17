# AWS Serverless Infrastructure with Pulumi

I'll create a complete serverless infrastructure using Pulumi that meets all your requirements. This solution includes Lambda functions, API Gateway, S3 logging, CloudWatch monitoring, and proper resource tagging.

## Project Structure

```
serverless-infrastructure/
├── __main__.py
├── requirements.txt
├── lambda/
│   └── handler.py
└── Pulumi.yaml
```

## 1. Pulumi Configuration (`Pulumi.yaml`)

```yaml
name: serverless-infrastructure
runtime: python
description: AWS Serverless Infrastructure with Lambda, API Gateway, and monitoring
```

## 2. Python Dependencies (`requirements.txt`)

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
pulumi-awsx>=2.0.0,<3.0.0
```

## 3. Lambda Function Code (`lambda/handler.py`)

```python
import json
import logging
import boto3
import datetime
import uuid
import os
from typing import Dict, Any

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
s3_client = boto3.client('s3')

def lambda_handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    """
    Main Lambda handler for processing HTTP requests
    """
    try:
        # Generate request ID for tracking
        request_id = str(uuid.uuid4())
        timestamp = datetime.datetime.utcnow().isoformat()
        
        # Extract request information
        http_method = event.get('httpMethod', 'UNKNOWN')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters') or {}
        headers = event.get('headers') or {}
        body = event.get('body', '')
        source_ip = event.get('requestContext', {}).get('identity', {}).get('sourceIp', 'unknown')
        
        # Create log entry
        log_entry = {
            'request_id': request_id,
            'timestamp': timestamp,
            'method': http_method,
            'path': path,
            'query_params': query_params,
            'source_ip': source_ip,
            'user_agent': headers.get('User-Agent', 'unknown'),
            'body_size': len(body) if body else 0
        }
        
        # Log to CloudWatch
        logger.info(f"Processing request: {json.dumps(log_entry)}")
        
        # Log to S3 bucket
        s3_bucket = os.environ.get('LOG_BUCKET_NAME')
        if s3_bucket:
            try:
                s3_key = f"logs/{datetime.datetime.utcnow().strftime('%Y/%m/%d')}/{request_id}.json"
                s3_client.put_object(
                    Bucket=s3_bucket,
                    Key=s3_key,
                    Body=json.dumps(log_entry, indent=2),
                    ContentType='application/json'
                )
                logger.info(f"Log entry saved to S3: s3://{s3_bucket}/{s3_key}")
            except Exception as e:
                logger.error(f"Failed to write to S3: {str(e)}")
        
        # Process the request based on path and method
        if path == '/health' and http_method == 'GET':
            response_body = {
                'status': 'healthy',
                'timestamp': timestamp,
                'request_id': request_id
            }
        elif path == '/echo' and http_method == 'POST':
            response_body = {
                'message': 'Echo response',
                'received_data': json.loads(body) if body else None,
                'timestamp': timestamp,
                'request_id': request_id
            }
        elif path == '/info' and http_method == 'GET':
            response_body = {
                'service': 'Serverless API',
                'version': '1.0.0',
                'timestamp': timestamp,
                'request_id': request_id,
                'environment': os.environ.get('ENVIRONMENT', 'development')
            }
        else:
            response_body = {
                'message': f'Hello from serverless API! Path: {path}, Method: {http_method}',
                'timestamp': timestamp,
                'request_id': request_id,
                'available_endpoints': [
                    'GET /health - Health check',
                    'POST /echo - Echo request body',
                    'GET /info - Service information'
                ]
            }
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'X-Request-ID': request_id
            },
            'body': json.dumps(response_body, indent=2)
        }
        
    except Exception as e:
        error_id = str(uuid.uuid4())
        error_message = f"Internal server error: {str(e)}"
        
        logger.error(f"Error processing request (Error ID: {error_id}): {error_message}")
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'X-Error-ID': error_id
            },
            'body': json.dumps({
                'error': 'Internal Server Error',
                'error_id': error_id,
                'timestamp': datetime.datetime.utcnow().isoformat()
            })
        }
```

## 4. Main Pulumi Infrastructure (`__main__.py`)

```python
import pulumi
import pulumi_aws as aws
import pulumi_awsx as awsx
import json
import os

# Configuration
config = pulumi.Config()
environment = config.get("environment") or "dev"
project_name = pulumi.get_project()

# Common tags for all resources
common_tags = {
    "Project": project_name,
    "Environment": environment,
    "ManagedBy": "Pulumi",
    "CostCenter": config.get("cost_center") or "Engineering",
    "Owner": config.get("owner") or "DevOps"
}

# Create S3 bucket for logging
log_bucket = aws.s3.Bucket(
    "serverless-logs",
    bucket=f"{project_name}-logs-{environment}",
    tags={**common_tags, "Purpose": "Lambda Logs"},
    lifecycle_rules=[
        aws.s3.BucketLifecycleRuleArgs(
            enabled=True,
            id="log_retention",
            expiration=aws.s3.BucketLifecycleRuleExpirationArgs(days=90),
            transitions=[
                aws.s3.BucketLifecycleRuleTransitionArgs(
                    days=30,
                    storage_class="STANDARD_IA"
                ),
                aws.s3.BucketLifecycleRuleTransitionArgs(
                    days=60,
                    storage_class="GLACIER"
                )
            ]
        )
    ]
)

# Block public access to the S3 bucket
bucket_public_access_block = aws.s3.BucketPublicAccessBlock(
    "serverless-logs-pab",
    bucket=log_bucket.id,
    block_public_acls=True,
    block_public_policy=True,
    ignore_public_acls=True,
    restrict_public_buckets=True
)

# Create IAM role for Lambda
lambda_role = aws.iam.Role(
    "serverless-lambda-role",
    name=f"{project_name}-lambda-role-{environment}",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {"Service": "lambda.amazonaws.com"}
            }
        ]
    }),
    tags={**common_tags, "Purpose": "Lambda Execution Role"}
)

# Attach basic Lambda execution policy
lambda_basic_policy = aws.iam.RolePolicyAttachment(
    "lambda-basic-execution",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Create custom policy for S3 access
s3_policy = aws.iam.RolePolicy(
    "lambda-s3-policy",
    role=lambda_role.id,
    policy=pulumi.Output.all(log_bucket.arn).apply(
        lambda args: json.dumps({
            "Version": "2012-10-17",
            "Statement": [
                {
                    "Effect": "Allow",
                    "Action": [
                        "s3:PutObject",
                        "s3:PutObjectAcl"
                    ],
                    "Resource": f"{args[0]}/*"
                }
            ]
        })
    )
)

# Create CloudWatch Log Group for Lambda
lambda_log_group = aws.cloudwatch.LogGroup(
    "serverless-lambda-logs",
    name=f"/aws/lambda/{project_name}-handler-{environment}",
    retention_in_days=14,
    tags={**common_tags, "Purpose": "Lambda Logs"}
)

# Create Lambda function
lambda_function = aws.lambda_.Function(
    "serverless-handler",
    name=f"{project_name}-handler-{environment}",
    runtime="python3.9",
    code=pulumi.AssetArchive({
        ".": pulumi.FileArchive("./lambda")
    }),
    handler="handler.lambda_handler",
    role=lambda_role.arn,
    timeout=30,
    memory_size=256,
    environment=aws.lambda_.FunctionEnvironmentArgs(
        variables={
            "LOG_BUCKET_NAME": log_bucket.bucket,
            "ENVIRONMENT": environment
        }
    ),
    tags={**common_tags, "Purpose": "HTTP Request Handler"},
    # Enable automatic scaling
    reserved_concurrent_executions=-1,  # No limit, allows automatic scaling
    depends_on=[lambda_log_group, s3_policy]
)

# Create API Gateway
api_gateway = aws.apigateway.RestApi(
    "serverless-api",
    name=f"{project_name}-api-{environment}",
    description=f"Serverless API for {project_name}",
    endpoint_configuration=aws.apigateway.RestApiEndpointConfigurationArgs(
        types="REGIONAL"
    ),
    tags={**common_tags, "Purpose": "API Gateway"}
)

# Create API Gateway resource (proxy resource to handle all paths)
proxy_resource = aws.apigateway.Resource(
    "api-proxy-resource",
    rest_api=api_gateway.id,
    parent_id=api_gateway.root_resource_id,
    path_part="{proxy+}"
)

# Create API Gateway method for proxy resource
proxy_method = aws.apigateway.Method(
    "api-proxy-method",
    rest_api=api_gateway.id,
    resource_id=proxy_resource.id,
    http_method="ANY",
    authorization="NONE"
)

# Create API Gateway method for root resource
root_method = aws.apigateway.Method(
    "api-root-method",
    rest_api=api_gateway.id,
    resource_id=api_gateway.root_resource_id,
    http_method="ANY",
    authorization="NONE"
)

# Create Lambda integration for proxy resource
proxy_integration = aws.apigateway.Integration(
    "api-proxy-integration",
    rest_api=api_gateway.id,
    resource_id=proxy_resource.id,
    http_method=proxy_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=lambda_function.invoke_arn
)

# Create Lambda integration for root resource
root_integration = aws.apigateway.Integration(
    "api-root-integration",
    rest_api=api_gateway.id,
    resource_id=api_gateway.root_resource_id,
    http_method=root_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=lambda_function.invoke_arn
)

# Create API Gateway deployment
api_deployment = aws.apigateway.Deployment(
    "api-deployment",
    rest_api=api_gateway.id,
    stage_name=environment,
    depends_on=[proxy_integration, root_integration],
    stage_description=f"Deployment for {environment} environment"
)

# Create API Gateway stage with logging and metrics
api_stage = aws.apigateway.Stage(
    "api-stage",
    deployment=api_deployment.id,
    rest_api=api_gateway.id,
    stage_name=environment,
    tags={**common_tags, "Purpose": "API Stage"},
    access_log_settings=aws.apigateway.StageAccessLogSettingsArgs(
        destination_arn=pulumi.Output.concat(
            "arn:aws:logs:",
            aws.get_region().name,
            ":",
            aws.get_caller_identity().account_id,
            ":log-group:/aws/apigateway/",
            api_gateway.name
        ),
        format=json.dumps({
            "requestId": "$context.requestId",
            "ip": "$context.identity.sourceIp",
            "caller": "$context.identity.caller",
            "user": "$context.identity.user",
            "requestTime": "$context.requestTime",
            "httpMethod": "$context.httpMethod",
            "resourcePath": "$context.resourcePath",
            "status": "$context.status",
            "protocol": "$context.protocol",
            "responseLength": "$context.responseLength"
        })
    ),
    method_settings=[
        aws.apigateway.StageMethodSettingArgs(
            method_path="*/*",
            metrics_enabled=True,
            logging_level="INFO",
            data_trace_enabled=True,
            throttling_burst_limit=5000,
            throttling_rate_limit=2000
        )
    ]
)

# Create CloudWatch Log Group for API Gateway
api_log_group = aws.cloudwatch.LogGroup(
    "api-gateway-logs",
    name=pulumi.Output.concat("/aws/apigateway/", api_gateway.name),
    retention_in_days=14,
    tags={**common_tags, "Purpose": "API Gateway Logs"}
)

# Grant API Gateway permission to invoke Lambda
lambda_permission = aws.lambda_.Permission(
    "api-gateway-invoke-lambda",
    statement_id="AllowExecutionFromAPIGateway",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.concat(api_gateway.execution_arn, "/*/*")
)

# Create CloudWatch Alarms for monitoring
lambda_error_alarm = aws.cloudwatch.MetricAlarm(
    "lambda-error-alarm",
    name=f"{project_name}-lambda-errors-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Errors",
    namespace="AWS/Lambda",
    period=300,
    statistic="Sum",
    threshold=5,
    alarm_description="Lambda function error rate is too high",
    dimensions={"FunctionName": lambda_function.name},
    tags={**common_tags, "Purpose": "Lambda Error Monitoring"}
)

lambda_duration_alarm = aws.cloudwatch.MetricAlarm(
    "lambda-duration-alarm",
    name=f"{project_name}-lambda-duration-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="Duration",
    namespace="AWS/Lambda",
    period=300,
    statistic="Average",
    threshold=10000,  # 10 seconds
    alarm_description="Lambda function duration is too high",
    dimensions={"FunctionName": lambda_function.name},
    tags={**common_tags, "Purpose": "Lambda Performance Monitoring"}
)

api_gateway_error_alarm = aws.cloudwatch.MetricAlarm(
    "api-gateway-error-alarm",
    name=f"{project_name}-api-errors-{environment}",
    comparison_operator="GreaterThanThreshold",
    evaluation_periods=2,
    metric_name="4XXError",
    namespace="AWS/ApiGateway",
    period=300,
    statistic="Sum",
    threshold=10,
    alarm_description="API Gateway 4XX error rate is too high",
    dimensions={
        "ApiName": api_gateway.name,
        "Stage": environment
    },
    tags={**common_tags, "Purpose": "API Gateway Error Monitoring"}
)

# Create Lambda provisioned concurrency for better performance (optional)
lambda_provisioned_concurrency = aws.lambda_.ProvisionedConcurrencyConfig(
    "lambda-provisioned-concurrency",
    function_name=lambda_function.name,
    qualifier="$LATEST",
    provisioned_concurrent_executions=2  # Adjust based on expected load
)

# Export important values
pulumi.export("api_gateway_url", pulumi.Output.concat(
    "https://", api_gateway.id, ".execute-api.", aws.get_region().name, ".amazonaws.com/", environment
))
pulumi.export("lambda_function_name", lambda_function.name)
pulumi.export("s3_log_bucket", log_bucket.bucket)
pulumi.export("api_gateway_id", api_gateway.id)
pulumi.export("lambda_function_arn", lambda_function.arn)

# Export endpoints for testing
pulumi.export("health_endpoint", pulumi.Output.concat(
    "https://", api_gateway.id, ".execute-api.", aws.get_region().name, ".amazonaws.com/", environment, "/health"
))
pulumi.export("echo_endpoint", pulumi.Output.concat(
    "https://", api_gateway.id, ".execute-api.", aws.get_region().name, ".amazonaws.com/", environment, "/echo"
))
pulumi.export("info_endpoint", pulumi.Output.concat(
    "https://", api_gateway.id, ".execute-api.", aws.get_region().name, ".amazonaws.com/", environment, "/info"
))
```

## 5. Deployment Instructions

### Prerequisites
1. Install Pulumi CLI
2. Configure AWS credentials
3. Install Python dependencies

### Deployment Steps

```bash
# 1. Initialize the project
mkdir serverless-infrastructure
cd serverless-infrastructure

# 2. Create the files as shown above

# 3. Install dependencies
pip install -r requirements.txt

# 4. Initialize Pulumi stack
pulumi stack init dev

# 5. Set configuration (optional)
pulumi config set environment dev
pulumi config set cost_center Engineering
pulumi config set owner DevOps

# 6. Deploy the infrastructure
pulumi up
```

## 6. Testing the Deployment

After successful deployment, you can test the endpoints:

```bash
# Get the API Gateway URL
API_URL=$(pulumi stack output api_gateway_url)

# Test health endpoint
curl "$API_URL/health"

# Test info endpoint
curl "$API_URL/info"

# Test echo endpoint
curl -X POST "$API_URL/echo" \
  -H "Content-Type: application/json" \
  -d '{"message": "Hello, World!", "test": true}'

# Test root endpoint
curl "$API_URL/"
```

## Key Features Implemented

###  **AWS Lambda for Serverless Compute**
- Python-based Lambda function with comprehensive error handling
- Environment variables for configuration
- Proper logging and monitoring

###  **API Gateway Integration**
- RESTful API with proxy integration
- Multiple endpoints (health, echo, info, root)
- CORS support
- Request/response logging

###  **Dual Logging System**
- **CloudWatch Logs**: Real-time logging with structured JSON
- **S3 Bucket**: Persistent log storage with lifecycle policies

###  **Automatic Scaling**
- Unrestricted concurrent executions for automatic scaling
- Provisioned concurrency for consistent performance
- Throttling limits configured in API Gateway

###  **Comprehensive Monitoring**
- CloudWatch alarms for Lambda errors and duration
- API Gateway error monitoring
- Detailed access logging
- Custom metrics and dashboards ready

###  **Resource Tagging**
- Consistent tagging strategy across all resources
- Cost allocation and management support
- Environment and ownership tracking

###  **Security Best Practices**
- IAM roles with minimal required permissions
- S3 bucket with blocked public access
- Secure Lambda execution environment

This infrastructure provides a production-ready serverless solution that automatically scales, maintains comprehensive logging, and includes proper monitoring and alerting capabilities.