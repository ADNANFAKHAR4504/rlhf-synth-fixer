# ==============================================================================
# CloudTrail Log Analytics Platform for 100 AWS Accounts
# ==============================================================================
# This infrastructure processes and analyzes CloudTrail logs from 100 AWS accounts
# with Athena querying, automated processing, real-time alerting, and QuickSight dashboards

# ==============================================================================
# VARIABLES SECTION
# ==============================================================================

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
    error_message = "Environment must be development, staging, or production"
  }
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "cloudtrail-analytics"
}

variable "environment_suffix" {
  description = "Optional environment suffix for resource names (auto-generated if empty)"
  type        = string
  default     = ""
}

variable "account_ids" {
  description = "List of 100 AWS account IDs to collect CloudTrail logs from"
  type        = list(string)
  default     = []

  validation {
    condition     = length(var.account_ids) >= 0 && length(var.account_ids) <= 100
    error_message = "Account IDs list must contain between 0 and 100 account IDs"
  }
}

variable "enable_organization_trail" {
  description = "Enable organization trail (requires AWS Organizations)"
  type        = bool
  default     = true
}

variable "enable_data_events" {
  description = "Enable CloudTrail data events (S3, Lambda)"
  type        = bool
  default     = true
}

variable "lifecycle_intelligent_tiering_days" {
  description = "Days before transitioning to Intelligent-Tiering"
  type        = number
  default     = 30
}

variable "lifecycle_glacier_days" {
  description = "Days before transitioning to Glacier"
  type        = number
  default     = 90
}

variable "lifecycle_expiration_days" {
  description = "Days before deleting logs (7 years = 2557 days)"
  type        = number
  default     = 2557
}

variable "athena_query_result_retention_days" {
  description = "Days to retain Athena query results before deletion"
  type        = number
  default     = 30
}

variable "enable_cross_region_replication" {
  description = "Enable cross-region replication for backup"
  type        = bool
  default     = false
}

variable "backup_region" {
  description = "Backup region for cross-region replication"
  type        = string
  default     = "us-west-2"
}

variable "glue_crawler_schedule" {
  description = "Cron expression for Glue crawler (default: daily at 1 AM UTC)"
  type        = string
  default     = "cron(0 1 * * ? *)"
}

variable "security_analysis_schedule" {
  description = "Rate expression for security analysis Lambda (default: hourly)"
  type        = string
  default     = "rate(1 hour)"
}

variable "log_compaction_schedule" {
  description = "Cron expression for log compaction Lambda (default: weekly Sunday 3 AM)"
  type        = string
  default     = "cron(0 3 ? * SUN *)"
}

variable "compliance_report_schedule" {
  description = "Cron expression for monthly compliance reports (default: 1st of month 6 AM)"
  type        = string
  default     = "cron(0 6 1 * ? *)"
}

variable "athena_bytes_scanned_limit" {
  description = "Athena bytes scanned per query limit in bytes (default: 10 GB)"
  type        = number
  default     = 10737418240
}

variable "security_findings_ttl_days" {
  description = "DynamoDB TTL for security findings in days"
  type        = number
  default     = 90
}

variable "critical_alert_emails" {
  description = "List of email addresses for critical alerts"
  type        = list(string)
  default     = []
}

variable "high_alert_emails" {
  description = "List of email addresses for high severity alerts"
  type        = list(string)
  default     = []
}

variable "medium_alert_emails" {
  description = "List of email addresses for medium severity alerts"
  type        = list(string)
  default     = []
}

variable "compliance_report_emails" {
  description = "List of email addresses for monthly compliance reports"
  type        = list(string)
  default     = []
}

variable "enable_quicksight" {
  description = "Enable QuickSight dashboards"
  type        = bool
  default     = false
}

variable "quicksight_user_arns" {
  description = "List of QuickSight user ARNs for dashboard access"
  type        = list(string)
  default     = []
}

variable "enable_object_lock" {
  description = "Enable S3 Object Lock for compliance mode"
  type        = bool
  default     = false
}

variable "lambda_log_retention_days" {
  description = "CloudWatch log retention for Lambda functions in days"
  type        = number
  default     = 30
}

variable "tags" {
  description = "Additional tags for all resources"
  type        = map(string)
  default     = {}
}

# ==============================================================================
# DATA SOURCES
# ==============================================================================

data "aws_caller_identity" "current" {}

data "aws_partition" "current" {}

data "aws_region" "current" {}

