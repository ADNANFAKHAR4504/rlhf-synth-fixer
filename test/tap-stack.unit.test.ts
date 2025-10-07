import fs from 'fs';
import path from 'path';

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
        'Push Notification System Infrastructure for Mobile Backend'
      );
    });

  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
    });

    test('EnvironmentSuffix parameter should have correct properties', () => {
      const envSuffixParam = template.Parameters.EnvironmentSuffix;
      expect(envSuffixParam.Type).toBe('String');
      expect(envSuffixParam.Default).toBe('dev');
      expect(envSuffixParam.Description).toBe('Environment suffix for resource naming');
      expect(envSuffixParam.AllowedPattern).toBe('^[a-zA-Z0-9]+$');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have DeviceTokensTable resource', () => {
      expect(template.Resources.DeviceTokensTable).toBeDefined();
      expect(template.Resources.DeviceTokensTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('DeviceTokensTable should have correct properties', () => {
      const table = template.Resources.DeviceTokensTable.Properties;
      expect(table.TableName).toEqual({'Fn::Sub': 'DeviceTokens-${EnvironmentSuffix}'});
      expect(table.BillingMode).toBe('PROVISIONED');
      expect(table.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });

    test('DeviceTokensTable should have correct attribute definitions', () => {
      const attrs = template.Resources.DeviceTokensTable.Properties.AttributeDefinitions;
      expect(attrs).toContainEqual({AttributeName: 'userId', AttributeType: 'S'});
      expect(attrs).toContainEqual({AttributeName: 'deviceToken', AttributeType: 'S'});
      expect(attrs).toContainEqual({AttributeName: 'platform', AttributeType: 'S'});
    });

    test('DeviceTokensTable should have PlatformIndex GSI', () => {
      const gsi = template.Resources.DeviceTokensTable.Properties.GlobalSecondaryIndexes[0];
      expect(gsi.IndexName).toBe('PlatformIndex');
      expect(gsi.KeySchema).toContainEqual({AttributeName: 'platform', KeyType: 'HASH'});
    });
  });

  describe('S3 Resources', () => {
    test('should have CampaignAnalyticsBucket', () => {
      expect(template.Resources.CampaignAnalyticsBucket).toBeDefined();
      expect(template.Resources.CampaignAnalyticsBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('CampaignAnalyticsBucket should have versioning enabled', () => {
      const bucket = template.Resources.CampaignAnalyticsBucket.Properties;
      expect(bucket.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('CampaignAnalyticsBucket should have lifecycle rules', () => {
      const rules = template.Resources.CampaignAnalyticsBucket.Properties.LifecycleConfiguration.Rules;
      expect(rules[0].Id).toBe('DeleteOldAnalytics');
      expect(rules[0].ExpirationInDays).toBe(90);
    });

    test('CampaignAnalyticsBucket should have encryption', () => {
      const encryption = template.Resources.CampaignAnalyticsBucket.Properties.BucketEncryption;
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });
  });

  describe('SNS Resources', () => {
    test('should have notification topics', () => {
      expect(template.Resources.NotificationTopic).toBeDefined();
      expect(template.Resources.IOSNotificationTopic).toBeDefined();
      expect(template.Resources.AndroidNotificationTopic).toBeDefined();
    });

    test('all topics should be SNS topics', () => {
      expect(template.Resources.NotificationTopic.Type).toBe('AWS::SNS::Topic');
      expect(template.Resources.IOSNotificationTopic.Type).toBe('AWS::SNS::Topic');
      expect(template.Resources.AndroidNotificationTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('Lambda Resources', () => {
    test('should have NotificationProcessor function', () => {
      expect(template.Resources.NotificationProcessor).toBeDefined();
      expect(template.Resources.NotificationProcessor.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should have correct configuration', () => {
      const lambda = template.Resources.NotificationProcessor.Properties;
      expect(lambda.Runtime).toBe('python3.9');
      expect(lambda.Handler).toBe('index.lambda_handler');
      expect(lambda.Timeout).toBe(30);
      expect(lambda.MemorySize).toBe(512);
      // ReservedConcurrentExecutions removed to avoid account limits
    });

    test('Lambda should have dead letter config', () => {
      const dlc = template.Resources.NotificationProcessor.Properties.DeadLetterConfig;
      expect(dlc.TargetArn).toEqual({'Fn::GetAtt': ['DeadLetterQueue', 'Arn']});
    });

    test('Lambda should have environment variables', () => {
      const env = template.Resources.NotificationProcessor.Properties.Environment.Variables;
      expect(env.DEVICE_TOKENS_TABLE).toEqual({Ref: 'DeviceTokensTable'});
      expect(env.ANALYTICS_BUCKET).toEqual({Ref: 'CampaignAnalyticsBucket'});
      expect(env.MAX_RETRIES).toBe('3');
    });
  });

  describe('IAM Resources', () => {
    test('should have required IAM roles', () => {
      expect(template.Resources.NotificationProcessorRole).toBeDefined();
      expect(template.Resources.SchedulerRole).toBeDefined();
      expect(template.Resources.EventBridgePipeRole).toBeDefined();
    });

    test('all IAM roles should be correct type', () => {
      expect(template.Resources.NotificationProcessorRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.SchedulerRole.Type).toBe('AWS::IAM::Role');
      expect(template.Resources.EventBridgePipeRole.Type).toBe('AWS::IAM::Role');
    });

    test('IAM roles should not have Tags property', () => {
      expect(template.Resources.NotificationProcessorRole.Properties.Tags).toBeUndefined();
      expect(template.Resources.SchedulerRole.Properties.Tags).toBeUndefined();
      expect(template.Resources.EventBridgePipeRole.Properties.Tags).toBeUndefined();
    });
  });

  describe('EventBridge Resources', () => {
    test('should have DailyCampaignSchedule', () => {
      expect(template.Resources.DailyCampaignSchedule).toBeDefined();
      expect(template.Resources.DailyCampaignSchedule.Type).toBe('AWS::Scheduler::Schedule');
    });

    test('Schedule should have correct expression', () => {
      const schedule = template.Resources.DailyCampaignSchedule.Properties;
      expect(schedule.ScheduleExpression).toBe('cron(0 10 * * ? *)');
      expect(schedule.State).toBe('ENABLED');
    });

    test('should have DynamoToSNSPipe', () => {
      expect(template.Resources.DynamoToSNSPipe).toBeDefined();
      expect(template.Resources.DynamoToSNSPipe.Type).toBe('AWS::Pipes::Pipe');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have SuccessAlarm', () => {
      expect(template.Resources.SuccessAlarm).toBeDefined();
      expect(template.Resources.SuccessAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('Alarm should have correct configuration', () => {
      const alarm = template.Resources.SuccessAlarm.Properties;
      expect(alarm.MetricName).toBe('SuccessfulDelivery');
      expect(alarm.Namespace).toBe('PushNotifications');
      expect(alarm.Threshold).toBe(0.9);
      expect(alarm.ComparisonOperator).toBe('LessThanThreshold');
    });

    test('should have NotificationProcessorLogGroup', () => {
      expect(template.Resources.NotificationProcessorLogGroup).toBeDefined();
      expect(template.Resources.NotificationProcessorLogGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(template.Resources.NotificationProcessorLogGroup.Properties.RetentionInDays).toBe(7);
    });
  });

  describe('SQS Resources', () => {
    test('should have DeadLetterQueue', () => {
      expect(template.Resources.DeadLetterQueue).toBeDefined();
      expect(template.Resources.DeadLetterQueue.Type).toBe('AWS::SQS::Queue');
    });

    test('DeadLetterQueue should have correct retention', () => {
      const queue = template.Resources.DeadLetterQueue.Properties;
      expect(queue.MessageRetentionPeriod).toBe(1209600);
      expect(queue.VisibilityTimeout).toBe(60);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'NotificationTopicArn',
        'DeviceTokensTableName',
        'DeviceTokensTableStreamArn',
        'NotificationProcessorFunctionArn',
        'CampaignAnalyticsBucketName',
        'IOSNotificationTopicArn',
        'AndroidNotificationTopicArn',
        'DeadLetterQueueUrl'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
        expect(template.Outputs[outputName].Value).toBeDefined();
        expect(template.Outputs[outputName].Export).toBeDefined();
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

    test('should have correct number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(16); // All resources including IAM, Lambda, SNS, etc.
    });

    test('should have exactly 1 parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have 8 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(8);
    });
  });

  describe('Security Best Practices', () => {
    test('should not have any DeletionPolicy Retain', () => {
      Object.values(template.Resources).forEach(resource => {
        expect((resource as any).DeletionPolicy).not.toBe('Retain');
      });
    });

    test('S3 bucket should block public access', () => {
      const bucket = template.Resources.CampaignAnalyticsBucket.Properties;
      const publicAccess = bucket.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });
  });
});
