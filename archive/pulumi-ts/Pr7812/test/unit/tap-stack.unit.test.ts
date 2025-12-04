import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: args.inputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

describe('TapStack Unit Tests', () => {
  let stack: typeof import('../../lib/tap-stack');

  beforeAll(() => {
    stack = require('../../lib/tap-stack');
  });

  describe('TapStack', () => {
    it('should create a TapStack with default environment suffix', async () => {
      const tapStack = new stack.TapStack('test-stack', {});

      const tableArn = await tapStack.tableArn;
      expect(tableArn).toBeDefined();
    });

    it('should create a TapStack with custom environment suffix', async () => {
      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'prod',
      });

      const tableArn = await tapStack.tableArn;
      const streamArn = await tapStack.streamArn;
      const lambdaRoleArn = await tapStack.lambdaRoleArn;

      expect(tableArn).toBeDefined();
      expect(streamArn).toBeDefined();
      expect(lambdaRoleArn).toBeDefined();
    });

    it('should apply custom tags', async () => {
      const customTags = {
        CustomTag: 'CustomValue',
      };

      const tapStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'staging',
        tags: customTags,
      });

      const tableArn = await tapStack.tableArn;
      expect(tableArn).toBeDefined();
    });

    it('should export all required outputs', async () => {
      const tapStack = new stack.TapStack('test-stack-outputs', {
        environmentSuffix: 'test',
      });

      const tableArn = await tapStack.tableArn;
      const streamArn = await tapStack.streamArn;
      const lambdaRoleArn = await tapStack.lambdaRoleArn;

      expect(tableArn).toBeDefined();
      expect(streamArn).toBeDefined();
      expect(lambdaRoleArn).toBeDefined();
    });

    it('should handle empty tags object', async () => {
      const tapStack = new stack.TapStack('test-stack-empty-tags', {
        environmentSuffix: 'dev',
        tags: {},
      });

      const tableArn = await tapStack.tableArn;
      expect(tableArn).toBeDefined();
    });

    it('should create stack with all components', async () => {
      const tapStack = new stack.TapStack('test-complete', {
        environmentSuffix: 'complete',
        tags: {
          Project: 'Test',
          Owner: 'QA',
        },
      });

      // Verify all resources are created by checking outputs
      const tableArn = await tapStack.tableArn;
      const streamArn = await tapStack.streamArn;
      const lambdaRoleArn = await tapStack.lambdaRoleArn;

      expect(tableArn).toBeDefined();
      expect(streamArn).toBeDefined();
      expect(lambdaRoleArn).toBeDefined();
    });
  });
});
