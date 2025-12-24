import * as cdk from 'aws-cdk-lib';
import { aws_kms as kms } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SecureBucket, SecureBucketProps } from '../lib/constructs/s3-bucket';

describe('SecureBucket Integration', () => {
  let stack: cdk.Stack;
  let encryptionKey: kms.Key;

  beforeEach(() => {
    stack = new cdk.Stack();
    encryptionKey = new kms.Key(stack, 'IntegrationTestKey');
  });

  test('synthesizes all expected resources and policies', () => {
    const props: SecureBucketProps = {
      encryptionKey,
      bucketName: 'integration-bucket',
    };
    new SecureBucket(stack, 'IntegrationBucket', props);

    const template = Template.fromStack(stack);

    // S3 Bucket
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'integration-bucket',
      BucketEncryption: {
        ServerSideEncryptionConfiguration: [
          {
            ServerSideEncryptionByDefault: {
              SSEAlgorithm: 'aws:kms',
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
    });

    // S3 Bucket Policy
    const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
    const policyDoc =
      Object.values(bucketPolicies)[0].Properties.PolicyDocument;
    expect(policyDoc.Statement).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Sid: 'DenyIncorrectEncryptionHeader',
          Effect: 'Deny',
          Action: 's3:PutObject',
          Condition: {
            StringNotEquals: {
              's3:x-amz-server-side-encryption': 'aws:kms',
            },
          },
        }),
        expect.objectContaining({
          Sid: 'DenyUnEncryptedOrWrongKey',
          Effect: 'Deny',
          Action: 's3:PutObject',
          Condition: {
            StringNotEquals: {
              's3:x-amz-server-side-encryption-aws-kms-key-id':
                expect.anything(),
            },
          },
        }),
        expect.objectContaining({
          Effect: 'Deny',
          Action: 's3:*',
          Principal: { AWS: '*' },
          Condition: expect.objectContaining({
            Bool: { 'aws:SecureTransport': 'false' },
          }),
        }),
      ])
    );
  });
});
