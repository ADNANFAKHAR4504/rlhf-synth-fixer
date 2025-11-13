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
    Name       = "${var.app_name}-primary-bucket"
    Region     = var.primary_region
    Compliance = "GDPR"
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
    bucket_key_enabled = true
  }
}

# Block public access for primary bucket
resource "aws_s3_bucket_public_access_block" "primary_bucket" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule for primary bucket
resource "aws_s3_bucket_lifecycle_configuration" "primary_lifecycle" {
  provider = aws.primary
  bucket   = aws_s3_bucket.primary_bucket.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365 # GDPR data retention
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
  }
}

# Secondary region S3 bucket for replication
resource "aws_s3_bucket" "secondary_bucket" {
  provider = aws.secondary
  bucket   = "${var.app_name}-${var.environment}-secondary-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.common_tags, {
    Name       = "${var.app_name}-secondary-bucket"
    Region     = var.secondary_region
    Compliance = "GDPR"
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

# Server-side encryption for secondary bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "secondary_encryption" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.secondary_key.arn
    }
    bucket_key_enabled = true
  }
}

# Block public access for secondary bucket
resource "aws_s3_bucket_public_access_block" "secondary_bucket" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule for secondary bucket
resource "aws_s3_bucket_lifecycle_configuration" "secondary_lifecycle" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.secondary_bucket.id

  rule {
    id     = "transition-to-ia"
    status = "Enabled"

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    expiration {
      days = 365 # GDPR data retention
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }
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
        Effect   = "Allow"
        Resource = [aws_s3_bucket.primary_bucket.arn]
      },
      {
        Action = [
          "s3:GetObjectVersionForReplication",
          "s3:GetObjectVersionAcl",
          "s3:GetObjectVersionTagging"
        ]
        Effect   = "Allow"
        Resource = ["${aws_s3_bucket.primary_bucket.arn}/*"]
      },
      {
        Action = [
          "s3:ReplicateObject",
          "s3:ReplicateDelete",
          "s3:ReplicateTags"
        ]
        Effect   = "Allow"
        Resource = ["${aws_s3_bucket.secondary_bucket.arn}/*"]
      },
      {
        Action = [
          "kms:Decrypt"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.primary_key.arn
        ]
        Condition = {
          StringLike = {
            "kms:ViaService" = "s3.${var.primary_region}.amazonaws.com"
          }
        }
      },
      {
        Action = [
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Effect = "Allow"
        Resource = [
          aws_kms_key.secondary_key.arn
        ]
        Condition = {
          StringLike = {
            "kms:ViaService" = "s3.${var.secondary_region}.amazonaws.com"
          }
        }
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

    filter {
      prefix = ""
    }

    delete_marker_replication {
      status = "Enabled"
    }

    source_selection_criteria {
      sse_kms_encrypted_objects {
        status = "Enabled"
      }
    }

    destination {
      bucket        = aws_s3_bucket.secondary_bucket.arn
      storage_class = "STANDARD_IA" # Cost optimization for replicated data

      encryption_configuration {
        replica_kms_key_id = aws_kms_key.secondary_key.arn
      }

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

  depends_on = [
    aws_s3_bucket_versioning.primary_versioning,
    aws_s3_bucket_versioning.secondary_versioning,
    aws_iam_role_policy_attachment.replication,
    aws_kms_key.secondary_key
  ]
}

# ==================== KMS KEYS FOR ENCRYPTION ====================
# Primary region KMS key for GDPR compliance
resource "aws_kms_key" "primary_key" {
  provider                = aws.primary
  description             = "KMS key for ${var.app_name} encryption in primary region"
  deletion_window_in_days = 30  # Increased from 10 to 30 days for safety
  enable_key_rotation     = true

  # Prevent accidental deletion of KMS key
  lifecycle {
    prevent_destroy = false  # Set to false for testing, true for production
  }

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.primary_region}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })

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
  deletion_window_in_days = 30  # Increased from 10 to 30 days for safety
  enable_key_rotation     = true

  # Prevent accidental deletion of KMS key
  lifecycle {
    prevent_destroy = false  # Set to false for testing, true for production
  }

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"
        }
        Action   = "kms:*"
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${var.secondary_region}.amazonaws.com"
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
            "kms:EncryptionContext:aws:logs:arn" = "arn:aws:logs:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:*"
          }
        }
      }
    ]
  })

  tags = merge(var.common_tags, {
    Name       = "${var.app_name}-secondary-kms"
    Compliance = "GDPR"
  })
}

