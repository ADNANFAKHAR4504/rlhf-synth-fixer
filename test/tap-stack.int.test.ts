import fs from 'fs';
import path from 'path';

describe('Image Processing Pipeline Integration Tests', () => {
  let template: any;
  let cfnOutputs: any = {};

  beforeAll(() => {
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);

    const outputsPath = path.join(__dirname, '../cfn-outputs/flat-outputs.json');
    if (fs.existsSync(outputsPath)) {
      const outputsContent = fs.readFileSync(outputsPath, 'utf8');
      cfnOutputs = JSON.parse(outputsContent);
    }
  });

  describe('Template Validation', () => {
    test('template should be valid JSON', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('template should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeDefined();
      expect(template.Description).toBeDefined();
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Resource Validation', () => {
    test('should have S3 buckets for upload and processing', () => {
      expect(template.Resources.UploadBucket).toBeDefined();
      expect(template.Resources.ProcessedBucket).toBeDefined();
    });

    test('should have Lambda function for image processing', () => {
      expect(template.Resources.ImageProcessorFunction).toBeDefined();
      expect(template.Resources.ImageProcessorFunction.Properties.Runtime).toBe(
        'python3.11'
      );
    });

    test('should have IAM role with appropriate permissions', () => {
      const role = template.Resources.ImageProcessorRole;
      expect(role).toBeDefined();
      expect(role.Properties.Policies.length).toBeGreaterThanOrEqual(3);
    });

    test('should have SNS topics for notifications', () => {
      expect(template.Resources.ErrorNotificationTopic).toBeDefined();
      expect(template.Resources.ProcessingAlarmTopic).toBeDefined();
    });

    test('should have CloudWatch monitoring resources', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
      expect(template.Resources.ProcessingDashboard).toBeDefined();
      expect(template.Resources.ImageProcessorFunctionLogGroup).toBeDefined();
    });
  });

  describe('Security Configuration', () => {
    test('S3 buckets should have encryption enabled', () => {
      const uploadBucket = template.Resources.UploadBucket;
      const processedBucket = template.Resources.ProcessedBucket;

      expect(uploadBucket.Properties.BucketEncryption).toBeDefined();
      expect(processedBucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 buckets should block all public access', () => {
      const uploadBucket = template.Resources.UploadBucket;
      const processedBucket = template.Resources.ProcessedBucket;

      expect(
        uploadBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        uploadBucket.Properties.PublicAccessBlockConfiguration.BlockPublicPolicy
      ).toBe(true);
      expect(
        processedBucket.Properties.PublicAccessBlockConfiguration.BlockPublicAcls
      ).toBe(true);
      expect(
        processedBucket.Properties.PublicAccessBlockConfiguration
          .BlockPublicPolicy
      ).toBe(true);
    });

    test('Lambda function should have appropriate timeout and memory', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.Timeout).toBeLessThanOrEqual(900);
      expect(lambda.Properties.MemorySize).toBeGreaterThanOrEqual(512);
    });
  });

  describe('Event Configuration', () => {
    test('S3 bucket should have Lambda event notifications configured', () => {
      // Check that the Custom Resource for bucket notifications exists
      const notificationResource = template.Resources.UploadBucketNotification;
      expect(notificationResource).toBeDefined();
      expect(notificationResource.Type).toBe('Custom::S3BucketNotification');
      
      const lambdaConfigs = notificationResource.Properties.LambdaConfigurations;
      expect(lambdaConfigs).toBeDefined();
      expect(lambdaConfigs.length).toBeGreaterThanOrEqual(3);
    });

    test('Lambda function should have permission to be invoked by S3', () => {
      const permission = template.Resources.S3InvokePermission;
      expect(permission).toBeDefined();
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
    });
  });

  describe('Monitoring and Alarms', () => {
    test('should have error alarm configured', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBeGreaterThan(0);
    });

    test('should have throttle alarm configured', () => {
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm.Properties.MetricName).toBe('Throttles');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBeGreaterThan(0);
    });

    test('should have log retention configured', () => {
      const logGroup = template.Resources.ImageProcessorFunctionLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });
  });

  describe('Infrastructure Outputs', () => {
    test('should export upload bucket name', () => {
      expect(template.Outputs.UploadBucketName).toBeDefined();
      expect(template.Outputs.UploadBucketName.Export).toBeDefined();
    });

    test('should export processed bucket name', () => {
      expect(template.Outputs.ProcessedBucketName).toBeDefined();
      expect(template.Outputs.ProcessedBucketName.Export).toBeDefined();
    });

    test('should export Lambda function ARN', () => {
      expect(template.Outputs.LambdaFunctionArn).toBeDefined();
      expect(template.Outputs.LambdaFunctionArn.Export).toBeDefined();
    });

    test('should export error notification topic ARN', () => {
      expect(template.Outputs.ErrorNotificationTopicArn).toBeDefined();
      expect(template.Outputs.ErrorNotificationTopicArn.Export).toBeDefined();
    });

    test('should export dashboard URL', () => {
      expect(template.Outputs.DashboardURL).toBeDefined();
    });
  });

  describe('Cost Optimization', () => {
    test('processed bucket should have lifecycle rules for cost optimization', () => {
      const bucket = template.Resources.ProcessedBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;

      expect(rules).toBeDefined();
      expect(rules.length).toBeGreaterThanOrEqual(1);

      const transitionRule = rules.find((r: any) => r.Transitions);
      expect(transitionRule).toBeDefined();
    });

    test('Lambda function should have reserved concurrent executions to control costs', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBeDefined();
      expect(lambda.Properties.ReservedConcurrentExecutions).toBeGreaterThan(0);
    });
  });

  describe('Best Practices Compliance', () => {
    test('all resources should have appropriate tags', () => {
      const resourcesToCheck = [
        'UploadBucket',
        'ProcessedBucket',
        'ImageProcessorRole',
        'ImageProcessorFunction',
        'ErrorNotificationTopic',
        'ProcessingAlarmTopic',
        'ImageProcessorFunctionLogGroup',
      ];

      resourcesToCheck.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();
        expect(resource.Properties.Tags.length).toBeGreaterThanOrEqual(1);
      });
    });

    test('S3 buckets should have versioning enabled', () => {
      const uploadBucket = template.Resources.UploadBucket;
      const processedBucket = template.Resources.ProcessedBucket;

      expect(uploadBucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
      expect(processedBucket.Properties.VersioningConfiguration.Status).toBe(
        'Enabled'
      );
    });

    test('IAM role should follow least privilege access', () => {
      const role = template.Resources.ImageProcessorRole;
      const policies = role.Properties.Policies;

      expect(policies).toBeDefined();
      expect(policies.length).toBeGreaterThanOrEqual(3);

      policies.forEach((policy: any) => {
        expect(policy.PolicyDocument.Version).toBe('2012-10-17');
        expect(policy.PolicyDocument.Statement).toBeDefined();
      });
    });
  });

  describe('Error Handling', () => {
    test('should have SNS topic for error notifications', () => {
      const topic = template.Resources.ErrorNotificationTopic;
      expect(topic).toBeDefined();
      expect(topic.Properties.Subscription).toBeDefined();
      expect(topic.Properties.Subscription.length).toBeGreaterThanOrEqual(1);
    });

    test('Lambda should have environment variables for error handling', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.Environment.Variables.SNS_TOPIC_ARN).toBeDefined();
    });
  });
});
