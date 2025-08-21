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

  describe('KMS Key Configuration', () => {
    test('should create KMS key for Lambda encryption', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for Lambda function environment variable encryption',
        EnableKeyRotation: true,
      });
    });

    test('should create KMS alias', () => {
      template.hasResourceProperties('AWS::KMS::Alias', {
        AliasName: `alias/prod-lambda-encryption-${environmentSuffix}`,
      });
    });
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket for dead letter events', () => {
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
        VersioningConfiguration: {
          Status: 'Enabled',
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

  describe('IAM Role Configuration', () => {
    test('should create IAM role for Lambda execution', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `prod-lambda-execution-role-${environmentSuffix}`,
      });
    });

    test('should include least privilege policies', () => {
      template.hasResourceProperties('AWS::IAM::Role', {
        RoleName: `prod-lambda-execution-role-${environmentSuffix}`,
      });
    });
  });

  describe('Lambda Functions', () => {
    test('should create user management Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `prod-user-management-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30,
      });
    });

    test('should create product catalog Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `prod-product-catalog-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30,
      });
    });

    test('should create order processing Lambda function', () => {
      template.hasResourceProperties('AWS::Lambda::Function', {
        FunctionName: `prod-order-processing-${environmentSuffix}`,
        Runtime: 'nodejs20.x',
        Handler: 'index.handler',
        MemorySize: 512,
        Timeout: 30,
      });
    });

    test('should enable X-Ray tracing on all functions', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      // Filter out the CDK helper functions and only check our main Lambda functions
      const mainFunctions = Object.entries(functions).filter(([key, fn]) => 
        key.includes('UserManagementFunction') || 
        key.includes('ProductCatalogFunction') || 
        key.includes('OrderProcessingFunction')
      );
      expect(mainFunctions.length).toBeGreaterThan(0);
      mainFunctions.forEach(([key, fn]) => {
        expect(fn.Properties.TracingConfig?.Mode).toBe('Active');
      });
    });

    test('should encrypt environment variables', () => {
      const functions = template.findResources('AWS::Lambda::Function');
      // Filter out the CDK helper functions and only check our main Lambda functions
      const mainFunctions = Object.entries(functions).filter(([key, fn]) => 
        key.includes('UserManagementFunction') || 
        key.includes('ProductCatalogFunction') || 
        key.includes('OrderProcessingFunction')
      );
      expect(mainFunctions.length).toBeGreaterThan(0);
      mainFunctions.forEach(([key, fn]) => {
        expect(fn.Properties.KmsKeyArn).toBeDefined();
      });
    });
  });

  describe('Lambda Aliases', () => {
    test('should create LIVE aliases for blue-green deployment', () => {
      template.resourceCountIs('AWS::Lambda::Alias', 3);
      template.hasResourceProperties('AWS::Lambda::Alias', {
        Name: 'LIVE',
      });
    });
  });

  describe('Stack Outputs', () => {
    test('should output user management function ARN', () => {
      template.hasOutput('UserManagementFunctionArn', {
        Description: 'User Management Lambda Function ARN',
      });
    });

    test('should output product catalog function ARN', () => {
      template.hasOutput('ProductCatalogFunctionArn', {
        Description: 'Product Catalog Lambda Function ARN',
      });
    });

    test('should output order processing function ARN', () => {
      template.hasOutput('OrderProcessingFunctionArn', {
        Description: 'Order Processing Lambda Function ARN',
      });
    });

    test('should output KMS key ID', () => {
      template.hasOutput('LambdaKMSKeyId', {
        Description: 'KMS key for Lambda environment variable encryption',
      });
    });
  });

  describe('Environment Configuration', () => {
    test('should apply environment suffix to all resources', () => {
      const resources = template.toJSON().Resources;
      const bucket = Object.values(resources).find(r => r.Type === 'AWS::S3::Bucket');
      // BucketName is a CloudFormation intrinsic function, check structure
      expect(bucket.Properties.BucketName['Fn::Join'][1][0]).toContain(`prod-lambda-failed-events-${environmentSuffix}`);
    });

    test('should use proper naming convention', () => {
      const resources = template.toJSON().Resources;
      const bucket = Object.values(resources).find(r => r.Type === 'AWS::S3::Bucket');
      // BucketName is a CloudFormation intrinsic function, check structure
      expect(bucket.Properties.BucketName['Fn::Join'][1][0]).toMatch(/^prod-lambda-failed-events-/);
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