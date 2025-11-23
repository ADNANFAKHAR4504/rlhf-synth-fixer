import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface MonitoringStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class MonitoringStack extends pulumi.ComponentResource {
  public readonly ecsLogGroupName: pulumi.Output<string>;

  constructor(
    name: string,
    args: MonitoringStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:monitoring:MonitoringStack', name, args, opts);

    // Create KMS key for CloudWatch Logs encryption
    const kmsKey = new aws.kms.Key(
      `payment-logs-kms-${args.environmentSuffix}`,
      {
        description: 'KMS key for CloudWatch Logs encryption',
        enableKeyRotation: true,
        policy: pulumi
          .all([
            pulumi.output(aws.getCallerIdentity()).accountId,
            pulumi.output(aws.getRegion()).name,
          ])
          .apply(([accountId, regionName]) =>
            JSON.stringify({
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
                  Sid: 'Allow CloudWatch Logs',
                  Effect: 'Allow',
                  Principal: {
                    Service: `logs.${regionName}.amazonaws.com`,
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
                      'kms:EncryptionContext:aws:logs:arn': `arn:aws:logs:${regionName}:${accountId}:*`,
                    },
                  },
                },
              ],
            })
          ),
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-logs-kms-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `payment-logs-kms-alias-${args.environmentSuffix}`,
      {
        name: `alias/payment-logs-${args.environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Create CloudWatch Log Group for ECS
    const ecsLogGroup = new aws.cloudwatch.LogGroup(
      `payment-ecs-logs-${args.environmentSuffix}`,
      {
        name: `/aws/ecs/payment-${args.environmentSuffix}`,
        retentionInDays: 7,
        kmsKeyId: kmsKey.arn,
        tags: pulumi.all([args.tags]).apply(([t]) => ({
          ...t,
          Name: `payment-ecs-logs-${args.environmentSuffix}`,
        })),
      },
      { parent: this }
    );

    this.ecsLogGroupName = ecsLogGroup.name;

    this.registerOutputs({
      ecsLogGroupName: this.ecsLogGroupName,
    });
  }
}
