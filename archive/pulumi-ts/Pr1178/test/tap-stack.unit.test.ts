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
}));

// Mock the SecurityStack
jest.mock('../lib/stacks/security-stack', () => ({
  SecurityStack: jest.fn().mockImplementation(() => ({
    primaryBucketName: 'mock-primary-bucket',
    primaryBucketArn: 'arn:aws:s3:::mock-primary-bucket',
    auditBucketName: 'mock-audit-bucket',
    auditBucketArn: 'arn:aws:s3:::mock-audit-bucket',
    s3KmsKeyId: 'mock-s3-key-id',
    s3KmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/mock-s3-key',
    cloudTrailKmsKeyId: 'mock-cloudtrail-key-id',
    cloudTrailKmsKeyArn: 'arn:aws:kms:us-east-1:123456789012:key/mock-cloudtrail-key',
    dataAccessRoleArn: 'arn:aws:iam::123456789012:role/mock-data-access-role',
    auditRoleArn: 'arn:aws:iam::123456789012:role/mock-audit-role',
    cloudTrailArn: 'arn:aws:cloudtrail:us-east-1:123456789012:trail/mock-trail',
    cloudTrailLogGroupArn: 'arn:aws:logs:us-east-1:123456789012:log-group:/aws/cloudtrail/mock',
    securityPolicyArn: 'arn:aws:iam::123456789012:policy/mock-security-policy',
    mfaEnforcementPolicyArn: 'arn:aws:iam::123456789012:policy/mock-mfa-policy',
    ec2LifecyclePolicyArn: 'arn:aws:iam::123456789012:policy/mock-ec2-lifecycle-policy',
    s3SecurityPolicyArn: 'arn:aws:iam::123456789012:policy/mock-s3-policy',
    cloudTrailProtectionPolicyArn: 'arn:aws:iam::123456789012:policy/mock-cloudtrail-policy',
    kmsProtectionPolicyArn: 'arn:aws:iam::123456789012:policy/mock-kms-policy',
    region: 'us-east-1',
  })),
}));

import { TapStack } from '../lib/tap-stack';
import { SecurityStack } from '../lib/stacks/security-stack';

