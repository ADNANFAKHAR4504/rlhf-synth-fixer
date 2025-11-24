/**
 * Unit tests for TapStack
 * Tests all Pulumi resources and configurations
 */
import * as pulumi from '@pulumi/pulumi';
import { TapStack } from '../lib/tap-stack';

// Mock Pulumi runtime
pulumi.runtime.setMocks({
  newResource: function (args: pulumi.runtime.MockResourceArgs): {
    id: string;
    state: any;
  } {
    // Generate deterministic IDs for resources
    const id = `${args.type}_${args.name}`;
    const state: any = { ...args.inputs };

    // Add specific outputs based on resource type
    switch (args.type) {
      case 'aws:cloudwatch/eventBus:EventBus':
        state.arn = `arn:aws:events:us-east-1:123456789012:event-bus/${args.inputs.name}`;
        state.name = args.inputs.name;
        break;
      case 'aws:dynamodb/table:Table':
        state.arn = `arn:aws:dynamodb:us-east-1:123456789012:table/${args.inputs.name}`;
        state.name = args.inputs.name;
        break;
      case 'aws:sns/topic:Topic':
        state.arn = `arn:aws:sns:us-east-1:123456789012:${args.inputs.name}`;
        state.name = args.inputs.name;
        break;
      case 'aws:sqs/queue:Queue':
        state.arn = `arn:aws:sqs:us-east-1:123456789012:${args.inputs.name}`;
        state.url = `https://sqs.us-east-1.amazonaws.com/123456789012/${args.inputs.name}`;
        state.name = args.inputs.name;
        break;
      case 'aws:iam/role:Role':
        state.arn = `arn:aws:iam::123456789012:role/${args.inputs.name}`;
        state.name = args.inputs.name;
        state.id = args.inputs.name;
        break;
      case 'aws:lambda/function:Function':
        state.arn = `arn:aws:lambda:us-east-1:123456789012:function:${args.inputs.name}`;
        state.name = args.inputs.name;
        break;
      case 'aws:cloudwatch/logGroup:LogGroup':
        state.arn = `arn:aws:logs:us-east-1:123456789012:log-group:${args.inputs.name}`;
        state.name = args.inputs.name;
        break;
      case 'aws:cloudwatch/eventRule:EventRule':
        state.arn = `arn:aws:events:us-east-1:123456789012:rule/${args.inputs.name}`;
        state.name = args.inputs.name;
        break;
    }

    return {
      id: id,
      state: state,
    };
  },
  call: function (args: pulumi.runtime.MockCallArgs) {
    // Mock AWS calls
    switch (args.token) {
      case 'aws:index/getRegion:getRegion':
        return { name: 'us-east-1', id: 'us-east-1' };
      case 'aws:index/getCallerIdentity:getCallerIdentity':
        return {
          accountId: '123456789012',
          arn: 'arn:aws:iam::123456789012:user/test',
          userId: 'AIDACKCEVSQ6C2EXAMPLE',
        };
      default:
        return {};
    }
  },
});

/**
 * Helper function to extract value from Pulumi Output
 */
async function unwrapOutput<T>(output: pulumi.Output<T>): Promise<T> {
  return new Promise((resolve) => {
    output.apply((value) => {
      resolve(value);
      return value;
    });
  });
}

