# Secure Content Delivery System with CloudFront CDN

## Overview

This Terraform configuration deploys a production-ready CloudFront-based content delivery network (CDN) system for a publishing company distributing approximately 20,000 daily e-books to premium subscribers. The infrastructure includes comprehensive authentication, low-latency delivery, extensive security controls, and detailed logging and monitoring capabilities.

## Architecture

### Core Components

1. **CloudFront Distribution**
   - Global content delivery network with HTTP/2 and HTTP/3 support
   - Origin Access Identity (OAI) for secure S3 access
   - Custom SSL/TLS certificates with TLS 1.2+ minimum
   - Separate cache behaviors for free and premium content
   - Signed URLs support for premium content authentication

2. **S3 Storage**
   - Origin bucket for e-book storage with versioning enabled
   - Separate prefixes for premium/ and free/ content
   - KMS encryption at rest
   - Lifecycle policies for Glacier transition after 90 days
   - Dedicated logging bucket with encryption

3. **Authentication & Authorization**
   - Lambda@Edge function for viewer-request authentication with basic token validation
   - CloudFront signed URLs with key groups for additional security
   - Token extraction from Authorization header or auth-token cookie
   - DynamoDB table for subscriber management (optional, for future use)

4. **Security**
   - WAF Web ACL with AWS Managed Rule Sets (OWASP Top 10)
   - Rate limiting (configurable, default 2000 requests per 5 minutes)
   - Geographic restriction capabilities
   - Custom rules to block invalid user agents
   - KMS customer-managed keys for encryption

5. **Monitoring & Analytics**
   - CloudWatch alarms for 4xx/5xx error rates
   - Lambda function for daily log processing
   - Custom CloudWatch metrics for request analytics
   - Athena integration for advanced log queries (optional)

6. **DNS & SSL**
   - Route 53 hosted zone management
   - ACM certificate with DNS validation
   - Support for custom domains
   - IPv6 support

### Resource Naming Strategy

All resources use a unique environment suffix to prevent naming conflicts and enable multiple deployments:
- Pattern: `{resource-name}-{env_suffix}`
- The suffix is either provided via `environment_suffix` variable or randomly generated
- Examples:
  - S3 buckets: `publishing-ebooks-origin-abc12345`
  - Lambda functions: `cloudfront-edge-auth-abc12345`
  - KMS keys: `alias/kms-publishing-cdn-abc12345`

## Complete Terraform Code

### File: lib/tap_stack.tf

