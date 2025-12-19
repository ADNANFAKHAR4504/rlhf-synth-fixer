# ============================================================================
# Cross-Account S3 Data Sharing System - Complete Infrastructure
# ============================================================================

# ============================================================================
# VARIABLES SECTION
# ============================================================================

variable "aws_region" {
  description = "AWS region for primary infrastructure"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (development, staging, production)"
  type        = string
  default     = "production"

  validation {
    condition     = contains(["development", "staging", "production"], var.environment)
    error_message = "Environment must be development, staging, or production."
  }
}

variable "project_name" {
  description = "Project name for resource naming and tagging"
  type        = string
  default     = "cross-account-s3-sharing"
}

variable "environment_suffix" {
  description = "Optional environment suffix for resource naming (auto-generated if empty)"
  type        = string
  default     = ""
}

variable "primary_account_id" {
  description = "AWS account ID for the primary account (defaults to current account)"
  type        = string
  default     = ""
}

variable "consumer_accounts" {
  description = "Map of consumer account configurations with account ID, allowed prefixes, and access level"
  type = map(object({
    account_id       = string
    allowed_prefixes = list(string)
    access_level     = string # "read" or "write"
    external_id      = string
  }))
  default = {}

  validation {
    condition = alltrue([
      for account in values(var.consumer_accounts) :
      contains(["read", "write"], account.access_level)
    ])
    error_message = "Access level must be either 'read' or 'write'."
  }
}

variable "bucket_name_prefix" {
  description = "Prefix for S3 bucket naming"
  type        = string
  default     = "shared-data"
}

# Storage Lifecycle Configuration
variable "lifecycle_intelligent_tiering_days" {
  description = "Days after which to move objects to Intelligent-Tiering storage class"
  type        = number
  default     = 30

  validation {
    condition     = var.lifecycle_intelligent_tiering_days >= 0
    error_message = "Lifecycle intelligent tiering days must be >= 0."
  }
}

variable "lifecycle_glacier_days" {
  description = "Days after which to move objects to Glacier storage class"
  type        = number
  default     = 90

  validation {
    condition     = var.lifecycle_glacier_days >= 0
    error_message = "Lifecycle glacier days must be >= 0."
  }
}

# Cross-Region Replication
variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for disaster recovery"
  type        = bool
  default     = false
}

variable "replication_region" {
  description = "AWS region for cross-region replication"
  type        = string
  default     = "us-west-2"
}

# CloudTrail and Audit Configuration
variable "cloudtrail_retention_days" {
  description = "Number of days to retain CloudTrail logs (default 7 years)"
  type        = number
  default     = 2555 # 7 years

  validation {
    condition     = var.cloudtrail_retention_days >= 365
    error_message = "CloudTrail retention must be at least 365 days for compliance."
  }
}

variable "s3_access_log_retention_days" {
  description = "Number of days to retain S3 access logs"
  type        = number
  default     = 2555 # 7 years
}

variable "audit_log_ttl_days" {
  description = "Number of days to retain DynamoDB audit logs (TTL)"
  type        = number
  default     = 365

  validation {
    condition     = var.audit_log_ttl_days >= 90
    error_message = "Audit log TTL must be at least 90 days."
  }
}

# Monitoring and Alerting
variable "alarm_email_endpoints" {
  description = "List of email addresses for alarm notifications"
  type        = list(string)
  default     = []
}

variable "business_hours_start" {
  description = "Business hours start time (UTC hour, 0-23)"
  type        = number
  default     = 9

  validation {
    condition     = var.business_hours_start >= 0 && var.business_hours_start <= 23
    error_message = "Business hours start must be between 0 and 23."
  }
}

variable "business_hours_end" {
  description = "Business hours end time (UTC hour, 0-23)"
  type        = number
  default     = 18

  validation {
    condition     = var.business_hours_end >= 0 && var.business_hours_end <= 23
    error_message = "Business hours end must be between 0 and 23."
  }
}

variable "request_rate_threshold" {
  description = "Maximum requests per 5 minutes per account before triggering alarm"
  type        = number
  default     = 1000

  validation {
    condition     = var.request_rate_threshold > 0
    error_message = "Request rate threshold must be greater than 0."
  }
}

variable "failed_auth_threshold" {
  description = "Maximum failed authorization attempts per 5 minutes before triggering alarm"
  type        = number
  default     = 10

  validation {
    condition     = var.failed_auth_threshold > 0
    error_message = "Failed auth threshold must be greater than 0."
  }
}

