import { Construct } from 'constructs';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { S3BucketLifecycleConfiguration } from '@cdktf/provider-aws/lib/s3-bucket-lifecycle-configuration';
import { S3BucketServerSideEncryptionConfigurationA } from '@cdktf/provider-aws/lib/s3-bucket-server-side-encryption-configuration';
import { S3BucketPublicAccessBlock } from '@cdktf/provider-aws/lib/s3-bucket-public-access-block';

export interface S3ConstructProps {
  environmentName: string;
  environmentSuffix: string;
}

export class S3Construct extends Construct {
  public readonly bucketName: string;

  public readonly bucketArn: string;

  constructor(scope: Construct, id: string, props: S3ConstructProps) {
    super(scope, id);

    const bucket = new S3Bucket(this, 'bucket', {
      bucket: `app-bucket-${props.environmentName}-${props.environmentSuffix}`,
      tags: {
        Name: `app-bucket-${props.environmentName}-${props.environmentSuffix}`,
        Environment: props.environmentName,
      },
    });

    new S3BucketServerSideEncryptionConfigurationA(this, 'encryption', {
      bucket: bucket.id,
      rule: [
        {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
          },
        },
      ],
    });

    new S3BucketPublicAccessBlock(this, 'public-access-block', {
      bucket: bucket.id,
      blockPublicAcls: true,
      blockPublicPolicy: true,
      ignorePublicAcls: true,
      restrictPublicBuckets: true,
    });

    new S3BucketLifecycleConfiguration(this, 'lifecycle', {
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
              days: 30,
              storageClass: 'STANDARD_IA',
            },
            {
              days: 90,
              storageClass: 'GLACIER',
            },
          ],
        },
      ],
    });

    this.bucketName = bucket.id;
    this.bucketArn = bucket.arn;
  }
}