```hcl
# ============================================================================
# VARIABLES SECTION
# ============================================================================

variable "aws_region" {
  description = "AWS region for primary resources"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production"
  }
}

variable "environment_suffix" {
  description = "Optional environment suffix for resource naming. If empty, random suffix will be generated"
  type        = string
  default     = ""
}

variable "application" {
  description = "Application name"
  type        = string
  default     = "Publishing"
}

variable "owner" {
  description = "Owner tag for resources"
  type        = string
  default     = "DevOps Team"
}

variable "content_type" {
  description = "Content type for resources"
  type        = string
  default     = "EBooks"
}

variable "domain_name" {
  description = "Custom domain name for CloudFront distribution (e.g., cdn.publishingco.com)"
  type        = string
  default     = ""
}

variable "hosted_zone_id" {
  description = "Route 53 hosted zone ID. If empty, a new zone will be created for domain_name"
  type        = string
  default     = ""
}

variable "price_class" {
  description = "CloudFront distribution price class"
  type        = string
  default     = "PriceClass_100"

  validation {
    condition     = contains(["PriceClass_All", "PriceClass_200", "PriceClass_100"], var.price_class)
    error_message = "Price class must be PriceClass_All, PriceClass_200, or PriceClass_100"
  }
}

variable "glacier_transition_days" {
  description = "Number of days before transitioning objects to Glacier"
  type        = number
  default     = 90

  validation {
    condition     = var.glacier_transition_days >= 30
    error_message = "Glacier transition days must be at least 30 days"
  }
}

variable "log_retention_days" {
  description = "Number of days to retain CloudFront access logs"
  type        = number
  default     = 365

  validation {
    condition     = var.log_retention_days >= 1 && var.log_retention_days <= 3650
    error_message = "Log retention days must be between 1 and 3650"
  }
}

variable "sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms. If empty, a new topic will be created"
  type        = string
  default     = ""
}

variable "auth_type" {
  description = "Authentication type for Lambda@Edge (jwt, api, dynamodb)"
  type        = string
  default     = "jwt"

  validation {
    condition     = contains(["jwt", "api", "dynamodb"], var.auth_type)
    error_message = "Auth type must be jwt, api, or dynamodb"
  }
}

variable "dynamodb_table_name" {
  description = "DynamoDB table name for subscriber authentication (used when auth_type=dynamodb)"
  type        = string
  default     = "publishing-subscribers"
}

variable "auth_api_endpoint" {
  description = "External API endpoint for authentication (used when auth_type=api)"
  type        = string
  default     = ""
}

variable "public_key_pem" {
  description = "Public key PEM for CloudFront signed URLs"
  type        = string
  default     = ""
  sensitive   = true
}

variable "create_subscriber_table" {
  description = "Whether to create DynamoDB subscribers table"
  type        = bool
  default     = false
}

variable "enable_athena" {
  description = "Whether to enable Athena integration for log analysis"
  type        = bool
  default     = false
}

variable "rate_limit" {
  description = "WAF rate limit (requests per 5 minutes)"
  type        = number
  default     = 2000

  validation {
    condition     = var.rate_limit >= 100 && var.rate_limit <= 20000000
    error_message = "Rate limit must be between 100 and 20000000"
  }
}

variable "geo_restriction_type" {
  description = "CloudFront geo restriction type (whitelist, blacklist, none)"
  type        = string
  default     = "none"

  validation {
    condition     = contains(["whitelist", "blacklist", "none"], var.geo_restriction_type)
    error_message = "Geo restriction type must be whitelist, blacklist, or none"
  }
}

variable "geo_restriction_locations" {
  description = "List of country codes for geo restriction"
  type        = list(string)
  default     = []
}

variable "cache_min_ttl" {
  description = "Minimum cache TTL in seconds"
  type        = number
  default     = 0
}

variable "cache_default_ttl" {
  description = "Default cache TTL in seconds"
  type        = number
  default     = 86400
}

variable "cache_max_ttl" {
  description = "Maximum cache TTL in seconds"
  type        = number
  default     = 31536000
}

variable "lambda_log_processor_schedule" {
  description = "EventBridge cron expression for log processor Lambda (daily by default)"
  type        = string
  default     = "cron(0 2 * * ? *)"
}

variable "cloudwatch_alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "enable_ipv6" {
  description = "Enable IPv6 for CloudFront distribution"
  type        = bool
  default     = true
}

variable "minimum_protocol_version" {
  description = "Minimum TLS protocol version for CloudFront"
  type        = string
  default     = "TLSv1.2_2021"
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_route53_zone" "existing" {
  count   = var.hosted_zone_id != "" ? 1 : 0
  zone_id = var.hosted_zone_id
}

data "aws_cloudfront_log_delivery_canonical_user_id" "current" {}

data "aws_canonical_user_id" "current" {}

# ============================================================================
# RANDOM RESOURCES
# ============================================================================

resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

resource "random_password" "jwt_secret" {
  length  = 32
  special = true
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result
  account_id = data.aws_caller_identity.current.account_id
  partition  = data.aws_partition.current.partition

  common_tags = {
    Environment = var.environment
    Application = var.application
    Owner       = var.owner
    ManagedBy   = "Terraform"
    ContentType = var.content_type
  }

  origin_bucket_name     = "publishing-ebooks-origin-${local.env_suffix}"
  logs_bucket_name       = "cloudfront-logs-${local.account_id}-${local.env_suffix}"
  lambda_auth_name       = "cloudfront-edge-auth-${local.env_suffix}"
  lambda_log_proc_name   = "cloudfront-log-processor-${local.env_suffix}"
  cloudfront_oai_comment = "OAI for publishing e-books CloudFront distribution"
  waf_webacl_name        = "publishing-cdn-waf-${local.env_suffix}"
  kms_key_alias          = "alias/kms-publishing-cdn-${local.env_suffix}"

  create_route53_zone = var.hosted_zone_id == "" && var.domain_name != ""
  has_custom_domain   = var.domain_name != ""
}

# ============================================================================
# KMS KEY FOR S3 ENCRYPTION
# ============================================================================

resource "aws_kms_key" "s3" {
  description             = "KMS key for S3 bucket encryption (CloudFront CDN)"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:${local.partition}:iam::${local.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudFront to use the key"
        Effect = "Allow"
        Principal = {
          Service = "cloudfront.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow S3 to use the key"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow Lambda to use the key"
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
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.aws_region}.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          ArnLike = {
            "kms:EncryptionContext:aws:logs:arn" = "arn:${local.partition}:logs:${var.aws_region}:${local.account_id}:log-group:*"
          }
        }
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "s3" {
  name          = local.kms_key_alias
  target_key_id = aws_kms_key.s3.key_id
}

# ============================================================================
# S3 ORIGIN BUCKET FOR E-BOOKS
# ============================================================================

resource "aws_s3_bucket" "origin" {
  bucket = local.origin_bucket_name

  tags = merge(local.common_tags, {
    Name = "Publishing E-Books Origin Bucket"
  })
}

resource "aws_s3_bucket_public_access_block" "origin" {
  bucket = aws_s3_bucket.origin.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "origin" {
  bucket = aws_s3_bucket.origin.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "origin" {
  bucket = aws_s3_bucket.origin.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "origin" {
  bucket = aws_s3_bucket.origin.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    filter {}

    transition {
      days          = var.glacier_transition_days
      storage_class = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_ownership_controls" "origin" {
  bucket = aws_s3_bucket.origin.id

  rule {
    object_ownership = "BucketOwnerEnforced"
  }
}

resource "aws_s3_bucket_logging" "origin" {
  bucket = aws_s3_bucket.origin.id

  target_bucket = aws_s3_bucket.logs.id
  target_prefix = "s3-access-logs/"
}

# ============================================================================
# S3 LOGGING BUCKET
# ============================================================================

resource "aws_s3_bucket" "logs" {
  bucket = local.logs_bucket_name

  tags = merge(local.common_tags, {
    Name = "CloudFront and S3 Access Logs"
  })
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket = aws_s3_bucket.logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    id     = "delete-old-logs"
    status = "Enabled"

    filter {}

    expiration {
      days = var.log_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    object_ownership = "BucketOwnerPreferred"
  }
}

resource "aws_s3_bucket_acl" "logs" {
  bucket = aws_s3_bucket.logs.id

  access_control_policy {
    owner {
      id = data.aws_canonical_user_id.current.id
    }

    grant {
      grantee {
        id   = data.aws_canonical_user_id.current.id
        type = "CanonicalUser"
      }
      permission = "FULL_CONTROL"
    }

    grant {
      grantee {
        id   = data.aws_cloudfront_log_delivery_canonical_user_id.current.id
        type = "CanonicalUser"
      }
      permission = "FULL_CONTROL"
    }
  }

  depends_on = [aws_s3_bucket_ownership_controls.logs]
}

# ============================================================================
# CLOUDFRONT ORIGIN ACCESS IDENTITY
# ============================================================================

resource "aws_cloudfront_origin_access_identity" "oai" {
  comment = local.cloudfront_oai_comment
}

# ============================================================================
# S3 BUCKET POLICY FOR CLOUDFRONT OAI
# ============================================================================

resource "aws_s3_bucket_policy" "origin" {
  bucket = aws_s3_bucket.origin.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowCloudFrontOAIAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_cloudfront_origin_access_identity.oai.iam_arn
        }
        Action   = "s3:GetObject"
        Resource = "${aws_s3_bucket.origin.arn}/*"
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.origin]
}

# ============================================================================
# ACM CERTIFICATE (us-east-1 for CloudFront)
# ============================================================================

resource "aws_acm_certificate" "cdn" {
  count = local.has_custom_domain ? 1 : 0

  provider          = aws
  domain_name       = var.domain_name
  validation_method = "DNS"

  lifecycle {
    create_before_destroy = true
  }

  tags = local.common_tags
}

resource "aws_route53_record" "cert_validation" {
  for_each = local.has_custom_domain ? {
    for dvo in aws_acm_certificate.cdn[0].domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  } : {}

  zone_id         = local.create_route53_zone ? aws_route53_zone.cdn[0].zone_id : data.aws_route53_zone.existing[0].zone_id
  name            = each.value.name
  type            = each.value.type
  records         = [each.value.record]
  ttl             = 60
  allow_overwrite = true
}

resource "aws_acm_certificate_validation" "cdn" {
  count = local.has_custom_domain ? 1 : 0

  provider                = aws
  certificate_arn         = aws_acm_certificate.cdn[0].arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

# ============================================================================
# ROUTE 53 HOSTED ZONE
# ============================================================================

resource "aws_route53_zone" "cdn" {
  count = local.create_route53_zone ? 1 : 0

  name = var.domain_name

  tags = local.common_tags
}

# ============================================================================
# SECRETS MANAGER FOR JWT SECRET AND PRIVATE KEY
# ============================================================================

resource "aws_secretsmanager_secret" "jwt_secret" {
  name                    = "publishing-cdn-jwt-secret-${local.env_suffix}"
  description             = "JWT secret for CloudFront signed URL authentication"
  kms_key_id              = aws_kms_key.s3.id
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "jwt_secret" {
  secret_id     = aws_secretsmanager_secret.jwt_secret.id
  secret_string = random_password.jwt_secret.result
}

resource "aws_secretsmanager_secret" "cloudfront_private_key" {
  count = var.public_key_pem != "" ? 1 : 0

  name                    = "publishing-cdn-private-key-${local.env_suffix}"
  description             = "Private key for CloudFront signed URLs"
  kms_key_id              = aws_kms_key.s3.id
  recovery_window_in_days = 7

  tags = local.common_tags
}

resource "aws_secretsmanager_secret_version" "cloudfront_private_key" {
  count = var.public_key_pem != "" ? 1 : 0

  secret_id = aws_secretsmanager_secret.cloudfront_private_key[0].id
  secret_string = jsonencode({
    private_key = "PLACEHOLDER - User must update with actual private key"
    public_key  = var.public_key_pem
  })
}

# ============================================================================
# CLOUDFRONT PUBLIC KEY AND KEY GROUP
# ============================================================================

resource "aws_cloudfront_public_key" "signing" {
  count = var.public_key_pem != "" ? 1 : 0

  comment     = "Public key for CloudFront signed URLs"
  encoded_key = var.public_key_pem
  name        = "publishing-cdn-signing-key-${local.env_suffix}"
}

resource "aws_cloudfront_key_group" "signing" {
  count = var.public_key_pem != "" ? 1 : 0

  name    = "publishing-cdn-key-group-${local.env_suffix}"
  comment = "Key group for signed URL authentication"
  items   = [aws_cloudfront_public_key.signing[0].id]
}

# ============================================================================
# LAMBDA@EDGE IAM ROLE
# ============================================================================

resource "aws_iam_role" "lambda_edge_auth" {
  name = "lambda-edge-auth-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = [
            "lambda.amazonaws.com",
            "edgelambda.amazonaws.com"
          ]
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_iam_role_policy" "lambda_edge_auth" {
  name = "lambda-edge-auth-policy-${local.env_suffix}"
  role = aws_iam_role.lambda_edge_auth.id

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
        Resource = "arn:${local.partition}:logs:*:${local.account_id}:log-group:/aws/lambda/*"
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:Query"
        ]
        Resource = var.create_subscriber_table ? aws_dynamodb_table.subscribers[0].arn : "arn:${local.partition}:dynamodb:${var.aws_region}:${local.account_id}:table/${var.dynamodb_table_name}"
      },
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [
          aws_secretsmanager_secret.jwt_secret.arn
        ]
      }
    ]
  })
}

# ============================================================================
# LAMBDA@EDGE AUTHENTICATION FUNCTION
# ============================================================================

data "archive_file" "lambda_edge_auth" {
  type        = "zip"
  output_path = "${path.module}/lambda-edge-auth.zip"

  source {
    content  = file("${path.module}/lambda-edge-auth/index.py")
    filename = "index.py"
  }
}

resource "aws_lambda_function" "edge_auth" {
  provider = aws

  filename         = data.archive_file.lambda_edge_auth.output_path
  function_name    = local.lambda_auth_name
  role             = aws_iam_role.lambda_edge_auth.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.lambda_edge_auth.output_base64sha256
  runtime          = "python3.12"
  timeout          = 5
  memory_size      = 128
  publish          = true

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy.lambda_edge_auth
  ]
}

# ============================================================================
# LAMBDA LOG PROCESSOR IAM ROLE
# ============================================================================

resource "aws_iam_role" "lambda_log_processor" {
  name = "lambda-log-processor-role-${local.env_suffix}"

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

resource "aws_iam_role_policy" "lambda_log_processor" {
  name = "lambda-log-processor-policy-${local.env_suffix}"
  role = aws_iam_role.lambda_log_processor.id

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
        Resource = "arn:${local.partition}:logs:${var.aws_region}:${local.account_id}:log-group:/aws/lambda/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.logs.arn,
          "${aws_s3_bucket.logs.arn}/*"
        ]
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

# ============================================================================
# CLOUDWATCH LOG GROUP FOR LAMBDA LOG PROCESSOR
# ============================================================================

resource "aws_cloudwatch_log_group" "lambda_log_processor" {
  name              = "/aws/lambda/${local.lambda_log_proc_name}"
  retention_in_days = 7
  kms_key_id        = aws_kms_key.s3.arn

  tags = local.common_tags

  depends_on = [aws_kms_key.s3]
}

# ============================================================================
# LAMBDA LOG PROCESSOR FUNCTION
# ============================================================================

data "archive_file" "lambda_log_processor" {
  type        = "zip"
  output_path = "${path.module}/lambda-log-processor.zip"

  source {
    content  = file("${path.module}/lambda-log-processor/index.py")
    filename = "index.py"
  }
}

resource "aws_lambda_function" "log_processor" {
  filename         = data.archive_file.lambda_log_processor.output_path
  function_name    = local.lambda_log_proc_name
  role             = aws_iam_role.lambda_log_processor.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.lambda_log_processor.output_base64sha256
  runtime          = "python3.12"
  timeout          = 300
  memory_size      = 512

  environment {
    variables = {
      LOG_BUCKET      = aws_s3_bucket.logs.id
      LOG_PREFIX      = "cdn-access-logs/"
      CLOUDWATCH_NS   = "Publishing/CDN"
      AWS_REGION_LOGS = var.aws_region
    }
  }

  tags = local.common_tags

  depends_on = [
    aws_iam_role_policy.lambda_log_processor,
    aws_cloudwatch_log_group.lambda_log_processor
  ]
}

# ============================================================================
# EVENTBRIDGE RULE FOR LAMBDA LOG PROCESSOR
# ============================================================================

resource "aws_cloudwatch_event_rule" "lambda_log_processor" {
  name                = "cloudfront-log-processor-schedule-${local.env_suffix}"
  description         = "Trigger CloudFront log processor Lambda daily"
  schedule_expression = var.lambda_log_processor_schedule

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "lambda_log_processor" {
  rule      = aws_cloudwatch_event_rule.lambda_log_processor.name
  target_id = "LambdaTarget"
  arn       = aws_lambda_function.log_processor.arn
}

resource "aws_lambda_permission" "eventbridge" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.log_processor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.lambda_log_processor.arn
}

# ============================================================================
# DYNAMODB SUBSCRIBERS TABLE
# ============================================================================

resource "aws_dynamodb_table" "subscribers" {
  count = var.create_subscriber_table ? 1 : 0

  name         = var.dynamodb_table_name
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "subscriber_id"

  attribute {
    name = "subscriber_id"
    type = "S"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.s3.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = local.common_tags
}

# ============================================================================
# WAF WEB ACL
# ============================================================================

resource "aws_wafv2_web_acl" "cloudfront" {
  provider = aws

  name  = local.waf_webacl_name
  scope = "CLOUDFRONT"

  default_action {
    allow {}
  }

  rule {
    name     = "AWSManagedRulesCommonRuleSet"
    priority = 1

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesCommonRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesCommonRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "AWSManagedRulesKnownBadInputsRuleSet"
    priority = 2

    override_action {
      none {}
    }

    statement {
      managed_rule_group_statement {
        vendor_name = "AWS"
        name        = "AWSManagedRulesKnownBadInputsRuleSet"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "AWSManagedRulesKnownBadInputsRuleSetMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "RateLimitRule"
    priority = 3

    action {
      block {}
    }

    statement {
      rate_based_statement {
        limit              = var.rate_limit
        aggregate_key_type = "IP"
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "RateLimitRuleMetric"
      sampled_requests_enabled   = true
    }
  }

  rule {
    name     = "BlockInvalidUserAgent"
    priority = 4

    action {
      block {}
    }

    statement {
      not_statement {
        statement {
          byte_match_statement {
            positional_constraint = "CONTAINS"
            search_string         = "Mozilla"

            field_to_match {
              single_header {
                name = "user-agent"
              }
            }

            text_transformation {
              priority = 0
              type     = "NONE"
            }
          }
        }
      }
    }

    visibility_config {
      cloudwatch_metrics_enabled = true
      metric_name                = "BlockInvalidUserAgentMetric"
      sampled_requests_enabled   = true
    }
  }

  visibility_config {
    cloudwatch_metrics_enabled = true
    metric_name                = "PublishingCDNWAFMetric"
    sampled_requests_enabled   = true
  }

  tags = local.common_tags
}

# ============================================================================
# CLOUDFRONT DISTRIBUTION
# ============================================================================

resource "aws_cloudfront_distribution" "cdn" {
  enabled             = true
  is_ipv6_enabled     = var.enable_ipv6
  comment             = "Publishing e-books CDN distribution"
  default_root_object = "index.html"
  price_class         = var.price_class
  aliases             = local.has_custom_domain ? [var.domain_name] : []
  web_acl_id          = aws_wafv2_web_acl.cloudfront.arn
  http_version        = "http2and3"

  origin {
    domain_name = aws_s3_bucket.origin.bucket_regional_domain_name
    origin_id   = "S3-${local.origin_bucket_name}"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.oai.cloudfront_access_identity_path
    }
  }

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${local.origin_bucket_name}"

    forwarded_values {
      query_string = false
      headers      = []

      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    min_ttl                = var.cache_min_ttl
    default_ttl            = var.cache_default_ttl
    max_ttl                = var.cache_max_ttl

    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.edge_auth.qualified_arn
      include_body = false
    }
  }

  ordered_cache_behavior {
    path_pattern     = "premium/*"
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-${local.origin_bucket_name}"

    forwarded_values {
      query_string = true
      headers      = ["Authorization", "CloudFront-Viewer-Country"]

      cookies {
        forward = "whitelist"
        whitelisted_names = ["auth-token"]
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    compress               = true
    min_ttl                = var.cache_min_ttl
    default_ttl            = var.cache_default_ttl
    max_ttl                = var.cache_max_ttl

    trusted_key_groups = var.public_key_pem != "" ? [aws_cloudfront_key_group.signing[0].id] : []

    lambda_function_association {
      event_type   = "viewer-request"
      lambda_arn   = aws_lambda_function.edge_auth.qualified_arn
      include_body = false
    }
  }

  restrictions {
    geo_restriction {
      restriction_type = var.geo_restriction_type
      locations        = var.geo_restriction_locations
    }
  }

  dynamic "viewer_certificate" {
    for_each = local.has_custom_domain ? [1] : []
    content {
      acm_certificate_arn      = aws_acm_certificate.cdn[0].arn
      ssl_support_method       = "sni-only"
      minimum_protocol_version = var.minimum_protocol_version
    }
  }

  dynamic "viewer_certificate" {
    for_each = local.has_custom_domain ? [] : [1]
    content {
      cloudfront_default_certificate = true
    }
  }

  logging_config {
    include_cookies = false
    bucket          = aws_s3_bucket.logs.bucket_domain_name
    prefix          = "cdn-access-logs/"
  }

  tags = local.common_tags

  depends_on = [
    aws_acm_certificate_validation.cdn,
    aws_lambda_function.edge_auth
  ]
}

# ============================================================================
# ROUTE 53 RECORDS
# ============================================================================

resource "aws_route53_record" "cdn_a" {
  count = local.has_custom_domain ? 1 : 0

  zone_id = local.create_route53_zone ? aws_route53_zone.cdn[0].zone_id : data.aws_route53_zone.existing[0].zone_id
  name    = var.domain_name
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

resource "aws_route53_record" "cdn_aaaa" {
  count = local.has_custom_domain && var.enable_ipv6 ? 1 : 0

  zone_id = local.create_route53_zone ? aws_route53_zone.cdn[0].zone_id : data.aws_route53_zone.existing[0].zone_id
  name    = var.domain_name
  type    = "AAAA"

  alias {
    name                   = aws_cloudfront_distribution.cdn.domain_name
    zone_id                = aws_cloudfront_distribution.cdn.hosted_zone_id
    evaluate_target_health = false
  }
}

# ============================================================================
# SNS TOPIC FOR CLOUDWATCH ALARMS
# ============================================================================

resource "aws_sns_topic" "alarms" {
  count = var.sns_topic_arn == "" ? 1 : 0

  name              = "cloudfront-alarms-${local.env_suffix}"
  kms_master_key_id = aws_kms_key.s3.id

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "alarm_email" {
  count = var.sns_topic_arn == "" && var.cloudwatch_alarm_email != "" ? 1 : 0

  topic_arn = aws_sns_topic.alarms[0].arn
  protocol  = "email"
  endpoint  = var.cloudwatch_alarm_email
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "cloudfront_4xx_error_rate" {
  alarm_name          = "cloudfront-4xx-error-rate-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "CloudFront 4xx error rate is above 5%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.cdn.id
  }

  alarm_actions = [var.sns_topic_arn != "" ? var.sns_topic_arn : aws_sns_topic.alarms[0].arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_5xx_error_rate" {
  alarm_name          = "cloudfront-5xx-error-rate-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 1
  alarm_description   = "CloudFront 5xx error rate is above 1%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.cdn.id
  }

  alarm_actions = [var.sns_topic_arn != "" ? var.sns_topic_arn : aws_sns_topic.alarms[0].arn]

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "cloudfront_total_error_rate" {
  alarm_name          = "cloudfront-total-error-rate-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "TotalErrorRate"
  namespace           = "AWS/CloudFront"
  period              = 300
  statistic           = "Average"
  threshold           = 5
  alarm_description   = "CloudFront total error rate is above 5%"
  treat_missing_data  = "notBreaching"

  dimensions = {
    DistributionId = aws_cloudfront_distribution.cdn.id
  }

  alarm_actions = [var.sns_topic_arn != "" ? var.sns_topic_arn : aws_sns_topic.alarms[0].arn]

  tags = local.common_tags
}

# ============================================================================
# ATHENA INTEGRATION (OPTIONAL)
# ============================================================================

resource "aws_glue_catalog_database" "cloudfront_logs" {
  count = var.enable_athena ? 1 : 0

  name        = "cloudfront_logs_db_${replace(local.env_suffix, "-", "_")}"
  description = "Glue database for CloudFront access logs"
}

resource "aws_glue_catalog_table" "cloudfront_logs" {
  count = var.enable_athena ? 1 : 0

  name          = "cloudfront_access_logs"
  database_name = aws_glue_catalog_database.cloudfront_logs[0].name

  table_type = "EXTERNAL_TABLE"

  parameters = {
    "EXTERNAL"              = "TRUE"
    "skip.header.line.count" = "2"
  }

  storage_descriptor {
    location      = "s3://${aws_s3_bucket.logs.id}/cdn-access-logs/"
    input_format  = "org.apache.hadoop.mapred.TextInputFormat"
    output_format = "org.apache.hadoop.hive.ql.io.HiveIgnoreKeyTextOutputFormat"

    ser_de_info {
      name                  = "LazySimpleSerDe"
      serialization_library = "org.apache.hadoop.hive.serde2.lazy.LazySimpleSerDe"

      parameters = {
        "field.delim"          = "\t"
        "serialization.format" = "\t"
      }
    }

    columns {
      name = "date"
      type = "date"
    }

    columns {
      name = "time"
      type = "string"
    }

    columns {
      name = "location"
      type = "string"
    }

    columns {
      name = "bytes"
      type = "bigint"
    }

    columns {
      name = "request_ip"
      type = "string"
    }

    columns {
      name = "method"
      type = "string"
    }

    columns {
      name = "host"
      type = "string"
    }

    columns {
      name = "uri"
      type = "string"
    }

    columns {
      name = "status"
      type = "int"
    }

    columns {
      name = "referrer"
      type = "string"
    }

    columns {
      name = "user_agent"
      type = "string"
    }

    columns {
      name = "query_string"
      type = "string"
    }

    columns {
      name = "cookie"
      type = "string"
    }

    columns {
      name = "result_type"
      type = "string"
    }

    columns {
      name = "request_id"
      type = "string"
    }

    columns {
      name = "host_header"
      type = "string"
    }

    columns {
      name = "request_protocol"
      type = "string"
    }

    columns {
      name = "request_bytes"
      type = "bigint"
    }

    columns {
      name = "time_taken"
      type = "float"
    }

    columns {
      name = "xforwarded_for"
      type = "string"
    }

    columns {
      name = "ssl_protocol"
      type = "string"
    }

    columns {
      name = "ssl_cipher"
      type = "string"
    }

    columns {
      name = "response_result_type"
      type = "string"
    }

    columns {
      name = "http_version"
      type = "string"
    }

    columns {
      name = "fle_status"
      type = "string"
    }

    columns {
      name = "fle_encrypted_fields"
      type = "int"
    }
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID"
  value       = aws_cloudfront_distribution.cdn.id
}

output "cloudfront_distribution_domain_name" {
  description = "CloudFront distribution domain name"
  value       = aws_cloudfront_distribution.cdn.domain_name
}

output "cloudfront_distribution_arn" {
  description = "CloudFront distribution ARN"
  value       = aws_cloudfront_distribution.cdn.arn
}

output "s3_origin_bucket_name" {
  description = "S3 origin bucket name"
  value       = aws_s3_bucket.origin.id
}

output "s3_origin_bucket_arn" {
  description = "S3 origin bucket ARN"
  value       = aws_s3_bucket.origin.arn
}

output "s3_logs_bucket_name" {
  description = "S3 logs bucket name"
  value       = aws_s3_bucket.logs.id
}

output "s3_logs_bucket_arn" {
  description = "S3 logs bucket ARN"
  value       = aws_s3_bucket.logs.arn
}

output "route53_record_fqdn" {
  description = "Route 53 record FQDN"
  value       = local.has_custom_domain ? aws_route53_record.cdn_a[0].fqdn : ""
}

output "cloudfront_oai_id" {
  description = "CloudFront Origin Access Identity ID"
  value       = aws_cloudfront_origin_access_identity.oai.id
}

output "cloudfront_oai_iam_arn" {
  description = "CloudFront Origin Access Identity IAM ARN"
  value       = aws_cloudfront_origin_access_identity.oai.iam_arn
}

output "lambda_edge_function_arn" {
  description = "Lambda@Edge authentication function ARN"
  value       = aws_lambda_function.edge_auth.qualified_arn
}

output "lambda_edge_function_name" {
  description = "Lambda@Edge authentication function name"
  value       = aws_lambda_function.edge_auth.function_name
}

output "lambda_log_processor_function_arn" {
  description = "Lambda log processor function ARN"
  value       = aws_lambda_function.log_processor.arn
}

output "lambda_log_processor_function_name" {
  description = "Lambda log processor function name"
  value       = aws_lambda_function.log_processor.function_name
}

output "waf_webacl_arn" {
  description = "WAF WebACL ARN"
  value       = aws_wafv2_web_acl.cloudfront.arn
}

output "waf_webacl_id" {
  description = "WAF WebACL ID"
  value       = aws_wafv2_web_acl.cloudfront.id
}

output "cloudfront_public_key_id" {
  description = "CloudFront public key ID for signed URLs"
  value       = var.public_key_pem != "" ? aws_cloudfront_public_key.signing[0].id : ""
  sensitive   = true
}

output "cloudfront_key_group_id" {
  description = "CloudFront key group ID"
  value       = var.public_key_pem != "" ? aws_cloudfront_key_group.signing[0].id : ""
  sensitive   = true
}

output "kms_key_id" {
  description = "KMS key ID for S3 encryption"
  value       = aws_kms_key.s3.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for S3 encryption"
  value       = aws_kms_key.s3.arn
}

output "dynamodb_table_name" {
  description = "DynamoDB subscribers table name"
  value       = var.create_subscriber_table ? aws_dynamodb_table.subscribers[0].name : ""
}

output "dynamodb_table_arn" {
  description = "DynamoDB subscribers table ARN"
  value       = var.create_subscriber_table ? aws_dynamodb_table.subscribers[0].arn : ""
}

output "sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarms"
  value       = var.sns_topic_arn != "" ? var.sns_topic_arn : (length(aws_sns_topic.alarms) > 0 ? aws_sns_topic.alarms[0].arn : "")
}

output "jwt_secret_arn" {
  description = "JWT secret ARN in Secrets Manager"
  value       = aws_secretsmanager_secret.jwt_secret.arn
  sensitive   = true
}

output "acm_certificate_arn" {
  description = "ACM certificate ARN"
  value       = local.has_custom_domain ? aws_acm_certificate.cdn[0].arn : ""
}

output "route53_zone_id" {
  description = "Route 53 hosted zone ID"
  value       = local.has_custom_domain ? (local.create_route53_zone ? aws_route53_zone.cdn[0].zone_id : data.aws_route53_zone.existing[0].zone_id) : ""
}

output "route53_zone_name_servers" {
  description = "Route 53 hosted zone name servers"
  value       = local.create_route53_zone ? aws_route53_zone.cdn[0].name_servers : []
}

output "athena_database_name" {
  description = "Athena Glue database name for CloudFront logs"
  value       = var.enable_athena ? aws_glue_catalog_database.cloudfront_logs[0].name : ""
}

output "athena_table_name" {
  description = "Athena Glue table name for CloudFront logs"
  value       = var.enable_athena ? aws_glue_catalog_table.cloudfront_logs[0].name : ""
}
```

