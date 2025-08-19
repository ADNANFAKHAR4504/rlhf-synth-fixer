########################
# Alerting for Unauthorized Access Attempts
########################

# CloudWatch Metric Filter for Unauthorized Access (Primary)
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

# CloudWatch Alarm for Unauthorized Access (Primary)
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
  actions_enabled     = false # Set to true and add SNS topic ARN for notifications
}

# CloudWatch Metric Filter for Unauthorized Access (Secondary)
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

# CloudWatch Alarm for Unauthorized Access (Secondary)
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
  actions_enabled     = false # Set to true and add SNS topic ARN for notifications
}

