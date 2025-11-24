# Unit tests for config.tf - AWS Config Rules and Conformance Pack

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

# Test 1: Verify Config recorder is created
output "test_config_recorder_created" {
  description = "Test if AWS Config recorder was created"
  value       = try(length(aws_config_configuration_recorder.main) > 0, false)
}

# Test 2: Verify Config recorder is enabled
output "test_config_recorder_enabled" {
  description = "Test if AWS Config recorder is enabled"
  value       = try(aws_config_configuration_recorder_status.main[0].is_enabled, false)
}

# Test 3: Verify Config delivery channel is created
output "test_config_delivery_channel_created" {
  description = "Test if AWS Config delivery channel was created"
  value       = try(length(aws_config_delivery_channel.main) > 0, false)
}

# Test 4: Verify Config SNS topic is created
output "test_config_sns_topic_created" {
  description = "Test if Config SNS notification topic was created"
  value       = try(aws_sns_topic.config_notifications.arn != null, false)
}

# Test 5: Verify S3 encryption Config rule is created
output "test_s3_encryption_rule_created" {
  description = "Test if S3 encryption Config rule was created"
  value       = try(length(aws_config_config_rule.s3_encryption) > 0, false)
}

# Test 6: Verify EBS encryption Config rule is created
output "test_ebs_encryption_rule_created" {
  description = "Test if EBS encryption Config rule was created"
  value       = try(length(aws_config_config_rule.encrypted_volumes) > 0, false)
}

# Test 7: Verify RDS encryption Config rule is created
output "test_rds_encryption_rule_created" {
  description = "Test if RDS encryption Config rule was created"
  value       = try(length(aws_config_config_rule.rds_encryption) > 0, false)
}

# Test 8: Verify root account MFA Config rule is created
output "test_root_account_mfa_rule_created" {
  description = "Test if root account MFA Config rule was created"
  value       = try(length(aws_config_config_rule.root_account_mfa) > 0, false)
}

# Test 9: Verify IAM admin access Config rule is created
output "test_iam_admin_access_rule_created" {
  description = "Test if IAM admin access Config rule was created"
  value       = try(length(aws_config_config_rule.iam_admin_access) > 0, false)
}

# Test 10: Verify CloudTrail enabled Config rule is created
output "test_cloudtrail_enabled_rule_created" {
  description = "Test if CloudTrail enabled Config rule was created"
  value       = try(length(aws_config_config_rule.cloudtrail_enabled) > 0, false)
}

# Test 11: Verify Config enabled Config rule is created
output "test_config_enabled_rule_created" {
  description = "Test if Config enabled Config rule was created"
  value       = try(length(aws_config_config_rule.config_enabled) > 0, false)
}

# Test 12: Verify all 7 Config rules are created
output "test_all_config_rules_created" {
  description = "Test if all 7 Config rules were created"
  value = alltrue([
    length(aws_config_config_rule.s3_encryption) > 0,
    length(aws_config_config_rule.encrypted_volumes) > 0,
    length(aws_config_config_rule.rds_encryption) > 0,
    length(aws_config_config_rule.root_account_mfa) > 0,
    length(aws_config_config_rule.iam_admin_access) > 0,
    length(aws_config_config_rule.cloudtrail_enabled) > 0,
    length(aws_config_config_rule.config_enabled) > 0
  ])
}

# Test 13: Verify conformance pack is created
output "test_conformance_pack_created" {
  description = "Test if Config conformance pack was created"
  value       = try(length(aws_config_conformance_pack.security) > 0, false)
}

# Test 14: Verify conformance pack has environment_suffix in name
output "test_conformance_pack_name_has_suffix" {
  description = "Test if conformance pack name includes environment_suffix"
  value       = try(contains(aws_config_conformance_pack.security[0].name, var.environment_suffix), false)
}

# Test 15: Verify Config rules use AWS managed rules
output "test_config_rules_use_aws_managed" {
  description = "Test if Config rules use AWS managed rules"
  value       = try(aws_config_config_rule.s3_encryption[0].source[0].owner == "AWS", false)
}

# Test 16: Verify S3 bucket policy exists for Config
output "test_config_bucket_policy_exists" {
  description = "Test if Config S3 bucket policy was created"
  value       = try(aws_s3_bucket_policy.config_bucket_policy.policy != null, false)
}

# Test 17: Verify CloudTrail logs role trusts Config service
output "test_config_role_trusts_service" {
  description = "Test if Config role trusts AWS Config service"
  value       = try(contains(jsondecode(data.aws_iam_policy_document.config_assume.statement[0].principal.identifiers), "config.amazonaws.com"), false)
}

# Test 18: Verify Config rules have resource scope
output "test_config_rules_have_scope" {
  description = "Test if Config rules have resource scope defined"
  value       = try(length(aws_config_config_rule.s3_encryption[0].scope) > 0, false)
}

# Test 19: Verify SNS topic is KMS encrypted
output "test_config_sns_topic_encrypted" {
  description = "Test if Config SNS topic is KMS encrypted"
  value       = try(aws_sns_topic.config_notifications.kms_master_key_id != null, false)
}

# Test 20: Verify Config rule names have environment_suffix
output "test_config_rule_names_have_suffix" {
  description = "Test if Config rule names include environment_suffix"
  value       = try(contains(aws_config_config_rule.s3_encryption[0].name, var.environment_suffix), false)
}
