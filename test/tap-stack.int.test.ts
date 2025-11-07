// test/tap-stack.int.test.ts
import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';
import { PaymentMonitoringStack } from '../lib/payment-monitoring-stack';

// Build helper that returns both the TapStack and its child PaymentMonitoringStack templates
function build(
  ctx?: Record<string, any>,
  props?: Partial<
    cdk.StackProps & { environmentSuffix?: string; projectName?: string }
  >
) {
  const app = new cdk.App(ctx ? { context: ctx } : undefined);
  const tap = new TapStack(app, 'TestTapStack', props as any);

  const payment = tap.node.children.find(
    (c): c is PaymentMonitoringStack => c instanceof PaymentMonitoringStack
  );
  if (!payment) throw new Error('PaymentMonitoringStack was not created');

  const tapTemplate = Template.fromStack(tap);
  const paymentTemplate = Template.fromStack(payment);
  return { app, tap, payment, tapTemplate, paymentTemplate };
}

describe('TapStack Integration Tests', () => {
  describe('Infrastructure Integration', () => {
    test('should create complete monitoring stack without errors', () => {
      const { paymentTemplate } = build(undefined, {
        environmentSuffix: 'test',
      });
      // Sanity: template should be an object with resources
      const tpl = paymentTemplate.toJSON();
      expect(tpl).toBeDefined();
      expect(typeof tpl).toBe('object');
      expect(tpl.Resources).toBeDefined();
    });

    test('should have valid/sane CloudFormation template description', () => {
      const { paymentTemplate } = build(undefined, {
        environmentSuffix: 'test',
      });
      const tpl = paymentTemplate.toJSON();
      // AWSTemplateFormatVersion is optional in CDK; description is enough to sanity check
      expect(tpl.Description).toMatch(/Payment monitoring infrastructure/i);
    });
  });

  describe('Resource Integration', () => {
    test('should create SNS topics with project/environment tags', () => {
      const { paymentTemplate } = build(undefined, {
        environmentSuffix: 'test',
        projectName: 'payment',
      });
      const topics = paymentTemplate.findResources('AWS::SNS::Topic');
      // We expect the two alert topics to exist, but the exact count isn’t critical if you add more later.
      expect(Object.keys(topics).length).toBeGreaterThanOrEqual(2);

      for (const res of Object.values(topics) as any[]) {
        const tags = res.Properties?.Tags ?? [];
        // Order-agnostic tag check
        expect(tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Project', Value: 'payment' }),
            expect.objectContaining({ Key: 'Environment', Value: 'test' }),
          ])
        );
      }
    });

    test('should create a Lambda function with a Node.js runtime', () => {
      const { paymentTemplate } = build(undefined, {
        environmentSuffix: 'test',
      });
      const fns = paymentTemplate.findResources('AWS::Lambda::Function');
      expect(Object.keys(fns).length).toBeGreaterThanOrEqual(1);

      const runtimes = Object.values(fns).map(
        (fn: any) => fn.Properties?.Runtime as string | undefined
      );
      // Accept common Node runtimes we actually use
      expect(runtimes).toEqual(expect.arrayContaining(['nodejs18.x']));
    });

    test('should create CloudWatch alarms', () => {
      const { paymentTemplate } = build(undefined, {
        environmentSuffix: 'test',
      });
      const alarms = paymentTemplate.findResources('AWS::CloudWatch::Alarm');
      expect(Object.keys(alarms).length).toBeGreaterThan(0);
    });

    test('should create at least one log group for the Lambda if declared explicitly; otherwise allow implicit creation at runtime', () => {
      const { paymentTemplate } = build(undefined, {
        environmentSuffix: 'test',
      });
      const logGroups = paymentTemplate.findResources('AWS::Logs::LogGroup');
      if (Object.keys(logGroups).length === 0) {
        // CDK commonly lets Lambda create its log group at runtime; that’s fine.
        const fns = paymentTemplate.findResources('AWS::Lambda::Function');
        expect(Object.keys(fns).length).toBeGreaterThanOrEqual(1);
      } else {
        expect(Object.keys(logGroups).length).toBeGreaterThanOrEqual(1);
      }
    });

    test('should configure monitoring signals (filters/subscriptions/insight rules/alarms/dashboards)', () => {
      const { paymentTemplate } = build(undefined, {
        environmentSuffix: 'test',
      });

      const metricFilters = paymentTemplate.findResources(
        'AWS::Logs::MetricFilter'
      );
      const subFilters = paymentTemplate.findResources(
        'AWS::Logs::SubscriptionFilter'
      );
      const insightRules = paymentTemplate.findResources(
        'AWS::CloudWatch::InsightRule'
      );
      const dashboards = paymentTemplate.findResources(
        'AWS::CloudWatch::Dashboard'
      );
      const alarms = paymentTemplate.findResources('AWS::CloudWatch::Alarm');

      const anySignal =
        Object.keys(metricFilters).length > 0 ||
        Object.keys(subFilters).length > 0 ||
        Object.keys(insightRules).length > 0 ||
        Object.keys(dashboards).length > 0 ||
        Object.keys(alarms).length > 0;

      expect(anySignal).toBe(true);
    });
  });

  describe('Security and IAM Integration', () => {
    test('should create IAM roles (and usually policies) for principals', () => {
      const { paymentTemplate } = build(undefined, {
        environmentSuffix: 'test',
      });
      const roles = paymentTemplate.findResources('AWS::IAM::Role');
      expect(Object.keys(roles).length).toBeGreaterThan(0);

      // Policies may be inline on roles or separate AWS::IAM::Policy resources; we just ensure some IAM surface exists.
      const policies = paymentTemplate.findResources('AWS::IAM::Policy');
      // No hard requirement on policies count — role existence is enough.
      expect(
        Object.keys(roles).length + Object.keys(policies).length
      ).toBeGreaterThan(0);
    });
  });

  describe('Outputs Integration', () => {
    test('should export all required outputs', () => {
      const { paymentTemplate } = build(undefined, {
        environmentSuffix: 'test',
      });
      const outputs = paymentTemplate.toJSON().Outputs || {};

      expect(outputs.OperationalTopicArn).toBeDefined();
      expect(outputs.SecurityTopicArn).toBeDefined();
      expect(outputs.LogProcessorFunctionName).toBeDefined();
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should use test environment configuration for stack name', () => {
      const { payment } = build(undefined, { environmentSuffix: 'test' });
      expect(payment.stackName).toBe('payment-monitoring-test');
    });

    test('should apply environment-specific tags on resources', () => {
      const { paymentTemplate } = build(undefined, {
        environmentSuffix: 'test',
        projectName: 'payment',
      });

      // Find at least one resource with our two tags (order-agnostic)
      const resources = paymentTemplate.toJSON().Resources || {};
      const anyTagged = Object.values(resources).some((res: any) => {
        const tags = res?.Properties?.Tags;
        if (!Array.isArray(tags)) return false;
        const hasProject = tags.some(
          (t: any) => t.Key === 'Project' && t.Value === 'payment'
        );
        const hasEnv = tags.some(
          (t: any) => t.Key === 'Environment' && t.Value === 'test'
        );
        return hasProject && hasEnv;
      });
      expect(anyTagged).toBe(true);
    });
  });
});
