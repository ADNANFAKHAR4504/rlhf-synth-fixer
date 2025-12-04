import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketVersioningA } from '@cdktf/provider-aws/lib/s3-bucket-versioning';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

export interface S3ConstructProps {
  environmentSuffix: string;
  bucketName: string;
  enableVersioning?: boolean;
  lifecycleRules?: any[];
  tags?: Record<string, string>;
}

export class S3Construct extends Construct {
  public readonly bucket: S3Bucket;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    const {
      environmentSuffix,
      bucketName,
      enableVersioning = true,
      lifecycleRules = [],
      tags = {},
    } = props;

    // Create S3 bucket
    this.bucket = new S3Bucket(this, 'bucket', {
      bucket: `${bucketName}-${environmentSuffix}`,
      forceDestroy: true,
      tags: {
        Name: `${bucketName}-${environmentSuffix}`,
        ...tags,
      },
    });

    // Enable versioning
    if (enableVersioning) {
      new S3BucketVersioningA(this, 'versioning', {
        bucket: this.bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
        },
      });
    }

    // Enable encryption
    new S3BucketServerSideEncryptionConfigurationA(this, 'encryption', {
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

    // Configure lifecycle rules
    if (lifecycleRules.length > 0) {
      new S3BucketLifecycleConfiguration(this, 'lifecycle', {
        bucket: this.bucket.id,
        rule: lifecycleRules.map((rule, index) => ({
          id: rule.id || `rule-${index}`,
          status: 'Enabled',
          ...rule,
        })),
      });
    } else {
      // Default lifecycle rule
      new S3BucketLifecycleConfiguration(this, 'lifecycle', {
        bucket: this.bucket.id,
        rule: [
          {
            id: 'transition-to-ia',
            status: 'Enabled',
            transition: [
              {
                days: 30,
                storageClass: 'STANDARD_IA',
              },
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
          {
            id: 'expire-old-versions',
            status: 'Enabled',
            noncurrentVersionExpiration: [
              {
                noncurrentDays: 90,
              },
            ],
          },
        ],
      });
    }

    // Block public access
    new S3BucketPublicAccessBlock(this, 'public-access-block', {
      bucket: this.bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });
  }
}
