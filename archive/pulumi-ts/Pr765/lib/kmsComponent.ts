/**
 * kmsComponent.ts
 *
 * This module defines a reusable KMS key component for S3 bucket encryption
 * with proper key policies and security configurations.
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

/**
 * Arguments for creating a KMS key
 */
export interface KMSKeyArgs {
  /**
   * The environment suffix for the key name (e.g., 'development', 'production')
   */
  environmentSuffix: string;

  /**
   * Optional description for the KMS key
   */
  description?: string;

  /**
   * Optional tags to apply to the KMS key and related resources
   */
  tags?: pulumi.Input<{ [key: string]: string }>;
}

/**
 * A reusable component that creates a KMS key for S3 bucket encryption
 */
export class KMSKey extends pulumi.ComponentResource {
  /**
   * The created KMS key
   */
  public readonly key: aws.kms.Key;

  /**
   * The KMS key alias
   */
  public readonly keyAlias: aws.kms.Alias;

  /**
   * The ARN of the created KMS key
   */
  public readonly keyArn: pulumi.Output<string>;

  /**
   * The ID of the created KMS key
   */
  public readonly keyId: pulumi.Output<string>;

  constructor(
    name: string,
    args: KMSKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:kms:KMSKey', name, {}, opts);

    const resourceOpts: pulumi.ResourceOptions = { parent: this };

    // Merge required tags with optional tags
    const allTags = pulumi.all([args.tags || {}]).apply(([userTags]) => ({
      ...userTags,
      Department: 'Security',
      Project: 'PulumiIaCProject',
    }));

    // Create the KMS key with proper key policy
    this.key = new aws.kms.Key(
      `s3-encryption-key-${args.environmentSuffix}`,
      {
        description:
          args.description ||
          `KMS key for S3 bucket encryption in ${args.environmentSuffix} environment`,
        keyUsage: 'ENCRYPT_DECRYPT',
        policy: aws.getCallerIdentity().then(identity =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${identity.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow S3 Service',
                Effect: 'Allow',
                Principal: {
                  Service: 's3.amazonaws.com',
                },
                Action: [
                  'kms:Decrypt',
                  'kms:GenerateDataKey',
                  'kms:GenerateDataKeyWithoutPlaintext',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        deletionWindowInDays: 7,
        enableKeyRotation: true,
        tags: allTags,
      },
      resourceOpts
    );

    // Create an alias for the KMS key
    this.keyAlias = new aws.kms.Alias(
      `s3-encryption-key-alias-${args.environmentSuffix}`,
      {
        name: `alias/s3-encryption-${args.environmentSuffix}`,
        targetKeyId: this.key.keyId,
      },
      resourceOpts
    );

    // Export the key ARN and ID
    this.keyArn = this.key.arn;
    this.keyId = this.key.keyId;

    // Register outputs
    this.registerOutputs({
      keyArn: this.keyArn,
      keyId: this.keyId,
      keyAlias: this.keyAlias.name,
    });
  }
}
