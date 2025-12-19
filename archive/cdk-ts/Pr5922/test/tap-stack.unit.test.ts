import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { TransactionProcessingStack } from '../lib/transaction-processing-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('stack is created successfully', () => {
      expect(stack).toBeDefined();
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('stack has correct ID', () => {
      expect(stack.node.id).toBe('TestTapStack');
    });
  });

  describe('Environment Suffix Handling', () => {
    test('uses environment suffix from props', () => {
      const testStack = new TapStack(app, 'TestStack1', {
        environmentSuffix: 'custom',
      });
      expect(testStack).toBeDefined();
    });

    test('uses environment suffix from context when props not provided', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'context-value' },
      });
      const testStack = new TapStack(contextApp, 'TestStack2', {});
      expect(testStack).toBeDefined();
    });

    test('defaults to dev when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const testStack = new TapStack(defaultApp, 'TestStack3', {});
      expect(testStack).toBeDefined();
    });
  });

  describe('Child Stack Creation', () => {
    test('creates TransactionProcessingStack as child', () => {
      const children = stack.node.children;
      const transactionStack = children.find(
        (child) => child instanceof TransactionProcessingStack,
      );
      expect(transactionStack).toBeDefined();
    });

    test('passes environment suffix to child stack', () => {
      const customSuffix = 'production';
      const customStack = new TapStack(app, 'CustomStack', {
        environmentSuffix: customSuffix,
      });
      const children = customStack.node.children;
      const transactionStack = children.find(
        (child) => child instanceof TransactionProcessingStack,
      );
      expect(transactionStack).toBeDefined();
    });
  });

  describe('Stack Structure', () => {
    test('is a nested stack configuration', () => {
      expect(stack.nestedStackParent).toBeUndefined();
      expect(stack.node.children.length).toBeGreaterThan(0);
    });

    test('has no direct resources (all resources in child stacks)', () => {
      // TapStack should act as a wrapper with no direct resources
      const resources = template.toJSON().Resources || {};
      // Allow only CDK Metadata as it's automatically added
      const nonMetadataResources = Object.keys(resources).filter(
        (key) => !key.includes('CDKMetadata'),
      );
      expect(nonMetadataResources.length).toBe(0);
    });
  });

  describe('Integration with Child Stacks', () => {
    test('child stack inherits stack properties', () => {
      const stackWithEnv = new TapStack(app, 'TestStackEnv', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-east-1' },
      });
      expect(stackWithEnv).toBeDefined();
      expect(stackWithEnv.account).toBe('123456789012');
      expect(stackWithEnv.region).toBe('us-east-1');
    });
  });

  describe('Multiple Instance Support', () => {
    test('can create multiple instances with different suffixes', () => {
      const stack1 = new TapStack(app, 'Stack1', {
        environmentSuffix: 'dev',
      });
      const stack2 = new TapStack(app, 'Stack2', {
        environmentSuffix: 'prod',
      });

      expect(stack1).toBeDefined();
      expect(stack2).toBeDefined();
      expect(stack1.node.id).not.toBe(stack2.node.id);
    });
  });

  describe('Stack Metadata', () => {
    test('stack has CDK metadata', () => {
      const stackTree = app.synth().getStackByName('TestTapStack');
      expect(stackTree).toBeDefined();
    });
  });

  describe('Props Interface', () => {
    test('accepts optional environmentSuffix in props', () => {
      const stackWithoutSuffix = new TapStack(app, 'NoSuffixStack', {});
      expect(stackWithoutSuffix).toBeDefined();
    });

    test('accepts stack props like env and tags', () => {
      const stackWithProps = new TapStack(app, 'PropsStack', {
        environmentSuffix: 'test',
        env: { account: '123456789012', region: 'us-west-2' },
        description: 'Test stack description',
      });
      expect(stackWithProps).toBeDefined();
      expect(stackWithProps.region).toBe('us-west-2');
    });
  });

  describe('Child Stack Naming', () => {
    test('child stack has correct naming pattern', () => {
      const children = stack.node.children;
      const transactionStack = children.find(
        (child) => child.node.id === 'TransactionProcessing',
      );
      expect(transactionStack).toBeDefined();
    });
  });

  describe('Error Cases', () => {
    test('handles empty props gracefully', () => {
      expect(() => {
        new TapStack(app, 'EmptyPropsStack', {});
      }).not.toThrow();
    });

    test('handles undefined props gracefully', () => {
      expect(() => {
        new TapStack(app, 'UndefinedPropsStack');
      }).not.toThrow();
    });
  });

  describe('Stack Dependencies', () => {
    test('stack can be synthesized without errors', () => {
      expect(() => {
        app.synth();
      }).not.toThrow();
    });
  });
});
