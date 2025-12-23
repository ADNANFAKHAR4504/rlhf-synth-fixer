# Terraform Infrastructure Response - Secure AWS Resource Configuration

I'll help you create a comprehensive Terraform infrastructure that automates the security configuration of AWS resources. Here's the complete solution:

## File: provider.tf

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

## File: variables.tf

```hcl
variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "prod"
}

variable "project_name" {
  description = "Project name for resource naming"
  type        = string
  default     = "corp"
}

variable "notification_email" {
  description = "Email for CloudWatch alarm notifications"
  type        = string
  default     = "admin@company.com"
}

variable "enable_macie" {
  description = "Enable Amazon Macie for data discovery"
  type        = bool
  default     = true
}

variable "enable_shield_advanced" {
  description = "Enable AWS Shield Advanced"
  type        = bool
  default     = false
}
```

## File: main.tf

```hcl
# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# KMS Key for S3 encryption
resource "aws_kms_key" "s3_key" {
  description             = "${var.project_name} S3 encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${var.project_name}-s3-key"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/${var.project_name}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

# S3 Bucket for logs
resource "aws_s3_bucket" "access_logs" {
  bucket = "${var.project_name}-access-logs-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.project_name}-access-logs"
    Environment = var.environment
    Purpose     = "AccessLogs"
    ManagedBy   = "terraform"
  }
}

# Main S3 Bucket
resource "aws_s3_bucket" "main_bucket" {
  bucket = "${var.project_name}-secure-bucket-${random_id.bucket_suffix.hex}"

  tags = {
    Name        = "${var.project_name}-secure-bucket"
    Environment = var.environment
    Purpose     = "MainStorage"
    ManagedBy   = "terraform"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 4
}

# S3 Bucket configurations for main bucket
resource "aws_s3_bucket_versioning" "main_bucket_versioning" {
  bucket = aws_s3_bucket.main_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "main_bucket_encryption" {
  bucket = aws_s3_bucket.main_bucket.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "main_bucket_pab" {
  bucket = aws_s3_bucket.main_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_logging" "main_bucket_logging" {
  bucket = aws_s3_bucket.main_bucket.id

  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "access-logs/"
}

# S3 bucket configurations for access logs bucket
resource "aws_s3_bucket_versioning" "access_logs_versioning" {
  bucket = aws_s3_bucket.access_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "access_logs_encryption" {
  bucket = aws_s3_bucket.access_logs.id

  rule {
    apply_server_side_encryption_by_default {
      kms_master_key_id = aws_kms_key.s3_key.arn
      sse_algorithm     = "aws:kms"
    }
  }
}

resource "aws_s3_bucket_public_access_block" "access_logs_pab" {
  bucket = aws_s3_bucket.access_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for S3 access
resource "aws_iam_role" "corp_s3_role" {
  name = "${var.project_name}-s3-access-role"

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

  tags = {
    Name        = "${var.project_name}-s3-access-role"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# IAM Policy for S3 least privilege access
resource "aws_iam_policy" "corp_s3_policy" {
  name        = "${var.project_name}-s3-access-policy"
  description = "Least privilege policy for S3 access"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:GetObjectVersion"
        ]
        Resource = "${aws_s3_bucket.main_bucket.arn}/*"
      },
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = aws_s3_bucket.main_bucket.arn
      },
      {
        Effect = "Allow"
        Action = [
          "kms:Decrypt",
          "kms:GenerateDataKey"
        ]
        Resource = aws_kms_key.s3_key.arn
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "corp_s3_policy_attachment" {
  role       = aws_iam_role.corp_s3_role.name
  policy_arn = aws_iam_policy.corp_s3_policy.arn
}

# SNS Topic for CloudWatch alarms
resource "aws_sns_topic" "security_alerts" {
  name = "${var.project_name}-security-alerts"

  tags = {
    Name        = "${var.project_name}-security-alerts"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_sns_topic_subscription" "security_alerts_email" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail_logs" {
  name              = "/aws/cloudtrail/${var.project_name}"
  retention_in_days = 90

  tags = {
    Name        = "${var.project_name}-cloudtrail-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# IAM Role for CloudTrail
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
}

resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name = "${var.project_name}-cloudtrail-logs-policy"
  role = aws_iam_role.cloudtrail_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
      }
    ]
  })
}

# CloudTrail for monitoring
resource "aws_cloudtrail" "main_trail" {
  name           = "${var.project_name}-security-trail"
  s3_bucket_name = aws_s3_bucket.access_logs.bucket
  s3_key_prefix  = "cloudtrail-logs/"

  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  cloud_watch_logs_group_arn = aws_cloudwatch_log_group.cloudtrail_logs.arn
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_role.arn

  event_selector {
    read_write_type                 = "All"
    include_management_events       = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.main_bucket.arn}/*"]
    }
  }

  tags = {
    Name        = "${var.project_name}-security-trail"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# CloudWatch Metric Filter for unauthorized access attempts
resource "aws_cloudwatch_log_metric_filter" "unauthorized_access" {
  name           = "${var.project_name}-unauthorized-access"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_logs.name
  pattern        = "[version, account, time, region, source, user=\"Root\", ..., response_elements.consoleLogin=\"Failure\"]"

  metric_transformation {
    name      = "UnauthorizedAccessAttempts"
    namespace = "${var.project_name}/Security"
    value     = "1"
  }
}

# CloudWatch Alarm for unauthorized access
resource "aws_cloudwatch_metric_alarm" "unauthorized_access_alarm" {
  alarm_name          = "${var.project_name}-unauthorized-access-alarm"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = aws_cloudwatch_log_metric_filter.unauthorized_access.metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.unauthorized_access.metric_transformation[0].namespace
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors unauthorized access attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name        = "${var.project_name}-unauthorized-access-alarm"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# Amazon Macie (if enabled)
resource "aws_macie2_account" "main" {
  count = var.enable_macie ? 1 : 0
}

resource "aws_macie2_classification_job" "s3_classification" {
  count    = var.enable_macie ? 1 : 0
  job_type = "ONE_TIME"
  name     = "${var.project_name}-s3-classification-job"

  s3_job_definition {
    bucket_definitions {
      account_id = data.aws_caller_identity.current.account_id
      buckets    = [aws_s3_bucket.main_bucket.bucket]
    }
  }

  tags = {
    Name        = "${var.project_name}-s3-classification-job"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  depends_on = [aws_macie2_account.main]
}

# AWS Shield Advanced (if enabled)
resource "aws_shield_protection" "s3_protection" {
  count        = var.enable_shield_advanced ? 1 : 0
  name         = "${var.project_name}-s3-shield-protection"
  resource_arn = aws_s3_bucket.main_bucket.arn
}
```

## File: outputs.tf

```hcl
output "main_bucket_name" {
  description = "Name of the main S3 bucket"
  value       = aws_s3_bucket.main_bucket.bucket
}

output "access_logs_bucket_name" {
  description = "Name of the access logs S3 bucket"
  value       = aws_s3_bucket.access_logs.bucket
}

output "iam_role_arn" {
  description = "ARN of the IAM role for S3 access"
  value       = aws_iam_role.corp_s3_role.arn
}

output "kms_key_id" {
  description = "ID of the KMS key for S3 encryption"
  value       = aws_kms_key.s3_key.key_id
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.main_trail.arn
}
```

This Terraform infrastructure provides:

1. **Secure S3 buckets** with encryption, versioning, and access logging
2. **IAM roles and policies** following least privilege principles
3. **CloudWatch monitoring and alarms** for unauthorized access detection
4. **CloudTrail logging** for comprehensive audit trails
5. **Multi-region support** through configurable variables
6. **Amazon Macie integration** for data loss prevention
7. **AWS Shield Advanced support** for DDoS protection
8. **KMS encryption** for data at rest
9. **SNS notifications** for security alerts

The infrastructure follows AWS security best practices and is ready for production deployment.