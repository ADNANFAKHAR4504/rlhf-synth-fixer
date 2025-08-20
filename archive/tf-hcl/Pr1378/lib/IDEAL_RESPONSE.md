# Terraform Infrastructure Code

## provider.tf

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

## tap_stack.tf

```hcl
########################
# Variables
########################
# variable "aws_region" {
#   description = "AWS provider region"
#   type        = string
#   default     = "us-east-1"
# }
variable "bucket_region" {
  description = "Region for the S3 bucket"
  type        = string
  default     = "eu-west-3"
}

variable "bucket_name" {
  description = "Name of the S3 bucket"
  type        = string
  default     = "devs3-bucket"
}

variable "bucket_tags" {
  description = "Tags to apply to the S3 bucket"
  type        = map(string)
  default = {
    Project     = "ExampleProject"
    Environment = "dev"
    ManagedBy   = "terraform"
  }
}

########################
# S3 Bucket
########################

/* resource "aws_s3_bucket" "this" {
  bucket = var.bucket_name
  tags   = var.bucket_tags
}

resource "aws_s3_bucket_public_access_block" "this" {
  bucket                  = aws_s3_bucket.this.id
  block_public_acls       = true
  ignore_public_acls      = true
  block_public_policy     = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "this" {
  bucket = aws_s3_bucket.this.id

  versioning_configuration {
    status = "Enabled"
  }
}

########################
# Outputs
########################

output "bucket_name" {
  value = aws_s3_bucket.this.bucket
}

output "bucket_tags" {
  value = aws_s3_bucket.this.tags
}
*/

# Terraform version requirement
# terraform {
#   required_version = ">= 0.14"
#   required_providers {
#     aws = {
#       source  = "hashicorp/aws"
#       version = "~> 5.0"
#     }
#   }
# }

# Variable declarations
variable "aws_region" {
  description = "The AWS region to deploy resources"
  type        = string
  default     = "eu-west-3"
}

variable "allowed_ip_ranges" {
  description = "List of allowed IP ranges for S3 bucket access"
  type        = list(string)
  default     = ["203.0.113.0/24", "198.51.100.0/24"] # Example IP ranges - replace with actual ranges
}

variable "security_team_email" {
  description = "Email address for security team notifications"
  type        = string
  default     = "security-team@example.com"
}

# Local values
locals {
  common_tags = {
    Environment = "production"
    Project     = "secure-data-storage"
    ManagedBy   = "terraform"
  }

  bucket_name = "secure-storage-${random_id.bucket_suffix.hex}"
}

# Random ID for unique bucket naming
resource "random_id" "bucket_suffix" {
  byte_length = 8
}

# S3 Bucket for secure storage
resource "aws_s3_bucket" "secure_storage" {
  bucket = local.bucket_name
  tags = merge(local.common_tags, {
    Name = "SecureStorageBucket"
  })
}

# S3 Bucket versioning
resource "aws_s3_bucket_versioning" "secure_storage_versioning" {
  bucket = aws_s3_bucket.secure_storage.id
  versioning_configuration {
    status = "Enabled"
  }
}

# S3 Bucket server-side encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "secure_storage_encryption" {
  bucket = aws_s3_bucket.secure_storage.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# S3 Bucket public access block
resource "aws_s3_bucket_public_access_block" "secure_storage_pab" {
  bucket = aws_s3_bucket.secure_storage.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket policy for IP restriction
resource "aws_s3_bucket_policy" "secure_storage_policy" {
  bucket = aws_s3_bucket.secure_storage.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "IPRestriction"
        Effect    = "Deny"
        Principal = "*"
        Action    = "s3:*"
        Resource = [
          aws_s3_bucket.secure_storage.arn,
          "${aws_s3_bucket.secure_storage.arn}/*"
        ]
        Condition = {
          IpAddress = {
            "aws:SourceIp" = var.allowed_ip_ranges
          }
          Bool = {
            "aws:ViaAWSService" = "false"
          }
        }
      },
      {
        Sid       = "AllowFromSpecificIPs"
        Effect    = "Allow"
        Principal = "*"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.secure_storage.arn,
          "${aws_s3_bucket.secure_storage.arn}/*"
        ]
        Condition = {
          IpAddress = {
            "aws:SourceIp" = var.allowed_ip_ranges
          }
        }
      }
    ]
  })
}

# CloudTrail S3 bucket for logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket = "cloudtrail-logs-${random_id.bucket_suffix.hex}"
  tags = merge(local.common_tags, {
    Name = "CloudTrailLogsBucket"
  })
}

# CloudTrail logs bucket versioning
resource "aws_s3_bucket_versioning" "cloudtrail_logs_versioning" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

# CloudTrail logs bucket encryption
resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs_encryption" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

# CloudTrail logs bucket public access block
resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# CloudTrail bucket policy
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
        Condition = {
          StringEquals = {
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/secure-data-cloudtrail-${random_id.bucket_suffix.hex}"
          }
        }
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
            "s3:x-amz-acl"  = "bucket-owner-full-control"
            "AWS:SourceArn" = "arn:aws:cloudtrail:${var.aws_region}:${data.aws_caller_identity.current.account_id}:trail/secure-data-cloudtrail-${random_id.bucket_suffix.hex}"
          }
        }
      }
    ]
  })
}

# Data source for current AWS account ID
data "aws_caller_identity" "current" {}

# CloudTrail for API logging
resource "aws_cloudtrail" "secure_data_trail" {
  name                          = "secure-data-cloudtrail-${random_id.bucket_suffix.hex}"
  s3_bucket_name                = aws_s3_bucket.cloudtrail_logs.bucket
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_logs_role.arn

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.secure_storage.arn}/*"]
    }
  }

  tags = merge(local.common_tags, {
    Name = "SecureDataCloudTrail"
  })
}

# IAM role for application access
resource "aws_iam_role" "app_role" {
  name = "secure-storage-app-role-${random_id.bucket_suffix.hex}"

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

  tags = merge(local.common_tags, {
    Name = "SecureStorageAppRole"
  })
}

# IAM policy for least privilege S3 access
resource "aws_iam_role_policy" "app_s3_policy" {
  name = "secure-storage-s3-policy"
  role = aws_iam_role.app_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject",
          "s3:ListBucket"
        ]
        Resource = [
          aws_s3_bucket.secure_storage.arn,
          "${aws_s3_bucket.secure_storage.arn}/*"
        ]
      }
    ]
  })
}

# IAM instance profile for EC2
resource "aws_iam_instance_profile" "app_profile" {
  name = "secure-storage-app-profile-${random_id.bucket_suffix.hex}"
  role = aws_iam_role.app_role.name
}

# SNS topic for IAM change notifications
resource "aws_sns_topic" "iam_changes" {
  name = "iam-role-changes-${random_id.bucket_suffix.hex}"

  tags = merge(local.common_tags, {
    Name = "IAMRoleChangesNotifications"
  })
}

# SNS topic subscription for security team
resource "aws_sns_topic_subscription" "security_team_email" {
  topic_arn = aws_sns_topic.iam_changes.arn
  protocol  = "email"
  endpoint  = var.security_team_email
}

# CloudWatch log group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
  name              = "/aws/cloudtrail/secure-data-trail-${random_id.bucket_suffix.hex}"
  retention_in_days = 90

  tags = merge(local.common_tags, {
    Name = "CloudTrailLogGroup"
  })
}

# IAM role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_logs_role" {
  name = "CloudTrail-CloudWatchLogs-Role-${random_id.bucket_suffix.hex}"

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

  tags = merge(local.common_tags, {
    Name = "CloudTrailLogsRole"
  })
}

# IAM policy for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name = "CloudTrail-CloudWatchLogs-Policy"
  role = aws_iam_role.cloudtrail_logs_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
      }
    ]
  })
}

# CloudWatch metric filter for IAM changes
resource "aws_cloudwatch_log_metric_filter" "iam_changes_filter" {
  name           = "IAMChangesFilter"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_log_group.name
  pattern        = "{ ($.eventName = CreateRole) || ($.eventName = DeleteRole) || ($.eventName = AttachRolePolicy) || ($.eventName = DetachRolePolicy) || ($.eventName = PutRolePolicy) || ($.eventName = DeleteRolePolicy) }"

  metric_transformation {
    name      = "IAMChangesCount"
    namespace = "Security/IAM"
    value     = "1"
  }
}

# CloudWatch alarm for IAM changes
resource "aws_cloudwatch_metric_alarm" "iam_changes_alarm" {
  alarm_name          = "IAM-Role-Changes-Alarm-${random_id.bucket_suffix.hex}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMChangesCount"
  namespace           = "Security/IAM"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alarm when IAM role changes are detected"
  alarm_actions       = [aws_sns_topic.iam_changes.arn]
  treat_missing_data  = "notBreaching"

  tags = merge(local.common_tags, {
    Name = "IAMChangesAlarm"
  })
}

# CloudWatch alarm for unauthorized S3 access attempts
resource "aws_cloudwatch_metric_alarm" "s3_access_denied_alarm" {
  alarm_name          = "S3-Access-Denied-Alarm-${random_id.bucket_suffix.hex}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "4xxError"
  namespace           = "AWS/S3"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alarm when S3 access is denied multiple times"
  alarm_actions       = [aws_sns_topic.iam_changes.arn]

  dimensions = {
    BucketName = aws_s3_bucket.secure_storage.bucket
  }

  tags = merge(local.common_tags, {
    Name = "S3AccessDeniedAlarm"
  })
}

# Outputs for CI/CD integration (no secrets)
output "s3_bucket_name" {
  description = "Name of the secure storage S3 bucket"
  value       = aws_s3_bucket.secure_storage.bucket
}

output "s3_bucket_arn" {
  description = "ARN of the secure storage S3 bucket"
  value       = aws_s3_bucket.secure_storage.arn
}

output "cloudtrail_name" {
  description = "Name of the CloudTrail"
  value       = aws_cloudtrail.secure_data_trail.name
}

output "cloudtrail_arn" {
  description = "ARN of the CloudTrail"
  value       = aws_cloudtrail.secure_data_trail.arn
}

output "iam_role_name" {
  description = "Name of the IAM role for application access"
  value       = aws_iam_role.app_role.name
}

output "iam_role_arn" {
  description = "ARN of the IAM role for application access"
  value       = aws_iam_role.app_role.arn
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for notifications"
  value       = aws_sns_topic.iam_changes.arn
}

output "cloudwatch_log_group_name" {
  description = "Name of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail_log_group.name
}

output "aws_region" {
  description = "AWS region where resources are deployed"
  value       = var.aws_region
}

output "deployment_timestamp" {
  description = "Timestamp of the deployment"
  value       = timestamp()
}

```
