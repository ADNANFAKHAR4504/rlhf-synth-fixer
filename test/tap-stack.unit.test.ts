import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Enable Pulumi mocking
jest.mock('@pulumi/pulumi');
jest.mock('@pulumi/aws');

// Set up mocks before any tests run
beforeAll(() => {
  // Mock Pulumi runtime behavior
  (pulumi as any).all = jest
    .fn()
    .mockImplementation((values: any[]) => ({
      promise: () => Promise.resolve(values),
      apply: (fn: any) => fn(values),
    }));
  (pulumi as any).Output = jest.fn().mockImplementation((value: any) => ({
    promise: () => Promise.resolve(value),
    apply: (fn: any) => fn(value),
  }));
  (pulumi as any).output = jest.fn().mockImplementation((value: any) => ({
    promise: () => Promise.resolve(value),
    apply: (fn: any) => fn(value),
    then: (fn: any) => fn(value),
  }));
  (pulumi as any).interpolate = jest.fn().mockImplementation((strings: any, ...values: any[]) => {
    const result = strings.reduce((acc: string, str: string, i: number) => {
      return acc + str + (values[i] !== undefined ? String(values[i]) : '');
    }, '');
    return {
      promise: () => Promise.resolve(result),
      apply: (fn: any) => fn(result),
    };
  });
  (pulumi as any).ComponentResource = class {
    constructor(type: string, name: string, args: any, opts: any) {}
    registerOutputs(outputs: any) {}
  };

  // Mock AWS SDK getRegion function
  (aws as any).getRegion = jest.fn().mockResolvedValue({
    name: 'us-east-2',
    id: 'us-east-2',
  });

  // Mock AWS resource constructors to return objects with required properties
  const mockResource = (name: string) => ({
    id: `${name}-id`,
    arn: `arn:aws:service:us-east-2:123456789012:${name}`,
    name: `${name}-name`,
    url: `https://${name}.amazonaws.com`,
  });

  Object.keys(aws).forEach((key) => {
    if (typeof (aws as any)[key] === 'object') {
      Object.keys((aws as any)[key]).forEach((resourceKey) => {
        if (typeof (aws as any)[key][resourceKey] === 'function') {
          (aws as any)[key][resourceKey] = jest.fn().mockImplementation((name: string) => mockResource(name));
        }
      });
    }
  });
});

describe('TapStack Structure', () => {
  let stack: TapStack;

  describe('with props', () => {
    beforeAll(() => {
      stack = new TapStack('TestTapStackWithProps', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'prod',
          Team: 'platform',
        },
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
    });

    it('exports required outputs', () => {
      expect(stack.apiUrl).toBeDefined();
      expect(stack.tableName).toBeDefined();
      expect(stack.topicArn).toBeDefined();
    });

    it('uses custom environment suffix in resource names', () => {
      // Test that KMS key is created with prod suffix
      expect(aws.kms.Key).toHaveBeenCalled();
      const kmsCall = (aws.kms.Key as unknown as jest.Mock).mock.calls[0];
      expect(kmsCall[0]).toContain('prod');
    });
  });

  describe('with default values', () => {
    let defaultStack: TapStack;

    beforeAll(() => {
      // Clear previous mock calls
      jest.clearAllMocks();
      defaultStack = new TapStack('TestTapStackDefault', {});
    });

    it('instantiates successfully', () => {
      expect(defaultStack).toBeDefined();
    });

    it('uses default environment suffix in resource names', () => {
      // Test that VPC is created with dev suffix (default)
      expect(aws.ec2.Vpc).toHaveBeenCalled();
      const vpcCall = (aws.ec2.Vpc as unknown as jest.Mock).mock.calls[0];
      expect(vpcCall[0]).toContain('dev');
    });
  });
});
