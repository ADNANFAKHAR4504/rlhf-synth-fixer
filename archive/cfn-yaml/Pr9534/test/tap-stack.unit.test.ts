import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Media Storage System CloudFormation Template', () => {
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
      expect(template.Description).toBeDefined();
      expect(template.Description).toBe('Media Storage System with S3, DynamoDB, Lambda, and CloudWatch');
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
      expect(envSuffixParam.Description).toBe('Environment suffix to append to resource names (e.g., dev, test, prod)');
    });
  });

  describe('S3 Resources', () => {
    test('should have MediaBucket resource', () => {
      expect(template.Resources.MediaBucket).toBeDefined();
      expect(template.Resources.MediaBucket.Type).toBe('AWS::S3::Bucket');
    });

    test('MediaBucket should have EventBridge notifications enabled', () => {
      const bucket = template.Resources.MediaBucket;
      expect(bucket.Properties.NotificationConfiguration.EventBridgeConfiguration.EventBridgeEnabled).toBe(true);
    });

    test('MediaBucket should have CORS configuration', () => {
      const bucket = template.Resources.MediaBucket;
      const corsRules = bucket.Properties.CorsConfiguration.CorsRules;
      expect(corsRules).toHaveLength(1);
      expect(corsRules[0].AllowedMethods).toContain('GET');
      expect(corsRules[0].AllowedMethods).toContain('PUT');
      expect(corsRules[0].AllowedMethods).toContain('POST');
    });

    test('MediaBucket should have lifecycle configuration', () => {
      const bucket = template.Resources.MediaBucket;
      const lifecycleRules = bucket.Properties.LifecycleConfiguration.Rules;
      expect(lifecycleRules).toHaveLength(1);
      expect(lifecycleRules[0].Transitions[0].StorageClass).toBe('STANDARD_IA');
      expect(lifecycleRules[0].Transitions[0].TransitionInDays).toBe(90);
    });

    test('should have MediaBucketPolicy resource', () => {
      expect(template.Resources.MediaBucketPolicy).toBeDefined();
      expect(template.Resources.MediaBucketPolicy.Type).toBe('AWS::S3::BucketPolicy');
    });
  });

  describe('DynamoDB Resources', () => {
    test('should have ImageMetadataTable resource', () => {
      expect(template.Resources.ImageMetadataTable).toBeDefined();
      expect(template.Resources.ImageMetadataTable.Type).toBe('AWS::DynamoDB::Table');
    });

    test('ImageMetadataTable should have correct billing mode', () => {
      const table = template.Resources.ImageMetadataTable;
      expect(table.Properties.BillingMode).toBe('PAY_PER_REQUEST');
    });

    test('ImageMetadataTable should have correct key schema', () => {
      const table = template.Resources.ImageMetadataTable;
      const keySchema = table.Properties.KeySchema;
      expect(keySchema).toHaveLength(1);
      expect(keySchema[0].AttributeName).toBe('id');
      expect(keySchema[0].KeyType).toBe('HASH');
    });

    test('ImageMetadataTable should have Global Secondary Index', () => {
      const table = template.Resources.ImageMetadataTable;
      const gsi = table.Properties.GlobalSecondaryIndexes;
      expect(gsi).toHaveLength(1);
      expect(gsi[0].IndexName).toBe('UserUploadIndex');
      expect(gsi[0].KeySchema[0].AttributeName).toBe('uploadedBy');
      expect(gsi[0].KeySchema[1].AttributeName).toBe('uploadDate');
    });
  });

  describe('Lambda Resources', () => {
    test('should have ImageProcessorFunction resource', () => {
      expect(template.Resources.ImageProcessorFunction).toBeDefined();
      expect(template.Resources.ImageProcessorFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('ImageProcessorFunction should have correct configuration', () => {
      const func = template.Resources.ImageProcessorFunction;
      expect(func.Properties.Runtime).toBe('nodejs20.x');
      expect(func.Properties.Timeout).toBe(30);
      expect(func.Properties.MemorySize).toBe(512);
      expect(func.Properties.Handler).toBe('index.handler');
    });

    test('ImageProcessorFunction should have environment variables', () => {
      const func = template.Resources.ImageProcessorFunction;
      const envVars = func.Properties.Environment.Variables;
      expect(envVars.DYNAMODB_TABLE).toEqual({ Ref: 'ImageMetadataTable' });
      expect(envVars.S3_BUCKET).toEqual({ Ref: 'MediaBucket' });
      expect(envVars.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have ImageRetrieverFunction resource', () => {
      expect(template.Resources.ImageRetrieverFunction).toBeDefined();
      expect(template.Resources.ImageRetrieverFunction.Type).toBe('AWS::Lambda::Function');
    });

    test('ImageRetrieverFunction should have correct configuration', () => {
      const func = template.Resources.ImageRetrieverFunction;
      expect(func.Properties.Runtime).toBe('nodejs20.x');
      expect(func.Properties.Timeout).toBe(10);
      expect(func.Properties.MemorySize).toBe(256);
    });
  });

  describe('IAM Resources', () => {
    test('should have ImageProcessorRole resource', () => {
      expect(template.Resources.ImageProcessorRole).toBeDefined();
      expect(template.Resources.ImageProcessorRole.Type).toBe('AWS::IAM::Role');
    });

    test('ImageProcessorRole should have correct assume role policy', () => {
      const role = template.Resources.ImageProcessorRole;
      const assumeRolePolicy = role.Properties.AssumeRolePolicyDocument;
      expect(assumeRolePolicy.Statement[0].Principal.Service).toBe('lambda.amazonaws.com');
      expect(assumeRolePolicy.Statement[0].Action).toBe('sts:AssumeRole');
    });

    test('ImageProcessorRole should have required managed policies', () => {
      const role = template.Resources.ImageProcessorRole;
      expect(role.Properties.ManagedPolicyArns).toContain(
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      );
    });

    test('should have ImageRetrieverRole resource', () => {
      expect(template.Resources.ImageRetrieverRole).toBeDefined();
      expect(template.Resources.ImageRetrieverRole.Type).toBe('AWS::IAM::Role');
    });
  });

  describe('EventBridge Resources', () => {
    test('should have S3EventRule resource', () => {
      expect(template.Resources.S3EventRule).toBeDefined();
      expect(template.Resources.S3EventRule.Type).toBe('AWS::Events::Rule');
    });

    test('S3EventRule should have correct event pattern', () => {
      const rule = template.Resources.S3EventRule;
      const eventPattern = rule.Properties.EventPattern;
      expect(eventPattern.source).toContain('aws.s3');
      expect(eventPattern['detail-type']).toContain('Object Created');
    });

    test('should have EventBridgeLambdaPermission resource', () => {
      expect(template.Resources.EventBridgeLambdaPermission).toBeDefined();
      expect(template.Resources.EventBridgeLambdaPermission.Type).toBe('AWS::Lambda::Permission');
    });
  });

  describe('CloudWatch Resources', () => {
    test('should have MediaStorageDashboard resource', () => {
      expect(template.Resources.MediaStorageDashboard).toBeDefined();
      expect(template.Resources.MediaStorageDashboard.Type).toBe('AWS::CloudWatch::Dashboard');
    });

    test('should have LambdaErrorAlarm resource', () => {
      expect(template.Resources.LambdaErrorAlarm).toBeDefined();
      expect(template.Resources.LambdaErrorAlarm.Type).toBe('AWS::CloudWatch::Alarm');
    });

    test('LambdaErrorAlarm should have correct configuration', () => {
      const alarm = template.Resources.LambdaErrorAlarm;
      expect(alarm.Properties.MetricName).toBe('Errors');
      expect(alarm.Properties.Namespace).toBe('AWS/Lambda');
      expect(alarm.Properties.Threshold).toBe(1);
      expect(alarm.Properties.ComparisonOperator).toBe('GreaterThanOrEqualToThreshold');
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'MediaBucketName',
        'ImageMetadataTableName',
        'ImageProcessorFunctionName',
        'ImageRetrieverFunctionName',
        'DashboardURL',
        'EventRuleArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });

    test('MediaBucketName output should be correct', () => {
      const output = template.Outputs.MediaBucketName;
      expect(output.Description).toBe('Name of the S3 bucket for media storage');
      expect(output.Value).toEqual({ Ref: 'MediaBucket' });
    });

    test('ImageMetadataTableName output should be correct', () => {
      const output = template.Outputs.ImageMetadataTableName;
      expect(output.Description).toBe('Name of the DynamoDB table for image metadata');
      expect(output.Value).toEqual({ Ref: 'ImageMetadataTable' });
    });

    test('DashboardURL output should have correct format', () => {
      const output = template.Outputs.DashboardURL;
      expect(output.Description).toBe('URL for the CloudWatch Dashboard');
      expect(output.Value['Fn::Sub']).toContain('console.aws.amazon.com/cloudwatch');
    });
  });


  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).not.toBeNull();
      expect(template.Description).not.toBeNull();
      expect(template.Parameters).not.toBeNull();
      expect(template.Resources).not.toBeNull();
      expect(template.Outputs).not.toBeNull();
    });

    test('should have expected number of resources', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBe(11); // S3, DynamoDB, Lambda functions, IAM roles, EventBridge, CloudWatch resources
    });

    test('should have one parameter', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(1);
    });

    test('should have six outputs', () => {
      const outputCount = Object.keys(template.Outputs).length;
      expect(outputCount).toBe(6);
    });
  });
});