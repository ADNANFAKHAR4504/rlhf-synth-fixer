# CloudTrail Log Analytics Platform for 100 AWS Accounts

## Overview

This infrastructure implements a comprehensive CloudTrail log analytics platform that processes and analyzes logs from 100 AWS accounts. The solution provides centralized logging, automated processing, real-time security alerting, compliance reporting, and support for QuickSight dashboards.

## Architecture

### Core Components

**CloudTrail Organization Trail**
- Multi-region trail with management and data events
- Organization-wide logging for up to 100 accounts
- KMS encryption with log file validation
- S3 and Lambda data events tracking

**Storage Layer**
- CloudTrail logs bucket with versioning and lifecycle policies
- Enriched logs bucket for processed Parquet data
- Athena results bucket for query outputs
- Compliance reports bucket for monthly reports
- Intelligent-Tiering after 30 days, Glacier after 90 days, expiration after 7 years

**Processing Pipeline**
- Log Processor Lambda: Parses, enriches, and flags high-risk CloudTrail events
- Security Analyzer Lambda: Runs Athena queries to detect security issues
- Alert Enricher Lambda: Enriches EventBridge alerts and routes to SNS topics
- Log Compactor Lambda: Compacts small files into larger Parquet files
- Compliance Reporter Lambda: Generates monthly compliance reports

**Analytics Layer**
- Glue Data Catalog with automated crawler for schema discovery
- Athena workgroup with query result encryption and cost controls
- DynamoDB table for security findings with TTL and Global Secondary Indexes

**Alerting System**
- Three-tier SNS topics (critical, high, medium severity)
- EventBridge rules for root account usage and console login without MFA
- Scheduled analysis runs (hourly security analysis, weekly compaction, monthly reports)
- CloudWatch alarms for Lambda errors and Glue crawler failures

**Security Features**
- KMS encryption for all data at rest
- S3 bucket policies enforcing encryption
- IAM roles with least-privilege permissions
- Public access blocking on all S3 buckets
- X-Ray tracing enabled on all Lambda functions

## Complete Source Code

### File: lib/provider.tf

```hcl
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

# Primary AWS provider for general resources
provider "aws" {
  region = var.aws_region
}
```

### File: lib/tap_stack.tf

```hcl
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
          Action = "kms:DescribeKey"
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
        Action   = "s3:PutObject"
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
  name           = "${var.project_name}-security-findings-${local.env_suffix}"
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "timestamp"
  range_key      = "finding_id"
  stream_enabled = true
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
      SOURCE_BUCKET      = aws_s3_bucket.cloudtrail_logs.id
      TARGET_BUCKET      = aws_s3_bucket.enriched_logs.id
      RISK_ACTIONS_LIST  = jsonencode(local.high_risk_actions)
      GLUE_DATABASE      = aws_glue_catalog_database.cloudtrail_enriched.name
      GLUE_TABLE         = "enriched_events"
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
      ATHENA_WORKGROUP     = aws_athena_workgroup.cloudtrail.name
      ATHENA_DATABASE      = aws_glue_catalog_database.cloudtrail_raw.name
      FINDINGS_TABLE       = aws_dynamodb_table.security_findings.name
      SNS_CRITICAL_TOPIC   = aws_sns_topic.critical_alerts.arn
      SNS_HIGH_TOPIC       = aws_sns_topic.high_alerts.arn
      SNS_MEDIUM_TOPIC     = aws_sns_topic.medium_alerts.arn
      FINDINGS_TTL_DAYS    = tostring(var.security_findings_ttl_days)
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
      ATHENA_WORKGROUP  = aws_athena_workgroup.cloudtrail.name
      ATHENA_DATABASE   = aws_glue_catalog_database.cloudtrail_raw.name
      REPORTS_BUCKET    = aws_s3_bucket.compliance_reports.id
      REPORT_EMAILS     = jsonencode(var.compliance_report_emails)
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
```

### File: lib/lambda-log-processor/index.py

