import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'prod';

describe('TapStack CloudFormation Template', () => {
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

    test('should have a description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Advanced Observability Platform for Microservices Monitoring'
      );
    });

    test('should have required top-level sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming uniqueness'
      );
      expect(envSuffixParam.AllowedPattern).toBe('[a-z0-9-]+');
    });

    test('should have XRaySamplingRate parameter', () => {
      const param = template.Parameters.XRaySamplingRate;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(0.1);
      expect(param.MinValue).toBe(0);
      expect(param.MaxValue).toBe(1);
    });

    test('should have AlertEmail parameter', () => {
      const param = template.Parameters.AlertEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
    });

    test('should have AlertPhoneNumber parameter', () => {
      const param = template.Parameters.AlertPhoneNumber;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('^\\+[1-9]\\d{1,14}$');
    });

    test('should have CrossAccountRoleArn parameter', () => {
      const param = template.Parameters.CrossAccountRoleArn;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
    });

    test('should have Department parameter', () => {
      const param = template.Parameters.Department;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('Engineering');
      expect(param.AllowedValues).toContain('Engineering');
      expect(param.AllowedValues).toContain('Finance');
      expect(param.AllowedValues).toContain('Operations');
      expect(param.AllowedValues).toContain('Security');
    });
  });

  describe('Conditions', () => {
    test('should have HasCrossAccountRole condition', () => {
      const condition = template.Conditions.HasCrossAccountRole;
      expect(condition).toBeDefined();
      expect(condition['Fn::Not']).toBeDefined();
    });
  });

  describe('Resources - KMS and Encryption', () => {
    test('should have KMSKey resource', () => {
      const resource = template.Resources.KMSKey;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::KMS::Key');
      expect(resource.DeletionPolicy).toBe('Delete');
      expect(resource.Properties.EnableKeyRotation).toBe(true);
    });

    test('should have KMSKeyAlias resource', () => {
      const resource = template.Resources.KMSKeyAlias;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::KMS::Alias');
      expect(resource.Properties.AliasName).toEqual({
        'Fn::Sub': 'alias/observability-${EnvironmentSuffix}'
      });
    });
  });

  describe('Resources - SNS and Alerting', () => {
    test('should have AlertTopic resource', () => {
      const resource = template.Resources.AlertTopic;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::SNS::Topic');
      expect(resource.DeletionPolicy).toBe('Delete');
      expect(resource.Properties.TopicName).toEqual({
        'Fn::Sub': 'observability-alerts-${EnvironmentSuffix}'
      });
    });

    test('AlertTopic should have KMS encryption', () => {
      const resource = template.Resources.AlertTopic;
      expect(resource.Properties.KmsMasterKeyId).toEqual({ Ref: 'KMSKey' });
    });

    test('AlertTopic should have email and SMS subscriptions', () => {
      const resource = template.Resources.AlertTopic;
      const subscriptions = resource.Properties.Subscription;
      expect(subscriptions).toHaveLength(2);
      expect(subscriptions.find((s: any) => s.Protocol === 'email')).toBeDefined();
      expect(subscriptions.find((s: any) => s.Protocol === 'sms')).toBeDefined();
    });
  });

  describe('Resources - CloudWatch Logs', () => {
    test('should have MetricsLogGroup resource', () => {
      const resource = template.Resources.MetricsLogGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
      expect(resource.DeletionPolicy).toBe('Delete');
      expect(resource.Properties.RetentionInDays).toBe(30);
    });

    test('should have MetricsProcessorLogGroup resource', () => {
      const resource = template.Resources.MetricsProcessorLogGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Logs::LogGroup');
      expect(resource.DeletionPolicy).toBe('Delete');
    });

    test('should have LatencyMetricFilter resource', () => {
      const resource = template.Resources.LatencyMetricFilter;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Logs::MetricFilter');
      expect(resource.Properties.FilterPattern).toBe('{$.latency = *}');
    });

    test('should have ErrorRateMetricFilter resource', () => {
      const resource = template.Resources.ErrorRateMetricFilter;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Logs::MetricFilter');
      expect(resource.Properties.FilterPattern).toBe('{$.error = *}');
    });
  });

  describe('Resources - Lambda', () => {
    test('should have LambdaExecutionRole resource', () => {
      const resource = template.Resources.LambdaExecutionRole;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IAM::Role');
      expect(resource.Properties.RoleName).toEqual({
        'Fn::Sub': 'observability-lambda-role-${EnvironmentSuffix}'
      });
    });

    test('LambdaExecutionRole should have correct managed policies', () => {
      const resource = template.Resources.LambdaExecutionRole;
      const policies = resource.Properties.ManagedPolicyArns;
      expect(policies).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
      expect(policies).toContain('arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess');
    });

    test('should have MetricsProcessorFunction resource', () => {
      const resource = template.Resources.MetricsProcessorFunction;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Lambda::Function');
      expect(resource.DeletionPolicy).toBe('Delete');
      expect(resource.Properties.Runtime).toBe('python3.11');
      expect(resource.Properties.ReservedConcurrentExecutions).toBe(5);
    });

    test('MetricsProcessorFunction should have X-Ray tracing enabled', () => {
      const resource = template.Resources.MetricsProcessorFunction;
      expect(resource.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('MetricsProcessorFunction should have environment variables', () => {
      const resource = template.Resources.MetricsProcessorFunction;
      const envVars = resource.Properties.Environment.Variables;
      expect(envVars.CUSTOM_NAMESPACE).toBeDefined();
      expect(envVars.LOG_GROUP_NAME).toEqual({ Ref: 'MetricsLogGroup' });
    });
  });

  describe('Resources - EventBridge', () => {
    test('should have MetricCollectionRule resource', () => {
      const resource = template.Resources.MetricCollectionRule;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Events::Rule');
      expect(resource.Properties.ScheduleExpression).toBe('cron(0/5 * * * ? *)');
      expect(resource.Properties.State).toBe('ENABLED');
    });

    test('should have MetricCollectionRulePermission resource', () => {
      const resource = template.Resources.MetricCollectionRulePermission;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::Lambda::Permission');
      expect(resource.Properties.Action).toBe('lambda:InvokeFunction');
    });
  });

  describe('Resources - X-Ray', () => {
    test('should have XRayGroup resource', () => {
      const resource = template.Resources.XRayGroup;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::XRay::Group');
      expect(resource.Properties.GroupName).toEqual({
        'Fn::Sub': 'observability-traces-${EnvironmentSuffix}'
      });
    });

    test('XRayGroup should have correct filter expression', () => {
      const resource = template.Resources.XRayGroup;
      const filterExpr = resource.Properties.FilterExpression;
      expect(filterExpr).toBe('service("*") { fault = true OR error = true OR responsetime > 2 }');
      expect(filterExpr).not.toContain('response_time');
    });

    test('should have XRaySamplingRule resource', () => {
      const resource = template.Resources.XRaySamplingRule;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::XRay::SamplingRule');
      expect(resource.Properties.SamplingRule.FixedRate).toEqual({ Ref: 'XRaySamplingRate' });
    });
  });

  describe('Resources - CloudWatch Alarms', () => {
    test('should have HighLatencyAlarm resource', () => {
      const resource = template.Resources.HighLatencyAlarm;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::Alarm');
      expect(resource.Properties.MetricName).toBe('RequestLatency');
      expect(resource.Properties.Threshold).toBe(1000);
    });

    test('should have HighErrorRateAlarm resource', () => {
      const resource = template.Resources.HighErrorRateAlarm;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::Alarm');
      expect(resource.Properties.MetricName).toBe('ErrorRate');
      expect(resource.Properties.Threshold).toBe(10);
    });

    test('should have CompositeAlarm resource', () => {
      const resource = template.Resources.CompositeAlarm;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::CompositeAlarm');
      expect(resource.Properties.AlarmActions).toContainEqual({ Ref: 'AlertTopic' });
    });
  });

  describe('Resources - Anomaly Detection', () => {
    test('should have LatencyAnomalyDetector resource', () => {
      const resource = template.Resources.LatencyAnomalyDetector;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::AnomalyDetector');
      expect(resource.Properties.MetricName).toBe('RequestLatency');
    });

    test('should have ErrorRateAnomalyDetector resource', () => {
      const resource = template.Resources.ErrorRateAnomalyDetector;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::AnomalyDetector');
      expect(resource.Properties.MetricName).toBe('ErrorRate');
    });
  });

  describe('Resources - CloudWatch Dashboard', () => {
    test('should have ObservabilityDashboard resource', () => {
      const resource = template.Resources.ObservabilityDashboard;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(resource.Properties.DashboardName).toEqual({
        'Fn::Sub': 'observability-${EnvironmentSuffix}'
      });
    });

    test('ObservabilityDashboard should have valid dashboard body', () => {
      const resource = template.Resources.ObservabilityDashboard;
      const dashboardBody = resource.Properties.DashboardBody;
      expect(dashboardBody).toBeDefined();
      expect(dashboardBody['Fn::Sub']).toBeDefined();
    });
  });

  describe('Resources - Cross-Account Role', () => {
    test('should have CrossAccountMetricRole resource', () => {
      const resource = template.Resources.CrossAccountMetricRole;
      expect(resource).toBeDefined();
      expect(resource.Type).toBe('AWS::IAM::Role');
      expect(resource.Condition).toBe('HasCrossAccountRole');
    });

    test('CrossAccountMetricRole should have correct assume role policy', () => {
      const resource = template.Resources.CrossAccountMetricRole;
      const assumeRolePolicy = resource.Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy.Statement[0].Principal.AWS).toEqual({ Ref: 'CrossAccountRoleArn' });
      expect(assumeRolePolicy.Statement[0].Condition.StringEquals['sts:ExternalId']).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have MetricsLogGroupName output', () => {
      const output = template.Outputs.MetricsLogGroupName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Name of the CloudWatch Logs group for metrics');
      expect(output.Value).toEqual({ Ref: 'MetricsLogGroup' });
    });

    test('should have MetricsProcessorFunctionArn output', () => {
      const output = template.Outputs.MetricsProcessorFunctionArn;
      expect(output).toBeDefined();
      expect(output.Description).toBe('ARN of the metrics processor Lambda function');
    });

    test('should have AlertTopicArn output', () => {
      const output = template.Outputs.AlertTopicArn;
      expect(output).toBeDefined();
      expect(output.Description).toBe('ARN of the SNS topic for alerts');
      expect(output.Value).toEqual({ Ref: 'AlertTopic' });
    });

    test('should have CustomMetricsNamespace output', () => {
      const output = template.Outputs.CustomMetricsNamespace;
      expect(output).toBeDefined();
      expect(output.Description).toBe('CloudWatch custom metrics namespace');
    });

    test('should have DashboardURL output', () => {
      const output = template.Outputs.DashboardURL;
      expect(output).toBeDefined();
      expect(output.Description).toBe('URL to the CloudWatch dashboard');
    });

    test('should have XRayGroupName output', () => {
      const output = template.Outputs.XRayGroupName;
      expect(output).toBeDefined();
      expect(output.Description).toBe('Name of the X-Ray group');
      expect(output.Value).toEqual({
        'Fn::Sub': 'observability-traces-${EnvironmentSuffix}'
      });
    });

    test('should have CrossAccountRoleArn output', () => {
      const output = template.Outputs.CrossAccountRoleArn;
      expect(output).toBeDefined();
      expect(output.Condition).toBe('HasCrossAccountRole');
      expect(output.Description).toBe('ARN of the cross-account metrics sharing role');
    });
  });

  describe('Resource Naming Convention', () => {
    test('all resource names should include EnvironmentSuffix', () => {
      const resourcesWithNames = [
        'KMSKey',
        'KMSKeyAlias',
        'AlertTopic',
        'MetricsLogGroup',
        'MetricsProcessorLogGroup',
        'LambdaExecutionRole',
        'MetricsProcessorFunction',
        'MetricCollectionRule',
        'XRayGroup',
        'XRaySamplingRule',
        'HighLatencyAlarm',
        'HighErrorRateAlarm',
        'CompositeAlarm',
        'ObservabilityDashboard',
        'CrossAccountMetricRole'
      ];

      resourcesWithNames.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (!resource) return;

        const props = resource.Properties;
        const nameFields = ['Name', 'TopicName', 'FunctionName', 'RoleName', 'LogGroupName', 'AlarmName', 'DashboardName', 'GroupName', 'RuleName', 'AliasName'];

        const hasNameWithSuffix = nameFields.some(field => {
          if (props && props[field]) {
            const value = JSON.stringify(props[field]);
            return value.includes('${EnvironmentSuffix}');
          }
          return false;
        });

        if (Object.keys(props || {}).some(k => nameFields.includes(k))) {
          expect(hasNameWithSuffix).toBe(true);
        }
      });
    });

    test('all resources should have proper tags', () => {
      const taggedResources = [
        'KMSKey',
        'AlertTopic',
        'MetricsLogGroup',
        'MetricsProcessorLogGroup',
        'LambdaExecutionRole',
        'MetricsProcessorFunction',
        'XRayGroup',
        'XRaySamplingRule',
        'HighLatencyAlarm',
        'HighErrorRateAlarm',
        'CompositeAlarm',
        'CrossAccountMetricRole'
      ];

      taggedResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource) {
          expect(resource.Properties.Tags).toBeDefined();
          const tags = resource.Properties.Tags;
          expect(tags.find((t: any) => t.Key === 'Environment')).toBeDefined();
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have correct resource count', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(20);
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have correct output count', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });

    test('all resources should have DeletionPolicy set to Delete', () => {
      const resourcesWithDeletionPolicy = [
        'KMSKey',
        'AlertTopic',
        'MetricsLogGroup',
        'MetricsProcessorLogGroup',
        'MetricsProcessorFunction'
      ];

      resourcesWithDeletionPolicy.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource && resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).toBe('Delete');
        }
      });
    });
  });
});