variable "data_egress_threshold_gb" {
  description = "Maximum data egress in GB per hour before triggering alarm"
  type        = number
  default     = 100

  validation {
    condition     = var.data_egress_threshold_gb > 0
    error_message = "Data egress threshold must be greater than 0."
  }
}

# Optional Features
variable "enable_self_service" {
  description = "Enable self-service API with Step Functions approval workflow"
  type        = bool
  default     = false
}

variable "enable_storage_lens" {
  description = "Enable S3 Storage Lens for usage analytics (requires account-level enablement)"
  type        = bool
  default     = false
}

variable "governance_check_schedule" {
  description = "Cron expression for daily governance check (default: daily at 2 AM UTC)"
  type        = string
  default     = "cron(0 2 * * ? *)"
}

variable "expiration_enforcer_schedule" {
  description = "Rate expression for access expiration enforcement (default: hourly)"
  type        = string
  default     = "rate(1 hour)"
}

# Lambda Configuration
variable "lambda_runtime" {
  description = "Python runtime version for Lambda functions"
  type        = string
  default     = "python3.11"
}

variable "lambda_timeout" {
  description = "Lambda function timeout in seconds"
  type        = number
  default     = 300

  validation {
    condition     = var.lambda_timeout >= 3 && var.lambda_timeout <= 900
    error_message = "Lambda timeout must be between 3 and 900 seconds."
  }
}

variable "lambda_memory_size" {
  description = "Lambda function memory in MB"
  type        = number
  default     = 512

  validation {
    condition     = var.lambda_memory_size >= 128 && var.lambda_memory_size <= 10240
    error_message = "Lambda memory must be between 128 and 10240 MB."
  }
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

# ============================================================================
# RANDOM RESOURCES FOR UNIQUE NAMING
# ============================================================================

resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result
  account_id = var.primary_account_id != "" ? var.primary_account_id : data.aws_caller_identity.current.account_id

  primary_bucket_name = "${var.bucket_name_prefix}-${local.env_suffix}"
  audit_bucket_name   = "${var.bucket_name_prefix}-audit-${local.env_suffix}"

  common_tags = {
    Project     = var.project_name
    Environment = var.environment
    ManagedBy   = "Terraform"
    Purpose     = "Cross-Account S3 Data Sharing"
  }

  # Consumer account IDs for IAM policies
  consumer_account_ids = [for account in values(var.consumer_accounts) : account.account_id]
}

# ============================================================================
# KMS ENCRYPTION KEY
# ============================================================================

resource "aws_kms_key" "primary" {
  description             = "KMS key for S3 bucket encryption with cross-account access"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "Enable IAM User Permissions"
          Effect = "Allow"
          Principal = {
            AWS = "arn:${data.aws_partition.current.partition}:iam::${local.account_id}:root"
          }
          Action   = "kms:*"
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
              "kms:EncryptionContext:aws:logs:arn" = "arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${local.account_id}:log-group:*"
            }
          }
        },
        {
          Sid    = "Allow S3 Service"
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
          Sid    = "Allow CloudTrail"
          Effect = "Allow"
          Principal = {
            Service = "cloudtrail.amazonaws.com"
          }
          Action = [
            "kms:GenerateDataKey*",
            "kms:DescribeKey"
          ]
          Resource = "*"
        },
        {
          Sid    = "Allow DynamoDB Service"
          Effect = "Allow"
          Principal = {
            Service = "dynamodb.amazonaws.com"
          }
          Action = [
            "kms:Decrypt",
            "kms:DescribeKey"
          ]
          Resource = "*"
        }
      ],
      length(local.consumer_account_ids) > 0 ? [
        {
          Sid    = "Allow Consumer Accounts Decrypt"
          Effect = "Allow"
          Principal = {
            AWS = [for account_id in local.consumer_account_ids : "arn:${data.aws_partition.current.partition}:iam::${account_id}:root"]
          }
          Action = [
            "kms:Decrypt",
            "kms:DescribeKey",
            "kms:CreateGrant"
          ]
          Resource = "*"
          Condition = {
            StringEquals = {
              "kms:ViaService" = "s3.${var.aws_region}.amazonaws.com"
            }
          }
        }
      ] : []
    )
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-kms-key"
      Type = "KMS Key"
    }
  )
}

