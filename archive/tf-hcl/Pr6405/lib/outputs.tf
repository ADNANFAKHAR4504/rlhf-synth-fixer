output "config_recorder_id" {
  description = "ID of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.id
}

output "config_bucket_name" {
  description = "Name of the S3 bucket storing Config data"
  value       = aws_s3_bucket.config_bucket.id
}

output "config_bucket_arn" {
  description = "ARN of the S3 bucket storing Config data"
  value       = aws_s3_bucket.config_bucket.arn
}

output "kms_key_id" {
  description = "ID of the KMS key used for encryption"
  value       = aws_kms_key.config_key.id
}

output "kms_key_arn" {
  description = "ARN of the KMS key used for encryption"
  value       = aws_kms_key.config_key.arn
}

output "remediation_lambda_arn" {
  description = "ARN of the remediation Lambda function"
  value       = aws_lambda_function.remediation.arn
}

output "remediation_lambda_name" {
  description = "Name of the remediation Lambda function"
  value       = aws_lambda_function.remediation.function_name
}

output "sns_topic_arn" {
  description = "ARN of the SNS topic for compliance notifications"
  value       = var.sns_email_endpoint != "" ? aws_sns_topic.compliance_notifications[0].arn : null
}

output "compliance_dashboard_url" {
  description = "URL to the CloudWatch dashboard"
  value       = "https://console.aws.amazon.com/cloudwatch/home?region=${var.aws_region}#dashboards:name=compliance-monitoring-${var.environment_suffix}"
}

output "config_rules" {
  description = "List of enabled Config rule names"
  value = [
    aws_config_config_rule.s3_bucket_public_read_prohibited.name,
    aws_config_config_rule.s3_bucket_public_write_prohibited.name,
    aws_config_config_rule.s3_bucket_encryption.name,
    aws_config_config_rule.encrypted_volumes.name,
    aws_config_config_rule.rds_encryption.name,
    aws_config_config_rule.ec2_no_public_ip.name,
    aws_config_config_rule.iam_password_policy.name,
    aws_config_config_rule.root_account_mfa.name,
    aws_config_config_rule.required_tags.name
  ]
}