data "aws_availability_zones" "available" {
  state = "available"
}

data "aws_organizations_organization" "current" {}

# ==============================================================================
# RANDOM RESOURCES FOR UNIQUE NAMING
# ==============================================================================

resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

# ==============================================================================
# LOCALS
# ==============================================================================

locals {
  account_id = data.aws_caller_identity.current.account_id
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result

  common_tags = merge(
    {
      Environment = var.environment
      Project     = var.project_name
      ManagedBy   = "Terraform"
    },
    var.tags
  )

  # High-risk actions for security analysis
  high_risk_actions = [
    "iam:AttachUserPolicy",
    "iam:PutUserPolicy",
    "iam:CreateAccessKey",
    "iam:DeleteUser",
    "s3:PutBucketPolicy",
    "s3:DeleteBucketPolicy",
    "kms:ScheduleKeyDeletion",
    "kms:DisableKey",
    "ec2:AuthorizeSecurityGroupIngress",
    "iam:PassRole"
  ]
}

# ==============================================================================
# KMS ENCRYPTION KEY
# ==============================================================================

resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail log encryption"
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
          Sid    = "Allow CloudTrail to encrypt logs"
          Effect = "Allow"
          Principal = {
            Service = "cloudtrail.amazonaws.com"
          }
          Action = [
            "kms:GenerateDataKey*",
            "kms:DecryptDataKey",
            "kms:DescribeKey"
          ]
          Resource = "*"
          Condition = {
            StringLike = {
              "kms:EncryptionContext:aws:cloudtrail:arn" = "arn:${data.aws_partition.current.partition}:cloudtrail:*:${local.account_id}:trail/*"
            }
          }
        },
        {
          Sid    = "Allow CloudTrail to describe key"
          Effect = "Allow"
          Principal = {
            Service = "cloudtrail.amazonaws.com"
          }
          Action   = "kms:DescribeKey"
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
          Sid    = "Allow Glue Service"
          Effect = "Allow"
          Principal = {
            Service = "glue.amazonaws.com"
          }
          Action = [
            "kms:Decrypt",
            "kms:DescribeKey"
          ]
          Resource = "*"
        },
        {
          Sid    = "Allow Athena Service"
          Effect = "Allow"
          Principal = {
            Service = "athena.amazonaws.com"
          }
          Action = [
            "kms:Decrypt",
            "kms:GenerateDataKey",
            "kms:DescribeKey"
          ]
          Resource = "*"
        },
        {
          Sid    = "Allow SNS Service"
          Effect = "Allow"
          Principal = {
            Service = "sns.amazonaws.com"
          }
          Action = [
            "kms:Decrypt",
            "kms:GenerateDataKey"
          ]
          Resource = "*"
        }
      ]
    )
  })

  tags = merge(local.common_tags, { Name = "${var.project_name}-kms-${local.env_suffix}" })
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/${var.project_name}-cloudtrail-${local.env_suffix}"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

# ==============================================================================
# S3 BUCKETS
# ==============================================================================

# Central CloudTrail logs bucket
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "${var.project_name}-logs-${local.env_suffix}"

  tags = merge(local.common_tags, { Name = "${var.project_name}-logs" })
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

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

    transition {
      days          = var.lifecycle_glacier_days
      storage_class = "GLACIER"
    }
  }

  rule {
    id     = "expiration"
    status = "Enabled"

    filter {}

    expiration {
      days = var.lifecycle_expiration_days
    }
  }
}

resource "aws_s3_bucket_object_lock_configuration" "cloudtrail_logs" {
  count  = var.enable_object_lock ? 1 : 0
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    default_retention {
      mode = "COMPLIANCE"
      days = var.lifecycle_expiration_days
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

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
        Resource = aws_s3_bucket.cloudtrail_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = "s3:PutObject"
        Resource = [
          "${aws_s3_bucket.cloudtrail_logs.arn}/AWSLogs/${local.account_id}/*",
          "${aws_s3_bucket.cloudtrail_logs.arn}/AWSLogs/${data.aws_organizations_organization.current.id}/*"
        ]
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = {
          AWS = "*"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      }
    ]
  })
}

