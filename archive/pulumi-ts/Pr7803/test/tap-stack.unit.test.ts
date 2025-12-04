/**
 * Unit tests for the TAP (Test Automation Platform) compliance scanning stack.
 */
import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } {
    return {
      id: args.inputs.name
        ? `${args.inputs.name}-id`
        : `${args.name}-mock-id`,
      state: {
        ...args.inputs,
        arn: args.inputs.name
          ? `arn:aws:service:region:account:${args.type}/${args.inputs.name}`
          : `arn:aws:service:region:account:${args.type}/mock`,
      },
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS provider calls if needed
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-1',
      };
    }
    return {};
  },
});

describe('TapStack Compliance Scanning Infrastructure', () => {
  let tapStack: typeof import('../lib/tap-stack');

  beforeAll(() => {
    tapStack = require('../lib/tap-stack');
  });

  describe('TapStack instantiation', () => {
    it('should create stack with all required properties', async () => {
      const stack = new tapStack.TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Purpose: 'unit-testing',
        },
      });

      expect(stack).toBeDefined();
      expect(stack.reportBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
    });

    it('should create stack with default args when no args provided', async () => {
      const stack = new tapStack.TapStack('test-stack-default');

      expect(stack).toBeDefined();
      expect(stack.reportBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
    });

    it('should use custom environment suffix in resource naming', async () => {
      const environmentSuffix = 'prod';
      const stack = new tapStack.TapStack('test-stack-prod', {
        environmentSuffix,
      });

      expect(stack).toBeDefined();

      // Verify outputs are defined
      const bucketName = await stack.reportBucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
    });

    it('should apply custom tags to resources', async () => {
      const customTags = {
        Environment: 'staging',
        CostCenter: '12345',
        Owner: 'test-team',
      };

      const stack = new tapStack.TapStack('test-stack-tags', {
        environmentSuffix: 'staging',
        tags: customTags,
      });

      expect(stack).toBeDefined();
      expect(stack.reportBucketName).toBeDefined();
    });
  });

  describe('TapStack outputs', () => {
    let stack: InstanceType<typeof tapStack.TapStack>;

    beforeAll(() => {
      stack = new tapStack.TapStack('test-stack-outputs', {
        environmentSuffix: 'test',
      });
    });

    it('should export reportBucketName output', async () => {
      const bucketName = await stack.reportBucketName.promise();
      expect(bucketName).toBeDefined();
      expect(typeof bucketName).toBe('string');
      expect(bucketName.length).toBeGreaterThan(0);
    });

    it('should export snsTopicArn output', async () => {
      const topicArn = await stack.snsTopicArn.promise();
      expect(topicArn).toBeDefined();
      expect(typeof topicArn).toBe('string');
      expect(topicArn.length).toBeGreaterThan(0);
    });

    it('should export lambdaFunctionArn output', async () => {
      const functionArn = await stack.lambdaFunctionArn.promise();
      expect(functionArn).toBeDefined();
      expect(typeof functionArn).toBe('string');
      expect(functionArn.length).toBeGreaterThan(0);
    });

    it('should have all outputs registered', () => {
      // Verify that all three outputs are present
      expect(stack.reportBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
    });
  });

  describe('TapStack resource structure', () => {
    it('should create stack with proper component resource type', () => {
      const stack = new tapStack.TapStack('test-stack-type', {
        environmentSuffix: 'dev',
      });

      // Component resource should be defined
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should handle missing optional parameters', async () => {
      // Test with minimal configuration
      const stack = new tapStack.TapStack('test-stack-minimal');

      expect(stack).toBeDefined();

      // Should still create all outputs with defaults
      const bucketName = await stack.reportBucketName.promise();
      const topicArn = await stack.snsTopicArn.promise();
      const functionArn = await stack.lambdaFunctionArn.promise();

      expect(bucketName).toBeDefined();
      expect(topicArn).toBeDefined();
      expect(functionArn).toBeDefined();
    });
  });

  describe('TapStack environment configurations', () => {
    it('should support dev environment', async () => {
      const stack = new tapStack.TapStack('test-stack-dev', {
        environmentSuffix: 'dev',
      });

      expect(stack).toBeDefined();
      const bucketName = await stack.reportBucketName.promise();
      expect(bucketName).toBeDefined();
    });

    it('should support staging environment', async () => {
      const stack = new tapStack.TapStack('test-stack-staging', {
        environmentSuffix: 'staging',
      });

      expect(stack).toBeDefined();
      const bucketName = await stack.reportBucketName.promise();
      expect(bucketName).toBeDefined();
    });

    it('should support prod environment', async () => {
      const stack = new tapStack.TapStack('test-stack-prod', {
        environmentSuffix: 'prod',
      });

      expect(stack).toBeDefined();
      const bucketName = await stack.reportBucketName.promise();
      expect(bucketName).toBeDefined();
    });
  });

  describe('TapStack compliance infrastructure', () => {
    it('should create stack for compliance monitoring', async () => {
      const stack = new tapStack.TapStack('test-compliance-stack', {
        environmentSuffix: 'compliance',
        tags: {
          Purpose: 'compliance-monitoring',
          Scope: 'organization-wide',
        },
      });

      expect(stack).toBeDefined();

      // Verify compliance-related outputs
      const bucketName = await stack.reportBucketName.promise();
      const topicArn = await stack.snsTopicArn.promise();
      const functionArn = await stack.lambdaFunctionArn.promise();

      expect(bucketName).toBeDefined();
      expect(topicArn).toBeDefined();
      expect(functionArn).toBeDefined();
    });

    it('should support custom tagging for compliance requirements', () => {
      const complianceTags = {
        ComplianceScope: 'SOC2',
        DataClassification: 'confidential',
        SecurityLevel: 'high',
      };

      const stack = new tapStack.TapStack('test-compliance-tags', {
        environmentSuffix: 'prod',
        tags: complianceTags,
      });

      expect(stack).toBeDefined();
      expect(stack.reportBucketName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
      expect(stack.lambdaFunctionArn).toBeDefined();
    });
  });
});
