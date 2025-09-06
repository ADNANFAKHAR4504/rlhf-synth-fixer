import { execSync } from 'child_process';
import { existsSync, readFileSync } from 'fs';
import * as path from 'path';

describe('Terraform Integration Tests', () => {
  const terraformDir = path.join(__dirname, '../lib');
  
  beforeAll(() => {
    // Initialize terraform
    execSync('terraform init', { cwd: terraformDir });
  });

  test('terraform validate passes', () => {
    expect(() => {
      execSync('terraform validate', { cwd: terraformDir });
    }).not.toThrow();
  });

  test('terraform plan succeeds', () => {
    expect(() => {
      execSync('terraform plan -out=tfplan', { cwd: terraformDir });
    }).not.toThrow();
  });

  test('required files exist', () => {
    expect(existsSync(path.join(terraformDir, 'provider.tf'))).toBe(true);
    expect(existsSync(path.join(terraformDir, 'tap_stack.tf'))).toBe(true);
  });

  test('provider.tf contains required elements', () => {
    const content = readFileSync(path.join(terraformDir, 'provider.tf'), 'utf8');
    expect(content).toContain('terraform {');
    expect(content).toContain('required_version');
    expect(content).toContain('aws');
    expect(content).toContain('variable "aws_region"');
    expect(content).toContain('provider "aws"');
  });

  test('tap_stack.tf contains S3 bucket configuration', () => {
    const content = readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
    expect(content).toContain('aws_s3_bucket');
    expect(content).toContain('aws_s3_bucket_server_side_encryption_configuration');
    expect(content).toContain('aws_s3_bucket_versioning');
    expect(content).toContain('aws_s3_bucket_public_access_block');
    expect(content).toContain('aws_s3_bucket_policy');
  });

  test('IAM roles are configured correctly', () => {
    const content = readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
    expect(content).toContain('analytics_reader_role');
    expect(content).toContain('uploader_role');
    expect(content).toContain('aws_iam_instance_profile');
  });

  test('security policies enforce TLS and encryption', () => {
    const content = readFileSync(path.join(terraformDir, 'tap_stack.tf'), 'utf8');
    expect(content).toContain('aws:SecureTransport');
    expect(content).toContain('s3:x-amz-server-side-encryption');
    expect(content).toContain('AES256');
  });
});