I'll create a secure multi-region API infrastructure for your financial services platform. Here's the complete Terraform configuration:

```hcl
# main.tf

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

# Primary region provider
provider "aws" {
  region = var.primary_region
  alias  = "primary"
}

# Secondary region provider
provider "aws" {
  region = var.secondary_region
  alias  = "secondary"
}

# Global provider for Route53 and CloudFront
provider "aws" {
  region = "us-east-1"
  alias  = "global"
}

# DynamoDB Global Table
resource "aws_dynamodb_table" "transactions" {
  provider = aws.primary
  
  name             = "${var.project_name}-transactions"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "transactionId"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "transactionId"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  global_secondary_index {
    name            = "userId-timestamp-index"
    hash_key        = "userId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = var.common_tags
}

# DynamoDB Global Table configuration
resource "aws_dynamodb_global_table" "transactions" {
  depends_on = [
    aws_dynamodb_table.transactions,
    aws_dynamodb_table.transactions_secondary
  ]
  
  name = "${var.project_name}-transactions"
  
  replica {
    region_name = var.primary_region
  }
  
  replica {
    region_name = var.secondary_region
  }
}

# DynamoDB table in secondary region
resource "aws_dynamodb_table" "transactions_secondary" {
  provider = aws.secondary
  
  name             = "${var.project_name}-transactions"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "transactionId"
  range_key        = "timestamp"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  attribute {
    name = "transactionId"
    type = "S"
  }
  
  attribute {
    name = "timestamp"
    type = "N"
  }
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  global_secondary_index {
    name            = "userId-timestamp-index"
    hash_key        = "userId"
    range_key       = "timestamp"
    projection_type = "ALL"
  }
  
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.dynamodb_secondary.arn
  }
  
  point_in_time_recovery {
    enabled = true
  }
  
  tags = var.common_tags
}

# KMS keys for encryption
resource "aws_kms_key" "dynamodb" {
  provider                = aws.primary
  description             = "KMS key for DynamoDB encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = var.common_tags
}

resource "aws_kms_key" "dynamodb_secondary" {
  provider                = aws.secondary
  description             = "KMS key for DynamoDB encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  
  tags = var.common_tags
}

# Secrets Manager for API keys
resource "aws_secretsmanager_secret" "api_keys" {
  provider = aws.primary
  name     = "${var.project_name}-api-keys"
  
  replica {
    region = var.secondary_region
  }
  
  tags = var.common_tags
}

resource "aws_secretsmanager_secret_version" "api_keys" {
  provider      = aws.primary
  secret_id     = aws_secretsmanager_secret.api_keys.id
  secret_string = jsonencode({
    master_api_key = var.master_api_key
    jwt_secret     = var.jwt_secret
  })
}

# Lambda execution role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-lambda-execution-role"
  
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

# Lambda execution policy
resource "aws_iam_role_policy" "lambda_execution" {
  name = "${var.project_name}-lambda-execution-policy"
  role = aws_iam_role.lambda_execution.id
  
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
        Resource = "arn:aws:logs:*:*:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.transactions.arn,
          "${aws_dynamodb_table.transactions.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = aws_secretsmanager_secret.api_keys.arn
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      }
    ]
  })
}

# Lambda layer for common dependencies
resource "aws_lambda_layer_version" "common" {
  provider            = aws.primary
  filename            = "lambda_layer.zip"
  layer_name          = "${var.project_name}-common-layer"
  compatible_runtimes = ["python3.10"]
  
  lifecycle {
    ignore_changes = [filename]
  }
}

# Lambda authorizer function - Primary region
resource "aws_lambda_function" "authorizer_primary" {
  provider         = aws.primary
  filename         = "lambda_authorizer.zip"
  function_name    = "${var.project_name}-authorizer-primary"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda_authorizer.lambda_handler"
  source_code_hash = filebase64sha256("lambda_authorizer.zip")
  runtime         = "python3.10"
  timeout         = 10
  memory_size     = 256
  
  layers = [aws_lambda_layer_version.common.arn]
  
  environment {
    variables = {
      SECRET_NAME = aws_secretsmanager_secret.api_keys.name
      REGION      = var.primary_region
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
  
  tags = var.common_tags
}

# Lambda authorizer function - Secondary region
resource "aws_lambda_function" "authorizer_secondary" {
  provider         = aws.secondary
  filename         = "lambda_authorizer.zip"
  function_name    = "${var.project_name}-authorizer-secondary"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda_authorizer.lambda_handler"
  source_code_hash = filebase64sha256("lambda_authorizer.zip")
  runtime         = "python3.10"
  timeout         = 10
  memory_size     = 256
  
  environment {
    variables = {
      SECRET_NAME = aws_secretsmanager_secret.api_keys.name
      REGION      = var.secondary_region
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
  
  tags = var.common_tags
}

# Transaction processing Lambda - Primary region
resource "aws_lambda_function" "transaction_primary" {
  provider         = aws.primary
  filename         = "lambda_transaction.zip"
  function_name    = "${var.project_name}-transaction-primary"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda_transaction.lambda_handler"
  source_code_hash = filebase64sha256("lambda_transaction.zip")
  runtime         = "python3.10"
  timeout         = 30
  memory_size     = 512
  
  layers = [aws_lambda_layer_version.common.arn]
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.transactions.name
      REGION         = var.primary_region
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
  
  tags = var.common_tags
}

# Transaction processing Lambda - Secondary region
resource "aws_lambda_function" "transaction_secondary" {
  provider         = aws.secondary
  filename         = "lambda_transaction.zip"
  function_name    = "${var.project_name}-transaction-secondary"
  role            = aws_iam_role.lambda_execution.arn
  handler         = "lambda_transaction.lambda_handler"
  source_code_hash = filebase64sha256("lambda_transaction.zip")
  runtime         = "python3.10"
  timeout         = 30
  memory_size     = 512
  
  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.transactions_secondary.name
      REGION         = var.secondary_region
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  lifecycle {
    ignore_changes = [filename, source_code_hash]
  }
  
  tags = var.common_tags
}

# API Gateway - Primary region
resource "aws_api_gateway_rest_api" "main_primary" {
  provider    = aws.primary
  name        = "${var.project_name}-api-primary"
  description = "Transaction Processing API - Primary Region"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = var.common_tags
}

# API Gateway - Secondary region
resource "aws_api_gateway_rest_api" "main_secondary" {
  provider    = aws.secondary
  name        = "${var.project_name}-api-secondary"
  description = "Transaction Processing API - Secondary Region"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = var.common_tags
}

# API Gateway Authorizer - Primary
resource "aws_api_gateway_authorizer" "custom_primary" {
  provider                   = aws.primary
  name                       = "${var.project_name}-custom-authorizer"
  rest_api_id                = aws_api_gateway_rest_api.main_primary.id
  authorizer_uri             = aws_lambda_function.authorizer_primary.invoke_arn
  authorizer_credentials     = aws_iam_role.api_gateway_authorizer.arn
  type                       = "TOKEN"
  authorizer_result_ttl_in_seconds = 300
  identity_source            = "method.request.header.Authorization"
}

# API Gateway Authorizer - Secondary
resource "aws_api_gateway_authorizer" "custom_secondary" {
  provider                   = aws.secondary
  name                       = "${var.project_name}-custom-authorizer"
  rest_api_id                = aws_api_gateway_rest_api.main_secondary.id
  authorizer_uri             = aws_lambda_function.authorizer_secondary.invoke_arn
  authorizer_credentials     = aws_iam_role.api_gateway_authorizer.arn
  type                       = "TOKEN"
  authorizer_result_ttl_in_seconds = 300
  identity_source            = "method.request.header.Authorization"
}

# API Gateway IAM role for invoking Lambda
resource "aws_iam_role" "api_gateway_authorizer" {
  name = "${var.project_name}-api-gateway-authorizer-role"
  
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "apigateway.amazonaws.com"
        }
      }
    ]
  })
  
  tags = var.common_tags
}

resource "aws_iam_role_policy" "api_gateway_authorizer" {
  name = "${var.project_name}-api-gateway-authorizer-policy"
  role = aws_iam_role.api_gateway_authorizer.id
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = "lambda:InvokeFunction"
        Resource = [
          aws_lambda_function.authorizer_primary.arn,
          aws_lambda_function.authorizer_secondary.arn
        ]
      }
    ]
  })
}

# API Gateway resources and methods - Primary
resource "aws_api_gateway_resource" "transactions_primary" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.main_primary.id
  parent_id   = aws_api_gateway_rest_api.main_primary.root_resource_id
  path_part   = "transactions"
}

resource "aws_api_gateway_method" "post_transaction_primary" {
  provider      = aws.primary
  rest_api_id   = aws_api_gateway_rest_api.main_primary.id
  resource_id   = aws_api_gateway_resource.transactions_primary.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.custom_primary.id
}

resource "aws_api_gateway_integration" "transaction_primary" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.main_primary.id
  resource_id = aws_api_gateway_resource.transactions_primary.id
  http_method = aws_api_gateway_method.post_transaction_primary.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transaction_primary.invoke_arn
}

# API Gateway resources and methods - Secondary
resource "aws_api_gateway_resource" "transactions_secondary" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.main_secondary.id
  parent_id   = aws_api_gateway_rest_api.main_secondary.root_resource_id
  path_part   = "transactions"
}

resource "aws_api_gateway_method" "post_transaction_secondary" {
  provider      = aws.secondary
  rest_api_id   = aws_api_gateway_rest_api.main_secondary.id
  resource_id   = aws_api_gateway_resource.transactions_secondary.id
  http_method   = "POST"
  authorization = "CUSTOM"
  authorizer_id = aws_api_gateway_authorizer.custom_secondary.id
}

resource "aws_api_gateway_integration" "transaction_secondary" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.main_secondary.id
  resource_id = aws_api_gateway_resource.transactions_secondary.id
  http_method = aws_api_gateway_method.post_transaction_secondary.http_method
  
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.transaction_secondary.invoke_arn
}

# API Gateway Stage - Primary
resource "aws_api_gateway_deployment" "main_primary" {
  provider = aws.primary
  depends_on = [
    aws_api_gateway_integration.transaction_primary
  ]
  
  rest_api_id = aws_api_gateway_rest_api.main_primary.id
  stage_name  = var.api_stage
  
  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage - Secondary
resource "aws_api_gateway_deployment" "main_secondary" {
  provider = aws.secondary
  depends_on = [
    aws_api_gateway_integration.transaction_secondary
  ]
  
  rest_api_id = aws_api_gateway_rest_api.main_secondary.id
  stage_name  = var.api_stage
  
  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage Settings - Primary
resource "aws_api_gateway_stage" "main_primary" {
  provider              = aws.primary
  deployment_id         = aws_api_gateway_deployment.main_primary.id
  rest_api_id           = aws_api_gateway_rest_api.main_primary.id
  stage_name            = var.api_stage
  xray_tracing_enabled  = true
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_primary.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
  
  tags = var.common_tags
}

# API Gateway Stage Settings - Secondary
resource "aws_api_gateway_stage" "main_secondary" {
  provider              = aws.secondary
  deployment_id         = aws_api_gateway_deployment.main_secondary.id
  rest_api_id           = aws_api_gateway_rest_api.main_secondary.id
  stage_name            = var.api_stage
  xray_tracing_enabled  = true
  
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_secondary.arn
    format = jsonencode({
      requestId      = "$context.requestId"
      ip             = "$context.identity.sourceIp"
      requestTime    = "$context.requestTime"
      httpMethod     = "$context.httpMethod"
      routeKey       = "$context.routeKey"
      status         = "$context.status"
      protocol       = "$context.protocol"
      responseLength = "$context.responseLength"
    })
  }
  
  tags = var.common_tags
}

# API Gateway throttling settings - Primary
resource "aws_api_gateway_method_settings" "all_primary" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.main_primary.id
  stage_name  = aws_api_gateway_stage.main_primary.stage_name
  method_path = "*/*"
  
  settings {
    throttling_burst_limit = 10000
    throttling_rate_limit  = 5000
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = false
    caching_enabled        = false
  }
}

# API Gateway throttling settings - Secondary
resource "aws_api_gateway_method_settings" "all_secondary" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.main_secondary.id
  stage_name  = aws_api_gateway_stage.main_secondary.stage_name
  method_path = "*/*"
  
  settings {
    throttling_burst_limit = 10000
    throttling_rate_limit  = 5000
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = false
    caching_enabled        = false
  }
}

# Lambda permissions for API Gateway - Primary
resource "aws_lambda_permission" "api_gateway_transaction_primary" {
  provider      = aws.primary
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_primary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main_primary.execution_arn}/*/*"
}

# Lambda permissions for API Gateway - Secondary
resource "aws_lambda_permission" "api_gateway_transaction_secondary" {
  provider      = aws.secondary
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.transaction_secondary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.main_secondary.execution_arn}/*/*"
}

# Route 53 Health Checks
resource "aws_route53_health_check" "primary" {
  fqdn              = "${aws_api_gateway_rest_api.main_primary.id}.execute-api.${var.primary_region}.amazonaws.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/${var.api_stage}/health"
  failure_threshold = "5"
  request_interval  = "30"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-primary-health-check"
  })
}

resource "aws_route53_health_check" "secondary" {
  fqdn              = "${aws_api_gateway_rest_api.main_secondary.id}.execute-api.${var.secondary_region}.amazonaws.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/${var.api_stage}/health"
  failure_threshold = "5"
  request_interval  = "30"
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-secondary-health-check"
  })
}

# Route 53 Hosted Zone (assuming it exists)
data "aws_route53_zone" "main" {
  name = var.domain_name
}

# Route 53 Latency-based routing records
resource "aws_route53_record" "api_primary" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60
  
  weighted_routing_policy {
    weight = 50
  }
  
  set_identifier  = "primary"
  records         = ["${aws_api_gateway_rest_api.main_primary.id}.execute-api.${var.primary_region}.amazonaws.com"]
  health_check_id = aws_route53_health_check.primary.id
}

resource "aws_route53_record" "api_secondary" {
  zone_id = data.aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60
  
  weighted_routing_policy {
    weight = 50
  }
  
  set_identifier  = "secondary"
  records         = ["${aws_api_gateway_rest_api.main_secondary.id}.execute-api.${var.secondary_region}.amazonaws.com"]
  health_check_id = aws_route53_health_check.secondary.id
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "api" {
  provider = aws.global
  enabled  = true
  comment  = "${var.project_name} API Distribution"
  
  origin {
    domain_name = "api.${var.domain_name}"
    origin_id   = "api-origin"
    
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "https-only"
      origin_ssl_protocols   = ["TLSv1.2"]
    }
  }
  
  default_cache_behavior {
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "api-origin"
    
    forwarded_values {
      query_string = true
      headers      = ["Authorization", "Content-Type", "X-Amz-Date", "X-Api-Key", "X-Amz-Security-Token"]
      
      cookies {
        forward = "none"
      }
    }
    
    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 0
    max_ttl                = 0
    compress               = true
  }
  
  price_class = "PriceClass_100"
  
  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }
  
  viewer_certificate {
    cloudfront_default_certificate = true
  }
  
  web_acl_id = aws_wafv2_web_acl.api_protection.arn
  
  tags = var.common_tags
}

# CloudWatch Log Groups
resource "aws_cloudwatch_log_group" "api_gateway_primary" {
  provider          = aws.primary
  name              = "/aws/apigateway/${var.project_name}-primary"
  retention_in_days = 90
  
  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "api_gateway_secondary" {
  provider          = aws.secondary
  name              = "/aws/apigateway/${var.project_name}-secondary"
  retention_in_days = 90
  
  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_authorizer_primary" {
  provider          = aws.primary
  name              = "/aws/lambda/${var.project_name}-authorizer-primary"
  retention_in_days = 90
  
  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_authorizer_secondary" {
  provider          = aws.secondary
  name              = "/aws/lambda/${var.project_name}-authorizer-secondary"
  retention_in_days = 90
  
  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_transaction_primary" {
  provider          = aws.primary
  name              = "/aws/lambda/${var.project_name}-transaction-primary"
  retention_in_days = 90
  
  tags = var.common_tags
}

resource "aws_cloudwatch_log_group" "lambda_transaction_secondary" {
  provider          = aws.secondary
  name              = "/aws/lambda/${var.project_name}-transaction-secondary"
  retention_in_days = 90
  
  tags = var.common_tags
}
```

