# CloudWatch Log Group for failed login attempts (without KMS for now)
resource "aws_cloudwatch_log_group" "security_logs" {
  name              = var.log_group_name
  retention_in_days = var.retention_in_days

  tags = {
    Name    = "SecConfig-Security-Logs"
    Project = "SecurityConfiguration"
  }
}

# CloudWatch Log Metric Filter for failed logins
resource "aws_cloudwatch_log_metric_filter" "failed_logins" {
  name           = "SecConfig-Failed-Console-Logins"
  log_group_name = aws_cloudwatch_log_group.security_logs.name

  # Use JSON matching instead of dot notation
  pattern = "{ ($.eventName = \"ConsoleLogin\") && ($.responseElements.ConsoleLogin = \"Failure\") }"

  metric_transformation {
    name      = "ConsoleLoginFailures"
    namespace = "SecConfig/Security"
    value     = "1"
  }
}


# CloudWatch Alarm for failed login attempts
resource "aws_cloudwatch_metric_alarm" "failed_logins" {
  alarm_name          = "SecConfig-Failed-Logins"
  comparison_operator = "GreaterThanThreshold"
  evaluation_periods  = "1"
  metric_name         = "ConsoleLoginFailures"
  namespace           = "SecConfig/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "10"
  alarm_description   = "This metric monitors failed console login attempts"
  alarm_actions       = [var.sns_topic]

  tags = {
    Name    = "SecConfig-Failed-Logins-Alarm"
    Project = "SecurityConfiguration"
  }
}