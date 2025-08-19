# 📝 Serverless Web Application Deployment on AWS

I'll create a complete Pulumi Python solution for deploying a serverless web application infrastructure on AWS. This solution follows all the specified requirements and best practices.

## Project Structure

```
serverless-app/
├── __main__.py          # Main Pulumi infrastructure code
├── lambda_function.py   # Lambda function handler code
├── test_lambda.py       # Unit tests for Lambda function
├── Pulumi.yaml         # Pulumi project configuration
└── requirements.txt    # Python dependencies
```

## 1. Pulumi Project Configuration (`Pulumi.yaml`)

```yaml
name: serverless-infra-pulumi
runtime: python
description: Serverless web application infrastructure on AWS
```

## 2. Python Dependencies (`requirements.txt`)

```txt
pulumi>=3.0.0,<4.0.0
pulumi-aws>=6.0.0,<7.0.0
boto3>=1.26.0
pytest>=7.0.0
requests>=2.28.0
```

## 3. Main Pulumi Infrastructure Code (`__main__.py`)

```python
"""
Serverless Web Application Infrastructure on AWS using Pulumi
Deploys Lambda function with API Gateway trigger and CloudWatch logging
"""

import pulumi
import pulumi_aws as aws
import json

# Configuration
config = pulumi.Config()
environment = config.get("environment") or "dev"
project_name = "serverless-infra-pulumi"

# Common tags for all resources
common_tags = {
    "project": project_name,
    "environment": environment,
    "managed-by": "pulumi"
}

# Create IAM role for Lambda function execution
lambda_role = aws.iam.Role(
    f"{environment}-lambda-execution-role",
    assume_role_policy=json.dumps({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Action": "sts:AssumeRole",
                "Effect": "Allow",
                "Principal": {
                    "Service": "lambda.amazonaws.com"
                }
            }
        ]
    }),
    tags=common_tags
)

# Attach basic execution policy to Lambda role
lambda_role_policy_attachment = aws.iam.RolePolicyAttachment(
    f"{environment}-lambda-basic-execution",
    role=lambda_role.name,
    policy_arn="arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
)

# Create CloudWatch Log Group for Lambda function
log_group = aws.cloudwatch.LogGroup(
    f"{environment}-lambda-logs",
    name=f"/aws/lambda/{environment}-api-handler",
    retention_in_days=14,  # Cost-effective retention period
    tags=common_tags
)

# Create Lambda function
lambda_function = aws.lambda_.Function(
    f"{environment}-api-handler",
    name=f"{environment}-api-handler",
    runtime="python3.9",
    handler="lambda_function.lambda_handler",
    role=lambda_role.arn,
    code=pulumi.AssetArchive({
        "lambda_function.py": pulumi.FileAsset("lambda_function.py")
    }),
    timeout=30,  # 30 seconds timeout
    memory_size=128,  # Minimum memory for cost efficiency
    environment={
        "variables": {
            "ENVIRONMENT": environment,
            "LOG_LEVEL": "INFO"
        }
    },
    depends_on=[lambda_role_policy_attachment, log_group],
    tags=common_tags
)

# Create API Gateway REST API
api_gateway = aws.apigateway.RestApi(
    f"{environment}-serverless-api",
    name=f"{environment}-serverless-api",
    description=f"Serverless API for {environment} environment",
    endpoint_configuration={
        "types": "REGIONAL"
    },
    tags=common_tags
)

# Create API Gateway resource (proxy resource to catch all paths)
api_resource = aws.apigateway.Resource(
    f"{environment}-api-proxy-resource",
    rest_api=api_gateway.id,
    parent_id=api_gateway.root_resource_id,
    path_part="{proxy+}"
)

# Create API Gateway method for ANY HTTP method
api_method = aws.apigateway.Method(
    f"{environment}-api-proxy-method",
    rest_api=api_gateway.id,
    resource_id=api_resource.id,
    http_method="ANY",
    authorization="NONE"
)

# Create API Gateway method for root path
root_method = aws.apigateway.Method(
    f"{environment}-api-root-method",
    rest_api=api_gateway.id,
    resource_id=api_gateway.root_resource_id,
    http_method="ANY",
    authorization="NONE"
)

# Create API Gateway integration with Lambda (proxy resource)
api_integration = aws.apigateway.Integration(
    f"{environment}-api-proxy-integration",
    rest_api=api_gateway.id,
    resource_id=api_resource.id,
    http_method=api_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=lambda_function.invoke_arn
)

# Create API Gateway integration with Lambda (root resource)
root_integration = aws.apigateway.Integration(
    f"{environment}-api-root-integration",
    rest_api=api_gateway.id,
    resource_id=api_gateway.root_resource_id,
    http_method=root_method.http_method,
    integration_http_method="POST",
    type="AWS_PROXY",
    uri=lambda_function.invoke_arn
)

# Grant API Gateway permission to invoke Lambda function
lambda_permission = aws.lambda_.Permission(
    f"{environment}-api-gateway-invoke-lambda",
    statement_id="AllowExecutionFromAPIGateway",
    action="lambda:InvokeFunction",
    function=lambda_function.name,
    principal="apigateway.amazonaws.com",
    source_arn=pulumi.Output.concat(api_gateway.execution_arn, "/*/*")
)

# Deploy API Gateway
api_deployment = aws.apigateway.Deployment(
    f"{environment}-api-deployment",
    depends_on=[api_integration, root_integration],
    rest_api=api_gateway.id,
    stage_name=environment
)

# Create API Gateway stage
api_stage = aws.apigateway.Stage(
    f"{environment}-api-stage",
    deployment=api_deployment.id,
    rest_api=api_gateway.id,
    stage_name=environment,
    tags=common_tags
)

# Export important values
pulumi.export("lambda_function_name", lambda_function.name)
pulumi.export("lambda_function_arn", lambda_function.arn)
pulumi.export("api_gateway_url", pulumi.Output.concat(
    "https://", api_gateway.id, ".execute-api.us-west-2.amazonaws.com/", environment
))
pulumi.export("api_gateway_id", api_gateway.id)
pulumi.export("cloudwatch_log_group", log_group.name)
```

