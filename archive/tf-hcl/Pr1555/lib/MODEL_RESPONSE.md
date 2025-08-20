# Secure Logging Infrastructure with Terraform

Below is a complete Terraform configuration that establishes a secure logging environment on AWS, meeting all the specified requirements.

## Complete Terraform Configuration

```hcl
# terraform/main.tf

terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region
}

# Variables
variable "aws_region" {
  description = "AWS region for resources"
  type        = string
  default     = "us-east-1"
}

variable "bucket_name" {
  description = "Name of the S3 bucket for logs"
  type        = string
  default     = "corpsec-secure-logs"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

# Data source to check if bucket already exists
data "aws_s3_bucket" "existing_bucket" {
  bucket = var.bucket_name
  count  = var.check_existing_bucket ? 1 : 0
}

variable "check_existing_bucket" {
  description = "Check if bucket already exists"
  type        = bool
  default     = true
}

# Local values for resource naming
locals {
  prefix = "corpSec"
  common_tags = {
    Environment = var.environment
    Project     = "SecureLogging"
    ManagedBy   = "Terraform"
  }
}

# KMS Key for S3 encryption
resource "aws_kms_key" "s3_encryption_key" {
  description             = "${local.prefix} S3 encryption key for secure logging"
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
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-s3-encryption-key"
  })
}

resource "aws_kms_alias" "s3_encryption_key_alias" {
  name          = "alias/${local.prefix}-s3-encryption-key"
  target_key_id = aws_kms_key.s3_encryption_key.key_id
}

# Get current AWS account ID and caller identity
data "aws_caller_identity" "current" {}

# S3 Bucket for secure logging
resource "aws_s3_bucket" "secure_logs" {
  count  = var.check_existing_bucket ? (length(data.aws_s3_bucket.existing_bucket) > 0 ? 0 : 1) : 1
  bucket = var.bucket_name

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-secure-logs-bucket"
  })

  lifecycle {
    prevent_destroy = true
  }
}

# Use existing bucket if it exists, otherwise use the newly created one
locals {
  bucket_id = var.check_existing_bucket ? (
    length(data.aws_s3_bucket.existing_bucket) > 0 ? 
    data.aws_s3_bucket.existing_bucket[0].id : 
    aws_s3_bucket.secure_logs[0].id
  ) : aws_s3_bucket.secure_logs[0].id
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "secure_logs_versioning" {
  bucket = local.bucket_id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_logs_encryption" {
  bucket = local.bucket_id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_encryption_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "secure_logs_pab" {
  bucket = local.bucket_id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for secure access
resource "aws_s3_bucket_policy" "secure_logs_policy" {
  bucket = local.bucket_id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyInsecureConnections"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          "arn:aws:s3:::${var.bucket_name}",
          "arn:aws:s3:::${var.bucket_name}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid    = "AllowLoggingServiceAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.logging_service_role.arn
        }
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "arn:aws:s3:::${var.bucket_name}/*"
      },
      {
        Sid    = "AllowReadOnlyAccess"
        Effect = "Allow"
        Principal = {
          AWS = aws_iam_role.log_reader_role.arn
        }
        Action = [
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.bucket_name}",
          "arn:aws:s3:::${var.bucket_name}/*"
        ]
      }
    ]
  })
}

# IAM Role for logging service (write access)
resource "aws_iam_role" "logging_service_role" {
  name = "${local.prefix}-logging-service-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "lambda.amazonaws.com",
            "logs.amazonaws.com"
          ]
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-logging-service-role"
  })
}

# IAM Policy for logging service
resource "aws_iam_role_policy" "logging_service_policy" {
  name = "${local.prefix}-logging-service-policy"
  role = aws_iam_role.logging_service_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "arn:aws:s3:::${var.bucket_name}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3_encryption_key.arn
      }
    ]
  })
}

# IAM Role for log readers (read-only access)
resource "aws_iam_role" "log_reader_role" {
  name = "${local.prefix}-log-reader-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = [
            "ec2.amazonaws.com",
            "lambda.amazonaws.com"
          ]
        }
      }
    ]
  })

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-log-reader-role"
  })
}

# IAM Policy for log readers
resource "aws_iam_role_policy" "log_reader_policy" {
  name = "${local.prefix}-log-reader-policy"
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
          "arn:aws:s3:::${var.bucket_name}",
          "arn:aws:s3:::${var.bucket_name}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.s3_encryption_key.arn
      }
    ]
  })
}

# IAM Group for users requiring write access (with MFA enforcement)
resource "aws_iam_group" "log_writers" {
  name = "${local.prefix}-log-writers"
}

# IAM Policy for log writers group with MFA enforcement
resource "aws_iam_group_policy" "log_writers_policy" {
  name  = "${local.prefix}-log-writers-policy"
  group = aws_iam_group.log_writers.name

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl",
          "s3:GetObject",
          "s3:ListBucket"
        ]
        Resource = [
          "arn:aws:s3:::${var.bucket_name}",
          "arn:aws:s3:::${var.bucket_name}/*"
        ]
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "3600"
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Encrypt",
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3_encryption_key.arn
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
        }
      }
    ]
  })
}

# CloudWatch Log Group for monitoring
resource "aws_cloudwatch_log_group" "security_monitoring" {
  name              = "/aws/${local.prefix}/security-monitoring"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.s3_encryption_key.arn

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-security-monitoring-logs"
  })
}

# CloudTrail for API monitoring
resource "aws_cloudtrail" "security_trail" {
  name           = "${local.prefix}-security-trail"
  s3_bucket_name = local.bucket_id
  s3_key_prefix  = "cloudtrail-logs"

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["arn:aws:s3:::${var.bucket_name}/*"]
    }

    data_resource {
      type   = "AWS::S3::Bucket"
      values = ["arn:aws:s3:::${var.bucket_name}"]
    }
  }

  depends_on = [aws_s3_bucket_policy.secure_logs_policy]

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-security-trail"
  })
}

# CloudWatch Metric Filter for unauthorized access attempts
resource "aws_cloudwatch_log_metric_filter" "unauthorized_access" {
  name           = "${local.prefix}-unauthorized-access-attempts"
  log_group_name = aws_cloudwatch_log_group.security_monitoring.name
  pattern        = "[timestamp, request_id, event_type=\"ERROR\", event_name=\"AccessDenied\" || event_name=\"InvalidUserID.NotFound\" || event_name=\"SigninFailure\"]"

  metric_transformation {
    name      = "UnauthorizedAccessAttempts"
    namespace = "Security/Logging"
    value     = "1"
  }
}

# CloudWatch Alarm for unauthorized access attempts
resource "aws_cloudwatch_metric_alarm" "unauthorized_access_alarm" {
  alarm_name          = "${local.prefix}-unauthorized-access-alarm"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAccessAttempts"
  namespace           = "Security/Logging"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors unauthorized access attempts to the secure logging bucket"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-unauthorized-access-alarm"
  })
}

# SNS Topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.prefix}-security-alerts"
  kms_master_key_id = aws_kms_key.s3_encryption_key.id

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-security-alerts"
  })
}

# CloudWatch Event Rule for S3 access monitoring
resource "aws_cloudwatch_event_rule" "s3_access_monitoring" {
  name        = "${local.prefix}-s3-access-monitoring"
  description = "Monitor S3 access events for the secure logging bucket"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      eventName = [
        "GetObject",
        "PutObject",
        "DeleteObject",
        "GetBucketAcl",
        "PutBucketAcl"
      ]
      requestParameters = {
        bucketName = [var.bucket_name]
      }
    }
  })

  tags = merge(local.common_tags, {
    Name = "${local.prefix}-s3-access-monitoring"
  })
}

# CloudWatch Event Target
resource "aws_cloudwatch_event_target" "sns_target" {
  rule      = aws_cloudwatch_event_rule.s3_access_monitoring.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "security_alerts_policy" {
  arn = aws_sns_topic.security_alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

# Outputs
output "s3_bucket_name" {
  description = "Name of the created S3 bucket"
  value       = local.bucket_id
}

output "s3_bucket_arn" {
  description = "ARN of the created S3 bucket"
  value       = "arn:aws:s3:::${local.bucket_id}"
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.s3_encryption_key.key_id
}

output "logging_service_role_arn" {
  description = "ARN of the logging service IAM role"
  value       = aws_iam_role.logging_service_role.arn
}

output "log_reader_role_arn" {
  description = "ARN of the log reader IAM role"
  value       = aws_iam_role.log_reader_role.arn
}

output "log_writers_group_name" {
  description = "Name of the IAM group for log writers"
  value       = aws_iam_group.log_writers.name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail for monitoring"
  value       = aws_cloudtrail.security_trail.arn
}
```

