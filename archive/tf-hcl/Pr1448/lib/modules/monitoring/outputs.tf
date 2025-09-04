output "dashboard_name" {
  description = "Name of the CloudWatch dashboard"
  value       = aws_cloudwatch_dashboard.main.dashboard_name
}

output "alerts_topic_arn" {
  description = "ARN of the SNS topic for alerts"
  value       = aws_sns_topic.alerts.arn
}

output "high_cpu_alarm_name" {
  description = "Name of the high CPU alarm"
  value       = aws_cloudwatch_metric_alarm.high_cpu.alarm_name
}

output "high_memory_alarm_name" {
  description = "Name of the high memory alarm"
  value       = aws_cloudwatch_metric_alarm.high_memory.alarm_name
}

output "database_cpu_alarm_name" {
  description = "Name of the database CPU alarm"
  value       = aws_cloudwatch_metric_alarm.database_cpu.alarm_name
}

output "lb_5xx_errors_alarm_name" {
  description = "Name of the load balancer 5XX errors alarm"
  value       = aws_cloudwatch_metric_alarm.lb_5xx_errors.alarm_name
}
