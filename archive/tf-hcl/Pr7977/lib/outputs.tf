# outputs.tf - Terraform outputs

output "log_groups" {
  description = "CloudWatch Log Groups created for microservices"
  value = {
    for k, v in aws_cloudwatch_log_group.microservice_logs : k => v.name
  }
}

output "dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${data.aws_region.current.name}#dashboards:name=monitoring-dashboard-${var.environment_suffix}"
}

output "critical_alerts_topic_arn" {
  description = "ARN of the critical alerts SNS topic"
  value       = aws_sns_topic.critical_alerts.arn
}

output "warning_alerts_topic_arn" {
  description = "ARN of the warning alerts SNS topic"
  value       = aws_sns_topic.warning_alerts.arn
}

output "canaries" {
  description = "CloudWatch Synthetics canaries created"
  value = {
    for k, v in aws_synthetics_canary.endpoint_monitoring : k => {
      name   = v.name
      status = v.status
      id     = v.id
    }
  }
}

output "composite_alarms" {
  description = "Composite alarms for service health monitoring"
  value = {
    for k, v in aws_cloudwatch_composite_alarm.service_health_critical : k => {
      name = v.alarm_name
      arn  = v.arn
    }
  }
}

output "kms_key_id" {
  description = "KMS key ID used for SNS encryption"
  value       = aws_kms_key.sns_encryption.id
}

output "monitoring_sink_arn" {
  description = "ARN of the CloudWatch Observability Access Manager sink for cross-account monitoring"
  value       = var.dev_account_id != "" || var.staging_account_id != "" ? aws_oam_sink.monitoring_sink[0].arn : "Cross-account monitoring not configured"
}

output "monitoring_sink_id" {
  description = "ID of the CloudWatch Observability Access Manager sink"
  value       = var.dev_account_id != "" || var.staging_account_id != "" ? aws_oam_sink.monitoring_sink[0].id : "Cross-account monitoring not configured"
}
