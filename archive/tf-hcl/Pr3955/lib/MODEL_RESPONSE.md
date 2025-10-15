I'll provide a comprehensive multi-region serverless architecture for your SaaS platform. This solution implements all requirements including automated failover, global data synchronization, and GDPR compliance.

# tap_stack.tf
# Multi-Region Serverless SaaS Infrastructure with 99.999% Uptime Target
# Architecture: API Gateway -> Lambda (Graviton2) -> DynamoDB Global Tables
# Features: Automated failover, GDPR compliance, real-time analytics

# ==================== DATA SOURCES ====================
# Fetch current AWS account and caller information
data "aws_caller_identity" "current" {}
data "aws_region" "primary" {
  provider = aws.primary
}
data "aws_region" "secondary" {
  provider = aws.secondary
}

# ==================== S3 BUCKETS WITH CROSS-REGION REPLICATION ====================
# Primary region S3 bucket for application assets and user uploads
resource "aws_s3_bucket" "primary_bucket" {
  provider = aws.primary
  bucket   = "${var.app_name}-${var.environment}-primary-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(var.common_tags, {
    Name        = "${var.app_name}-primary-bucket"
    Region      = var.primary_region
    Compliance  = "GDPR"
  })
}

# Enable versioning for disaster recovery and compliance
resource "aws_s3_bucket_versioning" "primary_versioning" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption for GDPR compliance
resource "aws_s3_bucket_server_side_encryption_configuration" "primary_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary_key.arn
    }
  }
}

# Secondary region S3 bucket for replication
resource "aws_s3_bucket" "secondary_bucket" {
  provider = aws.secondary
  bucket   = "${var.app_name}-${var.environment}-secondary-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(var.common_tags, {
    Name        = "${var.app_name}-secondary-bucket"
    Region      = var.secondary_region
    Compliance  = "GDPR"
  })
}

