import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Advanced Observability Stack', () => {
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

    test('should have correct description', () => {
      expect(template.Description).toBe('Advanced Observability Stack for Distributed Payment Processing');
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toHaveLength(3);
    });

    test('should have exactly 35 resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(35);
    });

    test('should have exactly 6 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(6);
    });

    test('should have outputs defined', () => {
      expect(template.Outputs).toBeDefined();
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBeGreaterThan(0);
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter with correct properties', () => {
      const param = template.Parameters.EnvironmentSuffix;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });

    test('should have LogRetentionDays parameter with valid values', () => {
      const param = template.Parameters.LogRetentionDays;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(30);
      expect(param.AllowedValues).toContain(30);
      expect(param.AllowedValues).toContain(90);
    });

    test('should have KinesisShardCount parameter with constraints', () => {
      const param = template.Parameters.KinesisShardCount;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(10);
      expect(param.Default).toBe(2);
    });

    test('should have AlertEmail parameter with pattern validation', () => {
      const param = template.Parameters.AlertEmail;
      expect(param).toBeDefined();
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.AllowedPattern).toContain('@');
    });

    test('should have ErrorRateThreshold parameter', () => {
      const param = template.Parameters.ErrorRateThreshold;
      expect(param).toBeDefined();
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(5);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('CloudWatchLogsRole should exist with correct properties', () => {
      const role = template.Resources.CloudWatchLogsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({ 'Fn::Sub': 'CloudWatchLogsRole-${EnvironmentSuffix}' });
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/CloudWatchLogsFullAccess');
    });

    test('KinesisFirehoseRole should exist with correct service principal', () => {
      const role = template.Resources.KinesisFirehoseRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({ 'Fn::Sub': 'KinesisFirehoseRole-${EnvironmentSuffix}' });

      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      const statement = assumePolicy.Statement[0];
      expect(statement.Principal.Service).toContain('firehose.amazonaws.com');
    });

    test('KinesisFirehoseRole should have inline policy for Kinesis, S3, and Logs', () => {
      const role = template.Resources.KinesisFirehoseRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThan(0);

      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('FirehoseKinesisPolicy');
      expect(policy.PolicyDocument.Statement.length).toBeGreaterThan(0);
    });

    test('LambdaExecutionRole should exist with X-Ray and CloudWatch permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.RoleName).toEqual({ 'Fn::Sub': 'ObservabilityLambdaRole-${EnvironmentSuffix}' });
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/AWSXRayDaemonWriteAccess');
      expect(role.Properties.Policies).toBeDefined();
    });

    test('FirehoseOpenSearchPolicy should exist and reference OpenSearch domain', () => {
      const policy = template.Resources.FirehoseOpenSearchPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::Policy');
      expect(policy.Properties.PolicyName).toEqual({ 'Fn::Sub': 'FirehoseOpenSearchPolicy-${EnvironmentSuffix}' });
      expect(policy.Properties.Roles).toContainEqual({ Ref: 'KinesisFirehoseRole' });
    });

    test('All IAM roles should use EnvironmentSuffix in names', () => {
      const roles = ['CloudWatchLogsRole', 'KinesisFirehoseRole', 'LambdaExecutionRole'];
      roles.forEach(roleName => {
        const role = template.Resources[roleName];
        expect(role.Properties.RoleName).toEqual(
          expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
        );
      });
    });
  });

  describe('S3 Bucket for Log Backup', () => {
    test('LogBackupBucket should exist with correct properties', () => {
      const bucket = template.Resources.LogBackupBucket;
      expect(bucket).toBeDefined();
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.DeletionPolicy).toBe('Delete');
    });

    test('LogBackupBucket should have encryption enabled', () => {
      const bucket = template.Resources.LogBackupBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration).toBeDefined();
    });

    test('LogBackupBucket should block public access', () => {
      const bucket = template.Resources.LogBackupBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('LogBackupBucket should have lifecycle rules', () => {
      const bucket = template.Resources.LogBackupBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules.length).toBeGreaterThan(0);
    });

    test('LogBackupBucket name should include EnvironmentSuffix', () => {
      const bucket = template.Resources.LogBackupBucket;
      expect(bucket.Properties.BucketName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });
  });

  describe('CloudWatch Log Groups', () => {
    const logGroups = [
      'PaymentTransactionLogGroup',
      'PaymentAuthLogGroup',
      'PaymentSettlementLogGroup',
      'PaymentFraudLogGroup',
      'FirehoseLogGroup',
      'MetricsProcessorLogGroup'
    ];

    test.each(logGroups)('%s should exist as AWS::Logs::LogGroup', (logGroupName) => {
      const logGroup = template.Resources[logGroupName];
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
    });

    test.each(logGroups)('%s should have DeletionPolicy Delete', (logGroupName) => {
      const logGroup = template.Resources[logGroupName];
      expect(logGroup.DeletionPolicy).toBe('Delete');
    });

    test.each(['PaymentTransactionLogGroup', 'PaymentAuthLogGroup', 'PaymentSettlementLogGroup', 'PaymentFraudLogGroup'])(
      '%s should use LogRetentionDays parameter', (logGroupName) => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties.RetentionInDays).toEqual({ Ref: 'LogRetentionDays' });
      }
    );

    test.each(['PaymentTransactionLogGroup', 'PaymentAuthLogGroup', 'PaymentSettlementLogGroup', 'PaymentFraudLogGroup'])(
      '%s should have KMS encryption', (logGroupName) => {
        const logGroup = template.Resources[logGroupName];
        expect(logGroup.Properties.KmsKeyId).toEqual({ 'Fn::GetAtt': ['LogEncryptionKey', 'Arn'] });
      }
    );

    test.each(logGroups)('%s name should include EnvironmentSuffix', (logGroupName) => {
      const logGroup = template.Resources[logGroupName];
      expect(logGroup.Properties.LogGroupName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });

    test('FirehoseLogStream should exist and reference FirehoseLogGroup', () => {
      const logStream = template.Resources.FirehoseLogStream;
      expect(logStream).toBeDefined();
      expect(logStream.Type).toBe('AWS::Logs::LogStream');
      expect(logStream.Properties.LogGroupName).toEqual({ Ref: 'FirehoseLogGroup' });
    });
  });

  describe('KMS Encryption Key', () => {
    test('LogEncryptionKey should exist with correct properties', () => {
      const key = template.Resources.LogEncryptionKey;
      expect(key).toBeDefined();
      expect(key.Type).toBe('AWS::KMS::Key');
      expect(key.DeletionPolicy).toBe('Delete');
    });

    test('LogEncryptionKey should have key policy with CloudWatch Logs permissions', () => {
      const key = template.Resources.LogEncryptionKey;
      const keyPolicy = key.Properties.KeyPolicy;
      expect(keyPolicy.Statement.length).toBeGreaterThan(0);

      const cloudwatchStatement = keyPolicy.Statement.find((s: any) =>
        s.Sid === 'Allow CloudWatch Logs'
      );
      expect(cloudwatchStatement).toBeDefined();
      expect(cloudwatchStatement.Principal.Service).toEqual({ 'Fn::Sub': 'logs.${AWS::Region}.amazonaws.com' });
    });

    test('LogEncryptionKey should allow root account full access', () => {
      const key = template.Resources.LogEncryptionKey;
      const keyPolicy = key.Properties.KeyPolicy;
      const rootStatement = keyPolicy.Statement.find((s: any) =>
        s.Sid === 'Enable IAM User Permissions'
      );
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Action).toBe('kms:*');
    });

    test('LogEncryptionKeyAlias should exist and reference the key', () => {
      const alias = template.Resources.LogEncryptionKeyAlias;
      expect(alias).toBeDefined();
      expect(alias.Type).toBe('AWS::KMS::Alias');
      expect(alias.Properties.AliasName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
      expect(alias.Properties.TargetKeyId).toEqual({ Ref: 'LogEncryptionKey' });
    });
  });

  describe('Kinesis Data Stream', () => {
    test('LogStream should exist with correct properties', () => {
      const stream = template.Resources.LogStream;
      expect(stream).toBeDefined();
      expect(stream.Type).toBe('AWS::Kinesis::Stream');
      expect(stream.DeletionPolicy).toBe('Delete');
    });

    test('LogStream should use KinesisShardCount parameter', () => {
      const stream = template.Resources.LogStream;
      expect(stream.Properties.ShardCount).toEqual({ Ref: 'KinesisShardCount' });
    });

    test('LogStream should have KMS encryption enabled', () => {
      const stream = template.Resources.LogStream;
      expect(stream.Properties.StreamEncryption).toBeDefined();
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
      expect(stream.Properties.StreamEncryption.KeyId).toEqual({ Ref: 'LogEncryptionKey' });
    });

    test('LogStream should have 24 hour retention', () => {
      const stream = template.Resources.LogStream;
      expect(stream.Properties.RetentionPeriodHours).toBe(24);
    });

    test('LogStream name should include EnvironmentSuffix', () => {
      const stream = template.Resources.LogStream;
      expect(stream.Properties.Name).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });
  });

  describe('OpenSearch Domain', () => {
    test('OpenSearchDomain should exist with correct properties', () => {
      const domain = template.Resources.OpenSearchDomain;
      expect(domain).toBeDefined();
      expect(domain.Type).toBe('AWS::OpenSearchServerless::Collection');
      expect(domain.DeletionPolicy).toBe('Delete');
    });

    test('OpenSearchDomain should have correct name and type', () => {
      const domain = template.Resources.OpenSearchDomain;
      expect(domain.Properties.Name).toEqual({ 'Fn::Sub': 'payment-logs-${EnvironmentSuffix}' });
      expect(domain.Properties.Type).toBe('SEARCH');
      expect(domain.Properties.Description).toBe('OpenSearch Serverless collection for payment logs');
    });

    test('OpenSearchDomain name should include EnvironmentSuffix', () => {
      const domain = template.Resources.OpenSearchDomain;
      expect(domain.Properties.Name).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });
  });

  describe('Kinesis Firehose Delivery Stream', () => {
    test('LogDeliveryStream should exist with correct properties', () => {
      const stream = template.Resources.LogDeliveryStream;
      expect(stream).toBeDefined();
      expect(stream.Type).toBe('AWS::KinesisFirehose::DeliveryStream');
    });

    test('LogDeliveryStream should depend on FirehoseOpenSearchPolicy', () => {
      const stream = template.Resources.LogDeliveryStream;
      expect(stream.DependsOn).toContain('FirehoseOpenSearchPolicy');
    });

    test('LogDeliveryStream should use Kinesis as source', () => {
      const stream = template.Resources.LogDeliveryStream;
      expect(stream.Properties.DeliveryStreamType).toBe('KinesisStreamAsSource');
      expect(stream.Properties.KinesisStreamSourceConfiguration).toBeDefined();
      expect(stream.Properties.KinesisStreamSourceConfiguration.KinesisStreamARN).toEqual({
        'Fn::GetAtt': ['LogStream', 'Arn']
      });
    });

    test('LogDeliveryStream should have OpenSearch Serverless destination', () => {
      const stream = template.Resources.LogDeliveryStream;
      expect(stream.Properties.AmazonOpenSearchServerlessDestinationConfiguration).toBeDefined();
      const config = stream.Properties.AmazonOpenSearchServerlessDestinationConfiguration;
      expect(config.CollectionEndpoint).toEqual({ 'Fn::GetAtt': ['OpenSearchDomain', 'CollectionEndpoint'] });
      expect(config.IndexName).toBe('payment-logs');
    });

    test('LogDeliveryStream should have S3 backup for failed documents', () => {
      const stream = template.Resources.LogDeliveryStream;
      const config = stream.Properties.AmazonOpenSearchServerlessDestinationConfiguration;
      expect(config.S3BackupMode).toBe('FailedDocumentsOnly');
      expect(config.S3Configuration).toBeDefined();
    });

    test('LogDeliveryStream should have CloudWatch logging enabled', () => {
      const stream = template.Resources.LogDeliveryStream;
      const config = stream.Properties.AmazonOpenSearchServerlessDestinationConfiguration;
      expect(config.CloudWatchLoggingOptions.Enabled).toBe(true);
    });

    test('LogDeliveryStream name should include EnvironmentSuffix', () => {
      const stream = template.Resources.LogDeliveryStream;
      expect(stream.Properties.DeliveryStreamName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });
  });

  describe('Lambda Function for Metrics Processing', () => {
    test('MetricsProcessorFunction should exist with correct runtime', () => {
      const lambda = template.Resources.MetricsProcessorFunction;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.12');
      expect(lambda.DeletionPolicy).toBe('Delete');
    });

    test('MetricsProcessorFunction should have appropriate timeout and memory', () => {
      const lambda = template.Resources.MetricsProcessorFunction;
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('MetricsProcessorFunction should have X-Ray tracing enabled', () => {
      const lambda = template.Resources.MetricsProcessorFunction;
      expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('MetricsProcessorFunction should have environment variables', () => {
      const lambda = template.Resources.MetricsProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.ENVIRONMENT_SUFFIX).toEqual({ Ref: 'EnvironmentSuffix' });
      expect(envVars.CRITICAL_ALERT_TOPIC).toEqual({ Ref: 'CriticalAlertTopic' });
      expect(envVars.WARNING_ALERT_TOPIC).toEqual({ Ref: 'WarningAlertTopic' });
      expect(envVars.HIGH_LATENCY_THRESHOLD).toEqual({ Ref: 'HighLatencyThreshold' });
      expect(envVars.ERROR_RATE_THRESHOLD).toEqual({ Ref: 'ErrorRateThreshold' });
    });

    test('MetricsProcessorFunction should have inline code', () => {
      const lambda = template.Resources.MetricsProcessorFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('cloudwatch');
    });

    test('MetricsProcessorFunction should use LambdaExecutionRole', () => {
      const lambda = template.Resources.MetricsProcessorFunction;
      expect(lambda.Properties.Role).toEqual({ 'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'] });
    });

    test('MetricsProcessorFunction name should include EnvironmentSuffix', () => {
      const lambda = template.Resources.MetricsProcessorFunction;
      expect(lambda.Properties.FunctionName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });

    test('MetricsProcessorEventSourceMapping should exist and connect to Kinesis', () => {
      const mapping = template.Resources.MetricsProcessorEventSourceMapping;
      expect(mapping).toBeDefined();
      expect(mapping.Type).toBe('AWS::Lambda::EventSourceMapping');
      expect(mapping.Properties.EventSourceArn).toEqual({ 'Fn::GetAtt': ['LogStream', 'Arn'] });
      expect(mapping.Properties.FunctionName).toEqual({ Ref: 'MetricsProcessorFunction' });
      expect(mapping.Properties.StartingPosition).toBe('LATEST');
    });
  });

  describe('SNS Topics for Alerts', () => {
    const topics = ['CriticalAlertTopic', 'WarningAlertTopic', 'InfoAlertTopic'];

    test.each(topics)('%s should exist as AWS::SNS::Topic', (topicName) => {
      const topic = template.Resources[topicName];
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.DeletionPolicy).toBe('Delete');
    });

    test.each(topics)('%s should have KMS encryption', (topicName) => {
      const topic = template.Resources[topicName];
      expect(topic.Properties.KmsMasterKeyId).toEqual({ Ref: 'LogEncryptionKey' });
    });

    test.each(topics)('%s name should include EnvironmentSuffix', (topicName) => {
      const topic = template.Resources[topicName];
      expect(topic.Properties.TopicName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });

    test('CriticalAlertTopic should have email subscription', () => {
      const topic = template.Resources.CriticalAlertTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
      expect(topic.Properties.Subscription[0].Endpoint).toEqual({ Ref: 'AlertEmail' });
    });

    test('WarningAlertTopic should have email subscription', () => {
      const topic = template.Resources.WarningAlertTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });
  });

  describe('CloudWatch Alarms', () => {
    const alarms = [
      'HighErrorRateAlarm',
      'HighLatencyAlarm',
      'FraudDetectionAlarm',
      'LambdaErrorAlarm',
      'OpenSearchClusterStatusAlarm'
    ];

    test.each(alarms)('%s should exist as AWS::CloudWatch::Alarm', (alarmName) => {
      const alarm = template.Resources[alarmName];
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test.each(alarms)('%s name should include EnvironmentSuffix', (alarmName) => {
      const alarm = template.Resources[alarmName];
      expect(alarm.Properties.AlarmName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });

    test('HighErrorRateAlarm should monitor ErrorRate metric', () => {
      const alarm = template.Resources.HighErrorRateAlarm;
      expect(alarm.Properties.MetricName).toBe('ErrorRate');
      expect(alarm.Properties.Namespace).toEqual({ 'Fn::Sub': 'PaymentProcessing-${EnvironmentSuffix}' });
      expect(alarm.Properties.Threshold).toEqual({ Ref: 'ErrorRateThreshold' });
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'CriticalAlertTopic' });
    });

    test('HighLatencyAlarm should monitor AverageLatency metric', () => {
      const alarm = template.Resources.HighLatencyAlarm;
      expect(alarm.Properties.MetricName).toBe('AverageLatency');
      expect(alarm.Properties.Threshold).toEqual({ Ref: 'HighLatencyThreshold' });
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'WarningAlertTopic' });
    });

    test('FraudDetectionAlarm should monitor FraudDetected metric', () => {
      const alarm = template.Resources.FraudDetectionAlarm;
      expect(alarm.Properties.MetricName).toBe('FraudDetected');
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'CriticalAlertTopic' });
    });

    test('LambdaErrorAlarm should monitor Lambda errors', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Dimensions).toBeDefined();
      expect(alarm.Properties.Dimensions[0].Name).toBe('FunctionName');
    });

    test('OpenSearchClusterStatusAlarm should monitor cluster health', () => {
      const alarm = template.Resources.OpenSearchClusterStatusAlarm;
      expect(alarm.Properties.MetricName).toBe('5xx');
      expect(alarm.Properties.Namespace).toBe('AWS/AOSS');
      expect(alarm.Properties.Dimensions).toBeDefined();
      expect(alarm.Properties.Dimensions[0].Name).toBe('CollectionName');
      expect(alarm.Properties.Dimensions[0].Value).toEqual({ Ref: 'OpenSearchDomain' });
      expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'CriticalAlertTopic' });
    });

    test.each(alarms)('%s should have TreatMissingData set to notBreaching', (alarmName) => {
      const alarm = template.Resources[alarmName];
      expect(alarm.Properties.TreatMissingData).toBe('notBreaching');
    });
  });

  describe('CloudWatch Dashboard', () => {
    test('PaymentProcessingDashboard should exist', () => {
      const dashboard = template.Resources.PaymentProcessingDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('PaymentProcessingDashboard name should include EnvironmentSuffix', () => {
      const dashboard = template.Resources.PaymentProcessingDashboard;
      expect(dashboard.Properties.DashboardName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });

    test('PaymentProcessingDashboard should have widgets defined', () => {
      const dashboard = template.Resources.PaymentProcessingDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
      const bodyStr = JSON.stringify(dashboard.Properties.DashboardBody);
      expect(bodyStr).toContain('widgets');
    });

    test('PaymentProcessingDashboard should reference custom metrics', () => {
      const dashboard = template.Resources.PaymentProcessingDashboard;
      const bodyStr = JSON.stringify(dashboard.Properties.DashboardBody);
      expect(bodyStr).toContain('PaymentProcessing');
      expect(bodyStr).toContain('TransactionSuccess');
      expect(bodyStr).toContain('AverageLatency');
    });
  });

  describe('X-Ray Sampling Rule', () => {
    test('XRaySamplingRule should exist with correct properties', () => {
      const rule = template.Resources.XRaySamplingRule;
      expect(rule).toBeDefined();
      expect(rule.Type).toBe('AWS::XRay::SamplingRule');
    });

    test('XRaySamplingRule should have appropriate sampling configuration', () => {
      const rule = template.Resources.XRaySamplingRule;
      const samplingRule = rule.Properties.SamplingRule;
      expect(samplingRule.FixedRate).toBe(0.1);
      expect(samplingRule.ReservoirSize).toBe(1);
    });

    test('XRaySamplingRule name should include EnvironmentSuffix', () => {
      const rule = template.Resources.XRaySamplingRule;
      expect(rule.Properties.SamplingRule.RuleName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('${EnvironmentSuffix}') })
      );
    });

    test('XRaySamplingRule should reference payment-service', () => {
      const rule = template.Resources.XRaySamplingRule;
      expect(rule.Properties.SamplingRule.ServiceName).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('payment-service') })
      );
    });
  });

  describe('Metric Filters', () => {
    const filters = [
      'TransactionErrorMetricFilter',
      'AuthenticationFailureMetricFilter',
      'HighValueTransactionMetricFilter'
    ];

    test.each(filters)('%s should exist as AWS::Logs::MetricFilter', (filterName) => {
      const filter = template.Resources[filterName];
      expect(filter).toBeDefined();
      expect(filter.Type).toBe('AWS::Logs::MetricFilter');
    });

    test('TransactionErrorMetricFilter should monitor error logs', () => {
      const filter = template.Resources.TransactionErrorMetricFilter;
      expect(filter.Properties.FilterPattern).toContain('ERROR');
      expect(filter.Properties.LogGroupName).toEqual({ Ref: 'PaymentTransactionLogGroup' });
      expect(filter.Properties.MetricTransformations[0].MetricName).toBe('TransactionErrors');
    });

    test('AuthenticationFailureMetricFilter should monitor auth failures', () => {
      const filter = template.Resources.AuthenticationFailureMetricFilter;
      expect(filter.Properties.FilterPattern).toContain('AUTHENTICATION_FAILURE');
      expect(filter.Properties.LogGroupName).toEqual({ Ref: 'PaymentAuthLogGroup' });
    });

    test('HighValueTransactionMetricFilter should monitor large transactions', () => {
      const filter = template.Resources.HighValueTransactionMetricFilter;
      expect(filter.Properties.FilterPattern).toContain('10000');
      expect(filter.Properties.MetricTransformations[0].MetricName).toBe('HighValueTransactions');
    });

    test.each(filters)('%s should use custom namespace with EnvironmentSuffix', (filterName) => {
      const filter = template.Resources[filterName];
      expect(filter.Properties.MetricTransformations[0].MetricNamespace).toEqual(
        expect.objectContaining({ 'Fn::Sub': expect.stringContaining('PaymentProcessing-${EnvironmentSuffix}') })
      );
    });
  });

  describe('Resource Naming Convention', () => {
    const namedResources = [
      'CloudWatchLogsRole',
      'KinesisFirehoseRole',
      'LambdaExecutionRole',
      'LogBackupBucket',
      'PaymentTransactionLogGroup',
      'PaymentAuthLogGroup',
      'PaymentSettlementLogGroup',
      'PaymentFraudLogGroup',
      'FirehoseLogGroup',
      'MetricsProcessorLogGroup',
      'LogEncryptionKeyAlias',
      'LogStream',
      'OpenSearchDomain',
      'LogDeliveryStream',
      'MetricsProcessorFunction',
      'CriticalAlertTopic',
      'WarningAlertTopic',
      'InfoAlertTopic',
      'HighErrorRateAlarm',
      'HighLatencyAlarm',
      'FraudDetectionAlarm',
      'LambdaErrorAlarm',
      'OpenSearchClusterStatusAlarm',
      'PaymentProcessingDashboard',
      'XRaySamplingRule',
      'FirehoseOpenSearchPolicy'
    ];

    test.each(namedResources)('%s should include EnvironmentSuffix in name', (resourceName) => {
      const resource = template.Resources[resourceName];
      const nameProperties = [
        'RoleName',
        'BucketName',
        'LogGroupName',
        'AliasName',
        'Name',
        'DomainName',
        'DeliveryStreamName',
        'FunctionName',
        'TopicName',
        'AlarmName',
        'DashboardName',
        'PolicyName'
      ];

      const hasNameWithSuffix = nameProperties.some(prop => {
        const value = resource.Properties?.[prop];
        if (!value) return false;
        const jsonStr = JSON.stringify(value);
        return jsonStr.includes('${EnvironmentSuffix}');
      });

      const hasSamplingRule = resource.Properties?.SamplingRule?.RuleName &&
        JSON.stringify(resource.Properties.SamplingRule.RuleName).includes('${EnvironmentSuffix}');

      expect(hasNameWithSuffix || hasSamplingRule).toBe(true);
    });
  });

  describe('Deletion Policies', () => {
    const resourcesWithDeletionPolicy = [
      'LogBackupBucket',
      'PaymentTransactionLogGroup',
      'PaymentAuthLogGroup',
      'PaymentSettlementLogGroup',
      'PaymentFraudLogGroup',
      'FirehoseLogGroup',
      'MetricsProcessorLogGroup',
      'LogEncryptionKey',
      'LogStream',
      'OpenSearchDomain',
      'MetricsProcessorFunction',
      'CriticalAlertTopic',
      'WarningAlertTopic',
      'InfoAlertTopic'
    ];

    test.each(resourcesWithDeletionPolicy)('%s should have DeletionPolicy set to Delete', (resourceName) => {
      const resource = template.Resources[resourceName];
      expect(resource.DeletionPolicy).toBe('Delete');
    });

    test('No resources should have DeletionPolicy Retain', () => {
      const allResources = Object.keys(template.Resources);
      allResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('No resources should have DeletionProtectionEnabled', () => {
      const allResources = Object.keys(template.Resources);
      allResources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties?.DeletionProtectionEnabled !== undefined) {
          expect(resource.Properties.DeletionProtectionEnabled).toBe(false);
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('All S3 buckets should have encryption enabled', () => {
      const bucket = template.Resources.LogBackupBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('All log groups with sensitive data should use KMS encryption', () => {
      const sensitiveLogGroups = [
        'PaymentTransactionLogGroup',
        'PaymentAuthLogGroup',
        'PaymentSettlementLogGroup',
        'PaymentFraudLogGroup'
      ];

      sensitiveLogGroups.forEach(lgName => {
        const lg = template.Resources[lgName];
        expect(lg.Properties.KmsKeyId).toBeDefined();
      });
    });

    test('Kinesis stream should have encryption enabled', () => {
      const stream = template.Resources.LogStream;
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
    });

    test('SNS topics should have KMS encryption', () => {
      const topics = ['CriticalAlertTopic', 'WarningAlertTopic', 'InfoAlertTopic'];
      topics.forEach(topicName => {
        const topic = template.Resources[topicName];
        expect(topic.Properties.KmsMasterKeyId).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should export all major resource identifiers', () => {
      const expectedOutputs = [
        'PaymentTransactionLogGroupName',
        'CriticalAlertTopicArn',
        'LogStreamName',
        'OpenSearchDomainEndpoint',
        'DashboardUrl',
        'XRayServiceName',
        'MetricsProcessorFunctionArn',
        'EnvironmentSuffix',
        'StackName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('all outputs should have export names', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('export names should include stack name', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        const exportNameStr = JSON.stringify(output.Export.Name);
        expect(exportNameStr).toContain('AWS::StackName');
      });
    });
  });
});
