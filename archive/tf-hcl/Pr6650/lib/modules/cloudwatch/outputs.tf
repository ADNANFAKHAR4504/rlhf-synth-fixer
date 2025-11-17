output "sns_topic_arn" {
  description = "SNS topic ARN for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.dr_monitoring.dashboard_name
}

output "replication_lag_alarm_arn" {
  description = "Replication lag alarm ARN"
  value       = aws_cloudwatch_metric_alarm.primary_replication_lag.arn
}