## 4. Lambda Function Code (`lambda_function.py`)

```python
"""
AWS Lambda function handler for serverless web application
Provides basic API responses and demonstrates serverless functionality
"""

import json
import logging
import os
from datetime import datetime

# Configure logging
logger = logging.getLogger()
logger.setLevel(os.environ.get('LOG_LEVEL', 'INFO'))

def lambda_handler(event, context):
    """
    AWS Lambda handler function

    Args:
        event: API Gateway event object
        context: Lambda context object

    Returns:
        dict: HTTP response object
    """
    try:
        # Log the incoming event for debugging
        logger.info(f"Received event: {json.dumps(event, default=str)}")

        # Extract request information
        http_method = event.get('httpMethod', 'UNKNOWN')
        path = event.get('path', '/')
        query_params = event.get('queryStringParameters') or {}
        headers = event.get('headers') or {}

        # Get environment information
        environment = os.environ.get('ENVIRONMENT', 'unknown')

        # Create response data
        response_data = {
            "message": "Hello from your serverless application!",
            "timestamp": datetime.utcnow().isoformat() + "Z",
            "environment": environment,
            "request_info": {
                "method": http_method,
                "path": path,
                "query_parameters": query_params,
                "user_agent": headers.get('User-Agent', 'Unknown')
            },
            "lambda_info": {
                "function_name": context.function_name,
                "function_version": context.function_version,
                "request_id": context.aws_request_id,
                "memory_limit": context.memory_limit_in_mb
            }
        }

        # Handle different paths
        if path == '/health':
            response_data["status"] = "healthy"
            response_data["message"] = "Service is running normally"
        elif path == '/info':
            response_data["message"] = "Serverless application information"

        # Create HTTP response
        response = {
            "statusCode": 200,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*",  # Enable CORS for web clients
                "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type, Authorization"
            },
            "body": json.dumps(response_data, indent=2)
        }

        logger.info(f"Returning response with status code: {response['statusCode']}")
        return response

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}", exc_info=True)

        # Return error response
        error_response = {
            "statusCode": 500,
            "headers": {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            "body": json.dumps({
                "error": "Internal server error",
                "message": "An unexpected error occurred",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "request_id": context.aws_request_id if context else "unknown"
            })
        }

        return error_response

def health_check():
    """
    Simple health check function for testing

    Returns:
        dict: Health status
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat() + "Z",
        "service": "serverless-web-app"
    }
```

## 5. Unit Tests (`test_lambda.py`)

