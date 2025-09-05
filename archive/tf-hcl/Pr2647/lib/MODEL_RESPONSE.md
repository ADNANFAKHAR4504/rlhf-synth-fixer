## File: `main.tf`

```hcl
# ProjectX Serverless Stack - Main Configuration
# Last updated: 2025-09-03
# Node.js runtime: nodejs22.x (latest available as of 2025-09-03)

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
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

# Variable declarations (aws_region must be declared in main.tf per requirements)
variable "aws_region" {
  description = "AWS region for resource deployment"
  type        = string
  default     = "us-west-2"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda functions in MB"
  type        = number
  default     = 128
}

variable "notification_email" {
  description = "Email address for error notifications (placeholder)"
  type        = string
  default     = "admin@example.com"
}

variable "common_tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    Project     = "ProjectX"
    ManagedBy   = "Terraform"
    Environment = "dev"
  }
}

# Local values for consistent naming and configuration
locals {
  project = "projectX"
  region  = var.aws_region

  # Naming conventions
  name_prefix = "${local.project}-${var.environment}"

  # Common tags merged with user-provided tags
  tags = merge(var.common_tags, {
    Project     = local.project
    Environment = var.environment
    Region      = local.region
  })

  # Lambda configuration
  lambda_runtime = "nodejs22.x" # Latest Node.js runtime as of 2025-09-03
  lambda_timeout = 30
}

# Random suffix for unique resource naming
resource "random_id" "suffix" {
  byte_length = 4
}

# KMS Key for Lambda environment variable encryption
resource "aws_kms_key" "lambda_env_key" {
  description             = "KMS key for encrypting Lambda environment variables and S3 objects for ProjectX"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  # Key policy allowing account root, Lambda service, and our IAM roles to use the key
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # Allow account root to administer the key
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        # Allow Lambda service to use the key for environment variable encryption
        Sid    = "Allow Lambda Service"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        # Allow our Lambda execution roles to use the key
        Sid    = "Allow Lambda Execution Roles"
        Effect = "Allow"
        Principal = {
          AWS = [
            aws_iam_role.lambda_execution_role.arn,
            aws_iam_role.lambda_processor_role.arn
          ]
        }
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = merge(local.tags, {
    Name = "${local.name_prefix}-lambda-env-key"
  })
}

resource "aws_kms_alias" "lambda_env_key_alias" {
  name          = "alias/${local.name_prefix}-lambda-env-key"
  target_key_id = aws_kms_key.lambda_env_key.key_id
}

# Data sources
data "aws_caller_identity" "current" {}

# S3 Bucket for application assets (private, encrypted)
resource "aws_s3_bucket" "app_assets" {
  bucket = "${local.project}-assets-${random_id.suffix.hex}"

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-assets"
    Description = "Private S3 bucket for ProjectX application assets"
  })
}

# S3 bucket public access block - enforce no public access
resource "aws_s3_bucket_public_access_block" "app_assets_pab" {
  bucket = aws_s3_bucket.app_assets.id

  # Block all public access as required
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket server-side encryption using our KMS key
resource "aws_s3_bucket_server_side_encryption_configuration" "app_assets_encryption" {
  bucket = aws_s3_bucket.app_assets.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.lambda_env_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true # Reduces KMS costs
  }
}

# S3 bucket versioning
resource "aws_s3_bucket_versioning" "app_assets_versioning" {
  bucket = aws_s3_bucket.app_assets.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 bucket lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "app_assets_lifecycle" {
  bucket = aws_s3_bucket.app_assets.id

  rule {
    id     = "cleanup_old_versions"
    status = "Enabled"

    noncurrent_version_expiration {
      noncurrent_days = 30
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }
  }
}

# DynamoDB table with on-demand billing
resource "aws_dynamodb_table" "app_data" {
  name           = "${local.name_prefix}-data"
  billing_mode   = "PAY_PER_REQUEST" # On-demand as required
  hash_key       = "id"

  attribute {
    name = "id"
    type = "S"
  }

  # Optional GSI for querying by status
  attribute {
    name = "status"
    type = "S"
  }

  attribute {
    name = "created_at"
    type = "S"
  }

  global_secondary_index {
    name     = "status-created_at-index"
    hash_key = "status"
    range_key = "created_at"
  }

  # TTL attribute for automatic item expiration
  ttl {
    attribute_name = "expires_at"
    enabled        = true
  }

  # Server-side encryption
  server_side_encryption {
    enabled = true
  }

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-data"
    Description = "DynamoDB table for ProjectX application data with on-demand billing"
  })
}

# SNS Topic for error handling
resource "aws_sns_topic" "lambda_errors" {
  name = "${local.name_prefix}-lambda-errors"

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-lambda-errors"
    Description = "SNS topic for Lambda function error notifications"
  })
}

# SNS Topic subscription (placeholder email)
resource "aws_sns_topic_subscription" "lambda_errors_email" {
  topic_arn = aws_sns_topic.lambda_errors.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# IAM Role for Lambda execution (API handler)
resource "aws_iam_role" "lambda_execution_role" {
  name = "${local.name_prefix}-lambda-execution-role"
  description = "IAM role for ProjectX Lambda functions with basic execution permissions"

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

  tags = local.tags
}

# IAM Role for Lambda processor (background tasks)
resource "aws_iam_role" "lambda_processor_role" {
  name = "${local.name_prefix}-lambda-processor-role"
  description = "IAM role for ProjectX background processing Lambda functions"

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

  tags = local.tags
}

# IAM Policy for basic Lambda execution (CloudWatch Logs)
resource "aws_iam_policy" "lambda_basic_execution" {
  name        = "${local.name_prefix}-lambda-basic-execution"
  description = "Basic execution policy for Lambda functions - CloudWatch Logs and X-Ray"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # CloudWatch Logs permissions - required for all Lambda functions
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${local.region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        # X-Ray tracing permissions - required for distributed tracing
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })

  tags = local.tags
}

# IAM Policy for DynamoDB access
resource "aws_iam_policy" "lambda_dynamodb_access" {
  name        = "${local.name_prefix}-lambda-dynamodb-access"
  description = "Policy allowing Lambda functions to read/write to ProjectX DynamoDB table"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # DynamoDB table access - least privilege for CRUD operations
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan"
        ]
        Resource = [
          aws_dynamodb_table.app_data.arn,
          "${aws_dynamodb_table.app_data.arn}/index/*" # GSI access
        ]
      }
    ]
  })

  tags = local.tags
}

# IAM Policy for S3 access
resource "aws_iam_policy" "lambda_s3_access" {
  name        = "${local.name_prefix}-lambda-s3-access"
  description = "Policy allowing Lambda functions to read from ProjectX S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # S3 bucket read access - Lambda may need to read configuration or assets
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.app_assets.arn}/*"
      },
      {
        # S3 bucket list access - for object enumeration if needed
        Effect = "Allow"
        Action = [
          "s3:ListBucket"
        ]
        Resource = aws_s3_bucket.app_assets.arn
      }
    ]
  })

  tags = local.tags
}

# IAM Policy for KMS key usage
resource "aws_iam_policy" "lambda_kms_access" {
  name        = "${local.name_prefix}-lambda-kms-access"
  description = "Policy allowing Lambda functions to use KMS key for encryption/decryption"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        # KMS key usage - required for environment variable decryption and S3 object access
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.lambda_env_key.arn
      }
    ]
  })

  tags = local.tags
}

# Attach policies to Lambda execution role
resource "aws_iam_role_policy_attachment" "lambda_execution_basic" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_basic_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_execution_dynamodb" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_execution_s3" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_s3_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_execution_kms" {
  role       = aws_iam_role.lambda_execution_role.name
  policy_arn = aws_iam_policy.lambda_kms_access.arn
}

# Attach policies to Lambda processor role
resource "aws_iam_role_policy_attachment" "lambda_processor_basic" {
  role       = aws_iam_role.lambda_processor_role.name
  policy_arn = aws_iam_policy.lambda_basic_execution.arn
}

resource "aws_iam_role_policy_attachment" "lambda_processor_dynamodb" {
  role       = aws_iam_role.lambda_processor_role.name
  policy_arn = aws_iam_policy.lambda_dynamodb_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_processor_s3" {
  role       = aws_iam_role.lambda_processor_role.name
  policy_arn = aws_iam_policy.lambda_s3_access.arn
}

resource "aws_iam_role_policy_attachment" "lambda_processor_kms" {
  role       = aws_iam_role.lambda_processor_role.name
  policy_arn = aws_iam_policy.lambda_kms_access.arn
}

# Lambda function ZIP archives
data "archive_file" "api_handler_zip" {
  type        = "zip"
  output_path = "${path.module}/api_handler.zip"

  source {
    content = <<EOF
exports.handler = async (event) => {
    console.log('API Handler received event:', JSON.stringify(event, null, 2));

    // Sample response for API Gateway
    return {
        statusCode: 200,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
            message: 'Hello from ProjectX API Handler!',
            timestamp: new Date().toISOString(),
            requestId: event.requestContext?.requestId || 'unknown'
        })
    };
};
EOF
    filename = "index.js"
  }
}

data "archive_file" "data_processor_zip" {
  type        = "zip"
  output_path = "${path.module}/data_processor.zip"

  source {
    content = <<EOF
exports.handler = async (event) => {
    console.log('Data Processor received event:', JSON.stringify(event, null, 2));

    // Sample processing logic
    const result = {
        processed: true,
        timestamp: new Date().toISOString(),
        eventCount: Array.isArray(event.Records) ? event.Records.length : 1
    };

    console.log('Processing result:', JSON.stringify(result, null, 2));
    return result;
};
EOF
    filename = "index.js"
  }
}

# CloudWatch Log Groups for Lambda functions
resource "aws_cloudwatch_log_group" "api_handler_logs" {
  name              = "/aws/lambda/${local.name_prefix}-api-handler"
  retention_in_days = 30

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-api-handler-logs"
    Description = "CloudWatch log group for ProjectX API handler Lambda function"
  })
}

resource "aws_cloudwatch_log_group" "data_processor_logs" {
  name              = "/aws/lambda/${local.name_prefix}-data-processor"
  retention_in_days = 30

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-data-processor-logs"
    Description = "CloudWatch log group for ProjectX data processor Lambda function"
  })
}

# Lambda Functions
resource "aws_lambda_function" "api_handler" {
  filename         = data.archive_file.api_handler_zip.output_path
  function_name    = "${local.name_prefix}-api-handler"
  role            = aws_iam_role.lambda_execution_role.arn
  handler         = "index.handler"
  runtime         = local.lambda_runtime
  timeout         = local.lambda_timeout
  memory_size     = var.lambda_memory_size
  source_code_hash = data.archive_file.api_handler_zip.output_base64sha256

  # KMS encryption for environment variables
  kms_key_arn = aws_kms_key.lambda_env_key.arn

  # X-Ray tracing configuration
  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.app_data.name
      S3_BUCKET      = aws_s3_bucket.app_assets.bucket
      ENVIRONMENT    = var.environment
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.api_handler_logs,
    aws_iam_role_policy_attachment.lambda_execution_basic
  ]

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-api-handler"
    Description = "ProjectX API handler Lambda function with X-Ray tracing and KMS encryption"
  })
}

resource "aws_lambda_function" "data_processor" {
  filename         = data.archive_file.data_processor_zip.output_path
  function_name    = "${local.name_prefix}-data-processor"
  role            = aws_iam_role.lambda_processor_role.arn
  handler         = "index.handler"
  runtime         = local.lambda_runtime
  timeout         = local.lambda_timeout
  memory_size     = var.lambda_memory_size
  source_code_hash = data.archive_file.data_processor_zip.output_base64sha256

  # KMS encryption for environment variables
  kms_key_arn = aws_kms_key.lambda_env_key.arn

  # X-Ray tracing configuration
  tracing_config {
    mode = "Active"
  }

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.app_data.name
      S3_BUCKET      = aws_s3_bucket.app_assets.bucket
      ENVIRONMENT    = var.environment
    }
  }

  depends_on = [
    aws_cloudwatch_log_group.data_processor_logs,
    aws_iam_role_policy_attachment.lambda_processor_basic
  ]

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-data-processor"
    Description = "ProjectX data processor Lambda function with X-Ray tracing and KMS encryption"
  })
}

# Lambda Event Invoke Configuration for error handling
resource "aws_lambda_event_invoke_config" "api_handler_invoke_config" {
  function_name = aws_lambda_function.api_handler.function_name

  destination_config {
    on_failure {
      destination = aws_sns_topic.lambda_errors.arn
    }
  }

  maximum_retry_attempts = 2
}

resource "aws_lambda_event_invoke_config" "data_processor_invoke_config" {
  function_name = aws_lambda_function.data_processor.function_name

  destination_config {
    on_failure {
      destination = aws_sns_topic.lambda_errors.arn
    }
  }

  maximum_retry_attempts = 2
}

# API Gateway HTTP API (chosen over REST API for simpler WAF association)
resource "aws_apigatewayv2_api" "main" {
  name          = "${local.name_prefix}-api"
  protocol_type = "HTTP"
  description   = "ProjectX HTTP API with WAF protection"

  cors_configuration {
    allow_credentials = false
    allow_headers     = ["content-type", "x-amz-date", "authorization", "x-api-key"]
    allow_methods     = ["*"]
    allow_origins     = ["*"]
    expose_headers    = ["date", "keep-alive"]
    max_age          = 86400
  }

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-api"
    Description = "HTTP API Gateway for ProjectX with CORS and WAF protection"
  })
}

# API Gateway Stage
resource "aws_apigatewayv2_stage" "main" {
  api_id      = aws_apigatewayv2_api.main.id
  name        = var.environment
  auto_deploy = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip            = "$context.identity.sourceIp"
      requestTime   = "$context.requestTime"
      httpMethod    = "$context.httpMethod"
      routeKey      = "$context.routeKey"
      status        = "$context.status"
      protocol      = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-api-stage"
    Description = "API Gateway stage for ProjectX with access logging"
  })
}

# CloudWatch Log Group for API Gateway
resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/${local.name_prefix}"
  retention_in_days = 30

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-api-gateway-logs"
    Description = "CloudWatch log group for ProjectX API Gateway access logs"
  })
}

# API Gateway Integration with Lambda
resource "aws_apigatewayv2_integration" "lambda_integration" {
  api_id           = aws_apigatewayv2_api.main.id
  integration_type = "AWS_PROXY"

  connection_type    = "INTERNET"
  description        = "Lambda proxy integration for ProjectX API handler"
  integration_method = "POST"
  integration_uri    = aws_lambda_function.api_handler.invoke_arn
}

# API Gateway Route
resource "aws_apigatewayv2_route" "default_route" {
  api_id    = aws_apigatewayv2_api.main.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.lambda_integration.id}"
}

# Lambda permission for API Gateway
resource "aws_lambda_permission" "api_gateway_invoke" {
  statement_id  = "AllowExecutionFromAPIGateway"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.main.execution_arn}/*/*"
}

# WAF Web ACL for API Gateway protection
resource "aws_wafv2_web_acl" "api_protection" {
  name  = "${local.name_prefix}-api-waf"
  scope = "REGIONAL" # Required for API Gateway

  description = "WAF Web ACL for ProjectX API Gateway protection against common exploits"

  default_action {
    allow {}
  }

  # Rule 1: AWS Managed Core Rule Set (protects against OWASP Top 10)
  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

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
      metric_name                = "${local.name_prefix}-CommonRuleSet"
      sampled_requests_enabled   = true
    }
  }

  # Rule 2: AWS Managed Known Bad Inputs Rule Set
  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-KnownBadInputs"
      sampled_requests_enabled   = true
    }
  }

  # Rule 3: Rate limiting rule
  rule {
    name     = "RateLimitRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = 2000 # requests per 5-minute window
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-RateLimit"
      sampled_requests_enabled   = true
    }
  }

  # Rule 4: AWS Managed SQL Injection Rule Set
  rule {
    name     = "AWSManagedRulesSQLiRuleSet"
    priority = 4

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        name        = "AWSManagedRulesSQLiRuleSet"
        vendor_name = "AWS"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${local.name_prefix}-SQLiProtection"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${local.name_prefix}-WAF"
    sampled_requests_enabled   = true
  }

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-api-waf"
    Description = "WAF Web ACL protecting ProjectX API Gateway from common exploits and rate limiting"
  })
}

# Associate WAF Web ACL with API Gateway Stage
resource "aws_wafv2_web_acl_association" "api_gateway_association" {
  resource_arn = aws_apigatewayv2_stage.main.arn
  web_acl_arn  = aws_wafv2_web_acl.api_protection.arn
}

# CloudWatch Metric Alarm for Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_error_rate" {
  alarm_name          = "${local.name_prefix}-lambda-error-rate"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors Lambda function error rate for ProjectX"
  alarm_actions       = [aws_sns_topic.lambda_errors.arn]

  dimensions = {
    FunctionName = aws_lambda_function.api_handler.function_name
  }

  tags = merge(local.tags, {
    Name        = "${local.name_prefix}-lambda-error-alarm"
    Description = "CloudWatch alarm for monitoring ProjectX Lambda function errors"
  })
}
```

