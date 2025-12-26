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
  value       = try(aws_cloudwatch_metric_alarm.cpu_utilization[0].arn, null)
}

output "connections_alarm_arn" {
  description = "Database connections alarm ARN"
  value       = try(aws_cloudwatch_metric_alarm.database_connections[0].arn, null)
}

output "replica_lag_alarm_arn" {
  description = "Aurora replica lag alarm ARN"
  value       = try(aws_cloudwatch_metric_alarm.aurora_replica_lag[0].arn, null)
}
