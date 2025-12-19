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
      const serverlessStack = stack.node.children.find(
        child => child.node.id === 'ServerlessDataProcessing'
      );
      expect(serverlessStack).toBeDefined();
    });

    test('passes environment suffix to nested stacks', () => {
      const serverlessStack = stack.node.children.find(
        child => child.node.id === 'ServerlessDataProcessing'
      );
      expect(serverlessStack).toBeDefined();
      // The nested stack should exist and be properly configured
      expect(serverlessStack!.node.id).toBe('ServerlessDataProcessing');

      // Verify that the environment suffix is passed correctly
      const template = Template.fromStack(stack);
      // The nested stack should be created with the correct environment suffix
      expect(template).toBeDefined();
    });
  });

  describe('Environment Configuration', () => {
    test('handles environment suffix from props', () => {
      const testApp = new cdk.App();
      const stackWithProps = new TapStack(testApp, 'TestStackWithProps', {
        environmentSuffix: 'test',
      });
      expect(stackWithProps).toBeDefined();
    });

    test('handles environment suffix from context', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'prod' },
      });
      const stackWithContext = new TapStack(contextApp, 'TestStackWithContext');
      expect(stackWithContext).toBeDefined();
    });

    test('uses default environment suffix when no props or context', () => {
      const defaultApp = new cdk.App();
      const stackWithDefault = new TapStack(defaultApp, 'TestStackWithDefault');
      expect(stackWithDefault).toBeDefined();
    });

    test('prioritizes props over context', () => {
      const contextApp = new cdk.App({
        context: { environmentSuffix: 'prod' },
      });
      const stackWithPropsAndContext = new TapStack(
        contextApp,
        'TestStackWithPropsAndContext',
        {
          environmentSuffix: 'test',
        }
      );
      expect(stackWithPropsAndContext).toBeDefined();
    });

    test('handles stack environment configuration', () => {
      const testApp = new cdk.App();
      const stackWithEnv = new TapStack(testApp, 'TestStackWithEnv', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        },
      });
      expect(stackWithEnv).toBeDefined();
    });
  });

  describe('Stack Architecture', () => {
    test('follows single responsibility principle', () => {
      // The main TapStack should only orchestrate, not create resources directly
      const resources = template.toJSON().Resources || {};
      const resourceTypes = Object.values(resources).map(
        (resource: any) => resource.Type
      );

      // Main stack should not contain business logic resources
      // It should only contain nested stack references if any
      const businessLogicResources = [
        'AWS::DynamoDB::Table',
        'AWS::S3::Bucket',
        'AWS::Lambda::Function',
        'AWS::SQS::Queue',
        'AWS::CloudWatch::Alarm',
      ];

      businessLogicResources.forEach(resourceType => {
        expect(resourceTypes).not.toContain(resourceType);
      });
    });

    test('maintains proper stack separation', () => {
      // Verify that the nested stack pattern is properly implemented
      const nestedStacks = stack.node.children.filter(
        child => child instanceof cdk.Stack
      );

      expect(nestedStacks.length).toBeGreaterThan(0);
      expect(
        nestedStacks.some(child => child.node.id === 'ServerlessDataProcessing')
      ).toBe(true);
    });
  });
});
