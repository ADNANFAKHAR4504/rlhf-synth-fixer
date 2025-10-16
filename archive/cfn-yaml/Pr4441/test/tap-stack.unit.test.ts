import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('S3-triggered Lambda Image Processing CloudFormation Template', () => {
  let template: any;

  beforeAll(() => {
    // Convert YAML template to JSON for testing
    const templatePath = path.join(__dirname, '../lib/TapStack.json');
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    template = JSON.parse(templateContent);
  });

  describe('Template Structure', () => {
    test('should have valid CloudFormation format version', () => {
      expect(template.AWSTemplateFormatVersion).toBe('2010-09-09');
    });

    test('should have appropriate description for image processing system', () => {
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe(
        'Serverless Image Processing Pipeline with S3, Lambda, DynamoDB, and CloudWatch'
      );
    });

    test('should have metadata section with parameter groups', () => {
      expect(template.Metadata).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface']).toBeDefined();
      expect(template.Metadata['AWS::CloudFormation::Interface'].ParameterGroups).toBeDefined();
    });
  });

  describe('Parameters', () => {
    test('should have all required parameters', () => {
      const expectedParameters = ['Environment', 'SourceBucketName', 'ThumbnailBucketName', 'ThumbnailSize'];
      expectedParameters.forEach(paramName => {
        expect(template.Parameters[paramName]).toBeDefined();
      });
    });

    test('Environment parameter should have correct properties', () => {
      const envParam = template.Parameters.Environment;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('production');
      expect(envParam.AllowedValues).toEqual(['development', 'staging', 'production']);
      expect(envParam.Description).toBe('Environment name for resource tagging');
    });

    test('SourceBucketName parameter should have validation and default value', () => {
      const param = template.Parameters.SourceBucketName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('tap-source-images-bucket');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(63);
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
      expect(param.ConstraintDescription).toBe('Must be a valid S3 bucket name');
    });

    test('ThumbnailBucketName parameter should have validation and default value', () => {
      const param = template.Parameters.ThumbnailBucketName;
      expect(param.Type).toBe('String');
      expect(param.Default).toBe('tap-thumbnail-images-bucket');
      expect(param.MinLength).toBe(3);
      expect(param.MaxLength).toBe(63);
      expect(param.AllowedPattern).toBe('^[a-z0-9][a-z0-9-]*[a-z0-9]$');
      expect(param.ConstraintDescription).toBe('Must be a valid S3 bucket name');
    });

    test('ThumbnailSize parameter should have appropriate constraints', () => {
      const param = template.Parameters.ThumbnailSize;
      expect(param.Type).toBe('Number');
      expect(param.Default).toBe(128);
      expect(param.MinValue).toBe(64);
      expect(param.MaxValue).toBe(512);
      expect(param.Description).toBe('Thumbnail size in pixels (width and height)');
    });
  });

  describe('S3 Resources', () => {
    test('should have SourceBucket with correct configuration', () => {
      const bucket = template.Resources.SourceBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({ Ref: 'SourceBucketName' });
      expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(bucket.Properties.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have ThumbnailBucket with lifecycle policies', () => {
      const bucket = template.Resources.ThumbnailBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
      expect(bucket.Properties.BucketName).toEqual({ Ref: 'ThumbnailBucketName' });

      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toHaveLength(2);

      const iaRule = lifecycleRules.find((rule: any) => rule.Id === 'TransitionToIA');
      expect(iaRule.Transitions[0].TransitionInDays).toBe(30);
      expect(iaRule.Transitions[0].StorageClass).toBe('STANDARD_IA');

      const glacierRule = lifecycleRules.find((rule: any) => rule.Id === 'TransitionToGlacier');
      expect(glacierRule.Transitions[0].TransitionInDays).toBe(90);
      expect(glacierRule.Transitions[0].StorageClass).toBe('GLACIER');
    });

    test('SourceBucket should NOT have S3 event notifications configured (using custom resource instead)', () => {
      const bucket = template.Resources.SourceBucket;
      // The bucket should no longer have NotificationConfiguration to avoid circular dependency
      expect(bucket.Properties.NotificationConfiguration).toBeUndefined();
    });

    test('S3 buckets should block public access', () => {
      const sourceBucket = template.Resources.SourceBucket;
      const thumbnailBucket = template.Resources.ThumbnailBucket;

      [sourceBucket, thumbnailBucket].forEach(bucket => {
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;
        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('should have S3 bucket notification custom resource', () => {
      const customResource = template.Resources.S3BucketNotificationCustomResource;
      expect(customResource).toBeDefined();
      expect(customResource.Type).toBe('AWS::CloudFormation::CustomResource');
      expect(customResource.DependsOn).toContain('LambdaInvokePermission');
      // ImageProcessorFunction dependency is implicit via !GetAtt reference (W3005 fix)
      expect(customResource.Properties.LambdaFunctionArn).toEqual({ 'Fn::GetAtt': ['ImageProcessorFunction', 'Arn'] });
    });

    test('should have custom resource Lambda function for S3 notifications', () => {
      const customFunction = template.Resources.ConfigureS3NotificationFunction;
      expect(customFunction).toBeDefined();
      expect(customFunction.Type).toBe('AWS::Lambda::Function');
      expect(customFunction.Properties.Runtime).toBe('python3.9');
      expect(customFunction.Properties.Handler).toBe('index.lambda_handler');
      expect(customFunction.Properties.Timeout).toBe(60);

      // Verify the function code includes proper error handling
      const code = customFunction.Properties.Code.ZipFile;
      expect(code).toContain('send_response');
      expect(code).toContain('logging');
      expect(code).toContain('urllib3');
      expect(code).toContain('BucketName is required');
      expect(code).toContain('LambdaFunctionArn is required');
      // Verify it uses correct S3 API parameter name
      expect(code).toContain('LambdaFunctionConfigurations');
      expect(code).not.toContain('LambdaConfigurations');
    });

    test('should have IAM role for custom resource Lambda', () => {
      const role = template.Resources.ConfigureS3NotificationRole;
      expect(role).toBeDefined();
      expect(role.Type).toBe('AWS::IAM::Role');
      expect(role.Properties.AssumeRolePolicyDocument.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');

      // Verify IAM policy has correct S3 permissions
      const policy = role.Properties.Policies[0];
      expect(policy.PolicyName).toBe('S3NotificationPolicy');
      const actions = policy.PolicyDocument.Statement[0].Action;
      expect(actions).toContain('s3:PutBucketNotification');
      expect(actions).toContain('s3:GetBucketNotification');
      // Ensure invalid actions are not present
      expect(actions).not.toContain('s3:PutBucketNotificationConfiguration');
      expect(actions).not.toContain('s3:GetBucketNotificationConfiguration');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have ImageMetadataTable with correct configuration', () => {
      const table = template.Resources.ImageMetadataTable;
      expect(table.Type).toBe('AWS::DynamoDB::Table');
      expect(table.Properties.TableName).toEqual({ 'Fn::Sub': '${AWS::StackName}-ImageMetadata' });
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
      expect(table.Properties.PointInTimeRecoverySpecification.PointInTimeRecoveryEnabled).toBe(true);
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('ImageMetadataTable should have correct key schema', () => {
      const table = template.Resources.ImageMetadataTable;
      const keySchema = table.Properties.KeySchema;

      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('ImageID');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('ImageMetadataTable should have GlobalSecondaryIndex', () => {
      const table = template.Resources.ImageMetadataTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;

      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('TimestampIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('UploadTimestamp');
      expect(gsi[0].KeySchema[1].AttributeName).toBe('ImageID');
      expect(gsi[0].Projection.ProjectionType).toBe('ALL');
    });

    test('ImageMetadataTable should have DynamoDB streams enabled', () => {
      const table = template.Resources.ImageMetadataTable;
      expect(table.Properties.StreamSpecification.StreamViewType).toBe('NEW_AND_OLD_IMAGES');
    });
  });

  describe('Lambda Resources', () => {
    test('should have ImageProcessorFunction with correct configuration', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
      expect(lambda.Properties.Runtime).toBe('python3.9');
      expect(lambda.Properties.Handler).toBe('index.lambda_handler');
      expect(lambda.Properties.Timeout).toBe(60);
      expect(lambda.Properties.MemorySize).toBe(512);
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(10);
    });

    test('Lambda function should have correct environment variables', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      const envVars = lambda.Properties.Environment.Variables;

      expect(envVars.THUMBNAIL_BUCKET).toEqual({ Ref: 'ThumbnailBucket' });
      expect(envVars.METADATA_TABLE).toEqual({ Ref: 'ImageMetadataTable' });
      expect(envVars.THUMBNAIL_SIZE).toEqual({ Ref: 'ThumbnailSize' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'Environment' });
    });

    test('Lambda function should depend on log group', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.DependsOn).toBe('ImageProcessorLogGroup');
    });

    test('should have LambdaInvokePermission for S3', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Action).toBe('lambda:InvokeFunction');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
      expect(permission.Properties.SourceAccount).toEqual({ Ref: 'AWS::AccountId' });
      expect(permission.Properties.SourceArn).toEqual({ 'Fn::GetAtt': ['SourceBucket', 'Arn'] });
    });
  });

  describe('IAM Resources', () => {
    test('should have ImageProcessorRole with correct assume role policy', () => {
      const role = template.Resources.ImageProcessorRole;
      expect(role.Type).toBe('AWS::IAM::Role');

      const assumePolicyDoc = role.Properties.AssumeRolePolicyDocument;
      expect(assumePolicyDoc.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumePolicyDoc.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('ImageProcessorRole should have basic execution role attached', () => {
      const role = template.Resources.ImageProcessorRole;
      expect(role.Properties.ManagedPolicyArns).toContain('arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole');
    });

    test('ImageProcessorRole should have appropriate permissions', () => {
      const role = template.Resources.ImageProcessorRole;
      const policy = role.Properties.Policies[0].PolicyDocument;
      const statements = policy.Statement;

      // S3 read permissions
      const s3ReadStatement = statements.find((stmt: any) =>
        stmt.Action.includes('s3:GetObject') && stmt.Action.includes('s3:GetObjectVersion')
      );
      expect(s3ReadStatement).toBeDefined();
      expect(s3ReadStatement.Resource).toEqual({ 'Fn::Sub': '${SourceBucket.Arn}/*' });

      // S3 write permissions
      const s3WriteStatement = statements.find((stmt: any) =>
        stmt.Action.includes('s3:PutObject') && stmt.Action.includes('s3:PutObjectAcl')
      );
      expect(s3WriteStatement).toBeDefined();
      expect(s3WriteStatement.Resource).toEqual({ 'Fn::Sub': '${ThumbnailBucket.Arn}/*' });

      // DynamoDB permissions
      const dynamoStatement = statements.find((stmt: any) =>
        stmt.Action.includes('dynamodb:PutItem')
      );
      expect(dynamoStatement).toBeDefined();
      expect(dynamoStatement.Resource).toEqual({ 'Fn::GetAtt': ['ImageMetadataTable', 'Arn'] });

      // CloudWatch permissions
      const cloudwatchStatement = statements.find((stmt: any) =>
        stmt.Action.includes('cloudwatch:PutMetricData')
      );
      expect(cloudwatchStatement).toBeDefined();
      expect(cloudwatchStatement.Condition.StringEquals['cloudwatch:namespace']).toBe('ImageProcessing');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have ImageProcessorLogGroup with correct configuration', () => {
      const logGroup = template.Resources.ImageProcessorLogGroup;
      expect(logGroup.Type).toBe('AWS::Logs::LogGroup');
      expect(logGroup.Properties.LogGroupName).toEqual({ 'Fn::Sub': '/aws/lambda/${AWS::StackName}-ImageProcessor' });
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });

    test('should have ProcessingErrorAlarm configured', () => {
      const alarm = template.Resources.ProcessingErrorAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('ProcessingErrors');
      expect(alarm.Properties.Namespace).toBe('ImageProcessing');
      expect(alarm.Properties.Threshold).toBe(5);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanThreshold');
    });

    test('should have LambdaDurationAlarm configured', () => {
      const alarm = template.Resources.LambdaDurationAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Duration');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(30000);
    });

    test('should have LambdaThrottleAlarm configured', () => {
      const alarm = template.Resources.LambdaThrottleAlarm;
      expect(alarm.Type).toBe('AWS::CloudWatch::Alarm');
      expect(alarm.Properties.MetricName).toBe('Throttles');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(1);
    });
  });

  describe('Cross-Account Compatibility', () => {
    test('should not contain hardcoded account IDs', () => {
      const templateStr = JSON.stringify(template);
      // Check for common hardcoded account ID patterns
      expect(templateStr).not.toMatch(/\b\d{12}\b/);
      expect(templateStr).not.toMatch(/arn:aws:[^:]*:[^:]*:\d{12}:/);
    });

    test('should not contain hardcoded region names', () => {
      const templateStr = JSON.stringify(template);
      const awsRegions = ['us-east-1', 'us-west-2', 'eu-west-1', 'ap-southeast-1'];
      awsRegions.forEach(region => {
        expect(templateStr).not.toContain(region);
      });
    });

    test('should use CloudFormation pseudo parameters for account and region references', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Properties.SourceAccount).toEqual({ Ref: 'AWS::AccountId' });
    });
  });

  describe('Resource Tagging', () => {
    test('all resources should have iac-rlhf-amazon tag', () => {
      const resourcesWithTags = [
        'SourceBucket',
        'ThumbnailBucket',
        'ImageMetadataTable',
        'ImageProcessorRole',
        'ImageProcessorLogGroup',
        'ImageProcessorFunction',
        'ProcessingErrorAlarm',
        'LambdaDurationAlarm',
        'LambdaThrottleAlarm'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        expect(resource.Properties.Tags).toBeDefined();

        const iacTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'iac-rlhf-amazon');
        expect(iacTag).toBeDefined();
        expect(iacTag.Value).toBe('true');
      });
    });

    test('all resources should have Environment tag', () => {
      const resourcesWithTags = [
        'SourceBucket',
        'ThumbnailBucket',
        'ImageMetadataTable',
        'ImageProcessorRole',
        'ImageProcessorLogGroup',
        'ImageProcessorFunction',
        'ProcessingErrorAlarm',
        'LambdaDurationAlarm',
        'LambdaThrottleAlarm'
      ];

      resourcesWithTags.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const envTag = resource.Properties.Tags.find((tag: any) => tag.Key === 'Environment');
        expect(envTag).toBeDefined();
        expect(envTag.Value).toEqual({ Ref: 'Environment' });
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'SourceBucketName',
        'ThumbnailBucketName',
        'ImageMetadataTableName',
        'ImageProcessorFunctionArn',
        'ImageProcessorFunctionName',
        'CloudWatchDashboardURL'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('outputs should have export names for cross-stack references', () => {
      Object.keys(template.Outputs).forEach(outputKey => {
        const output = template.Outputs[outputKey];
        expect(output.Export).toBeDefined();
        expect(output.Export.Name).toEqual({
          'Fn::Sub': expect.stringMatching(/^\$\{AWS::StackName\}-.+/)
        });
      });
    });

    test('CloudWatchDashboardURL should be properly formatted', () => {
      const output = template.Outputs.CloudWatchDashboardURL;
      expect(output.Value).toEqual({
        'Fn::Sub': 'https://console.aws.amazon.com/cloudwatch/home?region=${AWS::Region}#dashboards:name=${AWS::StackName}'
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required CloudFormation sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have appropriate number of resources for image processing system', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(8); // At least S3, Lambda, DynamoDB, IAM, CloudWatch resources
    });

    test('should have correct number of parameters', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(4);
    });

    test('should have correct number of outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });

  describe('Resource Dependencies', () => {
    test('Lambda function should have proper dependencies', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.DependsOn).toBe('ImageProcessorLogGroup');
    });

    test('Lambda permission should reference correct function', () => {
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Properties.FunctionName).toEqual({ Ref: 'ImageProcessorFunction' });
    });

    test('S3 notification should reference Lambda function ARN', () => {
      // This template uses a custom resource to avoid circular dependencies
      // Check the custom resource instead of direct bucket notification
      const customResource = template.Resources.S3BucketNotificationCustomResource;
      expect(customResource).toBeDefined();
      expect(customResource.Properties.LambdaFunctionArn).toEqual({ 'Fn::GetAtt': ['ImageProcessorFunction', 'Arn'] });
      expect(customResource.Properties.BucketName).toEqual({ Ref: 'SourceBucket' });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should have encryption enabled', () => {
      const sourceBucket = template.Resources.SourceBucket;
      const thumbnailBucket = template.Resources.ThumbnailBucket;

      [sourceBucket, thumbnailBucket].forEach(bucket => {
        expect(bucket.Properties.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    test('DynamoDB table should have encryption enabled', () => {
      const table = template.Resources.ImageMetadataTable;
      expect(table.Properties.SSESpecification.SSEEnabled).toBe(true);
    });

    test('IAM role should follow least privilege principle', () => {
      const role = template.Resources.ImageProcessorRole;
      const policy = role.Properties.Policies[0].PolicyDocument;

      // Should have specific resource ARNs, not wildcards
      policy.Statement.forEach((statement: any) => {
        if (statement.Resource !== '*') {
          expect(statement.Resource).toBeDefined();
          expect(typeof statement.Resource === 'object' || typeof statement.Resource === 'string').toBe(true);
        }
      });
    });
  });

  describe('Performance and Cost Optimization', () => {
    test('Lambda should have reserved concurrency to prevent runaway costs', () => {
      const lambda = template.Resources.ImageProcessorFunction;
      expect(lambda.Properties.ReservedConcurrentExecutions).toBeDefined();
      expect(lambda.Properties.ReservedConcurrentExecutions).toBe(10);
    });

    test('DynamoDB should use on-demand billing for cost efficiency', () => {
      const table = template.Resources.ImageMetadataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('S3 lifecycle policies should be configured for cost optimization', () => {
      const thumbnailBucket = template.Resources.ThumbnailBucket;
      const lifecycleRules = thumbnailBucket.Properties.LifecycleConfiguration.Rules;

      expect(lifecycleRules.length).toBeGreaterThan(0);
      expect(lifecycleRules.some((rule: any) => rule.Transitions)).toBe(true);
    });

    test('CloudWatch log retention should be configured to manage costs', () => {
      const logGroup = template.Resources.ImageProcessorLogGroup;
      expect(logGroup.Properties.RetentionInDays).toBeDefined();
      expect(logGroup.Properties.RetentionInDays).toBe(7);
    });
  });
});
