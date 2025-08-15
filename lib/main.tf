# main.tf - Root module for IAM security configuration

locals {
  common_tags = merge(var.tags, {
    Environment = var.environment
    ManagedBy   = "Terraform"
    Project     = "SecurityConfigurationAsCode"
  })
}

# IAM Policies
resource "aws_iam_policy" "app_deploy_policy" {
  name        = "${var.environment}-app-deploy-policy"
  description = "Policy for application deployment operations with least privilege"
  policy      = data.aws_iam_policy_document.app_deploy_policy.json

  tags = local.common_tags
}

resource "aws_iam_policy" "readonly_policy" {
  name        = "${var.environment}-readonly-policy"
  description = "Read-only access policy with explicit deny for destructive actions"
  policy      = data.aws_iam_policy_document.readonly_policy.json

  tags = local.common_tags
}

resource "aws_iam_policy" "audit_policy" {
  name        = "${var.environment}-audit-policy"
  description = "Audit and compliance policy for security monitoring"
  policy      = data.aws_iam_policy_document.audit_policy.json

  tags = local.common_tags
}

resource "aws_iam_policy" "cloudwatch_readonly_policy" {
  name        = "${var.environment}-cloudwatch-readonly-policy"
  description = "CloudWatch read-only access policy for monitoring"
  policy      = data.aws_iam_policy_document.cloudwatch_readonly_policy.json

  tags = local.common_tags
}

resource "aws_iam_policy" "s3_upload_policy" {
  name        = "${var.environment}-s3-upload-policy"
  description = "S3 upload policy for specific application bucket"
  policy      = data.aws_iam_policy_document.s3_upload_policy.json

  tags = local.common_tags
}

resource "aws_iam_policy" "cloudtrail_write_policy" {
  name        = "${var.environment}-cloudtrail-write-policy"
  description = "CloudTrail write policy for centralized logging"
  policy      = data.aws_iam_policy_document.cloudtrail_write_policy.json

  tags = local.common_tags
}

# IAM Roles
resource "aws_iam_role" "app_deploy_role" {
  name                 = "${var.environment}-AppDeployRole"
  description          = "Role for application deployment with least privilege access"
  assume_role_policy   = data.aws_iam_policy_document.cross_account_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    Purpose = "AppDeploy"
  })
}

resource "aws_iam_role" "readonly_role" {
  name                 = "${var.environment}-ReadOnlyRole"
  description          = "Role for read-only access across AWS services"
  assume_role_policy   = data.aws_iam_policy_document.cross_account_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    Purpose = "ReadOnly"
  })
}

resource "aws_iam_role" "audit_role" {
  name                 = "${var.environment}-AuditRole"
  description          = "Role for audit and compliance activities"
  assume_role_policy   = data.aws_iam_policy_document.cross_account_trust.json
  max_session_duration = 3600

  tags = merge(local.common_tags, {
    Purpose = "Audit"
  })
}

# Policy Attachments
resource "aws_iam_role_policy_attachment" "app_deploy_policy_attachment" {
  role       = aws_iam_role.app_deploy_role.name
  policy_arn = aws_iam_policy.app_deploy_policy.arn
}

resource "aws_iam_role_policy_attachment" "app_deploy_s3_upload_attachment" {
  role       = aws_iam_role.app_deploy_role.name
  policy_arn = aws_iam_policy.s3_upload_policy.arn
}

resource "aws_iam_role_policy_attachment" "readonly_policy_attachment" {
  role       = aws_iam_role.readonly_role.name
  policy_arn = aws_iam_policy.readonly_policy.arn
}

resource "aws_iam_role_policy_attachment" "readonly_cloudwatch_attachment" {
  role       = aws_iam_role.readonly_role.name
  policy_arn = aws_iam_policy.cloudwatch_readonly_policy.arn
}

resource "aws_iam_role_policy_attachment" "audit_policy_attachment" {
  role       = aws_iam_role.audit_role.name
  policy_arn = aws_iam_policy.audit_policy.arn
}

resource "aws_iam_role_policy_attachment" "audit_cloudtrail_attachment" {
  role       = aws_iam_role.audit_role.name
  policy_arn = aws_iam_policy.cloudtrail_write_policy.arn
}

# S3 Bucket for CloudTrail logs
resource "aws_s3_bucket" "cloudtrail_logs" {
  bucket        = var.log_bucket_name
  force_destroy = false

  tags = merge(local.common_tags, {
    Purpose = "CloudTrailLogs"
  })
}

resource "aws_s3_bucket_versioning" "cloudtrail_logs_versioning" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail_logs_encryption" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
    bucket_key_enabled = true
  }
}

