########################
# Locals
########################
locals {
  name_prefix   = "${var.project_name}-${replace(var.region, "/", "-")}"
  trail_name    = "${local.name_prefix}-trail"
  logs_bucket   = "${local.name_prefix}-logs"
  access_bucket = "${local.name_prefix}-access-logs"
  tags          = merge(var.tags, { Project = var.project_name, ManagedBy = "Terraform" })
}

resource "random_id" "suffix" {
  byte_length = 4
}

# =========== S3 buckets ===========
resource "aws_s3_bucket" "access_logs" {
  bucket = "${local.access_bucket}-${random_id.suffix.hex}"
  tags   = local.tags
}

resource "aws_s3_bucket_public_access_block" "access_logs" {
  bucket                  = aws_s3_bucket.access_logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "access_logs" {
  bucket = aws_s3_bucket.access_logs.id
  rule { object_ownership = "BucketOwnerPreferred" }
}

resource "aws_s3_bucket" "logs" {
  bucket = "${local.logs_bucket}-${random_id.suffix.hex}"
  tags   = local.tags
}

resource "aws_s3_bucket_versioning" "logs" {
  bucket = aws_s3_bucket.logs.id
  versioning_configuration { status = "Enabled" }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "logs" {
  bucket = aws_s3_bucket.logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.logs.arn  
    }
    bucket_key_enabled = true
  }
}


resource "aws_s3_bucket_logging" "logs" {
  bucket        = aws_s3_bucket.logs.id
  target_bucket = aws_s3_bucket.access_logs.id
  target_prefix = "s3-access/"
}

resource "aws_s3_bucket_public_access_block" "logs" {
  bucket                  = aws_s3_bucket.logs.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket_ownership_controls" "logs" {
  bucket = aws_s3_bucket.logs.id
  rule { object_ownership = "BucketOwnerPreferred" }
}

# =========== KMS ===========

# =========== CloudWatch Log Group ===========
resource "aws_cloudwatch_log_group" "trail" {
  name              = "/aws/cloudtrail/${local.trail_name}"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.logs.arn
  tags              = local.tags
}


########################
# Data Sources
########################
########################
# IAM Policies
########################

# =========== IAM for CloudTrail -> CloudWatch ===========
data "aws_iam_policy_document" "trail_cw_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}


resource "aws_iam_role" "trail_cw" {
  name               = "${local.name_prefix}-trail-cw-role"
  assume_role_policy = data.aws_iam_policy_document.trail_cw_assume.json
  tags               = local.tags
}


data "aws_iam_policy_document" "trail_cw_policy" {
  statement {
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = [
      aws_cloudwatch_log_group.trail.arn,
      "${aws_cloudwatch_log_group.trail.arn}:*"
    ]
  }

  statement {
    effect    = "Allow"
    actions   = ["logs:CreateLogGroup", "logs:PutResourcePolicy"]
    resources = ["*"]
  }
}

########################
# IAM Roles
########################

resource "aws_iam_role_policy" "trail_cw" {
  name   = "${local.name_prefix}-trail-cw"
  role   = aws_iam_role.trail_cw.id
  policy = data.aws_iam_policy_document.trail_cw_policy.json
}

# =========== S3 bucket policy for CloudTrail + Config ===========

data "aws_caller_identity" "current" {}

data "aws_iam_policy_document" "kms_policy" {
  statement {
    sid    = "AllowAccountRootAdmin"
    effect = "Allow"
    principals {
      type        = "AWS"
      identifiers = ["arn:aws:iam::${data.aws_caller_identity.current.account_id}:root"]
    }
    actions   = ["kms:*"]
    resources = ["*"]
  }

  # Allow CloudWatch Logs and CloudTrail to use the key
  statement {
    sid    = "AllowLogsAndCloudTrailUse"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = [
        "logs.${var.region}.amazonaws.com",
        "cloudtrail.amazonaws.com"
      ]
    }
    actions = [
      "kms:Encrypt", "kms:Decrypt", "kms:ReEncrypt*", "kms:GenerateDataKey*",
      "kms:DescribeKey"
    ]
    resources = ["*"]
  }
}