resource "aws_kms_alias" "primary" {
  name          = "alias/${var.project_name}-${local.env_suffix}"
  target_key_id = aws_kms_key.primary.key_id
}

# ============================================================================
# S3 PRIMARY BUCKET
# ============================================================================

resource "aws_s3_bucket" "primary" {
  bucket = local.primary_bucket_name

  tags = merge(
    local.common_tags,
    {
      Name = local.primary_bucket_name
      Type = "Primary Data Bucket"
    }
  )
}

resource "aws_s3_bucket_versioning" "primary" {
  bucket = aws_s3_bucket.primary.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "primary" {
  bucket = aws_s3_bucket.primary.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "primary" {
  bucket = aws_s3_bucket.primary.id

  rule {
    id     = "intelligent-tiering-transition"
    status = "Enabled"

    filter {}

    transition {
      days          = var.lifecycle_intelligent_tiering_days
      storage_class = "INTELLIGENT_TIERING"
    }
  }

  rule {
    id     = "glacier-transition"
    status = "Enabled"

    filter {}

    noncurrent_version_transition {
      noncurrent_days = var.lifecycle_glacier_days
      storage_class   = "GLACIER"
    }
  }
}

resource "aws_s3_bucket_logging" "primary" {
  bucket = aws_s3_bucket.primary.id

  target_bucket = aws_s3_bucket.audit.id
  target_prefix = "s3-access-logs/"
}

# ============================================================================
# S3 AUDIT BUCKET
# ============================================================================

resource "aws_s3_bucket" "audit" {
  bucket = local.audit_bucket_name

  tags = merge(
    local.common_tags,
    {
      Name = local.audit_bucket_name
      Type = "Audit Logs Bucket"
    }
  )
}

resource "aws_s3_bucket_versioning" "audit" {
  bucket = aws_s3_bucket.audit.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.primary.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "audit" {
  bucket = aws_s3_bucket.audit.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "audit" {
  bucket = aws_s3_bucket.audit.id

  rule {
    id     = "cloudtrail-logs-retention"
    status = "Enabled"

    filter {
      prefix = "cloudtrail-logs/"
    }

    expiration {
      days = var.cloudtrail_retention_days
    }
  }

  rule {
    id     = "s3-access-logs-retention"
    status = "Enabled"

    filter {
      prefix = "s3-access-logs/"
    }

    expiration {
      days = var.s3_access_log_retention_days
    }
  }
}

# Audit bucket policy for CloudTrail and S3 access logs
resource "aws_s3_bucket_policy" "audit" {
  bucket = aws_s3_bucket.audit.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.audit.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "S3ServerAccessLogsPolicy"
        Effect = "Allow"
        Principal = {
          Service = "logging.s3.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.audit.arn}/s3-access-logs/*"
      }
    ]
  })
}

# ============================================================================
# S3 BUCKET POLICY FOR CROSS-ACCOUNT ACCESS
# ============================================================================

resource "aws_s3_bucket_policy" "primary" {
  bucket = aws_s3_bucket.primary.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = concat(
      [
        {
          Sid    = "DenyUnencryptedObjectUploads"
          Effect = "Deny"
          Principal = {
            AWS = "*"
          }
          Action   = "s3:PutObject"
          Resource = "${aws_s3_bucket.primary.arn}/*"
          Condition = {
            StringNotEquals = {
              "s3:x-amz-server-side-encryption" = "aws:kms"
            }
          }
        },
        {
          Sid    = "DenyInsecureTransport"
          Effect = "Deny"
          Principal = {
            AWS = "*"
          }
          Action = "s3:*"
          Resource = [
            aws_s3_bucket.primary.arn,
            "${aws_s3_bucket.primary.arn}/*"
          ]
          Condition = {
            Bool = {
              "aws:SecureTransport" = "false"
            }
          }
        }
      ],
      length(var.consumer_accounts) > 0 ? [
        for account_key, account_config in var.consumer_accounts : {
          Sid    = "CrossAccountAccess-${account_key}"
          Effect = "Allow"
          Principal = {
            AWS = "arn:${data.aws_partition.current.partition}:iam::${account_config.account_id}:role/${var.project_name}-consumer-role-${account_key}"
          }
          Action = account_config.access_level == "write" ? [
            "s3:GetObject",
            "s3:GetObjectVersion",
            "s3:PutObject",
            "s3:DeleteObject"
            ] : [
            "s3:GetObject",
            "s3:GetObjectVersion"
          ]
          Resource = [
            for prefix in account_config.allowed_prefixes :
            "${aws_s3_bucket.primary.arn}/${prefix}/*"
          ]
          Condition = {
            StringEquals = {
              "sts:ExternalId" = account_config.external_id
            }
          }
        }
      ] : []
    )
  })
}

