import { readFileSync } from 'fs';
import * as path from 'path';

describe('Terraform Unit Tests', () => {
  let providerContent: string;
  let tapStackContent: string;

  beforeAll(() => {
    providerContent = readFileSync(path.join(__dirname, '../lib/provider.tf'), 'utf8');
    tapStackContent = readFileSync(path.join(__dirname, '../lib/tap_stack.tf'), 'utf8');
  });

  describe('provider.tf', () => {
    test('has correct terraform version constraint', () => {
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.0"/);
    });

    test('has AWS provider version constraint', () => {
      expect(providerContent).toMatch(/version\s*=\s*">=\s*3\.0"/);
    });

    test('declares aws_region variable', () => {
      expect(providerContent).toContain('variable "aws_region"');
      expect(providerContent).toContain('type        = string');
    });

    test('configures AWS provider with region', () => {
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('region = var.aws_region');
    });

    test('has default tags configuration', () => {
      expect(providerContent).toContain('default_tags');
      expect(providerContent).toContain('Environment');
      expect(providerContent).toContain('Owner');
    });
  });

  describe('tap_stack.tf', () => {
    test('declares all required variables', () => {
      const requiredVars = ['bucket_name', 'owner', 'security_level', 'vpc_id'];
      requiredVars.forEach(varName => {
        expect(tapStackContent).toContain(`variable "${varName}"`);
      });
    });

    test('has locals block with common tags', () => {
      expect(tapStackContent).toContain('locals {');
      expect(tapStackContent).toContain('common_tags');
      expect(tapStackContent).toContain('bucket_arn');
    });

    test('S3 bucket has proper encryption', () => {
      expect(tapStackContent).toContain('aws_s3_bucket_server_side_encryption_configuration');
      expect(tapStackContent).toContain('sse_algorithm = "AES256"');
    });

    test('S3 bucket has versioning enabled', () => {
      expect(tapStackContent).toContain('aws_s3_bucket_versioning');
      expect(tapStackContent).toContain('status = "Enabled"');
    });

    test('S3 bucket blocks public access', () => {
      expect(tapStackContent).toContain('aws_s3_bucket_public_access_block');
      expect(tapStackContent).toContain('block_public_acls       = true');
      expect(tapStackContent).toContain('block_public_policy     = true');
    });

    test('bucket policy denies insecure transport', () => {
      expect(tapStackContent).toContain('DenyInsecureTransport');
      expect(tapStackContent).toContain('aws:SecureTransport');
      expect(tapStackContent).toContain('false');
    });

    test('analytics reader role has correct permissions', () => {
      expect(tapStackContent).toContain('analytics_reader_role');
      expect(tapStackContent).toContain('s3:GetObject');
      expect(tapStackContent).toContain('/analytics/*');
    });

    test('uploader role has correct permissions', () => {
      expect(tapStackContent).toContain('uploader_role');
      expect(tapStackContent).toContain('s3:PutObject');
      expect(tapStackContent).toContain('/uploads/*');
    });

    test('has instance profiles for both roles', () => {
      expect(tapStackContent).toContain('analytics_reader_profile');
      expect(tapStackContent).toContain('uploader_profile');
    });

    test('has comprehensive outputs', () => {
      const expectedOutputs = ['bucket_name', 'bucket_arn', 'analytics_reader_role_arn', 'uploader_role_arn'];
      expectedOutputs.forEach(output => {
        expect(tapStackContent).toContain(`output "${output}"`);
      });
    });
  });
});