import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';
import { getCommonTags, primaryRegion, secondaryRegion } from './config';

// Get account ID for KMS policy
const accountId = aws.getCallerIdentity();

export class KmsStack extends pulumi.ComponentResource {
  public readonly primaryKmsKey: aws.kms.Key;
  public readonly primaryKmsAlias: aws.kms.Alias;
  public readonly secondaryKmsKey: aws.kms.Key;
  public readonly secondaryKmsAlias: aws.kms.Alias;

  constructor(
    name: string,
    args: { environment: string; tags: Record<string, string> },
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:kms:KmsStack', name, {}, opts);

    // Input validation
    if (
      !args ||
      !args.environment ||
      typeof args.environment !== 'string' ||
      args.environment.trim() === ''
    ) {
      throw new Error('Environment must be a non-empty string');
    }
    if (!args.tags || typeof args.tags !== 'object') {
      throw new Error('Tags must be a valid object');
    }

    const commonTags = { ...getCommonTags(args.environment), ...args.tags };

    // Primary region KMS key
    const primaryProvider = new aws.Provider(
      `${args.environment}-primary-provider`,
      { region: primaryRegion },
      { parent: this }
    );

    this.primaryKmsKey = new aws.kms.Key(
      `${args.environment}-primary-kms-key`,
      {
        description: 'KMS key for encryption in primary region',
        policy: accountId.then(id =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Allow administration of the key',
                Effect: 'Allow',
                Principal: { AWS: `arn:aws:iam::${id.accountId}:root` },
                Action: ['kms:*'],
                Resource: '*',
              },
              {
                Sid: 'Allow use of the key for RDS',
                Effect: 'Allow',
                Principal: { Service: 'rds.amazonaws.com' },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:DescribeKey',
                  'kms:GenerateDataKey*',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          ...commonTags,
          Name: `${args.environment}-primary-kms-key`,
          Region: primaryRegion,
        },
      },
      { provider: primaryProvider, parent: this }
    );

    this.primaryKmsAlias = new aws.kms.Alias(
      `${args.environment}-primary-kms-alias`,
      {
        name: `alias/${args.environment}-primary-region-key`,
        targetKeyId: this.primaryKmsKey.keyId,
      },
      { provider: primaryProvider, parent: this }
    );

    // Secondary region KMS key
    const secondaryProvider = new aws.Provider(
      `${args.environment}-secondary-provider`,
      { region: secondaryRegion },
      { parent: this }
    );

    this.secondaryKmsKey = new aws.kms.Key(
      `${args.environment}-secondary-kms-key`,
      {
        description: 'KMS key for encryption in secondary region',
        policy: accountId.then(id =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Allow administration of the key',
                Effect: 'Allow',
                Principal: { AWS: `arn:aws:iam::${id.accountId}:root` },
                Action: ['kms:*'],
                Resource: '*',
              },
              {
                Sid: 'Allow use of the key for RDS',
                Effect: 'Allow',
                Principal: { Service: 'rds.amazonaws.com' },
                Action: [
                  'kms:Encrypt',
                  'kms:Decrypt',
                  'kms:DescribeKey',
                  'kms:GenerateDataKey*',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          ...commonTags,
          Name: `${args.environment}-secondary-kms-key`,
          Region: secondaryRegion,
        },
      },
      { provider: secondaryProvider, parent: this }
    );

    this.secondaryKmsAlias = new aws.kms.Alias(
      `${args.environment}-secondary-kms-alias`,
      {
        name: `alias/${args.environment}-secondary-region-key`,
        targetKeyId: this.secondaryKmsKey.keyId,
      },
      { provider: secondaryProvider, parent: this }
    );

    this.registerOutputs({
      primaryKmsKeyId: this.primaryKmsKey.keyId,
      primaryKmsKeyArn: this.primaryKmsKey.arn,
      secondaryKmsKeyId: this.secondaryKmsKey.keyId,
      secondaryKmsKeyArn: this.secondaryKmsKey.arn,
    });
  }
}
