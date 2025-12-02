/**
 * artifact-bucket.ts
 *
 * Creates an S3 bucket for storing CodeBuild artifacts with versioning enabled.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface ArtifactBucketArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class ArtifactBucket extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly bucketArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: ArtifactBucketArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:s3:ArtifactBucket', name, {}, opts);

    // Create S3 bucket for artifacts
    const bucket = new aws.s3.Bucket(
      `artifacts-${args.environmentSuffix}`,
      {
        bucket: `codebuild-artifacts-${args.environmentSuffix}`,
        tags: args.tags,
        forceDestroy: true, // Enable destroyability - bucket can be deleted even with objects
      },
      { parent: this }
    );

    // Enable versioning on the bucket
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketVersioning = new aws.s3.BucketVersioningV2(
      `artifacts-versioning-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Enable server-side encryption
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `artifacts-encryption-${args.environmentSuffix}`,
        {
          bucket: bucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
            },
          ],
        },
        { parent: this }
      );

    // Block public access
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `artifacts-public-access-${args.environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    this.bucketName = bucket.id;
    this.bucketArn = bucket.arn;

    this.registerOutputs({
      bucketName: this.bucketName,
      bucketArn: this.bucketArn,
    });
  }
}
