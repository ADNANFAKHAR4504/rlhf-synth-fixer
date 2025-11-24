# Organization outputs - COMMENTED OUT
# These outputs have been disabled because AWS Organizations resources are commented out
#
# output "organization_id" {
#   description = "AWS Organization ID"
#   value       = aws_organizations_organization.main.id
# }
#
# output "organization_arn" {
#   description = "AWS Organization ARN"
#   value       = aws_organizations_organization.main.arn
# }
#
# output "security_ou_id" {
#   description = "Security OU ID"
#   value       = aws_organizations_organizational_unit.security.id
# }
#
# output "production_ou_id" {
#   description = "Production OU ID"
#   value       = aws_organizations_organizational_unit.production.id
# }
#
# output "development_ou_id" {
#   description = "Development OU ID"
#   value       = aws_organizations_organizational_unit.development.id
# }

output "primary_kms_key_id" {
  description = "Primary KMS Key ID"
  value       = aws_kms_key.primary.id
}

output "primary_kms_key_arn" {
  description = "Primary KMS Key ARN"
  value       = aws_kms_key.primary.arn
}

output "secondary_kms_key_id" {
  description = "Secondary KMS Key ID"
  value       = aws_kms_replica_key.secondary.id
}

output "secondary_kms_key_arn" {
  description = "Secondary KMS Key ARN"
  value       = aws_kms_replica_key.secondary.arn
}

output "terraform_state_kms_key_id" {
  description = "Terraform State KMS Key ID"
  value       = aws_kms_key.terraform_state.id
}

output "terraform_state_kms_key_arn" {
  description = "Terraform State KMS Key ARN"
  value       = aws_kms_key.terraform_state.arn
}

output "security_audit_role_arn" {
  description = "Security Audit Role ARN"
  value       = aws_iam_role.security_audit.arn
}

output "cross_account_access_role_arn" {
  description = "Cross-Account Access Role ARN"
  value       = aws_iam_role.cross_account_access.arn
}

output "config_bucket_name" {
  description = "AWS Config S3 Bucket Name"
  value       = aws_s3_bucket.config.id
}

output "terraform_state_bucket_name" {
  description = "Terraform State S3 Bucket Name"
  value       = aws_s3_bucket.terraform_state.id
}

output "terraform_state_lock_table_name" {
  description = "Terraform State Lock DynamoDB Table Name"
  value       = aws_dynamodb_table.terraform_state_lock.id
}

output "iam_activity_log_group_name" {
  description = "IAM Activity CloudWatch Log Group Name"
  value       = aws_cloudwatch_log_group.iam_activity.name
}

# output "organizations_activity_log_group_name" {
#   description = "Organizations Activity CloudWatch Log Group Name"
#   value       = aws_cloudwatch_log_group.organizations_activity.name
# }

output "config_activity_log_group_name" {
  description = "Config Activity CloudWatch Log Group Name"
  value       = aws_cloudwatch_log_group.config_activity.name
}