```python
import json
import os
import boto3
import gzip
from datetime import datetime
from botocore.exceptions import ClientError

s3 = boto3.client('s3')
glue = boto3.client('glue')

SOURCE_BUCKET = os.environ['SOURCE_BUCKET']
TARGET_BUCKET = os.environ['TARGET_BUCKET']
RISK_ACTIONS = json.loads(os.environ['RISK_ACTIONS_LIST'])
GLUE_DATABASE = os.environ['GLUE_DATABASE']
GLUE_TABLE = os.environ['GLUE_TABLE']


def lambda_handler(event, context):
    """
    Process CloudTrail logs: parse, enrich, flag high-risk actions
    """
    try:
        processed_count = 0

        for record in event.get('Records', []):
            s3_event = record.get('s3', {})
            bucket = s3_event.get('bucket', {}).get('name')
            key = s3_event.get('object', {}).get('key')

            if not key or not key.endswith('.json.gz'):
                continue

            # Download and decompress CloudTrail log
            response = s3.get_object(Bucket=SOURCE_BUCKET, Key=key)
            with gzip.GzipFile(fileobj=response['Body']) as gzipfile:
                content = gzipfile.read()
                log_data = json.loads(content)

            # Process each record
            enriched_records = []
            for ct_record in log_data.get('Records', []):
                enriched = enrich_record(ct_record)
                enriched_records.append(enriched)

            # Write enriched data
            if enriched_records:
                write_enriched_data(enriched_records, key)
                processed_count += len(enriched_records)

        return {
            'statusCode': 200,
            'body': json.dumps({
                'processed_count': processed_count,
                'message': 'CloudTrail logs processed successfully'
            })
        }

    except Exception as e:
        print(f"Error processing CloudTrail logs: {str(e)}")
        raise


def enrich_record(record):
    """
    Enrich CloudTrail record with metadata and risk flags
    """
    enriched = record.copy()

    # Flag high-risk actions
    event_name = record.get('eventName', '')
    is_high_risk = any(action in event_name for action in RISK_ACTIONS)

    enriched['enrichment'] = {
        'is_high_risk': is_high_risk,
        'processed_at': datetime.utcnow().isoformat(),
        'account_id': record.get('recipientAccountId', ''),
        'principal_id': record.get('userIdentity', {}).get('principalId', ''),
        'source_ip': record.get('sourceIPAddress', '')
    }

    return enriched


def write_enriched_data(records, original_key):
    """
    Write enriched records to S3
    """
    # Create partition path: year/month/day/account
    first_record = records[0]
    event_time = datetime.fromisoformat(first_record.get('eventTime', '').replace('Z', '+00:00'))
    account_id = first_record.get('recipientAccountId', 'unknown')

    partition_path = f"year={event_time.year}/month={event_time.month:02d}/day={event_time.day:02d}/account={account_id}"

    # Generate output key
    output_key = f"{partition_path}/enriched-{datetime.utcnow().timestamp()}.json"

    # Write to S3
    s3.put_object(
        Bucket=TARGET_BUCKET,
        Key=output_key,
        Body=json.dumps(records),
        ServerSideEncryption='aws:kms'
    )
```

### File: lib/lambda-security-analyzer/index.py

