# Terraform Infrastructure Response

Here's the complete Terraform configuration for a secure and auditable S3 bucket infrastructure:

## provider.tf
```hcl
terraform {
  required_version = ">= 1.4.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = ">= 5.0"
    }
  }

  backend "s3" {}
}

provider "aws" {
  region = var.aws_region
}
```

## variables.tf
```hcl
variable "aws_region" {
  description = "AWS provider region"
  type        = string
  default     = "us-west-2"
}

variable "bucket_name" {
  description = "Name of the secure S3 bucket"
  type        = string
  default     = "secure-audit-bucket-trainr902"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name for resource tagging"
  type        = string
  default     = "secure-s3-infrastructure"
}
```

## kms.tf
```hcl
# Customer-managed KMS key for S3 encryption
resource "aws_kms_key" "s3_encryption_key" {
  description             = "KMS key for S3 bucket encryption with DSSE-KMS"
  deletion_window_in_days = 7
  enable_key_rotation     = true
  multi_region            = false

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
        Sid    = "Allow S3 Service"
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
        Condition = {
          StringEquals = {
            "kms:ViaService" = "s3.${var.aws_region}.amazonaws.com"
          }
        }
      },
      {
        Sid    = "Allow CloudTrail Service"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey*",
          "kms:ReEncrypt*",
          "kms:CreateGrant",
          "kms:DescribeKey"
        ]
        Resource = "*"
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-s3-encryption-key"
    Environment = var.environment
    Purpose     = "S3-DSSE-KMS-Encryption"
    ManagedBy   = "terraform"
  }
}

resource "aws_kms_alias" "s3_encryption_key_alias" {
  name          = "alias/${var.project_name}-s3-key"
  target_key_id = aws_kms_key.s3_encryption_key.key_id
}

data "aws_caller_identity" "current" {}
```

## s3.tf
```hcl
# Secure S3 bucket with comprehensive configuration
resource "aws_s3_bucket" "secure_bucket" {
  bucket        = var.bucket_name
  force_destroy = false

  tags = {
    Name        = var.bucket_name
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "Secure-Auditable-Storage"
    ManagedBy   = "terraform"
    Compliance  = "High-Security"
  }
}

# Block all public access
resource "aws_s3_bucket_public_access_block" "secure_bucket_pab" {
  bucket = aws_s3_bucket.secure_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Enable versioning
resource "aws_s3_bucket_versioning" "secure_bucket_versioning" {
  bucket = aws_s3_bucket.secure_bucket.id
  
  versioning_configuration {
    status = "Enabled"
  }
}

# Server-side encryption with DSSE-KMS
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_bucket_encryption" {
  bucket = aws_s3_bucket.secure_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption_key.arn
      sse_algorithm     = "aws:kms:dsse"
    }
    bucket_key_enabled = true
  }
}

# Lifecycle configuration for data retention
resource "aws_s3_bucket_lifecycle_configuration" "secure_bucket_lifecycle" {
  bucket = aws_s3_bucket.secure_bucket.id
  
  rule {
    id     = "comprehensive_lifecycle_rule"
    status = "Enabled"

    # Transition to Intelligent Tiering
    transition {
      days          = 30
      storage_class = "INTELLIGENT_TIERING"
    }

    # Transition to Glacier
    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    # Transition to Deep Archive
    transition {
      days          = 180
      storage_class = "DEEP_ARCHIVE"
    }

    # Delete objects after 7 years
    expiration {
      days = 2555
    }

    # Clean up incomplete multipart uploads
    abort_incomplete_multipart_upload {
      days_after_initiation = 7
    }

    # Lifecycle for non-current versions
    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "INTELLIGENT_TIERING"
    }

    noncurrent_version_transition {
      noncurrent_days = 90
      storage_class   = "GLACIER"
    }

    noncurrent_version_transition {
      noncurrent_days = 180
      storage_class   = "DEEP_ARCHIVE"
    }

    noncurrent_version_expiration {
      noncurrent_days = 2555
    }
  }
}

# Bucket policy for TLS enforcement
resource "aws_s3_bucket_policy" "secure_bucket_policy" {
  bucket = aws_s3_bucket.secure_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.secure_bucket.arn,
          "${aws_s3_bucket.secure_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "DenyUnencryptedUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.secure_bucket.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms:dsse"
          }
        }
      }
    ]
  })

  depends_on = [aws_s3_bucket_public_access_block.secure_bucket_pab]
}
```