describe('TapStack Structure', () => {
  let stack: TapStack;

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic TapStack Creation', () => {
    it('should create TapStack with default parameters', () => {
      stack = new TapStack('test-tap-stack');

      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledTimes(1);
    });

    it('should create TapStack with custom parameters', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: 'prod',
        tags: { Environment: 'Production' },
        allowedIpRanges: ['10.0.0.0/8'],
        enableEnhancedSecurity: true,
      });

      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledWith('security-infrastructure', 
        expect.objectContaining({
          environmentSuffix: 'prod',
          tags: { Environment: 'Production' },
          allowedIpRanges: ['10.0.0.0/8'],
          enableEnhancedSecurity: true,
        }),
        expect.any(Object)
      );
    });

    it('should have all required outputs from SecurityStack', () => {
      stack = new TapStack('test-tap-stack');

      expect(stack.primaryBucketName).toBe('mock-primary-bucket');
      expect(stack.primaryBucketArn).toBe('arn:aws:s3:::mock-primary-bucket');
      expect(stack.auditBucketName).toBe('mock-audit-bucket');
      expect(stack.auditBucketArn).toBe('arn:aws:s3:::mock-audit-bucket');
      expect(stack.s3KmsKeyId).toBe('mock-s3-key-id');
      expect(stack.s3KmsKeyArn).toBe('arn:aws:kms:us-east-1:123456789012:key/mock-s3-key');
      expect(stack.cloudTrailKmsKeyId).toBe('mock-cloudtrail-key-id');
      expect(stack.cloudTrailKmsKeyArn).toBe('arn:aws:kms:us-east-1:123456789012:key/mock-cloudtrail-key');
      expect(stack.dataAccessRoleArn).toBe('arn:aws:iam::123456789012:role/mock-data-access-role');
      expect(stack.auditRoleArn).toBe('arn:aws:iam::123456789012:role/mock-audit-role');
      // CloudTrail test expectations
      expect(stack.cloudTrailArn).toBe('arn:aws:cloudtrail:us-east-1:123456789012:trail/mock-trail');
      expect(stack.cloudTrailLogGroupArn).toBe('arn:aws:logs:us-east-1:123456789012:log-group:/aws/cloudtrail/mock');
      expect(stack.securityPolicyArn).toBe('arn:aws:iam::123456789012:policy/mock-security-policy');
      expect(stack.mfaEnforcementPolicyArn).toBe('arn:aws:iam::123456789012:policy/mock-mfa-policy');
      expect(stack.ec2LifecyclePolicyArn).toBe('arn:aws:iam::123456789012:policy/mock-ec2-lifecycle-policy');
      expect(stack.s3SecurityPolicyArn).toBe('arn:aws:iam::123456789012:policy/mock-s3-policy');
      expect(stack.region).toBe('us-east-1');
    });
  });

  describe('Error Handling', () => {
    it('should handle undefined arguments gracefully', () => {
      stack = new TapStack('test-tap-stack', undefined);

      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledTimes(1);
    });

    it('should handle empty arguments gracefully', () => {
      stack = new TapStack('test-tap-stack', {});

      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledTimes(1);
    });

    it('should handle null values in arguments', () => {
      stack = new TapStack('test-tap-stack', {
        environmentSuffix: undefined,
        tags: undefined,
        allowedIpRanges: undefined,
        enableEnhancedSecurity: undefined,
      });

      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Component Integration', () => {
    it('should pass arguments correctly to SecurityStack', () => {
      const args = {
        environmentSuffix: 'integration-test',
        tags: { Project: 'TAP', Environment: 'Test' },
        allowedIpRanges: ['192.168.1.0/24', '10.0.0.0/8'],
        enableEnhancedSecurity: false,
      };

      stack = new TapStack('test-tap-stack', args);

      expect(SecurityStack).toHaveBeenCalledWith('security-infrastructure', args, expect.any(Object));
    });

    it('should work with different Pulumi resource options', () => {
      stack = new TapStack('test-tap-stack', {}, {
        parent: undefined,
        dependsOn: [],
        protect: false,
      });

      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledTimes(1);
    });
  });

  describe('Output Registration', () => {
    it('should register all outputs correctly', () => {
      stack = new TapStack('test-tap-stack');

      // Verify that all outputs are accessible
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
      expect(stack.ec2LifecyclePolicyArn).toBeDefined();
      expect(stack.s3SecurityPolicyArn).toBeDefined();
      expect(stack.cloudTrailProtectionPolicyArn).toBeDefined();
      expect(stack.kmsProtectionPolicyArn).toBeDefined();
      expect(stack.region).toBeDefined();
    });

    it('should have correct region set to us-east-1', () => {
      stack = new TapStack('test-tap-stack');

      expect(stack.region).toBe('us-east-1');
    });
  });

  describe('with props', () => {
    it('instantiates successfully with production environment', () => {
      stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'prod',
          Project: 'test'
        }
      });

      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledWith('security-infrastructure', 
        expect.objectContaining({
          environmentSuffix: 'prod',
          tags: {
            Environment: 'prod',
            Project: 'test'
          }
        }),
        expect.any(Object)
      );
    });

    it('has security infrastructure outputs', () => {
      stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'prod',
          Project: 'test'
        }
      });

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
      expect(stack.ec2LifecyclePolicyArn).toBeDefined();
      expect(stack.s3SecurityPolicyArn).toBeDefined();
      expect(stack.region).toBeDefined();
    });
  });

  describe('with default values', () => {
    it('instantiates successfully with defaults', () => {
      stack = new TapStack('TestTapStackDefault', {});

      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledTimes(1);
    });

    it('uses default environment suffix', () => {
      stack = new TapStack('TestTapStackDefault', {});

      // The stack should use 'dev' as default environment suffix
      expect(stack).toBeDefined();
      expect(SecurityStack).toHaveBeenCalledWith('security-infrastructure', 
        expect.objectContaining({
          environmentSuffix: 'dev',
          tags: {},
          allowedIpRanges: undefined,
          enableEnhancedSecurity: undefined,
        }), 
        expect.any(Object)
      );
    });

    it('has all required security outputs', () => {
      stack = new TapStack('TestTapStackDefault', {});

      expect(stack.primaryBucketName).toBeDefined();
      expect(stack.auditBucketName).toBeDefined();
      expect(stack.s3KmsKeyId).toBeDefined();
      expect(stack.cloudTrailKmsKeyId).toBeDefined();
      expect(stack.dataAccessRoleArn).toBeDefined();
      expect(stack.auditRoleArn).toBeDefined();
      expect(stack.cloudTrailArn).toBeDefined();
      expect(stack.securityPolicyArn).toBeDefined();
      expect(stack.region).toEqual('us-east-1');
    });
  });
});
