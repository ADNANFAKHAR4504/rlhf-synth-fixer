output "security_hub_arn" {
  description = "ARN of Security Hub"
  value       = aws_securityhub_account.main.arn
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = local.guardduty_detector_id
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = aws_cloudtrail.main.arn
}

output "cloudtrail_bucket" {
  description = "CloudTrail S3 bucket name"
  value       = aws_s3_bucket.cloudtrail_logs.id
}

output "sns_topic_arn" {
  description = "SNS topic ARN for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "lambda_function_name" {
  description = "Custom rules processor Lambda function name"
  value       = aws_lambda_function.custom_rules_processor.function_name
}

output "security_team_role_arn" {
  description = "Security team IAM role ARN"
  value       = aws_iam_role.security_team.arn
}

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.security_key.id
}

output "log_group_name" {
  description = "CloudWatch log group for security events"
  value       = aws_cloudwatch_log_group.security_events.name
}