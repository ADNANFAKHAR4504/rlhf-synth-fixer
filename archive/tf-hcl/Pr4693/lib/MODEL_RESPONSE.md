
I'll create a production-ready serverless API infrastructure with all the components you've specified. This will be a complete, deployable solution with proper security, scalability, and monitoring.

## **main.tf**
```hcl
# main.tf - Core infrastructure setup and resource orchestration

terraform {
  required_version = ">= 1.0"
  
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.0"
    }
  }
}

# Primary region provider
provider "aws" {
  region = var.primary_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Secondary region provider for Global Tables
provider "aws" {
  alias  = "secondary"
  region = var.secondary_region
  
  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}

# Data source for current AWS account
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# S3 bucket for Lambda deployment packages
resource "aws_s3_bucket" "lambda_deployments" {
  bucket = "${var.project_name}-${var.environment}-lambda-deployments-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_versioning" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "lambda_deployments" {
  bucket = aws_s3_bucket.lambda_deployments.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Package Lambda function
data "archive_file" "lambda_package" {
  type        = "zip"
  source_file = "${path.module}/lambda_function.py"
  output_path = "${path.module}/lambda_deployment.zip"
}

# Upload Lambda package to S3
resource "aws_s3_object" "lambda_package" {
  bucket = aws_s3_bucket.lambda_deployments.id
  key    = "lambda_deployment_${data.archive_file.lambda_package.output_base64sha256}.zip"
  source = data.archive_file.lambda_package.output_path
  etag   = filemd5(data.archive_file.lambda_package.output_path)
}
```

## **variables.tf**
```hcl
# variables.tf - All configurable parameters with sensible defaults

variable "project_name" {
  description = "Name of the project"
  type        = string
  default     = "serverless-api"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "primary_region" {
  description = "Primary AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region for DynamoDB Global Tables"
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Custom domain name for the API"
  type        = string
}

variable "certificate_arn" {
  description = "ACM certificate ARN for the custom domain (must be in us-east-1)"
  type        = string
}

variable "lambda_memory_size" {
  description = "Memory size for Lambda functions in MB"
  type        = number
  default     = 256
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "lambda_runtime" {
  description = "Runtime for Lambda functions"
  type        = string
  default     = "python3.11"
}

variable "dynamodb_read_capacity" {
  description = "Read capacity units for DynamoDB tables"
  type        = number
  default     = 5
}

variable "dynamodb_write_capacity" {
  description = "Write capacity units for DynamoDB tables"
  type        = number
  default     = 5
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling for DynamoDB tables"
  type        = bool
  default     = true
}

variable "min_read_capacity" {
  description = "Minimum read capacity for auto-scaling"
  type        = number
  default     = 5
}

variable "max_read_capacity" {
  description = "Maximum read capacity for auto-scaling"
  type        = number
  default     = 1000
}

variable "min_write_capacity" {
  description = "Minimum write capacity for auto-scaling"
  type        = number
  default     = 5
}

variable "max_write_capacity" {
  description = "Maximum write capacity for auto-scaling"
  type        = number
  default     = 1000
}

variable "api_throttle_burst_limit" {
  description = "API Gateway throttle burst limit"
  type        = number
  default     = 5000
}

variable "api_throttle_rate_limit" {
  description = "API Gateway throttle rate limit"
  type        = number
  default     = 10000
}

variable "cloudwatch_retention_days" {
  description = "CloudWatch logs retention in days"
  type        = number
  default     = 30
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
}

variable "enable_xray_tracing" {
  description = "Enable X-Ray tracing"
  type        = bool
  default     = true
}

variable "tags" {
  description = "Additional tags to apply to resources"
  type        = map(string)
  default     = {}
}
```