resource "aws_kms_alias" "secondary_key_alias" {
  provider      = aws.secondary
  name          = "alias/${var.app_name}-secondary"
  target_key_id = aws_kms_key.secondary_key.key_id
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
    kms_key_arn            = aws_kms_key.secondary_key.arn
    point_in_time_recovery = true
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
# IAM role for Lambda execution - Primary Region
resource "aws_iam_role" "lambda_role_primary" {
  provider = aws.primary
  name     = "${var.app_name}-lambda-role-${var.primary_region}"

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
    Name   = "${var.app_name}-lambda-role-primary"
    Region = var.primary_region
  })
}

# IAM role for Lambda execution - Secondary Region
resource "aws_iam_role" "lambda_role_secondary" {
  provider = aws.secondary
  name     = "${var.app_name}-lambda-role-${var.secondary_region}"

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
    Name   = "${var.app_name}-lambda-role-secondary"
    Region = var.secondary_region
  })
}

# Lambda execution policy - Primary Region
resource "aws_iam_policy" "lambda_policy_primary" {
  provider = aws.primary
  name     = "${var.app_name}-lambda-policy-${var.primary_region}"

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
        Resource = "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:*"
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
          "arn:aws:dynamodb:${var.primary_region}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}-*",
          "arn:aws:dynamodb:${var.primary_region}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}-*/index/*"
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
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.primary_key.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = [
          "arn:aws:xray:${var.primary_region}:${data.aws_caller_identity.current.account_id}:group/*",
          "arn:aws:xray:${var.primary_region}:${data.aws_caller_identity.current.account_id}:sampling-rule/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = "arn:aws:events:${var.primary_region}:${data.aws_caller_identity.current.account_id}:event-bus/*"
      }
    ]
  })
}

# Lambda execution policy - Secondary Region
resource "aws_iam_policy" "lambda_policy_secondary" {
  provider = aws.secondary
  name     = "${var.app_name}-lambda-policy-${var.secondary_region}"

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
        Resource = "arn:aws:logs:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:*"
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
          "arn:aws:dynamodb:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}-*",
          "arn:aws:dynamodb:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:table/${var.app_name}-${var.environment}-*/index/*"
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
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = [
          aws_kms_key.secondary_key.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "xray:PutTraceSegments",
          "xray:PutTelemetryRecords"
        ]
        Resource = [
          "arn:aws:xray:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:group/*",
          "arn:aws:xray:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:sampling-rule/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "events:PutEvents"
        ]
        Resource = "arn:aws:events:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:event-bus/*"
      }
    ]
  })
}

# Attach policy to Lambda role - Primary
resource "aws_iam_role_policy_attachment" "lambda_policy_primary" {
  provider   = aws.primary
  role       = aws_iam_role.lambda_role_primary.name
  policy_arn = aws_iam_policy.lambda_policy_primary.arn
}

# Attach policy to Lambda role - Secondary
resource "aws_iam_role_policy_attachment" "lambda_policy_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.lambda_role_secondary.name
  policy_arn = aws_iam_policy.lambda_policy_secondary.arn
}

# Attach AWS managed policy for Lambda VPC access - Primary
resource "aws_iam_role_policy_attachment" "lambda_vpc_policy_primary" {
  provider   = aws.primary
  role       = aws_iam_role.lambda_role_primary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

# Attach AWS managed policy for Lambda VPC access - Secondary
resource "aws_iam_role_policy_attachment" "lambda_vpc_policy_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.lambda_role_secondary.name
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
  role             = aws_iam_role.lambda_role_primary.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  runtime          = "python3.11"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size
  architectures    = ["arm64"] # Graviton2 processor for cost optimization

  environment {
    variables = {
      ENVIRONMENT    = var.environment
      TABLE_NAME     = aws_dynamodb_table.global_table.name
      REGION         = var.primary_region
      BUCKET_NAME    = aws_s3_bucket.primary_bucket.id
      KMS_KEY_ID     = aws_kms_key.primary_key.id
      EVENT_BUS_NAME = aws_cloudwatch_event_bus.primary_bus.name
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

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_primary,
    aws_dynamodb_table.global_table
  ]
}

# Secondary region Lambda functions with Graviton2
resource "aws_lambda_function" "api_handler_secondary" {
  provider         = aws.secondary
  filename         = data.archive_file.lambda_package.output_path
  function_name    = "${var.app_name}-${var.environment}-api-handler-secondary"
  role             = aws_iam_role.lambda_role_secondary.arn
  handler          = "lambda_function.lambda_handler"
  source_code_hash = data.archive_file.lambda_package.output_base64sha256
  runtime          = "python3.11"
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size
  architectures    = ["arm64"] # Graviton2 processor

  environment {
    variables = {
      ENVIRONMENT    = var.environment
      TABLE_NAME     = aws_dynamodb_table.global_table.name
      REGION         = var.secondary_region
      BUCKET_NAME    = aws_s3_bucket.secondary_bucket.id
      KMS_KEY_ID     = aws_kms_key.secondary_key.id
      EVENT_BUS_NAME = aws_cloudwatch_event_bus.secondary_bus.name
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

  depends_on = [
    aws_iam_role_policy_attachment.lambda_policy_secondary,
    aws_dynamodb_table.global_table
  ]
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

# CloudWatch Log Group for API Gateway in primary region
resource "aws_cloudwatch_log_group" "api_gateway_logs_primary" {
  provider          = aws.primary
  name              = "/aws/apigateway/${var.app_name}-${var.environment}-primary"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.primary_key.arn

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-api-gateway-logs-primary"
  })
}

# API Gateway account settings for logging
resource "aws_api_gateway_account" "primary" {
  provider            = aws.primary
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_primary.arn
}

# IAM role for API Gateway CloudWatch logging
resource "aws_iam_role" "api_gateway_cloudwatch_primary" {
  provider = aws.primary
  name     = "${var.app_name}-api-gateway-cw-primary"

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

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-api-gateway-cw-role-primary"
  })
}

# Attach managed policy for API Gateway logging
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch_primary" {
  provider   = aws.primary
  role       = aws_iam_role.api_gateway_cloudwatch_primary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# API Gateway resources and methods for primary region
resource "aws_api_gateway_resource" "primary_health" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.primary_api.id
  parent_id   = aws_api_gateway_rest_api.primary_api.root_resource_id
  path_part   = "health"
}

# Health check endpoint method
resource "aws_api_gateway_method" "primary_health" {
  provider      = aws.primary
  rest_api_id   = aws_api_gateway_rest_api.primary_api.id
  resource_id   = aws_api_gateway_resource.primary_health.id
  http_method   = "GET"
  authorization = "NONE" # Health check is public
}

# Health check integration
resource "aws_api_gateway_integration" "primary_health_integration" {
  provider                = aws.primary
  rest_api_id             = aws_api_gateway_rest_api.primary_api.id
  resource_id             = aws_api_gateway_resource.primary_health.id
  http_method             = aws_api_gateway_method.primary_health.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler_primary.invoke_arn
}

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

  depends_on = [
    aws_api_gateway_integration.primary_get_integration,
    aws_api_gateway_integration.primary_post_integration,
    aws_api_gateway_integration.primary_health_integration
  ]

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.primary_health.id,
      aws_api_gateway_resource.primary_users.id,
      aws_api_gateway_method.primary_health.id,
      aws_api_gateway_method.primary_get_user.id,
      aws_api_gateway_method.primary_post_user.id,
      aws_api_gateway_integration.primary_health_integration.id,
      aws_api_gateway_integration.primary_get_integration.id,
      aws_api_gateway_integration.primary_post_integration.id,
    ]))
  }
}

# API Gateway stage settings for primary region
resource "aws_api_gateway_stage" "primary_stage" {
  provider      = aws.primary
  deployment_id = aws_api_gateway_deployment.primary_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.primary_api.id
  stage_name    = var.environment

  # Enable X-Ray tracing
  xray_tracing_enabled = true

  # Access logging settings
  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs_primary.arn
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
    })
  }

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-api-stage-primary"
  })

  depends_on = [aws_api_gateway_account.primary]
}

# API Gateway method settings for throttling
resource "aws_api_gateway_method_settings" "primary_settings" {
  provider    = aws.primary
  rest_api_id = aws_api_gateway_rest_api.primary_api.id
  stage_name  = aws_api_gateway_stage.primary_stage.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
    caching_enabled        = var.api_cache_enabled
    cache_ttl_in_seconds   = var.api_cache_ttl
    cache_data_encrypted   = true
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

# CloudWatch Log Group for API Gateway in secondary region
resource "aws_cloudwatch_log_group" "api_gateway_logs_secondary" {
  provider          = aws.secondary
  name              = "/aws/apigateway/${var.app_name}-${var.environment}-secondary"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.secondary_key.arn

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-api-gateway-logs-secondary"
  })
}

# API Gateway account settings for logging in secondary region
resource "aws_api_gateway_account" "secondary" {
  provider            = aws.secondary
  cloudwatch_role_arn = aws_iam_role.api_gateway_cloudwatch_secondary.arn
}

# IAM role for API Gateway CloudWatch logging in secondary region
resource "aws_iam_role" "api_gateway_cloudwatch_secondary" {
  provider = aws.secondary
  name     = "${var.app_name}-api-gateway-cw-secondary"

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

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-api-gateway-cw-role-secondary"
  })
}

# Attach managed policy for API Gateway logging in secondary region
resource "aws_iam_role_policy_attachment" "api_gateway_cloudwatch_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.api_gateway_cloudwatch_secondary.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonAPIGatewayPushToCloudWatchLogs"
}

# Health check endpoint for secondary region
resource "aws_api_gateway_resource" "secondary_health" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.secondary_api.id
  parent_id   = aws_api_gateway_rest_api.secondary_api.root_resource_id
  path_part   = "health"
}

resource "aws_api_gateway_method" "secondary_health" {
  provider      = aws.secondary
  rest_api_id   = aws_api_gateway_rest_api.secondary_api.id
  resource_id   = aws_api_gateway_resource.secondary_health.id
  http_method   = "GET"
  authorization = "NONE"
}

resource "aws_api_gateway_integration" "secondary_health_integration" {
  provider                = aws.secondary
  rest_api_id             = aws_api_gateway_rest_api.secondary_api.id
  resource_id             = aws_api_gateway_resource.secondary_health.id
  http_method             = aws_api_gateway_method.secondary_health.http_method
  integration_http_method = "POST"
  type                    = "AWS_PROXY"
  uri                     = aws_lambda_function.api_handler_secondary.invoke_arn
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

  depends_on = [
    aws_api_gateway_integration.secondary_get_integration,
    aws_api_gateway_integration.secondary_post_integration,
    aws_api_gateway_integration.secondary_health_integration
  ]

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    redeployment = sha1(jsonencode([
      aws_api_gateway_resource.secondary_health.id,
      aws_api_gateway_resource.secondary_users.id,
      aws_api_gateway_method.secondary_health.id,
      aws_api_gateway_method.secondary_get_user.id,
      aws_api_gateway_method.secondary_post_user.id,
      aws_api_gateway_integration.secondary_health_integration.id,
      aws_api_gateway_integration.secondary_get_integration.id,
      aws_api_gateway_integration.secondary_post_integration.id,
    ]))
  }
}

# API Gateway stage settings for secondary region
resource "aws_api_gateway_stage" "secondary_stage" {
  provider      = aws.secondary
  deployment_id = aws_api_gateway_deployment.secondary_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.secondary_api.id
  stage_name    = var.environment

  xray_tracing_enabled = true

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.api_gateway_logs_secondary.arn
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
    })
  }

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-api-stage-secondary"
  })

  depends_on = [aws_api_gateway_account.secondary]
}

# API Gateway method settings for secondary region
resource "aws_api_gateway_method_settings" "secondary_settings" {
  provider    = aws.secondary
  rest_api_id = aws_api_gateway_rest_api.secondary_api.id
  stage_name  = aws_api_gateway_stage.secondary_stage.stage_name
  method_path = "*/*"

  settings {
    metrics_enabled        = true
    logging_level          = "INFO"
    data_trace_enabled     = true
    throttling_burst_limit = var.api_throttle_burst_limit
    throttling_rate_limit  = var.api_throttle_rate_limit
    caching_enabled        = var.api_cache_enabled
    cache_ttl_in_seconds   = var.api_cache_ttl
    cache_data_encrypted   = true
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
  resource_arn = aws_api_gateway_stage.primary_stage.arn
  web_acl_arn  = aws_wafv2_web_acl.primary_waf.arn

  depends_on = [
    aws_api_gateway_stage.primary_stage,
    aws_wafv2_web_acl.primary_waf
  ]
}

# Associate WAF with API Gateway in secondary region
resource "aws_wafv2_web_acl_association" "secondary_api_waf" {
  provider     = aws.secondary
  resource_arn = aws_api_gateway_stage.secondary_stage.arn
  web_acl_arn  = aws_wafv2_web_acl.secondary_waf.arn

  depends_on = [
    aws_api_gateway_stage.secondary_stage,
    aws_wafv2_web_acl.secondary_waf
  ]
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

# Enable versioning for synthetics primary bucket
resource "aws_s3_bucket_versioning" "synthetics_primary_versioning" {
  provider = aws.primary
  bucket   = aws_s3_bucket.synthetics_primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption for synthetics primary bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "synthetics_primary_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.synthetics_primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary_key.arn
    }
    bucket_key_enabled = true
  }
}

# Block public access for synthetics primary bucket
resource "aws_s3_bucket_public_access_block" "synthetics_primary" {
  provider = aws.primary
  bucket   = aws_s3_bucket.synthetics_primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 bucket for Synthetics artifacts in secondary region
resource "aws_s3_bucket" "synthetics_secondary" {
  provider = aws.secondary
  bucket   = "${var.app_name}-${var.environment}-synthetics-secondary-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-synthetics-secondary"
  })
}

