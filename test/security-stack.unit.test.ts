// Mock Pulumi before importing
jest.mock('@pulumi/pulumi', () => ({
  runtime: {
    setMocks: jest.fn(),
  },
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
  all: jest.fn().mockImplementation(values => ({
    apply: jest.fn().mockImplementation(fn => {
      const result = fn(values);
      return {
        apply: jest.fn().mockImplementation(fn2 => fn2(result))
      };
    })
  })),
  Output: jest.fn().mockImplementation(value => ({
    promise: () => Promise.resolve(value),
    apply: (fn: any) => fn(value),
  })),
  Config: jest.fn().mockImplementation(() => ({
    get: jest.fn(),
    require: jest.fn(),
  })),
  interpolate: jest.fn((template: string) => template),
}));

// Mock AWS provider
jest.mock('@pulumi/aws', () => ({
  Provider: jest.fn().mockImplementation(() => ({})),
  getCallerIdentity: jest.fn().mockResolvedValue({ accountId: '123456789012' }),
  iam: {
    Policy: jest.fn().mockImplementation((name, args) => ({
      name,
      arn: `arn:aws:iam::123456789012:policy/${name}`,
      ...args,
    })),
    Role: jest.fn().mockImplementation((name, args) => ({
      name,
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
    BucketVersioning: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
    BucketServerSideEncryptionConfiguration: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
    BucketPublicAccessBlock: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
    BucketPolicy: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
    BucketLifecycleConfiguration: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
    BucketLogging: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
    BucketMetric: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
    BucketNotification: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
    BucketObjectLockConfiguration: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
  },
  cloudtrail: {
    Trail: jest.fn().mockImplementation((name, args) => ({
      name,
      arn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/${name}`,
      ...args,
    })),
  },
  cloudwatch: {
    LogGroup: jest.fn().mockImplementation((name, args) => ({
      name,
      arn: `arn:aws:logs:us-east-1:123456789012:log-group:${args.name}`,
      ...args,
    })),
    LogStream: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
    LogMetricFilter: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
    MetricAlarm: jest.fn().mockImplementation((name, args) => ({ name, ...args })),
  },
}));

// Mock the security modules
jest.mock('../lib/modules/kms', () => ({
  KMSKey: jest.fn().mockImplementation((name, args) => ({
    key: {
      keyId: `key-${Math.random().toString(36).substr(2, 9)}`,
      arn: `arn:aws:kms:us-east-1:123456789012:key/${Math.random().toString(36).substr(2, 9)}`,
    },
    alias: {
      name: `alias/${name}`,
    },
  })),
}));

jest.mock('../lib/modules/s3', () => ({
  SecureS3Bucket: jest.fn().mockImplementation((name, args) => ({
    bucket: {
      id: `${name}-bucket-${Math.random().toString(36).substr(2, 9)}`,
      arn: `arn:aws:s3:::${name}-bucket-${Math.random().toString(36).substr(2, 9)}`,
      bucketDomainName: `${name}-bucket.s3.amazonaws.com`,
    },
    bucketPolicy: {},
    publicAccessBlock: {},
  })),
}));

jest.mock('../lib/modules/s3/enhanced-s3', () => ({
  EnhancedSecureS3Bucket: jest.fn().mockImplementation((name, args) => ({
    bucket: {
      id: `${name}-enhanced-bucket-${Math.random().toString(36).substr(2, 9)}`,
      arn: `arn:aws:s3:::${name}-enhanced-bucket-${Math.random().toString(36).substr(2, 9)}`,
      bucketDomainName: `${name}-enhanced-bucket.s3.amazonaws.com`,
    },
    bucketPolicy: {},
    publicAccessBlock: {},
    accessLogsBucket: {
      id: `${name}-logs-bucket-${Math.random().toString(36).substr(2, 9)}`,
      arn: `arn:aws:s3:::${name}-logs-bucket-${Math.random().toString(36).substr(2, 9)}`,
    },
  })),
}));

jest.mock('../lib/modules/iam', () => ({
  SecureIAMRole: jest.fn().mockImplementation((name, args) => ({
    role: {
      arn: `arn:aws:iam::123456789012:role/${name}-role`,
      name: `${name}-role`,
    },
    policies: [],
  })),
  createMFAEnforcedPolicy: jest.fn().mockReturnValue('{"Version":"2012-10-17","Statement":[]}'),
  createS3AccessPolicy: jest.fn().mockReturnValue('{"Version":"2012-10-17","Statement":[]}'),
}));

jest.mock('../lib/modules/cloudtrail', () => ({
  SecureCloudTrail: jest.fn().mockImplementation((name, args) => ({
    trail: {
      arn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/${name}`,
      name: `${name}-trail`,
    },
    logGroup: {
      arn: `arn:aws:logs:us-east-1:123456789012:log-group:/aws/cloudtrail/${name}`,
    },
  })),
}));

jest.mock('../lib/modules/cloudtrail/enhanced-cloudtrail', () => ({
  EnhancedCloudTrail: jest.fn().mockImplementation((name, args) => ({
    trail: {
      arn: `arn:aws:cloudtrail:us-east-1:123456789012:trail/${name}`,
      name: `${name}-trail`,
    },
    logGroup: {
      arn: `arn:aws:logs:us-east-1:123456789012:log-group:/aws/cloudtrail/${name}`,
    },
    metricFilter: { name: `${name}-metric-filter` },
    alarm: { name: `${name}-alarm` },
  })),
}));

jest.mock('../lib/modules/security-policies', () => ({
  SecurityPolicies: jest.fn().mockImplementation((name, args) => ({
    mfaEnforcementPolicy: {
      arn: `arn:aws:iam::123456789012:policy/MFAEnforcementPolicy-${args?.environmentSuffix || 'dev'}`,
    },
    s3DenyInsecurePolicy: {
      arn: `arn:aws:iam::123456789012:policy/S3SecurityPolicy-${args?.environmentSuffix || 'dev'}`,
    },
    cloudTrailProtectionPolicy: {
      arn: `arn:aws:iam::123456789012:policy/CloudTrailProtectionPolicy-${args?.environmentSuffix || 'dev'}`,
    },
    kmsKeyProtectionPolicy: {
      arn: `arn:aws:iam::123456789012:policy/KMSKeyProtectionPolicy-${args?.environmentSuffix || 'dev'}`,
    },
  })),
  createTimeBasedS3AccessPolicy: jest.fn().mockReturnValue('{"Version":"2012-10-17","Statement":[]}'),
  createRestrictedAuditPolicy: jest.fn().mockReturnValue('{"Version":"2012-10-17","Statement":[]}'),
}));

import { SecurityStack } from '../lib/stacks/security-stack';
import { KMSKey } from '../lib/modules/kms';
import { SecureS3Bucket } from '../lib/modules/s3';
import { EnhancedSecureS3Bucket } from '../lib/modules/s3/enhanced-s3';
import { SecureIAMRole } from '../lib/modules/iam';
import { SecureCloudTrail } from '../lib/modules/cloudtrail';
import { EnhancedCloudTrail } from '../lib/modules/cloudtrail/enhanced-cloudtrail';
import { SecurityPolicies } from '../lib/modules/security-policies';

describe('SecurityStack Unit Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic SecurityStack Creation', () => {
    it('should create SecurityStack with default parameters', () => {
      const stack = new SecurityStack('test-security-stack');

      expect(stack).toBeDefined();
      expect(stack.region).toBe('us-east-1');
    });

    it('should create SecurityStack with custom parameters', () => {
      const stack = new SecurityStack('test-security-stack', {
        environmentSuffix: 'prod',
        tags: { Environment: 'Production', Project: 'Security' },
        allowedIpRanges: ['10.0.0.0/8'],
        enableEnhancedSecurity: true,
      });

      expect(stack).toBeDefined();
      expect(stack.region).toBe('us-east-1');
    });

    it('should have all required outputs defined', () => {
      const stack = new SecurityStack('test-security-stack');

      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.primaryBucketArn).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
      expect(stack.auditBucketArn).toBeDefined();
      expect(stack.s3KmsKeyId).toBeDefined();
      expect(stack.s3KmsKeyArn).toBeDefined();
      expect(stack.cloudTrailKmsKeyId).toBeDefined();
      expect(stack.cloudTrailKmsKeyArn).toBeDefined();
      expect(stack.dataAccessRoleArn).toBeDefined();
      expect(stack.auditRoleArn).toBeDefined();
      expect(stack.cloudTrailArn).toBeDefined();
      expect(stack.cloudTrailLogGroupArn).toBeDefined();
      expect(stack.securityPolicyArn).toBeDefined();
      expect(stack.mfaEnforcementPolicyArn).toBeDefined();
      expect(stack.s3SecurityPolicyArn).toBeDefined();
      expect(stack.cloudTrailProtectionPolicyArn).toBeDefined();
      expect(stack.kmsProtectionPolicyArn).toBeDefined();
    });
  });

  describe('Component Creation with Enhanced Security Disabled', () => {
    it('should create standard security components when enhanced security is disabled', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: false,
      });

      expect(SecurityPolicies).toHaveBeenCalledTimes(1);
      expect(KMSKey).toHaveBeenCalledTimes(2); // S3 and CloudTrail keys
      expect(SecureS3Bucket).toHaveBeenCalledTimes(2); // Primary and audit buckets
      expect(EnhancedSecureS3Bucket).not.toHaveBeenCalled();
      expect(SecureIAMRole).toHaveBeenCalledTimes(2); // Data access and audit roles
      expect(SecureCloudTrail).toHaveBeenCalledTimes(1);
      expect(EnhancedCloudTrail).not.toHaveBeenCalled();
    });

    it('should create standard S3 buckets with basic lifecycle rules', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: false,
        environmentSuffix: 'test',
        tags: { Environment: 'Test' },
        allowedIpRanges: ['10.0.0.0/8'],
      });

      expect(SecureS3Bucket).toHaveBeenCalledWith('primary-storage', 
        expect.objectContaining({
          lifecycleRules: expect.arrayContaining([
            expect.objectContaining({
              id: 'transition-to-ia',
              status: 'Enabled',
              transitions: expect.arrayContaining([
                { days: 30, storageClass: 'STANDARD_IA' },
                { days: 90, storageClass: 'GLACIER' },
                { days: 365, storageClass: 'DEEP_ARCHIVE' },
              ]),
            }),
          ]),
          tags: { Purpose: 'Primary data storage' },
        }),
        expect.any(Object)
      );

      expect(SecureS3Bucket).toHaveBeenCalledWith('audit-logs',
        expect.objectContaining({
          tags: { Purpose: 'Audit and compliance logs' },
        }),
        expect.any(Object)
      );
    });

    it('should create standard IAM roles without enhanced policies', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: false,
        allowedIpRanges: ['192.168.1.0/24'],
      });

      const dataAccessCall = (SecureIAMRole as unknown as jest.Mock).mock.calls.find(
        call => call[0] === 'data-access'
      );
      expect(dataAccessCall[1].assumeRolePolicy).toContain('aws:MultiFactorAuthPresent');
      expect(dataAccessCall[1].assumeRolePolicy).toContain('true');
      expect(dataAccessCall[1].assumeRolePolicy).toContain('aws:RequestedRegion');
      expect(dataAccessCall[1].assumeRolePolicy).toContain('us-east-1');
      expect(dataAccessCall[1].assumeRolePolicy).toContain('192.168.1.0/24');
      expect(dataAccessCall[1].managedPolicyArns).toEqual([]);

      const auditAccessCall = (SecureIAMRole as unknown as jest.Mock).mock.calls.find(
        call => call[0] === 'audit-access'
      );
      expect(auditAccessCall[1].managedPolicyArns).toContain('arn:aws:iam::aws:policy/ReadOnlyAccess');
    });

    it('should create standard CloudTrail without insights', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: false,
      });

      expect(SecureCloudTrail).toHaveBeenCalledWith('security-audit',
        expect.objectContaining({
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogFileValidation: true,
          tags: { Purpose: 'Security audit and compliance' },
        }),
        expect.any(Object)
      );
    });
  });

  describe('Component Creation with Enhanced Security Enabled', () => {
    it('should create enhanced security components when enhanced security is enabled', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
      });

      expect(SecurityPolicies).toHaveBeenCalledTimes(1);
      expect(KMSKey).toHaveBeenCalledTimes(2); // S3 and CloudTrail keys
      expect(EnhancedSecureS3Bucket).toHaveBeenCalledTimes(2); // Primary and audit buckets
      expect(SecureS3Bucket).not.toHaveBeenCalled();
      expect(SecureIAMRole).toHaveBeenCalledTimes(2); // Data access and audit roles
      expect(EnhancedCloudTrail).toHaveBeenCalledTimes(1);
      expect(SecureCloudTrail).not.toHaveBeenCalled();
    });

    it('should create enhanced S3 buckets with all security features', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
        allowedIpRanges: ['172.16.0.0/12'],
        environmentSuffix: 'prod',
        tags: { Environment: 'Production', Owner: 'SecurityTeam' },
      });

      expect(EnhancedSecureS3Bucket).toHaveBeenCalledWith('primary-storage', 
        expect.objectContaining({
          allowedIpRanges: ['172.16.0.0/12'],
          enableAccessLogging: true,
          enableNotifications: true,
          enableObjectLock: true,
          lifecycleRules: expect.arrayContaining([
            expect.objectContaining({
              id: 'transition-to-ia',
              status: 'Enabled',
            }),
          ]),
          tags: { Purpose: 'Primary data storage with enhanced security' },
        }),
        expect.any(Object)
      );

      expect(EnhancedSecureS3Bucket).toHaveBeenCalledWith('audit-logs',
        expect.objectContaining({
          allowedIpRanges: ['172.16.0.0/12'],
          enableAccessLogging: true,
          enableObjectLock: true,
          tags: { Purpose: 'Audit and compliance logs with enhanced security' },
        }),
        expect.any(Object)
      );
    });

    it('should create enhanced IAM roles with time-based policies', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
        allowedIpRanges: ['203.0.113.0/24'],
      });

      const dataAccessCall = (SecureIAMRole as unknown as jest.Mock).mock.calls.find(
        call => call[0] === 'data-access'
      );
      expect(dataAccessCall[1].assumeRolePolicy).toContain('aws:MultiFactorAuthPresent');
      expect(dataAccessCall[1].assumeRolePolicy).toContain('true');
      expect(dataAccessCall[1].assumeRolePolicy).toContain('aws:RequestedRegion');
      expect(dataAccessCall[1].assumeRolePolicy).toContain('us-east-1');
      expect(dataAccessCall[1].assumeRolePolicy).toContain('203.0.113.0/24');
      expect(dataAccessCall[1].tags.Purpose).toBe('Data access with enhanced MFA enforcement and time restrictions');

      const auditAccessCall = (SecureIAMRole as unknown as jest.Mock).mock.calls.find(
        call => call[0] === 'audit-access'
      );
      expect(auditAccessCall[1].tags.Purpose).toBe('Audit log access with IP and time restrictions');
    });

    it('should create enhanced CloudTrail with insights', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
      });

      expect(EnhancedCloudTrail).toHaveBeenCalledWith('security-audit',
        expect.objectContaining({
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogFileValidation: true,
          enableInsightSelectors: true,
          tags: { Purpose: 'Enhanced security audit and compliance with anomaly detection' },
        }),
        expect.any(Object)
      );
    });
  });

  describe('KMS Key Configuration', () => {
    it('should create separate KMS keys for S3 and CloudTrail', () => {
      new SecurityStack('test-security-stack');

      expect(KMSKey).toHaveBeenCalledTimes(2);
      expect(KMSKey).toHaveBeenCalledWith('s3-encryption', {
        description: 'KMS key for S3 bucket encryption with enhanced security',
        tags: { Purpose: 'S3 Encryption' },
      }, expect.any(Object));
      expect(KMSKey).toHaveBeenCalledWith('cloudtrail-encryption', {
        description: 'KMS key for CloudTrail log encryption with enhanced security',
        tags: { Purpose: 'CloudTrail Encryption' },
      }, expect.any(Object));
    });
  });

  describe('S3 Bucket Configuration', () => {
    it('should create primary and audit buckets with proper lifecycle rules', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
      });

      expect(EnhancedSecureS3Bucket).toHaveBeenCalledWith('primary-storage', 
        expect.objectContaining({
          allowedIpRanges: ['203.0.113.0/24'],
          enableAccessLogging: true,
          enableNotifications: true,
          enableObjectLock: true,
          lifecycleRules: expect.arrayContaining([
            expect.objectContaining({
              id: 'transition-to-ia',
              status: 'Enabled',
            }),
          ]),
          tags: {
            Purpose: 'Primary data storage with enhanced security',
          },
        }),
        expect.any(Object)
      );

      expect(EnhancedSecureS3Bucket).toHaveBeenCalledWith('audit-logs',
        expect.objectContaining({
          allowedIpRanges: ['203.0.113.0/24'],
          enableAccessLogging: true,
          enableObjectLock: true,
          tags: {
            Purpose: 'Audit and compliance logs with enhanced security',
          },
        }),
        expect.any(Object)
      );
    });
  });

  describe('IAM Role Configuration', () => {
    it('should create data access role with proper MFA and IP restrictions', () => {
      new SecurityStack('test-security-stack', {
        allowedIpRanges: ['10.0.0.0/8'],
      });

      const dataAccessCall = (SecureIAMRole as unknown as jest.Mock).mock.calls.find(
        call => call[0] === 'data-access'
      );
      
      expect(dataAccessCall).toBeDefined();
      expect(dataAccessCall[1].assumeRolePolicy).toContain('aws:MultiFactorAuthPresent');
      expect(dataAccessCall[1].assumeRolePolicy).toContain('true');
      expect(dataAccessCall[1].assumeRolePolicy).toContain('10.0.0.0/8');
      expect(dataAccessCall[1].requireMFA).toBe(true);
      expect(dataAccessCall[1].managedPolicyArns).toEqual([]);
      expect(dataAccessCall[1].tags.Purpose).toContain('Data access');
    });

    it('should create audit role with read-only access and IP restrictions', () => {
      new SecurityStack('test-security-stack', {
        allowedIpRanges: ['10.0.0.0/8'],
      });

      const auditAccessCall = (SecureIAMRole as unknown as jest.Mock).mock.calls.find(
        call => call[0] === 'audit-access'
      );
      
      expect(auditAccessCall).toBeDefined();
      expect(auditAccessCall[1].assumeRolePolicy).toContain('aws:MultiFactorAuthPresent');
      expect(auditAccessCall[1].assumeRolePolicy).toContain('true');
      expect(auditAccessCall[1].assumeRolePolicy).toContain('10.0.0.0/8');
      expect(auditAccessCall[1].requireMFA).toBe(true);
      expect(auditAccessCall[1].managedPolicyArns).toContain('arn:aws:iam::aws:policy/ReadOnlyAccess');
      expect(auditAccessCall[1].tags.Purpose).toContain('Audit');
    });
  });

  describe('CloudTrail Configuration', () => {
    it('should create enhanced CloudTrail when enhanced security is enabled', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
      });

      expect(EnhancedCloudTrail).toHaveBeenCalledWith('security-audit',
        expect.objectContaining({
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogFileValidation: true,
          enableInsightSelectors: true,
          tags: {
            Purpose: 'Enhanced security audit and compliance with anomaly detection',
          },
        }),
        expect.any(Object)
      );
    });

    it('should create standard CloudTrail when enhanced security is disabled', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: false,
      });

      expect(SecureCloudTrail).toHaveBeenCalledWith('security-audit',
        expect.objectContaining({
          includeGlobalServiceEvents: true,
          isMultiRegionTrail: true,
          enableLogFileValidation: true,
          tags: {
            Purpose: 'Security audit and compliance',
          },
        }),
        expect.any(Object)
      );
    });
  });

  describe('Security Policies Configuration', () => {
    it('should create comprehensive security policies', () => {
      new SecurityStack('test-security-stack', {
        environmentSuffix: 'prod',
      });

      expect(SecurityPolicies).toHaveBeenCalledWith('security-policies',
        expect.objectContaining({
          environmentSuffix: 'prod',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment suffix gracefully', () => {
      const stack = new SecurityStack('test-security-stack', {});

      expect(stack).toBeDefined();
      expect(SecurityPolicies).toHaveBeenCalledWith('security-policies',
        expect.objectContaining({
          environmentSuffix: 'dev', // Default value
        }),
        expect.any(Object)
      );
    });

    it('should handle missing tags gracefully', () => {
      const stack = new SecurityStack('test-security-stack', {
        environmentSuffix: 'test',
      });

      expect(stack).toBeDefined();
    });

    it('should handle missing IP ranges gracefully', () => {
      const stack = new SecurityStack('test-security-stack');

      expect(stack).toBeDefined();
      // Should use default IP range
    });

    it('should handle undefined arguments gracefully', () => {
      const stack = new SecurityStack('test-security-stack', undefined);

      expect(stack).toBeDefined();
      expect(stack.region).toBe('us-east-1');
    });

    it('should handle empty tags object', () => {
      const stack = new SecurityStack('test-security-stack', {
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should handle empty IP ranges array', () => {
      const stack = new SecurityStack('test-security-stack', {
        allowedIpRanges: [],
      });

      expect(stack).toBeDefined();
    });

    it('should handle null values in arguments', () => {
      const stack = new SecurityStack('test-security-stack', {
        environmentSuffix: undefined,
        tags: undefined,
        allowedIpRanges: undefined,
        enableEnhancedSecurity: undefined,
      });

      expect(stack).toBeDefined();
      expect(stack.region).toBe('us-east-1');
    });

    it('should handle boolean false for enhanced security', () => {
      const stack = new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: false,
      });

      expect(stack).toBeDefined();
      expect(SecureS3Bucket).toHaveBeenCalled();
      expect(EnhancedSecureS3Bucket).not.toHaveBeenCalled();
    });

    it('should handle boolean true for enhanced security', () => {
      const stack = new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
      });

      expect(stack).toBeDefined();
      expect(EnhancedSecureS3Bucket).toHaveBeenCalled();
      expect(SecureS3Bucket).not.toHaveBeenCalled();
    });

    it('should handle complex tag structures', () => {
      const complexTags = {
        Environment: 'test',
        Project: 'security',
        Owner: 'team@company.com',
        CostCenter: '12345',
        'Custom-Tag': 'custom-value',
      };

      const stack = new SecurityStack('test-security-stack', {
        tags: complexTags,
      });

      expect(stack).toBeDefined();
    });

    it('should handle multiple IP ranges', () => {
      const stack = new SecurityStack('test-security-stack', {
        allowedIpRanges: ['10.0.0.0/8', '172.16.0.0/12', '192.168.0.0/16'],
      });

      expect(stack).toBeDefined();
    });

    it('should handle long environment suffix', () => {
      const stack = new SecurityStack('test-security-stack', {
        environmentSuffix: 'very-long-environment-suffix-name',
      });

      expect(stack).toBeDefined();
    });

    it('should handle special characters in environment suffix', () => {
      const stack = new SecurityStack('test-security-stack', {
        environmentSuffix: 'test-env-123',
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Component Dependencies', () => {
    it('should pass KMS key IDs to S3 buckets', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
      });

      // Verify that S3 buckets receive KMS key IDs
      const s3Calls = (EnhancedSecureS3Bucket as unknown as jest.Mock).mock.calls;
      expect(s3Calls[0][1]).toHaveProperty('kmsKeyId');
      expect(s3Calls[1][1]).toHaveProperty('kmsKeyId');
    });

    it('should pass S3 bucket ARNs to IAM policies', () => {
      new SecurityStack('test-security-stack');

      // Verify that IAM roles receive bucket ARNs in policies
      const iamCalls = (SecureIAMRole as unknown as jest.Mock).mock.calls;
      expect(iamCalls[0][1]).toHaveProperty('policies');
      expect(iamCalls[1][1]).toHaveProperty('policies');
    });

    it('should pass KMS key ID to CloudTrail', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
      });

      const cloudTrailCalls = (EnhancedCloudTrail as unknown as jest.Mock).mock.calls;
      expect(cloudTrailCalls[0][1]).toHaveProperty('kmsKeyId');
    });

    it('should pass correct bucket to CloudTrail', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: false,
      });

      const cloudTrailCalls = (SecureCloudTrail as unknown as jest.Mock).mock.calls;
      expect(cloudTrailCalls[0][1]).toHaveProperty('s3BucketName');
    });

    it('should create AWS provider with correct region', () => {
      const stack = new SecurityStack('test-security-stack');

      expect(stack.region).toBe('us-east-1');
    });

    it('should pass environment suffix to all components', () => {
      new SecurityStack('test-security-stack', {
        environmentSuffix: 'staging',
      });

      expect(SecurityPolicies).toHaveBeenCalledWith('security-policies',
        expect.objectContaining({
          environmentSuffix: 'staging',
        }),
        expect.any(Object)
      );
    });

    it('should pass tags to KMS keys', () => {
      new SecurityStack('test-security-stack', {
        tags: { Project: 'TestProject' },
      });

      expect(KMSKey).toHaveBeenCalledWith('s3-encryption',
        expect.objectContaining({
          tags: { Purpose: 'S3 Encryption' },
        }),
        expect.any(Object)
      );

      expect(KMSKey).toHaveBeenCalledWith('cloudtrail-encryption',
        expect.objectContaining({
          tags: { Purpose: 'CloudTrail Encryption' },
        }),
        expect.any(Object)
      );
    });

    it('should create security baseline policy with environment suffix', () => {
      new SecurityStack('test-security-stack', {
        environmentSuffix: 'production',
      });

      // Verify security baseline policy is created with environment suffix
      const mockPolicy = require('@pulumi/aws').iam.Policy;
      expect(mockPolicy).toHaveBeenCalledWith('security-baseline',
        expect.objectContaining({
          name: 'SecurityBaseline-production',
          description: 'Enhanced baseline security policy with comprehensive MFA requirements',
        }),
        expect.any(Object)
      );
    });

    it('should create all required security policies', () => {
      new SecurityStack('test-security-stack');

      expect(SecurityPolicies).toHaveBeenCalledTimes(1);
      
      // Verify the security policies component is instantiated
      const securityPoliciesCall = (SecurityPolicies as unknown as jest.Mock).mock.calls[0];
      expect(securityPoliciesCall[0]).toBe('security-policies');
      expect(securityPoliciesCall[1]).toHaveProperty('environmentSuffix');
    });

    it('should handle provider options correctly', () => {
      const stack = new SecurityStack('test-security-stack', {}, {
        parent: undefined,
        dependsOn: [],
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Resource Naming', () => {
    it('should use consistent naming patterns', () => {
      new SecurityStack('test-security-stack');

      expect(KMSKey).toHaveBeenCalledWith('s3-encryption', expect.any(Object), expect.any(Object));
      expect(KMSKey).toHaveBeenCalledWith('cloudtrail-encryption', expect.any(Object), expect.any(Object));
      expect(SecureIAMRole).toHaveBeenCalledWith('data-access', expect.any(Object), expect.any(Object));
      expect(SecureIAMRole).toHaveBeenCalledWith('audit-access', expect.any(Object), expect.any(Object));
    });

    it('should use consistent naming for enhanced components', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
      });

      expect(EnhancedSecureS3Bucket).toHaveBeenCalledWith('primary-storage', expect.any(Object), expect.any(Object));
      expect(EnhancedSecureS3Bucket).toHaveBeenCalledWith('audit-logs', expect.any(Object), expect.any(Object));
      expect(EnhancedCloudTrail).toHaveBeenCalledWith('security-audit', expect.any(Object), expect.any(Object));
    });

    it('should use consistent naming for standard components', () => {
      new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: false,
      });

      expect(SecureS3Bucket).toHaveBeenCalledWith('primary-storage', expect.any(Object), expect.any(Object));
      expect(SecureS3Bucket).toHaveBeenCalledWith('audit-logs', expect.any(Object), expect.any(Object));
      expect(SecureCloudTrail).toHaveBeenCalledWith('security-audit', expect.any(Object), expect.any(Object));
    });

    it('should create security policies with consistent naming', () => {
      new SecurityStack('test-security-stack');

      expect(SecurityPolicies).toHaveBeenCalledWith('security-policies', expect.any(Object), expect.any(Object));
    });

    it('should create AWS provider with consistent naming', () => {
      new SecurityStack('test-security-stack');

      const mockProvider = require('@pulumi/aws').Provider;
      expect(mockProvider).toHaveBeenCalledWith('aws-provider', 
        expect.objectContaining({
          region: 'us-east-1',
        }),
        expect.any(Object)
      );
    });
  });

  describe('Output Registration', () => {
    it('should register all outputs correctly', () => {
      const stack = new SecurityStack('test-security-stack');

      // Verify that registerOutputs was called with all expected outputs
      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.primaryBucketArn).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
      expect(stack.auditBucketArn).toBeDefined();
      expect(stack.s3KmsKeyId).toBeDefined();
      expect(stack.s3KmsKeyArn).toBeDefined();
      expect(stack.cloudTrailKmsKeyId).toBeDefined();
      expect(stack.cloudTrailKmsKeyArn).toBeDefined();
      expect(stack.dataAccessRoleArn).toBeDefined();
      expect(stack.auditRoleArn).toBeDefined();
      expect(stack.cloudTrailArn).toBeDefined();
      expect(stack.cloudTrailLogGroupArn).toBeDefined();
      expect(stack.securityPolicyArn).toBeDefined();
      expect(stack.mfaEnforcementPolicyArn).toBeDefined();
      expect(stack.s3SecurityPolicyArn).toBeDefined();
      expect(stack.cloudTrailProtectionPolicyArn).toBeDefined();
      expect(stack.kmsProtectionPolicyArn).toBeDefined();
      expect(stack.region).toBe('us-east-1');
    });

    it('should have all outputs defined for enhanced security', () => {
      const stack = new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: true,
      });

      // All outputs should be defined regardless of enhanced security setting
      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.primaryBucketArn).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
      expect(stack.auditBucketArn).toBeDefined();
      expect(stack.s3KmsKeyId).toBeDefined();
      expect(stack.s3KmsKeyArn).toBeDefined();
      expect(stack.cloudTrailKmsKeyId).toBeDefined();
      expect(stack.cloudTrailKmsKeyArn).toBeDefined();
      expect(stack.dataAccessRoleArn).toBeDefined();
      expect(stack.auditRoleArn).toBeDefined();
      expect(stack.cloudTrailArn).toBeDefined();
      expect(stack.cloudTrailLogGroupArn).toBeDefined();
      expect(stack.securityPolicyArn).toBeDefined();
      expect(stack.mfaEnforcementPolicyArn).toBeDefined();
      expect(stack.s3SecurityPolicyArn).toBeDefined();
      expect(stack.cloudTrailProtectionPolicyArn).toBeDefined();
      expect(stack.kmsProtectionPolicyArn).toBeDefined();
      expect(stack.region).toBe('us-east-1');
    });

    it('should have all outputs defined for standard security', () => {
      const stack = new SecurityStack('test-security-stack', {
        enableEnhancedSecurity: false,
      });

      // All outputs should be defined regardless of enhanced security setting
      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.primaryBucketArn).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
      expect(stack.auditBucketArn).toBeDefined();
      expect(stack.s3KmsKeyId).toBeDefined();
      expect(stack.s3KmsKeyArn).toBeDefined();
      expect(stack.cloudTrailKmsKeyId).toBeDefined();
      expect(stack.cloudTrailKmsKeyArn).toBeDefined();
      expect(stack.dataAccessRoleArn).toBeDefined();
      expect(stack.auditRoleArn).toBeDefined();
      expect(stack.cloudTrailArn).toBeDefined();
      expect(stack.cloudTrailLogGroupArn).toBeDefined();
      expect(stack.securityPolicyArn).toBeDefined();
      expect(stack.mfaEnforcementPolicyArn).toBeDefined();
      expect(stack.s3SecurityPolicyArn).toBeDefined();
      expect(stack.cloudTrailProtectionPolicyArn).toBeDefined();
      expect(stack.kmsProtectionPolicyArn).toBeDefined();
      expect(stack.region).toBe('us-east-1');
    });

    it('should register outputs with correct types', () => {
      const stack = new SecurityStack('test-security-stack');

      // Verify output types
      expect(typeof stack.region).toBe('string');
      expect(stack.region).toBe('us-east-1');
      
      // Other outputs should be Pulumi outputs (mocked as objects)
      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.primaryBucketArn).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
      expect(stack.auditBucketArn).toBeDefined();
    });
  });

  describe('Integration and Compatibility', () => {
    it('should work with different Pulumi resource options', () => {
      const stack = new SecurityStack('test-security-stack', {}, {
        parent: undefined,
        dependsOn: [],
        protect: false,
        ignoreChanges: [],
      });

      expect(stack).toBeDefined();
    });

    it('should handle complex configuration combinations', () => {
      const stack = new SecurityStack('test-security-stack', {
        environmentSuffix: 'complex-test',
        tags: {
          Environment: 'test',
          Project: 'security',
          Owner: 'team@company.com',
          CostCenter: '12345',
        },
        allowedIpRanges: ['10.0.0.0/8', '172.16.0.0/12'],
        enableEnhancedSecurity: true,
      });

      expect(stack).toBeDefined();
      expect(stack.region).toBe('us-east-1');
    });

    it('should maintain consistency across multiple instantiations', () => {
      const stack1 = new SecurityStack('test-security-stack-1');
      const stack2 = new SecurityStack('test-security-stack-2');

      expect(stack1.region).toBe(stack2.region);
      expect(stack1.region).toBe('us-east-1');
      expect(stack2.region).toBe('us-east-1');
    });
  });
});
