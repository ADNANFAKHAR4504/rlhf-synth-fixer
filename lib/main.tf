# ========================================
# Data Sources
# ========================================
data "aws_region" "current" {}

data "aws_caller_identity" "current" {}

# ========================================
# Variables
# ========================================
variable "region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "log_retention_days" {
  description = "CloudWatch log retention in days (compliance requirement)"
  type        = number
  default     = 7
}

variable "throttle_rate_limit" {
  description = "API throttle rate limit (requests per second)"
  type        = number
  default     = 100
}

variable "throttle_burst_limit" {
  description = "API throttle burst limit"
  type        = number
  default     = 200
}

variable "daily_quota_limit" {
  description = "Daily request quota limit"
  type        = number
  default     = 10000
}

# ========================================
# Locals
# ========================================
locals {
  common_tags = {
    Environment = "production"
    Service     = "payment-processing"
    ManagedBy   = "terraform"
    Compliance  = "required"
  }
  
  api_name        = "payment-api"
  stage_name      = "prod"
  resource_path   = "process-payment"
  cors_origin     = "https://app.example.com"
}

# ========================================
# Random String for Unique Naming
# ========================================
resource "random_string" "suffix" {
  length  = 8
  special = false
  upper   = false
  numeric = true
}

# ========================================
# Lambda Deployment Package
# ========================================
data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_function.zip"
}

# ========================================
# Lambda IAM Role
# ========================================
resource "aws_iam_role" "lambda_role" {
  name = "payment-processor-lambda-role-${random_string.suffix.result}"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# ========================================
# Lambda Function
# ========================================
resource "aws_lambda_function" "payment_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  function_name    = "payment-processor-${random_string.suffix.result}"
  role            = aws_iam_role.lambda_role.arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  runtime         = "python3.11"
  
  environment {
    variables = {
      ENVIRONMENT = "production"
    }
  }
  
  tags = local.common_tags
}

# ========================================
# REST API
# ========================================
resource "aws_api_gateway_rest_api" "payment_api" {
  name        = local.api_name
  description = "Payment Processing REST API Gateway for secure mobile app payment transactions"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = local.common_tags
}

# ========================================
# API Resources
# ========================================
resource "aws_api_gateway_resource" "process_payment" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  parent_id   = aws_api_gateway_rest_api.payment_api.root_resource_id
  path_part   = local.resource_path
}

# ========================================
# API Methods
# ========================================
resource "aws_api_gateway_method" "process_payment_post" {
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  resource_id   = aws_api_gateway_resource.process_payment.id
  http_method   = "POST"
  authorization = "NONE"
  api_key_required = true
}

# ========================================
# Method Responses
# ========================================
resource "aws_api_gateway_method_response" "process_payment_post_200" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  resource_id = aws_api_gateway_resource.process_payment.id
  http_method = aws_api_gateway_method.process_payment_post.http_method
  status_code = "200"
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = true
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
  }
  
  response_models = {
    "application/json" = "Empty"
  }
}

# ========================================
# Lambda Integration
# ========================================
resource "aws_api_gateway_integration" "process_payment_lambda" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  resource_id = aws_api_gateway_resource.process_payment.id
  http_method = aws_api_gateway_method.process_payment_post.http_method
  
  integration_http_method = "POST"
  type                   = "AWS_PROXY"
  uri                    = aws_lambda_function.payment_processor.invoke_arn
}

# ========================================
# Integration Responses
# ========================================
resource "aws_api_gateway_integration_response" "process_payment_post_200" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  resource_id = aws_api_gateway_resource.process_payment.id
  http_method = aws_api_gateway_method.process_payment_post.http_method
  status_code = aws_api_gateway_method_response.process_payment_post_200.status_code
  
  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin"  = "'${local.cors_origin}'"
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token'"
    "method.response.header.Access-Control-Allow-Methods" = "'POST,OPTIONS'"
  }
  
  depends_on = [
    aws_api_gateway_integration.process_payment_lambda
  ]
}

# ========================================
# API Key
# ========================================
resource "aws_api_gateway_api_key" "mobile_app_key" {
  name        = "mobile-app-key"
  description = "API key for mobile application payment processing authentication"
  enabled     = true
  
  tags = local.common_tags
}

# ========================================
# Lambda Permission
# ========================================
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowAPIGatewayInvoke-${random_string.suffix.result}"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.payment_processor.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.payment_api.execution_arn}/*/*"
}

