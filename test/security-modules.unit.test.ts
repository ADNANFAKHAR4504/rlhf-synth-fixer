// Mock Pulumi before importing
jest.mock('@pulumi/pulumi', () => ({
  ComponentResource: class MockComponentResource {
    public type: string;
    public name: string;
    public args: any;
    public opts: any;
    
    constructor(type: string, name: string, args: any, opts?: any) {
      this.type = type;
      this.name = name;
      this.args = args;
      this.opts = opts;
    }
    registerOutputs(outputs: any) {
      Object.assign(this, outputs);
    }
  },
  interpolate: jest.fn((template: string) => template),
}));

// Mock AWS
jest.mock('@pulumi/aws', () => ({
  getCallerIdentity: jest.fn().mockResolvedValue({ accountId: '123456789012' }),
  iam: {
    Policy: jest.fn().mockImplementation((name, args) => ({
      name,
      arn: `arn:aws:iam::123456789012:policy/${name}`,
      ...args,
    })),
  },
  kms: {
    Key: jest.fn().mockImplementation((name, args) => ({
      name,
      keyId: `key-${Math.random().toString(36).substr(2, 9)}`,
      arn: `arn:aws:kms:us-east-1:123456789012:key/${Math.random().toString(36).substr(2, 9)}`,
      ...args,
    })),
    Alias: jest.fn().mockImplementation((name, args) => ({
      name,
      ...args,
    })),
  },
  s3: {
    BucketV2: jest.fn().mockImplementation((name, args) => ({
      name,
      id: `${name}-${Math.random().toString(36).substr(2, 9)}`,
      arn: `arn:aws:s3:::${name}-${Math.random().toString(36).substr(2, 9)}`,
      bucketDomainName: `${name}.s3.amazonaws.com`,
      ...args,
    })),
    BucketVersioning: jest.fn(),
    BucketServerSideEncryptionConfiguration: jest.fn(),
    BucketPublicAccessBlock: jest.fn(),
    BucketPolicy: jest.fn(),
    BucketLifecycleConfiguration: jest.fn(),
    BucketLogging: jest.fn(),
    BucketMetric: jest.fn(),
    BucketNotification: jest.fn(),
    BucketObjectLockConfigurationV2: jest.fn(),
  },
}));

import { SecurityPolicies } from '../lib/modules/security-policies';
import { KMSKey } from '../lib/modules/kms';
import { SecureS3Bucket } from '../lib/modules/s3';
import { EnhancedSecureS3Bucket } from '../lib/modules/s3/enhanced-s3';
import { createMFAEnforcedPolicy, createS3AccessPolicy } from '../lib/modules/iam';

