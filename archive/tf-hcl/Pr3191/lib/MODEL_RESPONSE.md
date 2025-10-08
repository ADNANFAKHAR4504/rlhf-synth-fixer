### Reasoning Trace
---

The user is asking for a Terraform configuration for a serverless API with the following requirements:

1. API Gateway REST API with CRUD operations on /users
2. Lambda functions for handling CRUD operations (Python 3.9)
3. DynamoDB table for storing user data (on-demand billing)
4. SSM Parameter Store for configuration
5. Least-privilege IAM roles
6. CloudWatch logging and basic alarms
7. Region: us-east-1
8. Common tags on all resources

The code needs to be organized into three files:
- providers.tf
- variables.tf  
- main.tf

Let me structure this properly:

1. providers.tf - AWS provider configuration
2. variables.tf - Input variables with defaults
3. main.tf - All resources

Key points to ensure:
- API Gateway with proper Lambda proxy integration
- Lambda functions with environment variables pointing to SSM and DynamoDB
- IAM policies with least privilege
- CloudWatch logs for both API Gateway and Lambda
- Basic CloudWatch alarms for 5XX errors and Lambda errors
- Proper outputs

Let me start building the configuration:
### Answer 
---

I'll generate a complete serverless API infrastructure for user registrations and profiles. Here's the Terraform configuration split into three files as requested:

```hcl
# providers.tf
terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
  
  # Optional backend configuration - update with your values
  # backend "s3" {
  #   bucket = "your-terraform-state-bucket"
  #   key    = "user-api/terraform.tfstate"
  #   region = "us-east-1"
  # }
}

provider "aws" {
  region = var.aws_region
}
```

```hcl
# variables.tf
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Environment = "dev"
    Project     = "user-api"
    ManagedBy   = "terraform"
  }
}

variable "dynamodb_table_name" {
  description = "Name of the DynamoDB users table"
  type        = string
  default     = "users"
}

variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "dev"
}

variable "ssm_parameter_prefix" {
  description = "SSM parameter prefix for app configuration"
  type        = string
  default     = "/dev/api"
}

variable "app_name" {
  description = "Application name"
  type        = string
  default     = "user-registration-api"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 30
}

variable "lambda_memory" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 256
}
```

