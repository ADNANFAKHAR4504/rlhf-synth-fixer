// lib/kms-stack.ts

import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { Construct } from 'constructs';

interface KmsStackProps {
  environmentSuffix?: string;
}

export class KmsStack extends Construct {
  public readonly kmsKeyId: string;

  constructor(scope: Construct, id: string, props?: KmsStackProps) {
    super(scope, id);

    const environmentSuffix = props?.environmentSuffix || 'dev';

    // KMS Key
    const kmsKey = new KmsKey(this, 'prodMasterKey', {
      description: 'Master KMS key for production environment',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Allow specific IAM roles only',
            Effect: 'Allow',
            Principal: { AWS: 'arn:aws:iam::<ACCOUNT_ID>:role/<YourRole>' }, // <-- Replace with your role
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
  }
}
