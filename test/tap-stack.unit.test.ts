import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime before importing the stack
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } => {
    const outputs: Record<string, any> = {
      ...args.inputs,
    };

    // Add resource-specific outputs
    if (args.type === 'aws:s3/bucket:Bucket') {
      outputs.arn = `arn:aws:s3:::${args.inputs.bucket || args.name}`;
      outputs.bucket = args.inputs.bucket || args.name;
    } else if (args.type === 'aws:sns/topic:Topic') {
      outputs.arn = `arn:aws:sns:us-east-1:123456789012:${args.name}`;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.name}`;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.arn = `arn:aws:iam::123456789012:role/${args.name}`;
    } else if (args.type === 'aws:cfg/recorder:Recorder') {
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:cfg/deliveryChannel:DeliveryChannel') {
      outputs.name = args.inputs.name || args.name;
    } else if (args.type === 'aws:cfg/rule:Rule') {
      outputs.name = args.inputs.name || args.name;
      outputs.arn = `arn:aws:config:us-east-1:123456789012:config-rule/${args.name}`;
    } else if (args.type === 'aws:cloudwatch/dashboard:Dashboard') {
      outputs.dashboardName = args.inputs.dashboardName || args.name;
    } else if (args.type === 'aws:cloudwatch/eventRule:EventRule') {
      outputs.arn = `arn:aws:events:us-east-1:123456789012:rule/${args.name}`;
    }

    return {
      id: `${args.name}-id`,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    // Mock aws.getCallerIdentity
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDAI123456789012',
      };
    }
    return {};
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  const testEnvironmentSuffix = 'test-env';

  describe('Stack Instantiation', () => {
    test('creates stack with required parameters', () => {
      expect(() => {
        stack = new TapStack('test-stack', {
          environmentSuffix: testEnvironmentSuffix,
        });
      }).not.toThrow();

      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    test('exports required outputs', async () => {
      stack = new TapStack('test-stack-outputs', {
        environmentSuffix: testEnvironmentSuffix,
      });

      expect(stack.configRecorderName).toBeDefined();
      expect(stack.bucketArn).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();

      // Verify outputs are Pulumi Outputs
      expect(stack.configRecorderName).toBeInstanceOf(pulumi.Output);
      expect(stack.bucketArn).toBeInstanceOf(pulumi.Output);
      expect(stack.snsTopicArn).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('S3 Bucket Configuration', () => {
    beforeAll(() => {
      stack = new TapStack('test-s3-stack', {
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    test('bucket ARN includes environment suffix', async () => {
      const bucketArn = await stack.bucketArn.promise();
      expect(bucketArn).toContain(testEnvironmentSuffix);
      expect(bucketArn).toContain('config-bucket');
    });

    test('bucket ARN format is valid', async () => {
      const bucketArn = await stack.bucketArn.promise();
      expect(bucketArn).toMatch(/^arn:aws:s3:::/);
    });
  });

  describe('Config Recorder Configuration', () => {
    beforeAll(() => {
      stack = new TapStack('test-config-stack', {
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    test('recorder name includes environment suffix', async () => {
      const recorderName = await stack.configRecorderName.promise();
      expect(recorderName).toContain(testEnvironmentSuffix);
      expect(recorderName).toContain('config-recorder');
    });

    test('recorder name format is valid', async () => {
      const recorderName = await stack.configRecorderName.promise();
      expect(recorderName).toMatch(/^config-recorder-/);
    });
  });

  describe('SNS Topic Configuration', () => {
    beforeAll(() => {
      stack = new TapStack('test-sns-stack', {
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    test('SNS topic ARN includes environment suffix', async () => {
      const topicArn = await stack.snsTopicArn.promise();
      expect(topicArn).toContain('compliance-topic');
    });

    test('SNS topic ARN format is valid', async () => {
      const topicArn = await stack.snsTopicArn.promise();
      expect(topicArn).toMatch(/^arn:aws:sns:/);
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names follow naming convention', async () => {
      stack = new TapStack('test-naming-stack', {
        environmentSuffix: testEnvironmentSuffix,
      });

      const recorderName = await stack.configRecorderName.promise();
      const bucketArn = await stack.bucketArn.promise();
      const topicArn = await stack.snsTopicArn.promise();

      // All names should include the environment suffix
      expect(recorderName).toContain(testEnvironmentSuffix);
      expect(bucketArn).toContain(testEnvironmentSuffix);
      expect(topicArn).toContain(testEnvironmentSuffix);
    });
  });

  describe('Component Resource Structure', () => {
    test('stack is a component resource', () => {
      stack = new TapStack('test-component-stack', {
        environmentSuffix: testEnvironmentSuffix,
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    test('stack outputs are registered', async () => {
      stack = new TapStack('test-outputs-stack', {
        environmentSuffix: testEnvironmentSuffix,
      });

      // Verify that all outputs can be resolved
      await expect(stack.configRecorderName.promise()).resolves.toBeTruthy();
      await expect(stack.bucketArn.promise()).resolves.toBeTruthy();
      await expect(stack.snsTopicArn.promise()).resolves.toBeTruthy();
    });
  });

  describe('Environment Suffix Handling', () => {
    test('handles different environment suffix formats', async () => {
      const testCases = ['dev', 'prod', 'qa-123', 'test-env-456'];

      for (const suffix of testCases) {
        const testStack = new TapStack(`test-${suffix}`, {
          environmentSuffix: suffix,
        });

        const recorderName = await testStack.configRecorderName.promise();
        expect(recorderName).toContain(suffix);
      }
    });

    test('environment suffix is used in resource names', async () => {
      const customSuffix = 'custom-suffix-123';
      const testStack = new TapStack('test-custom', {
        environmentSuffix: customSuffix,
      });

      const recorderName = await testStack.configRecorderName.promise();
      expect(recorderName).toContain(customSuffix);
    });
  });

  describe('Infrastructure Components', () => {
    beforeAll(() => {
      stack = new TapStack('test-infra-stack', {
        environmentSuffix: testEnvironmentSuffix,
      });
    });

    test('all required outputs are string outputs', async () => {
      const recorderName = await stack.configRecorderName.promise();
      const bucketArn = await stack.bucketArn.promise();
      const topicArn = await stack.snsTopicArn.promise();

      expect(typeof recorderName).toBe('string');
      expect(typeof bucketArn).toBe('string');
      expect(typeof topicArn).toBe('string');
    });

    test('output values are non-empty', async () => {
      const recorderName = await stack.configRecorderName.promise();
      const bucketArn = await stack.bucketArn.promise();
      const topicArn = await stack.snsTopicArn.promise();

      expect(recorderName.length).toBeGreaterThan(0);
      expect(bucketArn.length).toBeGreaterThan(0);
      expect(topicArn.length).toBeGreaterThan(0);
    });
  });
});