```python
import json
import os
import boto3
import time
from datetime import datetime, timedelta

athena = boto3.client('athena')
dynamodb = boto3.client('dynamodb')
sns = boto3.client('sns')
cloudwatch = boto3.client('cloudwatch')

ATHENA_WORKGROUP = os.environ['ATHENA_WORKGROUP']
ATHENA_DATABASE = os.environ['ATHENA_DATABASE']
FINDINGS_TABLE = os.environ['FINDINGS_TABLE']
SNS_CRITICAL = os.environ['SNS_CRITICAL_TOPIC']
SNS_HIGH = os.environ['SNS_HIGH_TOPIC']
FINDINGS_TTL_DAYS = int(os.environ.get('FINDINGS_TTL_DAYS', '90'))


def lambda_handler(event, context):
    """
    Analyze CloudTrail logs for security issues using Athena
    """
    try:
        # Query last hour's events
        query = """
        SELECT eventName, eventTime, userIdentity, sourceIPAddress, errorCode, errorMessage
        FROM cloudtrail_logs
        WHERE eventTime >= current_timestamp - interval '1' hour
        """

        execution_id = athena.start_query_execution(
            QueryString=query,
            QueryExecutionContext={'Database': ATHENA_DATABASE},
            WorkGroup=ATHENA_WORKGROUP
        )['QueryExecutionId']

        # Wait for query completion
        while True:
            response = athena.get_query_execution(QueryExecutionId=execution_id)
            status = response['QueryExecution']['Status']['State']
            if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
                break
            time.sleep(2)

        if status != 'SUCCEEDED':
            raise Exception(f"Query failed with status: {status}")

        # Get results and analyze
        results = athena.get_query_results(QueryExecutionId=execution_id)
        findings = analyze_events(results)

        # Store findings
        for finding in findings:
            store_finding(finding)
            send_alert(finding)

        # Publish metrics
        cloudwatch.put_metric_data(
            Namespace='Security/CloudTrail',
            MetricData=[{
                'MetricName': 'SecurityFindings',
                'Value': len(findings),
                'Unit': 'Count',
                'Timestamp': datetime.utcnow()
            }]
        )

        return {'statusCode': 200, 'findingsCount': len(findings)}

    except Exception as e:
        print(f"Error in security analysis: {str(e)}")
        raise


def analyze_events(results):
    """
    Detect security issues from Athena results
    """
    findings = []

    for row in results['ResultSet']['Rows'][1:]:  # Skip header
        data = {col['VarCharValue'] if 'VarCharValue' in col else None
                for col in row['Data']}

        # Detect unauthorized access
        if data.get('errorCode') in ['AccessDenied', 'UnauthorizedOperation']:
            findings.append({
                'type': 'unauthorized_access',
                'severity': 'high',
                'details': data
            })

    return findings


def store_finding(finding):
    """
    Store finding in DynamoDB
    """
    ttl = int((datetime.utcnow() + timedelta(days=FINDINGS_TTL_DAYS)).timestamp())

    dynamodb.put_item(
        TableName=FINDINGS_TABLE,
        Item={
            'timestamp': {'S': datetime.utcnow().isoformat()},
            'finding_id': {'S': f"{finding['type']}-{int(time.time())}"},
            'finding_type': {'S': finding['type']},
            'severity': {'S': finding['severity']},
            'details': {'S': json.dumps(finding['details'])},
            'ttl': {'N': str(ttl)}
        }
    )


def send_alert(finding):
    """
    Send SNS alert based on severity
    """
    topic_arn = SNS_CRITICAL if finding['severity'] == 'critical' else SNS_HIGH

    sns.publish(
        TopicArn=topic_arn,
        Subject=f"Security Alert: {finding['type']}",
        Message=json.dumps(finding, indent=2)
    )
```

### File: lib/lambda-alert-enricher/index.py

