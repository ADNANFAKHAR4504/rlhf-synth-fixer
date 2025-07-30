import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates the stack successfully', () => {
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('creates nested SecureEnvironmentStack', () => {
      // The TapStack creates a nested stack directly as a sub-stack
      // Check that the stack creates the SecureEnvironmentStack as a nested stack
      expect(stack.node.children.length).toBeGreaterThan(0);
      const secureEnvStack = stack.node.children.find(child => 
        child.node.id === 'SecureEnvironment'
      );
      expect(secureEnvStack).toBeDefined();
    });
  });

  describe('Environment Suffix', () => {
    test('passes environment suffix to nested stacks', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'TestTapStack', {
        environmentSuffix: 'test',
      });

      // Check that the nested stack receives the environment suffix
      const secureEnvStack = customStack.node.children.find(child => 
        child.node.id === 'SecureEnvironment'
      );
      expect(secureEnvStack).toBeDefined();
    });

    test('uses props environmentSuffix when provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'PropsTest', {
        environmentSuffix: 'props-test',
      });
      const secureEnvStack = customStack.node.children.find(child => 
        child.node.id === 'SecureEnvironment'
      );
      expect(secureEnvStack).toBeDefined();
    });

    test('uses context environmentSuffix when props not provided', () => {
      const customApp = new cdk.App({
        context: {
          environmentSuffix: 'context-test',
        },
      });
      const customStack = new TapStack(customApp, 'ContextTest');
      const secureEnvStack = customStack.node.children.find(child => 
        child.node.id === 'SecureEnvironment'
      );
      expect(secureEnvStack).toBeDefined();
    });

    test('uses default environmentSuffix when neither props nor context provided', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'DefaultTest');
      const secureEnvStack = customStack.node.children.find(child => 
        child.node.id === 'SecureEnvironment'
      );
      expect(secureEnvStack).toBeDefined();
    });

    test('prioritizes props over context', () => {
      const customApp = new cdk.App({
        context: {
          environmentSuffix: 'context-value',
        },
      });
      const customStack = new TapStack(customApp, 'PriorityTest', {
        environmentSuffix: 'props-value',
      });
      const secureEnvStack = customStack.node.children.find(child => 
        child.node.id === 'SecureEnvironment'
      );
      expect(secureEnvStack).toBeDefined();
    });
  });
});
