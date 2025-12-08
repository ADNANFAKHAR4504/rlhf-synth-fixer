/**
 * Unit tests for TapStack
 *
 * These tests validate the structure and configuration of the webhook processing
 * infrastructure without deploying to AWS.
 */

import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime for testing
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

describe('TapStack Unit Tests', () => {
  describe('Stack Creation', () => {
    it('should create stack with environmentSuffix', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        tags: { Project: 'WebhookTest' },
      });

      expect(stack).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
      expect(stack.tableName).toBeDefined();
      expect(stack.receiverFunctionName).toBeDefined();
      expect(stack.validatorFunctionName).toBeDefined();
      expect(stack.processorFunctionName).toBeDefined();
    });

    it('should create stack with default environmentSuffix', async () => {
      const stack = new TapStack('test-stack-default', {});

      expect(stack).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
    });

    it('should create stack with custom tags', async () => {
      const customTags = {
        Environment: 'production',
        Owner: 'DevTeam',
        CostCenter: 'Engineering',
      };

      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'prod',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-outputs', {
        environmentSuffix: 'output-test',
      });
    });

    it('should export API URL output', async () => {
      const apiUrl = await stack.apiUrl.promise();
      expect(apiUrl).toBeDefined();
      expect(typeof apiUrl).toBe('string');
    });

    it('should export table name output', async () => {
      const tableName = await stack.tableName.promise();
      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe('string');
      expect(tableName).toContain('output-test');
    });

    it('should export receiver function name', async () => {
      const functionName = await stack.receiverFunctionName.promise();
      expect(functionName).toBeDefined();
      expect(typeof functionName).toBe('string');
      expect(functionName).toContain('output-test');
    });

    it('should export validator function name', async () => {
      const functionName = await stack.validatorFunctionName.promise();
      expect(functionName).toBeDefined();
      expect(typeof functionName).toBe('string');
      expect(functionName).toContain('output-test');
    });

    it('should export processor function name', async () => {
      const functionName = await stack.processorFunctionName.promise();
      expect(functionName).toBeDefined();
      expect(typeof functionName).toBe('string');
      expect(functionName).toContain('output-test');
    });
  });

  describe('Resource Naming', () => {
    it('should include environmentSuffix in all resource names', async () => {
      const envSuffix = 'naming-test';
      const stack = new TapStack('test-naming', {
        environmentSuffix: envSuffix,
      });

      const tableName = await stack.tableName.promise();
      expect(tableName).toContain(envSuffix);

      const receiverName = await stack.receiverFunctionName.promise();
      expect(receiverName).toContain(envSuffix);

      const validatorName = await stack.validatorFunctionName.promise();
      expect(validatorName).toContain(envSuffix);

      const processorName = await stack.processorFunctionName.promise();
      expect(processorName).toContain(envSuffix);
    });

    it('should use descriptive resource names', async () => {
      const stack = new TapStack('test-descriptive', {
        environmentSuffix: 'desc',
      });

      const tableName = await stack.tableName.promise();
      expect(tableName).toContain('webhook-table');

      const receiverName = await stack.receiverFunctionName.promise();
      expect(receiverName).toContain('webhook-receiver');

      const validatorName = await stack.validatorFunctionName.promise();
      expect(validatorName).toContain('webhook-validator');

      const processorName = await stack.processorFunctionName.promise();
      expect(processorName).toContain('webhook-processor');
    });
  });

  describe('Configuration Validation', () => {
    it('should handle empty tags object', () => {
      const stack = new TapStack('test-empty-tags', {
        environmentSuffix: 'empty',
        tags: {},
      });

      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', () => {
      const stack = new TapStack('test-undefined-tags', {
        environmentSuffix: 'undef',
      });

      expect(stack).toBeDefined();
    });

    it('should work with minimal configuration', () => {
      const stack = new TapStack('test-minimal', {});

      expect(stack).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
      expect(stack.tableName).toBeDefined();
    });

    it('should work with maximum configuration', () => {
      const stack = new TapStack('test-maximum', {
        environmentSuffix: 'max-config-123',
        tags: {
          Environment: 'production',
          Owner: 'platform-team',
          CostCenter: 'engineering',
          Application: 'webhook-processor',
          ManagedBy: 'Pulumi',
          Version: 'v1.0.0',
        },
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Baseline Configuration (Non-Optimized)', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-baseline', {
        environmentSuffix: 'baseline',
      });
    });

    it('should create stack with baseline settings', () => {
      // This test validates that the baseline (non-optimized) stack
      // can be created successfully. The optimize.py script will
      // optimize these resources after deployment.
      expect(stack).toBeDefined();
      expect(stack.apiUrl).toBeDefined();
      expect(stack.tableName).toBeDefined();
    });

    it('should export all required outputs for optimization', async () => {
      // Verify all outputs needed by optimize.py are present
      const outputs = {
        apiUrl: await stack.apiUrl.promise(),
        tableName: await stack.tableName.promise(),
        receiverFunctionName: await stack.receiverFunctionName.promise(),
        validatorFunctionName: await stack.validatorFunctionName.promise(),
        processorFunctionName: await stack.processorFunctionName.promise(),
      };

      expect(outputs.apiUrl).toBeDefined();
      expect(outputs.tableName).toBeDefined();
      expect(outputs.receiverFunctionName).toBeDefined();
      expect(outputs.validatorFunctionName).toBeDefined();
      expect(outputs.processorFunctionName).toBeDefined();
    });
  });

  describe('Component Resource Behavior', () => {
    it('should be a valid Pulumi ComponentResource', () => {
      const stack = new TapStack('test-component', {
        environmentSuffix: 'comp',
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should register outputs correctly', async () => {
      const stack = new TapStack('test-register', {
        environmentSuffix: 'reg',
      });

      // Verify outputs are registered and accessible
      expect(stack.apiUrl).toBeInstanceOf(pulumi.Output);
      expect(stack.tableName).toBeInstanceOf(pulumi.Output);
      expect(stack.receiverFunctionName).toBeInstanceOf(pulumi.Output);
      expect(stack.validatorFunctionName).toBeInstanceOf(pulumi.Output);
      expect(stack.processorFunctionName).toBeInstanceOf(pulumi.Output);
    });
  });

  describe('Edge Cases', () => {
    it('should handle very long environmentSuffix', () => {
      const longSuffix = 'a'.repeat(50);
      const stack = new TapStack('test-long-suffix', {
        environmentSuffix: longSuffix,
      });

      expect(stack).toBeDefined();
    });

    it('should handle special characters in environmentSuffix', () => {
      const specialSuffix = 'test-123-abc';
      const stack = new TapStack('test-special', {
        environmentSuffix: specialSuffix,
      });

      expect(stack).toBeDefined();
    });

    it('should handle numeric environmentSuffix', () => {
      const numericSuffix = '12345';
      const stack = new TapStack('test-numeric', {
        environmentSuffix: numericSuffix,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('Type Safety', () => {
    it('should enforce TapStackArgs type', () => {
      // This test validates that TypeScript type checking works
      const validArgs = {
        environmentSuffix: 'type-test',
        tags: { Key: 'Value' },
      };

      const stack = new TapStack('test-types', validArgs);
      expect(stack).toBeDefined();
    });

    it('should allow optional parameters', () => {
      const stack1 = new TapStack('test-optional-1', {});
      const stack2 = new TapStack('test-optional-2', {
        environmentSuffix: 'opt',
      });
      const stack3 = new TapStack('test-optional-3', {
        tags: { Test: 'Value' },
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack3).toBeDefined();
    });
  });
});