resource "aws_kms_key" "logs" {
  description             = "CMK for ${var.project_name} log encryption"
  enable_key_rotation     = true
  deletion_window_in_days = 30
  policy                  = data.aws_iam_policy_document.kms_policy.json
  tags                    = local.tags
}

resource "aws_kms_alias" "logs" {
  name          = "alias/${var.project_name}-logs"
  target_key_id = aws_kms_key.logs.key_id
}



data "aws_iam_policy_document" "logs_bucket" {
  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions  = ["s3:PutObject"]
    resources = [
      "${aws_s3_bucket.logs.arn}/cloudtrail/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
    ]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }

  statement {
    sid    = "AWSCloudTrailGetAcl"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.logs.arn]
  }

  statement {
    sid    = "AWSConfigWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
    actions  = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.logs.arn}/aws-config/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
  }

  statement {
    sid    = "AWSConfigGetAcl"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl", "s3:ListBucket"]
    resources = [aws_s3_bucket.logs.arn]
  }
}


resource "aws_s3_bucket_policy" "logs" {
  bucket = aws_s3_bucket.logs.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AWSCloudTrailWrite"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = ["s3:PutObject"]
        Resource  = "${aws_s3_bucket.logs.arn}/cloudtrail/AWSLogs/${data.aws_caller_identity.current.account_id}/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid       = "AWSCloudTrailGetAcl"
        Effect    = "Allow"
        Principal = { Service = "cloudtrail.amazonaws.com" }
        Action    = ["s3:GetBucketAcl"]
        Resource  = aws_s3_bucket.logs.arn
      },
      {
        Sid       = "AWSConfigWrite"
        Effect    = "Allow"
        Principal = { Service = "config.amazonaws.com" }
        Action    = ["s3:PutObject"]
        Resource  = "${aws_s3_bucket.logs.arn}/aws-config/*"
        Condition = {
          StringEquals = {
            "s3:x-amz-acl" = "bucket-owner-full-control"
          }
        }
      },
      {
        Sid       = "AWSConfigGetAcl"
        Effect    = "Allow"
        Principal = { Service = "config.amazonaws.com" }
        Action    = ["s3:GetBucketAcl", "s3:ListBucket"]
        Resource  = aws_s3_bucket.logs.arn
      }
    ]
  })
}


# =========== CloudTrail ===========
resource "aws_cloudtrail" "main" {
  name                          = local.trail_name
  s3_bucket_name                = aws_s3_bucket.logs.id
  s3_key_prefix                 = "cloudtrail"
  kms_key_id                    = aws_kms_key.logs.arn
  enable_log_file_validation    = true
  is_multi_region_trail         = true
  include_global_service_events = true
  cloud_watch_logs_group_arn    = "${aws_cloudwatch_log_group.trail.arn}:*"
  cloud_watch_logs_role_arn     = aws_iam_role.trail_cw.arn
  tags                          = local.tags
}

# =========== AWS Config ===========
data "aws_iam_policy_document" "config_assume" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["config.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}


resource "aws_iam_role" "config" {
  count              = var.enable_aws_config ? 1 : 0
  name               = "${local.name_prefix}-config-role"
  assume_role_policy = data.aws_iam_policy_document.config_assume.json
  tags               = local.tags
}

resource "aws_iam_role_policy" "config_inline" {
  count = var.enable_aws_config ? 1 : 0
  name  = "${local.name_prefix}-config-inline"
  role  = aws_iam_role.config[0].id

  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Effect = "Allow",
        Action = [
          "config:PutConfigurationRecorder",
          "config:PutDeliveryChannel",
          "config:StartConfigurationRecorder",
          "config:StopConfigurationRecorder",
          "config:DescribeConfigurationRecorders",
          "config:DescribeDeliveryChannels",
          "config:DescribeConfigurationRecorderStatus",
          "config:PutRetentionConfiguration",
          "config:DeliverConfigSnapshot"
        ],
        Resource = "*"
      },
      # S3 access limited to the logs bucket and the aws-config prefix
      {
        Effect = "Allow",
        Action = [
          "s3:GetBucketAcl",
          "s3:ListBucket"
        ],
        Resource = [
          aws_s3_bucket.logs.arn
        ]
      },
      {
        Effect = "Allow",
        Action = [
          "s3:PutObject"
        ],
        Resource = [
          "${aws_s3_bucket.logs.arn}/aws-config/*"
        ]
      }
    ]
  })
}





