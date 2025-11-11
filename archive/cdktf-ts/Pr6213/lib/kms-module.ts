/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable quotes */
/* eslint-disable @typescript-eslint/quotes */
/* eslint-disable prettier/prettier */

import { Construct } from 'constructs';
import { KmsKey } from '@cdktf/provider-aws/lib/kms-key';
import { KmsAlias } from '@cdktf/provider-aws/lib/kms-alias';
import { DataAwsCallerIdentity } from '@cdktf/provider-aws/lib/data-aws-caller-identity';

interface KmsModuleProps {
  environmentSuffix: string;
  keyType: 's3' | 'logs';
  region: string;
}

export class KmsModule extends Construct {
  public readonly key: KmsKey;
  public readonly keyAlias: KmsAlias;

  constructor(scope: Construct, id: string, props: KmsModuleProps) {
    super(scope, id);

    const { environmentSuffix, keyType, region } = props;

    // Get current AWS account ID
    const callerIdentity = new DataAwsCallerIdentity(this, 'current', {});

    // Create KMS key with automatic rotation
    this.key = new KmsKey(this, `${keyType}-key`, {
      description: `Customer-managed key for ${keyType} encryption - ${environmentSuffix}`,
      enableKeyRotation: true,
      multiRegion: true,
      deletionWindowInDays: 7,
      policy: JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Sid: 'Enable IAM User Permissions',
            Effect: 'Allow',
            Principal: {
              AWS: `arn:aws:iam::\${${callerIdentity.fqn}.account_id}:root`,
            },
            Action: 'kms:*',
            Resource: '*',
          },
          {
            Sid: 'Allow CloudWatch Logs',
            Effect: 'Allow',
            Principal: {
              Service: `logs.${region}.amazonaws.com`,
            },
            Action: [
              'kms:Encrypt',
              'kms:Decrypt',
              'kms:ReEncrypt*',
              'kms:GenerateDataKey*',
              'kms:CreateGrant',
              'kms:DescribeKey',
            ],
            Resource: '*',
          },
        ],
      }),
      tags: {
        Name: `${keyType}-kms-key-${environmentSuffix}`,
        Environment: environmentSuffix,
        DataClassification: 'sensitive',
        ComplianceScope: 'pci-dss',
      },
    });

    // Create key alias
    this.keyAlias = new KmsAlias(this, `${keyType}-key-alias`, {
      name: `alias/${keyType}-key-${environmentSuffix}`,
      targetKeyId: this.key.keyId,
    });
  }
}
