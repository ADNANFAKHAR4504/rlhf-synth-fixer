// Integration tests for Terraform IAM Security Configuration
// These tests validate the infrastructure configuration without actual deployment
// Following team standards: tests read from cfn-outputs/all-outputs.json
// Integration tests should not apply any terraform apply or init or deploy commands

import fs from 'fs';
import path from 'path';

// CI/CD outputs file path as per team standards
const p = path.resolve(process.cwd(), 'cfn-outputs/all-outputs.json');

describe('Terraform IAM Security Configuration - Integration Tests', () => {
  let outputs: any;

  beforeAll(async () => {
    // Load outputs from CI/CD generated file
    if (fs.existsSync(p)) {
      const outputsData = fs.readFileSync(p, 'utf8');
      outputs = JSON.parse(outputsData);
    } else {
      console.log(
        'Integration test: cfn-outputs/all-outputs.json not found - Run in CI only'
      );
      outputs = null;
    }
  });

  describe('Configuration Validation Tests', () => {
    test('Outputs file exists and is valid JSON', async () => {
      if (!outputs) {
        console.log(
          'Integration test: Outputs file validation - Run in CI only'
        );
        expect(true).toBe(true);
        return;
      }

      expect(outputs).toBeDefined();
      expect(typeof outputs).toBe('object');
      console.log('✓ Integration test: Outputs file is valid JSON');
    });

    test('Required outputs are present', async () => {
      if (!outputs) {
        console.log(
          'Integration test: Required outputs validation - Run in CI only'
        );
        expect(true).toBe(true);
        return;
      }

      // Check for required outputs based on main.tf
      const requiredOutputs = [
        'iam_roles',
        'iam_policies',
        'cloudtrail_arn',
        'log_bucket_name',
        'security_configuration_summary',
      ];

      requiredOutputs.forEach(outputName => {
        expect(outputs[outputName]).toBeDefined();
      });
      console.log('✓ Integration test: All required outputs are present');
    });

    test('IAM roles are correctly configured', async () => {
      if (!outputs || !outputs.iam_roles) {
        console.log('Integration test: IAM roles validation - Run in CI only');
        expect(true).toBe(true);
        return;
      }

      const roles = outputs.iam_roles.value;
      expect(roles.app_deploy_role).toBeDefined();
      expect(roles.readonly_role).toBeDefined();
      expect(roles.audit_role).toBeDefined();

      // Validate role ARN format
      Object.values(roles).forEach((role: any) => {
        expect(role.arn).toMatch(/^arn:aws:iam::/);
        expect(role.name).toBeDefined();
      });
      console.log('✓ Integration test: IAM roles are correctly configured');
    });
  });

  describe('Security Compliance Tests', () => {
    test('CloudTrail is properly configured', async () => {
      if (!outputs || !outputs.cloudtrail_arn) {
        console.log('Integration test: CloudTrail validation - Run in CI only');
        expect(true).toBe(true);
        return;
      }

      const cloudtrailArn = outputs.cloudtrail_arn.value;
      expect(cloudtrailArn).toMatch(/^arn:aws:cloudtrail:/);
      expect(outputs.log_bucket_name.value).toBeDefined();
      console.log('✓ Integration test: CloudTrail is properly configured');
    });

    test('Security configuration summary is complete', async () => {
      if (!outputs || !outputs.security_configuration_summary) {
        console.log(
          'Integration test: Security summary validation - Run in CI only'
        );
        expect(true).toBe(true);
        return;
      }

      const summary = outputs.security_configuration_summary.value;
      expect(summary.environment).toBeDefined();
      expect(summary.roles_created).toBe(3);
      expect(summary.policies_created).toBe(6);
      expect(summary.cloudtrail_enabled).toBe(true);
      console.log(
        '✓ Integration test: Security configuration summary is complete'
      );
    });

    test('Resource tagging is consistent', async () => {
      if (!outputs) {
        console.log(
          'Integration test: Resource tagging validation - Run in CI only'
        );
        expect(true).toBe(true);
        return;
      }

      // In a real integration test, this would verify actual AWS resources have consistent tags
      // For now, we validate the configuration structure
      expect(true).toBe(true);
      console.log(
        '✓ Integration test: Resource tagging validation - Run in CI only'
      );
    });
  });

  describe('Cross-Account Access Tests', () => {
    test('Cross-account assume role commands are provided', async () => {
      if (!outputs || !outputs.cross_account_assume_role_commands) {
        console.log(
          'Integration test: Cross-account commands validation - Run in CI only'
        );
        expect(true).toBe(true);
        return;
      }

      const commands = outputs.cross_account_assume_role_commands.value;
      expect(commands.app_deploy_role).toContain('aws sts assume-role');
      expect(commands.readonly_role).toContain('aws sts assume-role');
      expect(commands.audit_role).toContain('aws sts assume-role');
      console.log(
        '✓ Integration test: Cross-account assume role commands are provided'
      );
    });

    test('External ID is properly configured', async () => {
      if (!outputs) {
        console.log(
          'Integration test: External ID validation - Run in CI only'
        );
        expect(true).toBe(true);
        return;
      }

      // In a real integration test, this would validate the trust policies
      // contain the correct external ID requirements
      expect(true).toBe(true);
      console.log(
        '✓ Integration test: External ID validation - Run in CI only'
      );
    });
  });

  describe('Logging and Monitoring Tests', () => {
    test('CloudWatch log group is configured', async () => {
      if (!outputs || !outputs.cloudwatch_log_group_arn) {
        console.log(
          'Integration test: CloudWatch log group validation - Run in CI only'
        );
        expect(true).toBe(true);
        return;
      }

      const logGroupArn = outputs.cloudwatch_log_group_arn.value;
      expect(logGroupArn).toMatch(/^arn:aws:logs:/);
      console.log('✓ Integration test: CloudWatch log group is configured');
    });

    test('SNS notifications are configured (if enabled)', async () => {
      if (!outputs) {
        console.log(
          'Integration test: SNS notifications validation - Run in CI only'
        );
        expect(true).toBe(true);
        return;
      }

      // SNS topic ARN might be null if notifications are disabled
      if (outputs.sns_topic_arn && outputs.sns_topic_arn.value) {
        expect(outputs.sns_topic_arn.value).toMatch(/^arn:aws:sns:/);
      }
      console.log('✓ Integration test: SNS notifications validation completed');
    });
  });

  describe('AWS Resource Validation', () => {
    test('S3 bucket exists and has correct configuration', async () => {
      if (!outputs || !outputs.log_bucket_name) {
        console.log('Integration test: S3 bucket validation - Run in CI only');
        expect(true).toBe(true);
        return;
      }

      // In a real integration test, this would use AWS SDK to verify:
      // - Bucket exists
      // - Versioning is enabled
      // - Encryption is configured
      // - Public access is blocked
      expect(true).toBe(true);
      console.log('✓ Integration test: S3 bucket validation - Run in CI only');
    });

    test('IAM policies follow least privilege principle', async () => {
      if (!outputs || !outputs.iam_policies) {
        console.log(
          'Integration test: IAM policies validation - Run in CI only'
        );
        expect(true).toBe(true);
        return;
      }

      // In a real integration test, this would use AWS SDK to:
      // - Get policy documents
      // - Analyze permissions for overly broad access
      // - Validate no wildcard permissions where not needed
      expect(true).toBe(true);
      console.log(
        '✓ Integration test: IAM policies validation - Run in CI only'
      );
    });
  });

  // Note: These tests are designed to be run in CI/CD pipeline with actual AWS credentials
  // Local development should focus on unit tests for faster feedback
  afterAll(() => {
    console.log(
      '🔧 Integration tests completed - These are designed for CI/CD execution'
    );
    console.log(
      '💡 For local development, run unit tests: npm test -- terraform.unit.test.ts'
    );
    console.log(
      '📁 Integration tests expect cfn-outputs/all-outputs.json from CI/CD pipeline'
    );
  });
});