```hcl
# variables.tf

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "fintech-api"
}

variable "primary_region" {
  description = "Primary AWS region"
  type        = string
  default     = "us-east-1"
}

variable "secondary_region" {
  description = "Secondary AWS region"
  type        = string
  default     = "us-west-2"
}

variable "api_stage" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "domain_name" {
  description = "Domain name for Route 53"
  type        = string
}

variable "master_api_key" {
  description = "Master API key for authentication"
  type        = string
  sensitive   = true
}

variable "jwt_secret" {
  description = "JWT secret for token signing"
  type        = string
  sensitive   = true
}

variable "allowed_origins" {
  description = "Allowed CORS origins"
  type        = list(string)
  default     = ["https://app.example.com"]
}

variable "transaction_rate_limit" {
  description = "Maximum transactions per second per user"
  type        = number
  default     = 10
}

variable "alarm_email" {
  description = "Email for CloudWatch alarm notifications"
  type        = string
}

variable "common_tags" {
  description = "Common tags for all resources"
  type        = map(string)
  default = {
    Project     = "Financial Services API"
    Environment = "Production"
    Compliance  = "GDPR"
    ManagedBy   = "Terraform"
  }
}

variable "waf_ip_whitelist" {
  description = "IP addresses to whitelist in WAF"
  type        = list(string)
  default     = []
}

variable "waf_rate_limit" {
  description = "WAF rate limit per 5-minute window"
  type        = number
  default     = 10000
}

variable "enable_api_caching" {
  description = "Enable API Gateway caching"
  type        = bool
  default     = false
}

variable "api_cache_size" {
  description = "API Gateway cache size in GB"
  type        = string
  default     = "0.5"
}

variable "enable_detailed_monitoring" {
  description = "Enable detailed CloudWatch monitoring"
  type        = bool
  default     = true
}

variable "xray_sampling_rate" {
  description = "X-Ray sampling rate (0.0 to 1.0)"
  type        = number
  default     = 0.1
}
```

