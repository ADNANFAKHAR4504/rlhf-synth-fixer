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
  all: jest.fn().mockImplementation((values) => ({
    apply: jest.fn().mockImplementation((fn) => {
      const result = fn(values);
      return {
        apply: jest.fn().mockImplementation((fn2) => fn2(result))
      };
    })
  })),
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
    Role: jest.fn().mockImplementation((name, args) => ({
      name,
      id: `${name}-id`,
      arn: `arn:aws:iam::123456789012:role/${name}`,
      ...args,
    })),
    RolePolicy: jest.fn().mockImplementation((name, args) => ({
      name,
      ...args,
    })),
    RolePolicyAttachment: jest.fn().mockImplementation((name, args) => ({
      name,
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
    Bucket: jest.fn().mockImplementation((name, args) => ({
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
    BucketObjectLockConfiguration: jest.fn(),
  },
}));

import { SecureIAMRole, createMFAEnforcedPolicy, createS3AccessPolicy } from '../lib/modules/iam';
import { KMSKey } from '../lib/modules/kms';
import { SecureS3Bucket } from '../lib/modules/s3';
import { EnhancedSecureS3Bucket } from '../lib/modules/s3/enhanced-s3';
import { SecurityPolicies, createRestrictedAuditPolicy, createTimeBasedS3AccessPolicy } from '../lib/modules/security-policies';

describe('Security Modules Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('SecurityPolicies Module', () => {
    it('should create all required security policies', () => {
      const policies = new SecurityPolicies('test-policies');

      expect(policies.mfaEnforcementPolicy).toBeDefined();
      expect(policies.ec2LifecyclePolicy).toBeDefined();
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

    it('should create MFA enforcement policy with comprehensive coverage', () => {
      const policies = new SecurityPolicies('test-policies', {
        environmentSuffix: 'test',
      });

      expect(policies.mfaEnforcementPolicy).toBeDefined();
      
      // Verify the policy was created with correct name pattern
      const mockPolicy = require('@pulumi/aws').iam.Policy;
      const policyCall = mockPolicy.mock.calls.find((call: any) => 
        call[0] === 'test-policies-mfa-enforcement'
      );
      
      expect(policyCall).toBeDefined();
      expect(policyCall[1].name).toBe('MFAEnforcementPolicy-test');
      expect(policyCall[1].description).toBe('Enforces MFA for all sensitive AWS operations');
      
      // Parse and validate the actual policy document
      const policyDoc = JSON.parse(policyCall[1].policy);
      expect(policyDoc.Version).toBe('2012-10-17');
      expect(policyDoc.Statement).toHaveLength(2);
      
      // Validate MFA enforcement statement
      const mfaStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenySensitiveActionsWithoutMFA');
      expect(mfaStatement).toBeDefined();
      expect(mfaStatement.Effect).toBe('Deny');
      expect(mfaStatement.Action).toContain('iam:DeleteRole');
      expect(mfaStatement.Action).toContain('iam:DeleteUser');
      expect(mfaStatement.Action).toContain('s3:DeleteBucket');
      expect(mfaStatement.Action).toContain('kms:ScheduleKeyDeletion');
      expect(mfaStatement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('false');
      
      // Validate root account denial statement
      const rootStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenyRootAccountUsage');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Deny');
      expect(rootStatement.Action).toBe('*');
      expect(rootStatement.Condition.StringEquals['aws:userid']).toBe('root');
    });

    it('should create S3 security policy with proper restrictions', () => {
      const policies = new SecurityPolicies('test-policies', {
        environmentSuffix: 'prod',
      });

      expect(policies.s3DenyInsecurePolicy).toBeDefined();
      
      // Verify the policy was created with correct name pattern
      const mockPolicy = require('@pulumi/aws').iam.Policy;
      const policyCall = mockPolicy.mock.calls.find((call: any) => 
        call[0] === 'test-policies-s3-security'
      );
      
      expect(policyCall).toBeDefined();
      expect(policyCall[1].name).toBe('S3SecurityPolicy-prod');
      expect(policyCall[1].description).toBe('Enforces secure S3 operations only');
      
      // Parse and validate the actual policy document
      const policyDoc = JSON.parse(policyCall[1].policy);
      expect(policyDoc.Version).toBe('2012-10-17');
      expect(policyDoc.Statement).toHaveLength(2);
      
      // Validate insecure transport denial
      const transportStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenyInsecureTransport');
      expect(transportStatement).toBeDefined();
      expect(transportStatement.Effect).toBe('Deny');
      expect(transportStatement.Action).toBe('s3:*');
      expect(transportStatement.Resource).toEqual(['arn:aws:s3:::*', 'arn:aws:s3:::*/*']);
      expect(transportStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      
      // Validate unencrypted upload denial
      const encryptionStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenyUnencryptedUploads');
      expect(encryptionStatement).toBeDefined();
      expect(encryptionStatement.Effect).toBe('Deny');
      expect(encryptionStatement.Action).toBe('s3:PutObject');
      expect(encryptionStatement.Resource).toBe('arn:aws:s3:::*/*');
      expect(encryptionStatement.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
    });

    it('should create CloudTrail protection policy', () => {
      const policies = new SecurityPolicies('test-policies', {
        environmentSuffix: 'staging',
      });

      expect(policies.cloudTrailProtectionPolicy).toBeDefined();
      
      // Verify the policy was created with correct name pattern
      const mockPolicy = require('@pulumi/aws').iam.Policy;
      expect(mockPolicy).toHaveBeenCalledWith(
        'test-policies-cloudtrail-protection',
        expect.objectContaining({
          name: 'CloudTrailProtectionPolicy-staging',
          description: 'Protects CloudTrail from unauthorized modifications',
        }),
        expect.any(Object)
      );
    });

    it('should create EC2 lifecycle policy', () => {
      const policies = new SecurityPolicies('test-policies', {
        environmentSuffix: 'prod',
      });

      expect(policies.ec2LifecyclePolicy).toBeDefined();
      
      // Verify the policy was created with correct name pattern
      const mockPolicy = require('@pulumi/aws').iam.Policy;
      const policyCall = mockPolicy.mock.calls.find((call: any) => 
        call[0] === 'test-policies-ec2-lifecycle'
      );
      
      expect(policyCall).toBeDefined();
      expect(policyCall[1].name).toBe('EC2LifecyclePolicy-prod');
      expect(policyCall[1].description).toBe('Conditional restrictions for EC2 instance lifecycle operations');
      
      // Parse and validate the actual policy document
      const policyDoc = JSON.parse(policyCall[1].policy);
      expect(policyDoc.Version).toBe('2012-10-17');
      expect(policyDoc.Statement).toHaveLength(2);
      
      // Validate production instance termination protection
      const prodStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenyProductionInstanceTermination');
      expect(prodStatement).toBeDefined();
      expect(prodStatement.Effect).toBe('Deny');
      expect(prodStatement.Action).toBe('ec2:TerminateInstances');
      expect(prodStatement.Condition.StringLike['ec2:ResourceTag/Environment']).toBe('prod*');
      
      // Validate allow statement for non-production instances
      const allowStatement = policyDoc.Statement.find((s: any) => s.Sid === 'AllowNonProductionOperations');
      expect(allowStatement).toBeDefined();
      expect(allowStatement.Effect).toBe('Allow');
      expect(allowStatement.Action).toContain('ec2:StopInstances');
      expect(allowStatement.Action).toContain('ec2:StartInstances');
    });

    it('should create KMS key protection policy', () => {
      const policies = new SecurityPolicies('test-policies', {
        environmentSuffix: 'dev',
      });

      expect(policies.kmsKeyProtectionPolicy).toBeDefined();
      
      // Verify the policy was created with correct name pattern
      const mockPolicy = require('@pulumi/aws').iam.Policy;
      expect(mockPolicy).toHaveBeenCalledWith(
        'test-policies-kms-protection',
        expect.objectContaining({
          name: 'KMSKeyProtectionPolicy-dev',
          description: 'Protects KMS keys from unauthorized access and deletion',
        }),
        expect.any(Object)
      );
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

  describe('SecureIAMRole Module', () => {
    it('should create IAM role with basic configuration', () => {
      const role = new SecureIAMRole('test-role', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' }
          }]
        }),
        tags: { Purpose: 'Testing' }
      });

      expect(role.role).toBeDefined();
      expect(role.policies).toBeDefined();
      expect(Array.isArray(role.policies)).toBe(true);
    });

    it('should create IAM role with managed policy ARNs', () => {
      const role = new SecureIAMRole('test-role-managed', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' }
          }]
        }),
        managedPolicyArns: [
          'arn:aws:iam::aws:policy/ReadOnlyAccess',
          'arn:aws:iam::aws:policy/CloudWatchLogsFullAccess'
        ],
        tags: { Purpose: 'Testing managed policies' }
      });

      expect(role.role).toBeDefined();
      expect(role.policies).toBeDefined();
    });

    it('should create IAM role with inline policies', () => {
      const inlinePolicies = [
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: 's3:GetObject',
            Resource: 'arn:aws:s3:::test-bucket/*'
          }]
        }),
        JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Effect: 'Allow',
            Action: 'logs:CreateLogGroup',
            Resource: '*'
          }]
        })
      ];

      const role = new SecureIAMRole('test-role-inline', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'lambda.amazonaws.com' }
          }]
        }),
        policies: inlinePolicies,
        tags: { Purpose: 'Testing inline policies' }
      });

      expect(role.role).toBeDefined();
      expect(role.policies).toBeDefined();
      expect(role.policies.length).toBe(2);
    });

    it('should handle undefined managed policy ARNs', () => {
      const role = new SecureIAMRole('test-role-undefined-managed', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' }
          }]
        }),
        managedPolicyArns: undefined,
        tags: { Purpose: 'Testing undefined managed policies' }
      });

      expect(role.role).toBeDefined();
      expect(role.policies).toBeDefined();
    });

    it('should handle undefined inline policies', () => {
      const role = new SecureIAMRole('test-role-undefined-inline', {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [{
            Action: 'sts:AssumeRole',
            Effect: 'Allow',
            Principal: { Service: 'ec2.amazonaws.com' }
          }]
        }),
        policies: undefined,
        tags: { Purpose: 'Testing undefined inline policies' }
      });

      expect(role.role).toBeDefined();
      expect(role.policies).toBeDefined();
      expect(role.policies.length).toBe(0);
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

    it('should throw error for missing KMS key ID', () => {
      expect(() => {
        new SecureS3Bucket('test-bucket', {
          kmsKeyId: '',
        });
      }).toThrow('KMS Key ID is required');
    });

    it('should throw error for invalid bucket name', () => {
      expect(() => {
        new SecureS3Bucket('test-bucket', {
          kmsKeyId: 'test-key-id',
          bucketName: 'INVALID-BUCKET-NAME',
        });
      }).toThrow('Invalid bucket name');
    });

    it('should handle access logging configuration', () => {
      const bucket = new SecureS3Bucket('test-bucket', {
        kmsKeyId: 'test-key-id',
        enableAccessLogging: true,
      });

      expect(bucket.bucket).toBeDefined();
      expect(bucket.accessLogsBucket).toBeDefined();
    });

    it('should skip access logging when disabled', () => {
      const bucket = new SecureS3Bucket('test-bucket', {
        kmsKeyId: 'test-key-id',
        enableAccessLogging: false,
      });

      expect(bucket.bucket).toBeDefined();
      expect(bucket.accessLogsBucket).toBeUndefined();
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

      it('should include all required MFA enforcement conditions', () => {
        const policy = createMFAEnforcedPolicy();
        const parsedPolicy = JSON.parse(policy);
        
        // Should have statements for managing own MFA
        const manageMFAStatement = parsedPolicy.Statement.find((stmt: any) => 
          stmt.Sid === 'AllowManageOwnMFA'
        );
        expect(manageMFAStatement).toBeDefined();
        expect(manageMFAStatement.Effect).toBe('Allow');
        expect(manageMFAStatement.Action).toContain('iam:CreateVirtualMFADevice');
        expect(manageMFAStatement.Action).toContain('iam:EnableMFADevice');
        
        // Should have deny statement for actions without MFA
        const denyWithoutMFAStatement = parsedPolicy.Statement.find((stmt: any) => 
          stmt.Sid === 'DenyAllExceptListedIfNoMFA'
        );
        expect(denyWithoutMFAStatement).toBeDefined();
        expect(denyWithoutMFAStatement.Effect).toBe('Deny');
        expect(denyWithoutMFAStatement.NotAction).toContain('iam:CreateVirtualMFADevice');
        expect(denyWithoutMFAStatement.NotAction).toContain('sts:GetSessionToken');
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

      it('should create policy with proper S3 permissions', () => {
        const bucketArn = 'arn:aws:s3:::test-bucket';
        const policy = createS3AccessPolicy(bucketArn);
        
        // The policy should be a Pulumi interpolate result (object)
        expect(policy).toBeDefined();
        expect(typeof policy).toBe('object');
      });

      it('should handle empty bucket ARN', () => {
        const bucketArn = '';
        const policy = createS3AccessPolicy(bucketArn);
        
        expect(policy).toBeDefined();
      });

      it('should handle undefined bucket ARN', () => {
        const bucketArn = undefined as any;
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

  describe('Security Policy Helper Functions', () => {
    describe('createTimeBasedS3AccessPolicy', () => {
      it('should create time-based S3 access policy with default hours', () => {
        const bucketArn = 'arn:aws:s3:::test-bucket';
        const policy = createTimeBasedS3AccessPolicy(bucketArn);
        
        expect(policy).toBeDefined();
        // The policy should be a Pulumi interpolate result (object)
        expect(typeof policy).toBe('object');
      });

      it('should create time-based S3 access policy with custom hours', () => {
        const bucketArn = 'arn:aws:s3:::test-bucket';
        const customHours = ['08', '09', '10', '11', '12'];
        const policy = createTimeBasedS3AccessPolicy(bucketArn, customHours);
        
        expect(policy).toBeDefined();
        expect(typeof policy).toBe('object');
      });

      it('should handle empty hours array', () => {
        const bucketArn = 'arn:aws:s3:::test-bucket';
        const emptyHours: string[] = [];
        const policy = createTimeBasedS3AccessPolicy(bucketArn, emptyHours);
        
        expect(policy).toBeDefined();
      });

      it('should handle undefined bucket ARN', () => {
        const bucketArn = undefined as any;
        const policy = createTimeBasedS3AccessPolicy(bucketArn);
        
        expect(policy).toBeDefined();
      });
    });

    describe('createRestrictedAuditPolicy', () => {
      it('should create restricted audit policy with default IP ranges', () => {
        const auditBucketArn = 'arn:aws:s3:::audit-bucket';
        const policy = createRestrictedAuditPolicy(auditBucketArn);
        
        expect(policy).toBeDefined();
        expect(typeof policy).toBe('object');
      });

      it('should create restricted audit policy with custom IP ranges', () => {
        const auditBucketArn = 'arn:aws:s3:::audit-bucket';
        const customIpRanges = ['10.0.0.0/8', '172.16.0.0/12'];
        const policy = createRestrictedAuditPolicy(auditBucketArn, customIpRanges);
        
        expect(policy).toBeDefined();
        expect(typeof policy).toBe('object');
      });

      it('should handle empty IP ranges array', () => {
        const auditBucketArn = 'arn:aws:s3:::audit-bucket';
        const emptyIpRanges: string[] = [];
        const policy = createRestrictedAuditPolicy(auditBucketArn, emptyIpRanges);
        
        expect(policy).toBeDefined();
      });

      it('should handle undefined bucket ARN', () => {
        const auditBucketArn = undefined as any;
        const policy = createRestrictedAuditPolicy(auditBucketArn);
        
        expect(policy).toBeDefined();
      });

      it('should handle single IP range', () => {
        const auditBucketArn = 'arn:aws:s3:::audit-bucket';
        const singleIpRange = ['192.168.1.0/24'];
        const policy = createRestrictedAuditPolicy(auditBucketArn, singleIpRange);
        
        expect(policy).toBeDefined();
      });
    });
  });

  describe('Security Policy Validation and Negative Tests', () => {
    describe('MFA Enforcement Violations', () => {
      it('should deny sensitive IAM actions without MFA', () => {
        const policies = new SecurityPolicies('test-policies');
        const mockPolicy = require('@pulumi/aws').iam.Policy;
        const policyCall = mockPolicy.mock.calls.find((call: any) => 
          call[0] === 'test-policies-mfa-enforcement'
        );
        
        const policyDoc = JSON.parse(policyCall[1].policy);
        const mfaStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenySensitiveActionsWithoutMFA');
        
        // Test that sensitive actions are denied without MFA
        expect(mfaStatement.Effect).toBe('Deny');
        expect(mfaStatement.Action).toContain('iam:DeleteRole');
        expect(mfaStatement.Action).toContain('iam:DeleteUser');
        expect(mfaStatement.Action).toContain('s3:DeleteBucket');
        expect(mfaStatement.Action).toContain('kms:ScheduleKeyDeletion');
        expect(mfaStatement.Condition.Bool['aws:MultiFactorAuthPresent']).toBe('false');
      });

      it('should deny root account usage completely', () => {
        const policies = new SecurityPolicies('test-policies');
        const mockPolicy = require('@pulumi/aws').iam.Policy;
        const policyCall = mockPolicy.mock.calls.find((call: any) => 
          call[0] === 'test-policies-mfa-enforcement'
        );
        
        const policyDoc = JSON.parse(policyCall[1].policy);
        const rootStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenyRootAccountUsage');
        
        expect(rootStatement.Effect).toBe('Deny');
        expect(rootStatement.Action).toBe('*');
        expect(rootStatement.Resource).toBe('*');
        expect(rootStatement.Condition.StringEquals['aws:userid']).toBe('root');
      });
    });

    describe('EC2 Lifecycle Security Violations', () => {
      it('should deny production instance termination', () => {
        const policies = new SecurityPolicies('test-policies');
        const mockPolicy = require('@pulumi/aws').iam.Policy;
        const policyCall = mockPolicy.mock.calls.find((call: any) => 
          call[0] === 'test-policies-ec2-lifecycle'
        );
        
        const policyDoc = JSON.parse(policyCall[1].policy);
        const prodStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenyProductionInstanceTermination');
        
        expect(prodStatement.Effect).toBe('Deny');
        expect(prodStatement.Action).toBe('ec2:TerminateInstances');
        expect(prodStatement.Condition.StringLike['ec2:ResourceTag/Environment']).toBe('prod*');
      });

      it('should allow non-production instance operations', () => {
        const policies = new SecurityPolicies('test-policies');
        const mockPolicy = require('@pulumi/aws').iam.Policy;
        const policyCall = mockPolicy.mock.calls.find((call: any) => 
          call[0] === 'test-policies-ec2-lifecycle'
        );
        
        const policyDoc = JSON.parse(policyCall[1].policy);
        const allowStatement = policyDoc.Statement.find((s: any) => s.Sid === 'AllowNonProductionOperations');
        
        expect(allowStatement.Effect).toBe('Allow');
        expect(allowStatement.Action).toContain('ec2:StopInstances');
        expect(allowStatement.Action).toContain('ec2:StartInstances');
      });
    });

    describe('S3 Security Violations', () => {
      it('should deny unencrypted object uploads', () => {
        const policies = new SecurityPolicies('test-policies');
        const mockPolicy = require('@pulumi/aws').iam.Policy;
        const policyCall = mockPolicy.mock.calls.find((call: any) => 
          call[0] === 'test-policies-s3-security'
        );
        
        const policyDoc = JSON.parse(policyCall[1].policy);
        const encryptionStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenyUnencryptedUploads');
        
        expect(encryptionStatement.Effect).toBe('Deny');
        expect(encryptionStatement.Action).toBe('s3:PutObject');
        expect(encryptionStatement.Resource).toBe('arn:aws:s3:::*/*');
        expect(encryptionStatement.Condition.StringNotEquals['s3:x-amz-server-side-encryption']).toBe('aws:kms');
      });

      it('should deny insecure transport (HTTP) connections', () => {
        const policies = new SecurityPolicies('test-policies');
        const mockPolicy = require('@pulumi/aws').iam.Policy;
        const policyCall = mockPolicy.mock.calls.find((call: any) => 
          call[0] === 'test-policies-s3-security'
        );
        
        const policyDoc = JSON.parse(policyCall[1].policy);
        const transportStatement = policyDoc.Statement.find((s: any) => s.Sid === 'DenyInsecureTransport');
        
        expect(transportStatement.Effect).toBe('Deny');
        expect(transportStatement.Action).toBe('s3:*');
        expect(transportStatement.Resource).toEqual(['arn:aws:s3:::*', 'arn:aws:s3:::*/*']);
        expect(transportStatement.Condition.Bool['aws:SecureTransport']).toBe('false');
      });
    });

    describe('Input Validation Security Tests', () => {
      it('should reject empty KMS key ID', () => {
        expect(() => {
          new SecureS3Bucket('test-bucket', {
            kmsKeyId: '',
          });
        }).toThrow('KMS Key ID is required for secure S3 bucket test-bucket');
      });

      it('should reject invalid bucket names that could bypass security', () => {
        expect(() => {
          new SecureS3Bucket('test-bucket', {
            kmsKeyId: 'test-key-id',
            bucketName: 'UPPERCASE-NOT-ALLOWED',
          });
        }).toThrow('Invalid bucket name UPPERCASE-NOT-ALLOWED');
        
        expect(() => {
          new SecureS3Bucket('test-bucket', {
            kmsKeyId: 'test-key-id',
            bucketName: 'ab', // Too short
          });
        }).toThrow('Invalid bucket name ab');
        
        expect(() => {
          new SecureS3Bucket('test-bucket', {
            kmsKeyId: 'test-key-id',
            bucketName: 'a'.repeat(64), // Too long
          });
        }).toThrow('Invalid bucket name');
      });
    });
  });
});
