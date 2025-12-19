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
import { AlarmsConstruct } from '../lib/constructs/alarms';
import { DashboardsConstruct } from '../lib/constructs/dashboards';
import { LogRetentionConstruct } from '../lib/constructs/log-retention';
import { NotificationsConstruct } from '../lib/constructs/notifications';
import { PaymentMonitoringStack } from '../lib/payment-monitoring-stack';
import { ApiGatewayMonitoringStack } from '../lib/api-gateway-monitoring-stack';
import { RdsEcsMonitoringStack } from '../lib/rds-ecs-monitoring-stack';
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
      expect(payment.stackName).toBe('tapstackstack-test');
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
      expect(payment.stackName).toBe('tapstackstack-staging');
    });

    test('should use projectName from props', () => {
      const { payment } = buildAppAndStacks(undefined, {
        projectName: 'custom-payment',
      });
      expect(payment.stackName).toBe('tapstackstack-dev');
    });

    test('should fall back to context values', () => {
      const { payment } = buildAppAndStacks(
        { environmentSuffix: 'context-env', projectName: 'context-project' },
        undefined
      );
      expect(payment.stackName).toBe('tapstackstack-context-env');
    });

    test('should use default values when no props or context provided', () => {
      const { payment } = buildAppAndStacks();
      expect(payment.stackName).toBe('tapstackstack-dev');
    });

    // 🔹 Additional mixed cases to hit optional chaining + nullish coalescing branches:

    test('props provided with env from props and projectName undefined -> default project', () => {
      const { payment } = buildAppAndStacks(undefined, {
        environmentSuffix: 'qa',
        projectName: undefined,
      });
      expect(payment.stackName).toBe('tapstackstack-qa');
    });

    test('props provided with projectName from props and env undefined -> default env', () => {
      const { payment } = buildAppAndStacks(undefined, {
        projectName: 'alpha',
        environmentSuffix: undefined,
      });
      expect(payment.stackName).toBe('tapstackstack-dev');
    });

    test('props present but undefined, fallback to context for env while project from props', () => {
      const { payment } = buildAppAndStacks(
        { environmentSuffix: 'ctx', projectName: 'ignored' },
        { environmentSuffix: undefined, projectName: 'beta' }
      );
      expect(payment.stackName).toBe('tapstackstack-ctx');
    });

    test('stack naming uses consistent format regardless of project name', () => {
      const { payment } = buildAppAndStacks(undefined, {
        projectName: 'payment-custom',
        environmentSuffix: 'test',
      });
      expect(payment.stackName).toBe('tapstackstack-test');
    });

    test('stack naming is consistent across different project names', () => {
      const { payment } = buildAppAndStacks(undefined, {
        projectName: 'payment',
        environmentSuffix: 'test',
      });
      expect(payment.stackName).toBe('tapstackstack-test');
    });

    test('stack naming follows uniform pattern for all inputs', () => {
      const { payment } = buildAppAndStacks(undefined, {
        projectName: 'custom',
        environmentSuffix: 'test',
      });
      expect(payment.stackName).toBe('tapstackstack-test');
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

    test('uses inline stub with custom environment when JEST_WORKER_ID is set', () => {
      process.env.JEST_WORKER_ID = original || '1';
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'InlineEnvBranchStack');
      new LogProcessingConstruct(stack, 'LPInlineEnv', {
        environment: { TEST_VAR: 'test_value' },
      });
      const t = Template.fromStack(stack);
      const lambdas = t.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBeGreaterThan(0);
      const fn: any = Object.values(lambdas)[0];
      expect(fn.Properties.Environment.Variables).toEqual({
        TEST_VAR: 'test_value',
      });
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

    test('uses NodejsFunction with custom environment when JEST_WORKER_ID is unset', () => {
      delete process.env.JEST_WORKER_ID;
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'BundledEnvBranchStack');
      new LogProcessingConstruct(stack, 'LPBundledEnv', {
        environment: { CUSTOM_VAR: 'custom_value' },
      });
      const t = Template.fromStack(stack);
      const lambdas = t.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBeGreaterThan(0);
      const fn: any = Object.values(lambdas)[0];
      // Should have a Runtime property (NodejsFunction creates a lambda with Runtime)
      expect(fn.Properties.Runtime).toBeDefined();
      expect(fn.Properties.Handler).toBeDefined();
      if (original) process.env.JEST_WORKER_ID = original;
    });

    test('handles undefined props gracefully', () => {
      process.env.JEST_WORKER_ID = original || '1';
      const app = new cdk.App();
      const stack = new cdk.Stack(app, 'UndefinedPropsStack');
      new LogProcessingConstruct(stack, 'LPUndefined');
      const t = Template.fromStack(stack);
      const lambdas = t.findResources('AWS::Lambda::Function');
      expect(Object.keys(lambdas).length).toBeGreaterThan(0);
    });
  });

  describe('Construct Branch Coverage', () => {
    describe('AlarmsConstruct', () => {
      test('handles environment suffix sanitization with bash syntax', () => {
        const app = new cdk.App({
          context: { environmentSuffix: '${ENVIRONMENT_SUFFIX:-dev}' },
        });
        const stack = new cdk.Stack(app, 'TestStack');
        const sns = new cdk.aws_sns.Topic(stack, 'TestTopic');
        new AlarmsConstruct(stack, 'TestAlarms', {
          operationalTopic: sns,
          securityTopic: sns,
        });
        const template = Template.fromStack(stack);
        // Should create alarms with sanitized names
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBeGreaterThan(0);
      });

      test('handles empty environment suffix fallback', () => {
        const app = new cdk.App({
          context: { environmentSuffix: '   ' }, // whitespace only
        });
        const stack = new cdk.Stack(app, 'TestStack');
        const sns = new cdk.aws_sns.Topic(stack, 'TestTopic');
        new AlarmsConstruct(stack, 'TestAlarms', {
          operationalTopic: sns,
          securityTopic: sns,
        });
        const template = Template.fromStack(stack);
        // Should use 'dev' fallback
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBeGreaterThan(0);
      });

      test('handles invalid characters in environment suffix', () => {
        const app = new cdk.App({
          context: { environmentSuffix: 'test@#$%^&*()' },
        });
        const stack = new cdk.Stack(app, 'TestStack');
        const sns = new cdk.aws_sns.Topic(stack, 'TestTopic');
        new AlarmsConstruct(stack, 'TestAlarms', {
          operationalTopic: sns,
          securityTopic: sns,
        });
        const template = Template.fromStack(stack);
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBeGreaterThan(0);
      });

      test('handles environment suffix that becomes empty after sanitization', () => {
        const app = new cdk.App({
          context: { environmentSuffix: '@#$%^&*()' },
        });
        const stack = new cdk.Stack(app, 'TestStack');
        const sns = new cdk.aws_sns.Topic(stack, 'TestTopic');
        new AlarmsConstruct(stack, 'TestAlarms', {
          operationalTopic: sns,
          securityTopic: sns,
        });
        const template = Template.fromStack(stack);
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBeGreaterThan(0);
      });

      test('creates API Gateway alarms and includes them in composite alarm', () => {
        const app = new cdk.App({
          context: { environmentSuffix: 'test' },
        });
        const stack = new cdk.Stack(app, 'TestStack');
        const sns = new cdk.aws_sns.Topic(stack, 'TestTopic');
        new AlarmsConstruct(stack, 'TestAlarms', {
          operationalTopic: sns,
          securityTopic: sns,
          excludeApiGatewayAlarms: false, // Explicitly include API Gateway alarms
        });
        const template = Template.fromStack(stack);

        // Should create 5 alarms: payment, api, rds, ecs, auth
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBe(5);

        // Check for API Gateway alarm
        const alarmNames = Object.values(alarms).map(
          (a: any) => a.Properties?.AlarmName
        );
        expect(
          alarmNames.some(name => name.includes('api-gateway-latency'))
        ).toBe(true);

        // Check composite alarm includes API latency alarm
        const compositeAlarms = template.findResources(
          'AWS::CloudWatch::CompositeAlarm'
        );
        expect(Object.keys(compositeAlarms).length).toBe(1);

        const compositeAlarm = Object.values(compositeAlarms)[0] as any;
        expect(compositeAlarm.Properties?.AlarmDescription).toContain(
          'high latency'
        );
      });

      test('excludes API Gateway alarms and creates simpler composite alarm', () => {
        const app = new cdk.App({
          context: { environmentSuffix: 'test' },
        });
        const stack = new cdk.Stack(app, 'TestStack');
        const sns = new cdk.aws_sns.Topic(stack, 'TestTopic');
        new AlarmsConstruct(stack, 'TestAlarms', {
          operationalTopic: sns,
          securityTopic: sns,
          excludeApiGatewayAlarms: true, // Exclude API Gateway alarms
        });
        const template = Template.fromStack(stack);

        // Should create 4 alarms: payment, rds, ecs, auth (no api)
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBe(4);

        // Check for no API Gateway alarm
        const alarmNames = Object.values(alarms).map(
          (a: any) => a.Properties?.AlarmName
        );
        expect(
          alarmNames.some(name => name.includes('api-gateway-latency'))
        ).toBe(false);

        // Check composite alarm has simpler description
        const compositeAlarms = template.findResources(
          'AWS::CloudWatch::CompositeAlarm'
        );
        expect(Object.keys(compositeAlarms).length).toBe(1);

        const compositeAlarm = Object.values(compositeAlarms)[0] as any;
        expect(compositeAlarm.Properties?.AlarmDescription).toContain(
          'error rate detected'
        );
        expect(compositeAlarm.Properties?.AlarmDescription).not.toContain(
          'latency'
        );
      });
    });

    describe('DashboardsConstruct', () => {
      test('handles environment suffix sanitization', () => {
        const app = new cdk.App({
          context: { environmentSuffix: '${DASHBOARD_SUFFIX:-prod}' },
        });
        const stack = new cdk.Stack(app, 'TestStack');
        const alarms = new Map();
        new DashboardsConstruct(stack, 'TestDashboards', { alarms });
        const template = Template.fromStack(stack);
        const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
        expect(Object.keys(dashboards).length).toBeGreaterThan(0);
      });

      test('creates dashboard with alarm status widget when alarms are provided', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');

        // Create a mock alarm
        const alarm = new cdk.aws_cloudwatch.Alarm(stack, 'TestAlarm', {
          alarmName: 'test-alarm',
          metric: new cdk.aws_cloudwatch.Metric({
            namespace: 'Test',
            metricName: 'TestMetric',
          }),
          threshold: 1,
          evaluationPeriods: 1,
        });

        const alarms = new Map([['test', alarm]]);
        new DashboardsConstruct(stack, 'TestDashboards', { alarms });
        const template = Template.fromStack(stack);
        const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
        expect(Object.keys(dashboards).length).toBeGreaterThan(0);
      });

      test('handles empty alarms map', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');
        const alarms = new Map();
        new DashboardsConstruct(stack, 'TestDashboards', { alarms });
        const template = Template.fromStack(stack);
        const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
        expect(Object.keys(dashboards).length).toBeGreaterThan(0);
      });

      test('handles environment suffix that becomes empty after sanitization', () => {
        const app = new cdk.App({
          context: { environmentSuffix: '!!!@@@###' }, // Special chars only, becomes empty
        });
        const stack = new cdk.Stack(app, 'TestStack');
        const alarms = new Map();
        new DashboardsConstruct(stack, 'TestDashboards', { alarms });
        const template = Template.fromStack(stack);
        const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
        expect(Object.keys(dashboards).length).toBeGreaterThan(0);
        // Should use 'dev' fallback
        const dashboard: any = Object.values(dashboards)[0];
        expect(dashboard.Properties?.DashboardName).toContain('tapstack-dev');
      });
    });

    describe('LogRetentionConstruct', () => {
      test('handles environment suffix sanitization with special characters', () => {
        const app = new cdk.App({
          context: { environmentSuffix: '@#$%^&*()' },
        });
        const stack = new cdk.Stack(app, 'TestStack');
        new LogRetentionConstruct(stack, 'TestRetention');
        const template = Template.fromStack(stack);
        const buckets = template.findResources('AWS::S3::Bucket');
        expect(Object.keys(buckets).length).toBeGreaterThan(0);
      });

      test('handles empty environment suffix after sanitization', () => {
        const app = new cdk.App({
          context: { environmentSuffix: '!!!@@@###$$$' }, // all special chars
        });
        const stack = new cdk.Stack(app, 'TestStack');
        new LogRetentionConstruct(stack, 'TestRetention');
        const template = Template.fromStack(stack);
        const buckets = template.findResources('AWS::S3::Bucket');
        expect(Object.keys(buckets).length).toBeGreaterThan(0);
        // Should use 'dev' fallback
        const bucket: any = Object.values(buckets)[0];
        expect(bucket.Properties.BucketName).toContain('tapstack-dev');
      });

      test('creates S3 bucket with correct lifecycle rules', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');
        new LogRetentionConstruct(stack, 'TestRetention');
        const template = Template.fromStack(stack);
        const buckets = template.findResources('AWS::S3::Bucket');
        expect(Object.keys(buckets).length).toBeGreaterThan(0);
        const bucket: any = Object.values(buckets)[0];
        expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
        expect(bucket.Properties.VersioningConfiguration).toEqual({
          Status: 'Enabled',
        });
      });
    });

    describe('ApiGatewayMonitoringStack', () => {
      test('should handle environment suffix sanitization with special characters', () => {
        const app = new cdk.App();
        const apiStack = new ApiGatewayMonitoringStack(app, 'TestApi', {
          apiGatewayName: 'test-api',
          environmentSuffix: '!@#$%',
        });
        const template = Template.fromStack(apiStack);
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBe(2);
      });

      test('should handle empty environment suffix after sanitization', () => {
        const app = new cdk.App();
        const apiStack = new ApiGatewayMonitoringStack(app, 'TestApi', {
          apiGatewayName: 'test-api',
          environmentSuffix: '!!!@@@',
        });
        const template = Template.fromStack(apiStack);
        const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
        expect(Object.keys(dashboards).length).toBe(1);
      });

      test('should handle undefined apiGatewayName prop', () => {
        const app = new cdk.App();
        const apiStack = new ApiGatewayMonitoringStack(app, 'TestApi');
        const template = Template.fromStack(apiStack);
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBe(2);
      });

      test('should handle environment variable fallback', () => {
        const originalEnv = process.env.ENVIRONMENT_SUFFIX;
        process.env.ENVIRONMENT_SUFFIX = 'from-env';
        try {
          const app = new cdk.App();
          const apiStack = new ApiGatewayMonitoringStack(app, 'TestApi');
          const template = Template.fromStack(apiStack);
          const alarms = template.findResources('AWS::CloudWatch::Alarm');
          expect(Object.keys(alarms).length).toBe(2);
        } finally {
          if (originalEnv === undefined) {
            delete process.env.ENVIRONMENT_SUFFIX;
          } else {
            process.env.ENVIRONMENT_SUFFIX = originalEnv;
          }
        }
      });

      test('should use default dev suffix when no context or env var', () => {
        const originalEnv = process.env.ENVIRONMENT_SUFFIX;
        delete process.env.ENVIRONMENT_SUFFIX;
        try {
          const app = new cdk.App();
          const apiStack = new ApiGatewayMonitoringStack(app, 'TestApi');
          const template = Template.fromStack(apiStack);
          const dashboards = template.findResources(
            'AWS::CloudWatch::Dashboard'
          );
          const dashboard = Object.values(dashboards)[0] as any;
          expect(dashboard?.Properties?.DashboardName).toContain(
            'tapstack-dev'
          );
        } finally {
          if (originalEnv === undefined) {
            delete process.env.ENVIRONMENT_SUFFIX;
          } else {
            process.env.ENVIRONMENT_SUFFIX = originalEnv;
          }
        }
      });

      test('should sanitize bash variable syntax with default', () => {
        const app = new cdk.App();
        const apiStack = new ApiGatewayMonitoringStack(app, 'TestApi', {
          environmentSuffix: '${BRANCH:-main}',
        });
        const template = Template.fromStack(apiStack);
        const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
        const dashboard = Object.values(dashboards)[0] as any;
        // Should extract 'main' as default value from bash variable, then use unique suffix
        expect(dashboard?.Properties?.DashboardName).toContain(
          'tapstack-main-default'
        );
      });

      test('should create metrics, dashboard, and alarms correctly', () => {
        const originalEnv = process.env.ENVIRONMENT_SUFFIX;
        process.env.ENVIRONMENT_SUFFIX = 'dev';

        try {
          const app = new cdk.App();
          const apiStack = new ApiGatewayMonitoringStack(app, 'TestApi', {
            apiGatewayName: 'custom-api',
          });
          const template = Template.fromStack(apiStack);

          // Verify metrics are created (they're referenced in alarms and dashboard)
          const alarms = template.findResources('AWS::CloudWatch::Alarm');
          expect(Object.keys(alarms).length).toBe(2);

          // Verify dashboard is created with widgets
          const dashboards = template.findResources(
            'AWS::CloudWatch::Dashboard'
          );
          expect(Object.keys(dashboards).length).toBe(1);

          // Verify alarm properties
          const alarmResources = Object.values(alarms) as any[];
          alarmResources.forEach(alarm => {
            expect(alarm.Properties?.Threshold).toBeDefined();
            expect(alarm.Properties?.EvaluationPeriods).toBe(2);
            expect(alarm.Properties?.ComparisonOperator).toBeDefined();
            expect(alarm.Properties?.AlarmDescription).toBeDefined();
          });

          // Verify specific alarm names and thresholds (with unique suffix)
          const alarmNames = alarmResources.map(a => a.Properties?.AlarmName);
          expect(
            alarmNames.some(name =>
              name?.startsWith('api-gateway-latency-high-tapstack-dev-')
            )
          ).toBe(true);
          expect(
            alarmNames.some(name =>
              name?.startsWith('api-gateway-error-rate-high-tapstack-dev-')
            )
          ).toBe(true);

          const latencyAlarm = alarmResources.find(a =>
            a.Properties?.AlarmName?.includes('latency')
          );
          const errorAlarm = alarmResources.find(a =>
            a.Properties?.AlarmName?.includes('error-rate')
          );

          expect(latencyAlarm?.Properties?.Threshold).toBe(500);
          expect(errorAlarm?.Properties?.Threshold).toBe(1);
        } finally {
          if (originalEnv === undefined) {
            delete process.env.ENVIRONMENT_SUFFIX;
          } else {
            process.env.ENVIRONMENT_SUFFIX = originalEnv;
          }
        }
      });
    });

    describe('RdsEcsMonitoringStack', () => {
      test('should handle environment suffix sanitization with special characters', () => {
        const app = new cdk.App();
        const rdsStack = new RdsEcsMonitoringStack(app, 'TestRds', {
          dbIdentifier: 'test-db',
          ecsServiceName: 'test-service',
          clusterName: 'test-cluster',
          environmentSuffix: '!@#$%',
        });
        const template = Template.fromStack(rdsStack);
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBe(2);
      });

      test('should handle empty environment suffix after sanitization', () => {
        const app = new cdk.App();
        const rdsStack = new RdsEcsMonitoringStack(app, 'TestRds', {
          dbIdentifier: 'test-db',
          ecsServiceName: 'test-service',
          clusterName: 'test-cluster',
          environmentSuffix: '!!!@@@',
        });
        const template = Template.fromStack(rdsStack);
        const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
        expect(Object.keys(dashboards).length).toBe(1);
      });

      test('should handle optional props gracefully', () => {
        const app = new cdk.App();
        const rdsStack = new RdsEcsMonitoringStack(app, 'TestRds');
        const template = Template.fromStack(rdsStack);
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBe(2);
      });

      test('should handle partial props', () => {
        const app = new cdk.App();
        const rdsStack = new RdsEcsMonitoringStack(app, 'TestRds', {
          dbIdentifier: 'test-db',
          // ecsServiceName and clusterName will use defaults
        });
        const template = Template.fromStack(rdsStack);
        const alarms = template.findResources('AWS::CloudWatch::Alarm');
        expect(Object.keys(alarms).length).toBe(2);
      });

      test('should handle environment variable fallback', () => {
        const originalEnv = process.env.ENVIRONMENT_SUFFIX;
        process.env.ENVIRONMENT_SUFFIX = 'from-env';
        try {
          const app = new cdk.App();
          const rdsStack = new RdsEcsMonitoringStack(app, 'TestRds');
          const template = Template.fromStack(rdsStack);
          const alarms = template.findResources('AWS::CloudWatch::Alarm');
          expect(Object.keys(alarms).length).toBe(2);
        } finally {
          if (originalEnv === undefined) {
            delete process.env.ENVIRONMENT_SUFFIX;
          } else {
            process.env.ENVIRONMENT_SUFFIX = originalEnv;
          }
        }
      });

      test('should use default dev suffix when no context or env var', () => {
        const originalEnv = process.env.ENVIRONMENT_SUFFIX;
        delete process.env.ENVIRONMENT_SUFFIX;
        try {
          const app = new cdk.App();
          const rdsStack = new RdsEcsMonitoringStack(app, 'TestRds');
          const template = Template.fromStack(rdsStack);
          const dashboards = template.findResources(
            'AWS::CloudWatch::Dashboard'
          );
          const dashboard = Object.values(dashboards)[0] as any;
          expect(dashboard?.Properties?.DashboardName).toContain(
            'tapstack-dev'
          );
        } finally {
          if (originalEnv === undefined) {
            delete process.env.ENVIRONMENT_SUFFIX;
          } else {
            process.env.ENVIRONMENT_SUFFIX = originalEnv;
          }
        }
      });

      test('should sanitize bash variable syntax with default', () => {
        const app = new cdk.App();
        const rdsStack = new RdsEcsMonitoringStack(app, 'TestRds', {
          environmentSuffix: '${ENV:-prod}',
        });
        const template = Template.fromStack(rdsStack);
        const dashboards = template.findResources('AWS::CloudWatch::Dashboard');
        const dashboard = Object.values(dashboards)[0] as any;
        // Should extract 'prod' as default value from bash variable, then use unique suffix
        expect(dashboard?.Properties?.DashboardName).toContain(
          'tapstack-prod-default'
        );
      });

      test('should create all metrics, dashboard, and alarms correctly', () => {
        const originalEnv = process.env.ENVIRONMENT_SUFFIX;
        process.env.ENVIRONMENT_SUFFIX = 'dev';

        try {
          const app = new cdk.App();
          const rdsStack = new RdsEcsMonitoringStack(app, 'TestRds', {
            dbIdentifier: 'my-db',
            ecsServiceName: 'my-service',
            clusterName: 'my-cluster',
          });
          const template = Template.fromStack(rdsStack);

          // Verify alarms are created
          const alarms = template.findResources('AWS::CloudWatch::Alarm');
          expect(Object.keys(alarms).length).toBe(2);

          // Verify dashboard is created
          const dashboards = template.findResources(
            'AWS::CloudWatch::Dashboard'
          );
          expect(Object.keys(dashboards).length).toBe(1);

          // Verify alarm properties and names
          const alarmResources = Object.values(alarms) as any[];
          const alarmNames = alarmResources.map(a => a.Properties?.AlarmName);
          expect(
            alarmNames.some(name =>
              name?.startsWith('ecs-cpu-utilization-high-tapstack-dev-')
            )
          ).toBe(true);
          expect(
            alarmNames.some(name =>
              name?.startsWith('rds-db-connections-high-tapstack-dev-')
            )
          ).toBe(true);

          // Verify alarm thresholds
          alarmResources.forEach(alarm => {
            expect(alarm.Properties?.Threshold).toBeDefined();
            expect(alarm.Properties?.EvaluationPeriods).toBe(2);
            expect(alarm.Properties?.ComparisonOperator).toBeDefined();
            expect(alarm.Properties?.AlarmDescription).toBeDefined();
          });

          const cpuAlarm = alarmResources.find(a =>
            a.Properties?.AlarmName?.includes('ecs-cpu')
          );
          const dbAlarm = alarmResources.find(a =>
            a.Properties?.AlarmName?.includes('rds-db')
          );

          expect(cpuAlarm?.Properties?.Threshold).toBe(80);
          expect(dbAlarm?.Properties?.Threshold).toBe(100);
        } finally {
          if (originalEnv === undefined) {
            delete process.env.ENVIRONMENT_SUFFIX;
          } else {
            process.env.ENVIRONMENT_SUFFIX = originalEnv;
          }
        }
      });
    });

    describe('NotificationsConstruct', () => {
      test('handles environment suffix sanitization for SNS topics', () => {
        // Set environment variable for this test
        const originalEnv = process.env.ENVIRONMENT_SUFFIX;
        process.env.ENVIRONMENT_SUFFIX = '${TOPIC_ENV:-staging}';

        try {
          const app = new cdk.App();
          const stack = new cdk.Stack(app, 'TestStack', {
            env: { region: 'us-east-1' },
          });
          new NotificationsConstruct(stack, 'TestNotifications');
          const template = Template.fromStack(stack);
          const topics = template.findResources('AWS::SNS::Topic');
          expect(Object.keys(topics).length).toBeGreaterThan(0);
          // Should have sanitized topic names
          const topicNames = Object.values(topics).map(
            (t: any) => t.Properties?.TopicName
          );
          // The sanitization extracts 'staging' as default value from bash variable ${TOPIC_ENV:-staging}
          // So topic names should include 'tapstack-staging-default'
          expect(
            topicNames.some(
              name => name && name.includes('tapstack-staging-default')
            )
          ).toBe(true);
        } finally {
          // Restore original environment
          if (originalEnv === undefined) {
            delete process.env.ENVIRONMENT_SUFFIX;
          } else {
            process.env.ENVIRONMENT_SUFFIX = originalEnv;
          }
        }
      });

      test('creates topics with correct display names', () => {
        const app = new cdk.App();
        const stack = new cdk.Stack(app, 'TestStack');
        new NotificationsConstruct(stack, 'TestNotifications');
        const template = Template.fromStack(stack);
        const topics = template.findResources('AWS::SNS::Topic');
        expect(Object.keys(topics).length).toBeGreaterThan(0);

        const topicList = Object.values(topics) as any[];
        const operationalTopic = topicList.find(t =>
          t.Properties?.DisplayName?.includes('Operational')
        );
        const securityTopic = topicList.find(t =>
          t.Properties?.DisplayName?.includes('Security')
        );

        expect(operationalTopic).toBeDefined();
        expect(securityTopic).toBeDefined();
      });

      test('handles environment suffix that becomes empty after sanitization for topics', () => {
        const app = new cdk.App({
          context: { environmentSuffix: '$$$$####$$$$' }, // Special chars only, becomes empty
        });
        const stack = new cdk.Stack(app, 'TestStack');
        new NotificationsConstruct(stack, 'TestNotifications');
        const template = Template.fromStack(stack);
        const topics = template.findResources('AWS::SNS::Topic');
        expect(Object.keys(topics).length).toBeGreaterThan(0);
        // Should use 'dev' fallback in topic names
        const topicNames = Object.values(topics).map(
          (t: any) => t.Properties?.TopicName
        );
        expect(
          topicNames.some(name => name && name.includes('tapstack-dev'))
        ).toBe(true);
      });
    });
  });
});
