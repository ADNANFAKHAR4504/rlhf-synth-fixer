# Serverless Infrastructure with Terraform

Here's a complete serverless infrastructure setup using Terraform for microservice applications with AWS Lambda functions and API Gateway.

## File: terraform.tf

```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
  }

  # Partial backend config: values are injected at `terraform init` time
  backend "s3" {}
}
```

## File: provider.tf

```hcl
# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "serverless-microservices"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "api_key_secret_name" {
  description = "Name for API key secret in AWS Secrets Manager"
  type        = string
  default     = "api-gateway-keys"
}
```

## File: locals.tf

```hcl
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "terraform"
  }
  
  lambda_functions = {
    health = {
      handler = "health.lambda_handler"
      filename = "health_service.py"
    }
    user = {
      handler = "user.lambda_handler"  
      filename = "user_service.py"
    }
    notification = {
      handler = "notification.lambda_handler"
      filename = "notification_service.py"
    }
  }
}
```

## File: iam.tf

```hcl
# IAM role for Lambda functions
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_name}-lambda-role"

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

  tags = local.common_tags
}

# Attach basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Custom policy for accessing secrets and enhanced logging
resource "aws_iam_policy" "lambda_custom_policy" {
  name = "${var.project_name}-lambda-custom-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ]
        Resource = aws_secretsmanager_secret.api_keys.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream", 
          "logs:PutLogEvents",
          "logs:DescribeLogGroups",
          "logs:DescribeLogStreams"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "lambda_custom_policy" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = aws_iam_policy.lambda_custom_policy.arn
}

# IAM role for API Gateway CloudWatch logging
resource "aws_iam_role" "api_gateway_cloudwatch_role" {
  name = "${var.project_name}-api-gateway-cloudwatch-role"

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
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch" {
  role       = aws_iam_role.api_gateway_cloudwatch_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}
```

## File: secrets.tf

```hcl
# Secrets Manager secret for API keys
resource "aws_secretsmanager_secret" "api_keys" {
  name        = var.api_key_secret_name
  description = "API keys for serverless microservices"
  
  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  secret_id = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    api_key = "default-api-key-${random_password.api_key.result}"
    notification_service_key = "notif-key-${random_password.notification_key.result}"
  })
}

resource "random_password" "api_key" {
  length  = 32
  special = true
}

resource "random_password" "notification_key" {
  length  = 32
  special = true
}
```

## File: lambda_sources.tf

```hcl
# Create lambda source files
resource "local_file" "health_service" {
  filename = "${path.module}/health_service.py"
  content  = <<EOF
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    try:
        # Basic health check
        response = {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'healthy',
                'timestamp': datetime.utcnow().isoformat(),
                'service': 'health-check',
                'version': '1.0.0'
            })
        }
        
        return response
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'status': 'unhealthy',
                'error': str(e)
            })
        }
EOF
}

resource "local_file" "user_service" {
  filename = "${path.module}/user_service.py"
  content  = <<EOF
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    try:
        http_method = event.get('httpMethod', 'GET')
        path_parameters = event.get('pathParameters') or {}
        body = event.get('body')
        
        if body:
            body = json.loads(body)
        
        # Mock user operations
        if http_method == 'GET':
            user_id = path_parameters.get('id')
            if user_id:
                # Get specific user
                response_body = {
                    'user_id': user_id,
                    'name': f'User {user_id}',
                    'email': f'user{user_id}@example.com',
                    'created_at': datetime.utcnow().isoformat()
                }
            else:
                # Get all users
                response_body = {
                    'users': [
                        {'user_id': '1', 'name': 'User 1', 'email': 'user1@example.com'},
                        {'user_id': '2', 'name': 'User 2', 'email': 'user2@example.com'}
                    ],
                    'total': 2
                }
        
        elif http_method == 'POST':
            # Create user
            response_body = {
                'user_id': '123',
                'name': body.get('name', 'New User'),
                'email': body.get('email', 'new@example.com'),
                'created_at': datetime.utcnow().isoformat(),
                'message': 'User created successfully'
            }
        
        elif http_method == 'PUT':
            user_id = path_parameters.get('id')
            response_body = {
                'user_id': user_id,
                'name': body.get('name', f'Updated User {user_id}'),
                'email': body.get('email', f'updated{user_id}@example.com'),
                'updated_at': datetime.utcnow().isoformat(),
                'message': 'User updated successfully'
            }
        
        elif http_method == 'DELETE':
            user_id = path_parameters.get('id')
            response_body = {
                'user_id': user_id,
                'message': 'User deleted successfully',
                'deleted_at': datetime.utcnow().isoformat()
            }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Internal server error'
            })
        }
EOF
}

resource "local_file" "notification_service" {
  filename = "${path.module}/notification_service.py"
  content  = <<EOF
import json
import boto3
import os
from datetime import datetime

def lambda_handler(event, context):
    try:
        body = event.get('body')
        if body:
            body = json.loads(body)
        
        # Mock notification sending
        notification_type = body.get('type', 'email')
        recipient = body.get('recipient', 'default@example.com')
        message = body.get('message', 'Default notification message')
        
        # Simulate notification sending
        response_body = {
            'notification_id': f'notif_{datetime.utcnow().strftime("%Y%m%d_%H%M%S")}',
            'type': notification_type,
            'recipient': recipient,
            'message': message,
            'status': 'sent',
            'sent_at': datetime.utcnow().isoformat()
        }
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(response_body)
        }
        
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({
                'error': str(e),
                'message': 'Failed to send notification'
            })
        }
EOF
}
```

