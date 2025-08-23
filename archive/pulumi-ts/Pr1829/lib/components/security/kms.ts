import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface KmsKeyArgs {
  description: string;
  keyUsage?: 'ENCRYPT_DECRYPT' | 'SIGN_VERIFY';
  keySpec?: string;
  policy?: pulumi.Input<string>;
  deletionWindowInDays?: number;
  tags?: Record<string, string>;
  name: string;
}

export interface KmsAliasArgs {
  name: string;
  targetKeyId: pulumi.Input<string>;
}

export interface KmsKeyResult {
  key: aws.kms.Key;
  keyId: pulumi.Output<string>;
  keyArn: pulumi.Output<string>;
  alias?: aws.kms.Alias;
}

export interface ApplicationKmsKeyArgs {
  name: string;
  description?: string;
  tags?: Record<string, string>;
}

export interface DatabaseKmsKeyArgs {
  name: string;
  description?: string;
  tags?: Record<string, string>;
}

export interface S3KmsKeyArgs {
  name: string;
  description?: string;
  tags?: Record<string, string>;
}

export class KmsKeyComponent extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly keyId: pulumi.Output<string>;
  public readonly keyArn: pulumi.Output<string>;
  public readonly alias?: aws.kms.Alias;

  constructor(
    name: string,
    args: KmsKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:kms:KmsKeyComponent', name, {}, opts);

    const defaultTags = {
      Name: args.name,
      Environment: pulumi.getStack(),
      ManagedBy: 'Pulumi',
      Project: 'AWS-Nova-Model-Breaking',
      ...args.tags,
    };

    // Default KMS key policy if none provided
    const defaultPolicy = pulumi
      .output(aws.getCallerIdentity())
      .apply(identity =>
        pulumi.output(aws.getRegion()).apply(region =>
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
                Sid: 'Allow CloudWatch Logs',
                Effect: 'Allow',
                Principal: {
                  Service: `logs.${region.name}.amazonaws.com`,
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
          })
        )
      );

    const keyConfig: aws.kms.KeyArgs = {
      description: args.description,
      keyUsage: args.keyUsage || 'ENCRYPT_DECRYPT',
      policy: args.policy || defaultPolicy,
      deletionWindowInDays: args.deletionWindowInDays || 7,
      tags: defaultTags,
    };

    this.key = new aws.kms.Key(`${name}-key`, keyConfig, {
      parent: this,
      provider: opts?.provider,
    });

    this.keyId = this.key.keyId;
    this.keyArn = this.key.arn;

    this.registerOutputs({
      key: this.key,
      keyId: this.keyId,
      keyArn: this.keyArn,
    });
  }
}

export class KmsAliasComponent extends pulumi.ComponentResource {
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: KmsAliasArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:kms:KmsAliasComponent', name, {}, opts);

    this.alias = new aws.kms.Alias(
      `${name}-alias`,
      {
        name: args.name.startsWith('alias/') ? args.name : `alias/${args.name}`,
        targetKeyId: args.targetKeyId,
      },
      { parent: this, provider: opts?.provider }
    );

    this.registerOutputs({
      alias: this.alias,
    });
  }
}

export class ApplicationKmsKeyComponent extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly keyId: pulumi.Output<string>;
  public readonly keyArn: pulumi.Output<string>;
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: ApplicationKmsKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:kms:ApplicationKmsKeyComponent', name, {}, opts);

    const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity =>
      pulumi.output(aws.getRegion()).apply(region =>
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
              Sid: 'Allow EC2 Service',
              Effect: 'Allow',
              Principal: {
                Service: 'ec2.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: {
                Service: `logs.${region.name}.amazonaws.com`,
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
        })
      )
    );

    const keyComponent = new KmsKeyComponent(
      name,
      {
        name: args.name,
        description: args.description || 'KMS key for application encryption',
        policy: keyPolicy,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.key = keyComponent.key;
    this.keyId = keyComponent.keyId;
    this.keyArn = keyComponent.keyArn;

    const aliasComponent = new KmsAliasComponent(
      `${name}-alias`,
      {
        name: `application-${args.name}`,
        targetKeyId: this.keyId,
      },
      { parent: this, provider: opts?.provider }
    );

    this.alias = aliasComponent.alias;

    this.registerOutputs({
      key: this.key,
      keyId: this.keyId,
      keyArn: this.keyArn,
      alias: this.alias,
    });
  }
}

