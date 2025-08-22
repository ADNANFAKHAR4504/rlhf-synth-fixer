# Ideal Response - Terraform Secure Infrastructure Stack

```hcl
########################################
# Variables
########################################
variable "aws_region" {
  description = "AWS region for resources (must be us-west-2)"
  type        = string
  default     = "us-west-2"

  validation {
    condition     = var.aws_region == "us-west-2"
    error_message = "Resources must be deployed in us-west-2 only."
  }
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "project_name" {
  description = "Project name"
  type        = string
  default     = "secure-web-app"
}

variable "owner" {
  description = "Resource owner"
  type        = string
  default     = "platform-team"
}

########################################
# Locals
########################################
locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = {
    Environment = var.environment
    Project     = var.project_name
    Owner       = var.owner
    ManagedBy   = "terraform"
  }
}

########################################
# Data Sources
########################################
data "aws_caller_identity" "current" {}
data "aws_partition" "current" {}

########################################
# Random suffixes for uniqueness
########################################
resource "random_id" "resource_suffix" {
  byte_length = 4
}

########################################
# KMS Key (used by S3, CloudWatch Logs, SNS)
########################################
resource "aws_kms_key" "main" {
  description             = "CMK for ${local.name_prefix} security services"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid : "AllowAccountRootAdministration",
        Effect : "Allow",
        Principal : {
          AWS : "arn:${data.aws_partition.current.partition}:iam::${data.aws_caller_identity.current.account_id}:root"
        },
        Action : "kms:*",
        Resource : "*"
      },
      {
        Sid : "AllowCloudWatchLogsUseKey",
        Effect : "Allow",
        Principal : { Service : "logs.${var.aws_region}.amazonaws.com" },
        Action : [
          "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"
        ],
        Resource : "*"
      },
      {
        Sid : "AllowCloudTrailUseKeyViaS3",
        Effect : "Allow",
        Principal : { Service : "cloudtrail.amazonaws.com" },
        Action : [
          "kms:Encrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"
        ],
        Resource : "*"
      },
      {
        Sid : "AllowSNSUseKey",
        Effect : "Allow",
        Principal : { Service : "sns.amazonaws.com" },
        Action : [
          "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*", "kms:DescribeKey"
        ],
        Resource : "*"
      }
    ]
  })

  tags = local.common_tags
}

resource "aws_kms_alias" "main" {
  name          = "alias/${local.name_prefix}-${random_id.resource_suffix.hex}-cmk"
  target_key_id = aws_kms_key.main.key_id
}

########################################
# S3 Buckets (KMS-encrypted)
########################################
resource "aws_s3_bucket" "app_data" {
  bucket = "${local.name_prefix}-app-${random_id.resource_suffix.hex}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "app_data" {
  bucket                  = aws_s3_bucket.app_data.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "app_data" {
  bucket = aws_s3_bucket.app_data.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket" "trail_logs" {
  bucket = "${local.name_prefix}-ct-logs-${random_id.resource_suffix.hex}"
  tags   = local.common_tags
}

resource "aws_s3_bucket_public_access_block" "trail_logs" {
  bucket                  = aws_s3_bucket.trail_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_versioning" "trail_logs" {
  bucket = aws_s3_bucket.trail_logs.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "trail_logs" {
  bucket = aws_s3_bucket.trail_logs.id
  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.main.arn
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_policy" "trail_logs" {
  bucket = aws_s3_bucket.trail_logs.id
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid : "AWSCloudTrailAclCheck",
        Effect : "Allow",
        Principal : { Service : "cloudtrail.amazonaws.com" },
        Action : "s3:GetBucketAcl",
        Resource : aws_s3_bucket.trail_logs.arn
      },
      {
        Sid : "AWSCloudTrailWrite",
        Effect : "Allow",
        Principal : { Service : "cloudtrail.amazonaws.com" },
        Action : "s3:PutObject",
        Resource : "${aws_s3_bucket.trail_logs.arn}/AWSLogs/${data.aws_caller_identity.current.account_id}/*",
        Condition : {
          StringEquals : { "s3:x-amz-acl" : "bucket-owner-full-control" }
        }
      }
    ]
  })
}

########################################
# CloudWatch Logs
########################################
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/${local.name_prefix}-${random_id.resource_suffix.hex}/cloudtrail"
  retention_in_days = 90
  kms_key_id        = aws_kms_key.main.arn
  tags              = local.common_tags
}

########################################
# IAM Role for CloudTrail Logs
########################################
resource "aws_iam_role" "cloudtrail_logs_role" {
  name = "${local.name_prefix}-ct-to-cwl-role-${random_id.resource_suffix.hex}"
  assume_role_policy = jsonencode({
    Version : "2012-10-17",
    Statement : [
      {
        Effect : "Allow",
        Principal : { Service : "cloudtrail.amazonaws.com" },
        Action : "sts:AssumeRole"
      }
    ]
  })
  tags = local.common_tags
}

resource "aws_iam_role_policy" "cloudtrail_logs_policy" {
  name = "${local.name_prefix}-ct-to-cwl-policy-${random_id.resource_suffix.hex}"
  role = aws_iam_role.cloudtrail_logs_role.id
  policy = jsonencode({
    Version : "2012-10-17",
    Statement : [
      {
        Effect : "Allow",
        Action : [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        Resource : [
          aws_cloudwatch_log_group.cloudtrail.arn,
          "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
        ]
      }
    ]
  })
}

########################################
# CloudTrail
########################################
resource "aws_cloudtrail" "main" {
  name                          = "${local.name_prefix}-trail-${random_id.resource_suffix.hex}"
  s3_bucket_name                = aws_s3_bucket.trail_logs.bucket
  kms_key_id                    = aws_kms_key.main.arn
  include_global_service_events = true
  is_multi_region_trail         = false
  enable_logging                = true
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.cloudtrail_logs_role.arn
  tags                          = local.common_tags
}

########################################
# CloudWatch Alarms + SNS
########################################
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_requests" {
  name           = "${local.name_prefix}-unauth-api-${random_id.resource_suffix.hex}"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPIRequests"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-security-alerts-${random_id.resource_suffix.hex}"
  kms_master_key_id = aws_kms_key.main.arn
  tags              = local.common_tags
}

resource "aws_sns_topic_policy" "security_alerts" {
  arn = aws_sns_topic.security_alerts.arn
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Sid : "AllowCloudWatchPublish",
        Effect : "Allow",
        Principal : { Service : "cloudwatch.amazonaws.com" },
        Action : "sns:Publish",
        Resource : aws_sns_topic.security_alerts.arn
      }
    ]
  })
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api_requests" {
  alarm_name          = "${local.name_prefix}-unauth-api-alarm-${random_id.resource_suffix.hex}"
  alarm_description   = "Triggers on unauthorized API requests detected via CloudTrail"
  namespace           = "${local.name_prefix}/Security"
  metric_name         = aws_cloudwatch_log_metric_filter.unauthorized_api_requests.metric_transformation[0].name
  statistic           = "Sum"
  period              = 300
  evaluation_periods  = 1
  threshold           = 1
  comparison_operator = "GreaterThanOrEqualToThreshold"
  treat_missing_data  = "notBreaching"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  tags                = local.common_tags
}

########################################
# Outputs
########################################
output "aws_region" {
  value = var.aws_region
}

output "kms_key_arn" {
  value = aws_kms_key.main.arn
}

output "app_bucket_name" {
  value = aws_s3_bucket.app_data.bucket
}

output "cloudtrail_bucket_name" {
  value = aws_s3_bucket.trail_logs.bucket
}

output "cloudtrail_arn" {
  value = aws_cloudtrail.main.arn
}

output "cloudtrail_log_group" {
  value = aws_cloudwatch_log_group.cloudtrail.name
}

output "security_alerts_topic_arn" {
  value = aws_sns_topic.security_alerts.arn
}
```
