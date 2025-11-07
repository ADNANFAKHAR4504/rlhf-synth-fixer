import * as cdk from 'aws-cdk-lib';
import { Annotations, Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

describe('TapStack Integration Tests', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeAll(() => {
    app = new cdk.App({ context: { environmentSuffix: 'test' } });
    stack = new TapStack(app, 'TapStackIntegrationTest', {
      environmentSuffix: 'test',
      projectName: 'payment',
    });
    template = Template.fromStack(stack);
  });

  describe('Infrastructure Integration', () => {
    test('should create complete monitoring stack without errors', () => {
      const warnings = Annotations.fromStack(stack).findWarning('*', '*');
      const errors = Annotations.fromStack(stack).findError('*', '*');

      expect(warnings.length).toBe(0);
      expect(errors.length).toBe(0);
    });

    test('should have valid CloudFormation template', () => {
      const cfnTemplate = template.toJSON();

      expect(cfnTemplate.AWSTemplateFormatVersion).toBe('2010-09-09');
      expect(cfnTemplate.Description).toContain(
        'Payment monitoring infrastructure'
      );
      expect(cfnTemplate.Resources).toBeDefined();
      expect(cfnTemplate.Outputs).toBeDefined();
    });
  });

  describe('Resource Integration', () => {
    test('should create SNS topics with correct properties', () => {
      const topics = template.findResources('AWS::SNS::Topic');

      expect(Object.keys(topics).length).toBe(2); // Operational and Security topics

      // Check that topics have proper display names and topic names
      Object.values(topics).forEach((topic: any) => {
        expect(topic.Properties.DisplayName).toMatch(
          /^Payment Platform - (Operational|Security) Alerts$/
        );
        expect(topic.Properties.TopicName).toMatch(
          /^payment-platform-(operational|security)-alerts$/
        );
      });
    });

    test('should create Lambda function with proper configuration', () => {
      const functions = template.findResources('AWS::Lambda::Function');

      expect(Object.keys(functions).length).toBe(1);

      const lambdaFunction = Object.values(functions)[0] as any;
      expect(lambdaFunction.Properties.FunctionName).toBe(
        'payment-log-processor'
      );
      expect(lambdaFunction.Properties.Runtime).toBe('nodejs18.x');
      expect(lambdaFunction.Properties.Architecture).toBe('arm64');
      expect(lambdaFunction.Properties.Timeout).toBe(60);
      expect(lambdaFunction.Properties.MemorySize).toBe(512);
    });

    test('should create CloudWatch alarms with correct thresholds', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');

      expect(Object.keys(alarms).length).toBeGreaterThan(0);

      // Check specific alarm configurations
      const alarmNames = Object.values(alarms).map(
        (alarm: any) => alarm.Properties.AlarmName
      );

      expect(alarmNames).toEqual(
        expect.arrayContaining([
          'payment-failure-rate-high',
          'api-gateway-latency-high',
          'rds-connection-pool-exhausted',
          'ecs-task-failures-high',
          'authentication-failures-high',
          'critical-performance-degradation',
        ])
      );
    });

    test('should create log groups with proper retention', () => {
      const logGroups = template.findResources('AWS::Logs::LogGroup');

      expect(Object.keys(logGroups).length).toBe(2); // Application and API Gateway logs

      Object.values(logGroups).forEach((logGroup: any) => {
        expect(logGroup.Properties.RetentionInDays).toBe(30);
        expect(logGroup.Properties.LogGroupName).toMatch(
          /^\/aws\/(application\/payment-platform|apigateway\/payment-api)$/
        );
      });
    });

    test('should create metric filters for error tracking', () => {
      const metricFilters = template.findResources('AWS::Logs::MetricFilter');

      expect(Object.keys(metricFilters).length).toBe(5); // Various error filters

      const filterNames = Object.values(metricFilters).map(
        (filter: any) => filter.Properties.FilterName
      );
      expect(filterNames).toEqual(
        expect.arrayContaining([
          'PaymentErrorFilter',
          'SecurityEventFilter',
          'DatabaseErrorFilter',
          'API4xxFilter',
          'API5xxFilter',
        ])
      );
    });

    test('should create log subscription filters', () => {
      const subscriptionFilters = template.findResources(
        'AWS::Logs::SubscriptionFilter'
      );

      expect(Object.keys(subscriptionFilters).length).toBe(1);

      const filter = Object.values(subscriptionFilters)[0] as any;
      expect(filter.Properties.FilterPattern).toBe('""'); // All events
    });
  });

  describe('Security and IAM Integration', () => {
    test('should create IAM policies for Lambda function', () => {
      const policies = template.findResources('AWS::IAM::Policy');

      expect(Object.keys(policies).length).toBeGreaterThan(0);

      // Check for CloudWatch metrics permissions
      const policyStatements = Object.values(policies).flatMap(
        (policy: any) => policy.Properties.PolicyDocument.Statement
      );

      const cloudwatchPutMetric = policyStatements.find((stmt: any) =>
        stmt.Action?.includes('cloudwatch:PutMetricData')
      );

      expect(cloudwatchPutMetric).toBeDefined();
    });

    test('should apply least privilege IAM roles', () => {
      const roles = template.findResources('AWS::IAM::Role');

      expect(Object.keys(roles).length).toBeGreaterThan(0);

      Object.values(roles).forEach((role: any) => {
        expect(role.Properties.AssumeRolePolicyDocument).toBeDefined();
        expect(
          role.Properties.AssumeRolePolicyDocument.Statement
        ).toBeDefined();
      });
    });
  });

  describe('Outputs Integration', () => {
    test('should export all required outputs', () => {
      const outputs = template.toJSON().Outputs || {};

      expect(outputs.OperationalTopicArn).toBeDefined();
      expect(outputs.OperationalTopicArn.Value).toMatch(/Ref/);
      expect(outputs.OperationalTopicArn.Description).toContain(
        'operational alerts'
      );

      expect(outputs.SecurityTopicArn).toBeDefined();
      expect(outputs.SecurityTopicArn.Value).toMatch(/Ref/);
      expect(outputs.SecurityTopicArn.Description).toContain('security alerts');

      expect(outputs.LogProcessorFunctionName).toBeDefined();
      expect(outputs.LogProcessorFunctionName.Value).toMatch(/Ref/);
      expect(outputs.LogProcessorFunctionName.Description).toContain(
        'Log processor Lambda'
      );
    });

    test('should have exportable output names', () => {
      const outputs = template.toJSON().Outputs || {};

      // Outputs should be named appropriately for cross-stack references
      expect(outputs.OperationalTopicArn.Export?.Name).toMatch(
        /OperationalTopicArn/
      );
      expect(outputs.SecurityTopicArn.Export?.Name).toMatch(/SecurityTopicArn/);
      expect(outputs.LogProcessorFunctionName.Export?.Name).toMatch(
        /LogProcessorFunctionName/
      );
    });
  });

  describe('Environment-Specific Configuration', () => {
    test('should use test environment configuration', () => {
      const nestedStacks = template.findResources('AWS::CloudFormation::Stack');
      const nestedStack = Object.values(nestedStacks)[0] as any;

      expect(nestedStack.Properties.StackName).toContain(
        'payment-monitoring-test'
      );
    });

    test('should apply environment-specific tags', () => {
      const resources = template.toJSON().Resources || {};
      const taggedResource = Object.values(resources).find((resource: any) =>
        resource.Properties?.Tags?.some(
          (tag: any) => tag.Key === 'Environment' && tag.Value === 'test'
        )
      );

      expect(taggedResource).toBeDefined();
    });
  });

  describe('Cross-Resource Dependencies', () => {
    test('should have proper alarm-to-topic dependencies', () => {
      const alarms = template.findResources('AWS::CloudWatch::Alarm');
      const topics = template.findResources('AWS::SNS::Topic');

      expect(Object.keys(alarms).length).toBeGreaterThan(0);
      expect(Object.keys(topics).length).toBe(2); // Operational and Security topics

      // Check that alarms reference SNS topics
      const alarmActions = Object.values(alarms).flatMap(
        (alarm: any) => alarm.Properties?.AlarmActions || []
      );

      expect(alarmActions.length).toBeGreaterThan(0);
      alarmActions.forEach((action: string) => {
        expect(action).toMatch(/Ref/); // Should reference SNS topic resources
      });
    });

    test('should have proper Lambda-to-log-group dependencies', () => {
      const lambdaFunctions = template.findResources('AWS::Lambda::Function');
      const subscriptionFilters = template.findResources(
        'AWS::Logs::SubscriptionFilter'
      );

      expect(Object.keys(lambdaFunctions).length).toBe(1);
      expect(Object.keys(subscriptionFilters).length).toBe(1);

      const subscriptionFilter = Object.values(subscriptionFilters)[0] as any;
      expect(subscriptionFilter.Properties.DestinationArn).toMatch(/Ref/); // Should reference Lambda
    });
  });
});
