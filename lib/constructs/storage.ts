import { Construct } from 'constructs';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketReplicationConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';

export interface StorageConstructProps {
  environmentSuffix: string;
  primaryProvider: AwsProvider;
  secondaryProvider: AwsProvider;
}

export class StorageConstruct extends Construct {
  public readonly primaryBucketName: string;
  public readonly secondaryBucketName: string;

  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    const { environmentSuffix, primaryProvider, secondaryProvider } = props;

    // Primary S3 Bucket
    const primaryBucket = new S3Bucket(this, 'PrimaryBucket', {
      provider: primaryProvider,
      bucket: `dr-primary-${environmentSuffix}`,
      tags: {
        Name: `dr-primary-${environmentSuffix}`,
      },
    });

    // Secondary S3 Bucket
    const secondaryBucket = new S3Bucket(this, 'SecondaryBucket', {
      provider: secondaryProvider,
      bucket: `dr-secondary-${environmentSuffix}`,
      tags: {
        Name: `dr-secondary-${environmentSuffix}`,
      },
    });

    // Enable versioning on both buckets (required for replication)
    new S3BucketVersioningA(this, 'PrimaryBucketVersioning', {
      provider: primaryProvider,
      bucket: primaryBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    const secondaryBucketVersioning = new S3BucketVersioningA(
      this,
      'SecondaryBucketVersioning',
      {
        provider: secondaryProvider,
        bucket: secondaryBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      }
    );

    // Enable encryption on both buckets
    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'PrimaryBucketEncryption',
      {
        provider: primaryProvider,
        bucket: primaryBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    new S3BucketServerSideEncryptionConfigurationA(
      this,
      'SecondaryBucketEncryption',
      {
        provider: secondaryProvider,
        bucket: secondaryBucket.id,
        rule: [
          {
            applyServerSideEncryptionByDefault: {
              sseAlgorithm: 'AES256',
            },
          },
        ],
      }
    );

    // IAM Role for S3 Replication
    const replicationRole = new IamRole(this, 'ReplicationRole', {
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
      },
    });

    // IAM Policy for S3 Replication
    new IamRolePolicy(this, 'ReplicationRolePolicy', {
      provider: primaryProvider,
      name: `s3-replication-policy-${environmentSuffix}`,
      role: replicationRole.id,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
            Resource: primaryBucket.arn,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:GetObjectVersionForReplication',
              's3:GetObjectVersionAcl',
              's3:GetObjectVersionTagging',
            ],
            Resource: `${primaryBucket.arn}/*`,
          },
          {
            Effect: 'Allow',
            Action: [
              's3:ReplicateObject',
              's3:ReplicateDelete',
              's3:ReplicateTags',
            ],
            Resource: `${secondaryBucket.arn}/*`,
          },
        ],
      }),
    });

    // S3 Replication Configuration with RTC
    new S3BucketReplicationConfigurationA(this, 'BucketReplication', {
      provider: primaryProvider,
      bucket: primaryBucket.id,
      role: replicationRole.arn,
      dependsOn: [secondaryBucketVersioning],
      rule: [
        {
          id: 'replicate-all-objects',
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
          },
        },
      ],
    });

    // Export values
    this.primaryBucketName = primaryBucket.bucket;
    this.secondaryBucketName = secondaryBucket.bucket;
  }
}
