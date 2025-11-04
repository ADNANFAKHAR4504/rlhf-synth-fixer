/**
 * storage-stack.ts
 *
 * S3 buckets for transaction archive, audit logs, and data lake
 * Features: versioning, lifecycle policies, cross-region replication,
 * encryption, Object Lock for WORM compliance
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface StorageStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
  regions: {
    primary: string;
    replicas: string[];
  };
  kmsKeyId: pulumi.Input<string>;
  kmsKeyArn: pulumi.Input<string>;
  enableCrossRegionReplication: boolean;
  enableObjectLock: boolean;
  enableVersioning: boolean;
}

export class StorageStack extends pulumi.ComponentResource {
  public readonly transactionBucketName: pulumi.Output<string>;
  public readonly archiveBucketName: pulumi.Output<string>;
  public readonly auditLogBucketName: pulumi.Output<string>;
  public readonly backupBucketName: pulumi.Output<string>;
  public readonly transactionBucketArn: pulumi.Output<string>;
  public readonly archiveBucketArn: pulumi.Output<string>;
  public readonly auditLogBucketArn: pulumi.Output<string>;
  public readonly albLogsBucketName: pulumi.Output<string>; // ADDED

  constructor(
    name: string,
    args: StorageStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:storage:StorageStack', name, args, opts);

    const {
      environmentSuffix,
      tags,
      regions,
      kmsKeyId,
      kmsKeyArn,
      enableCrossRegionReplication,
      enableObjectLock,
      enableVersioning,
    } = args;

    // --- IAM Role for S3 Replication ---
    const replicationRole = new aws.iam.Role(
      `${name}-replication-role`,
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
        tags: tags,
      },
      { parent: this }
    );

    //  Transaction Archive Bucket (Primary Region)
    const transactionArchiveBucket = new aws.s3.Bucket(
      `${name}-transaction-archive`,
      {
        bucket: `banking-transaction-archive-${environmentSuffix}-${regions.primary}`,
        forceDestroy: true, // Allow deletion even if not empty
        objectLockConfiguration: enableObjectLock
          ? {
              objectLockEnabled: 'Enabled',
            }
          : undefined,
        versioning: enableVersioning
          ? {
              enabled: true,
              mfaDelete: false,
            }
          : undefined,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            id: 'transition-to-ia',
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 180,
                storageClass: 'GLACIER',
              },
              {
                days: 2555,
                storageClass: 'DEEP_ARCHIVE',
              },
            ],
          },
          {
            id: 'delete-old-versions',
            enabled: true,
            noncurrentVersionTransitions: [
              {
                days: 30,
                storageClass: 'GLACIER',
              },
            ],
            noncurrentVersionExpiration: {
              days: 2555,
            },
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          'compliance:retention': '7-years',
          'compliance:pci-dss': 'true',
        })),
      },
      { parent: this }
    );

    // Object Lock Configuration (if enabled)
    if (enableObjectLock) {
      new aws.s3.BucketObjectLockConfigurationV2(
        `${name}-transaction-archive-lock-config`,
        {
          bucket: transactionArchiveBucket.id,
          rule: {
            defaultRetention: {
              mode: 'GOVERNANCE',
              days: 2555,
            },
          },
        },
        { parent: this }
      );
    }

    // Block Public Access
    new aws.s3.BucketPublicAccessBlock(
      `${name}-transaction-archive-public-block`,
      {
        bucket: transactionArchiveBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Audit Log Bucket
    const auditLogBucket = new aws.s3.Bucket(
      `${name}-audit-logs`,
      {
        bucket: `banking-audit-logs-${environmentSuffix}-${regions.primary}`,
        forceDestroy: true, // Allow deletion even if not empty
        versioning: enableVersioning
          ? {
              enabled: true,
            }
          : undefined,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            id: 'transition-audit-logs',
            enabled: true,
            transitions: [
              {
                days: 90,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 365,
                storageClass: 'GLACIER',
              },
            ],
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          'compliance:audit': 'true',
          'compliance:pci-dss': 'true',
        })),
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${name}-audit-logs-public-block`,
      {
        bucket: auditLogBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Audit Log Bucket Policy (CloudTrail and other AWS services)
    new aws.s3.BucketPolicy(
      `${name}-audit-logs-policy`,
      {
        bucket: auditLogBucket.id,
        policy: pulumi
          .all([auditLogBucket.arn, auditLogBucket.id])
          .apply(([arn, _id]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Sid: 'AWSCloudTrailAclCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: arn,
                },
                {
                  Sid: 'AWSCloudTrailWrite',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'cloudtrail.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${arn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
                {
                  Sid: 'AWSConfigBucketPermissionsCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:GetBucketAcl',
                  Resource: arn,
                },
                {
                  Sid: 'AWSConfigBucketExistenceCheck',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:ListBucket',
                  Resource: arn,
                },
                {
                  Sid: 'AWSConfigWrite',
                  Effect: 'Allow',
                  Principal: {
                    Service: 'config.amazonaws.com',
                  },
                  Action: 's3:PutObject',
                  Resource: `${arn}/*`,
                  Condition: {
                    StringEquals: {
                      's3:x-amz-acl': 'bucket-owner-full-control',
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // Data Lake / Archive Bucket
    const dataLakeBucket = new aws.s3.Bucket(
      `${name}-data-lake`,
      {
        bucket: `banking-data-lake-${environmentSuffix}-${regions.primary}`,
        forceDestroy: true, // Allow deletion even if not empty
        versioning: enableVersioning
          ? {
              enabled: true,
            }
          : undefined,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            id: 'intelligent-tiering',
            enabled: true,
            transitions: [
              {
                days: 0,
                storageClass: 'INTELLIGENT_TIERING',
              },
            ],
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          'data:classification': 'confidential',
          'data:lake': 'transaction-events',
        })),
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${name}-data-lake-public-block`,
      {
        bucket: dataLakeBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // Backup Bucket
    const backupBucket = new aws.s3.Bucket(
      `${name}-backups`,
      {
        bucket: `banking-backups-${environmentSuffix}-${regions.primary}`,
        forceDestroy: true, // Allow deletion even if not empty
        versioning: enableVersioning
          ? {
              enabled: true,
            }
          : undefined,
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: kmsKeyId,
            },
            bucketKeyEnabled: true,
          },
        },
        lifecycleRules: [
          {
            id: 'backup-lifecycle',
            enabled: true,
            transitions: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
            expiration: {
              days: 2555,
            },
          },
        ],
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          'backup:type': 'database-snapshots',
        })),
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${name}-backups-public-block`,
      {
        bucket: backupBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    //  Cross-Region Replication
    // Create providers ONCE per region, then reuse them
    if (enableCrossRegionReplication && regions.replicas.length > 0) {
      // Create one provider per replica region
      const replicaProviders = new Map<string, aws.Provider>();
      regions.replicas.forEach(replicaRegion => {
        replicaProviders.set(
          replicaRegion,
          new aws.Provider(
            `provider-${replicaRegion}`,
            {
              region: replicaRegion,
            },
            { parent: this }
          )
        );
      });

      const replicaBuckets = regions.replicas.map(replicaRegion => {
        const replicaProvider = replicaProviders.get(replicaRegion)!;

        const replicaBucket = new aws.s3.Bucket(
          `${name}-transaction-archive-replica-${replicaRegion}`,
          {
            bucket: `banking-transaction-archive-${environmentSuffix}-${replicaRegion}`,
            versioning: {
              enabled: true,
            },
            serverSideEncryptionConfiguration: {
              rule: {
                applyServerSideEncryptionByDefault: {
                  sseAlgorithm: 'aws:kms',
                  kmsMasterKeyId: kmsKeyId,
                },
                bucketKeyEnabled: true,
              },
            },
            tags: pulumi.all([tags]).apply(([t]) => ({
              ...t,
              replication: 'replica',
              'source-region': regions.primary,
            })),
          },
          {
            parent: this,
            provider: replicaProvider,
          }
        );

        new aws.s3.BucketPublicAccessBlock(
          `${name}-replica-public-block-${replicaRegion}`,
          {
            bucket: replicaBucket.id,
            blockPublicAcls: true,
            blockPublicPolicy: true,
            ignorePublicAcls: true,
            restrictPublicBuckets: true,
          },
          {
            parent: this,
            provider: replicaProvider,
          }
        );

        return replicaBucket;
      });

      // Replication Role Policy
      new aws.iam.RolePolicy(
        `${name}-replication-policy`,
        {
          role: replicationRole.id,
          policy: pulumi
            .all([
              transactionArchiveBucket.arn,
              replicaBuckets.map(b => b.arn),
              kmsKeyArn,
            ])
            .apply(([sourceArn, replicaArns, keyArn]) =>
              JSON.stringify({
                Version: '2012-10-17',
                Statement: [
                  {
                    Effect: 'Allow',
                    Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
                    Resource: [sourceArn],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      's3:GetObjectVersionForReplication',
                      's3:GetObjectVersionAcl',
                      's3:GetObjectVersionTagging',
                    ],
                    Resource: [`${sourceArn}/*`],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      's3:ReplicateObject',
                      's3:ReplicateDelete',
                      's3:ReplicateTags',
                    ],
                    Resource: replicaArns.map(arn => `${arn}/*`),
                  },
                  {
                    Effect: 'Allow',
                    Action: ['kms:Decrypt', 'kms:DescribeKey'],
                    Resource: [keyArn],
                  },
                  {
                    Effect: 'Allow',
                    Action: [
                      'kms:Encrypt',
                      'kms:ReEncrypt*',
                      'kms:GenerateDataKey*',
                      'kms:DescribeKey',
                    ],
                    Resource: [keyArn],
                  },
                ],
              })
            ),
        },
        { parent: this }
      );

      // Configure Replication
      new aws.s3.BucketReplicationConfig(
        `${name}-transaction-archive-replication`,
        {
          bucket: transactionArchiveBucket.id,
          role: replicationRole.arn,
          rules: replicaBuckets.map((replicaBucket, index) => ({
            id: `replicate-to-${regions.replicas[index]}`,
            status: 'Enabled',
            priority: index + 1,
            deleteMarkerReplication: {
              status: 'Enabled',
            },
            filter: {},
            sourceSelectionCriteria: {
              sseKmsEncryptedObjects: {
                status: 'Enabled',
              },
            },
            destination: {
              bucket: replicaBucket.arn,
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
              storageClass: 'STANDARD',
              encryptionConfiguration: {
                replicaKmsKeyId: pulumi
                  .all([kmsKeyArn, kmsKeyId])
                  .apply(([arn, keyId]) => {
                    const accountId = arn.split(':')[4];
                    return `arn:aws:kms:${regions.replicas[index]}:${accountId}:key/${keyId}`;
                  }),
              },
            },
          })),
        },
        { parent: this, dependsOn: replicaBuckets }
      );
    }

    //  S3 Access Logging
    const accessLogBucket = new aws.s3.Bucket(
      `${name}-access-logs`,
      {
        bucket: `banking-s3-access-logs-${environmentSuffix}-${regions.primary}`,
        forceDestroy: true, // Allow deletion even if not empty
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            id: 'delete-old-logs',
            enabled: true,
            expiration: {
              days: 90,
            },
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${name}-access-logs-public-block`,
      {
        bucket: accessLogBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // ALB Access Logs Bucket (for Application Load Balancer)
    const albLogsBucket = new aws.s3.Bucket(
      `${name}-alb-logs`,
      {
        bucket: `banking-alb-logs-${environmentSuffix}`,
        forceDestroy: true, // Allow deletion even if not empty
        serverSideEncryptionConfiguration: {
          rule: {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        },
        lifecycleRules: [
          {
            id: 'delete-old-alb-logs',
            enabled: true,
            expiration: {
              days: 90,
            },
          },
        ],
        tags: tags,
      },
      { parent: this }
    );

    new aws.s3.BucketPublicAccessBlock(
      `${name}-alb-logs-public-block`,
      {
        bucket: albLogsBucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // ALB Bucket Policy (required for ELB service to write logs)
    new aws.s3.BucketPolicy(
      `${name}-alb-logs-policy`,
      {
        bucket: albLogsBucket.id,
        policy: pulumi.all([albLogsBucket.arn]).apply(([arn]) => {
          // ELB service account IDs by region
          const elbAccountIds: { [key: string]: string } = {
            'us-east-1': '127311923021',
            'us-east-2': '033677994240',
            'us-west-1': '027434742980',
            'us-west-2': '797873946194',
            'eu-west-1': '156460612806',
            'eu-central-1': '054676820928',
            'ap-southeast-1': '114774131450',
            'ap-southeast-2': '783225319266',
            'ap-northeast-1': '582318560864',
          };

          const elbAccountId = elbAccountIds[regions.primary] || '127311923021';

          return JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'AWSLogDeliveryWrite',
                Effect: 'Allow',
                Principal: {
                  Service: 'delivery.logs.amazonaws.com',
                },
                Action: 's3:PutObject',
                Resource: `${arn}/*`,
                Condition: {
                  StringEquals: {
                    's3:x-amz-acl': 'bucket-owner-full-control',
                  },
                },
              },
              {
                Sid: 'AWSLogDeliveryAclCheck',
                Effect: 'Allow',
                Principal: {
                  Service: 'delivery.logs.amazonaws.com',
                },
                Action: 's3:GetBucketAcl',
                Resource: arn,
              },
              {
                Sid: 'ELBAccessLogsPolicy',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${elbAccountId}:root`,
                },
                Action: 's3:PutObject',
                Resource: `${arn}/*`,
              },
            ],
          });
        }),
      },
      { parent: this }
    );

    // Enable access logging on main buckets
    new aws.s3.BucketLoggingV2(
      `${name}-transaction-archive-logging`,
      {
        bucket: transactionArchiveBucket.id,
        targetBucket: accessLogBucket.id,
        targetPrefix: 'transaction-archive/',
      },
      { parent: this }
    );

    new aws.s3.BucketLoggingV2(
      `${name}-data-lake-logging`,
      {
        bucket: dataLakeBucket.id,
        targetBucket: accessLogBucket.id,
        targetPrefix: 'data-lake/',
      },
      { parent: this }
    );

    //  Outputs (matching tap-stack.ts expectations)
    this.transactionBucketName = transactionArchiveBucket.id;
    this.transactionBucketArn = transactionArchiveBucket.arn;
    this.archiveBucketName = dataLakeBucket.id;
    this.archiveBucketArn = dataLakeBucket.arn;
    this.auditLogBucketName = auditLogBucket.id;
    this.auditLogBucketArn = auditLogBucket.arn;
    this.backupBucketName = backupBucket.id;
    this.albLogsBucketName = albLogsBucket.id; // ADDED

    this.registerOutputs({
      transactionBucketName: this.transactionBucketName,
      transactionBucketArn: this.transactionBucketArn,
      archiveBucketName: this.archiveBucketName,
      archiveBucketArn: this.archiveBucketArn,
      auditLogBucketName: this.auditLogBucketName,
      auditLogBucketArn: this.auditLogBucketArn,
      backupBucketName: this.backupBucketName,
      albLogsBucketName: this.albLogsBucketName, // ADDED
    });
  }
}
