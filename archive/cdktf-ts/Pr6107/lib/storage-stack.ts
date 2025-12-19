import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketReplicationConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-replication-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';

export interface StorageStackProps {
  environmentSuffix: string;
  replicationRoleArn: string;
  primaryRegion: string;
  drRegion: string;
  primaryProvider?: AwsProvider;
  drProvider?: AwsProvider;
}

export interface StorageStackOutputs {
  primaryBucketId: string;
  primaryBucketArn: string;
  drBucketId: string;
  drBucketArn: string;
}

export class StorageStack extends Construct {
  public readonly outputs: StorageStackOutputs;

  constructor(scope: Construct, id: string, props: StorageStackProps) {
    super(scope, id);

    const {
      environmentSuffix,
      replicationRoleArn,
      primaryRegion,
      drRegion,
      primaryProvider,
      drProvider,
    } = props;

    const commonTags = {
      Environment: environmentSuffix,
      CostCenter: 'payment-processing',
      ManagedBy: 'cdktf',
    };

    // Primary S3 Bucket (us-east-1)
    const primaryBucket = new S3Bucket(this, 'primary-bucket', {
      bucket: `payment-assets-${environmentSuffix}-${primaryRegion}`,
      tags: {
        ...commonTags,
        'DR-Role': 'primary',
        Region: primaryRegion,
      },
      provider: primaryProvider,
      forceDestroy: true,
    });

    new S3BucketPublicAccessBlock(this, 'primary-bucket-public-access', {
      bucket: primaryBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
      provider: primaryProvider,
    });

    const primaryVersioning = new S3BucketVersioningA(
      this,
      'primary-bucket-versioning',
      {
        bucket: primaryBucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
        provider: primaryProvider,
      }
    );

    // DR S3 Bucket (us-east-2)
    const drBucket = new S3Bucket(this, 'dr-bucket', {
      bucket: `payment-assets-${environmentSuffix}-${drRegion}`,
      tags: {
        ...commonTags,
        'DR-Role': 'dr',
        Region: drRegion,
      },
      provider: drProvider,
      forceDestroy: true,
    });

    new S3BucketPublicAccessBlock(this, 'dr-bucket-public-access', {
      bucket: drBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
      provider: drProvider,
    });

    const drVersioning = new S3BucketVersioningA(this, 'dr-bucket-versioning', {
      bucket: drBucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
      provider: drProvider,
    });

    // Cross-Region Replication from Primary to DR
    new S3BucketReplicationConfigurationA(this, 'replication-config', {
      bucket: primaryBucket.id,
      role: replicationRoleArn,
      rule: [
        {
          id: 'replicate-all',
          status: 'Enabled',
          priority: 1,
          deleteMarkerReplication: {
            status: 'Enabled',
          },
          filter: {},
          destination: {
            bucket: drBucket.arn,
            storageClass: 'STANDARD',
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
      provider: primaryProvider,
      dependsOn: [primaryVersioning, drVersioning],
    });

    // Lifecycle policies for cost optimization
    new S3BucketLifecycleConfiguration(this, 'primary-lifecycle', {
      bucket: primaryBucket.id,
      rule: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          filter: [{}],
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
          ],
        },
        {
          id: 'transition-to-glacier',
          status: 'Enabled',
          filter: [{}],
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
        {
          id: 'expire-old-versions',
          status: 'Enabled',
          filter: [{}],
          noncurrentVersionExpiration: [
            {
              noncurrentDays: 90,
            },
          ],
        },
      ],
      provider: primaryProvider,
    });

    new S3BucketLifecycleConfiguration(this, 'dr-lifecycle', {
      bucket: drBucket.id,
      rule: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          filter: [{}],
          transition: [
            {
              days: 30,
              storageClass: 'STANDARD_IA',
            },
          ],
        },
        {
          id: 'expire-old-versions',
          status: 'Enabled',
          filter: [{}],
          noncurrentVersionExpiration: [
            {
              noncurrentDays: 90,
            },
          ],
        },
      ],
      provider: drProvider,
    });

    this.outputs = {
      primaryBucketId: primaryBucket.id,
      primaryBucketArn: primaryBucket.arn,
      drBucketId: drBucket.id,
      drBucketArn: drBucket.arn,
    };
  }
}
