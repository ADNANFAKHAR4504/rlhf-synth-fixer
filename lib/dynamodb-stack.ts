/**
 * dynamodb-stack.ts
 *
 * Defines DynamoDB Global Table for multi-region replication.
 */
import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';

export interface DynamoDBStackArgs {
  regions: string[];
  environmentSuffix?: string;
  tags?: pulumi.Input<{ [key: string]: string }>;
}

export class DynamoDBStack extends pulumi.ComponentResource {
  public readonly table: aws.dynamodb.Table;
  public readonly tableName: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DynamoDBStackArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:dynamodb:DynamoDBStack', name, args, opts);

    const envSuffix = args.environmentSuffix || 'dev';
    const tags = args.tags || {};

    // Create DynamoDB Global Table
    this.table = new aws.dynamodb.Table(
      `${name}-table`,
      {
        name: `${name}-dr-table-${envSuffix}-e7`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: 'id',
        rangeKey: 'timestamp',
        attributes: [
          {
            name: 'id',
            type: 'S',
          },
          {
            name: 'timestamp',
            type: 'N',
          },
        ],
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        pointInTimeRecovery: {
          enabled: true,
        },
        replicas: args.regions.slice(1).map(region => ({
          regionName: region,
          propagateTags: true,
        })),
        tags: {
          ...tags,
          Name: `${name}-dynamodb-table-${envSuffix}-e7`,
          Purpose: 'multi-region-dr',
        },
      },
      { parent: this }
    );

    this.tableName = this.table.name;
    this.tableArn = this.table.arn;

    this.registerOutputs({
      tableName: this.table.name,
      tableArn: this.table.arn,
    });
  }
}
