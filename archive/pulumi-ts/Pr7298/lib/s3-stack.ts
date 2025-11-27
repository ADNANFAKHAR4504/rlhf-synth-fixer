/**
 * s3-stack.ts
 *
 * Defines S3 bucket for CodePipeline artifacts.
 *
 * Features:
 * - KMS encryption (customer-managed key)
 * - Versioning enabled
 * - Lifecycle policy (delete old versions after 30 days)
 * - Block public access
 * - Bucket policy for CodePipeline access
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface S3StackArgs {
  environmentSuffix: string;
  kmsKeyId: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly artifactsBucket: aws.s3.Bucket;
  public readonly artifactsBucketArn: pulumi.Output<string>;
  public readonly bucketPublicAccessBlock: aws.s3.BucketPublicAccessBlock;
  public readonly bucketPolicy: aws.s3.BucketPolicy;

  constructor(
    name: string,
    args: S3StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:s3:S3Stack', name, args, opts);

    const { environmentSuffix, kmsKeyId, kmsKeyArn, tags } = args;

    // Create S3 bucket for artifacts
    this.artifactsBucket = new aws.s3.Bucket(
      `cicd-artifacts-${environmentSuffix}`,
      {
        bucket: `cicd-artifacts-${environmentSuffix}`,
        acl: 'private',
        versioning: {
          enabled: true, // Enable versioning
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyId, // Use KMS customer-managed key
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            enabled: true,
            id: 'delete-old-versions',
            noncurrentVersionExpiration: {
              days: 30, // Delete old versions after 30 days
            },
          },
          {
            enabled: true,
            id: 'abort-incomplete-uploads',
            abortIncompleteMultipartUploadDays: 7,
          },
        ],
        tags: {
          ...tags,
          Name: `cicd-artifacts-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.artifactsBucketArn = this.artifactsBucket.arn;

    // Block public access
    this.bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `cicd-artifacts-block-public-${environmentSuffix}`,
      {
        bucket: this.artifactsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Bucket policy for CodePipeline access
    const current = aws.getCallerIdentity({});

    this.bucketPolicy = new aws.s3.BucketPolicy(
      `cicd-artifacts-policy-${environmentSuffix}`,
      {
        bucket: this.artifactsBucket.id,
        policy: pulumi.all([current, kmsKeyArn]).apply(([_caller, _keyArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'DenyUnencryptedObjectUploads',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:PutObject',
                Resource: `arn:aws:s3:::cicd-artifacts-${environmentSuffix}/*`,
                Condition: {
                  StringNotEquals: {
                    's3:x-amz-server-side-encryption': 'aws:kms',
                  },
                },
              },
              {
                Sid: 'DenyInsecureTransport',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [
                  `arn:aws:s3:::cicd-artifacts-${environmentSuffix}`,
                  `arn:aws:s3:::cicd-artifacts-${environmentSuffix}/*`,
                ],
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false',
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    this.registerOutputs({
      artifactsBucketName: this.artifactsBucket.bucket,
      artifactsBucketArn: this.artifactsBucket.arn,
    });
  }
}
