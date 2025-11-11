import * as cdk from 'aws-cdk-lib';
import * as lambda from 'aws-cdk-lib/aws-lambda';

// IMPORTANT: mock must be declared BEFORE importing modules that use NodejsFunction
jest.mock('aws-cdk-lib/aws-lambda-nodejs', () => {
  class FakeNodejsFunction extends cdk.Resource {
    public readonly grantPrincipal = {
      addToPrincipalPolicy: () => ({ statementAdded: true }),
    };
    constructor(scope: any, id: string) {
      super(scope, id);
      new lambda.Function(scope, `${id}Impl`, {
        runtime: lambda.Runtime.NODEJS_18_X,
        architecture: lambda.Architecture.ARM_64,
        handler: 'index.handler',
        code: lambda.Code.fromInline(
          'exports.handler = async () => ({ statusCode: 200, body: "ok" });'
        ),
        timeout: cdk.Duration.seconds(60),
      });
    }
  }
  return { NodejsFunction: FakeNodejsFunction };
});

import { Template } from 'aws-cdk-lib/assertions';
import { LogProcessingConstruct } from '../lib/constructs/log-processing';
import { PaymentMonitoringStack } from '../lib/payment-monitoring-stack';
import { TapStack } from '../lib/tap-stack';

function buildAppAndStacks(
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

describe('TapStack Unit Tests', () => {
  describe('Stack Properties', () => {
    test('should create stack with correct naming', () => {
      const { payment, paymentTemplate } = buildAppAndStacks(undefined, {
        environmentSuffix: 'test',
        projectName: 'payment',
      });
      expect(payment.stackName).toBe('payment-monitoring-test');
      const desc = paymentTemplate.toJSON().Description as string | undefined;
      expect(desc).toBeDefined();
      expect(desc!).toContain(
        'Payment monitoring infrastructure for payment (test)'
      );
    });

    test('should apply correct tags', () => {
      const { paymentTemplate } = buildAppAndStacks(undefined, {
        environmentSuffix: 'test',
      });
      const topics = paymentTemplate.findResources('AWS::SNS::Topic');
      expect(Object.keys(topics).length).toBeGreaterThan(0);
      for (const res of Object.values(topics) as any[]) {
        const tags = res.Properties?.Tags ?? [];
        expect(tags).toEqual(
          expect.arrayContaining([
            expect.objectContaining({ Key: 'Project', Value: 'payment' }),
            expect.objectContaining({ Key: 'Environment', Value: 'test' }),
          ])
        );
      }
    });
  });

  describe('Child Stack Creation', () => {
    test('should create PaymentMonitoringStack as a separate child stack (not CFN nested resource)', () => {
      const { app, payment } = buildAppAndStacks(undefined, {
        environmentSuffix: 'test',
      });
      const asm = app.synth();
      expect(asm.stacks.length).toBeGreaterThan(1);
      expect(payment instanceof PaymentMonitoringStack).toBe(true);
    });
  });

  describe('Environment Configuration', () => {
    test('should use environmentSuffix from props', () => {
      const { payment } = buildAppAndStacks(undefined, {
        environmentSuffix: 'staging',
      });
      expect(payment.stackName).toBe('payment-monitoring-staging');
    });

    test('should use projectName from props', () => {
      const { payment } = buildAppAndStacks(undefined, {
        projectName: 'custom-payment',
      });
      expect(payment.stackName).toBe('custom-payment-monitoring-dev');
    });

    test('should fall back to context values', () => {
      const { payment } = buildAppAndStacks(
        { environmentSuffix: 'context-env', projectName: 'context-project' },
        undefined
      );
      expect(payment.stackName).toBe('context-project-monitoring-context-env');
    });

    test('should use default values when no props or context provided', () => {
      const { payment } = buildAppAndStacks();
      expect(payment.stackName).toBe('payment-monitoring-dev');
    });

    // 🔹 Additional mixed cases to hit optional chaining + nullish coalescing branches:

    test('props provided with env from props and projectName undefined -> default project', () => {
      const { payment } = buildAppAndStacks(undefined, {
        environmentSuffix: 'qa',
        projectName: undefined,
      });
      expect(payment.stackName).toBe('payment-monitoring-qa');
    });

    test('props provided with projectName from props and env undefined -> default env', () => {
      const { payment } = buildAppAndStacks(undefined, {
        projectName: 'alpha',
        environmentSuffix: undefined,
      });
      expect(payment.stackName).toBe('alpha-monitoring-dev');
    });

    test('props present but undefined, fallback to context for env while project from props', () => {
      const { payment } = buildAppAndStacks(
        { environmentSuffix: 'ctx', projectName: 'ignored' },
        { environmentSuffix: undefined, projectName: 'beta' }
      );
      expect(payment.stackName).toBe('beta-monitoring-ctx');
    });
  });

  describe('Stack Outputs', () => {
    test('should define all required outputs', () => {
      const { paymentTemplate } = buildAppAndStacks(undefined, {
        environmentSuffix: 'test',
      });
      const outputs = paymentTemplate.toJSON().Outputs || {};
      expect(outputs.OperationalTopicArn).toBeDefined();
      expect(outputs.SecurityTopicArn).toBeDefined();
      expect(outputs.LogProcessorFunctionName).toBeDefined();
    });

    test('should have correct output descriptions', () => {
      const { paymentTemplate } = buildAppAndStacks(undefined, {
        environmentSuffix: 'test',
      });
      const outputs = paymentTemplate.toJSON().Outputs || {};
      expect(outputs.OperationalTopicArn.Description).toMatch(/operational/i);
      expect(outputs.SecurityTopicArn.Description).toMatch(/security/i);
      expect(outputs.LogProcessorFunctionName.Description).toMatch(
        /log processor/i
      );
    });
  });

  describe('Log Processing (stack-level signals)', () => {
    test('creates the log processor Lambda with a Node.js runtime', () => {
      const { paymentTemplate } = buildAppAndStacks(undefined, {
        environmentSuffix: 'test',
      });
      const lambdas = paymentTemplate.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBeGreaterThan(0);

      const all = Object.values(lambdas) as any[];
      const logProcessorFn =
        all.find(
          res =>
            /log[-]?processor/i.test(res?.Properties?.FunctionName ?? '') ||
            /LogProcessor/i.test(JSON.stringify(res))
        ) ?? all[0];

      const runtime = (logProcessorFn?.Properties?.Runtime ?? '') as string;
      expect(/^nodejs\d+\.x$/.test(runtime)).toBe(true);
    });

    test('configures monitoring/analytics resources (filters, subscriptions, alarms, dashboards, insight rules)', () => {
      const { paymentTemplate } = buildAppAndStacks(undefined, {
        environmentSuffix: 'test',
      });

      const metricFilters = paymentTemplate.findResources(
        'AWS::Logs::MetricFilter'
      );
      const subscriptionFilters = paymentTemplate.findResources(
        'AWS::Logs::SubscriptionFilter'
      );
      const insightRules = paymentTemplate.findResources(
        'AWS::CloudWatch::InsightRule'
      );
      const dashboards = paymentTemplate.findResources(
        'AWS::CloudWatch::Dashboard'
      );
      const cwAlarms = paymentTemplate.findResources('AWS::CloudWatch::Alarm');

      const anyMonitoring =
        Object.keys(metricFilters).length > 0 ||
        Object.keys(subscriptionFilters).length > 0 ||
        Object.keys(insightRules).length > 0 ||
        Object.keys(dashboards).length > 0 ||
        Object.keys(cwAlarms).length > 0;

      expect(anyMonitoring).toBe(true);

      if (Object.keys(metricFilters).length > 0) {
        const patterns = Object.values(metricFilters).map(
          (res: any) => res.Properties?.FilterPattern as string
        );
        expect(
          patterns.some(p => /ERROR|SECURITY|timeout|Timeout/i.test(p ?? ''))
        ).toBe(true);
      }
    });
  });

  // Explicit branch coverage for LogProcessingConstruct paths
  describe('LogProcessingConstruct branch coverage', () => {
    const original = process.env.JEST_WORKER_ID;

    test('uses inline stub branch when JEST_WORKER_ID is set', () => {
      process.env.JEST_WORKER_ID = original || '1';
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'InlineBranchStack');
      new LogProcessingConstruct(stack, 'LPInline');
      const t = Template.fromStack(stack);
      const lambdas = t.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBeGreaterThan(0);
      const fn: any = Object.values(lambdas)[0];
      expect(fn.Properties.Timeout).toBe(30);
      expect(fn.Properties.Runtime).toMatch(/^nodejs\d+\.x$/);
    });

    test('uses NodejsFunction branch when JEST_WORKER_ID is unset', () => {
      delete process.env.JEST_WORKER_ID;
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'BundledBranchStack');
      new LogProcessingConstruct(stack, 'LPBundled');
      const t = Template.fromStack(stack);
      const lambdas = t.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBeGreaterThan(0);
      const fn: any = Object.values(lambdas)[0];
      expect(fn.Properties.Timeout).toBe(60);
      expect(fn.Properties.Runtime).toMatch(/^nodejs\d+\.x$/);
      if (original) process.env.JEST_WORKER_ID = original;
    });
  });
});
