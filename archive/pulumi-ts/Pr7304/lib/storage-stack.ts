/**
 * storage-stack.ts
 *
 * S3 buckets with cross-region replication and RTC enabled.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface StorageStackArgs {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly primaryBucketName: pulumi.Output<string>;
  public readonly secondaryBucketName: pulumi.Output<string>;
  public readonly primaryKmsKeyId: pulumi.Output<string>;
  public readonly secondaryKmsKeyId: pulumi.Output<string>;

  constructor(
    name: string,
    args: StorageStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:storage:StorageStack', name, args, opts);

    const { environmentSuffix, primaryRegion, secondaryRegion, tags } = args;

    // Providers
    const primaryProvider = new aws.Provider(
      `storage-primary-provider-${environmentSuffix}`,
      {
        region: primaryRegion,
      },
      { parent: this }
    );

    const secondaryProvider = new aws.Provider(
      `storage-secondary-provider-${environmentSuffix}`,
      {
        region: secondaryRegion,
      },
      { parent: this }
    );

    // KMS Keys for encryption
    const primaryKmsKey = new aws.kms.Key(
      `primary-s3-kms-key-${environmentSuffix}`,
      {
        description: `Primary S3 encryption key for ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: {
          ...tags,
          Name: `primary-s3-kms-key-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    const secondaryKmsKey = new aws.kms.Key(
      `secondary-s3-kms-key-${environmentSuffix}`,
      {
        description: `Secondary S3 encryption key for ${environmentSuffix}`,
        enableKeyRotation: true,
        tags: {
          ...tags,
          Name: `secondary-s3-kms-key-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Secondary Bucket (destination)
    const secondaryBucket = new aws.s3.Bucket(
      `secondary-bucket-${environmentSuffix}`,
      {
        bucket: `dr-secondary-${environmentSuffix}-${secondaryRegion}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: secondaryKmsKey.arn,
            },
          },
        },
        tags: {
          ...tags,
          Name: `secondary-bucket-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: secondaryProvider }
    );

    // Block public access for secondary bucket
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _secondaryBlockPublic = new aws.s3.BucketPublicAccessBlock(
      `secondary-bucket-block-public-${environmentSuffix}`,
      {
        bucket: secondaryBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this, provider: secondaryProvider }
    );

    // IAM Role for S3 Replication
    const replicationRole = new aws.iam.Role(
      `s3-replication-role-${environmentSuffix}`,
      {
        assumeRolePolicy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: 'sts:AssumeRole',
            },
          ],
        }),
        tags: {
          ...tags,
          Name: `s3-replication-role-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      { parent: this, provider: primaryProvider }
    );

    // IAM Policy for S3 Replication
    const replicationPolicy = new aws.iam.RolePolicy(
      `s3-replication-policy-${environmentSuffix}`,
      {
        role: replicationRole.id,
        policy: pulumi
          .all([secondaryBucket.arn, primaryKmsKey.arn, secondaryKmsKey.arn])
          .apply(([destArn, srcKeyArn, destKeyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObjectVersionForReplication',
                    's3:GetObjectVersionAcl',
                    's3:GetObjectVersionTagging',
                  ],
                  Resource: '*',
                },
                {
                  Effect: 'Allow',
                  Action: [
                    's3:ReplicateObject',
                    's3:ReplicateDelete',
                    's3:ReplicateTags',
                  ],
                  Resource: `${destArn}/*`,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:DescribeKey'],
                  Resource: srcKeyArn,
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Encrypt', 'kms:DescribeKey'],
                  Resource: destKeyArn,
                },
              ],
            })
          ),
      },
      { parent: this, provider: primaryProvider }
    );

    // Primary Bucket (source) with replication
    const primaryBucket = new aws.s3.Bucket(
      `primary-bucket-${environmentSuffix}`,
      {
        bucket: `dr-primary-${environmentSuffix}-${primaryRegion}`,
        versioning: {
          enabled: true,
        },
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: primaryKmsKey.arn,
            },
          },
        },
        replicationConfiguration: {
          role: replicationRole.arn,
          rules: [
            {
              id: `replicate-all-${environmentSuffix}`,
              status: 'Enabled',
              priority: 1,
              filter: {},
              destination: {
                bucket: secondaryBucket.arn,
                replicationTime: {
                  status: 'Enabled',
                  minutes: 15,
                },
                metrics: {
                  status: 'Enabled',
                  minutes: 15,
                },
              },
            },
          ],
        },
        tags: {
          ...tags,
          Name: `primary-bucket-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        },
      },
      {
        parent: this,
        provider: primaryProvider,
        dependsOn: [replicationPolicy, secondaryBucket],
      }
    );

    // Block public access for primary bucket
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const _primaryBlockPublic = new aws.s3.BucketPublicAccessBlock(
      `primary-bucket-block-public-${environmentSuffix}`,
      {
        bucket: primaryBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this, provider: primaryProvider }
    );

    // Outputs
    this.primaryBucketName = primaryBucket.id;
    this.secondaryBucketName = secondaryBucket.id;
    this.primaryKmsKeyId = primaryKmsKey.arn;
    this.secondaryKmsKeyId = secondaryKmsKey.arn;

    this.registerOutputs({
      primaryBucketName: this.primaryBucketName,
      secondaryBucketName: this.secondaryBucketName,
      primaryKmsKeyId: this.primaryKmsKeyId,
      secondaryKmsKeyId: this.secondaryKmsKeyId,
    });
  }
}