```python
# lambda_authorizer.py

import json
import jwt
import boto3
import os
import time
from typing import Dict, Any, Optional
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch boto3 for X-Ray tracing
patch_all()

# Initialize AWS clients
secrets_client = boto3.client('secretsmanager', region_name=os.environ['REGION'])

# Cache for secrets
secret_cache = {}
CACHE_TTL = 300  # 5 minutes

@xray_recorder.capture('get_secret')
def get_secret() -> Dict[str, str]:
    """Retrieve and cache secrets from AWS Secrets Manager"""
    secret_name = os.environ['SECRET_NAME']
    
    # Check cache
    if secret_name in secret_cache:
        cached_secret = secret_cache[secret_name]
        if cached_secret['expiry'] > time.time():
            return cached_secret['value']
    
    try:
        response = secrets_client.get_secret_value(SecretId=secret_name)
        secret_value = json.loads(response['SecretString'])
        
        # Cache the secret
        secret_cache[secret_name] = {
            'value': secret_value,
            'expiry': time.time() + CACHE_TTL
        }
        
        return secret_value
    except Exception as e:
        print(f"Error retrieving secret: {e}")
        raise Exception('Unauthorized')

@xray_recorder.capture('validate_token')
def validate_token(token: str) -> Dict[str, Any]:
    """Validate JWT token and extract claims"""
    secrets = get_secret()
    jwt_secret = secrets['jwt_secret']
    
    try:
        # Remove 'Bearer ' prefix if present
        if token.startswith('Bearer '):
            token = token[7:]
        
        # Decode and verify JWT
        payload = jwt.decode(
            token,
            jwt_secret,
            algorithms=['HS256'],
            options={"verify_exp": True}
        )
        
        # Additional validation
        required_claims = ['user_id', 'permissions', 'exp']
        for claim in required_claims:
            if claim not in payload:
                raise Exception(f'Missing required claim: {claim}')
        
        # Check if user has transaction permissions
        if 'transactions' not in payload.get('permissions', []):
            raise Exception('Insufficient permissions')
        
        return payload
    
    except jwt.ExpiredSignatureError:
        raise Exception('Token expired')
    except jwt.InvalidTokenError:
        raise Exception('Invalid token')
    except Exception as e:
        print(f"Token validation error: {e}")
        raise Exception('Unauthorized')

@xray_recorder.capture('generate_policy')
def generate_policy(principal_id: str, effect: str, resource: str, context: Optional[Dict] = None) -> Dict:
    """Generate IAM policy for API Gateway"""
    auth_response = {
        'principalId': principal_id,
        'policyDocument': {
            'Version': '2012-10-17',
            'Statement': [
                {
                    'Action': 'execute-api:Invoke',
                    'Effect': effect,
                    'Resource': resource
                }
            ]
        }
    }
    
    if context:
        auth_response['context'] = context
    
    return auth_response

@xray_recorder.capture('lambda_handler')
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict:
    """Main Lambda handler for custom authorization"""
    print(f"Authorization event: {json.dumps(event)}")
    
    try:
        # Extract token from event
        token = event.get('authorizationToken', '')
        
        if not token:
            raise Exception('No authorization token provided')
        
        # Validate token
        token_payload = validate_token(token)
        
        # Generate Allow policy
        policy = generate_policy(
            principal_id=token_payload['user_id'],
            effect='Allow',
            resource=event['methodArn'],
            context={
                'userId': token_payload['user_id'],
                'permissions': json.dumps(token_payload['permissions']),
                'tokenExpiry': str(token_payload['exp'])
            }
        )
        
        print(f"Authorization successful for user: {token_payload['user_id']}")
        return policy
    
    except Exception as e:
        print(f"Authorization failed: {e}")
        # Return explicit Deny for failed authorization
        return generate_policy(
            principal_id='unauthorized',
            effect='Deny',
            resource=event['methodArn']
        )
```

