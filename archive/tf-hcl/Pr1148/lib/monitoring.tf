# monitoring.tf
# CloudWatch alerting and monitoring configurations

# SNS Topic for alerts
resource "aws_sns_topic" "alerts" {
  name = "${var.project_name}-alerts-${local.name_suffix}"

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-alerts-${local.name_suffix}"
    Type = "SNSTopic"
  })
}

# CloudWatch Alarm for VPC Flow Log errors
resource "aws_cloudwatch_metric_alarm" "flow_log_errors" {
  alarm_name          = "${var.project_name}-flow-log-errors-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "AWS/Logs"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_description   = "This metric monitors VPC Flow Log errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    LogGroupName = aws_cloudwatch_log_group.vpc_flow_logs.name
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-flow-log-errors-${local.name_suffix}"
    Type = "CloudWatchAlarm"
  })
}

# CloudWatch Alarm for CloudTrail API errors
resource "aws_cloudwatch_metric_alarm" "cloudtrail_errors" {
  alarm_name          = "${var.project_name}-cloudtrail-errors-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "ErrorCount"
  namespace           = "CloudWatchLogs"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors CloudTrail API errors"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-cloudtrail-errors-${local.name_suffix}"
    Type = "CloudWatchAlarm"
  })
}

# CloudWatch Alarm for S3 bucket access anomalies
resource "aws_cloudwatch_metric_alarm" "s3_access_anomalies" {
  alarm_name          = "${var.project_name}-s3-access-anomalies-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "3"
  metric_name         = "4xxErrors"
  namespace           = "AWS/S3"
  period              = "600"
  statistic           = "Sum"
  threshold           = "50"
  alarm_description   = "This metric monitors S3 access anomalies (4xx errors)"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    BucketName = aws_s3_bucket.cloudtrail_logs.bucket
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-s3-access-anomalies-${local.name_suffix}"
    Type = "CloudWatchAlarm"
  })
}

# CloudWatch Alarm for KMS key usage anomalies
resource "aws_cloudwatch_metric_alarm" "kms_key_usage" {
  alarm_name          = "${var.project_name}-kms-key-usage-${local.name_suffix}"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "2"
  metric_name         = "NumberOfRequestsExceeded"
  namespace           = "AWS/KMS"
  period              = "300"
  statistic           = "Sum"
  threshold           = "100"
  alarm_description   = "This metric monitors excessive KMS key usage"
  alarm_actions       = [aws_sns_topic.alerts.arn]

  dimensions = {
    KeyId = aws_kms_key.secrets_key.key_id
  }

  tags = merge(local.common_tags, {
    Name = "${var.project_name}-kms-key-usage-${local.name_suffix}"
    Type = "CloudWatchAlarm"
  })
}

# CloudWatch Dashboard for infrastructure monitoring
resource "aws_cloudwatch_dashboard" "infrastructure" {
  dashboard_name = "${var.project_name}-infrastructure-${local.name_suffix}"

  dashboard_body = jsonencode({
    widgets = [
      {
        type   = "metric"
        x      = 0
        y      = 0
        width  = 12
        height = 6

        properties = {
          metrics = [
            ["AWS/Logs", "IncomingLogEvents", "LogGroupName", aws_cloudwatch_log_group.vpc_flow_logs.name],
            ["AWS/S3", "BucketRequests", "BucketName", aws_s3_bucket.cloudtrail_logs.bucket, "FilterId", "EntireBucket"],
            ["AWS/KMS", "NumberOfRequests", "KeyId", aws_kms_key.secrets_key.key_id]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.region
          title   = "Infrastructure Metrics"
          period  = 300
        }
      }
    ]
  })

  # CloudWatch dashboards do not support tags
}