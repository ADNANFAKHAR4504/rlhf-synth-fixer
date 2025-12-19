import fs from 'fs';
import path from 'path';


describe('TapStack CloudFormation Template - Unit Tests', () => {
  let template: any;

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure Validation', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have a comprehensive description', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Financial Analytics Data Processing Pipeline');
      expect(template.Description).toContain('Production-grade');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
      expect(template.Conditions).toBeDefined();
      expect(template.Metadata).toBeDefined();
    });

    test('should have valid JSON structure', () => {
      expect(typeof template).toBe('object');
      expect(template).not.toBeNull();
    });
  });

  describe('Parameters Validation', () => {
    const requiredParams = [
      'Environment',
      'CostCenter',
      'DataConsumerAccountId',
      'AlertEmail',
      'VpcCidrBlock',
      'KinesisShardCount',
      'DataRetentionDays',
    ];

    test('should have all required parameters', () => {
      requiredParams.forEach(param => {
        expect(template.Parameters[param]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const param = template.Parameters.Environment;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('production');
      expect(param.AllowedValues).toEqual(['development', 'staging', 'production']);
      expect(param.Description).toBeDefined();
    });

    test('CostCenter parameter should have correct pattern', () => {
      const param = template.Parameters.CostCenter;
      expect(param.Type).toBe('String');
      expect(param.AllowedPattern).toBe('^[A-Z]{2}-[0-9]{4}$');
      expect(param.Default).toBe('FI-1001');
      expect(param.ConstraintDescription).toContain('XX-0000');
    });

    test('DataConsumerAccountId parameter should allow empty or 12-digit account ID', () => {
      const param = template.Parameters.DataConsumerAccountId;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('');
      expect(param.AllowedPattern).toBe('^(\\d{12})?$');
    });

    test('AlertEmail parameter should validate email format', () => {
      const param = template.Parameters.AlertEmail;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('alerts@example.com');
      expect(param.AllowedPattern).toBe('[^@]+@[^@]+\\.[^@]+');
    });

    test('VpcCidrBlock parameter should validate CIDR format', () => {
      const param = template.Parameters.VpcCidrBlock;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('10.0.0.0/16');
      expect(param.AllowedPattern).toBeDefined();
      expect(param.ConstraintDescription).toContain('CIDR block');
    });

    test('KinesisShardCount parameter should have valid range', () => {
      const param = template.Parameters.KinesisShardCount;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(10);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(100);
    });

    test('DataRetentionDays parameter should have valid range', () => {
      const param = template.Parameters.DataRetentionDays;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(90);
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(365);
    });
  });

  describe('Conditions Validation', () => {
    test('should have HasDataConsumerAccount condition', () => {
      expect(template.Conditions.HasDataConsumerAccount).toBeDefined();
      expect(template.Conditions.HasDataConsumerAccount['Fn::Not']).toBeDefined();
    });

    test('should have IsProduction condition', () => {
      expect(template.Conditions.IsProduction).toBeDefined();
      expect(template.Conditions.IsProduction['Fn::Equals']).toBeDefined();
    });
  });

  describe('KMS Key Resources', () => {
    test('should have DataEncryptionKey resource', () => {
      expect(template.Resources.DataEncryptionKey).toBeDefined();
      expect(template.Resources.DataEncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('DataEncryptionKey should have key rotation enabled', () => {
      const key = template.Resources.DataEncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('DataEncryptionKey should have proper key policy with service permissions', () => {
      const key = template.Resources.DataEncryptionKey;
      const statements = key.Properties.KeyPolicy.Statement;
      
      // Check for IAM root permissions
      const rootStatement = statements.find((s: any) => s.Sid === 'Enable IAM User Permissions');
      expect(rootStatement).toBeDefined();
      expect(rootStatement.Effect).toBe('Allow');
      
      // Check for service permissions
      const serviceStatement = statements.find((s: any) => s.Sid === 'Allow services to use the key');
      expect(serviceStatement).toBeDefined();
      expect(serviceStatement.Principal.Service).toContain('s3.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('kinesis.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('glue.amazonaws.com');
      expect(serviceStatement.Principal.Service).toContain('lambda.amazonaws.com');
    });

    test('DataEncryptionKey should have conditional cross-account access', () => {
      const key = template.Resources.DataEncryptionKey;
      const statements = key.Properties.KeyPolicy.Statement;
      const crossAccountStatement = statements.find((s: any) => 
        s && typeof s === 'object' && 'Fn::If' in s
      );
      expect(crossAccountStatement).toBeDefined();
    });

    test('should have DataEncryptionKeyAlias', () => {
      expect(template.Resources.DataEncryptionKeyAlias).toBeDefined();
      expect(template.Resources.DataEncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });
  });

  describe('S3 Bucket Resources', () => {
    const buckets = ['RawDataBucket', 'ProcessedDataBucket', 'ArchivedDataBucket', 'GlueScriptsBucket'];

    test('should have all required S3 buckets', () => {
      buckets.forEach(bucketName => {
        expect(template.Resources[bucketName]).toBeDefined();
        expect(template.Resources[bucketName].Type).toBe('AWS::S3::Bucket');
      });
    });

    test('all buckets should have KMS encryption enabled', () => {
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption = bucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toEqual({
          Ref: 'DataEncryptionKey'
        });
      });
    });

    test('all buckets should have public access blocked', () => {
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });
    });

    test('RawDataBucket should have versioning enabled', () => {
      const bucket = template.Resources.RawDataBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('RawDataBucket should have lifecycle policies', () => {
      const bucket = template.Resources.RawDataBucket;
      expect(bucket.Properties.LifecycleConfiguration).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
    });

    test('RawDataBucket should have S3 event notification configured', () => {
      const bucket = template.Resources.RawDataBucket;
      expect(bucket.Properties.NotificationConfiguration).toBeDefined();
      expect(bucket.Properties.NotificationConfiguration.LambdaConfigurations).toBeDefined();
    });

    test('ProcessedDataBucket should have lifecycle with Intelligent Tiering', () => {
      const bucket = template.Resources.ProcessedDataBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      const transitionRule = lifecycle.Rules.find((r: any) => r.Id === 'TransitionToGlacier');
      expect(transitionRule).toBeDefined();
      expect(transitionRule.Transitions).toBeDefined();
    });

    test('ArchivedDataBucket should have 7-year expiration policy', () => {
      const bucket = template.Resources.ArchivedDataBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;
      const expireRule = lifecycle.Rules.find((r: any) => r.Id === 'ExpireOldData');
      expect(expireRule).toBeDefined();
      expect(expireRule.ExpirationInDays).toBe(2555); // 7 years
    });
  });

  describe('Kinesis Data Stream', () => {
    test('should have MarketDataStream resource', () => {
      expect(template.Resources.MarketDataStream).toBeDefined();
      expect(template.Resources.MarketDataStream.Type).toBe('AWS::Kinesis::Stream');
    });

    test('MarketDataStream should have KMS encryption', () => {
      const stream = template.Resources.MarketDataStream;
      expect(stream.Properties.StreamEncryption).toBeDefined();
      expect(stream.Properties.StreamEncryption.EncryptionType).toBe('KMS');
      expect(stream.Properties.StreamEncryption.KeyId).toEqual({
        Ref: 'DataEncryptionKey'
      });
    });

    test('MarketDataStream should have 7-day retention', () => {
      const stream = template.Resources.MarketDataStream;
      expect(stream.Properties.RetentionPeriodHours).toBe(168); // 7 days
    });

    test('MarketDataStream should use provisioned mode', () => {
      const stream = template.Resources.MarketDataStream;
      expect(stream.Properties.StreamModeDetails.StreamMode).toBe('PROVISIONED');
    });
  });

  describe('DynamoDB Tables', () => {
    test('should have ProcessingJobTable', () => {
      expect(template.Resources.ProcessingJobTable).toBeDefined();
      expect(template.Resources.ProcessingJobTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('ProcessingJobTable should use on-demand billing', () => {
      const table = template.Resources.ProcessingJobTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('ProcessingJobTable should have KMS encryption', () => {
      const table = template.Resources.ProcessingJobTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
      expect(table.Properties.SSESpecification.KMSMasterKeyId).toEqual({
        Ref: 'DataEncryptionKey'
      });
    });

    test('ProcessingJobTable should have point-in-time recovery enabled', () => {
      const table = template.Resources.ProcessingJobTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('ProcessingJobTable should have TTL enabled', () => {
      const table = template.Resources.ProcessingJobTable;
      expect(table.Properties.TimeToLiveSpecification.Enabled).toBe(true);
    });

    test('ProcessingJobTable should have Global Secondary Indexes', () => {
      const table = template.Resources.ProcessingJobTable;
      expect(table.Properties.GlobalSecondaryIndexes).toBeDefined();
      expect(table.Properties.GlobalSecondaryIndexes.length).toBeGreaterThan(0);
    });

    test('should have DataLineageTable', () => {
      expect(template.Resources.DataLineageTable).toBeDefined();
      expect(template.Resources.DataLineageTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DataLineageTable should have proper indexes for lineage queries', () => {
      const table = template.Resources.DataLineageTable;
      const indexes = table.Properties.GlobalSecondaryIndexes;
      const sourceIndex = indexes.find((idx: any) => idx.IndexName === 'SourceIndex');
      const transformIndex = indexes.find((idx: any) => idx.IndexName === 'TransformationIndex');
      expect(sourceIndex).toBeDefined();
      expect(transformIndex).toBeDefined();
    });
  });

  describe('Lambda Functions', () => {
    test('should have DataValidationFunction', () => {
      expect(template.Resources.DataValidationFunction).toBeDefined();
      expect(template.Resources.DataValidationFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('DataValidationFunction should have proper runtime and timeout', () => {
      const func = template.Resources.DataValidationFunction;
      expect(func.Properties.Runtime).toBe('python3.9');
      expect(func.Properties.Timeout).toBe(300);
      expect(func.Properties.MemorySize).toBe(1024);
    });

    test('DataValidationFunction should have dead letter queue configured', () => {
      const func = template.Resources.DataValidationFunction;
      expect(func.Properties.DeadLetterConfig).toBeDefined();
      expect(func.Properties.DeadLetterConfig.TargetArn).toBeDefined();
    });

    test('should have KinesisConsumerFunction', () => {
      expect(template.Resources.KinesisConsumerFunction).toBeDefined();
      expect(template.Resources.KinesisConsumerFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('KinesisConsumerFunction should have proper configuration', () => {
      const func = template.Resources.KinesisConsumerFunction;
      expect(func.Properties.Runtime).toBe('python3.9');
      expect(func.Properties.Timeout).toBe(60);
    });

    test('should have Lambda invoke permissions for S3', () => {
      expect(template.Resources.RawDataBucketInvokePermission).toBeDefined();
      expect(template.Resources.DataValidationFunctionPermission).toBeDefined();
    });

    test('should have KinesisEventSourceMapping', () => {
      expect(template.Resources.KinesisEventSourceMapping).toBeDefined();
      expect(template.Resources.KinesisEventSourceMapping.Type).toBe('AWS::Lambda::EventSourceMapping');
    });

    test('KinesisEventSourceMapping should have proper configuration', () => {
      const mapping = template.Resources.KinesisEventSourceMapping;
      expect(mapping.Properties.ParallelizationFactor).toBe(1);
      expect(mapping.Properties.TumblingWindowInSeconds).toBe(60);
      expect(mapping.Properties.MaximumRetryAttempts).toBe(3);
      expect(mapping.Properties.BisectBatchOnFunctionError).toBe(true);
    });
  });

  describe('IAM Roles and Policies', () => {
    test('should have LambdaExecutionRole', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      expect(template.Resources.LambdaExecutionRole.Type).toBe('AWS::IAM::Role');
    });

    test('LambdaExecutionRole should have proper assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('LambdaExecutionRole should have explicit deny for unencrypted uploads', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      const dataPolicy = policies.find((p: any) => p.PolicyName === 'DataProcessingPolicy');
      const denyStatement = dataPolicy.PolicyDocument.Statement.find(
        (s: any) => s.Sid === 'ExplicitDenyUnencryptedUploads'
      );
      expect(denyStatement).toBeDefined();
      expect(denyStatement.Effect).toBe('Deny');
    });

    test('should have GlueServiceRole', () => {
      expect(template.Resources.GlueServiceRole).toBeDefined();
      expect(template.Resources.GlueServiceRole.Type).toBe('AWS::IAM::Role');
    });

    test('GlueServiceRole should have proper permissions', () => {
      const role = template.Resources.GlueServiceRole;
      const policies = role.Properties.Policies;
      const gluePolicy = policies.find((p: any) => p.PolicyName === 'GlueDataAccess');
      expect(gluePolicy).toBeDefined();
      expect(gluePolicy.PolicyDocument.Statement).toBeDefined();
    });

    test('should have CrossAccountDataConsumerRole conditionally', () => {
      const role = template.Resources.CrossAccountDataConsumerRole;
      expect(role).toBeDefined();
      expect(role.Condition).toBe('HasDataConsumerAccount');
    });

    test('CrossAccountDataConsumerRole should require ExternalId', () => {
      const role = template.Resources.CrossAccountDataConsumerRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      const condition = assumePolicy.Statement[0].Condition;
      expect(condition.StringEquals['sts:ExternalId']).toBeDefined();
    });
  });

  describe('Glue Resources', () => {
    test('should have GlueDatabase', () => {
      expect(template.Resources.GlueDatabase).toBeDefined();
      expect(template.Resources.GlueDatabase.Type).toBe('AWS::Glue::Database');
    });

    test('should have RawDataCrawler', () => {
      expect(template.Resources.RawDataCrawler).toBeDefined();
      expect(template.Resources.RawDataCrawler.Type).toBe('AWS::Glue::Crawler');
    });

    test('RawDataCrawler should have hourly schedule', () => {
      const crawler = template.Resources.RawDataCrawler;
      expect(crawler.Properties.Schedule.ScheduleExpression).toBe('cron(0 * * * ? *)');
    });

    test('RawDataCrawler should have proper schema change policy', () => {
      const crawler = template.Resources.RawDataCrawler;
      expect(crawler.Properties.SchemaChangePolicy.UpdateBehavior).toBe('LOG');
      expect(crawler.Properties.SchemaChangePolicy.DeleteBehavior).toBe('LOG');
    });

    test('should have ProcessedDataCrawler', () => {
      expect(template.Resources.ProcessedDataCrawler).toBeDefined();
      expect(template.Resources.ProcessedDataCrawler.Type).toBe('AWS::Glue::Crawler');
    });

    test('ProcessedDataCrawler should bypass Lake Formation', () => {
      const crawler = template.Resources.ProcessedDataCrawler;
      expect(crawler.Properties.LakeFormationConfiguration.UseLakeFormationCredentials).toBe(false);
    });

    test('should have JsonToParquetJob', () => {
      expect(template.Resources.JsonToParquetJob).toBeDefined();
      expect(template.Resources.JsonToParquetJob.Type).toBe('AWS::Glue::Job');
    });

    test('JsonToParquetJob should have proper configuration', () => {
      const job = template.Resources.JsonToParquetJob;
      expect(job.Properties.GlueVersion).toBe('3.0');
      expect(job.Properties.WorkerType).toBe('G.2X');
      expect(job.Properties.NumberOfWorkers).toBe(10);
      expect(job.Properties.MaxRetries).toBe(1);
    });

    test('should have GlueETLTrigger', () => {
      expect(template.Resources.GlueETLTrigger).toBeDefined();
      expect(template.Resources.GlueETLTrigger.Type).toBe('AWS::Glue::Trigger');
    });

    test('GlueETLTrigger should start only in production', () => {
      const trigger = template.Resources.GlueETLTrigger;
      expect(trigger.Properties.StartOnCreation).toEqual({
        'Fn::If': ['IsProduction', true, false]
      });
    });
  });

  describe('VPC Resources', () => {
    test('should have DataPipelineVpc', () => {
      expect(template.Resources.DataPipelineVpc).toBeDefined();
      expect(template.Resources.DataPipelineVpc.Type).toBe('AWS::EC2::VPC');
    });

    test('should have private subnets', () => {
      expect(template.Resources.DataPipelinePrivateSubnetA).toBeDefined();
      expect(template.Resources.DataPipelinePrivateSubnetB).toBeDefined();
    });

    test('should have VPC endpoints for all required services', () => {
      expect(template.Resources.S3VPCEndpoint).toBeDefined();
      expect(template.Resources.DynamoDBVPCEndpoint).toBeDefined();
      expect(template.Resources.KinesisVPCEndpoint).toBeDefined();
      expect(template.Resources.GlueVPCEndpoint).toBeDefined();
      expect(template.Resources.LambdaVPCEndpoint).toBeDefined();
    });

    test('VPC endpoints should have proper security group', () => {
      const endpoint = template.Resources.KinesisVPCEndpoint;
      expect(endpoint.Properties.SecurityGroupIds).toBeDefined();
      expect(endpoint.Properties.PrivateDnsEnabled).toBe(true);
    });
  });

  describe('SNS Topics', () => {
    test('should have PipelineAlertTopic', () => {
      expect(template.Resources.PipelineAlertTopic).toBeDefined();
      expect(template.Resources.PipelineAlertTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('PipelineAlertTopic should have KMS encryption', () => {
      const topic = template.Resources.PipelineAlertTopic;
      expect(topic.Properties.KmsMasterKeyId).toEqual({
        Ref: 'DataEncryptionKey'
      });
    });

    test('PipelineAlertTopic should have email subscription', () => {
      const topic = template.Resources.PipelineAlertTopic;
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription[0].Protocol).toBe('email');
    });

    test('should have DataQualityAlertTopic', () => {
      expect(template.Resources.DataQualityAlertTopic).toBeDefined();
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have multiple CloudWatch alarms', () => {
      const alarmResources = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::CloudWatch::Alarm'
      );
      expect(alarmResources.length).toBeGreaterThan(5);
    });

    test('should have KinesisShardIteratorAlarm', () => {
      expect(template.Resources.KinesisShardIteratorAlarm).toBeDefined();
    });

    test('should have LambdaErrorAlarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
    });

    test('should have DLQMessageAlarm', () => {
      expect(template.Resources.DLQMessageAlarm).toBeDefined();
    });

    test('should have PipelineDashboard', () => {
      expect(template.Resources.PipelineDashboard).toBeDefined();
      expect(template.Resources.PipelineDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('PipelineDashboard should have valid dashboard body', () => {
      const dashboard = template.Resources.PipelineDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
      const body = JSON.parse(dashboard.Properties.DashboardBody['Fn::Sub']);
      expect(body.widgets).toBeDefined();
      expect(Array.isArray(body.widgets)).toBe(true);
    });
  });

  describe('SQS Dead Letter Queue', () => {
    test('should have ValidationDeadLetterQueue', () => {
      expect(template.Resources.ValidationDeadLetterQueue).toBeDefined();
      expect(template.Resources.ValidationDeadLetterQueue.Type).toBe('AWS::SQS::Queue');
    });

    test('ValidationDeadLetterQueue should have KMS encryption', () => {
      const queue = template.Resources.ValidationDeadLetterQueue;
      expect(queue.Properties.KmsMasterKeyId).toEqual({
        Ref: 'DataEncryptionKey'
      });
    });

    test('ValidationDeadLetterQueue should have 14-day retention', () => {
      const queue = template.Resources.ValidationDeadLetterQueue;
      expect(queue.Properties.MessageRetentionPeriod).toBe(1209600); // 14 days
    });
  });

  describe('Outputs Validation', () => {
    const requiredOutputs = [
      'StackName',
      'Region',
      'KinesisStreamArn',
      'KinesisStreamName',
      'RawDataBucketName',
      'RawDataBucketArn',
      'ProcessedDataBucketName',
      'ProcessedDataBucketArn',
      'GlueDatabaseName',
      'GlueJobName',
      'ProcessingJobTableName',
      'DataLineageTableName',
      'ValidationFunctionArn',
      'KinesisConsumerFunctionArn',
      'DeadLetterQueueUrl',
      'DeadLetterQueueArn',
      'DashboardURL',
      'PipelineAlertTopicArn',
      'DataQualityAlertTopicArn',
      'DataEncryptionKeyArn',
      'DataEncryptionKeyAlias',
    ];

    test('should have all required outputs', () => {
      requiredOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('all outputs should have exports', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toBeDefined();
      });
    });

    test('CrossAccountRoleArn should be conditional', () => {
      const output = template.Outputs.CrossAccountRoleArn;
      expect(output.Value['Fn::If']).toBeDefined();
      expect(output.Value['Fn::If'][0]).toBe('HasDataConsumerAccount');
    });
  });

  describe('Resource Dependencies', () => {
    test('RawDataBucket should depend on Lambda permissions', () => {
      const bucket = template.Resources.RawDataBucket;
      expect(bucket.DependsOn).toBeDefined();
      expect(bucket.DependsOn).toContain('RawDataBucketInvokePermission');
      expect(bucket.DependsOn).toContain('DataValidationFunctionPermission');
    });
  });

  describe('Security and Compliance', () => {
    test('all S3 buckets should have encryption', () => {
      const buckets = ['RawDataBucket', 'ProcessedDataBucket', 'ArchivedDataBucket', 'GlueScriptsBucket'];
      buckets.forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        expect(bucket.Properties.BucketEncryption).toBeDefined();
      });
    });

    test('all DynamoDB tables should have encryption', () => {
      const tables = ['ProcessingJobTable', 'DataLineageTable'];
      tables.forEach(tableName => {
        const table = template.Resources[tableName];
        expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      });
    });

    test('all resources should have proper tags', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        if (resource.Properties && resource.Properties.Tags) {
          const tags = Array.isArray(resource.Properties.Tags)
            ? resource.Properties.Tags
            : Object.keys(resource.Properties.Tags);
          expect(tags.length).toBeGreaterThan(0);
        }
      });
    });
  });

  describe('Naming Conventions', () => {
    test('resource names should follow naming convention', () => {
      const resources = Object.keys(template.Resources);
      resources.forEach(resourceName => {
        // Resource logical IDs should be PascalCase
        expect(resourceName).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });

    test('output names should follow naming convention', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        // Output keys should be PascalCase
        expect(outputKey).toMatch(/^[A-Z][a-zA-Z0-9]*$/);
      });
    });
  });

  describe('Boundary Conditions', () => {
    test('KinesisShardCount should respect min/max bounds', () => {
      const param = template.Parameters.KinesisShardCount;
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(100);
    });

    test('DataRetentionDays should respect min/max bounds', () => {
      const param = template.Parameters.DataRetentionDays;
      expect(param.MinValue).toBe(1);
      expect(param.MaxValue).toBe(365);
    });
  });

  describe('Error Handling Configuration', () => {
    test('Lambda functions should have dead letter queues', () => {
      const validationFunc = template.Resources.DataValidationFunction;
      expect(validationFunc.Properties.DeadLetterConfig).toBeDefined();
    });

    test('Kinesis event source mapping should have retry configuration', () => {
      const mapping = template.Resources.KinesisEventSourceMapping;
      expect(mapping.Properties.MaximumRetryAttempts).toBeDefined();
      expect(mapping.Properties.BisectBatchOnFunctionError).toBe(true);
    });
  });
});

