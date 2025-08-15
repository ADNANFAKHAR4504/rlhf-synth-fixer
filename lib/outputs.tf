output "vpc_id" {
  description = "VPC ID being used"
  value       = var.vpc_id
}

output "web_security_group_id" {
  description = "Security Group ID for web tier"
  value       = aws_security_group.web_tier.id
}

output "app_security_group_id" {
  description = "Security Group ID for application tier"
  value       = aws_security_group.app_tier.id
}

output "db_security_group_id" {
  description = "Security Group ID for database tier"
  value       = aws_security_group.db_tier.id
}

output "web_app_role_arn" {
  description = "ARN of IAM role for web application"
  value       = aws_iam_role.web_app_role.arn
}

output "web_app_instance_profile_name" {
  description = "Instance profile name for web application"
  value       = aws_iam_instance_profile.web_app_profile.name
}

output "db_credentials_secret_arn" {
  description = "ARN of database credentials secret"
  value       = aws_secretsmanager_secret.db_credentials.arn
  sensitive   = true
}

output "api_key_secret_arn" {
  description = "ARN of API key secret"
  value       = aws_secretsmanager_secret.api_key.arn
  sensitive   = true
}

output "cloudtrail_arn" {
  description = "ARN of CloudTrail"
  value       = aws_cloudtrail.security_audit.arn
}

output "cloudtrail_s3_bucket" {
  description = "S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail_logs.bucket
}

output "cloudtrail_kms_key_arn" {
  description = "KMS key ARN for CloudTrail encryption"
  value       = aws_kms_key.cloudtrail.arn
}

output "security_alerts_topic_arn" {
  description = "SNS topic ARN for security alerts"
  value       = aws_sns_topic.security_alerts.arn
}

output "cloudwatch_log_group_name" {
  description = "CloudWatch log group for CloudTrail"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}