```python
# lambda_transaction.py

import json
import boto3
import os
import time
import uuid
import hashlib
from decimal import Decimal
from typing import Dict, Any, Optional
from datetime import datetime
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all

# Patch boto3 for X-Ray tracing
patch_all()

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb', region_name=os.environ['REGION'])
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

# Constants
MAX_AMOUNT = Decimal('1000000')  # Maximum transaction amount
MIN_AMOUNT = Decimal('0.01')     # Minimum transaction amount

class TransactionError(Exception):
    """Custom exception for transaction errors"""
    pass

@xray_recorder.capture('validate_transaction')
def validate_transaction(transaction: Dict[str, Any]) -> Dict[str, Any]:
    """Validate transaction data"""
    required_fields = ['amount', 'currency', 'recipient', 'type']
    
    # Check required fields
    for field in required_fields:
        if field not in transaction:
            raise TransactionError(f'Missing required field: {field}')
    
    # Validate amount
    try:
        amount = Decimal(str(transaction['amount']))
        if amount < MIN_AMOUNT or amount > MAX_AMOUNT:
            raise TransactionError(f'Amount must be between {MIN_AMOUNT} and {MAX_AMOUNT}')
    except (ValueError, TypeError):
        raise TransactionError('Invalid amount format')
    
    # Validate currency
    valid_currencies = ['USD', 'EUR', 'GBP']
    if transaction['currency'] not in valid_currencies:
        raise TransactionError(f'Invalid currency. Must be one of: {valid_currencies}')
    
    # Validate transaction type
    valid_types = ['transfer', 'payment', 'refund']
    if transaction['type'] not in valid_types:
        raise TransactionError(f'Invalid transaction type. Must be one of: {valid_types}')
    
    return {
        **transaction,
        'amount': amount
    }

@xray_recorder.capture('process_transaction')
def process_transaction(transaction: Dict[str, Any], user_id: str) -> Dict[str, Any]:
    """Process and store transaction"""
    # Generate transaction ID
    transaction_id = str(uuid.uuid4())
    timestamp = int(time.time() * 1000)  # Millisecond precision
    
    # Create transaction record
    transaction_record = {
        'transactionId': transaction_id,
        'timestamp': timestamp,
        'userId': user_id,
        'amount': transaction['amount'],
        'currency': transaction['currency'],
        'recipient': transaction['recipient'],
        'type': transaction['type'],
        'status': 'pending',
        'createdAt': datetime.utcnow().isoformat(),
        'metadata': transaction.get('metadata', {}),
        'hash': generate_transaction_hash(transaction_id, user_id, str(transaction['amount']))
    }
    
    # Additional fields for GDPR compliance
    if 'ip_address' in transaction:
        # Hash IP address for privacy
        transaction_record['hashedIp'] = hashlib.sha256(transaction['ip_address'].encode()).hexdigest()
    
    # Store in DynamoDB
    try:
        table.put_item(
            Item=transaction_record,
            ConditionExpression='attribute_not_exists(transactionId)'
        )
        
        # Simulate processing delay (in real scenario, this would be async)
        transaction_record['status'] = 'completed'
        update_transaction_status(transaction_id, 'completed')
        
    except Exception as e:
        print(f"Error storing transaction: {e}")
        raise TransactionError('Failed to process transaction')
    
    return transaction_record

@xray_recorder.capture('update_transaction_status')
def update_transaction_status(transaction_id: str, status: str) -> None:
    """Update transaction status in DynamoDB"""
    try:
        table.update_item(
            Key={'transactionId': transaction_id, 'timestamp': timestamp},
            UpdateExpression='SET #status = :status, updatedAt = :updatedAt',
            ExpressionAttributeNames={'#status': 'status'},
            ExpressionAttributeValues={
                ':status': status,
                ':updatedAt': datetime.utcnow().isoformat()
            }
        )
    except Exception as e:
        print(f"Error updating transaction status: {e}")

def generate_transaction_hash(transaction_id: str, user_id: str, amount: str) -> str:
    """Generate a hash for transaction integrity"""
    data = f"{transaction_id}:{user_id}:{amount}:{int(time.time())}"
    return hashlib.sha256(data.encode()).hexdigest()

def build_response(status_code: int, body: Any, headers: Optional[Dict] = None) -> Dict:
    """Build API Gateway response"""
    response = {
        'statusCode': status_code,
        'headers': {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',  # Configure based on allowed origins
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'X-Request-ID': str(uuid.uuid4())
        },
        'body': json.dumps(body, default=str)
    }
    
    if headers:
        response['headers'].update(headers)
    
    return response

@xray_recorder.capture('lambda_handler')
def lambda_handler(event: Dict[str, Any], context: Any) -> Dict:
    """Main Lambda handler for transaction processing"""
    print(f"Transaction event: {json.dumps(event)}")
    
    try:
        # Parse request body
        if isinstance(event.get('body'), str):
            body = json.loads(event['body'])
        else:
            body = event.get('body', {})
        
        # Extract user context from authorizer
        authorizer_context = event.get('requestContext', {}).get('authorizer', {})
        user_id = authorizer_context.get('userId')
        
        if not user_id:
            return build_response(401, {'error': 'Unauthorized'})
        
        # Add request metadata
        body['ip_address'] = event.get('requestContext', {}).get('identity', {}).get('sourceIp')
        
        # Validate transaction
        validated_transaction = validate_transaction(body)
        
        # Process transaction
        result = process_transaction(validated_transaction, user_id)
        
        # Remove sensitive data from response
        response_data = {
            'transactionId': result['transactionId'],
            'status': result['status'],
            'timestamp': result['timestamp'],
            'amount': str(result['amount']),
            'currency': result['currency'],
            'type': result['type']
        }
        
        return build_response(200, {
            'message': 'Transaction processed successfully',
            'transaction': response_data
        })
    
    except TransactionError as e:
        print(f"Transaction error: {e}")
        return build_response(400, {'error': str(e)})
    
    except Exception as e:
        print(f"Unexpected error: {e}")
        xray_recorder.capture_exception()
        return build_response(500, {'error': 'Internal server error'})
```