# ========================================
# CloudWatch IAM Role
# ========================================
resource "aws_iam_role" "api_gateway_cloudwatch" {
  name = "payment-api-gateway-cloudwatch-${random_string.suffix.result}"
  
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
  
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch_logs" {
  role       = aws_iam_role.api_gateway_cloudwatch.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# ========================================
# API Gateway Account Settings
# ========================================
resource "aws_api_gateway_account" "api_gateway_account" {
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch.arn
  
  depends_on = [
    aws_iam_role_policy_attachment.api_gateway_cloudwatch_logs
  ]
}

# ========================================
# CloudWatch Log Group
# ========================================
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${local.api_name}"
  retention_in_days = var.log_retention_days
  
  tags = local.common_tags
}

# ========================================
# API Deployment
# ========================================
resource "aws_api_gateway_deployment" "payment_api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  
  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.process_payment.id,
      aws_api_gateway_method.process_payment_post.id,
      aws_api_gateway_integration.process_payment_lambda.id,
      aws_api_gateway_method_response.process_payment_post_200.id,
      aws_api_gateway_integration_response.process_payment_post_200.id,
    ]))
  }
  
  lifecycle {
    create_before_destroy = true
  }
  
  depends_on = [
    aws_api_gateway_method.process_payment_post,
    aws_api_gateway_integration.process_payment_lambda,
    aws_api_gateway_method_response.process_payment_post_200,
    aws_api_gateway_integration_response.process_payment_post_200,
    aws_api_gateway_account.api_gateway_account
  ]
}

# ========================================
# API Stage
# ========================================
resource "aws_api_gateway_stage" "prod" {
  deployment_id = aws_api_gateway_deployment.payment_api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.payment_api.id
  stage_name    = local.stage_name
  
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
      error          = "$context.error.message"
      integrationError = "$context.integrationErrorMessage"
    })
  }
  
  tags = local.common_tags
  
  depends_on = [
    aws_api_gateway_account.api_gateway_account
  ]
}

# ========================================
# Method Settings
# ========================================
resource "aws_api_gateway_method_settings" "prod_settings" {
  rest_api_id = aws_api_gateway_rest_api.payment_api.id
  stage_name  = aws_api_gateway_stage.prod.stage_name
  method_path = "*/*"
  
  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_burst_limit = 5000
    throttling_rate_limit  = 10000
  }
  
  depends_on = [
    aws_api_gateway_account.api_gateway_account
  ]
}

# ========================================
# Usage Plan
# ========================================
resource "aws_api_gateway_usage_plan" "payment_api_plan" {
  name        = "payment-api-usage-plan-${random_string.suffix.result}"
  description = "Usage plan for payment API with throttling and quota limits"
  
  api_stages {
    api_id = aws_api_gateway_rest_api.payment_api.id
    stage  = aws_api_gateway_stage.prod.stage_name
  }
  
  throttle_settings {
    rate_limit  = var.throttle_rate_limit
    burst_limit = var.throttle_burst_limit
  }
  
  quota_settings {
    limit  = var.daily_quota_limit
    period = "DAY"
  }
  
  tags = local.common_tags
}

resource "aws_api_gateway_usage_plan_key" "mobile_app_key_association" {
  key_id        = aws_api_gateway_api_key.mobile_app_key.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.payment_api_plan.id
}

# ========================================
# Outputs
# ========================================
output "api_invoke_url" {
  description = "Full HTTPS endpoint URL for the prod stage to test with curl or Postman"
  value       = "${aws_api_gateway_stage.prod.invoke_url}/${local.resource_path}"
}

output "api_key_value" {
  description = "API key value for mobile application authentication"
  value       = aws_api_gateway_api_key.mobile_app_key.value
  sensitive   = true
}

output "api_gateway_id" {
  description = "ID of the API Gateway REST API"
  value       = aws_api_gateway_rest_api.payment_api.id
}

output "usage_plan_id" {
  description = "ID of the usage plan"
  value       = aws_api_gateway_usage_plan.payment_api_plan.id
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for API Gateway logs"
  value       = aws_cloudwatch_log_group.api_gateway_logs.name
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.payment_processor.function_name
}

output "lambda_function_arn" {
  description = "ARN of the Lambda function"
  value       = aws_lambda_function.payment_processor.arn
}
