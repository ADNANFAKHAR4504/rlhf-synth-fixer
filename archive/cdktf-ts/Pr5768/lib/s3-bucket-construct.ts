import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketReplicationConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { IamRole } from '@cdktf/provider-aws/lib/iam-role';
import { IamRolePolicy } from '@cdktf/provider-aws/lib/iam-role-policy';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { EnvironmentConfig } from './environment-config';

export interface S3BucketConstructProps {
  environmentSuffix: string;
  config: EnvironmentConfig;
  region: string;
}

export class S3BucketConstruct extends Construct {
  public readonly bucket: S3Bucket;
  public readonly bucketArn: string;
  public readonly bucketName: string;

  constructor(scope: Construct, id: string, props: S3BucketConstructProps) {
    super(scope, id);

    const { environmentSuffix, config } = props;

    // Create S3 bucket with environment-specific naming
    this.bucket = new S3Bucket(this, 'DataBucket', {
      bucket: `data-bucket-${environmentSuffix}`,
      tags: {
        Name: `data-bucket-${environmentSuffix}`,
        Environment: config.environment,
        CostCenter: config.costCenter,
      },
    });

    this.bucketArn = this.bucket.arn;
    this.bucketName = this.bucket.bucket;

    // Enable versioning
    new S3BucketVersioningA(this, 'BucketVersioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption with AWS managed keys
    new S3BucketServerSideEncryptionConfigurationA(this, 'BucketEncryption', {
      bucket: this.bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Configure lifecycle policy
    new S3BucketLifecycleConfiguration(this, 'BucketLifecycle', {
      bucket: this.bucket.id,
      rule: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          filter: [{}], // Empty filter applies to all objects
          transition: [
            {
              days: config.bucketLifecycleDays,
              storageClass: 'STANDARD_IA',
            },
          ],
        },
        {
          id: 'expire-old-versions',
          status: 'Enabled',
          filter: [{}], // Empty filter applies to all objects
          noncurrentVersionExpiration: [
            {
              noncurrentDays: config.bucketLifecycleDays * 2,
            },
          ],
        },
      ],
    });

    // Configure cross-region replication for production
    if (config.enableCrossRegionReplication && config.replicationRegion) {
      // Create IAM role for replication
      const replicationRole = new IamRole(this, 'ReplicationRole', {
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
          Environment: config.environment,
          CostCenter: config.costCenter,
        },
      });

      // Create destination bucket in replication region
      const replicationProvider = new AwsProvider(this, 'ReplicationProvider', {
        alias: 'replication',
        region: config.replicationRegion,
      });

      const destinationBucket = new S3Bucket(this, 'DestinationBucket', {
        provider: replicationProvider,
        bucket: `data-bucket-replica-${environmentSuffix}`,
        tags: {
          Name: `data-bucket-replica-${environmentSuffix}`,
          Environment: config.environment,
          CostCenter: config.costCenter,
        },
      });

      // Enable versioning on destination bucket
      new S3BucketVersioningA(this, 'DestinationBucketVersioning', {
        provider: replicationProvider,
        bucket: destinationBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });

      // Enable encryption on destination bucket
      new S3BucketServerSideEncryptionConfigurationA(
        this,
        'DestinationBucketEncryption',
        {
          provider: replicationProvider,
          bucket: destinationBucket.id,
          rule: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'AES256',
              },
              bucketKeyEnabled: true,
            },
          ],
        }
      );

      // Replication policy
      new IamRolePolicy(this, 'ReplicationPolicy', {
        name: `s3-replication-policy-${environmentSuffix}`,
        role: replicationRole.id,
        policy: JSON.stringify({
          Version: '2012-10-17',
          Statement: [
            {
              Effect: 'Allow',
              Action: ['s3:GetReplicationConfiguration', 's3:ListBucket'],
              Resource: this.bucket.arn,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:GetObjectVersionForReplication',
                's3:GetObjectVersionAcl',
                's3:GetObjectVersionTagging',
              ],
              Resource: `${this.bucket.arn}/*`,
            },
            {
              Effect: 'Allow',
              Action: [
                's3:ReplicateObject',
                's3:ReplicateDelete',
                's3:ReplicateTags',
              ],
              Resource: `${destinationBucket.arn}/*`,
            },
          ],
        }),
      });

      // Configure replication
      new S3BucketReplicationConfigurationA(this, 'BucketReplication', {
        bucket: this.bucket.id,
        role: replicationRole.arn,
        rule: [
          {
            id: 'replicate-all',
            status: 'Enabled',
            priority: 1,
            filter: {},
            destination: {
              bucket: destinationBucket.arn,
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
            deleteMarkerReplication: {
              status: 'Enabled',
            },
          },
        ],
      });
    }
  }
}
