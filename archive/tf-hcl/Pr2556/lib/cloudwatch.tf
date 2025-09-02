# CloudWatch monitoring, alarms, and metric filters for security and operations
# Implements real-time monitoring for security events and system health

# Metric filter for root account usage detection
resource "aws_cloudwatch_log_metric_filter" "root_usage" {
  name           = "${var.project_name}-${var.environment}-root-usage"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.userIdentity.type = \"Root\") && ($.userIdentity.invokedBy NOT EXISTS) && ($.eventType != \"AwsServiceEvent\") }"

  metric_transformation {
    name      = "RootAccountUsage"
    namespace = "${var.project_name}/${var.environment}/Security"
    value     = "1"
  }
}

# CloudWatch alarm for root account usage
resource "aws_cloudwatch_metric_alarm" "root_usage_alarm" {
  alarm_name          = "${var.project_name}-${var.environment}-root-account-usage"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "RootAccountUsage"
  namespace           = "${var.project_name}/${var.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "This metric monitors root account usage"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "${var.project_name}-${var.environment}-root-usage-alarm"
  }
}

# Metric filter for failed console logins
resource "aws_cloudwatch_log_metric_filter" "failed_console_logins" {
  name           = "${var.project_name}-${var.environment}-failed-console-logins"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.eventName = ConsoleLogin) && ($.errorMessage EXISTS) }"

  metric_transformation {
    name      = "FailedConsoleLogins"
    namespace = "${var.project_name}/${var.environment}/Security"
    value     = "1"
  }
}

# CloudWatch alarm for failed console logins
resource "aws_cloudwatch_metric_alarm" "failed_console_logins_alarm" {
  alarm_name          = "${var.project_name}-${var.environment}-failed-console-logins"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "FailedConsoleLogins"
  namespace           = "${var.project_name}/${var.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "3"
  alarm_description   = "This metric monitors failed console login attempts"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "${var.project_name}-${var.environment}-failed-logins-alarm"
  }
}

# Metric filter for unauthorized API calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls" {
  name           = "${var.project_name}-${var.environment}-unauthorized-api-calls"
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_name}/${var.environment}/Security"
    value     = "1"
  }
}

# CloudWatch alarm for unauthorized API calls
resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls_alarm" {
  alarm_name          = "${var.project_name}-${var.environment}-unauthorized-api-calls"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${var.project_name}/${var.environment}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors unauthorized API calls"
  alarm_actions       = [aws_sns_topic.security_alerts.arn]

  tags = {
    Name = "${var.project_name}-${var.environment}-unauthorized-api-alarm"
  }
}

# CloudWatch dashboard for security monitoring
resource "aws_cloudwatch_dashboard" "security_dashboard" {
  dashboard_name = "${var.project_name}-${var.environment}-security-dashboard"

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
            ["${var.project_name}/${var.environment}/Security", "RootAccountUsage"],
            [".", "FailedConsoleLogins"],
            [".", "UnauthorizedAPICalls"]
          ]
          period = 300
          stat   = "Sum"
          region = var.aws_region
          title  = "Security Metrics"
        }
      }
    ]
  })
}
