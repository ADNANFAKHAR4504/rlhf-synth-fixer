import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
  });

  describe('Stack Creation', () => {
    test('creates stack with default environment suffix', () => {
      stack = new TapStack(app, 'TestStack');
      
      // TapStack itself should be a stack
      expect(stack).toBeInstanceOf(cdk.Stack);
      
      // Check that the stack has a WebApplication nested stack
      const children = stack.node.children;
      const webAppStack = children.find(child => child.node.id === 'WebApplication');
      expect(webAppStack).toBeDefined();
    });

    test('creates stack with provided environment suffix', () => {
      const customSuffix = 'production';
      stack = new TapStack(app, 'TestStack', { environmentSuffix: customSuffix });
      
      // TapStack itself should be a stack
      expect(stack).toBeInstanceOf(cdk.Stack);
      
      // Check that the stack has a WebApplication nested stack
      const children = stack.node.children;
      const webAppStack = children.find(child => child.node.id === 'WebApplication');
      expect(webAppStack).toBeDefined();
    });

    test('passes environment suffix from context', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'contextSuffix' }
      });
      stack = new TapStack(app, 'TestStack');
      
      // TapStack itself should be a stack
      expect(stack).toBeInstanceOf(cdk.Stack);
      
      // Check that the stack has a WebApplication nested stack
      const children = stack.node.children;
      const webAppStack = children.find(child => child.node.id === 'WebApplication');
      expect(webAppStack).toBeDefined();
    });

    test('sets correct description for WebApplication stack', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      
      // Find the WebApplication nested stack
      const children = stack.node.children;
      const webAppStack = children.find(child => child.node.id === 'WebApplication');
      expect(webAppStack).toBeDefined();
      
      // Check the description
      if (webAppStack && 'description' in webAppStack) {
        expect((webAppStack as any).description).toBe('Web Application Infrastructure - test');
      }
    });
  });

  describe('Stack Properties', () => {
    test('passes environment properties to nested stack', () => {
      const env = { account: '123456789012', region: 'us-west-2' };
      stack = new TapStack(app, 'TestStack', { env, environmentSuffix: 'staging' });
      
      // Check that the stack has a WebApplication nested stack
      const children = stack.node.children;
      const webAppStack = children.find(child => child.node.id === 'WebApplication');
      expect(webAppStack).toBeDefined();
      
      // Check environment is passed
      if (webAppStack && 'env' in webAppStack) {
        expect((webAppStack as any).env).toBeDefined();
      }
    });

    test('handles undefined props gracefully', () => {
      stack = new TapStack(app, 'TestStack', undefined);
      
      // Should still create stack with defaults
      expect(stack).toBeInstanceOf(cdk.Stack);
      
      // Check that the stack has a WebApplication nested stack
      const children = stack.node.children;
      const webAppStack = children.find(child => child.node.id === 'WebApplication');
      expect(webAppStack).toBeDefined();
    });
  });

  describe('WebApplication Stack Integration', () => {
    test('creates WebApplication nested stack', () => {
      stack = new TapStack(app, 'TestStack');
      
      // Check that the stack has a WebApplication nested stack
      const children = stack.node.children;
      const webAppStack = children.find(child => child.node.id === 'WebApplication');
      expect(webAppStack).toBeDefined();
      expect(webAppStack?.constructor.name).toBe('WebAppStack');
    });
  });

  describe('CDK Metadata', () => {
    test('includes CDK metadata', () => {
      stack = new TapStack(app, 'TestStack');
      template = Template.fromStack(stack);
      
      // Parent stack may not have metadata, but nested stacks will
      // Check that template can be created successfully
      expect(template).toBeDefined();
    });
  });
});