export class DatabaseKmsKeyComponent extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly keyId: pulumi.Output<string>;
  public readonly keyArn: pulumi.Output<string>;
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: DatabaseKmsKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:kms:DatabaseKmsKeyComponent', name, {}, opts);

    const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity =>
      pulumi.output(aws.getRegion()).apply(region =>
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
              Sid: 'Allow RDS Service',
              Effect: 'Allow',
              Principal: {
                Service: 'rds.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: {
                Service: `logs.${region.name}.amazonaws.com`,
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
            {
              Sid: 'Allow S3 Service for Backups',
              Effect: 'Allow',
              Principal: {
                Service: 's3.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              Resource: '*',
            },
          ],
        })
      )
    );

    const keyComponent = new KmsKeyComponent(
      name,
      {
        name: args.name,
        description: args.description || 'KMS key for database encryption',
        policy: keyPolicy,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.key = keyComponent.key;
    this.keyId = keyComponent.keyId;
    this.keyArn = keyComponent.keyArn;

    const aliasComponent = new KmsAliasComponent(
      `${name}-alias`,
      {
        name: `database-${args.name}`,
        targetKeyId: this.keyId,
      },
      { parent: this, provider: opts?.provider }
    );

    this.alias = aliasComponent.alias;

    this.registerOutputs({
      key: this.key,
      keyId: this.keyId,
      keyArn: this.keyArn,
      alias: this.alias,
    });
  }
}

export class S3KmsKeyComponent extends pulumi.ComponentResource {
  public readonly key: aws.kms.Key;
  public readonly keyId: pulumi.Output<string>;
  public readonly keyArn: pulumi.Output<string>;
  public readonly alias: aws.kms.Alias;

  constructor(
    name: string,
    args: S3KmsKeyArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('aws:kms:S3KmsKeyComponent', name, {}, opts);

    const keyPolicy = pulumi.output(aws.getCallerIdentity()).apply(identity =>
      pulumi.output(aws.getRegion()).apply(region =>
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
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              Resource: '*',
            },
            {
              Sid: 'Allow CloudWatch Logs',
              Effect: 'Allow',
              Principal: {
                Service: `logs.${region.name}.amazonaws.com`,
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
            {
              Sid: 'Allow ALB Service for Logs',
              Effect: 'Allow',
              Principal: {
                Service: 'elasticloadbalancing.amazonaws.com',
              },
              Action: [
                'kms:Decrypt',
                'kms:DescribeKey',
                'kms:Encrypt',
                'kms:GenerateDataKey*',
                'kms:ReEncrypt*',
              ],
              Resource: '*',
            },
          ],
        })
      )
    );

    const keyComponent = new KmsKeyComponent(
      name,
      {
        name: args.name,
        description: args.description || 'KMS key for S3 bucket encryption',
        policy: keyPolicy,
        tags: args.tags,
      },
      { parent: this, provider: opts?.provider }
    );

    this.key = keyComponent.key;
    this.keyId = keyComponent.keyId;
    this.keyArn = keyComponent.keyArn;

    const aliasComponent = new KmsAliasComponent(
      `${name}-alias`,
      {
        name: `s3-${args.name}`,
        targetKeyId: this.keyId,
      },
      { parent: this, provider: opts?.provider }
    );

    this.alias = aliasComponent.alias;

    this.registerOutputs({
      key: this.key,
      keyId: this.keyId,
      keyArn: this.keyArn,
      alias: this.alias,
    });
  }
}

export function createKmsKey(
  name: string,
  args: KmsKeyArgs,
  opts?: pulumi.ComponentResourceOptions
): KmsKeyResult {
  const kmsKeyComponent = new KmsKeyComponent(name, args, opts);
  return {
    key: kmsKeyComponent.key,
    keyId: kmsKeyComponent.keyId,
    keyArn: kmsKeyComponent.keyArn,
    alias: kmsKeyComponent.alias,
  };
}

export function createKmsAlias(
  name: string,
  args: KmsAliasArgs,
  opts?: pulumi.ComponentResourceOptions
): aws.kms.Alias {
  const aliasComponent = new KmsAliasComponent(name, args, opts);
  return aliasComponent.alias;
}

export function createApplicationKmsKey(
  name: string,
  args: ApplicationKmsKeyArgs,
  opts?: pulumi.ComponentResourceOptions // ← FIXED: Added third parameter
): KmsKeyResult {
  const applicationKmsKeyComponent = new ApplicationKmsKeyComponent(
    name,
    args,
    opts
  ); // ← FIXED: Pass opts through
  return {
    key: applicationKmsKeyComponent.key,
    keyId: applicationKmsKeyComponent.keyId,
    keyArn: applicationKmsKeyComponent.keyArn,
    alias: applicationKmsKeyComponent.alias,
  };
}

export function createDatabaseKmsKey(
  name: string,
  args: DatabaseKmsKeyArgs,
  opts?: pulumi.ComponentResourceOptions
): KmsKeyResult {
  const databaseKmsKeyComponent = new DatabaseKmsKeyComponent(name, args, opts);
  return {
    key: databaseKmsKeyComponent.key,
    keyId: databaseKmsKeyComponent.keyId,
    keyArn: databaseKmsKeyComponent.keyArn,
    alias: databaseKmsKeyComponent.alias,
  };
}

export function createS3KmsKey(
  name: string,
  args: S3KmsKeyArgs,
  opts?: pulumi.ComponentResourceOptions
): KmsKeyResult {
  const s3KmsKeyComponent = new S3KmsKeyComponent(name, args, opts);
  return {
    key: s3KmsKeyComponent.key,
    keyId: s3KmsKeyComponent.keyId,
    keyArn: s3KmsKeyComponent.keyArn,
    alias: s3KmsKeyComponent.alias,
  };
}
