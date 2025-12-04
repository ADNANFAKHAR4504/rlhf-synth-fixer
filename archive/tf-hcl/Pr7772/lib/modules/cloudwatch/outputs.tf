output "dashboard_url" {
  description = "URL of the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.region}#dashboards:name=${aws_cloudwatch_dashboard.main.dashboard_name}"
}

output "alarms" {
  description = "List of CloudWatch alarms"
  value = {
    ecs_cpu           = aws_cloudwatch_metric_alarm.ecs_cpu_high.alarm_name
    ecs_memory        = aws_cloudwatch_metric_alarm.ecs_memory_high.alarm_name
    rds_cpu           = aws_cloudwatch_metric_alarm.rds_cpu_high.alarm_name
    rds_storage       = aws_cloudwatch_metric_alarm.rds_storage_low.alarm_name
    alb_health        = aws_cloudwatch_metric_alarm.alb_healthy_hosts.alarm_name
    alb_response_time = aws_cloudwatch_metric_alarm.alb_response_time.alarm_name
  }
}