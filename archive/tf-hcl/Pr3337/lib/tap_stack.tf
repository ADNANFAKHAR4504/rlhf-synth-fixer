# tap_stack.tf - Legal Firm Document Storage System (IDEAL SOLUTION)

# Variables (aws_region already exists in provider.tf)
variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "owner" {
  description = "Owner of the resources"
  type        = string
  default     = "Legal Department"
}

variable "project" {
  description = "Project name"
  type        = string
  default     = "Legal Document Management"
}

variable "document_retention_days" {
  description = "Number of days to retain documents"
  type        = number
  default     = 90
}

variable "log_retention_days" {
  description = "Number of days to retain audit logs"
  type        = number
  default     = 730
}

variable "alarm_sns_topic_arn" {
  description = "SNS topic ARN for CloudWatch alarm notifications"
  type        = string
  default     = ""
}

variable "cloudwatch_alarm_error_threshold" {
  description = "Threshold for 4xx error alarm"
  type        = number
  default     = 10
}

variable "enable_cloudtrail" {
  description = "Enable CloudTrail (set to false if you've reached the 5 trail limit)"
  type        = bool
  default     = false
}

# Data Sources
data "aws_caller_identity" "current" {}

# Random suffix for unique bucket names
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Locals
locals {
  account_id = data.aws_caller_identity.current.account_id
  region     = var.aws_region # Reference to existing variable from provider.tf
  common_tags = {
    Environment = var.environment
    Owner       = var.owner
    Project     = var.project
  }
}

# KMS Key for document encryption
resource "aws_kms_key" "document_key" {
  description             = "KMS key for legal document encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${local.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow S3 to use the key"
        Effect    = "Allow"
        Principal = { Service = "s3.amazonaws.com" }
        Action    = ["kms:Decrypt", "kms:GenerateDataKey"]
        Resource  = "*"
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_kms_alias" "document_key_alias" {
  name          = "alias/legal-documents-key-${local.region}"
  target_key_id = aws_kms_key.document_key.key_id
}

# KMS Key for CloudTrail logs
resource "aws_kms_key" "cloudtrail_key" {
  description             = "KMS key for CloudTrail logs encryption"
  deletion_window_in_days = 30
  enable_key_rotation     = true
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "Enable IAM User Permissions"
        Effect    = "Allow"
        Principal = { AWS = "arn:aws:iam::${local.account_id}:root" }
        Action    = "kms:*"
        Resource  = "*"
      },
      {
        Sid       = "Allow CloudTrail to encrypt logs"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = ["kms:GenerateDataKey*", "kms:DecryptDataKey"]
        Resource  = "*"
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_kms_alias" "cloudtrail_key_alias" {
  name          = "alias/legal-cloudtrail-key-${local.region}"
  target_key_id = aws_kms_key.cloudtrail_key.key_id
}

