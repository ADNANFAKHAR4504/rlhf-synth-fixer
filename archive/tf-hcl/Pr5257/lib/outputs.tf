# Outputs

# Role ARNs
output "developer_role_arn" {
  description = "ARN of the developer IAM role"
  value       = aws_iam_role.developer.arn
}

output "developer_role_name" {
  description = "Name of the developer IAM role"
  value       = aws_iam_role.developer.name
}

output "operator_role_arn" {
  description = "ARN of the operator IAM role"
  value       = aws_iam_role.operator.arn
}

output "operator_role_name" {
  description = "Name of the operator IAM role"
  value       = aws_iam_role.operator.name
}

output "administrator_role_arn" {
  description = "ARN of the administrator IAM role"
  value       = aws_iam_role.administrator.arn
}

output "administrator_role_name" {
  description = "Name of the administrator IAM role"
  value       = aws_iam_role.administrator.name
}

output "break_glass_role_arn" {
  description = "ARN of the break-glass emergency IAM role"
  value       = aws_iam_role.break_glass.arn
}

output "break_glass_role_name" {
  description = "Name of the break-glass emergency IAM role"
  value       = aws_iam_role.break_glass.name
}

# Service Role ARNs
output "ec2_instance_role_arn" {
  description = "ARN of the EC2 instance IAM role"
  value       = var.enable_ec2_instance_role ? aws_iam_role.ec2_instance[0].arn : null
}

output "ec2_instance_profile_name" {
  description = "Name of the EC2 instance profile"
  value       = var.enable_ec2_instance_role ? aws_iam_instance_profile.ec2[0].name : null
}

output "lambda_execution_role_arn" {
  description = "ARN of the Lambda execution IAM role"
  value       = var.enable_lambda_execution_role ? aws_iam_role.lambda_execution[0].arn : null
}

output "rds_monitoring_role_arn" {
  description = "ARN of the RDS enhanced monitoring IAM role"
  value       = var.enable_rds_monitoring_role ? aws_iam_role.rds_monitoring[0].arn : null
}

# Cross-Account Role ARNs
output "cross_account_auditor_role_arn" {
  description = "ARN of the cross-account auditor IAM role"
  value       = length(var.external_account_ids) > 0 ? aws_iam_role.cross_account_auditor[0].arn : null
}

output "cross_account_support_role_arn" {
  description = "ARN of the cross-account support IAM role"
  value       = length(var.external_account_ids) > 0 ? aws_iam_role.cross_account_support[0].arn : null
}

# Policy ARNs
output "developer_policy_arn" {
  description = "ARN of the developer IAM policy"
  value       = aws_iam_policy.developer.arn
}

output "operator_policy_arn" {
  description = "ARN of the operator IAM policy"
  value       = aws_iam_policy.operator.arn
}

output "administrator_policy_arn" {
  description = "ARN of the administrator IAM policy"
  value       = aws_iam_policy.administrator.arn
}

output "permission_boundary_policy_arn" {
  description = "ARN of the permission boundary IAM policy"
  value       = aws_iam_policy.permission_boundary.arn
}

output "regional_restriction_policy_arn" {
  description = "ARN of the regional restriction IAM policy"
  value       = aws_iam_policy.regional_restriction.arn
}

output "s3_access_policy_arn" {
  description = "ARN of the S3 access IAM policy"
  value       = aws_iam_policy.s3_access.arn
}

# S3 Bucket Information
output "financial_data_bucket_name" {
  description = "Name of the financial data S3 bucket"
  value       = aws_s3_bucket.financial_data.bucket
}

output "financial_data_bucket_arn" {
  description = "ARN of the financial data S3 bucket"
  value       = aws_s3_bucket.financial_data.arn
}

output "access_logs_bucket_name" {
  description = "Name of the S3 access logs bucket"
  value       = var.enable_s3_access_logging ? aws_s3_bucket.access_logs[0].bucket : null
}

output "access_logs_bucket_arn" {
  description = "ARN of the S3 access logs bucket"
  value       = var.enable_s3_access_logging ? aws_s3_bucket.access_logs[0].arn : null
}

# KMS Key Information
output "kms_key_id" {
  description = "ID of the KMS key for encryption"
  value       = var.s3_encryption_enabled ? aws_kms_key.s3[0].key_id : null
}

output "kms_key_arn" {
  description = "ARN of the KMS key for encryption"
  value       = var.s3_encryption_enabled ? aws_kms_key.s3[0].arn : null
}

output "kms_key_alias" {
  description = "Alias of the KMS key for encryption"
  value       = var.s3_encryption_enabled ? aws_kms_alias.s3[0].name : null
}

# Monitoring Information
output "security_alerts_topic_arn" {
  description = "ARN of the SNS topic for security alerts"
  value       = var.enable_iam_monitoring ? aws_sns_topic.security_alerts[0].arn : null
}

output "iam_events_log_group_name" {
  description = "Name of the CloudWatch log group for IAM events"
  value       = var.enable_iam_monitoring ? aws_cloudwatch_log_group.iam_events[0].name : null
}

output "iam_events_log_group_arn" {
  description = "ARN of the CloudWatch log group for IAM events"
  value       = var.enable_iam_monitoring ? aws_cloudwatch_log_group.iam_events[0].arn : null
}

# Lambda Function Information
output "access_expiration_lambda_function_name" {
  description = "Name of the access expiration Lambda function"
  value       = var.enable_time_based_access ? aws_lambda_function.access_expiration[0].function_name : null
}

output "access_expiration_lambda_function_arn" {
  description = "ARN of the access expiration Lambda function"
  value       = var.enable_time_based_access ? aws_lambda_function.access_expiration[0].arn : null
}

# General Information
output "account_id" {
  description = "AWS Account ID"
  value       = local.account_id
}

output "region" {
  description = "AWS Region"
  value       = local.region
}

output "environment" {
  description = "Environment name"
  value       = var.environment
}

output "environment_suffix" {
  description = "Environment suffix used for resource naming"
  value       = local.name_suffix
}

# Post-Deployment Manual Steps
output "mfa_delete_command" {
  description = "Command to enable MFA delete on S3 bucket (requires root account credentials with MFA)"
  value       = "aws s3api put-bucket-versioning --bucket ${aws_s3_bucket.financial_data.id} --versioning-configuration Status=Enabled,MFADelete=Enabled --mfa 'arn:aws:iam::${local.account_id}:mfa/root-account-mfa-device MFA_TOKEN_CODE'"
}