# Athena query results bucket
resource "aws_s3_bucket" "athena_results" {
  bucket = "${var.project_name}-athena-results-${local.env_suffix}"

  tags = merge(local.common_tags, { Name = "${var.project_name}-athena-results" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "athena_results" {
  bucket = aws_s3_bucket.athena_results.id

  rule {
    id     = "delete-old-results"
    status = "Enabled"

    filter {}

    expiration {
      days = var.athena_query_result_retention_days
    }
  }
}

# Enriched logs bucket (Parquet format)
resource "aws_s3_bucket" "enriched_logs" {
  bucket = "${var.project_name}-enriched-logs-${local.env_suffix}"

  tags = merge(local.common_tags, { Name = "${var.project_name}-enriched-logs" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "enriched_logs" {
  bucket = aws_s3_bucket.enriched_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "enriched_logs" {
  bucket = aws_s3_bucket.enriched_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Compliance reports bucket
resource "aws_s3_bucket" "compliance_reports" {
  bucket = "${var.project_name}-compliance-reports-${local.env_suffix}"

  tags = merge(local.common_tags, { Name = "${var.project_name}-compliance-reports" })
}

resource "aws_s3_bucket_server_side_encryption_configuration" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.cloudtrail.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "compliance_reports" {
  bucket = aws_s3_bucket.compliance_reports.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# ==============================================================================
# CLOUDTRAIL
# ==============================================================================

resource "aws_cloudtrail" "organization" {
  name                          = "${var.project_name}-trail-${local.env_suffix}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail         = true
  is_organization_trail         = var.enable_organization_trail
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    dynamic "data_resource" {
      for_each = var.enable_data_events ? [1] : []
      content {
        type = "AWS::Lambda::Function"
        values = [
          "arn:${data.aws_partition.current.partition}:lambda"
        ]
      }
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]

  tags = merge(local.common_tags, { Name = "${var.project_name}-trail" })
}

# ==============================================================================
# GLUE DATA CATALOG
# ==============================================================================

resource "aws_glue_catalog_database" "cloudtrail_raw" {
  name = "${var.project_name}_raw_${replace(local.env_suffix, "-", "_")}"

  description = "Raw CloudTrail logs database"
}

resource "aws_glue_catalog_database" "cloudtrail_enriched" {
  name = "${var.project_name}_enriched_${replace(local.env_suffix, "-", "_")}"

  description = "Enriched CloudTrail logs database (Parquet)"
}

resource "aws_glue_crawler" "cloudtrail" {
  name          = "${var.project_name}-crawler-${local.env_suffix}"
  role          = aws_iam_role.glue_crawler.arn
  database_name = aws_glue_catalog_database.cloudtrail_raw.name
  schedule      = var.glue_crawler_schedule

  s3_target {
    path = "s3://${aws_s3_bucket.cloudtrail_logs.id}/AWSLogs/"
  }

  schema_change_policy {
    update_behavior = "UPDATE_IN_DATABASE"
    delete_behavior = "LOG"
  }

  configuration = jsonencode({
    Version = 1.0
    CrawlerOutput = {
      Partitions = { AddOrUpdateBehavior = "InheritFromTable" }
    }
  })

  tags = merge(local.common_tags, { Name = "${var.project_name}-crawler" })
}

# ==============================================================================
# ATHENA
# ==============================================================================

resource "aws_athena_workgroup" "cloudtrail" {
  name = "${var.project_name}-workgroup-${local.env_suffix}"

  configuration {
    enforce_workgroup_configuration    = true
    publish_cloudwatch_metrics_enabled = true

    result_configuration {
      output_location = "s3://${aws_s3_bucket.athena_results.id}/results/"

      encryption_configuration {
        encryption_option = "SSE_KMS"
        kms_key_arn       = aws_kms_key.cloudtrail.arn
      }
    }

    bytes_scanned_cutoff_per_query = var.athena_bytes_scanned_limit
  }

  tags = merge(local.common_tags, { Name = "${var.project_name}-workgroup" })
}

# ==============================================================================
# DYNAMODB TABLE FOR SECURITY FINDINGS
# ==============================================================================

resource "aws_dynamodb_table" "security_findings" {
  name             = "${var.project_name}-security-findings-${local.env_suffix}"
  billing_mode     = "PAY_PER_REQUEST"
  hash_key         = "timestamp"
  range_key        = "finding_id"
  stream_enabled   = true
  stream_view_type = "NEW_AND_OLD_IMAGES"

  attribute {
    name = "timestamp"
    type = "S"
  }

  attribute {
    name = "finding_id"
    type = "S"
  }

  attribute {
    name = "account_id"
    type = "S"
  }

  attribute {
    name = "finding_type"
    type = "S"
  }

  global_secondary_index {
    name            = "account-index"
    hash_key        = "account_id"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  global_secondary_index {
    name            = "finding-type-index"
    hash_key        = "finding_type"
    range_key       = "timestamp"
    projection_type = "ALL"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  point_in_time_recovery {
    enabled = true
  }

  server_side_encryption {
    enabled     = true
    kms_key_arn = aws_kms_key.cloudtrail.arn
  }

  tags = merge(local.common_tags, { Name = "${var.project_name}-security-findings" })
}

# ==============================================================================
# SNS TOPICS FOR ALERTS
# ==============================================================================

resource "aws_sns_topic" "critical_alerts" {
  name              = "${var.project_name}-critical-alerts-${local.env_suffix}"
  kms_master_key_id = aws_kms_key.cloudtrail.id

  tags = merge(local.common_tags, { Name = "${var.project_name}-critical-alerts" })
}

resource "aws_sns_topic_subscription" "critical_alerts" {
  for_each = toset(var.critical_alert_emails)

  topic_arn = aws_sns_topic.critical_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

resource "aws_sns_topic" "high_alerts" {
  name              = "${var.project_name}-high-alerts-${local.env_suffix}"
  kms_master_key_id = aws_kms_key.cloudtrail.id

  tags = merge(local.common_tags, { Name = "${var.project_name}-high-alerts" })
}

resource "aws_sns_topic_subscription" "high_alerts" {
  for_each = toset(var.high_alert_emails)

  topic_arn = aws_sns_topic.high_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

resource "aws_sns_topic" "medium_alerts" {
  name              = "${var.project_name}-medium-alerts-${local.env_suffix}"
  kms_master_key_id = aws_kms_key.cloudtrail.id

  tags = merge(local.common_tags, { Name = "${var.project_name}-medium-alerts" })
}

resource "aws_sns_topic_subscription" "medium_alerts" {
  for_each = toset(var.medium_alert_emails)

  topic_arn = aws_sns_topic.medium_alerts.arn
  protocol  = "email"
  endpoint  = each.value
}

# ==============================================================================
# IAM ROLES
# ==============================================================================

# Glue Crawler Role
resource "aws_iam_role" "glue_crawler" {
  name = "${var.project_name}-glue-crawler-role-${local.env_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "glue.amazonaws.com"
        }
        Action = "sts:AssumeRole"
      }
    ]
  })

  tags = merge(local.common_tags, { Name = "${var.project_name}-glue-crawler-role" })
}

resource "aws_iam_role_policy" "glue_crawler" {
  name = "glue-crawler-policy"
  role = aws_iam_role.glue_crawler.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.cloudtrail_logs.arn,
          "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "glue:*",
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.cloudtrail.arn
      }
    ]
  })
}

# Lambda Execution Role
resource "aws_iam_role" "lambda_execution" {
  name = "${var.project_name}-lambda-execution-role-${local.env_suffix}"

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

  tags = merge(local.common_tags, { Name = "${var.project_name}-lambda-execution-role" })
}

resource "aws_iam_role_policy" "lambda_execution" {
  name = "lambda-execution-policy"
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
        Resource = "arn:${data.aws_partition.current.partition}:logs:${var.aws_region}:${local.account_id}:log-group:/aws/lambda/${var.project_name}-*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.cloudtrail_logs.arn,
          "${aws_s3_bucket.cloudtrail_logs.arn}/*",
          aws_s3_bucket.enriched_logs.arn,
          "${aws_s3_bucket.enriched_logs.arn}/*",
          aws_s3_bucket.compliance_reports.arn,
          "${aws_s3_bucket.compliance_reports.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "dynamodb:PutItem",
          "dynamodb:GetItem",
          "dynamodb:Query",
          "dynamodb:Scan",
          "dynamodb:UpdateItem"
        ]
        Resource = [
          aws_dynamodb_table.security_findings.arn,
          "${aws_dynamodb_table.security_findings.arn}/index/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "athena:StartQueryExecution",
          "athena:GetQueryExecution",
          "athena:GetQueryResults"
        ]
        Resource = aws_athena_workgroup.cloudtrail.arn
      },
      {
        Effect = "Allow"
        Action = [
          "glue:GetTable",
          "glue:GetPartitions",
          "glue:UpdateTable"
        ]
        Resource = "*"
      },
      {
        Effect = "Allow"
        Action = [
          "sns:Publish"
        ]
        Resource = [
          aws_sns_topic.critical_alerts.arn,
          aws_sns_topic.high_alerts.arn,
          aws_sns_topic.medium_alerts.arn
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.cloudtrail.arn
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

# ==============================================================================
# CLOUDWATCH LOG GROUPS FOR LAMBDA FUNCTIONS
# ==============================================================================

resource "aws_cloudwatch_log_group" "log_processor" {
  name              = "/aws/lambda/${var.project_name}-log-processor-${local.env_suffix}"
  retention_in_days = var.lambda_log_retention_days
  kms_key_id        = aws_kms_key.cloudtrail.arn

  tags = merge(local.common_tags, { Name = "${var.project_name}-log-processor-logs" })
}

resource "aws_cloudwatch_log_group" "security_analyzer" {
  name              = "/aws/lambda/${var.project_name}-security-analyzer-${local.env_suffix}"
  retention_in_days = var.lambda_log_retention_days
  kms_key_id        = aws_kms_key.cloudtrail.arn

  tags = merge(local.common_tags, { Name = "${var.project_name}-security-analyzer-logs" })
}

resource "aws_cloudwatch_log_group" "alert_enricher" {
  name              = "/aws/lambda/${var.project_name}-alert-enricher-${local.env_suffix}"
  retention_in_days = var.lambda_log_retention_days
  kms_key_id        = aws_kms_key.cloudtrail.arn

  tags = merge(local.common_tags, { Name = "${var.project_name}-alert-enricher-logs" })
}

resource "aws_cloudwatch_log_group" "log_compactor" {
  name              = "/aws/lambda/${var.project_name}-log-compactor-${local.env_suffix}"
  retention_in_days = var.lambda_log_retention_days
  kms_key_id        = aws_kms_key.cloudtrail.arn

  tags = merge(local.common_tags, { Name = "${var.project_name}-log-compactor-logs" })
}

resource "aws_cloudwatch_log_group" "compliance_reporter" {
  name              = "/aws/lambda/${var.project_name}-compliance-reporter-${local.env_suffix}"
  retention_in_days = var.lambda_log_retention_days
  kms_key_id        = aws_kms_key.cloudtrail.arn

  tags = merge(local.common_tags, { Name = "${var.project_name}-compliance-reporter-logs" })
}

# ==============================================================================
# LAMBDA FUNCTIONS
# ==============================================================================

# Archive files for Lambda functions
data "archive_file" "log_processor" {
  type        = "zip"
  source_file = "${path.module}/lambda-log-processor/index.py"
  output_path = "${path.module}/.terraform/lambda-log-processor.zip"
}

data "archive_file" "security_analyzer" {
  type        = "zip"
  source_file = "${path.module}/lambda-security-analyzer/index.py"
  output_path = "${path.module}/.terraform/lambda-security-analyzer.zip"
}

data "archive_file" "alert_enricher" {
  type        = "zip"
  source_file = "${path.module}/lambda-alert-enricher/index.py"
  output_path = "${path.module}/.terraform/lambda-alert-enricher.zip"
}

data "archive_file" "log_compactor" {
  type        = "zip"
  source_file = "${path.module}/lambda-log-compactor/index.py"
  output_path = "${path.module}/.terraform/lambda-log-compactor.zip"
}

data "archive_file" "compliance_reporter" {
  type        = "zip"
  source_file = "${path.module}/lambda-compliance-reporter/index.py"
  output_path = "${path.module}/.terraform/lambda-compliance-reporter.zip"
}

# Log Processor Lambda
resource "aws_lambda_function" "log_processor" {
  filename         = data.archive_file.log_processor.output_path
  function_name    = "${var.project_name}-log-processor-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.log_processor.output_base64sha256
  runtime          = "python3.12"
  timeout          = 300
  memory_size      = 1024

  environment {
    variables = {
      SOURCE_BUCKET     = aws_s3_bucket.cloudtrail_logs.id
      TARGET_BUCKET     = aws_s3_bucket.enriched_logs.id
      RISK_ACTIONS_LIST = jsonencode(local.high_risk_actions)
      GLUE_DATABASE     = aws_glue_catalog_database.cloudtrail_enriched.name
      GLUE_TABLE        = "enriched_events"
    }
  }

  tracing_config {
    mode = "Active"
  }

  dead_letter_config {
    target_arn = aws_sns_topic.medium_alerts.arn
  }

  depends_on = [aws_cloudwatch_log_group.log_processor]

  tags = merge(local.common_tags, { Name = "${var.project_name}-log-processor" })
}

# Security Analyzer Lambda
resource "aws_lambda_function" "security_analyzer" {
  filename         = data.archive_file.security_analyzer.output_path
  function_name    = "${var.project_name}-security-analyzer-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.security_analyzer.output_base64sha256
  runtime          = "python3.12"
  timeout          = 600
  memory_size      = 2048

  environment {
    variables = {
      ATHENA_WORKGROUP   = aws_athena_workgroup.cloudtrail.name
      ATHENA_DATABASE    = aws_glue_catalog_database.cloudtrail_raw.name
      FINDINGS_TABLE     = aws_dynamodb_table.security_findings.name
      SNS_CRITICAL_TOPIC = aws_sns_topic.critical_alerts.arn
      SNS_HIGH_TOPIC     = aws_sns_topic.high_alerts.arn
      SNS_MEDIUM_TOPIC   = aws_sns_topic.medium_alerts.arn
      FINDINGS_TTL_DAYS  = tostring(var.security_findings_ttl_days)
    }
  }

  tracing_config {
    mode = "Active"
  }

  dead_letter_config {
    target_arn = aws_sns_topic.critical_alerts.arn
  }

  depends_on = [aws_cloudwatch_log_group.security_analyzer]

  tags = merge(local.common_tags, { Name = "${var.project_name}-security-analyzer" })
}

# Alert Enricher Lambda
resource "aws_lambda_function" "alert_enricher" {
  filename         = data.archive_file.alert_enricher.output_path
  function_name    = "${var.project_name}-alert-enricher-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.alert_enricher.output_base64sha256
  runtime          = "python3.12"
  timeout          = 60
  memory_size      = 512

  environment {
    variables = {
      SNS_CRITICAL_TOPIC = aws_sns_topic.critical_alerts.arn
      SNS_HIGH_TOPIC     = aws_sns_topic.high_alerts.arn
      SNS_MEDIUM_TOPIC   = aws_sns_topic.medium_alerts.arn
      FINDINGS_TABLE     = aws_dynamodb_table.security_findings.name
    }
  }

  tracing_config {
    mode = "Active"
  }

  depends_on = [aws_cloudwatch_log_group.alert_enricher]

  tags = merge(local.common_tags, { Name = "${var.project_name}-alert-enricher" })
}

# Log Compactor Lambda
resource "aws_lambda_function" "log_compactor" {
  filename         = data.archive_file.log_compactor.output_path
  function_name    = "${var.project_name}-log-compactor-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.log_compactor.output_base64sha256
  runtime          = "python3.12"
  timeout          = 900
  memory_size      = 3008

  environment {
    variables = {
      SOURCE_BUCKET = aws_s3_bucket.enriched_logs.id
      GLUE_DATABASE = aws_glue_catalog_database.cloudtrail_enriched.name
      GLUE_TABLE    = "enriched_events"
    }
  }

  tracing_config {
    mode = "Active"
  }

  dead_letter_config {
    target_arn = aws_sns_topic.medium_alerts.arn
  }

  depends_on = [aws_cloudwatch_log_group.log_compactor]

  tags = merge(local.common_tags, { Name = "${var.project_name}-log-compactor" })
}

# Compliance Reporter Lambda
resource "aws_lambda_function" "compliance_reporter" {
  filename         = data.archive_file.compliance_reporter.output_path
  function_name    = "${var.project_name}-compliance-reporter-${local.env_suffix}"
  role             = aws_iam_role.lambda_execution.arn
  handler          = "index.lambda_handler"
  source_code_hash = data.archive_file.compliance_reporter.output_base64sha256
  runtime          = "python3.12"
  timeout          = 900
  memory_size      = 2048

  environment {
    variables = {
      ATHENA_WORKGROUP = aws_athena_workgroup.cloudtrail.name
      ATHENA_DATABASE  = aws_glue_catalog_database.cloudtrail_raw.name
      REPORTS_BUCKET   = aws_s3_bucket.compliance_reports.id
      REPORT_EMAILS    = jsonencode(var.compliance_report_emails)
    }
  }

  tracing_config {
    mode = "Active"
  }

  dead_letter_config {
    target_arn = aws_sns_topic.high_alerts.arn
  }

  depends_on = [aws_cloudwatch_log_group.compliance_reporter]

  tags = merge(local.common_tags, { Name = "${var.project_name}-compliance-reporter" })
}

# ==============================================================================
# EVENTBRIDGE RULES
# ==============================================================================

# Rule for security analysis (hourly)
resource "aws_cloudwatch_event_rule" "security_analysis" {
  name                = "${var.project_name}-security-analysis-${local.env_suffix}"
  description         = "Trigger security analysis Lambda hourly"
  schedule_expression = var.security_analysis_schedule

  tags = merge(local.common_tags, { Name = "${var.project_name}-security-analysis-rule" })
}

resource "aws_cloudwatch_event_target" "security_analysis" {
  rule      = aws_cloudwatch_event_rule.security_analysis.name
  target_id = "SecurityAnalysisLambda"
  arn       = aws_lambda_function.security_analyzer.arn
}

resource "aws_lambda_permission" "allow_eventbridge_security_analysis" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.security_analyzer.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.security_analysis.arn
}

# Rule for log compaction (weekly)
resource "aws_cloudwatch_event_rule" "log_compaction" {
  name                = "${var.project_name}-log-compaction-${local.env_suffix}"
  description         = "Trigger log compaction Lambda weekly"
  schedule_expression = var.log_compaction_schedule

  tags = merge(local.common_tags, { Name = "${var.project_name}-log-compaction-rule" })
}

resource "aws_cloudwatch_event_target" "log_compaction" {
  rule      = aws_cloudwatch_event_rule.log_compaction.name
  target_id = "LogCompactionLambda"
  arn       = aws_lambda_function.log_compactor.arn
}

resource "aws_lambda_permission" "allow_eventbridge_log_compaction" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.log_compactor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.log_compaction.arn
}

# Rule for compliance reports (monthly)
resource "aws_cloudwatch_event_rule" "compliance_reporting" {
  name                = "${var.project_name}-compliance-reporting-${local.env_suffix}"
  description         = "Trigger compliance reporting Lambda monthly"
  schedule_expression = var.compliance_report_schedule

  tags = merge(local.common_tags, { Name = "${var.project_name}-compliance-reporting-rule" })
}

resource "aws_cloudwatch_event_target" "compliance_reporting" {
  rule      = aws_cloudwatch_event_rule.compliance_reporting.name
  target_id = "ComplianceReportingLambda"
  arn       = aws_lambda_function.compliance_reporter.arn
}

resource "aws_lambda_permission" "allow_eventbridge_compliance_reporting" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_reporter.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_reporting.arn
}

# Rule for root account usage
resource "aws_cloudwatch_event_rule" "root_account_usage" {
  name        = "${var.project_name}-root-account-usage-${local.env_suffix}"
  description = "Detect root account usage"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      userIdentity = {
        type = ["Root"]
      }
    }
  })

  tags = merge(local.common_tags, { Name = "${var.project_name}-root-account-usage-rule" })
}