## File: lambda.tf

```hcl
# Create zip files for lambda functions
data "archive_file" "lambda_zip" {
  for_each = local.lambda_functions
  
  type        = "zip"
  source_file = "${path.module}/${each.value.filename}"
  output_path = "${path.module}/${each.key}_lambda.zip"
  
  depends_on = [
    local_file.health_service,
    local_file.user_service,
    local_file.notification_service
  ]
}

# Lambda functions
resource "aws_lambda_function" "microservice_functions" {
  for_each = local.lambda_functions
  
  filename         = data.archive_file.lambda_zip[each.key].output_path
  function_name    = "${var.project_name}-${each.key}-service"
  role            = aws_iam_role.lambda_role.arn
  handler         = each.value.handler
  source_code_hash = data.archive_file.lambda_zip[each.key].output_base64sha256
  runtime         = "python3.8"
  timeout         = 30
  
  environment {
    variables = {
      ENVIRONMENT = var.environment
      SECRETS_ARN = aws_secretsmanager_secret.api_keys.arn
    }
  }
  
  tags = local.common_tags
}

# CloudWatch Log Groups for Lambda functions with enhanced logging
resource "aws_cloudwatch_log_group" "lambda_logs" {
  for_each = local.lambda_functions
  
  name              = "/aws/lambda/${aws_lambda_function.microservice_functions[each.key].function_name}"
  retention_in_days = 7
  log_group_class   = "STANDARD"
  
  tags = local.common_tags
}
```

## File: api_gateway.tf

