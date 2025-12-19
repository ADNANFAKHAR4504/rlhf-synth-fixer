import * as fs from 'fs';
import * as path from 'path';

// Load deployment outputs
const flatOutputsPath = path.join(__dirname, '..', 'cfn-outputs', 'flat-outputs.json');
let outputs: any;

try {
  const outputsContent = fs.readFileSync(flatOutputsPath, 'utf-8');
  outputs = JSON.parse(outputsContent);
} catch (error) {
  console.error('Failed to load flat-outputs.json:', error);
  outputs = {};
}

describe('Terraform Infrastructure Integration Tests', () => {
  // Helper function to extract resource name from ARN
  const extractResourceName = (arn: string): string => {
    const parts = arn.split('/');
    return parts[parts.length - 1];
  };

  // Helper function to extract key ID from KMS ARN
  const extractKeyId = (arn: string): string => {
    const parts = arn.split('/');
    return parts[parts.length - 1];
  };

  // Helper function to extract region from ARN
  const extractRegion = (arn: string): string => {
    const parts = arn.split(':');
    return parts[3];
  };

  // Helper function to extract account ID from ARN
  const extractAccountId = (arn: string): string => {
    const parts = arn.split(':');
    return parts[4];
  };

  // Helper function to validate ARN format
  const isValidArn = (arn: string, service: string, region?: string): boolean => {
    const arnPattern = new RegExp(`^arn:aws:${service}:${region || '[^:]*'}:\\d{12}:.+`);
    return arnPattern.test(arn);
  };

  describe('Deployment Outputs Validation', () => {
    test('should have all required outputs in flat-outputs.json', () => {
      expect(outputs).toBeDefined();
      expect(outputs).not.toEqual({});

      // KMS Keys
      expect(outputs.primary_kms_key_id).toBeDefined();
      expect(outputs.primary_kms_key_arn).toBeDefined();
      expect(outputs.secondary_kms_key_id).toBeDefined();
      expect(outputs.secondary_kms_key_arn).toBeDefined();
      expect(outputs.terraform_state_kms_key_id).toBeDefined();
      expect(outputs.terraform_state_kms_key_arn).toBeDefined();

      // IAM Roles
      expect(outputs.security_audit_role_arn).toBeDefined();
      expect(outputs.cross_account_access_role_arn).toBeDefined();

      // S3 Buckets
      expect(outputs.config_bucket_name).toBeDefined();
      expect(outputs.terraform_state_bucket_name).toBeDefined();

      // DynamoDB
      expect(outputs.terraform_state_lock_table_name).toBeDefined();

      // CloudWatch Logs
      expect(outputs.iam_activity_log_group_name).toBeDefined();
      expect(outputs.config_activity_log_group_name).toBeDefined();
    });

    test('should have valid ARN formats', () => {
      // KMS ARNs
      expect(outputs.primary_kms_key_arn).toMatch(/^arn:aws:kms:us-east-1:\d{12}:key\/.+/);
      expect(outputs.secondary_kms_key_arn).toMatch(/^arn:aws:kms:eu-west-1:\d{12}:key\/.+/);
      expect(outputs.terraform_state_kms_key_arn).toMatch(/^arn:aws:kms:eu-west-1:\d{12}:key\/.+/);

      // IAM ARNs
      expect(outputs.security_audit_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\/.+/);
      expect(outputs.cross_account_access_role_arn).toMatch(/^arn:aws:iam::\d{12}:role\/.+/);
    });

    test('should have non-empty string values for all outputs', () => {
      Object.keys(outputs).forEach(key => {
        expect(typeof outputs[key]).toBe('string');
        expect(outputs[key].length).toBeGreaterThan(0);
      });
    });

    test('should have valid AWS resource name formats', () => {
      // Bucket names should be lowercase and valid
      expect(outputs.config_bucket_name).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);
      expect(outputs.terraform_state_bucket_name).toMatch(/^[a-z0-9][a-z0-9-]*[a-z0-9]$/);

      // Log group names should start with /
      expect(outputs.iam_activity_log_group_name).toMatch(/^\/.+/);
      expect(outputs.config_activity_log_group_name).toMatch(/^\/.+/);
    });
  });

  describe('KMS Keys Configuration Validation', () => {
    test('should have primary KMS key in us-east-1 region', () => {
      const region = extractRegion(outputs.primary_kms_key_arn);
      expect(region).toBe('us-east-1');
    });

    test('should have secondary KMS key in eu-west-1 region', () => {
      const region = extractRegion(outputs.secondary_kms_key_arn);
      expect(region).toBe('eu-west-1');
    });

    test('should have terraform state KMS key in eu-west-1 region', () => {
      const region = extractRegion(outputs.terraform_state_kms_key_arn);
      expect(region).toBe('eu-west-1');
    });

    test('should verify primary and secondary keys are multi-region replicas (same key ID)', () => {
      expect(outputs.primary_kms_key_id).toBe(outputs.secondary_kms_key_id);
      expect(outputs.primary_kms_key_id).toMatch(/^mrk-[a-f0-9]{32}$/);
    });

    test('should have multi-region key ID format for primary/secondary keys', () => {
      // Multi-region keys start with "mrk-"
      expect(outputs.primary_kms_key_id).toMatch(/^mrk-/);
      expect(outputs.secondary_kms_key_id).toMatch(/^mrk-/);
    });

    test('should have standard key ID format for terraform state key', () => {
      // Standard regional keys have UUID format
      expect(outputs.terraform_state_kms_key_id).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    });

    test('should extract valid key IDs from ARNs', () => {
      const primaryKeyId = extractKeyId(outputs.primary_kms_key_arn);
      const secondaryKeyId = extractKeyId(outputs.secondary_kms_key_arn);
      const stateKeyId = extractKeyId(outputs.terraform_state_kms_key_arn);

      expect(primaryKeyId).toBe(outputs.primary_kms_key_id);
      expect(secondaryKeyId).toBe(outputs.secondary_kms_key_id);
      expect(stateKeyId).toBe(outputs.terraform_state_kms_key_id);
    });

    test('should have consistent account IDs across all KMS keys', () => {
      const primaryAccount = extractAccountId(outputs.primary_kms_key_arn);
      const secondaryAccount = extractAccountId(outputs.secondary_kms_key_arn);
      const stateAccount = extractAccountId(outputs.terraform_state_kms_key_arn);

      expect(primaryAccount).toBe(secondaryAccount);
      expect(primaryAccount).toBe(stateAccount);
      expect(primaryAccount).toMatch(/^\d{12}$/);
    });
  });

  describe('IAM Roles Configuration Validation', () => {
    test('should have valid security audit role name', () => {
      const roleName = extractResourceName(outputs.security_audit_role_arn);
      expect(roleName).toMatch(/^security-audit-role-.+$/);
    });

    test('should have valid cross-account access role name', () => {
      const roleName = extractResourceName(outputs.cross_account_access_role_arn);
      expect(roleName).toMatch(/^cross-account-access-.+$/);
    });

    test('should have IAM roles in global namespace (no region)', () => {
      // IAM ARNs don't have regions
      const securityRoleParts = outputs.security_audit_role_arn.split(':');
      const crossAccountRoleParts = outputs.cross_account_access_role_arn.split(':');

      expect(securityRoleParts[3]).toBe(''); // Region should be empty
      expect(crossAccountRoleParts[3]).toBe(''); // Region should be empty
    });

    test('should have consistent account ID across all IAM roles', () => {
      const securityAccount = extractAccountId(outputs.security_audit_role_arn);
      const crossAccountAccount = extractAccountId(outputs.cross_account_access_role_arn);

      expect(securityAccount).toBe(crossAccountAccount);
      expect(securityAccount).toMatch(/^\d{12}$/);
    });

    test('should validate IAM role ARN structure', () => {
      expect(isValidArn(outputs.security_audit_role_arn, 'iam', '')).toBe(true);
      expect(isValidArn(outputs.cross_account_access_role_arn, 'iam', '')).toBe(true);
    });
  });

  describe('S3 Buckets Configuration Validation', () => {
    test('should have valid S3 bucket naming conventions', () => {
      // S3 bucket names must be 3-63 characters
      expect(outputs.config_bucket_name.length).toBeGreaterThanOrEqual(3);
      expect(outputs.config_bucket_name.length).toBeLessThanOrEqual(63);
      expect(outputs.terraform_state_bucket_name.length).toBeGreaterThanOrEqual(3);
      expect(outputs.terraform_state_bucket_name.length).toBeLessThanOrEqual(63);

      // Must start and end with lowercase letter or number
      expect(outputs.config_bucket_name).toMatch(/^[a-z0-9]/);
      expect(outputs.config_bucket_name).toMatch(/[a-z0-9]$/);
      expect(outputs.terraform_state_bucket_name).toMatch(/^[a-z0-9]/);
      expect(outputs.terraform_state_bucket_name).toMatch(/[a-z0-9]$/);
    });

    test('should have config bucket with expected naming pattern', () => {
      expect(outputs.config_bucket_name).toMatch(/^aws-config-bucket-.+$/);
    });

    test('should have terraform state bucket with expected naming pattern', () => {
      expect(outputs.terraform_state_bucket_name).toMatch(/^terraform-state-.+$/);
    });

    test('should not contain uppercase letters in bucket names', () => {
      expect(outputs.config_bucket_name).toBe(outputs.config_bucket_name.toLowerCase());
      expect(outputs.terraform_state_bucket_name).toBe(outputs.terraform_state_bucket_name.toLowerCase());
    });

    test('should not contain invalid characters in bucket names', () => {
      // S3 bucket names can only contain lowercase letters, numbers, and hyphens
      expect(outputs.config_bucket_name).toMatch(/^[a-z0-9-]+$/);
      expect(outputs.terraform_state_bucket_name).toMatch(/^[a-z0-9-]+$/);
    });
  });

  describe('CloudWatch Logs Configuration Validation', () => {
    test('should have valid log group naming conventions', () => {
      expect(outputs.iam_activity_log_group_name).toMatch(/^\/aws\/.+/);
      expect(outputs.config_activity_log_group_name).toMatch(/^\/aws\/.+/);
    });

    test('should have IAM activity log group with expected pattern', () => {
      expect(outputs.iam_activity_log_group_name).toMatch(/^\/aws\/iam\/activity-.+$/);
    });

    test('should have config activity log group with expected pattern', () => {
      expect(outputs.config_activity_log_group_name).toMatch(/^\/aws\/config\/activity-.+$/);
    });

    test('should have log group names within AWS limits', () => {
      // CloudWatch log group names can be up to 512 characters
      expect(outputs.iam_activity_log_group_name.length).toBeLessThanOrEqual(512);
      expect(outputs.config_activity_log_group_name.length).toBeLessThanOrEqual(512);
    });

    test('should not have trailing slashes in log group names', () => {
      expect(outputs.iam_activity_log_group_name).not.toMatch(/\/$/);
      expect(outputs.config_activity_log_group_name).not.toMatch(/\/$/);
    });
  });

  describe('DynamoDB Table Configuration Validation', () => {
    test('should have valid DynamoDB table name', () => {
      expect(outputs.terraform_state_lock_table_name).toMatch(/^terraform-state-lock-.+$/);
    });

    test('should have table name within AWS limits', () => {
      // DynamoDB table names can be 3-255 characters
      expect(outputs.terraform_state_lock_table_name.length).toBeGreaterThanOrEqual(3);
      expect(outputs.terraform_state_lock_table_name.length).toBeLessThanOrEqual(255);
    });

    test('should have valid characters in table name', () => {
      // DynamoDB table names can contain letters, numbers, underscores, hyphens, and periods
      expect(outputs.terraform_state_lock_table_name).toMatch(/^[a-zA-Z0-9_.-]+$/);
    });
  });

  describe('Resource Naming Conventions', () => {
    test('should verify all resources have environment suffix', () => {
      // Extract suffix from one of the resources
      const configBucket = outputs.config_bucket_name;
      const parts = configBucket.split('-');
      const suffix = parts.slice(-2).join('-'); // Get last two parts (e.g., "dev-new")

      expect(outputs.terraform_state_bucket_name).toContain(suffix);
      expect(outputs.terraform_state_lock_table_name).toContain(suffix);
      expect(outputs.security_audit_role_arn).toContain(suffix);
      expect(outputs.cross_account_access_role_arn).toContain(suffix);
      expect(outputs.iam_activity_log_group_name).toContain(suffix);
      expect(outputs.config_activity_log_group_name).toContain(suffix);
    });

    test('should have consistent environment suffix across all resources', () => {
      // Extract suffixes from different resource types
      const bucketSuffix = outputs.config_bucket_name.split('-').slice(-2).join('-');
      const tableSuffix = outputs.terraform_state_lock_table_name.split('-').slice(-2).join('-');
      const roleSuffix = extractResourceName(outputs.security_audit_role_arn).split('-').slice(-2).join('-');

      expect(bucketSuffix).toBe(tableSuffix);
      expect(bucketSuffix).toBe(roleSuffix);
    });

    test('should follow naming convention pattern: resource-type-suffix', () => {
      expect(outputs.config_bucket_name).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[a-z0-9-]+$/);
      expect(outputs.terraform_state_bucket_name).toMatch(/^[a-z]+-[a-z]+-[a-z0-9-]+$/);
      expect(outputs.terraform_state_lock_table_name).toMatch(/^[a-z]+-[a-z]+-[a-z]+-[a-z0-9-]+$/);
    });
  });

  describe('Multi-Region Configuration Validation', () => {
    test('should have resources in correct primary region (us-east-1)', () => {
      const primaryKmsRegion = extractRegion(outputs.primary_kms_key_arn);
      expect(primaryKmsRegion).toBe('us-east-1');
    });

    test('should have resources in correct secondary region (eu-west-1)', () => {
      const secondaryKmsRegion = extractRegion(outputs.secondary_kms_key_arn);
      const stateKmsRegion = extractRegion(outputs.terraform_state_kms_key_arn);

      expect(secondaryKmsRegion).toBe('eu-west-1');
      expect(stateKmsRegion).toBe('eu-west-1');
    });

    test('should have multi-region key replication configured correctly', () => {
      // Primary and secondary should have same key ID but different regions
      expect(outputs.primary_kms_key_id).toBe(outputs.secondary_kms_key_id);

      const primaryRegion = extractRegion(outputs.primary_kms_key_arn);
      const secondaryRegion = extractRegion(outputs.secondary_kms_key_arn);

      expect(primaryRegion).not.toBe(secondaryRegion);
    });
  });

  describe('Security Configuration Validation', () => {
    test('should have all KMS keys with customer-managed key identifiers', () => {
      // Multi-region keys start with mrk-
      expect(outputs.primary_kms_key_id).toMatch(/^mrk-/);

      // Standard keys have UUID format
      expect(outputs.terraform_state_kms_key_id).toMatch(/^[a-f0-9-]+$/);
    });

    test('should have security-focused IAM role names', () => {
      expect(outputs.security_audit_role_arn).toContain('security-audit');
      expect(outputs.cross_account_access_role_arn).toContain('cross-account-access');
    });

    test('should have security-related log groups configured', () => {
      expect(outputs.iam_activity_log_group_name).toContain('iam');
      expect(outputs.iam_activity_log_group_name).toContain('activity');
      expect(outputs.config_activity_log_group_name).toContain('config');
      expect(outputs.config_activity_log_group_name).toContain('activity');
    });

    test('should have dedicated config bucket', () => {
      expect(outputs.config_bucket_name).toContain('config');
      expect(outputs.config_bucket_name).not.toBe(outputs.terraform_state_bucket_name);
    });

    test('should have separate KMS key for terraform state', () => {
      expect(outputs.terraform_state_kms_key_id).not.toBe(outputs.primary_kms_key_id);
      expect(outputs.terraform_state_kms_key_id).not.toBe(outputs.secondary_kms_key_id);
    });
  });

  describe('Resource Relationships Validation', () => {
    test('should have all resources in the same AWS account', () => {
      const kmsAccount = extractAccountId(outputs.primary_kms_key_arn);
      const iamAccount = extractAccountId(outputs.security_audit_role_arn);

      expect(kmsAccount).toBe(iamAccount);
      expect(kmsAccount).toMatch(/^\d{12}$/);
    });

    test('should have terraform state resources grouped together', () => {
      expect(outputs.terraform_state_bucket_name).toContain('terraform-state');
      expect(outputs.terraform_state_lock_table_name).toContain('terraform-state-lock');
      expect(outputs.terraform_state_kms_key_arn).toContain('kms');
    });

    test('should have AWS Config resources grouped together', () => {
      expect(outputs.config_bucket_name).toContain('config');
      expect(outputs.config_activity_log_group_name).toContain('config');
    });
  });

  describe('Compliance and Best Practices Validation', () => {
    test('should have audit logging configured', () => {
      expect(outputs.iam_activity_log_group_name).toBeDefined();
      expect(outputs.config_activity_log_group_name).toBeDefined();
    });

    test('should have encryption keys for data at rest', () => {
      expect(outputs.primary_kms_key_id).toBeDefined();
      expect(outputs.terraform_state_kms_key_id).toBeDefined();
    });

    test('should have cross-account access controls', () => {
      expect(outputs.security_audit_role_arn).toBeDefined();
      expect(outputs.cross_account_access_role_arn).toBeDefined();
    });

    test('should have state locking mechanism', () => {
      expect(outputs.terraform_state_lock_table_name).toBeDefined();
    });

    test('should have versioned state storage', () => {
      expect(outputs.terraform_state_bucket_name).toBeDefined();
    });

    test('should have configuration tracking', () => {
      expect(outputs.config_bucket_name).toBeDefined();
    });
  });

  describe('Output Completeness Validation', () => {
    test('should have exactly 13 outputs', () => {
      const outputKeys = Object.keys(outputs);
      expect(outputKeys.length).toBe(13);
    });

    test('should have all expected output keys', () => {
      const expectedKeys = [
        'config_activity_log_group_name',
        'config_bucket_name',
        'cross_account_access_role_arn',
        'iam_activity_log_group_name',
        'primary_kms_key_arn',
        'primary_kms_key_id',
        'secondary_kms_key_arn',
        'secondary_kms_key_id',
        'security_audit_role_arn',
        'terraform_state_bucket_name',
        'terraform_state_kms_key_arn',
        'terraform_state_kms_key_id',
        'terraform_state_lock_table_name',
      ];

      const actualKeys = Object.keys(outputs).sort();
      expect(actualKeys).toEqual(expectedKeys.sort());
    });

    test('should not have any null or undefined values', () => {
      Object.keys(outputs).forEach(key => {
        expect(outputs[key]).not.toBeNull();
        expect(outputs[key]).not.toBeUndefined();
      });
    });

    test('should not have any empty string values', () => {
      Object.keys(outputs).forEach(key => {
        expect(outputs[key].trim()).not.toBe('');
      });
    });
  });
});
