import * as pulumi from '@pulumi/pulumi';
import * as aws from '@pulumi/aws';
import { EnvironmentConfig, TagsConfig } from '../types';

export interface DynamoDbComponentArgs {
  environmentSuffix: string;
  envConfig: EnvironmentConfig;
  tags: TagsConfig;
}

export class DynamoDbComponent extends pulumi.ComponentResource {
  public readonly table: aws.dynamodb.Table;
  public readonly tableName: pulumi.Output<string>;
  public readonly tableArn: pulumi.Output<string>;

  constructor(
    name: string,
    args: DynamoDbComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super('custom:dynamodb:DynamoDbComponent', name, {}, opts);

    const { environmentSuffix, tags } = args;

    // Create DynamoDB table for transaction logs with on-demand billing and PITR
    this.table = new aws.dynamodb.Table(
      `payment-transactions-${environmentSuffix}`,
      {
        name: `payment-transactions-${environmentSuffix}`,
        attributes: [
          { name: 'transactionId', type: 'S' },
          { name: 'timestamp', type: 'N' },
          { name: 'userId', type: 'S' },
          { name: 'status', type: 'S' },
        ],
        hashKey: 'transactionId',
        rangeKey: 'timestamp',
        billingMode: 'PAY_PER_REQUEST',
        pointInTimeRecovery: {
          enabled: true,
        },
        streamEnabled: true,
        streamViewType: 'NEW_AND_OLD_IMAGES',
        globalSecondaryIndexes: [
          {
            name: 'UserIdIndex',
            hashKey: 'userId',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
          },
          {
            name: 'StatusIndex',
            hashKey: 'status',
            rangeKey: 'timestamp',
            projectionType: 'ALL',
          },
        ],
        ttl: {
          enabled: true,
          attributeName: 'expirationTime',
        },
        serverSideEncryption: {
          enabled: true,
        },
        tags: {
          ...tags,
          Name: `payment-transactions-${environmentSuffix}`,
        },
      },
      { parent: this }
    );

    this.tableName = this.table.name;
    this.tableArn = this.table.arn;

    this.registerOutputs({
      tableName: this.tableName,
      tableArn: this.tableArn,
    });
  }
}
