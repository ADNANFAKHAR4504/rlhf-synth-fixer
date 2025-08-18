import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DynamoDBStackArgs {
  environmentSuffix: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class DynamoDBStack extends pulumi.ComponentResource {
  public readonly tableName: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DynamoDBStackArgs,
    opts?: pulumi.ResourceOptions
  ) {
    super('tap:dynamodb:DynamoDBStack', name, args, opts);

    // Create KMS key for DynamoDB encryption
    const kmsKey = new aws.kms.Key(
      `tap-dynamodb-kms-${args.environmentSuffix}`,
      {
        description: 'KMS key for DynamoDB encryption',
        tags: args.tags,
      },
      { parent: this }
    );

    new aws.kms.Alias(
      `tap-dynamodb-kms-alias-${args.environmentSuffix}`,
      {
        name: `alias/tap-dynamodb-${args.environmentSuffix}`,
        targetKeyId: kmsKey.keyId,
      },
      { parent: this }
    );

    // Create DynamoDB table with encryption
    const table = new aws.dynamodb.Table(
      `tap-table-${args.environmentSuffix}`,
      {
        name: `tap-serverless-${args.environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
        ],
        serverSideEncryption: {
          enabled: true,
          kmsKeyArn: kmsKey.arn,
        },
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: args.tags,
      },
      { parent: this }
    );

    this.tableName = table.name;
    this.tableArn = table.arn;

    this.registerOutputs({
      tableName: this.tableName,
      tableArn: this.tableArn,
    });
  }
}
