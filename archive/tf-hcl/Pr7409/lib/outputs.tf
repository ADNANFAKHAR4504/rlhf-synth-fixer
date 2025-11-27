# outputs.tf

output "dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=${aws_cloudwatch_dashboard.payment_processing.dashboard_name}"
}

output "critical_alerts_topic_arn" {
  description = "ARN of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "warning_alerts_topic_arn" {
  description = "ARN of the warning alerts SNS topic"
  value       = aws_sns_topic.warning_alerts.arn
}

output "info_alerts_topic_arn" {
  description = "ARN of the info alerts SNS topic"
  value       = aws_sns_topic.info_alerts.arn
}

output "canary_name" {
  description = "Name of the CloudWatch Synthetics canary"
  value       = aws_synthetics_canary.api_monitor.name
}

output "canary_artifacts_bucket" {
  description = "S3 bucket containing canary artifacts"
  value       = aws_s3_bucket.canary_artifacts.id
}

output "log_group_names" {
  description = "Names of CloudWatch Log Groups"
  value       = aws_cloudwatch_log_group.application_logs[*].name
}

output "alarm_names" {
  description = "Names of all CloudWatch alarms"
  value = {
    ecs_cpu_alarm    = aws_cloudwatch_metric_alarm.ecs_cpu_high.alarm_name
    ecs_memory_alarm = aws_cloudwatch_metric_alarm.ecs_memory_high.alarm_name
    rds_cpu_alarm    = aws_cloudwatch_metric_alarm.rds_cpu_high.alarm_name
    composite_alarm  = aws_cloudwatch_composite_alarm.critical_system_state.alarm_name
    canary_alarm     = aws_cloudwatch_metric_alarm.canary_failed.alarm_name
  }
}

output "saved_queries" {
  description = "Names of saved CloudWatch Logs Insights queries"
  value = {
    error_analysis      = aws_cloudwatch_query_definition.error_analysis.name
    latency_percentiles = aws_cloudwatch_query_definition.latency_percentiles.name
    request_volume      = aws_cloudwatch_query_definition.request_volume.name
  }
}

output "kms_key_ids" {
  description = "KMS key IDs used for encryption"
  value = {
    sns_encryption  = aws_kms_key.sns_encryption.id
    cloudwatch_logs = aws_kms_key.cloudwatch_logs.id
  }
}
