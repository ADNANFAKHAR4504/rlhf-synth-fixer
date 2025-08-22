import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { Construct } from 'constructs';

interface StorageProps {
  environment: string;
  region: string;
  tags: { [key: string]: string };
}

export class Storage extends Construct {
  public readonly appDataBucket: S3Bucket;
  public readonly logsBucket: S3Bucket;

  constructor(scope: Construct, id: string, props: StorageProps) {
    super(scope, id);

    // Application data bucket
    this.appDataBucket = new S3Bucket(this, 'AppDataBucket', {
      bucket: `${props.environment}-${props.region}-app-data`,
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-app-data`,
        Purpose: 'application-data',
      },
    });

    new S3BucketVersioningA(this, 'AppDataVersioning', {
      bucket: this.appDataBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'AppDataEncryption', {
      bucket: this.appDataBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 'AppDataPublicAccessBlock', {
      bucket: this.appDataBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    // Logs bucket
    this.logsBucket = new S3Bucket(this, 'LogsBucket', {
      bucket: `${props.environment}-${props.region}-logs`,
      tags: {
        ...props.tags,
        Name: `${props.environment}-${props.region}-logs`,
        Purpose: 'logs',
      },
    });

    new S3BucketVersioningA(this, 'LogsVersioning', {
      bucket: this.logsBucket.id,
      versioningConfiguration: { status: 'Enabled' },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'LogsEncryption', {
      bucket: this.logsBucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 'LogsPublicAccessBlock', {
      bucket: this.logsBucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
