// lib/s3-stack.ts

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { S3Bucket } from '@cdktf/provider-aws/lib/s3-bucket';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface S3StackProps {
  environmentSuffix?: string;
  vpcId: string;
}

export class S3Stack extends TerraformStack {
  public readonly kmsKeyId: string;

  constructor(scope: Construct, id: string, props: S3StackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-east-1', // or use a region from props
    });

    // KMS Key for Encryption
    const kmsKey = new KmsKey(this, 'prodMasterKey', {
      description: 'Master KMS key for production environment',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: { AWS: '*' },
            Action: 'kms:*',
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `prod-master-kms-key-${environmentSuffix}`,
        Environment: environmentSuffix,
      },
    });

    this.kmsKeyId = kmsKey.id;

    // S3 Bucket
    new S3Bucket(this, 'prodSecureBucket', {
      bucket: `prod-secure-bucket-${environmentSuffix}`,
      serverSideEncryptionConfiguration: {
        rule: {
          applyServerSideEncryptionByDefault: {
            sseAlgorithm: 'AES256',
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
  }
}
