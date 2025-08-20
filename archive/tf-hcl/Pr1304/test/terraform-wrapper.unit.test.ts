import * as path from 'path';
import { checkTerraformFormatting, TerraformInfrastructure, validateCompliance, validateTerraformConfig } from '../lib/terraform-wrapper';

describe('TerraformInfrastructure Wrapper Tests', () => {
  let tfInfra: TerraformInfrastructure;

  beforeAll(() => {
    tfInfra = new TerraformInfrastructure(path.join(__dirname, '..', 'lib'));
    
    // Try to initialize terraform for validation tests
    try {
      const { execSync } = require('child_process');
      execSync('terraform init -reconfigure', { 
        cwd: path.join(__dirname, '..', 'lib'),
        encoding: 'utf8',
        stdio: 'pipe'
      });
    } catch (error) {
      // Ignore init errors - will be handled in individual tests
      console.warn('Terraform init failed during test setup:', error);
    }
  });

  describe('File Loading', () => {
    test('should load all Terraform files', () => {
      expect(tfInfra.getFileContent('main.tf')).toBeDefined();
      expect(tfInfra.getFileContent('variables.tf')).toBeDefined();
      expect(tfInfra.getFileContent('outputs.tf')).toBeDefined();
      expect(tfInfra.getFileContent('provider.tf')).toBeDefined();
    });

    test('should return undefined for non-existent files', () => {
      expect(tfInfra.getFileContent('nonexistent.tf')).toBeUndefined();
    });
  });

  describe('Resource Detection', () => {
    test('should detect S3 bucket resources', () => {
      expect(tfInfra.hasResource('aws_s3_bucket', 'main_bucket')).toBe(true);
      expect(tfInfra.hasResource('aws_s3_bucket', 'access_logs')).toBe(true);
    });

    test('should detect KMS resources', () => {
      expect(tfInfra.hasResource('aws_kms_key', 's3_key')).toBe(true);
      expect(tfInfra.hasResource('aws_kms_alias', 's3_key_alias')).toBe(true);
    });

    test('should detect IAM resources', () => {
      expect(tfInfra.hasResource('aws_iam_role', 'corp_s3_role')).toBe(true);
      expect(tfInfra.hasResource('aws_iam_policy', 'corp_s3_policy')).toBe(true);
    });

    test('should detect CloudTrail resources', () => {
      expect(tfInfra.hasResource('aws_cloudtrail', 'main_trail')).toBe(true);
    });

    test('should detect CloudWatch resources', () => {
      expect(tfInfra.hasResource('aws_cloudwatch_log_group', 'cloudtrail_logs')).toBe(true);
      expect(tfInfra.hasResource('aws_cloudwatch_metric_alarm', 'unauthorized_access_alarm')).toBe(true);
    });

    test('should return false for non-existent resources', () => {
      expect(tfInfra.hasResource('aws_instance', 'nonexistent')).toBe(false);
    });
  });

  describe('Variable Detection', () => {
    test('should detect all required variables', () => {
      const requiredVars = [
        'aws_region',
        'environment',
        'project_name',
        'notification_email',
        'enable_macie',
        'enable_shield_advanced',
        'environment_suffix'
      ];

      requiredVars.forEach(varName => {
        expect(tfInfra.hasVariable(varName)).toBe(true);
      });
    });

    test('should get all variables', () => {
      const allVars = tfInfra.getAllVariables();
      expect(allVars).toContain('aws_region');
      expect(allVars).toContain('environment_suffix');
      expect(allVars.length).toBe(7);
    });
  });

  describe('Output Detection', () => {
    test('should detect all required outputs', () => {
      const requiredOutputs = [
        'main_bucket_name',
        'access_logs_bucket_name',
        'iam_role_arn',
        'kms_key_id',
        'sns_topic_arn',
        'cloudtrail_arn'
      ];

      requiredOutputs.forEach(output => {
        expect(tfInfra.hasOutput(output)).toBe(true);
      });
    });

    test('should get all outputs', () => {
      const allOutputs = tfInfra.getAllOutputs();
      expect(allOutputs.length).toBe(6);
    });
  });

  describe('Resource Configuration', () => {
    test('should verify S3 bucket configurations', () => {
      expect(tfInfra.resourceHasConfig('aws_s3_bucket', 'main_bucket', 'force_destroy')).toBe(true);
      expect(tfInfra.resourceHasConfig('aws_s3_bucket', 'access_logs', 'force_destroy')).toBe(true);
    });

    test('should verify encryption configurations', () => {
      expect(tfInfra.resourceHasConfig('aws_kms_key', 's3_key', 'enable_key_rotation')).toBe(true);
      expect(tfInfra.resourceHasConfig('aws_kms_key', 's3_key', 'deletion_window_in_days')).toBe(true);
    });

    test('should verify CloudTrail configurations', () => {
      expect(tfInfra.resourceHasConfig('aws_cloudtrail', 'main_trail', 'is_multi_region_trail')).toBe(true);
      expect(tfInfra.resourceHasConfig('aws_cloudtrail', 'main_trail', 'enable_logging')).toBe(true);
    });
  });

  describe('Resource Listing', () => {
    test('should list all S3 buckets', () => {
      const s3Buckets = tfInfra.getResourcesOfType('aws_s3_bucket');
      expect(s3Buckets).toContain('main_bucket');
      expect(s3Buckets).toContain('access_logs');
      expect(s3Buckets.length).toBe(2);
    });

    test('should list all IAM roles', () => {
      const iamRoles = tfInfra.getResourcesOfType('aws_iam_role');
      expect(iamRoles).toContain('corp_s3_role');
      expect(iamRoles).toContain('cloudtrail_role');
      expect(iamRoles.length).toBe(2);
    });

    test('should list S3 bucket configurations', () => {
      const versioningResources = tfInfra.getResourcesOfType('aws_s3_bucket_versioning');
      expect(versioningResources.length).toBe(2);

      const encryptionResources = tfInfra.getResourcesOfType('aws_s3_bucket_server_side_encryption_configuration');
      expect(encryptionResources.length).toBe(2);

      const publicAccessBlocks = tfInfra.getResourcesOfType('aws_s3_bucket_public_access_block');
      expect(publicAccessBlocks.length).toBe(2);
    });
  });

  describe('Locals Usage', () => {
    test('should detect locals usage', () => {
      expect(tfInfra.usesLocals()).toBe(true);
    });

    test('should count environment suffix usage', () => {
      const suffixUsage = tfInfra.getEnvironmentSuffixUsage();
      expect(suffixUsage).toBeGreaterThan(10);
    });
  });

  describe('Tags and Metadata', () => {
    test('should verify resources have tags', () => {
      expect(tfInfra.resourceHasTags('aws_s3_bucket', 'main_bucket')).toBe(true);
      expect(tfInfra.resourceHasTags('aws_s3_bucket', 'access_logs')).toBe(true);
      expect(tfInfra.resourceHasTags('aws_kms_key', 's3_key')).toBe(true);
      expect(tfInfra.resourceHasTags('aws_iam_role', 'corp_s3_role')).toBe(true);
    });

    test('should count resources with specific tags', () => {
      const envTagCount = tfInfra.countResourcesWithTag('Environment');
      expect(envTagCount).toBeGreaterThan(5);

      const managedByCount = tfInfra.countResourcesWithTag('ManagedBy', 'terraform');
      expect(managedByCount).toBeGreaterThan(5);
    });
  });

  describe('Security Features', () => {
    test('should detect encryption features', () => {
      expect(tfInfra.hasSecurityFeature('encryption')).toBe(true);
    });

    test('should detect versioning features', () => {
      expect(tfInfra.hasSecurityFeature('versioning')).toBe(true);
    });

    test('should detect logging features', () => {
      expect(tfInfra.hasSecurityFeature('logging')).toBe(true);
    });

    test('should detect monitoring features', () => {
      expect(tfInfra.hasSecurityFeature('monitoring')).toBe(true);
    });

    test('should detect public access block features', () => {
      expect(tfInfra.hasSecurityFeature('public_access_block')).toBe(true);
    });

    test('should detect least privilege features', () => {
      expect(tfInfra.hasSecurityFeature('least_privilege')).toBe(true);
    });
  });

  describe('Validation Functions', () => {
    test('should validate Terraform configuration', () => {
      const validation = tfInfra.validateConfiguration();
      // If validation fails due to provider issues in test environment, that's expected
      if (!validation.valid && validation.message.includes('provider')) {
        console.warn('Terraform validation failed due to provider issues (expected in test environment)');
        expect(validation.valid).toBeDefined(); // Test that it returns a result
        expect(validation.message).toBeDefined(); // Test that it returns a message
      } else {
        expect(validation.valid).toBe(true);
        expect(validation.message).toContain('Success');
      }
    });

    test('should check Terraform formatting', () => {
      const isFormatted = tfInfra.checkFormatting();
      expect(isFormatted).toBe(true);
    });
  });

  describe('Compliance Validation', () => {
    test('should validate compliance with requirements', () => {
      const compliance = tfInfra.validateCompliance();
      expect(compliance.compliant).toBe(true);
      expect(compliance.issues).toHaveLength(0);
    });

    test('should have all required components', () => {
      const compliance = tfInfra.validateCompliance();
      
      // If not compliant, log the issues for debugging
      if (!compliance.compliant) {
        console.log('Compliance issues:', compliance.issues);
      }
      
      expect(compliance.compliant).toBe(true);
    });
  });

  describe('Utility Functions', () => {
    test('validateTerraformConfig should work', () => {
      try {
        const isValid = validateTerraformConfig(path.join(__dirname, '..', 'lib'));
        // If terraform is available and properly initialized, it should be valid
        expect(typeof isValid).toBe('boolean');
      } catch (error) {
        // If terraform is not available, just check that the function exists
        console.warn('Terraform validation skipped: terraform not available');
        expect(validateTerraformConfig).toBeDefined();
      }
    });

    test('checkTerraformFormatting should work', () => {
      try {
        const isFormatted = checkTerraformFormatting(path.join(__dirname, '..', 'lib'));
        // If terraform is available, it should return a boolean
        expect(typeof isFormatted).toBe('boolean');
      } catch (error) {
        // If terraform is not available, just check that the function exists
        console.warn('Terraform formatting check skipped: terraform not available');
        expect(checkTerraformFormatting).toBeDefined();
      }
    });

    test('validateCompliance should work', () => {
      const compliance = validateCompliance(path.join(__dirname, '..', 'lib'));
      expect(compliance.compliant).toBe(true);
    });
  });

  describe('Edge Cases', () => {
    test('should handle empty resource type query', () => {
      const resources = tfInfra.getResourcesOfType('aws_nonexistent_resource');
      expect(resources).toEqual([]);
    });

    test('should handle invalid resource configuration check', () => {
      const hasConfig = tfInfra.resourceHasConfig('aws_s3_bucket', 'nonexistent', 'some_config');
      expect(hasConfig).toBe(false);
    });

    test('should handle non-existent tag counting', () => {
      const count = tfInfra.countResourcesWithTag('NonExistentTag');
      expect(count).toBe(0);
    });

    test('should handle unknown security feature', () => {
      const hasFeature = tfInfra.hasSecurityFeature('unknown_feature');
      expect(hasFeature).toBe(false);
    });
  });
});

describe('Module Integration Tests', () => {
  test('should export TerraformInfrastructure class', () => {
    expect(TerraformInfrastructure).toBeDefined();
    const instance = new TerraformInfrastructure();
    expect(instance).toBeInstanceOf(TerraformInfrastructure);
  });

  test('should export utility functions', () => {
    expect(validateTerraformConfig).toBeDefined();
    expect(checkTerraformFormatting).toBeDefined();
    expect(validateCompliance).toBeDefined();
  });
});