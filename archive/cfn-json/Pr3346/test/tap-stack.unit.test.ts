import fs from 'fs';
import path from 'path';

describe('Image Processing Pipeline CloudFormation Template', () => {
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
      expect(template.Description).toContain('image processing pipeline');
    });
  });

  describe('Parameters', () => {
    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      expect(template.Parameters.NotificationEmail.Type).toBe('String');
      expect(template.Parameters.NotificationEmail.AllowedPattern).toBeDefined();
    });

    test('should have ImageMaxWidth parameter', () => {
      expect(template.Parameters.ImageMaxWidth).toBeDefined();
      expect(template.Parameters.ImageMaxWidth.Type).toBe('Number');
      expect(template.Parameters.ImageMaxWidth.Default).toBe(1024);
      expect(template.Parameters.ImageMaxWidth.MinValue).toBe(100);
      expect(template.Parameters.ImageMaxWidth.MaxValue).toBe(4096);
    });

    test('should have ImageMaxHeight parameter', () => {
      expect(template.Parameters.ImageMaxHeight).toBeDefined();
      expect(template.Parameters.ImageMaxHeight.Type).toBe('Number');
      expect(template.Parameters.ImageMaxHeight.Default).toBe(768);
      expect(template.Parameters.ImageMaxHeight.MinValue).toBe(100);
      expect(template.Parameters.ImageMaxHeight.MaxValue).toBe(4096);
    });
  });

  describe('S3 Resources', () => {
    test('should have UploadBucket resource', () => {
      expect(template.Resources.UploadBucket).toBeDefined();
      expect(template.Resources.UploadBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('UploadBucket should have encryption enabled', () => {
      const bucket = template.Resources.UploadBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('UploadBucket should block public access', () => {
      const bucket = template.Resources.UploadBucket;
      const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccessBlock.BlockPublicAcls).toBe(true);
      expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
      expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
      expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
    });

    test('UploadBucket should have versioning enabled', () => {
      const bucket = template.Resources.UploadBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('UploadBucket should have lifecycle rules', () => {
      const bucket = template.Resources.UploadBucket;
      expect(bucket.Properties.LifecycleConfiguration.Rules).toBeDefined();
      expect(bucket.Properties.LifecycleConfiguration.Rules).toHaveLength(1);
      expect(
        bucket.Properties.LifecycleConfiguration.Rules[0].ExpirationInDays
      ).toBe(365);
    });

    test('UploadBucket should have Lambda notification configurations', () => {
      // Check that the Custom Resource for bucket notifications exists
      const notificationResource = template.Resources.UploadBucketNotification;
      expect(notificationResource).toBeDefined();
      expect(notificationResource.Type).toBe('Custom::S3BucketNotification');

      const lambdaConfigs = notificationResource.Properties.LambdaConfigurations;
      expect(lambdaConfigs).toBeDefined();
      expect(lambdaConfigs.length).toBe(3);

      const suffixes = lambdaConfigs.map(
        (config: any) => config.Filter.S3Key.Rules[0].Value
      );
      expect(suffixes).toContain('.jpg');
      expect(suffixes).toContain('.jpeg');
      expect(suffixes).toContain('.png');
    });

    test('UploadBucket should have proper tags', () => {
      const bucket = template.Resources.UploadBucket;
      expect(bucket.Properties.Tags).toBeDefined();
      expect(bucket.Properties.Tags.length).toBeGreaterThanOrEqual(2);
    });

    test('should have ProcessedBucket resource', () => {
      expect(template.Resources.ProcessedBucket).toBeDefined();
      expect(template.Resources.ProcessedBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ProcessedBucket should have encryption enabled', () => {
      const bucket = template.Resources.ProcessedBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
      expect(
        bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0]
          .ServerSideEncryptionByDefault.SSEAlgorithm
      ).toBe('AES256');
    });

    test('ProcessedBucket should have lifecycle rules with transitions', () => {
      const bucket = template.Resources.ProcessedBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThanOrEqual(2);

      const transitionRule = rules.find((r: any) => r.Id === 'MoveToIA');
      expect(transitionRule).toBeDefined();
      expect(transitionRule.Transitions[0].StorageClass).toBe('STANDARD_IA');
      expect(transitionRule.Transitions[0].TransitionInDays).toBe(30);
    });
  });

  describe('Lambda Function', () => {
    test('should have ImageProcessorFunction resource', () => {
      expect(template.Resources.ImageProcessorFunction).toBeDefined();
      expect(template.Resources.ImageProcessorFunction.Type).toBe(
        'AWS::Lambda::Function'
      );
    });

    test('ImageProcessorFunction should have correct runtime', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.Runtime).toBe('python3.11');
    });

    test('ImageProcessorFunction should have correct handler', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
    });

    test('ImageProcessorFunction should have appropriate timeout', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.Timeout).toBe(60);
    });

    test('ImageProcessorFunction should have appropriate memory size', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.MemorySize).toBe(1024);
    });

    test('ImageProcessorFunction should have reserved concurrent executions', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(100);
    });

    test('ImageProcessorFunction should have correct environment variables', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;
      expect(envVars.PROCESSED_BUCKET).toBeDefined();
      expect(envVars.SNS_TOPIC_ARN).toBeDefined();
      expect(envVars.MAX_WIDTH).toBeDefined();
      expect(envVars.MAX_HEIGHT).toBeDefined();
    });

    test('ImageProcessorFunction should have inline code', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.Code.ZipFile).toBeDefined();
      expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      expect(lambda.Properties.Code.ZipFile).toContain('PIL');
    });

    test('ImageProcessorFunction should have proper tags', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.Tags).toBeDefined();
      expect(lambda.Properties.Tags.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe('IAM Role', () => {
    test('should have ImageProcessorRole resource', () => {
      expect(template.Resources.ImageProcessorRole).toBeDefined();
      expect(template.Resources.ImageProcessorRole.Type).toBe('AWS::IAM::Role');
    });

    test('ImageProcessorRole should have correct assume role policy', () => {
      const role = template.Resources.ImageProcessorRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicy.Version).toBe('2012-10-17');
      expect(assumePolicy.Statement[0].Principal.Service).toBe(
        'lambda.amazonaws.com'
      );
    });

    test('ImageProcessorRole should have AWSLambdaBasicExecutionRole managed policy', () => {
      const role = template.Resources.ImageProcessorRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('ImageProcessorRole should have S3 access policy', () => {
      const role = template.Resources.ImageProcessorRole;
      const policies = role.Properties.Policies;
      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement).toBeDefined();
      expect(s3Policy.PolicyDocument.Statement.length).toBeGreaterThanOrEqual(2);
    });

    test('ImageProcessorRole should have SNS publish policy', () => {
      const role = template.Resources.ImageProcessorRole;
      const policies = role.Properties.Policies;
      const snsPolicy = policies.find(
        (p: any) => p.PolicyName === 'SNSPublishPolicy'
      );
      expect(snsPolicy).toBeDefined();
      expect(snsPolicy.PolicyDocument.Statement[0].Action).toBe('sns:Publish');
    });

    test('ImageProcessorRole should have CloudWatch metrics policy', () => {
      const role = template.Resources.ImageProcessorRole;
      const policies = role.Properties.Policies;
      const cwPolicy = policies.find(
        (p: any) => p.PolicyName === 'CloudWatchMetricsPolicy'
      );
      expect(cwPolicy).toBeDefined();
      expect(cwPolicy.PolicyDocument.Statement[0].Action).toContain(
        'cloudwatch:PutMetricData'
      );
    });
  });

  describe('SNS Topics', () => {
    test('should have ErrorNotificationTopic resource', () => {
      expect(template.Resources.ErrorNotificationTopic).toBeDefined();
      expect(template.Resources.ErrorNotificationTopic.Type).toBe(
        'AWS::SNS::Topic'
      );
    });

    test('ErrorNotificationTopic should have email subscription', () => {
      const topic = template.Resources.ErrorNotificationTopic;
      const subscriptions = topic.Properties.Subscription;
      expect(subscriptions).toBeDefined();
      expect(subscriptions.length).toBeGreaterThanOrEqual(1);
      expect(subscriptions[0].Protocol).toBe('email');
    });

    test('should have ProcessingAlarmTopic resource', () => {
      expect(template.Resources.ProcessingAlarmTopic).toBeDefined();
      expect(template.Resources.ProcessingAlarmTopic.Type).toBe('AWS::SNS::Topic');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have ImageProcessorFunctionLogGroup', () => {
      expect(template.Resources.ImageProcessorFunctionLogGroup).toBeDefined();
      expect(template.Resources.ImageProcessorFunctionLogGroup.Type).toBe(
        'AWS::Logs::LogGroup'
      );
    });

    test('ImageProcessorFunctionLogGroup should have retention period', () => {
      const logGroup = template.Resources.ImageProcessorFunctionLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('should have LambdaErrorAlarm', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('LambdaErrorAlarm should have correct configuration', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(10);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have LambdaThrottleAlarm', () => {
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
      expect(template.Resources.LambdaThrottleAlarm.Type).toBe(
        'AWS::CloudWatch::Alarm'
      );
    });

    test('LambdaThrottleAlarm should have correct configuration', () => {
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm.Properties.MetricName).toBe('Throttles');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(5);
    });

    test('should have ProcessingDashboard', () => {
      expect(template.Resources.ProcessingDashboard).toBeDefined();
      expect(template.Resources.ProcessingDashboard.Type).toBe(
        'AWS::CloudWatch::Dashboard'
      );
    });

    test('ProcessingDashboard should have dashboard body', () => {
      const dashboard = template.Resources.ProcessingDashboard;
      expect(dashboard.Properties.DashboardBody).toBeDefined();
    });
  });

  describe('Lambda Permission', () => {
    test('should have S3InvokePermission', () => {
      expect(template.Resources.S3InvokePermission).toBeDefined();
      expect(template.Resources.S3InvokePermission.Type).toBe(
        'AWS::Lambda::Permission'
      );
    });

    test('S3InvokePermission should allow S3 to invoke Lambda', () => {
      const permission = template.Resources.S3InvokePermission;
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
    });

    test('S3InvokePermission should have correct source ARN', () => {
      const permission = template.Resources.S3InvokePermission;
      expect(permission.Properties.SourceArn).toBeDefined();
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'UploadBucketName',
        'ProcessedBucketName',
        'LambdaFunctionArn',
        'ErrorNotificationTopicArn',
        'DashboardURL',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('UploadBucketName output should be correct', () => {
      const output = template.Outputs.UploadBucketName;
      expect(output.Description).toContain('upload');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('ProcessedBucketName output should be correct', () => {
      const output = template.Outputs.ProcessedBucketName;
      expect(output.Description).toContain('processed');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toContain('Lambda');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('ErrorNotificationTopicArn output should be correct', () => {
      const output = template.Outputs.ErrorNotificationTopicArn;
      expect(output.Description).toContain('SNS');
      expect(output.Value).toBeDefined();
      expect(output.Export).toBeDefined();
    });

    test('DashboardURL output should be correct', () => {
      const output = template.Outputs.DashboardURL;
      expect(output.Description).toContain('Dashboard');
      expect(output.Value).toBeDefined();
    });
  });

  describe('Resource Count', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(14);
    });

    test('should have 3 parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(3);
    });

    test('should have 5 outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5);
    });
  });

  describe('Security Best Practices', () => {
    test('all S3 buckets should have encryption', () => {
      const uploadBucket = template.Resources.UploadBucket;
      const processedBucket = template.Resources.ProcessedBucket;

      expect(uploadBucket.Properties.BucketEncryption).toBeDefined();
      expect(processedBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('all S3 buckets should block public access', () => {
      const uploadBucket = template.Resources.UploadBucket;
      const processedBucket = template.Resources.ProcessedBucket;

      expect(
        uploadBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        processedBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
    });

    test('IAM role should follow least privilege principle', () => {
      const role = template.Resources.ImageProcessorRole;
      const policies = role.Properties.Policies;

      expect(policies.length).toBe(3);

      const s3Policy = policies.find((p: any) => p.PolicyName === 'S3AccessPolicy');
      expect(s3Policy.PolicyDocument.Statement.length).toBe(2);
    });
  });

  describe('Monitoring and Observability', () => {
    test('should have CloudWatch alarms for errors', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
    });

    test('should have CloudWatch alarms for throttles', () => {
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.ProcessingDashboard).toBeDefined();
    });

    test('should have SNS topics for notifications', () => {
      expect(template.Resources.ErrorNotificationTopic).toBeDefined();
      expect(template.Resources.ProcessingAlarmTopic).toBeDefined();
    });

    test('should have log group with retention', () => {
      const logGroup = template.Resources.ImageProcessorFunctionLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });
  });
});