# Enable versioning for synthetics secondary bucket
resource "aws_s3_bucket_versioning" "synthetics_secondary_versioning" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.synthetics_secondary.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption for synthetics secondary bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "synthetics_secondary_encryption" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.synthetics_secondary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.secondary_key.arn
    }
    bucket_key_enabled = true
  }
}

# Block public access for synthetics secondary bucket
resource "aws_s3_bucket_public_access_block" "synthetics_secondary" {
  provider = aws.secondary
  bucket   = aws_s3_bucket.synthetics_secondary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM role for CloudWatch Synthetics - Primary Region
resource "aws_iam_role" "synthetics_role_primary" {
  provider = aws.primary
  name     = "${var.app_name}-synthetics-role-${var.primary_region}"

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

# IAM role for CloudWatch Synthetics - Secondary Region
resource "aws_iam_role" "synthetics_role_secondary" {
  provider = aws.secondary
  name     = "${var.app_name}-synthetics-role-${var.secondary_region}"

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

# Synthetics policy - Primary Region
resource "aws_iam_policy" "synthetics_policy_primary" {
  provider = aws.primary
  name     = "${var.app_name}-synthetics-policy-${var.primary_region}"

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
        Resource = "arn:aws:logs:${var.primary_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = ["CloudWatchSynthetics", "AWS/ApiGateway", "AWS/Lambda"]
          }
        }
        Resource = "*"
      }
    ]
  })
}