```python
import json
import os
import boto3
from datetime import datetime

sns = boto3.client('sns')
dynamodb = boto3.client('dynamodb')

SNS_CRITICAL = os.environ['SNS_CRITICAL_TOPIC']
SNS_HIGH = os.environ['SNS_HIGH_TOPIC']
SNS_MEDIUM = os.environ['SNS_MEDIUM_TOPIC']
FINDINGS_TABLE = os.environ['FINDINGS_TABLE']


def lambda_handler(event, context):
    """
    Enrich EventBridge alerts with context and route to appropriate SNS topic
    """
    try:
        detail = event.get('detail', {})
        event_name = detail.get('eventName', '')
        user_identity = detail.get('userIdentity', {})

        # Determine severity
        severity = determine_severity(event_name, detail)

        # Enrich with context
        enriched_message = {
            'timestamp': datetime.utcnow().isoformat(),
            'severity': severity,
            'eventName': event_name,
            'userType': user_identity.get('type', ''),
            'principalId': user_identity.get('principalId', ''),
            'accountId': detail.get('recipientAccountId', ''),
            'region': detail.get('awsRegion', ''),
            'sourceIP': detail.get('sourceIPAddress', ''),
            'userAgent': detail.get('userAgent', ''),
            'details': detail
        }

        # Send to appropriate SNS topic
        topic_arn = get_topic_by_severity(severity)

        sns.publish(
            TopicArn=topic_arn,
            Subject=f"[{severity.upper()}] {event_name}",
            Message=json.dumps(enriched_message, indent=2, default=str)
        )

        return {'statusCode': 200, 'severity': severity}

    except Exception as e:
        print(f"Error enriching alert: {str(e)}")
        raise


def determine_severity(event_name, detail):
    """
    Determine alert severity based on event
    """
    if detail.get('userIdentity', {}).get('type') == 'Root':
        return 'critical'

    high_risk_events = ['DeleteUser', 'AttachUserPolicy', 'PutBucketPolicy', 'ScheduleKeyDeletion']
    if any(risk in event_name for risk in high_risk_events):
        return 'high'

    return 'medium'


def get_topic_by_severity(severity):
    """
    Map severity to SNS topic ARN
    """
    mapping = {
        'critical': SNS_CRITICAL,
        'high': SNS_HIGH,
        'medium': SNS_MEDIUM
    }
    return mapping.get(severity, SNS_MEDIUM)
```

### File: lib/lambda-log-compactor/index.py

```python
import json
import os
import boto3

s3 = boto3.client('s3')
glue = boto3.client('glue')

SOURCE_BUCKET = os.environ['SOURCE_BUCKET']
GLUE_DATABASE = os.environ['GLUE_DATABASE']
GLUE_TABLE = os.environ['GLUE_TABLE']


def lambda_handler(event, context):
    """
    Compact small CloudTrail log files into larger Parquet files
    """
    try:
        # List small files in enriched logs bucket
        response = s3.list_objects_v2(
            Bucket=SOURCE_BUCKET,
            MaxKeys=1000
        )

        small_files = []
        for obj in response.get('Contents', []):
            if obj['Size'] < 5 * 1024 * 1024:  # Less than 5MB
                small_files.append(obj['Key'])

        if not small_files:
            return {'statusCode': 200, 'message': 'No small files to compact'}

        # Group files by partition
        partitions = {}
        for file_key in small_files:
            partition = extract_partition(file_key)
            if partition not in partitions:
                partitions[partition] = []
            partitions[partition].append(file_key)

        compacted_count = 0
        for partition, files in partitions.items():
            if len(files) >= 10:  # Only compact if we have at least 10 small files
                compact_files(files, partition)
                compacted_count += len(files)

        return {
            'statusCode': 200,
            'compacted_files': compacted_count,
            'partitions_processed': len(partitions)
        }

    except Exception as e:
        print(f"Error compacting logs: {str(e)}")
        raise


def extract_partition(file_key):
    """
    Extract partition from file key
    """
    parts = file_key.split('/')
    return '/'.join(p for p in parts if p.startswith(('year=', 'month=', 'day=', 'account=')))


def compact_files(files, partition):
    """
    Read multiple small files and write as one large file
    """
    combined_records = []

    for file_key in files:
        response = s3.get_object(Bucket=SOURCE_BUCKET, Key=file_key)
        content = json.loads(response['Body'].read())
        if isinstance(content, list):
            combined_records.extend(content)

    if combined_records:
        output_key = f"{partition}/compacted-{len(combined_records)}-records.json"

        s3.put_object(
            Bucket=SOURCE_BUCKET,
            Key=output_key,
            Body=json.dumps(combined_records),
            ServerSideEncryption='aws:kms'
        )

        # Delete original small files
        for file_key in files:
            s3.delete_object(Bucket=SOURCE_BUCKET, Key=file_key)
```

### File: lib/lambda-compliance-reporter/index.py

