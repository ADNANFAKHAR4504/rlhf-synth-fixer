# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = "${local.resource_prefix}-cloudtrail-logs-${random_id.bucket_suffix.hex}"
  force_destroy = true

  tags = {
    Name      = "${local.resource_prefix}-cloudtrail-logs"
    Component = "logging"
    Function  = "audit"
  }
}

resource "random_id" "bucket_suffix" {
  byte_length = 8
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
      kms_master_key_id = aws_kms_key.cloudtrail.arn
      sse_algorithm     = "aws:kms"
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

resource "aws_s3_bucket_lifecycle_configuration" "cloudtrail_logs" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    id     = "cloudtrail_logs_lifecycle"
    status = "Enabled"

    filter {}

    expiration {
      days = var.cloudtrail_retention_days
    }

    noncurrent_version_expiration {
      noncurrent_days = 7
    }
  }
}

# KMS Key for CloudTrail encryption
resource "aws_kms_key" "cloudtrail" {
  description             = "KMS key for CloudTrail logs encryption"
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
      }
    ]
  })

  tags = {
    Name      = "${local.resource_prefix}-cloudtrail-key"
    Component = "security"
    Function  = "encryption"
  }
}

resource "aws_kms_alias" "cloudtrail" {
  name          = "alias/${local.resource_prefix}-cloudtrail-${local.unique_suffix}"
  target_key_id = aws_kms_key.cloudtrail.key_id
}

# S3 Bucket Policy for CloudTrail
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

# CloudTrail Configuration
resource "aws_cloudtrail" "security_audit" {
  name           = "${local.resource_prefix}-security-audit-${local.unique_suffix}"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.bucket
  s3_key_prefix  = "cloudtrail-logs"

  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true

  kms_key_id = aws_kms_key.cloudtrail.arn

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch.arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type   = "AWS::S3::Object"
      values = ["${aws_s3_bucket.cloudtrail_logs.arn}/*"]
    }

    # Note: SecretsManager is not supported in CloudTrail data resources
    # These events are captured via management events
  }

  insight_selector {
    insight_type = "ApiCallRateInsight"
  }

  tags = {
    Name      = "${local.resource_prefix}-security-audit"
    Component = "logging"
    Function  = "compliance"
  }
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = "/aws/cloudtrail/${local.resource_prefix}-security-audit-${local.unique_suffix}"
  retention_in_days = var.cloudtrail_retention_days
  # Note: CloudWatch Log Groups cannot use custom KMS keys directly

  tags = {
    Name      = "${local.resource_prefix}-cloudtrail-logs"
    Component = "logging"
    Function  = "monitoring"
  }
}

# IAM Role for CloudTrail CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch" {
  name = "${local.resource_prefix}-cloudtrail-cloudwatch-role-${local.unique_suffix}"

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

resource "aws_iam_role_policy" "cloudtrail_cloudwatch" {
  name = "${local.resource_prefix}-cloudtrail-cloudwatch-policy-${local.unique_suffix}"
  role = aws_iam_role.cloudtrail_cloudwatch.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resource = "${aws_cloudwatch_log_group.cloudtrail.arn}*"
      }
    ]
  })
}

# SNS Topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.resource_prefix}-security-alerts-${local.unique_suffix}"
  display_name      = "${local.resource_prefix}-security-alerts"
  kms_master_key_id = aws_kms_key.cloudtrail.arn

  tags = {
    Name      = "${local.resource_prefix}-security-alerts"
    Component = "monitoring"
    Function  = "alerting"
  }
}

# CloudWatch Alarm for unauthorized secret access
resource "aws_cloudwatch_metric_alarm" "unauthorized_secret_access" {
  alarm_name          = "${local.resource_prefix}-unauthorized-secret-access-${local.unique_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedSecretAccess"
  namespace           = "SecurityDemo/Secrets"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "This metric monitors unauthorized secret access attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name      = "${local.resource_prefix}-unauthorized-access-alarm"
    Component = "monitoring"
    Function  = "security"
  }
}