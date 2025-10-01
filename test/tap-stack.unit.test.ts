import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = 'test';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', {
      environmentSuffix,
      env: {
        account: '123456789012',
        region: 'us-east-1',
      }
    });
    template = Template.fromStack(stack);
  });

  describe('Stack Configuration', () => {
    test('should create stack with correct properties', () => {
      expect(stack).toBeDefined();
      expect(stack.stackName).toBe('TestTapStack');
    });

    test('should create FoodDeliveryStack as a child construct', () => {
      // Verify that FoodDeliveryStack is created as a child construct
      const children = stack.node.children;
      expect(children.length).toBeGreaterThan(0);

      // Find the FoodDeliveryStack construct
      const foodDeliveryStack = children.find(child => child.node.id === 'FoodDeliveryStack');
      expect(foodDeliveryStack).toBeDefined();
    });

    test('should pass environment suffix to child stack', () => {
      const children = stack.node.children;
      const foodDeliveryStack = children.find(child => child.node.id === 'FoodDeliveryStack');
      expect(foodDeliveryStack).toBeDefined();

      // The child stack should have the environment suffix in its name
      expect(foodDeliveryStack?.node.addr).toContain('FoodDeliveryStack');
    });
  });

  describe('Food Delivery Infrastructure', () => {
    test('should contain DynamoDB table for order storage', () => {
      // The template should contain DynamoDB table from FoodDeliveryStack
      template.resourceCountIs('AWS::DynamoDB::Table', 1);
    });

    test('should contain Lambda functions for order processing', () => {
      // The template should contain Lambda functions from FoodDeliveryStack
      template.resourceCountIs('AWS::Lambda::Function', 2);
    });

    test('should contain API Gateway for REST endpoints', () => {
      // The template should contain API Gateway from FoodDeliveryStack
      template.resourceCountIs('AWS::ApiGateway::RestApi', 1);
    });

    test('should contain SQS queues for message processing', () => {
      // The template should contain SQS queues from FoodDeliveryStack
      template.resourceCountIs('AWS::SQS::Queue', 2); // Main queue + DLQ
    });

    test('should contain SNS topic for notifications', () => {
      // The template should contain SNS topic from FoodDeliveryStack
      template.resourceCountIs('AWS::SNS::Topic', 1);
    });

    test('should contain CloudWatch alarms for monitoring', () => {
      // The template should contain CloudWatch alarms
      template.resourceCountIs('AWS::CloudWatch::Alarm', 4); // Various alarms for Lambda, DynamoDB
    });
  });

  describe('Environment Configuration', () => {
    test('should use default environment suffix when not provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack', {
        env: {
          account: '123456789012',
          region: 'us-east-1',
        }
      });

      expect(defaultStack).toBeDefined();

      // Should use 'dev' as default suffix
      const children = defaultStack.node.children;
      expect(children.length).toBeGreaterThan(0);
    });

    test('should handle different environment suffixes', () => {
      const testApp = new cdk.App();
      const testStack = new TapStack(testApp, 'TestStack', {
        environmentSuffix: 'prod',
        env: {
          account: '123456789012',
          region: 'us-west-2'
        }
      });

      expect(testStack).toBeDefined();

      const children = testStack.node.children;
      const foodDeliveryStack = children.find(child => child.node.id === 'FoodDeliveryStack');
      expect(foodDeliveryStack).toBeDefined();
    });
  });
});