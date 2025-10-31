import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';
import { S3Buckets } from './s3-buckets';
import { BucketPolicies } from './bucket-policies';
import { IamRoles } from './iam-roles';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly developerRoleArn: pulumi.Output<string>;
  public readonly analystRoleArn: pulumi.Output<string>;
  public readonly adminRoleArn: pulumi.Output<string>;
  public readonly publicBucketName: pulumi.Output<string>;
  public readonly internalBucketName: pulumi.Output<string>;
  public readonly confidentialBucketName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create KMS key for confidential bucket encryption
    const kmsKey = new aws.kms.Key(
      `confidential-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for confidential bucket encryption - ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Purpose: 'confidential-bucket-encryption',
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `confidential-kms-alias-${environmentSuffix}`,
      {
        name: `alias/confidential-bucket-${environmentSuffix}`,
        targetKeyId: kmsKey.id,
      },
      { parent: this }
    );

    // Create S3 buckets
    const s3Buckets = new S3Buckets(
      's3-buckets',
      {
        environmentSuffix,
        kmsKey,
        tags,
      },
      { parent: this }
    );

    // Create bucket policies
    new BucketPolicies(
      'bucket-policies',
      {
        environmentSuffix,
        publicBucket: s3Buckets.publicBucket,
        internalBucket: s3Buckets.internalBucket,
        confidentialBucket: s3Buckets.confidentialBucket,
      },
      { parent: this }
    );

    // Create IAM roles
    const iamRoles = new IamRoles(
      'iam-roles',
      {
        environmentSuffix,
        publicBucket: s3Buckets.publicBucket,
        internalBucket: s3Buckets.internalBucket,
        confidentialBucket: s3Buckets.confidentialBucket,
        kmsKey,
        tags,
      },
      { parent: this }
    );

    // Set outputs
    this.developerRoleArn = iamRoles.developerRole.arn;
    this.analystRoleArn = iamRoles.analystRole.arn;
    this.adminRoleArn = iamRoles.adminRole.arn;
    this.publicBucketName = s3Buckets.publicBucket.id;
    this.internalBucketName = s3Buckets.internalBucket.id;
    this.confidentialBucketName = s3Buckets.confidentialBucket.id;

    this.registerOutputs({
      developerRoleArn: this.developerRoleArn,
      analystRoleArn: this.analystRoleArn,
      adminRoleArn: this.adminRoleArn,
      publicBucketName: this.publicBucketName,
      internalBucketName: this.internalBucketName,
      confidentialBucketName: this.confidentialBucketName,
    });
  }
}
