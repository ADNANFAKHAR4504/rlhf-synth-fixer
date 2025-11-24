/**
 * Unit tests for TapStack Pulumi component
 * Tests the structure and configuration of all infrastructure resources
 */
import * as pulumi from '@pulumi/pulumi';

// Set up Pulumi runtime in test mode
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): { id: string; state: any } => {
    return {
      id: `${args.name}_id`,
      state: {
        ...args.inputs,
        arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
        name: args.inputs.name || args.name,
      },
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return args.inputs;
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let stack: TapStack;
  let resources: pulumi.Output<string>[];

  beforeAll(async () => {
    // Create stack with test environment suffix
    stack = new TapStack('test-stack', {
      environmentSuffix: 'test123',
      tags: {
        Environment: 'testing',
        Service: 'price-alerts',
        TestRun: 'unit-test',
      },
    });

    // Collect all outputs
    resources = [
      stack.webhookLambdaArn,
      stack.priceCheckLambdaArn,
      stack.alertsTableName,
      stack.alertTopicArn,
    ];
  });

  describe('Stack Creation', () => {
    it('should create stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(TapStack);
    });

    it('should expose webhookLambdaArn output', async () => {
      const arn = await stack.webhookLambdaArn.promise();
      expect(arn).toBeDefined();
      expect(arn).toContain('lambda');
    });

    it('should expose priceCheckLambdaArn output', async () => {
      const arn = await stack.priceCheckLambdaArn.promise();
      expect(arn).toBeDefined();
      expect(arn).toContain('lambda');
    });

    it('should expose alertsTableName output', async () => {
      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toBeDefined();
      expect(tableName).toContain('crypto-alerts');
    });

    it('should expose alertTopicArn output', async () => {
      const arn = await stack.alertTopicArn.promise();
      expect(arn).toBeDefined();
      expect(arn).toContain('sns');
    });
  });

  describe('Resource Naming with environmentSuffix', () => {
    it('should include environmentSuffix in DynamoDB table name', async () => {
      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toContain('test123');
      expect(tableName).toBe('crypto-alerts-test123');
    });

    it('should use environmentSuffix in resource naming', async () => {
      const webhookArn = await stack.webhookLambdaArn.promise();
      const priceCheckArn = await stack.priceCheckLambdaArn.promise();

      // Resource names should include environment suffix
      expect(webhookArn).toContain('test123');
      expect(priceCheckArn).toContain('test123');
    });
  });

  describe('Default Values', () => {
    let defaultStack: TapStack;

    beforeAll(() => {
      defaultStack = new TapStack('default-stack', {});
    });

    it('should use default environmentSuffix when not provided', async () => {
      const tableName = await defaultStack.alertsTableName.promise();
      expect(tableName).toBe('crypto-alerts-dev');
    });

    it('should have all required outputs with defaults', async () => {
      expect(defaultStack.webhookLambdaArn).toBeDefined();
      expect(defaultStack.priceCheckLambdaArn).toBeDefined();
      expect(defaultStack.alertsTableName).toBeDefined();
      expect(defaultStack.alertTopicArn).toBeDefined();
    });
  });

  describe('Tags Configuration', () => {
    it('should accept custom tags', () => {
      const customStack = new TapStack('custom-tags-stack', {
        environmentSuffix: 'custom',
        tags: {
          Owner: 'test-team',
          Project: 'crypto-alerts',
        },
      });

      expect(customStack).toBeDefined();
    });
  });

  describe('Component Resource Structure', () => {
    it('should be a Pulumi ComponentResource', () => {
      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should register outputs correctly', async () => {
      // Verify all outputs are registered and accessible
      const outputs = await Promise.all([
        stack.webhookLambdaArn.promise(),
        stack.priceCheckLambdaArn.promise(),
        stack.alertsTableName.promise(),
        stack.alertTopicArn.promise(),
      ]);

      outputs.forEach(output => {
        expect(output).toBeDefined();
        expect(typeof output).toBe('string');
      });
    });
  });
});

describe('TapStack Integration Structure', () => {
  let stack: TapStack;

  beforeAll(() => {
    stack = new TapStack('integration-test-stack', {
      environmentSuffix: 'inttest',
    });
  });

  describe('Lambda Functions Configuration', () => {
    it('should create webhook processor Lambda with correct properties', async () => {
      const arn = await stack.webhookLambdaArn.promise();
      expect(arn).toBeDefined();
      // Lambda ARN should contain the function name with environment suffix
      expect(arn).toContain('webhook-processor-inttest');
    });

    it('should create price checker Lambda with correct properties', async () => {
      const arn = await stack.priceCheckLambdaArn.promise();
      expect(arn).toBeDefined();
      // Lambda ARN should contain the function name with environment suffix
      expect(arn).toContain('price-checker-inttest');
    });
  });

  describe('DynamoDB Table Configuration', () => {
    it('should create DynamoDB table with correct name format', async () => {
      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toMatch(/^crypto-alerts-[a-z0-9]+$/);
    });
  });

  describe('SNS Topic Configuration', () => {
    it('should create SNS topic with ARN', async () => {
      const arn = await stack.alertTopicArn.promise();
      expect(arn).toBeDefined();
      expect(arn).toContain('price-alert-topic-inttest');
    });
  });
});

describe('TapStack Error Handling', () => {
  it('should handle empty environmentSuffix gracefully', () => {
    const emptyStack = new TapStack('empty-suffix-stack', {
      environmentSuffix: '',
    });

    expect(emptyStack).toBeDefined();
  });

  it('should handle undefined tags', () => {
    const noTagsStack = new TapStack('no-tags-stack', {
      environmentSuffix: 'notags',
      tags: undefined,
    });

    expect(noTagsStack).toBeDefined();
  });
});
