import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (
    args: pulumi.runtime.MockResourceArgs
  ): { id: string; state: any } => {
    return {
      id: args.inputs.name ? `${args.name}-${args.inputs.name}` : args.name,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return { name: 'us-east-1' };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return { accountId: '123456789012' };
    }
    return args.inputs;
  },
});

describe('TapStack Security Infrastructure', () => {
  let stack: TapStack;

  beforeAll(() => {
    // Create a new stack for testing
    stack = new TapStack('test-stack', {
      serviceName: 'test-service',
      environmentSuffix: 'test',
      email: 'test@example.com',
      replicaRegion: 'us-west-2',
      tags: { TestTag: 'TestValue' },
    });
  });

  describe('Stack Instantiation', () => {
    it('should instantiate successfully', () => {
      expect(stack).toBeDefined();
    });

    it('should be a ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });

  describe('KMS Key Hierarchy', () => {
    it('should export PII KMS key ARN', done => {
      pulumi.all([stack.piiKmsKeyArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should export Financial KMS key ARN', done => {
      pulumi.all([stack.financialKmsKeyArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });

    it('should export General KMS key ARN', done => {
      pulumi.all([stack.generalKmsKeyArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('IAM Resources', () => {
    it('should export cross-account role ARN', done => {
      pulumi.all([stack.crossAccountRoleArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('S3 Buckets', () => {
    it('should export financial bucket name', done => {
      pulumi.all([stack.financialBucketName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should export PII bucket name', done => {
      pulumi.all([stack.piiBucketName]).apply(([name]) => {
        expect(name).toBeDefined();
        expect(typeof name).toBe('string');
        done();
      });
    });

    it('should include account ID in bucket names', done => {
      pulumi
        .all([stack.financialBucketName, stack.piiBucketName])
        .apply(([financial, pii]) => {
          // Bucket names should include account ID
          expect(financial).toContain('123456789012');
          expect(pii).toContain('123456789012');
          done();
        });
    });
  });

  describe('SNS Configuration', () => {
    it('should export security alert topic ARN', done => {
      pulumi.all([stack.securityAlertTopicArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('Lambda Functions', () => {
    it('should export remediation lambda ARN', done => {
      pulumi.all([stack.remediationLambdaArn]).apply(([arn]) => {
        expect(arn).toBeDefined();
        expect(typeof arn).toBe('string');
        done();
      });
    });
  });

  describe('Compliance Report', () => {
    it('should export compliance report', done => {
      pulumi.all([stack.complianceReport]).apply(([report]) => {
        expect(report).toBeDefined();
        expect(typeof report).toBe('string');
        done();
      });
    });

    it('should have all required compliance controls', done => {
      pulumi.all([stack.complianceReport]).apply(([report]) => {
        const parsed = JSON.parse(report);
        expect(parsed).toHaveProperty('kmsRotation', 'ENABLED');
        expect(parsed).toHaveProperty('multiRegionReplication', 'ENABLED');
        expect(parsed).toHaveProperty('iamPermissionBoundaries', 'CONFIGURED');
        expect(parsed).toHaveProperty('secretsAutoRotation', '30_DAYS');
        expect(parsed).toHaveProperty('s3TlsEnforcement', 'TLS_1_2_PLUS');
        expect(parsed).toHaveProperty('crossAccountMfa', 'REQUIRED');
        expect(parsed).toHaveProperty('logEncryption', 'KMS_ENCRYPTED');
        expect(parsed).toHaveProperty('logRetention', '365_DAYS');
        expect(parsed).toHaveProperty('cloudTrailProtection', 'ENABLED');
        expect(parsed).toHaveProperty('configRules', 'CIS_BENCHMARKS');
        expect(parsed).toHaveProperty('lambdaIsolation', 'VPC_NO_INTERNET');
        expect(parsed).toHaveProperty('snsEncryption', 'KMS_ENCRYPTED');
        done();
      });
    });
  });

  describe('Stack Configuration', () => {
    it('should accept environment suffix', () => {
      const customStack = new TapStack('custom-stack', {
        serviceName: 'custom-service',
        environmentSuffix: 'production',
      });
      expect(customStack).toBeDefined();
    });

    it('should accept service name', () => {
      const customStack = new TapStack('custom-stack', {
        serviceName: 'my-financial-service',
        environmentSuffix: 'dev',
      });
      expect(customStack).toBeDefined();
    });

    it('should accept optional email', () => {
      const customStack = new TapStack('custom-stack', {
        serviceName: 'test-service',
        email: 'alerts@example.com',
      });
      expect(customStack).toBeDefined();
    });

    it('should accept replica region', () => {
      const customStack = new TapStack('custom-stack', {
        serviceName: 'test-service',
        replicaRegion: 'eu-west-1',
      });
      expect(customStack).toBeDefined();
    });

    it('should accept custom tags', () => {
      const customStack = new TapStack('custom-stack', {
        serviceName: 'test-service',
        tags: {
          CustomTag: 'CustomValue',
          Team: 'SecurityTeam',
        },
      });
      expect(customStack).toBeDefined();
    });
  });

  describe('Default Values', () => {
    it('should use default values when none provided', () => {
      const defaultStack = new TapStack('default-stack', {
        serviceName: 'test-service',
      });
      expect(defaultStack).toBeDefined();
      // Default environment suffix should be 'dev'
      // Default replica region should be 'us-west-2'
    });
  });

  describe('Resource Naming', () => {
    it('should include service name in outputs', done => {
      pulumi
        .all([stack.financialBucketName, stack.piiBucketName])
        .apply(([financial, pii]) => {
          expect(financial).toContain('test-service');
          expect(pii).toContain('test-service');
          done();
        });
    });

    it('should include environment suffix in outputs', done => {
      pulumi
        .all([stack.financialBucketName, stack.piiBucketName])
        .apply(([financial, pii]) => {
          expect(financial).toContain('test');
          expect(pii).toContain('test');
          done();
        });
    });
  });
});

describe('TapStack with minimal configuration', () => {
  it('should instantiate with only service name', () => {
    const minimalStack = new TapStack('minimal-stack', {
      serviceName: 'minimal-service',
    });
    expect(minimalStack).toBeDefined();
  });

  it('should have all required outputs even with minimal config', done => {
    const minimalStack = new TapStack('minimal-stack', {
      serviceName: 'minimal-service',
    });

    pulumi
      .all([
        minimalStack.piiKmsKeyArn,
        minimalStack.financialKmsKeyArn,
        minimalStack.generalKmsKeyArn,
        minimalStack.crossAccountRoleArn,
        minimalStack.securityAlertTopicArn,
        minimalStack.complianceReport,
      ])
      .apply(([pii, financial, general, role, topic, report]) => {
        expect(pii).toBeDefined();
        expect(financial).toBeDefined();
        expect(general).toBeDefined();
        expect(role).toBeDefined();
        expect(topic).toBeDefined();
        expect(report).toBeDefined();
        done();
      });
  });
});
