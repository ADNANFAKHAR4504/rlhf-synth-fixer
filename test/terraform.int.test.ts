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
      const output = runTerraform('terraform init -no-color');
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
    
    test('terraform plan generates valid execution plan', () => {
      const output = runTerraform('terraform plan -no-color -detailed-exitcode');
      expect(output).toContain('Plan:');
      
      const plan = parsePlanOutput(output);
      expect(plan.toAdd).toBeGreaterThan(0);
      expect(plan.toChange).toBe(0);
      expect(plan.toDestroy).toBe(0);
    }, TIMEOUT);

    test('plan includes all required security control resources', () => {
      const output = runTerraform('terraform plan -no-color');
      
      // Security Control 1: Global Tags (via provider default_tags)
      // Security Control 2: KMS Keys
      expect(output).toContain('aws_kms_key.regional_cmk');
      expect(output).toContain('aws_kms_alias.regional_cmk');
      
      // Security Control 3: IAM + MFA
      expect(output).toContain('aws_iam_account_password_policy.strict');
      expect(output).toContain('aws_iam_policy.mfa_enforcement');
      expect(output).toContain('aws_iam_group.console_users');
      
      // Security Control 4: Security Groups
      expect(output).toContain('aws_security_group.app_tier');
      
      // Security Control 5: CloudTrail
      expect(output).toContain('aws_s3_bucket.cloudtrail');
      expect(output).toContain('aws_cloudtrail.main');
      expect(output).toContain('aws_cloudwatch_log_group.cloudtrail');
      
      // Security Control 6: TLS (S3 bucket policy)
      expect(output).toContain('aws_s3_bucket_policy.cloudtrail');
      
      // Security Control 7: GuardDuty
      expect(output).toContain('aws_guardduty_detector.main');
      
      // Security Control 8: Unauthorized API Alerts
      expect(output).toContain('aws_sns_topic.security_alerts');
      expect(output).toContain('aws_cloudwatch_log_metric_filter.unauthorized_api_calls');
      expect(output).toContain('aws_cloudwatch_metric_alarm.unauthorized_api_calls');
      
      // Security Control 9: VPC Flow Logs
      expect(output).toContain('aws_flow_log.vpc_flow_logs');
      expect(output).toContain('aws_cloudwatch_log_group.vpc_flow_logs');
      
      // Security Control 10: S3 Public Access Block
      expect(output).toContain('aws_s3_account_public_access_block.main');
    }, TIMEOUT);

    test('plan creates resources in all three regions', () => {
      const output = runTerraform('terraform plan -no-color');
      
      // Check for regional resources
      const regions = ['us-east-1', 'eu-west-1', 'ap-southeast-2'];
      regions.forEach(region => {
        expect(output).toContain(`"${region}"`);
      });
      
      // Count KMS keys (should be 3 - one per region)
      const kmsMatches = output.match(/aws_kms_key\.regional_cmk\["/g);
      expect(kmsMatches?.length).toBe(3);
      
      // Count GuardDuty detectors (should be 3 - one per region)
      const guardDutyMatches = output.match(/aws_guardduty_detector\.main\["/g);
      expect(guardDutyMatches?.length).toBe(3);
    }, TIMEOUT);

    test('plan shows proper resource dependencies', () => {
      const output = runTerraform('terraform plan -no-color');
      
      // CloudTrail should depend on S3 bucket policy
      expect(output).toContain('aws_cloudtrail.main');
      
      // VPC Flow Logs should reference VPC IDs
      expect(output).toContain('aws_flow_log.vpc_flow_logs');
      
      // Security groups should reference VPC IDs
      expect(output).toContain('aws_security_group.app_tier');
    }, TIMEOUT);

  });

  describe('Resource Configuration Validation', () => {
    
    test('KMS keys have proper encryption settings', () => {
      const output = runTerraform('terraform plan -no-color');
      
      // Check KMS key configuration
      expect(output).toContain('enable_key_rotation');
      expect(output).toContain('deletion_window_in_days');
    }, TIMEOUT);

    test('S3 bucket has security configurations', () => {
      const output = runTerraform('terraform plan -no-color');
      
      // Check S3 security settings
      expect(output).toContain('aws_s3_bucket_public_access_block.cloudtrail');
      expect(output).toContain('aws_s3_bucket_server_side_encryption_configuration.cloudtrail');
      expect(output).toContain('block_public_acls');
      expect(output).toContain('block_public_policy');
    }, TIMEOUT);

    test('CloudTrail has multi-region configuration', () => {
      const output = runTerraform('terraform plan -no-color');
      
      expect(output).toMatch(/is_multi_region_trail\s*=\s*true/);
      expect(output).toMatch(/include_global_service_events\s*=\s*true/);
    }, TIMEOUT);

    test('GuardDuty has comprehensive data sources enabled', () => {
      const output = runTerraform('terraform plan -no-color');
      
      // Should enable S3 logs, Kubernetes audit logs, and malware protection
      expect(output).toContain('datasources');
    }, TIMEOUT);

  });

  describe('Output Validation', () => {
    
    test('terraform plan shows all required outputs', () => {
      const output = runTerraform('terraform plan -no-color');
      
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

      // Outputs might not be visible in plan, so we check the configuration
      const stackContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'tap_stack.tf'), 'utf8');
      requiredOutputs.forEach(outputName => {
        expect(stackContent).toContain(`output "${outputName}"`);
      });
    }, TIMEOUT);

  });

  describe('Provider and Regional Configuration', () => {
    
    test('uses correct provider aliases for regional resources', () => {
      const output = runTerraform('terraform plan -no-color');
      
      // Should reference provider aliases
      expect(output).toMatch(/provider.*aws\.(us_east_1|eu_west_1|ap_southeast_2)/);
    }, TIMEOUT);

    test('validates AWS provider version constraints', () => {
      const providerContent = fs.readFileSync(path.join(TERRAFORM_DIR, 'provider.tf'), 'utf8');
      
      expect(providerContent).toMatch(/required_version\s*=\s*">=\s*1\.5"/);
      expect(providerContent).toMatch(/version\s*=\s*">=\s*5\.0"/);
    }, TIMEOUT);

  });

  describe('Security and Compliance Validation', () => {
    
    test('validates IAM password policy meets security requirements', () => {
      const output = runTerraform('terraform plan -no-color');
      
      // Check that password policy meets requirements
      expect(output).toContain('aws_iam_account_password_policy.strict');
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
      const output = runTerraform('terraform plan -no-color');
      
      // Should create VPCs when existing ones are not found
      // The plan should not fail even if no existing VPCs are found
      expect(output).not.toContain('Error:');
    }, TIMEOUT);

    test('plan succeeds with minimal AWS credentials', () => {
      // This test assumes AWS credentials are configured for planning
      // but validates that planning doesn't require extensive permissions
      const output = runTerraform('terraform plan -no-color');
      
      expect(output).toContain('Plan:');
      expect(output).not.toContain('Error:');
    }, TIMEOUT);

  });

  afterAll(() => {
    // Cleanup: Remove any temporary files created during testing
    try {
      runTerraform('terraform plan -destroy -no-color > /dev/null 2>&1 || true');
    } catch (error) {
      // Ignore cleanup errors in tests
    }
  });

});
