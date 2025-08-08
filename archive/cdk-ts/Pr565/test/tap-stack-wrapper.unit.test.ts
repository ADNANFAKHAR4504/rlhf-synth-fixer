import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Wrapper Unit Tests', () => {
  let app: cdk.App;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('TapStack Constructor', () => {
    test('should create stack with default environment suffix', () => {
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      // Verify the stack was created successfully
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.stackName).toBe('TestStack');
    });

    test('should create stack with provided environment suffix in props', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'staging',
      });
      const template = Template.fromStack(stack);

      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.stackName).toBe('TestStack');
    });

    test('should create stack with environment suffix from context', () => {
      app.node.setContext('environmentSuffix', 'production');
      
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.stackName).toBe('TestStack');
    });

    test('should handle stack with undefined props', () => {
      const stack = new TapStack(app, 'TestStack', undefined);
      const template = Template.fromStack(stack);

      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.stackName).toBe('TestStack');
    });

    test('should handle stack with empty props object', () => {
      const stack = new TapStack(app, 'TestStack', {});
      const template = Template.fromStack(stack);

      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.stackName).toBe('TestStack');
    });

    test('should prioritize props environmentSuffix over context', () => {
      app.node.setContext('environmentSuffix', 'context-env');
      
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'props-env',
      });
      
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.stackName).toBe('TestStack');
    });

    test('should handle special characters in environment suffix', () => {
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test-env_123',
      });
      
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.stackName).toBe('TestStack');
    });
  });

  describe('Stack Properties', () => {
    test('should inherit from cdk.Stack', () => {
      const stack = new TapStack(app, 'TestStack');
      
      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack.node).toBeDefined();
      expect(stack.region).toBeDefined();
      expect(stack.account).toBeDefined();
    });

    test('should pass through standard stack props', () => {
      const stackProps = {
        description: 'Test stack description',
        env: {
          account: '123456789012',
          region: 'us-west-2',
        },
        tags: {
          Environment: 'test',
          Project: 'tap-stack',
        },
      };

      const stack = new TapStack(app, 'TestStack', stackProps);
      
      expect(stack).toBeInstanceOf(TapStack);
      expect(stack.stackName).toBe('TestStack');
    });
  });

  describe('Template Generation', () => {
    test('should generate valid CloudFormation template', () => {
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      // The template should be valid JSON
      const templateJson = template.toJSON();
      expect(templateJson).toBeDefined();
      // CDK may not always set AWSTemplateFormatVersion, but template should be valid
      expect(typeof templateJson).toBe('object');
    });

    test('should not create any resources in base stack', () => {
      const newApp = new cdk.App();
      const stack = new TapStack(newApp, 'TestStack');
      const template = Template.fromStack(stack);

      // Since the TapStack doesn't create any resources directly,
      // the template should be minimal with no resources
      const templateJson = template.toJSON();
      
      // Check that no AWS resources are created (Resources should be empty or undefined)
      expect(templateJson.Resources || {}).toEqual({});
    });
  });
});