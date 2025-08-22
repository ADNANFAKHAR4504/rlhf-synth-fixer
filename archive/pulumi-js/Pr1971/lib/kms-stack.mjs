/**
 * KMS Stack for encryption key management across regions
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export class KMSStack extends pulumi.ComponentResource {
  constructor(name, args, opts) {
    super('tap:kms:KMSStack', name, args, opts);

    const { region, environmentSuffix = 'dev', tags = {} } = args;

    // Customer-managed KMS key for S3 encryption
    this.s3Key = new aws.kms.Key(`tap-s3-key-${region}-${environmentSuffix}`, {
      description: `TAP S3 encryption key for ${region}`,
      keyUsage: 'ENCRYPT_DECRYPT',
      keySpec: 'SYMMETRIC_DEFAULT',
      enableKeyRotation: true,
      // Note: Flexible rotation periods are not yet supported in Pulumi AWS provider
      // Using default annual rotation for now
      tags: {
        ...tags,
        Purpose: 'S3Encryption',
        Region: region,
        Environment: environmentSuffix,
      },
    }, { parent: this });

    // KMS key alias for easier identification
    this.s3KeyAlias = new aws.kms.Alias(`tap-s3-alias-${region}-${environmentSuffix}`, {
      name: `alias/tap-s3-${region}-${environmentSuffix}`,
      targetKeyId: this.s3Key.keyId,
    }, { parent: this });

    // Note: Key policy is now managed directly in the key resource
    // AWS KMS keys automatically get a default policy that allows root account access

    this.registerOutputs({
      keyId: this.s3Key.keyId,
      keyArn: this.s3Key.arn,
      aliasName: this.s3KeyAlias.name,
    });
  }
}