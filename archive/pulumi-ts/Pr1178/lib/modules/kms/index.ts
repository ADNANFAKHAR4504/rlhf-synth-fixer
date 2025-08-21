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

    // Get account ID first
    const accountId = aws.getCallerIdentity().then(id => id.accountId);

    // Create key policy using pulumi.all to properly handle the Output
    const keyPolicy = pulumi.all([accountId]).apply(([accountId]) => ({
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
        {
          Sid: 'Allow CloudWatch Logs to encrypt logs',
          Effect: 'Allow',
          Principal: {
            Service: 'logs.amazonaws.com',
          },
          Action: [
            'kms:Encrypt',
            'kms:Decrypt',
            'kms:ReEncrypt*',
            'kms:GenerateDataKey*',
            'kms:DescribeKey',
          ],
          Resource: '*',
        },
      ],
    }));

    this.key = new aws.kms.Key(
      `${name}-key`,
      {
        description: args.description,
        keyUsage: args.keyUsage || 'ENCRYPT_DECRYPT',
        policy: keyPolicy.apply(policy => JSON.stringify(policy)),
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
