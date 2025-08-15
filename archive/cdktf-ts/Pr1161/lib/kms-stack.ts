// lib/kms-stack.ts

import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { Construct } from 'constructs';

interface KmsStackProps {
  environmentSuffix?: string;
}

export class KmsStack extends Construct {
  public readonly kmsKeyId: string;

  constructor(scope: Construct, id: string, props?: KmsStackProps) {
    super(scope, id);

    const caller = new DataAwsCallerIdentity(this, 'current');
    const environmentSuffix = props?.environmentSuffix || 'dev';

    // KMS Key
    const kmsKey = new KmsKey(this, 'prodMasterKey', {
      description: 'Master KMS key for production environment',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable root account full access',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::\${${caller.accountId}}:root`,
            },
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
