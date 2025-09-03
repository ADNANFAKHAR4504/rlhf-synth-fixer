output "sns_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "high_cpu_alarm_names" {
  description = "Names of the high CPU alarms"
  value       = aws_cloudwatch_metric_alarm.high_cpu[*].alarm_name
}

output "status_check_alarm_names" {
  description = "Names of the status check alarms"
  value       = aws_cloudwatch_metric_alarm.instance_status_check[*].alarm_name
}

output "rds_cpu_alarm_name" {
  description = "Name of the RDS CPU alarm"
  value       = aws_cloudwatch_metric_alarm.rds_cpu.alarm_name
}