# Synthetics policy - Secondary Region
resource "aws_iam_policy" "synthetics_policy_secondary" {
  provider = aws.secondary
  name     = "${var.app_name}-synthetics-policy-${var.secondary_region}"

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
        Resource = "arn:aws:logs:${var.secondary_region}:${data.aws_caller_identity.current.account_id}:*"
      },
      {
        Effect = "Allow"
        Action = [
          "cloudwatch:PutMetricData"
        ]
        Condition = {
          StringEquals = {
            "cloudwatch:namespace" = ["CloudWatchSynthetics", "AWS/ApiGateway", "AWS/Lambda"]
          }
        }
        Resource = "*"
      }
    ]
  })
}

# Attach Synthetics policy to role - Primary
resource "aws_iam_role_policy_attachment" "synthetics_policy_primary" {
  provider   = aws.primary
  role       = aws_iam_role.synthetics_role_primary.name
  policy_arn = aws_iam_policy.synthetics_policy_primary.arn
}

# Attach Synthetics policy to role - Secondary
resource "aws_iam_role_policy_attachment" "synthetics_policy_secondary" {
  provider   = aws.secondary
  role       = aws_iam_role.synthetics_role_secondary.name
  policy_arn = aws_iam_policy.synthetics_policy_secondary.arn
}