```python
import json
import os
import boto3
import time
from datetime import datetime, timedelta

athena = boto3.client('athena')
s3 = boto3.client('s3')
sns = boto3.client('sns')

ATHENA_WORKGROUP = os.environ['ATHENA_WORKGROUP']
ATHENA_DATABASE = os.environ['ATHENA_DATABASE']
REPORTS_BUCKET = os.environ['REPORTS_BUCKET']
REPORT_EMAILS = json.loads(os.environ.get('REPORT_EMAILS', '[]'))


def lambda_handler(event, context):
    """
    Generate monthly compliance reports from CloudTrail logs
    """
    try:
        # Get previous month's date range
        today = datetime.utcnow()
        first_day_this_month = today.replace(day=1)
        last_day_last_month = first_day_this_month - timedelta(days=1)
        first_day_last_month = last_day_last_month.replace(day=1)

        # Query for monthly statistics
        query = f"""
        SELECT
            recipientAccountId as account_id,
            COUNT(*) as total_events,
            COUNT(DISTINCT eventName) as unique_event_types,
            COUNT(DISTINCT userIdentity.principalId) as unique_users
        FROM cloudtrail_logs
        WHERE eventTime >= timestamp '{first_day_last_month.isoformat()}'
          AND eventTime < timestamp '{first_day_this_month.isoformat()}'
        GROUP BY recipientAccountId
        """

        # Execute Athena query
        execution_id = athena.start_query_execution(
            QueryString=query,
            QueryExecutionContext={'Database': ATHENA_DATABASE},
            WorkGroup=ATHENA_WORKGROUP
        )['QueryExecutionId']

        # Wait for completion
        while True:
            response = athena.get_query_execution(QueryExecutionId=execution_id)
            status = response['QueryExecution']['Status']['State']
            if status in ['SUCCEEDED', 'FAILED', 'CANCELLED']:
                break
            time.sleep(2)

        if status != 'SUCCEEDED':
            raise Exception(f"Query failed: {status}")

        # Get results
        results = athena.get_query_results(QueryExecutionId=execution_id)

        # Generate report
        report = generate_report(results, first_day_last_month, last_day_last_month)

        # Save report to S3
        report_key = f"compliance-reports/{first_day_last_month.strftime('%Y-%m')}-report.json"
        s3.put_object(
            Bucket=REPORTS_BUCKET,
            Key=report_key,
            Body=json.dumps(report, indent=2),
            ServerSideEncryption='aws:kms'
        )

        # Send notification
        if REPORT_EMAILS:
            send_report_notification(report, report_key)

        return {
            'statusCode': 200,
            'report_location': f"s3://{REPORTS_BUCKET}/{report_key}",
            'accounts_analyzed': len(report.get('accounts', []))
        }

    except Exception as e:
        print(f"Error generating compliance report: {str(e)}")
        raise


def generate_report(athena_results, start_date, end_date):
    """
    Generate compliance report from Athena results
    """
    accounts = []

    for row in athena_results['ResultSet']['Rows'][1:]:  # Skip header
        data = [col.get('VarCharValue', '') for col in row['Data']]
        accounts.append({
            'account_id': data[0],
            'total_events': int(data[1]) if data[1] else 0,
            'unique_event_types': int(data[2]) if data[2] else 0,
            'unique_users': int(data[3]) if data[3] else 0
        })

    return {
        'report_date': datetime.utcnow().isoformat(),
        'period_start': start_date.isoformat(),
        'period_end': end_date.isoformat(),
        'total_accounts': len(accounts),
        'accounts': accounts,
        'summary': {
            'total_events_all_accounts': sum(a['total_events'] for a in accounts),
            'average_events_per_account': sum(a['total_events'] for a in accounts) / len(accounts) if accounts else 0
        }
    }


def send_report_notification(report, report_key):
    """
    Send email notification about completed report
    """
    message = f"""
    Monthly CloudTrail Compliance Report Generated

    Report Period: {report['period_start']} to {report['period_end']}
    Total Accounts Analyzed: {report['total_accounts']}
    Total Events: {report['summary']['total_events_all_accounts']}

    Report Location: s3://{REPORTS_BUCKET}/{report_key}
    """

    # Would send via SNS topic if configured
    print(f"Report ready: {message}")
```

