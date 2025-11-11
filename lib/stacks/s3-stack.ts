import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

interface S3StackProps {
  environmentSuffix: string;
  environment: string;
  lifecycleDays: number;
}

export class S3Stack extends Construct {
  public readonly bucketName: string;
  public readonly bucketArn: string;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id);

    const { environmentSuffix, environment, lifecycleDays } = props;

    // Create S3 bucket
    const bucket = new S3Bucket(this, 'payment-bucket', {
      bucket: `payment-data-${environment}-${environmentSuffix}`,
      tags: {
        Name: `payment-data-${environment}-${environmentSuffix}`,
        Environment: environment,
      },
    });

    // Enable versioning
    new S3BucketVersioningA(this, 'bucket-versioning', {
      bucket: bucket.id,
      versioningConfiguration: {
        status: 'Enabled',
      },
    });

    // Enable encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'bucket-encryption', {
      bucket: bucket.id,
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
    new S3BucketLifecycleConfiguration(this, 'bucket-lifecycle', {
      bucket: bucket.id,
      rule: [
        {
          id: 'transition-to-ia',
          status: 'Enabled',
          filter: [
            {
              prefix: '',
            },
          ],
          transition: [
            {
              days: lifecycleDays,
              storageClass: 'STANDARD_IA',
            },
          ],
        },
        {
          id: 'expire-old-versions',
          status: 'Enabled',
          filter: [
            {
              prefix: '',
            },
          ],
          noncurrentVersionExpiration: [
            {
              noncurrentDays: lifecycleDays * 2,
            },
          ],
        },
      ],
    });

    // Block public access
    new S3BucketPublicAccessBlock(this, 'bucket-public-access-block', {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    this.bucketName = bucket.id;
    this.bucketArn = bucket.arn;
  }
}
