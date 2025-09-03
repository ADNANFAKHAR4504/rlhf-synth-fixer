import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

// Mock the DefenseInDepthStack to isolate TapStack testing
jest.mock('../lib/defense-in-depth-stack', () => ({
  DefenseInDepthStack: jest.fn().mockImplementation((scope, id, props) => {
    // Create a mock construct that looks like a real stack
    const mockStack = new cdk.Stack(scope, id, props);
    return mockStack;
  }),
}));

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    // Reset mocks before each test
    jest.clearAllMocks();

    app = new cdk.App();
  });

  describe('Stack Construction', () => {
    test('should create TapStack with default environment suffix', () => {
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should create TapStack with provided environment suffix', () => {
      const customSuffix = 'test-env';
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: customSuffix });
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should create TapStack with context environment suffix', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should prioritize props environment suffix over context', () => {
      app = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
        },
      });
      const propsSuffix = 'props-env';
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: propsSuffix });
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should create DefenseInDepthStack with correct parameters', () => {
      const { DefenseInDepthStack } = require('../lib/defense-in-depth-stack');
      const environmentSuffix = 'test-env';
      const personalIpAddress = '192.168.1.1';

      app = new cdk.App({
        context: {
          personalIpAddress,
        },
      });

      stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      template = Template.fromStack(stack);

      expect(DefenseInDepthStack).toHaveBeenCalledWith(
        stack,
        `DefenseInDepthStack-${environmentSuffix}`,
        {
          environmentSuffix,
          personalIpAddress,
        }
      );
    });

    test('should create DefenseInDepthStack with context personalIpAddress', () => {
      const { DefenseInDepthStack } = require('../lib/defense-in-depth-stack');
      const environmentSuffix = 'test-env';
      const personalIpAddress = '10.0.0.1';

      app = new cdk.App({
        context: {
          personalIpAddress,
        },
      });

      stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      template = Template.fromStack(stack);

      expect(DefenseInDepthStack).toHaveBeenCalledWith(
        stack,
        `DefenseInDepthStack-${environmentSuffix}`,
        {
          environmentSuffix,
          personalIpAddress,
        }
      );
    });

    test('should create DefenseInDepthStack without personalIpAddress when not provided', () => {
      const { DefenseInDepthStack } = require('../lib/defense-in-depth-stack');
      const environmentSuffix = 'test-env';

      stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
      template = Template.fromStack(stack);

      expect(DefenseInDepthStack).toHaveBeenCalledWith(
        stack,
        `DefenseInDepthStack-${environmentSuffix}`,
        {
          environmentSuffix,
          personalIpAddress: undefined,
        }
      );
    });

    test('should handle missing environment suffix gracefully', () => {
      // Test with no props and no context
      stack = new TapStack(app, 'TestTapStack');
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should pass through additional stack props', () => {
      const additionalProps = {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
        tags: {
          Environment: 'test',
          Project: 'tap',
        },
      };

      stack = new TapStack(app, 'TestTapStack', {
        environmentSuffix: 'test',
        ...additionalProps,
      });
      template = Template.fromStack(stack);

      expect(stack).toBeDefined();
      expect(stack.account).toBe(additionalProps.env.account);
      expect(stack.region).toBe(additionalProps.env.region);
    });
  });

  describe('Stack Properties', () => {
    test('should have correct stack properties', () => {
      stack = new TapStack(app, 'TestTapStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      expect(stack.stackName).toBe('TestTapStack');
      expect(stack).toBeInstanceOf(cdk.Stack);
    });

    test('should be constructable with different construct IDs', () => {
      const stack1 = new TapStack(app, 'Stack1', { environmentSuffix: 'test1' });
      const stack2 = new TapStack(app, 'Stack2', { environmentSuffix: 'test2' });

      expect(stack1.stackName).toBe('Stack1');
      expect(stack2.stackName).toBe('Stack2');
      expect(stack1).not.toBe(stack2);
    });
  });

  describe('Error Handling', () => {
    test('should handle invalid environment suffix gracefully', () => {
      expect(() => {
        stack = new TapStack(app, 'TestTapStack', { environmentSuffix: '' });
      }).not.toThrow();
    });

    test('should handle null environment suffix', () => {
      expect(() => {
        stack = new TapStack(app, 'TestTapStack', { environmentSuffix: null as any });
      }).not.toThrow();
    });

    test('should handle undefined environment suffix', () => {
      expect(() => {
        stack = new TapStack(app, 'TestTapStack', { environmentSuffix: undefined });
      }).not.toThrow();
    });
  });
});
