/**
 * kms-stack.ts
 *
 * Defines KMS customer-managed keys for encrypting:
 * - S3 artifacts bucket
 * - CloudWatch Logs
 * - Secrets Manager secrets
 *
 * Features:
 * - Automatic key rotation enabled
 * - Least-privilege key policies
 * - Service-specific key grants
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface KmsStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class KmsStack extends pulumi.ComponentResource {
  public readonly pipelineKey: aws.kms.Key;
  public readonly pipelineKeyAlias: aws.kms.Alias;
  public readonly pipelineKeyArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: KmsStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:kms:KmsStack', name, args, opts);

    const { environmentSuffix, tags } = args;

    // Get current AWS account ID and region
    const current = aws.getCallerIdentity({});
    const currentRegion = aws.getRegion({});

    // Create customer-managed KMS key for CI/CD pipeline
    this.pipelineKey = new aws.kms.Key(
      `pipeline-key-${environmentSuffix}`,
      {
        description: `KMS key for CI/CD pipeline ${environmentSuffix}`,
        enableKeyRotation: true, // CRITICAL: Automatic rotation
        deletionWindowInDays: 7, // Minimum for faster cleanup
        policy: pulumi.all([current, currentRegion]).apply(([caller, region]) =>
          JSON.stringify({
            Version: '2012-10-17',
            Statement: [
              {
                Sid: 'Enable IAM User Permissions',
                Effect: 'Allow',
                Principal: {
                  AWS: `arn:aws:iam::${caller.accountId}:root`,
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
                  'kms:CreateGrant',
                  'kms:DescribeKey',
                ],
                Resource: '*',
                Condition: {
                  ArnLike: {
                    'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${region.name}:${caller.accountId}:*`,
                  },
                },
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
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
              {
                Sid: 'Allow CodePipeline',
                Effect: 'Allow',
                Principal: {
                  Service: 'codepipeline.amazonaws.com',
                },
                Action: [
                  'kms:Decrypt',
                  'kms:Encrypt',
                  'kms:ReEncrypt*',
                  'kms:GenerateDataKey*',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
              {
                Sid: 'Allow CodeBuild',
                Effect: 'Allow',
                Principal: {
                  Service: 'codebuild.amazonaws.com',
                },
                Action: ['kms:Decrypt', 'kms:DescribeKey'],
                Resource: '*',
              },
              {
                Sid: 'Allow Secrets Manager',
                Effect: 'Allow',
                Principal: {
                  Service: 'secretsmanager.amazonaws.com',
                },
                Action: [
                  'kms:Decrypt',
                  'kms:Encrypt',
                  'kms:GenerateDataKey',
                  'kms:DescribeKey',
                ],
                Resource: '*',
              },
            ],
          })
        ),
        tags: {
          ...tags,
          Name: `cicd-pipeline-key-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    // Create KMS key alias
    this.pipelineKeyAlias = new aws.kms.Alias(
      `pipeline-key-alias-${environmentSuffix}`,
      {
        name: `alias/cicd-pipeline-${environmentSuffix}`,
        targetKeyId: this.pipelineKey.id,
      },
      { parent: this }
    );

    this.pipelineKeyArn = this.pipelineKey.arn;

    this.registerOutputs({
      pipelineKeyId: this.pipelineKey.id,
      pipelineKeyArn: this.pipelineKey.arn,
      pipelineKeyAliasName: this.pipelineKeyAlias.name,
    });
  }
}
