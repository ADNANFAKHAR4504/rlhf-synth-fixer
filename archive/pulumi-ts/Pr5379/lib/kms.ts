/**
 * KMS key management for encryption
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface KmsKeyArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class KmsKey extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: KmsKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:KmsKey', name, {}, opts);

    this.key = new aws.kms.Key(
      `payment-kms-${args.environmentSuffix}`,
      {
        description: 'KMS key for payment infrastructure encryption',
        deletionWindowInDays: 7,
        enableKeyRotation: true,
        tags: args.tags,
      },
      { parent: this }
    );

    this.alias = new aws.kms.Alias(
      `payment-kms-alias-${args.environmentSuffix}`,
      {
        name: `alias/payment-${args.environmentSuffix}`,
        targetKeyId: this.key.keyId,
      },
      { parent: this }
    );

    this.registerOutputs({
      keyId: this.key.id,
      keyArn: this.key.arn,
      aliasName: this.alias.name,
    });
  }
}