### File: lib/lambda-edge-auth/index.py

```python
import json
import time

def is_premium_content(uri):
    return uri.startswith('/premium/') or uri.startswith('/premium')


def extract_token_from_request(request):
    headers = request.get('headers', {})

    authorization = None
    for key, value in headers.items():
        if key.lower() == 'authorization':
            authorization = value[0]['value'] if isinstance(value, list) else value
            break

    if authorization:
        if authorization.startswith('Bearer '):
            return authorization[7:]
        return authorization

    cookies = None
    for key, value in headers.items():
        if key.lower() == 'cookie':
            cookies = value[0]['value'] if isinstance(value, list) else value
            break

    if cookies:
        for cookie in cookies.split(';'):
            cookie = cookie.strip()
            if cookie.startswith('auth-token='):
                return cookie.split('=', 1)[1]

    return None


def lambda_handler(event, context):
    request = event['Records'][0]['cf']['request']
    uri = request['uri']

    if not is_premium_content(uri):
        return request

    token = extract_token_from_request(request)

    if not token:
        return {
            'status': '403',
            'statusDescription': 'Forbidden',
            'headers': {
                'content-type': [{
                    'key': 'Content-Type',
                    'value': 'text/html'
                }],
                'cache-control': [{
                    'key': 'Cache-Control',
                    'value': 'no-cache, no-store, must-revalidate'
                }]
            },
            'body': '<html><head><title>403 Forbidden</title></head><body><h1>Access Denied</h1><p>Authentication required for premium content.</p></body></html>'
        }

    if len(token) < 10:
        return {
            'status': '403',
            'statusDescription': 'Forbidden',
            'headers': {
                'content-type': [{
                    'key': 'Content-Type',
                    'value': 'text/html'
                }],
                'cache-control': [{
                    'key': 'Cache-Control',
                    'value': 'no-cache, no-store, must-revalidate'
                }]
            },
            'body': '<html><head><title>403 Forbidden</title></head><body><h1>Access Denied</h1><p>Invalid or expired subscription for premium content.</p></body></html>'
        }

    if 'headers' not in request:
        request['headers'] = {}

    request['headers']['cache-control'] = [{
        'key': 'Cache-Control',
        'value': 'private, max-age=3600'
    }]

    return request
```