# ============================================================================
# DYNAMODB ACCESS CONTROL TABLE
# ============================================================================

resource "aws_dynamodb_table" "access_control" {
  name         = "${var.project_name}-access-control-${local.env_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "account_id"
  range_key    = "prefix"

  attribute {
    name = "account_id"
    type = "S"
  }

  attribute {
    name = "prefix"
    type = "S"
  }

  attribute {
    name = "expiration_date"
    type = "S"
  }

  global_secondary_index {
    name            = "expiration-index"
    hash_key        = "expiration_date"
    projection_type = "ALL"
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.primary.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-access-control"
      Type = "Access Control Registry"
    }
  )
}

# ============================================================================
# DYNAMODB AUDIT LOGS TABLE
# ============================================================================

resource "aws_dynamodb_table" "audit_logs" {
  name         = "${var.project_name}-audit-logs-${local.env_suffix}"
  billing_mode = "PAY_PER_REQUEST"
  hash_key     = "timestamp"
  range_key    = "request_id"

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "request_id"
    type = "S"
  }

  attribute {
    name = "account_id"
    type = "S"
  }

  global_secondary_index {
    name            = "account-index"
    hash_key        = "account_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.primary.arn
  }

  point_in_time_recovery {
    enabled = true
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-audit-logs"
      Type = "Audit Logs Table"
    }
  )
}

# ============================================================================
# CLOUDTRAIL
# ============================================================================

resource "aws_cloudtrail" "organization" {
  name                          = "${var.project_name}-trail-${local.env_suffix}"
  s3_bucket_name                = aws_s3_bucket.audit.id
  s3_key_prefix                 = "cloudtrail-logs"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.primary.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.primary.arn}/"]
    }
  }

  depends_on = [aws_s3_bucket_policy.audit]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-trail"
      Type = "CloudTrail"
    }
  )
}

# ============================================================================
# SNS TOPIC FOR ALERTS
# ============================================================================

resource "aws_sns_topic" "alerts" {
  name              = "${var.project_name}-alerts-${local.env_suffix}"
  display_name      = "Cross-Account S3 Security Alerts"
  kms_master_key_id = aws_kms_key.primary.id

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-alerts"
      Type = "SNS Topic"
    }
  )
}

resource "aws_sns_topic_subscription" "email_alerts" {
  count = length(var.alarm_email_endpoints)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoints[count.index]
}

# ============================================================================
# IAM ROLE FOR LAMBDA FUNCTIONS
# ============================================================================

resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-lambda-execution-${local.env_suffix}"

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

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-lambda-execution"
      Type = "Lambda Execution Role"
    }
  )
}

resource "aws_iam_role_policy" "lambda_execution" {
  name = "${var.project_name}-lambda-execution-policy"
  role = aws_iam_role.lambda_execution.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "CloudWatchLogs"
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${local.account_id}:log-group:/aws/lambda/${var.project_name}-*"
      },
      {
        Sid    = "DynamoDBAccess"
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:UpdateItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:DeleteItem"
        ]
        Resource = [
          aws_dynamodb_table.access_control.arn,
          "${aws_dynamodb_table.access_control.arn}/index/*",
          aws_dynamodb_table.audit_logs.arn,
          "${aws_dynamodb_table.audit_logs.arn}/index/*"
        ]
      },
      {
        Sid    = "S3BucketAccess"
        Effect = "Allow"
        Action = [
          "s3:GetBucketPolicy",
          "s3:GetBucketVersioning",
          "s3:GetBucketLogging",
          "s3:GetBucketObjectLockConfiguration",
          "s3:GetEncryptionConfiguration",
          "s3:GetBucketPublicAccessBlock",
          "s3:PutBucketPolicy"
        ]
        Resource = aws_s3_bucket.primary.arn
      },
      {
        Sid    = "CloudTrailAccess"
        Effect = "Allow"
        Action = [
          "cloudtrail:GetTrailStatus",
          "cloudtrail:DescribeTrails",
          "cloudtrail:LookupEvents"
        ]
        Resource = "*"
      },
      {
        Sid    = "IAMReadAccess"
        Effect = "Allow"
        Action = [
          "iam:GetRole",
          "iam:GetRolePolicy",
          "iam:ListAttachedRolePolicies"
        ]
        Resource = "*"
      },
      {
        Sid    = "KMSAccess"
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:DescribeKey",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.primary.arn
      },
      {
        Sid    = "SNSPublish"
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = aws_sns_topic.alerts.arn
      },
      {
        Sid    = "CloudWatchMetrics"
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
# CLOUDWATCH LOG GROUPS FOR LAMBDA FUNCTIONS
# ============================================================================

resource "aws_cloudwatch_log_group" "access_validator" {
  name              = "/aws/lambda/${var.project_name}-access-validator-${local.env_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.primary.arn

  depends_on = [aws_kms_key.primary]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-access-validator-logs"
      Type = "Lambda Log Group"
    }
  )
}

