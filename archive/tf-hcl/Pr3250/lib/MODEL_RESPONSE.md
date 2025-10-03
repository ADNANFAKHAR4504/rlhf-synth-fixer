# Healthcare Data Storage Infrastructure

This Terraform configuration creates a secure storage system for patient records with encryption, audit logging, and compliance features.

## Files Generated

### variables.tf

```hcl
# variables.tf

variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-2"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "Production"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for patient data"
  type        = string
  default     = "healthcare-patient-records-secure"
}

variable "kms_key_alias" {
  description = "Alias for the KMS key"
  type        = string
  default     = "alias/patient-data-encryption"
}

variable "cloudtrail_name" {
  description = "Name of the CloudTrail"
  type        = string
  default     = "healthcare-audit-trail"
}

variable "cloudtrail_bucket_name" {
  description = "Name of the S3 bucket for CloudTrail logs"
  type        = string
  default     = "healthcare-cloudtrail-logs"
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
  default     = "security@healthcare.example"
}

variable "lifecycle_transition_days" {
  description = "Days before transitioning to Glacier"
  type        = number
  default     = 180
}

variable "object_lock_days" {
  description = "Object lock retention period in days"
  type        = number
  default     = 365
}

variable "tags" {
  description = "Default tags for all resources"
  type        = map(string)
  default = {
    Environment = "Production"
    Purpose     = "PatientData"
    ManagedBy   = "Terraform"
    Compliance  = "HIPAA"
  }
}
```

### main.tf

