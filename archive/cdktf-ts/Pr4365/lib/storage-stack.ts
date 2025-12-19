import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketReplicationConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { Construct } from 'constructs';

interface StorageStackProps {
  environmentSuffix: string;
  primaryRegion: string;
  secondaryRegion: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
}

export class StorageStack extends Construct {
  public readonly primaryBucketId: string;
  public readonly secondaryBucketId: string;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      primaryRegion,
      secondaryRegion,
      primaryProvider,
      secondaryProvider,
    } = props;

    // Primary KMS Key
    const primaryKmsKey = new KmsKey(this, 'primary-kms-key', {
      provider: primaryProvider,
      description: `KMS key for healthcare data encryption in ${primaryRegion}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      tags: {
        Name: `healthcare-kms-${environmentSuffix}`,
        Environment: environmentSuffix,
        Region: primaryRegion,
      },
    });

    new KmsAlias(this, 'primary-kms-alias', {
      provider: primaryProvider,
      name: `alias/healthcare-data-${environmentSuffix}`,
      targetKeyId: primaryKmsKey.id,
    });

    // Secondary KMS Key
    const secondaryKmsKey = new KmsKey(this, 'secondary-kms-key', {
      provider: secondaryProvider,
      description: `KMS key for healthcare data encryption in ${secondaryRegion}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      tags: {
        Name: `healthcare-kms-${environmentSuffix}`,
        Environment: environmentSuffix,
        Region: secondaryRegion,
      },
    });

    new KmsAlias(this, 'secondary-kms-alias', {
      provider: secondaryProvider,
      name: `alias/healthcare-data-${environmentSuffix}`,
      targetKeyId: secondaryKmsKey.id,
    });

    // Replication IAM Role
    const replicationRole = new IamRole(this, 'replication-role', {
      provider: primaryProvider,
      name: `s3-replication-role-${environmentSuffix}`,
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
        Name: `s3-replication-role-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    // Secondary bucket (must be created first for replication)
    const secondaryBucket = new S3Bucket(this, 'secondary-bucket', {
      provider: secondaryProvider,
      bucket: `healthcare-data-dr-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `healthcare-data-dr-${environmentSuffix}`,
        Environment: environmentSuffix,
        Region: secondaryRegion,
        Purpose: 'Disaster Recovery',
      },
    });

    new S3BucketVersioningA(this, 'secondary-bucket-versioning', {
      provider: secondaryProvider,
      bucket: secondaryBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'secondary-bucket-encryption',
      {
        provider: secondaryProvider,
        bucket: secondaryBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: secondaryKmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Primary bucket
    const primaryBucket = new S3Bucket(this, 'primary-bucket', {
      provider: primaryProvider,
      bucket: `healthcare-data-primary-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `healthcare-data-primary-${environmentSuffix}`,
        Environment: environmentSuffix,
        Region: primaryRegion,
        Purpose: 'Primary Data Store',
      },
    });

    new S3BucketVersioningA(this, 'primary-bucket-versioning', {
      provider: primaryProvider,
      bucket: primaryBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'primary-bucket-encryption',
      {
        provider: primaryProvider,
        bucket: primaryBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'aws:kms',
              kmsMasterKeyId: primaryKmsKey.arn,
            },
            bucketKeyEnabled: true,
          },
        ],
      }
    );

    // Replication policy
    new IamRolePolicy(this, 'replication-policy', {
      provider: primaryProvider,
      name: `s3-replication-policy-${environmentSuffix}`,
      role: replicationRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            Resource: [primaryBucket.arn],
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
              's3:GetObjectVersionTagging',
            ],
            Resource: [`${primaryBucket.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            Resource: [`${secondaryBucket.arn}/*`],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Decrypt'],
            Resource: [primaryKmsKey.arn],
          },
          {
            Effect: 'Allow',
            Action: ['kms:Encrypt'],
            Resource: [secondaryKmsKey.arn],
          },
        ],
      }),
    });

    // Configure replication
    new S3BucketReplicationConfigurationA(this, 'replication-config', {
      provider: primaryProvider,
      dependsOn: [primaryBucket],
      bucket: primaryBucket.id,
      role: replicationRole.arn,
      rule: [
        {
          id: 'replicate-all',
          status: 'Enabled',
          priority: 1,
          deleteMarkerReplication: {
            status: 'Enabled',
          },
          filter: {
            prefix: '',
          },
          destination: {
            bucket: secondaryBucket.arn,
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
            encryptionConfiguration: {
              replicaKmsKeyId: secondaryKmsKey.arn,
            },
          },
          sourceSelectionCriteria: {
            sseKmsEncryptedObjects: {
              status: 'Enabled',
            },
          },
        },
      ],
    });

    // Lifecycle policy for cost optimization
    new S3BucketLifecycleConfiguration(this, 'lifecycle-policy', {
      provider: primaryProvider,
      bucket: primaryBucket.id,
      rule: [
        {
          id: 'intelligent-tiering',
          status: 'Enabled',
          filter: [{}],
          transition: [
            {
              days: 30,
              storageClass: 'INTELLIGENT_TIERING',
            },
          ],
        },
        {
          id: 'cleanup-old-versions',
          status: 'Enabled',
          filter: [{}],
          noncurrentVersionExpiration: [
            {
              noncurrentDays: 90,
            },
          ],
        },
      ],
    });

    this.primaryBucketId = primaryBucket.id;
    this.secondaryBucketId = secondaryBucket.id;
  }
}
