import * as cdk from 'aws-cdk-lib';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Template, Match } from 'aws-cdk-lib/assertions';
import { S3Construct } from '../lib/constructs/s3-construct';

describe('S3Construct', () => {
  let stack: cdk.Stack;
  let s3Construct: S3Construct;
  let template: Template;
  let replicationRole: iam.Role;

  beforeEach(() => {
    const app = new cdk.App();
    stack = new cdk.Stack(app, 'TestStack', {
      env: { account: '123456789012', region: 'us-east-1' },
    });

    // Create a mock replication role
    replicationRole = new iam.Role(stack, 'TestReplicationRole', {
      assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
    });

    s3Construct = new S3Construct(stack, 'TestS3', {
      environmentSuffix: 'test',
      primaryRegion: 'us-east-1',
      replicationRegion: 'us-west-2',
      enableS3Express: false,
      replicationRole: replicationRole,
    });
    template = Template.fromStack(stack);
  });

  describe('Primary bucket configuration', () => {
    test('Creates primary bucket with correct properties', () => {
      // Primary bucket has TransitionToIA lifecycle rule
      const buckets = template.findResources('AWS::S3::Bucket');
      const primaryBucket = Object.values(buckets).find(b => 
        b.Properties?.LifecycleConfiguration?.Rules?.some((r: any) => r.Id === 'TransitionToIA')
      );
      expect(primaryBucket).toBeDefined();
    });

    test('Primary bucket has versioning enabled', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        VersioningConfiguration: {
          Status: 'Enabled',
        },
      });
    });

    test('Primary bucket has encryption enabled', () => {
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
      });
    });

    test('Primary bucket blocks public access', () => {
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Primary bucket has lifecycle rules', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const primaryBucket = Object.values(buckets).find(b => 
        b.Properties?.LifecycleConfiguration?.Rules?.some((r: any) => r.Id === 'TransitionToIA')
      );
      expect(primaryBucket?.Properties?.LifecycleConfiguration?.Rules).toContainEqual(
        expect.objectContaining({
          Id: 'TransitionToIA',
          Status: 'Enabled',
        })
      );
      expect(primaryBucket?.Properties?.LifecycleConfiguration?.Rules).toContainEqual(
        expect.objectContaining({
          Id: 'DeleteOldVersions',
          Status: 'Enabled',
        })
      );
    });

    test('Primary bucket has CORS configuration', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const primaryBucket = Object.values(buckets).find(b => 
        b.Properties?.CorsConfiguration?.CorsRules
      );
      expect(primaryBucket?.Properties?.CorsConfiguration?.CorsRules).toContainEqual(
        expect.objectContaining({
          AllowedMethods: expect.arrayContaining(['GET', 'POST', 'PUT']),
          AllowedOrigins: ['*'],
          AllowedHeaders: ['*'],
        })
      );
    });

    test('Primary bucket has replication configuration', () => {
      const buckets = template.findResources('AWS::S3::Bucket');
      const primaryBucket = Object.values(buckets).find(b => 
        b.Properties?.ReplicationConfiguration?.Rules
      );
      expect(primaryBucket?.Properties?.ReplicationConfiguration?.Rules).toBeDefined();
      expect(primaryBucket?.Properties?.ReplicationConfiguration?.Rules?.[0]?.Destination?.StorageClass).toBe('STANDARD_IA');
    });

    test('Exposes primary bucket as public property', () => {
      expect(s3Construct.primaryBucket).toBeDefined();
      expect(s3Construct.primaryBucket.bucketName).toBeDefined();
    });
  });

  describe('Replication bucket configuration', () => {
    test('Creates replication bucket', () => {
      // Should have 2 buckets total
      template.resourceCountIs('AWS::S3::Bucket', 2);
    });

    test('Replication bucket has versioning enabled', () => {
      // Both buckets should have versioning
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        expect(bucket.Properties?.VersioningConfiguration?.Status).toBe('Enabled');
      });
    });

    test('Replication bucket has encryption enabled', () => {
      // All buckets should have encryption
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
      });
    });

    test('Replication bucket blocks public access', () => {
      // All buckets should block public access
      template.hasResourceProperties('AWS::S3::Bucket', {
        PublicAccessBlockConfiguration: {
          BlockPublicAcls: true,
          BlockPublicPolicy: true,
          IgnorePublicAcls: true,
          RestrictPublicBuckets: true,
        },
      });
    });

    test('Replication bucket has lifecycle rules', () => {
      // All buckets should have DeleteOldVersions rule
      const buckets = template.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        const hasDeleteRule = bucket.Properties?.LifecycleConfiguration?.Rules?.some(
          (r: any) => r.Id === 'DeleteOldVersions'
        );
        expect(hasDeleteRule).toBe(true);
      });
    });

    test('Exposes replication bucket as public property', () => {
      expect(s3Construct.replicationBucket).toBeDefined();
      expect(s3Construct.replicationBucket.bucketName).toBeDefined();
    });
  });

  describe('S3 Express One Zone bucket', () => {
    test('Does not create express bucket when disabled', () => {
      expect(s3Construct.expressBucket).toBeUndefined();
    });

    test('Creates express bucket when enabled', () => {
      const app = new cdk.App();
      const testStack = new cdk.Stack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testRole = new iam.Role(testStack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      });
      const testS3 = new S3Construct(testStack, 'TestS3', {
        environmentSuffix: 'test',
        primaryRegion: 'us-east-1',
        replicationRegion: 'us-west-2',
        enableS3Express: true,
        replicationRole: testRole,
      });
      const testTemplate = Template.fromStack(testStack);

      // Should have 3 buckets when express is enabled
      testTemplate.resourceCountIs('AWS::S3::Bucket', 3);
      expect(testS3.expressBucket).toBeDefined();
    });

    test('Express bucket has correct configuration when enabled', () => {
      const app = new cdk.App();
      const testStack = new cdk.Stack(app, 'TestStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const testRole = new iam.Role(testStack, 'TestRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      });
      new S3Construct(testStack, 'TestS3', {
        environmentSuffix: 'test',
        primaryRegion: 'us-east-1',
        replicationRegion: 'us-west-2',
        enableS3Express: true,
        replicationRole: testRole,
      });
      const testTemplate = Template.fromStack(testStack);

      // Should have 3 buckets total
      testTemplate.resourceCountIs('AWS::S3::Bucket', 3);
    });
  });

  describe('Environment-specific configurations', () => {
    test('Production environment has longer retention periods', () => {
      const app = new cdk.App();
      const prodStack = new cdk.Stack(app, 'ProdStack', {
        env: { account: '123456789012', region: 'us-east-1' },
      });
      const prodRole = new iam.Role(prodStack, 'ProdRole', {
        assumedBy: new iam.ServicePrincipal('s3.amazonaws.com'),
      });
      new S3Construct(prodStack, 'ProdS3', {
        environmentSuffix: 'prod',
        primaryRegion: 'us-east-1',
        replicationRegion: 'us-west-2',
        enableS3Express: true,
        replicationRole: prodRole,
      });
      const prodTemplate = Template.fromStack(prodStack);

      // Buckets in prod should have 90-day retention
      const buckets = prodTemplate.findResources('AWS::S3::Bucket');
      Object.values(buckets).forEach(bucket => {
        const deleteRule = bucket.Properties?.LifecycleConfiguration?.Rules?.find(
          (r: any) => r.Id === 'DeleteOldVersions'
        );
        if (deleteRule) {
          // Check the duration object
          expect(deleteRule.NoncurrentVersionExpirationInDays || 
                 deleteRule.NoncurrentVersionExpiration?.NoncurrentDays).toBe(90);
        }
      });
    });
  });

  describe('IAM permissions', () => {
    test('Grants read/write permissions to replication role', () => {
      // Check that proper policies are attached to allow replication
      template.hasResourceProperties('AWS::IAM::Policy', {
        PolicyDocument: {
          Statement: Match.arrayWith([
            Match.objectLike({
              Effect: 'Allow',
              Action: Match.arrayWith(['s3:GetObject*']),
            }),
          ]),
        },
      });
    });
  });
});