```python
"""
Unit tests for the serverless Lambda function
Tests Lambda handler functionality and API Gateway integration simulation
"""

import unittest
import json
from unittest.mock import MagicMock
from datetime import datetime
import sys
import os

# Add the current directory to Python path to import lambda_function
sys.path.insert(0, os.path.dirname(__file__))

import lambda_function

class TestLambdaFunction(unittest.TestCase):
    """Test cases for Lambda function handler"""

    def setUp(self):
        """Set up test fixtures before each test method"""
        # Mock Lambda context
        self.mock_context = MagicMock()
        self.mock_context.function_name = "test-api-handler"
        self.mock_context.function_version = "1"
        self.mock_context.aws_request_id = "test-request-id-123"
        self.mock_context.memory_limit_in_mb = 128

        # Set environment variables for testing
        os.environ['ENVIRONMENT'] = 'test'
        os.environ['LOG_LEVEL'] = 'INFO'

    def create_api_gateway_event(self, method='GET', path='/', query_params=None, headers=None):
        """
        Create a mock API Gateway event

        Args:
            method (str): HTTP method
            path (str): Request path
            query_params (dict): Query parameters
            headers (dict): Request headers

        Returns:
            dict: Mock API Gateway event
        """
        return {
            "httpMethod": method,
            "path": path,
            "queryStringParameters": query_params,
            "headers": headers or {
                "User-Agent": "test-client/1.0",
                "Content-Type": "application/json"
            },
            "body": None,
            "isBase64Encoded": False,
            "requestContext": {
                "requestId": "test-request-123",
                "stage": "test"
            }
        }

    def test_successful_get_request_root_path(self):
        """Test successful GET request to root path"""
        # Arrange
        event = self.create_api_gateway_event(method='GET', path='/')

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 200)
        self.assertIn('Content-Type', response['headers'])
        self.assertEqual(response['headers']['Content-Type'], 'application/json')

        # Parse response body
        body = json.loads(response['body'])
        self.assertIn('message', body)
        self.assertIn('timestamp', body)
        self.assertIn('environment', body)
        self.assertIn('request_info', body)
        self.assertIn('lambda_info', body)

        # Verify request info
        self.assertEqual(body['request_info']['method'], 'GET')
        self.assertEqual(body['request_info']['path'], '/')
        self.assertEqual(body['environment'], 'test')

        # Verify lambda info
        self.assertEqual(body['lambda_info']['function_name'], 'test-api-handler')
        self.assertEqual(body['lambda_info']['request_id'], 'test-request-id-123')

    def test_health_check_endpoint(self):
        """Test health check endpoint"""
        # Arrange
        event = self.create_api_gateway_event(method='GET', path='/health')

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 200)

        body = json.loads(response['body'])
        self.assertIn('status', body)
        self.assertEqual(body['status'], 'healthy')
        self.assertIn('Service is running normally', body['message'])

    def test_info_endpoint(self):
        """Test info endpoint"""
        # Arrange
        event = self.create_api_gateway_event(method='GET', path='/info')

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 200)

        body = json.loads(response['body'])
        self.assertIn('Serverless application information', body['message'])

    def test_post_request_with_query_params(self):
        """Test POST request with query parameters"""
        # Arrange
        query_params = {"param1": "value1", "param2": "value2"}
        event = self.create_api_gateway_event(
            method='POST',
            path='/api/test',
            query_params=query_params
        )

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 200)

        body = json.loads(response['body'])
        self.assertEqual(body['request_info']['method'], 'POST')
        self.assertEqual(body['request_info']['path'], '/api/test')
        self.assertEqual(body['request_info']['query_parameters'], query_params)

    def test_cors_headers_present(self):
        """Test that CORS headers are present in response"""
        # Arrange
        event = self.create_api_gateway_event()

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        headers = response['headers']
        self.assertIn('Access-Control-Allow-Origin', headers)
        self.assertIn('Access-Control-Allow-Methods', headers)
        self.assertIn('Access-Control-Allow-Headers', headers)
        self.assertEqual(headers['Access-Control-Allow-Origin'], '*')

    def test_exception_handling(self):
        """Test exception handling in lambda function"""
        # Arrange - Create an event that might cause issues
        event = None  # This should cause an exception

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 500)

        body = json.loads(response['body'])
        self.assertIn('error', body)
        self.assertIn('Internal server error', body['error'])
        self.assertIn('request_id', body)

    def test_health_check_function(self):
        """Test standalone health check function"""
        # Act
        result = lambda_function.health_check()

        # Assert
        self.assertIn('status', result)
        self.assertEqual(result['status'], 'healthy')
        self.assertIn('timestamp', result)
        self.assertIn('service', result)
        self.assertEqual(result['service'], 'serverless-web-app')

    def test_response_structure_consistency(self):
        """Test that response structure is consistent across different requests"""
        # Arrange
        test_paths = ['/', '/health', '/info', '/api/test']

        for path in test_paths:
            with self.subTest(path=path):
                # Arrange
                event = self.create_api_gateway_event(path=path)

                # Act
                response = lambda_function.lambda_handler(event, self.mock_context)

                # Assert
                self.assertIn('statusCode', response)
                self.assertIn('headers', response)
                self.assertIn('body', response)
                self.assertEqual(response['statusCode'], 200)

                # Verify body is valid JSON
                body = json.loads(response['body'])
                self.assertIn('timestamp', body)
                self.assertIn('environment', body)

class TestAPIGatewayIntegration(unittest.TestCase):
    """Integration tests simulating API Gateway behavior"""

    def setUp(self):
        """Set up test fixtures"""
        self.mock_context = MagicMock()
        self.mock_context.function_name = "dev-api-handler"
        self.mock_context.function_version = "1"
        self.mock_context.aws_request_id = "integration-test-123"
        self.mock_context.memory_limit_in_mb = 128

    def test_api_gateway_proxy_integration(self):
        """Test API Gateway proxy integration simulation"""
        # Simulate API Gateway proxy integration event
        event = {
            "resource": "/{proxy+}",
            "path": "/api/users",
            "httpMethod": "GET",
            "headers": {
                "Accept": "application/json",
                "User-Agent": "Amazon CloudFront"
            },
            "queryStringParameters": {"limit": "10"},
            "pathParameters": {"proxy": "api/users"},
            "requestContext": {
                "requestId": "integration-test-request",
                "stage": "dev",
                "httpMethod": "GET"
            },
            "body": None,
            "isBase64Encoded": False
        }

        # Act
        response = lambda_function.lambda_handler(event, self.mock_context)

        # Assert
        self.assertEqual(response['statusCode'], 200)
        self.assertIn('application/json', response['headers']['Content-Type'])

        body = json.loads(response['body'])
        self.assertEqual(body['request_info']['method'], 'GET')
        self.assertEqual(body['request_info']['path'], '/api/users')
        self.assertIn('limit', body['request_info']['query_parameters'])

if __name__ == '__main__':
    # Run the tests
    unittest.main(verbosity=2)
```