resource "aws_cloudwatch_log_group" "access_logger" {
  name              = "/aws/lambda/${var.project_name}-access-logger-${local.env_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.primary.arn

  depends_on = [aws_kms_key.primary]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-access-logger-logs"
      Type = "Lambda Log Group"
    }
  )
}

resource "aws_cloudwatch_log_group" "governance_check" {
  name              = "/aws/lambda/${var.project_name}-governance-check-${local.env_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.primary.arn

  depends_on = [aws_kms_key.primary]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-governance-check-logs"
      Type = "Lambda Log Group"
    }
  )
}

resource "aws_cloudwatch_log_group" "expiration_enforcer" {
  name              = "/aws/lambda/${var.project_name}-expiration-enforcer-${local.env_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.primary.arn

  depends_on = [aws_kms_key.primary]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-expiration-enforcer-logs"
      Type = "Lambda Log Group"
    }
  )
}

# ============================================================================
# LAMBDA FUNCTIONS (Placeholder - code in separate files)
# ============================================================================

# Note: Lambda function code will be created in lib/lambda-*/index.py files
# These resources will reference the code via data.archive_file resources

data "archive_file" "access_validator" {
  type        = "zip"
  source_file = "${path.module}/lambda-access-validator/index.py"
  output_path = "${path.module}/lambda-access-validator.zip"
}

resource "aws_lambda_function" "access_validator" {
  filename         = data.archive_file.access_validator.output_path
  function_name    = "${var.project_name}-access-validator-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.access_validator.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      ACCESS_CONTROL_TABLE = aws_dynamodb_table.access_control.name
      PRIMARY_BUCKET       = aws_s3_bucket.primary.id
      SNS_TOPIC_ARN        = aws_sns_topic.alerts.arn
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_execution,
    aws_cloudwatch_log_group.access_validator
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-access-validator"
      Type = "Lambda Function"
    }
  )
}

data "archive_file" "access_logger" {
  type        = "zip"
  source_file = "${path.module}/lambda-access-logger/index.py"
  output_path = "${path.module}/lambda-access-logger.zip"
}

resource "aws_lambda_function" "access_logger" {
  filename         = data.archive_file.access_logger.output_path
  function_name    = "${var.project_name}-access-logger-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.access_logger.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      AUDIT_LOGS_TABLE = aws_dynamodb_table.audit_logs.name
      TTL_DAYS         = tostring(var.audit_log_ttl_days)
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_execution,
    aws_cloudwatch_log_group.access_logger
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-access-logger"
      Type = "Lambda Function"
    }
  )
}

data "archive_file" "governance_check" {
  type        = "zip"
  source_file = "${path.module}/lambda-governance-check/index.py"
  output_path = "${path.module}/lambda-governance-check.zip"
}

resource "aws_lambda_function" "governance_check" {
  filename         = data.archive_file.governance_check.output_path
  function_name    = "${var.project_name}-governance-check-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.governance_check.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      ACCESS_CONTROL_TABLE = aws_dynamodb_table.access_control.name
      PRIMARY_BUCKET       = aws_s3_bucket.primary.id
      SNS_TOPIC_ARN        = aws_sns_topic.alerts.arn
      KMS_KEY_ID           = aws_kms_key.primary.id
      CLOUDTRAIL_NAME      = aws_cloudtrail.organization.name
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_execution,
    aws_cloudwatch_log_group.governance_check
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-governance-check"
      Type = "Lambda Function"
    }
  )
}