## **outputs.tf**
```hcl
# outputs.tf - Important values like API endpoint, user pool ID, etc.

output "api_gateway_url" {
  description = "URL of the API Gateway"
  value       = "https://${aws_api_gateway_domain_name.api.domain_name}"
}

output "cloudfront_distribution_url" {
  description = "CloudFront distribution URL"
  value       = "https://${aws_cloudfront_distribution.api_distribution.domain_name}"
}

output "custom_domain_url" {
  description = "Custom domain URL for the API"
  value       = "https://${var.domain_name}"
}

output "user_pool_id" {
  description = "Cognito User Pool ID"
  value       = aws_cognito_user_pool.main.id
}

output "user_pool_client_id" {
  description = "Cognito User Pool Client ID"
  value       = aws_cognito_user_pool_client.app_client.id
}

output "user_pool_domain" {
  description = "Cognito User Pool domain"
  value       = "https://${aws_cognito_user_pool_domain.main.domain}.auth.${var.primary_region}.amazoncognito.com"
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table"
  value       = aws_dynamodb_table.main.name
}

output "lambda_function_name" {
  description = "Name of the Lambda function"
  value       = aws_lambda_function.api_backend.function_name
}

output "cloudwatch_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.primary_region}#dashboards:name=${aws_cloudwatch_dashboard.api_dashboard.dashboard_name}"
}

output "xray_service_map_url" {
  description = "URL to the X-Ray service map"
  value       = "https://console.aws.amazon.com/xray/home?region=${var.primary_region}#/service-map"
}

output "api_gateway_rest_api_id" {
  description = "API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main.id
}

output "route53_zone_id" {
  description = "Route53 hosted zone ID"
  value       = data.aws_route53_zone.main.zone_id
}
```

## **cognito.tf**
```hcl
# cognito.tf - User pool, client app, and auth configuration

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.project_name}-${var.environment}-users"

  # Password policy
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_numbers   = true
    require_symbols   = true
    require_uppercase = true
  }

  # Account recovery
  account_recovery_setting {
    recovery_mechanism {
      name     = "verified_email"
      priority = 1
    }
    recovery_mechanism {
      name     = "verified_phone_number"
      priority = 2
    }
  }

  # Auto-verified attributes
  auto_verified_attributes = ["email"]

  # Username configuration
  username_configuration {
    case_sensitive = false
  }

  # Email configuration
  email_configuration {
    email_sending_account = "COGNITO_DEFAULT"
  }

  # User attributes
  schema {
    attribute_data_type = "String"
    mutable            = true
    name               = "email"
    required           = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  schema {
    attribute_data_type = "String"
    mutable            = true
    name               = "name"
    required           = true

    string_attribute_constraints {
      min_length = 1
      max_length = 256
    }
  }

  # Advanced security
  user_pool_add_ons {
    advanced_security_mode = "ENFORCED"
  }

  # Device tracking
  device_configuration {
    challenge_required_on_new_device      = false
    device_only_remembered_on_user_prompt = false
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-user-pool"
  }
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  domain       = "${var.project_name}-${var.environment}-${data.aws_caller_identity.current.account_id}"
  user_pool_id = aws_cognito_user_pool.main.id
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "app_client" {
  name         = "${var.project_name}-${var.environment}-app-client"
  user_pool_id = aws_cognito_user_pool.main.id

  # OAuth flows
  allowed_oauth_flows_user_pool_client = true
  allowed_oauth_flows                  = ["code", "implicit"]
  allowed_oauth_scopes                 = ["email", "openid", "profile"]
  callback_urls                        = ["https://${var.domain_name}/callback"]
  logout_urls                          = ["https://${var.domain_name}/logout"]
  supported_identity_providers         = ["COGNITO"]

  # Token validity
  access_token_validity  = 60  # 60 minutes
  id_token_validity      = 60  # 60 minutes
  refresh_token_validity = 30  # 30 days

  # Token units
  token_validity_units {
    access_token  = "minutes"
    id_token      = "minutes"
    refresh_token = "days"
  }

  # Authentication flows
  explicit_auth_flows = [
    "ALLOW_USER_PASSWORD_AUTH",
    "ALLOW_REFRESH_TOKEN_AUTH",
    "ALLOW_USER_SRP_AUTH"
  ]

  # Security
  prevent_user_existence_errors = "ENABLED"

  # Read/write attributes
  read_attributes = [
    "email",
    "email_verified",
    "name",
    "preferred_username"
  ]

  write_attributes = [
    "email",
    "name"
  ]

  generate_secret = false
}

# Resource server for custom scopes (optional)
resource "aws_cognito_resource_server" "api" {
  identifier = "${var.project_name}-api"
  name       = "${var.project_name} API"

  user_pool_id = aws_cognito_user_pool.main.id

  scope {
    scope_name        = "read"
    scope_description = "Read access to API"
  }

  scope {
    scope_name        = "write"
    scope_description = "Write access to API"
  }
}

# User pool groups (optional, for role-based access)
resource "aws_cognito_user_group" "admin" {
  name         = "admin"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Administrator users"
  precedence   = 1
  role_arn     = aws_iam_role.cognito_admin_group.arn
}

resource "aws_cognito_user_group" "standard" {
  name         = "standard"
  user_pool_id = aws_cognito_user_pool.main.id
  description  = "Standard users"
  precedence   = 2
  role_arn     = aws_iam_role.cognito_standard_group.arn
}
```