```hcl
# security.tf

# WAF Web ACL for CloudFront
resource "aws_wafv2_web_acl" "api_protection" {
  provider = aws.global
  name     = "${var.project_name}-waf-acl"
  scope    = "CLOUDFRONT"
  
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
        limit              = var.waf_rate_limit
        aggregate_key_type = "IP"
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }
  
  # SQL Injection protection
  rule {
    name     = "SQLInjectionRule"
    priority = 2
    
    action {
      block {}
    }
    
    statement {
      or_statement {
        statement {
          sqli_match_statement {
            field_to_match {
              body {}
            }
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
            text_transformation {
              priority = 2
              type     = "HTML_ENTITY_DECODE"
            }
          }
        }
        statement {
          sqli_match_statement {
            field_to_match {
              query_string {}
            }
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
          }
        }
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-sql-injection"
      sampled_requests_enabled   = true
    }
  }
  
  # XSS protection
  rule {
    name     = "XSSRule"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      or_statement {
        statement {
          xss_match_statement {
            field_to_match {
              body {}
            }
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
            text_transformation {
              priority = 2
              type     = "HTML_ENTITY_DECODE"
            }
          }
        }
        statement {
          xss_match_statement {
            field_to_match {
              query_string {}
            }
            text_transformation {
              priority = 1
              type     = "URL_DECODE"
            }
          }
        }
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-xss"
      sampled_requests_enabled   = true
    }
  }
  
  # IP Whitelist rule (if configured)
  dynamic "rule" {
    for_each = length(var.waf_ip_whitelist) > 0 ? [1] : []
    
    content {
      name     = "IPWhitelistRule"
      priority = 0
      
      action {
        allow {}
      }
      
      statement {
        ip_set_reference_statement {
          arn = aws_wafv2_ip_set.whitelist[0].arn
        }
      }
      
      visibility_config {
        cloudwatch_metrics_enabled = true
        metric_name                = "${var.project_name}-ip-whitelist"
        sampled_requests_enabled   = true
      }
    }
  }
  
  # Size constraint rule
  rule {
    name     = "SizeRestrictionRule"
    priority = 4
    
    action {
      block {}
    }
    
    statement {
      or_statement {
        statement {
          size_constraint_statement {
            field_to_match {
              body {}
            }
            comparison_operator = "GT"
            size                = 8192  # 8KB limit
            text_transformation {
              priority = 1
              type     = "NONE"
            }
          }
        }
        statement {
          size_constraint_statement {
            field_to_match {
              single_header {
                name = "content-length"
              }
            }
            comparison_operator = "GT"
            size                = 8192
            text_transformation {
              priority = 1
              type     = "NONE"
            }
          }
        }
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.project_name}-size-restriction"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.project_name}-waf"
    sampled_requests_enabled   = true
  }
  
  tags = var.common_tags
}

# IP Set for whitelist (if configured)
resource "aws_wafv2_ip_set" "whitelist" {
  count    = length(var.waf_ip_whitelist) > 0 ? 1 : 0
  provider = aws.global
  
  name               = "${var.project_name}-ip-whitelist"
  scope              = "CLOUDFRONT"
  ip_address_version = "IPV4"
  addresses          = var.waf_ip_whitelist
  
  tags = var.common_tags
}

# Security Groups for Lambda functions (VPC mode if needed)
resource "aws_security_group" "lambda" {
  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main.id
  
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
    description = "Allow all outbound traffic"
  }
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-lambda-sg"
  })
}

# VPC for Lambda functions (if needed for private resources)
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

# Private subnets for Lambda
resource "aws_subnet" "private" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]
  
  tags = merge(var.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Data source for AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# IAM policy for encryption
resource "aws_iam_policy" "encryption" {
  name        = "${var.project_name}-encryption-policy"
  description = "Policy for encryption operations"
  
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.dynamodb.arn,
          aws_kms_key.dynamodb_secondary.arn
        ]
      }
    ]
  })
}

# Attach encryption policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_encryption" {
  role       = aws_iam_role.lambda_execution.name
  policy_arn = aws_iam_policy.encryption.arn
}

# S3 bucket for WAF logs
resource "aws_s3_bucket" "waf_logs" {
  provider = aws.global
  bucket   = "${var.project_name}-waf-logs-${data.aws_caller_identity.current.account_id}"
  
  tags = var.common_tags
}

resource "aws_s3_bucket_versioning" "waf_logs" {
  provider = aws.global
  bucket   = aws_s3_bucket.waf_logs.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "waf_logs" {
  provider = aws.global
  bucket   = aws_s3_bucket.waf_logs.id
  
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "waf_logs" {
  provider = aws.global
  bucket   = aws_s3_bucket.waf_logs.id
  
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "waf_logs" {
  provider = aws.global
  bucket   = aws_s3_bucket.waf_logs.id
  
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

# WAF logging configuration
resource "aws_wafv2_web_acl_logging_configuration" "api_protection" {
  provider                = aws.global
  resource_arn            = aws_wafv2_web_acl.api_protection.arn
  log_destination_configs = [aws_s3_bucket.waf_logs.arn]
  
  redacted_fields {
    single_header {
      name = "authorization"
    }
  }
}

# Data source for current account
data "aws_caller_identity" "current" {}
```

