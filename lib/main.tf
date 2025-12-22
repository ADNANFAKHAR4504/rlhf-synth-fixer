# Data sources
data "aws_caller_identity" "current" {}
data "aws_region" "current" {}

# Local variables for resource 
locals {
  suffix      = var.environment_suffix != "" ? var.environment_suffix : random_id.bucket_suffix.hex
  name_prefix = "${var.project_name}-${local.suffix}"
}

# KMS Key for S3 encryption
resource "aws_kms_key" "s3_key" {
  description             = "${local.name_prefix} S3 encryption key"
  deletion_window_in_days = 7
  enable_key_rotation     = true

  tags = {
    Name        = "${local.name_prefix}-s3-key"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

resource "aws_kms_alias" "s3_key_alias" {
  name          = "alias/${local.name_prefix}-s3-key"
  target_key_id = aws_kms_key.s3_key.key_id
}

# S3 Bucket for logs
resource "aws_s3_bucket" "access_logs" {
  bucket        = "${local.name_prefix}-access-logs-${random_id.bucket_suffix.hex}"
  force_destroy = true # Allow destruction in test environments

  tags = {
    Name        = "${local.name_prefix}-access-logs"
    Environment = var.environment
    Purpose     = "AccessLogs"
    ManagedBy   = "terraform"
  }
}

# Main S3 Bucket
resource "aws_s3_bucket" "main_bucket" {
  bucket        = "${local.name_prefix}-secure-bucket-${random_id.bucket_suffix.hex}"
  force_destroy = true # Allow destruction in test environments

  tags = {
    Name        = "${local.name_prefix}-secure-bucket"
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
  name = "${local.name_prefix}-s3-access-role-${random_id.bucket_suffix.hex}"

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
    Name        = "${local.name_prefix}-s3-access-role"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# IAM Policy for S3 least privilege access
resource "aws_iam_policy" "corp_s3_policy" {
  name        = "${local.name_prefix}-s3-access-policy-${random_id.bucket_suffix.hex}"
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
  name = "${local.name_prefix}-security-alerts"

  tags = {
    Name        = "${local.name_prefix}-security-alerts"
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
  name              = "/aws/cloudtrail/${local.name_prefix}-${random_id.bucket_suffix.hex}"
  retention_in_days = 90

  tags = {
    Name        = "${local.name_prefix}-cloudtrail-logs"
    Environment = var.environment
    ManagedBy   = "terraform"
  }
}

# IAM Role for CloudTrail
resource "aws_iam_role" "cloudtrail_role" {
  name = "${local.name_prefix}-cloudtrail-role-${random_id.bucket_suffix.hex}"

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
  name = "${local.name_prefix}-cloudtrail-logs-policy-${random_id.bucket_suffix.hex}"
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

# S3 bucket policy for CloudTrail
resource "aws_s3_bucket_policy" "cloudtrail_bucket_policy" {
  bucket = aws_s3_bucket.access_logs.id

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
        Resource = aws_s3_bucket.access_logs.arn
      },
      {
        Sid    = "AWSCloudTrailWrite"
        Effect = "Allow"
        Principal = {
          Service = "cloudtrail.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.access_logs.arn}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      }
    ]
  })
}

# CloudTrail for monitoring
resource "aws_cloudtrail" "main_trail" {
  name           = "${local.name_prefix}-security-trail"
  s3_bucket_name = aws_s3_bucket.access_logs.bucket
  s3_key_prefix  = "cloudtrail-logs/"

  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_logs.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_role.arn

  event_selector {
    read_write_type                  = "All"
    include_management_events        = true
    exclude_management_event_sources = []

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.main_bucket.arn}/*"]
    }
  }

  tags = {
    Name        = "${local.name_prefix}-security-trail"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  depends_on = [aws_s3_bucket_policy.cloudtrail_bucket_policy]
}

# CloudWatch Metric Filter for unauthorized access attempts
resource "aws_cloudwatch_log_metric_filter" "unauthorized_access" {
  name           = "${local.name_prefix}-unauthorized-access"
  log_group_name = aws_cloudwatch_log_group.cloudtrail_logs.name
  pattern        = "{ ($.userIdentity.type = \"Root\") && ($.responseElements.ConsoleLogin = \"Failure\") }"

  metric_transformation {
    name      = "UnauthorizedAccessAttempts"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# CloudWatch Alarm for unauthorized access
resource "aws_cloudwatch_metric_alarm" "unauthorized_access_alarm" {
  alarm_name          = "${local.name_prefix}-unauthorized-access-alarm"
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
    Name        = "${local.name_prefix}-unauthorized-access-alarm"
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
  name     = "${local.name_prefix}-s3-classification-job"

  s3_job_definition {
    bucket_definitions {
      account_id = data.aws_caller_identity.current.account_id
      buckets    = [aws_s3_bucket.main_bucket.bucket]
    }
  }

  tags = {
    Name        = "${local.name_prefix}-s3-classification-job"
    Environment = var.environment
    ManagedBy   = "terraform"
  }

  depends_on = [aws_macie2_account.main]
}

# AWS Shield Advanced (if enabled)
resource "aws_shield_protection" "s3_protection" {
  count        = var.enable_shield_advanced ? 1 : 0
  name         = "${local.name_prefix}-s3-shield-protection"
  resource_arn = aws_s3_bucket.main_bucket.arn
}
