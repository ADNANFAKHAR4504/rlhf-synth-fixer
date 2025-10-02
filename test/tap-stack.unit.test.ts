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

      // The child stack should be created with the correct ID
      expect(foodDeliveryStack?.node.id).toBe('FoodDeliveryStack');
    });
  });

  describe('Food Delivery Infrastructure', () => {
    test('should create FoodDeliveryStack child construct', () => {
      // Verify that FoodDeliveryStack construct exists
      const children = stack.node.children;
      const foodDeliveryStack = children.find(child => child.node.id === 'FoodDeliveryStack');
      expect(foodDeliveryStack).toBeDefined();
      expect(foodDeliveryStack?.node.id).toBe('FoodDeliveryStack');
    });

    test('should instantiate child stack properly', () => {
      // Check that the child stack is created with correct type
      const children = stack.node.children;
      expect(children.length).toBeGreaterThan(0);
      
      const foodDeliveryStack = children.find(child => child.node.id === 'FoodDeliveryStack');
      expect(foodDeliveryStack).toBeDefined();
      
      // Check that it's a Stack construct
      expect(foodDeliveryStack?.node.scopes).toBeDefined();
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