resource "aws_s3_bucket_public_access_block" "cloudtrail_logs_pab" {
  bucket = aws_s3_bucket.cloudtrail_logs.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# S3 Bucket Policy for CloudTrail
data "aws_iam_policy_document" "cloudtrail_bucket_policy" {
  statement {
    sid    = "AWSCloudTrailAclCheck"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:GetBucketAcl"]
    resources = [aws_s3_bucket.cloudtrail_logs.arn]
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:${data.aws_partition.current.partition}:cloudtrail:${var.aws_region}:${var.account_id}:trail/${var.environment}-security-trail"]
    }
  }

  statement {
    sid    = "AWSCloudTrailWrite"
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["cloudtrail.amazonaws.com"]
    }
    actions   = ["s3:PutObject"]
    resources = ["${aws_s3_bucket.cloudtrail_logs.arn}/*"]
    condition {
      test     = "StringEquals"
      variable = "s3:x-amz-acl"
      values   = ["bucket-owner-full-control"]
    }
    condition {
      test     = "StringEquals"
      variable = "AWS:SourceArn"
      values   = ["arn:${data.aws_partition.current.partition}:cloudtrail:${var.aws_region}:${var.account_id}:trail/${var.environment}-security-trail"]
    }
  }
}

resource "aws_s3_bucket_policy" "cloudtrail_logs_policy" {
  bucket = aws_s3_bucket.cloudtrail_logs.id
  policy = data.aws_iam_policy_document.cloudtrail_bucket_policy.json
}

# SNS Topic for IAM notifications (conditional)
resource "aws_sns_topic" "iam_notifications" {
  count = var.enable_sns_notifications ? 1 : 0
  name  = "${var.environment}-iam-notifications"

  tags = merge(local.common_tags, {
    Purpose = "IAMNotifications"
  })
}

resource "aws_sns_topic_subscription" "iam_email_notification" {
  count     = var.enable_sns_notifications ? 1 : 0
  topic_arn = aws_sns_topic.iam_notifications[0].arn
  protocol  = "email"
  endpoint  = var.notification_email
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail_log_group" {
  name              = "/aws/cloudtrail/${var.environment}-security-trail"
  retention_in_days = var.cloudtrail_retention_days

  tags = merge(local.common_tags, {
    Purpose = "CloudTrailLogs"
  })
}

# IAM Role for CloudTrail to write to CloudWatch Logs
resource "aws_iam_role" "cloudtrail_cloudwatch_role" {
  name = "${var.environment}-cloudtrail-cloudwatch-role"

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
    Purpose = "CloudTrailCloudWatch"
  })
}

resource "aws_iam_role_policy" "cloudtrail_cloudwatch_policy" {
  name = "${var.environment}-cloudtrail-cloudwatch-policy"
  role = aws_iam_role.cloudtrail_cloudwatch_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Actions = [
          "logs:PutLogEvents",
          "logs:CreateLogGroup",
          "logs:CreateLogStream"
        ]
        Resources = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
      }
    ]
  })
}

# CloudTrail
resource "aws_cloudtrail" "security_trail" {
  name           = "${var.environment}-security-trail"
  s3_bucket_name = aws_s3_bucket.cloudtrail_logs.bucket

  # Management events
  event_selector {
    read_write_type           = "All"
    include_management_events = true

    # Data events (conditional)
    dynamic "data_resource" {
      for_each = var.cloudtrail_enable_data_events ? [1] : []
      content {
        type   = "AWS::S3::Object"
        values = ["arn:${data.aws_partition.current.partition}:s3:::*/*"]
      }
    }
  }

  cloud_watch_logs_group_arn = "${aws_cloudwatch_log_group.cloudtrail_log_group.arn}:*"
  cloud_watch_logs_role_arn  = aws_iam_role.cloudtrail_cloudwatch_role.arn

  enable_logging                = true
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_log_file_validation    = true

  tags = merge(local.common_tags, {
    Purpose = "SecurityAudit"
  })

  depends_on = [aws_s3_bucket_policy.cloudtrail_logs_policy]
}

# EventBridge Rule for IAM changes (conditional)
resource "aws_cloudwatch_event_rule" "iam_changes" {
  count       = var.enable_sns_notifications ? 1 : 0
  name        = "${var.environment}-iam-changes"
  description = "Capture IAM changes for security monitoring"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName = [
        "CreateRole",
        "DeleteRole",
        "AttachRolePolicy",
        "DetachRolePolicy",
        "PutRolePolicy",
        "DeleteRolePolicy",
        "CreateUser",
        "DeleteUser",
        "AttachUserPolicy",
        "DetachUserPolicy"
      ]
    }
  })

  tags = merge(local.common_tags, {
    Purpose = "IAMMonitoring"
  })
}

resource "aws_cloudwatch_event_target" "iam_changes_sns" {
  count     = var.enable_sns_notifications ? 1 : 0
  rule      = aws_cloudwatch_event_rule.iam_changes[0].name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.iam_notifications[0].arn
}

# SNS Topic Policy to allow EventBridge to publish
resource "aws_sns_topic_policy" "iam_notifications_policy" {
  count = var.enable_sns_notifications ? 1 : 0
  arn   = aws_sns_topic.iam_notifications[0].arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "sns:Publish"
        Resource = aws_sns_topic.iam_notifications[0].arn
      }
    ]
  })
}
