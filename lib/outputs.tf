
output "cloudtrail_arn" {
  description = "ARN of the CloudTrail trail for audit logging"
  value       = aws_cloudtrail.payment_audit.arn
}

output "cloudtrail_bucket" {
  description = "S3 bucket name for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "payment_api_log_group" {
  description = "CloudWatch log group for payment API logs"
  value       = aws_cloudwatch_log_group.payment_api_logs.name
}

output "payment_processor_log_group" {
  description = "CloudWatch log group for payment processor logs"
  value       = aws_cloudwatch_log_group.payment_processor_logs.name
}

output "payment_database_log_group" {
  description = "CloudWatch log group for payment database logs"
  value       = aws_cloudwatch_log_group.payment_database_logs.name
}

output "security_events_log_group" {
  description = "CloudWatch log group for security events"
  value       = aws_cloudwatch_log_group.security_events_logs.name
}

output "xray_sampling_rule_payment" {
  description = "X-Ray sampling rule for payment transactions"
  value       = aws_xray_sampling_rule.payment_transactions.id
}

output "payment_alerts_topic_arn" {
  description = "SNS topic ARN for payment alerts"
  value       = aws_sns_topic.payment_alerts.arn
}

output "security_alerts_topic_arn" {
  description = "SNS topic ARN for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "dashboard_name" {
  description = "CloudWatch dashboard name for payment operations"
  value       = aws_cloudwatch_dashboard.payment_operations.dashboard_name
}

output "kms_key_id" {
  description = "KMS key ID for observability platform encryption"
  value       = aws_kms_key.observability.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for observability platform encryption"
  value       = aws_kms_key.observability.arn
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = var.enable_config ? aws_config_configuration_recorder.main[0].name : null
}

output "config_bucket" {
  description = "S3 bucket for AWS Config logs"
  value       = var.enable_config ? aws_s3_bucket.config_logs[0].id : null
}

output "security_hub_enabled" {
  description = "Whether Security Hub is enabled"
  value       = var.enable_security_hub
}

output "ssm_xray_sampling_parameter" {
  description = "SSM parameter for X-Ray sampling rate"
  value       = aws_ssm_parameter.xray_sampling_rate.name
}

output "ssm_log_retention_parameter" {
  description = "SSM parameter for log retention days"
  value       = aws_ssm_parameter.log_retention.name
}

output "ssm_latency_threshold_parameter" {
  description = "SSM parameter for latency threshold"
  value       = aws_ssm_parameter.alert_threshold_latency.name
}

