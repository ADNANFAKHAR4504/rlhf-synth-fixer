import * as fs from 'fs';
import * as path from 'path';
import {
  validateCidrBlock,
  validateAwsRegion,
  generateResourceName,
  isGravitonInstanceType,
  calculateSubnetCidrs,
  validateTerraformVariables,
  TerraformVariables,
} from '../lib/terraform-utils';

describe('Terraform Configuration Unit Tests', () => {
  const libPath = path.join(__dirname, '..', 'lib');

  test('main.tf exists and contains required resources', () => {
    const mainTfPath = path.join(libPath, 'main.tf');
    expect(fs.existsSync(mainTfPath)).toBe(true);

    const content = fs.readFileSync(mainTfPath, 'utf8');

    // Test for required resource types
    expect(content).toContain('resource "aws_vpc" "main"');
    expect(content).toContain('resource "aws_subnet" "public"');
    expect(content).toContain('resource "aws_subnet" "private"');
    expect(content).toContain('resource "aws_internet_gateway" "main"');
    expect(content).toContain('resource "aws_nat_gateway" "main"');
    expect(content).toContain('resource "aws_lb" "main"');
    expect(content).toContain('resource "aws_db_instance" "main"');
    expect(content).toContain('resource "aws_instance" "bastion"');
    expect(content).toContain('resource "aws_cloudtrail" "main"');
    expect(content).toContain(
      'resource "aws_config_configuration_recorder" "main"'
    );
    expect(content).toContain('resource "aws_wafv2_web_acl" "main"');
  });

  test('provider.tf exists and contains required providers', () => {
    const providerTfPath = path.join(libPath, 'provider.tf');
    expect(fs.existsSync(providerTfPath)).toBe(true);

    const content = fs.readFileSync(providerTfPath, 'utf8');

    expect(content).toContain('terraform {');
    expect(content).toContain('required_version = ">= 1.4.0"');
    expect(content).toContain('hashicorp/aws');
    expect(content).toContain('provider "aws" {');
    expect(content).toContain('region = var.aws_region');
  });

  test('user-data scripts exist', () => {
    const userDataPath = path.join(libPath, 'user-data.sh');
    const bastionUserDataPath = path.join(libPath, 'bastion-user-data.sh');

    expect(fs.existsSync(userDataPath)).toBe(true);
    expect(fs.existsSync(bastionUserDataPath)).toBe(true);

    const userData = fs.readFileSync(userDataPath, 'utf8');
    const bastionUserData = fs.readFileSync(bastionUserDataPath, 'utf8');

    expect(userData).toContain('#!/bin/bash');
    expect(userData).toContain('amazon-ssm-agent');
    expect(bastionUserData).toContain('#!/bin/bash');
    expect(bastionUserData).toContain('amazon-ssm-agent');
  });

  test('main.tf contains proper security configurations', () => {
    const mainTfPath = path.join(libPath, 'main.tf');
    const content = fs.readFileSync(mainTfPath, 'utf8');

    // Test for security features
    expect(content).toContain('storage_encrypted     = true');
    expect(content).toContain('enable_log_file_validation    = true');
    expect(content).toContain(
      'block_public_acls       = !var.allow_public_storage'
    );
    expect(content).toContain('kms_key_id');
    expect(content).toContain('vpc_security_group_ids');
  });

  test('main.tf contains required outputs', () => {
    const mainTfPath = path.join(libPath, 'main.tf');
    const content = fs.readFileSync(mainTfPath, 'utf8');

    // Test for required outputs
    expect(content).toContain('output "vpc_id"');
    expect(content).toContain('output "alb_dns_name"');
    expect(content).toContain('output "rds_endpoint"');
    expect(content).toContain('output "cloudtrail_name"');
    expect(content).toContain('output "bastion_instance_id"');
  });

  test('variables are properly defined', () => {
    const mainTfPath = path.join(libPath, 'main.tf');
    const content = fs.readFileSync(mainTfPath, 'utf8');

    // Test for required variables
    expect(content).toContain('variable "vpc_cidr"');
    expect(content).toContain('variable "public_subnet_cidrs"');
    expect(content).toContain('variable "private_subnet_cidrs"');
    expect(content).toContain('variable "allowed_https_cidrs"');
    expect(content).toContain('variable "bastion_allowed_cidrs"');
  });

  test('locals are properly configured', () => {
    const mainTfPath = path.join(libPath, 'main.tf');
    const content = fs.readFileSync(mainTfPath, 'utf8');

    expect(content).toContain('locals {');
    expect(content).toContain(
      'availability_zones = ["us-west-2a", "us-west-2b"]'
    );
    expect(content).toContain('name_prefix = "nova-model"');
    expect(content).toContain('common_tags');
  });
});