data "archive_file" "expiration_enforcer" {
  type        = "zip"
  source_file = "${path.module}/lambda-expiration-enforcer/index.py"
  output_path = "${path.module}/lambda-expiration-enforcer.zip"
}

resource "aws_lambda_function" "expiration_enforcer" {
  filename         = data.archive_file.expiration_enforcer.output_path
  function_name    = "${var.project_name}-expiration-enforcer-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.expiration_enforcer.output_base64sha256
  runtime          = var.lambda_runtime
  timeout          = var.lambda_timeout
  memory_size      = var.lambda_memory_size

  environment {
    variables = {
      ACCESS_CONTROL_TABLE = aws_dynamodb_table.access_control.name
      PRIMARY_BUCKET       = aws_s3_bucket.primary.id
      SNS_TOPIC_ARN        = aws_sns_topic.alerts.arn
    }
  }

  depends_on = [
    aws_iam_role_policy.lambda_execution,
    aws_cloudwatch_log_group.expiration_enforcer
  ]

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-expiration-enforcer"
      Type = "Lambda Function"
    }
  )
}

# ============================================================================
# EVENTBRIDGE RULES FOR LAMBDA TRIGGERS
# ============================================================================

# CloudTrail events trigger for access logger
resource "aws_cloudwatch_event_rule" "s3_access_events" {
  name        = "${var.project_name}-s3-access-events-${local.env_suffix}"
  description = "Capture S3 access events from CloudTrail for audit logging"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      eventName = [
        "GetObject",
        "PutObject",
        "DeleteObject",
        "GetObjectVersion"
      ]
      requestParameters = {
        bucketName = [aws_s3_bucket.primary.id]
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-s3-access-events"
      Type = "EventBridge Rule"
    }
  )
}

resource "aws_cloudwatch_event_target" "s3_access_to_logger" {
  rule      = aws_cloudwatch_event_rule.s3_access_events.name
  target_id = "AccessLoggerLambda"
  arn       = aws_lambda_function.access_logger.arn
}

resource "aws_lambda_permission" "allow_eventbridge_access_logger" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.access_logger.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.s3_access_events.arn
}

# Security alert rules
resource "aws_cloudwatch_event_rule" "unauthorized_access" {
  name        = "${var.project_name}-unauthorized-access-${local.env_suffix}"
  description = "Alert on unauthorized S3 access attempts"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      errorCode   = ["AccessDenied"]
      requestParameters = {
        bucketName = [aws_s3_bucket.primary.id]
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-unauthorized-access"
      Type = "EventBridge Rule"
    }
  )
}

resource "aws_cloudwatch_event_target" "unauthorized_access_sns" {
  rule      = aws_cloudwatch_event_rule.unauthorized_access.name
  target_id = "SNSAlerts"
  arn       = aws_sns_topic.alerts.arn
}

resource "aws_cloudwatch_event_rule" "bucket_policy_changes" {
  name        = "${var.project_name}-bucket-policy-changes-${local.env_suffix}"
  description = "Alert on S3 bucket policy or IAM role modifications"

  event_pattern = jsonencode({
    source      = ["aws.s3", "aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventName = [
        "PutBucketPolicy",
        "DeleteBucketPolicy",
        "PutBucketAcl",
        "PutBucketPublicAccessBlock",
        "PutRole",
        "DeleteRole",
        "PutRolePolicy",
        "DeleteRolePolicy",
        "AttachRolePolicy",
        "DetachRolePolicy"
      ]
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-policy-changes"
      Type = "EventBridge Rule"
    }
  )
}

resource "aws_cloudwatch_event_target" "bucket_policy_changes_sns" {
  rule      = aws_cloudwatch_event_rule.bucket_policy_changes.name
  target_id = "SNSAlerts"
  arn       = aws_sns_topic.alerts.arn
}

# Scheduled governance check (daily)
resource "aws_cloudwatch_event_rule" "governance_check" {
  name                = "${var.project_name}-governance-check-${local.env_suffix}"
  description         = "Daily governance and compliance check"
  schedule_expression = var.governance_check_schedule

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-governance-check"
      Type = "EventBridge Rule"
    }
  )
}

