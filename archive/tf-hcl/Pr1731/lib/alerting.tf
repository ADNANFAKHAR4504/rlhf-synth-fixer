########################
# SNS Topics for Alarm Notifications
########################

variable "alarm_notification_emails_primary" {
  description = "List of email addresses to subscribe to primary alarm notifications"
  type        = list(string)
  default     = []
}

variable "alarm_notification_emails_secondary" {
  description = "List of email addresses to subscribe to secondary alarm notifications"
  type        = list(string)
  default     = []
}

resource "aws_sns_topic" "alarm_notifications_primary" {
  provider = aws.primary
  name     = "${var.name_prefix}-${var.environment}-alarm-notifications-primary"
  tags = {
    Name        = "${var.name_prefix}-${var.environment}-alarm-notifications-primary"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "secure-env"
  }
}

resource "aws_sns_topic" "alarm_notifications_secondary" {
  provider = aws.secondary
  name     = "${var.name_prefix}-${var.environment}-alarm-notifications-secondary"
  tags = {
    Name        = "${var.name_prefix}-${var.environment}-alarm-notifications-secondary"
    Environment = var.environment
    ManagedBy   = "terraform"
    Project     = "secure-env"
  }
}

resource "aws_sns_topic_subscription" "alarm_notifications_primary_email" {
  count     = length(var.alarm_notification_emails_primary)
  topic_arn = aws_sns_topic.alarm_notifications_primary.arn
  protocol  = "email"
  endpoint  = var.alarm_notification_emails_primary[count.index]
}

resource "aws_sns_topic_subscription" "alarm_notifications_secondary_email" {
  count     = length(var.alarm_notification_emails_secondary)
  topic_arn = aws_sns_topic.alarm_notifications_secondary.arn
  protocol  = "email"
  endpoint  = var.alarm_notification_emails_secondary[count.index]
}

########################
# Alerting for Unauthorized Access Attempts
########################

resource "aws_cloudwatch_log_metric_filter" "unauthorized_access_primary" {
  provider         = aws.primary
  name             = "${var.name_prefix}-${var.environment}-unauthorized-access-primary"
  log_group_name   = aws_cloudwatch_log_group.lambda_logs_primary.name
  pattern          = "\"Unauthorized\" \"AccessDenied\" \"UserNotAuthorized\""
  metric_transformation {
    name      = "UnauthorizedAccessCount"
    namespace = "${var.name_prefix}/${var.environment}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_access_alarm_primary" {
  provider            = aws.primary
  alarm_name          = "${var.name_prefix}-${var.environment}-unauthorized-access-alarm-primary"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = aws_cloudwatch_log_metric_filter.unauthorized_access_primary.metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.unauthorized_access_primary.metric_transformation[0].namespace
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert for unauthorized access attempts detected in Lambda logs (primary region)"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alarm_notifications_primary.arn]
}

resource "aws_cloudwatch_log_metric_filter" "unauthorized_access_secondary" {
  provider         = aws.secondary
  name             = "${var.name_prefix}-${var.environment}-unauthorized-access-secondary"
  log_group_name   = aws_cloudwatch_log_group.lambda_logs_secondary.name
  pattern          = "\"Unauthorized\" \"AccessDenied\" \"UserNotAuthorized\""
  metric_transformation {
    name      = "UnauthorizedAccessCount"
    namespace = "${var.name_prefix}/${var.environment}/Security"
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "unauthorized_access_alarm_secondary" {
  provider            = aws.secondary
  alarm_name          = "${var.name_prefix}-${var.environment}-unauthorized-access-alarm-secondary"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = 1
  metric_name         = aws_cloudwatch_log_metric_filter.unauthorized_access_secondary.metric_transformation[0].name
  namespace           = aws_cloudwatch_log_metric_filter.unauthorized_access_secondary.metric_transformation[0].namespace
  period              = 60
  statistic           = "Sum"
  threshold           = 1
  alarm_description   = "Alert for unauthorized access attempts detected in Lambda logs (secondary region)"
  actions_enabled     = true
  alarm_actions       = [aws_sns_topic.alarm_notifications_secondary.arn]
}

output "unauthorized_access_alarm_primary_name" {
  value = aws_cloudwatch_metric_alarm.unauthorized_access_alarm_primary.alarm_name
}

output "unauthorized_access_alarm_secondary_name" {
  value = aws_cloudwatch_metric_alarm.unauthorized_access_alarm_secondary.alarm_name
}