/**
 * DynamoDB table creation with on-demand billing and PITR
 */
import * as aws from '@pulumi/aws';
import * as pulumi from '@pulumi/pulumi';

export interface DynamoTableArgs {
  tableName: string;
  hashKey: string;
  rangeKey?: string;
  attributes: Array<{ name: string; type: string }>;
  environmentSuffix: string;
  tags: pulumi.Input<{ [key: string]: string }>;
}

export class DynamoMigration extends pulumi.ComponentResource {
  public readonly table: aws.dynamodb.Table;

  constructor(
    name: string,
    args: DynamoTableArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('tap:migration:DynamoMigration', name, {}, opts);

    this.table = new aws.dynamodb.Table(
      `${args.tableName}-${args.environmentSuffix}`,
      {
        name: `${args.tableName}-${args.environmentSuffix}`,
        billingMode: 'PAY_PER_REQUEST',
        hashKey: args.hashKey,
        rangeKey: args.rangeKey,
        attributes: args.attributes,
        pointInTimeRecovery: {
          enabled: true,
        },
        tags: args.tags,
      },
      { parent: this }
    );

    this.registerOutputs({
      tableName: this.table.name,
      tableArn: this.table.arn,
    });
  }
}