resource "aws_cloudwatch_event_target" "root_account_usage" {
  rule      = aws_cloudwatch_event_rule.root_account_usage.name
  target_id = "AlertEnricherLambda"
  arn       = aws_lambda_function.alert_enricher.arn
}

resource "aws_lambda_permission" "allow_eventbridge_root_account_usage" {
  statement_id  = "AllowExecutionFromEventBridgeRootUsage"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_enricher.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.root_account_usage.arn
}

# Rule for console login without MFA
resource "aws_cloudwatch_event_rule" "console_login_no_mfa" {
  name        = "${var.project_name}-console-login-no-mfa-${local.env_suffix}"
  description = "Detect console login without MFA"

  event_pattern = jsonencode({
    source      = ["aws.signin"]
    detail-type = ["AWS Console Sign In via CloudTrail"]
    detail = {
      eventName = ["ConsoleLogin"]
      additionalEventData = {
        MFAUsed = ["No"]
      }
    }
  })

  tags = merge(local.common_tags, { Name = "${var.project_name}-console-login-no-mfa-rule" })
}

resource "aws_cloudwatch_event_target" "console_login_no_mfa" {
  rule      = aws_cloudwatch_event_rule.console_login_no_mfa.name
  target_id = "AlertEnricherLambda"
  arn       = aws_lambda_function.alert_enricher.arn
}