# Create canary script for primary region monitoring
data "archive_file" "canary_script_primary" {
  type        = "zip"
  output_path = "/tmp/canary_primary.zip"

  source {
    content  = <<-EOT
      const synthetics = require('Synthetics');
      const log = require('SyntheticsLogger');
      const https = require('https');

      const apiCanaryBlueprint = async function () {
        const apiUrl = process.env.API_ENDPOINT || 'https://${aws_api_gateway_rest_api.primary_api.id}.execute-api.${var.primary_region}.amazonaws.com/${var.environment}/health';
        
        const requestOptions = {
          hostname: apiUrl.split('//')[1].split('/')[0],
          path: '/${var.environment}/health',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        return new Promise((resolve, reject) => {
          log.info('Making request to: ' + apiUrl);
          
          const req = https.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
              data += chunk;
            });
            
            res.on('end', () => {
              log.info('Response status code: ' + res.statusCode);
              log.info('Response: ' + data);
              
              if (res.statusCode === 200) {
                resolve('Success');
              } else {
                reject('API health check failed with status: ' + res.statusCode);
              }
            });
          });
          
          req.on('error', (error) => {
            log.error('Error: ' + error);
            reject(error);
          });
          
          req.end();
        });
      };

      exports.handler = async () => {
        return await apiCanaryBlueprint();
      };
    EOT
    filename = "nodejs/node_modules/apiCanary.js"
  }
}

