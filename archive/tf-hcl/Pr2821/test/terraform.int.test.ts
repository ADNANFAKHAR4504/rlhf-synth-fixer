/**
 * Unit Tests for AWS S3 Security Stack Terraform Configuration
 * Tests individual resource configurations and policy logic
 */

import * as fs from 'fs';
import * as path from 'path';

describe('Terraform S3 Security Stack - Unit Tests', () => {
  let terraformConfig: string;
  
  beforeAll(() => {
    // Load Terraform configuration
    const configPath = path.join(__dirname, '../lib/tap_stack.tf');
    terraformConfig = fs.readFileSync(configPath, 'utf-8');
  });

  describe('Variable Configuration', () => {
    it('should declare aws_region variable', () => {
      expect(terraformConfig).toContain('variable "aws_region"');
      expect(terraformConfig).toContain('type        = string');
      expect(terraformConfig).toContain('default     = "eu-central-1"');
    });
    
    it('should use aws_region variable in resources', () => {
      // Check if region variable is referenced (implied by no hardcoded regions)
      const hardcodedRegions = terraformConfig.match(/eu-[a-z]+-[0-9]+/g) || [];
      const variableDefRegions = hardcodedRegions.filter(match => 
        terraformConfig.includes(`default     = "${match}"`));
      
      expect(hardcodedRegions.length).toBe(variableDefRegions.length);
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should define S3 bucket resource', () => {
      expect(terraformConfig).toContain('resource "aws_s3_bucket" "secure_data"');
      expect(terraformConfig).toContain('bucket = local.bucket_name');
    });

    it('should configure server-side encryption', () => {
      expect(terraformConfig).toContain('resource "aws_s3_bucket_server_side_encryption_configuration"');
      expect(terraformConfig).toContain('sse_algorithm = "AES256"');
    });

    it('should enable versioning', () => {
      expect(terraformConfig).toContain('resource "aws_s3_bucket_versioning"');
      expect(terraformConfig).toContain('status = "Enabled"');
    });

    it('should block public access', () => {
      expect(terraformConfig).toContain('resource "aws_s3_bucket_public_access_block"');
      expect(terraformConfig).toContain('block_public_acls       = true');
      expect(terraformConfig).toContain('block_public_policy     = true');
      expect(terraformConfig).toContain('ignore_public_acls      = true');
      expect(terraformConfig).toContain('restrict_public_buckets = true');
    });
  });

  describe('Bucket Policy Configuration', () => {
    it('should include TLS enforcement policy', () => {
      expect(terraformConfig).toContain('DenyNonTLSAccess');
      expect(terraformConfig).toContain('"aws:SecureTransport" = "false"');
    });

    it('should include encryption enforcement policy', () => {
      expect(terraformConfig).toContain('DenyPutObjectWithoutEncryption');
      expect(terraformConfig).toContain('"s3:x-amz-server-side-encryption" = "AES256"');
    });

    it('should lock encryption configuration', () => {
      expect(terraformConfig).toContain('DenyEncryptionConfigChanges');
      expect(terraformConfig).toContain('"s3:PutEncryptionConfiguration"');
    });
  });

  describe('IAM Role Configuration', () => {
    it('should define analytics reader role', () => {
      expect(terraformConfig).toContain('resource "aws_iam_role" "analytics_reader"');
      expect(terraformConfig).toContain('name = "analytics-reader-role-${local.environment_suffix}"');
    });

    it('should define uploader role', () => {
      expect(terraformConfig).toContain('resource "aws_iam_role" "uploader"');
      expect(terraformConfig).toContain('name = "uploader-role-${local.environment_suffix}"');
    });

    it('should configure EC2 trust relationship', () => {
      const ec2TrustCount = (terraformConfig.match(/"ec2\.amazonaws\.com"/g) || []).length;
      expect(ec2TrustCount).toBe(2); // Both roles should trust EC2
    });

    it('should include instance profiles', () => {
      expect(terraformConfig).toContain('resource "aws_iam_instance_profile" "analytics_reader"');
      expect(terraformConfig).toContain('resource "aws_iam_instance_profile" "uploader"');
    });
  });

  describe('Policy Permissions', () => {
    it('should scope analytics reader to analytics prefix', () => {
      expect(terraformConfig).toContain('/analytics/*');
      expect(terraformConfig).toContain('"s3:GetObject"');
    });

    it('should scope uploader to uploads prefix', () => {
      expect(terraformConfig).toContain('/uploads/*');
      expect(terraformConfig).toContain('"s3:PutObject"');
    });

    it('should enforce TLS for analytics reader', () => {
      const analyticsReaderSection = terraformConfig.substring(
        terraformConfig.indexOf('resource "aws_iam_role_policy" "analytics_reader"'),
        terraformConfig.indexOf('resource "aws_iam_instance_profile" "analytics_reader"')
      );
      expect(analyticsReaderSection).toContain('"aws:SecureTransport" = "true"');
    });
  });

  describe('Resource Tagging', () => {
    it('should define common tags', () => {
      expect(terraformConfig).toContain('common_tags = {');
      expect(terraformConfig).toContain('Environment   = "production"');
      expect(terraformConfig).toContain('Owner         = "security-team"');
      expect(terraformConfig).toContain('SecurityLevel = "high"');
    });

    it('should apply tags to resources', () => {
      const taggedResources = (terraformConfig.match(/tags\s*=\s*local\.common_tags/g) || []).length;
      expect(taggedResources).toBeGreaterThan(0);
    });
  });

  describe('Output Configuration', () => {
    const expectedOutputs = [
      'bucket_name',
      'bucket_arn', 
      'analytics_reader_role_arn',
      'uploader_role_arn',
      'analytics_reader_policy_json',
      'uploader_policy_json',
      'bucket_policy_json'
    ];

    expectedOutputs.forEach(outputName => {
      it(`should define ${outputName} output`, () => {
        expect(terraformConfig).toContain(`output "${outputName}"`);
      });
    });
  });

  describe('Security Best Practices', () => {
    it('should not contain hardcoded ARNs', () => {
      const hardcodedArns = terraformConfig.match(/arn:aws:[^"]*"[^$]/g) || [];
      expect(hardcodedArns.length).toBe(0);
    });

    it('should include security comments', () => {
      expect(terraformConfig).toContain('# Security Control:');
      expect(terraformConfig).toContain('# Wildcard justified:');
    });

    it('should be self-contained', () => {
      expect(terraformConfig).not.toContain('module.');
      expect(terraformConfig).not.toMatch(/\bsource\s*=/);
    });

    it('should not define provider configuration', () => {
      expect(terraformConfig).not.toContain('provider "aws"');
    });
  });
});