resource "aws_lambda_permission" "allow_eventbridge_console_login_no_mfa" {
  statement_id  = "AllowExecutionFromEventBridgeConsoleLogin"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.alert_enricher.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.console_login_no_mfa.arn
}

# ==============================================================================
# CLOUDWATCH ALARMS
# ==============================================================================

resource "aws_cloudwatch_metric_alarm" "glue_crawler_failures" {
  alarm_name          = "${var.project_name}-glue-crawler-failures-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "glue.driver.aggregate.numFailedTasks"
  namespace           = "Glue"
  period              = "3600"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Glue crawler failures detected"
  alarm_actions       = [aws_sns_topic.high_alerts.arn]

  dimensions = {
    JobName = aws_glue_crawler.cloudtrail.name
  }

  tags = merge(local.common_tags, { Name = "${var.project_name}-glue-crawler-failures-alarm" })
}

resource "aws_cloudwatch_metric_alarm" "lambda_errors" {
  for_each = {
    log_processor       = aws_lambda_function.log_processor.function_name
    security_analyzer   = aws_lambda_function.security_analyzer.function_name
    alert_enricher      = aws_lambda_function.alert_enricher.function_name
    log_compactor       = aws_lambda_function.log_compactor.function_name
    compliance_reporter = aws_lambda_function.compliance_reporter.function_name
  }

  alarm_name          = "${var.project_name}-${each.key}-errors-${local.env_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "Errors"
  namespace           = "AWS/Lambda"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Lambda function ${each.key} errors detected"
  alarm_actions       = [aws_sns_topic.high_alerts.arn]

  dimensions = {
    FunctionName = each.value
  }

  tags = merge(local.common_tags, { Name = "${var.project_name}-${each.key}-errors-alarm" })
}

