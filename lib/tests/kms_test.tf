# Unit tests for kms.tf - KMS keys and replication

terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  alias  = "primary"
  region = "us-east-1"
}

provider "aws" {
  alias  = "secondary"
  region = "us-west-2"
}

# Test 1: Verify primary KMS key is created
output "test_primary_kms_key_created" {
  description = "Test if primary KMS key was created"
  value       = try(aws_kms_key.primary.key_id != null, false)
}

# Test 2: Verify primary KMS key has rotation enabled
output "test_primary_kms_key_rotation_enabled" {
  description = "Test if primary KMS key has rotation enabled"
  value       = try(aws_kms_key.primary.enable_key_rotation, false)
}

# Test 3: Verify primary KMS key rotation period is correct
output "test_primary_kms_key_rotation_period" {
  description = "Test if primary KMS key rotation period is set correctly"
  value       = try(aws_kms_key.primary.rotation_period_in_days == 365, false)
}

# Test 4: Verify primary KMS key alias is created
output "test_primary_kms_alias_created" {
  description = "Test if primary KMS key alias was created"
  value       = try(aws_kms_alias.primary.name != null, false)
}

# Test 5: Verify replica KMS key is created
output "test_replica_kms_key_created" {
  description = "Test if replica KMS key was created"
  value       = try(aws_kms_replica_key.secondary.key_id != null, false)
}

# Test 6: Verify replica KMS key alias is created
output "test_replica_kms_alias_created" {
  description = "Test if replica KMS key alias was created"
  value       = try(aws_kms_alias.secondary.name != null, false)
}

# Test 7: Verify KMS grants are created for cross-account access
output "test_kms_grants_created" {
  description = "Test if KMS grants are created for cross-account access"
  value       = try(length(aws_kms_grant.cross_account) > 0, false)
}

# Test 8: Verify KMS key policy exists
output "test_kms_key_policy_exists" {
  description = "Test if KMS key policy is properly configured"
  value       = try(aws_kms_key_policy.primary.policy != null && aws_kms_key_policy.primary.policy != "", false)
}

# Test 9: Verify KMS key deletion window is 30 days
output "test_kms_key_deletion_window" {
  description = "Test if KMS key deletion window is 30 days"
  value       = try(aws_kms_key.primary.deletion_window_in_days == 30, false)
}

# Test 10: Verify replica key has same deletion window
output "test_replica_kms_key_deletion_window" {
  description = "Test if replica KMS key deletion window is 30 days"
  value       = try(aws_kms_replica_key.secondary.deletion_window_in_days == 30, false)
}

# Test 11: Verify environment_suffix is in KMS key tags
output "test_kms_key_tags_have_suffix" {
  description = "Test if KMS key tags include environment_suffix"
  value       = try(contains(values(aws_kms_key.primary.tags), var.environment_suffix), false)
}

# Test 12: Verify KMS grant operations are correct
output "test_kms_grant_operations" {
  description = "Test if KMS grant operations include required permissions"
  value       = try(contains(aws_kms_grant.cross_account[keys(aws_kms_grant.cross_account)[0]].operations, "Decrypt"), false)
}