```hcl
# main.tf

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/api-gateway/${var.app_name}"
  retention_in_days = 7
  tags              = var.common_tags
}

# DynamoDB Table for users
resource "aws_dynamodb_table" "users" {
  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "user_id"

  attribute {
    name = "user_id"
    type = "S"
  }

  tags = var.common_tags
}

# SSM Parameter for app configuration (example)
resource "aws_ssm_parameter" "app_name" {
  name  = "${var.ssm_parameter_prefix}/APP_NAME"
  type  = "String"
  value = var.app_name
  tags  = var.common_tags
}

# IAM role for Lambda execution
resource "aws_iam_role" "lambda_role" {
  name = "${var.app_name}-lambda-role"

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

  tags = var.common_tags
}

# IAM policy for Lambda - DynamoDB access
resource "aws_iam_policy" "lambda_dynamodb_policy" {
  name        = "${var.app_name}-lambda-dynamodb"
  description = "Policy for Lambda to access DynamoDB users table"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = aws_dynamodb_table.users.arn
      }
    ]
  })
}

# IAM policy for Lambda - SSM access
resource "aws_iam_policy" "lambda_ssm_policy" {
  name        = "${var.app_name}-lambda-ssm"
  description = "Policy for Lambda to read SSM parameters"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "ssm:GetParameter",
          "ssm:GetParameters"
        ]
        Resource = "arn:aws:ssm:${var.aws_region}:${data.aws_caller_identity.current.account_id}:parameter${var.ssm_parameter_prefix}/*"
      }
    ]
  })
}

# Data source for AWS account ID
data "aws_caller_identity" "current" {}

# Attach AWS managed policy for basic Lambda execution
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# Attach custom policies to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_dynamodb" {
  policy_arn = aws_iam_policy.lambda_dynamodb_policy.arn
  role       = aws_iam_role.lambda_role.name
}

resource "aws_iam_role_policy_attachment" "lambda_ssm" {
  policy_arn = aws_iam_policy.lambda_ssm_policy.arn
  role       = aws_iam_role.lambda_role.name
}

# Lambda function code (inline for demonstration)
locals {
  lambda_code = <<-EOT
import json
import boto3
import os
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

def decimal_default(obj):
    if isinstance(obj, Decimal):
        return float(obj)
    raise TypeError

def handler(event, context):
    method = event['httpMethod']
    path = event['path']
    
    try:
        if method == 'GET' and 'id' in path:
            user_id = event['pathParameters']['id']
            response = table.get_item(Key={'user_id': user_id})
            if 'Item' in response:
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps(response['Item'], default=decimal_default)
                }
            else:
                return {
                    'statusCode': 404,
                    'headers': {'Content-Type': 'application/json'},
                    'body': json.dumps({'message': 'User not found'})
                }
        
        elif method == 'POST':
            body = json.loads(event['body'])
            table.put_item(Item=body)
            return {
                'statusCode': 201,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'User created', 'user_id': body.get('user_id')})
            }
        
        elif method == 'PUT' and 'id' in path:
            user_id = event['pathParameters']['id']
            body = json.loads(event['body'])
            body['user_id'] = user_id
            table.put_item(Item=body)
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'User updated'})
            }
        
        elif method == 'DELETE' and 'id' in path:
            user_id = event['pathParameters']['id']
            table.delete_item(Key={'user_id': user_id})
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'User deleted'})
            }
        
        else:
            return {
                'statusCode': 400,
                'headers': {'Content-Type': 'application/json'},
                'body': json.dumps({'message': 'Invalid request'})
            }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {'Content-Type': 'application/json'},
            'body': json.dumps({'message': str(e)})
        }
EOT
}

# Create zip file for Lambda deployment
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "lambda_function.zip"
  
  source {
    content  = local.lambda_code
    filename = "lambda_function.py"
  }
}

# Lambda function for user CRUD operations
resource "aws_lambda_function" "user_crud" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${var.app_name}-user-crud"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda_function.handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.9"
  timeout         = var.lambda_timeout
  memory_size     = var.lambda_memory

  environment {
    variables = {
      DYNAMODB_TABLE       = aws_dynamodb_table.users.name
      SSM_PARAMETER_PREFIX = var.ssm_parameter_prefix
    }
  }

  tags = var.common_tags
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${aws_lambda_function.user_crud.function_name}"
  retention_in_days = 7
  tags              = var.common_tags
}

# REST API Gateway
resource "aws_api_gateway_rest_api" "user_api" {
  name        = var.app_name
  description = "User Registration and Profile API"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = var.common_tags
}

# API Gateway Resources
resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.user_api.id
  parent_id   = aws_api_gateway_rest_api.user_api.root_resource_id
  path_part   = "users"
}

resource "aws_api_gateway_resource" "user_id" {
  rest_api_id = aws_api_gateway_rest_api.user_api.id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "{id}"
}

# API Gateway Methods
resource "aws_api_gateway_method" "post_users" {
  rest_api_id   = aws_api_gateway_rest_api.user_api.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "get_user" {
  rest_api_id   = aws_api_gateway_rest_api.user_api.id
  resource_id   = aws_api_gateway_resource.user_id.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "put_user" {
  rest_api_id   = aws_api_gateway_rest_api.user_api.id
  resource_id   = aws_api_gateway_resource.user_id.id
  http_method   = "PUT"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "delete_user" {
  rest_api_id   = aws_api_gateway_rest_api.user_api.id
  resource_id   = aws_api_gateway_resource.user_id.id
  http_method   = "DELETE"
  authorization = "NONE"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.user_crud.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.user_api.execution_arn}/*/*"
}

# API Gateway Integrations
resource "aws_api_gateway_integration" "post_users_lambda" {
  rest_api_id = aws_api_gateway_rest_api.user_api.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = aws_api_gateway_method.post_users.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.user_crud.invoke_arn
}

resource "aws_api_gateway_integration" "get_user_lambda" {
  rest_api_id = aws_api_gateway_rest_api.user_api.id
  resource_id = aws_api_gateway_resource.user_id.id
  http_method = aws_api_gateway_method.get_user.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.user_crud.invoke_arn
}

resource "aws_api_gateway_integration" "put_user_lambda" {
  rest_api_id = aws_api_gateway_rest_api.user_api.id
  resource_id = aws_api_gateway_resource.user_id.id
  http_method = aws_api_gateway_method.put_user.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.user_crud.invoke_arn
}

resource "aws_api_gateway_integration" "delete_user_lambda" {
  rest_api_id = aws_api_gateway_rest_api.user_api.id
  resource_id = aws_api_gateway_resource.user_id.id
  http_method = aws_api_gateway_method.delete_user.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.user_crud.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "api_deployment" {
  depends_on = [
    aws_api_gateway_integration.post_users_lambda,
    aws_api_gateway_integration.get_user_lambda,
    aws_api_gateway_integration.put_user_lambda,
    aws_api_gateway_integration.delete_user_lambda
  ]

  rest_api_id = aws_api_gateway_rest_api.user_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.users.id,
      aws_api_gateway_resource.user_id.id,
      aws_api_gateway_method.post_users.id,
      aws_api_gateway_method.get_user.id,
      aws_api_gateway_method.put_user.id,
      aws_api_gateway_method.delete_user.id,
      aws_api_gateway_integration.post_users_lambda.id,
      aws_api_gateway_integration.get_user_lambda.id,
      aws_api_gateway_integration.put_user_lambda.id,
      aws_api_gateway_integration.delete_user_lambda.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage with access logging
resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.user_api.id
  stage_name    = var.api_stage_name

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      error          = "$context.error.message"
    })
  }

  tags = var.common_tags
}

# IAM role for API Gateway CloudWatch logging
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "${var.app_name}-api-gateway-cloudwatch"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = var.common_tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# API Gateway account configuration for CloudWatch logging
resource "aws_api_gateway_account" "api_gateway_account" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
}

# CloudWatch Metric Alarm for API Gateway 5XX errors
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${var.app_name}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors 5xx errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.user_api.name
    Stage   = aws_api_gateway_stage.api_stage.stage_name
  }

  tags = var.common_tags
}

# CloudWatch Metric Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.app_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors lambda errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.user_crud.function_name
  }

  tags = var.common_tags
}

# Outputs
output "api_invoke_url" {
  description = "API Gateway invoke URL"
  value       = aws_api_gateway_stage.api_stage.invoke_url
}

output "api_execution_arn" {
  description = "API Gateway execution ARN"
  value       = aws_api_gateway_rest_api.user_api.execution_arn
}

output "dynamodb_table_name" {
  description = "DynamoDB table name"
  value       = aws_dynamodb_table.users.name
}

output "lambda_function_name" {
  description = "Lambda function name"
  value       = aws_lambda_function.user_crud.function_name
}
```

This Terraform configuration provides:

## Key Features:

1. **API Gateway REST API** with full CRUD operations:
   - POST /users - Create user
   - GET /users/{id} - Get user by ID
   - PUT /users/{id} - Update user
   - DELETE /users/{id} - Delete user

2. **Security & IAM**:
   - Least-privilege IAM roles for Lambda
   - Lambda can only access the specific DynamoDB table
   - Lambda can only read SSM parameters under the specified prefix
   - API Gateway has its own role for CloudWatch logging

3. **Cost Optimization**:
   - DynamoDB with PAY_PER_REQUEST billing mode
   - Minimal Lambda memory (256MB) and timeout (30s)
   - 7-day CloudWatch log retention

4. **Observability**:
   - CloudWatch logs for both API Gateway and Lambda
   - Access logs for API Gateway with detailed request information
   - CloudWatch alarms for API 5XX errors and Lambda errors

5. **Configuration Management**:
   - SSM Parameter Store for application configuration
   - Environment variables in Lambda pointing to resources

The Lambda function handles all CRUD operations in a single function to minimize cold starts and reduce costs. The implementation returns proper HTTP status codes and JSON responses for all operations.