# ==============================================================================
# OUTPUTS
# ==============================================================================

output "cloudtrail_logs_bucket" {
  description = "S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "athena_results_bucket" {
  description = "S3 bucket for Athena query results"
  value       = aws_s3_bucket.athena_results.id
}

output "enriched_logs_bucket" {
  description = "S3 bucket for enriched logs (Parquet)"
  value       = aws_s3_bucket.enriched_logs.id
}

output "compliance_reports_bucket" {
  description = "S3 bucket for compliance reports"
  value       = aws_s3_bucket.compliance_reports.id
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail trail"
  value       = aws_cloudtrail.organization.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail"
  value       = aws_cloudtrail.organization.arn
}

output "kms_key_id" {
  description = "ID of the KMS encryption key"
  value       = aws_kms_key.cloudtrail.id
}

output "kms_key_arn" {
  description = "ARN of the KMS encryption key"
  value       = aws_kms_key.cloudtrail.arn
}

output "glue_database_raw" {
  description = "Glue database for raw CloudTrail logs"
  value       = aws_glue_catalog_database.cloudtrail_raw.name
}

output "glue_database_enriched" {
  description = "Glue database for enriched logs"
  value       = aws_glue_catalog_database.cloudtrail_enriched.name
}

output "glue_crawler_name" {
  description = "Name of the Glue crawler"
  value       = aws_glue_crawler.cloudtrail.name
}

