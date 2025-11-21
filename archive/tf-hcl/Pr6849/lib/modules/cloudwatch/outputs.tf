output "sns_topic_arn" {
  description = "SNS topic ARN"
  value       = aws_sns_topic.alerts.arn
}

output "sns_topic_name" {
  description = "SNS topic name"
  value       = aws_sns_topic.alerts.name
}

output "cpu_alarm_arn" {
  description = "CPU utilization alarm ARN"
  value       = aws_cloudwatch_metric_alarm.cpu_utilization.arn
}

output "connections_alarm_arn" {
  description = "Database connections alarm ARN"
  value       = aws_cloudwatch_metric_alarm.database_connections.arn
}

output "replica_lag_alarm_arn" {
  description = "Aurora replica lag alarm ARN"
  value       = aws_cloudwatch_metric_alarm.aurora_replica_lag.arn
}