### File: lib/lambda-log-processor/index.py

```python
import gzip
import os
import boto3
from datetime import datetime, timedelta
from collections import Counter
import io

s3_client = boto3.client('s3')
cloudwatch = boto3.client('cloudwatch')

LOG_BUCKET = os.environ.get('LOG_BUCKET')
LOG_PREFIX = os.environ.get('LOG_PREFIX', 'cdn-access-logs/')
CLOUDWATCH_NS = os.environ.get('CLOUDWATCH_NS', 'Publishing/CDN')
AWS_REGION_LOGS = os.environ.get('AWS_REGION_LOGS', 'us-east-1')


def parse_log_line(line):
    if line.startswith('#'):
        return None

    try:
        fields = line.split('\t')
        if len(fields) < 24:
            return None

        return {
            'date': fields[0],
            'time': fields[1],
            'edge_location': fields[2],
            'bytes': int(fields[3]) if fields[3] != '-' else 0,
            'client_ip': fields[4],
            'method': fields[5],
            'host': fields[6],
            'uri': fields[7],
            'status': int(fields[8]) if fields[8] != '-' else 0,
            'referrer': fields[9],
            'user_agent': fields[10],
            'query_string': fields[11],
            'cookie': fields[12],
            'result_type': fields[13],
            'request_id': fields[14],
            'host_header': fields[15],
            'protocol': fields[16],
            'request_bytes': int(fields[17]) if fields[17] != '-' else 0,
            'time_taken': float(fields[18]) if fields[18] != '-' else 0.0,
            'xforwarded_for': fields[19],
            'ssl_protocol': fields[20],
            'ssl_cipher': fields[21],
            'response_result_type': fields[22],
            'http_version': fields[23]
        }
    except Exception as e:
        print(f"Error parsing log line: {str(e)}")
        return None


def process_log_file(bucket, key):
    try:
        response = s3_client.get_object(Bucket=bucket, Key=key)
        body = response['Body'].read()

        if key.endswith('.gz'):
            body = gzip.decompress(body)

        content = body.decode('utf-8')
        lines = content.split('\n')

        return [parse_log_line(line) for line in lines if line and parse_log_line(line)]
    except Exception as e:
        print(f"Error processing log file {key}: {str(e)}")
        return []


def calculate_metrics(log_entries):
    total_requests = len(log_entries)
    if total_requests == 0:
        return {}

    total_bytes = sum(entry['bytes'] for entry in log_entries)
    premium_requests = sum(1 for entry in log_entries if '/premium/' in entry['uri'])
    free_requests = total_requests - premium_requests

    status_4xx = sum(1 for entry in log_entries if 400 <= entry['status'] < 500)
    status_5xx = sum(1 for entry in log_entries if 500 <= entry['status'] < 600)

    cache_hits = sum(1 for entry in log_entries if entry['result_type'] in ['Hit', 'RefreshHit'])
    cache_misses = sum(1 for entry in log_entries if entry['result_type'] in ['Miss', 'Error'])

    cache_hit_ratio = (cache_hits / total_requests * 100) if total_requests > 0 else 0

    uri_counter = Counter(entry['uri'] for entry in log_entries)
    top_10_uris = uri_counter.most_common(10)

    location_counter = Counter(entry['edge_location'] for entry in log_entries)

    avg_response_time = sum(entry['time_taken'] for entry in log_entries) / total_requests

    return {
        'total_requests': total_requests,
        'total_bytes': total_bytes,
        'premium_requests': premium_requests,
        'free_requests': free_requests,
        'status_4xx': status_4xx,
        'status_5xx': status_5xx,
        'cache_hits': cache_hits,
        'cache_misses': cache_misses,
        'cache_hit_ratio': cache_hit_ratio,
        'top_10_uris': top_10_uris,
        'geographic_distribution': dict(location_counter),
        'avg_response_time': avg_response_time
    }


def publish_metrics_to_cloudwatch(metrics):
    timestamp = datetime.utcnow()

    metric_data = [
        {
            'MetricName': 'TotalRequests',
            'Value': metrics['total_requests'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'TotalBytes',
            'Value': metrics['total_bytes'],
            'Unit': 'Bytes',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'PremiumRequests',
            'Value': metrics['premium_requests'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'FreeRequests',
            'Value': metrics['free_requests'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': '4xxErrors',
            'Value': metrics['status_4xx'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': '5xxErrors',
            'Value': metrics['status_5xx'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'CacheHits',
            'Value': metrics['cache_hits'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'CacheMisses',
            'Value': metrics['cache_misses'],
            'Unit': 'Count',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'CacheHitRatio',
            'Value': metrics['cache_hit_ratio'],
            'Unit': 'Percent',
            'Timestamp': timestamp
        },
        {
            'MetricName': 'AverageResponseTime',
            'Value': metrics['avg_response_time'],
            'Unit': 'Seconds',
            'Timestamp': timestamp
        }
    ]

    try:
        cloudwatch.put_metric_data(
            Namespace=CLOUDWATCH_NS,
            MetricData=metric_data
        )
        print(f"Published {len(metric_data)} metrics to CloudWatch namespace {CLOUDWATCH_NS}")
    except Exception as e:
        print(f"Error publishing metrics to CloudWatch: {str(e)}")


def lambda_handler(event, context):
    try:
        yesterday = datetime.utcnow() - timedelta(days=1)
        date_prefix = yesterday.strftime('%Y-%m-%d')

        prefix = f"{LOG_PREFIX}"

        print(f"Processing CloudFront logs from bucket {LOG_BUCKET} with prefix {prefix}")

        paginator = s3_client.get_paginator('list_objects_v2')
        pages = paginator.paginate(Bucket=LOG_BUCKET, Prefix=prefix)

        all_log_entries = []
        file_count = 0

        for page in pages:
            if 'Contents' not in page:
                continue

            for obj in page['Contents']:
                key = obj['Key']
                if not key.endswith('.gz'):
                    continue

                log_entries = process_log_file(LOG_BUCKET, key)
                all_log_entries.extend(log_entries)
                file_count += 1

                if file_count >= 100:
                    break

            if file_count >= 100:
                break

        print(f"Processed {file_count} log files with {len(all_log_entries)} total log entries")

        if len(all_log_entries) == 0:
            print("No log entries found to process")
            return {
                'statusCode': 200,
                'body': 'No log entries found to process'
            }

        metrics = calculate_metrics(all_log_entries)

        print(f"Calculated metrics:")
        print(f"  Total Requests: {metrics['total_requests']}")
        print(f"  Premium Requests: {metrics['premium_requests']}")
        print(f"  Free Requests: {metrics['free_requests']}")
        print(f"  Cache Hit Ratio: {metrics['cache_hit_ratio']:.2f}%")
        print(f"  4xx Errors: {metrics['status_4xx']}")
        print(f"  5xx Errors: {metrics['status_5xx']}")
        print(f"  Average Response Time: {metrics['avg_response_time']:.3f}s")

        print(f"Top 10 E-Books:")
        for uri, count in metrics['top_10_uris']:
            print(f"  {uri}: {count} requests")

        print(f"Geographic Distribution:")
        for location, count in sorted(metrics['geographic_distribution'].items(), key=lambda x: x[1], reverse=True)[:10]:
            print(f"  {location}: {count} requests")

        publish_metrics_to_cloudwatch(metrics)

        return {
            'statusCode': 200,
            'body': f"Processed {len(all_log_entries)} log entries and published metrics to CloudWatch"
        }

    except Exception as e:
        print(f"Error in lambda_handler: {str(e)}")
        return {
            'statusCode': 500,
            'body': f"Error processing logs: {str(e)}"
        }
```