output "athena_workgroup" {
  description = "Athena workgroup name"
  value       = aws_athena_workgroup.cloudtrail.name
}

output "security_findings_table" {
  description = "DynamoDB table for security findings"
  value       = aws_dynamodb_table.security_findings.name
}

output "critical_alerts_topic_arn" {
  description = "SNS topic ARN for critical alerts"
  value       = aws_sns_topic.critical_alerts.arn
}

output "high_alerts_topic_arn" {
  description = "SNS topic ARN for high severity alerts"
  value       = aws_sns_topic.high_alerts.arn
}

output "medium_alerts_topic_arn" {
  description = "SNS topic ARN for medium severity alerts"
  value       = aws_sns_topic.medium_alerts.arn
}

output "lambda_log_processor_arn" {
  description = "ARN of the log processor Lambda function"
  value       = aws_lambda_function.log_processor.arn
}

output "lambda_security_analyzer_arn" {
  description = "ARN of the security analyzer Lambda function"
  value       = aws_lambda_function.security_analyzer.arn
}

output "lambda_alert_enricher_arn" {
  description = "ARN of the alert enricher Lambda function"
  value       = aws_lambda_function.alert_enricher.arn
}

output "lambda_log_compactor_arn" {
  description = "ARN of the log compactor Lambda function"
  value       = aws_lambda_function.log_compactor.arn
}

output "lambda_compliance_reporter_arn" {
  description = "ARN of the compliance reporter Lambda function"
  value       = aws_lambda_function.compliance_reporter.arn
}
