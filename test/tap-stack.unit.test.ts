import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.name + '_id',
      state: args.inputs,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: typeof import('../lib/tap-stack');

  beforeAll(async () => {
    stack = await import('../lib/tap-stack');
  });

  it('should create stack with correct resources', async () => {
    const tapStack = new stack.TapStack('test-stack', {
      environmentSuffix: 'test',
      tags: {
        Environment: 'test',
        Owner: 'test-owner',
        CostCenter: 'test-cc',
      },
    });

    expect(tapStack).toBeDefined();
  });

  it('should export rdsEndpoint', async () => {
    const tapStack = new stack.TapStack('test-stack-outputs', {
      environmentSuffix: 'test',
    });

    expect(tapStack.rdsEndpoint).toBeDefined();
  });

  it('should export backupBucketName', async () => {
    const tapStack = new stack.TapStack('test-stack-bucket', {
      environmentSuffix: 'test',
    });

    expect(tapStack.backupBucketName).toBeDefined();
  });

  it('should export snsTopicArn', async () => {
    const tapStack = new stack.TapStack('test-stack-sns', {
      environmentSuffix: 'test',
    });

    expect(tapStack.snsTopicArn).toBeDefined();
  });
});
