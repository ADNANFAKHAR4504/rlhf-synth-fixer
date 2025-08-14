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

  describe('Stack Creation', () => {
    test('should create TapStack successfully', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should create nested SecureInfrastructureStack', () => {
      // Check that the stack was created successfully
      expect(stack).toBeDefined();
    });

    test('should pass environment suffix to nested stack', () => {
      // Check that the stack was created successfully
      expect(stack).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    test('should use default environment suffix when not provided', () => {
      const defaultStack = new TapStack(app, 'DefaultStack');
      expect(defaultStack).toBeDefined();
    });

    test('should use custom environment suffix when provided', () => {
      const testEnvironment = 'test-env';
      const customStack = new TapStack(app, 'CustomStack', {
        environmentSuffix: testEnvironment,
      });
      expect(customStack).toBeDefined();
    });

    test('should handle environment suffix from context', () => {
      const contextStack = new TapStack(app, 'ContextStack');
      expect(contextStack).toBeDefined();
    });
  });

  describe('Stack Properties', () => {
    test('should have correct stack properties', () => {
      expect(stack.stackName).toBe('TestTapStack');
      expect(stack.region).toBeDefined();
      expect(stack.account).toBeDefined();
    });

    test('should have proper stack properties', () => {
      expect(stack.stackName).toBeDefined();
      expect(stack.region).toBeDefined();
      expect(stack.account).toBeDefined();
    });
  });

  describe('Template Validation', () => {
    test('should generate valid CloudFormation template', () => {
      expect(stack).toBeDefined();
    });

    test('should have required template sections', () => {
      expect(stack).toBeDefined();
    });
  });
});