# Enable versioning on secondary bucket for replication
resource "aws_s3_bucket_versioning" "secondary_versioning" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# IAM role for S3 replication
resource "aws_iam_role" "replication" {
  provider = aws.primary
  name     = "${var.app_name}-s3-replication-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for S3 replication
resource "aws_iam_policy" "replication" {
  provider = aws.primary
  name     = "${var.app_name}-s3-replication-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = [
          "s3:GetReplicationConfiguration",
          "s3:ListBucket"
        ]
        Effect = "Allow"
        Resource = aws_s3_bucket.primary_bucket.arn
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.primary_bucket.arn}/*"
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect = "Allow"
        Resource = "${aws_s3_bucket.secondary_bucket.arn}/*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "replication" {
  provider   = aws.primary
  role       = aws_iam_role.replication.name
  policy_arn = aws_iam_policy.replication.arn
}

# Configure S3 cross-region replication
resource "aws_s3_bucket_replication_configuration" "replication" {
  provider = aws.primary
  role     = aws_iam_role.replication.arn
  bucket   = aws_s3_bucket.primary_bucket.id

  rule {
    id     = "replicate-all-objects"
    status = "Enabled"

    destination {
      bucket        = aws_s3_bucket.secondary_bucket.arn
      storage_class = "STANDARD_IA" # Cost optimization for replicated data
      
      replication_time {
        status = "Enabled"
        time {
          minutes = 15 # RTO target
        }
      }
      
      metrics {
        status = "Enabled"
        event_threshold {
          minutes = 15
        }
      }
    }
  }

  depends_on = [aws_s3_bucket_versioning.primary_versioning]
}

# ==================== KMS KEYS FOR ENCRYPTION ====================
# Primary region KMS key for GDPR compliance
resource "aws_kms_key" "primary_key" {
  provider                = aws.primary
  description             = "KMS key for ${var.app_name} encryption in primary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name       = "${var.app_name}-primary-kms"
    Compliance = "GDPR"
  })
}

resource "aws_kms_alias" "primary_key_alias" {
  provider      = aws.primary
  name          = "alias/${var.app_name}-primary"
  target_key_id = aws_kms_key.primary_key.key_id
}

# Secondary region KMS key
resource "aws_kms_key" "secondary_key" {
  provider                = aws.secondary
  description             = "KMS key for ${var.app_name} encryption in secondary region"
  deletion_window_in_days = 10
  enable_key_rotation     = true

  tags = merge(var.common_tags, {
    Name       = "${var.app_name}-secondary-kms"
    Compliance = "GDPR"
  })
}

# ==================== DYNAMODB GLOBAL TABLES ====================
# Global table for user data with multi-region replication
resource "aws_dynamodb_table" "global_table" {
  provider         = aws.primary
  name             = "${var.app_name}-${var.environment}-users"
  billing_mode     = "PAY_PER_REQUEST" # Auto-scaling for serverless
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"
  
  # Hash key for user identification
  hash_key = "userId"
  
  # Optional range key for multi-tenancy
  range_key = "tenantId"
  
  attribute {
    name = "userId"
    type = "S"
  }
  
  attribute {
    name = "tenantId"
    type = "S"
  }
  
  attribute {
    name = "email"
    type = "S"
  }
  
  attribute {
    name = "createdAt"
    type = "N"
  }
  
  # Global secondary index for email lookups
  global_secondary_index {
    name            = "email-index"
    hash_key        = "email"
    projection_type = "ALL"
  }
  
  # Global secondary index for time-based queries
  global_secondary_index {
    name            = "tenant-created-index"
    hash_key        = "tenantId"
    range_key       = "createdAt"
    projection_type = "ALL"
  }
  
  # Point-in-time recovery for compliance
  point_in_time_recovery {
    enabled = true
  }
  
  # Server-side encryption
  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.primary_key.arn
  }
  
  # Enable global table replication
  replica {
    region_name            = var.secondary_region
    kms_key_arn           = aws_kms_key.secondary_key.arn
    point_in_time_recovery {
      enabled = true
    }
  }
  
  # TTL for GDPR data retention compliance
  ttl {
    attribute_name = "ttl"
    enabled        = true
  }
  
  tags = merge(var.common_tags, {
    Name       = "${var.app_name}-global-table"
    Compliance = "GDPR"
  })
}

# ==================== LAMBDA FUNCTIONS ====================
# IAM role for Lambda execution
resource "aws_iam_role" "lambda_role" {
  for_each = toset([var.primary_region, var.secondary_region])
  provider = each.key == var.primary_region ? aws.primary : aws.secondary
  
  name = "${var.app_name}-lambda-role-${each.key}"

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
  
  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-lambda-role"
    Region = each.key
  })
}

# Lambda execution policy with comprehensive permissions
resource "aws_iam_policy" "lambda_policy" {
  for_each = toset([var.primary_region, var.secondary_region])
  provider = each.key == var.primary_region ? aws.primary : aws.secondary
  
  name = "${var.app_name}-lambda-policy-${each.key}"

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
        Resource = "arn:aws:logs:${each.key}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:DeleteItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:BatchGetItem",
          "dynamodb:BatchWriteItem"
        ]
        Resource = [
          "arn:aws:dynamodb:${each.key}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}-*",
          "arn:aws:dynamodb:${each.key}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}-*/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.app_name}-${var.environment}-*",
          "arn:aws:s3:::${var.app_name}-${var.environment}-*/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = "arn:aws:events:${each.key}:${data.aws_caller_identity.current.account_id}:event-bus/*"
      }
    ]
  })
}

# Attach policy to Lambda role
resource "aws_iam_role_policy_attachment" "lambda_policy" {
  for_each   = toset([var.primary_region, var.secondary_region])
  provider   = each.key == var.primary_region ? aws.primary : aws.secondary
  role       = aws_iam_role.lambda_role[each.key].name
  policy_arn = aws_iam_policy.lambda_policy[each.key].arn
}

# Attach AWS managed policy for Lambda VPC access
resource "aws_iam_role_policy_attachment" "lambda_vpc_policy" {
  for_each   = toset([var.primary_region, var.secondary_region])
  provider   = each.key == var.primary_region ? aws.primary : aws.secondary
  role       = aws_iam_role.lambda_role[each.key].name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Create deployment package for Lambda
data "archive_file" "lambda_package" {
  type        = "zip"
  output_path = "/tmp/lambda_function.zip"
  
  source {
    content  = file("${path.module}/lambda_function.py")
    filename = "lambda_function.py"
  }
}

# Primary region Lambda functions with Graviton2
resource "aws_lambda_function" "api_handler_primary" {
  provider         = aws.primary
  filename         = data.archive_file.lambda_package.output_path
  function_name    = "${var.app_name}-${var.environment}-api-handler-primary"
  role            = aws_iam_role.lambda_role[var.primary_region].arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  runtime         = "python3.9"
  timeout         = 30
  memory_size     = 1024
  architectures   = ["arm64"] # Graviton2 processor for cost optimization
  
  environment {
    variables = {
      ENVIRONMENT     = var.environment
      TABLE_NAME      = aws_dynamodb_table.global_table.name
      REGION          = var.primary_region
      BUCKET_NAME     = aws_s3_bucket.primary_bucket.id
      KMS_KEY_ID      = aws_kms_key.primary_key.id
      EVENT_BUS_NAME  = aws_cloudwatch_event_bus.primary_bus.name
    }
  }
  
  tracing_config {
    mode = "Active" # Enable X-Ray tracing
  }
  
  reserved_concurrent_executions = var.lambda_reserved_concurrency
  
  tags = merge(var.common_tags, {
    Name         = "${var.app_name}-api-handler-primary"
    Architecture = "Graviton2"
  })
}

# Secondary region Lambda functions with Graviton2
resource "aws_lambda_function" "api_handler_secondary" {
  provider         = aws.secondary
  filename         = data.archive_file.lambda_package.output_path
  function_name    = "${var.app_name}-${var.environment}-api-handler-secondary"
  role            = aws_iam_role.lambda_role[var.secondary_region].arn
  handler         = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  runtime         = "python3.9"
  timeout         = 30
  memory_size     = 1024
  architectures   = ["arm64"] # Graviton2 processor
  
  environment {
    variables = {
      ENVIRONMENT     = var.environment
      TABLE_NAME      = aws_dynamodb_table.global_table.name
      REGION          = var.secondary_region
      BUCKET_NAME     = aws_s3_bucket.secondary_bucket.id
      KMS_KEY_ID      = aws_kms_key.secondary_key.id
      EVENT_BUS_NAME  = aws_cloudwatch_event_bus.secondary_bus.name
    }
  }
  
  tracing_config {
    mode = "Active"
  }
  
  reserved_concurrent_executions = var.lambda_reserved_concurrency
  
  tags = merge(var.common_tags, {
    Name         = "${var.app_name}-api-handler-secondary"
    Architecture = "Graviton2"
  })
}

# ==================== API GATEWAY ====================
# Primary region API Gateway
resource "aws_api_gateway_rest_api" "primary_api" {
  provider    = aws.primary
  name        = "${var.app_name}-${var.environment}-api-primary"
  description = "Primary API Gateway for ${var.app_name}"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-api-primary"
    Region = var.primary_region
  })
}

# API Gateway resources and methods for primary region
resource "aws_api_gateway_resource" "primary_users" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.primary_api.id
  parent_id   = aws_api_gateway_rest_api.primary_api.root_resource_id
  path_part   = "users"
}

resource "aws_api_gateway_resource" "primary_user_id" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.primary_api.id
  parent_id   = aws_api_gateway_resource.primary_users.id
  path_part   = "{userId}"
}

# GET method for retrieving users
resource "aws_api_gateway_method" "primary_get_user" {
  provider      = aws.primary
  rest_api_id   = aws_api_gateway_rest_api.primary_api.id
  resource_id   = aws_api_gateway_resource.primary_user_id.id
  http_method   = "GET"
  authorization = "AWS_IAM"
  
  request_parameters = {
    "method.request.path.userId" = true
  }
}

# POST method for creating users
resource "aws_api_gateway_method" "primary_post_user" {
  provider      = aws.primary
  rest_api_id   = aws_api_gateway_rest_api.primary_api.id
  resource_id   = aws_api_gateway_resource.primary_users.id
  http_method   = "POST"
  authorization = "AWS_IAM"
}

# Lambda integration for GET
resource "aws_api_gateway_integration" "primary_get_integration" {
  provider                = aws.primary
  rest_api_id             = aws_api_gateway_rest_api.primary_api.id
  resource_id             = aws_api_gateway_resource.primary_user_id.id
  http_method             = aws_api_gateway_method.primary_get_user.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler_primary.invoke_arn
}

# Lambda integration for POST
resource "aws_api_gateway_integration" "primary_post_integration" {
  provider                = aws.primary
  rest_api_id             = aws_api_gateway_rest_api.primary_api.id
  resource_id             = aws_api_gateway_resource.primary_users.id
  http_method             = aws_api_gateway_method.primary_post_user.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler_primary.invoke_arn
}

# API Gateway deployment for primary region
resource "aws_api_gateway_deployment" "primary_deployment" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.primary_api.id
  stage_name  = var.environment
  
  depends_on = [
    aws_api_gateway_integration.primary_get_integration,
    aws_api_gateway_integration.primary_post_integration
  ]
  
  lifecycle {
    create_before_destroy = true
  }
}

# Lambda permission for API Gateway in primary region
resource "aws_lambda_permission" "primary_api_permission" {
  provider      = aws.primary
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler_primary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.primary_api.execution_arn}/*/*"
}

