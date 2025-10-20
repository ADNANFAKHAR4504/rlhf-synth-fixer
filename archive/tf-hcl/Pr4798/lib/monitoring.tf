# ============================================================================
# SNS Topic for Alerts
# ============================================================================

resource "aws_sns_topic" "alerts" {
  name              = local.alerts_topic_name
  kms_master_key_id = aws_kms_key.primary.id

  tags = merge(
    local.common_tags,
    {
      Name = local.alerts_topic_name
      Type = "Alert Notifications"
    }
  )
}

resource "aws_sns_topic_subscription" "email_alerts" {
  count = length(var.alarm_email_endpoints)

  topic_arn = aws_sns_topic.alerts.arn
  protocol  = "email"
  endpoint  = var.alarm_email_endpoints[count.index]
}

# ============================================================================
# CloudTrail
# ============================================================================

resource "aws_cloudtrail" "main" {
  count = var.enable_cloudtrail ? 1 : 0

  name                          = local.cloudtrail_name
  s3_bucket_name                = aws_s3_bucket.audit.id
  s3_key_prefix                 = local.cloudtrail_s3_key_prefix
  include_global_service_events = true
  is_multi_region_trail         = true
  enable_logging                = true
  enable_log_file_validation    = true
  kms_key_id                    = local.audit_kms_key_arn

  event_selector {
    read_write_type           = "All"
    include_management_events = true

    data_resource {
      type = "AWS::S3::Object"

      values = [
        "${aws_s3_bucket.primary.arn}/*"
      ]
    }
  }

  cloud_watch_logs_group_arn = var.cloudtrail_cloudwatch_logs_enabled ? "${aws_cloudwatch_log_group.cloudtrail[0].arn}:*" : null
  cloud_watch_logs_role_arn  = var.cloudtrail_cloudwatch_logs_enabled ? aws_iam_role.cloudtrail_cloudwatch[0].arn : null

  tags = merge(
    local.common_tags,
    {
      Name = local.cloudtrail_name
      Type = "Audit Trail"
    }
  )

  depends_on = [aws_s3_bucket_policy.audit]
}

# CloudWatch Log Group for CloudTrail
resource "aws_cloudwatch_log_group" "cloudtrail" {
  count = var.cloudtrail_cloudwatch_logs_enabled ? 1 : 0

  name              = local.cloudtrail_log_group_name
  retention_in_days = var.cloudtrail_log_retention_days
  kms_key_id        = local.audit_kms_key_arn

  tags = merge(
    local.common_tags,
    {
      Name = local.cloudtrail_log_group_name
      Type = "CloudTrail Logs"
    }
  )
}

# ============================================================================
# CloudWatch Metric Filters
# ============================================================================

# Metric Filter for Access Denied Events
resource "aws_cloudwatch_log_metric_filter" "access_denied" {
  count = var.cloudtrail_cloudwatch_logs_enabled ? 1 : 0

  name           = local.filter_access_denied_name
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "AccessDeniedCount"
    namespace = "LegalDocStorage/Security"
    value     = "1"
  }
}

# Metric Filter for S3 Deletions
resource "aws_cloudwatch_log_metric_filter" "deletions" {
  count = var.cloudtrail_cloudwatch_logs_enabled ? 1 : 0

  name           = local.filter_deletions_name
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name
  pattern        = "{ ($.eventName = DeleteObject) || ($.eventName = DeleteObjectVersion) }"

  metric_transformation {
    name      = "S3DeletionCount"
    namespace = "LegalDocStorage/Security"
    value     = "1"
  }
}

# Metric Filter for Versioning Configuration Changes
resource "aws_cloudwatch_log_metric_filter" "versioning_changes" {
  count = var.cloudtrail_cloudwatch_logs_enabled ? 1 : 0

  name           = local.filter_versioning_changes_name
  log_group_name = aws_cloudwatch_log_group.cloudtrail[0].name
  pattern        = "{ $.eventName = PutBucketVersioning }"

  metric_transformation {
    name      = "VersioningChangeCount"
    namespace = "LegalDocStorage/Security"
    value     = "1"
  }
}

