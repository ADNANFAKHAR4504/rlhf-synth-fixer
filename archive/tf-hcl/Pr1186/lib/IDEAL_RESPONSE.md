# AWS Security Logging Infrastructure - Terraform Implementation

I'll help you create a comprehensive and secure AWS logging setup with Terraform. Here are the optimized configurations:

## provider.tf

```hcl
terraform {
  required_version = ">= 1.0"
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Environment = var.environment
      Project     = "corpSec-logging"
      ManagedBy   = "terraform"
    }
  }
}

variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "environment_suffix" {
  description = "Environment suffix for resource naming to avoid conflicts"
  type        = string
  default     = ""
}

variable "check_existing_bucket" {
  description = "Whether to check for existing bucket"
  type        = bool
  default     = false
}
```

## main.tf

```hcl
# Data source to get current AWS account ID and region
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Generate a random suffix to ensure bucket name uniqueness
resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# Check if the bucket already exists
data "aws_s3_bucket" "existing_bucket" {
  bucket = "corpsec-secure-logs-${local.environment_suffix}-${random_id.bucket_suffix.hex}"
  count  = var.check_existing_bucket ? 1 : 0
}

locals {
  environment_suffix = var.environment_suffix != "" ? var.environment_suffix : "dev"
  bucket_name        = "corpsec-secure-logs-${local.environment_suffix}-${random_id.bucket_suffix.hex}"
  account_id         = data.aws_caller_identity.current.account_id
}

# KMS Key for S3 bucket encryption
resource "aws_kms_key" "log_bucket_key" {
  description             = "KMS key for corpSec-${local.environment_suffix} log bucket encryption"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "Enable IAM User Permissions"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
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
          "kms:DescribeKey"
        ]
        Resource = "*"
      },
      {
        Sid    = "Allow CloudWatch Logs"
        Effect = "Allow"
        Principal = {
          Service = "logs.${data.aws_region.current.name}.amazonaws.com"
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
    Name = "corpSec-${local.environment_suffix}-log-bucket-key"
  }
}

resource "aws_kms_alias" "log_bucket_key_alias" {
  name          = "alias/corpSec-${local.environment_suffix}-log-bucket-key"
  target_key_id = aws_kms_key.log_bucket_key.key_id
}

# S3 Bucket for secure logging
resource "aws_s3_bucket" "secure_log_bucket" {
  bucket = local.bucket_name

  tags = {
    Name       = "corpSec-${local.environment_suffix}-secure-logs"
    Purpose    = "Security logging and audit trails"
    Compliance = "SOC2-PCI-DSS"
  }

  lifecycle {
    prevent_destroy = false
  }
}

# S3 Bucket Versioning
resource "aws_s3_bucket_versioning" "log_bucket_versioning" {
  bucket = aws_s3_bucket.secure_log_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket Server-side Encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "log_bucket_encryption" {
  bucket = aws_s3_bucket.secure_log_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.log_bucket_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket Public Access Block
resource "aws_s3_bucket_public_access_block" "log_bucket_pab" {
  bucket = aws_s3_bucket.secure_log_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Lifecycle Configuration
resource "aws_s3_bucket_lifecycle_configuration" "log_bucket_lifecycle" {
  bucket = aws_s3_bucket.secure_log_bucket.id

  rule {
    id     = "log_retention_policy"
    status = "Enabled"

    filter {
      prefix = "logs/"
    }

    noncurrent_version_expiration {
      noncurrent_days = 90
    }

    transition {
      days          = 30
      storage_class = "STANDARD_IA"
    }

    transition {
      days          = 90
      storage_class = "GLACIER"
    }

    transition {
      days          = 365
      storage_class = "DEEP_ARCHIVE"
    }
  }
}

# S3 Bucket Notification for EventBridge
resource "aws_s3_bucket_notification" "log_bucket_notification" {
  bucket      = aws_s3_bucket.secure_log_bucket.id
  eventbridge = true

  depends_on = [aws_s3_bucket_policy.log_bucket_policy]
}

# IAM Role for Log Writers (requires MFA)
resource "aws_iam_role" "log_writer_role" {
  name = "corpSec-${local.environment_suffix}-log-writer-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
        }
        Condition = {
          Bool = {
            "aws:MultiFactorAuthPresent" = "true"
          }
          NumericLessThan = {
            "aws:MultiFactorAuthAge" = "3600"
          }
        }
      }
    ]
  })

  tags = {
    Name = "corpSec-${local.environment_suffix}-log-writer-role"
  }
}

# IAM Policy for Log Writers
resource "aws_iam_policy" "log_writer_policy" {
  name        = "corpSec-${local.environment_suffix}-log-writer-policy"
  description = "Policy for writing logs to secure S3 bucket"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:PutObject",
          "s3:PutObjectAcl"
        ]
        Resource = "${aws_s3_bucket.secure_log_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-server-side-encryption"                = "aws:kms"
            "s3:x-amz-server-side-encryption-aws-kms-key-id" = aws_kms_key.log_bucket_key.arn
          }
        }
      },
      {
        Effect = "Allow"
        Action = [
          "kms:GenerateDataKey",
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.log_bucket_key.arn
      }
    ]
  })
}

# Attach policy to role
resource "aws_iam_role_policy_attachment" "log_writer_attachment" {
  role       = aws_iam_role.log_writer_role.name
  policy_arn = aws_iam_policy.log_writer_policy.arn
}

# IAM Role for Log Readers (least privilege)
resource "aws_iam_role" "log_reader_role" {
  name = "corpSec-${local.environment_suffix}-log-reader-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          AWS = "arn:aws:iam::${local.account_id}:root"
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
    Name = "corpSec-${local.environment_suffix}-log-reader-role"
  }
}

# IAM Policy for Log Readers
resource "aws_iam_policy" "log_reader_policy" {
  name        = "corpSec-${local.environment_suffix}-log-reader-policy"
  description = "Policy for reading logs from secure S3 bucket"

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
          aws_s3_bucket.secure_log_bucket.arn,
          "${aws_s3_bucket.secure_log_bucket.arn}/*"
        ]
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt"
        ]
        Resource = aws_kms_key.log_bucket_key.arn
      }
    ]
  })
}

# Attach policy to reader role
resource "aws_iam_role_policy_attachment" "log_reader_attachment" {
  role       = aws_iam_role.log_reader_role.name
  policy_arn = aws_iam_policy.log_reader_policy.arn
}

# S3 Bucket Policy
resource "aws_s3_bucket_policy" "log_bucket_policy" {
  bucket = aws_s3_bucket.secure_log_bucket.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "DenyUnSecureCommunications"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.secure_log_bucket.arn,
          "${aws_s3_bucket.secure_log_bucket.arn}/*"
        ]
        Condition = {
          Bool = {
            "aws:SecureTransport" = "false"
          }
        }
      },
      {
        Sid       = "DenyUnencryptedObjectUploads"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:PutObject"
        Resource  = "${aws_s3_bucket.secure_log_bucket.arn}/*"
        Condition = {
          StringNotEquals = {
            "s3:x-amz-server-side-encryption" = "aws:kms"
          }
        }
      },
      {
        Sid    = "AWSCloudTrailAclCheck"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:GetBucketAcl"
        Resource = aws_s3_bucket.secure_log_bucket.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.secure_log_bucket.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudWatch Log Group for monitoring
resource "aws_cloudwatch_log_group" "security_alerts" {
  name              = "/corpSec-${local.environment_suffix}/security-alerts"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.log_bucket_key.arn

  tags = {
    Name = "corpSec-${local.environment_suffix}-security-alerts"
  }
}

# CloudWatch Metric Filter for unauthorized access attempts
resource "aws_cloudwatch_log_metric_filter" "unauthorized_access" {
  name           = "corpSec-${local.environment_suffix}-unauthorized-access"
  log_group_name = aws_cloudwatch_log_group.security_alerts.name
  pattern        = "[timestamp, request_id, event_type=\"ERROR\", event_name=\"AccessDenied\", ...]"

  metric_transformation {
    name      = "UnauthorizedAccessAttempts"
    namespace = "corpSec-${local.environment_suffix}/Security"
    value     = "1"
  }
}

# CloudWatch Alarm for unauthorized access
resource "aws_cloudwatch_metric_alarm" "unauthorized_access_alarm" {
  alarm_name          = "corpSec-${local.environment_suffix}-unauthorized-access-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAccessAttempts"
  namespace           = "corpSec-${local.environment_suffix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors unauthorized access attempts to the log bucket"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "corpSec-${local.environment_suffix}-unauthorized-access-alarm"
  }
}

# SNS Topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "corpSec-${local.environment_suffix}-security-alerts"
  kms_master_key_id = aws_kms_key.log_bucket_key.id

  tags = {
    Name = "corpSec-${local.environment_suffix}-security-alerts"
  }
}

# CloudTrail for API logging
resource "aws_cloudtrail" "security_trail" {
  name           = "corpSec-${local.environment_suffix}-security-trail"
  s3_bucket_name = aws_s3_bucket.secure_log_bucket.bucket
  s3_key_prefix  = "cloudtrail-logs/"

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.secure_log_bucket.arn}/*"]
    }
  }

  kms_key_id                    = aws_kms_key.log_bucket_key.arn
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  tags = {
    Name = "corpSec-${local.environment_suffix}-security-trail"
  }

  depends_on = [aws_s3_bucket_policy.log_bucket_policy]
}

# Outputs for integration testing and other reference
output "s3_bucket_name" {
  description = "Name of the secure log S3 bucket"
  value       = aws_s3_bucket.secure_log_bucket.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the secure log S3 bucket"
  value       = aws_s3_bucket.secure_log_bucket.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.log_bucket_key.key_id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.log_bucket_key.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.security_trail.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.security_trail.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.security_alerts.name
}

output "cloudwatch_alarm_name" {
  description = "Name of the CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.unauthorized_access_alarm.alarm_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "log_writer_role_name" {
  description = "Name of the log writer IAM role"
  value       = aws_iam_role.log_writer_role.name
}

output "log_writer_role_arn" {
  description = "ARN of the log writer IAM role"
  value       = aws_iam_role.log_writer_role.arn
}

output "log_reader_role_name" {
  description = "Name of the log reader IAM role"
  value       = aws_iam_role.log_reader_role.name
}

output "log_reader_role_arn" {
  description = "ARN of the log reader IAM role"
  value       = aws_iam_role.log_reader_role.arn
}
```

