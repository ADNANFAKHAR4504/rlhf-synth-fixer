# tap_stack.tf - Small Business Daily Backup Infrastructure

```hcl

# Region: us-west-2
# Purpose: Automated, secure, and cost-efficient daily document backup system

# ============================================================================
# VARIABLES
# ============================================================================

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-west-2"
}

variable "company_name" {
  description = "Company name used for resource naming"
  type        = string
  default     = "smallbiz"
}

variable "environment" {
  description = "Environment name (prod/staging/dev)"
  type        = string
  default     = "prod"
}

variable "backup_retention_days" {
  description = "Number of days to retain backups before deletion"
  type        = number
  default     = 30
}

variable "backup_schedule" {
  description = "Cron expression for backup schedule"
  type        = string
  default     = "cron(0 2 * * ? *)" # Daily at 2 AM UTC
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "ops@example.com"
}

variable "allowed_backup_roles" {
  description = "List of IAM role ARNs allowed to write backups"
  type        = list(string)
  default     = []
}

variable "tags" {
  description = "Common tags to apply to all resources"
  type        = map(string)
  default = {
    ManagedBy   = "Terraform"
    Purpose     = "DailyBackup"
    CostCenter  = "IT-Operations"
  }
}

# ============================================================================
# LOCALS
# ============================================================================

locals {
  bucket_name = "${var.company_name}-${var.environment}-daily-backups-${data.aws_caller_identity.current.account_id}"

  common_tags = merge(
    var.tags,
    {
      Environment = var.environment
      Company     = var.company_name
      Region      = "us-west-2"
    }
  )

  # Alarm thresholds
  alarm_thresholds = {
    bucket_size_gb = 500    # Alert if bucket exceeds 500GB
    daily_requests = 10000  # Alert if requests exceed 10k/day
  }
}

# ============================================================================
# DATA SOURCES
# ============================================================================

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# ============================================================================
# KMS KEY FOR ENCRYPTION
# ============================================================================

resource "aws_kms_key" "backup_encryption" {
  description             = "KMS key for ${var.company_name} daily backup encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true

  tags = merge(local.common_tags, { Name = "${var.company_name}-backup-encryption-key" })
}

resource "aws_kms_alias" "backup_encryption" {
  name          = "alias/${var.company_name}-backup-encryption"
  target_key_id = aws_kms_key.backup_encryption.key_id
}

# ============================================================================
# S3 BUCKET AND CONFIGURATION
# ============================================================================

resource "aws_s3_bucket" "backup_bucket" {
  bucket = local.bucket_name

  tags = merge(local.common_tags, { Name = local.bucket_name })
}

resource "aws_s3_bucket_versioning" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.backup_encryption.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_lifecycle_configuration" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id

  rule {
    id     = "delete-old-backups"
    status = "Enabled"

    expiration {
      days = var.backup_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }

    abort_incomplete_multipart_upload {
      days_after_initiation = 1
    }
  }
}

resource "aws_s3_bucket_metric" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id
  name   = "entire-bucket"
}

# ============================================================================
# S3 BUCKET POLICY (dynamic IAM principal)
# ============================================================================

data "aws_iam_policy_document" "backup_bucket_policy" {
  # Always deny insecure transport
  statement {
    sid    = "DenyInsecureConnections"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions   = ["s3:*"]
    resources = [aws_s3_bucket.backup_bucket.arn, "${aws_s3_bucket.backup_bucket.arn}/*"]

    condition {
      test     = "Bool"
      variable = "aws:SecureTransport"
      values   = ["false"]
    }
  }

  # Only include IAM role access if roles are provided
  dynamic "statement" {
    for_each = length(var.allowed_backup_roles) > 0 ? [1] : []
    content {
      sid    = "AllowBackupRoleAccess"
      effect = "Allow"

      principals {
        type        = "AWS"
        identifiers = var.allowed_backup_roles
      }

      actions = [
        "s3:PutObject",
        "s3:GetObject",
        "s3:ListBucket"
      ]

      resources = [
        aws_s3_bucket.backup_bucket.arn,
        "${aws_s3_bucket.backup_bucket.arn}/*"
      ]
    }
  }

  # Always enforce KMS encryption
  statement {
    sid    = "RequireKMSEncryption"
    effect = "Deny"

    principals {
      type        = "*"
      identifiers = ["*"]
    }

    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.backup_bucket.arn}/*"]

    condition {
      test     = "StringNotEquals"
      variable = "s3:x-amz-server-side-encryption"
      values   = ["aws:kms"]
    }
  }
}

resource "aws_s3_bucket_policy" "backup_bucket" {
  bucket = aws_s3_bucket.backup_bucket.id
  policy = data.aws_iam_policy_document.backup_bucket_policy.json
}

# ============================================================================
# EVENTBRIDGE SCHEDULING
# ============================================================================

resource "aws_cloudwatch_event_rule" "backup_schedule" {
  name                = "${var.company_name}-daily-backup-schedule"
  description         = "Daily backup schedule"
  schedule_expression = var.backup_schedule

  tags = local.common_tags
}

# ============================================================================
# CLOUDWATCH ALARMS + SNS
# ============================================================================

resource "aws_sns_topic" "backup_alerts" {
  name = "${var.company_name}-backup-alerts"
  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "backup_alerts_email" {
  topic_arn = aws_sns_topic.backup_alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

resource "aws_cloudwatch_metric_alarm" "bucket_size" {
  alarm_name          = "${var.company_name}-backup-bucket-size"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BucketSizeBytes"
  namespace           = "AWS/S3"
  period              = 86400
  statistic           = "Average"
  threshold           = local.alarm_thresholds.bucket_size_gb * 1073741824
  alarm_description   = "Alert when backup bucket exceeds ${local.alarm_thresholds.bucket_size_gb}GB"
  alarm_actions       = [aws_sns_topic.backup_alerts.arn]

  dimensions = {
    BucketName  = aws_s3_bucket.backup_bucket.id
    StorageType = "StandardStorage"
  }

  tags = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "bucket_requests" {
  alarm_name          = "${var.company_name}-backup-bucket-requests"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AllRequests"
  namespace           = "AWS/S3"
  period              = 3600
  statistic           = "Sum"
  threshold           = local.alarm_thresholds.daily_requests / 24
  alarm_description   = "Alert when request rate is unusually high"
  alarm_actions       = [aws_sns_topic.backup_alerts.arn]

  dimensions = {
    BucketName = aws_s3_bucket.backup_bucket.id
  }

  treat_missing_data = "notBreaching"
  tags              = local.common_tags
}

# ============================================================================
# OUTPUTS
# ============================================================================

output "backup_bucket_name" {
  description = "Name of the S3 backup bucket"
  value       = aws_s3_bucket.backup_bucket.id
}

output "backup_bucket_arn" {
  description = "ARN of the S3 backup bucket"
  value       = aws_s3_bucket.backup_bucket.arn
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.backup_encryption.arn
}

output "eventbridge_rule_arn" {
  description = "ARN of the EventBridge scheduling rule"
  value       = aws_cloudwatch_event_rule.backup_schedule.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.backup_alerts.arn
}

output "cloudwatch_alarms" {
  description = "Map of CloudWatch alarm ARNs"
  value = {
    bucket_size     = aws_cloudwatch_metric_alarm.bucket_size.arn
    bucket_requests = aws_cloudwatch_metric_alarm.bucket_requests.arn
  }
}

output "backup_schedule" {
  description = "Cron expression for backup schedule"
  value       = var.backup_schedule
}

output "retention_days" {
  description = "Number of days backups are retained"
  value       = var.backup_retention_days
}

```

# provider.tf

```hcl

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