## File: `outputs.tf`

```hcl
# ProjectX Serverless Stack Outputs
# Exports important ARNs and resource identifiers for external reference

output "api_gateway_endpoint" {
  description = "API Gateway endpoint URL for ProjectX"
  value       = aws_apigatewayv2_stage.main.invoke_url
}

output "api_gateway_id" {
  description = "API Gateway ID"
  value       = aws_apigatewayv2_api.main.id
}

output "lambda_api_handler_arn" {
  description = "ARN of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.arn
}

output "lambda_api_handler_name" {
  description = "Name of the API handler Lambda function"
  value       = aws_lambda_function.api_handler.function_name
}

output "lambda_data_processor_arn" {
  description = "ARN of the data processor Lambda function"
  value       = aws_lambda_function.data_processor.arn
}

output "lambda_data_processor_name" {
  description = "Name of the data processor Lambda function"
  value       = aws_lambda_function.data_processor.function_name
}

output "dynamodb_table_name" {
  description = "Name of the DynamoDB table for application data"
  value       = aws_dynamodb_table.app_data.name
}

output "dynamodb_table_arn" {
  description = "ARN of the DynamoDB table"
  value       = aws_dynamodb_table.app_data.arn
}

output "s3_bucket_name" {
  description = "Name of the S3 bucket for application assets"
  value       = aws_s3_bucket.app_assets.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the S3 bucket for application assets"
  value       = aws_s3_bucket.app_assets.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for Lambda error notifications"
  value       = aws_sns_topic.lambda_errors.arn
}
```
