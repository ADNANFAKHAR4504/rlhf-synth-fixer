# outputs.tf
# Outputs for Multi-Account Security Framework

#
# AWS ORGANIZATIONS OUTPUTS
#

output "organization_id" {
  description = "The ID of the AWS Organization"
  value       = aws_organizations_organization.main.id
}

output "organization_arn" {
  description = "The ARN of the AWS Organization"
  value       = aws_organizations_organization.main.arn
}

output "organization_root_id" {
  description = "The ID of the root organizational unit"
  value       = aws_organizations_organization.main.roots[0].id
}

output "security_ou_id" {
  description = "The ID of the Security organizational unit"
  value       = aws_organizations_organizational_unit.security.id
}

output "security_ou_arn" {
  description = "The ARN of the Security organizational unit"
  value       = aws_organizations_organizational_unit.security.arn
}

output "production_ou_id" {
  description = "The ID of the Production organizational unit"
  value       = aws_organizations_organizational_unit.production.id
}

output "production_ou_arn" {
  description = "The ARN of the Production organizational unit"
  value       = aws_organizations_organizational_unit.production.arn
}

output "development_ou_id" {
  description = "The ID of the Development organizational unit"
  value       = aws_organizations_organizational_unit.development.id
}

output "development_ou_arn" {
  description = "The ARN of the Development organizational unit"
  value       = aws_organizations_organizational_unit.development.arn
}

#
# IAM ROLE OUTPUTS
#

output "security_audit_role_arn" {
  description = "The ARN of the Security Audit IAM role"
  value       = aws_iam_role.security_audit.arn
}

output "security_audit_role_name" {
  description = "The name of the Security Audit IAM role"
  value       = aws_iam_role.security_audit.name
}

output "compliance_audit_role_arn" {
  description = "The ARN of the Compliance Audit IAM role"
  value       = aws_iam_role.compliance_audit.arn
}

output "compliance_audit_role_name" {
  description = "The name of the Compliance Audit IAM role"
  value       = aws_iam_role.compliance_audit.name
}

#
# KMS KEY OUTPUTS
#

output "primary_kms_key_id" {
  description = "The ID of the primary KMS key in us-east-1"
  value       = aws_kms_key.primary.key_id
}

output "primary_kms_key_arn" {
  description = "The ARN of the primary KMS key in us-east-1"
  value       = aws_kms_key.primary.arn
}

output "primary_kms_alias_name" {
  description = "The alias name of the primary KMS key"
  value       = aws_kms_alias.primary.name
}

output "secondary_kms_key_id" {
  description = "The ID of the secondary KMS key in eu-west-1"
  value       = aws_kms_replica_key.secondary.key_id
}

output "secondary_kms_key_arn" {
  description = "The ARN of the secondary KMS key in eu-west-1"
  value       = aws_kms_replica_key.secondary.arn
}

output "secondary_kms_alias_name" {
  description = "The alias name of the secondary KMS key"
  value       = aws_kms_alias.secondary.name
}

#
# SERVICE CONTROL POLICY OUTPUTS
#

output "enforce_s3_encryption_policy_id" {
  description = "The ID of the S3 encryption enforcement SCP"
  value       = aws_organizations_policy.enforce_s3_encryption.id
}

output "enforce_ebs_encryption_policy_id" {
  description = "The ID of the EBS encryption enforcement SCP"
  value       = aws_organizations_policy.enforce_ebs_encryption.id
}

output "enforce_rds_encryption_policy_id" {
  description = "The ID of the RDS encryption enforcement SCP"
  value       = aws_organizations_policy.enforce_rds_encryption.id
}

output "protect_cloudwatch_logs_policy_id" {
  description = "The ID of the CloudWatch Logs protection SCP"
  value       = aws_organizations_policy.protect_cloudwatch_logs.id
}

#
# IAM POLICY OUTPUTS
#

output "restrict_root_user_policy_arn" {
  description = "The ARN of the root user restriction policy"
  value       = aws_iam_policy.restrict_root_user.arn
}

output "enforce_tagging_policy_arn" {
  description = "The ARN of the tagging enforcement policy"
  value       = aws_iam_policy.enforce_tagging.arn
}

output "compliance_readonly_policy_arn" {
  description = "The ARN of the compliance read-only policy"
  value       = aws_iam_policy.compliance_readonly.arn
}

output "least_privilege_example_policy_arn" {
  description = "The ARN of the least privilege example policy"
  value       = aws_iam_policy.least_privilege_example.arn
}

