output "unauthorized_calls_metric_filter_name" {
  value       = aws_cloudwatch_log_metric_filter.unauthorized_calls.name
  description = "Name of the unauthorized calls metric filter"
}

output "unauthorized_calls_alarm_name" {
  value       = aws_cloudwatch_metric_alarm.unauthorized_calls.alarm_name
  description = "Name of the unauthorized calls alarm"
}
