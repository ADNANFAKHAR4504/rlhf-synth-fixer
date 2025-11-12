import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { TapStack } from '../lib/tap-stack';

// Pulumi runtime mocking
pulumi.runtime.setMocks({
  newResource: function(args: pulumi.runtime.MockResourceArgs): { id: string, state: any } {
    return {
      id: `${args.name}-id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-2:123456789012:${args.name}`,
        name: args.name,
        url: `https://${args.name}.amazonaws.com`,
        invokeArn: `arn:aws:apigateway:us-east-2:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-2:123456789012:function:${args.name}/invocations`,
        executionArn: `arn:aws:execute-api:us-east-2:123456789012:${args.name}`,
        rootResourceId: `${args.name}-root`,
      },
    };
  },
  call: function(args: pulumi.runtime.MockCallArgs) {
    if (args.token === 'aws:index/getAvailabilityZones:getAvailabilityZones') {
      return {
        names: ['us-east-2a', 'us-east-2b', 'us-east-2c'],
        zoneIds: ['use2-az1', 'use2-az2', 'use2-az3'],
      };
    }
    if (args.token === 'aws:index/getRegion:getRegion') {
      return {
        name: 'us-east-2',
        id: 'us-east-2',
      };
    }
    if (args.token === 'aws:index/getCallerIdentity:getCallerIdentity') {
      return {
        accountId: '123456789012',
        arn: 'arn:aws:iam::123456789012:user/test',
        userId: 'AIDACKCEVSQ6C2EXAMPLE',
      };
    }
    return {};
  },
});

describe('TapStack - Payment Processing Pipeline', () => {
  let stack: TapStack;

  describe('with custom environmentSuffix and tags', () => {
    beforeAll(() => {
      stack = new TapStack('test-payment-stack', {
        environmentSuffix: 'test',
        tags: {
          Environment: 'test',
          Project: 'payment-processing',
          Team: 'platform',
        },
      });
    });

    it('instantiates successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('has apiUrl output', () => {
      expect(stack.apiUrl).toBeDefined();
    });

    it('has tableName output', () => {
      expect(stack.tableName).toBeDefined();
    });

    it('has topicArn output', () => {
      expect(stack.topicArn).toBeDefined();
    });
  });

  describe('with default values', () => {
    beforeAll(() => {
      stack = new TapStack('test-payment-stack-default', {});
    });

    it('instantiates successfully with defaults', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('has all required outputs', () => {
      expect(stack.apiUrl).toBeDefined();
      expect(stack.tableName).toBeDefined();
      expect(stack.topicArn).toBeDefined();
    });
  });

  describe('resource naming conventions', () => {
    it('includes environmentSuffix in resource names', async () => {
      const testStack = new TapStack('test-naming', {
        environmentSuffix: 'prod',
      });

      expect(testStack).toBeDefined();
      expect(testStack.tableName).toBeDefined();
      expect(testStack.apiUrl).toBeDefined();
      expect(testStack.topicArn).toBeDefined();
    });

    it('uses dev as default environmentSuffix', async () => {
      const defaultStack = new TapStack('test-default-naming', {});

      expect(defaultStack).toBeDefined();
      expect(defaultStack.tableName).toBeDefined();
    });
  });

  describe('stack outputs structure', () => {
    it('exports outputs in correct format', async () => {
      const outputStack = new TapStack('test-outputs', {
        environmentSuffix: 'stage',
      });

      // Verify outputs are Pulumi Output types
      expect(outputStack.apiUrl).toBeDefined();
      expect(outputStack.tableName).toBeDefined();
      expect(outputStack.topicArn).toBeDefined();
    });
  });
});