## **api_gateway.tf**
```hcl
# api_gateway.tf - REST API, resources, methods, authorizers, and deployment

# API Gateway REST API
resource "aws_api_gateway_rest_api" "main" {
  name        = "${var.project_name}-${var.environment}-api"
  description = "Serverless REST API for ${var.project_name}"

  endpoint_configuration {
    types = ["EDGE"]
  }

  # Enable API Gateway execution logging
  minimum_compression_size = 1024
}

# API Gateway Authorizer
resource "aws_api_gateway_authorizer" "cognito" {
  name                   = "${var.project_name}-cognito-authorizer"
  rest_api_id            = aws_api_gateway_rest_api.main.id
  type                   = "COGNITO_USER_POOLS"
  provider_arns          = [aws_cognito_user_pool.main.arn]
  identity_source        = "method.request.header.Authorization"
  authorizer_result_ttl_in_seconds = 300
}

# API Resources
resource "aws_api_gateway_resource" "items" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "items"
}

resource "aws_api_gateway_resource" "item" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_resource.items.id
  path_part   = "{id}"
}

resource "aws_api_gateway_resource" "health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  parent_id   = aws_api_gateway_rest_api.main.root_resource_id
  path_part   = "health"
}

# GET /items - List all items
resource "aws_api_gateway_method" "get_items" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.items.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "get_items" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.items.id
  http_method = aws_api_gateway_method.get_items.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_backend.invoke_arn
}

# POST /items - Create new item
resource "aws_api_gateway_method" "post_items" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.items.id
  http_method   = "POST"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id
}

resource "aws_api_gateway_integration" "post_items" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.items.id
  http_method = aws_api_gateway_method.post_items.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_backend.invoke_arn
}

# GET /items/{id} - Get specific item
resource "aws_api_gateway_method" "get_item" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.item.id
  http_method   = "GET"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.id" = true
  }
}

resource "aws_api_gateway_integration" "get_item" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.item.id
  http_method = aws_api_gateway_method.get_item.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_backend.invoke_arn
}

# PUT /items/{id} - Update item
resource "aws_api_gateway_method" "put_item" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.item.id
  http_method   = "PUT"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.id" = true
  }
}

resource "aws_api_gateway_integration" "put_item" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.item.id
  http_method = aws_api_gateway_method.put_item.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_backend.invoke_arn
}

# DELETE /items/{id} - Delete item
resource "aws_api_gateway_method" "delete_item" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.item.id
  http_method   = "DELETE"
  authorization = "COGNITO_USER_POOLS"
  authorizer_id = aws_api_gateway_authorizer.cognito.id

  request_parameters = {
    "method.request.path.id" = true
  }
}

resource "aws_api_gateway_integration" "delete_item" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.item.id
  http_method = aws_api_gateway_method.delete_item.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_backend.invoke_arn
}

# GET /health - Health check (no auth)
resource "aws_api_gateway_method" "get_health" {
  rest_api_id   = aws_api_gateway_rest_api.main.id
  resource_id   = aws_api_gateway_resource.health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "get_health" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  resource_id = aws_api_gateway_resource.health.id
  http_method = aws_api_gateway_method.get_health.http_method

  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_backend.invoke_arn
}

# API Gateway Deployment
resource "aws_api_gateway_deployment" "main" {
  depends_on = [
    aws_api_gateway_integration.get_items,
    aws_api_gateway_integration.post_items,
    aws_api_gateway_integration.get_item,
    aws_api_gateway_integration.put_item,
    aws_api_gateway_integration.delete_item,
    aws_api_gateway_integration.get_health
  ]

  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = var.environment

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage
resource "aws_api_gateway_stage" "main" {
  deployment_id = aws_api_gateway_deployment.main.id
  rest_api_id   = aws_api_gateway_rest_api.main.id
  stage_name    = var.environment

  # Enable CloudWatch logging
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway.arn
    format = jsonencode({
      requestId        = "$context.requestId"
      requestTime      = "$context.requestTime"
      requestTimeEpoch = "$context.requestTimeEpoch"
      path             = "$context.path"
      method           = "$context.httpMethod"
      status           = "$context.status"
      protocol         = "$context.protocol"
      responseLength   = "$context.responseLength"
      error            = "$context.error.message"
      integrationError = "$context.integration.error"
      sourceIp         = "$context.identity.sourceIp"
      userAgent        = "$context.identity.userAgent"
      cognitoUser      = "$context.authorizer.claims.sub"
    })
  }

  # Enable X-Ray tracing
  xray_tracing_enabled = var.enable_xray_tracing

  tags = {
    Name = "${var.project_name}-${var.environment}-stage"
  }
}

# Method settings for all methods
resource "aws_api_gateway_method_settings" "all" {
  rest_api_id = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  method_path = "*/*"

  settings = {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
  }
}

# API Gateway Domain Name
resource "aws_api_gateway_domain_name" "api" {
  domain_name              = "api.${var.domain_name}"
  regional_certificate_arn = var.certificate_arn

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-api-domain"
  }
}

# API Gateway Base Path Mapping
resource "aws_api_gateway_base_path_mapping" "api" {
  api_id      = aws_api_gateway_rest_api.main.id
  stage_name  = aws_api_gateway_stage.main.stage_name
  domain_name = aws_api_gateway_domain_name.api.domain_name
}
```

