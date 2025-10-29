import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Media Processing Pipeline CloudFormation Template', () => {
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

    test('should have a descriptive title', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toContain('Media Processing Pipeline');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have environmentSuffix parameter', () => {
      expect(template.Parameters.environmentSuffix).toBeDefined();
    });

    test('environmentSuffix parameter should have correct properties', () => {
      const param = template.Parameters.environmentSuffix;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('dev');
      expect(param.Description).toContain('Environment suffix');
      expect(param.AllowedPattern).toBe('[a-z0-9-]+');
    });
  });

  describe('Security - KMS Encryption', () => {
    test('should have KMS key resource', () => {
      expect(template.Resources.EncryptionKey).toBeDefined();
      expect(template.Resources.EncryptionKey.Type).toBe('AWS::KMS::Key');
    });

    test('KMS key should have rotation enabled', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.EnableKeyRotation).toBe(true);
    });

    test('KMS key should have proper key policy', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.KeyPolicy).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement).toBeDefined();
      expect(key.Properties.KeyPolicy.Statement.length).toBeGreaterThan(0);
    });

    test('KMS key should have alias', () => {
      expect(template.Resources.EncryptionKeyAlias).toBeDefined();
      expect(template.Resources.EncryptionKeyAlias.Type).toBe('AWS::KMS::Alias');
    });

    test('KMS key should have tags', () => {
      const key = template.Resources.EncryptionKey;
      expect(key.Properties.Tags).toBeDefined();
      expect(key.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('Storage - S3 Buckets', () => {
    test('should have raw videos bucket', () => {
      expect(template.Resources.RawVideosBucket).toBeDefined();
      expect(template.Resources.RawVideosBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have processed videos bucket', () => {
      expect(template.Resources.ProcessedVideosBucket).toBeDefined();
      expect(template.Resources.ProcessedVideosBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have thumbnails bucket', () => {
      expect(template.Resources.ThumbnailsBucket).toBeDefined();
      expect(template.Resources.ThumbnailsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have logging bucket', () => {
      expect(template.Resources.LoggingBucket).toBeDefined();
      expect(template.Resources.LoggingBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('all buckets should have KMS encryption', () => {
      const buckets = ['RawVideosBucket', 'ProcessedVideosBucket', 'ThumbnailsBucket', 'LoggingBucket'];
      buckets.forEach(bucket => {
        const resource = template.Resources[bucket];
        expect(resource.Properties.BucketEncryption).toBeDefined();
        expect(resource.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('aws:kms');
      });
    });

    test('all buckets should block public access', () => {
      const buckets = ['RawVideosBucket', 'ProcessedVideosBucket', 'ThumbnailsBucket', 'LoggingBucket'];
      buckets.forEach(bucket => {
        const resource = template.Resources[bucket];
        const config = resource.Properties.PublicAccessBlockConfiguration;
        expect(config.BlockPublicAcls).toBe(true);
        expect(config.BlockPublicPolicy).toBe(true);
        expect(config.IgnorePublicAcls).toBe(true);
        expect(config.RestrictPublicBuckets).toBe(true);
      });
    });

    test('raw videos bucket should have versioning enabled', () => {
      const bucket = template.Resources.RawVideosBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('raw videos bucket should have S3 notification configuration', () => {
      const bucket = template.Resources.RawVideosBucket;
      expect(bucket.Properties.NotificationConfiguration).toBeDefined();
      expect(bucket.Properties.NotificationConfiguration.LambdaConfigurations).toBeDefined();
    });

    test('all buckets should use environmentSuffix in naming', () => {
      const buckets = ['RawVideosBucket', 'ProcessedVideosBucket', 'ThumbnailsBucket', 'LoggingBucket'];
      buckets.forEach(bucket => {
        const resource = template.Resources[bucket];
        const bucketName = resource.Properties.BucketName;
        expect(bucketName['Fn::Sub']).toContain('${environmentSuffix}');
      });
    });

    test('all buckets should have tags', () => {
      const buckets = ['RawVideosBucket', 'ProcessedVideosBucket', 'ThumbnailsBucket', 'LoggingBucket'];
      buckets.forEach(bucket => {
        const resource = template.Resources[bucket];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Database - DynamoDB', () => {
    test('should have job status table', () => {
      expect(template.Resources.JobStatusTable).toBeDefined();
      expect(template.Resources.JobStatusTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('job status table should have correct attributes', () => {
      const table = template.Resources.JobStatusTable;
      const attrs = table.Properties.AttributeDefinitions;
      expect(attrs).toBeDefined();
      expect(attrs.length).toBeGreaterThan(0);

      const jobIdAttr = attrs.find((a: any) => a.AttributeName === 'jobId');
      expect(jobIdAttr).toBeDefined();
      expect(jobIdAttr.AttributeType).toBe('S');
    });

    test('job status table should use PAY_PER_REQUEST billing', () => {
      const table = template.Resources.JobStatusTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('job status table should have KMS encryption', () => {
      const table = template.Resources.JobStatusTable;
      expect(table.Properties.SSESpecification).toBeDefined();
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEType).toBe('KMS');
    });

    test('job status table should have point-in-time recovery', () => {
      const table = template.Resources.JobStatusTable;
      expect(table.Properties.PointInTimeRecoverySpecification).toBeDefined();
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
    });

    test('job status table should use environmentSuffix in naming', () => {
      const table = template.Resources.JobStatusTable;
      expect(table.Properties.TableName['Fn::Sub']).toContain('${environmentSuffix}');
    });

    test('job status table should have tags', () => {
      const table = template.Resources.JobStatusTable;
      expect(table.Properties.Tags).toBeDefined();
      expect(table.Properties.Tags.length).toBeGreaterThan(0);
    });
  });

  describe('Messaging - SQS and SNS', () => {
    test('should have dead letter queue', () => {
      expect(template.Resources.DeadLetterQueue).toBeDefined();
      expect(template.Resources.DeadLetterQueue.Type).toBe('AWS::SQS::Queue');
    });

    test('should have processing queue', () => {
      expect(template.Resources.ProcessingQueue).toBeDefined();
      expect(template.Resources.ProcessingQueue.Type).toBe('AWS::SQS::Queue');
    });

    test('processing queue should have DLQ configured', () => {
      const queue = template.Resources.ProcessingQueue;
      expect(queue.Properties.RedrivePolicy).toBeDefined();
      expect(queue.Properties.RedrivePolicy.maxReceiveCount).toBe(3);
    });

    test('queues should have KMS encryption', () => {
      const queues = ['DeadLetterQueue', 'ProcessingQueue'];
      queues.forEach(queue => {
        const resource = template.Resources[queue];
        expect(resource.Properties.KmsMasterKeyId).toBeDefined();
      });
    });

    test('should have job completion topic', () => {
      expect(template.Resources.JobCompletionTopic).toBeDefined();
      expect(template.Resources.JobCompletionTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have job failure topic', () => {
      expect(template.Resources.JobFailureTopic).toBeDefined();
      expect(template.Resources.JobFailureTopic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topics should have KMS encryption', () => {
      const topics = ['JobCompletionTopic', 'JobFailureTopic'];
      topics.forEach(topic => {
        const resource = template.Resources[topic];
        expect(resource.Properties.KmsMasterKeyId).toBeDefined();
      });
    });

    test('queues and topics should use environmentSuffix in naming', () => {
      const resources = ['DeadLetterQueue', 'ProcessingQueue', 'JobCompletionTopic', 'JobFailureTopic'];
      resources.forEach(resource => {
        const r = template.Resources[resource];
        const nameField = r.Type.includes('SNS') ? 'TopicName' : 'QueueName';
        expect(r.Properties[nameField]['Fn::Sub']).toContain('${environmentSuffix}');
      });
    });
  });

  describe('Compute - Lambda Functions', () => {
    test('should have processing lambda', () => {
      expect(template.Resources.ProcessingLambda).toBeDefined();
      expect(template.Resources.ProcessingLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have status update lambda', () => {
      expect(template.Resources.StatusUpdateLambda).toBeDefined();
      expect(template.Resources.StatusUpdateLambda.Type).toBe('AWS::Lambda::Function');
    });

    test('processing lambda should have correct runtime', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('processing lambda should have X-Ray tracing enabled', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda.Properties.TracingConfig).toBeDefined();
      expect(lambda.Properties.TracingConfig.Mode).toBe('Active');
    });

    test('processing lambda should have DLQ configured', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda.Properties.DeadLetterConfig).toBeDefined();
    });

    test('processing lambda should have environment variables', () => {
      const lambda = template.Resources.ProcessingLambda;
      expect(lambda.Properties.Environment).toBeDefined();
      expect(lambda.Properties.Environment.Variables).toBeDefined();
      expect(lambda.Properties.Environment.Variables.JOB_TABLE).toBeDefined();
      expect(lambda.Properties.Environment.Variables.PROCESSED_BUCKET).toBeDefined();
      // AWS_REGION is a reserved Lambda environment variable, not set explicitly
    });

    test('lambda functions should use environmentSuffix in naming', () => {
      const lambdas = ['ProcessingLambda', 'StatusUpdateLambda'];
      lambdas.forEach(lambda => {
        const resource = template.Resources[lambda];
        expect(resource.Properties.FunctionName['Fn::Sub']).toContain('${environmentSuffix}');
      });
    });

    test('lambda functions should have log groups', () => {
      expect(template.Resources.ProcessingLambdaLogGroup).toBeDefined();
      expect(template.Resources.StatusUpdateLambdaLogGroup).toBeDefined();
    });

    test('lambda log groups should have retention policy', () => {
      const logGroups = ['ProcessingLambdaLogGroup', 'StatusUpdateLambdaLogGroup'];
      logGroups.forEach(logGroup => {
        const resource = template.Resources[logGroup];
        expect(resource.Properties.RetentionInDays).toBeDefined();
        expect(resource.Properties.RetentionInDays).toBe(30);
      });
    });

    test('lambda functions should have tags', () => {
      const lambdas = ['ProcessingLambda', 'StatusUpdateLambda'];
      lambdas.forEach(lambda => {
        const resource = template.Resources[lambda];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('IAM - Roles and Policies', () => {
    test('should have MediaConvert role', () => {
      expect(template.Resources.MediaConvertRole).toBeDefined();
      expect(template.Resources.MediaConvertRole.Type).toBe('AWS::IAM::Role');
    });

    test('should have Processing Lambda role', () => {
      expect(template.Resources.ProcessingLambdaRole).toBeDefined();
      expect(template.Resources.ProcessingLambdaRole.Type).toBe('AWS::IAM::Role');
    });

    test('MediaConvert role should have correct trust policy', () => {
      const role = template.Resources.MediaConvertRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('mediaconvert.amazonaws.com');
    });

    test('Processing Lambda role should have correct trust policy', () => {
      const role = template.Resources.ProcessingLambdaRole;
      const trustPolicy = role.Properties.AssumeRolePolicyDocument;
      expect(trustPolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
    });

    test('Processing Lambda role should have inline policies with specific permissions', () => {
      const role = template.Resources.ProcessingLambdaRole;
      expect(role.Properties.Policies).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThan(0);
    });

    test('roles should use environmentSuffix in naming', () => {
      const roles = ['MediaConvertRole', 'ProcessingLambdaRole'];
      roles.forEach(role => {
        const resource = template.Resources[role];
        expect(resource.Properties.RoleName['Fn::Sub']).toContain('${environmentSuffix}');
      });
    });

    test('roles should have tags', () => {
      const roles = ['MediaConvertRole', 'ProcessingLambdaRole'];
      roles.forEach(role => {
        const resource = template.Resources[role];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThan(0);
      });
    });
  });

  describe('Events - EventBridge', () => {
    test('should have EventBridge rule for MediaConvert completion', () => {
      expect(template.Resources.EventBridgeRule).toBeDefined();
      expect(template.Resources.EventBridgeRule.Type).toBe('AWS::Events::Rule');
    });

    test('EventBridge rule should have correct event pattern', () => {
      const rule = template.Resources.EventBridgeRule;
      expect(rule.Properties.EventPattern).toBeDefined();
      expect(rule.Properties.EventPattern.source).toContain('aws.mediaconvert');
    });

    test('EventBridge rule should target status update lambda', () => {
      const rule = template.Resources.EventBridgeRule;
      expect(rule.Properties.Targets).toBeDefined();
      expect(rule.Properties.Targets.length).toBeGreaterThan(0);
    });

    test('should have permission for EventBridge to invoke lambda', () => {
      expect(template.Resources.EventBridgeInvokePermission).toBeDefined();
      expect(template.Resources.EventBridgeInvokePermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('Monitoring - CloudWatch', () => {
    test('should have error alarm for processing lambda', () => {
      expect(template.Resources.ProcessingLambdaErrorAlarm).toBeDefined();
      expect(template.Resources.ProcessingLambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have throttle alarm for processing lambda', () => {
      expect(template.Resources.ProcessingLambdaThrottleAlarm).toBeDefined();
      expect(template.Resources.ProcessingLambdaThrottleAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('should have DLQ depth alarm', () => {
      expect(template.Resources.DLQDepthAlarm).toBeDefined();
      expect(template.Resources.DLQDepthAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('alarms should have alarm actions', () => {
      const alarms = ['ProcessingLambdaErrorAlarm', 'ProcessingLambdaThrottleAlarm', 'DLQDepthAlarm'];
      alarms.forEach(alarm => {
        const resource = template.Resources[alarm];
        expect(resource.Properties.AlarmActions).toBeDefined();
        expect(resource.Properties.AlarmActions.length).toBeGreaterThan(0);
      });
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.MediaProcessingDashboard).toBeDefined();
      expect(template.Resources.MediaProcessingDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('dashboard should use environmentSuffix in naming', () => {
      const dashboard = template.Resources.MediaProcessingDashboard;
      expect(dashboard.Properties.DashboardName['Fn::Sub']).toContain('${environmentSuffix}');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const requiredOutputs = [
        'RawVideosBucketName',
        'ProcessedVideosBucketName',
        'ThumbnailsBucketName',
        'JobStatusTableName',
        'ProcessingLambdaArn',
        'StatusUpdateLambdaArn',
        'JobCompletionTopicArn',
        'ProcessingQueueUrl',
        'EncryptionKeyId',
        'MediaConvertRoleArn',
        'DashboardUrl'
      ];

      requiredOutputs.forEach(output => {
        expect(template.Outputs[output]).toBeDefined();
      });
    });

    test('outputs should have descriptions', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Description.length).toBeGreaterThan(0);
      });
    });

    test('outputs should export values', () => {
      const exportsRequired = [
        'RawVideosBucketName',
        'ProcessedVideosBucketName',
        'ThumbnailsBucketName',
        'JobStatusTableName',
        'ProcessingLambdaArn',
        'StatusUpdateLambdaArn',
        'JobCompletionTopicArn',
        'ProcessingQueueUrl',
        'EncryptionKeyId',
        'MediaConvertRoleArn'
      ];

      exportsRequired.forEach(output => {
        expect(template.Outputs[output].Export).toBeDefined();
        expect(template.Outputs[output].Export.Name).toBeDefined();
      });
    });
  });

  describe('Resource Naming Convention', () => {
    test('all named resources should use environmentSuffix parameter', () => {
      const resourcesWithNames = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && (
          resource.Properties.BucketName ||
          resource.Properties.TableName ||
          resource.Properties.FunctionName ||
          resource.Properties.RoleName ||
          resource.Properties.QueueName ||
          resource.Properties.TopicName ||
          resource.Properties.LogGroupName ||
          resource.Properties.DashboardName
        );
      });

      expect(resourcesWithNames.length).toBeGreaterThan(0);

      resourcesWithNames.forEach(key => {
        const resource = template.Resources[key];
        const props = resource.Properties;
        const nameFields = ['BucketName', 'TableName', 'FunctionName', 'RoleName', 'QueueName', 'TopicName', 'LogGroupName', 'DashboardName'];
        const nameField = nameFields.find(f => props[f]);

        if (nameField && props[nameField]) {
          const nameValue = props[nameField];
          if (nameValue['Fn::Sub']) {
            expect(nameValue['Fn::Sub']).toContain('${environmentSuffix}');
          }
        }
      });
    });
  });

  describe('Security Best Practices', () => {
    test('no resources should have Retain deletion policy', () => {
      Object.keys(template.Resources).forEach(key => {
        const resource = template.Resources[key];
        if (resource.DeletionPolicy) {
          expect(resource.DeletionPolicy).not.toBe('Retain');
        }
      });
    });

    test('all resources with tags should include required tags', () => {
      const resourcesWithTags = Object.keys(template.Resources).filter(key => {
        const resource = template.Resources[key];
        return resource.Properties && resource.Properties.Tags;
      });

      resourcesWithTags.forEach(key => {
        const resource = template.Resources[key];
        const tags = resource.Properties.Tags;
        const tagKeys = tags.map((t: any) => t.Key);

        expect(tagKeys).toContain('Environment');
        expect(tagKeys).toContain('Project');
      });
    });

    test('template should not contain hardcoded credentials', () => {
      const templateStr = JSON.stringify(template);
      expect(templateStr).not.toMatch(/AKIA[0-9A-Z]{16}/); // AWS Access Key pattern
      expect(templateStr).not.toMatch(/password/i);
      expect(templateStr).not.toMatch(/secret/i);
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have required CloudFormation sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });

    test('should have multiple resources for media processing', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(20);
    });
  });
});