resource "aws_config_configuration_recorder" "rec" {
  count    = var.enable_aws_config ? 1 : 0
  name     = "${local.name_prefix}-rec"
  role_arn = aws_iam_role.config[0].arn
  recording_group {
    all_supported                 = true
    include_global_resource_types = true
  }
  depends_on = [aws_iam_role_policy.config_inline]
}

resource "aws_config_delivery_channel" "dc" {
  count          = var.enable_aws_config ? 1 : 0
  name           = "${local.name_prefix}-dc"
  s3_bucket_name = aws_s3_bucket.logs.bucket
  s3_key_prefix  = "aws-config"
}

resource "aws_config_configuration_recorder_status" "status" {
  count     = var.enable_aws_config ? 1 : 0
  name      = aws_config_configuration_recorder.rec[0].name
  is_enabled = true
  depends_on = [aws_config_delivery_channel.dc]
}

# =========== GuardDuty ==========
resource "aws_guardduty_detector" "this" {
  count  = var.enable_guardduty ? 1 : 0
  enable = true
  tags   = local.tags
}

# =========== IAM Account Password Policy ===========
resource "aws_iam_account_password_policy" "baseline" {
  minimum_password_length        = 14
  require_lowercase_characters   = true
  require_numbers                = true
  require_uppercase_characters   = true
  require_symbols                = true
  max_password_age               = 90
  password_reuse_prevention      = 24
  allow_users_to_change_password = true
}

# =========== SNS + Alarms ===========
resource "aws_sns_topic" "security" {
  name = "${local.name_prefix}-security-alarms"
  tags = local.tags
}

resource "aws_sns_topic_subscription" "email" {
  topic_arn = aws_sns_topic.security.arn
  protocol  = "email"
  endpoint  = var.alarm_email
}

# Root account usage alarm
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "${local.name_prefix}-RootUsage"
  log_group_name = aws_cloudwatch_log_group.trail.name
  pattern        = "{ ($.userIdentity.type = \"Root\") && ($.eventName != \"ConsoleLogin\") }"

  metric_transformation {
    name      = "RootUsageCount"
    namespace = "Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "${local.name_prefix}-RootUsage"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = aws_cloudwatch_log_metric_filter.root_usage.metric_transformation[0].name
  namespace           = "Security"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_actions       = [aws_sns_topic.security.arn]
}

# Successful console login without MFA alarm
resource "aws_cloudwatch_log_metric_filter" "no_mfa_login" {
  name           = "${local.name_prefix}-NoMfaLogin"
  log_group_name = aws_cloudwatch_log_group.trail.name
  pattern        = "{ ($.eventName = \"ConsoleLogin\") && ($.additionalEventData.MFAUsed != \"Yes\") && ($.responseElements.ConsoleLogin = \"Success\") }"

  metric_transformation {
    name      = "NoMfaConsoleLogin"
    namespace = "Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "no_mfa_login" {
  alarm_name          = "${local.name_prefix}-NoMfaConsoleLogin"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = aws_cloudwatch_log_metric_filter.no_mfa_login.metric_transformation[0].name
  namespace           = "Security"
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_actions       = [aws_sns_topic.security.arn]
}

########################
# Outputs
########################