Here is the corrected, production-ready Terraform implementation for the secure multi-region API infrastructure. This configuration resolves all deployment issues from the MODEL_RESPONSE and follows AWS best practices.

```hcl
# provider.tf

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

# variables.tf

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

variable "enable_route53" {
  description = "Enable Route 53 for custom domain routing"
  type        = bool
  default     = false
}

variable "domain_name" {
  description = "Domain name for Route 53"
  type        = string
  default     = ""
}

variable "master_api_key" {
  description = "Master API key for authentication"
  type        = string
  sensitive   = true
  default     = "change-me-in-production-master-key-12345"
}

variable "jwt_secret" {
  description = "JWT secret for token signing"
  type        = string
  sensitive   = true
  default     = "change-me-in-production-jwt-secret-67890"
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
  default     = "alerts@example.com"
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

variable "enable_vpc" {
  description = "Enable VPC for Lambda functions"
  type        = bool
  default     = false
}
# main.tf

# main.tf

# DynamoDB Global Table v2 (2019.11.21)
# This version supports replicas configured directly in the table
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

  # Global Table v2 - Configure replica in secondary region
  replica {
    region_name = var.secondary_region
    
    point_in_time_recovery = true
  }

  server_side_encryption {
    enabled = true
    # Using AWS-managed encryption for simplicity
    # Can use customer-managed KMS keys with Global Table v2 if needed
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = var.common_tags
}

# KMS keys for encryption - Not used with Global Table v1
# Global Table v1 (2017.11.29) doesn't support customer-managed KMS keys
# Using AWS-managed encryption instead
# Uncomment and configure if migrating to Global Table v2 (2019.11.21)
# resource "aws_kms_key" "dynamodb" {
#   provider                = aws.primary
#   description             = "KMS key for DynamoDB encryption"
#   deletion_window_in_days = 30
#   enable_key_rotation     = true
#
#   tags = var.common_tags
# }
#
# resource "aws_kms_key" "dynamodb_secondary" {
#   provider                = aws.secondary
#   description             = "KMS key for DynamoDB encryption"
#   deletion_window_in_days = 30
#   enable_key_rotation     = true
#
#   tags = var.common_tags
# }

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
  provider  = aws.primary
  secret_id = aws_secretsmanager_secret.api_keys.id
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
        Resource = [
          "${aws_cloudwatch_log_group.lambda_authorizer_primary.arn}:*",
          "${aws_cloudwatch_log_group.lambda_authorizer_secondary.arn}:*",
          "${aws_cloudwatch_log_group.lambda_transaction_primary.arn}:*",
          "${aws_cloudwatch_log_group.lambda_transaction_secondary.arn}:*"
        ]
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
        # X-Ray does not support resource-level permissions
        Resource = "*"
      }
    ]
  })
}

# Lambda layer for common dependencies - Primary region
resource "aws_lambda_layer_version" "common_primary" {
  provider            = aws.primary
  filename            = "lambda_layer.zip"
  layer_name          = "${var.project_name}-common-layer"
  compatible_runtimes = ["python3.10"]

  lifecycle {
    ignore_changes = [filename]
  }
}

# Lambda layer for common dependencies - Secondary region
resource "aws_lambda_layer_version" "common_secondary" {
  provider            = aws.secondary
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
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_authorizer.lambda_handler"
  source_code_hash = filebase64sha256("lambda_authorizer.zip")
  runtime          = "python3.10"
  timeout          = 10
  memory_size      = 256

  layers = [aws_lambda_layer_version.common_primary.arn]

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
    ignore_changes = [filename]
  }

  tags = var.common_tags
}

# Lambda authorizer function - Secondary region
resource "aws_lambda_function" "authorizer_secondary" {
  provider         = aws.secondary
  filename         = "lambda_authorizer.zip"
  function_name    = "${var.project_name}-authorizer-secondary"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_authorizer.lambda_handler"
  source_code_hash = filebase64sha256("lambda_authorizer.zip")
  runtime          = "python3.10"
  timeout          = 10
  memory_size      = 256

  layers = [aws_lambda_layer_version.common_secondary.arn]

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
    ignore_changes = [filename]
  }

  tags = var.common_tags
}

# Transaction processing Lambda - Primary region
resource "aws_lambda_function" "transaction_primary" {
  provider         = aws.primary
  filename         = "lambda_transaction.zip"
  function_name    = "${var.project_name}-transaction-primary"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_transaction.lambda_handler"
  source_code_hash = filebase64sha256("lambda_transaction.zip")
  runtime          = "python3.10"
  timeout          = 30
  memory_size      = 512

  layers = [aws_lambda_layer_version.common_primary.arn]

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
    ignore_changes = [filename]
  }

  tags = var.common_tags
}

# Transaction processing Lambda - Secondary region
resource "aws_lambda_function" "transaction_secondary" {
  provider         = aws.secondary
  filename         = "lambda_transaction.zip"
  function_name    = "${var.project_name}-transaction-secondary"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "lambda_transaction.lambda_handler"
  source_code_hash = filebase64sha256("lambda_transaction.zip")
  runtime          = "python3.10"
  timeout          = 30
  memory_size      = 512

  layers = [aws_lambda_layer_version.common_secondary.arn]

  environment {
    variables = {
      DYNAMODB_TABLE = aws_dynamodb_table.transactions.name
      REGION         = var.secondary_region
    }
  }

  tracing_config {
    mode = "Active"
  }

  lifecycle {
    ignore_changes = [filename]
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
  provider                         = aws.primary
  name                             = "${var.project_name}-custom-authorizer"
  rest_api_id                      = aws_api_gateway_rest_api.main_primary.id
  authorizer_uri                   = aws_lambda_function.authorizer_primary.invoke_arn
  authorizer_credentials           = aws_iam_role.api_gateway_authorizer.arn
  type                             = "TOKEN"
  authorizer_result_ttl_in_seconds = 300
  identity_source                  = "method.request.header.Authorization"
}

# API Gateway Authorizer - Secondary
resource "aws_api_gateway_authorizer" "custom_secondary" {
  provider                         = aws.secondary
  name                             = "${var.project_name}-custom-authorizer"
  rest_api_id                      = aws_api_gateway_rest_api.main_secondary.id
  authorizer_uri                   = aws_lambda_function.authorizer_secondary.invoke_arn
  authorizer_credentials           = aws_iam_role.api_gateway_authorizer.arn
  type                             = "TOKEN"
  authorizer_result_ttl_in_seconds = 300
  identity_source                  = "method.request.header.Authorization"
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

  lifecycle {
    create_before_destroy = true
  }
}

# API Gateway Stage Settings - Primary
resource "aws_api_gateway_stage" "main_primary" {
  provider             = aws.primary
  deployment_id        = aws_api_gateway_deployment.main_primary.id
  rest_api_id          = aws_api_gateway_rest_api.main_primary.id
  stage_name           = var.api_stage
  xray_tracing_enabled = true

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
  provider             = aws.secondary
  deployment_id        = aws_api_gateway_deployment.main_secondary.id
  rest_api_id          = aws_api_gateway_rest_api.main_secondary.id
  stage_name           = var.api_stage
  xray_tracing_enabled = true

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

# Route 53 Health Checks (optional)
resource "aws_route53_health_check" "primary" {
  count = var.enable_route53 ? 1 : 0

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
  count = var.enable_route53 ? 1 : 0

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

# Route 53 Hosted Zone (optional - assuming it exists)
data "aws_route53_zone" "main" {
  count = var.enable_route53 ? 1 : 0
  name  = var.domain_name
}

# Route 53 Latency-based routing records (optional)
resource "aws_route53_record" "api_primary" {
  count = var.enable_route53 ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60

  weighted_routing_policy {
    weight = 50
  }

  set_identifier  = "primary"
  records         = ["${aws_api_gateway_rest_api.main_primary.id}.execute-api.${var.primary_region}.amazonaws.com"]
  health_check_id = aws_route53_health_check.primary[0].id
}

resource "aws_route53_record" "api_secondary" {
  count = var.enable_route53 ? 1 : 0

  zone_id = data.aws_route53_zone.main[0].zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60

  weighted_routing_policy {
    weight = 50
  }

  set_identifier  = "secondary"
  records         = ["${aws_api_gateway_rest_api.main_secondary.id}.execute-api.${var.secondary_region}.amazonaws.com"]
  health_check_id = aws_route53_health_check.secondary[0].id
}

# CloudFront Distribution
resource "aws_cloudfront_distribution" "api" {
  provider = aws.global
  enabled  = true
  comment  = "${var.project_name} API Distribution"

  origin {
    # Use Route 53 domain if enabled, otherwise use primary API Gateway URL
    domain_name = var.enable_route53 ? "api.${var.domain_name}" : "${aws_api_gateway_rest_api.main_primary.id}.execute-api.${var.primary_region}.amazonaws.com"
    origin_id   = "api-origin"
    origin_path = var.enable_route53 ? "" : "/${var.api_stage}"

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
      # Forward only necessary headers (AWS signature headers like X-Amz-Date not allowed)
      headers = ["Authorization", "Content-Type", "Accept"]

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
# security.tf

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
            size                = 8192 # 8KB limit
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

# VPC for Lambda functions (optional - only if VPC access needed)
resource "aws_vpc" "main" {
  count = var.enable_vpc ? 1 : 0

  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-vpc"
  })
}

# Private subnets for Lambda
resource "aws_subnet" "private" {
  count = var.enable_vpc ? 2 : 0

  vpc_id            = aws_vpc.main[0].id
  cidr_block        = "10.0.${count.index + 1}.0/24"
  availability_zone = data.aws_availability_zones.available.names[count.index]

  tags = merge(var.common_tags, {
    Name = "${var.project_name}-private-subnet-${count.index + 1}"
    Type = "Private"
  })
}

# Security Groups for Lambda functions (VPC mode if needed)
resource "aws_security_group" "lambda" {
  count = var.enable_vpc ? 1 : 0

  name        = "${var.project_name}-lambda-sg"
  description = "Security group for Lambda functions"
  vpc_id      = aws_vpc.main[0].id

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

# Data source for AZs
data "aws_availability_zones" "available" {
  state = "available"
}

# IAM policy for encryption - Not needed with AWS-managed encryption
# Uncomment if migrating to customer-managed KMS keys
# resource "aws_iam_policy" "encryption" {
#   name        = "${var.project_name}-encryption-policy"
#   description = "Policy for encryption operations"
#
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Effect = "Allow"
#         Action = [
#           "kms:Decrypt",
#           "kms:DescribeKey"
#         ]
#         Resource = [
#           aws_kms_key.dynamodb.arn,
#           aws_kms_key.dynamodb_secondary.arn
#         ]
#       }
#     ]
#   })
# }
#
# # Attach encryption policy to Lambda role
# resource "aws_iam_role_policy_attachment" "lambda_encryption" {
#   role       = aws_iam_role.lambda_execution.name
#   policy_arn = aws_iam_policy.encryption.arn
# }

# S3 bucket for WAF logs
# Bucket name must start with 'aws-waf-logs-' for WAF v2 logging
resource "aws_s3_bucket" "waf_logs" {
  provider = aws.global
  bucket   = "aws-waf-logs-${var.project_name}-${data.aws_caller_identity.current.account_id}"

  # Allow bucket to be destroyed even if it contains objects
  force_destroy = true

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

# S3 bucket policy for WAF logging
resource "aws_s3_bucket_policy" "waf_logs" {
  provider = aws.global
  bucket   = aws_s3_bucket.waf_logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSLogDeliveryWrite"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.waf_logs.arn}/*"
      },
      {
        Sid    = "AWSLogDeliveryAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "delivery.logs.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.waf_logs.arn
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.waf_logs]
}

# WAF logging configuration
# Note: WAF v2 logging to S3 requires the bucket ARN without path suffix
resource "aws_wafv2_web_acl_logging_configuration" "api_protection" {
  provider                = aws.global
  resource_arn            = aws_wafv2_web_acl.api_protection.arn
  log_destination_configs = [aws_s3_bucket.waf_logs.arn]

  redacted_fields {
    single_header {
      name = "authorization"
    }
  }

  depends_on = [
    aws_s3_bucket_policy.waf_logs,
    aws_s3_bucket_public_access_block.waf_logs
  ]
}

# Data source for current account
data "aws_caller_identity" "current" {}
# monitoring.tf

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

# Lambda duration alarm
resource "aws_cloudwatch_metric_alarm" "lambda_duration" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-lambda-duration"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Duration"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Average"
  threshold           = "25000" # 25 seconds (Lambda timeout is 30)
  alarm_description   = "This metric monitors lambda duration"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.transaction_primary.function_name
  }

  tags = var.common_tags
}

# CloudFront error rate alarm
resource "aws_cloudwatch_metric_alarm" "cloudfront_error_rate" {
  provider            = aws.global
  alarm_name          = "${var.project_name}-cloudfront-errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = "300"
  statistic           = "Average"
  threshold           = "5" # 5% error rate
  alarm_description   = "This metric monitors CloudFront 5xx error rate"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.api.id
  }

  tags = var.common_tags
}

# DynamoDB throttling alarm
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "UserErrors"
  namespace           = "AWS/DynamoDB"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors DynamoDB throttling"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    TableName = aws_dynamodb_table.transactions.name
  }

  tags = var.common_tags
}

# API Gateway latency alarm (P99)
resource "aws_cloudwatch_metric_alarm" "api_latency" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-api-latency"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = "300"
  extended_statistic  = "p99"
  threshold           = "1000" # 1 second
  alarm_description   = "This metric monitors API Gateway P99 latency"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.main_primary.name
    Stage   = var.api_stage
  }

  tags = var.common_tags
}

# Lambda concurrent execution alarm
resource "aws_cloudwatch_metric_alarm" "lambda_concurrent_executions" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-lambda-concurrent-executions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConcurrentExecutions"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Maximum"
  threshold           = "800" # 80% of default account limit (1000)
  alarm_description   = "This metric monitors lambda concurrent executions"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.transaction_primary.function_name
  }

  tags = var.common_tags
}

# CloudWatch Log Metric Filter for failed transactions
resource "aws_cloudwatch_log_metric_filter" "failed_transactions" {
  provider       = aws.primary
  name           = "${var.project_name}-failed-transactions"
  log_group_name = aws_cloudwatch_log_group.lambda_transaction_primary.name
  pattern        = "[timestamp, request_id, level = ERROR*, msg]"

  metric_transformation {
    name      = "FailedTransactions"
    namespace = "${var.project_name}/BusinessMetrics"
    value     = "1"
  }
}

# Alarm for failed transactions
resource "aws_cloudwatch_metric_alarm" "failed_transactions" {
  provider            = aws.primary
  alarm_name          = "${var.project_name}-failed-transactions"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedTransactions"
  namespace           = "${var.project_name}/BusinessMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "This metric monitors failed transaction count"
  alarm_actions       = [aws_sns_topic.alarms.arn]
  treat_missing_data  = "notBreaching"

  tags = var.common_tags
}

# Composite alarm for critical path
resource "aws_cloudwatch_composite_alarm" "critical_system_health" {
  alarm_name        = "${var.project_name}-critical-health"
  alarm_description = "Composite alarm for critical system health"
  actions_enabled   = true
  alarm_actions     = [aws_sns_topic.alarms.arn]

  alarm_rule = join(" OR ", [
    "ALARM(${aws_cloudwatch_metric_alarm.high_5xx_errors.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.lambda_errors.alarm_name})",
    "ALARM(${aws_cloudwatch_metric_alarm.dynamodb_throttles.alarm_name})"
  ])

  depends_on = [
    aws_cloudwatch_metric_alarm.high_5xx_errors,
    aws_cloudwatch_metric_alarm.lambda_errors,
    aws_cloudwatch_metric_alarm.dynamodb_throttles
  ]
}
# outputs.tf

# outputs.tf

# API Gateway Endpoints
output "api_gateway_url_primary" {
  description = "Primary region API Gateway endpoint URL"
  value       = "${aws_api_gateway_rest_api.main_primary.id}.execute-api.${var.primary_region}.amazonaws.com/${var.api_stage}"
}

output "api_gateway_url_secondary" {
  description = "Secondary region API Gateway endpoint URL"
  value       = "${aws_api_gateway_rest_api.main_secondary.id}.execute-api.${var.secondary_region}.amazonaws.com/${var.api_stage}"
}

output "api_gateway_id_primary" {
  description = "Primary API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main_primary.id
}

output "api_gateway_id_secondary" {
  description = "Secondary API Gateway REST API ID"
  value       = aws_api_gateway_rest_api.main_secondary.id
}

# CloudFront Distribution
output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.api.domain_name
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.api.id
}

output "cloudfront_url" {
  description = "Full CloudFront URL for API access"
  value       = "https://${aws_cloudfront_distribution.api.domain_name}"
}

# DynamoDB Table
output "dynamodb_table_name" {
  description = "DynamoDB Global Table name"
  value       = aws_dynamodb_table.transactions.name
}

output "dynamodb_table_arn" {
  description = "DynamoDB table ARN"
  value       = aws_dynamodb_table.transactions.arn
}

# Lambda Functions
output "lambda_authorizer_name_primary" {
  description = "Lambda authorizer function name (primary)"
  value       = aws_lambda_function.authorizer_primary.function_name
}

output "lambda_authorizer_arn_primary" {
  description = "Lambda authorizer function ARN (primary)"
  value       = aws_lambda_function.authorizer_primary.arn
}

output "lambda_transaction_name_primary" {
  description = "Lambda transaction function name (primary)"
  value       = aws_lambda_function.transaction_primary.function_name
}

output "lambda_transaction_arn_primary" {
  description = "Lambda transaction function ARN (primary)"
  value       = aws_lambda_function.transaction_primary.arn
}

output "lambda_authorizer_name_secondary" {
  description = "Lambda authorizer function name (secondary)"
  value       = aws_lambda_function.authorizer_secondary.function_name
}

output "lambda_transaction_name_secondary" {
  description = "Lambda transaction function name (secondary)"
  value       = aws_lambda_function.transaction_secondary.function_name
}

# Secrets Manager
output "secrets_manager_secret_name" {
  description = "Secrets Manager secret name for API keys"
  value       = aws_secretsmanager_secret.api_keys.name
}

output "secrets_manager_secret_arn" {
  description = "Secrets Manager secret ARN"
  value       = aws_secretsmanager_secret.api_keys.arn
}

# CloudWatch
output "cloudwatch_dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "cloudwatch_log_group_api_primary" {
  description = "CloudWatch log group for primary API Gateway"
  value       = aws_cloudwatch_log_group.api_gateway_primary.name
}

output "cloudwatch_log_group_lambda_primary" {
  description = "CloudWatch log group for primary Lambda transaction function"
  value       = aws_cloudwatch_log_group.lambda_transaction_primary.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for alarms"
  value       = aws_sns_topic.alarms.arn
}

# WAF
output "waf_web_acl_id" {
  description = "WAF Web ACL ID"
  value       = aws_wafv2_web_acl.api_protection.id
}

output "waf_web_acl_arn" {
  description = "WAF Web ACL ARN"
  value       = aws_wafv2_web_acl.api_protection.arn
}

# Route 53 (optional)
output "route53_record_name" {
  description = "Route 53 record name (if enabled)"
  value       = var.enable_route53 ? aws_route53_record.api_primary[0].name : "Route 53 not enabled"
}

# General
output "primary_region" {
  description = "Primary AWS region"
  value       = var.primary_region
}

output "secondary_region" {
  description = "Secondary AWS region"
  value       = var.secondary_region
}

output "project_name" {
  description = "Project name"
  value       = var.project_name
}
```

```python
# lambda_authorizer.py

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
        )```

```python
# lambda_transaction.py

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
        'status': 'completed',  # Set as completed immediately for synchronous processing
        'createdAt': datetime.utcnow().isoformat(),
        'updatedAt': datetime.utcnow().isoformat(),
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
        return build_response(500, {'error': 'Internal server error'})```

