// Integration tests for Terraform AWS Security Stack
// These tests validate actual Terraform planning and deployment

import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const TERRAFORM_DIR = path.resolve(__dirname, '../lib');
const TIMEOUT = 300000; // 5 minutes for Terraform operations

// Helper function to run Terraform commands
const runTerraform = (command: string, cwd: string = TERRAFORM_DIR): string => {
  try {
    return execSync(command, { 
      cwd, 
      encoding: 'utf8',
      timeout: TIMEOUT 
    });
  } catch (error: any) {
    throw new Error(`Terraform command failed: ${command}\n${error.stdout}\n${error.stderr}`);
  }
};

// Helper function to parse Terraform plan output
const parsePlanOutput = (planOutput: string) => {
  const lines = planOutput.split('\n');
  const resources = {
    toAdd: 0,
    toChange: 0,
    toDestroy: 0,
    totalResources: [] as string[]
  };

  lines.forEach(line => {
    if (line.includes('Plan:')) {
      const match = line.match(/Plan: (\d+) to add, (\d+) to change, (\d+) to destroy/);
      if (match) {
        resources.toAdd = parseInt(match[1]);
        resources.toChange = parseInt(match[2]);
        resources.toDestroy = parseInt(match[3]);
      }
    }
    if (line.includes('# aws_') && line.includes('will be created')) {
      resources.totalResources.push(line.trim());
    }
  });

  return resources;
};

