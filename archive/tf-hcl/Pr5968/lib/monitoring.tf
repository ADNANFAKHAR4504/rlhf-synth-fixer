# monitoring.tf

# GuardDuty Detector - Use existing detector
data "aws_guardduty_detector" "main" {}

# Enable S3 protection for GuardDuty
resource "aws_guardduty_detector_feature" "s3_protection" {
  detector_id = data.aws_guardduty_detector.main.id
  name        = "S3_DATA_EVENTS"
  status      = "ENABLED"
}

# SNS Topic for Security Alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "security-alerts-${var.environment_suffix}"
  kms_master_key_id = aws_kms_key.logs.id

  tags = merge(var.tags, {
    Name = "security-alerts-${var.environment_suffix}"
  })
}

# EventBridge Rule for GuardDuty Findings
resource "aws_cloudwatch_event_rule" "guardduty_findings" {
  name        = "guardduty-high-severity-${var.environment_suffix}"
  description = "Capture GuardDuty findings with HIGH severity"

  event_pattern = jsonencode({
    source      = ["aws.guardduty"]
    detail-type = ["GuardDuty Finding"]
    detail = {
      severity = [7, 7.0, 7.1, 7.2, 7.3, 7.4, 7.5, 7.6, 7.7, 7.8, 7.9, 8, 8.0, 8.1, 8.2, 8.3, 8.4, 8.5, 8.6, 8.7, 8.8, 8.9]
    }
  })

  tags = merge(var.tags, {
    Name = "guardduty-high-severity-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_event_target" "guardduty_sns" {
  rule      = aws_cloudwatch_event_rule.guardduty_findings.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_alerts.arn
}

# SNS Topic Policy
resource "aws_sns_topic_policy" "security_alerts" {
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

# AWS Config Configuration
resource "aws_config_configuration_recorder" "main" {
  name     = "config-recorder-${var.environment_suffix}"
  role_arn = aws_iam_role.config.arn

  recording_group {
    all_supported = true
  }
}

resource "aws_config_delivery_channel" "main" {
  name           = "config-delivery-${var.environment_suffix}"
  s3_bucket_name = aws_s3_bucket.config.bucket

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_configuration_recorder_status" "main" {
  name       = aws_config_configuration_recorder.main.name
  is_enabled = true

  depends_on = [aws_config_delivery_channel.main]
}

# S3 Bucket for AWS Config
resource "aws_s3_bucket" "config" {
  bucket = "aws-config-${var.environment_suffix}-xy"

  tags = merge(var.tags, {
    Name = "aws-config-${var.environment_suffix}-xy"
  })
}

resource "aws_s3_bucket_versioning" "config" {
  bucket = aws_s3_bucket.config.id

  versioning_configuration {
    status = "Enabled"
  }
}

resource "aws_s3_bucket_server_side_encryption_configuration" "config" {
  bucket = aws_s3_bucket.config.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm     = "aws:kms"
      kms_master_key_id = aws_kms_key.s3.arn
    }
  }
}

resource "aws_s3_bucket_public_access_block" "config" {
  bucket = aws_s3_bucket.config.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# IAM Role for AWS Config
resource "aws_iam_role" "config" {
  name = "aws-config-role-${var.environment_suffix}-xy"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "config.amazonaws.com"
        }
      }
    ]
  })

  managed_policy_arns = ["arn:aws:iam::aws:policy/service-role/AWS_ConfigRole"]

  tags = merge(var.tags, {
    Name = "aws-config-role-${var.environment_suffix}-xy"
  })
}

resource "aws_iam_role_policy" "config_s3" {
  name = "aws-config-s3-policy-${var.environment_suffix}"
  role = aws_iam_role.config.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetBucketVersioning",
          "s3:PutObject",
          "s3:GetObject"
        ]
        Resource = [
          aws_s3_bucket.config.arn,
          "${aws_s3_bucket.config.arn}/*"
        ]
      }
    ]
  })
}

# AWS Config Rules
resource "aws_config_config_rule" "encrypted_volumes" {
  name = "encrypted-volumes-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "ENCRYPTED_VOLUMES"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "ec2_imdsv2" {
  name = "ec2-imdsv2-check-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "EC2_IMDSV2_CHECK"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_bucket_public_read" {
  name = "s3-bucket-public-read-prohibited-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_READ_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

resource "aws_config_config_rule" "s3_bucket_public_write" {
  name = "s3-bucket-public-write-prohibited-${var.environment_suffix}"

  source {
    owner             = "AWS"
    source_identifier = "S3_BUCKET_PUBLIC_WRITE_PROHIBITED"
  }

  depends_on = [aws_config_configuration_recorder.main]
}

# CloudWatch Log Group for Security Events
resource "aws_cloudwatch_log_group" "security_events" {
  name              = "/aws/security/events-${var.environment_suffix}-xy"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.logs.arn

  tags = merge(var.tags, {
    Name = "security-events-${var.environment_suffix}-xy"
  })
}

# CloudWatch Alarms
resource "aws_cloudwatch_log_metric_filter" "root_login" {
  name           = "root-account-login-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.security_events.name
  pattern        = "{ $.userIdentity.type = \"Root\" && $.userIdentity.invokedBy NOT EXISTS && $.eventType != \"AwsServiceEvent\" }"

  metric_transformation {
    name      = "RootAccountLoginCount"
    namespace = "SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "root_login" {
  alarm_name          = "root-account-login-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountLoginCount"
  namespace           = "SecurityMetrics"
  period              = "60"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Alert on root account login attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.tags, {
    Name = "root-account-login-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_log_metric_filter" "failed_auth" {
  name           = "failed-authentication-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.security_events.name
  pattern        = "{ $.errorCode = \"*UnauthorizedOperation\" || $.errorCode = \"AccessDenied*\" }"

  metric_transformation {
    name      = "FailedAuthCount"
    namespace = "SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "failed_auth" {
  alarm_name          = "failed-authentication-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedAuthCount"
  namespace           = "SecurityMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert on multiple failed authentication attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.tags, {
    Name = "failed-authentication-${var.environment_suffix}"
  })
}

resource "aws_cloudwatch_log_metric_filter" "unauthorized_api" {
  name           = "unauthorized-api-calls-${var.environment_suffix}"
  log_group_name = aws_cloudwatch_log_group.security_events.name
  pattern        = "{ $.errorCode = \"*Unauthorized*\" || $.errorCode = \"AccessDenied*\" || $.errorCode = \"Forbidden\" }"

  metric_transformation {
    name      = "UnauthorizedAPICallCount"
    namespace = "SecurityMetrics"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_api" {
  alarm_name          = "unauthorized-api-calls-${var.environment_suffix}"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICallCount"
  namespace           = "SecurityMetrics"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "Alert on unauthorized API call attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = merge(var.tags, {
    Name = "unauthorized-api-calls-${var.environment_suffix}"
  })
}