## Key Features Implemented

### 🔐 **Security Features**

- **Encryption**: KMS encryption for S3 bucket (both in-transit and at-rest) with proper CloudWatch Logs permissions
- **MFA Requirement**: All IAM roles require MFA for access
- **Least Privilege**: Separate reader/writer roles with minimal permissions
- **Secure Transport**: HTTPS-only access enforced via bucket policy
- **CloudTrail Integration**: Proper S3 bucket policy permissions for CloudTrail service

### 📊 **Monitoring & Alerting**

- **CloudWatch**: Log group and metric filters for unauthorized access with KMS encryption
- **SNS Alerts**: Notifications for security events with KMS encryption
- **CloudTrail**: API call logging for audit trails with proper S3 permissions

### 🛡️ **Data Protection**

- **Versioning**: Enabled on S3 bucket to prevent data loss
- **Lifecycle Policies**: Automatic archival with proper filter prefix to reduce costs
- **Public Access Block**: Prevents accidental public exposure
- **Environment Isolation**: Resources include environment suffix to avoid conflicts

### 🔍 **Operational Features**

- **Destroyable Resources**: No prevent_destroy policies for clean deployment/testing cycles
- **Unique Naming**: Random suffix ensures bucket name uniqueness
- **Environment Suffix**: All resources tagged with environment suffix to prevent conflicts
- **Comprehensive Outputs**: All important resource information exposed for integration testing

### 📝 **Usage Instructions**

1. **Initialize Terraform**:

   ```bash
   terraform init
   ```

2. **Plan the deployment**:

   ```bash
   terraform plan
   ```

3. **Apply the configuration**:

   ```bash
   terraform apply
   ```

4. **Subscribe to SNS alerts** (manual step):
   ```bash
   aws sns subscribe --topic-arn <sns-topic-arn> --protocol email --notification-endpoint your-email@company.com
   ```

This setup follows AWS security best practices and provides a robust, compliant logging infrastructure for your organization with proper error handling and deployment isolation.
