import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

// Mock the ServerlessNotificationStack to verify it's called correctly
jest.mock('../lib/serverless-notification-stack.mjs', () => ({
  ServerlessNotificationStack: jest.fn().mockImplementation((scope, id, props) => {
    // Import CDK inside the mock to avoid scope issues
    const { Stack, CfnOutput } = require('aws-cdk-lib');
    const stack = new Stack(scope, id, props);
    // Add minimal mocked outputs to verify interaction
    new CfnOutput(stack, 'MockedOutput', { value: 'mocked' });
    return stack;
  }),
}));

describe('TapStack', () => {
  let app;
  let stack;
  let template;

  const defaultProps = {
    environmentSuffix: 'test',
    env: {
      account: '123456789012',
      region: 'us-east-1',
    },
  };

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', defaultProps);
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates stack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('stores serverless notification stack reference', () => {
      expect(stack.serverlessNotificationStack).toBeDefined();
    });
  });

  describe('Environment Suffix Handling', () => {
    test('uses provided environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomTapStack', { environmentSuffix: 'prod' });
      expect(customStack).toBeDefined();
      
      // Verify ServerlessNotificationStack was called with correct suffix
      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      expect(ServerlessNotificationStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessNotificationStackprod',
        expect.objectContaining({
          environmentSuffix: 'prod',
          description: 'Serverless Notification Service for async task processing - prod',
        })
      );
    });

    test('uses environment suffix from CDK context', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'staging');
      const contextStack = new TapStack(contextApp, 'ContextTapStack', {});
      expect(contextStack).toBeDefined();

      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      expect(ServerlessNotificationStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessNotificationStackstaging',
        expect.objectContaining({
          environmentSuffix: 'staging',
          description: 'Serverless Notification Service for async task processing - staging',
        })
      );
    });

    test('defaults to dev when no environment suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTapStack', {});
      expect(defaultStack).toBeDefined();

      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      expect(ServerlessNotificationStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessNotificationStackdev',
        expect.objectContaining({
          environmentSuffix: 'dev',
          description: 'Serverless Notification Service for async task processing - dev',
        })
      );
    });

    test('props environment suffix takes precedence over context', () => {
      const precedenceApp2 = new cdk.App();
      precedenceApp2.node.setContext('environmentSuffix', 'context-env');
      const propsStack = new TapStack(precedenceApp2, 'PropsTapStack', { environmentSuffix: 'props-env' });
      expect(propsStack).toBeDefined();

      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      expect(ServerlessNotificationStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessNotificationStackprops-env',
        expect.objectContaining({
          environmentSuffix: 'props-env',
          description: 'Serverless Notification Service for async task processing - props-env',
        })
      );
    });
  });

  describe('ServerlessNotificationStack Integration', () => {
    test('creates ServerlessNotificationStack with correct parameters', () => {
      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      
      expect(ServerlessNotificationStack).toHaveBeenCalledWith(
        expect.any(Object), // scope (app)
        'ServerlessNotificationStacktest',
        expect.objectContaining({
          environmentSuffix: 'test',
          description: 'Serverless Notification Service for async task processing - test',
        })
      );
    });

    test('passes through additional props to ServerlessNotificationStack', () => {
      const additionalProps = {
        environmentSuffix: 'props-test',
        env: { account: '999999999999', region: 'us-west-2' },
        additionalProp: 'value',
      };

      const propsApp = new cdk.App();
      const propsStack = new TapStack(propsApp, 'PropsTapStack', additionalProps);
      expect(propsStack).toBeDefined();

      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      expect(ServerlessNotificationStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessNotificationStackprops-test',
        expect.objectContaining({
          ...additionalProps,
          environmentSuffix: 'props-test',
          description: 'Serverless Notification Service for async task processing - props-test',
        })
      );
    });

    test('creates ServerlessNotificationStack exactly once', () => {
      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      expect(ServerlessNotificationStack).toHaveBeenCalledTimes(1);
    });
  });

  describe('CloudFormation Outputs', () => {
    test('creates orchestrator status output', () => {
      template.hasOutput('OrchestratorStatustest', {
        Value: 'ORCHESTRATOR_DEPLOYED',
        Description: 'Serverless notification service orchestrator status - test',
      });
    });

    test('creates output with correct environment suffix', () => {
      const prodApp = new cdk.App();
      const prodStack = new TapStack(prodApp, 'ProdTapStack', { environmentSuffix: 'prod' });
      const prodTemplate = Template.fromStack(prodStack);
      
      prodTemplate.hasOutput('OrchestratorStatusprod', {
        Value: 'ORCHESTRATOR_DEPLOYED',
        Description: 'Serverless notification service orchestrator status - prod',
      });
    });
  });

  describe('Stack Properties', () => {
    test('inherits properties from parent Stack class', () => {
      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack.stackName).toBe('TestTapStack');
      expect(stack.region).toBeDefined();
      expect(stack.account).toBeDefined();
    });

    test('exposes serverlessNotificationStack for external access', () => {
      expect(stack.serverlessNotificationStack).toBeDefined();
      expect(stack.serverlessNotificationStack).toBeInstanceOf(cdk.Stack);
    });
  });

  describe('Edge Cases', () => {
    test('handles empty props object', () => {
      const emptyApp = new cdk.App();
      const emptyStack = new TapStack(emptyApp, 'EmptyTapStack', {});
      expect(emptyStack).toBeDefined();
      
      const emptyTemplate = Template.fromStack(emptyStack);
      emptyTemplate.hasOutput('OrchestratorStatusdev', {
        Value: 'ORCHESTRATOR_DEPLOYED',
        Description: 'Serverless notification service orchestrator status - dev',
      });
    });

    test('handles null environment suffix', () => {
      const nullApp = new cdk.App();
      const nullStack = new TapStack(nullApp, 'NullTapStack', { environmentSuffix: null });
      expect(nullStack).toBeDefined();
      
      // Should default to 'dev' when environmentSuffix is null
      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      expect(ServerlessNotificationStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessNotificationStackdev',
        expect.objectContaining({
          environmentSuffix: 'dev',
        })
      );
    });

    test('handles undefined environment suffix', () => {
      const undefinedApp = new cdk.App();
      const undefinedStack = new TapStack(undefinedApp, 'UndefinedTapStack', { environmentSuffix: undefined });
      expect(undefinedStack).toBeDefined();
      
      // Should default to 'dev' when environmentSuffix is undefined
      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      expect(ServerlessNotificationStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessNotificationStackdev',
        expect.objectContaining({
          environmentSuffix: 'dev',
        })
      );
    });
  });

  describe('Integration Points', () => {
    test('scope parameter is passed correctly to nested stack', () => {
      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      
      expect(ServerlessNotificationStack).toHaveBeenCalledWith(
        app, // scope should be the app, not the TapStack
        expect.any(String),
        expect.any(Object)
      );
    });

    test('nested stack ID includes environment suffix', () => {
      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      
      expect(ServerlessNotificationStack).toHaveBeenCalledWith(
        expect.any(Object),
        'ServerlessNotificationStacktest',
        expect.any(Object)
      );
    });

    test('nested stack receives all required props', () => {
      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      const calledWith = ServerlessNotificationStack.mock.calls[0][2];
      
      expect(calledWith).toHaveProperty('environmentSuffix', 'test');
      expect(calledWith).toHaveProperty('description');
      expect(calledWith.description).toContain('test');
    });
  });

  describe('Constructor Behavior', () => {
    test('calls super constructor with correct parameters', () => {
      // This is implicitly tested by the stack being created successfully
      expect(stack.node.id).toBe('TestTapStack');
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('environment suffix resolution follows correct precedence', () => {
      // Test precedence: props > context > default
      
      // 1. Props takes precedence over context
      const precedenceApp = new cdk.App();
      precedenceApp.node.setContext('environmentSuffix', 'context');
      const propsStack = new TapStack(precedenceApp, 'PreferenceTestStack', { 
        environmentSuffix: 'props' 
      });
      
      const { ServerlessNotificationStack } = require('../lib/serverless-notification-stack.mjs');
      expect(ServerlessNotificationStack).toHaveBeenLastCalledWith(
        expect.any(Object),
        'ServerlessNotificationStackprops',
        expect.objectContaining({
          environmentSuffix: 'props',
        })
      );
    });
  });
});