## Key Features Explained

### 1. **Encryption (In Transit & At Rest)**
- **At Rest**: Uses AWS KMS with customer-managed keys for S3 server-side encryption
- **In Transit**: Enforced through S3 bucket policy that denies non-HTTPS requests

### 2. **Principle of Least Privilege**
- Separate IAM roles for different access patterns:
  - `logging_service_role`: Write-only access for services
  - `log_reader_role`: Read-only access for consumers
  - `log_writers` group: Write access for users with MFA enforcement

### 3. **Bucket Existence Check**
- Uses data source to check if bucket exists before creation
- Conditional resource creation prevents overwrites
- Configurable via `check_existing_bucket` variable

### 4. **Versioning**
- S3 bucket versioning enabled for safe updates and rollbacks
- Lifecycle prevention on bucket to avoid accidental deletion

### 5. **Monitoring & Alerting**
- CloudTrail for comprehensive API logging
- CloudWatch Log Groups with encryption
- Metric filters for unauthorized access detection
- CloudWatch Alarms with SNS notifications
- EventBridge rules for real-time S3 access monitoring

### 6. **MFA Enforcement**
- IAM policies require MFA for write access
- MFA session age limitation (1 hour)
- Applied to both user groups and service roles

### 7. **Security Best Practices**
- Public access completely blocked
- KMS key rotation enabled
- Resource tagging for governance
- Secure transport enforcement

## Deployment Instructions

1. **Initialize Terraform:**
```bash
terraform init
```

2. **Plan the deployment:**
```bash
terraform plan
```

3. **Apply the configuration:**
```bash
terraform apply
```

4. **Configure SNS subscriptions** (post-deployment):
```bash
aws sns subscribe --topic-arn <sns-topic-arn> --protocol email --notification-endpoint your-email@company.com
```

This configuration provides a production-ready, secure logging infrastructure that meets all specified requirements and follows AWS security best practices.