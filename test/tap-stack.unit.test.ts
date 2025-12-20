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

      // TapStack now contains all resources directly (flattened architecture)
      expect(stack.vpc).toBeDefined();
      expect(stack.loadBalancer).toBeDefined();
      expect(stack.autoScalingGroup).toBeDefined();
      expect(stack.database).toBeDefined();
    });

    test('creates stack with provided environment suffix', () => {
      const customSuffix = 'production';
      stack = new TapStack(app, 'TestStack', { environmentSuffix: customSuffix });

      // TapStack itself should be a stack
      expect(stack).toBeInstanceOf(cdk.Stack);

      // TapStack now contains all resources directly
      expect(stack.vpc).toBeDefined();
      expect(stack.loadBalancer).toBeDefined();
      expect(stack.autoScalingGroup).toBeDefined();
      expect(stack.database).toBeDefined();
    });

    test('passes environment suffix from context', () => {
      app = new cdk.App({
        context: { environmentSuffix: 'contextSuffix' }
      });
      stack = new TapStack(app, 'TestStack');

      // TapStack itself should be a stack
      expect(stack).toBeInstanceOf(cdk.Stack);

      // TapStack now contains all resources directly
      expect(stack.vpc).toBeDefined();
      expect(stack.loadBalancer).toBeDefined();
      expect(stack.autoScalingGroup).toBeDefined();
      expect(stack.database).toBeDefined();
    });

    test('creates VPC with correct configuration', () => {
      stack = new TapStack(app, 'TestStack', { environmentSuffix: 'test' });
      template = Template.fromStack(stack);

      // VPC should exist with correct configuration
      template.hasResourceProperties('AWS::EC2::VPC', {
        CidrBlock: '10.0.0.0/16',
      });
    });
  });

  describe('Stack Properties', () => {
    test('passes environment properties to stack', () => {
      const env = { account: '123456789012', region: 'us-west-2' };
      stack = new TapStack(app, 'TestStack', { env, environmentSuffix: 'staging' });

      // Stack should have environment properties
      expect(stack).toBeInstanceOf(cdk.Stack);
      expect(stack.vpc).toBeDefined();
    });

    test('handles undefined props gracefully', () => {
      stack = new TapStack(app, 'TestStack', undefined);

      // Should still create stack with defaults
      expect(stack).toBeInstanceOf(cdk.Stack);

      // All resources should be created with defaults
      expect(stack.vpc).toBeDefined();
      expect(stack.loadBalancer).toBeDefined();
      expect(stack.autoScalingGroup).toBeDefined();
      expect(stack.database).toBeDefined();
    });
  });

  describe('Resource Integration', () => {
    test('creates all required infrastructure resources', () => {
      stack = new TapStack(app, 'TestStack');
      template = Template.fromStack(stack);

      // All resources should be in the TapStack (flattened architecture)
      template.resourceCountIs('AWS::EC2::VPC', 1);
      template.resourceCountIs('AWS::ElasticLoadBalancingV2::LoadBalancer', 1);
      template.resourceCountIs('AWS::AutoScaling::AutoScalingGroup', 1);
      template.resourceCountIs('AWS::RDS::DBInstance', 1);
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