# CloudWatch Synthetics Canary for primary region
resource "aws_synthetics_canary" "primary_canary" {
  provider             = aws.primary
  name                 = "${replace(var.app_name, "_", "-")}-api-primary"
  artifact_s3_location = "s3://${aws_s3_bucket.synthetics_primary.bucket}/canary-artifacts"
  execution_role_arn   = aws_iam_role.synthetics_role_primary.arn
  handler              = "apiCanary.handler"
  zip_file             = data.archive_file.canary_script_primary.output_path
  runtime_version      = "syn-nodejs-puppeteer-7.0"
  start_canary         = true

  schedule {
    expression = var.synthetic_canary_schedule
  }

  run_config {
    timeout_in_seconds = 60
    memory_in_mb       = 960
    active_tracing     = true
    environment_variables = {
      API_ENDPOINT = "https://${aws_api_gateway_rest_api.primary_api.id}.execute-api.${var.primary_region}.amazonaws.com/${var.environment}/health"
    }
  }

  success_retention_period = 31
  failure_retention_period = 31

  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-canary-primary"
    Region = var.primary_region
  })

  depends_on = [
    aws_iam_role_policy_attachment.synthetics_policy_primary,
    aws_api_gateway_deployment.primary_deployment
  ]
}

# Create canary script for secondary region monitoring
data "archive_file" "canary_script_secondary" {
  type        = "zip"
  output_path = "/tmp/canary_secondary.zip"

  source {
    content  = <<-EOT
      const synthetics = require('Synthetics');
      const log = require('SyntheticsLogger');
      const https = require('https');

      const apiCanaryBlueprint = async function () {
        const apiUrl = process.env.API_ENDPOINT || 'https://${aws_api_gateway_rest_api.secondary_api.id}.execute-api.${var.secondary_region}.amazonaws.com/${var.environment}/health';
        
        const requestOptions = {
          hostname: apiUrl.split('//')[1].split('/')[0],
          path: '/${var.environment}/health',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        };

        return new Promise((resolve, reject) => {
          log.info('Making request to: ' + apiUrl);
          
          const req = https.request(requestOptions, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
              data += chunk;
            });
            
            res.on('end', () => {
              log.info('Response status code: ' + res.statusCode);
              log.info('Response: ' + data);
              
              if (res.statusCode === 200) {
                resolve('Success');
              } else {
                reject('API health check failed with status: ' + res.statusCode);
              }
            });
          });
          
          req.on('error', (error) => {
            log.error('Error: ' + error);
            reject(error);
          });
          
          req.end();
        });
      };

      exports.handler = async () => {
        return await apiCanaryBlueprint();
      };
    EOT
    filename = "nodejs/node_modules/apiCanary.js"
  }
}

