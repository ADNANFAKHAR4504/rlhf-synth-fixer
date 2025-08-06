import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { SecureStorage } from '../lib/constructs/secure-storage';

describe('SecureStorage Construct', () => {
  let app: cdk.App;
  let stack: cdk.Stack;
  let template: Template;

  beforeEach(() => {
    app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-west-2' },
    });
  });

  describe('default configuration', () => {
    beforeEach(() => {
      new SecureStorage(stack, 'TestStorage');
      template = Template.fromStack(stack);
    });

    test('creates KMS key with rotation enabled', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
        EnableKeyRotation: true,
      });
    });

    test('creates S3 bucket with KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketEncryption: {
          ServerSideEncryptionConfiguration: [
            {
              ServerSideEncryptionByDefault: {
                SSEAlgorithm: 'aws:kms',
              },
            },
          ],
        },
      });
    });

    test('enables versioning by default', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('blocks all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('sets lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        LifecycleConfiguration: {
          Rules: [
            {
              Id: 'delete-old-logs',
              Status: 'Enabled',
              ExpirationInDays: 90,
              NoncurrentVersionExpiration: {
                NoncurrentDays: 30,
              },
            },
          ],
        },
      });
    });

    test('tags resources with Environment Production', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });

      template.hasResourceProperties('AWS::KMS::Key', {
        Tags: Match.arrayWith([
          Match.objectLike({
            Key: 'Environment',
            Value: 'Production',
          }),
        ]),
      });
    });
  });

  describe('custom configuration', () => {
    beforeEach(() => {
      new SecureStorage(stack, 'TestStorage', {
        bucketName: 'my-custom-bucket',
        enableVersioning: false,
      });
      template = Template.fromStack(stack);
    });

    test('uses custom bucket name', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        BucketName: 'my-custom-bucket',
      });
    });

    test('respects versioning preference', () => {
      // When versioning is disabled, the property is not included in the template
      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucket)[0];
      expect(bucketResource.Properties.VersioningConfiguration).toBeUndefined();
    });
  });

  describe('security policies', () => {
    beforeEach(() => {
      new SecureStorage(stack, 'TestStorage');
      template = Template.fromStack(stack);
    });

    test('enforces SSL for bucket access', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Deny',
              Principal: { AWS: '*' },
              Action: 's3:*',
              Condition: {
                Bool: {
                  'aws:SecureTransport': 'false',
                },
              },
            }),
          ]),
        },
      });
    });

    test('sets DESTROY removal policy for testing', () => {
      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucket)[0];
      expect(bucketResource.DeletionPolicy).toBe('Delete');
    });

    test('enables auto-delete objects', () => {
      // Check for custom resource that handles auto-deletion
      template.hasResource('Custom::S3AutoDeleteObjects', {});
    });
  });

  describe('KMS key configuration', () => {
    beforeEach(() => {
      new SecureStorage(stack, 'TestStorage');
      template = Template.fromStack(stack);
    });

    test('creates customer managed KMS key', () => {
      template.hasResourceProperties('AWS::KMS::Key', {
        Description: 'KMS key for S3 bucket encryption',
      });
    });

    test('sets DESTROY removal policy for KMS key', () => {
      const kmsKey = template.findResources('AWS::KMS::Key');
      const keyResource = Object.values(kmsKey)[0];
      expect(keyResource.DeletionPolicy).toBe('Delete');
    });

    test('links KMS key to S3 bucket encryption', () => {
      const bucket = template.findResources('AWS::S3::Bucket');
      const bucketResource = Object.values(bucket)[0];
      const encryption = bucketResource.Properties.BucketEncryption;
      
      expect(encryption.ServerSideEncryptionConfiguration[0].ServerSideEncryptionByDefault.KMSMasterKeyID).toBeDefined();
    });
  });
});