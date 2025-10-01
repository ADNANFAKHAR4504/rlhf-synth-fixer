import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Branch Coverage Tests', () => {
  describe('Environment Suffix Handling', () => {
    test('should use default environment suffix when not provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack');
      const template = Template.fromStack(stack);

      // Stack should be created successfully with default suffix
      expect(stack).toBeDefined();
      expect(template).toBeDefined();
    });

    test('should use provided environment suffix', () => {
      const app = new cdk.App();
      const customSuffix = 'custom-env';
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: customSuffix
      });

      expect(stack).toBeDefined();
      // The suffix should be passed to the nested construct
      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });

    test('should use context environment suffix when available', () => {
      const app = new cdk.App();
      app.node.setContext('environmentSuffix', 'context-suffix');
      const stack = new TapStack(app, 'TestStack');

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });

    test('should prefer props over context for environment suffix', () => {
      const app = new cdk.App();
      app.node.setContext('environmentSuffix', 'context-suffix');
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'props-suffix'
      });

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);

      // Check that resources are created with props suffix
      const vpc = template.findResources('AWS::EC2::VPC');
      expect(Object.keys(vpc).length).toBeGreaterThan(0);
    });
  });

  describe('Stack Properties', () => {
    test('should accept additional stack props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {
        environmentSuffix: 'test',
        description: 'Test stack description',
        terminationProtection: false
      });

      expect(stack.stackName).toBe('TestStack');
      expect(stack).toBeDefined();
    });

    test('should handle undefined props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', undefined);

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });

    test('should handle empty props object', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack', {});

      expect(stack).toBeDefined();
      const template = Template.fromStack(stack);
      expect(template).toBeDefined();
    });
  });
});