# ============================================================================
# CloudWatch Alarms
# ============================================================================

# Alarm for Failed S3 Requests
resource "aws_cloudwatch_metric_alarm" "failed_requests" {
  alarm_name          = local.alarm_failed_requests_name
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = var.failed_requests_threshold
  alarm_description   = "Triggers when S3 4xx errors exceed threshold (possible unauthorized access attempts)"
  treat_missing_data  = "notBreaching"

  dimensions = {
    BucketName = aws_s3_bucket.primary.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# Alarm for Unexpected Delete Operations
resource "aws_cloudwatch_metric_alarm" "unexpected_deletes" {
  count = var.cloudtrail_cloudwatch_logs_enabled ? 1 : 0

  alarm_name          = local.alarm_unexpected_deletes_name
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "S3DeletionCount"
  namespace           = "LegalDocStorage/Security"
  period              = 300
  statistic           = "Sum"
  threshold           = var.unexpected_delete_threshold
  alarm_description   = "Triggers when S3 delete operations exceed threshold"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# Alarm for High Download Volume
resource "aws_cloudwatch_metric_alarm" "high_download_volume" {
  alarm_name          = local.alarm_high_download_volume_name
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "BytesDownloaded"
  namespace           = "AWS/S3"
  period              = 3600
  statistic           = "Sum"
  threshold           = var.high_download_volume_threshold_gb * 1073741824 # Convert GB to bytes
  alarm_description   = "Triggers when download volume exceeds threshold (potential data leak)"
  treat_missing_data  = "notBreaching"

  dimensions = {
    BucketName = aws_s3_bucket.primary.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# Alarm for Upload Failures
resource "aws_cloudwatch_metric_alarm" "upload_failures" {
  alarm_name          = local.alarm_upload_failures_name
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 2
  metric_name         = "5xxErrors"
  namespace           = "AWS/S3"
  period              = 300
  statistic           = "Sum"
  threshold           = 10
  alarm_description   = "Triggers when S3 5xx errors exceed threshold (system issues)"
  treat_missing_data  = "notBreaching"

  dimensions = {
    BucketName = aws_s3_bucket.primary.id
  }

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# Alarm for Compliance Check Failures
resource "aws_cloudwatch_metric_alarm" "compliance_failures" {
  alarm_name          = local.alarm_compliance_failures_name
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = 1
  metric_name         = "ComplianceFailures"
  namespace           = "LegalDocStorage/Compliance"
  period              = 3600
  statistic           = "Sum"
  threshold           = 0
  alarm_description   = "Triggers when compliance checks fail"
  treat_missing_data  = "notBreaching"

  alarm_actions = [aws_sns_topic.alerts.arn]

  tags = local.common_tags
}

# ============================================================================
# CloudWatch Dashboard
# ============================================================================

resource "aws_cloudwatch_dashboard" "storage" {
  count = var.enable_cloudwatch_dashboard ? 1 : 0

  dashboard_name = local.dashboard_name

  dashboard_body = jsonencode({
    widgets = [
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "BucketSizeBytes", { stat = "Average", label = "Storage Size (Bytes)" }],
            [".", "NumberOfObjects", { stat = "Average", label = "Object Count" }]
          ]
          period = 86400
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Primary Bucket Storage Metrics"
          dimensions = {
            BucketName  = aws_s3_bucket.primary.id
            StorageType = "StandardStorage"
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["AWS/S3", "4xxErrors", { stat = "Sum", label = "4xx Errors" }],
            [".", "5xxErrors", { stat = "Sum", label = "5xx Errors" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "S3 Errors"
          dimensions = {
            BucketName = aws_s3_bucket.primary.id
          }
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["LegalDocStorage/Security", "S3DeletionCount", { stat = "Sum", label = "Delete Operations" }],
            [".", "AccessDeniedCount", { stat = "Sum", label = "Access Denied" }],
            [".", "VersioningChangeCount", { stat = "Sum", label = "Versioning Changes" }]
          ]
          period = 300
          stat   = "Sum"
          region = data.aws_region.current.name
          title  = "Security Events"
        }
      },
      {
        type = "metric"
        properties = {
          metrics = [
            ["LegalDocStorage/Compliance", "ComplianceFailures", { stat = "Sum", label = "Compliance Failures" }],
            [".", "VersioningEnabled", { stat = "Average", label = "Versioning Status" }],
            [".", "ObjectLockEnabled", { stat = "Average", label = "Object Lock Status" }]
          ]
          period = 3600
          stat   = "Average"
          region = data.aws_region.current.name
          title  = "Compliance Status"
        }
      },
      {
        type = "log"
        properties = {
          query  = "SOURCE '${local.cloudtrail_log_group_name}' | fields @timestamp, eventName, userIdentity.principalId, requestParameters.bucketName | filter eventName like /Delete/ | sort @timestamp desc | limit 20"
          region = data.aws_region.current.name
          title  = "Recent Delete Operations"
        }
      }
    ]
  })
}

# ============================================================================
# EventBridge Rules for Lambda Triggers
# ============================================================================

# Daily Compliance Check Rule
resource "aws_cloudwatch_event_rule" "compliance_check" {
  name                = local.compliance_check_rule_name
  description         = "Trigger compliance check Lambda daily"
  schedule_expression = var.compliance_check_schedule

  tags = merge(
    local.common_tags,
    {
      Name = local.compliance_check_rule_name
      Type = "Compliance Trigger"
    }
  )
}

resource "aws_cloudwatch_event_target" "compliance_check" {
  rule      = aws_cloudwatch_event_rule.compliance_check.name
  target_id = "ComplianceLambdaTarget"
  arn       = aws_lambda_function.compliance_check.arn
}

resource "aws_lambda_permission" "allow_eventbridge_compliance" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.compliance_check.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.compliance_check.arn
}

# Monthly Reporting Rule
resource "aws_cloudwatch_event_rule" "monthly_report" {
  name                = local.reporting_rule_name
  description         = "Trigger monthly report Lambda"
  schedule_expression = var.reporting_schedule

  tags = merge(
    local.common_tags,
    {
      Name = local.reporting_rule_name
      Type = "Reporting Trigger"
    }
  )
}

resource "aws_cloudwatch_event_target" "monthly_report" {
  rule      = aws_cloudwatch_event_rule.monthly_report.name
  target_id = "ReportingLambdaTarget"
  arn       = aws_lambda_function.monthly_report.arn
}

resource "aws_lambda_permission" "allow_eventbridge_reporting" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.monthly_report.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.monthly_report.arn
}

# EventBridge Rule for S3 Configuration Changes
resource "aws_cloudwatch_event_rule" "s3_config_changes" {
  name        = "${local.name_prefix}-s3-config-changes-${local.name_suffix}"
  description = "Alert on S3 bucket configuration changes"

  event_pattern = jsonencode({
    source      = ["aws.s3"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["s3.amazonaws.com"]
      eventName = [
        "PutBucketVersioning",
        "PutBucketObjectLockConfiguration",
        "DeleteBucketPolicy",
        "PutBucketPublicAccessBlock"
      ]
      requestParameters = {
        bucketName = [aws_s3_bucket.primary.id]
      }
    }
  })

  tags = merge(
    local.common_tags,
    {
      Name = "${local.name_prefix}-s3-config-changes"
      Type = "Security Alert"
    }
  )
}

resource "aws_cloudwatch_event_target" "s3_config_changes_sns" {
  rule      = aws_cloudwatch_event_rule.s3_config_changes.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.alerts.arn
}

resource "aws_sns_topic_policy" "allow_eventbridge" {
  arn = aws_sns_topic.alerts.arn

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "events.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.alerts.arn
      }
    ]
  })
}