## 6. Deployment Instructions

### Prerequisites

1. Install Pulumi CLI
2. Configure AWS credentials
3. Install Python dependencies

### Deployment Steps

```bash
# 1. Initialize the Pulumi project
pulumi new aws-python --name serverless-infra-pulumi --force

# 2. Install dependencies
pip install -r requirements.txt

# 3. Set the AWS region
pulumi config set aws:region us-west-2

# 4. Set environment (optional, defaults to 'dev')
pulumi config set environment dev

# 5. Deploy the infrastructure
pulumi up

# 6. Run tests
python -m pytest test_lambda.py -v

# 7. Test the deployed API
curl $(pulumi stack output api_gateway_url)
curl $(pulumi stack output api_gateway_url)/health
```

## Key Features & Best Practices Implemented

### ✅ **Architecture Compliance**

- **Lambda Function**: Python-based serverless function with proper error handling
- **API Gateway**: REST API with proxy integration for flexible routing
- **CloudWatch Logs**: Dedicated log group with cost-effective retention
- **IAM**: Least privilege roles and policies

### ✅ **Technical Requirements**

- **Pulumi Python SDK**: Complete infrastructure as code
- **AWS Region**: All resources in `us-west-2`
- **Naming Convention**: `{environment}-{function-name}` format
- **Tagging**: All resources tagged with `project:serverless-infra-pulumi`

### ✅ **Security & Efficiency**

- **IAM Best Practices**: Minimal required permissions
- **Cost Optimization**: 128MB memory, 30s timeout, 14-day log retention
- **CORS Support**: Proper headers for web client integration
- **Error Handling**: Comprehensive exception handling and logging

### ✅ **Testing & Validation**

- **Unit Tests**: Comprehensive test suite covering all scenarios
- **Integration Tests**: API Gateway proxy integration simulation
- **Health Checks**: Built-in health monitoring endpoints

This solution provides a robust, scalable, and cost-effective serverless web application infrastructure that follows AWS best practices and meets all specified requirements.
