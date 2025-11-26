output "organization_id" {
  description = "The AWS Organization ID"
  value       = try(aws_organizations_organization.main.id, null)
}

output "organization_arn" {
  description = "The AWS Organization ARN"
  value       = try(aws_organizations_organization.main.arn, null)
}

output "organization_root_id" {
  description = "The root organizational unit ID"
  value       = try(data.aws_organizations_organization.root.roots[0].id, null)
}

output "security_ou_id" {
  description = "Security organizational unit ID"
  value       = aws_organizations_organizational_unit.security.id
}

output "production_ou_id" {
  description = "Production organizational unit ID"
  value       = aws_organizations_organizational_unit.production.id
}

output "development_ou_id" {
  description = "Development organizational unit ID"
  value       = aws_organizations_organizational_unit.development.id
}

output "primary_kms_key_id" {
  description = "Primary KMS key ID"
  value       = aws_kms_key.primary.key_id
  sensitive   = true
}

output "primary_kms_key_arn" {
  description = "Primary KMS key ARN"
  value       = aws_kms_key.primary.arn
}

output "primary_kms_key_alias" {
  description = "Primary KMS key alias"
  value       = aws_kms_alias.primary.name
}

output "secondary_kms_key_id" {
  description = "Secondary (replica) KMS key ID"
  value       = aws_kms_replica_key.secondary.key_id
  sensitive   = true
}

output "secondary_kms_key_arn" {
  description = "Secondary (replica) KMS key ARN"
  value       = aws_kms_replica_key.secondary.arn
}

output "secondary_kms_key_alias" {
  description = "Secondary KMS key alias"
  value       = aws_kms_alias.secondary.name
}

output "cross_account_security_role_arn" {
  description = "Cross-account security role ARN"
  value       = aws_iam_role.cross_account_security.arn
}

output "cross_account_operations_role_arn" {
  description = "Cross-account operations role ARN"
  value       = aws_iam_role.cross_account_operations.arn
}

output "cross_account_developer_role_arn" {
  description = "Cross-account developer role ARN"
  value       = aws_iam_role.cross_account_developer.arn
}

output "config_role_arn" {
  description = "AWS Config IAM role ARN"
  value       = aws_iam_role.config_role.arn
}

output "cloudtrail_bucket_name" {
  description = "CloudTrail S3 bucket name"
  value       = aws_s3_bucket.cloudtrail.id
}

output "cloudtrail_bucket_arn" {
  description = "CloudTrail S3 bucket ARN"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "config_bucket_name" {
  description = "AWS Config S3 bucket name"
  value       = aws_s3_bucket.config_bucket.id
}

output "config_bucket_arn" {
  description = "AWS Config S3 bucket ARN"
  value       = aws_s3_bucket.config_bucket.arn
}

output "central_logs_group_name" {
  description = "Central CloudWatch Logs group name"
  value       = aws_cloudwatch_log_group.central.name
}

output "central_logs_group_arn" {
  description = "Central CloudWatch Logs group ARN"
  value       = aws_cloudwatch_log_group.central.arn
}

output "organizations_logs_group_name" {
  description = "Organizations CloudWatch Logs group name"
  value       = aws_cloudwatch_log_group.organizations.name
}

output "config_logs_group_name" {
  description = "Config CloudWatch Logs group name"
  value       = aws_cloudwatch_log_group.config.name
}

output "iam_activity_logs_group_name" {
  description = "IAM activity CloudWatch Logs group name"
  value       = aws_cloudwatch_log_group.iam_activity.name
}

output "cloudtrail_logs_group_name" {
  description = "CloudTrail CloudWatch Logs group name"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "s3_encryption_scp_id" {
  description = "S3 encryption SCP ID"
  value       = aws_organizations_policy.s3_encryption.id
}

output "ebs_encryption_scp_id" {
  description = "EBS encryption SCP ID"
  value       = aws_organizations_policy.ebs_encryption.id
}

output "rds_encryption_scp_id" {
  description = "RDS encryption SCP ID"
  value       = aws_organizations_policy.rds_encryption.id
}

output "kms_protection_scp_id" {
  description = "KMS protection SCP ID"
  value       = aws_organizations_policy.kms_protection.id
}

output "config_rules_deployed" {
  description = "Number of AWS Config rules deployed"
  value       = var.enable_config ? 7 : 0
}

output "config_notification_topic_arn" {
  description = "Config notification SNS topic ARN"
  value       = aws_sns_topic.config_notifications.arn
}

output "environment_suffix" {
  description = "Environment suffix used for all resources"
  value       = var.environment_suffix
}

output "cloudtrail_arn" {
  description = "CloudTrail ARN"
  value       = try(aws_cloudtrail.organization[0].arn, null)
}

output "config_recorder_name" {
  description = "AWS Config recorder name"
  value       = try(aws_config_configuration_recorder.main[0].name, null)
}
