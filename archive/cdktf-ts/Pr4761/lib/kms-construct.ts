import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { Construct } from 'constructs';

export interface KmsConstructProps {
  environmentSuffix: string;
}

export class KmsConstruct extends Construct {
  public readonly rdsKey: KmsKey;
  public readonly secretsManagerKey: KmsKey;
  public readonly elasticacheKey: KmsKey;

  constructor(scope: Construct, id: string, props: KmsConstructProps) {
    super(scope, id);

    const { environmentSuffix } = props;

    // Get current AWS account ID
    const current = new DataAwsCallerIdentity(this, 'current');

    // KMS Key for RDS encryption
    this.rdsKey = new KmsKey(this, 'rds-kms-key', {
      description: `KMS key for RDS encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow RDS to use the key',
            Effect: 'Allow',
            Principal: {
              Service: 'rds.amazonaws.com',
            },
            Action: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `payment-rds-kms-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'RDS Encryption',
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new KmsAlias(this, 'rds-kms-alias', {
      name: `alias/payment-rds-${environmentSuffix}`,
      targetKeyId: this.rdsKey.keyId,
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // KMS Key for Secrets Manager
    this.secretsManagerKey = new KmsKey(this, 'secrets-kms-key', {
      description: `KMS key for Secrets Manager encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow Secrets Manager to use the key',
            Effect: 'Allow',
            Principal: {
              Service: 'secretsmanager.amazonaws.com',
            },
            Action: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `payment-secrets-kms-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'Secrets Manager Encryption',
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new KmsAlias(this, 'secrets-kms-alias', {
      name: `alias/payment-secrets-${environmentSuffix}`,
      targetKeyId: this.secretsManagerKey.keyId,
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    // KMS Key for ElastiCache
    this.elasticacheKey = new KmsKey(this, 'elasticache-kms-key', {
      description: `KMS key for ElastiCache encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      deletionWindowInDays: 7,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::${current.accountId}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow ElastiCache to use the key',
            Effect: 'Allow',
            Principal: {
              Service: 'elasticache.amazonaws.com',
            },
            Action: [
              'kms:Decrypt',
              'kms:GenerateDataKey',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `payment-elasticache-kms-${environmentSuffix}`,
        Environment: environmentSuffix,
        Purpose: 'ElastiCache Encryption',
      },
      lifecycle: {
        createBeforeDestroy: true,
      },
    });

    new KmsAlias(this, 'elasticache-kms-alias', {
      name: `alias/payment-elasticache-${environmentSuffix}`,
      targetKeyId: this.elasticacheKey.keyId,
      lifecycle: {
        createBeforeDestroy: true,
      },
    });
  }
}
