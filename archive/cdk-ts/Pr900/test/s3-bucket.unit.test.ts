import * as cdk from 'aws-cdk-lib';
import { aws_kms as kms, aws_s3 as s3 } from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { SecureBucket, SecureBucketProps } from '../lib/constructs/s3-bucket';

describe('SecureBucket', () => {
  let stack: cdk.Stack;
  let encryptionKey: kms.Key;

  beforeEach(() => {
    stack = new cdk.Stack();
    encryptionKey = new kms.Key(stack, 'TestKey');
  });

  test('creates S3 bucket with correct properties', () => {
    const props: SecureBucketProps = {
      encryptionKey,
      bucketName: 'my-secure-bucket',
    };
    const bucketConstruct = new SecureBucket(stack, 'TestBucket', props);

    expect(bucketConstruct.bucket).toBeInstanceOf(s3.Bucket);

    const template = Template.fromStack(stack);
    template.hasResourceProperties('AWS::S3::Bucket', {
      BucketName: 'my-secure-bucket',
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

    expect(bucketConstruct.bucket.encryptionKey).toBe(encryptionKey);
  });

  test('adds resource policy to deny incorrect encryption header', () => {
    const props: SecureBucketProps = { encryptionKey };
    new SecureBucket(stack, 'TestBucketPolicy', props);

    const template = Template.fromStack(stack);
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
      ])
    );
  });

  test('adds resource policy to deny unencrypted or wrong key', () => {
    const props: SecureBucketProps = { encryptionKey };
    // Instantiate the SecureBucket construct to ensure the policy is created
    new SecureBucket(stack, 'TestBucketPolicyWrongKey', props);
    const template = Template.fromStack(stack);
    // Use a flexible matcher for the PolicyDocument structure
    const bucketPolicies = template.findResources('AWS::S3::BucketPolicy');
    const policyDoc =
      Object.values(bucketPolicies)[0].Properties.PolicyDocument;
    expect(policyDoc.Statement).toEqual(
      expect.arrayContaining([
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
      ])
    );

    // Extract the actual statement from the synthesized template for further assertions
    const policies = template.findResources('AWS::S3::BucketPolicy');
    const statements =
      Object.values(policies)[0].Properties.PolicyDocument.Statement;
    const denyWrongKey = statements.find(
      (s: any) => s.Sid === 'DenyUnEncryptedOrWrongKey'
    );

    expect(denyWrongKey?.Effect).toBe('Deny');
    expect(denyWrongKey?.Action).toContain('s3:PutObject');
    expect(denyWrongKey?.Condition?.StringNotEquals).toHaveProperty(
      's3:x-amz-server-side-encryption-aws-kms-key-id',
      expect.anything()
    );
  });

  test('works without bucketName', () => {
    const props: SecureBucketProps = { encryptionKey };
    const bucketConstruct = new SecureBucket(stack, 'TestBucketNoName', props);
    expect(bucketConstruct.bucket.bucketName).toBeDefined();
  });

  test('throws if missing encryptionKey', () => {
    // @ts-expect-error
    expect(() => new SecureBucket(stack, 'MissingKey', {})).toThrow();
  });

  test('adds bucket policy to enforce SSL', () => {
    const props: SecureBucketProps = { encryptionKey };
    new SecureBucket(stack, 'TestBucketSSL', props);

    const template = Template.fromStack(stack);
    const policies = template.findResources('AWS::S3::BucketPolicy');
    const statements =
      Object.values(policies)[0].Properties.PolicyDocument.Statement;
    expect(statements).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          Action: 's3:*',
          Effect: 'Deny',
          Principal: { AWS: '*' },
          Condition: expect.objectContaining({
            Bool: { 'aws:SecureTransport': 'false' },
          }),
        }),
      ])
    );
  });
});