## **lambda.tf**
```hcl
# lambda.tf - Function definitions with proper runtime and environment configs

# Lambda function for API backend
resource "aws_lambda_function" "api_backend" {
  function_name = "${var.project_name}-${var.environment}-api-backend"
  role          = aws_iam_role.lambda_execution.arn
  handler       = "lambda_function.lambda_handler"
  runtime       = var.lambda_runtime
  memory_size   = var.lambda_memory_size
  timeout       = var.lambda_timeout

  # Use S3 for deployment package
  s3_bucket = aws_s3_bucket.lambda_deployments.id
  s3_key    = aws_s3_object.lambda_package.key

  environment {
    variables = {
      TABLE_NAME      = aws_dynamodb_table.main.name
      REGION          = var.primary_region
      ENVIRONMENT     = var.environment
      LOG_LEVEL       = "INFO"
      XRAY_ENABLED    = tostring(var.enable_xray_tracing)
    }
  }

  # Enable X-Ray tracing
  tracing_config {
    mode = var.enable_xray_tracing ? "Active" : "PassThrough"
  }

  # Reserved concurrent executions
  reserved_concurrent_executions = 100

  # Dead letter queue
  dead_letter_config {
    target_arn = aws_sqs_queue.lambda_dlq.arn
  }

  # VPC configuration (if needed)
  # vpc_config {
  #   subnet_ids         = var.lambda_subnet_ids
  #   security_group_ids = [aws_security_group.lambda.id]
  # }

  depends_on = [
    aws_iam_role_policy_attachment.lambda_basic,
    aws_iam_role_policy_attachment.lambda_xray,
    aws_cloudwatch_log_group.lambda,
  ]

  tags = {
    Name = "${var.project_name}-${var.environment}-api-backend"
  }
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway" {
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_backend.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main.execution_arn}/*/*"
}

# CloudWatch Log Group for Lambda
resource "aws_cloudwatch_log_group" "lambda" {
  name              = "/aws/lambda/${aws_lambda_function.api_backend.function_name}"
  retention_in_days = var.cloudwatch_retention_days

  tags = {
    Name = "${var.project_name}-${var.environment}-lambda-logs"
  }
}

# SQS Dead Letter Queue
resource "aws_sqs_queue" "lambda_dlq" {
  name                      = "${var.project_name}-${var.environment}-lambda-dlq"
  delay_seconds             = 0
  max_message_size          = 262144
  message_retention_seconds = 1209600  # 14 days
  receive_wait_time_seconds = 0

  tags = {
    Name = "${var.project_name}-${var.environment}-lambda-dlq"
  }
}

# Lambda Layer for common dependencies (optional)
resource "aws_lambda_layer_version" "common_libs" {
  filename            = "${path.module}/layer.zip"
  layer_name          = "${var.project_name}-${var.environment}-common-libs"
  compatible_runtimes = [var.lambda_runtime]
  description         = "Common libraries for Lambda functions"

  lifecycle {
    ignore_changes = [filename]
  }
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway" {
  name              = "/aws/apigateway/${aws_api_gateway_rest_api.main.name}"
  retention_in_days = var.cloudwatch_retention_days

  tags = {
    Name = "${var.project_name}-${var.environment}-api-gateway-logs"
  }
}

# Lambda function URL (for direct access, optional)
resource "aws_lambda_function_url" "api_backend" {
  function_name      = aws_lambda_function.api_backend.function_name
  authorization_type = "AWS_IAM"

  cors {
    allow_credentials = true
    allow_origins     = ["https://${var.domain_name}"]
    allow_methods     = ["GET", "POST", "PUT", "DELETE", "OPTIONS"]
    allow_headers     = ["date", "keep-alive", "x-custom-header"]
    expose_headers    = ["date", "keep-alive", "x-custom-header"]
    max_age          = 86400
  }
}
```