```hcl
# monitoring.tf

# SNS topic for alarms
resource "aws_sns_topic" "alarms" {
  name = "${var.project_name}-alarms"
  
  tags = var.common_tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  topic_arn = aws_sns_topic.alarms.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# X-Ray sampling rule
resource "aws_xray_sampling_rule" "api" {
  rule_name      = "${var.project_name}-sampling"
  priority       = 9999
  version        = 1
  reservoir_size = 1
  fixed_rate     = var.xray_sampling_rate
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"
  
  attributes = {
    Environment = "Production"
  }
}

# CloudWatch Dashboard
resource "aws_cloudwatch_dashboard" "main" {
  dashboard_name = "${var.project_name}-dashboard"
  
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
            ["AWS/ApiGateway", "Count", { stat = "Sum", period = 300 }],
            [".", "4XXError", { stat = "Sum", period = 300 }],
            [".", "5XXError", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.primary_region
          title   = "API Gateway Requests"
          yAxis = {
            left = {
              showUnits = false
            }
          }
        }
      },
      # Lambda duration metrics
      {
        type   = "metric"
        x      = 12
        y      = 0
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/Lambda", "Duration", { stat = "Average", period = 300 }],
            ["...", { stat = "Maximum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.primary_region
          title   = "Lambda Duration"
          yAxis = {
            left = {
              showUnits = false
            }
          }
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
            ["AWS/DynamoDB", "ConsumedReadCapacityUnits", { stat = "Sum", period = 300 }],
            [".", "ConsumedWriteCapacityUnits", { stat = "Sum", period = 300 }],
            [".", "UserErrors", { stat = "Sum", period = 300 }],
            [".", "SystemErrors", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.primary_region
          title   = "DynamoDB Performance"
        }
      },
      # WAF metrics
      {
        type   = "metric"
        x      = 12
        y      = 6
        width  = 12
        height = 6
        
        properties = {
          metrics = [
            ["AWS/WAFV2", "BlockedRequests", { stat = "Sum", period = 300 }],
            [".", "AllowedRequests", { stat = "Sum", period = 300 }],
            [".", "CountedRequests", { stat = "Sum", period = 300 }]
          ]
          view    = "timeSeries"
          stacked = false
          region  = "us-east-1"
          title   = "WAF Activity"
        }
      }
    ]
  })
}

# CloudWatch Alarms

# High API error rate
resource "aws_cloudwatch_metric_alarm" "high_4xx_errors" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-high-4xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "This metric monitors 4xx errors"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.main_primary.name
    Stage   = var.api_stage
  }
  
  tags = var.common_tags
}

resource "aws_cloudwatch_metric_alarm" "high_5xx_errors" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-high-5xx-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors 5xx errors"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    ApiName = aws_api_gateway_rest_api.main_primary.name
    Stage   = var.api_stage
  }
  
  tags = var.common_tags
}

# Lambda errors
resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-lambda-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors lambda errors"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.transaction_primary.function_name
  }
  
  tags = var.common_tags
}

# Lambda throttles
resource "aws_cloudwatch_metric_alarm" "lambda_throttles" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-lambda-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Throttles"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors lambda throttles"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"
  
  dimensions = {
    FunctionName = aws_lambda_function.transaction_primary.function_name
  }
  
  tags = var.common_tags
}

# Lambda duration
resource "aws_cloudwatch_metric_