# Secondary region API Gateway (identical structure)
resource "aws_api_gateway_rest_api" "secondary_api" {
  provider    = aws.secondary
  name        = "${var.app_name}-${var.environment}-api-secondary"
  description = "Secondary API Gateway for ${var.app_name}"
  
  endpoint_configuration {
    types = ["REGIONAL"]
  }
  
  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-api-secondary"
    Region = var.secondary_region
  })
}

resource "aws_api_gateway_resource" "secondary_users" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.secondary_api.id
  parent_id   = aws_api_gateway_rest_api.secondary_api.root_resource_id
  path_part   = "users"
}

resource "aws_api_gateway_resource" "secondary_user_id" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.secondary_api.id
  parent_id   = aws_api_gateway_resource.secondary_users.id
  path_part   = "{userId}"
}

resource "aws_api_gateway_method" "secondary_get_user" {
  provider      = aws.secondary
  rest_api_id   = aws_api_gateway_rest_api.secondary_api.id
  resource_id   = aws_api_gateway_resource.secondary_user_id.id
  http_method   = "GET"
  authorization = "AWS_IAM"
  
  request_parameters = {
    "method.request.path.userId" = true
  }
}

resource "aws_api_gateway_method" "secondary_post_user" {
  provider      = aws.secondary
  rest_api_id   = aws_api_gateway_rest_api.secondary_api.id
  resource_id   = aws_api_gateway_resource.secondary_users.id
  http_method   = "POST"
  authorization = "AWS_IAM"
}

