# outputs.tf

output "kms_key_id" {
  description = "KMS key ID for encryption"
  value       = aws_kms_key.security_key.key_id
}

output "kms_key_arn" {
  description = "KMS key ARN for encryption"
  value       = aws_kms_key.security_key.arn
}

output "sns_topic_arn" {
  description = "SNS topic ARN for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "secure_bucket_name" {
  description = "Name of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.bucket
}

output "secure_bucket_arn" {
  description = "ARN of the secure S3 bucket"
  value       = aws_s3_bucket.secure_bucket.arn
}

output "config_bucket_name" {
  description = "Name of the AWS Config bucket"
  value       = aws_s3_bucket.config_bucket.bucket
}

output "access_logs_bucket_name" {
  description = "Name of the access logs bucket"
  value       = aws_s3_bucket.access_logs.bucket
}

output "lambda_function_name" {
  description = "Name of the security response Lambda function"
  value       = aws_lambda_function.security_response.function_name
}

output "lambda_function_arn" {
  description = "ARN of the security response Lambda function"
  value       = aws_lambda_function.security_response.arn
}

output "step_function_arn" {
  description = "ARN of the security workflow Step Function"
  value       = aws_sfn_state_machine.security_workflow.arn
}

output "guardduty_detector_id" {
  description = "GuardDuty detector ID"
  value       = aws_guardduty_detector.main.id
}

output "security_hub_account_id" {
  description = "Security Hub account ID"
  value       = aws_securityhub_account.main.id
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group name for security logs"
  value       = aws_cloudwatch_log_group.security_logs.name
}

output "security_monitoring_role_arn" {
  description = "ARN of the security monitoring IAM role"
  value       = aws_iam_role.security_monitoring_role.arn
}

output "cross_account_role_arn" {
  description = "ARN of the cross-account access IAM role"
  value       = aws_iam_role.cross_account_role.arn
}