describe('Security Modules Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SecurityPolicies Module', () => {
    it('should create all required security policies', () => {
      const policies = new SecurityPolicies('test-policies');

      expect(policies.mfaEnforcementPolicy).toBeDefined();
      expect(policies.s3DenyInsecurePolicy).toBeDefined();
      expect(policies.cloudTrailProtectionPolicy).toBeDefined();
      expect(policies.kmsKeyProtectionPolicy).toBeDefined();
    });

    it('should create policies with environment suffix', () => {
      const policies = new SecurityPolicies('test-policies', {
        environmentSuffix: 'prod',
        tags: { Environment: 'Production' },
      });

      expect(policies).toBeDefined();
    });

    it('should handle default environment suffix', () => {
      const policies = new SecurityPolicies('test-policies', {});

      expect(policies).toBeDefined();
    });
  });

  describe('KMSKey Module', () => {
    it('should create KMS key with proper configuration', () => {
      const kmsKey = new KMSKey('test-key', {
        description: 'Test KMS key',
        keyUsage: 'ENCRYPT_DECRYPT',
        tags: { Purpose: 'Testing' },
      });

      expect(kmsKey.key).toBeDefined();
      expect(kmsKey.alias).toBeDefined();
    });

    it('should use default key usage when not specified', () => {
      const kmsKey = new KMSKey('test-key', {
        description: 'Test KMS key',
      });

      expect(kmsKey.key).toBeDefined();
      expect(kmsKey.alias).toBeDefined();
    });

    it('should create key with proper policy structure', () => {
      const kmsKey = new KMSKey('test-key', {
        description: 'Test KMS key',
      });

      expect(kmsKey.key).toBeDefined();
      // Verify that the key was created with proper arguments
      const mockKmsKey = require('@pulumi/aws').kms.Key;
      expect(mockKmsKey).toHaveBeenCalledWith(
        'test-key-key',
        expect.objectContaining({
          description: 'Test KMS key',
          keyUsage: 'ENCRYPT_DECRYPT',
          enableKeyRotation: true,
          deletionWindowInDays: 30,
        }),
        expect.any(Object)
      );
    });
  });

  describe('SecureS3Bucket Module', () => {
    it('should create S3 bucket with security configurations', () => {
      const bucket = new SecureS3Bucket('test-bucket', {
        kmsKeyId: 'test-key-id',
        bucketName: 'my-test-bucket',
        tags: { Purpose: 'Testing' },
      });

      expect(bucket.bucket).toBeDefined();
      expect(bucket.bucketPolicy).toBeDefined();
      expect(bucket.publicAccessBlock).toBeDefined();
    });

    it('should create bucket with lifecycle rules', () => {
      const bucket = new SecureS3Bucket('test-bucket', {
        kmsKeyId: 'test-key-id',
        lifecycleRules: [
          {
            id: 'test-rule',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
      });

      expect(bucket.bucket).toBeDefined();
    });

    it('should handle missing optional parameters', () => {
      const bucket = new SecureS3Bucket('test-bucket', {
        kmsKeyId: 'test-key-id',
      });

      expect(bucket.bucket).toBeDefined();
      expect(bucket.bucketPolicy).toBeDefined();
      expect(bucket.publicAccessBlock).toBeDefined();
    });
  });

  describe('EnhancedSecureS3Bucket Module', () => {
    it('should create enhanced S3 bucket with all security features', () => {
      const bucket = new EnhancedSecureS3Bucket('test-enhanced-bucket', {
        kmsKeyId: 'test-key-id',
        enableAccessLogging: true,
        enableNotifications: true,
        enableObjectLock: true,
        allowedIpRanges: ['10.0.0.0/8'],
      });

      expect(bucket.bucket).toBeDefined();
      expect(bucket.bucketPolicy).toBeDefined();
      expect(bucket.publicAccessBlock).toBeDefined();
      expect(bucket.accessLogsBucket).toBeDefined();
    });

    it('should create bucket without optional features', () => {
      const bucket = new EnhancedSecureS3Bucket('test-enhanced-bucket', {
        kmsKeyId: 'test-key-id',
        enableAccessLogging: false,
        enableNotifications: false,
        enableObjectLock: false,
      });

      expect(bucket.bucket).toBeDefined();
      expect(bucket.bucketPolicy).toBeDefined();
      expect(bucket.publicAccessBlock).toBeDefined();
    });

    it('should handle default values for optional parameters', () => {
      const bucket = new EnhancedSecureS3Bucket('test-enhanced-bucket', {
        kmsKeyId: 'test-key-id',
      });

      expect(bucket.bucket).toBeDefined();
    });
  });

  describe('IAM Policy Functions', () => {
    describe('createMFAEnforcedPolicy', () => {
      it('should return valid JSON policy', () => {
        const policy = createMFAEnforcedPolicy();
        
        expect(policy).toBeDefined();
        expect(typeof policy).toBe('string');
        
        // Should be valid JSON
        const parsedPolicy = JSON.parse(policy);
        expect(parsedPolicy.Version).toBe('2012-10-17');
        expect(parsedPolicy.Statement).toBeDefined();
        expect(Array.isArray(parsedPolicy.Statement)).toBe(true);
      });

      it('should include MFA enforcement statements', () => {
        const policy = createMFAEnforcedPolicy();
        const parsedPolicy = JSON.parse(policy);
        
        // Should have statements for MFA enforcement
        expect(parsedPolicy.Statement.length).toBeGreaterThan(0);
        
        // Should have a statement that denies actions without MFA
        const denyStatement = parsedPolicy.Statement.find((stmt: any) => 
          stmt.Effect === 'Deny' && 
          stmt.Condition?.BoolIfExists?.['aws:MultiFactorAuthPresent']
        );
        expect(denyStatement).toBeDefined();
      });
    });

    describe('createS3AccessPolicy', () => {
      it('should return policy with bucket ARN interpolation', () => {
        const bucketArn = 'arn:aws:s3:::test-bucket';
        const policy = createS3AccessPolicy(bucketArn);
        
        expect(policy).toBeDefined();
      });

      it('should handle different bucket ARN formats', () => {
        const bucketArn = 'arn:aws:s3:::my-special-bucket-name-123';
        const policy = createS3AccessPolicy(bucketArn);
        
        expect(policy).toBeDefined();
      });
    });
  });

  describe('Module Integration', () => {
    it('should work together in a typical security setup', () => {
      // Create KMS key
      const kmsKey = new KMSKey('integration-key', {
        description: 'Integration test key',
      });

      // Create S3 bucket using the KMS key
      const bucket = new SecureS3Bucket('integration-bucket', {
        kmsKeyId: kmsKey.key.keyId,
      });

      // Create security policies
      const policies = new SecurityPolicies('integration-policies');

      expect(kmsKey.key).toBeDefined();
      expect(bucket.bucket).toBeDefined();
      expect(policies.mfaEnforcementPolicy).toBeDefined();
    });

    it('should handle complex configurations', () => {
      const kmsKey = new KMSKey('complex-key', {
        description: 'Complex configuration key',
        tags: { Environment: 'Test', Purpose: 'Integration' },
      });

      const enhancedBucket = new EnhancedSecureS3Bucket('complex-bucket', {
        kmsKeyId: kmsKey.key.keyId,
        enableAccessLogging: true,
        enableNotifications: true,
        enableObjectLock: true,
        allowedIpRanges: ['10.0.0.0/8', '192.168.0.0/16'],
        lifecycleRules: [
          {
            id: 'complex-rule',
            status: 'Enabled',
            transitions: [
              { days: 30, storageClass: 'STANDARD_IA' },
              { days: 90, storageClass: 'GLACIER' },
            ],
          },
        ],
      });

      const policies = new SecurityPolicies('complex-policies', {
        environmentSuffix: 'integration',
        tags: { Environment: 'Test' },
      });

      expect(kmsKey.key).toBeDefined();
      expect(enhancedBucket.bucket).toBeDefined();
      expect(enhancedBucket.accessLogsBucket).toBeDefined();
      expect(policies.mfaEnforcementPolicy).toBeDefined();
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle empty tags gracefully', () => {
      const kmsKey = new KMSKey('empty-tags-key', {
        description: 'Key with empty tags',
        tags: {},
      });

      expect(kmsKey.key).toBeDefined();
    });

    it('should handle undefined optional parameters', () => {
      const bucket = new SecureS3Bucket('minimal-bucket', {
        kmsKeyId: 'test-key-id',
        // All other parameters undefined
      });

      expect(bucket.bucket).toBeDefined();
    });

    it('should handle empty lifecycle rules array', () => {
      const bucket = new SecureS3Bucket('empty-lifecycle-bucket', {
        kmsKeyId: 'test-key-id',
        lifecycleRules: [],
      });

      expect(bucket.bucket).toBeDefined();
    });

    it('should handle empty IP ranges array', () => {
      const bucket = new EnhancedSecureS3Bucket('empty-ip-bucket', {
        kmsKeyId: 'test-key-id',
        allowedIpRanges: [],
      });

      expect(bucket.bucket).toBeDefined();
    });

    it('should handle null values in SecurityPolicies', () => {
      const policies = new SecurityPolicies('null-test-policies', {
        environmentSuffix: undefined,
        tags: undefined,
      });

      expect(policies).toBeDefined();
    });

    it('should handle undefined keyUsage in KMSKey', () => {
      const kmsKey = new KMSKey('undefined-usage-key', {
        description: 'Key with undefined usage',
        keyUsage: undefined,
      });

      expect(kmsKey.key).toBeDefined();
    });

    it('should handle null bucketName in SecureS3Bucket', () => {
      const bucket = new SecureS3Bucket('null-name-bucket', {
        kmsKeyId: 'test-key-id',
        bucketName: undefined,
      });

      expect(bucket.bucket).toBeDefined();
    });

    it('should handle all optional parameters as false in EnhancedSecureS3Bucket', () => {
      const bucket = new EnhancedSecureS3Bucket('all-false-bucket', {
        kmsKeyId: 'test-key-id',
        enableAccessLogging: false,
        enableNotifications: false,
        enableObjectLock: false,
        allowedIpRanges: undefined,
        lifecycleRules: undefined,
      });

      expect(bucket.bucket).toBeDefined();
    });

    it('should handle complex lifecycle rules', () => {
      const complexRules = [
        {
          id: 'complex-rule-1',
          status: 'Enabled',
          transitions: [
            { days: 30, storageClass: 'STANDARD_IA' },
            { days: 90, storageClass: 'GLACIER' },
            { days: 365, storageClass: 'DEEP_ARCHIVE' },
          ],
          expiration: { days: 2555 },
        },
        {
          id: 'complex-rule-2',
          status: 'Disabled',
          filter: { prefix: 'temp/' },
          expiration: { days: 7 },
        },
      ];

      const bucket = new SecureS3Bucket('complex-lifecycle-bucket', {
        kmsKeyId: 'test-key-id',
        lifecycleRules: complexRules,
      });

      expect(bucket.bucket).toBeDefined();
    });

    it('should handle multiple IP ranges in EnhancedSecureS3Bucket', () => {
      const bucket = new EnhancedSecureS3Bucket('multi-ip-bucket', {
        kmsKeyId: 'test-key-id',
        allowedIpRanges: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
      });

      expect(bucket.bucket).toBeDefined();
    });

    it('should handle special characters in tags', () => {
      const specialTags = {
        'Environment': 'test',
        'Project-Name': 'security-test',
        'Owner:Email': 'test@example.com',
        'Cost_Center': '12345',
        'Custom Tag': 'value with spaces',
      };

      const kmsKey = new KMSKey('special-chars-key', {
        description: 'Key with special character tags',
        tags: specialTags,
      });

      expect(kmsKey.key).toBeDefined();
    });

    it('should handle long description strings', () => {
      const longDescription = 'This is a very long description that exceeds normal length limits and contains multiple sentences. It is used to test how the KMS key handles long description strings and ensures that the system can process them correctly without any issues or truncation problems.';

      const kmsKey = new KMSKey('long-desc-key', {
        description: longDescription,
      });

      expect(kmsKey.key).toBeDefined();
    });

    it('should handle empty string values', () => {
      const bucket = new SecureS3Bucket('empty-string-bucket', {
        kmsKeyId: 'test-key-id',
        bucketName: '',
        tags: {
          'EmptyTag': '',
          'NormalTag': 'value',
        },
      });

      expect(bucket.bucket).toBeDefined();
    });

    it('should handle numeric values in tags', () => {
      const numericTags = {
        'Version': '1.0',
        'Port': '8080',
        'Count': '100',
      };

      const policies = new SecurityPolicies('numeric-tags-policies', {
        environmentSuffix: 'test',
        tags: numericTags,
      });

      expect(policies).toBeDefined();
    });
  });
});
