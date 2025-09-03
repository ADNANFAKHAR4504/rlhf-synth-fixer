/**
 * kms-stack.ts
 *
 * This module defines the KmsStack component for creating KMS keys
 * for encryption across all AWS services.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { ResourceOptions } from '@pulumi/pulumi';

export interface KmsStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class KmsStack extends pulumi.ComponentResource {
  public readonly mainKeyId: pulumi.Output<string>;
  public readonly mainKeyArn: pulumi.Output<string>;
  public readonly rdsKeyId: pulumi.Output<string>;
  public readonly rdsKeyArn: pulumi.Output<string>;
  public readonly mainKeyAlias: pulumi.Output<string>;
  public readonly rdsKeyAlias: pulumi.Output<string>;

  constructor(name: string, args: KmsStackArgs, opts?: ResourceOptions) {
    super('tap:kms:KmsStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Main KMS key for general encryption
    const mainKey = new aws.kms.Key(
      `tap-main-key-${environmentSuffix}`,
      {
        description: 'Main KMS key for TAP infrastructure encryption',
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: {
          Name: `tap-main-key-${environmentSuffix}`,
          Purpose: 'MainEncryption',
          ...tags,
        },
      },
      { parent: this }
    );

    const mainKeyAlias = new aws.kms.Alias(
      `tap-main-key-alias-${environmentSuffix}`,
      {
        name: `alias/tap-main-${environmentSuffix}`,
        targetKeyId: mainKey.keyId,
      },
      { parent: this }
    );

    // RDS-specific KMS key
    const rdsKey = new aws.kms.Key(
      `tap-rds-key-${environmentSuffix}`,
      {
        description: 'KMS key for TAP RDS encryption',
        enableKeyRotation: true,
        deletionWindowInDays: 7,
        tags: {
          Name: `tap-rds-key-${environmentSuffix}`,
          Purpose: 'RDSEncryption',
          ...tags,
        },
      },
      { parent: this }
    );

    const rdsKeyAlias = new aws.kms.Alias(
      `tap-rds-key-alias-${environmentSuffix}`,
      {
        name: `alias/tap-rds-${environmentSuffix}`,
        targetKeyId: rdsKey.keyId,
      },
      { parent: this }
    );

    this.mainKeyId = mainKey.keyId;
    this.mainKeyArn = mainKey.arn;
    this.rdsKeyId = rdsKey.keyId;
    this.rdsKeyArn = rdsKey.arn;
    this.mainKeyAlias = mainKeyAlias.name;
    this.rdsKeyAlias = rdsKeyAlias.name;

    this.registerOutputs({
      mainKeyId: this.mainKeyId,
      mainKeyArn: this.mainKeyArn,
      rdsKeyId: this.rdsKeyId,
      rdsKeyArn: this.rdsKeyArn,
      mainKeyAlias: this.mainKeyAlias,
      rdsKeyAlias: this.rdsKeyAlias,
    });
  }
}
