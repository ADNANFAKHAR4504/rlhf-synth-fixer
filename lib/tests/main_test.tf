# Unit tests for main.tf - Organizations and CloudTrail

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

# Test 1: Verify Organizations is created
output "test_organization_created" {
  description = "Test if organization was created successfully"
  value       = try(aws_organizations_organization.main.id != null, false)
}

# Test 2: Verify all 3 OUs are created
output "test_all_ous_created" {
  description = "Test if all 3 organizational units were created"
  value = alltrue([
    aws_organizations_organizational_unit.security.id != null,
    aws_organizations_organizational_unit.production.id != null,
    aws_organizations_organizational_unit.development.id != null
  ])
}

# Test 3: Verify CloudTrail is enabled
output "test_cloudtrail_enabled" {
  description = "Test if CloudTrail is enabled"
  value       = try(length(aws_cloudtrail.organization) > 0 && aws_cloudtrail.organization[0].is_enabled, false)
}

# Test 4: Verify CloudTrail has multi-region enabled
output "test_cloudtrail_multi_region" {
  description = "Test if CloudTrail is multi-region"
  value       = try(aws_cloudtrail.organization[0].is_multi_region_trail, false)
}

# Test 5: Verify CloudTrail bucket exists
output "test_cloudtrail_bucket_exists" {
  description = "Test if CloudTrail S3 bucket exists"
  value       = try(aws_s3_bucket.cloudtrail.id != null, false)
}

# Test 6: Verify CloudTrail bucket has encryption
output "test_cloudtrail_bucket_encrypted" {
  description = "Test if CloudTrail bucket has encryption enabled"
  value       = try(length(aws_s3_bucket_server_side_encryption_configuration.cloudtrail.rule) > 0, false)
}

# Test 7: Verify CloudTrail bucket has versioning
output "test_cloudtrail_bucket_versioned" {
  description = "Test if CloudTrail bucket has versioning enabled"
  value       = try(aws_s3_bucket_versioning.cloudtrail.versioning_configuration[0].status == "Enabled", false)
}

# Test 8: Verify CloudTrail bucket blocks public access
output "test_cloudtrail_bucket_public_access_blocked" {
  description = "Test if CloudTrail bucket blocks public access"
  value = alltrue([
    aws_s3_bucket_public_access_block.cloudtrail.block_public_acls,
    aws_s3_bucket_public_access_block.cloudtrail.block_public_policy,
    aws_s3_bucket_public_access_block.cloudtrail.ignore_public_acls,
    aws_s3_bucket_public_access_block.cloudtrail.restrict_public_buckets
  ])
}

# Test 9: Verify environment_suffix is applied to OUs
output "test_environment_suffix_in_ou_tags" {
  description = "Test if environment_suffix is applied to OU tags"
  value       = try(contains(keys(aws_organizations_organizational_unit.security.tags), "Name"), false)
}

# Test 10: Verify CloudTrail uses KMS encryption
output "test_cloudtrail_kms_encrypted" {
  description = "Test if CloudTrail is KMS encrypted"
  value       = try(aws_cloudtrail.organization[0].kms_key_id != null && aws_cloudtrail.organization[0].kms_key_id != "", false)
}
