/**
 * JavaScript Unit Tests for HIPAA-Compliant Healthcare Data Pipeline Stack
 *
 * This test suite validates basic stack functionality using mocked AWS/Pulumi resources.
 */

// Mock must be declared before any other code
jest.mock('@pulumi/pulumi', () => {
  const actual = jest.requireActual('@pulumi/pulumi');
  return {
    ...actual,
    ComponentResource: jest.fn().mockImplementation(function() {
      this.registerOutputs = jest.fn();
    }),
    Output: {
      create: jest.fn((val) => val),
      isInstance: jest.fn(() => false),
    },
    output: jest.fn((val) => val),
    interpolate: jest.fn((...args) => {
      if (args.length === 1 && Array.isArray(args[0])) {
        return args[0].join('');
      }
      return args.join('');
    }),
    all: jest.fn((args) => ({
      apply: (fn) => fn(Array.isArray(args) ? args : [args]),
    })),
    secret: jest.fn((val) => val),
  };
});

jest.mock('@pulumi/aws', () => ({
  getCallerIdentity: jest.fn(() => Promise.resolve({ accountId: '123456789012' })),
  getRegion: jest.fn(() => Promise.resolve({ name: 'us-east-1' })),
  kms: {
    Key: jest.fn().mockReturnValue({ id: 'mock-kms-key' }),
    Alias: jest.fn().mockReturnValue({ id: 'mock-kms-alias' }),
  },
  cloudwatch: {
    LogGroup: jest.fn().mockReturnValue({ id: 'mock-log-group' }),
    MetricAlarm: jest.fn()
      .mockReturnValueOnce({ id: 'mock-alarm-1' })
      .mockReturnValueOnce({ id: 'mock-alarm-2' }),
  },
  ec2: {
    Vpc: jest.fn().mockReturnValue({ id: 'mock-vpc' }),
    Subnet: jest.fn()
      .mockReturnValueOnce({ id: 'mock-subnet-1' })
      .mockReturnValueOnce({ id: 'mock-subnet-2' }),
    SecurityGroup: jest.fn().mockReturnValue({ id: 'mock-sg' }),
  },
  rds: {
    SubnetGroup: jest.fn().mockReturnValue({ id: 'mock-subnet-group' }),
    ParameterGroup: jest.fn().mockReturnValue({ id: 'mock-param-group' }),
    Instance: jest.fn().mockReturnValue({ id: 'mock-rds-instance' }),
  },
  kinesis: {
    Stream: jest.fn().mockReturnValue({ id: 'mock-stream' }),
  },
  iam: {
    Role: jest.fn().mockReturnValue({ id: 'mock-role' }),
    RolePolicy: jest.fn().mockReturnValue({ id: 'mock-policy' }),
  },
}));

// Import after mocking
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack.mjs';

// Test Suite
describe('HIPAA-Compliant Healthcare Data Pipeline Stack (JavaScript)', () => {

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Stack Instantiation', () => {
    it('should create stack with default configuration', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should create stack with custom environment suffix', () => {
      const stack = new TapStack('test-stack', { environmentSuffix: 'prod' });
      expect(stack).toBeDefined();
    });

    it('should create stack with custom tags', () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'staging',
        tags: { Project: 'Healthcare' }
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty configuration', () => {
      expect(() => {
        new TapStack('test-stack', {});
      }).not.toThrow();
    });
  });

  describe('AWS Resource Creation', () => {
    it('should create KMS key', () => {
      new TapStack('test-stack', {});
      expect(aws.kms.Key).toHaveBeenCalled();
    });

    it('should create KMS alias', () => {
      new TapStack('test-stack', {});
      expect(aws.kms.Alias).toHaveBeenCalled();
    });

    it('should create CloudWatch log group', () => {
      new TapStack('test-stack', {});
      expect(aws.cloudwatch.LogGroup).toHaveBeenCalled();
    });

    it('should create VPC', () => {
      new TapStack('test-stack', {});
      expect(aws.ec2.Vpc).toHaveBeenCalled();
    });

    it('should create subnets', () => {
      new TapStack('test-stack', {});
      expect(aws.ec2.Subnet).toHaveBeenCalledTimes(2);
    });

    it('should create security group', () => {
      new TapStack('test-stack', {});
      expect(aws.ec2.SecurityGroup).toHaveBeenCalled();
    });

    it('should create RDS subnet group', () => {
      new TapStack('test-stack', {});
      expect(aws.rds.SubnetGroup).toHaveBeenCalled();
    });

    it('should create RDS parameter group', () => {
      new TapStack('test-stack', {});
      expect(aws.rds.ParameterGroup).toHaveBeenCalled();
    });

    it('should create RDS instance', () => {
      new TapStack('test-stack', {});
      expect(aws.rds.Instance).toHaveBeenCalled();
    });

    it('should create Kinesis stream', () => {
      new TapStack('test-stack', {});
      expect(aws.kinesis.Stream).toHaveBeenCalled();
    });

    it('should create IAM role', () => {
      new TapStack('test-stack', {});
      expect(aws.iam.Role).toHaveBeenCalled();
    });

    it('should create IAM role policy', () => {
      new TapStack('test-stack', {});
      expect(aws.iam.RolePolicy).toHaveBeenCalled();
    });

    it('should create CloudWatch alarms', () => {
      new TapStack('test-stack', {});
      expect(aws.cloudwatch.MetricAlarm).toHaveBeenCalledTimes(2);
    });
  });

  describe('Stack Configuration', () => {
    it('should accept environment suffix parameter', () => {
      expect(() => {
        new TapStack('test-stack', { environmentSuffix: 'dev' });
      }).not.toThrow();
    });

    it('should accept tags parameter', () => {
      expect(() => {
        new TapStack('test-stack', { tags: { Environment: 'test' } });
      }).not.toThrow();
    });

    it('should handle multiple configurations', () => {
      expect(() => {
        new TapStack('test-stack', {
          environmentSuffix: 'staging',
          tags: { Owner: 'team', Project: 'healthcare' }
        });
      }).not.toThrow();
    });
  });

  describe('Error Handling', () => {
    it('should handle missing environment suffix gracefully', () => {
      const stack = new TapStack('test-stack', {});
      expect(stack).toBeDefined();
    });
  });

  describe('Stack Lifecycle', () => {
    it('should create multiple stacks independently', () => {
      const stack1 = new TapStack('stack-1', { environmentSuffix: 'dev' });
      jest.clearAllMocks();

      // Re-setup mocks for second stack
      aws.kms.Key = jest.fn().mockReturnValue({ id: 'mock-kms-key' });
      aws.kms.Alias = jest.fn().mockReturnValue({ id: 'mock-kms-alias' });

      const stack2 = new TapStack('stack-2', { environmentSuffix: 'prod' });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
    });

    it('should execute without errors for different environments', () => {
      ['dev', 'staging', 'prod'].forEach(env => {
        jest.clearAllMocks();
        expect(() => {
          new TapStack('test-stack', { environmentSuffix: env });
        }).not.toThrow();
      });
    });
  });
});