describe('TapStack Unit Tests', () => {
  describe('Stack Instantiation', () => {
    it('should create a TapStack with default environment suffix', async () => {
      const stack = new TapStack('test-stack-default', {});

      const eventBusName = await unwrapOutput(stack.eventBusName);
      expect(eventBusName).toContain('crypto-events-dev');
    });

    it('should create a TapStack with custom environment suffix', async () => {
      const stack = new TapStack('test-stack-custom', {
        environmentSuffix: 'prod',
      });

      const eventBusName = await unwrapOutput(stack.eventBusName);
      expect(eventBusName).toContain('crypto-events-prod');
    });

    it('should create a TapStack with custom tags', async () => {
      const customTags = {
        Project: 'TestProject',
        Owner: 'TestOwner',
      };

      const stack = new TapStack('test-stack-tags', {
        environmentSuffix: 'staging',
        tags: customTags,
      });

      expect(stack).toBeDefined();
    });
  });

  describe('EventBridge Resources', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-eventbridge', {
        environmentSuffix: 'test',
      });
    });

    it('should export eventBusArn', async () => {
      const eventBusArn = await unwrapOutput(stack.eventBusArn);
      expect(eventBusArn).toContain('arn:aws:events');
      expect(eventBusArn).toContain('crypto-events-test');
    });

    it('should export eventBusName', async () => {
      const eventBusName = await unwrapOutput(stack.eventBusName);
      expect(eventBusName).toBe('crypto-events-test');
    });
  });

  describe('DynamoDB Resources', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-dynamodb', {
        environmentSuffix: 'qa',
      });
    });

    it('should export dynamodbTableName', async () => {
      const tableName = await unwrapOutput(stack.dynamodbTableName);
      expect(tableName).toBe('price-history-qa');
    });
  });

  describe('SNS Resources', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-sns', {
        environmentSuffix: 'uat',
      });
    });

    it('should export snsTopicArn', async () => {
      const topicArn = await unwrapOutput(stack.snsTopicArn);
      expect(topicArn).toContain('arn:aws:sns');
      expect(topicArn).toContain('price-alerts-uat');
    });
  });

  describe('Lambda Functions', () => {
    let stack: TapStack;

    beforeAll(() => {
      stack = new TapStack('test-lambda', {
        environmentSuffix: 'perf',
      });
    });

    it('should export priceProcessorFunctionName', async () => {
      const functionName = await unwrapOutput(stack.priceProcessorFunctionName);
      expect(functionName).toBe('price-processor-perf');
    });

    it('should export alertGeneratorFunctionName', async () => {
      const functionName = await unwrapOutput(
        stack.alertGeneratorFunctionName
      );
      expect(functionName).toBe('alert-generator-perf');
    });
  });

  describe('Resource Naming with Environment Suffix', () => {
    it('should append suffix to all major resources for dev', async () => {
      const stack = new TapStack('test-naming-dev', {
        environmentSuffix: 'dev',
      });

      const [eventBusName, tableName, functionName] = await Promise.all([
        unwrapOutput(stack.eventBusName),
        unwrapOutput(stack.dynamodbTableName),
        unwrapOutput(stack.priceProcessorFunctionName),
      ]);

      expect(eventBusName).toContain('-dev');
      expect(tableName).toContain('-dev');
      expect(functionName).toContain('-dev');
    });

    it('should append suffix to all major resources for prod', async () => {
      const stack = new TapStack('test-naming-prod', {
        environmentSuffix: 'prod',
      });

      const [eventBusName, tableName, functionName] = await Promise.all([
        unwrapOutput(stack.eventBusName),
        unwrapOutput(stack.dynamodbTableName),
        unwrapOutput(stack.priceProcessorFunctionName),
      ]);

      expect(eventBusName).toContain('-prod');
      expect(tableName).toContain('-prod');
      expect(functionName).toContain('-prod');
    });
  });

  describe('Stack Outputs', () => {
    it('should register all required outputs', async () => {
      const stack = new TapStack('test-outputs', {
        environmentSuffix: 'output-test',
      });

      // Verify all outputs are defined
      expect(stack.eventBusArn).toBeDefined();
      expect(stack.eventBusName).toBeDefined();
      expect(stack.priceProcessorFunctionName).toBeDefined();
      expect(stack.alertGeneratorFunctionName).toBeDefined();
      expect(stack.dynamodbTableName).toBeDefined();
      expect(stack.snsTopicArn).toBeDefined();

      // Verify outputs can be resolved
      const outputs = await Promise.all([
        unwrapOutput(stack.eventBusArn),
        unwrapOutput(stack.eventBusName),
        unwrapOutput(stack.priceProcessorFunctionName),
        unwrapOutput(stack.alertGeneratorFunctionName),
        unwrapOutput(stack.dynamodbTableName),
        unwrapOutput(stack.snsTopicArn),
      ]);

      outputs.forEach((output) => {
        expect(output).toBeTruthy();
        expect(typeof output).toBe('string');
      });
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty tags object', async () => {
      const stack = new TapStack('test-empty-tags', {
        environmentSuffix: 'test',
        tags: {},
      });

      expect(stack).toBeDefined();
      const eventBusName = await unwrapOutput(stack.eventBusName);
      expect(eventBusName).toBeTruthy();
    });

    it('should handle undefined tags', async () => {
      const stack = new TapStack('test-undefined-tags', {
        environmentSuffix: 'test',
        tags: undefined,
      });

      expect(stack).toBeDefined();
      const eventBusName = await unwrapOutput(stack.eventBusName);
      expect(eventBusName).toBeTruthy();
    });

    it('should handle missing environmentSuffix (defaults to dev)', async () => {
      const stack = new TapStack('test-no-suffix', {});

      const eventBusName = await unwrapOutput(stack.eventBusName);
      expect(eventBusName).toContain('-dev');
    });

    it('should handle special characters in environmentSuffix', async () => {
      const stack = new TapStack('test-special-chars', {
        environmentSuffix: 'test-123',
      });

      const eventBusName = await unwrapOutput(stack.eventBusName);
      expect(eventBusName).toContain('test-123');
    });
  });

  describe('Component Resource Type', () => {
    it('should be registered as a component resource', () => {
      const stack = new TapStack('test-component', {
        environmentSuffix: 'comp',
      });

      expect(stack).toBeInstanceOf(pulumi.ComponentResource);
    });
  });
});
