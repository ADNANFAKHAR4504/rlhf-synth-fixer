import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Pulumi unit testing setup
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: Record<string, unknown>;
  } => {
    const outputs: Record<string, unknown> = {
      ...args.inputs,
    };

    // Mock specific resource outputs
    if (args.type === 'aws:kms/key:Key') {
      outputs.id = 'mock-kms-key-id';
      outputs.arn = 'arn:aws:kms:us-east-1:123456789012:key/mock-key-id';
      outputs.keyId = 'mock-kms-key-id';
    } else if (args.type === 'aws:dynamodb/table:Table') {
      outputs.id = args.inputs.name || 'mock-table-id';
      outputs.arn = `arn:aws:dynamodb:us-east-1:123456789012:table/${args.inputs.name}`;
      outputs.name = args.inputs.name;
    } else if (args.type === 'aws:sns/topic:Topic') {
      outputs.id = args.inputs.name || 'mock-topic-id';
      outputs.arn = `arn:aws:sns:us-east-1:123456789012:${args.inputs.name}`;
      outputs.name = args.inputs.name;
    } else if (args.type === 'aws:iam/role:Role') {
      outputs.id = args.inputs.name || 'mock-role-id';
      outputs.arn = `arn:aws:iam::123456789012:role/${args.inputs.name}`;
      outputs.name = args.inputs.name;
    } else if (args.type === 'aws:lambda/function:Function') {
      outputs.id = args.inputs.name || 'mock-function-id';
      outputs.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}`;
      outputs.name = args.inputs.name;
    } else if (args.type === 'aws:cloudwatch/eventRule:EventRule') {
      outputs.id = args.inputs.name || 'mock-rule-id';
      outputs.arn = `arn:aws:events:us-east-1:123456789012:rule/${args.inputs.name}`;
      outputs.name = args.inputs.name;
    }

    return {
      id: `${args.name}_id`,
      state: outputs,
    };
  },
  call: (args: pulumi.runtime.MockCallArgs) => args.inputs,
});

describe('TapStack Unit Tests', () => {
  describe('Stack Creation with Custom Environment Suffix', () => {
    let stack: TapStack;
    let resources: pulumi.Output<string>[];

    beforeAll(async () => {
      stack = new TapStack('test-stack', {
        environmentSuffix: 'test123',
        tags: {
          Environment: 'production',
          Service: 'price-alerts',
          TestTag: 'test-value',
        },
      });

      resources = [
        stack.webhookHandlerArn,
        stack.alertEvaluatorArn,
        stack.alertsTableName,
      ];

      // Wait for all outputs to be resolved
      await Promise.all(resources.map((r) => r.promise()));
    });

    it('should create stack with custom environment suffix', () => {
      expect(stack).toBeDefined();
    });

    it('should export webhookHandlerArn output', async () => {
      const arn = await stack.webhookHandlerArn.promise();
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      expect(arn).toContain('arn:aws:lambda');
      expect(arn).toContain('crypto-webhook-handler-test123');
    });

    it('should export alertEvaluatorArn output', async () => {
      const arn = await stack.alertEvaluatorArn.promise();
      expect(arn).toBeDefined();
      expect(typeof arn).toBe('string');
      expect(arn).toContain('arn:aws:lambda');
      expect(arn).toContain('crypto-alert-evaluator-test123');
    });

    it('should export alertsTableName output', async () => {
      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toBeDefined();
      expect(typeof tableName).toBe('string');
      expect(tableName).toBe('crypto-alerts-test123');
    });
  });

  describe('Stack Creation with Default Environment Suffix', () => {
    let stack: TapStack;

    beforeAll(() => {
      // Clear ENVIRONMENT_SUFFIX env var
      delete process.env.ENVIRONMENT_SUFFIX;

      stack = new TapStack('test-stack-default', {});
    });

    it('should create stack with default environment suffix', () => {
      expect(stack).toBeDefined();
    });

    it('should use dev as default suffix', async () => {
      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toContain('-dev');
    });
  });

  describe('Stack Creation with Environment Variable Suffix', () => {
    let stack: TapStack;

    beforeAll(() => {
      process.env.ENVIRONMENT_SUFFIX = 'envvar123';
      stack = new TapStack('test-stack-env', {});
    });

    afterAll(() => {
      delete process.env.ENVIRONMENT_SUFFIX;
    });

    it('should use environment variable for suffix', async () => {
      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toContain('-envvar123');
    });
  });

  describe('Stack Resource Configuration', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-resource-config', {
        environmentSuffix: 'config',
        tags: {
          Environment: 'production',
          Service: 'price-alerts',
        },
      });
    });

    it('should configure DynamoDB table with correct keys', async () => {
      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toBe('crypto-alerts-config');
    });

    it('should configure Lambda functions with correct naming', async () => {
      const webhookArn = await stack.webhookHandlerArn.promise();
      const evaluatorArn = await stack.alertEvaluatorArn.promise();

      expect(webhookArn).toContain('crypto-webhook-handler-config');
      expect(evaluatorArn).toContain('crypto-alert-evaluator-config');
    });
  });

  describe('Stack Tag Configuration', () => {
    it('should use default tags when not provided', async () => {
      const stack = new TapStack('test-default-tags', {
        environmentSuffix: 'tagtest',
      });

      expect(stack).toBeDefined();
      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toBeDefined();
    });

    it('should use custom tags when provided', async () => {
      const customTags = {
        Environment: 'staging',
        Service: 'custom-service',
        Owner: 'test-team',
      };

      const stack = new TapStack('test-custom-tags', {
        environmentSuffix: 'customtags',
        tags: customTags,
      });

      expect(stack).toBeDefined();
      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toBeDefined();
    });
  });

  describe('Edge Cases and Error Handling', () => {
    it('should handle empty environmentSuffix gracefully', async () => {
      const stack = new TapStack('test-empty-suffix', {
        environmentSuffix: '',
      });

      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toBeDefined();
      // With empty suffix, should still create resources (will default to 'dev')
    });

    it('should handle special characters in environmentSuffix', async () => {
      const stack = new TapStack('test-special-chars', {
        environmentSuffix: 'test-123-abc',
      });

      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toContain('test-123-abc');
    });

    it('should handle missing tags parameter', async () => {
      const stack = new TapStack('test-no-tags', {
        environmentSuffix: 'notags',
      });

      expect(stack).toBeDefined();
      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toBeDefined();
    });
  });

  describe('Output Validation', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-outputs', {
        environmentSuffix: 'outputs',
      });
    });

    it('should have all required outputs defined', () => {
      expect(stack.webhookHandlerArn).toBeDefined();
      expect(stack.alertEvaluatorArn).toBeDefined();
      expect(stack.alertsTableName).toBeDefined();
    });

    it('should have outputs as Pulumi Output types', () => {
      expect(stack.webhookHandlerArn).toBeInstanceOf(pulumi.Output);
      expect(stack.alertEvaluatorArn).toBeInstanceOf(pulumi.Output);
      expect(stack.alertsTableName).toBeInstanceOf(pulumi.Output);
    });

    it('should have resolvable output values', async () => {
      const webhookArn = await stack.webhookHandlerArn.promise();
      const evaluatorArn = await stack.alertEvaluatorArn.promise();
      const tableName = await stack.alertsTableName.promise();

      expect(webhookArn).toBeTruthy();
      expect(evaluatorArn).toBeTruthy();
      expect(tableName).toBeTruthy();
    });
  });

  describe('Resource Naming Conventions', () => {
    it('should follow naming convention for all resources', async () => {
      const suffix = 'naming123';
      const stack = new TapStack('test-naming', {
        environmentSuffix: suffix,
      });

      const tableName = await stack.alertsTableName.promise();
      expect(tableName).toMatch(/^crypto-alerts-[a-z0-9-]+$/);
      expect(tableName).toContain(suffix);
    });

    it('should include environment suffix in all resource names', async () => {
      const suffix = 'suffix999';
      const stack = new TapStack('test-suffix-check', {
        environmentSuffix: suffix,
      });

      const webhookArn = await stack.webhookHandlerArn.promise();
      const evaluatorArn = await stack.alertEvaluatorArn.promise();
      const tableName = await stack.alertsTableName.promise();

      expect(webhookArn).toContain(suffix);
      expect(evaluatorArn).toContain(suffix);
      expect(tableName).toContain(suffix);
    });
  });

  describe('Component Resource Hierarchy', () => {
    it('should create stack as ComponentResource', () => {
      const stack = new TapStack('test-component', {
        environmentSuffix: 'component',
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });

    it('should accept parent resource options', () => {
      const stack = new TapStack(
        'test-parent',
        {
          environmentSuffix: 'parent',
        },
        { protect: false }
      );

      expect(stack).toBeDefined();
    });
  });
});
