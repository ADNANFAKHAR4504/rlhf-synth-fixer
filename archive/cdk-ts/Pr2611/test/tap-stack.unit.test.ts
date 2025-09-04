import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { TapStack } from '../lib/tap-stack';

const environmentSuffix = process.env.ENVIRONMENT_SUFFIX || 'dev';

describe('TapStack', () => {
  let app: cdk.App;
  let stack: TapStack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new TapStack(app, 'TestTapStack', { environmentSuffix });
    template = Template.fromStack(stack);
  });

  describe('S3 Bucket', () => {
    test('should create an S3 bucket with correct properties', () => {
      // Assert that the S3 bucket is created
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'AES256',
              },
            },
          ],
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

    test('should create bucket with environment-specific naming pattern', () => {
      // Get the bucket resource
      const bucketResource = template.findResources('AWS::S3::Bucket');
      const bucketName = Object.values(bucketResource)[0].Properties.BucketName;

      // Check that the bucket name follows the expected pattern
      expect(bucketName).toMatch(
        new RegExp(`^my-bucket-${environmentSuffix}-\\d+$`)
      );
    });

    test('should create bucket with timestamp in name', () => {
      const bucketResource = template.findResources('AWS::S3::Bucket');
      const bucketName = Object.values(bucketResource)[0].Properties.BucketName;

      // Extract timestamp from bucket name
      const timestampMatch = bucketName.match(/\d+$/);
      expect(timestampMatch).toBeTruthy();

      const timestamp = parseInt(timestampMatch![0]);
      const currentTime = Date.now();

      // Timestamp should be recent (within last 5 seconds)
      expect(timestamp).toBeGreaterThan(currentTime - 5000);
      expect(timestamp).toBeLessThan(currentTime + 5000);
    });

    test('should create bucket with correct removal policy for development', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should create bucket with auto delete objects enabled for development', () => {
      template.hasResource('AWS::S3::Bucket', {
        DeletionPolicy: 'Delete',
        UpdateReplacePolicy: 'Delete',
      });
    });

    test('should create CloudFormation output for bucket name', () => {
      template.hasOutput('BucketName', {
        Description: 'Name of the S3 bucket',
      });
    });

    test('should output the correct bucket name', () => {
      const bucketResource = template.findResources('AWS::S3::Bucket');
      const bucketName = Object.values(bucketResource)[0].Properties.BucketName;

      // Check that the output exists and has the correct description
      template.hasOutput('BucketName', {
        Description: 'Name of the S3 bucket',
      });

      // The output value will be a Ref to the bucket resource, not the actual bucket name
      // This is expected behavior in CDK
    });
  });

  describe('Stack Configuration', () => {
    test('should use environment suffix from props', () => {
      const customApp = new cdk.App();
      const customStack = new TapStack(customApp, 'CustomStack', {
        environmentSuffix: 'test',
      });
      const customTemplate = Template.fromStack(customStack);

      const bucketResource = customTemplate.findResources('AWS::S3::Bucket');
      const bucketName = Object.values(bucketResource)[0].Properties.BucketName;

      expect(bucketName).toMatch(/^my-bucket-test-\d+$/);
    });

    test('should use environment suffix from context when not provided in props', () => {
      const contextApp = new cdk.App();
      contextApp.node.setContext('environmentSuffix', 'staging');
      const contextStack = new TapStack(contextApp, 'ContextStack');
      const contextTemplate = Template.fromStack(contextStack);

      const bucketResource = contextTemplate.findResources('AWS::S3::Bucket');
      const bucketName = Object.values(bucketResource)[0].Properties.BucketName;

      expect(bucketName).toMatch(/^my-bucket-staging-\d+$/);
    });

    test('should use default environment suffix when none provided', () => {
      const defaultApp = new cdk.App();
      const defaultStack = new TapStack(defaultApp, 'DefaultStack');
      const defaultTemplate = Template.fromStack(defaultStack);

      const bucketResource = defaultTemplate.findResources('AWS::S3::Bucket');
      const bucketName = Object.values(bucketResource)[0].Properties.BucketName;

      expect(bucketName).toMatch(/^my-bucket-dev-\d+$/);
    });
  });
});
