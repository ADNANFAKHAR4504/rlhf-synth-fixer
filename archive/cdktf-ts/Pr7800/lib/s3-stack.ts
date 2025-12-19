import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';

export interface S3StackProps {
  environmentSuffix: string;
  kmsKey: KmsKey;
}

export class S3Stack extends Construct {
  public readonly rawDataBucket: S3Bucket;
  public readonly processedDataBucket: S3Bucket;
  public readonly archiveBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id);

    const { environmentSuffix, kmsKey } = props;

    // Raw data ingestion bucket
    this.rawDataBucket = this.createBucket(
      'raw-data-bucket',
      `trading-raw-data-${environmentSuffix}`,
      environmentSuffix,
      kmsKey
    );

    // Processed analytics bucket
    this.processedDataBucket = this.createBucket(
      'processed-data-bucket',
      `trading-processed-data-${environmentSuffix}`,
      environmentSuffix,
      kmsKey
    );

    // Archive bucket
    this.archiveBucket = this.createBucket(
      'archive-bucket',
      `trading-archive-${environmentSuffix}`,
      environmentSuffix,
      kmsKey
    );
  }

  private createBucket(
    id: string,
    bucketName: string,
    environmentSuffix: string,
    kmsKey: KmsKey
  ): S3Bucket {
    const bucket = new S3Bucket(this, id, {
      bucket: bucketName,
      tags: {
        Name: bucketName,
        Environment: environmentSuffix,
        CostCenter: 'finance',
        Compliance: 'pci-dss',
        DataClassification: 'sensitive',
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, `${id}-versioning`, {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption
    new S3BucketServerSideEncryptionConfigurationA(this, `${id}-encryption`, {
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'aws:kms',
            kmsMasterKeyId: kmsKey.arn,
          },
          bucketKeyEnabled: true,
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, `${id}-public-access-block`, {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Lifecycle policy
    new S3BucketLifecycleConfiguration(this, `${id}-lifecycle`, {
      bucket: bucket.id,
      rule: [
        {
          id: 'archive-old-data',
          status: 'Enabled',
          filter: [
            {
              prefix: '',
            },
          ],
          transition: [
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    return bucket;
  }
}
