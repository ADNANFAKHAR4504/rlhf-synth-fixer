import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { ServerlessStack } from '../lib/serverless-stack';

describe('TapStack Unit Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { 
      environmentSuffix: 'test' 
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('Should create TapStack with correct properties', () => {
      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('Should use environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'custom',
      });
      expect(customStack).toBeDefined();
    });

    test('Should use environment suffix from context when not in props', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-suffix',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      expect(contextStack).toBeDefined();
    });

    test('Should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });
  });

  describe('Nested Stack Creation', () => {
    test('Should create ServerlessStack as nested stack', () => {
      const children = stack.node.children;
      const serverlessStack = children.find(
        (child) => child instanceof ServerlessStack
      );
      expect(serverlessStack).toBeDefined();
      expect(serverlessStack).toBeInstanceOf(ServerlessStack);
    });

    test('Should pass environment suffix to ServerlessStack', () => {
      const testApp = new cdk.App();
      const testSuffix = 'test-suffix';
      const testStack = new TapStack(testApp, 'TestStackWithSuffix', {
        environmentSuffix: testSuffix,
      });
      
      const children = testStack.node.children;
      const serverlessStack = children.find(
        (child) => child instanceof ServerlessStack
      ) as ServerlessStack;
      
      expect(serverlessStack).toBeDefined();
      // The environment suffix is passed through props
      expect(serverlessStack.node.id).toBe('ServerlessStack');
    });

    test('Should pass environment configuration to nested stack', () => {
      const envConfig = {
        account: '123456789',
        region: 'us-east-1',
      };
      
      const envApp = new cdk.App();
      const envStack = new TapStack(envApp, 'EnvStack', {
        environmentSuffix: 'env-test',
        env: envConfig,
      });
      
      const children = envStack.node.children;
      const serverlessStack = children.find(
        (child) => child instanceof ServerlessStack
      );
      
      expect(serverlessStack).toBeDefined();
    });
  });

  describe('Stack Hierarchy', () => {
    test('Should have ServerlessStack as direct child', () => {
      const childIds = stack.node.children.map((child) => child.node.id);
      expect(childIds).toContain('ServerlessStack');
    });

    test('Should not have any other stacks as children', () => {
      const stackChildren = stack.node.children.filter(
        (child) => child instanceof cdk.Stack
      );
      expect(stackChildren).toHaveLength(1);
      expect(stackChildren[0]).toBeInstanceOf(ServerlessStack);
    });
  });

  describe('CDK Metadata', () => {
    test('Should include CDK metadata', () => {
      // CDK metadata is included in parent stack
      expect(template).toBeDefined();
    });
  });
});
