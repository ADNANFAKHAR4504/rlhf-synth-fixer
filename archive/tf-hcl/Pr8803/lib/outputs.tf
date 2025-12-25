# outputs.tf - Output values for drift detection system

output "drift_reports_bucket" {
  description = "S3 bucket name for drift reports"
  value       = aws_s3_bucket.drift_reports.id
}

output "drift_reports_bucket_arn" {
  description = "ARN of drift reports S3 bucket"
  value       = aws_s3_bucket.drift_reports.arn
}

output "config_bucket" {
  description = "S3 bucket name for AWS Config"
  value       = aws_s3_bucket.config.id
}

output "state_lock_table" {
  description = "DynamoDB table name for state locking"
  value       = aws_dynamodb_table.state_lock.name
}

output "state_lock_table_arn" {
  description = "ARN of state lock DynamoDB table"
  value       = aws_dynamodb_table.state_lock.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for drift notifications"
  value       = aws_sns_topic.drift_alerts.arn
}

output "lambda_function_name" {
  description = "Name of drift detection Lambda function"
  value       = aws_lambda_function.drift_detector.function_name
}

output "lambda_function_arn" {
  description = "ARN of drift detection Lambda function"
  value       = aws_lambda_function.drift_detector.arn
}

output "cloudwatch_log_group" {
  description = "CloudWatch log group for Lambda logs"
  value       = aws_cloudwatch_log_group.drift_detector.name
}

output "eventbridge_rule_name" {
  description = "EventBridge rule name for scheduling"
  value       = aws_cloudwatch_event_rule.drift_detection_schedule.name
}

output "dashboard_name" {
  description = "CloudWatch dashboard name"
  value       = aws_cloudwatch_dashboard.drift_monitoring.dashboard_name
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = aws_config_configuration_recorder.main.name
}