resource "aws_api_gateway_integration" "secondary_get_integration" {
  provider                = aws.secondary
  rest_api_id             = aws_api_gateway_rest_api.secondary_api.id
  resource_id             = aws_api_gateway_resource.secondary_user_id.id
  http_method             = aws_api_gateway_method.secondary_get_user.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler_secondary.invoke_arn
}

resource "aws_api_gateway_integration" "secondary_post_integration" {
  provider                = aws.secondary
  rest_api_id             = aws_api_gateway_rest_api.secondary_api.id
  resource_id             = aws_api_gateway_resource.secondary_users.id
  http_method             = aws_api_gateway_method.secondary_post_user.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler_secondary.invoke_arn
}

resource "aws_api_gateway_deployment" "secondary_deployment" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.secondary_api.id
  stage_name  = var.environment
  
  depends_on = [
    aws_api_gateway_integration.secondary_get_integration,
    aws_api_gateway_integration.secondary_post_integration
  ]
  
  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_lambda_permission" "secondary_api_permission" {
  provider      = aws.secondary
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.api_handler_secondary.function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.secondary_api.execution_arn}/*/*"
}

# ==================== ROUTE 53 WITH LATENCY-BASED ROUTING ====================
# Create hosted zone for the application
resource "aws_route53_zone" "main" {
  name    = var.domain_name
  comment = "Managed by Terraform for ${var.app_name}"
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-hosted-zone"
  })
}

# Health check for primary region API
resource "aws_route53_health_check" "primary_health" {
  fqdn              = "${aws_api_gateway_rest_api.primary_api.id}.execute-api.${var.primary_region}.amazonaws.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/${var.environment}/health"
  failure_threshold = 3
  request_interval  = 30
  
  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-primary-health-check"
    Region = var.primary_region
  })
}

# Health check for secondary region API
resource "aws_route53_health_check" "secondary_health" {
  fqdn              = "${aws_api_gateway_rest_api.secondary_api.id}.execute-api.${var.secondary_region}.amazonaws.com"
  port              = 443
  type              = "HTTPS"
  resource_path     = "/${var.environment}/health"
  failure_threshold = 3
  request_interval  = 30
  
  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-secondary-health-check"
    Region = var.secondary_region
  })
}

# Latency-based routing record for primary region
resource "aws_route53_record" "primary_api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60
  
  set_identifier = "${var.primary_region}-api"
  
  latency_routing_policy {
    region = var.primary_region
  }
  
  records = ["${aws_api_gateway_rest_api.primary_api.id}.execute-api.${var.primary_region}.amazonaws.com"]
  
  health_check_id = aws_route53_health_check.primary_health.id
}

# Latency-based routing record for secondary region
resource "aws_route53_record" "secondary_api" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "api.${var.domain_name}"
  type    = "CNAME"
  ttl     = 60
  
  set_identifier = "${var.secondary_region}-api"
  
  latency_routing_policy {
    region = var.secondary_region
  }
  
  records = ["${aws_api_gateway_rest_api.secondary_api.id}.execute-api.${var.secondary_region}.amazonaws.com"]
  
  health_check_id = aws_route53_health_check.secondary_health.id
}

# ==================== WAF WITH RATE LIMITING ====================
# WAF Web ACL for primary region
resource "aws_wafv2_web_acl" "primary_waf" {
  provider = aws.primary
  name     = "${var.app_name}-${var.environment}-waf-primary"
  scope    = "REGIONAL"
  
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
      metric_name                = "${var.app_name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }
  
  # Geo-blocking rule for GDPR compliance
  rule {
    name     = "GeoBlockingRule"
    priority = 2
    
    action {
      block {}
    }
    
    statement {
      geo_match_statement {
        country_codes = var.blocked_countries
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-geo-block"
      sampled_requests_enabled   = true
    }
  }
  
  # SQL injection protection
  rule {
    name     = "SQLiRule"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      sqli_match_statement {
        field_to_match {
          all_query_arguments {}
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
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-sqli"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.app_name}-waf-primary"
    sampled_requests_enabled   = true
  }
  
  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-waf-primary"
    Region = var.primary_region
  })
}

# WAF Web ACL for secondary region (identical rules)
resource "aws_wafv2_web_acl" "secondary_waf" {
  provider = aws.secondary
  name     = "${var.app_name}-${var.environment}-waf-secondary"
  scope    = "REGIONAL"
  
  default_action {
    allow {}
  }
  
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
      metric_name                = "${var.app_name}-rate-limit"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "GeoBlockingRule"
    priority = 2
    
    action {
      block {}
    }
    
    statement {
      geo_match_statement {
        country_codes = var.blocked_countries
      }
    }
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-geo-block"
      sampled_requests_enabled   = true
    }
  }
  
  rule {
    name     = "SQLiRule"
    priority = 3
    
    action {
      block {}
    }
    
    statement {
      sqli_match_statement {
        field_to_match {
          all_query_arguments {}
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
    
    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "${var.app_name}-sqli"
      sampled_requests_enabled   = true
    }
  }
  
  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "${var.app_name}-waf-secondary"
    sampled_requests_enabled   = true
  }
  
  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-waf-secondary"
    Region = var.secondary_region
  })
}

# Associate WAF with API Gateway in primary region
resource "aws_wafv2_web_acl_association" "primary_api_waf" {
  provider     = aws.primary
  resource_arn = aws_api_gateway_deployment.primary_deployment.execution_arn
  web_acl_arn  = aws_wafv2_web_acl.primary_waf.arn
}

# Associate WAF with API Gateway in secondary region
resource "aws_wafv2_web_acl_association" "secondary_api_waf" {
  provider     = aws.secondary
  resource_arn = aws_api_gateway_deployment.secondary_deployment.execution_arn
  web_acl_arn  = aws_wafv2_web_acl.secondary_waf.arn
}

# ==================== EVENTBRIDGE FOR CROSS-REGION ORCHESTRATION ====================
# Primary region event bus
resource "aws_cloudwatch_event_bus" "primary_bus" {
  provider = aws.primary
  name     = "${var.app_name}-${var.environment}-primary"
  
  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-event-bus-primary"
    Region = var.primary_region
  })
}

# Secondary region event bus
resource "aws_cloudwatch_event_bus" "secondary_bus" {
  provider = aws.secondary
  name     = "${var.app_name}-${var.environment}-secondary"
  
  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-event-bus-secondary"
    Region = var.secondary_region
  })
}

# Event rule for user activity tracking in primary region
resource "aws_cloudwatch_event_rule" "primary_user_events" {
  provider    = aws.primary
  name        = "${var.app_name}-user-events-primary"
  description = "Capture user events for analytics"
  
  event_pattern = jsonencode({
    source      = ["custom.${var.app_name}"]
    detail-type = ["User Activity"]
  })
  
  event_bus_name = aws_cloudwatch_event_bus.primary_bus.name
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-user-events-rule-primary"
  })
}

# Event target to send events to secondary region for replication
resource "aws_cloudwatch_event_target" "cross_region_replication" {
  provider       = aws.primary
  rule           = aws_cloudwatch_event_rule.primary_user_events.name
  target_id      = "CrossRegionTarget"
  arn            = aws_cloudwatch_event_bus.secondary_bus.arn
  event_bus_name = aws_cloudwatch_event_bus.primary_bus.name
  
  role_arn = aws_iam_role.eventbridge_role.arn
}

# IAM role for EventBridge cross-region event forwarding
resource "aws_iam_role" "eventbridge_role" {
  provider = aws.primary
  name     = "${var.app_name}-eventbridge-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_policy" "eventbridge_policy" {
  provider = aws.primary
  name     = "${var.app_name}-eventbridge-policy"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = [
          aws_cloudwatch_event_bus.secondary_bus.arn
        ]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "eventbridge_policy" {
  provider   = aws.primary
  role       = aws_iam_role.eventbridge_role.name
  policy_arn = aws_iam_policy.eventbridge_policy.arn
}

# ==================== CLOUDWATCH SYNTHETICS ====================
# S3 bucket for Synthetics artifacts in primary region
resource "aws_s3_bucket" "synthetics_primary" {
  provider = aws.primary
  bucket   = "${var.app_name}-${var.environment}-synthetics-primary-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-synthetics-primary"
  })
}

# IAM role for CloudWatch Synthetics
resource "aws_iam_role" "synthetics_role" {
  for_each = toset([var.primary_region, var.secondary_region])
  provider = each.key == var.primary_region ? aws.primary : aws.secondary
  
  name = "${var.app_name}-synthetics-role-${each.key}"

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
}

# Synthetics policy
resource "aws_iam_policy" "synthetics_policy" {
  for_each = toset([var.primary_region, var.secondary_region])
  provider = each.key == var.primary_region ? aws.primary : aws.secondary
  
  name = "${var.app_name}-synthetics-policy-${each.key}"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = "arn:aws:s3:::${var.app_name}-${var.environment}-synthetics-*/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketLocation",
          "s3:ListBucket"
        ]
        Resource = "arn:aws:s3:::${var.app_name}-${var.environment}-synthetics-*"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:CreateLogGroup"
        ]
        Resource = "arn:aws:logs:${each.key}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "synthetics:*"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "synthetics_policy" {
  for_each   = toset([var.primary_region, var.secondary_region])
  provider   = each.key == var.primary_region ? aws.primary : aws.secondary
  role       = aws_iam_role.synthetics_role[each.key].name
  policy_arn = aws_iam_policy.synthetics_policy[each.key].arn
}

