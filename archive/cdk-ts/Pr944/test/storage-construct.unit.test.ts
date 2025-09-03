import * as cdk from 'aws-cdk-lib';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { StorageConstruct } from '../lib/storage-construct';

describe('StorageConstruct', () => {
  let stack: cdk.Stack;
  let template: Template;
  let storageConstruct: StorageConstruct;
  let kmsKey: cdk.aws_kms.Key;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    kmsKey = new cdk.aws_kms.Key(stack, 'TestKey', {
      enableKeyRotation: true,
    });

    storageConstruct = new StorageConstruct(stack, 'Storage', {
      environmentSuffix: 'test',
      region: 'us-east-1',
      kmsKey,
    });

    template = Template.fromStack(stack);
  });

  describe('S3 Bucket Configuration', () => {
    test('should create S3 bucket with correct naming', () => {
      template.hasResourceProperties('AWS::S3::Bucket',
        Match.objectLike({
          BucketName: 'test-main-bucket-us-east-1-123456789012',
        })
      );
    });

    test('should enable KMS encryption', () => {
      template.hasResourceProperties('AWS::S3::Bucket',
        Match.objectLike({
          BucketEncryption: Match.objectLike({
            ServerSideEncryptionConfiguration: Match.arrayWith([
              Match.objectLike({
                ServerSideEncryptionByDefault: Match.objectLike({
                  SSEAlgorithm: 'aws:kms',
                  KMSMasterKeyID: Match.anyValue(),
                }),
                BucketKeyEnabled: true,
              }),
            ]),
          }),
        })
      );
    });

    test('should enable versioning', () => {
      template.hasResourceProperties('AWS::S3::Bucket',
        Match.objectLike({
          VersioningConfiguration: Match.objectLike({
            Status: 'Enabled',
          }),
        })
      );
    });

    test('should block all public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket',
        Match.objectLike({
          PublicAccessBlockConfiguration: Match.objectLike({
            BlockPublicAcls: true,
            BlockPublicPolicy: true,
            IgnorePublicAcls: true,
            RestrictPublicBuckets: true,
          }),
        })
      );
    });

    test('should enforce SSL', () => {
      template.hasResourceProperties('AWS::S3::BucketPolicy',
        Match.objectLike({
          PolicyDocument: Match.objectLike({
            Statement: Match.arrayWith([
              Match.objectLike({
                Effect: 'Deny',
                Action: 's3:*',
                Condition: Match.objectLike({
                  Bool: Match.objectLike({
                    'aws:SecureTransport': 'false',
                  }),
                }),
              }),
            ]),
          }),
        })
      );
    });

    test('should configure lifecycle rules', () => {
      template.hasResourceProperties('AWS::S3::Bucket',
        Match.objectLike({
          LifecycleConfiguration: Match.objectLike({
            Rules: Match.arrayWith([
              Match.objectLike({
                Id: 'DeleteIncompleteMultipartUploads',
                AbortIncompleteMultipartUpload: Match.objectLike({
                  DaysAfterInitiation: 7,
                }),
                Status: 'Enabled',
              }),
              Match.objectLike({
                Id: 'TransitionToIA',
                Transitions: Match.arrayWith([
                  Match.objectLike({
                    StorageClass: 'STANDARD_IA',
                    TransitionInDays: 30,
                  }),
                ]),
                Status: 'Enabled',
              }),
            ]),
          }),
        })
      );
    });

    test('should set DESTROY removal policy for dev/test', () => {
      const bucketResource = template.findResources('AWS::S3::Bucket', {
        Properties: Match.objectLike({
          BucketName: 'test-main-bucket-us-east-1-123456789012',
        }),
      });

      const bucketResourceKeys = Object.keys(bucketResource);
      expect(bucketResourceKeys.length).toBeGreaterThan(0);
      
      const bucketResourceLogicalId = bucketResourceKeys[0];
      expect(bucketResource[bucketResourceLogicalId].DeletionPolicy).toBe('Delete');
    });

    test('should enable auto-delete objects', () => {
      // Check for the custom resource that handles auto-delete
      template.hasResourceProperties('Custom::S3AutoDeleteObjects',
        Match.objectLike({
          BucketName: Match.objectLike({
            Ref: Match.anyValue(),
          }),
        })
      );
    });

    test('should expose bucket', () => {
      expect(storageConstruct.bucket).toBeDefined();
      expect(storageConstruct.bucket.bucketName).toBeDefined();
    });
  });

  describe('CloudTrail Configuration', () => {
    test('should not create CloudTrail due to AWS limits', () => {
      // Verify CloudTrail is not created
      template.resourceCountIs('AWS::CloudTrail::Trail', 0);
    });

    test('should not create CloudTrail bucket', () => {
      // Verify only main bucket is created, not CloudTrail bucket
      const buckets = template.findResources('AWS::S3::Bucket');
      const bucketNames = Object.values(buckets).map((bucket: any) => 
        bucket.Properties?.BucketName
      ).filter(Boolean);
      
      expect(bucketNames).not.toContain(expect.stringContaining('cloudtrail'));
    });
  });
});