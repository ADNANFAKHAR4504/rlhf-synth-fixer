// Storage construct for production
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';
import { Construct } from 'constructs';

export interface StorageConstructProps {
  environmentSuffix: string;
}

export class StorageConstruct extends Construct {
  constructor(scope: Construct, id: string, props: StorageConstructProps) {
    super(scope, id);

    // Application Data Bucket
    const appDataBucket = new S3Bucket(this, 'app-data-bucket', {
      bucket: `${props.environmentSuffix}-app-data-bucket`,
      acl: 'private',
      versioning: {
        enabled: true,
      },
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      },
      tags: {
        Name: `${props.environmentSuffix}-app-data-bucket`,
        Environment: props.environmentSuffix,
      },
    });

    // Public Access Block
    new S3BucketPublicAccessBlock(this, 'app-data-bucket-public-access-block', {
      bucket: appDataBucket.id,
      blockPublicAcls: true,
      ignorePublicAcls: true,
      blockPublicPolicy: true,
      restrictPublicBuckets: true,
    });
  }
}
