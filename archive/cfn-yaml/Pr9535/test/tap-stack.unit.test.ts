import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Video Processing System CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Load the JSON template converted from YAML
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
      expect(template.Description).toContain('Serverless Video Processing System');
      expect(template.Description).toContain('1,500+ daily video uploads');
    });

    test('should have all required sections', () => {
      expect(template.Parameters).toBeDefined();
      expect(template.Resources).toBeDefined();
      expect(template.Outputs).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.Description).toContain('Environment suffix');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.Default).toBe('admin@example.com');
      expect(emailParam.AllowedPattern).toBeDefined();
      expect(emailParam.ConstraintDescription).toContain('valid email address');
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should have S3 bucket for video uploads', () => {
      expect(template.Resources.VideoUploadBucket).toBeDefined();
      const bucket = template.Resources.VideoUploadBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('should have proper bucket properties', () => {
      const bucket = template.Resources.VideoUploadBucket;
      const properties = bucket.Properties;

      expect(properties.BucketName).toEqual({
        'Fn::Sub': 'video-uploads-${EnvironmentSuffix}-${AWS::AccountId}'
      });

      expect(properties.BucketEncryption).toBeDefined();
      expect(properties.PublicAccessBlockConfiguration).toBeDefined();
      expect(properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have S3 event notifications configured', () => {
      const bucket = template.Resources.VideoUploadBucket;
      const notifications = bucket.Properties.NotificationConfiguration;

      expect(notifications.LambdaConfigurations).toBeDefined();
      expect(notifications.LambdaConfigurations).toHaveLength(3);

      const mp4Config = notifications.LambdaConfigurations.find(
        (config: any) => config.Filter.S3Key.Rules[0].Value === '.mp4'
      );
      expect(mp4Config).toBeDefined();
      expect(mp4Config.Event).toBe('s3:ObjectCreated:*');
    });

    test('should have bucket policy for secure transport', () => {
      expect(template.Resources.VideoUploadBucketPolicy).toBeDefined();
      const policy = template.Resources.VideoUploadBucketPolicy;
      expect(policy.Type).toBe('AWS::S3::BucketPolicy');

      const policyDoc = policy.Properties.PolicyDocument;
      expect(policyDoc.Statement[0].Sid).toBe('DenyInsecureTransport');
      expect(policyDoc.Statement[0].Effect).toBe('Deny');
    });

    test('should have lifecycle configuration', () => {
      const bucket = template.Resources.VideoUploadBucket;
      const lifecycle = bucket.Properties.LifecycleConfiguration;

      expect(lifecycle.Rules).toBeDefined();
      expect(lifecycle.Rules[0].Id).toBe('DeleteOldVersions');
      expect(lifecycle.Rules[0].NoncurrentVersionExpirationInDays).toBe(30);
    });
  });

  describe('Lambda Function Configuration', () => {
    test('should have Lambda function for video processing', () => {
      expect(template.Resources.VideoProcessingFunction).toBeDefined();
      const lambda = template.Resources.VideoProcessingFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('should have proper Lambda configuration', () => {
      const lambda = template.Resources.VideoProcessingFunction;
      const properties = lambda.Properties;

      expect(properties.Runtime).toBe('nodejs22.x');
      expect(properties.Handler).toBe('index.handler');
      expect(properties.Timeout).toBe(300);
      expect(properties.MemorySize).toBe(1024);
    });

    test('should have environment variables configured', () => {
      const lambda = template.Resources.VideoProcessingFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.SNS_TOPIC_ARN).toEqual({ Ref: 'VideoProcessingTopic' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have proper IAM role configured', () => {
      const lambda = template.Resources.VideoProcessingFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });
    });

    test('should have Lambda permission for S3 invocation', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      const permission = template.Resources.LambdaInvokePermission;

      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
    });
  });

  describe('IAM Role Configuration', () => {
    test('should have Lambda execution role', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });

    test('should have proper assume role policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const assumePolicy = role.Properties.AssumeRolePolicyDocument;

      expect(assumePolicy.Statement[0].Effect).toBe('Allow');
      expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('should have required managed policy', () => {
      const role = template.Resources.LambdaExecutionRole;
      const managedPolicies = role.Properties.ManagedPolicyArns;

      expect(managedPolicies).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('should have proper inline policy permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];

      expect(policy.PolicyName).toEqual({
        'Fn::Sub': 'VideoProcessingPolicy-${EnvironmentSuffix}'
      });

      const statements = policy.PolicyDocument.Statement;
      expect(statements).toHaveLength(5);

      // Check S3 permissions
      const s3Statement = statements.find(
        (stmt: any) => stmt.Action.includes('s3:GetObject')
      );
      expect(s3Statement).toBeDefined();
      expect(s3Statement.Action).toContain('s3:PutObjectTagging');
    });
  });

  describe('SNS Configuration', () => {
    test('should have SNS topic for notifications', () => {
      expect(template.Resources.VideoProcessingTopic).toBeDefined();
      const topic = template.Resources.VideoProcessingTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('should have SNS topic properties configured', () => {
      const topic = template.Resources.VideoProcessingTopic;
      const properties = topic.Properties;

      expect(properties.TopicName).toEqual({
        'Fn::Sub': 'video-processing-notifications-${EnvironmentSuffix}'
      });
      expect(properties.DisplayName).toBe('Video Processing Notifications');
      expect(properties.Subscription).toBeDefined();
    });

    test('should have email subscription configured', () => {
      const topic = template.Resources.VideoProcessingTopic;
      const subscriptions = topic.Properties.Subscription;

      expect(subscriptions).toHaveLength(1);
      expect(subscriptions[0].Protocol).toBe('email');
      expect(subscriptions[0].Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });

    test('should have SNS topic policy', () => {
      expect(template.Resources.VideoProcessingTopicPolicy).toBeDefined();
      const policy = template.Resources.VideoProcessingTopicPolicy;

      expect(policy.Type).toBe('AWS::SNS::TopicPolicy');
      expect(policy.Properties.Topics[0]).toEqual({ Ref: 'VideoProcessingTopic' });
    });
  });

  describe('CloudWatch Configuration', () => {
    test('should have CloudWatch log group', () => {
      expect(template.Resources.VideoProcessingLogGroup).toBeDefined();
      const logGroup = template.Resources.VideoProcessingLogGroup;

      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/video-processor-${EnvironmentSuffix}'
      });
      expect(logGroup.Properties.RetentionInDays).toBe(14);
    });

    test('should have CloudWatch dashboard', () => {
      expect(template.Resources.VideoProcessingDashboard).toBeDefined();
      const dashboard = template.Resources.VideoProcessingDashboard;

      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
      expect(dashboard.Properties.DashboardName).toEqual({
        'Fn::Sub': 'video-processing-${EnvironmentSuffix}'
      });
    });

    test('should have CloudWatch alarms', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaThrottleAlarm).toBeDefined();

      const errorAlarm = template.Resources.LambdaErrorAlarm;
      expect(errorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(errorAlarm.Properties.MetricName).toBe('Errors');
      expect(errorAlarm.Properties.Threshold).toBe(5);

      const throttleAlarm = template.Resources.LambdaThrottleAlarm;
      expect(throttleAlarm.Properties.MetricName).toBe('Throttles');
      expect(throttleAlarm.Properties.Threshold).toBe(10);
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'S3BucketArn',
        'LambdaFunctionName',
        'LambdaFunctionArn',
        'SNSTopicArn',
        'CloudWatchDashboardURL',
        'Environment'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the S3 bucket for video uploads');
      expect(output.Value).toEqual({ Ref: 'VideoUploadBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-BucketName'
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('ARN of the Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['VideoProcessingFunction', 'Arn']
      });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toBe('ARN of the SNS topic for notifications');
      expect(output.Value).toEqual({ Ref: 'VideoProcessingTopic' });
    });

    test('CloudWatchDashboardURL output should be correct', () => {
      const output = template.Outputs.CloudWatchDashboardURL;
      expect(output.Description).toBe('URL to the CloudWatch Dashboard');
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=video-processing-${EnvironmentSuffix}'
      });
    });
  });

  describe('Template Dependencies', () => {
    test('S3 bucket should depend on Lambda permission', () => {
      const bucket = template.Resources.VideoUploadBucket;
      expect(bucket.DependsOn).toBe('LambdaInvokePermission');
    });

    test('should have proper resource references', () => {
      // Lambda function references execution role
      const lambda = template.Resources.VideoProcessingFunction;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn']
      });

      // Alarms reference Lambda function
      const errorAlarm = template.Resources.LambdaErrorAlarm;
      expect(errorAlarm.Properties.Dimensions[0].Value).toEqual({
        Ref: 'VideoProcessingFunction'
      });
    });
  });

  describe('Security Best Practices', () => {
    test('should have S3 bucket encryption configured', () => {
      const bucket = template.Resources.VideoUploadBucket;
      const encryption = bucket.Properties.BucketEncryption;

      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
    });

    test('should block public S3 access', () => {
      const bucket = template.Resources.VideoUploadBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;

      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('should enforce secure transport', () => {
      const bucketPolicy = template.Resources.VideoUploadBucketPolicy;
      const statement = bucketPolicy.Properties.PolicyDocument.Statement[0];

      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });
  });

  describe('Resource Counts and Template Validation', () => {
    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(11); // All video processing resources
    });

    test('should have expected number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2); // EnvironmentSuffix and NotificationEmail
    });

    test('should have expected number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(7); // All video processing outputs
    });

    test('should not have any undefined or null required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });
  });

  describe('Naming Conventions', () => {
    test('resource names should follow video processing convention', () => {
      const resourceNames = Object.keys(template.Resources);
      const videoProcessingResources = [
        'VideoProcessingTopic',
        'VideoProcessingFunction',
        'VideoUploadBucket',
        'LambdaExecutionRole'
      ];

      videoProcessingResources.forEach(resourceName => {
        expect(resourceNames).toContain(resourceName);
      });
    });
  });
});