# CloudWatch Synthetics Canary for primary region
resource "aws_synthetics_canary" "primary_canary" {
  provider             = aws.primary
  name                 = "${var.app_name}-api-canary-primary"
  artifact_s3_location = "s3://${aws_s3_bucket.synthetics_primary.bucket}/canary-artifacts"
  execution_role_arn   = aws_iam_role.synthetics_role[var.primary_region].arn
  handler              = "apiCanary.handler"
  zip_file             = "synthetic_canary.zip"
  runtime_version      = "syn-nodejs-puppeteer-3.9"
  
  schedule {
    expression = "rate(5 minutes)" # Run every 5 minutes for high availability monitoring
  }
  
  run_config {
    timeout_in_seconds    = 60
    memory_in_mb         = 960
    active_tracing       = true # Enable X-Ray tracing
  }
  
  success_retention_period = 31
  failure_retention_period = 31
  
  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-canary-primary"
    Region = var.primary_region
  })
}

# ==================== X-RAY CONFIGURATION ====================
# X-Ray sampling rule for distributed tracing
resource "aws_xray_sampling_rule" "main" {
  provider     = aws.primary
  rule_name    = "${var.app_name}-sampling-rule"
  priority     = 1000
  version      = 1
  reservoir_size = 1
  fixed_rate   = 0.1 # Sample 10% of requests
  url_path     = "*"
  host         = "*"
  http_method  = "*"
  service_type = "*"
  service_name = "*"
  resource_arn = "*"
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-xray-sampling"
  })
}

