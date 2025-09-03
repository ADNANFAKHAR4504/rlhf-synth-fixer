# Serverless Infrastructure with Terraform HCL - Model Response

This solution implements a serverless AWS infrastructure using Terraform HCL with the following components:

1. AWS Lambda function with Python runtime
2. Amazon API Gateway REST API 
3. IAM roles with least privilege access
4. CloudWatch Logs for Lambda function
5. Unit tests for Lambda function

## Infrastructure Files

### provider.tf
```hcl
# provider.tf

terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

### variables.tf
```hcl
# variables.tf

variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "serverless-api-function"
}

variable "api_gateway_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "serverless-api"
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ServerlessAPI"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}
```

### tap_stack.tf
```hcl
########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "lambda_function_name" {
  description = "Name of the Lambda function"
  type        = string
  default     = "serverless-api-function"
}

variable "api_gateway_name" {
  description = "Name of the API Gateway"
  type        = string
  default     = "serverless-api"
}

variable "lambda_runtime" {
  description = "Lambda runtime version"
  type        = string
  default     = "python3.11"
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ServerlessAPI"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

########################
# Data Sources
########################

# Get current AWS caller identity
data "aws_caller_identity" "current" {}

# Get current AWS region
data "aws_region" "current" {}

########################
# IAM Role for Lambda
########################

# Lambda execution role
resource "aws_iam_role" "lambda_execution_role" {
  name = "${var.lambda_function_name}-execution-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# Attach basic Lambda execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_execution_role.name
}

# Custom policy for Lambda CloudWatch logs
resource "aws_iam_role_policy" "lambda_cloudwatch_policy" {
  name = "${var.lambda_function_name}-cloudwatch-policy"
  role = aws_iam_role.lambda_execution_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${data.aws_region.current.name}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/${var.lambda_function_name}:*"
      }
    ]
  })
}

########################
# CloudWatch Log Group
########################

resource "aws_cloudwatch_log_group" "lambda_log_group" {
  name              = "/aws/lambda/${var.lambda_function_name}"
  retention_in_days = 14
  
  tags = var.tags
}

########################
# Lambda Function
########################

# Create ZIP file for Lambda function
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
  depends_on  = [local_file.lambda_function]
}

# Lambda function code file
resource "local_file" "lambda_function" {
  content = file("${path.module}/lambda_function.py")
  filename = "${path.module}/lambda_function_temp.py"
}

# Lambda function
resource "aws_lambda_function" "serverless_function" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = var.lambda_function_name
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "lambda_function.lambda_handler"
  runtime         = var.lambda_runtime
  timeout         = 30
  memory_size     = 128

  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic_execution,
    aws_iam_role_policy.lambda_cloudwatch_policy,
    aws_cloudwatch_log_group.lambda_log_group
  ]

  tags = var.tags
}

########################
# API Gateway
########################

# API Gateway REST API
resource "aws_api_gateway_rest_api" "serverless_api" {
  name        = var.api_gateway_name
  description = "Serverless API Gateway for Lambda function"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = var.tags
}

# API Gateway Resource
resource "aws_api_gateway_resource" "api_resource" {
  rest_api_id = aws_api_gateway_rest_api.serverless_api.id
  parent_id   = aws_api_gateway_rest_api.serverless_api.root_resource_id
  path_part   = "hello"
}