## **dynamodb.tf**
```hcl
# dynamodb.tf - Global table setup with appropriate indexes

# DynamoDB Global Table
resource "aws_dynamodb_table" "main" {
  name           = "${var.project_name}-${var.environment}-items"
  billing_mode   = "PAY_PER_REQUEST"  # On-demand billing
  hash_key       = "id"
  
  # Enable streams for Global Tables
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  # Primary key attribute
  attribute {
    name = "id"
    type = "S"
  }

  # GSI attributes
  attribute {
    name = "userId"
    type = "S"
  }

  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "createdAt"
    type = "S"
  }

  # Global Secondary Index for querying by userId
  global_secondary_index {
    name            = "userId-createdAt-index"
    hash_key        = "userId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  # Global Secondary Index for querying by status
  global_secondary_index {
    name            = "status-createdAt-index"
    hash_key        = "status"
    range_key       = "createdAt"
    projection_type = "ALL"
  }

  # Point-in-time recovery
  point_in_time_recovery {
    enabled = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  # TTL configuration
  ttl {
    enabled        = true
    attribute_name = "ttl"
  }

  # Global Tables v2 configuration
  replica {
    region_name = var.secondary_region
    
    point_in_time_recovery {
      enabled = true
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-items-table"
  }
}

# Auto-scaling configuration (if using provisioned capacity)
resource "aws_appautoscaling_target" "dynamodb_table_read_target" {
  count              = var.enable_auto_scaling ? 1 : 0
  max_capacity       = var.max_read_capacity
  min_capacity       = var.min_read_capacity
  resource_id        = "table/${aws_dynamodb_table.main.name}"
  scalable_dimension = "dynamodb:table:ReadCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_read_policy" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.project_name}-${var.environment}-dynamodb-read-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_read_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_read_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_read_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBReadCapacityUtilization"
    }

    target_value = 70.0
  }
}

resource "aws_appautoscaling_target" "dynamodb_table_write_target" {
  count              = var.enable_auto_scaling ? 1 : 0
  max_capacity       = var.max_write_capacity
  min_capacity       = var.min_write_capacity
  resource_id        = "table/${aws_dynamodb_table.main.name}"
  scalable_dimension = "dynamodb:table:WriteCapacityUnits"
  service_namespace  = "dynamodb"
}

resource "aws_appautoscaling_policy" "dynamodb_table_write_policy" {
  count              = var.enable_auto_scaling ? 1 : 0
  name               = "${var.project_name}-${var.environment}-dynamodb-write-autoscaling"
  policy_type        = "TargetTrackingScaling"
  resource_id        = aws_appautoscaling_target.dynamodb_table_write_target[0].resource_id
  scalable_dimension = aws_appautoscaling_target.dynamodb_table_write_target[0].scalable_dimension
  service_namespace  = aws_appautoscaling_target.dynamodb_table_write_target[0].service_namespace

  target_tracking_scaling_policy_configuration {
    predefined_metric_specification {
      predefined_metric_type = "DynamoDBWriteCapacityUtilization"
    }

    target_value = 70.0
  }
}

# DynamoDB backup plan
resource "aws_backup_plan" "dynamodb" {
  name = "${var.project_name}-${var.environment}-dynamodb-backup"

  rule {
    rule_name         = "daily_backup"
    target_vault_name = aws_backup_vault.main.name
    schedule          = "cron(0 5 ? * * *)"  # Daily at 5 AM UTC

    lifecycle {
      delete_after = 30  # Keep backups for 30 days
    }
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-dynamodb-backup-plan"
  }
}

resource "aws_backup_vault" "main" {
  name = "${var.project_name}-${var.environment}-backup-vault"

  tags = {
    Name = "${var.project_name}-${var.environment}-backup-vault"
  }
}

resource "aws_backup_selection" "dynamodb" {
  iam_role_arn = aws_iam_role.backup.arn
  name         = "${var.project_name}-${var.environment}-dynamodb-selection"
  plan_id      = aws_backup_plan.dynamodb.id

  resources = [
    aws_dynamodb_table.main.arn
  ]
}
```