# S3 Document Bucket
resource "aws_s3_bucket" "document_bucket" {
  bucket = "legal-documents-${local.account_id}-${random_id.bucket_suffix.hex}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_versioning" "document_versioning" {
  bucket = aws_s3_bucket.document_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "document_encryption" {
  bucket = aws_s3_bucket.document_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.document_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "document_lifecycle" {
  bucket = aws_s3_bucket.document_bucket.id
  rule {
    id     = "90-day-retention"
    status = "Enabled"
    filter {}
    expiration {
      days = var.document_retention_days
    }
    noncurrent_version_expiration {
      noncurrent_days = var.document_retention_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "document_bucket_public_access_block" {
  bucket                  = aws_s3_bucket.document_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "document_bucket_policy" {
  bucket = aws_s3_bucket.document_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.document_bucket.arn,
          "${aws_s3_bucket.document_bucket.arn}/*"
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      }
    ]
  })
}

# S3 Log Bucket (no versioning as not requested)
resource "aws_s3_bucket" "log_bucket" {
  bucket = "legal-logs-${local.account_id}-${random_id.bucket_suffix.hex}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_server_side_encryption_configuration" "log_encryption" {
  bucket = aws_s3_bucket.log_bucket.id
  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.cloudtrail_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_lifecycle_configuration" "log_lifecycle" {
  bucket = aws_s3_bucket.log_bucket.id
  rule {
    id     = "log-retention"
    status = "Enabled"
    filter {}
    expiration {
      days = var.log_retention_days
    }
  }
}

resource "aws_s3_bucket_public_access_block" "log_bucket_public_access_block" {
  bucket                  = aws_s3_bucket.log_bucket.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_policy" "log_bucket_policy" {
  bucket = aws_s3_bucket.log_bucket.id
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureTransport"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.log_bucket.arn,
          "${aws_s3_bucket.log_bucket.arn}/*"
        ]
        Condition = {
          Bool = { "aws:SecureTransport" = "false" }
        }
      },
      {
        Sid       = "AWSCloudTrailAclCheck"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = "s3:GetBucketAcl"
        Resource  = aws_s3_bucket.log_bucket.arn
      },
      {
        Sid       = "AWSCloudTrailWrite"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.log_bucket.arn}/cloudtrail/AWSLogs/${local.account_id}/*"
        Condition = {
          StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" }
        }
      },
      {
        Sid       = "S3LogDeliveryAclCheck"
        Effect    = "Allow"
        Principal = { Service = "logging.s3.amazonaws.com" }
        Action    = "s3:GetBucketAcl"
        Resource  = aws_s3_bucket.log_bucket.arn
      },
      {
        Sid       = "S3LogDeliveryWrite"
        Effect    = "Allow"
        Principal = { Service = "logging.s3.amazonaws.com" }
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.log_bucket.arn}/s3-access-logs/*"
        Condition = {
          StringEquals = { "s3:x-amz-acl" = "bucket-owner-full-control" }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_logging" "document_bucket_logging" {
  bucket        = aws_s3_bucket.document_bucket.id
  target_bucket = aws_s3_bucket.log_bucket.id
  target_prefix = "s3-access-logs/"
}

# CloudTrail (optional - disable if you've hit the 5 trail limit)
resource "aws_cloudtrail" "legal_document_trail" {
  count                         = var.enable_cloudtrail ? 1 : 0
  name                          = "legal-documents-trail"
  s3_bucket_name                = aws_s3_bucket.log_bucket.id
  s3_key_prefix                 = "cloudtrail"
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true
  kms_key_id                    = aws_kms_key.cloudtrail_key.arn
  event_selector {
    read_write_type           = "All"
    include_management_events = true
    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.document_bucket.arn}/"]
    }
  }
  tags       = local.common_tags
  depends_on = [aws_s3_bucket_policy.log_bucket_policy]
}

# IAM Policies
resource "aws_iam_policy" "document_read_policy" {
  name        = "LegalDocumentReadPolicy"
  description = "Policy for read-only access to legal documents"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.document_bucket.arn,
          "${aws_s3_bucket.document_bucket.arn}/*"
        ]
      },
      {
        Effect   = "Allow"
        Action   = ["kms:Decrypt", "kms:DescribeKey"]
        Resource = aws_kms_key.document_key.arn
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_policy" "document_write_policy" {
  name        = "LegalDocumentWritePolicy"
  description = "Policy for write access to legal documents"
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:GetObjectVersion",
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [
          aws_s3_bucket.document_bucket.arn,
          "${aws_s3_bucket.document_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.document_key.arn
      }
    ]
  })
  tags = local.common_tags
}

# IAM Roles
resource "aws_iam_role" "document_reader_role" {
  name = "LegalDocumentReaderRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_role" "document_writer_role" {
  name = "LegalDocumentWriterRole"
  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect    = "Allow"
        Principal = { Service = "ec2.amazonaws.com" }
        Action    = "sts:AssumeRole"
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy_attachment" "reader_policy_attachment" {
  role       = aws_iam_role.document_reader_role.name
  policy_arn = aws_iam_policy.document_read_policy.arn
}

resource "aws_iam_role_policy_attachment" "writer_policy_attachment" {
  role       = aws_iam_role.document_writer_role.name
  policy_arn = aws_iam_policy.document_write_policy.arn
}

# CloudWatch Monitoring - Enable S3 Request Metrics (CRITICAL FIX)
resource "aws_s3_bucket_metric" "document_bucket_metrics" {
  bucket = aws_s3_bucket.document_bucket.id
  name   = "EntireBucket"
}

# CloudWatch Alarms
resource "aws_cloudwatch_metric_alarm" "s3_4xx_error_alarm" {
  alarm_name          = "S3-LegalDocuments-4xxErrors"
  alarm_description   = "Alarm when S3 bucket has excessive 4xx errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = var.cloudwatch_alarm_error_threshold
  treat_missing_data  = "notBreaching"
  dimensions = {
    BucketName = aws_s3_bucket.document_bucket.id
    FilterId   = aws_s3_bucket_metric.document_bucket_metrics.name
  }
  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "s3_5xx_error_alarm" {
  alarm_name          = "S3-LegalDocuments-5xxErrors"
  alarm_description   = "Alarm when S3 bucket has server errors"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "5xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 5
  treat_missing_data  = "notBreaching"
  dimensions = {
    BucketName = aws_s3_bucket.document_bucket.id
    FilterId   = aws_s3_bucket_metric.document_bucket_metrics.name
  }
  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "s3_delete_alarm" {
  alarm_name          = "S3-LegalDocuments-UnusualDeletes"
  alarm_description   = "Alarm when unusual number of delete operations detected"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "DeleteRequests"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 50
  treat_missing_data  = "notBreaching"
  dimensions = {
    BucketName = aws_s3_bucket.document_bucket.id
    FilterId   = aws_s3_bucket_metric.document_bucket_metrics.name
  }
  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  tags          = local.common_tags
}

resource "aws_cloudwatch_metric_alarm" "s3_high_request_rate_alarm" {
  alarm_name          = "S3-LegalDocuments-HighRequestRate"
  alarm_description   = "Alarm when request rate is unusually high"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "AllRequests"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 10000
  treat_missing_data  = "notBreaching"
  dimensions = {
    BucketName = aws_s3_bucket.document_bucket.id
    FilterId   = aws_s3_bucket_metric.document_bucket_metrics.name
  }
  alarm_actions = var.alarm_sns_topic_arn != "" ? [var.alarm_sns_topic_arn] : []
  tags          = local.common_tags
}

# Outputs
output "document_bucket_name" {
  description = "Name of the S3 bucket for legal documents"
  value       = aws_s3_bucket.document_bucket.id
}

output "document_bucket_arn" {
  description = "ARN of the S3 bucket for legal documents"
  value       = aws_s3_bucket.document_bucket.arn
}

output "document_bucket_region" {
  description = "Region where the document bucket is deployed"
  value       = local.region
}

output "log_bucket_name" {
  description = "Name of the S3 bucket for audit logs"
  value       = aws_s3_bucket.log_bucket.id
}

output "document_kms_key_id" {
  description = "ID of the KMS key for document encryption"
  value       = aws_kms_key.document_key.key_id
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail trail (empty if disabled)"
  value       = var.enable_cloudtrail ? aws_cloudtrail.legal_document_trail[0].name : ""
}

output "document_reader_role_arn" {
  description = "ARN of the IAM role for read-only access"
  value       = aws_iam_role.document_reader_role.arn
}

output "document_writer_role_arn" {
  description = "ARN of the IAM role for write access"
  value       = aws_iam_role.document_writer_role.arn
}

output "cloudwatch_alarms" {
  description = "CloudWatch alarm names for monitoring"
  value = {
    errors_4xx        = aws_cloudwatch_metric_alarm.s3_4xx_error_alarm.alarm_name
    errors_5xx        = aws_cloudwatch_metric_alarm.s3_5xx_error_alarm.alarm_name
    unusual_deletes   = aws_cloudwatch_metric_alarm.s3_delete_alarm.alarm_name
    high_request_rate = aws_cloudwatch_metric_alarm.s3_high_request_rate_alarm.alarm_name
  }
}

