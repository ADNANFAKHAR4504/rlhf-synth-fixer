/* eslint-disable @typescript-eslint/no-unused-vars */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { ResourceOptions } from '@pulumi/pulumi';

export interface TapStackArgs {
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class TapStack extends pulumi.ComponentResource {
  public readonly bucketName: pulumi.Output<string>;
  public readonly dataAnalystRoleArn: pulumi.Output<string>;
  public readonly dataEngineerRoleArn: pulumi.Output<string>;
  public readonly dataAdminRoleArn: pulumi.Output<string>;
  public readonly kmsKeyId: pulumi.Output<string>;
  public readonly kmsKeyArn: pulumi.Output<string>;
  public readonly logGroupName: pulumi.Output<string>;

  constructor(name: string, args: TapStackArgs, opts?: ResourceOptions) {
    super('tap:stack:TapStack', name, args, opts);

    const environmentSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    const defaultTags = {
      Environment: environmentSuffix,
      Department: 'DataEngineering',
      CostCenter: 'Finance',
      ...tags,
    };

    // Get current AWS account ID for KMS key policy
    const currentAccount = aws.getCallerIdentity({});

    // KMS Key for encryption with rotation enabled and CloudWatch Logs permissions
    const kmsKey = new aws.kms.Key(
      `datalake-kms-key-${environmentSuffix}`,
      {
        description: 'KMS key for S3 data lake encryption and CloudWatch logs',
        enableKeyRotation: true,
        policy: currentAccount.then(account =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${account.accountId}:root`,
                },
                Action: 'kms:*',
                Resource: '*',
              },
              {
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: 'logs.ap-northeast-2.amazonaws.com',
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
                Condition: {
                  ArnLike: {
                    'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:ap-northeast-2:${account.accountId}:*`,
                  },
                },
              },
            ],
          })
        ),
        tags: defaultTags,
      },
      { parent: this }
    );

    const _kmsKeyAlias = new aws.kms.Alias(
      `datalake-kms-alias-${environmentSuffix}`,
      {
        name: `alias/datalake-${environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // CloudWatch Log Group for S3 access logging WITH encryption
    const logGroup = new aws.cloudwatch.LogGroup(
      `datalake-logs-${environmentSuffix}`,
      {
        name: `/aws/s3/datalake-${environmentSuffix}`,
        retentionInDays: 30,
        kmsKeyId: kmsKey.arn,
        tags: defaultTags,
      },
      { parent: this }
    );

    // S3 Bucket
    const bucket = new aws.s3.Bucket(
      `datalake-bucket-${environmentSuffix}`,
      {
        bucket: `financial-datalake-${environmentSuffix}`,
        tags: defaultTags,
      },
      { parent: this }
    );

    // S3 Bucket Versioning (MFA Delete cannot be enabled via API - requires manual MFA auth)
    const _bucketVersioning = new aws.s3.BucketVersioningV2(
      `datalake-versioning-${environmentSuffix}`,
      {
        bucket: bucket.id,
        versioningConfiguration: {
          status: 'Enabled',
          // mfaDelete: 'Enabled', // Cannot be set via API - requires MFA device auth
        },
      },
      { parent: this }
    );

    // S3 Bucket Encryption
    const _bucketEncryption =
      new aws.s3.BucketServerSideEncryptionConfigurationV2(
        `datalake-encryption-${environmentSuffix}`,
        {
          bucket: bucket.id,
          rules: [
            {
              applyServerSideEncryptionByDefault: {
                sseAlgorithm: 'aws:kms',
                kmsMasterKeyId: kmsKey.arn,
              },
              bucketKeyEnabled: true,
            },
          ],
        },
        { parent: this }
      );

    // S3 Bucket Public Access Block
    const _bucketPublicAccessBlock = new aws.s3.BucketPublicAccessBlock(
      `datalake-public-access-block-${environmentSuffix}`,
      {
        bucket: bucket.id,
        blockPublicAcls: true,
        blockPublicPolicy: true,
        ignorePublicAcls: true,
        restrictPublicBuckets: true,
      },
      { parent: this }
    );

    // S3 Lifecycle Configuration WITH abort incomplete multipart uploads
    const _bucketLifecycle = new aws.s3.BucketLifecycleConfigurationV2(
      `datalake-lifecycle-${environmentSuffix}`,
      {
        bucket: bucket.id,
        rules: [
          {
            id: 'glacier-transition',
            status: 'Enabled',
            transitions: [
              {
                days: 90,
                storageClass: 'GLACIER',
              },
            ],
          },
          {
            id: 'abort-incomplete-multipart-uploads',
            status: 'Enabled',
            abortIncompleteMultipartUpload: {
              daysAfterInitiation: 7,
            },
          },
        ],
      },
      { parent: this }
    );

    // IAM Role for DataAnalyst WITH maxSessionDuration
    const dataAnalystRole = new aws.iam.Role(
      `data-analyst-role-${environmentSuffix}`,
      {
        name: `DataAnalyst-${environmentSuffix}`,
        maxSessionDuration: 3600,
        assumeRolePolicy: currentAccount.then(account =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: [`arn:aws:iam::${account.accountId}:root`],
                },
                Action: 'sts:AssumeRole',
              },
            ],
          })
        ),
        tags: defaultTags,
      },
      { parent: this }
    );

    // DataAnalyst Policy WITH explicit ARNs and IP conditions
    const _dataAnalystPolicy = new aws.iam.RolePolicy(
      `data-analyst-policy-${environmentSuffix}`,
      {
        role: dataAnalystRole.id,
        policy: pulumi
          .all([bucket.arn, kmsKey.arn])
          .apply(([bucketArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: ['s3:GetObject', 's3:ListBucket'],
                  Resource: [`${bucketArn}/*`, bucketArn],
                  Condition: {
                    IpAddress: {
                      'aws:SourceIp': ['10.0.0.0/8'],
                    },
                  },
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt'],
                  Resource: keyArn,
                  Condition: {
                    IpAddress: {
                      'aws:SourceIp': ['10.0.0.0/8'],
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM Role for DataEngineer
    const dataEngineerRole = new aws.iam.Role(
      `data-engineer-role-${environmentSuffix}`,
      {
        name: `DataEngineer-${environmentSuffix}`,
        maxSessionDuration: 3600,
        assumeRolePolicy: currentAccount.then(account =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: [`arn:aws:iam::${account.accountId}:root`],
                },
                Action: 'sts:AssumeRole',
              },
            ],
          })
        ),
        tags: defaultTags,
      },
      { parent: this }
    );

    // DataEngineer Policy WITH IP conditions
    const _dataEngineerPolicy = new aws.iam.RolePolicy(
      `data-engineer-policy-${environmentSuffix}`,
      {
        role: dataEngineerRole.id,
        policy: pulumi
          .all([bucket.arn, kmsKey.arn])
          .apply(([bucketArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: [
                    's3:GetObject',
                    's3:PutObject',
                    's3:DeleteObject',
                    's3:ListBucket',
                  ],
                  Resource: [`${bucketArn}/*`, bucketArn],
                  Condition: {
                    IpAddress: {
                      'aws:SourceIp': ['10.0.0.0/8'],
                    },
                  },
                },
                {
                  Effect: 'Allow',
                  Action: ['kms:Decrypt', 'kms:Encrypt', 'kms:GenerateDataKey'],
                  Resource: keyArn,
                  Condition: {
                    IpAddress: {
                      'aws:SourceIp': ['10.0.0.0/8'],
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // IAM Role for DataAdmin
    const dataAdminRole = new aws.iam.Role(
      `data-admin-role-${environmentSuffix}`,
      {
        name: `DataAdmin-${environmentSuffix}`,
        maxSessionDuration: 3600,
        assumeRolePolicy: currentAccount.then(account =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Effect: 'Allow',
                Principal: {
                  AWS: [`arn:aws:iam::${account.accountId}:root`],
                },
                Action: 'sts:AssumeRole',
              },
            ],
          })
        ),
        tags: defaultTags,
      },
      { parent: this }
    );

    // DataAdmin Policy with IP conditions
    const _dataAdminPolicy = new aws.iam.RolePolicy(
      `data-admin-policy-${environmentSuffix}`,
      {
        role: dataAdminRole.id,
        policy: pulumi
          .all([bucket.arn, kmsKey.arn])
          .apply(([bucketArn, keyArn]) =>
            JSON.stringify({
              Version: '2012-10-17',
              Statement: [
                {
                  Effect: 'Allow',
                  Action: 's3:*',
                  Resource: [`${bucketArn}/*`, bucketArn],
                  Condition: {
                    IpAddress: {
                      'aws:SourceIp': ['10.0.0.0/8'],
                    },
                  },
                },
                {
                  Effect: 'Allow',
                  Action: 'kms:*',
                  Resource: keyArn,
                  Condition: {
                    IpAddress: {
                      'aws:SourceIp': ['10.0.0.0/8'],
                    },
                  },
                },
              ],
            })
          ),
      },
      { parent: this }
    );

    // S3 Bucket Policy WITH HTTPS enforcement
    const _bucketPolicy = new aws.s3.BucketPolicy(
      `datalake-policy-${environmentSuffix}`,
      {
        bucket: bucket.id,
        policy: pulumi.all([bucket.arn]).apply(([bucketArn]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'DenyInsecureTransport',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:*',
                Resource: [bucketArn, `${bucketArn}/*`],
                Condition: {
                  Bool: {
                    'aws:SecureTransport': 'false',
                  },
                },
              },
              {
                Sid: 'DenyUnencryptedObjectUploads',
                Effect: 'Deny',
                Principal: '*',
                Action: 's3:PutObject',
                Resource: `${bucketArn}/*`,
                Condition: {
                  StringNotEquals: {
                    's3:x-amz-server-side-encryption': 'aws:kms',
                  },
                },
              },
            ],
          })
        ),
      },
      { parent: this }
    );

    // Export outputs
    this.bucketName = bucket.id;
    this.dataAnalystRoleArn = dataAnalystRole.arn;
    this.dataEngineerRoleArn = dataEngineerRole.arn;
    this.dataAdminRoleArn = dataAdminRole.arn;
    this.kmsKeyId = kmsKey.keyId;
    this.kmsKeyArn = kmsKey.arn;
    this.logGroupName = logGroup.name;

    this.registerOutputs({
      bucketName: this.bucketName,
      dataAnalystRoleArn: this.dataAnalystRoleArn,
      dataEngineerRoleArn: this.dataEngineerRoleArn,
      dataAdminRoleArn: this.dataAdminRoleArn,
      kmsKeyId: this.kmsKeyId,
      kmsKeyArn: this.kmsKeyArn,
      logGroupName: this.logGroupName,
    });
  }
}
