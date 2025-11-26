import * as pulumi from '@pulumi/pulumi';

// Mock Pulumi runtime BEFORE importing TapStack
pulumi.runtime.setMocks({
  newResource: (args: pulumi.runtime.MockResourceArgs) => {
    const id = args.id || `${args.name}_id`;
    const state: Record<string, any> = {
      id,
      arn: `arn:aws:${args.type}:us-east-1:123456789012:${args.name}`,
    };

    // Mock specific resource properties based on type
    switch (args.type) {
      case 'aws:dynamodb/table:Table':
        state.name = args.inputs.name || args.name;
        state.hashKey = args.inputs.hashKey;
        state.rangeKey = args.inputs.rangeKey;
        break;
      case 'aws:sqs/queue:Queue':
        state.url = `https://sqs.us-east-1.amazonaws.com/123456789012/${args.name}`;
        state.name = args.inputs.name || args.name;
        break;
      case 'aws:sns/topic:Topic':
        state.name = args.inputs.name || args.name;
        break;
      case 'aws:kms/key:Key':
        state.id = `key-${args.name}`;
        break;
      case 'aws:apigateway/restApi:RestApi':
        state.id = 'test-api-id';
        state.rootResourceId = 'root-id';
        state.executionArn = `arn:aws:execute-api:us-east-1:123456789012:${args.name}`;
        break;
      case 'aws:lambda/function:Function':
        state.name = args.inputs.name || args.name;
        state.invokeArn = `arn:aws:apigateway:us-east-1:lambda:path/2015-03-31/functions/arn:aws:lambda:us-east-1:123456789012:function:${args.name}/invocations`;
        break;
      case 'aws:iam/role:Role':
        state.name = args.inputs.name || args.name;
        break;
      case 'aws:cloudwatch/eventRule:EventRule':
        state.name = args.inputs.name || args.name;
        break;
    }

    return { id, state };
  },
  call: (args: pulumi.runtime.MockCallArgs) => {
    return {};
  },
});