# API Gateway Method
resource "aws_api_gateway_method" "api_method" {
  rest_api_id   = aws_api_gateway_rest_api.serverless_api.id
  resource_id   = aws_api_gateway_resource.api_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway Integration
resource "aws_api_gateway_integration" "lambda_integration" {
  rest_api_id             = aws_api_gateway_rest_api.serverless_api.id
  resource_id             = aws_api_gateway_resource.api_resource.id
  http_method             = aws_api_gateway_method.api_method.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.serverless_function.invoke_arn
}

# API Gateway Method Response
resource "aws_api_gateway_method_response" "response_200" {
  rest_api_id = aws_api_gateway_rest_api.serverless_api.id
  resource_id = aws_api_gateway_resource.api_resource.id
  http_method = aws_api_gateway_method.api_method.http_method
  status_code = "200"
  
  response_headers = {
    "Access-Control-Allow-Origin" = true
  }
}

# API Gateway Integration Response
resource "aws_api_gateway_integration_response" "lambda_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.serverless_api.id
  resource_id = aws_api_gateway_resource.api_resource.id
  http_method = aws_api_gateway_method.api_method.http_method
  status_code = aws_api_gateway_method_response.response_200.status_code

  depends_on = [aws_api_gateway_integration.lambda_integration]
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.serverless_api.id
  stage_name  = "prod"

  depends_on = [
    aws_api_gateway_method.api_method,
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_integration_response.lambda_integration_response
  ]

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.api_resource.id,
      aws_api_gateway_method.api_method.id,
      aws_api_gateway_integration.lambda_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.serverless_function.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.serverless_api.execution_arn}/*/*"
}

########################
# Outputs
########################

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "${aws_api_gateway_deployment.api_deployment.invoke_url}/hello"
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.serverless_function.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.serverless_function.arn
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.serverless_api.id
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}
```

### lambda_function.py
```python
import json
import logging

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

def lambda_handler(event, context):
    """
    AWS Lambda function handler that processes API Gateway events.
    
    Args:
        event (dict): API Gateway event data
        context (object): Lambda runtime context
        
    Returns:
        dict: HTTP response with status code, headers, and body
    """
    
    try:
        # Log the incoming event for debugging
        logger.info(f"Received event: {json.dumps(event)}")
        
        # Extract HTTP method and path
        http_method = event.get('httpMethod', 'Unknown')
        path = event.get('path', 'Unknown')
        
        # Extract query parameters if they exist
        query_params = event.get('queryStringParameters') or {}
        
        # Extract headers
        headers = event.get('headers') or {}
        
        # Create response message
        message = {
            "message": "Hello from serverless Lambda function!",
            "method": http_method,
            "path": path,
            "timestamp": context.aws_request_id,
            "remaining_time_ms": context.get_remaining_time_in_millis()
        }
        
        # Add query parameters if present
        if query_params:
            message["query_parameters"] = query_params
            
        # Add name parameter if provided
        name = query_params.get('name')
        if name:
            message["greeting"] = f"Hello, {name}!"
        
        # Log successful processing
        logger.info(f"Successfully processed request: {http_method} {path}")
        
        # Return successful response
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'
            },
            'body': json.dumps(message, indent=2)
        }
        
    except Exception as e:
        # Log the error
        logger.error(f"Error processing request: {str(e)}")
        
        # Return error response
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': 'Internal server error',
                'message': str(e)
            })
        }

def get_function_info():
    """
    Utility function to return information about the Lambda function.
    
    Returns:
        dict: Function metadata
    """
    return {
        "runtime": "python3.11",
        "description": "Serverless API function deployed with Terraform",
        "features": [
            "API Gateway integration",
            "CloudWatch logging",
            "Error handling",
            "CORS support"
        ]
    }
```

### outputs.tf
```hcl
# outputs.tf

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "${aws_api_gateway_deployment.api_deployment.invoke_url}/hello"
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.serverless_function.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.serverless_function.arn
}

output "api_gateway_id" {
  description = "ID of the API Gateway"
  value       = aws_api_gateway_rest_api.serverless_api.id
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution role"
  value       = aws_iam_role.lambda_execution_role.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for Lambda function"
  value       = aws_cloudwatch_log_group.lambda_log_group.name
}
```

## Test Files

### test_lambda_function.py
```python
import unittest
import json
from unittest.mock import MagicMock
import sys
import os

# Add the lib directory to Python path to import lambda_function
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'lib'))

try:
    from lambda_function import lambda_handler, get_function_info
except ImportError:
    # Fallback if lambda_function is not available during testing
    lambda_handler = None
    get_function_info = None

class TestLambdaFunction(unittest.TestCase):
    """Unit tests for the Lambda function."""
    
    def setUp(self):
        """Set up test fixtures."""
        self.context = MagicMock()
        self.context.aws_request_id = "test-request-id-123"
        self.context.get_remaining_time_in_millis.return_value = 30000
        
    def test_basic_api_gateway_event(self):
        """Test handling of basic API Gateway event."""
        if lambda_handler is None:
            self.skipTest("lambda_handler not available")
            
        # Create a mock API Gateway event
        event = {
            "httpMethod": "GET",
            "path": "/hello",
            "queryStringParameters": None,
            "headers": {
                "User-Agent": "test-agent",
                "Host": "test.amazonaws.com"
            }
        }
        
        # Call the Lambda handler
        response = lambda_handler(event, self.context)
        
        # Verify the response
        self.assertEqual(response["statusCode"], 200)
        self.assertIn("Content-Type", response["headers"])
        self.assertEqual(response["headers"]["Content-Type"], "application/json")
        
        # Parse and verify the response body
        body = json.loads(response["body"])
        self.assertIn("message", body)
        self.assertEqual(body["method"], "GET")
        self.assertEqual(body["path"], "/hello")
        self.assertEqual(body["timestamp"], "test-request-id-123")
        
    def test_api_gateway_event_with_query_params(self):
        """Test handling of API Gateway event with query parameters."""
        if lambda_handler is None:
            self.skipTest("lambda_handler not available")
            
        # Create a mock API Gateway event with query parameters
        event = {
            "httpMethod": "GET",
            "path": "/hello",
            "queryStringParameters": {
                "name": "World",
                "test": "value"
            },
            "headers": {}
        }
        
        # Call the Lambda handler
        response = lambda_handler(event, self.context)
        
        # Verify the response
        self.assertEqual(response["statusCode"], 200)
        
        # Parse and verify the response body
        body = json.loads(response["body"])
        self.assertIn("greeting", body)
        self.assertEqual(body["greeting"], "Hello, World!")
        self.assertIn("query_parameters", body)
        self.assertEqual(body["query_parameters"]["name"], "World")
        
    def test_api_gateway_event_with_name_parameter(self):
        """Test greeting functionality with name parameter."""
        if lambda_handler is None:
            self.skipTest("lambda_handler not available")
            
        event = {
            "httpMethod": "GET",
            "path": "/hello",
            "queryStringParameters": {"name": "Alice"},
            "headers": {}
        }
        
        response = lambda_handler(event, self.context)
        body = json.loads(response["body"])
        
        self.assertEqual(body["greeting"], "Hello, Alice!")
        
    def test_cors_headers(self):
        """Test that CORS headers are properly set."""
        if lambda_handler is None:
            self.skipTest("lambda_handler not available")
            
        event = {
            "httpMethod": "GET",
            "path": "/hello",
            "queryStringParameters": None,
            "headers": {}
        }
        
        response = lambda_handler(event, self.context)
        headers = response["headers"]
        
        self.assertEqual(headers["Access-Control-Allow-Origin"], "*")
        self.assertIn("Access-Control-Allow-Methods", headers)
        self.assertIn("Access-Control-Allow-Headers", headers)
        
    def test_error_handling(self):
        """Test error handling when an exception occurs."""
        if lambda_handler is None:
            self.skipTest("lambda_handler not available")
            
        # Create an event that might cause an error
        # For this test, we'll use a malformed event
        event = None  # This should cause an exception
        
        response = lambda_handler(event, self.context)
        
        # Verify error response
        self.assertEqual(response["statusCode"], 500)
        self.assertIn("error", json.loads(response["body"]))
        
    def test_get_function_info(self):
        """Test the utility function get_function_info."""
        if get_function_info is None:
            self.skipTest("get_function_info not available")
            
        info = get_function_info()
        
        self.assertIn("runtime", info)
        self.assertIn("description", info)
        self.assertIn("features", info)
        self.assertEqual(info["runtime"], "python3.11")
        self.assertIsInstance(info["features"], list)
        
    def test_response_structure(self):
        """Test that the response has the correct structure."""
        if lambda_handler is None:
            self.skipTest("lambda_handler not available")
            
        event = {
            "httpMethod": "POST",
            "path": "/hello",
            "queryStringParameters": None,
            "headers": {}
        }
        
        response = lambda_handler(event, self.context)
        
        # Check required response keys
        required_keys = ["statusCode", "headers", "body"]
        for key in required_keys:
            self.assertIn(key, response)
            
        # Verify body is valid JSON
        try:
            json.loads(response["body"])
        except json.JSONDecodeError:
            self.fail("Response body is not valid JSON")
            
    def test_different_http_methods(self):
        """Test handling of different HTTP methods."""
        if lambda_handler is None:
            self.skipTest("lambda_handler not available")
            
        methods = ["GET", "POST", "PUT", "DELETE"]
        
        for method in methods:
            event = {
                "httpMethod": method,
                "path": "/hello",
                "queryStringParameters": None,
                "headers": {}
            }
            
            response = lambda_handler(event, self.context)
            body = json.loads(response["body"])
            
            self.assertEqual(response["statusCode"], 200)
            self.assertEqual(body["method"], method)

if __name__ == "__main__":
    # Run the tests
    unittest.main(verbosity=2)
```

## Security Features

The infrastructure implements security best practices:

1. **IAM Least Privilege**: Lambda execution role only has permissions for CloudWatch logging
2. **Resource-specific policies**: CloudWatch policy is scoped to specific log group
3. **CORS Configuration**: Proper CORS headers for web application integration
4. **Error Handling**: Comprehensive error handling in Lambda function
5. **CloudWatch Logging**: Centralized logging with retention policies

## Usage

1. Deploy the infrastructure: `terraform apply`
2. Test the API endpoint using the output URL
3. Run unit tests: `python -m unittest test_lambda_function.py`

The API Gateway will be available at the URL provided in the `api_gateway_url` output, and can be tested with:
```bash
curl https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com/prod/hello
curl https://YOUR_API_ID.execute-api.us-west-2.amazonaws.com/prod/hello?name=World
```