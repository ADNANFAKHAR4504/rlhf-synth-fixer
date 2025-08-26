output "log_group_arn" {
  description = "ARN of the CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail.arn
}

output "metric_filter_id" {
  description = "ID of the CloudWatch metric filter"
  value       = aws_cloudwatch_log_metric_filter.security_events.id
}

output "alarm_arn" {
  description = "ARN of the CloudWatch alarm"
  value       = aws_cloudwatch_metric_alarm.security_alarm.arn
}