#
# CLOUDWATCH LOGS OUTPUTS
#

output "iam_activity_log_group_name" {
  description = "The name of the IAM activity CloudWatch log group"
  value       = aws_cloudwatch_log_group.iam_activity.name
}

output "iam_activity_log_group_arn" {
  description = "The ARN of the IAM activity CloudWatch log group"
  value       = aws_cloudwatch_log_group.iam_activity.arn
}

output "cloudtrail_log_group_name" {
  description = "The name of the CloudTrail CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail.name
}

output "cloudtrail_log_group_arn" {
  description = "The ARN of the CloudTrail CloudWatch log group"
  value       = aws_cloudwatch_log_group.cloudtrail.arn
}

#
# S3 BUCKET OUTPUTS
#

output "cloudtrail_s3_bucket_name" {
  description = "The name of the S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.id
}

output "cloudtrail_s3_bucket_arn" {
  description = "The ARN of the S3 bucket for CloudTrail logs"
  value       = aws_s3_bucket.cloudtrail.arn
}

output "config_s3_bucket_name" {
  description = "The name of the S3 bucket for AWS Config logs"
  value       = aws_s3_bucket.config.id
}

output "config_s3_bucket_arn" {
  description = "The ARN of the S3 bucket for AWS Config logs"
  value       = aws_s3_bucket.config.arn
}

#
# CLOUDTRAIL OUTPUTS
#

output "cloudtrail_id" {
  description = "The ID of the organization CloudTrail"
  value       = aws_cloudtrail.organization.id
}

output "cloudtrail_arn" {
  description = "The ARN of the organization CloudTrail"
  value       = aws_cloudtrail.organization.arn
}

output "cloudtrail_home_region" {
  description = "The home region of the CloudTrail"
  value       = aws_cloudtrail.organization.home_region
}

#
# AWS CONFIG OUTPUTS
#

output "config_recorder_id" {
  description = "The ID of the AWS Config recorder"
  value       = aws_config_configuration_recorder.main.id
}

output "config_delivery_channel_id" {
  description = "The ID of the AWS Config delivery channel"
  value       = aws_config_delivery_channel.main.id
}

output "config_role_arn" {
  description = "The ARN of the AWS Config IAM role"
  value       = aws_iam_role.config.arn
}

#
# AWS CONFIG RULES OUTPUTS
#

output "s3_encryption_config_rule_arn" {
  description = "The ARN of the S3 encryption Config rule"
  value       = aws_config_config_rule.s3_bucket_encryption.arn
}

output "ebs_encryption_config_rule_arn" {
  description = "The ARN of the EBS encryption Config rule"
  value       = aws_config_config_rule.ebs_encryption.arn
}

output "rds_encryption_config_rule_arn" {
  description = "The ARN of the RDS encryption Config rule"
  value       = aws_config_config_rule.rds_encryption.arn
}

output "iam_password_policy_config_rule_arn" {
  description = "The ARN of the IAM password policy Config rule"
  value       = aws_config_config_rule.iam_password_policy.arn
}

output "iam_mfa_enabled_config_rule_arn" {
  description = "The ARN of the IAM MFA enabled Config rule"
  value       = aws_config_config_rule.iam_mfa_enabled.arn
}

output "root_mfa_enabled_config_rule_arn" {
  description = "The ARN of the root MFA enabled Config rule"
  value       = aws_config_config_rule.root_mfa_enabled.arn
}

output "cloudtrail_enabled_config_rule_arn" {
  description = "The ARN of the CloudTrail enabled Config rule"
  value       = aws_config_config_rule.cloudtrail_enabled.arn
}

output "cloudwatch_log_encryption_config_rule_arn" {
  description = "The ARN of the CloudWatch log encryption Config rule"
  value       = aws_config_config_rule.cloudwatch_log_group_encryption.arn
}

#
# SUMMARY OUTPUTS
#

output "deployment_summary" {
  description = "Summary of deployed resources"
  value = {
    organization_id       = aws_organizations_organization.main.id
    organizational_units  = 3
    kms_keys              = 2
    security_policies     = 4
    iam_roles             = 2
    iam_policies          = 4
    cloudwatch_log_groups = 2
    s3_buckets            = 2
    config_rules          = 8
    multi_region_enabled  = true
    primary_region        = "us-east-1"
    secondary_region      = "eu-west-1"
  }
}
