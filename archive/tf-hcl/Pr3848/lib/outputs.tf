output "kms_key_id" {
  description = "KMS key ID for audit log encryption"
  value       = aws_kms_key.audit_logs.id
}

output "kms_key_arn" {
  description = "KMS key ARN for audit log encryption"
  value       = aws_kms_key.audit_logs.arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch Log Group name for audit events"
  value       = aws_cloudwatch_log_group.audit_events.name
}

output "cloudwatch_log_group_arn" {
  description = "CloudWatch Log Group ARN for audit events"
  value       = aws_cloudwatch_log_group.audit_events.arn
}

output "s3_bucket_name" {
  description = "S3 bucket name for immutable log storage"
  value       = aws_s3_bucket.audit_logs.id
}

output "s3_bucket_arn" {
  description = "S3 bucket ARN for immutable log storage"
  value       = aws_s3_bucket.audit_logs.arn
}

output "lambda_function_name" {
  description = "Lambda function name for log processing"
  value       = aws_lambda_function.log_processor.function_name
}

output "lambda_function_arn" {
  description = "Lambda function ARN for log processing"
  value       = aws_lambda_function.log_processor.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for critical alerts"
  value       = aws_sns_topic.critical_alerts.arn
}

output "appsync_api_id" {
  description = "AppSync API ID for real-time monitoring"
  value       = aws_appsync_graphql_api.monitoring.id
}

output "appsync_api_url" {
  description = "AppSync API URL for real-time monitoring"
  value       = aws_appsync_graphql_api.monitoring.uris["GRAPHQL"]
}

output "appsync_api_key" {
  description = "AppSync API key"
  value       = aws_appsync_api_key.monitoring.key
  sensitive   = true
}

output "eventbridge_rule_critical_events" {
  description = "EventBridge rule name for critical events"
  value       = aws_cloudwatch_event_rule.critical_events.name
}
