# Unit tests for iam.tf - IAM roles and policies

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

# Test 1: Verify security role is created
output "test_security_role_created" {
  description = "Test if cross-account security role was created"
  value       = try(aws_iam_role.cross_account_security.arn != null, false)
}

# Test 2: Verify operations role is created
output "test_operations_role_created" {
  description = "Test if cross-account operations role was created"
  value       = try(aws_iam_role.cross_account_operations.arn != null, false)
}

# Test 3: Verify developer role is created
output "test_developer_role_created" {
  description = "Test if cross-account developer role was created"
  value       = try(aws_iam_role.cross_account_developer.arn != null, false)
}

# Test 4: Verify security role has policy attached
output "test_security_role_policy_attached" {
  description = "Test if security role has inline policy"
  value       = try(aws_iam_role_policy.cross_account_security.policy != null, false)
}

# Test 5: Verify operations role has policy attached
output "test_operations_role_policy_attached" {
  description = "Test if operations role has inline policy"
  value       = try(aws_iam_role_policy.cross_account_operations.policy != null, false)
}

# Test 6: Verify developer role has policy attached
output "test_developer_role_policy_attached" {
  description = "Test if developer role has inline policy"
  value       = try(aws_iam_role_policy.cross_account_developer.policy != null, false)
}

# Test 7: Verify Config role is created
output "test_config_role_created" {
  description = "Test if AWS Config role was created"
  value       = try(aws_iam_role.config_role.arn != null, false)
}

# Test 8: Verify Config bucket is created
output "test_config_bucket_created" {
  description = "Test if AWS Config S3 bucket was created"
  value       = try(aws_s3_bucket.config_bucket.id != null, false)
}

# Test 9: Verify Config bucket has encryption
output "test_config_bucket_encrypted" {
  description = "Test if Config bucket has encryption enabled"
  value       = try(length(aws_s3_bucket_server_side_encryption_configuration.config_bucket.rule) > 0, false)
}

# Test 10: Verify Config bucket has versioning
output "test_config_bucket_versioned" {
  description = "Test if Config bucket has versioning enabled"
  value       = try(aws_s3_bucket_versioning.config_bucket.versioning_configuration[0].status == "Enabled", false)
}

# Test 11: Verify Config bucket blocks public access
output "test_config_bucket_public_access_blocked" {
  description = "Test if Config bucket blocks public access"
  value = alltrue([
    aws_s3_bucket_public_access_block.config_bucket.block_public_acls,
    aws_s3_bucket_public_access_block.config_bucket.block_public_policy,
    aws_s3_bucket_public_access_block.config_bucket.ignore_public_acls,
    aws_s3_bucket_public_access_block.config_bucket.restrict_public_buckets
  ])
}

# Test 12: Verify security role requires MFA in assume policy
output "test_security_role_mfa_required" {
  description = "Test if security role requires MFA for assumption"
  value       = try(contains(data.aws_iam_policy_document.cross_account_security_assume.statement[0].condition[0].variable, "MultiFactorAuthPresent"), false)
}

# Test 13: Verify environment_suffix in role names
output "test_iam_role_names_have_suffix" {
  description = "Test if IAM role names include environment_suffix"
  value       = try(contains(aws_iam_role.cross_account_security.name, var.environment_suffix), false)
}

# Test 14: Verify Config role has managed policy attached
output "test_config_role_managed_policy" {
  description = "Test if Config role has managed policy attached"
  value       = try(aws_iam_role_policy_attachment.config_managed_policy.policy_arn != null, false)
}

# Test 15: Verify Config role S3 policy exists
output "test_config_role_s3_policy" {
  description = "Test if Config role has S3 policy"
  value       = try(aws_iam_role_policy.config_s3.policy != null, false)
}
