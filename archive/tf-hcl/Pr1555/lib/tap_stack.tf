########################
# Variables
########################
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-east-1"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming"
  type        = string
  default     = "dev"
}

variable "bucket_name_prefix" {
  description = "Prefix for S3 bucket name"
  type        = string
  default     = "corpsec-logs"
}

########################
# Data Sources
########################

# Generate a unique bucket name to avoid conflicts
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Current AWS caller identity
data "aws_caller_identity" "current" {}

# Current AWS region
data "aws_region" "current" {}

########################
# KMS Key for Encryption
########################
resource "aws_kms_key" "logs_encryption_key" {
  description             = "KMS key for encrypting logs bucket"
  deletion_window_in_days = 7
  enable_key_rotation     = true

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
          Service = "logs.amazonaws.com"
        }
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:ReEncrypt*",
          "kms:GenerateDataKey*",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "corpSec-logs-kms-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Logs encryption"
    ManagedBy   = "terraform"
  }
}

resource "aws_kms_alias" "logs_key_alias" {
  name          = "alias/corpSec-logs-${var.environment_suffix}"
  target_key_id = aws_kms_key.logs_encryption_key.key_id
}

########################
# S3 Bucket for Logs
########################
resource "aws_s3_bucket" "logs_bucket" {
  bucket        = "${var.bucket_name_prefix}-${var.environment_suffix}-${random_id.bucket_suffix.hex}"
  force_destroy = true # Allow destruction for testing

  tags = {
    Name        = "corpsec-logs-bucket-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Secure log storage"
    ManagedBy   = "terraform"
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "logs_bucket_pab" {
  bucket = aws_s3_bucket.logs_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "logs_bucket_versioning" {
  bucket = aws_s3_bucket.logs_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "logs_bucket_encryption" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.logs_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle configuration
resource "aws_s3_bucket_lifecycle_configuration" "logs_bucket_lifecycle" {
  bucket = aws_s3_bucket.logs_bucket.id

  rule {
    id     = "log_retention"
    status = "Enabled"

    filter {
      prefix = ""
    }

    expiration {
      days = 90
    }

    noncurrent_version_expiration {
      noncurrent_days = 30
    }
  }
}

########################
# IAM Role for Log Writing
########################
resource "aws_iam_role" "log_writer_role" {
  name = "corpSec-log-writer-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["ec2.amazonaws.com", "lambda.amazonaws.com"]
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = {
    Name        = "corpSec-log-writer-role-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Log writing with MFA"
    ManagedBy   = "terraform"
  }
}

# IAM policy for log writing with least privilege
resource "aws_iam_role_policy" "log_writer_policy" {
  name = "corpSec-log-writer-policy-${var.environment_suffix}"
  role = aws_iam_role.log_writer_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.logs_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption"                = "aws:kms"
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.logs_encryption_key.arn
          }
        }
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
        Resource = aws_kms_key.logs_encryption_key.arn
      }
    ]
  })
}

########################
# IAM Role for Log Reading
########################
resource "aws_iam_role" "log_reader_role" {
  name = "corpSec-log-reader-role-${var.environment_suffix}"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = ["ec2.amazonaws.com", "lambda.amazonaws.com"]
        }
      }
    ]
  })

  tags = {
    Name        = "corpSec-log-reader-role-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Log reading"
    ManagedBy   = "terraform"
  }
}

# IAM policy for log reading
resource "aws_iam_role_policy" "log_reader_policy" {
  name = "corpSec-log-reader-policy-${var.environment_suffix}"
  role = aws_iam_role.log_reader_role.id

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
          aws_s3_bucket.logs_bucket.arn,
          "${aws_s3_bucket.logs_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.logs_encryption_key.arn
      }
    ]
  })
}

########################
# CloudWatch Monitoring
########################

# CloudWatch Log Group for monitoring
resource "aws_cloudwatch_log_group" "security_monitoring" {
  name              = "/corpSec/security-monitoring-${var.environment_suffix}"
  retention_in_days = 30
  kms_key_id        = aws_kms_key.logs_encryption_key.arn

  tags = {
    Name        = "corpSec-security-monitoring-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Security monitoring"
    ManagedBy   = "terraform"
  }
}

# CloudTrail for API monitoring
resource "aws_cloudtrail" "security_trail" {
  name           = "corpSec-security-trail-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.logs_bucket.bucket
  s3_key_prefix  = "cloudtrail-logs"

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = ["kms.amazonaws.com", "rdsdata.amazonaws.com"]

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.logs_bucket.arn}/*"]
    }
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_policy]

  tags = {
    Name        = "corpSec-security-trail-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Security audit trail"
    ManagedBy   = "terraform"
  }
}

# Bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_policy" {
  bucket = aws_s3_bucket.logs_bucket.id

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
        Resource = aws_s3_bucket.logs_bucket.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.logs_bucket.arn}/cloudtrail-logs/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudWatch Log Metric Filter for unauthorized access
resource "aws_cloudwatch_log_metric_filter" "unauthorized_access" {
  name           = "corpSec-unauthorized-access-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.security_monitoring.name
  pattern        = "[timestamp, request_id, ip, user=\"ERROR\", event=\"AccessDenied\"]"

  metric_transformation {
    name      = "UnauthorizedAccessAttempts"
    namespace = "CorpSec/Security"
    value     = "1"
  }
}

# CloudWatch Alarm for unauthorized access
resource "aws_cloudwatch_metric_alarm" "unauthorized_access_alarm" {
  alarm_name          = "corpSec-unauthorized-access-${var.environment_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAccessAttempts"
  namespace           = "CorpSec/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors unauthorized access attempts to the logs bucket"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name        = "corpSec-unauthorized-access-alarm-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Security alerting"
    ManagedBy   = "terraform"
  }
}

# SNS Topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "corpSec-security-alerts-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.logs_encryption_key.id

  tags = {
    Name        = "corpSec-security-alerts-${var.environment_suffix}"
    Environment = var.environment_suffix
    Purpose     = "Security notifications"
    ManagedBy   = "terraform"
  }
}

########################
# Outputs
########################
output "bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.logs_bucket.bucket
}

output "bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.logs_bucket.arn
}

output "kms_key_id" {
  description = "KMS key ID used for encryption"
  value       = aws_kms_key.logs_encryption_key.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN used for encryption"
  value       = aws_kms_key.logs_encryption_key.arn
}

output "log_writer_role_arn" {
  description = "ARN of the log writer IAM role (requires MFA)"
  value       = aws_iam_role.log_writer_role.arn
}

output "log_reader_role_arn" {
  description = "ARN of the log reader IAM role"
  value       = aws_iam_role.log_reader_role.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for security monitoring"
  value       = aws_cloudwatch_log_group.security_monitoring.name
}

output "sns_topic_arn" {
  description = "SNS topic ARN for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}
