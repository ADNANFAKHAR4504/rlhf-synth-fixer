/**
 * kms-stack.ts
 *
 * This module defines the KMS encryption keys for database backups
 * as required for PCI DSS compliance.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface KmsStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class KmsStack extends pulumi.ComponentResource {
  public readonly kmsKey: aws.kms.Key;
  public readonly kmsKeyAlias: aws.kms.Alias;

  constructor(
    name: string,
    args: KmsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:kms:KmsStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Get current AWS account ID
    const currentAccount = aws.getCallerIdentityOutput();

    // Create customer-managed KMS key for database backup encryption
    this.kmsKey = new aws.kms.Key(
      `payment-db-kms-key-${environmentSuffix}`,
      {
        description: `KMS key for database backup encryption - ${environmentSuffix}`,
        deletionWindowInDays: 10,
        enableKeyRotation: true,
        policy: currentAccount.accountId.apply(accountId =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow DynamoDB to use the key',
                Effect: 'Allow',
                Principal: {
                  Service: 'dynamodb.amazonaws.com',
                },
                Action: ['kms:Decrypt', 'kms:DescribeKey', 'kms:CreateGrant'],
                Resource: '*',
              },
            ],
          })
        ),
        tags: pulumi.all([tags]).apply(([t]) => ({
          ...t,
          Name: `payment-db-kms-key-${environmentSuffix}`,
          EnvironmentSuffix: environmentSuffix,
        })),
      },
      { parent: this }
    );

    // Create KMS key alias for easier reference
    this.kmsKeyAlias = new aws.kms.Alias(
      `payment-db-kms-alias-${environmentSuffix}`,
      {
        name: `alias/payment-db-${environmentSuffix}`,
        targetKeyId: this.kmsKey.id,
      },
      { parent: this }
    );

    this.registerOutputs({
      kmsKeyId: this.kmsKey.id,
      kmsKeyArn: this.kmsKey.arn,
    });
  }
}
