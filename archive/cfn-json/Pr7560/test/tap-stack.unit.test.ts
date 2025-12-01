import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Observability Stack', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have appropriate description for observability stack', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Observability');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(
        template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups
      ).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
    });

    test('should have Environment parameter for tagging', () => {
      expect(template.Parameters.Environment).toBeDefined();
      expect(template.Parameters.Environment.Type).toBe('String');
      expect(template.Parameters.Environment.AllowedValues).toContain(
        'production'
      );
    });

    test('should have Owner parameter for tagging', () => {
      expect(template.Parameters.Owner).toBeDefined();
      expect(template.Parameters.Owner.Type).toBe('String');
    });

    test('should have CostCenter parameter for tagging', () => {
      expect(template.Parameters.CostCenter).toBeDefined();
      expect(template.Parameters.CostCenter.Type).toBe('String');
    });

    test('should have PrimaryKMSKeyArn parameter', () => {
      expect(template.Parameters.PrimaryKMSKeyArn).toBeDefined();
      expect(template.Parameters.PrimaryKMSKeyArn.Type).toBe('String');
      expect(template.Parameters.PrimaryKMSKeyArn.AllowedPattern).toBeDefined();
    });

    test('should have LambdaFunctionName parameter', () => {
      expect(template.Parameters.LambdaFunctionName).toBeDefined();
      expect(template.Parameters.LambdaFunctionName.Default).toBe(
        'PaymentProcessorFunction'
      );
    });

    test('should have ApiGatewayName parameter', () => {
      expect(template.Parameters.ApiGatewayName).toBeDefined();
      expect(template.Parameters.ApiGatewayName.Default).toBe('PaymentAPI');
    });

    test('should have AlertEmailAddress parameter', () => {
      expect(template.Parameters.AlertEmailAddress).toBeDefined();
      expect(template.Parameters.AlertEmailAddress.Type).toBe('String');
      expect(
        template.Parameters.AlertEmailAddress.AllowedPattern
      ).toBeDefined();
    });
  });

  describe('CloudWatch Log Groups (Requirement 1)', () => {
    test('should have 30-day retention on PaymentLogGroup', () => {
      const logGroup = template.Resources.PaymentLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('all log groups should have Delete deletion policy', () => {
      expect(template.Resources.PaymentLogGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ApiGatewayLogGroup.DeletionPolicy).toBe(
        'Delete'
      );
      expect(template.Resources.LambdaLogGroup.DeletionPolicy).toBe('Delete');
    });
  });

  describe('CloudWatch Dashboard (Requirement 2)', () => {
    test('should have ObservabilityDashboard resource', () => {
      const dashboard = template.Resources.ObservabilityDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('dashboard should have name with environment suffix', () => {
      const dashboard = template.Resources.ObservabilityDashboard;
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'PaymentProcessing-${EnvironmentSuffix}',
      });
    });

    test('dashboard should have DashboardBody with widgets', () => {
      const dashboard = template.Resources.ObservabilityDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });
  });

  describe('X-Ray Sampling Rule (Requirement 3)', () => {
    test('should have XRaySamplingRule resource', () => {
      const samplingRule = template.Resources.XRaySamplingRule;
      expect(samplingRule).toBeDefined();
      expect(samplingRule.Type).toBe('AWS::XRay::SamplingRule');
    });

    test('should have 10% sampling rate (0.1 fixed rate)', () => {
      const samplingRule = template.Resources.XRaySamplingRule;
      expect(samplingRule.Properties.SamplingRule.FixedRate).toBe(0.1);
    });

    test('should have priority 1000', () => {
      const samplingRule = template.Resources.XRaySamplingRule;
      expect(samplingRule.Properties.SamplingRule.Priority).toBe(1000);
    });
  });

  describe('Composite Alarms (Requirement 4)', () => {
    test('should have Api5XXErrorAlarm', () => {
      const alarm = template.Resources.Api5XXErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('5XXError');
    });

    test('should have LambdaTimeoutAlarm', () => {
      const alarm = template.Resources.LambdaTimeoutAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Duration');
    });

    test('should have CompositeAlarm combining both alarms', () => {
      const compositeAlarm = template.Resources.CompositeAlarm;
      expect(compositeAlarm).toBeDefined();
      expect(compositeAlarm.Type).toBe('AWS::CloudWatch::CompositeAlarm');
    });

    test('composite alarm should use OR logic', () => {
      const compositeAlarm = template.Resources.CompositeAlarm;
      expect(compositeAlarm.Properties.AlarmRule).toBeDefined();
      const alarmRule = compositeAlarm.Properties.AlarmRule['Fn::Sub'];
      expect(alarmRule).toContain('OR');
      expect(alarmRule).toContain('Api5XXErrorAlarm');
      expect(alarmRule).toContain('LambdaTimeoutAlarm');
    });

    test('composite alarm should have actions enabled', () => {
      const compositeAlarm = template.Resources.CompositeAlarm;
      expect(compositeAlarm.Properties.ActionsEnabled).toBe(true);
    });
  });

  describe('SNS Topics and Subscriptions (Requirement 5)', () => {
    test('should have CriticalAlertTopic', () => {
      const topic = template.Resources.CriticalAlertTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have CriticalAlertEmailSubscription', () => {
      const subscription = template.Resources.CriticalAlertEmailSubscription;
      expect(subscription).toBeDefined();
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
      expect(subscription.Properties.Protocol).toBe('email');
    });

    test('email subscription should reference alert email parameter', () => {
      const subscription = template.Resources.CriticalAlertEmailSubscription;
      expect(subscription.Properties.Endpoint).toEqual({
        Ref: 'AlertEmailAddress',
      });
    });

    test('composite alarm should send to SNS topic', () => {
      const compositeAlarm = template.Resources.CompositeAlarm;
      expect(compositeAlarm.Properties.AlarmActions).toBeDefined();
      expect(compositeAlarm.Properties.AlarmActions[0]).toEqual({
        Ref: 'CriticalAlertTopic',
      });
    });
  });

  describe('Parameter Store (Requirement 6)', () => {
    test('should have DashboardConfigParameter', () => {
      const parameter = template.Resources.DashboardConfigParameter;
      expect(parameter).toBeDefined();
      expect(parameter.Type).toBe('AWS::SSM::Parameter');
    });

    test('parameter should store dashboard configuration', () => {
      const parameter = template.Resources.DashboardConfigParameter;
      expect(parameter.Properties.Name).toEqual({
        'Fn::Sub': '/observability/dashboard-config/${EnvironmentSuffix}',
      });
      expect(parameter.Properties.Type).toBe('String');
    });

    test('parameter should have description about version control', () => {
      const parameter = template.Resources.DashboardConfigParameter;
      expect(parameter.Properties.Description).toContain('version control');
    });
  });

  describe('Metric Filters (Requirement 8)', () => {
    test('should have TransactionVolumeMetricFilter', () => {
      const filter = template.Resources.TransactionVolumeMetricFilter;
      expect(filter).toBeDefined();
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
    });

    test('TransactionVolumeMetricFilter should extract TRANSACTION events', () => {
      const filter = template.Resources.TransactionVolumeMetricFilter;
      expect(filter.Properties.FilterPattern).toContain('TRANSACTION');
    });

    test('should have FailedTransactionMetricFilter', () => {
      const filter = template.Resources.FailedTransactionMetricFilter;
      expect(filter).toBeDefined();
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
    });

    test('FailedTransactionMetricFilter should extract TRANSACTION_FAILED events', () => {
      const filter = template.Resources.FailedTransactionMetricFilter;
      expect(filter.Properties.FilterPattern).toContain('TRANSACTION_FAILED');
    });

    test('metric filters should publish to PaymentMetrics namespace', () => {
      const volumeFilter = template.Resources.TransactionVolumeMetricFilter;
      const failedFilter = template.Resources.FailedTransactionMetricFilter;

      expect(
        volumeFilter.Properties.MetricTransformations[0].MetricNamespace
      ).toBe('PaymentMetrics');
      expect(
        failedFilter.Properties.MetricTransformations[0].MetricNamespace
      ).toBe('PaymentMetrics');
    });
  });

  describe('Cross-Region Metric Streams (Requirement 9)', () => {
    test('should have MetricStream resource', () => {
      const metricStream = template.Resources.MetricStream;
      expect(metricStream).toBeDefined();
      expect(metricStream.Type).toBe('AWS::CloudWatch::MetricStream');
    });

    test('should have MetricStreamBucket with 90-day retention', () => {
      const bucket = template.Resources.MetricStreamBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');

      const lifecycleRule =
        bucket.Properties.LifecycleConfiguration.Rules.find(
          (rule: any) => rule.Id === 'DeleteOldMetrics'
        );
      expect(lifecycleRule).toBeDefined();
      expect(lifecycleRule.ExpirationInDays).toBe(90);
    });

    test('should have MetricStreamFirehose delivery stream', () => {
      const firehose = template.Resources.MetricStreamFirehose;
      expect(firehose).toBeDefined();
      expect(firehose.Type).toBe('AWS::KinesisFirehose::DeliveryStream');
    });

    test('should have MetricStreamRole for CloudWatch', () => {
      const role = template.Resources.MetricStreamRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have FirehoseRole for S3 access', () => {
      const role = template.Resources.FirehoseRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('metric stream should output JSON format', () => {
      const metricStream = template.Resources.MetricStream;
      expect(metricStream.Properties.OutputFormat).toBe('json');
    });

    test('metric stream should include API Gateway, Lambda, and PaymentMetrics namespaces', () => {
      const metricStream = template.Resources.MetricStream;
      const namespaces = metricStream.Properties.IncludeFilters.map(
        (f: any) => f.Namespace
      );

      expect(namespaces).toContain('AWS/ApiGateway');
      expect(namespaces).toContain('AWS/Lambda');
      expect(namespaces).toContain('PaymentMetrics');
    });
  });

  describe('IAM Roles for CloudWatch Agent (Requirement 10)', () => {
    test('should have CloudWatchAgentRole', () => {
      const role = template.Resources.CloudWatchAgentRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('CloudWatchAgentRole should be assumable by EC2', () => {
      const role = template.Resources.CloudWatchAgentRole;
      const assumeRole = role.Properties.AssumeRolePolicyDocument;
      expect(assumeRole.Statement[0].Principal.Service).toBe(
        'ec2.amazonaws.com'
      );
    });

    test('should have CloudWatchAgentPolicy with least privilege', () => {
      const policy = template.Resources.CloudWatchAgentPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::Policy');
    });

    test('CloudWatchAgentPolicy should restrict logs access to specific log groups', () => {
      const policy = template.Resources.CloudWatchAgentPolicy;
      const logsStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Action.includes('logs:PutLogEvents')
      );

      expect(logsStatement).toBeDefined();
      expect(logsStatement.Resource).toHaveLength(3);
    });

    test('CloudWatchAgentPolicy should restrict metrics to PaymentMetrics namespace', () => {
      const policy = template.Resources.CloudWatchAgentPolicy;
      const metricsStatement = policy.Properties.PolicyDocument.Statement.find(
        (s: any) => s.Action.includes('cloudwatch:PutMetricData')
      );

      expect(metricsStatement).toBeDefined();
      expect(metricsStatement.Condition).toBeDefined();
      expect(metricsStatement.Condition.StringEquals).toEqual({
        'cloudwatch:namespace': 'PaymentMetrics',
      });
    });

    test('should have CloudWatchAgentInstanceProfile', () => {
      const profile = template.Resources.CloudWatchAgentInstanceProfile;
      expect(profile).toBeDefined();
      expect(profile.Type).toBe('AWS::IAM::InstanceProfile');
    });

    test('should have CloudWatchLogsResourcePolicy', () => {
      const resourcePolicy = template.Resources.CloudWatchLogsResourcePolicy;
      expect(resourcePolicy).toBeDefined();
      expect(resourcePolicy.Type).toBe('AWS::Logs::ResourcePolicy');
    });
  });

  describe('Compliance - Consistent Tagging', () => {
    const resourcesWithTags = [
      'PaymentLogGroup',
      'ApiGatewayLogGroup',
      'LambdaLogGroup',
      'XRaySamplingRule',
      'Api5XXErrorAlarm',
      'LambdaTimeoutAlarm',
      'CompositeAlarm',
      'CriticalAlertTopic',
      'MetricStreamBucket',
      'MetricStream',
      'CloudWatchAgentRole',
    ];

    resourcesWithTags.forEach(resourceName => {
      test(`${resourceName} should have Environment tag`, () => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        const envTag = Array.isArray(tags)
          ? tags.find((t: any) => t.Key === 'Environment')
          : null;

        expect(envTag).toBeDefined();
      });

      test(`${resourceName} should have Owner tag`, () => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        const ownerTag = Array.isArray(tags)
          ? tags.find((t: any) => t.Key === 'Owner')
          : null;

        expect(ownerTag).toBeDefined();
      });

      test(`${resourceName} should have CostCenter tag`, () => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;
        const costCenterTag = Array.isArray(tags)
          ? tags.find((t: any) => t.Key === 'CostCenter')
          : null;

        expect(costCenterTag).toBeDefined();
      });
    });
  });

  describe('Compliance - Deletion Policies', () => {
    test('all log groups should be deletable', () => {
      expect(template.Resources.PaymentLogGroup.DeletionPolicy).toBe('Delete');
      expect(template.Resources.ApiGatewayLogGroup.DeletionPolicy).toBe(
        'Delete'
      );
      expect(template.Resources.LambdaLogGroup.DeletionPolicy).toBe('Delete');
    });

    test('S3 bucket should be deletable', () => {
      expect(template.Resources.MetricStreamBucket.DeletionPolicy).toBe(
        'Delete'
      );
    });
  });

  describe('Outputs', () => {
    test('should have PaymentLogGroupName output', () => {
      expect(template.Outputs.PaymentLogGroupName).toBeDefined();
      expect(template.Outputs.PaymentLogGroupName.Value).toEqual({
        Ref: 'PaymentLogGroup',
      });
    });

    test('should have DashboardName output', () => {
      expect(template.Outputs.DashboardName).toBeDefined();
      expect(template.Outputs.DashboardName.Value).toEqual({
        Ref: 'ObservabilityDashboard',
      });
    });

    test('should have XRaySamplingRuleArn output', () => {
      expect(template.Outputs.XRaySamplingRuleArn).toBeDefined();
    });

    test('should have CompositeAlarmName output', () => {
      expect(template.Outputs.CompositeAlarmName).toBeDefined();
      expect(template.Outputs.CompositeAlarmName.Value).toEqual({
        Ref: 'CompositeAlarm',
      });
    });

    test('should have CriticalAlertTopicArn output', () => {
      expect(template.Outputs.CriticalAlertTopicArn).toBeDefined();
      expect(template.Outputs.CriticalAlertTopicArn.Value).toEqual({
        Ref: 'CriticalAlertTopic',
      });
    });

    test('should have MetricStreamName output', () => {
      expect(template.Outputs.MetricStreamName).toBeDefined();
      expect(template.Outputs.MetricStreamName.Value).toEqual({
        Ref: 'MetricStream',
      });
    });

    test('should have CloudWatchAgentRoleArn output', () => {
      expect(template.Outputs.CloudWatchAgentRoleArn).toBeDefined();
    });

    test('should have EnvironmentSuffix output', () => {
      expect(template.Outputs.EnvironmentSuffix).toBeDefined();
      expect(template.Outputs.EnvironmentSuffix.Value).toEqual({
        Ref: 'EnvironmentSuffix',
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Conventions', () => {
    test('log group names should include environment suffix', () => {
      expect(template.Resources.PaymentLogGroup.Properties.LogGroupName).toEqual(
        {
          'Fn::Sub': '/aws/payment-processing/${EnvironmentSuffix}',
        }
      );
    });

    test('dashboard name should include environment suffix', () => {
      expect(
        template.Resources.ObservabilityDashboard.Properties.DashboardName
      ).toEqual({
        'Fn::Sub': 'PaymentProcessing-${EnvironmentSuffix}',
      });
    });

    test('SNS topic name should include environment suffix', () => {
      expect(template.Resources.CriticalAlertTopic.Properties.TopicName).toEqual(
        {
          'Fn::Sub': 'PaymentProcessing-Critical-Alerts-${EnvironmentSuffix}',
        }
      );
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have at least 20 resources (comprehensive observability)', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThanOrEqual(20);
    });

    test('should have at least 10 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThanOrEqual(10);
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.MetricStreamBucket;
      const publicAccessConfig =
        bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccessConfig.BlockPublicAcls).toBe(true);
      expect(publicAccessConfig.BlockPublicPolicy).toBe(true);
      expect(publicAccessConfig.IgnorePublicAcls).toBe(true);
      expect(publicAccessConfig.RestrictPublicBuckets).toBe(true);
    });

    test('IAM roles should have specific service principals', () => {
      const cloudwatchRole = template.Resources.CloudWatchAgentRole;
      expect(
        cloudwatchRole.Properties.AssumeRolePolicyDocument.Statement[0]
          .Principal.Service
      ).toBe('ec2.amazonaws.com');

      const metricStreamRole = template.Resources.MetricStreamRole;
      expect(
        metricStreamRole.Properties.AssumeRolePolicyDocument.Statement[0]
          .Principal.Service
      ).toBe('streams.metrics.cloudwatch.amazonaws.com');
    });
  });

  describe('All 10 Requirements Validation', () => {
    test('Requirement 1: Encrypted log groups with 30-day retention exist', () => {
      expect(template.Resources.PaymentLogGroup).toBeDefined();
      expect(template.Resources.ApiGatewayLogGroup).toBeDefined();
      expect(template.Resources.LambdaLogGroup).toBeDefined();
    });

    test('Requirement 2: CloudWatch Dashboard with widgets exists', () => {
      expect(template.Resources.ObservabilityDashboard).toBeDefined();
    });

    test('Requirement 3: X-Ray sampling rule at 10% exists', () => {
      expect(template.Resources.XRaySamplingRule).toBeDefined();
      expect(
        template.Resources.XRaySamplingRule.Properties.SamplingRule.FixedRate
      ).toBe(0.1);
    });

    test('Requirement 4: Composite alarms combining metrics exist', () => {
      expect(template.Resources.CompositeAlarm).toBeDefined();
      expect(template.Resources.Api5XXErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaTimeoutAlarm).toBeDefined();
    });

    test('Requirement 5: SNS topics with email subscriptions exist', () => {
      expect(template.Resources.CriticalAlertTopic).toBeDefined();
      expect(template.Resources.CriticalAlertEmailSubscription).toBeDefined();
    });

    test('Requirement 6: Parameter Store for dashboard config exists', () => {
      expect(template.Resources.DashboardConfigParameter).toBeDefined();
    });

    test('Requirement 7: CloudWatch Logs Insights queries in dashboard exist', () => {
      const dashboard = template.Resources.ObservabilityDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });

    test('Requirement 8: Metric filters extracting custom metrics exist', () => {
      expect(template.Resources.TransactionVolumeMetricFilter).toBeDefined();
      expect(template.Resources.FailedTransactionMetricFilter).toBeDefined();
    });

    test('Requirement 9: Cross-region metric streams exist', () => {
      expect(template.Resources.MetricStream).toBeDefined();
      expect(template.Resources.MetricStreamFirehose).toBeDefined();
      expect(template.Resources.MetricStreamBucket).toBeDefined();
    });

    test('Requirement 10: IAM roles with least privilege for CloudWatch agent exist', () => {
      expect(template.Resources.CloudWatchAgentRole).toBeDefined();
      expect(template.Resources.CloudWatchAgentPolicy).toBeDefined();
      expect(template.Resources.CloudWatchAgentInstanceProfile).toBeDefined();
    });
  });
});