# ==================== QUICKSIGHT FOR ANALYTICS ====================
# S3 bucket for QuickSight data
resource "aws_s3_bucket" "quicksight_data" {
  provider = aws.primary
  bucket   = "${var.app_name}-${var.environment}-quicksight-${data.aws_caller_identity.current.account_id}"
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-quicksight-data"
    Purpose = "Analytics"
  })
}

# Athena database for querying S3 data
resource "aws_athena_database" "analytics_db" {
  provider = aws.primary
  name     = "${replace(var.app_name, "-", "_")}_${var.environment}_analytics"
  bucket   = aws_s3_bucket.quicksight_data.bucket
  
  encryption_configuration {
    encryption_option = "SSE_KMS"
    kms_key          = aws_kms_key.primary_key.arn
  }
}

# ==================== CLOUDWATCH LOGS ====================
# Log groups for Lambda functions
resource "aws_cloudwatch_log_group" "lambda_logs_primary" {
  provider          = aws.primary
  name              = "/aws/lambda/${aws_lambda_function.api_handler_primary.function_name}"
  retention_in_days = var.log_retention_days
  kms_key_id       = aws_kms_key.primary_key.arn
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-logs-primary"
  })
}

resource "aws_cloudwatch_log_group" "lambda_logs_secondary" {
  provider          = aws.secondary
  name              = "/aws/lambda/${aws_lambda_function.api_handler_secondary.function_name}"
  retention_in_days = var.log_retention_days
  kms_key_id       = aws_kms_key.secondary_key.arn
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-logs-secondary"
  })
}

# ==================== CLOUDWATCH ALARMS ====================
# Alarm for Lambda errors in primary region
resource "aws_cloudwatch_metric_alarm" "lambda_errors_primary" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-lambda-errors-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "Errors"
  namespace          = "AWS/Lambda"
  period             = 300
  statistic          = "Sum"
  threshold          = 10
  alarm_description  = "Lambda function error rate is too high"
  
  dimensions = {
    FunctionName = aws_lambda_function.api_handler_primary.function_name
  }
  
  alarm_actions = [aws_sns_topic.alerts_primary.arn]
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-errors-alarm-primary"
  })
}

# Alarm for DynamoDB throttles
resource "aws_cloudwatch_metric_alarm" "dynamodb_throttles" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-dynamodb-throttles"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name        = "SystemErrors"
  namespace          = "AWS/DynamoDB"
  period             = 300
  statistic          = "Sum"
  threshold          = 5
  alarm_description  = "DynamoDB is experiencing throttling"
  
  dimensions = {
    TableName = aws_dynamodb_table.global_table.name
  }
  
  alarm_actions = [aws_sns_topic.alerts_primary.arn]
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-dynamodb-throttles-alarm"
  })
}

# ==================== SNS TOPICS FOR ALERTS ====================
# SNS topic for primary region alerts
resource "aws_sns_topic" "alerts_primary" {
  provider = aws.primary
  name     = "${var.app_name}-alerts-primary"
  
  kms_master_key_id = aws_kms_key.primary_key.id
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-alerts-primary"
  })
}

# SNS topic for secondary region alerts
resource "aws_sns_topic" "alerts_secondary" {
  provider = aws.secondary
  name     = "${var.app_name}-alerts-secondary"
  
  kms_master_key_id = aws_kms_key.secondary_key.id
  
  tags = merge(var.common_tags, {
    Name = "${var.app_name}-alerts-secondary"
  })
}