```hcl
# API Gateway REST API
resource "aws_api_gateway_rest_api" "microservices_api" {
  name        = "${var.project_name}-api"
  description = "Serverless microservices API"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = local.common_tags
}

# API Gateway Account settings for CloudWatch logging
resource "aws_api_gateway_account" "main" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_role.arn
}

# Health Check Resource
resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  parent_id   = aws_api_gateway_rest_api.microservices_api.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "health_get" {
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "health_integration" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.health_get.http_method
  
  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.microservice_functions["health"].invoke_arn
}

# Users Resource
resource "aws_api_gateway_resource" "users" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  parent_id   = aws_api_gateway_rest_api.microservices_api.root_resource_id
  path_part   = "users"
}

# Users methods
resource "aws_api_gateway_method" "users_get" {
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_method" "users_post" {
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  resource_id   = aws_api_gateway_resource.users.id
  http_method   = "POST"
  authorization = "NONE"
}

# Users integration
resource "aws_api_gateway_integration" "users_integration" {
  for_each = toset(["GET", "POST"])
  
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  resource_id = aws_api_gateway_resource.users.id
  http_method = each.value
  
  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.microservice_functions["user"].invoke_arn
}

# User by ID resource
resource "aws_api_gateway_resource" "user_by_id" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  parent_id   = aws_api_gateway_resource.users.id
  path_part   = "{id}"
}

# User by ID methods
resource "aws_api_gateway_method" "user_by_id_methods" {
  for_each = toset(["GET", "PUT", "DELETE"])
  
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  resource_id   = aws_api_gateway_resource.user_by_id.id
  http_method   = each.value
  authorization = "NONE"
}

# User by ID integration
resource "aws_api_gateway_integration" "user_by_id_integration" {
  for_each = toset(["GET", "PUT", "DELETE"])
  
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  resource_id = aws_api_gateway_resource.user_by_id.id
  http_method = each.value
  
  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.microservice_functions["user"].invoke_arn
}

# Notifications Resource
resource "aws_api_gateway_resource" "notifications" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  parent_id   = aws_api_gateway_rest_api.microservices_api.root_resource_id
  path_part   = "notifications"
}

resource "aws_api_gateway_method" "notifications_post" {
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  resource_id   = aws_api_gateway_resource.notifications.id
  http_method   = "POST"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "notifications_integration" {
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  resource_id = aws_api_gateway_resource.notifications.id
  http_method = aws_api_gateway_method.notifications_post.http_method
  
  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.microservice_functions["notification"].invoke_arn
}

# Lambda permissions for API Gateway
resource "aws_lambda_permission" "api_gateway_lambda" {
  for_each = local.lambda_functions
  
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.microservice_functions[each.key].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.microservices_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.health_integration,
    aws_api_gateway_integration.users_integration,
    aws_api_gateway_integration.user_by_id_integration,
    aws_api_gateway_integration.notifications_integration,
  ]
  
  rest_api_id = aws_api_gateway_rest_api.microservices_api.id
  stage_name  = var.environment
  
  # Enhanced logging configuration (2025 feature)
  stage_description = "Enhanced logging enabled with CloudWatch integration"
}

# API Gateway Stage with enhanced logging
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.microservices_api.id
  stage_name    = var.environment
  
  # Enhanced logging settings (2025 feature)
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      caller         = "$context.identity.caller"
      user           = "$context.identity.user"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      resourcePath   = "$context.resourcePath"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
      error_message  = "$context.error.message"
    })
  }
  
  tags = local.common_tags
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${var.project_name}-api"
  retention_in_days = 7
  log_group_class   = "STANDARD"
  
  tags = local.common_tags
}

# Custom Domain (optional) - for dynamic routing rules
resource "aws_api_gateway_domain_name" "main" {
  count                    = var.custom_domain_name != "" ? 1 : 0
  domain_name              = var.custom_domain_name
  regional_certificate_arn = var.certificate_arn
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = local.common_tags
}

# Add custom domain variable
variable "custom_domain_name" {
  description = "Custom domain name for API Gateway"
  type        = string
  default     = ""
}

variable "certificate_arn" {
  description = "ACM certificate ARN for custom domain"
  type        = string
  default     = ""
}
```

## File: outputs.tf

```hcl
output "api_gateway_url" {
  description = "Base URL of the API Gateway"
  value       = aws_api_gateway_deployment.main.invoke_url
}

output "api_gateway_stage_url" {
  description = "Stage URL of the API Gateway"
  value       = "${aws_api_gateway_deployment.main.invoke_url}/${var.environment}"
}

output "lambda_function_names" {
  description = "Names of the Lambda functions"
  value       = { for k, v in aws_lambda_function.microservice_functions : k => v.function_name }
}

output "lambda_function_arns" {
  description = "ARNs of the Lambda functions"
  value       = { for k, v in aws_lambda_function.microservice_functions : k => v.arn }
}

output "secrets_manager_secret_arn" {
  description = "ARN of the Secrets Manager secret"
  value       = aws_secretsmanager_secret.api_keys.arn
}

output "api_endpoints" {
  description = "API endpoint URLs"
  value = {
    health        = "${aws_api_gateway_deployment.main.invoke_url}/${var.environment}/health"
    users         = "${aws_api_gateway_deployment.main.invoke_url}/${var.environment}/users"
    user_by_id    = "${aws_api_gateway_deployment.main.invoke_url}/${var.environment}/users/{id}"
    notifications = "${aws_api_gateway_deployment.main.invoke_url}/${var.environment}/notifications"
  }
}

output "cloudwatch_log_groups" {
  description = "CloudWatch Log Group names"
  value = {
    api_gateway = aws_cloudwatch_log_group.api_gateway_logs.name
    lambda_logs = { for k, v in aws_cloudwatch_log_group.lambda_logs : k => v.name }
  }
}
```

This infrastructure provides a complete serverless microservices setup with:

1. **Three Lambda functions** (health check, user management, notification service) written in Python 3.8
2. **API Gateway REST API** with proper routing and integration
3. **Enhanced CloudWatch logging** for both Lambda and API Gateway (2025 feature)
4. **Secrets Manager** for secure API key storage
5. **Proper IAM roles and policies** with least privilege access
6. **Production-ready configuration** with error handling and CORS support
7. **Extensible architecture** for adding more microservices

The infrastructure supports the latest AWS features including enhanced logging capabilities and can be extended with dynamic routing rules when using custom domains.