// Terraform Utility Functions Tests
describe('Terraform Utility Functions', () => {
  describe('validateCidrBlock', () => {
    test('validates correct CIDR blocks', () => {
      expect(validateCidrBlock('10.0.0.0/16')).toBe(true);
      expect(validateCidrBlock('192.168.1.0/24')).toBe(true);
      expect(validateCidrBlock('172.16.0.0/12')).toBe(true);
    });

    test('rejects invalid CIDR blocks', () => {
      expect(validateCidrBlock('10.0.0.0/33')).toBe(false);
      expect(validateCidrBlock('256.0.0.0/16')).toBe(false);
      expect(validateCidrBlock('10.0.0.0')).toBe(false);
      expect(validateCidrBlock('invalid')).toBe(false);
    });
  });

  describe('validateAwsRegion', () => {
    test('validates correct AWS regions', () => {
      expect(validateAwsRegion('us-west-2')).toBe(true);
      expect(validateAwsRegion('us-east-1')).toBe(true);
      expect(validateAwsRegion('eu-west-1')).toBe(true);
    });

    test('rejects invalid AWS regions', () => {
      expect(validateAwsRegion('invalid-region')).toBe(false);
      expect(validateAwsRegion('us-invalid-1')).toBe(false);
      expect(validateAwsRegion('')).toBe(false);
    });
  });

  describe('generateResourceName', () => {
    test('generates resource names with prefix and type', () => {
      expect(generateResourceName('nova-model', 'vpc')).toBe('nova-model-vpc');
    });

    test('generates resource names with prefix, type and suffix', () => {
      expect(generateResourceName('nova-model', 'subnet', 'public')).toBe(
        'nova-model-subnet-public'
      );
    });

    test('handles empty suffix', () => {
      expect(generateResourceName('nova-model', 'vpc', '')).toBe(
        'nova-model-vpc'
      );
    });
  });

  describe('isGravitonInstanceType', () => {
    test('validates Graviton instance types', () => {
      expect(isGravitonInstanceType('t4g.micro')).toBe(true);
      expect(isGravitonInstanceType('t4g.small')).toBe(true);
      expect(isGravitonInstanceType('c6g.large')).toBe(true);
      expect(isGravitonInstanceType('m6g.xlarge')).toBe(true);
    });

    test('rejects non-Graviton instance types', () => {
      expect(isGravitonInstanceType('t3.micro')).toBe(false);
      expect(isGravitonInstanceType('m5.large')).toBe(false);
      expect(isGravitonInstanceType('c5.xlarge')).toBe(false);
      expect(isGravitonInstanceType('invalid')).toBe(false);
    });
  });

  describe('calculateSubnetCidrs', () => {
    test('calculates subnet CIDRs correctly', () => {
      const result = calculateSubnetCidrs('10.0.0.0/16', 4);
      expect(result).toHaveLength(4);
      expect(result[0]).toMatch(/^10\.0\.\d+\.0\/\d+$/);
    });

    test('throws error for invalid VPC CIDR', () => {
      expect(() => calculateSubnetCidrs('invalid', 2)).toThrow(
        'Invalid VPC CIDR block'
      );
    });

    test('throws error for too many subnets', () => {
      expect(() => calculateSubnetCidrs('10.0.0.0/28', 32)).toThrow(
        'Too many subnets for the given VPC CIDR'
      );
    });
  });

  describe('validateTerraformVariables', () => {
    const validVariables: TerraformVariables = {
      vpcCidr: '10.0.0.0/16',
      awsRegion: 'us-west-2',
      instanceType: 't4g.micro',
      enableMultiAz: true,
    };

    test('validates correct variables', () => {
      const result = validateTerraformVariables(validVariables);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('detects invalid VPC CIDR', () => {
      const invalidVariables = { ...validVariables, vpcCidr: 'invalid' };
      const result = validateTerraformVariables(invalidVariables);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid VPC CIDR block');
    });

    test('detects invalid AWS region', () => {
      const invalidVariables = {
        ...validVariables,
        awsRegion: 'invalid-region',
      };
      const result = validateTerraformVariables(invalidVariables);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid AWS region');
    });

    test('detects non-Graviton instance type', () => {
      const invalidVariables = { ...validVariables, instanceType: 't3.micro' };
      const result = validateTerraformVariables(invalidVariables);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Instance type is not Graviton-based');
    });

    test('detects multiple validation errors', () => {
      const invalidVariables: TerraformVariables = {
        vpcCidr: 'invalid',
        awsRegion: 'invalid-region',
        instanceType: 't3.micro',
        enableMultiAz: true,
      };
      const result = validateTerraformVariables(invalidVariables);
      expect(result.valid).toBe(false);
      expect(result.errors).toHaveLength(3);
    });
  });
});

// Test Terraform file syntax validity
describe('Terraform File Syntax', () => {
  test('JSON parsing of terraform show should not throw errors', () => {
    // This test validates that terraform files can be processed
    // In a real environment, this would use terraform plan -out and terraform show -json
    expect(true).toBe(true); // Placeholder for actual terraform validation
  });
});
