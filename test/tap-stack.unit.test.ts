import { TapStack } from '../lib/tap-stack';

// Mock Pulumi modules
jest.mock('@pulumi/pulumi', () => {
  const actual = jest.requireActual('@pulumi/pulumi');
  return {
    ...actual,
    ComponentResource: class {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      constructor(type: string, name: string, args: unknown, opts?: unknown) {
        // Mock constructor
      }
      registerOutputs() {}
    },
    Output: {
      create: (value: unknown) => ({
        apply: (fn: (v: unknown) => unknown) => fn(value),
      }),
    },
    all: (values: unknown[]) => ({
      apply: (fn: (...args: unknown[]) => unknown) => fn(...values),
    }),
    Config: jest.fn().mockImplementation(() => ({
      get: jest.fn().mockReturnValue('test'),
      require: jest.fn().mockReturnValue('test'),
    })),
  };
});

jest.mock('@pulumi/aws', () => ({
  s3: {
    Bucket: jest.fn().mockImplementation(() => ({
      bucket: 'compliance-reports-test',
      arn: 'arn:aws:s3:::compliance-reports-test',
    })),
  },
  iam: {
    Role: jest.fn().mockImplementation(() => ({
      id: 'test-role-id',
      arn: 'arn:aws:iam::123456789012:role/test-role',
    })),
    RolePolicy: jest.fn().mockImplementation(() => ({
      id: 'test-policy-id',
    })),
  },
  lambda: {
    Function: jest.fn().mockImplementation(() => ({
      arn: 'arn:aws:lambda:us-east-1:123456789012:function:compliance-scanner-test',
      name: 'compliance-scanner-test',
    })),
    Runtime: {
      NodeJS20dX: 'nodejs20.x',
    },
  },
  cloudwatch: {
    LogGroup: jest.fn().mockImplementation(() => ({
      name: '/aws/lambda/compliance-scanner-test',
    })),
  },
}));

describe('TapStack', () => {
  it('should create a TapStack with default environmentSuffix', () => {
    const stack = new TapStack('test-stack', {});

    expect(stack).toBeDefined();
    expect(stack.reportBucketName).toBeDefined();
    expect(stack.complianceFunctionArn).toBeDefined();
    expect(stack.complianceFunctionName).toBeDefined();
  });

  it('should create a TapStack with custom environmentSuffix', () => {
    const stack = new TapStack('test-stack', {
      environmentSuffix: 'prod',
    });

    expect(stack).toBeDefined();
    expect(stack.reportBucketName).toBeDefined();
    expect(stack.complianceFunctionArn).toBeDefined();
    expect(stack.complianceFunctionName).toBeDefined();
  });

  it('should create a TapStack with custom tags', () => {
    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Project: 'TestProject',
        Owner: 'TestOwner',
      },
    });

    expect(stack).toBeDefined();
    expect(stack.reportBucketName).toBeDefined();
    expect(stack.complianceFunctionArn).toBeDefined();
    expect(stack.complianceFunctionName).toBeDefined();
  });

  it('should expose required outputs', () => {
    const stack = new TapStack('test-stack', {
      environmentSuffix: 'test',
    });

    expect(stack.reportBucketName).toBeDefined();
    expect(stack.complianceFunctionArn).toBeDefined();
    expect(stack.complianceFunctionName).toBeDefined();
  });
});
