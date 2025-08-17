// lib/s3-stack.ts

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { Construct } from 'constructs';

interface S3StackProps {
  environmentSuffix?: string;
  vpcId?: string;
}

export class S3Stack extends Construct {
  public readonly bucketName: string;
  public readonly kmsKeyArn: string;

  constructor(scope: Construct, id: string, props?: S3StackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // KMS Key for S3 encryption
    const kmsKey = new KmsKey(this, 'prodS3KmsKey', {
      description: 'KMS key for S3 bucket encryption',
      enableKeyRotation: true,
      tags: {
        Name: `prod-s3-kms-key-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.kmsKeyArn = kmsKey.arn;

    // S3 Bucket
    const bucket = new S3Bucket(this, 'prodSecureBucket', {
      bucket: `prod-secure-bucket-${environmentSuffix}`,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256', // <-- Use AES-256
          },
        },
      },
      versioning: {
        enabled: true,
      },
      tags: {
        Name: `prod-secure-bucket-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.bucketName = bucket.bucket;
  }
}
