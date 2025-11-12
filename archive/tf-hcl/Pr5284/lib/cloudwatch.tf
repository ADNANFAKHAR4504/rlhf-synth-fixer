# cloudwatch.tf - CloudWatch alarms and monitoring setup

# SNS topic for security alerts
resource "aws_sns_topic" "security_alerts" {
  name              = "${local.name_prefix}-security-alerts"
  kms_master_key_id = aws_kms_key.s3.id

  tags = local.mandatory_tags
}

# SNS topic subscription
resource "aws_sns_topic_subscription" "security_team" {
  topic_arn = aws_sns_topic.security_alerts.arn
  protocol  = "email"
  endpoint  = var.security_team_email
}

# CloudWatch log group for audit logs
resource "aws_cloudwatch_log_group" "audit_logs" {
  name              = "/aws/audit/${local.name_prefix}"
  retention_in_days = 365
  kms_key_id        = aws_kms_key.s3.arn

  depends_on = [aws_kms_key.s3]

  tags = local.mandatory_tags

  lifecycle {
    prevent_destroy = false
  }
}

# Metric filter for root account usage
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "${local.name_prefix}-root-account-usage"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{ ($.userIdentity.type = \"Root\") && ($.userIdentity.invokedBy NOT EXISTS) && ($.eventType != \"AwsServiceEvent\") }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for root account usage
resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "${local.name_prefix}-root-account-usage"
  alarm_description   = "Alert when root account is used"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# Metric filter for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api" {
  name           = "${local.name_prefix}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{ ($.errorCode = *UnauthorizedOperation) || ($.errorCode = AccessDenied*) }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for unauthorized API calls
resource "aws_cloudwatch_metric_alarm" "unauthorized_api" {
  alarm_name          = "${local.name_prefix}-unauthorized-api-calls"
  alarm_description   = "Alert on unauthorized API calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# Metric filter for IAM policy changes
resource "aws_cloudwatch_log_metric_filter" "iam_changes" {
  name           = "${local.name_prefix}-iam-policy-changes"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{($.eventName=DeleteGroupPolicy)||($.eventName=DeleteRolePolicy)||($.eventName=DeleteUserPolicy)||($.eventName=PutGroupPolicy)||($.eventName=PutRolePolicy)||($.eventName=PutUserPolicy)||($.eventName=CreatePolicy)||($.eventName=DeletePolicy)||($.eventName=CreatePolicyVersion)||($.eventName=DeletePolicyVersion)||($.eventName=AttachRolePolicy)||($.eventName=DetachRolePolicy)||($.eventName=AttachUserPolicy)||($.eventName=DetachUserPolicy)||($.eventName=AttachGroupPolicy)||($.eventName=DetachGroupPolicy)}"

  metric_transformation {
    name      = "IAMPolicyChanges"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for IAM policy changes
resource "aws_cloudwatch_metric_alarm" "iam_changes" {
  alarm_name          = "${local.name_prefix}-iam-policy-changes"
  alarm_description   = "Alert on IAM policy changes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChanges"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# Metric filter for console sign-in failures
resource "aws_cloudwatch_log_metric_filter" "console_signin_failure" {
  name           = "${local.name_prefix}-console-signin-failures"
  log_group_name = aws_cloudwatch_log_group.audit_logs.name
  pattern        = "{ ($.eventName = ConsoleLogin) && ($.errorMessage = \"Failed authentication\") }"

  metric_transformation {
    name      = "ConsoleSignInFailures"
    namespace = "${local.name_prefix}/Security"
    value     = "1"
  }
}

# Alarm for console sign-in failures
resource "aws_cloudwatch_metric_alarm" "console_signin_failure" {
  alarm_name          = "${local.name_prefix}-console-signin-failures"
  alarm_description   = "Alert on multiple console sign-in failures"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsoleSignInFailures"
  namespace           = "${local.name_prefix}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "5"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]
  treat_missing_data  = "notBreaching"

  tags = local.mandatory_tags
}

# CloudWatch dashboard for security monitoring
resource "aws_cloudwatch_dashboard" "security" {
  dashboard_name = "${local.name_prefix}-security-dashboard"

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
            ["${local.name_prefix}/Security", "RootAccountUsage"],
            [".", "UnauthorizedAPICalls"],
            [".", "IAMPolicyChanges"],
            [".", "ConsoleSignInFailures"]
          ]
          view    = "timeSeries"
          stacked = false
          region  = var.allowed_regions[0]
          title   = "Security Events"
          period  = 300
        }
      }
    ]
  })
}