import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  describe('Stack Creation', () => {
    it('should create the stack successfully', async () => {
      const stack = new TapStack('test-stack', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(stack).toBeDefined();
      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.alertRulesTableName).toBeDefined();
      expect(stack.priceHistoryTableName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });

    it('should have required output properties', () => {
      const stack = new TapStack('test-stack2', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });

      expect(stack.apiEndpoint).toBeDefined();
      expect(stack.alertRulesTableName).toBeDefined();
      expect(stack.priceHistoryTableName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('output-test-stack', {
        environmentSuffix: 'test',
        tags: { Environment: 'test' },
      });
    });

    it('should export apiEndpoint', (done) => {
      pulumi.output(stack.apiEndpoint).apply((endpoint) => {
        expect(endpoint).toBeDefined();
        expect(typeof endpoint).toBe('string');
        done();
      });
    });

    it('should export alertRulesTableName', (done) => {
      pulumi.output(stack.alertRulesTableName).apply((tableName) => {
        expect(tableName).toBeDefined();
        expect(tableName).toContain('crypto-alert-rules');
        expect(tableName).toContain('test');
        done();
      });
    });

    it('should export priceHistoryTableName', (done) => {
      pulumi.output(stack.priceHistoryTableName).apply((tableName) => {
        expect(tableName).toBeDefined();
        expect(tableName).toContain('crypto-alert-price-history');
        expect(tableName).toContain('test');
        done();
      });
    });

    it('should export snsTopicArn', (done) => {
      pulumi.output(stack.snsTopicArn).apply((topicArn) => {
        expect(topicArn).toBeDefined();
        expect(typeof topicArn).toBe('string');
        done();
      });
    });
  });

  describe('Environment Suffix Handling', () => {
    it('should use provided environment suffix', (done) => {
      const stack = new TapStack('env-suffix-stack', {
        environmentSuffix: 'custom',
      });

      pulumi.output(stack.alertRulesTableName).apply((tableName) => {
        expect(tableName).toContain('custom');
        done();
      });
    });

    it('should use default suffix when not provided', (done) => {
      const stack = new TapStack('default-stack', {});

      pulumi.output(stack.alertRulesTableName).apply((tableName) => {
        expect(tableName).toContain('dev');
        done();
      });
    });
  });

  describe('Resource Naming', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('naming-test-stack', {
        environmentSuffix: 'naming-test',
      });
    });

    it('should include environmentSuffix in alert rules table name', (done) => {
      pulumi.output(stack.alertRulesTableName).apply((tableName) => {
        expect(tableName).toMatch(/crypto-alert-rules-naming-test/);
        done();
      });
    });

    it('should include environmentSuffix in price history table name', (done) => {
      pulumi.output(stack.priceHistoryTableName).apply((tableName) => {
        expect(tableName).toMatch(/crypto-alert-price-history-naming-test/);
        done();
      });
    });

    it('should generate API endpoint with correct structure', (done) => {
      pulumi.output(stack.apiEndpoint).apply((endpoint) => {
        expect(endpoint).toMatch(/https:\/\/.+\.execute-api\..+\.amazonaws\.com\/.+\/webhook/);
        done();
      });
    });
  });

  describe('Tags Propagation', () => {
    it('should accept custom tags', () => {
      const stack = new TapStack('tagged-stack', {
        environmentSuffix: 'prod',
        tags: {
          Environment: 'production',
          Team: 'platform',
        },
      });
      expect(stack).toBeDefined();
    });

    it('should handle empty tags', () => {
      const stack = new TapStack('empty-tag-stack', {
        environmentSuffix: 'dev',
        tags: {},
      });
      expect(stack).toBeDefined();
    });

    it('should handle undefined tags', () => {
      const stack = new TapStack('no-tag-stack', {
        environmentSuffix: 'dev',
      });
      expect(stack).toBeDefined();
    });
  });

  describe('Component Resource Type', () => {
    it('should be registered as tap:stack:TapStack', () => {
      const stack = new TapStack('type-test-stack', {
        environmentSuffix: 'test',
      });
      expect(stack.constructor.name).toBe('TapStack');
    });
  });

  describe('Multiple Stack Instances', () => {
    it('should support multiple instances with different suffixes', (done) => {
      const stack1 = new TapStack('multi-stack1', { environmentSuffix: 'env1' });
      const stack2 = new TapStack('multi-stack2', { environmentSuffix: 'env2' });

      pulumi
        .all([stack1.alertRulesTableName, stack2.alertRulesTableName])
        .apply(([table1, table2]) => {
          expect(table1).toContain('env1');
          expect(table2).toContain('env2');
          expect(table1).not.toBe(table2);
          done();
        });
    });
  });

  describe('Output Types', () => {
    it('should have correct output types', () => {
      const stack = new TapStack('output-type-stack', {
        environmentSuffix: 'test',
      });

      expect(typeof stack.apiEndpoint).toBe('object');
      expect(typeof stack.alertRulesTableName).toBe('object');
      expect(typeof stack.priceHistoryTableName).toBe('object');
      expect(typeof stack.snsTopicArn).toBe('object');
    });
  });

  describe('Stack Configuration Edge Cases', () => {
    it('should handle very long environment suffix', () => {
      const stack = new TapStack('long-suffix-stack', {
        environmentSuffix: 'verylongenvironmentsuffix123456789',
      });
      expect(stack).toBeDefined();
    });

    it('should handle special characters in environment suffix', (done) => {
      const stack = new TapStack('special-stack', {
        environmentSuffix: 'test-env-123',
      });

      pulumi.output(stack.alertRulesTableName).apply((tableName) => {
        expect(tableName).toContain('test-env-123');
        done();
      });
    });

    it('should handle numeric-only environment suffix', (done) => {
      const stack = new TapStack('numeric-stack', {
        environmentSuffix: '12345',
      });

      pulumi.output(stack.alertRulesTableName).apply((tableName) => {
        expect(tableName).toContain('12345');
        done();
      });
    });
  });

  describe('Resource Dependencies', () => {
    it('should create stack without errors', () => {
      expect(() => {
        new TapStack('dependency-test', { environmentSuffix: 'test' });
      }).not.toThrow();
    });

    it('should create multiple stacks without conflicts', () => {
      expect(() => {
        new TapStack('conflict-test-1', { environmentSuffix: 'test1' });
        new TapStack('conflict-test-2', { environmentSuffix: 'test2' });
        new TapStack('conflict-test-3', { environmentSuffix: 'test3' });
      }).not.toThrow();
    });
  });

  describe('Interface Compliance', () => {
    it('should accept valid TapStackArgs', () => {
      const validArgs = {
        environmentSuffix: 'valid',
        tags: {
          key1: 'value1',
          key2: 'value2',
        },
      };

      const stack = new TapStack('interface-test', validArgs);
      expect(stack).toBeDefined();
    });

    it('should accept minimal TapStackArgs', () => {
      const minimalArgs = {};

      const stack = new TapStack('minimal-test', minimalArgs);
      expect(stack).toBeDefined();
    });
  });
});
