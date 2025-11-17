import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

export interface S3AssetsConstructProps {
  environment: string;
}

export class S3AssetsConstruct extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3AssetsConstructProps) {
    super(scope, id);

    const { environment } = props;

    // Create S3 Bucket for static assets
    this.bucket = new S3Bucket(this, 'assets-bucket', {
      bucket: `assets-${environment}`,
      tags: {
        Name: `assets-${environment}`,
        Environment: environment,
        Team: 'platform-engineering',
        CostCenter: 'infrastructure',
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'assets-versioning', {
      bucket: this.bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable server-side encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'assets-encryption', {
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

    // Block public access
    new S3BucketPublicAccessBlock(this, 'assets-public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
