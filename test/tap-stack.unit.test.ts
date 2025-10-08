import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Image Processing CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // If you're testing a yaml template, run `pipenv run cfn-flip-to-json > lib/TapStack.json`
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
        'Serverless Image Processing System with S3, Lambda, DynamoDB, and CloudWatch'
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
      expect(envSuffixParam.Description).toBe(
        'Environment suffix to append to resource names (e.g., dev, staging, prod)'
      );
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
    });

    test('NotificationEmail parameter should have correct properties', () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.Default).toBe('admin@example.com');
      expect(emailParam.Description).toBe('Email address for SNS notifications');
      expect(emailParam.AllowedPattern).toBe(
        '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$'
      );
      expect(emailParam.ConstraintDescription).toBe('Must be a valid email address');
    });

    test('should have exactly two parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });
  });

  describe('Resources', () => {
    describe('S3 Bucket', () => {
      test('should have ImageStorageBucket resource', () => {
        expect(template.Resources.ImageStorageBucket).toBeDefined();
      });

      test('ImageStorageBucket should be an S3 bucket', () => {
        const bucket = template.Resources.ImageStorageBucket;
        expect(bucket.Type).toBe('AWS::S3::Bucket');
      });

      test('ImageStorageBucket should have correct bucket name', () => {
        const bucket = template.Resources.ImageStorageBucket;
        expect(bucket.Properties.BucketName).toEqual({
          'Fn::Sub': 'image-storage-bucket-${EnvironmentSuffix}-${AWS::AccountId}',
        });
      });

      test('ImageStorageBucket should have encryption enabled', () => {
        const bucket = template.Resources.ImageStorageBucket;
        const encryption = bucket.Properties.BucketEncryption;
        expect(encryption).toBeDefined();
        expect(
          encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm
        ).toBe('AES256');
      });

      test('ImageStorageBucket should have versioning enabled', () => {
        const bucket = template.Resources.ImageStorageBucket;
        expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
      });

      test('ImageStorageBucket should block public access', () => {
        const bucket = template.Resources.ImageStorageBucket;
        const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccess.BlockPublicAcls).toBe(true);
        expect(publicAccess.BlockPublicPolicy).toBe(true);
        expect(publicAccess.IgnorePublicAcls).toBe(true);
        expect(publicAccess.RestrictPublicBuckets).toBe(true);
      });

      test('ImageStorageBucket should have lifecycle rules', () => {
        const bucket = template.Resources.ImageStorageBucket;
        const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
        expect(lifecycleRules).toHaveLength(1);
        expect(lifecycleRules[0].Id).toBe('DeleteOldVersions');
        expect(lifecycleRules[0].Status).toBe('Enabled');
        expect(lifecycleRules[0].NoncurrentVersionExpirationInDays).toBe(30);
      });

      test('ImageStorageBucket should have correct tags', () => {
        const bucket = template.Resources.ImageStorageBucket;
        const tags = bucket.Properties.Tags;
        expect(tags).toContainEqual({
          Key: 'Environment',
          Value: { Ref: 'EnvironmentSuffix' },
        });
        expect(tags).toContainEqual({
          Key: 'Purpose',
          Value: 'ImageStorage',
        });
      });
    });

    describe('S3 Bucket Policy', () => {
      test('should have ImageStorageBucketPolicy resource', () => {
        expect(template.Resources.ImageStorageBucketPolicy).toBeDefined();
      });

      test('ImageStorageBucketPolicy should deny insecure transport', () => {
        const policy = template.Resources.ImageStorageBucketPolicy;
        const statement = policy.Properties.PolicyDocument.Statement[0];
        expect(statement.Sid).toBe('DenyInsecureTransport');
        expect(statement.Effect).toBe('Deny');
        expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
      });
    });

    describe('DynamoDB Table', () => {
      test('should have ImageMetadataTable resource', () => {
        expect(template.Resources.ImageMetadataTable).toBeDefined();
      });

      test('ImageMetadataTable should be a DynamoDB table', () => {
        const table = template.Resources.ImageMetadataTable;
        expect(table.Type).toBe('AWS::DynamoDB::Table');
      });

      test('ImageMetadataTable should have correct table name', () => {
        const table = template.Resources.ImageMetadataTable;
        expect(table.Properties.TableName).toEqual({
          'Fn::Sub': 'ImageMetadata-${EnvironmentSuffix}',
        });
      });

      test('ImageMetadataTable should use PAY_PER_REQUEST billing', () => {
        const table = template.Resources.ImageMetadataTable;
        expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      });

      test('ImageMetadataTable should have correct attribute definitions', () => {
        const table = template.Resources.ImageMetadataTable;
        const attributes = table.Properties.AttributeDefinitions;
        expect(attributes).toHaveLength(2);
        expect(attributes).toContainEqual({
          AttributeName: 'ImageId',
          AttributeType: 'S',
        });
        expect(attributes).toContainEqual({
          AttributeName: 'UploadTimestamp',
          AttributeType: 'N',
        });
      });

      test('ImageMetadataTable should have correct key schema', () => {
        const table = template.Resources.ImageMetadataTable;
        const keySchema = table.Properties.KeySchema;
        expect(keySchema).toHaveLength(1);
        expect(keySchema[0].AttributeName).toBe('ImageId');
        expect(keySchema[0].KeyType).toBe('HASH');
      });

      test('ImageMetadataTable should have UploadTimestampIndex GSI', () => {
        const table = template.Resources.ImageMetadataTable;
        const gsi = table.Properties.GlobalSecondaryIndexes;
        expect(gsi).toHaveLength(1);
        expect(gsi[0].IndexName).toBe('UploadTimestampIndex');
        expect(gsi[0].KeySchema[0].AttributeName).toBe('UploadTimestamp');
        expect(gsi[0].Projection.ProjectionType).toBe('ALL');
      });

      test('ImageMetadataTable should have point-in-time recovery enabled', () => {
        const table = template.Resources.ImageMetadataTable;
        expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(
          true
        );
      });

      test('ImageMetadataTable should have SSE enabled', () => {
        const table = template.Resources.ImageMetadataTable;
        expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
      });

      test('ImageMetadataTable should have correct tags', () => {
        const table = template.Resources.ImageMetadataTable;
        const tags = table.Properties.Tags;
        expect(tags).toContainEqual({
          Key: 'Environment',
          Value: { Ref: 'EnvironmentSuffix' },
        });
        expect(tags).toContainEqual({
          Key: 'Purpose',
          Value: 'ImageMetadata',
        });
      });
    });

    describe('SNS Topic', () => {
      test('should have ProcessingNotificationTopic resource', () => {
        expect(template.Resources.ProcessingNotificationTopic).toBeDefined();
      });

      test('ProcessingNotificationTopic should be an SNS topic', () => {
        const topic = template.Resources.ProcessingNotificationTopic;
        expect(topic.Type).toBe('AWS::SNS::Topic');
      });

      test('ProcessingNotificationTopic should have correct topic name', () => {
        const topic = template.Resources.ProcessingNotificationTopic;
        expect(topic.Properties.TopicName).toEqual({
          'Fn::Sub': 'ImageProcessingNotifications-${EnvironmentSuffix}',
        });
      });

      test('ProcessingNotificationTopic should have email subscription', () => {
        const topic = template.Resources.ProcessingNotificationTopic;
        const subscription = topic.Properties.Subscription[0];
        expect(subscription.Endpoint).toEqual({ Ref: 'NotificationEmail' });
        expect(subscription.Protocol).toBe('email');
      });

      test('ProcessingNotificationTopic should have correct tags', () => {
        const topic = template.Resources.ProcessingNotificationTopic;
        const tags = topic.Properties.Tags;
        expect(tags).toContainEqual({
          Key: 'Environment',
          Value: { Ref: 'EnvironmentSuffix' },
        });
      });
    });

    describe('IAM Role', () => {
      test('should have LambdaExecutionRole resource', () => {
        expect(template.Resources.LambdaExecutionRole).toBeDefined();
      });

      test('LambdaExecutionRole should be an IAM role', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Type).toBe('AWS::IAM::Role');
      });

      test('LambdaExecutionRole should have correct assume role policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        const assumePolicy = role.Properties.AssumeRolePolicyDocument;
        expect(assumePolicy.Statement[0].Effect).toBe('Allow');
        expect(assumePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
        expect(assumePolicy.Statement[0].Action).toBe('sts:AssumeRole');
      });

      test('LambdaExecutionRole should have basic execution policy', () => {
        const role = template.Resources.LambdaExecutionRole;
        const managedPolicies = role.Properties.ManagedPolicyArns;
        expect(managedPolicies).toContain(
          'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
        );
      });

      test('LambdaExecutionRole should have S3 permissions', () => {
        const role = template.Resources.LambdaExecutionRole;
        const policy = role.Properties.Policies[0];
        const s3Statement = policy.PolicyDocument.Statement.find(
          (s: any) => s.Resource && s.Resource['Fn::Sub'] && s.Resource['Fn::Sub'].includes('s3')
        );
        expect(s3Statement).toBeDefined();
        expect(s3Statement.Action).toContain('s3:GetObject');
        expect(s3Statement.Action).toContain('s3:PutObject');
      });

      test('LambdaExecutionRole should have DynamoDB permissions', () => {
        const role = template.Resources.LambdaExecutionRole;
        const policy = role.Properties.Policies[0];
        const dynamoStatement = policy.PolicyDocument.Statement.find(
          (s: any) => s.Action && s.Action.includes('dynamodb:PutItem')
        );
        expect(dynamoStatement).toBeDefined();
        expect(dynamoStatement.Action).toContain('dynamodb:PutItem');
        expect(dynamoStatement.Action).toContain('dynamodb:UpdateItem');
        expect(dynamoStatement.Action).toContain('dynamodb:GetItem');
      });

      test('LambdaExecutionRole should have SNS publish permission', () => {
        const role = template.Resources.LambdaExecutionRole;
        const policy = role.Properties.Policies[0];
        const snsStatement = policy.PolicyDocument.Statement.find(
          (s: any) => s.Action && s.Action.includes('sns:Publish')
        );
        expect(snsStatement).toBeDefined();
      });

      test('LambdaExecutionRole should not have hardcoded role name', () => {
        const role = template.Resources.LambdaExecutionRole;
        expect(role.Properties.RoleName).toBeUndefined();
      });

      test('LambdaExecutionRole should have correct tags', () => {
        const role = template.Resources.LambdaExecutionRole;
        const tags = role.Properties.Tags;
        expect(tags).toContainEqual({
          Key: 'Environment',
          Value: { Ref: 'EnvironmentSuffix' },
        });
      });
    });

    describe('Lambda Function', () => {
      test('should have ImageProcessorLambda resource', () => {
        expect(template.Resources.ImageProcessorLambda).toBeDefined();
      });

      test('ImageProcessorLambda should be a Lambda function', () => {
        const lambda = template.Resources.ImageProcessorLambda;
        expect(lambda.Type).toBe('AWS::Lambda::Function');
      });

      test('ImageProcessorLambda should have correct function name', () => {
        const lambda = template.Resources.ImageProcessorLambda;
        expect(lambda.Properties.FunctionName).toEqual({
          'Fn::Sub': 'ImageProcessor-${EnvironmentSuffix}',
        });
      });

      test('ImageProcessorLambda should use Python 3.9 runtime', () => {
        const lambda = template.Resources.ImageProcessorLambda;
        expect(lambda.Properties.Runtime).toBe('python3.9');
      });

      test('ImageProcessorLambda should have correct handler', () => {
        const lambda = template.Resources.ImageProcessorLambda;
        expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      });

      test('ImageProcessorLambda should have correct timeout', () => {
        const lambda = template.Resources.ImageProcessorLambda;
        expect(lambda.Properties.Timeout).toBe(60);
      });

      test('ImageProcessorLambda should have correct memory size', () => {
        const lambda = template.Resources.ImageProcessorLambda;
        expect(lambda.Properties.MemorySize).toBe(512);
      });

      test('ImageProcessorLambda should have environment variables', () => {
        const lambda = template.Resources.ImageProcessorLambda;
        const envVars = lambda.Properties.Environment.Variables;
        expect(envVars.METADATA_TABLE).toEqual({ Ref: 'ImageMetadataTable' });
        expect(envVars.SNS_TOPIC_ARN).toEqual({ Ref: 'ProcessingNotificationTopic' });
        expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
      });

      test('ImageProcessorLambda should have inline code', () => {
        const lambda = template.Resources.ImageProcessorLambda;
        expect(lambda.Properties.Code.ZipFile).toBeDefined();
        expect(lambda.Properties.Code.ZipFile).toContain('lambda_handler');
      });

      test('ImageProcessorLambda should have correct tags', () => {
        const lambda = template.Resources.ImageProcessorLambda;
        const tags = lambda.Properties.Tags;
        expect(tags).toContainEqual({
          Key: 'Environment',
          Value: { Ref: 'EnvironmentSuffix' },
        });
      });
    });

    describe('Lambda Permission', () => {
      test('should have LambdaInvokePermission resource', () => {
        expect(template.Resources.LambdaInvokePermission).toBeDefined();
      });

      test('LambdaInvokePermission should be a Lambda permission', () => {
        const permission = template.Resources.LambdaInvokePermission;
        expect(permission.Type).toBe('AWS::Lambda::Permission');
      });

      test('LambdaInvokePermission should allow S3 to invoke Lambda', () => {
        const permission = template.Resources.LambdaInvokePermission;
        expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
        expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      });

      test('LambdaInvokePermission should reference correct function', () => {
        const permission = template.Resources.LambdaInvokePermission;
        expect(permission.Properties.FunctionName).toEqual({ Ref: 'ImageProcessorLambda' });
      });

      test('LambdaInvokePermission should have correct source ARN', () => {
        const permission = template.Resources.LambdaInvokePermission;
        expect(permission.Properties.SourceArn).toEqual({
          'Fn::Sub': 'arn:aws:s3:::image-storage-bucket-${EnvironmentSuffix}-${AWS::AccountId}',
        });
      });
    });

    describe('Custom Resource for S3 Notifications', () => {
      test('should have S3BucketNotification resource', () => {
        expect(template.Resources.S3BucketNotification).toBeDefined();
      });

      test('should have S3NotificationLambdaRole resource', () => {
        expect(template.Resources.S3NotificationLambdaRole).toBeDefined();
      });

      test('should have S3NotificationLambda resource', () => {
        expect(template.Resources.S3NotificationLambda).toBeDefined();
      });

      test('S3BucketNotification should depend on LambdaInvokePermission', () => {
        const notification = template.Resources.S3BucketNotification;
        expect(notification.DependsOn).toContain('LambdaInvokePermission');
      });

      test('S3NotificationLambda should have S3 notification permissions', () => {
        const role = template.Resources.S3NotificationLambdaRole;
        const policy = role.Properties.Policies[0];
        const s3Statement = policy.PolicyDocument.Statement[0];
        expect(s3Statement.Action).toContain('s3:PutBucketNotification');
        expect(s3Statement.Action).toContain('s3:GetBucketNotification');
      });
    });

    describe('CloudWatch Resources', () => {
      test('should have LambdaLogGroup resource', () => {
        expect(template.Resources.LambdaLogGroup).toBeDefined();
      });

      test('LambdaLogGroup should have 30 day retention', () => {
        const logGroup = template.Resources.LambdaLogGroup;
        expect(logGroup.Properties.RetentionInDays).toBe(30);
      });

      test('should have LambdaErrorAlarm resource', () => {
        expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      });

      test('LambdaErrorAlarm should monitor Lambda errors', () => {
        const alarm = template.Resources.LambdaErrorAlarm;
        expect(alarm.Properties.MetricName).toBe('Errors');
        expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
        expect(alarm.Properties.Threshold).toBe(5);
      });

      test('should have LambdaThrottleAlarm resource', () => {
        expect(template.Resources.LambdaThrottleAlarm).toBeDefined();
      });

      test('LambdaThrottleAlarm should monitor Lambda throttles', () => {
        const alarm = template.Resources.LambdaThrottleAlarm;
        expect(alarm.Properties.MetricName).toBe('Throttles');
        expect(alarm.Properties.Threshold).toBe(1);
      });

      test('should have DynamoDBThrottleAlarm resource', () => {
        expect(template.Resources.DynamoDBThrottleAlarm).toBeDefined();
      });

      test('DynamoDBThrottleAlarm should monitor write throttles', () => {
        const alarm = template.Resources.DynamoDBThrottleAlarm;
        expect(alarm.Properties.MetricName).toBe('WriteThrottleEvents');
        expect(alarm.Properties.Namespace).toBe('AWS/DynamoDB');
      });

      test('should have MonitoringDashboard resource', () => {
        expect(template.Resources.MonitoringDashboard).toBeDefined();
      });

      test('MonitoringDashboard should have correct dashboard name', () => {
        const dashboard = template.Resources.MonitoringDashboard;
        expect(dashboard.Properties.DashboardName).toEqual({
          'Fn::Sub': 'ImageProcessing-${EnvironmentSuffix}',
        });
      });

      test('MonitoringDashboard should have dashboard body', () => {
        const dashboard = template.Resources.MonitoringDashboard;
        expect(dashboard.Properties.DashboardBody).toBeDefined();
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'S3BucketName',
        'DynamoDBTableName',
        'LambdaFunctionArn',
        'SNSTopicArn',
        'DashboardURL',
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('S3BucketName output should be correct', () => {
      const output = template.Outputs.S3BucketName;
      expect(output.Description).toBe('Name of the S3 bucket for image storage');
      expect(output.Value).toEqual({ Ref: 'ImageStorageBucket' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-S3Bucket',
      });
    });

    test('DynamoDBTableName output should be correct', () => {
      const output = template.Outputs.DynamoDBTableName;
      expect(output.Description).toBe('Name of the DynamoDB table for metadata');
      expect(output.Value).toEqual({ Ref: 'ImageMetadataTable' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-DynamoDBTable',
      });
    });

    test('LambdaFunctionArn output should be correct', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Description).toBe('ARN of the Lambda function');
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ImageProcessorLambda', 'Arn'],
      });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-LambdaArn',
      });
    });

    test('SNSTopicArn output should be correct', () => {
      const output = template.Outputs.SNSTopicArn;
      expect(output.Description).toBe('ARN of the SNS topic for notifications');
      expect(output.Value).toEqual({ Ref: 'ProcessingNotificationTopic' });
      expect(output.Export.Name).toEqual({
        'Fn::Sub': '${AWS::StackName}-SNSTopic',
      });
    });

    test('DashboardURL output should be correct', () => {
      const output = template.Outputs.DashboardURL;
      expect(output.Description).toBe('URL to CloudWatch Dashboard');
      expect(output.Value).toEqual({
        'Fn::Sub':
          'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=ImageProcessing-${EnvironmentSuffix}',
      });
    });

    test('should have exactly five outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(5);
    });
  });

  describe('Resource Naming Convention', () => {
    test('S3 bucket name should follow naming convention with environment suffix', () => {
      const bucket = template.Resources.ImageStorageBucket;
      const bucketName = bucket.Properties.BucketName;

      expect(bucketName).toEqual({
        'Fn::Sub': 'image-storage-bucket-${EnvironmentSuffix}-${AWS::AccountId}',
      });
    });

    test('DynamoDB table name should follow naming convention with environment suffix', () => {
      const table = template.Resources.ImageMetadataTable;
      const tableName = table.Properties.TableName;

      expect(tableName).toEqual({
        'Fn::Sub': 'ImageMetadata-${EnvironmentSuffix}',
      });
    });

    test('Lambda function name should follow naming convention with environment suffix', () => {
      const lambda = template.Resources.ImageProcessorLambda;
      const functionName = lambda.Properties.FunctionName;

      expect(functionName).toEqual({
        'Fn::Sub': 'ImageProcessor-${EnvironmentSuffix}',
      });
    });

    test('SNS topic name should follow naming convention with environment suffix', () => {
      const topic = template.Resources.ProcessingNotificationTopic;
      const topicName = topic.Properties.TopicName;

      expect(topicName).toEqual({
        'Fn::Sub': 'ImageProcessingNotifications-${EnvironmentSuffix}',
      });
    });

    test('export names should follow naming convention', () => {
      const expectedExports = {
        S3BucketName: '${AWS::StackName}-S3Bucket',
        DynamoDBTableName: '${AWS::StackName}-DynamoDBTable',
        LambdaFunctionArn: '${AWS::StackName}-LambdaArn',
        SNSTopicArn: '${AWS::StackName}-SNSTopic',
      };

      Object.entries(expectedExports).forEach(([outputKey, exportName]) => {
        const output = template.Outputs[outputKey];
        expect(output.Export.Name).toEqual({
          'Fn::Sub': exportName,
        });
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

    test('all resources should have Type property', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Type).toBeDefined();
        expect(typeof resource.Type).toBe('string');
      });
    });

    test('all resources should have Properties', () => {
      Object.keys(template.Resources).forEach(resourceKey => {
        const resource = template.Resources[resourceKey];
        expect(resource.Properties).toBeDefined();
      });
    });

    test('all outputs should have Description and Value', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Description).toBeDefined();
        expect(output.Value).toBeDefined();
      });
    });

    test('all IAM roles should not have hardcoded role names', () => {
      const iamRoles = Object.keys(template.Resources).filter(
        key => template.Resources[key].Type === 'AWS::IAM::Role'
      );

      iamRoles.forEach(roleKey => {
        const role = template.Resources[roleKey];
        expect(role.Properties.RoleName).toBeUndefined();
      });
    });

    test('environment suffix parameter should not have AllowedValues', () => {
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.AllowedValues).toBeUndefined();
    });
  });

  describe('Security Best Practices', () => {
    test('S3 bucket should enforce encryption', () => {
      const bucket = template.Resources.ImageStorageBucket;
      expect(bucket.Properties.BucketEncryption).toBeDefined();
    });

    test('S3 bucket should block all public access', () => {
      const bucket = template.Resources.ImageStorageBucket;
      const publicAccess = bucket.Properties.PublicAccessBlockConfiguration;
      expect(publicAccess.BlockPublicAcls).toBe(true);
      expect(publicAccess.BlockPublicPolicy).toBe(true);
      expect(publicAccess.IgnorePublicAcls).toBe(true);
      expect(publicAccess.RestrictPublicBuckets).toBe(true);
    });

    test('S3 bucket policy should deny insecure transport', () => {
      const policy = template.Resources.ImageStorageBucketPolicy;
      const statement = policy.Properties.PolicyDocument.Statement[0];
      expect(statement.Effect).toBe('Deny');
      expect(statement.Condition.Bool['aws:SecureTransport']).toBe(false);
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.ImageMetadataTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('DynamoDB table should have point-in-time recovery', () => {
      const table = template.Resources.ImageMetadataTable;
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(
        true
      );
    });

    test('Lambda execution role should follow least privilege principle', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies;
      expect(policies).toHaveLength(1);

      const policy = policies[0];
      const statements = policy.PolicyDocument.Statement;

      // Should have specific actions, not wildcard
      statements.forEach((statement: any) => {
        expect(statement.Action).toBeDefined();
        if (Array.isArray(statement.Action)) {
          statement.Action.forEach((action: string) => {
            expect(action).not.toBe('*');
          });
        } else {
          expect(statement.Action).not.toBe('*');
        }
      });
    });

    test('Lambda function should not have reserved concurrent executions set to unlimited', () => {
      const lambda = template.Resources.ImageProcessorLambda;
      // ReservedConcurrentExecutions should either be undefined or a specific number
      // If undefined, it uses account-level concurrency limits
      if (lambda.Properties.ReservedConcurrentExecutions !== undefined) {
        expect(typeof lambda.Properties.ReservedConcurrentExecutions).toBe('number');
      }
    });
  });

  describe('High Availability and Resilience', () => {
    test('DynamoDB table should use on-demand billing for auto-scaling', () => {
      const table = template.Resources.ImageMetadataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('S3 bucket should have versioning enabled for data protection', () => {
      const bucket = template.Resources.ImageStorageBucket;
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('Lambda function should have appropriate timeout', () => {
      const lambda = template.Resources.ImageProcessorLambda;
      const timeout = lambda.Properties.Timeout;
      expect(timeout).toBeGreaterThan(0);
      expect(timeout).toBeLessThanOrEqual(900); // Max Lambda timeout
    });

    test('Lambda function should have appropriate memory allocation', () => {
      const lambda = template.Resources.ImageProcessorLambda;
      const memory = lambda.Properties.MemorySize;
      expect(memory).toBeGreaterThanOrEqual(128);
      expect(memory).toBeLessThanOrEqual(10240);
    });

    test('CloudWatch alarms should have SNS notification actions', () => {
      const alarms = ['LambdaErrorAlarm', 'LambdaThrottleAlarm', 'DynamoDBThrottleAlarm'];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.AlarmActions).toBeDefined();
        expect(alarm.Properties.AlarmActions).toContainEqual({ Ref: 'ProcessingNotificationTopic' });
      });
    });

    test('CloudWatch log group should have retention policy', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBeGreaterThan(0);
    });
  });

  describe('Monitoring and Observability', () => {
    test('should have CloudWatch alarms for Lambda errors', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have CloudWatch alarms for Lambda throttles', () => {
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Throttles');
    });

    test('should have CloudWatch alarms for DynamoDB throttles', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm;
      expect(alarm).toBeDefined();
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('WriteThrottleEvents');
    });

    test('CloudWatch alarms should have appropriate evaluation periods', () => {
      const alarms = ['LambdaErrorAlarm', 'LambdaThrottleAlarm', 'DynamoDBThrottleAlarm'];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        expect(alarm.Properties.EvaluationPeriods).toBeGreaterThan(0);
        expect(alarm.Properties.Period).toBeGreaterThan(0);
      });
    });

    test('should have CloudWatch dashboard for visualization', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      expect(dashboard).toBeDefined();
      expect(dashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('CloudWatch dashboard should contain Lambda metrics', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      const dashboardBody = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(dashboardBody).toContain('AWS/Lambda');
      expect(dashboardBody).toContain('Invocations');
      expect(dashboardBody).toContain('Errors');
      expect(dashboardBody).toContain('Duration');
    });

    test('CloudWatch dashboard should contain DynamoDB metrics', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      const dashboardBody = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(dashboardBody).toContain('AWS/DynamoDB');
      expect(dashboardBody).toContain('ConsumedWriteCapacityUnits');
    });

    test('CloudWatch dashboard should contain S3 metrics', () => {
      const dashboard = template.Resources.MonitoringDashboard;
      const dashboardBody = dashboard.Properties.DashboardBody['Fn::Sub'];
      expect(dashboardBody).toContain('AWS/S3');
      expect(dashboardBody).toContain('NumberOfObjects');
    });

    test('Lambda function should have dedicated log group', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup).toBeDefined();
      expect(logGroup.Properties.LogGroupName).toEqual({
        'Fn::Sub': '/aws/lambda/ImageProcessor-${EnvironmentSuffix}',
      });
    });
  });

  describe('Cost Optimization', () => {
    test('DynamoDB should use PAY_PER_REQUEST for cost efficiency', () => {
      const table = template.Resources.ImageMetadataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('S3 lifecycle policy should delete old versions to save costs', () => {
      const bucket = template.Resources.ImageStorageBucket;
      const rules = bucket.Properties.LifecycleConfiguration.Rules;
      const deleteRule = rules.find((r: any) => r.Id === 'DeleteOldVersions');
      expect(deleteRule).toBeDefined();
      expect(deleteRule.Status).toBe('Enabled');
      expect(deleteRule.NoncurrentVersionExpirationInDays).toBe(30);
    });

    test('CloudWatch logs should have retention to control costs', () => {
      const logGroup = template.Resources.LambdaLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBe(30);
    });

    test('Lambda function should have appropriate memory size', () => {
      const lambda = template.Resources.ImageProcessorLambda;
      // 512 MB is a reasonable balance between performance and cost
      expect(lambda.Properties.MemorySize).toBe(512);
    });
  });

  describe('Tagging Strategy', () => {
    test('S3 bucket should have environment and purpose tags', () => {
      const bucket = template.Resources.ImageStorageBucket;
      const tags = bucket.Properties.Tags;

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const purposeTag = tags.find((t: any) => t.Key === 'Purpose');

      expect(envTag).toBeDefined();
      expect(purposeTag).toBeDefined();
      expect(purposeTag.Value).toBe('ImageStorage');
    });

    test('DynamoDB table should have environment and purpose tags', () => {
      const table = template.Resources.ImageMetadataTable;
      const tags = table.Properties.Tags;

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      const purposeTag = tags.find((t: any) => t.Key === 'Purpose');

      expect(envTag).toBeDefined();
      expect(purposeTag).toBeDefined();
      expect(purposeTag.Value).toBe('ImageMetadata');
    });

    test('Lambda function should have environment tag', () => {
      const lambda = template.Resources.ImageProcessorLambda;
      const tags = lambda.Properties.Tags;

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
    });

    test('SNS topic should have environment tag', () => {
      const topic = template.Resources.ProcessingNotificationTopic;
      const tags = topic.Properties.Tags;

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
    });

    test('IAM role should have environment tag', () => {
      const role = template.Resources.LambdaExecutionRole;
      const tags = role.Properties.Tags;

      const envTag = tags.find((t: any) => t.Key === 'Environment');
      expect(envTag).toBeDefined();
    });
  });

  describe('Integration Between Resources', () => {
    test('Lambda should reference correct DynamoDB table via environment variable', () => {
      const lambda = template.Resources.ImageProcessorLambda;
      expect(lambda.Properties.Environment.Variables.METADATA_TABLE).toEqual({
        Ref: 'ImageMetadataTable',
      });
    });

    test('Lambda should reference correct SNS topic via environment variable', () => {
      const lambda = template.Resources.ImageProcessorLambda;
      expect(lambda.Properties.Environment.Variables.SNS_TOPIC_ARN).toEqual({
        Ref: 'ProcessingNotificationTopic',
      });
    });

    test('Lambda execution role should grant access to correct S3 bucket', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const s3Statement = policy.PolicyDocument.Statement.find(
        (s: any) => s.Resource && s.Resource['Fn::Sub'] && s.Resource['Fn::Sub'].includes('s3')
      );
      expect(s3Statement.Resource['Fn::Sub']).toContain('image-storage-bucket-${EnvironmentSuffix}');
    });

    test('Lambda execution role should grant access to correct DynamoDB table', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const dynamoStatement = policy.PolicyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement.Resource).toEqual({
        'Fn::GetAtt': ['ImageMetadataTable', 'Arn'],
      });
    });

    test('Lambda execution role should grant access to correct SNS topic', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policy = role.Properties.Policies[0];
      const snsStatement = policy.PolicyDocument.Statement.find(
        (s: any) => s.Action && s.Action.includes('sns:Publish')
      );
      expect(snsStatement.Resource).toEqual({ Ref: 'ProcessingNotificationTopic' });
    });

    test('Lambda should use correct execution role', () => {
      const lambda = template.Resources.ImageProcessorLambda;
      expect(lambda.Properties.Role).toEqual({
        'Fn::GetAtt': ['LambdaExecutionRole', 'Arn'],
      });
    });

    test('S3 bucket policy should reference correct bucket', () => {
      const policy = template.Resources.ImageStorageBucketPolicy;
      expect(policy.Properties.Bucket).toEqual({ Ref: 'ImageStorageBucket' });
    });

    test('Lambda permission should reference correct S3 bucket ARN', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Properties.SourceArn['Fn::Sub']).toContain(
        'image-storage-bucket-${EnvironmentSuffix}'
      );
    });

    test('CloudWatch alarms should monitor correct Lambda function', () => {
      const alarms = ['LambdaErrorAlarm', 'LambdaThrottleAlarm'];

      alarms.forEach(alarmName => {
        const alarm = template.Resources[alarmName];
        const dimension = alarm.Properties.Dimensions.find((d: any) => d.Name === 'FunctionName');
        expect(dimension.Value).toEqual({ Ref: 'ImageProcessorLambda' });
      });
    });

    test('DynamoDB alarm should monitor correct table', () => {
      const alarm = template.Resources.DynamoDBThrottleAlarm;
      const dimension = alarm.Properties.Dimensions.find((d: any) => d.Name === 'TableName');
      expect(dimension.Value).toEqual({ Ref: 'ImageMetadataTable' });
    });

    test('Log group name should match Lambda function name', () => {
      const lambda = template.Resources.ImageProcessorLambda;
      const logGroup = template.Resources.LambdaLogGroup;

      expect(logGroup.Properties.LogGroupName['Fn::Sub']).toBe(
        '/aws/lambda/ImageProcessor-${EnvironmentSuffix}'
      );
      expect(lambda.Properties.FunctionName['Fn::Sub']).toBe(
        'ImageProcessor-${EnvironmentSuffix}'
      );
    });
  });

  describe('Parameter Validation', () => {
    test('NotificationEmail parameter should have email validation pattern', () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.AllowedPattern).toBeDefined();
      expect(emailParam.AllowedPattern).toContain('@');
    });

    test('EnvironmentSuffix should have default value', () => {
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Default).toBe('dev');
    });

    test('NotificationEmail should have default value', () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Default).toBe('admin@example.com');
    });

    test('all parameters should have descriptions', () => {
      Object.keys(template.Parameters).forEach(paramKey => {
        const param = template.Parameters[paramKey];
        expect(param.Description).toBeDefined();
        expect(param.Description.length).toBeGreaterThan(0);
      });
    });

    test('all parameters should have constraint descriptions where applicable', () => {
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.ConstraintDescription).toBe('Must be a valid email address');
    });
  });
});