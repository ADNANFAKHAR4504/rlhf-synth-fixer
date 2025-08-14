# SNS topic for security notifications
resource "aws_sns_topic" "security_notifications" {
  name = "${var.project_name}${local.suffix_string}-security-notifications"

  tags = local.common_tags
}

resource "aws_sns_topic_subscription" "email_notification" {
  topic_arn = aws_sns_topic.security_notifications.arn
  protocol  = "email"
  endpoint  = var.security_notification_email
}

# CloudWatch Log Group for monitoring
resource "aws_cloudwatch_log_group" "security_monitoring" {
  name              = "/aws/${var.project_name}${local.suffix_string}/security-monitoring"
  retention_in_days = 30

  tags = local.common_tags
}

# CloudWatch alarm for IAM policy changes
resource "aws_cloudwatch_metric_alarm" "iam_policy_changes" {
  alarm_name          = "${var.project_name}${local.suffix_string}-iam-policy-changes"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "IAMPolicyChanges"
  namespace           = "AWS/CloudTrail"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when IAM policies are changed"
  alarm_actions       = [aws_sns_topic.security_notifications.arn]

  tags = local.common_tags
}

# CloudWatch alarm for root account usage
resource "aws_cloudwatch_metric_alarm" "root_usage" {
  alarm_name          = "${var.project_name}${local.suffix_string}-root-account-usage"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "AWS/CloudTrail"
  period              = "300"
  statistic           = "Sum"
  threshold           = "0"
  alarm_description   = "Alert when root account is used"
  alarm_actions       = [aws_sns_topic.security_notifications.arn]

  tags = local.common_tags
}

# EventBridge rule for IAM changes
resource "aws_cloudwatch_event_rule" "iam_changes" {
  name        = "${var.project_name}${local.suffix_string}-iam-changes"
  description = "Capture IAM role and policy changes"

  event_pattern = jsonencode({
    source      = ["aws.iam"]
    detail-type = ["AWS API Call via CloudTrail"]
    detail = {
      eventSource = ["iam.amazonaws.com"]
      eventName = [
        "AttachRolePolicy",
        "DetachRolePolicy",
        "CreateRole",
        "DeleteRole",
        "PutRolePolicy",
        "DeleteRolePolicy"
      ]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "sns_target" {
  rule      = aws_cloudwatch_event_rule.iam_changes.name
  target_id = "SendToSNS"
  arn       = aws_sns_topic.security_notifications.arn
}

# Security Hub Standards Subscription (Security Hub account already enabled)
resource "aws_securityhub_standards_subscription" "aws_foundational" {
  standards_arn = "arn:aws:securityhub:${var.aws_region}::standards/aws-foundational-security-best-practices/v/1.0.0"
}