# CloudWatch Synthetics Canary for secondary region
resource "aws_synthetics_canary" "secondary_canary" {
  provider             = aws.secondary
  name                 = "${replace(var.app_name, "_", "-")}-api-secondary"
  artifact_s3_location = "s3://${aws_s3_bucket.synthetics_secondary.bucket}/canary-artifacts"
  execution_role_arn   = aws_iam_role.synthetics_role_secondary.arn
  handler              = "apiCanary.handler"
  zip_file             = data.archive_file.canary_script_secondary.output_path
  runtime_version      = "syn-nodejs-puppeteer-7.0"
  start_canary         = true

  schedule {
    expression = var.synthetic_canary_schedule
  }

  run_config {
    timeout_in_seconds = 60
    memory_in_mb       = 960
    active_tracing     = true
    environment_variables = {
      API_ENDPOINT = "https://${aws_api_gateway_rest_api.secondary_api.id}.execute-api.${var.secondary_region}.amazonaws.com/${var.environment}/health"
    }
  }

  success_retention_period = 31
  failure_retention_period = 31

  tags = merge(var.common_tags, {
    Name   = "${var.app_name}-canary-secondary"
    Region = var.secondary_region
  })

  depends_on = [
    aws_iam_role_policy_attachment.synthetics_policy_secondary,
    aws_api_gateway_deployment.secondary_deployment
  ]
}

# ==================== X-RAY CONFIGURATION ====================
# X-Ray sampling rule for distributed tracing
resource "aws_xray_sampling_rule" "main" {
  provider       = aws.primary
  rule_name      = "${var.app_name}-sampling-rule"
  priority       = 1000
  version        = 1
  reservoir_size = 1
  fixed_rate     = 0.1 # Sample 10% of requests
  url_path       = "*"
  host           = "*"
  http_method    = "*"
  service_type   = "*"
  service_name   = "*"
  resource_arn   = "*"

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
    Name    = "${var.app_name}-quicksight-data"
    Purpose = "Analytics"
  })
}

# Enable versioning for QuickSight bucket
resource "aws_s3_bucket_versioning" "quicksight_versioning" {
  provider = aws.primary
  bucket   = aws_s3_bucket.quicksight_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption for QuickSight bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "quicksight_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.quicksight_data.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary_key.arn
    }
    bucket_key_enabled = true
  }
}

# Block public access for QuickSight bucket
resource "aws_s3_bucket_public_access_block" "quicksight_data" {
  provider = aws.primary
  bucket   = aws_s3_bucket.quicksight_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule for QuickSight bucket
resource "aws_s3_bucket_lifecycle_configuration" "quicksight_lifecycle" {
  provider = aws.primary
  bucket   = aws_s3_bucket.quicksight_data.id

  rule {
    id     = "analytics-data-retention"
    status = "Enabled"

    transition {
      days          = 90
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 180
      storage_class = "GLACIER"
    }

    expiration {
      days = 730 # 2 years retention for analytics
    }
  }
}

# S3 bucket for Athena query results
resource "aws_s3_bucket" "athena_results" {
  provider = aws.primary
  bucket   = "${var.app_name}-${var.environment}-athena-results-${data.aws_caller_identity.current.account_id}"

  tags = merge(var.common_tags, {
    Name    = "${var.app_name}-athena-results"
    Purpose = "Analytics"
  })
}

# Enable versioning for Athena results bucket
resource "aws_s3_bucket_versioning" "athena_results_versioning" {
  provider = aws.primary
  bucket   = aws_s3_bucket.athena_results.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Encryption for Athena results bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results_encryption" {
  provider = aws.primary
  bucket   = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary_key.arn
    }
    bucket_key_enabled = true
  }
}

# Block public access for Athena results bucket
resource "aws_s3_bucket_public_access_block" "athena_results" {
  provider = aws.primary
  bucket   = aws_s3_bucket.athena_results.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle rule for Athena results bucket
resource "aws_s3_bucket_lifecycle_configuration" "athena_results_lifecycle" {
  provider = aws.primary
  bucket   = aws_s3_bucket.athena_results.id

  rule {
    id     = "athena-query-cleanup"
    status = "Enabled"

    expiration {
      days = 30 # Clean up query results after 30 days
    }
  }
}

# Athena workgroup for query execution
resource "aws_athena_workgroup" "analytics_workgroup" {
  provider = aws.primary
  name     = "${var.app_name}-${var.environment}-analytics"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.bucket}/results/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.primary_key.arn
      }
    }
  }

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-athena-workgroup"
  })
}

