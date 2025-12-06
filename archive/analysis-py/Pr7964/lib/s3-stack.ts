/**
 * S3 Stack - Artifact storage with encryption and lifecycle rules
 *
 * This stack creates an S3 bucket for storing CodePipeline artifacts with:
 * - AES256 encryption at rest
 * - Versioning enabled
 * - Lifecycle rules to manage old artifacts
 * - Public access blocked
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface S3StackArgs {
  environmentSuffix: string;
  region: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class S3Stack extends pulumi.ComponentResource {
  public readonly artifactBucketName: pulumi.Output<string>;
  public readonly artifactBucketArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: S3StackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:cicd:S3Stack', name, args, opts);

    // Artifact Bucket
    const artifactBucket = new aws.s3.Bucket(
      `pipeline-artifacts-${args.environmentSuffix}`,
      {
        bucket: `pipeline-artifacts-${args.environmentSuffix}`,
        tags: args.tags,
      },
      { parent: this }
    );

    // Enable Versioning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketVersioning = new aws.s3.BucketVersioningV2(
      `pipeline-artifacts-versioning-${args.environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Server-Side Encryption
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `pipeline-artifacts-encryption-${args.environmentSuffix}`,
        {
          bucket: artifactBucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        { parent: this }
      );

    // Lifecycle Rules
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(
      `pipeline-artifacts-lifecycle-${args.environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        rules: [
          {
            id: 'expire-old-artifacts',
            status: 'Enabled',
            expiration: {
              days: 30,
            },
            noncurrentVersionExpiration: {
              noncurrentDays: 7,
            },
          },
          {
            id: 'transition-to-ia',
            status: 'Enabled',
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    // Block Public Access
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `pipeline-artifacts-public-access-block-${args.environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Bucket Ownership Controls - enforce bucket owner for all objects
    // This is required for ACL-free bucket configuration (modern S3 best practice)
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const bucketOwnershipControls = new aws.s3.BucketOwnershipControls(
      `pipeline-artifacts-ownership-${args.environmentSuffix}`,
      {
        bucket: artifactBucket.id,
        rule: {
          objectOwnership: 'BucketOwnerEnforced',
        },
      },
      { parent: this }
    );

    this.artifactBucketName = artifactBucket.bucket;
    this.artifactBucketArn = artifactBucket.arn;

    this.registerOutputs({
      artifactBucketName: this.artifactBucketName,
      artifactBucketArn: this.artifactBucketArn,
    });
  }
}
