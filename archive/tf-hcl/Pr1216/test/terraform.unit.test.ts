import * as fs from 'fs';
import * as path from 'path';

describe('Terraform Configuration', () => {
  const libPath = path.join(__dirname, '../lib');

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();
  });

  test('All required Terraform files exist', () => {
    const requiredFiles = [
      'provider.tf',
      'variables.tf',
      'main.tf',
      'outputs.tf'
    ];

    requiredFiles.forEach(file => {
      const filePath = path.join(libPath, file);
      expect(fs.existsSync(filePath)).toBe(true);
    });
  });

  test('Variables.tf contains required variables', () => {
    const variablesPath = path.join(libPath, 'variables.tf');
    const content = fs.readFileSync(variablesPath, 'utf-8');

    // Check for required variables
    expect(content).toContain('variable "aws_region"');
    expect(content).toContain('variable "name_prefix"');
    expect(content).toContain('variable "vpc_cidr"');
    expect(content).toContain('variable "public_subnet_cidrs"');
    expect(content).toContain('variable "private_subnet_cidrs"');
  });

  test('Main.tf contains required resources', () => {
    const mainPath = path.join(libPath, 'main.tf');
    const content = fs.readFileSync(mainPath, 'utf-8');

    // Check for VPC resources
    expect(content).toContain('resource "aws_vpc" "this"');
    expect(content).toContain('resource "aws_internet_gateway" "igw"');
    expect(content).toContain('resource "aws_nat_gateway" "nat"');

    // Check for subnets
    expect(content).toContain('resource "aws_subnet" "public"');
    expect(content).toContain('resource "aws_subnet" "private"');

    // Check for security groups
    expect(content).toContain('resource "aws_security_group" "public_sg"');

    // Check for S3 buckets
    expect(content).toContain('resource "aws_s3_bucket" "logs"');
    expect(content).toContain('resource "aws_s3_bucket" "data"');

    // Check for KMS key
    expect(content).toContain('resource "aws_kms_key" "s3"');

    // Check for CloudTrail
    expect(content).toContain('resource "aws_cloudtrail" "this"');

    // Check for AWS Config
    expect(content).toContain('resource "aws_config_configuration_recorder" "this"');
    expect(content).toContain('resource "aws_config_config_rule"');

  });

  test('Security group allows correct ports', () => {
    const mainPath = path.join(libPath, 'main.tf');
    const content = fs.readFileSync(mainPath, 'utf-8');

    // Check for HTTP and HTTPS ingress rules
    expect(content).toMatch(/from_port\s*=\s*80/);
    expect(content).toMatch(/to_port\s*=\s*80/);
    expect(content).toMatch(/from_port\s*=\s*443/);
    expect(content).toMatch(/to_port\s*=\s*443/);
  });

  test('S3 buckets have proper encryption configuration', () => {
    const mainPath = path.join(libPath, 'main.tf');
    const content = fs.readFileSync(mainPath, 'utf-8');

    // Check for server-side encryption
    expect(content).toContain('aws_s3_bucket_server_side_encryption_configuration');
    expect(content).toContain('sse_algorithm     = "aws:kms"');
    expect(content).toContain('sse_algorithm = "AES256"');
  });

  test('S3 buckets have public access blocked', () => {
    const mainPath = path.join(libPath, 'main.tf');
    const content = fs.readFileSync(mainPath, 'utf-8');

    // Check for public access block
    expect(content).toContain('aws_s3_bucket_public_access_block');
    expect(content).toContain('block_public_acls       = true');
    expect(content).toContain('block_public_policy     = true');
    expect(content).toContain('ignore_public_acls      = true');
    expect(content).toContain('restrict_public_buckets = true');
  });

  test('IAM policy includes MFA enforcement', () => {
    const mainPath = path.join(libPath, 'main.tf');
    const content = fs.readFileSync(mainPath, 'utf-8');

    // Check for MFA condition in IAM policy
    expect(content).toContain('aws:MultiFactorAuthPresent');
    expect(content).toContain('DenyWithoutMFA');
  });

  test('Outputs.tf contains required outputs', () => {
    const outputsPath = path.join(libPath, 'outputs.tf');
    const content = fs.readFileSync(outputsPath, 'utf-8');

    // Check for required outputs
    expect(content).toContain('output "vpc_id"');
    expect(content).toContain('output "public_subnet_ids"');
    expect(content).toContain('output "private_subnet_ids"');
    expect(content).toContain('output "s3_logs_bucket"');
    expect(content).toContain('output "s3_data_bucket"');
  });

  test('Default values are properly set', () => {
    const variablesPath = path.join(libPath, 'variables.tf');
    const content = fs.readFileSync(variablesPath, 'utf-8');

    // Check default values
    expect(content).toContain('default     = "us-east-1"');
    expect(content).toContain('default     = "prod-sec"');
    expect(content).toContain('default     = "10.0.0.0/16"');
  });
});

// add more test suites and cases as needed