## **cloudfront.tf**
```hcl
# cloudfront.tf - Distribution config pointing to API Gateway

# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "api" {
  comment = "${var.project_name}-${var.environment}-api-oai"
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "api_distribution" {
  enabled             = true
  is_ipv6_enabled     = true
  comment             = "${var.project_name} ${var.environment} API Distribution"
  default_root_object = ""
  aliases             = [var.domain_name]
  price_class         = "PriceClass_All"

  # Origin for API Gateway
  origin {
    domain_name = replace(aws_api_gateway_stage.main.invoke_url, "/^https?://([^/]*).*/", "$1")
    origin_id   = "api-gateway-origin"
    origin_path = "/${var.environment}"

    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }

    custom_header {
      name  = "x-api-key"
      value = aws_api_gateway_api_key.main.value
    }
  }

  # Default cache behavior
  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS", "PUT", "POST", "PATCH", "DELETE"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    target_origin_id = "api-gateway-origin"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Origin", "Accept", "Content-Type"]

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true

    # Lambda@Edge functions (optional)
    # lambda_function_association {
    #   event_type   = "viewer-request"
    #   lambda_arn   = aws_lambda_function.edge_auth.qualified_arn
    #   include_body = false
    # }
  }

  # Cache behavior for health endpoint
  ordered_cache_behavior {
    path_pattern     = "/health"
    allowed_methods  = ["GET", "HEAD"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "api-gateway-origin"

    forwarded_values {
      query_string = false
      headers      = []

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 60
    max_ttl                = 300
    compress               = true
  }

  # Custom error responses
  custom_error_response {
    error_code            = 403
    response_code         = 403
    response_page_path    = "/error/403"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 404
    response_code         = 404
    response_page_path    = "/error/404"
    error_caching_min_ttl = 10
  }

  custom_error_response {
    error_code            = 500
    response_code         = 500
    response_page_path    = "/error/500"
    error_caching_min_ttl = 10
  }

  # Geo restrictions
  restrictions {
    geo_restriction {
      restriction_type = "none"
      # locations        = ["US", "CA", "GB", "DE"]  # Whitelist specific countries if needed
    }
  }

  # SSL/TLS certificate
  viewer_certificate {
    acm_certificate_arn      = var.certificate_arn
    ssl_support_method       = "sni-only"
    minimum_protocol_version = "TLSv1.2_2021"
  }

  # Logging
  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.cloudfront_logs.bucket_domain_name
    prefix          = "cloudfront/"
  }

  # Web Application Firewall
  web_acl_id = aws_wafv2_web_acl.cloudfront.arn

  tags = {
    Name = "${var.project_name}-${var.environment}-cloudfront"
  }
}

# S3 bucket for CloudFront logs
resource "aws_s3_bucket" "cloudfront_logs" {
  bucket = "${var.project_name}-${var.environment}-cloudfront-logs-${data.aws_caller_identity.current.account_id}"
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    expiration {
      days = 90
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudfront_logs" {
  bucket = aws_s3_bucket.cloudfront_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# API Gateway API Key
resource "aws_api_gateway_api_key" "main" {
  name = "${var.project_name}-${var.environment}-api-key"
}

resource "aws_api_gateway_usage_plan" "main" {
  name = "${var.project_name}-${var.environment}-usage-plan"

  api_stages {
    api_id = aws_api_gateway_rest_api.main.id
    stage  = aws_api_gateway_stage.main.stage_name
  }

  quota_settings {
    limit  = 100000
    period = "MONTH"
  }

  throttle_settings {
    rate_limit  = 1000
    burst_limit = 2000
  }
}

resource "aws_api_gateway_usage_plan_key" "main" {
  key_id        = aws_api_gateway_api_key.main.id
  key_type      = "API_KEY"
  usage_plan_id = aws_api_gateway_usage_plan.main.id
}

# WAF Web ACL for CloudFront
resource "aws_wafv2_web_acl" "cloudfront" {
  provider = aws  # WAF for CloudFront must be in us-east-1

  name  = "${var.project_name}-${var.environment}-waf"
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  # Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 1

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 10000
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-rate-limit"
      sampled_requests_enabled   = true
    }
  }

  # AWS Managed Rules
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesCommonRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-${var.environment}-common-rules"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-${var.environment}-waf"
    sampled_requests_enabled   = true
  }

  tags = {
    Name = "${var.project_name}-${var.environment}-waf"
  }
}
```

