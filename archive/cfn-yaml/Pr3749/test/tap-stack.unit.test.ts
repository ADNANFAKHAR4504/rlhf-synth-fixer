import fs from 'fs';
import path from 'path';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('Serverless Image Processing CloudFormation Template', () => {
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
      expect(template.Description).toContain('Serverless Image Upload Processing System');
    });
  });

  describe('Parameters', () => {
    test('should have EnvironmentSuffix parameter', () => {
      expect(template.Parameters.EnvironmentSuffix).toBeDefined();
      const envParam = template.Parameters.EnvironmentSuffix;
      expect(envParam.Type).toBe('String');
      expect(envParam.Default).toBe('dev');
      expect(envParam.AllowedPattern).toBe('^[a-z0-9-]+$');
    });

    test('should have NotificationEmail parameter', () => {
      expect(template.Parameters.NotificationEmail).toBeDefined();
      const emailParam = template.Parameters.NotificationEmail;
      expect(emailParam.Type).toBe('String');
      expect(emailParam.Default).toBe('admin@example.com');
    });
  });

  describe('S3 Resources', () => {
    test('should have ImageUploadBucket resource', () => {
      expect(template.Resources.ImageUploadBucket).toBeDefined();
      const bucket = template.Resources.ImageUploadBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('ImageUploadBucket should have security configurations', () => {
      const bucket = template.Resources.ImageUploadBucket;
      const props = bucket.Properties;

      expect(props.BucketEncryption).toBeDefined();
      expect(props.BucketEncryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      expect(props.PublicAccessBlockConfiguration.BlockPublicAcls).toBe(true);
      expect(props.PublicAccessBlockConfiguration.BlockPublicPolicy).toBe(true);
      expect(props.VersioningConfiguration.Status).toBe('Enabled');
    });

    test('should have ProcessedImageBucket resource', () => {
      expect(template.Resources.ProcessedImageBucket).toBeDefined();
      const bucket = template.Resources.ProcessedImageBucket;
      expect(bucket.Type).toBe('AWS::S3::Bucket');
    });

    test('bucket names should use environment suffix and account ID', () => {
      const uploadBucket = template.Resources.ImageUploadBucket;
      const processedBucket = template.Resources.ProcessedImageBucket;

      expect(uploadBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'image-upload-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      });
      expect(processedBucket.Properties.BucketName).toEqual({
        'Fn::Sub': 'processed-images-bucket-${EnvironmentSuffix}-${AWS::AccountId}'
      });
    });
  });

  describe('Lambda Resources', () => {
    test('should have ImageProcessingLambda resource', () => {
      expect(template.Resources.ImageProcessingLambda).toBeDefined();
      const lambda = template.Resources.ImageProcessingLambda;
      expect(lambda.Type).toBe('AWS::Lambda::Function');
    });

    test('Lambda should have correct runtime and configuration', () => {
      const lambda = template.Resources.ImageProcessingLambda;
      const props = lambda.Properties;

      expect(props.Runtime).toBe('nodejs20.x');
      expect(props.Handler).toBe('index.handler');
      expect(props.Timeout).toBe(60);
      expect(props.MemorySize).toBe(512);
    });

    test('Lambda should have environment variables', () => {
      const lambda = template.Resources.ImageProcessingLambda;
      const env = lambda.Properties.Environment.Variables;

      expect(env.PROCESSED_BUCKET).toEqual({ Ref: 'ProcessedImageBucket' });
      expect(env.SNS_TOPIC_ARN).toEqual({ Ref: 'ImageProcessingTopic' });
      expect(env.ENVIRONMENT).toEqual({ Ref: 'EnvironmentSuffix' });
    });

    test('should have LambdaExecutionRole resource', () => {
      expect(template.Resources.LambdaExecutionRole).toBeDefined();
      const role = template.Resources.LambdaExecutionRole;
      expect(role.Type).toBe('AWS::IAM::Role');
    });


    test('should have LambdaInvokePermission resource', () => {
      expect(template.Resources.LambdaInvokePermission).toBeDefined();
      const permission = template.Resources.LambdaInvokePermission;
      expect(permission.Type).toBe('AWS::Lambda::Permission');
      expect(permission.Properties.Principal).toBe('s3.amazonaws.com');
    });
  });

  describe('SNS Resources', () => {
    test('should have ImageProcessingTopic resource', () => {
      expect(template.Resources.ImageProcessingTopic).toBeDefined();
      const topic = template.Resources.ImageProcessingTopic;
      expect(topic.Type).toBe('AWS::SNS::Topic');
    });

    test('SNS topic should have email subscription', () => {
      const topic = template.Resources.ImageProcessingTopic;
      const subscription = topic.Properties.Subscription[0];

      expect(subscription.Protocol).toBe('email');
      expect(subscription.Endpoint).toEqual({ Ref: 'NotificationEmail' });
    });

    test('SNS topic name should use environment suffix', () => {
      const topic = template.Resources.ImageProcessingTopic;
      expect(topic.Properties.TopicName).toEqual({
        'Fn::Sub': 'image-processing-notifications-${EnvironmentSuffix}'
      });
    });
  });

  describe('Outputs', () => {
    test('should have all required outputs', () => {
      const expectedOutputs = [
        'UploadBucketName',
        'ProcessedBucketName',
        'LambdaFunctionArn',
        'SNSTopicArn'
      ];

      expectedOutputs.forEach(outputName => {
        expect(template.Outputs[outputName]).toBeDefined();
      });
    });


    test('UploadBucketName output should reference correct resource', () => {
      const output = template.Outputs.UploadBucketName;
      expect(output.Value).toEqual({ Ref: 'ImageUploadBucket' });
      expect(output.Description).toContain('S3 bucket for image uploads');
    });

    test('LambdaFunctionArn output should use GetAtt', () => {
      const output = template.Outputs.LambdaFunctionArn;
      expect(output.Value).toEqual({
        'Fn::GetAtt': ['ImageProcessingLambda', 'Arn']
      });
    });
  });

  describe('Resource Tagging', () => {
    test('resources should have consistent tagging', () => {
      const taggedResourceTypes = ['ImageUploadBucket', 'ProcessedImageBucket', 'ImageProcessingTopic', 'LambdaExecutionRole'];

      taggedResourceTypes.forEach(resourceName => {
        const resource = template.Resources[resourceName];
        const tags = resource.Properties.Tags;

        expect(tags).toBeDefined();
        expect(tags.some((tag: any) => tag.Key === 'Environment')).toBe(true);
        expect(tags.some((tag: any) => tag.Key === 'Application')).toBe(true);
      });
    });
  });

  describe('Security Best Practices', () => {
    test('S3 buckets should block public access', () => {
      ['ImageUploadBucket', 'ProcessedImageBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const publicAccessBlock = bucket.Properties.PublicAccessBlockConfiguration;

        expect(publicAccessBlock.BlockPublicAcls).toBe(true);
        expect(publicAccessBlock.BlockPublicPolicy).toBe(true);
        expect(publicAccessBlock.IgnorePublicAcls).toBe(true);
        expect(publicAccessBlock.RestrictPublicBuckets).toBe(true);
      });
    });

    test('S3 buckets should have encryption enabled', () => {
      ['ImageUploadBucket', 'ProcessedImageBucket'].forEach(bucketName => {
        const bucket = template.Resources[bucketName];
        const encryption = bucket.Properties.BucketEncryption;

        expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.SSEAlgorithm).toBe('AES256');
      });
    });

    test('Lambda execution role should not have wildcard permissions', () => {
      const role = template.Resources.LambdaExecutionRole;
      const policies = role.Properties.Policies[0].PolicyDocument.Statement;

      policies.forEach((statement: any) => {
        if (statement.Resource && statement.Resource !== '*') {
          expect(statement.Resource).not.toBe('*');
        }
      });
    });
  });

  describe('Template Validation', () => {
    test('should have valid JSON structure', () => {
      expect(template).toBeDefined();
      expect(typeof template).toBe('object');
    });

    test('should have all required sections', () => {
      expect(template.AWSTemplateFormatVersion).toBeTruthy();
      expect(template.Description).toBeTruthy();
      expect(template.Parameters).toBeTruthy();
      expect(template.Resources).toBeTruthy();
      expect(template.Outputs).toBeTruthy();
    });

    test('should have multiple resources for complete infrastructure', () => {
      const resourceCount = Object.keys(template.Resources).length;
      expect(resourceCount).toBeGreaterThan(5);
    });

    test('should have correct parameter count', () => {
      const parameterCount = Object.keys(template.Parameters).length;
      expect(parameterCount).toBe(2);
    });
  });
});
