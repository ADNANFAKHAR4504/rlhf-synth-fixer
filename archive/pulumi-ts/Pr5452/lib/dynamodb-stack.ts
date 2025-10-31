/**
 * dynamodb-stack.ts
 *
 * DynamoDB table for storing transaction records.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DynamoDBStackArgs {
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DynamoDBStack extends pulumi.ComponentResource {
  public readonly table: aws.dynamodb.Table;
  public readonly tableName: pulumi.Output<string>;

  constructor(
    name: string,
    args: DynamoDBStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:dynamodb:DynamoDBStack', name, args, opts);

    // Create DynamoDB table with on-demand billing
    this.table = new aws.dynamodb.Table(
      `transactions-table-${args.environmentSuffix}`,
      {
        name: `transactions-table-${args.environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        attributes: [
          {
            name: 'transactionId',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'N',
          },
        ],
        tags: args.tags,
      },
      { parent: this }
    );

    this.tableName = this.table.name;

    this.registerOutputs({
      tableName: this.tableName,
    });
  }
}
