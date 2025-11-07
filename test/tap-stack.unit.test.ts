import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Unit Tests', () => {
  let tapTemplate: Template;

  beforeAll(() => {
    const app = new cdk.App();
    const tapStack = new TapStack(app, 'TestTapStack', {
      environmentSuffix: 'test',
      projectName: 'payment',
    });

    tapTemplate = Template.fromStack(tapStack);
  });

  describe('Stack Properties', () => {
    test('should create stack with correct naming', () => {
      const stackName = tapTemplate.toJSON().Description;
      expect(stackName).toContain('Payment monitoring infrastructure for payment (test)');
    });

    test('should apply correct tags', () => {
      expect(tapTemplate.findResources('AWS::SNS::Topic')).toMatchObject({
        Properties: {
          Tags: Match.arrayWith([
            Match.objectLike({
              Key: 'Project',
              Value: 'payment',
            }),
            Match.objectLike({
              Key: 'Environment',
              Value: 'test',
            }),
          ]),
        },
      });
    });
  });

  describe('Child Stack Creation', () => {
    test('should create PaymentMonitoringStack as nested stack', () => {
      const nestedStacks = tapTemplate.findResources('AWS::CloudFormation::Stack');
      expect(Object.keys(nestedStacks).length).toBeGreaterThan(0);

      const nestedStack = Object.values(nestedStacks)[0] as any;
      expect(nestedStack.Properties.TemplateURL).toBeDefined();
      expect(nestedStack.Properties.StackName).toContain('payment-monitoring-test');
    });
  });

  describe('Environment Configuration', () => {
    test('should use environmentSuffix from props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack1', {
        environmentSuffix: 'staging',
        projectName: 'payment',
      });
      const template = Template.fromStack(stack);
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const nestedStack = Object.values(nestedStacks)[0] as any;
      expect(nestedStack.Properties.StackName).toContain('payment-monitoring-staging');
    });

    test('should use projectName from props', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack2', {
        environmentSuffix: 'dev',
        projectName: 'custom-payment',
      });
      const template = Template.fromStack(stack);
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const nestedStack = Object.values(nestedStacks)[0] as any;
      expect(nestedStack.Properties.StackName).toContain('custom-payment-monitoring-dev');
    });

    test('should fall back to context values', () => {
      const app = new cdk.App({
        context: {
          environmentSuffix: 'context-env',
          projectName: 'context-project',
        },
      });
      const stack = new TapStack(app, 'TestStack3');
      const template = Template.fromStack(stack);
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const nestedStack = Object.values(nestedStacks)[0] as any;
      expect(nestedStack.Properties.StackName).toContain('context-project-monitoring-context-env');
    });

    test('should use default values when no props or context provided', () => {
      const app = new cdk.App();
      const stack = new TapStack(app, 'TestStack4');
      const template = Template.fromStack(stack);
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const nestedStack = Object.values(nestedStacks)[0] as any;
      expect(nestedStack.Properties.StackName).toContain('payment-monitoring-dev');
    });
  });

  describe('Stack Outputs', () => {
    test('should define all required outputs', () => {
      const outputs = tapTemplate.toJSON().Outputs || {};

      expect(outputs.OperationalTopicArn).toBeDefined();
      expect(outputs.SecurityTopicArn).toBeDefined();
      expect(outputs.LogProcessorFunctionName).toBeDefined();
    });

    test('should have correct output descriptions', () => {
      const outputs = tapTemplate.toJSON().Outputs || {};

      expect(outputs.OperationalTopicArn.Description).toContain('operational alerts');
      expect(outputs.SecurityTopicArn.Description).toContain('security alerts');
      expect(outputs.LogProcessorFunctionName.Description).toContain('Log processor Lambda');
    });
  });
});
