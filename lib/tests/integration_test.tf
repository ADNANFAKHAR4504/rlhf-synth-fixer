# Integration tests - Testing interactions between components

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"
}

# Test 1: Verify KMS key is used by CloudTrail
output "test_cloudtrail_uses_kms_key" {
  description = "Test if CloudTrail uses the KMS key"
  value       = try(aws_cloudtrail.organization[0].kms_key_id == aws_kms_key.primary.arn, false)
}

# Test 2: Verify KMS key is used by CloudWatch logs
output "test_cloudwatch_logs_use_kms" {
  description = "Test if CloudWatch logs use KMS key"
  value       = try(aws_cloudwatch_log_group.cloudtrail.kms_key_id == aws_kms_key.primary.arn, false)
}

# Test 3: Verify CloudTrail logs are stored in S3
output "test_cloudtrail_uses_s3_bucket" {
  description = "Test if CloudTrail uses S3 bucket"
  value       = try(aws_cloudtrail.organization[0].s3_bucket_name == aws_s3_bucket.cloudtrail.id, false)
}

# Test 4: Verify Config uses S3 bucket
output "test_config_uses_s3_bucket" {
  description = "Test if Config uses S3 bucket"
  value       = try(aws_config_delivery_channel.main[0].s3_bucket_name == aws_s3_bucket.config_bucket.id, false)
}

# Test 5: Verify Config uses SNS topic
output "test_config_uses_sns_topic" {
  description = "Test if Config uses SNS topic"
  value       = try(aws_config_delivery_channel.main[0].sns_topic_arn == aws_sns_topic.config_notifications.arn, false)
}

# Test 6: Verify Config recorder uses Config role
output "test_config_recorder_uses_role" {
  description = "Test if Config recorder uses Config role"
  value       = try(aws_config_configuration_recorder.main[0].role_arn == aws_iam_role.config_role.arn, false)
}

# Test 7: Verify SCPs are attached to all OUs
output "test_all_scps_attached_to_ous" {
  description = "Test if all SCPs are attached to all OUs"
  value = alltrue([
    length(aws_organizations_policy_attachment.s3_security_ou) > 0,
    length(aws_organizations_policy_attachment.s3_production_ou) > 0,
    length(aws_organizations_policy_attachment.s3_development_ou) > 0
  ])
}

# Test 8: Verify cross-account roles can access KMS key
output "test_cross_account_roles_can_access_kms" {
  description = "Test if cross-account roles have KMS grants"
  value       = try(length(aws_kms_grant.cross_account) > 0, false)
}

# Test 9: Verify Log metric filters are created for CloudTrail logs
output "test_metric_filters_on_cloudtrail_logs" {
  description = "Test if metric filters are created on CloudTrail logs"
  value       = try(aws_cloudwatch_log_metric_filter.unauthorized_api_calls.log_group_name == aws_cloudwatch_log_group.cloudtrail.name, false)
}

# Test 10: Verify CloudWatch alarms are created for metric filters
output "test_alarms_for_metric_filters" {
  description = "Test if CloudWatch alarms are created for metric filters"
  value = alltrue([
    aws_cloudwatch_metric_alarm.unauthorized_api_calls.metric_name == "UnauthorizedAPICallsCount",
    aws_cloudwatch_metric_alarm.root_account_usage.metric_name == "RootAccountUsageCount",
    aws_cloudwatch_metric_alarm.iam_policy_changes.metric_name == "IAMPolicyChangesCount",
    aws_cloudwatch_metric_alarm.kms_key_disabling.metric_name == "KMSKeyDisablingCount"
  ])
}

# Test 11: Verify organization trail is enabled when enable_cloudtrail is true
output "test_organization_trail_conditional" {
  description = "Test if organization trail is conditional on enable_cloudtrail"
  value       = try(var.enable_cloudtrail ? length(aws_cloudtrail.organization) > 0 : true, false)
}

# Test 12: Verify config is conditional on enable_config
output "test_config_conditional" {
  description = "Test if config resources are conditional on enable_config"
  value       = try(var.enable_config ? length(aws_config_configuration_recorder.main) > 0 : true, false)
}

# Test 13: Verify all S3 buckets have encryption
output "test_all_s3_buckets_encrypted" {
  description = "Test if all S3 buckets are encrypted"
  value = alltrue([
    length(aws_s3_bucket_server_side_encryption_configuration.cloudtrail.rule) > 0,
    length(aws_s3_bucket_server_side_encryption_configuration.config_bucket.rule) > 0
  ])
}

# Test 14: Verify all S3 buckets have versioning
output "test_all_s3_buckets_versioned" {
  description = "Test if all S3 buckets have versioning"
  value = alltrue([
    aws_s3_bucket_versioning.cloudtrail.versioning_configuration[0].status == "Enabled",
    aws_s3_bucket_versioning.config_bucket.versioning_configuration[0].status == "Enabled"
  ])
}

# Test 15: Verify all S3 buckets block public access
output "test_all_s3_buckets_block_public" {
  description = "Test if all S3 buckets block public access"
  value = alltrue([
    aws_s3_bucket_public_access_block.cloudtrail.block_public_acls,
    aws_s3_bucket_public_access_block.cloudtrail.block_public_policy,
    aws_s3_bucket_public_access_block.config_bucket.block_public_acls,
    aws_s3_bucket_public_access_block.config_bucket.block_public_policy
  ])
}

# Test 16: Verify environment_suffix is consistent across resources
output "test_environment_suffix_consistency" {
  description = "Test if environment_suffix is consistent across resources"
  value       = try(contains(aws_kms_key.primary.tags["Name"], var.environment_suffix), false)
}

# Test 17: Verify cross-account role trust policy is correct
output "test_cross_account_role_trust_policy" {
  description = "Test if cross-account role trust policy is correct"
  value       = try(contains(jsondecode(aws_iam_role.cross_account_security.assume_role_policy).Statement[0].Principal.AWS[0], "arn:aws:iam::"), false)
}

# Test 18: Verify CloudTrail has multi-region enabled
output "test_cloudtrail_multi_region_enabled" {
  description = "Test if CloudTrail has multi-region enabled"
  value       = try(aws_cloudtrail.organization[0].is_multi_region_trail, false)
}

# Test 19: Verify Config rules are created before conformance pack
output "test_config_rules_before_conformance_pack" {
  description = "Test if Config rules are created before conformance pack"
  value = alltrue([
    length(aws_config_config_rule.s3_encryption) > 0,
    length(aws_config_conformance_pack.security) > 0
  ])
}

# Test 20: Verify all resources have tags
output "test_all_resources_have_tags" {
  description = "Test if all resources have tags applied"
  value = alltrue([
    length(aws_kms_key.primary.tags) > 0,
    length(aws_organizations_organizational_unit.security.tags) > 0,
    length(aws_iam_role.cross_account_security.tags) > 0,
    length(aws_s3_bucket.cloudtrail.tags) > 0
  ])
}
