import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack CloudFormation Template - Log Analytics Infrastructure', () => {
  let template: any;

  beforeAll(() => {
    // Template converted from YAML to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have correct description for log analytics system', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Enterprise Log Analytics System for 500 servers');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      expect(template.Parameters.EnvironmentSuffix.Type).toBe('String');
      expect(template.Parameters.EnvironmentSuffix.Default).toBe('dev');
      expect(template.Parameters.EnvironmentSuffix.Description).toContain('Environment suffix');
    });
  });

  describe('S3 Storage Resources', () => {
    test('should have LogBucket with correct configuration', () => {
      const logBucket = template.Resources.LogBucket;
      expect(logBucket).toBeDefined();
      expect(logBucket.Type).toBe('AWS::S3::Bucket');
      expect(logBucket.Properties.BucketName['Fn::Sub']).toBe('enterprise-log-analytics-${EnvironmentSuffix}-${AWS::AccountId}');
      expect(logBucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      expect(logBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should have LogBucket with proper lifecycle policies', () => {
      const logBucket = template.Resources.LogBucket;
      const lifecycleRules = logBucket.Properties.LifecycleConfiguration.Rules;
      
      expect(lifecycleRules).toHaveLength(2);
      expect(lifecycleRules[0].Id).toBe('TransitionToStandardIA');
      expect(lifecycleRules[0].Transitions[0].TransitionInDays).toBe(30);
      expect(lifecycleRules[0].Transitions[0].StorageClass).toBe('STANDARD_IA');
      
      expect(lifecycleRules[1].Id).toBe('TransitionToGlacier');
      expect(lifecycleRules[1].Transitions[0].TransitionInDays).toBe(90);
      expect(lifecycleRules[1].Transitions[0].StorageClass).toBe('GLACIER');
    });

    test('should have LogBucket with public access blocked', () => {
      const logBucket = template.Resources.LogBucket;
      const publicAccessBlock = logBucket.Properties.PublicAccessBlockConfiguration;
      
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('should have AthenaQueryResultsBucket with correct configuration', () => {
      const athenaResultsBucket = template.Resources.AthenaQueryResultsBucket;
      expect(athenaResultsBucket).toBeDefined();
      expect(athenaResultsBucket.Type).toBe('AWS::S3::Bucket');
      expect(athenaResultsBucket.Properties.BucketName['Fn::Sub']).toBe('enterprise-log-analytics-athena-results-${EnvironmentSuffix}-${AWS::AccountId}');
      expect(athenaResultsBucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays).toBe(30);
    });
  });

  describe('IAM Roles', () => {
    test('should have FirehoseDeliveryRole with correct assume role policy', () => {
      const role = template.Resources.FirehoseDeliveryRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('firehose.amazonaws.com');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Condition.StringEquals['sts:ExternalId']['Ref']).toBe('AWS::AccountId');
    });

    test('should have FirehoseDeliveryRole with S3 and CloudWatch policies', () => {
      const role = template.Resources.FirehoseDeliveryRole;
      expect(role.Properties.Policies).toHaveLength(2);
      
      const s3Policy = role.Properties.Policies.find(p => p.PolicyName === 'FirehoseS3DeliveryPolicy');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:ListBucket');
      
      const cwPolicy = role.Properties.Policies.find(p => p.PolicyName === 'FirehoseCloudWatchLogsPolicy');
      expect(cwPolicy).toBeDefined();
      expect(cwPolicy.PolicyDocument.Statement[0].Action).toContain('logs:PutLogEvents');
    });

    test('should have LambdaExecutionRole with basic execution role', () => {
      const role = template.Resources.LambdaExecutionRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('should have GlueServiceRole with S3 access policies', () => {
      const role = template.Resources.GlueServiceRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('glue.amazonaws.com');
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSGlueServiceRole');
      
      const s3Policy = role.Properties.Policies.find(p => p.PolicyName === 'GlueS3Access');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:GetObject');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
    });

    test('should have CloudWatchLogsRole with Firehose permissions', () => {
      const role = template.Resources.CloudWatchLogsRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('logs.amazonaws.com');
      
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('PutRecordToFirehose');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('firehose:PutRecord');
      expect(policy.PolicyDocument.Statement[0].Action).toContain('firehose:PutRecordBatch');
    });
  });

  describe('Kinesis Firehose and Log Processing', () => {
    test('should have LogDeliveryStream with correct configuration', () => {
      const stream = template.Resources.LogDeliveryStream;
      expect(stream).toBeDefined();
      expect(stream.Type).toBe('AWS::KinesisFirehose::DeliveryStream');
      expect(stream.Properties.DeliveryStreamName['Fn::Sub']).toBe('EnterpriseLogDeliveryStream-${EnvironmentSuffix}');
      expect(stream.Properties.DeliveryStreamType).toBe('DirectPut');
    });

    test('should have LogDeliveryStream with S3 destination configuration', () => {
      const stream = template.Resources.LogDeliveryStream;
      const s3Config = stream.Properties.ExtendedS3DestinationConfiguration;
      
      expect(s3Config.Prefix).toBe('logs/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/');
      expect(s3Config.CompressionFormat).toBe('GZIP');
      expect(s3Config.BufferingHints.IntervalInSeconds).toBe(60);
      expect(s3Config.BufferingHints.SizeInMBs).toBe(50);
    });

    test('should have LogDeliveryStream with Lambda processing enabled', () => {
      const stream = template.Resources.LogDeliveryStream;
      const processingConfig = stream.Properties.ExtendedS3DestinationConfiguration.ProcessingConfiguration;
      
      expect(processingConfig.Enabled).toBe(true);
      expect(processingConfig.Processors[0].Type).toBe('Lambda');
      expect(processingConfig.Processors[0].Parameters[0].ParameterName).toBe('LambdaArn');
    });

    test('should have FirehoseLogGroup for delivery stream logging', () => {
      const logGroup = template.Resources.FirehoseLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toBe('/aws/kinesisfirehose/EnterpriseLogDeliveryStream-${EnvironmentSuffix}');
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });
  });

  describe('Lambda Functions', () => {
    test('should have LogProcessorLambda with correct configuration', () => {
      const lambda = template.Resources.LogProcessorLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.FunctionName['Fn::Sub']).toBe('LogProcessorFunction-${EnvironmentSuffix}');
      expect(lambda.Properties.Runtime).toBe('nodejs20.x');
      expect(lambda.Properties.Handler).toBe('index.handler');
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(256);
    });

    test('should have LogProcessorLambda with correct processing code', () => {
      const lambda = template.Resources.LogProcessorLambda;
      const code = lambda.Properties.Code.ZipFile;
      
      expect(code).toContain('exports.handler');
      expect(code).toContain('processingTimestamp');
      expect(code).toContain('logLevel');
      expect(code).toContain('ERROR');
      expect(code).toContain('WARN');
      expect(code).toContain('INFO');
    });

    test('should have S3UploaderLambda for Glue script upload', () => {
      const lambda = template.Resources.S3UploaderLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.FunctionName['Fn::Sub']).toBe('GlueScriptS3Uploader-${EnvironmentSuffix}');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Handler).toBe('index.handler');
    });

    test('should have QuickSightUpdaterLambda with error handling', () => {
      const lambda = template.Resources.QuickSightUpdaterLambda;
      expect(lambda).toBeDefined();
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.FunctionName['Fn::Sub']).toBe('QuickSightPermissionUpdater-${EnvironmentSuffix}');
      expect(lambda.Properties.Runtime).toBe('python3.11');
      expect(lambda.Properties.Timeout).toBe(300);
      
      const code = lambda.Properties.Code.ZipFile;
      expect(code).toContain('NoSuchEntity');
      expect(code).toContain('aws-quicksight-service-role-v0');
    });
  });

  describe('Glue Resources', () => {
    test('should have LogAnalyticsDatabase', () => {
      const database = template.Resources.LogAnalyticsDatabase;
      expect(database).toBeDefined();
      expect(database.Type).toBe('AWS::Glue::Database');
      expect(database.Properties.DatabaseInput.Name['Fn::Sub']).toBe('enterprise-log-analytics-${EnvironmentSuffix}');
      expect(database.Properties.DatabaseInput.Description).toBe('Database for enterprise log analytics');
    });

    test('should have LogCrawler with correct schedule', () => {
      const crawler = template.Resources.LogCrawler;
      expect(crawler).toBeDefined();
      expect(crawler.Type).toBe('AWS::Glue::Crawler');
      expect(crawler.Properties.Name['Fn::Sub']).toBe('EnterpriseLogCrawler-${EnvironmentSuffix}');
      expect(crawler.Properties.Schedule.ScheduleExpression).toBe('cron(0 */3 * * ? *)');
      expect(crawler.Properties.Targets.S3Targets[0].Path['Fn::Sub']).toBe('s3://${LogBucket}/logs/');
    });

    test('should have LogETLJob with correct configuration', () => {
      const job = template.Resources.LogETLJob;
      expect(job).toBeDefined();
      expect(job.Type).toBe('AWS::Glue::Job');
      expect(job.Properties.Name['Fn::Sub']).toBe('EnterpriseLogETLJob-${EnvironmentSuffix}');
      expect(job.Properties.GlueVersion).toBe('3.0');
      expect(job.Properties.NumberOfWorkers).toBe(5);
      expect(job.Properties.WorkerType).toBe('G.1X');
      expect(job.Properties.MaxRetries).toBe(2);
    });
  });

  describe('CloudWatch Log Groups and Subscription Filters', () => {
    test('should have application log groups with correct retention', () => {
      const syslogGroup = template.Resources.SyslogLogGroup;
      const authLogGroup = template.Resources.AuthLogGroup;
      const applicationLogGroup = template.Resources.ApplicationLogGroup;
      
      expect(syslogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(syslogGroup.Properties.LogGroupName['Fn::Sub']).toBe('/enterprise/servers/syslog-${EnvironmentSuffix}');
      expect(syslogGroup.Properties.RetentionInDays).toBe(7);
      
      expect(authLogGroup.Properties.LogGroupName['Fn::Sub']).toBe('/enterprise/servers/auth-${EnvironmentSuffix}');
      expect(applicationLogGroup.Properties.LogGroupName['Fn::Sub']).toBe('/enterprise/servers/application-${EnvironmentSuffix}');
    });

    test('should have subscription filters for all log groups', () => {
      const syslogFilter = template.Resources.SyslogSubscriptionFilter;
      const authFilter = template.Resources.AuthLogSubscriptionFilter;
      const appFilter = template.Resources.ApplicationLogSubscriptionFilter;
      
      expect(syslogFilter.Type).toBe('AWS::Logs::SubscriptionFilter');
      expect(syslogFilter.Properties.FilterPattern).toBe('');
      expect(syslogFilter.Properties.DestinationArn['Fn::GetAtt'][0]).toBe('LogDeliveryStream');
      
      expect(authFilter.Properties.LogGroupName.Ref).toBe('AuthLogGroup');
      expect(appFilter.Properties.LogGroupName.Ref).toBe('ApplicationLogGroup');
    });

    test('should have audit log group with long retention', () => {
      const auditGroup = template.Resources.AuditLogGroup;
      expect(auditGroup).toBeDefined();
      expect(auditGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(auditGroup.Properties.LogGroupName['Fn::Sub']).toBe('/enterprise/log-analytics/audit-${EnvironmentSuffix}');
      expect(auditGroup.Properties.RetentionInDays).toBe(365);
    });
  });

  describe('CloudWatch Agent and SSM Configuration', () => {
    test('should have CloudWatch Agent configuration parameter', () => {
      const param = template.Resources.CloudWatchAgentConfigParameter;
      expect(param).toBeDefined();
      expect(param.Type).toBe('AWS::SSM::Parameter');
      expect(param.Properties.Name['Fn::Sub']).toBe('/log-analytics/cloudwatch-agent-config-${EnvironmentSuffix}');
      expect(param.Properties.Type).toBe('String');
      
      const config = JSON.parse(param.Properties.Value['Fn::Sub']);
      expect(config.agent.metrics_collection_interval).toBe(60);
      expect(config.logs.logs_collected.files.collect_list).toHaveLength(3);
    });
  });

  describe('Athena Resources', () => {
    test('should have LogAnalyticsWorkgroup with correct configuration', () => {
      const workgroup = template.Resources.LogAnalyticsWorkgroup;
      expect(workgroup).toBeDefined();
      expect(workgroup.Type).toBe('AWS::Athena::WorkGroup');
      expect(workgroup.Properties.Name['Fn::Sub']).toBe('EnterpriseLogAnalytics-${EnvironmentSuffix}');
      expect(workgroup.Properties.State).toBe('ENABLED');
      expect(workgroup.Properties.WorkGroupConfiguration.EnforceWorkGroupConfiguration).toBe(true);
      expect(workgroup.Properties.WorkGroupConfiguration.ResultConfiguration.EncryptionConfiguration.EncryptionOption).toBe('SSE_S3');
    });
  });

  describe('CloudWatch Monitoring', () => {
    test('should have LogAnalyticsDashboard with all widgets', () => {
      const dashboard = template.Resources.LogAnalyticsDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardName['Fn::Sub']).toBe('EnterpriseLogAnalyticsDashboard-${EnvironmentSuffix}');
      
      const dashboardBody = JSON.parse(dashboard.Properties.DashboardBody['Fn::Sub']);
      expect(dashboardBody.widgets).toHaveLength(4);
      expect(dashboardBody.widgets[0].properties.title).toBe('Firehose Delivery Metrics');
      expect(dashboardBody.widgets[1].properties.title).toBe('Lambda Processor Metrics');
      expect(dashboardBody.widgets[2].properties.title).toBe('S3 Storage Metrics');
      expect(dashboardBody.widgets[3].properties.title).toBe('Athena Query Metrics');
    });

    test('should have SNS topic for alarms', () => {
      const topic = template.Resources.LogAnalyticsAlarmTopic;
      expect(topic).toBeDefined();
      expect(topic.Type).toBe('AWS::SNS::Topic');
      expect(topic.Properties.TopicName['Fn::Sub']).toBe('LogAnalyticsAlarmTopic-${EnvironmentSuffix}');
      expect(topic.Properties.DisplayName).toBe('Log Analytics Alarms');
    });

    test('should have CloudWatch alarms for Firehose and Lambda', () => {
      const firehoseAlarm = template.Resources.FirehoseErrorAlarm;
      const lambdaAlarm = template.Resources.LambdaErrorAlarm;
      
      expect(firehoseAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(firehoseAlarm.Properties.AlarmName['Fn::Sub']).toBe('FirehoseDeliveryError-${EnvironmentSuffix}');
      expect(firehoseAlarm.Properties.MetricName).toBe('DeliveryToS3.DataFreshness');
      expect(firehoseAlarm.Properties.Threshold).toBe(900);
      
      expect(lambdaAlarm.Properties.AlarmName['Fn::Sub']).toBe('LambdaProcessorError-${EnvironmentSuffix}');
      expect(lambdaAlarm.Properties.MetricName).toBe('Errors');
      expect(lambdaAlarm.Properties.Threshold).toBe(5);
    });
  });

  describe('QuickSight Integration', () => {
    test('should have QuickSightAccessPolicy with correct permissions', () => {
      const policy = template.Resources.QuickSightAccessPolicy;
      expect(policy).toBeDefined();
      expect(policy.Type).toBe('AWS::IAM::ManagedPolicy');
      
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Action).toContain('athena:*');
      expect(statement.Action).toContain('s3:GetBucketLocation');
      expect(statement.Action).toContain('glue:GetDatabase');
      expect(statement.Action).toContain('glue:GetTable');
    });

    test('should have custom resource for QuickSight permissions', () => {
      const customResource = template.Resources.QuickSightPermissionCustomResource;
      expect(customResource).toBeDefined();
      expect(customResource.Type).toBe('Custom::QuickSightPermissionUpdater');
      expect(customResource.Properties.QuickSightAccessPolicyArn.Ref).toBe('QuickSightAccessPolicy');
    });
  });

  describe('Custom Resources', () => {
    test('should have GlueScriptUploaderCustomResource', () => {
      const customResource = template.Resources.GlueScriptUploaderCustomResource;
      expect(customResource).toBeDefined();
      expect(customResource.Type).toBe('Custom::S3ScriptUploader');
      expect(customResource.Properties.BucketName.Ref).toBe('LogBucket');
      expect(customResource.Properties.ScriptKey).toBe('scripts/log_etl_job.py');
      expect(customResource.Properties.ScriptContent).toContain('from awsglue.transforms import *');
      expect(customResource.Properties.ScriptContent).toContain('format="parquet"');
    });
  });

  describe('Template Outputs', () => {
    test('should have all required outputs for log analytics system', () => {
      const expectedOutputs = [
        'LogBucketName',
        'AthenaQueryResultsBucketName',
        'DeliveryStreamName',
        'GlueDatabaseName',
        'AthenaWorkgroup',
        'CloudWatchDashboard',
        'CloudWatchAgentConfig',
        'AuditLogGroupName'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('should have correct output values and descriptions', () => {
      expect(template.Outputs.LogBucketName.Description).toBe('Name of the S3 bucket for log storage');
      expect(template.Outputs.LogBucketName.Value.Ref).toBe('LogBucket');
      
      expect(template.Outputs.DeliveryStreamName.Description).toBe('Name of the Kinesis Firehose Delivery Stream');
      expect(template.Outputs.DeliveryStreamName.Value.Ref).toBe('LogDeliveryStream');
      
      expect(template.Outputs.GlueDatabaseName.Description).toBe('Name of the Glue Database');
      expect(template.Outputs.GlueDatabaseName.Value.Ref).toBe('LogAnalyticsDatabase');
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
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have all expected log analytics resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(32); // Total resources in the log analytics stack
      
      // Verify key resource categories
      const s3Resources = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::S3::Bucket').length;
      expect(s3Resources).toBe(2);
      
      const lambdaResources = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::Lambda::Function').length;
      expect(lambdaResources).toBe(3);
      
      const iamRoles = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::IAM::Role').length;
      expect(iamRoles).toBe(6);
      
      const logGroups = Object.keys(template.Resources).filter(key => 
        template.Resources[key].Type === 'AWS::Logs::LogGroup').length;
      expect(logGroups).toBe(5);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });

    test('should have all resources with proper dependencies', () => {
      // Verify dependencies for critical resources
      const logCrawler = template.Resources.LogCrawler;
      expect(logCrawler.DependsOn).toBe('GlueScriptUploaderCustomResource');
      
      const logETLJob = template.Resources.LogETLJob;
      expect(logETLJob.DependsOn).toBe('GlueScriptUploaderCustomResource');
    });
  });

  describe('Security and Best Practices', () => {
    test('should use least privilege IAM policies', () => {
      // Check Firehose role has minimal required permissions
      const firehoseRole = template.Resources.FirehoseDeliveryRole;
      const s3Policy = firehoseRole.Properties.Policies.find(p => p.PolicyName === 'FirehoseS3DeliveryPolicy');
      
      expect(s3Policy.PolicyDocument.Statement[0].Action).not.toContain('s3:*');
      expect(s3Policy.PolicyDocument.Statement[0].Action).toContain('s3:PutObject');
      expect(s3Policy.PolicyDocument.Statement[0].Resource).toBeDefined();
    });

    test('should have proper encryption configurations', () => {
      // S3 buckets should have encryption
      const logBucket = template.Resources.LogBucket;
      expect(logBucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
        .ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      
      // Athena workgroup should have encryption
      const workgroup = template.Resources.LogAnalyticsWorkgroup;
      expect(workgroup.Properties.WorkGroupConfiguration.ResultConfiguration
        .EncryptionConfiguration.EncryptionOption).toBe('SSE_S3');
    });

    test('should have proper resource lifecycle management', () => {
      // S3 lifecycle policies should be configured
      const logBucket = template.Resources.LogBucket;
      const lifecycleRules = logBucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules.length).toBeGreaterThan(0);
      
      // Athena query results should expire
      const athenaResultsBucket = template.Resources.AthenaQueryResultsBucket;
      const expirationRule = athenaResultsBucket.Properties.LifecycleConfiguration.Rules[0];
      expect(expirationRule.ExpirationInDays).toBe(30);
    });

    test('should properly handle external dependencies', () => {
      // QuickSight integration should handle missing role gracefully
      const quicksightLambda = template.Resources.QuickSightUpdaterLambda;
      const code = quicksightLambda.Properties.Code.ZipFile;
      expect(code).toContain('NoSuchEntity');
      expect(code).toContain('QuickSight service role');
      expect(code).toContain('does not exist');
    });
  });

  describe('End-to-End Workflow Coverage', () => {
    test('should cover complete log ingestion pipeline', () => {
      // Verify all components of the E2E flow are present
      expect(template.Resources.ApplicationLogGroup).toBeDefined(); // Log generation target
      expect(template.Resources.CloudWatchAgentConfigParameter).toBeDefined(); // Collection config
      expect(template.Resources.ApplicationLogSubscriptionFilter).toBeDefined(); // Ingestion
      expect(template.Resources.LogProcessorLambda).toBeDefined(); // Real-time transformation
      expect(template.Resources.LogDeliveryStream).toBeDefined(); // Firehose delivery
      expect(template.Resources.LogBucket).toBeDefined(); // Durable storage
      expect(template.Resources.GlueScriptUploaderCustomResource).toBeDefined(); // ETL script upload
      expect(template.Resources.LogCrawler).toBeDefined(); // Schema discovery
      expect(template.Resources.LogETLJob).toBeDefined(); // Data optimization
      expect(template.Resources.LogAnalyticsWorkgroup).toBeDefined(); // Ad-hoc analysis
      expect(template.Resources.LogAnalyticsDashboard).toBeDefined(); // Monitoring
      expect(template.Resources.QuickSightPermissionCustomResource).toBeDefined(); // Visualization
    });

    test('should have proper resource references for the complete pipeline', () => {
      // Verify critical resource references
      const subscriptionFilter = template.Resources.ApplicationLogSubscriptionFilter;
      expect(subscriptionFilter.Properties.DestinationArn['Fn::GetAtt'][0]).toBe('LogDeliveryStream');
      
      const firehose = template.Resources.LogDeliveryStream;
      expect(firehose.Properties.ExtendedS3DestinationConfiguration.BucketARN['Fn::GetAtt'][0]).toBe('LogBucket');
      
      const crawler = template.Resources.LogCrawler;
      expect(crawler.Properties.Targets.S3Targets[0].Path['Fn::Sub']).toBe('s3://${LogBucket}/logs/');
    });
  });
});