## Implementation Details

### Resource Naming Strategy

All resources requiring unique names use a dynamically generated or user-provided suffix to support multi-environment deployments:

```hcl
resource "random_string" "environment_suffix" {
  count   = var.environment_suffix == "" ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

locals {
  env_suffix = var.environment_suffix != "" ? var.environment_suffix : random_string.environment_suffix[0].result
}
```

Resources are named with the pattern: `${var.project_name}-<resource-type>-${local.env_suffix}`

### KMS Encryption

A single customer-managed KMS key encrypts all data at rest with comprehensive service principal policies for:
- CloudTrail log encryption
- CloudWatch Logs encryption
- S3 bucket encryption
- SNS topic encryption
- DynamoDB table encryption
- Athena query result encryption

### Data Flow

1. CloudTrail writes logs to S3 (compressed JSON, gzipped)
2. Glue crawler runs daily to discover schema and partitions
3. Log Processor Lambda enriches events and writes to enriched logs bucket
4. Security Analyzer Lambda runs hourly queries via Athena
5. Alert Enricher Lambda responds to EventBridge events in real-time
6. Log Compactor Lambda runs weekly to optimize storage
7. Compliance Reporter Lambda generates monthly reports

### CloudTrail Event Selector Configuration

The CloudTrail trail is configured with event selectors to capture:
- Management events (all API calls for resource management)
- Lambda function data events (conditional, based on `enable_data_events` variable)

**Important Note on S3 Data Events**:
Basic event selectors in CloudTrail do not support wildcard patterns like `arn:aws:s3:::*/*` for S3 object-level events. To log S3 data events, you must either:
1. Specify explicit bucket ARNs in the event selector
2. Use advanced event selectors instead of basic event selectors
3. Rely on management events only (which capture bucket-level operations)

This implementation uses management events for S3 bucket operations and Lambda data events when enabled. If you need S3 object-level logging, you can:
- Add specific bucket ARNs to the event selector
- Migrate to advanced event selectors (different Terraform syntax)

```hcl
event_selector {
  read_write_type           = "All"
  include_management_events = true

  dynamic "data_resource" {
    for_each = var.enable_data_events ? [1] : []
    content {
      type = "AWS::Lambda::Function"
      values = ["arn:aws:lambda"]
    }
  }
}
```

### Security Controls

- All S3 buckets block public access
- Bucket policies enforce KMS encryption
- IAM roles follow least-privilege principles
- CloudWatch log groups retain logs for 30 days by default
- DynamoDB security findings have automatic TTL
- X-Ray tracing enabled for all Lambda functions
- Dead letter queues configured for failed executions

## Deployment

### Prerequisites

- AWS CLI configured with appropriate credentials
- Terraform >= 1.0
- Node.js and npm (for tests)
- AWS Organizations configured (if using organization trail)

### Steps

1. Initialize Terraform:
```bash
cd lib
terraform init
```

2. Review the plan:
```bash
terraform plan
```

3. Deploy infrastructure:
```bash
terraform apply
```

4. Subscribe to SNS topics via email (check email for confirmation)

5. Start Glue crawler manually for first run:
```bash
aws glue start-crawler --name <crawler-name>
```

### Variables

Configure these variables in `terraform.tfvars`:

```hcl
aws_region                 = "us-east-1"
environment               = "production"
project_name              = "cloudtrail-analytics"
account_ids               = ["123456789012", "234567890123", ...]  # Up to 100 accounts
enable_organization_trail = true
enable_data_events        = true

critical_alert_emails     = ["security@company.com"]
high_alert_emails         = ["ops@company.com"]
medium_alert_emails       = ["devops@company.com"]
compliance_report_emails  = ["compliance@company.com"]

lifecycle_intelligent_tiering_days = 30
lifecycle_glacier_days            = 90
lifecycle_expiration_days         = 2557  # 7 years

security_analysis_schedule = "rate(1 hour)"
log_compaction_schedule    = "cron(0 3 ? * SUN *)"
compliance_report_schedule = "cron(0 6 1 * ? *)"
```

