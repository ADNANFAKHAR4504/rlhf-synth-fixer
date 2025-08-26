resource "aws_cloudwatch_log_group" "cloudtrail" {
  name              = var.log_group_name
  retention_in_days = var.retention_in_days
  kms_key_id        = var.kms_key_id

  tags = merge(
    var.common_tags,
    {
      Name = var.log_group_name
    }
  )
}

resource "aws_cloudwatch_log_metric_filter" "security_events" {
  name           = var.metric_filter_name
  log_group_name = aws_cloudwatch_log_group.cloudtrail.name
  pattern        = var.metric_pattern

  metric_transformation {
    name      = var.metric_name
    namespace = var.metric_namespace
    value     = "1"
  }
}

resource "aws_cloudwatch_metric_alarm" "security_alarm" {
  alarm_name          = var.alarm_name
  comparison_operator = var.comparison_operator
  evaluation_periods  = var.evaluation_periods
  metric_name         = var.metric_name
  namespace           = var.metric_namespace
  period              = var.period
  statistic           = var.statistic
  threshold           = var.threshold
  alarm_description   = var.alarm_description
  actions_enabled     = true
  alarm_actions       = var.alarm_actions
}
