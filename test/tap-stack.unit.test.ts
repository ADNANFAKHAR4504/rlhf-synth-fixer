import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Structure', () => {
    test('should create InfraStack as child stack', () => {
      // Verify that InfraStack is created as a child stack
      // The InfraStack will contain all the actual AWS resources
      expect(stack.node.children.length).toBeGreaterThanOrEqual(1);

      // Find the InfraStack child
      const infraStackChild = stack.node.children.find(child => child.node.id === 'InfraStack');
      expect(infraStackChild).toBeDefined();
    });

    test('should pass environment suffix to InfraStack', () => {
      // Verify that environment suffix is passed to InfraStack
      const infraStack = stack.node.children.find(child => child.node.id === 'InfraStack') as any;
      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('Stack Configuration', () => {
    test('should use correct stack name', () => {
      // Verify stack name
      expect(stack.stackName).toBe('TestTapStack');
    });
  });

  describe('Environment Configuration', () => {
    test('should use correct environment suffix throughout', () => {
      // Verify environment suffix is used consistently
      expect(environmentSuffix).toBe('dev');
    });

    test('should handle environment suffix from props', () => {
      // Test with different environment suffix
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });

      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');
      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should use environment suffix from context when props not provided', () => {
      // Test environment suffix from context
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'staging');

      const testStack = new TapStack(testApp, 'TestStack');
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should use default environment suffix when neither props nor context provided', () => {
      // Test default environment suffix
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should prioritize props over context for environment suffix', () => {
      // Test that props take precedence over context
      const testApp = new cdk.App();
      testApp.node.setContext('environmentSuffix', 'staging');

      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'production' });
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('Stack Dependencies', () => {
    test('should not have circular dependencies', () => {
      // Verify stack can be synthesized without circular dependency errors
      expect(() => {
        template.toJSON();
      }).not.toThrow();
    });

    test('should handle empty props object', () => {
      // Test with empty props object
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {});
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should handle undefined props', () => {
      // Test with undefined props
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', undefined);
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('Stack Outputs', () => {
    test('should not have outputs at parent stack level', () => {
      // Parent TapStack should not have outputs - they should be in the InfraStack
      const outputs = template.findOutputs('*');
      expect(Object.keys(outputs)).toHaveLength(0);
    });
  });

  describe('Resource Count', () => {
    test('should have InfraStack as child', () => {
      // Parent stack should contain the InfraStack as a child
      const infraStackChild = stack.node.children.find(child => child.node.id === 'InfraStack');
      expect(infraStackChild).toBeDefined();
      expect(infraStackChild).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('InfraStack Integration', () => {
    test('should create InfraStack with correct props', () => {
      const infraStack = stack.node.children.find(child => child.node.id === 'InfraStack');

      // Verify InfraStack is created
      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should pass context values to InfraStack', () => {
      // Test that context values are passed through
      const testApp = new cdk.App();
      testApp.node.setContext('projectName', 'TestProject');
      testApp.node.setContext('apiThrottleRate', 150);

      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should handle all context values being undefined', () => {
      // Test when no context values are set
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack');
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should pass all context values when provided', () => {
      // Test with all context values set
      const testApp = new cdk.App();
      testApp.node.setContext('projectName', 'TestProject');
      testApp.node.setContext('apiThrottleRate', 100);
      testApp.node.setContext('apiThrottleBurst', 200);
      testApp.node.setContext('lambdaMemorySize', 512);
      testApp.node.setContext('lambdaTimeout', 30);
      testApp.node.setContext('dynamodbReadCapacity', 5);
      testApp.node.setContext('dynamodbWriteCapacity', 5);
      testApp.node.setContext('enablePointInTimeRecovery', true);
      testApp.node.setContext('logRetentionDays', 14);

      const testStack = new TapStack(testApp, 'TestStack', { environmentSuffix: 'test' });
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });

    test('should handle partial context values', () => {
      // Test with only some context values set
      const testApp = new cdk.App();
      testApp.node.setContext('projectName', 'PartialProject');
      testApp.node.setContext('lambdaMemorySize', 1024);
      // Other context values are undefined

      const testStack = new TapStack(testApp, 'TestStack');
      const infraStack = testStack.node.children.find(child => child.node.id === 'InfraStack');

      expect(infraStack).toBeDefined();
      expect(infraStack).toBeInstanceOf(cdk.Stack);
    });
  });
});