## **route53.tf**
```hcl
# route53.tf - Hosted zone and DNS records

# Data source for existing hosted zone
data "aws_route53_zone" "main" {
  name         = var.domain_name
  private_zone = false
}

# Route 53 A record for CloudFront distribution
resource "aws_route53_record" "cloudfront" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.api_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.api_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# Route 53 AAAA record for CloudFront distribution (IPv6)
resource "aws_route53_record" "cloudfront_ipv6" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.api_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.api_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}

# Route 53 A record for API subdomain
resource "aws_route53_record" "api" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "A"

  alias {
    name                   = aws_api_gateway_domain_name.api.regional_domain_name
    zone_id                = aws_api_gateway_domain_name.api.regional_zone_id
    evaluate_target_health = true
  }
}

# Health check for API endpoint
resource "aws_route53_health_check" "api" {
  fqdn              = "api.${var.domain_name}"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/${var.environment}/health"
  failure_threshold = "3"
  request_interval  = "30"

  tags = {
    Name = "${var.project_name}-${var.environment}-api-health-check"
  }
}

# CloudWatch alarm for health check
resource "aws_cloudwatch_metric_alarm" "health_check" {
  alarm_name          = "${var.project_name}-${var.environment}-api-health-check"
  comparison_operator = "LessThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "HealthCheckStatus"
  namespace           = "AWS/Route53"
  period              = "60"
  statistic           = "Average"
  threshold           = "1"
  alarm_description   = "This metric monitors API health check"
  treat_missing_data  = "breaching"

  dimensions = {
    HealthCheckId = aws_route53_health_check.api.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
  ok_actions    = [aws_sns_topic.alerts.arn]
}

# Route 53 query logging
resource "aws_route53_query_log" "main" {
  depends_on = [aws_cloudwatch_log_resource_policy.route53]

  cloudwatch_log_group_arn = aws_cloudwatch_log_group.route53_query.arn
  zone_id                  = data.aws_route53_zone.main.zone_id
}

resource "aws_cloudwatch_log_group" "route53_query" {
  name              = "/aws/route53/${var.domain_name}"
  retention_in_days = var.cloudwatch_retention_days

  tags = {
    Name = "${var.project_name}-${var.environment}-route53-query-logs"
  }
}

resource "aws_cloudwatch_log_resource_policy" "route53" {
  policy_name     = "${var.project_name}-${var.environment}-route53-query-logging"
  policy_document = data.aws_iam_policy_document.route53_query_logging.json
}

data "aws_iam_policy_document" "route53_query_logging" {
  statement {
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]

    resources = ["arn:aws:logs:*:*:*"]

    principals {
      identifiers = ["route53.amazonaws.com"]
      type        = "Service"
    }
  }
}
```

