import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { commonTags } from '../../config/tags';

export interface KMSKeyArgs {
  description: string;
  keyUsage?: string;
  tags?: Record<string, string>;
}

export class KMSKey extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: KMSKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:security:KMSKey', name, {}, opts);

    const keyPolicy = {
      Version: '2012-10-17',
      Statement: [
        {
          Sid: 'Enable IAM User Permissions',
          Effect: 'Allow',
          Principal: {
            AWS: pulumi.interpolate`arn:aws:iam::${aws.getCallerIdentity().then(id => id.accountId)}:root`,
          },
          Action: 'kms:*',
          Resource: '*',
        },
        {
          Sid: 'Allow CloudTrail to encrypt logs',
          Effect: 'Allow',
          Principal: {
            Service: 'cloudtrail.amazonaws.com',
          },
          Action: [
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
            'kms:Encrypt',
            'kms:ReEncrypt*',
            'kms:Decrypt',
          ],
          Resource: '*',
        },
        {
          Sid: 'Allow S3 service to use the key',
          Effect: 'Allow',
          Principal: {
            Service: 's3.amazonaws.com',
          },
          Action: ['kms:GenerateDataKey', 'kms:Decrypt'],
          Resource: '*',
        },
      ],
    };

    this.key = new aws.kms.Key(
      `${name}-key`,
      {
        description: args.description,
        keyUsage: args.keyUsage || 'ENCRYPT_DECRYPT',
        policy: JSON.stringify(keyPolicy),
        enableKeyRotation: true,
        deletionWindowInDays: 30,
        tags: { ...commonTags, ...args.tags },
      },
      { parent: this }
    );

    this.alias = new aws.kms.Alias(
      `${name}-alias`,
      {
        name: `alias/${name}`,
        targetKeyId: this.key.keyId,
      },
      { parent: this }
    );

    this.registerOutputs({
      keyId: this.key.keyId,
      keyArn: this.key.arn,
      aliasName: this.alias.name,
    });
  }
}