# ==================== OUTPUTS ====================
output "primary_api_endpoint" {
  description = "Primary region API Gateway endpoint"
  value       = "https://${aws_api_gateway_rest_api.primary_api.id}.execute-api.${var.primary_region}.amazonaws.com/${var.environment}"
}

output "secondary_api_endpoint" {
  description = "Secondary region API Gateway endpoint"
  value       = "https://${aws_api_gateway_rest_api.secondary_api.id}.execute-api.${var.secondary_region}.amazonaws.com/${var.environment}"
}

output "global_api_endpoint" {
  description = "Global API endpoint with latency-based routing"
  value       = "https://api.${var.domain_name}"
}

output "dynamodb_table_name" {
  description = "DynamoDB global table name"
  value       = aws_dynamodb_table.global_table.name
}

output "primary_s3_bucket" {
  description = "Primary S3 bucket name"
  value       = aws_s3_bucket.primary_bucket.id
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = aws_route53_zone.main.zone_id
}


# variables.tf
# Configuration variables for multi-region serverless SaaS infrastructure

variable "app_name" {
  description = "Application name used for resource naming"
  type        = string
  default     = "tap-saas"
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
  description = "Secondary AWS region for failover"
  type        = string
  default     = "us-west-2"
}

variable "domain_name" {
  description = "Domain name for the application"
  type        = string
  default     = "tap-saas.example.com"
}

variable "lambda_reserved_concurrency" {
  description = "Reserved concurrent executions for Lambda functions"
  type        = number
  default     = 100
}

variable "waf_rate_limit" {
  description = "WAF rate limit per IP address (requests per 5 minutes)"
  type        = number
  default     = 2000
}

variable "blocked_countries" {
  description = "List of country codes to block for GDPR compliance"
  type        = list(string)
  default     = ["CN", "RU", "KP"] # Countries with data privacy concerns
}

variable "log_retention_days" {
  description = "CloudWatch log retention period in days"
  type        = number
  default     = 90 # GDPR compliance requirement
}

variable "common_tags" {
  description = "Common tags applied to all resources"
  type        = map(string)
  default = {
    Application = "TAP-SaaS"
    ManagedBy   = "Terraform"
    Environment = "Production"
    CostCenter  = "Engineering"
    Compliance  = "GDPR"
  }
}

variable "enable_quicksight" {
  description = "Enable QuickSight analytics dashboard"
  type        = bool
  default     = true
}

variable "enable_xray_tracing" {
  description = "Enable X-Ray distributed tracing"
  type        = bool
  default     = true
}