## cloudtrail.tf
```hcl
# CloudTrail S3 bucket for logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = "${var.bucket_name}-cloudtrail-logs"
  force_destroy = true

  tags = {
    Name        = "${var.bucket_name}-cloudtrail-logs"
    Environment = var.environment
    Project     = var.project_name
    Purpose     = "CloudTrail-Logs"
    ManagedBy   = "terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail S3 bucket policy
resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
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

  depends_on = [aws_s3_bucket_public_access_block.cloudtrail_logs_pab]
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
  name              = "/aws/cloudtrail/${var.project_name}"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.s3_encryption_key.arn

  tags = {
    Name        = "${var.project_name}-cloudtrail-logs"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# IAM role for CloudTrail
resource "aws_iam_role" "cloudtrail_role" {
  name = "${var.project_name}-cloudtrail-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
      }
    ]
  })

  tags = {
    Name        = "${var.project_name}-cloudtrail-role"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# IAM policy for CloudTrail to write to CloudWatch
resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name = "${var.project_name}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:DescribeLogStreams"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
      }
    ]
  })
}

# CloudTrail configuration
resource "aws_cloudtrail" "s3_audit_trail" {
  name                         = "${var.project_name}-audit-trail"
  s3_bucket_name               = aws_s3_bucket.cloudtrail_logs.bucket
  s3_key_prefix               = "cloudtrail-logs"
  include_global_service_events = true
  is_multi_region_trail        = false
  enable_logging               = true
  enable_log_file_validation   = true
  kms_key_id                  = aws_kms_key.s3_encryption_key.arn

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_role.arn

  # Data events for S3 bucket
  event_selector {
    read_write_type                 = "All"
    include_management_events       = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.secure_bucket.arn}/*"]
    }

    data_resource {
      type   = "AWS::S3::Bucket"
      values = [aws_s3_bucket.secure_bucket.arn]
    }
  }

  tags = {
    Name        = "${var.project_name}-audit-trail"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }

  depends_on = [
    aws_s3_bucket_policy.cloudtrail_logs_policy,
    aws_iam_role_policy.cloudtrail_logs_policy
  ]
}
```

## cloudwatch.tf
```hcl
# CloudWatch Alarms for security monitoring
resource "aws_cloudwatch_metric_alarm" "unauthorized_s3_access" {
  alarm_name          = "${var.project_name}-unauthorized-s3-access"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "CloudWatchLogs"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors unauthorized S3 access attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  dimensions = {
    LogGroupName = aws_cloudwatch_log_group.cloudtrail_log_group.name
  }

  tags = {
    Name        = "${var.project_name}-unauthorized-access-alarm"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Metric filter for unauthorized access
resource "aws_cloudwatch_log_metric_filter" "unauthorized_access_filter" {
  name           = "${var.project_name}-unauthorized-access"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_log_group.name
  pattern        = "[timestamp, request_id, event_type=\"AwsApiCall\", event_source=\"s3.amazonaws.com\", event_name=\"GetObject\" || event_name=\"PutObject\", error_code=\"AccessDenied\" || error_code=\"Forbidden\"]"

  metric_transformation {
    name      = "UnauthorizedS3Access"
    namespace = "Security/S3"
    value     = "1"
  }
}

# SNS topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${var.project_name}-security-alerts"
  kms_master_key_id = aws_kms_key.s3_encryption_key.arn

  tags = {
    Name        = "${var.project_name}-security-alerts"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# CloudWatch alarm for bucket policy violations
resource "aws_cloudwatch_metric_alarm" "bucket_policy_violations" {
  alarm_name          = "${var.project_name}-bucket-policy-violations"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "PolicyViolations"
  namespace           = "Security/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors bucket policy violations"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name        = "${var.project_name}-policy-violations-alarm"
    Environment = var.environment
    Project     = var.project_name
    ManagedBy   = "terraform"
  }
}

# Log metric filter for bucket policy violations
resource "aws_cloudwatch_log_metric_filter" "policy_violations_filter" {
  name           = "${var.project_name}-policy-violations"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_log_group.name
  pattern        = "[timestamp, request_id, event_type=\"AwsApiCall\", event_source=\"s3.amazonaws.com\", error_code=\"AccessDenied\"]"

  metric_transformation {
    name      = "PolicyViolations"
    namespace = "Security/S3"
    value     = "1"
  }
}
```

## outputs.tf
```hcl
output "s3_bucket_name" {
  description = "Name of the created S3 bucket"
  value       = aws_s3_bucket.secure_bucket.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = aws_s3_bucket.secure_bucket.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.s3_encryption_key.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.s3_encryption_key.arn
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.s3_audit_trail.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail_log_group.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}
```