```hcl
# main.tf

# Data source for current AWS account
data "aws_caller_identity" "current" {}

# KMS Key for S3 encryption
resource "aws_kms_key" "patient_data" {
  description             = "KMS key for patient data encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30

  tags = merge(
    var.tags,
    {
      Name = "patient-data-encryption-key"
    }
  )
}

resource "aws_kms_alias" "patient_data" {
  name          = var.kms_key_alias
  target_key_id = aws_kms_key.patient_data.key_id
}

# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = "${var.cloudtrail_bucket_name}-${data.aws_caller_identity.current.account_id}"
  force_destroy = false

  tags = merge(
    var.tags,
    {
      Name = "CloudTrail Logs Bucket"
    }
  )
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
      sse_algorithm = "AES256"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
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
        Resource = "${aws_s3_bucket.cloudtrail_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# Main S3 Bucket for Patient Data with Object Lock
resource "aws_s3_bucket" "patient_data" {
  bucket        = "${var.bucket_name}-${data.aws_caller_identity.current.account_id}"
  force_destroy = false

  object_lock_enabled = true

  tags = merge(
    var.tags,
    {
      Name = "Patient Data Storage"
    }
  )
}

# Object Lock Configuration
resource "aws_s3_bucket_object_lock_configuration" "patient_data" {
  bucket = aws_s3_bucket.patient_data.id

  rule {
    default_retention {
      mode = "GOVERNANCE"
      days = var.object_lock_days
    }
  }
}

# Enable versioning (required for Object Lock)
resource "aws_s3_bucket_versioning" "patient_data" {
  bucket = aws_s3_bucket.patient_data.id

  versioning_configuration {
    status = "Enabled"
  }
}

# KMS encryption for patient data bucket
resource "aws_s3_bucket_server_side_encryption_configuration" "patient_data" {
  bucket = aws_s3_bucket.patient_data.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.patient_data.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "patient_data" {
  bucket = aws_s3_bucket.patient_data.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Lifecycle policy
resource "aws_s3_bucket_lifecycle_configuration" "patient_data" {
  bucket = aws_s3_bucket.patient_data.id

  rule {
    id     = "transition-to-glacier"
    status = "Enabled"

    transition {
      days          = var.lifecycle_transition_days
      storage_class = "DEEP_ARCHIVE"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 365
      storage_class   = "DEEP_ARCHIVE"
    }
  }
}

# Request metrics for CloudWatch
resource "aws_s3_bucket_metric" "patient_data" {
  bucket = aws_s3_bucket.patient_data.id
  name   = "entire-bucket"
}

# IAM Role for accessing patient data
resource "aws_iam_role" "patient_data_access" {
  name = "patient-data-access-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ec2.amazonaws.com"
        }
      }
    ]
  })

  tags = var.tags
}

# IAM Policy for patient data access
resource "aws_iam_policy" "patient_data_access" {
  name        = "patient-data-access-policy"
  description = "Policy for accessing patient data S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket",
          "s3:GetObjectVersion",
          "s3:GetObjectVersionTagging",
          "s3:GetObjectRetention",
          "s3:GetObjectLegalHold"
        ]
        Resource = [
          aws_s3_bucket.patient_data.arn,
          "${aws_s3_bucket.patient_data.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:Encrypt",
          "kms:GenerateDataKey",
          "kms:DescribeKey"
        ]
        Resource = aws_kms_key.patient_data.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "patient_data_access" {
  role       = aws_iam_role.patient_data_access.name
  policy_arn = aws_iam_policy.patient_data_access.arn
}

# CloudTrail for audit logging
resource "aws_cloudtrail" "audit" {
  name                          = var.cloudtrail_name
  s3_bucket_name               = aws_s3_bucket.cloudtrail_logs.id
  include_global_service_events = true
  is_multi_region_trail        = false
  enable_logging               = true

  # Enable CloudTrail Insights
  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  insight_selector {
    insight_type = "ApiErrorRateInsight"
  }

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type = "AWS::S3::Object"
      values = ["${aws_s3_bucket.patient_data.arn}/"]
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "Healthcare Audit Trail"
    }
  )

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs]
}

# SNS Topic for CloudWatch Alarms
resource "aws_sns_topic" "alerts" {
  name = "patient-data-security-alerts"

  tags = var.tags
}

resource "aws_sns_topic_subscription" "alerts_email" {
  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# CloudWatch Alarm for high number of requests
resource "aws_cloudwatch_metric_alarm" "high_request_count" {
  alarm_name          = "patient-data-high-request-count"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name        = "NumberOfObjects"
  namespace          = "AWS/S3"
  period             = "300"
  statistic          = "Average"
  threshold          = "10000"
  alarm_description  = "This metric monitors S3 request count"
  alarm_actions      = [aws_sns_topic.alerts.arn]

  dimensions = {
    BucketName = aws_s3_bucket.patient_data.id
    StorageType = "AllStorageTypes"
  }

  tags = var.tags
}

# CloudWatch Alarm for unauthorized access attempts
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${var.cloudtrail_name}"
  retention_in_days = 90

  tags = var.tags
}

resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "unauthorized-api-calls"
  pattern        = "{ ($.errorCode = *UnauthorizedAccess*) || ($.errorCode = *Forbidden*) }"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "CloudTrail"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls" {
  alarm_name          = "patient-data-unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name        = "UnauthorizedAPICalls"
  namespace          = "CloudTrail"
  period             = "300"
  statistic          = "Sum"
  threshold          = "5"
  alarm_description  = "Alarm when unauthorized API calls exceed threshold"
  alarm_actions      = [aws_sns_topic.alerts.arn]
  treat_missing_data = "notBreaching"

  tags = var.tags
}

# S3 Bucket Policy to restrict access
resource "aws_s3_bucket_policy" "patient_data" {
  bucket = aws_s3_bucket.patient_data.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "DenyUnencryptedObjectUploads"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.patient_data.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "DenyIncorrectEncryptionKey"
        Effect = "Deny"
        Principal = "*"
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.patient_data.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.patient_data.arn
          }
        }
      },
      {
        Sid    = "RestrictToAuthorizedRoles"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.patient_data_access.arn
        }
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.patient_data.arn,
          "${aws_s3_bucket.patient_data.arn}/*"
        ]
      }
    ]
  })
}
```

### outputs.tf

```hcl
# outputs.tf

output "patient_data_bucket_name" {
  description = "Name of the patient data S3 bucket"
  value       = aws_s3_bucket.patient_data.id
}

output "patient_data_bucket_arn" {
  description = "ARN of the patient data S3 bucket"
  value       = aws_s3_bucket.patient_data.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = aws_kms_key.patient_data.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = aws_kms_key.patient_data.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.audit.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.audit.arn
}

output "cloudtrail_bucket_name" {
  description = "Name of the CloudTrail logs bucket"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "iam_role_arn" {
  description = "ARN of the IAM role for patient data access"
  value       = aws_iam_role.patient_data_access.arn
}

output "iam_role_name" {
  description = "Name of the IAM role for patient data access"
  value       = aws_iam_role.patient_data_access.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.alerts.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}
```