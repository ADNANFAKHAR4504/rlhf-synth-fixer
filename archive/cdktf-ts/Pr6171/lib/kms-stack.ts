import { Construct } from 'constructs';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

export interface KmsStackProps {
  environmentSuffix: string;
}

export class KmsStack extends Construct {
  public readonly encryptionKey: KmsKey;

  constructor(scope: Construct, id: string, props: KmsStackProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    const callerIdentity = new DataAwsCallerIdentity(this, 'current');

    // Create KMS key for encryption
    this.encryptionKey = new KmsKey(this, 'encryption_key', {
      description: 'KMS key for payment processing system encryption',
      enableKeyRotation: true,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${callerIdentity.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow services to use the key',
            Effect: 'Allow',
            Principal: {
              Service: [
                'dynamodb.amazonaws.com',
                'lambda.amazonaws.com',
                'logs.amazonaws.com',
              ],
            },
            Action: [
              'kms:Decrypt',
              'kms:Encrypt',
              'kms:GenerateDataKey',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `payment-kms-key-${environmentSuffix}`,
      },
    });

    new KmsAlias(this, 'encryption_key_alias', {
      name: `alias/payment-encryption-${environmentSuffix}`,
      targetKeyId: this.encryptionKey.id,
    });
  }
}