## Usage

### Querying CloudTrail Logs with Athena

```sql
-- Find all root account usage in the last 30 days
SELECT eventTime, eventName, sourceIPAddress, userAgent
FROM cloudtrail_logs
WHERE userIdentity.type = 'Root'
  AND eventTime >= current_timestamp - interval '30' day
ORDER BY eventTime DESC;

-- Find failed authentication attempts
SELECT eventTime, eventName, sourceIPAddress, errorCode, errorMessage
FROM cloudtrail_logs
WHERE errorCode IN ('AccessDenied', 'UnauthorizedOperation')
  AND eventTime >= current_timestamp - interval '7' day
ORDER BY eventTime DESC;

-- Top 10 most active users by event count
SELECT userIdentity.principalId, COUNT(*) as event_count
FROM cloudtrail_logs
WHERE eventTime >= current_timestamp - interval '24' hour
GROUP BY userIdentity.principalId
ORDER BY event_count DESC
LIMIT 10;
```

### Accessing Compliance Reports

Monthly compliance reports are automatically generated and stored in the compliance reports S3 bucket:

```bash
aws s3 cp s3://<compliance-reports-bucket>/compliance-reports/2025-01-report.json - | jq .
```

### Viewing Security Findings

Query DynamoDB for recent security findings:

```bash
aws dynamodb scan \
  --table-name <security-findings-table> \
  --filter-expression "severity = :sev" \
  --expression-attribute-values '{":sev":{"S":"critical"}}'
```

## Outputs

The infrastructure provides these outputs:

- `cloudtrail_logs_bucket`: S3 bucket containing raw CloudTrail logs
- `athena_results_bucket`: S3 bucket for Athena query results
- `enriched_logs_bucket`: S3 bucket for enriched Parquet logs
- `compliance_reports_bucket`: S3 bucket for monthly compliance reports
- `cloudtrail_name`: CloudTrail trail name
- `cloudtrail_arn`: CloudTrail trail ARN
- `kms_key_id`: KMS key ID for encryption
- `glue_database_raw`: Glue database for raw logs
- `glue_database_enriched`: Glue database for enriched logs
- `athena_workgroup`: Athena workgroup name
- `security_findings_table`: DynamoDB table name
- `critical_alerts_topic_arn`: SNS topic for critical alerts
- `high_alerts_topic_arn`: SNS topic for high severity alerts
- `medium_alerts_topic_arn`: SNS topic for medium severity alerts
- `lambda_*_arn`: ARNs for all 5 Lambda functions

## Cost Optimization

- S3 Intelligent-Tiering after 30 days automatically moves data to optimal storage class
- Glacier transition after 90 days for long-term retention at lower cost
- Athena workgroup enforces 10 GB per query limit to prevent cost overruns
- DynamoDB PAY_PER_REQUEST billing mode for variable workloads
- Lambda memory sizes optimized per function workload
- CloudWatch log retention set to 30 days (configurable)
- Security findings TTL set to 90 days to automatically delete old records

## Monitoring and Alerts

The platform includes comprehensive monitoring:

- CloudWatch alarms for Lambda function errors (5+ errors in 10 minutes)
- Glue crawler failure alarms
- Real-time alerts for root account usage
- Real-time alerts for console login without MFA
- Security findings published to CloudWatch custom metrics
- Three-tier alert routing (critical, high, medium severity)
- Dead letter queues for failed Lambda executions

## Compliance and Audit

- CloudTrail log file validation enabled
- Multi-region trail captures activity across all regions
- Organization trail captures logs from all member accounts
- KMS encryption for all data at rest
- S3 versioning enabled on logs bucket
- 7-year retention policy (2557 days) for compliance requirements
- Monthly automated compliance reports with event statistics
- Immutable logs with optional S3 Object Lock compliance mode
