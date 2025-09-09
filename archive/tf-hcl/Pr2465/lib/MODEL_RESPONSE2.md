You're right! The Lambda function should be inline. Let me fix that error by embedding the Lambda code directly in the Terraform configuration.

```hcl
# tap-stack.tf

# Variables for configuration
variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "tap-api"
}

variable "environment" {
  description = "Environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "devops-team"
}

variable "db_read_capacity" {
  description = "DynamoDB read capacity units"
  type        = number
  default     = 5
}

variable "db_write_capacity" {
  description = "DynamoDB write capacity units"
  type        = number
  default     = 5
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days"
  type        = number
  default     = 14
}

# Local values for consistent naming and tagging
locals {
  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    Owner       = var.owner
    ManagedBy   = "terraform"
  }
  
  name_prefix = "${var.project_name}-${var.environment}"
}

# DynamoDB Table
resource "aws_dynamodb_table" "main_table" {
  name           = "${local.name_prefix}-data"
  billing_mode   = "PROVISIONED"
  read_capacity  = var.db_read_capacity
  write_capacity = var.db_write_capacity
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # Enable point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # Prevent accidental deletion
  lifecycle {
    prevent_destroy = true
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-dynamodb-table"
  })
}

# IAM Role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${local.name_prefix}-lambda-role"

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

# IAM Policy for Lambda - Basic execution
resource "aws_iam_role_policy_attachment" "lambda_basic_execution" {
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
  role       = aws_iam_role.lambda_role.name
}

# IAM Policy for DynamoDB access - least privilege
resource "aws_iam_role_policy" "lambda_dynamodb_policy" {
  name = "${local.name_prefix}-lambda-dynamodb-policy"
  role = aws_iam_role.lambda_role.id

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
        Resource = aws_dynamodb_table.main_table.arn
      }
    ]
  })
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda_logs" {
  name              = "/aws/lambda/${local.name_prefix}-api-handler"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-logs"
  })
}

# Create Lambda deployment package with inline code
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "lambda_function.zip"
  
  source {
    content = <<EOF
const AWS = require('aws-sdk');
const dynamodb = new AWS.DynamoDB.DocumentClient();

const TABLE_NAME = process.env.DYNAMODB_TABLE_NAME;

exports.handler = async (event) => {
    console.log('Event:', JSON.stringify(event, null, 2));
    
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS'
    };

    try {
        const httpMethod = event.httpMethod;
        
        switch (httpMethod) {
            case 'GET':
                return await handleGet(event, headers);
            case 'POST':
                return await handlePost(event, headers);
            case 'OPTIONS':
                return {
                    statusCode: 200,
                    headers: headers,
                    body: JSON.stringify({ message: 'CORS preflight' })
                };
            default:
                return {
                    statusCode: 405,
                    headers: headers,
                    body: JSON.stringify({ error: 'Method not allowed' })
                };
        }
    } catch (error) {
        console.error('Error:', error);
        return {
            statusCode: 500,
            headers: headers,
            body: JSON.stringify({ 
                error: 'Internal server error',
                message: error.message 
            })
        };
    }
};

async function handleGet(event, headers) {
    const params = {
        TableName: TABLE_NAME
    };
    
    const result = await dynamodb.scan(params).promise();
    
    return {
        statusCode: 200,
        headers: headers,
        body: JSON.stringify({
            items: result.Items,
            count: result.Count
        })
    };
}

async function handlePost(event, headers) {
    const body = JSON.parse(event.body || '{}');
    
    if (!body.data) {
        return {
            statusCode: 400,
            headers: headers,
            body: JSON.stringify({ error: 'Missing required field: data' })
        };
    }
    
    const item = {
        id: generateId(),
        data: body.data,
        timestamp: new Date().toISOString(),
        source_ip: event.requestContext?.identity?.sourceIp || 'unknown'
    };
    
    const params = {
        TableName: TABLE_NAME,
        Item: item
    };
    
    await dynamodb.put(params).promise();
    
    return {
        statusCode: 201,
        headers: headers,
        body: JSON.stringify({
            message: 'Item created successfully',
            item: item
        })
    };
}

function generateId() {
    return Date.now().toString() + '-' + Math.random().toString(36).substr(2, 9);
}
EOF
    filename = "index.js"
  }
}

# Lambda Function
resource "aws_lambda_function" "api_handler" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "${local.name_prefix}-api-handler"
  role            = aws_iam_role.lambda_role.arn
  handler         = "index.handler"
  runtime         = "nodejs18.x"
  timeout         = 30
  memory_size     = 256
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256

  depends_on = [
    aws_cloudwatch_log_group.lambda_logs,
    data.archive_file.lambda_zip
  ]

  environment {
    variables = {
      DYNAMODB_TABLE_NAME = aws_dynamodb_table.main_table.name
      ENVIRONMENT        = var.environment
      PROJECT_NAME       = var.project_name
    }
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-lambda-function"
  })
}

# API Gateway REST API
resource "aws_api_gateway_rest_api" "main_api" {
  name        = "${local.name_prefix}-api"
  description = "Serverless API for ${var.project_name}"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-gateway"
  })
}

# API Gateway Resource (for /items path)
resource "aws_api_gateway_resource" "items_resource" {
  rest_api_id = aws_api_gateway_rest_api.main_api.id
  parent_id   = aws_api_gateway_rest_api.main_api.root_resource_id
  path_part   = "items"
}

# API Gateway Method - GET
resource "aws_api_gateway_method" "get_method" {
  rest_api_id   = aws_api_gateway_rest_api.main_api.id
  resource_id   = aws_api_gateway_resource.items_resource.id
  http_method   = "GET"
  authorization = "NONE"
}

# API Gateway Method - POST
resource "aws_api_gateway_method" "post_method" {
  rest_api_id   = aws_api_gateway_rest_api.main_api.id
  resource_id   = aws_api_gateway_resource.items_resource.id
  http_method   = "POST"
  authorization = "NONE"
}

# API Gateway Method - OPTIONS (for CORS)
resource "aws_api_gateway_method" "options_method" {
  rest_api_id   = aws_api_gateway_rest_api.main_api.id
  resource_id   = aws_api_gateway_resource.items_resource.id
  http_method   = "OPTIONS"
  authorization = "NONE"
}

# Lambda Integration - GET
resource "aws_api_gateway_integration" "get_integration" {
  rest_api_id = aws_api_gateway_rest_api.main_api.id
  resource_id = aws_api_gateway_resource.items_resource.id
  http_method = aws_api_gateway_method.get_method.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# Lambda Integration - POST
resource "aws_api_gateway_integration" "post_integration" {
  rest_api_id = aws_api_gateway_rest_api.main_api.id
  resource_id = aws_api_gateway_resource.items_resource.id
  http_method = aws_api_gateway_method.post_method.http_method

  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.api_handler.invoke_arn
}

# CORS Integration - OPTIONS
resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id = aws_api_gateway_rest_api.main_api.id
  resource_id = aws_api_gateway_resource.items_resource.id
  http_method = aws_api_gateway_method.options_method.http_method

  type = "MOCK"
  
  request_templates = {
    "application/json" = jsonencode({
      statusCode = 200
    })
  }
}

# CORS Method Response - OPTIONS
resource "aws_api_gateway_method_response" "options_response" {
  rest_api_id = aws_api_gateway_rest_api.main_api.id
  resource_id = aws_api_gateway_resource.items_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }
}

# CORS Integration Response - OPTIONS
resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id = aws_api_gateway_rest_api.main_api.id
  resource_id = aws_api_gateway_resource.items_resource.id
  http_method = aws_api_gateway_method.options_method.http_method
  status_code = aws_api_gateway_method_response.options_response.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,POST,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }
}

# Lambda Permission for API Gateway
resource "aws_lambda_permission" "api_gateway_lambda" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main_api.execution_arn}/*/*"
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main_deployment" {
  depends_on = [
    aws_api_gateway_integration.get_integration,
    aws_api_gateway_integration.post_integration,
    aws_api_gateway_integration.options_integration,
  ]

  rest_api_id = aws_api_gateway_rest_api.main_api.id

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.items_resource.id,
      aws_api_gateway_method.get_method.id,
      aws_api_gateway_method.post_method.id,
      aws_api_gateway_method.options_method.id,
      aws_api_gateway_integration.get_integration.id,
      aws_api_gateway_integration.post_integration.id,
      aws_api_gateway_integration.options_integration.id,
    ]))
  }

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage - Development
resource "aws_api_gateway_stage" "dev_stage" {
  deployment_id = aws_api_gateway_deployment.main_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.main_api.id
  stage_name    = "dev"

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip            = "$context.identity.sourceIp"
      caller        = "$context.identity.caller"
      user          = "$context.identity.user"
      requestTime   = "$context.requestTime"
      httpMethod    = "$context.httpMethod"
      resourcePath  = "$context.resourcePath"
      status        = "$context.status"
      protocol      = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-stage-dev"
  })
}

# API Gateway Stage - Production
resource "aws_api_gateway_stage" "prod_stage" {
  deployment_id = aws_api_gateway_deployment.main_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.main_api.id
  stage_name    = "prod"

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip            = "$context.identity.sourceIp"
      caller        = "$context.identity.caller"
      user          = "$context.identity.user"
      requestTime   = "$context.requestTime"
      httpMethod    = "$context.httpMethod"
      resourcePath  = "$context.resourcePath"
      status        = "$context.status"
      protocol      = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-stage-prod"
  })
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${local.name_prefix}-api"
  retention_in_days = var.log_retention_days

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-api-gateway-logs"
  })
}

# CloudWatch Alarm for Lambda Error Rate
resource "aws_cloudwatch_metric_alarm" "lambda_error_rate" {
  alarm_name          = "${local.name_prefix}-lambda-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorRate"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda error rate"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    FunctionName = aws_lambda_function.api_handler.function_name
  }

  tags = local.common_tags
}

# SNS Topic for Alerts
resource "aws_sns_topic" "alerts" {
  name = "${local.name_prefix}-alerts"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-sns-alerts"
  })
}

# Outputs
output "api_gateway_url_dev" {
  description = "URL of the API Gateway (Development)"
  value       = "https://${aws_api_gateway_rest_api.main_api.id}.execute-api.us-east-1.amazonaws.com/dev"
}

output "api_gateway_url_prod" {
  description = "URL of the API Gateway (Production)"
  value       = "https://${aws_api_gateway_rest_api.main_api.id}.execute-api.us-east-1.amazonaws.com/prod"
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main_table.name
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api_handler.function_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}
```

## Key Changes Made:

1. **✅ Fixed the Error**: Removed the `templatefile()` function and embedded the Lambda code directly using a heredoc (`<<EOF ... EOF`)

2. **✅ Inline Lambda Code**: The entire Node.js function is now contained within the Terraform configuration

3. **✅ Added Source Code Hash**: Added `source_code_hash = data.archive_file.lambda_zip.output_base64sha256` to ensure Lambda updates when code changes

## What's Fixed:

- **No External Files Required**: Everything is self-contained in the single `tap-stack.tf` file
- **Proper Code Deployment**: The Lambda function will be created with the inline JavaScript code
- **Automatic Updates**: Changes to the inline code will trigger Lambda function updates

Now you can deploy this with just the `tap-stack.tf` file and your `provider.tf` - no additional files needed!

The Lambda function includes:
- ✅ **GET /items** - Retrieves all items from DynamoDB
- ✅ **POST /items** - Creates new items (requires `{"data": "your-content"}`)
- ✅ **OPTIONS /items** - CORS preflight handling
- ✅ **Full Error Handling** - Proper HTTP status codes and error messages
- ✅ **Request Logging** - All requests logged to CloudWatch