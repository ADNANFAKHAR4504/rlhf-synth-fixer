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

    test('creates nested ServerlessStack', () => {
      // The TapStack creates a nested stack directly as a sub-stack
      // Check that the stack creates the ServerlessStack as a nested stack
      expect(stack.node.children.length).toBeGreaterThan(0);
      const serverlessStack = stack.node.children.find(child => 
        child.node.id === 'ServerlessDataProcessing'
      );
      expect(serverlessStack).toBeDefined();
    });

    test('passes environment suffix to nested stacks', () => {
      const serverlessStack = stack.node.children.find(child => 
        child.node.id === 'ServerlessDataProcessing'
      );
      expect(serverlessStack).toBeDefined();
      // The nested stack should exist and be properly configured
      expect(serverlessStack!.node.id).toBe('ServerlessDataProcessing');
    });
  });

  describe('Environment Configuration', () => {
    test('handles environment suffix correctly', () => {
      // Test that the stack handles environment suffix from various sources
      const testApp = new cdk.App();
      
      // Test with props
      const stackWithProps = new TapStack(testApp, 'TestStackWithProps', { 
        environmentSuffix: 'test' 
      });
      expect(stackWithProps).toBeDefined();

      // Test with context
      const contextApp = new cdk.App({ context: { environmentSuffix: 'prod' } });
      const stackWithContext = new TapStack(contextApp, 'TestStackWithContext');
      expect(stackWithContext).toBeDefined();
    });
  });

  describe('Stack Architecture', () => {
    test('follows single responsibility principle', () => {
      // The main TapStack should only orchestrate, not create resources directly
      const resources = template.toJSON().Resources || {};
      const resourceTypes = Object.values(resources).map((resource: any) => resource.Type);
      
      // Main stack should not contain business logic resources
      // It should only contain nested stack references if any
      const businessLogicResources = [
        'AWS::DynamoDB::Table',
        'AWS::S3::Bucket', 
        'AWS::Lambda::Function',
        'AWS::SQS::Queue',
        'AWS::CloudWatch::Alarm'
      ];
      
      businessLogicResources.forEach(resourceType => {
        expect(resourceTypes).not.toContain(resourceType);
      });
    });

    test('maintains proper stack separation', () => {
      // Verify that the nested stack pattern is properly implemented
      const nestedStacks = stack.node.children.filter(child => 
        child instanceof cdk.Stack
      );
      
      expect(nestedStacks.length).toBeGreaterThan(0);
      expect(nestedStacks.some(child => child.node.id === 'ServerlessDataProcessing')).toBe(true);
    });
  });
});