resource "aws_cloudwatch_event_target" "governance_check_lambda" {
  rule      = aws_cloudwatch_event_rule.governance_check.name
  target_id = "GovernanceCheckLambda"
  arn       = aws_lambda_function.governance_check.arn
}

resource "aws_lambda_permission" "allow_eventbridge_governance" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.governance_check.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.governance_check.arn
}

# Scheduled expiration enforcer (hourly)
resource "aws_cloudwatch_event_rule" "expiration_enforcer" {
  name                = "${var.project_name}-expiration-enforcer-${local.env_suffix}"
  description         = "Hourly access expiration enforcement"
  schedule_expression = var.expiration_enforcer_schedule

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-expiration-enforcer"
      Type = "EventBridge Rule"
    }
  )
}

resource "aws_cloudwatch_event_target" "expiration_enforcer_lambda" {
  rule      = aws_cloudwatch_event_rule.expiration_enforcer.name
  target_id = "ExpirationEnforcerLambda"
  arn       = aws_lambda_function.expiration_enforcer.arn
}

resource "aws_lambda_permission" "allow_eventbridge_expiration" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.expiration_enforcer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.expiration_enforcer.arn
}

# ============================================================================
# CLOUDWATCH ALARMS
# ============================================================================

resource "aws_cloudwatch_metric_alarm" "high_request_rate" {
  alarm_name          = "${var.project_name}-high-request-rate-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "NumberOfObjects"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = var.request_rate_threshold
  alarm_description   = "Alert when S3 request rate exceeds threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    BucketName = aws_s3_bucket.primary.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-high-request-rate"
      Type = "CloudWatch Alarm"
    }
  )
}

resource "aws_cloudwatch_metric_alarm" "high_data_egress" {
  alarm_name          = "${var.project_name}-high-data-egress-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BytesDownloaded"
  namespace           = "AWS/S3"
  period              = 3600
  statistic           = "Sum"
  threshold           = var.data_egress_threshold_gb * 1024 * 1024 * 1024
  alarm_description   = "Alert when data egress exceeds threshold"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    BucketName = aws_s3_bucket.primary.id
  }

  tags = merge(
    local.common_tags,
    {
      Name = "${var.project_name}-high-data-egress"
      Type = "CloudWatch Alarm"
    }
  )
}

# ============================================================================
# S3 STORAGE LENS (Optional)
# ============================================================================

resource "aws_s3control_storage_lens_configuration" "main" {
  count = var.enable_storage_lens ? 1 : 0

  config_id = "${var.project_name}-storage-lens-${local.env_suffix}"

  storage_lens_configuration {
    enabled = true

    account_level {
      bucket_level {
        activity_metrics {
          enabled = true
        }
      }
    }
  }
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "primary_bucket_name" {
  description = "Name of the primary S3 bucket for data sharing"
  value       = aws_s3_bucket.primary.id
}

output "primary_bucket_arn" {
  description = "ARN of the primary S3 bucket"
  value       = aws_s3_bucket.primary.arn
}

output "audit_bucket_name" {
  description = "Name of the audit bucket for CloudTrail and access logs"
  value       = aws_s3_bucket.audit.id
}

output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = aws_kms_key.primary.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = aws_kms_key.primary.arn
}

output "access_control_table_name" {
  description = "Name of the DynamoDB access control table"
  value       = aws_dynamodb_table.access_control.name
}

output "audit_logs_table_name" {
  description = "Name of the DynamoDB audit logs table"
  value       = aws_dynamodb_table.audit_logs.name
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail trail"
  value       = aws_cloudtrail.organization.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = aws_cloudtrail.organization.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "lambda_access_validator_arn" {
  description = "ARN of the access validator Lambda function"
  value       = aws_lambda_function.access_validator.arn
}

output "lambda_access_logger_arn" {
  description = "ARN of the access logger Lambda function"
  value       = aws_lambda_function.access_logger.arn
}

output "lambda_governance_check_arn" {
  description = "ARN of the governance check Lambda function"
  value       = aws_lambda_function.governance_check.arn
}

output "lambda_expiration_enforcer_arn" {
  description = "ARN of the expiration enforcer Lambda function"
  value       = aws_lambda_function.expiration_enforcer.arn
}

output "consumer_role_name_pattern" {
  description = "Pattern for consumer account IAM role names"
  value       = "${var.project_name}-consumer-role-<account-key>"
}