variable "backup_retention_days" {
  description = "DynamoDB backup retention period in days"
  type        = number
  default     = 35
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

variable "alert_email" {
  description = "Email address for CloudWatch alerts"
  type        = string
  default     = "ops@example.com"
}

variable "enable_auto_scaling" {
  description = "Enable auto-scaling for DynamoDB tables"
  type        = bool
  default     = true
}

variable "min_read_capacity" {
  description = "Minimum read capacity units for DynamoDB auto-scaling"
  type        = number
  default     = 5
}

variable "max_read_capacity" {
  description = "Maximum read capacity units for DynamoDB auto-scaling"
  type        = number
  default     = 40000
}

variable "min_write_capacity" {
  description = "Minimum write capacity units for DynamoDB auto-scaling"
  type        = number
  default     = 5
}

variable "max_write_capacity" {
  description = "Maximum write capacity units for DynamoDB auto-scaling"
  type        = number
  default     = 40000
}

variable "target_tracking_read_capacity" {
  description = "Target utilization percentage for DynamoDB read capacity"
  type        = number
  default     = 70
}

variable "target_tracking_write_capacity" {
  description = "Target utilization percentage for DynamoDB write capacity"
  type        = number
  default     = 70
}

variable "lambda_memory_size" {
  description = "Memory allocation for Lambda functions in MB"
  type        = number
  default     = 1024
}

variable "lambda_timeout" {
  description = "Timeout for Lambda functions in seconds"
  type        = number
  default     = 30
}

variable "api_cache_enabled" {
  description = "Enable API Gateway caching"
  type        = bool
  default     = true
}

variable "api_cache_size" {
  description = "API Gateway cache size in GB"
  type        = string
  default     = "0.5"
}

variable "api_cache_ttl" {
  description = "API Gateway cache TTL in seconds"
  type        = number
  default     = 300
}

variable "enable_vpc_endpoints" {
  description = "Enable VPC endpoints for private connectivity"
  type        = bool
  default     = false
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution for global content delivery"
  type        = bool
  default     = true
}

variable "synthetic_canary_schedule" {
  description = "Schedule expression for CloudWatch Synthetics canary"
  type        = string
  default     = "rate(5 minutes)"
}

variable "enable_backup_plan" {
  description = "Enable AWS Backup for disaster recovery"
  type        = bool
  default     = true
}

variable "quicksight_user_arn" {
  description = "QuickSight user ARN for dashboard access"
  type        = string
  default     = ""
}


# lambda_function.py
"""
Demo SaaS Application Lambda Handler
Implements a multi-tenant user management system with GDPR compliance
"""

import json
import os
import boto3
import uuid
import time
import hashlib
import logging
from datetime import datetime, timedelta
from decimal import Decimal
from botocore.exceptions import ClientError

# Configure logging
logger = logging.getLogger()
logger.setLevel(logging.INFO)

# Initialize AWS clients
dynamodb = boto3.resource('dynamodb')
s3 = boto3.client('s3')
events = boto3.client('events')
kms = boto3.client('kms')

# Environment variables
TABLE_NAME = os.environ['TABLE_NAME']
BUCKET_NAME = os.environ['BUCKET_NAME']
REGION = os.environ['REGION']
ENVIRONMENT = os.environ['ENVIRONMENT']
EVENT_BUS_NAME = os.environ.get('EVENT_BUS_NAME', 'default')
KMS_KEY_ID = os.environ.get('KMS_KEY_ID')

# DynamoDB table
table = dynamodb.Table(TABLE_NAME)

# Enable X-Ray tracing
from aws_xray_sdk.core import xray_recorder
from aws_xray_sdk.core import patch_all
patch_all()


class DecimalEncoder(json.JSONEncoder):
    """Helper class to convert DynamoDB Decimal to JSON float"""
    def default(self, obj):
        if isinstance(obj, Decimal):
            return float(obj)
        return super(DecimalEncoder, self).default(obj)


def lambda_handler(event, context):
    """
    Main Lambda handler for API Gateway requests
    Supports GET, POST, PUT, DELETE operations for user management
    """
    
    # Log the incoming event
    logger.info(f"Received event: {json.dumps(event)}")
    
    # Add X-Ray annotations
    xray_recorder.put_annotation("environment", ENVIRONMENT)
    xray_recorder.put_annotation("region", REGION)
    
    try:
        # Extract HTTP method and path
        http_method = event['httpMethod']
        path = event['path']
        path_parameters = event.get('pathParameters', {})
        query_parameters = event.get('queryStringParameters', {})
        body = event.get('body', '{}')
        
        # Parse request body if present
        if body:
            try:
                body = json.loads(body)
            except json.JSONDecodeError:
                body = {}
        
        # Route based on HTTP method and path
        if path == '/users' and http_method == 'POST':
            response = create_user(body)
        elif path.startswith('/users/') and http_method == 'GET':
            user_id = path_parameters.get('userId')
            response = get_user(user_id)
        elif path.startswith('/users/') and http_method == 'PUT':
            user_id = path_parameters.get('userId')
            response = update_user(user_id, body)
        elif path.startswith('/users/') and http_method == 'DELETE':
            user_id = path_parameters.get('userId')
            response = delete_user(user_id)
        elif path == '/users' and http_method == 'GET':
            response = list_users(query_parameters)
        elif path == '/health' and http_method == 'GET':
            response = health_check()
        elif path == '/metrics' and http_method == 'GET':
            response = get_metrics()
        else:
            response = {
                'statusCode': 404,
                'body': json.dumps({'error': 'Not found'})
            }
        
        # Send event to EventBridge for analytics
        send_analytics_event(http_method, path, response['statusCode'])
        
        # Add CORS headers
        response['headers'] = {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'X-Region': REGION,
            'X-Environment': ENVIRONMENT
        }
        
        return response
        
    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        xray_recorder.put_metadata("error", str(e))
        
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Internal server error'})
        }


@xray_recorder.capture('create_user')
def create_user(user_data):
    """
    Create a new user with GDPR-compliant data handling
    """
    try:
        # Validate required fields
        required_fields = ['email', 'name', 'tenantId']
        for field in required_fields:
            if field not in user_data:
                return {
                    'statusCode': 400,
                    'body': json.dumps({'error': f'Missing required field: {field}'})
                }
        
        # Generate unique user ID
        user_id = str(uuid.uuid4())
        
        # Hash sensitive data for privacy
        email_hash = hashlib.sha256(user_data['email'].encode()).hexdigest()
        
        # Prepare user item
        timestamp = int(time.time())
        user_item = {
            'userId': user_id,
            'tenantId': user_data['tenantId'],
            'email': user_data['email'],
            'emailHash': email_hash,
            'name': encrypt_field(user_data['name']),  # Encrypt PII
            'createdAt': timestamp,
            'updatedAt': timestamp,
            'status': 'active',
            'gdprConsent': user_data.get('gdprConsent', False),
            'dataRetention': user_data.get('dataRetention', 365),  # Days
            'region': REGION
        }
        
        # Add TTL for GDPR compliance (auto-delete after retention period)
        if user_data.get('dataRetention'):
            tt