import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface SecureS3BucketArgs {
  bucketName?: string;
  kmsKeyId: pulumi.Input<string>;
  tags?: Record<string, string>;
  lifecycleRules?: any[];
}

export class SecureS3Bucket extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketPolicy: aws.s3.BucketPolicy;
  public readonly publicAccessBlock: aws.s3.BucketPublicAccessBlock;

  constructor(
    name: string,
    args: SecureS3BucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:SecureS3Bucket', name, {}, opts);

    // Create S3 bucket
    this.bucket = new aws.s3.Bucket(
      `${name}-bucket`,
      {
        bucket: args.bucketName,
        forceDestroy: false,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    // Enable versioning
    new aws.s3.BucketVersioning(
      `${name}-versioning`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
          mfaDelete: 'Disabled', // Can be enabled if MFA delete is required
        },
      },
      { parent: this }
    );

    // Configure server-side encryption
    new aws.s3.BucketServerSideEncryptionConfiguration(
      `${name}-encryption`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: args.kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        ],
      },
      { parent: this }
    );

    // Block all public access
    this.publicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `${name}-public-access-block`,
      {
        bucket: this.bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Secure bucket policy
    const bucketPolicyDocument = pulumi
      .all([this.bucket.arn])
      .apply(([bucketArn]) => ({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'DenyInsecureConnections',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:*',
            Resource: [bucketArn, `${bucketArn}/*`],
            Condition: {
              Bool: {
                'aws:SecureTransport': 'false',
              },
            },
          },
          {
            Sid: 'DenyUnencryptedObjectUploads',
            Effect: 'Deny',
            Principal: '*',
            Action: 's3:PutObject',
            Resource: `${bucketArn}/*`,
            Condition: {
              StringNotEquals: {
                's3:x-amz-server-side-encryption': 'aws:kms',
              },
            },
          },
        ],
      }));

    this.bucketPolicy = new aws.s3.BucketPolicy(
      `${name}-policy`,
      {
        bucket: this.bucket.id,
        policy: bucketPolicyDocument.apply(policy => JSON.stringify(policy)),
      },
      { parent: this, dependsOn: [this.publicAccessBlock] }
    );

    // Configure lifecycle rules if provided
    if (args.lifecycleRules) {
      new aws.s3.BucketLifecycleConfiguration(
        `${name}-lifecycle`,
        {
          bucket: this.bucket.id,
          rules: args.lifecycleRules,
        },
        { parent: this }
      );
    }

    // Enable logging
    new aws.s3.BucketLogging(
      `${name}-logging`,
      {
        bucket: this.bucket.id,
        targetBucket: this.bucket.id,
        targetPrefix: 'access-logs/',
      },
      { parent: this }
    );

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
      bucketDomainName: this.bucket.bucketDomainName,
    });
  }
}
