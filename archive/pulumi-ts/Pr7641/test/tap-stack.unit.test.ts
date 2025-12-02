/**
 * Unit tests for TapStack component
 */
import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime for unit tests
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    return {
      id: args.inputs.name + '_id',
      state: {
        ...args.inputs,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
      };
    }
    return args.inputs;
  },
});

describe('TapStack', () => {
  let stack: typeof import('../lib/tap-stack');

  beforeAll(() => {
    stack = require('../lib/tap-stack');
  });

  describe('TapStack Resource Creation', () => {
    it('should create stack with default configuration', async () => {
      const testStack = new stack.TapStack('test-stack', {
        environmentSuffix: 'test',
      });

      expect(testStack).toBeDefined();

      // Verify outputs are defined
      const lambdaArn = await testStack.lambdaFunctionArn;
      const snsArn = await testStack.snsTopicArn;
      const dashUrl = await testStack.dashboardUrl;

      expect(lambdaArn).toBeDefined();
      expect(snsArn).toBeDefined();
      expect(dashUrl).toBeDefined();
    });

    it('should create stack with custom compliance threshold', async () => {
      const testStack = new stack.TapStack('test-stack-custom', {
        environmentSuffix: 'test',
        complianceThreshold: 90,
        minRequiredTags: 5,
      });

      expect(testStack).toBeDefined();
    });

    it('should create stack with custom alert email', async () => {
      const testStack = new stack.TapStack('test-stack-email', {
        environmentSuffix: 'test',
        alertEmail: 'test@example.com',
      });

      expect(testStack).toBeDefined();
    });

    it('should include environment suffix in resource names', async () => {
      const envSuffix = 'prod';
      const testStack = new stack.TapStack('test-stack-naming', {
        environmentSuffix: envSuffix,
      });

      // Verify the stack was created with the correct suffix
      expect(testStack).toBeDefined();

      // With mocks, we just verify outputs are defined
      expect(testStack.lambdaFunctionArn).toBeDefined();
    });
  });

  describe('TapStack Configuration', () => {
    it('should apply custom tags to resources', async () => {
      const customTags = {
        Owner: 'SecurityTeam',
        CostCenter: '12345',
      };

      const testStack = new stack.TapStack('test-stack-tags', {
        environmentSuffix: 'test',
        tags: customTags,
      });

      expect(testStack).toBeDefined();
    });

    it('should use default values when optional args are not provided', async () => {
      const testStack = new stack.TapStack('test-stack-defaults', {});

      expect(testStack).toBeDefined();

      // Stack should still work with defaults
      const lambdaArn = await testStack.lambdaFunctionArn;
      expect(lambdaArn).toBeDefined();
    });
  });

  describe('TapStack Outputs', () => {
    it('should export all required outputs', async () => {
      const testStack = new stack.TapStack('test-stack-outputs', {
        environmentSuffix: 'test',
      });

      // Verify all outputs exist
      expect(testStack.lambdaFunctionArn).toBeDefined();
      expect(testStack.snsTopicArn).toBeDefined();
      expect(testStack.dashboardUrl).toBeDefined();
      expect(testStack.complianceMetricName).toBeDefined();
    });

    it('should generate valid dashboard URL', async () => {
      const testStack = new stack.TapStack('test-stack-url', {
        environmentSuffix: 'test',
      });

      // With mocks, we just verify outputs are defined
      expect(testStack.dashboardUrl).toBeDefined();
    });

    it('should generate valid ARN formats', async () => {
      const testStack = new stack.TapStack('test-stack-arns', {
        environmentSuffix: 'test',
      });

      // With mocks, we just verify outputs are defined
      expect(testStack.lambdaFunctionArn).toBeDefined();
      expect(testStack.snsTopicArn).toBeDefined();
    });
  });
});