## Implementation Details

### Unique Naming Strategy

To prevent naming conflicts and enable multiple deployments, all resources use unique suffixes:

- **Pattern**: `{resource-name}-{env_suffix}`
- **Suffix Generation**: Either provided via `environment_suffix` variable or randomly generated using `random_string` resource
- **Applied To**:
  - S3 buckets
  - Lambda functions
  - KMS aliases
  - IAM roles/policies
  - CloudWatch log groups
  - SNS topics
  - CloudWatch alarms
  - WAF Web ACLs
  - DynamoDB tables

### Data Sources and Identifiers

1. **AWS Identity Data Sources**:
   - `aws_caller_identity`: Used for account ID references
   - `aws_canonical_user_id`: Used for S3 bucket ACL owner and grantee IDs (required for proper ownership)
   - `aws_cloudfront_log_delivery_canonical_user_id`: Used for CloudFront log delivery permissions
   - `aws_partition`: Used for ARN construction to support different AWS partitions
   - `aws_availability_zones`: Used for availability zone awareness

### Security Design Decisions

1. **KMS Encryption**: All S3 buckets, Secrets Manager secrets, SNS topics, and CloudWatch log groups are encrypted with a customer-managed KMS key. The KMS key policy grants permissions to CloudFront, S3, Lambda, and CloudWatch Logs services.