# Athena database for querying S3 data
resource "aws_athena_database" "analytics_db" {
  provider = aws.primary
  name     = "${replace(var.app_name, "-", "_")}_${var.environment}_analytics"
  bucket   = aws_s3_bucket.athena_results.bucket

  encryption_configuration {
    encryption_option = "SSE_KMS"
    kms_key           = aws_kms_key.primary_key.arn
  }

  depends_on = [
    aws_s3_bucket.athena_results,
    aws_s3_bucket_server_side_encryption_configuration.athena_results_encryption
  ]
}

# ==================== CLOUDWATCH LOGS ====================
# Log groups for Lambda functions
resource "aws_cloudwatch_log_group" "lambda_logs_primary" {
  provider          = aws.primary
  name              = "/aws/lambda/${aws_lambda_function.api_handler_primary.function_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.primary_key.arn

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-logs-primary"
  })
}

resource "aws_cloudwatch_log_group" "lambda_logs_secondary" {
  provider          = aws.secondary
  name              = "/aws/lambda/${aws_lambda_function.api_handler_secondary.function_name}"
  retention_in_days = var.log_retention_days
  kms_key_id        = aws_kms_key.secondary_key.arn

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
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Lambda function error rate is too high"

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
  metric_name         = "SystemErrors"
  namespace           = "AWS/DynamoDB"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  alarm_description   = "DynamoDB is experiencing throttling"

  dimensions = {
    TableName = aws_dynamodb_table.global_table.name
  }

  alarm_actions = [aws_sns_topic.alerts_primary.arn]

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-dynamodb-throttles-alarm"
  })
}

# Alarm for API Gateway 5xx errors in primary region
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_primary" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-api-5xx-errors-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API Gateway 5xx error rate is too high in primary region"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.primary_api.name
    Stage   = var.environment
  }

  alarm_actions = [aws_sns_topic.alerts_primary.arn]

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-api-5xx-alarm-primary"
  })
}

# Alarm for API Gateway latency in primary region
resource "aws_cloudwatch_metric_alarm" "api_gateway_latency_primary" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-api-latency-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "Latency"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Average"
  threshold           = 1000 # 1 second
  alarm_description   = "API Gateway latency is too high in primary region"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.primary_api.name
    Stage   = var.environment
  }

  alarm_actions = [aws_sns_topic.alerts_primary.arn]

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-api-latency-alarm-primary"
  })
}

# Alarm for Lambda concurrent executions
resource "aws_cloudwatch_metric_alarm" "lambda_concurrency_primary" {
  provider            = aws.primary
  alarm_name          = "${var.app_name}-lambda-concurrency-primary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ConcurrentExecutions"
  namespace           = "AWS/Lambda"
  period              = 60
  statistic           = "Maximum"
  threshold           = var.lambda_reserved_concurrency * 0.8 # 80% of reserved
  alarm_description   = "Lambda concurrent executions approaching limit"
  treat_missing_data  = "notBreaching"

  dimensions = {
    FunctionName = aws_lambda_function.api_handler_primary.function_name
  }

  alarm_actions = [aws_sns_topic.alerts_primary.arn]

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-lambda-concurrency-alarm-primary"
  })
}

# Alarm for API Gateway 5xx errors in secondary region
resource "aws_cloudwatch_metric_alarm" "api_gateway_5xx_secondary" {
  provider            = aws.secondary
  alarm_name          = "${var.app_name}-api-5xx-errors-secondary"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5XXError"
  namespace           = "AWS/ApiGateway"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "API Gateway 5xx error rate is too high in secondary region"
  treat_missing_data  = "notBreaching"

  dimensions = {
    ApiName = aws_api_gateway_rest_api.secondary_api.name
    Stage   = var.environment
  }

  alarm_actions = [aws_sns_topic.alerts_secondary.arn]

  tags = merge(var.common_tags, {
    Name = "${var.app_name}-api-5xx-alarm-secondary"
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