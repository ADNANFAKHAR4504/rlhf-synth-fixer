import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration Unit Tests', () => {
  let terraformConfig: string;

  beforeAll(() => {
    // Read the Terraform configuration file
    const terraformPath = path.join(__dirname, '..', 'lib', 'main.tf');
    terraformConfig = fs.readFileSync(terraformPath, 'utf8');
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Terraform Configuration Structure', () => {
    test('should contain required S3 bucket resource', () => {
      expect(terraformConfig).toContain('resource "aws_s3_bucket" "secure_log_bucket"');
      expect(terraformConfig).toContain('bucket = local.bucket_name');
    });

    test('should contain KMS key for encryption', () => {
      expect(terraformConfig).toContain('resource "aws_kms_key" "log_bucket_key"');
      expect(terraformConfig).toContain('enable_key_rotation     = true');
    });

    test('should contain CloudTrail configuration', () => {
      expect(terraformConfig).toContain('resource "aws_cloudtrail" "security_trail"');
      expect(terraformConfig).toContain('s3_bucket_name = aws_s3_bucket.secure_log_bucket.bucket');
      expect(terraformConfig).toContain('enable_log_file_validation    = true');
    });

    test('should contain proper IAM roles', () => {
      expect(terraformConfig).toContain('resource "aws_iam_role" "log_writer_role"');
      expect(terraformConfig).toContain('resource "aws_iam_role" "log_reader_role"');
    });

    test('should contain CloudWatch monitoring', () => {
      expect(terraformConfig).toContain('resource "aws_cloudwatch_log_group" "security_alerts"');
      expect(terraformConfig).toContain('resource "aws_cloudwatch_metric_alarm" "unauthorized_access_alarm"');
    });

    test('should contain SNS topic for alerts', () => {
      expect(terraformConfig).toContain('resource "aws_sns_topic" "security_alerts"');
      expect(terraformConfig).toContain('kms_master_key_id = aws_kms_key.log_bucket_key.id');
    });

    test('should include randomization for bucket naming', () => {
      expect(terraformConfig).toContain('resource "random_id" "bucket_suffix"');
      expect(terraformConfig).toContain('bucket_name        = "corpsec-secure-logs-${local.environment_suffix}-${random_id.bucket_suffix.hex}"');
    });

    test('should have proper S3 security configurations', () => {
      expect(terraformConfig).toContain('resource "aws_s3_bucket_public_access_block" "log_bucket_pab"');
      expect(terraformConfig).toContain('block_public_acls       = true');
      expect(terraformConfig).toContain('restrict_public_buckets = true');
    });

    test('should have S3 bucket encryption configuration', () => {
      expect(terraformConfig).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(terraformConfig).toContain('sse_algorithm     = "aws:kms"');
    });

    test('should have S3 bucket lifecycle configuration', () => {
      expect(terraformConfig).toContain('resource "aws_s3_bucket_lifecycle_configuration"');
      expect(terraformConfig).toContain('storage_class = "GLACIER"');
      expect(terraformConfig).toContain('storage_class = "DEEP_ARCHIVE"');
    });

    test('should have MFA requirements for IAM roles', () => {
      expect(terraformConfig).toContain('"aws:MultiFactorAuthPresent" = "true"');
    });

    test('should enforce secure transport in bucket policy', () => {
      expect(terraformConfig).toContain('"aws:SecureTransport" = "false"');
      expect(terraformConfig).toContain('Effect    = "Deny"');
    });
  });

  describe('Terraform Configuration Security Validation', () => {
    test('should not contain hardcoded secrets or keys', () => {
      // Check for common patterns of hardcoded credentials
      const secretPatterns = [
        /aws_access_key_id\s*=\s*["'][A-Z0-9]{20}["']/,
        /aws_secret_access_key\s*=\s*["'][A-Za-z0-9/+=]{40}["']/,
        /password\s*=\s*["'][^"']+["']/i,
        /secret\s*=\s*["'][^"']+["']/i
      ];
      
      secretPatterns.forEach(pattern => {
        expect(terraformConfig).not.toMatch(pattern);
      });
    });

    test('should use proper variable references', () => {
      // Check for variable usage in provider configuration
      const providerConfig = fs.readFileSync(path.join(__dirname, '..', 'lib', 'provider.tf'), 'utf8');
      expect(providerConfig).toContain('var.aws_region');
    });

    test('should have proper resource dependencies', () => {
      expect(terraformConfig).toContain('depends_on = [aws_s3_bucket_policy.log_bucket_policy]');
    });
  });

  describe('Resource Naming and Tags', () => {
    test('should have consistent naming convention', () => {
      expect(terraformConfig).toContain('Name = "corpSec-');
    });

    test('should have proper tagging strategy', () => {
      expect(terraformConfig).toContain('Purpose    = "Security logging and audit trails"');
      expect(terraformConfig).toContain('Compliance = "SOC2-PCI-DSS"');
    });
  });

  describe('Terraform Syntax Validation', () => {
    test('should have valid HCL syntax structure', () => {
      // Basic syntax checks
      const openBraces = (terraformConfig.match(/\{/g) || []).length;
      const closeBraces = (terraformConfig.match(/\}/g) || []).length;
      expect(openBraces).toBe(closeBraces);
    });

    test('should have proper resource blocks', () => {
      const resourceBlocks = terraformConfig.match(/resource\s+"[^"]+"\s+"[^"]+"/g);
      expect(resourceBlocks).toBeTruthy();
      expect(resourceBlocks!.length).toBeGreaterThan(10);
    });

    test('should have proper locals block', () => {
      expect(terraformConfig).toContain('locals {');
      expect(terraformConfig).toContain('bucket_name        = "corpsec-secure-logs-${local.environment_suffix}-${random_id.bucket_suffix.hex}"');
      expect(terraformConfig).toContain('account_id         = data.aws_caller_identity.current.account_id');
    });

    test('should have data sources for AWS account info', () => {
      expect(terraformConfig).toContain('data "aws_caller_identity" "current"');
      expect(terraformConfig).toContain('data "aws_region" "current"');
    });
  });

  describe('Infrastructure Security Best Practices', () => {
    test('should enforce encryption at rest', () => {
      expect(terraformConfig).toContain('kms_master_key_id = aws_kms_key.log_bucket_key.arn');
      expect(terraformConfig).toContain('sse_algorithm     = "aws:kms"');
    });

    test('should enforce encryption in transit', () => {
      expect(terraformConfig).toContain('"aws:SecureTransport" = "false"');
      expect(terraformConfig).toContain('Effect    = "Deny"');
    });

    test('should require MFA for sensitive operations', () => {
      expect(terraformConfig).toContain('"aws:MultiFactorAuthPresent" = "true"');
      expect(terraformConfig).toContain('"aws:MultiFactorAuthAge" = "3600"');
    });

    test('should have proper access controls', () => {
      expect(terraformConfig).toContain('s3:PutObject');
      expect(terraformConfig).toContain('s3:GetObject');
      expect(terraformConfig).toContain('s3:ListBucket');
    });

    test('should have audit trail configuration', () => {
      expect(terraformConfig).toContain('is_multi_region_trail         = true');
      expect(terraformConfig).toContain('include_global_service_events = true');
      expect(terraformConfig).toContain('enable_log_file_validation    = true');
    });
  });
});