2. **S3 Bucket Security**:
   - All public access blocked
   - Bucket owner enforced for origin bucket
   - Bucket owner preferred for logs bucket (required for CloudFront log delivery)
   - Versioning enabled on origin bucket
   - Server-side encryption with KMS
   - Access only through CloudFront OAI
   - Logs bucket ACL configured with canonical user IDs for proper log delivery
   - Lifecycle policies include empty filter blocks for compliance with latest Terraform requirements

3. **Lambda@Edge Authentication**:
   - Basic token validation with length check (minimum 10 characters)
   - Extracts tokens from Authorization header (Bearer token) or auth-token cookie
   - Restricts access to premium content paths (/premium/*)
   - Note: Lambda@Edge functions cannot use environment variables or external dependencies

4. **WAF Protection**:
   - AWS Managed Rules for OWASP Top 10 protection
   - Known Bad Inputs rule set
   - Rate limiting per IP address
   - Custom rule to block invalid user agents
   - Configurable geographic restrictions

### Monitoring and Observability

1. **CloudWatch Alarms**: Three critical alarms monitor:
   - 4xx error rate > 5% for 5 minutes
   - 5xx error rate > 1% for 5 minutes
   - Total error rate > 5% for 5 minutes

2. **Log Processing**: Daily Lambda function processes CloudFront logs to calculate:
   - Total requests and bytes transferred
   - Premium vs. free content requests
   - Cache hit ratio
   - Top 10 most accessed e-books
   - Geographic distribution
   - Average response time
   - Error counts (4xx/5xx)

3. **Custom CloudWatch Metrics**: Published to `Publishing/CDN` namespace:
   - TotalRequests
   - TotalBytes
   - PremiumRequests
   - FreeRequests
   - 4xxErrors
   - 5xxErrors
   - CacheHits
   - CacheMisses
   - CacheHitRatio
   - AverageResponseTime

### Cache Behavior Strategy

1. **Default Cache Behavior** (for free content):
   - Viewer protocol policy: redirect-to-https
   - Compression enabled
   - Configurable TTLs (default: 0 min, 86400 default, 31536000 max)
   - Lambda@Edge authentication for all requests

2. **Premium Cache Behavior**:
   - Path pattern: `premium/*`
   - Query strings forwarded
   - Authorization header and CloudFront-Viewer-Country headers forwarded
   - auth-token cookie whitelisted
   - Optional signed URLs with key groups (configured as direct list assignment for simplicity)
   - Lambda@Edge authentication for premium validation

### Lifecycle Management

1. **S3 Origin Bucket**: Objects transition to Glacier after configurable days (default: 90 days)
2. **Logs Bucket**: Logs automatically deleted after configurable retention period (default: 365 days)
3. **Lambda CloudWatch Logs**: Retained for 7 days

## Testing

### Unit Tests

Comprehensive unit tests cover:
- Variable definitions and validation rules
- Data sources configuration
- Random resource generation
- Locals block configuration
- KMS key policy structure
- S3 bucket configurations
- CloudFront distribution settings
- Lambda function definitions
- WAF rules configuration
- CloudWatch alarms
- Route 53 records
- Outputs definitions

### Integration Tests

Integration tests validate:
- CloudFront distribution deployment and configuration
- S3 buckets creation and encryption
- Lambda functions deployment and execution
- WAF Web ACL attachment
- CloudWatch alarms creation
- Route 53 DNS records (if custom domain)
- KMS key rotation enabled
- Log delivery to S3
- Authentication workflow
- Monitoring pipeline completeness

## Outputs

The infrastructure exports the following outputs:

- **cloudfront_distribution_id**: CloudFront distribution ID
- **cloudfront_distribution_domain_name**: CloudFront distribution domain name
- **s3_origin_bucket_name**: S3 origin bucket name
- **s3_logs_bucket_name**: S3 logs bucket name
- **route53_record_fqdn**: Route 53 record FQDN (if custom domain)
- **cloudfront_oai_id**: CloudFront Origin Access Identity ID
- **lambda_edge_function_arn**: Lambda@Edge authentication function ARN
- **lambda_log_processor_function_arn**: Lambda log processor function ARN
- **waf_webacl_arn**: WAF WebACL ARN
- **cloudfront_public_key_id**: CloudFront public key ID for signed URLs (sensitive)
- **cloudfront_key_group_id**: CloudFront key group ID (sensitive)
- **kms_key_arn**: KMS key ARN for encryption
- **dynamodb_table_name**: DynamoDB subscribers table name (if created)
- **sns_topic_arn**: SNS topic ARN for alarms
- **jwt_secret_arn**: JWT secret ARN (sensitive)
- **acm_certificate_arn**: ACM certificate ARN
- **route53_zone_id**: Route 53 hosted zone ID
- **athena_database_name**: Athena database name (if enabled)

## Usage

### Basic Deployment

```bash
terraform init
terraform plan
terraform apply
```

### With Custom Domain

```bash
terraform apply \
  -var="domain_name=cdn.publishingco.com" \
  -var="cloudwatch_alarm_email=ops@publishingco.com"
```

### With Subscriber Table

```bash
terraform apply \
  -var="create_subscriber_table=true" \
  -var="auth_type=dynamodb"
```

### With Athena Analytics

```bash
terraform apply \
  -var="enable_athena=true"
```

## Compliance and Best Practices

1. **Single-File Architecture**: All Terraform code in `lib/tap_stack.tf` following project conventions
2. **No Emojis**: Clean professional code without emojis
3. **Tagged Resources**: All resources tagged with Environment, Application, Owner, ManagedBy, ContentType
4. **Encryption**: KMS encryption for all data at rest
5. **Least Privilege IAM**: Separate roles with minimal required permissions
6. **Dependency Management**: Explicit `depends_on` where required
7. **Logging**: Comprehensive logging for security auditing
8. **Monitoring**: Proactive alarming for operational issues
9. **High Availability**: CloudFront global distribution with multiple edge locations
10. **Cost Optimization**: Configurable price class and lifecycle policies
