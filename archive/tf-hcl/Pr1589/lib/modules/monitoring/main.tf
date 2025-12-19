# CloudWatch Metric Filter for Unauthorized API Calls
resource "aws_cloudwatch_log_metric_filter" "unauthorized_calls" {
  name           = "${var.project_name}-${var.environment_suffix}-unauthorized-calls"
  log_group_name = var.cloudtrail_log_group_name
  pattern        = "{ ($.errorCode = \"*UnauthorizedOperation\") || ($.errorCode = \"AccessDenied*\") }"

  metric_transformation {
    name      = "UnauthorizedAPICalls"
    namespace = "${var.project_name}/${var.environment_name}/Security"
    value     = "1"
  }
}

# CloudWatch Alarm for Unauthorized API Calls
resource "aws_cloudwatch_metric_alarm" "unauthorized_calls" {
  alarm_name          = "${var.project_name}-${var.environment_suffix}-unauthorized-calls"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "1"
  metric_name         = "UnauthorizedAPICalls"
  namespace           = "${var.project_name}/${var.environment_name}/Security"
  period              = "300"
  statistic           = "Sum"
  threshold           = "1"
  alarm_description   = "Unauthorized API calls detected"
  alarm_actions       = [var.sns_topic_arn]
  tags                = var.common_tags
}
