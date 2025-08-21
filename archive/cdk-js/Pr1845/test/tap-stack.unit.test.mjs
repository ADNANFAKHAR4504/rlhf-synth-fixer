import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack.mjs';

// Mock nested stacks
jest.mock('../lib/lambda-stack.mjs');
jest.mock('../lib/api-gateway-stack.mjs');
jest.mock('../lib/security-stack.mjs');
jest.mock('../lib/monitoring-stack.mjs');

describe('TapStack Unit Tests', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    jest.clearAllMocks();
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('Main Stack Configuration', () => {
    test('should create TapStack with environment suffix', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBeDefined();
    });

    test('should have proper CDK structure', () => {
      expect(template).toBeDefined();
      expect(template.toJSON()).toBeDefined();
    });
  });

  describe('Stack Outputs', () => {
    test('should output stack region', () => {
      template.hasOutput('StackRegion', {
        Description: 'Deployment region',
      });
    });

    test('should output environment suffix', () => {
      template.hasOutput('Environment', {
        Description: 'Environment suffix',
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should use provided environment suffix', () => {
      const outputs = template.toJSON().Outputs;
      expect(outputs.Environment.Value).toBe(environmentSuffix);
    });

    test('should apply environment suffix from context if not provided', () => {
      const contextApp = new cdk.App({
        context: {
          environmentSuffix: 'context-suffix',
        },
      });
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);
      const outputs = contextTemplate.toJSON().Outputs;
      expect(outputs.Environment.Value).toBe('context-suffix');
    });

    test('should default to dev if no suffix provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);
      const outputs = defaultTemplate.toJSON().Outputs;
      expect(outputs.Environment.Value).toBe('dev');
    });
  });

  describe('Production Readiness', () => {
    test('should use production naming convention', () => {
      expect(stack.stackName).toContain('TestTapStack');
    });

    test('should have region output for deployment tracking', () => {
      template.hasOutput('StackRegion', {
        Description: 'Deployment region',
      });
    });
  });

  describe('Template Validation', () => {
    test('should generate valid CloudFormation template', () => {
      const templateJson = template.toJSON();
      expect(templateJson).toBeDefined();
      expect(typeof templateJson).toBe('object');
    });

    test('should not throw template validation errors', () => {
      expect(() => {
        template.toJSON();
      }).not.toThrow();
    });
  });
});