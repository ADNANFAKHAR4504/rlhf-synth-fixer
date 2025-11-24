# Unit tests for scp.tf - Service Control Policies

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

# Test 1: Verify S3 encryption SCP is created
output "test_s3_encryption_scp_created" {
  description = "Test if S3 encryption SCP was created"
  value       = try(aws_organizations_policy.s3_encryption.id != null, false)
}

# Test 2: Verify EBS encryption SCP is created
output "test_ebs_encryption_scp_created" {
  description = "Test if EBS encryption SCP was created"
  value       = try(aws_organizations_policy.ebs_encryption.id != null, false)
}

# Test 3: Verify RDS encryption SCP is created
output "test_rds_encryption_scp_created" {
  description = "Test if RDS encryption SCP was created"
  value       = try(aws_organizations_policy.rds_encryption.id != null, false)
}

# Test 4: Verify KMS protection SCP is created
output "test_kms_protection_scp_created" {
  description = "Test if KMS protection SCP was created"
  value       = try(aws_organizations_policy.kms_protection.id != null, false)
}

# Test 5: Verify S3 SCP is attached to security OU
output "test_s3_scp_attached_security" {
  description = "Test if S3 SCP is attached to security OU"
  value       = try(aws_organizations_policy_attachment.s3_security_ou.policy_id != null, false)
}

# Test 6: Verify S3 SCP is attached to production OU
output "test_s3_scp_attached_production" {
  description = "Test if S3 SCP is attached to production OU"
  value       = try(aws_organizations_policy_attachment.s3_production_ou.policy_id != null, false)
}

# Test 7: Verify S3 SCP is attached to development OU
output "test_s3_scp_attached_development" {
  description = "Test if S3 SCP is attached to development OU"
  value       = try(aws_organizations_policy_attachment.s3_development_ou.policy_id != null, false)
}

# Test 8: Verify EBS SCP is attached to all OUs
output "test_ebs_scp_attached_all_ous" {
  description = "Test if EBS SCP is attached to all OUs"
  value = alltrue([
    aws_organizations_policy_attachment.ebs_security_ou.policy_id != null,
    aws_organizations_policy_attachment.ebs_production_ou.policy_id != null,
    aws_organizations_policy_attachment.ebs_development_ou.policy_id != null
  ])
}

# Test 9: Verify RDS SCP is attached to all OUs
output "test_rds_scp_attached_all_ous" {
  description = "Test if RDS SCP is attached to all OUs"
  value = alltrue([
    aws_organizations_policy_attachment.rds_security_ou.policy_id != null,
    aws_organizations_policy_attachment.rds_production_ou.policy_id != null,
    aws_organizations_policy_attachment.rds_development_ou.policy_id != null
  ])
}

# Test 10: Verify KMS SCP is attached to all OUs
output "test_kms_scp_attached_all_ous" {
  description = "Test if KMS SCP is attached to all OUs"
  value = alltrue([
    aws_organizations_policy_attachment.kms_security_ou.policy_id != null,
    aws_organizations_policy_attachment.kms_production_ou.policy_id != null,
    aws_organizations_policy_attachment.kms_development_ou.policy_id != null
  ])
}

# Test 11: Verify S3 SCP contains deny policy
output "test_s3_scp_has_deny_statement" {
  description = "Test if S3 SCP contains deny statements"
  value       = try(contains(jsondecode(aws_organizations_policy.s3_encryption.content).Statement[*].Effect, "Deny"), false)
}

# Test 12: Verify EBS SCP denies unencrypted volumes
output "test_ebs_scp_denies_unencrypted" {
  description = "Test if EBS SCP denies unencrypted volumes"
  value       = try(contains(jsondecode(aws_organizations_policy.ebs_encryption.content).Statement[*].Sid, "DenyUnencryptedEBSVolumes"), false)
}

# Test 13: Verify RDS SCP denies unencrypted databases
output "test_rds_scp_denies_unencrypted" {
  description = "Test if RDS SCP denies unencrypted databases"
  value       = try(contains(jsondecode(aws_organizations_policy.rds_encryption.content).Statement[*].Sid, "DenyUnencryptedRDS"), false)
}

# Test 14: Verify KMS SCP prevents key deletion
output "test_kms_scp_prevents_deletion" {
  description = "Test if KMS SCP prevents key deletion"
  value       = try(contains(jsondecode(aws_organizations_policy.kms_protection.content).Statement[*].Sid, "DenyKMSKeyDeletion"), false)
}

# Test 15: Verify all SCPs have environment_suffix in name
output "test_scp_names_have_suffix" {
  description = "Test if all SCP names include environment_suffix"
  value = alltrue([
    contains(aws_organizations_policy.s3_encryption.name, var.environment_suffix),
    contains(aws_organizations_policy.ebs_encryption.name, var.environment_suffix),
    contains(aws_organizations_policy.rds_encryption.name, var.environment_suffix),
    contains(aws_organizations_policy.kms_protection.name, var.environment_suffix)
  ])
}
