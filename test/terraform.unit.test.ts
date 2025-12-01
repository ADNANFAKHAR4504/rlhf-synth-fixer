/**
 * Unit tests for Terraform webhook processing infrastructure
 * Tests validate resource configurations without deployment
 */

import * as fs from 'fs';
import * as path from 'path';

const libPath = path.resolve(__dirname, '..', 'lib');

describe('Terraform Configuration - Provider', () => {
  test('provider.tf should exist', () => {
    expect(fs.existsSync(path.join(libPath, 'provider.tf'))).toBe(true);
  });

  test('should have terraform block with required version', () => {
    const content = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
    expect(content).toContain('terraform {');
    expect(content).toContain('required_version');
    expect(content).toMatch(/required_version\s*=\s*">=\s*1\.\d+\.\d+"/);
  });

  test('should require AWS provider version ~> 6.0', () => {
    const content = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
    expect(content).toContain('source  = "hashicorp/aws"');
    expect(content).toMatch(/version\s*=\s*"~>\s*6\.\d+"/);
  });

  test('should require archive provider for Lambda packaging', () => {
    const content = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
    expect(content).toContain('source  = "hashicorp/archive"');
    expect(content).toContain('version = "~> 2.4"');
  });

  test('should configure S3 backend', () => {
    const content = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
    expect(content).toContain('backend "s3"');
  });

  test('should configure AWS provider with region variable', () => {
    const content = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
    expect(content).toContain('provider "aws"');
    expect(content).toContain('region = var.aws_region');
  });

  test('should include default tags with environment suffix', () => {
    const content = fs.readFileSync(path.join(libPath, 'provider.tf'), 'utf8');
    expect(content).toContain('default_tags');
    expect(content).toContain('Environment = var.environment_suffix');
  });
});

describe('Terraform Configuration - Main', () => {
  test('should have data sources for caller identity and partition', () => {
    const content = fs.readFileSync(path.join(libPath, 'main.tf'), 'utf8');
    expect(content).toContain('data "aws_caller_identity" "current"');
    expect(content).toContain('data "aws_partition" "current"');
  });
});

describe('Terraform Configuration - Variables', () => {
  test('should define required environment_suffix variable', () => {
    const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    expect(content).toContain('variable "environment_suffix"');
    expect(content).toMatch(/type\s*=\s*string/);
  });

  test('should define aws_region variable with us-east-1 default', () => {
    const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    expect(content).toContain('variable "aws_region"');
    expect(content).toContain('default     = "us-east-1"');
  });

  test('should define Lambda configuration variables', () => {
    const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    expect(content).toContain('variable "lambda_runtime"');
    expect(content).toContain('variable "lambda_architecture"');
    expect(content).toContain('variable "lambda_reserved_concurrency"');
  });

  test('should default Lambda architecture to arm64', () => {
    const content = fs.readFileSync(path.join(libPath, 'variables.tf'), 'utf8');
    expect(content).toMatch(/variable\s+"lambda_architecture"[\s\S]*?default\s*=\s*"arm64"/);
  });
});

describe('File Structure', () => {
  test('main.tf should exist', () => {
    expect(fs.existsSync(path.join(libPath, 'main.tf'))).toBe(true);
  });

  test('variables.tf should exist', () => {
    expect(fs.existsSync(path.join(libPath, 'variables.tf'))).toBe(true);
  });

  test('outputs.tf should exist', () => {
    expect(fs.existsSync(path.join(libPath, 'outputs.tf'))).toBe(true);
  });
});