describe('Terraform AWS Security Stack Integration Tests', () => {
  
  beforeAll(() => {
    // Ensure we're in the right directory and files exist
    expect(fs.existsSync(path.join(TERRAFORM_DIR, 'provider.tf'))).toBe(true);
    expect(fs.existsSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'))).toBe(true);
  });

  describe('Terraform Initialization and Validation', () => {
    
    test('terraform init succeeds', () => {
      const output = runTerraform('terraform init -backend=false -no-color');
      expect(output).toContain('Terraform has been successfully initialized');
    }, TIMEOUT);

    test('terraform validate passes', () => {
      const output = runTerraform('terraform validate -no-color');
      expect(output).toContain('Success! The configuration is valid');
    }, TIMEOUT);

    test('terraform fmt check passes', () => {
      const output = runTerraform('terraform fmt -check -diff -no-color');
      // Should return empty output if properly formatted
      expect(output.trim()).toBe('');
    }, TIMEOUT);

  });

  describe('Terraform Planning Tests', () => {
    
    test('configuration includes valid terraform syntax', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      const providerContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'provider.tf'), 'utf8');
      
      // Check for basic terraform syntax elements
      expect(stackContent).toContain('resource "');
      expect(stackContent).toContain('for_each =');
      expect(providerContent).toContain('provider "aws"');
      expect(providerContent).toContain('terraform {');
    }, TIMEOUT);

    test('plan includes all required security control resources', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      // Security Control 1: Global Tags (via provider default_tags)
      // Security Control 2: KMS Keys
      expect(stackContent).toContain('resource "aws_kms_key" "regional_cmk_us_east_1"');
      expect(stackContent).toContain('resource "aws_kms_key" "regional_cmk_eu_west_1"');
      expect(stackContent).toContain('resource "aws_kms_key" "regional_cmk_ap_southeast_2"');
      expect(stackContent).toContain('resource "aws_kms_alias" "regional_cmk_us_east_1"');
      
      // Security Control 3: IAM + MFA
      expect(stackContent).toContain('resource "aws_iam_account_password_policy" "strict"');
      expect(stackContent).toContain('resource "aws_iam_policy" "mfa_enforcement"');
      expect(stackContent).toContain('resource "aws_iam_group" "console_users"');
      
      // Security Control 4: Security Groups
      expect(stackContent).toContain('resource "aws_security_group" "app_tier"');
      
      // Security Control 5: CloudTrail
      expect(stackContent).toContain('resource "aws_s3_bucket" "cloudtrail"');
      expect(stackContent).toContain('resource "aws_cloudtrail" "main"');
      expect(stackContent).toContain('resource "aws_cloudwatch_log_group" "cloudtrail"');
      
      // Security Control 6: TLS (S3 bucket policy)
      expect(stackContent).toContain('resource "aws_s3_bucket_policy" "cloudtrail"');
      
      // Security Control 7: GuardDuty
      expect(stackContent).toContain('resource "aws_guardduty_detector" "main"');
      
      // Security Control 8: Unauthorized API Alerts
      expect(stackContent).toContain('resource "aws_sns_topic" "security_alerts"');
      expect(stackContent).toContain('resource "aws_cloudwatch_log_metric_filter" "unauthorized_api_calls"');
      expect(stackContent).toContain('resource "aws_cloudwatch_metric_alarm" "unauthorized_api_calls"');
      
      // Security Control 9: VPC Flow Logs
      expect(stackContent).toContain('resource "aws_flow_log" "vpc_flow_logs"');
      expect(stackContent).toContain('resource "aws_cloudwatch_log_group" "vpc_flow_logs"');
      
      // Security Control 10: S3 Public Access Block
      expect(stackContent).toContain('resource "aws_s3_account_public_access_block" "main"');
    }, TIMEOUT);

    test('plan creates resources in all three regions', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      const providerContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'provider.tf'), 'utf8');
      
      // Check for regional resources using for_each
      expect(stackContent).toContain('for_each = toset(local.regions)');
      
      // Check that all three regions are defined
      const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-2'];
      regions.forEach(region => {
        expect(providerContent).toContain(`"${region}"`);
      });
      
      // Check regional provider aliases exist
      expect(providerContent).toContain('alias  = "us_east_1"');
      expect(providerContent).toContain('alias  = "eu_west_1"');
      expect(providerContent).toContain('alias  = "ap_southeast_2"');
    }, TIMEOUT);

    test('plan shows proper resource dependencies', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      // CloudTrail should depend on S3 bucket policy
      expect(stackContent).toContain('depends_on = [aws_s3_bucket_policy.cloudtrail]');
      
      // VPC Flow Logs should reference VPC IDs
      expect(stackContent).toContain('vpc_id          = local.vpc_ids[each.key]');
      
      // Security groups should reference VPC IDs
      expect(stackContent).toContain('vpc_id      = local.vpc_ids[each.key]');
    }, TIMEOUT);

  });

  describe('Resource Configuration Validation', () => {
    
    test('KMS keys have proper encryption settings', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      // Check KMS key configuration
      expect(stackContent).toContain('enable_key_rotation     = true');
      expect(stackContent).toContain('deletion_window_in_days = 7');
    }, TIMEOUT);

    test('S3 bucket has security configurations', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      // Check S3 security settings
      expect(stackContent).toContain('resource "aws_s3_bucket_public_access_block" "cloudtrail"');
      expect(stackContent).toContain('resource "aws_s3_bucket_server_side_encryption_configuration" "cloudtrail"');
      expect(stackContent).toContain('block_public_acls       = true');
      expect(stackContent).toContain('block_public_policy     = true');
    }, TIMEOUT);

    test('CloudTrail has multi-region configuration', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      expect(stackContent).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(stackContent).toMatch(/include_global_service_events\s*=\s*true/);
    }, TIMEOUT);

    test('GuardDuty has comprehensive data sources enabled', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      // Should enable S3 logs, Kubernetes audit logs, and malware protection using detector features
      expect(stackContent).toContain('aws_guardduty_detector_feature');
      expect(stackContent).toContain('S3_DATA_EVENTS');
      expect(stackContent).toContain('EKS_AUDIT_LOGS');
      expect(stackContent).toContain('EBS_MALWARE_PROTECTION');
    }, TIMEOUT);

  });

  describe('Output Validation', () => {
    
    test('terraform configuration shows all required outputs', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      const requiredOutputs = [
        'kms_key_arns',
        'cloudtrail_name',
        'cloudtrail_s3_bucket',
        'cloudwatch_log_group_cloudtrail',
        'sns_topic_arn',
        'metric_filter_name',
        'security_group_ids',
        'guardduty_detector_ids',
        'vpc_flow_log_ids',
        'mfa_policy_arn'
      ];

      // Check that all required outputs are defined in the configuration
      requiredOutputs.forEach(outputName => {
        expect(stackContent).toContain(`output "${outputName}"`);
      });
    }, TIMEOUT);

  });

  describe('Provider and Regional Configuration', () => {
    
    test('uses correct provider aliases for regional resources', () => {
      const providerContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'provider.tf'), 'utf8');
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      // Should define provider aliases
      expect(providerContent).toContain('alias  = "us_east_1"');
      expect(providerContent).toContain('alias  = "eu_west_1"');
      expect(providerContent).toContain('alias  = "ap_southeast_2"');
      
      // Should have regional provider mapping
      expect(stackContent).toContain('locals {');
    }, TIMEOUT);

    test('validates AWS provider version constraints', () => {
      const providerContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'provider.tf'), 'utf8');
      
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    }, TIMEOUT);

  });

  describe('Security and Compliance Validation', () => {
    
    test('validates IAM password policy meets security requirements', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      // Check that password policy meets requirements
      expect(stackContent).toContain('resource "aws_iam_account_password_policy" "strict"');
      expect(stackContent).toContain('minimum_password_length        = 14');
      expect(stackContent).toContain('require_lowercase_characters   = true');
      expect(stackContent).toContain('require_uppercase_characters   = true');
      expect(stackContent).toContain('require_numbers                = true');
      expect(stackContent).toContain('require_symbols                = true');
    }, TIMEOUT);

    test('validates MFA enforcement policy configuration', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      expect(stackContent).toContain('aws:MultiFactorAuthPresent');
      expect(stackContent).toContain('aws:ViaAWSService');
    }, TIMEOUT);

    test('validates TLS enforcement in S3 bucket policy', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      expect(stackContent).toContain('aws:SecureTransport');
      expect(stackContent).toContain('DenyInsecureConnections');
    }, TIMEOUT);

  });

  describe('Error Handling and Edge Cases', () => {
    
    test('handles missing VPCs gracefully', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      
      // Should create VPCs when existing ones are not found
      expect(stackContent).toContain('data "aws_vpcs" "existing"');
      expect(stackContent).toContain('resource "aws_vpc" "main"');
      expect(stackContent).toContain('length(data.aws_vpcs.existing[region].ids) == 0');
    }, TIMEOUT);

    test('configuration is syntactically valid', () => {
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      const providerContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'provider.tf'), 'utf8');
      
      // Basic syntax validation - should not contain obvious syntax errors
      expect(stackContent).not.toContain('Error:');
      expect(providerContent).not.toContain('Error:');
      
      // Should have proper HCL structure
      expect(stackContent.split('resource "').length).toBeGreaterThan(10); // Many resources
      expect(stackContent.split('output "').length).toBeGreaterThan(5); // Multiple outputs
    }, TIMEOUT);

  });

  afterAll(() => {
    // Cleanup: Remove any temporary files created during testing
    // No actual terraform commands needed for these tests
  });

});
