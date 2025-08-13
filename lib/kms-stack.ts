// lib/kms-stack.ts

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { AwsProvider } from '@cdktf/provider-aws/lib/provider';
import { TerraformStack } from 'cdktf';
import { Construct } from 'constructs';

interface KmsStackProps {
  environmentSuffix?: string;
}

export class KmsStack extends TerraformStack {
  public readonly kmsKeyId: string;

  constructor(scope: Construct, id: string, props?: KmsStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // AWS Provider
    new AwsProvider(this, 'aws', {
      region: 'us-east-1', // or use a region from props
    });

    // KMS Key for Encryption
    const masterKmsKey = new KmsKey(this, 'prodMasterKey', {
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

    this.kmsKeyId = masterKmsKey.id;
  }
}
