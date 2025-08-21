import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { LambdaStack } from '../lib/lambda-stack.mjs';

describe('LambdaStack Unit Tests', () => {
  let app;
  let stack;
  let template;
  const environmentSuffix = 'test';

  beforeEach(() => {
    app = new cdk.App();
    stack = new LambdaStack(app, 'TestLambdaStack', {
      environmentSuffix,
    });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket for Lambda code', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          }],
        },
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('should set removal policy to DESTROY', () => {
      const resources = template.toJSON().Resources;
      const bucket = Object.values(resources).find(r => r.Type === 'AWS::S3::Bucket');
      expect(bucket).toBeDefined();
      expect(bucket.DeletionPolicy).toBe('Delete');
    });
  });

  describe('Lambda Function ARNs', () => {
    test('should expose user function ARN', () => {
      expect(stack.userFunction).toBeDefined();
      expect(stack.userFunction.functionArn).toContain('prod-user-function');
      expect(stack.userFunction.functionArn).toContain(environmentSuffix);
    });

    test('should expose product function ARN', () => {
      expect(stack.productFunction).toBeDefined();
      expect(stack.productFunction.functionArn).toContain('prod-product-function');
      expect(stack.productFunction.functionArn).toContain(environmentSuffix);
    });
  });

  describe('Stack Outputs', () => {
    test('should output user function ARN', () => {
      template.hasOutput('UserFunctionArn', {
        Description: 'User Function ARN (mock)',
      });
    });

    test('should output product function ARN', () => {
      template.hasOutput('ProductFunctionArn', {
        Description: 'Product Function ARN (mock)',
      });
    });

    test('should output code bucket name', () => {
      template.hasOutput('CodeBucketName', {
        Description: 'S3 Bucket for Lambda Code',
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should apply environment suffix to all resources', () => {
      const resources = template.toJSON().Resources;
      const bucket = Object.values(resources).find(r => r.Type === 'AWS::S3::Bucket');
      // BucketName is a CloudFormation intrinsic function, check structure
      expect(bucket.Properties.BucketName['Fn::Join'][1][0]).toContain('prod-lambda-code-test');
    });

    test('should use proper naming convention', () => {
      const resources = template.toJSON().Resources;
      const bucket = Object.values(resources).find(r => r.Type === 'AWS::S3::Bucket');
      // BucketName is a CloudFormation intrinsic function, check structure
      expect(bucket.Properties.BucketName['Fn::Join'][1][0]).toMatch(/^prod-lambda-code-/);
    });
  });

  describe('Security Best Practices', () => {
    test('should enable S3 server-side encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [{
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'AES256',
            },
          }],
        },
      });
    });

    test('should block all public access on S3 bucket', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });
  });
});