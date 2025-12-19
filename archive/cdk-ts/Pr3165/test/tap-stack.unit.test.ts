import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { WebAppStack } from '../lib/webapp';

// Mock the WebAppStack to verify it is called correctly
jest.mock('../lib/webapp');

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('Stack Creation', () => {
    test('creates TapStack successfully', () => {
      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack.stackName).toBeDefined();
    });

    test('instantiates WebAppStack with correct parameters', () => {
      expect(WebAppStack).toHaveBeenCalledWith(
        stack,
        `WebAppStack-${environmentSuffix}`,
        expect.objectContaining({
          environmentSuffix,
        })
      );
    });

    test('passes environment suffix from props', () => {
      const customEnv = 'prod';
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomTapStack', {
        environmentSuffix: customEnv,
      });

      expect(WebAppStack).toHaveBeenCalledWith(
        customStack,
        `WebAppStack-${customEnv}`,
        expect.objectContaining({
          environmentSuffix: customEnv,
        })
      );
    });

    test('uses default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultTapStack', {});

      expect(WebAppStack).toHaveBeenCalledWith(
        defaultStack,
        'WebAppStack-dev',
        expect.objectContaining({
          environmentSuffix: 'dev',
        })
      );
    });

    test('uses environment suffix from context when available', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'staging',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextTapStack', {});

      expect(WebAppStack).toHaveBeenCalledWith(
        contextStack,
        'WebAppStack-staging',
        expect.objectContaining({
          environmentSuffix: 'staging',
        })
      );
    });
  });

  describe('Stack Properties', () => {
    test('accepts and uses custom stack properties', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomPropsStack', {
        environmentSuffix,
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
        description: 'Test stack description',
      });

      expect(customStack).toBeInstanceOf(cdk.Stack);
      expect(WebAppStack).toHaveBeenCalledWith(
        customStack,
        `WebAppStack-${environmentSuffix}`,
        expect.objectContaining({
          environmentSuffix,
          env: {
            account: '123456789012',
            region: 'us-west-2',
          },
          description: 'Test stack description',
        })
      );
    });

    test('propagates all props to WebAppStack', () => {
      const customApp = new cdk.App();
      const testProps = {
        environmentSuffix: 'integration',
        env: {
          account: '999888777666',
          region: 'eu-west-1',
        },
        stackName: 'CustomStackName',
        description: 'Custom description',
        tags: {
          Project: 'TestProject',
        },
      };

      const propagationStack = new TapStack(customApp, 'PropagationTest', testProps);

      expect(WebAppStack).toHaveBeenCalledWith(
        propagationStack,
        'WebAppStack-integration',
        expect.objectContaining(testProps)
      );
    });
  });

  describe('Environment Suffix Handling', () => {
    test('prioritizes props environmentSuffix over context', () => {
      const propsApp = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });
      const priorityStack = new TapStack(propsApp, 'PriorityTest', {
        environmentSuffix: 'props-env',
      });

      expect(WebAppStack).toHaveBeenCalledWith(
        priorityStack,
        'WebAppStack-props-env',
        expect.objectContaining({
          environmentSuffix: 'props-env',
        })
      );
    });

    test('uses different environment suffixes for multiple stacks', () => {
      jest.clearAllMocks();
      const multiApp = new cdk.App();

      const devStack = new TapStack(multiApp, 'DevStack', { environmentSuffix: 'dev' });
      const stagingStack = new TapStack(multiApp, 'StagingStack', { environmentSuffix: 'staging' });
      const prodStack = new TapStack(multiApp, 'ProdStack', { environmentSuffix: 'prod' });

      expect(WebAppStack).toHaveBeenCalledTimes(3);
      expect(WebAppStack).toHaveBeenNthCalledWith(
        1,
        devStack,
        'WebAppStack-dev',
        expect.objectContaining({ environmentSuffix: 'dev' })
      );
      expect(WebAppStack).toHaveBeenNthCalledWith(
        2,
        stagingStack,
        'WebAppStack-staging',
        expect.objectContaining({ environmentSuffix: 'staging' })
      );
      expect(WebAppStack).toHaveBeenNthCalledWith(
        3,
        prodStack,
        'WebAppStack-prod',
        expect.objectContaining({ environmentSuffix: 'prod' })
      );
    });
  });

  describe('Stack Structure', () => {
    test('TapStack is empty and only orchestrates child stacks', () => {
      const resources = template.toJSON().Resources || {};
      expect(Object.keys(resources).length).toBe(0);
    });

    test('creates child stack with correct scope', () => {
      expect(WebAppStack).toHaveBeenCalledWith(
        stack,
        expect.any(String),
        expect.any(Object)
      );
    });
  });
});
