import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class StorageComponent extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketVersioning: aws.s3.BucketVersioningV2;
  public readonly bucketPolicy?: aws.s3.BucketPolicy;
  public readonly replicationConfig?: aws.s3.BucketReplicationConfig;

  constructor(
    name: string,
    args: {
      environmentSuffix: string;
      region: string;
      isPrimary: boolean;
      destinationBucketArn?: pulumi.Output<string>;
      replicationRoleArn?: pulumi.Output<string>;
      tags: { [key: string]: string };
    },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:storage:StorageComponent', name, {}, opts);

    const tags = {
      ...args.tags,
      Name: `${name}-${args.region}-${args.environmentSuffix}`,
      Region: args.region,
      'DR-Role': args.isPrimary ? 'primary' : 'secondary',
    };

    // Create S3 Bucket
    this.bucket = new aws.s3.Bucket(
      `${name}-bucket`,
      {
        bucket: `healthcare-assets-${args.region}-${args.environmentSuffix}`,
        forceDestroy: true,
        tags: {
          ...tags,
          Name: `bucket-${args.region}-${args.environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Enable Versioning
    this.bucketVersioning = new aws.s3.BucketVersioningV2(
      `${name}-versioning`,
      {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      },
      { parent: this }
    );

    // Add bucket policy for replication role (DR bucket only)
    if (!args.isPrimary && args.replicationRoleArn) {
      this.bucketPolicy = new aws.s3.BucketPolicy(
        `${name}-replication-policy`,
        {
          bucket: this.bucket.id,
          policy: pulumi
            .all([this.bucket.arn, args.replicationRoleArn])
            .apply(([bucketArn, roleArn]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Sid: 'AllowReplicationRole',
                    Effect: 'Allow',
                    Principal: {
                      AWS: roleArn,
                    },
                    Action: [
                      's3:ReplicateObject',
                      's3:ReplicateDelete',
                      's3:ReplicateTags',
                      's3:GetObjectVersionForReplication',
                      's3:ObjectOwnerOverrideToBucketOwner',
                    ],
                    Resource: `${bucketArn}/*`,
                  },
                  {
                    Sid: 'AllowReplicationRoleGetBucket',
                    Effect: 'Allow',
                    Principal: {
                      AWS: roleArn,
                    },
                    Action: [
                      's3:List*',
                      's3:GetBucketVersioning',
                      's3:GetBucketObjectLockConfiguration',
                    ],
                    Resource: bucketArn,
                  },
                ],
              })
            ),
        },
        { parent: this, dependsOn: [this.bucketVersioning] }
      );
    }

    // Configure Replication (Primary only)
    if (
      args.isPrimary &&
      args.destinationBucketArn &&
      args.replicationRoleArn
    ) {
      this.replicationConfig = new aws.s3.BucketReplicationConfig(
        `${name}-replication`,
        {
          bucket: this.bucket.id,
          role: args.replicationRoleArn,
          rules: [
            {
              id: 'replicate-all',
              status: 'Enabled',
              priority: 1,
              deleteMarkerReplication: {
                status: 'Enabled',
              },
              filter: {},
              destination: {
                bucket: args.destinationBucketArn,
                replicationTime: {
                  status: 'Enabled',
                  time: {
                    minutes: 15,
                  },
                },
                metrics: {
                  status: 'Enabled',
                  eventThreshold: {
                    minutes: 15,
                  },
                },
              },
            },
          ],
        },
        { parent: this, dependsOn: [this.bucketVersioning] }
      );
    }

    // Lifecycle Rule
    new aws.s3.BucketLifecycleConfigurationV2(
      `${name}-lifecycle`,
      {
        bucket: this.bucket.id,
        rules: [
          {
            id: 'transition-old-versions',
            status: 'Enabled',
            noncurrentVersionTransitions: [
              {
                noncurrentDays: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                noncurrentDays: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
      },
      { parent: this }
    );

    this.registerOutputs({
      bucketName: this.bucket.id,
      bucketArn: this.bucket.arn,
    });
  }
}
