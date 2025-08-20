import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Unit Tests', () => {
  let mainTfContent: string;
  let providerTfContent: string;

  beforeAll(() => {
    const mainTfPath = path.resolve(__dirname, '../lib/main.tf');
    const providerTfPath = path.resolve(__dirname, '../lib/provider.tf');
    
    mainTfContent = fs.readFileSync(mainTfPath, 'utf-8');
    providerTfContent = fs.readFileSync(providerTfPath, 'utf-8');
  });

  describe('File Structure Validation', () => {
    test('main.tf file exists and is readable', () => {
      const mainTfPath = path.resolve(__dirname, '../lib/main.tf');
      expect(fs.existsSync(mainTfPath)).toBe(true);
      expect(mainTfContent.length).toBeGreaterThan(0);
    });

    test('provider.tf file exists and is readable', () => {
      const providerTfPath = path.resolve(__dirname, '../lib/provider.tf');
      expect(fs.existsSync(providerTfPath)).toBe(true);
      expect(providerTfContent.length).toBeGreaterThan(0);
    });

    test('Lambda source directory does not exist (removed)', () => {
      const lambdaPath = path.resolve(__dirname, '../lib/lambda');
      expect(fs.existsSync(lambdaPath)).toBe(false);
    });
  });

  describe('Variables Validation', () => {
    test('aws_region variable is declared with us-east-1 default', () => {
      expect(mainTfContent).toContain('variable "aws_region"');
      expect(mainTfContent).toContain('default     = "us-east-1"');
    });

    test('environment variable is declared', () => {
      expect(mainTfContent).toContain('variable "environment"');
      expect(mainTfContent).toContain('default     = "production"');
    });

    test('owner variable is declared for cost allocation', () => {
      expect(mainTfContent).toContain('variable "owner"');
      expect(mainTfContent).toContain('default     = "platform-team"');
    });
  });

  describe('Data Sources Validation', () => {
    test('required data sources are present', () => {
      expect(mainTfContent).toContain('data "aws_caller_identity" "current"');
      expect(mainTfContent).toContain('data "aws_region" "current"');
      expect(mainTfContent).toContain('data "aws_partition" "current"');
    });
  });

  describe('Locals Validation', () => {
    test('essential locals are defined', () => {
      expect(mainTfContent).toContain('locals {');
      expect(mainTfContent).toContain('account_id = data.aws_caller_identity.current.account_id');
      expect(mainTfContent).toContain('region     = data.aws_region.current.id');
      expect(mainTfContent).toContain('partition  = data.aws_partition.current.partition');
    });

    test('cost allocation tags are properly defined', () => {
      expect(mainTfContent).toContain('common_tags = {}');
    });
  });

  describe('S3 Bucket Validation', () => {
    test('primary S3 bucket follows correct naming pattern', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket" "primary"');
      expect(mainTfContent).toContain('bucket = "data-secured-${local.account_id}-v2"');
    });

    test('access logging bucket is configured', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket" "access_logging"');
      expect(mainTfContent).toContain('bucket = "data-secured-${local.account_id}-access-logs-v2"');
    });

    test('replication destination bucket is configured for us-west-2', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket" "replication_destination"');
      expect(mainTfContent).toContain('provider = aws.us_west_2');
      expect(mainTfContent).toContain('bucket   = "data-secured-${local.account_id}-replica-v2"');
    });

    test('primary bucket has versioning enabled', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_versioning" "primary_versioning"');
      expect(mainTfContent).toContain('status = "Enabled"');
    });

    test('primary bucket has KMS encryption enabled', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "primary_encryption"');
      expect(mainTfContent).toContain('sse_algorithm     = "aws:kms"');
      expect(mainTfContent).toContain('kms_master_key_id = "aws/s3"');
    });

    test('primary bucket has public access blocked', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_public_access_block" "primary_pab"');
      expect(mainTfContent).toContain('block_public_acls       = true');
      expect(mainTfContent).toContain('block_public_policy     = true');
      expect(mainTfContent).toContain('ignore_public_acls      = true');
      expect(mainTfContent).toContain('restrict_public_buckets = true');
    });

    test('primary bucket has access logging configured', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_logging" "primary_logging"');
      expect(mainTfContent).toContain('target_bucket = aws_s3_bucket.access_logging.id');
      expect(mainTfContent).toContain('target_prefix = "access-logs/"');
    });

    test('primary bucket has lifecycle rules for 365 days', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_lifecycle_configuration" "primary_lifecycle"');
      expect(mainTfContent).toContain('days = 365');
      expect(mainTfContent).toContain('noncurrent_days = 90');
    });

    test('primary bucket has security policies', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_policy" "primary_bucket_policy"');
      expect(mainTfContent).toContain('DenyInsecureConnections');
      expect(mainTfContent).toContain('RequireSSEKMS');
      expect(mainTfContent).toContain('AllowReplicationRole');
    });

    test('access logging bucket has proper policy', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_policy" "access_logging_policy"');
      expect(mainTfContent).toContain('S3ServerAccessLogsPolicy');
      expect(mainTfContent).toContain('logging.s3.amazonaws.com');
    });

    test('replication destination bucket has proper policy', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_policy" "replication_destination_policy"');
      expect(mainTfContent).toContain('ReplicationPolicy');
      expect(mainTfContent).toContain('provider = aws.us_west_2');
    });
  });

  describe('Cross-Region Replication Validation', () => {
    test('replication IAM role is configured', () => {
      expect(mainTfContent).toContain('resource "aws_iam_role" "replication_role"');
      expect(mainTfContent).toContain('name = "data-secured-${local.account_id}-replication-role-v2"');
      expect(mainTfContent).toContain('Service = "s3.amazonaws.com"');
    });

    test('replication IAM policy is configured', () => {
      expect(mainTfContent).toContain('resource "aws_iam_policy" "replication_policy"');
      expect(mainTfContent).toContain('s3:GetObjectVersionForReplication');
      expect(mainTfContent).toContain('s3:ReplicateObject');
      expect(mainTfContent).toContain('s3:ReplicateDelete');
      expect(mainTfContent).toContain('s3:GetBucketVersioning');
    });

    test('S3 replication configuration is enabled', () => {
      expect(mainTfContent).toContain('resource "aws_s3_bucket_replication_configuration" "primary_replication"');
      expect(mainTfContent).toContain('status = "Enabled"');
      expect(mainTfContent).toContain('destination {');
      expect(mainTfContent).toContain('replica_kms_key_id = "arn:${local.partition}:kms:us-west-2:${local.account_id}:alias/aws/s3"');
      expect(mainTfContent).toContain('source_selection_criteria {');
      expect(mainTfContent).toContain('sse_kms_encrypted_objects {');
    });
  });

  describe('MFA Security Validation', () => {
    test('MFA enforcement IAM policy exists', () => {
      expect(mainTfContent).toContain('resource "aws_iam_policy" "mfa_s3_access_policy"');
      expect(mainTfContent).toContain('aws:MultiFactorAuthPresent');
      expect(mainTfContent).toContain('aws:MultiFactorAuthAge');
    });

    test('MFA policy denies access without MFA', () => {
      expect(mainTfContent).toContain('DenyS3AccessWithoutMFA');
      expect(mainTfContent).toContain('Effect = "Deny"');
      expect(mainTfContent).toContain('BoolIfExists');
    });
  });

  describe('Outputs Validation', () => {
    test('output "source_bucket_name" is defined', () => {
      expect(mainTfContent).toContain('output "source_bucket_name"');
      expect(mainTfContent).toContain('value       = aws_s3_bucket.primary.bucket');
    });

    test('output "destination_bucket_name" is defined', () => {
      expect(mainTfContent).toContain('output "destination_bucket_name"');
      expect(mainTfContent).toContain('value       = aws_s3_bucket.replication_destination.bucket');
    });

    test('output "logging_bucket_name" is defined', () => {
      expect(mainTfContent).toContain('output "logging_bucket_name"');
      expect(mainTfContent).toContain('value       = aws_s3_bucket.access_logging.bucket');
    });

    test('output "mfa_policy_arn" is defined', () => {
      expect(mainTfContent).toContain('output "mfa_policy_arn"');
      expect(mainTfContent).toContain('value       = aws_iam_policy.mfa_s3_access_policy.arn');
    });

    test('outputs have proper descriptions', () => {
      expect(mainTfContent).toContain('description = "Name of the primary secure S3 bucket"');
      expect(mainTfContent).toContain('description = "Name of the replication destination bucket in us-west-2"');
      expect(mainTfContent).toContain('description = "Name of the access logging bucket"');
    });
  });

  describe('Provider Configuration Validation', () => {
    test('provider.tf contains primary AWS provider for us-east-1', () => {
      expect(providerTfContent).toContain('provider "aws" {');
      expect(providerTfContent).toContain('region = "us-east-1"');
    });

    test('provider.tf contains us-west-2 provider for replication', () => {
      expect(providerTfContent).toContain('provider "aws" {');
      expect(providerTfContent).toContain('alias  = "us_west_2"');
      expect(providerTfContent).toContain('region = "us-west-2"');
    });

    test('provider.tf has correct default tags', () => {
      expect(providerTfContent).toContain('default_tags {');
      expect(providerTfContent).toContain('Owner       = var.owner');
      expect(providerTfContent).toContain('Environment = var.environment');
      expect(providerTfContent).toContain('ManagedBy   = "terraform"');
    });

    test('provider.tf contains S3 backend configuration', () => {
      expect(providerTfContent).toContain('backend "s3" {}');
    });

    test('provider.tf contains required providers block', () => {
      expect(providerTfContent).toContain('required_providers');
      expect(providerTfContent).toContain('aws = {');
      expect(providerTfContent).toContain('source  = "hashicorp/aws"');
      expect(providerTfContent).toContain('version = ">= 5.0"');
    });
  });

  describe('Security Best Practices Validation', () => {
    test('no hardcoded account IDs or sensitive data', () => {
      // Check that account ID is dynamically referenced
      expect(mainTfContent).toContain('${local.account_id}');
      // Ensure no hardcoded account IDs (12-digit numbers)
      expect(mainTfContent).not.toMatch(/\b\d{12}\b/);
    });

    test('encryption is enabled for all buckets', () => {
      expect(mainTfContent).toContain('sse_algorithm = "AES256"'); // logging bucket
      expect(mainTfContent).toContain('sse_algorithm     = "aws:kms"'); // primary and replica
    });

    test('versioning is enabled where required', () => {
      // Should have versioning for primary, replica, and logging buckets
      const versioningMatches = mainTfContent.match(/status = "Enabled"/g);
      expect(versioningMatches?.length).toBeGreaterThanOrEqual(3);
    });
  });

  describe('Tagging Consistency Validation', () => {
    test('common_tags local is empty (using provider default_tags)', () => {
      expect(mainTfContent).toContain('common_tags = {}');
    });

    test('resources use consistent tagging patterns', () => {
      expect(mainTfContent).toContain('tags = merge(local.common_tags');
      expect(mainTfContent).toContain('Purpose     = "Secure Data Storage"');
      expect(mainTfContent).toContain('Compliance  = "Required"');
    });
  });

  describe('Resource Dependencies Validation', () => {
    test('replication depends on versioning', () => {
      expect(mainTfContent).toContain('depends_on = [aws_s3_bucket_versioning.primary_versioning]');
    });

    test('lifecycle configuration depends on versioning', () => {
      expect(mainTfContent).toContain('depends_on = [aws_s3_bucket_versioning.primary_versioning]');
    });
  });
});