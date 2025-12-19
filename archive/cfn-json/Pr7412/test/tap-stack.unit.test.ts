import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If youre testing a yaml template. run `pipenv run cfn-flip-to-json > lib/TapStack.json`
    // Otherwise, ensure the template is in JSON format.
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
        'Comprehensive observability infrastructure for ECS microservices with CloudWatch, X-Ray, and Synthetics'
      );
    });

    test('should not have metadata section', () => {
      expect(template.Metadata).toBeUndefined();
    });
  });

  describe('Parameters', () => {
    test('should have environmentSuffix parameter', () => {
      expect(template.Parameters.environmentSuffix).toBeDefined();
    });

    test('environmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.environmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Description).toBe(
        'Environment suffix for resource naming to ensure uniqueness'
      );
      expect(envSuffixParam.Default).toBe('prod');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-z0-9-]+$');
      expect(envSuffixParam.ConstraintDescription).toBe('Must contain only lowercase letters, numbers, and hyphens');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
    });

    test('NotificationEmail parameter should have correct properties', () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.Description).toBe('Email address for alarm notifications');
      expect(emailParam.Default).toBe('platform-team@example.com');
      expect(emailParam.AllowedPattern).toBe('^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$');
      expect(emailParam.ConstraintDescription).toBe('Must be a valid email address');
    });

    test('should have HealthCheckEndpoint parameter', () => {
      expect(template.Parameters.HealthCheckEndpoint).toBeDefined();
    });

    test('HealthCheckEndpoint parameter should have correct properties', () => {
      const endpointParam = template.Parameters.HealthCheckEndpoint;
      expect(endpointParam.Type).toBe('String');
      expect(endpointParam.Description).toBe('Health check endpoint URL for Synthetics canary');
      expect(endpointParam.Default).toBe('https://api.example.com/health');
    });

    test('should have ECSClusterName parameter', () => {
      expect(template.Parameters.ECSClusterName).toBeDefined();
    });

    test('ECSClusterName parameter should have correct properties', () => {
      const clusterParam = template.Parameters.ECSClusterName;
      expect(clusterParam.Type).toBe('String');
      expect(clusterParam.Description).toBe('Name of the ECS cluster to monitor');
      expect(clusterParam.Default).toBe('finance-app-cluster');
    });
  });

  describe('Resources', () => {
    test('should have ApplicationLogGroup resource', () => {
      expect(template.Resources.ApplicationLogGroup).toBeDefined();
    });

    test('ApplicationLogGroup should be a CloudWatch Logs LogGroup', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test('ApplicationLogGroup should have correct properties', () => {
      const logGroup = template.Resources.ApplicationLogGroup;
      const properties = logGroup.Properties;

      expect(properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/ecs/financeapp-${environmentSuffix}',
      });
      expect(properties.RetentionInDays).toBe(90);
      expect(properties.Tags).toEqual([
        { Key: 'Environment', Value: 'Production' },
        { Key: 'Team', Value: 'Platform' }
      ]);
    });

    test('should have ServiceLogGroup resource', () => {
      expect(template.Resources.ServiceLogGroup).toBeDefined();
    });

    test('ServiceLogGroup should have correct properties', () => {
      const logGroup = template.Resources.ServiceLogGroup;
      const properties = logGroup.Properties;

      expect(properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/ecs/services-${environmentSuffix}',
      });
      expect(properties.RetentionInDays).toBe(90);
    });

    test('should have ContainerInsightsLogGroup resource', () => {
      expect(template.Resources.ContainerInsightsLogGroup).toBeDefined();
    });

    test('ContainerInsightsLogGroup should have correct properties', () => {
      const logGroup = template.Resources.ContainerInsightsLogGroup;
      const properties = logGroup.Properties;

      expect(properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/ecs/containerinsights/${ECSClusterName}/performance-${environmentSuffix}',
      });
      expect(properties.RetentionInDays).toBe(90);
    });

    test('should have XRayGroup resource', () => {
      expect(template.Resources.XRayGroup).toBeDefined();
    });

    test('XRayGroup should be an X-Ray Group', () => {
      const xrayGroup = template.Resources.XRayGroup;
      expect(xrayGroup.Type).toBe('AWS::XRay::Group');
    });

    test('XRayGroup should have correct properties', () => {
      const xrayGroup = template.Resources.XRayGroup;
      const properties = xrayGroup.Properties;

      expect(properties.GroupName).toEqual({
        'Fn::Sub': 'FinanceApp-${environmentSuffix}',
      });
      expect(properties.FilterExpression).toBe('service("financeapp") AND annotation.environment = "production"');
      expect(properties.Tags).toEqual([
        { Key: 'Environment', Value: 'Production' },
        { Key: 'Team', Value: 'Platform' }
      ]);
    });

    test('should have XRaySamplingRule resource', () => {
      expect(template.Resources.XRaySamplingRule).toBeDefined();
    });

    test('XRaySamplingRule should be an X-Ray SamplingRule', () => {
      const samplingRule = template.Resources.XRaySamplingRule;
      expect(samplingRule.Type).toBe('AWS::XRay::SamplingRule');
    });

    test('should have AlarmNotificationTopic resource', () => {
      expect(template.Resources.AlarmNotificationTopic).toBeDefined();
    });

    test('AlarmNotificationTopic should be an SNS Topic', () => {
      const topic = template.Resources.AlarmNotificationTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('AlarmNotificationTopic should have correct properties', () => {
      const topic = template.Resources.AlarmNotificationTopic;
      const properties = topic.Properties;

      expect(properties.TopicName).toEqual({
        'Fn::Sub': 'observability-alarms-${environmentSuffix}',
      });
      expect(properties.DisplayName).toBe('Observability Alarm Notifications');
    });

    test('should have AlarmEmailSubscription resource', () => {
      expect(template.Resources.AlarmEmailSubscription).toBeDefined();
    });

    test('AlarmEmailSubscription should be an SNS Subscription', () => {
      const subscription = template.Resources.AlarmEmailSubscription;
      expect(subscription.Type).toBe('AWS::SNS::Subscription');
    });

    test('should have CPUThresholdParameter resource', () => {
      expect(template.Resources.CPUThresholdParameter).toBeDefined();
    });

    test('CPUThresholdParameter should be an SSM Parameter', () => {
      const param = template.Resources.CPUThresholdParameter;
      expect(param.Type).toBe('AWS::SSM::Parameter');
    });

    test('CPUThresholdParameter should have correct properties', () => {
      const param = template.Resources.CPUThresholdParameter;
      const properties = param.Properties;

      expect(properties.Name).toEqual({
        'Fn::Sub': '/financeapp/${environmentSuffix}/alarms/cpu-threshold',
      });
      expect(properties.Type).toBe('String');
      expect(properties.Value).toBe('80');
      expect(properties.Description).toBe('CPU utilization alarm threshold percentage');
      expect(properties.Tier).toBe('Standard');
    });

    test('should have MemoryThresholdParameter resource', () => {
      expect(template.Resources.MemoryThresholdParameter).toBeDefined();
    });

    test('should have ErrorRateThresholdParameter resource', () => {
      expect(template.Resources.ErrorRateThresholdParameter).toBeDefined();
    });

    test('should have LatencyThresholdParameter resource', () => {
      expect(template.Resources.LatencyThresholdParameter).toBeDefined();
    });

    test('should have AvailabilityThresholdParameter resource', () => {
      expect(template.Resources.AvailabilityThresholdParameter).toBeDefined();
    });

    test('should have CPUAlarm resource', () => {
      expect(template.Resources.CPUAlarm).toBeDefined();
    });

    test('CPUAlarm should be a CloudWatch Alarm', () => {
      const alarm = template.Resources.CPUAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('CPUAlarm should have correct properties', () => {
      const alarm = template.Resources.CPUAlarm;
      const properties = alarm.Properties;

      expect(properties.AlarmName).toEqual({
        'Fn::Sub': 'FinanceApp-HighCPU-${environmentSuffix}',
      });
      expect(properties.AlarmDescription).toBe('Alarm when CPU utilization exceeds 80%');
      expect(properties.MetricName).toBe('CPUUtilization');
      expect(properties.Namespace).toBe('AWS/ECS');
      expect(properties.Statistic).toBe('Average');
      expect(properties.Period).toBe(300);
      expect(properties.EvaluationPeriods).toBe(2);
      expect(properties.Threshold).toBe(80);
      expect(properties.ComparisonOperator).toBe('GreaterThanThreshold');
      expect(properties.Dimensions).toEqual([
        {
          Name: 'ClusterName',
          Value: { Ref: 'ECSClusterName' }
        }
      ]);
      expect(properties.AlarmActions).toEqual([
        { Ref: 'AlarmNotificationTopic' }
      ]);
    });

    test('should have MemoryAlarm resource', () => {
      expect(template.Resources.MemoryAlarm).toBeDefined();
    });

    test('should have ErrorRateAlarm resource', () => {
      expect(template.Resources.ErrorRateAlarm).toBeDefined();
    });

    test('should have LatencyAlarm resource', () => {
      expect(template.Resources.LatencyAlarm).toBeDefined();
    });

    test('should have AvailabilityAlarm resource', () => {
      expect(template.Resources.AvailabilityAlarm).toBeDefined();
    });

    test('should have CompositeAlarm resource', () => {
      expect(template.Resources.CompositeAlarm).toBeDefined();
    });

    test('CompositeAlarm should be a CloudWatch CompositeAlarm', () => {
      const alarm = template.Resources.CompositeAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::CompositeAlarm');
    });

    test('CompositeAlarm should have correct properties', () => {
      const alarm = template.Resources.CompositeAlarm;
      const properties = alarm.Properties;

      expect(properties.AlarmName).toEqual({
        'Fn::Sub': 'FinanceApp-CriticalCondition-${environmentSuffix}',
      });
      expect(properties.AlarmDescription).toBe('Critical alarm when both CPU > 80% AND memory > 85%');
      expect(properties.AlarmRule).toEqual({
        'Fn::Sub': 'ALARM(${CPUAlarm}) AND ALARM(${MemoryAlarm})'
      });
      expect(properties.AlarmActions).toEqual([
        { Ref: 'AlarmNotificationTopic' }
      ]);
    });

    test('should have ObservabilityDashboard resource', () => {
      expect(template.Resources.ObservabilityDashboard).toBeDefined();
    });

    test('ObservabilityDashboard should be a CloudWatch Dashboard', () => {
      const dashboard = template.Resources.ObservabilityDashboard;
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have SyntheticsCanaryRole resource', () => {
      expect(template.Resources.SyntheticsCanaryRole).toBeDefined();
    });

    test('SyntheticsCanaryRole should be an IAM Role', () => {
      const role = template.Resources.SyntheticsCanaryRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('SyntheticsCanaryRole should have correct properties', () => {
      const role = template.Resources.SyntheticsCanaryRole;
      const properties = role.Properties;

      expect(properties.RoleName).toEqual({
        'Fn::Sub': 'FinanceAppSyntheticsRole-${environmentSuffix}',
      });
      expect(properties.AssumeRolePolicyDocument.Version).toBe('2012-10-17');
      expect(properties.ManagedPolicyArns).toEqual([
        'arn:aws:iam::aws:policy/CloudWatchSyntheticsFullAccess'
      ]);
      expect(properties.Policies).toHaveLength(1);
      expect(properties.Policies[0].PolicyName).toBe('SyntheticsCanaryPolicy');
    });

    test('should have SyntheticsResultsBucket resource', () => {
      expect(template.Resources.SyntheticsResultsBucket).toBeDefined();
    });

    test('SyntheticsResultsBucket should be an S3 Bucket', () => {
      const bucket = template.Resources.SyntheticsResultsBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('SyntheticsResultsBucket should have correct properties', () => {
      const bucket = template.Resources.SyntheticsResultsBucket;
      const properties = bucket.Properties;

      expect(properties.BucketName).toEqual({
        'Fn::Sub': 'financeapp-synthetics-results-${environmentSuffix}-${AWS::AccountId}',
      });
      expect(properties.BucketEncryption.ServerSideEncryptionConfiguration).toHaveLength(1);
      expect(properties.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.IgnorePublicAcls).toBe(true);
      expect(properties.PublicAccessBlockConfiguration.RestrictPublicBuckets).toBe(true);
      expect(properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
    });

    test('should have HealthCheckCanary resource', () => {
      expect(template.Resources.HealthCheckCanary).toBeDefined();
    });

    test('HealthCheckCanary should be a Synthetics Canary', () => {
      const canary = template.Resources.HealthCheckCanary;
      expect(canary.Type).toBe('AWS::Synthetics::Canary');
    });

    test('HealthCheckCanary should have correct properties', () => {
      const canary = template.Resources.HealthCheckCanary;
      const properties = canary.Properties;

      expect(properties.Name).toEqual({
        'Fn::Sub': 'financeapp-healthcheck-${environmentSuffix}',
      });
      expect(properties.ExecutionRoleArn).toEqual({
        'Fn::GetAtt': ['SyntheticsCanaryRole', 'Arn']
      });
      expect(properties.Code.Handler).toBe('index.handler');
      expect(properties.ArtifactS3Location).toEqual({
        'Fn::Sub': 's3://${SyntheticsResultsBucket}/canary-results'
      });
      expect(properties.RuntimeVersion).toBe('syn-nodejs-puppeteer-9.0');
      expect(properties.Schedule.Expression).toBe('rate(5 minutes)');
      expect(properties.RunConfig.TimeoutInSeconds).toBe(60);
      expect(properties.RunConfig.MemoryInMB).toBe(960);
      expect(properties.RunConfig.ActiveTracing).toBe(true);
      expect(properties.FailureRetentionPeriod).toBe(31);
      expect(properties.SuccessRetentionPeriod).toBe(31);
      expect(properties.StartCanaryAfterCreation).toBe(true);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'ApplicationLogGroupName',
        'ServiceLogGroupName',
        'XRayGroupName',
        'AlarmTopicArn',
        'DashboardName',
        'CanaryName',
        'SyntheticsResultsBucketName',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('ApplicationLogGroupName output should be correct', () => {
      const output = template.Outputs.ApplicationLogGroupName;
      expect(output.Description).toBe('Application log group name');
      expect(output.Value).toEqual({ Ref: 'ApplicationLogGroup' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApplicationLogGroup',
      });
    });

    test('ServiceLogGroupName output should be correct', () => {
      const output = template.Outputs.ServiceLogGroupName;
      expect(output.Description).toBe('Service log group name');
      expect(output.Value).toEqual({ Ref: 'ServiceLogGroup' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ServiceLogGroup',
      });
    });

    test('XRayGroupName output should be correct', () => {
      const output = template.Outputs.XRayGroupName;
      expect(output.Description).toBe('X-Ray group name');
      expect(output.Value).toEqual({ Ref: 'XRayGroup' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-XRayGroup',
      });
    });

    test('AlarmTopicArn output should be correct', () => {
      const output = template.Outputs.AlarmTopicArn;
      expect(output.Description).toBe('SNS topic ARN for alarm notifications');
      expect(output.Value).toEqual({ Ref: 'AlarmNotificationTopic' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-AlarmTopic',
      });
    });

    test('DashboardName output should be correct', () => {
      const output = template.Outputs.DashboardName;
      expect(output.Description).toBe('CloudWatch dashboard name');
      expect(output.Value).toEqual({ Ref: 'ObservabilityDashboard' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Dashboard',
      });
    });

    test('CanaryName output should be correct', () => {
      const output = template.Outputs.CanaryName;
      expect(output.Description).toBe('Synthetics canary name');
      expect(output.Value).toEqual({ Ref: 'HealthCheckCanary' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Canary',
      });
    });

    test('SyntheticsResultsBucketName output should be correct', () => {
      const output = template.Outputs.SyntheticsResultsBucketName;
      expect(output.Description).toBe('S3 bucket for Synthetics results');
      expect(output.Value).toEqual({ Ref: 'SyntheticsResultsBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SyntheticsBucket',
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

    test('should have exactly four parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have exactly seven outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7);
    });
  });

  describe('Resource Naming Convention', () => {
    test('log group names should follow naming convention with environment suffix', () => {
      const appLogGroup = template.Resources.ApplicationLogGroup;
      const serviceLogGroup = template.Resources.ServiceLogGroup;
      const containerLogGroup = template.Resources.ContainerInsightsLogGroup;

      expect(appLogGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/ecs/financeapp-${environmentSuffix}',
      });
      expect(serviceLogGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/ecs/services-${environmentSuffix}',
      });
      expect(containerLogGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/ecs/containerinsights/${ECSClusterName}/performance-${environmentSuffix}',
      });
    });

    test('alarm names should follow naming convention', () => {
      const cpuAlarm = template.Resources.CPUAlarm;
      const memoryAlarm = template.Resources.MemoryAlarm;
      const errorAlarm = template.Resources.ErrorRateAlarm;
      const latencyAlarm = template.Resources.LatencyAlarm;
      const availabilityAlarm = template.Resources.AvailabilityAlarm;
      const compositeAlarm = template.Resources.CompositeAlarm;

      expect(cpuAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'FinanceApp-HighCPU-${environmentSuffix}',
      });
      expect(memoryAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'FinanceApp-HighMemory-${environmentSuffix}',
      });
      expect(errorAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'FinanceApp-HighErrorRate-${environmentSuffix}',
      });
      expect(latencyAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'FinanceApp-HighLatency-${environmentSuffix}',
      });
      expect(availabilityAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'FinanceApp-LowAvailability-${environmentSuffix}',
      });
      expect(compositeAlarm.Properties.AlarmName).toEqual({
        'Fn::Sub': 'FinanceApp-CriticalCondition-${environmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      expect(template.Outputs.ApplicationLogGroupName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ApplicationLogGroup',
      });
      expect(template.Outputs.ServiceLogGroupName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-ServiceLogGroup',
      });
      expect(template.Outputs.XRayGroupName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-XRayGroup',
      });
      expect(template.Outputs.AlarmTopicArn.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-AlarmTopic',
      });
      expect(template.Outputs.DashboardName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Dashboard',
      });
      expect(template.Outputs.CanaryName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-Canary',
      });
      expect(template.Outputs.SyntheticsResultsBucketName.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SyntheticsBucket',
      });
    });
  });
});