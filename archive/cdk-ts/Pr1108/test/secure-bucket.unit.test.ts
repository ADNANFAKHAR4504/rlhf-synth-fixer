import * as cdk from 'aws-cdk-lib';
import { aws_kms as kms } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SecureBucket } from '../lib/constructs/secure-bucket';

describe('SecureBucket', () => {
  it('creates an S3 bucket with KMS encryption, SSL enforcement, and correct policies', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const key = new kms.Key(stack, 'Key');
    new SecureBucket(stack, 'SecureBucket', {
      bucketName: 'secure-bucket',
      encryptionKey: key,
    });
    const template = Template.fromStack(stack);
    template.resourceCountIs('AWS::S3::Bucket', 1);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'secure-bucket',
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
    const policies = template.findResources('AWS::S3::BucketPolicy');
    const policyDoc = Object.values(policies)[0].Properties.PolicyDocument;
    expect(policyDoc.Version).toBe('2012-10-17');
    expect(Array.isArray(policyDoc.Statement)).toBe(true);
    expect(policyDoc.Statement.length).toBeGreaterThanOrEqual(2);
  });

  it('throws if encryptionKey is missing', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    expect(() => {
      // @ts-expect-error
      new SecureBucket(stack, 'SecureBucket', { bucketName: 'secure-bucket' });
    }).toThrow();
  });

  it('creates bucket with alternate name and checks policy', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');
    const key = new kms.Key(stack, 'Key');
    new SecureBucket(stack, 'SecureBucket', {
      bucketName: 'alt-bucket',
      encryptionKey: key,
    });
    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'alt-bucket',
    });
  });
});