## **monitoring.tf**
```hcl
# monitoring.tf - CloudWatch dashboards, alarms, and X-Ray configuration

# SNS topic for alarms
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-${var.environment}-alerts"
}

resource "aws_sns_topic_subscription" "email_alerts" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "api_dashboard" {
  dashboard_name = "${var.project_name}-${var.environment}-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      # API Gateway metrics
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/ApiGateway", "Count", { stat = "Sum", label = "Total Requests" }],
            [".", "4XXError", { stat = "Sum", label = "4XX Errors" }],
            [".", "5XXError", { stat = "Sum", label = "5XX Errors" }]
          ]
          period = 300
          stat   = "Average"
          region = var.primary_region
          title  = "API Gateway Requests"
          view   = "timeSeries"
        }
      },
      # Lambda metrics
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Lambda", "Invocations", { stat = "Sum", label = "Invocations" }],
            [".", "Errors", { stat = "Sum", label = "Errors" }],
            [".", "Duration", { stat = "Average", label = "Avg Duration" }],
            [".", "ConcurrentExecutions", { stat = "Average", label = "Concurrent Executions" }]
          ]
          period = 300
          stat   = "Average"
          region = var.primary_region
          title  = "Lambda Performance"
          view   = "timeSeries"
        }
      },
      # DynamoDB metrics
      {
        type   = "metric"
        x      = 0
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum" }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum" }],
            [".", "UserErrors", { stat = "Sum" }],
            [".", "SystemErrors", { stat = "Sum" }]
          ]
          period = 300
          stat   = "Average"
          region = var.primary_region
          title  = "DynamoDB Performance"
          view   = "timeSeries"
        }
      },
      # CloudFront metrics
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/CloudFront", "Requests", { stat = "Sum" }],
            [".", "BytesDownloaded", { stat = "Sum" }],
            [".", "4xxErrorRate", { stat = "Average" }],
            [".", "5xxErrorRate", { stat = "Average" }]
          ]
          period = 300
          stat   = "Average"
          region = "us-east-1"
          title  = "CloudFront Performance"
          view   = "timeSeries"
        }
      }
    ]
  })
}

# CloudWatch Alarms

# API Gateway 4XX errors alarm
resource "aws_cloudwatch_metric_alarm" "api_4xx_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-api-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "This metric monitors API Gateway 4XX errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
    Stage   = var.environment
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# API Gateway 5XX errors alarm
resource "aws_cloudwatch_metric_alarm" "api_5xx_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-api-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "60"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors API Gateway 5XX errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main.name
    Stage   = var.environment
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# Lambda errors alarm
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors Lambda function errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api_backend.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# Lambda throttles alarm
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  alarm_name          = "${var.project_name}-${var.environment}-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function throttles"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api_backend.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# Lambda duration alarm
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  alarm_name          = "${var.project_name}-${var.environment}-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "3000"  # 3 seconds
  alarm_description   = "This metric monitors Lambda function duration"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api_backend.function_name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# DynamoDB user errors alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_user_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-dynamodb-user-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors DynamoDB user errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# DynamoDB system errors alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_system_errors" {
  alarm_name          = "${var.project_name}-${var.environment}-dynamodb-system-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = "60"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors DynamoDB system errors"
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.main.name
  }

  alarm_actions = [aws_sns_topic.alerts.arn]
}

# X-Ray sampling rule
resource "aws_xray_sampling_rule" "api" {
  count = var.enable_xray_tracing ? 1 : 0

  rule_name      = "${var.project_name}-${var.environment}-sampling"
  priority       = 9000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.05  # 5% sampling
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

  attributes = {
    Environment = var.environment
  }
}

# CloudWatch Logs Insights queries
resource "aws_cloudwatch_query_definition" "api_errors" {
  name = "${var.project_name}-${var.environment}-api-errors"

  log_group_names = [
    aws_cloudwatch_log_group.api_gateway.name,
    aws_cloudwatch_log_group.lambda.name
  ]

  query_string = <<EOF
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
EOF
}

resource "aws_cloudwatch_query_definition" "api_latency" {
  name = "${var.project_name}-${var.environment}-api-latency"

  log_group_names = [
    aws_cloudwatch_log_group.api_gateway.name
  ]

  query_string = <<EOF
fields @timestamp, responseLength, status
| filter responseLength > 0
| stats avg(responseLength) as avg_response_time,
        min(responseLength) as min_response_time,
        max(responseLength) as max_response_time,
        count() as request_count
    by bin(5m)
EOF
}

# CloudWatch Composite Alarm
resource "aws_cloudwatch_composite_alarm" "api_health" {
  alarm_name          = "${var.project_name}-${var.environment}-api-health"
  alarm_description   = "Composite alarm for overall API health"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alerts.arn]
  ok_actions         = [aws_sns_topic.alerts.arn]

  alarm_rule = <<EOF
ALARM("${aws_cloudwatch_metric_alarm.api_5xx_errors.alarm_name}") OR
ALARM("${aws_cloudwatch_metric_alarm.lambda_errors.alarm_name}") OR
ALARM("${aws_cloudwatch_metric_alarm.dynamodb_system_errors.alarm_name}")
EOF
}
```

## **iam.tf**
```hcl
# iam.tf - All roles and policies with proper trust relationships

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-${var.environment}-lambda-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })

  tags = {
    Name = "${var.project_name}-${var.environment}-lambda-execution-role"
  }
}

# Lambda basic execution policy
resource "aws_iam_role_policy_attachment" "lambda_basic" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# Lambda